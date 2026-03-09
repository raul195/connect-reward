import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { getActivePromotion } from "@/lib/promotions";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  // Active services for the company
  const { data: services } = profile.company_id
    ? await admin
        .from("services")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
    : { data: [] };

  // Last 10 point transactions for the user
  const { data: transactions } = await admin
    .from("point_transactions")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Total referrals
  const { count: totalReferrals } = await admin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", profile.id);

  // Completed referrals (installs)
  const { count: completedInstalls } = await admin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", profile.id)
    .eq("status", "installation_complete");

  // Points earned this month (referral_completed transactions)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: monthTx } = await admin
    .from("point_transactions")
    .select("amount")
    .eq("user_id", profile.id)
    .eq("type", "referral_completed")
    .gte("created_at", startOfMonth);

  const pointsThisMonth = (monthTx ?? []).reduce(
    (sum: number, t: { amount: number }) => sum + t.amount,
    0
  );

  // Redemptions count
  const { count: rewardsRedeemed } = await admin
    .from("redemptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id);

  // Active promotion for this company
  const activePromotion = profile.company_id
    ? await getActivePromotion(profile.company_id, admin)
    : null;

  return NextResponse.json({
    profile,
    services: services ?? [],
    transactions: transactions ?? [],
    stats: {
      totalReferrals: totalReferrals ?? 0,
      completedInstalls: completedInstalls ?? 0,
      pointsThisMonth,
      rewardsRedeemed: rewardsRedeemed ?? 0,
    },
    activePromotion,
  });
}
