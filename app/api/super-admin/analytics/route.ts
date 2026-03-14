import { NextResponse } from "next/server";
import { getAuthContext, requireSuperAdmin } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  // Run all queries in parallel
  const [
    companiesRes,
    customersRes,
    referralsRes,
    approvedReferralsRes,
    pointsRes,
    redemptionsRes,
    servicesRes,
    recentReferralsRes,
    recentRedemptionsRes,
    recentCompaniesRes,
  ] = await Promise.all([
    // All companies with details
    admin
      .from("companies")
      .select("id, name, industry, plan_tier, created_at, updated_at, last_active")
      .order("created_at", { ascending: false }),

    // Total customers
    admin
      .from("profiles")
      .select("id, company_id, total_points, referral_count, created_at", { count: "exact" })
      .eq("role", "customer"),

    // Total referrals
    admin
      .from("referrals")
      .select("id", { count: "exact", head: true }),

    // Approved referrals
    admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("status", "installation_complete"),

    // Total points awarded (sum of positive transactions)
    admin
      .from("point_transactions")
      .select("amount")
      .gt("amount", 0),

    // Total redemptions
    admin
      .from("redemptions")
      .select("id", { count: "exact", head: true }),

    // All services
    admin
      .from("services")
      .select("id, company_id, name, industry, job_value, margin_percentage, referral_percentage, points_value"),

    // Recent approved referrals (for activity feed)
    admin
      .from("referrals")
      .select("id, company_id, status, points_awarded, created_at, updated_at, companies(name)")
      .eq("status", "installation_complete")
      .order("updated_at", { ascending: false })
      .limit(10),

    // Recent redemptions (for activity feed)
    admin
      .from("redemptions")
      .select("id, company_id, created_at, rewards(name), companies(name)")
      .order("created_at", { ascending: false })
      .limit(10),

    // Recent companies joined
    admin
      .from("companies")
      .select("id, name, industry, plan_tier, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const companies = companiesRes.data ?? [];
  const customers = customersRes.data ?? [];
  const totalReferrals = referralsRes.count ?? 0;
  const approvedReferrals = approvedReferralsRes.count ?? 0;
  const totalRedemptions = redemptionsRes.count ?? 0;

  // Calculate total points
  const totalPoints = (pointsRes.data ?? []).reduce(
    (sum: number, t: { amount: number }) => sum + t.amount,
    0
  );

  // Get per-company stats
  const companyReferralCounts = new Map<string, { submitted: number; approved: number; points: number }>();
  const companyCustomerCounts = new Map<string, number>();
  const companyRedemptionCounts = new Map<string, number>();

  // Fetch referral counts per company
  const { data: refsByCompany } = await admin
    .from("referrals")
    .select("company_id, status, points_awarded");

  for (const ref of refsByCompany ?? []) {
    const cid = ref.company_id;
    if (!companyReferralCounts.has(cid)) {
      companyReferralCounts.set(cid, { submitted: 0, approved: 0, points: 0 });
    }
    const entry = companyReferralCounts.get(cid)!;
    entry.submitted++;
    if (ref.status === "installation_complete") {
      entry.approved++;
      entry.points += ref.points_awarded || 0;
    }
  }

  // Customer counts per company
  for (const c of customers) {
    if (c.company_id) {
      companyCustomerCounts.set(
        c.company_id,
        (companyCustomerCounts.get(c.company_id) ?? 0) + 1
      );
    }
  }

  // Redemption counts per company
  const { data: redemptionsByCompany } = await admin
    .from("redemptions")
    .select("company_id");
  for (const r of redemptionsByCompany ?? []) {
    companyRedemptionCounts.set(
      r.company_id,
      (companyRedemptionCounts.get(r.company_id) ?? 0) + 1
    );
  }

  // Build businesses table
  const businessesTable = companies.map((c) => {
    const refs = companyReferralCounts.get(c.id) ?? { submitted: 0, approved: 0, points: 0 };
    const custCount = companyCustomerCounts.get(c.id) ?? 0;
    const redemptions = companyRedemptionCounts.get(c.id) ?? 0;
    return {
      id: c.id,
      name: c.name,
      industry: c.industry ?? "—",
      plan_tier: c.plan_tier,
      customers: custCount,
      referrals_submitted: refs.submitted,
      referrals_approved: refs.approved,
      approval_rate: refs.submitted > 0 ? Math.round((refs.approved / refs.submitted) * 100) : 0,
      points_awarded: refs.points,
      redemptions,
      date_joined: c.created_at,
      last_active: c.last_active || c.updated_at,
    };
  });

  // Industry breakdown
  const industryMap = new Map<string, {
    count: number;
    totalApproved: number;
    totalSubmitted: number;
    totalPoints: number;
    totalJobValue: number;
    jobValueCount: number;
  }>();

  for (const biz of businessesTable) {
    const ind = biz.industry || "Unknown";
    if (!industryMap.has(ind)) {
      industryMap.set(ind, { count: 0, totalApproved: 0, totalSubmitted: 0, totalPoints: 0, totalJobValue: 0, jobValueCount: 0 });
    }
    const entry = industryMap.get(ind)!;
    entry.count++;
    entry.totalApproved += biz.referrals_approved;
    entry.totalSubmitted += biz.referrals_submitted;
    entry.totalPoints += biz.points_awarded;
  }

  // Add job values from services
  const allServices = servicesRes.data ?? [];
  for (const svc of allServices) {
    const { data: company } = await admin
      .from("companies")
      .select("industry")
      .eq("id", svc.company_id)
      .single();
    const ind = svc.industry || company?.industry || "Unknown";
    if (!industryMap.has(ind)) {
      industryMap.set(ind, { count: 0, totalApproved: 0, totalSubmitted: 0, totalPoints: 0, totalJobValue: 0, jobValueCount: 0 });
    }
    const entry = industryMap.get(ind)!;
    if (svc.job_value) {
      entry.totalJobValue += Number(svc.job_value);
      entry.jobValueCount++;
    }
  }

  const industryBreakdown = Array.from(industryMap.entries()).map(([industry, data]) => ({
    industry,
    businesses: data.count,
    avg_approval_rate: data.totalSubmitted > 0
      ? Math.round((data.totalApproved / data.totalSubmitted) * 100)
      : 0,
    avg_points_per_referral: data.totalApproved > 0
      ? Math.round(data.totalPoints / data.totalApproved)
      : 0,
    avg_job_value: data.jobValueCount > 0
      ? Math.round(data.totalJobValue / data.jobValueCount)
      : 0,
  }));

  // Services breakdown - aggregate by service name
  const serviceNameMap = new Map<string, {
    count: number;
    totalJobValue: number;
    totalMargin: number;
    marginCount: number;
    totalPoints: number;
    industry: string;
  }>();

  for (const svc of allServices) {
    const key = svc.name;
    if (!serviceNameMap.has(key)) {
      serviceNameMap.set(key, {
        count: 0,
        totalJobValue: 0,
        totalMargin: 0,
        marginCount: 0,
        totalPoints: 0,
        industry: svc.industry || "Unknown",
      });
    }
    const entry = serviceNameMap.get(key)!;
    entry.count++;
    if (svc.job_value) entry.totalJobValue += Number(svc.job_value);
    if (svc.margin_percentage) {
      entry.totalMargin += Number(svc.margin_percentage);
      entry.marginCount++;
    }
    entry.totalPoints += svc.points_value || 0;
  }

  const servicesBreakdown = Array.from(serviceNameMap.entries())
    .map(([name, data]) => ({
      name,
      industry: data.industry,
      count: data.count,
      avg_job_value: data.count > 0 ? Math.round(data.totalJobValue / data.count) : 0,
      avg_margin: data.marginCount > 0 ? Math.round(data.totalMargin / data.marginCount) : 0,
      avg_points: data.count > 0 ? Math.round(data.totalPoints / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // Build activity feed
  type ActivityItem = { type: string; business: string; detail: string; timestamp: string };
  const activity: ActivityItem[] = [];

  for (const c of recentCompaniesRes.data ?? []) {
    activity.push({
      type: "new_business",
      business: c.name,
      detail: `${c.industry || "Unknown"} — ${c.plan_tier}`,
      timestamp: c.created_at,
    });
  }

  for (const r of recentReferralsRes.data ?? []) {
    const companyName = (r as unknown as { companies: { name: string } | null }).companies?.name ?? "Unknown";
    activity.push({
      type: "referral_approved",
      business: companyName,
      detail: `${r.points_awarded?.toLocaleString() || 0} pts awarded`,
      timestamp: r.updated_at,
    });
  }

  for (const r of recentRedemptionsRes.data ?? []) {
    const companyName = (r as unknown as { companies: { name: string } | null }).companies?.name ?? "Unknown";
    const rewardName = (r as unknown as { rewards: { name: string } | null }).rewards?.name ?? "Reward";
    activity.push({
      type: "reward_redeemed",
      business: companyName,
      detail: rewardName,
      timestamp: r.created_at,
    });
  }

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Plan breakdown
  const freePlanCount = companies.filter((c) => c.plan_tier === "free").length;
  const starterPlanCount = companies.length - freePlanCount;

  return NextResponse.json({
    overview: {
      totalBusinesses: companies.length,
      freePlanCount,
      starterPlanCount,
      totalCustomers: customersRes.count ?? 0,
      totalReferrals,
      approvedReferrals,
      approvalRate: totalReferrals > 0 ? Math.round((approvedReferrals / totalReferrals) * 100) : 0,
      totalPoints,
      totalRedemptions,
    },
    businesses: businessesTable,
    industryBreakdown,
    servicesBreakdown,
    activity: activity.slice(0, 20),
  });
}
