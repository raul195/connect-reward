import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const { profile, admin } = ctx;

  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const section = req.nextUrl.searchParams.get("section");

  if (section === "health") {
    const { data, error: dbErr } = await admin
      .from("system_health_checks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  if (section === "emails") {
    const { data: logs, error: logsErr } = await admin
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (logsErr) {
      return NextResponse.json({ error: logsErr.message }, { status: 500 });
    }

    // 30-day aggregate counts
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: allRecent } = await admin
      .from("email_logs")
      .select("status")
      .gte("created_at", thirtyDaysAgo);

    const counts = { sent: 0, failed: 0, skipped: 0 };
    for (const row of allRecent ?? []) {
      const s = row.status as keyof typeof counts;
      if (s in counts) counts[s]++;
    }

    return NextResponse.json({ data: logs, counts });
  }

  return NextResponse.json(
    { error: "Invalid section. Use ?section=health or ?section=emails" },
    { status: 400 }
  );
}
