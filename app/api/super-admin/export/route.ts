import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireSuperAdmin } from "@/lib/api-helpers";

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireSuperAdmin(profile);
  if (forbidden) return forbidden;

  const dataset = request.nextUrl.searchParams.get("dataset");
  const today = new Date().toISOString().split("T")[0];

  if (dataset === "businesses") {
    const { data: companies } = await admin
      .from("companies")
      .select("id, name, industry, plan_tier, created_at, updated_at, last_active")
      .order("created_at", { ascending: false });

    const { data: referrals } = await admin
      .from("referrals")
      .select("company_id, status, points_awarded");

    const { data: customers } = await admin
      .from("profiles")
      .select("company_id")
      .eq("role", "customer");

    const { data: redemptions } = await admin
      .from("redemptions")
      .select("company_id");

    const { data: services } = await admin
      .from("services")
      .select("company_id, job_value");

    // Build maps
    const refMap = new Map<string, { submitted: number; approved: number; points: number }>();
    for (const r of referrals ?? []) {
      if (!refMap.has(r.company_id)) refMap.set(r.company_id, { submitted: 0, approved: 0, points: 0 });
      const e = refMap.get(r.company_id)!;
      e.submitted++;
      if (r.status === "installation_complete") { e.approved++; e.points += r.points_awarded || 0; }
    }

    const custMap = new Map<string, number>();
    for (const c of customers ?? []) {
      if (c.company_id) custMap.set(c.company_id, (custMap.get(c.company_id) ?? 0) + 1);
    }

    const redMap = new Map<string, number>();
    for (const r of redemptions ?? []) {
      redMap.set(r.company_id, (redMap.get(r.company_id) ?? 0) + 1);
    }

    const svcMap = new Map<string, { total: number; count: number }>();
    for (const s of services ?? []) {
      if (!svcMap.has(s.company_id)) svcMap.set(s.company_id, { total: 0, count: 0 });
      const e = svcMap.get(s.company_id)!;
      if (s.job_value) { e.total += Number(s.job_value); e.count++; }
    }

    const headers = [
      "business_name", "industry", "plan_tier", "customer_count",
      "referrals_submitted", "referrals_approved", "approval_rate",
      "points_awarded", "redemptions", "avg_job_value",
      "date_joined", "last_active_date",
    ];

    const rows = (companies ?? []).map((c) => {
      const refs = refMap.get(c.id) ?? { submitted: 0, approved: 0, points: 0 };
      const svcs = svcMap.get(c.id);
      return {
        business_name: c.name,
        industry: c.industry ?? "",
        plan_tier: c.plan_tier,
        customer_count: custMap.get(c.id) ?? 0,
        referrals_submitted: refs.submitted,
        referrals_approved: refs.approved,
        approval_rate: refs.submitted > 0 ? `${Math.round((refs.approved / refs.submitted) * 100)}%` : "0%",
        points_awarded: refs.points,
        redemptions: redMap.get(c.id) ?? 0,
        avg_job_value: svcs && svcs.count > 0 ? Math.round(svcs.total / svcs.count) : 0,
        date_joined: c.created_at?.split("T")[0] ?? "",
        last_active_date: (c.last_active || c.updated_at)?.split("T")[0] ?? "",
      };
    });

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="businesses_${today}.csv"`,
      },
    });
  }

  if (dataset === "services") {
    const { data: services } = await admin
      .from("services")
      .select("name, industry, job_value, margin_percentage, referral_percentage, points_value, company_id, companies(name)")
      .order("company_id");

    const headers = [
      "business_name", "industry", "service_name", "job_value",
      "margin_percentage", "referral_point_value", "referral_dollar_value",
    ];

    const rows = (services ?? []).map((s) => {
      const companyName = (s as unknown as { companies: { name: string } | null }).companies?.name ?? "";
      const dollarValue = s.job_value && s.margin_percentage && s.referral_percentage
        ? Math.round(Number(s.job_value) * (Number(s.margin_percentage) / 100) * (Number(s.referral_percentage) / 100))
        : Math.round((s.points_value || 0) / 100);
      return {
        business_name: companyName,
        industry: s.industry ?? "",
        service_name: s.name,
        job_value: s.job_value ?? 0,
        margin_percentage: s.margin_percentage ?? "",
        referral_point_value: s.points_value ?? 0,
        referral_dollar_value: dollarValue,
      };
    });

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="services_${today}.csv"`,
      },
    });
  }

  if (dataset === "referrals") {
    const { data: referrals } = await admin
      .from("referrals")
      .select("company_id, status, points_awarded, created_at, updated_at, service_id, companies(name, industry), services(name)")
      .order("created_at", { ascending: false });

    const headers = [
      "business_name", "industry", "date_submitted", "date_approved",
      "status", "points_awarded", "service_type",
    ];

    const rows = (referrals ?? []).map((r) => {
      const company = (r as unknown as { companies: { name: string; industry: string } | null }).companies;
      const service = (r as unknown as { services: { name: string } | null }).services;
      return {
        business_name: company?.name ?? "",
        industry: company?.industry ?? "",
        date_submitted: r.created_at?.split("T")[0] ?? "",
        date_approved: r.status === "installation_complete" ? (r.updated_at?.split("T")[0] ?? "") : "",
        status: r.status,
        points_awarded: r.points_awarded ?? 0,
        service_type: service?.name ?? "",
      };
    });

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="referrals_${today}.csv"`,
      },
    });
  }

  if (dataset === "customers") {
    const { data: profiles } = await admin
      .from("profiles")
      .select("company_id, total_points, referral_count, created_at, companies(name, industry)")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    // Get redemption counts per profile
    const { data: redemptions } = await admin
      .from("redemptions")
      .select("profile_id");
    const redMap = new Map<string, number>();
    for (const r of redemptions ?? []) {
      redMap.set(r.profile_id, (redMap.get(r.profile_id) ?? 0) + 1);
    }

    // Get email opt-out status
    const { data: prefs } = await admin
      .from("email_preferences")
      .select("customer_id, opt_out");
    const optOutMap = new Map<string, boolean>();
    for (const p of prefs ?? []) {
      optOutMap.set(p.customer_id, p.opt_out);
    }

    const headers = [
      "business_name", "industry", "date_joined", "total_points_earned",
      "total_referrals_submitted", "total_redemptions", "email_status",
    ];

    const rows = (profiles ?? []).map((p) => {
      const company = (p as unknown as { companies: { name: string; industry: string } | null }).companies;
      return {
        business_name: company?.name ?? "",
        industry: company?.industry ?? "",
        date_joined: p.created_at?.split("T")[0] ?? "",
        total_points_earned: p.total_points ?? 0,
        total_referrals_submitted: p.referral_count ?? 0,
        total_redemptions: 0, // Anonymized, no profile ID exposed
        email_status: optOutMap.get("") ? "unsubscribed" : "subscribed",
      };
    });

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="customers_${today}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid dataset. Use: businesses, services, referrals, customers" }, { status: 400 });
}
