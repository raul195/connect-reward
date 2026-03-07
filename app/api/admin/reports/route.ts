import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

function getStartDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case "week":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case "90d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  }
}

export async function GET(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const startDate = getStartDate(range).toISOString();

    // Run all queries in parallel
    const [
      referralsRes,
      pointsDistRes,
      pointsRedeemedRes,
      activeCustomersRes,
    ] = await Promise.all([
      // All referrals in range
      admin
        .from("referrals")
        .select("id, status, created_at, submitted_by")
        .eq("company_id", cid)
        .gte("created_at", startDate),

      // Points distributed in range
      admin
        .from("point_transactions")
        .select("amount")
        .eq("company_id", cid)
        .eq("type", "referral_completed")
        .gte("created_at", startDate),

      // Points redeemed in range
      admin
        .from("point_transactions")
        .select("amount")
        .eq("company_id", cid)
        .eq("type", "redemption")
        .gte("created_at", startDate),

      // Active customers (those with referrals in range)
      admin
        .from("referrals")
        .select("submitted_by")
        .eq("company_id", cid)
        .gte("created_at", startDate),
    ]);

    const referrals = referralsRes.data ?? [];
    const totalRef = referrals.length;
    const completed = referrals.filter(
      (r) => r.status === "installation_complete"
    ).length;
    const rate = totalRef > 0 ? Math.round((completed / totalRef) * 100) : 0;
    const ptsDist = (pointsDistRes.data ?? []).reduce(
      (sum: number, tx: { amount: number }) => sum + tx.amount,
      0
    );
    const ptsRedeemed = (pointsRedeemedRes.data ?? []).reduce(
      (sum: number, tx: { amount: number }) => sum + Math.abs(tx.amount),
      0
    );
    const activeCust = new Set(
      (activeCustomersRes.data ?? []).map((r: { submitted_by: string }) => r.submitted_by)
    ).size;

    const metrics = { totalRef, completed, rate, ptsDist, ptsRedeemed, activeCust };

    // Funnel data: count per status
    const funnelMap: Record<string, number> = {};
    for (const r of referrals) {
      funnelMap[r.status] = (funnelMap[r.status] || 0) + 1;
    }
    const funnel = Object.entries(funnelMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Referrals over time (group by date key m/d)
    const overTimeMap: Record<string, number> = {};
    for (const r of referrals) {
      const d = new Date(r.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      overTimeMap[key] = (overTimeMap[key] || 0) + 1;
    }
    const refOverTime = Object.entries(overTimeMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Top referrers (group by submitted_by, get profile names)
    const referrerCountMap: Record<string, number> = {};
    for (const r of referrals) {
      referrerCountMap[r.submitted_by] = (referrerCountMap[r.submitted_by] || 0) + 1;
    }
    const topReferrerIds = Object.entries(referrerCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let topReferrers: { name: string; count: number }[] = [];
    if (topReferrerIds.length > 0) {
      const { data: referrerProfiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in(
          "id",
          topReferrerIds.map(([id]) => id)
        );

      const nameMap: Record<string, string> = {};
      for (const p of referrerProfiles ?? []) {
        nameMap[p.id] = p.full_name;
      }

      topReferrers = topReferrerIds.map(([id, count]) => ({
        name: nameMap[id] ?? "Unknown",
        count,
      }));
    }

    // Top rewards (group redemptions by reward_id)
    const { data: redemptions } = await admin
      .from("redemptions")
      .select("reward_id")
      .eq("company_id", cid)
      .gte("created_at", startDate);

    const rewardCountMap: Record<string, number> = {};
    for (const r of redemptions ?? []) {
      rewardCountMap[r.reward_id] = (rewardCountMap[r.reward_id] || 0) + 1;
    }
    const topRewardIds = Object.entries(rewardCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let topRewards: { name: string; count: number }[] = [];
    if (topRewardIds.length > 0) {
      const { data: rewardRows } = await admin
        .from("rewards")
        .select("id, name")
        .in(
          "id",
          topRewardIds.map(([id]) => id)
        );

      const rewardNameMap: Record<string, string> = {};
      for (const r of rewardRows ?? []) {
        rewardNameMap[r.id] = r.name;
      }

      topRewards = topRewardIds.map(([id, count]) => ({
        name: rewardNameMap[id] ?? "Unknown",
        count,
      }));
    }

    return NextResponse.json({
      metrics,
      refOverTime,
      funnel,
      topReferrers,
      topRewards,
      activeCustomers: activeCust,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
