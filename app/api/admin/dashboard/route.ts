import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    // Start of this month and last month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // Run all queries in parallel
    const [
      customerCountRes,
      referralsThisMonthRes,
      referralsLastMonthRes,
      pointsThisMonthRes,
      totalReferralsRes,
      completedReferralsRes,
      pipelineRes,
      recentActivityRes,
    ] = await Promise.all([
      // Count customer profiles
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid)
        .eq("role", "customer"),

      // Count referrals this month
      admin
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid)
        .gte("created_at", startOfMonth),

      // Count referrals last month
      admin
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid)
        .gte("created_at", startOfLastMonth)
        .lt("created_at", startOfMonth),

      // Sum points distributed this month (referral_completed)
      admin
        .from("point_transactions")
        .select("amount")
        .eq("company_id", cid)
        .eq("type", "referral_completed")
        .gte("created_at", startOfMonth),

      // Total referrals
      admin
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid),

      // Completed referrals
      admin
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid)
        .eq("status", "installation_complete"),

      // Pipeline by status
      admin
        .from("referrals")
        .select("status")
        .eq("company_id", cid),

      // Recent activity (last 20 point transactions with profile names)
      admin
        .from("point_transactions")
        .select("*, profiles(full_name)")
        .eq("company_id", cid)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    // Log any individual query errors
    const queryResults = [
      { name: "customerCount", res: customerCountRes },
      { name: "referralsThisMonth", res: referralsThisMonthRes },
      { name: "referralsLastMonth", res: referralsLastMonthRes },
      { name: "pointsThisMonth", res: pointsThisMonthRes },
      { name: "totalReferrals", res: totalReferralsRes },
      { name: "completedReferrals", res: completedReferralsRes },
      { name: "pipeline", res: pipelineRes },
      { name: "recentActivity", res: recentActivityRes },
    ];
    for (const q of queryResults) {
      if (q.res.error) {
        console.error(`Dashboard query [${q.name}] failed:`, q.res.error.message);
      }
    }

    // Sum points this month (with null safety)
    const pointsThisMonth = (pointsThisMonthRes.data ?? []).reduce(
      (sum: number, tx: { amount: number }) => sum + (tx.amount ?? 0),
      0
    );

    // Build pipeline counts
    const statusCounts: Record<string, number> = {
      submitted: 0,
      contacted: 0,
      consultation_scheduled: 0,
      installation_complete: 0,
      cancelled: 0,
    };
    for (const row of pipelineRes.data ?? []) {
      if (row.status in statusCounts) {
        statusCounts[row.status]++;
      }
    }

    const metrics = {
      activeCustomers: customerCountRes.count ?? 0,
      referralsThisMonth: referralsThisMonthRes.count ?? 0,
      referralsLastMonth: referralsLastMonthRes.count ?? 0,
      pointsDistributed: pointsThisMonth,
      totalReferrals: totalReferralsRes.count ?? 0,
      completedReferrals: completedReferralsRes.count ?? 0,
    };

    const pipeline = statusCounts;

    const activity = (recentActivityRes.data ?? []).map((tx: Record<string, unknown>) => {
      const name = (tx.profiles as { full_name: string } | null)?.full_name ?? "Customer";
      const desc = (tx.description as string) || (tx.type as string);
      const created = tx.created_at as string;
      const ago = timeAgo(created);
      return { id: tx.id as string, text: `${name}: ${desc}`, time: ago };
    });

    return NextResponse.json({ metrics, pipeline, activity });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
