import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const template = searchParams.get("template") ?? "";
    const range = searchParams.get("range") ?? "30";
    const page = parseInt(searchParams.get("page") ?? "0", 10);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Compute date filter once
    let sinceISO: string | null = null;
    if (range !== "all") {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(range, 10));
      sinceISO = since.toISOString();
    }

    // Build filtered log query with profile join
    let query = admin
      .from("email_logs")
      .select(
        "id, template_name, recipient_email, status, metadata, created_at, customer_id, profiles!email_logs_customer_id_fkey(full_name)",
        { count: "exact" }
      )
      .eq("company_id", cid);

    if (sinceISO) query = query.gte("created_at", sinceISO);
    if (status) query = query.eq("status", status);
    if (template) query = query.eq("template_name", template);
    if (search) query = query.ilike("recipient_email", `%${search}%`);

    query = query.order("created_at", { ascending: false }).range(from, to);

    // Helper to build a count query with range filter
    function countByStatus(s?: string) {
      let q = admin
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", cid);
      if (sinceISO) q = q.gte("created_at", sinceISO);
      if (s) q = q.eq("status", s);
      return q;
    }

    // Fetch customer IDs for this company (for DNC count)
    const customerIdsPromise = admin
      .from("profiles")
      .select("id")
      .eq("company_id", cid)
      .eq("role", "customer");

    // Run all queries in parallel
    const [
      logsResult,
      totalRes,
      sentRes,
      failedRes,
      skippedRes,
      recentBouncesRes,
      customerIdsRes,
    ] = await Promise.all([
      query,
      countByStatus(),
      countByStatus("sent"),
      countByStatus("failed"),
      countByStatus("skipped"),
      admin
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", cid)
        .eq("status", "failed")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      customerIdsPromise,
    ]);

    // DNC count (needs customer IDs first)
    const customerIds =
      customerIdsRes.data?.map((p: { id: string }) => p.id) ?? [];
    let dncCount = 0;
    if (customerIds.length > 0) {
      const { count: dnc } = await admin
        .from("email_preferences")
        .select("id", { count: "exact", head: true })
        .eq("opt_out", true)
        .in("customer_id", customerIds);
      dncCount = dnc ?? 0;
    }

    const summary = {
      total: totalRes.count ?? 0,
      delivered: sentRes.count ?? 0,
      failed: failedRes.count ?? 0,
      skipped: skippedRes.count ?? 0,
      dncCount,
      recentBounces: recentBouncesRes.count ?? 0,
    };

    return NextResponse.json({
      logs: logsResult.data ?? [],
      total: logsResult.count ?? 0,
      summary,
    });
  } catch (error) {
    console.error("Email activity GET error:", error);
    return NextResponse.json(
      { error: "Failed to load email activity" },
      { status: 500 }
    );
  }
}
