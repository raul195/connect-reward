import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { user, profile, admin } = result.ctx;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all";

  interface LeaderboardEntry {
    id: string;
    full_name: string;
    total_points: number;
    tier: string;
    referral_count: number;
  }

  let entries: LeaderboardEntry[] = [];

  if (period === "all") {
    // Top 20 profiles by total_points in the same company
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, total_points, tier")
      .eq("company_id", profile.company_id!)
      .eq("role", "customer")
      .order("total_points", { ascending: false })
      .limit(20);

    // For each profile, count their referrals
    entries = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const { count } = await admin
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("submitted_by", p.id)
          .eq("company_id", profile.company_id!);

        return {
          id: p.id,
          full_name: p.full_name ?? "Unknown",
          total_points: p.total_points ?? 0,
          tier: p.tier ?? "bronze",
          referral_count: count ?? 0,
        };
      })
    );
  } else {
    // "month" or "week" period
    const now = new Date();
    let periodStart: Date;

    if (period === "week") {
      const day = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - day);
      periodStart.setHours(0, 0, 0, 0);
    } else {
      // month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Sum point_transactions (referral_completed) since period start, grouped by profile
    const { data: txData } = await admin
      .from("point_transactions")
      .select("user_id, amount")
      .eq("company_id", profile.company_id!)
      .eq("type", "referral_completed")
      .gte("created_at", periodStart.toISOString());

    // Aggregate points by profile
    const pointsByProfile: Record<string, number> = {};
    for (const tx of txData ?? []) {
      pointsByProfile[tx.user_id] =
        (pointsByProfile[tx.user_id] ?? 0) + (tx.amount ?? 0);
    }

    // Sort by points descending, take top 20
    const sortedIds = Object.entries(pointsByProfile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    if (sortedIds.length > 0) {
      const profileIds = sortedIds.map(([id]) => id);

      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, total_points, tier")
        .in("id", profileIds);

      const profileMap: Record<string, (typeof profiles extends (infer T)[] | null ? T : never)> = {};
      for (const p of profiles ?? []) {
        profileMap[p.id] = p;
      }

      entries = await Promise.all(
        sortedIds.map(async ([id, periodPoints]) => {
          const p = profileMap[id];

          const { count } = await admin
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("submitted_by", id)
            .eq("company_id", profile.company_id!);

          return {
            id,
            full_name: p?.full_name ?? "Unknown",
            total_points: periodPoints,
            tier: p?.tier ?? "bronze",
            referral_count: count ?? 0,
          };
        })
      );
    }
  }

  return NextResponse.json({
    entries,
    currentUserId: user.id,
  });
}
