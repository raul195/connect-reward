import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/plan-limits";

interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export async function POST() {
  // Auth: must be super_admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const integrityChecks: CheckResult[] = [];

  // 1. No orphaned referrals (all submitted_by exist in profiles)
  const { data: allReferrals } = await admin
    .from("referrals")
    .select("id, submitted_by");
  const { data: allProfiles } = await admin.from("profiles").select("id");
  const profileIds = new Set((allProfiles ?? []).map((p) => p.id));
  const orphaned = (allReferrals ?? []).filter(
    (r) => !profileIds.has(r.submitted_by)
  );
  integrityChecks.push({
    id: "orphaned-referrals",
    label: "No orphaned referrals",
    passed: orphaned.length === 0,
    detail:
      orphaned.length === 0
        ? "All submitted_by ids have matching profiles"
        : `${orphaned.length} orphaned referral(s) found`,
  });

  // 2. No negative point balances
  const { data: negativeBalances } = await admin
    .from("profiles")
    .select("id, email, total_points")
    .lt("total_points", 0);
  integrityChecks.push({
    id: "negative-balances",
    label: "No negative point balances",
    passed: (negativeBalances ?? []).length === 0,
    detail:
      (negativeBalances ?? []).length === 0
        ? "All profiles have non-negative points"
        : `${negativeBalances!.length} profile(s) with negative balances`,
  });

  // 3. Point totals match transaction sums
  const { data: profilesWithPoints } = await admin
    .from("profiles")
    .select("id, total_points")
    .gt("total_points", 0);

  let mismatchCount = 0;
  for (const p of profilesWithPoints ?? []) {
    const { data: txns } = await admin
      .from("point_transactions")
      .select("amount")
      .eq("user_id", p.id);
    const txnSum = (txns ?? []).reduce((sum, t) => sum + t.amount, 0);
    if (p.total_points !== txnSum) mismatchCount++;
  }
  integrityChecks.push({
    id: "point-totals-match",
    label: "Point totals match transaction sums",
    passed: mismatchCount === 0,
    detail:
      mismatchCount === 0
        ? "All profile totals match their transaction sums"
        : `${mismatchCount} profile(s) have mismatched totals`,
  });

  // 4. No orphaned redemptions
  const { data: allRedemptions } = await admin
    .from("redemptions")
    .select("id, reward_id");
  const { data: allRewards } = await admin.from("rewards").select("id");
  const rewardIds = new Set((allRewards ?? []).map((r) => r.id));
  const orphanedRedemptions = (allRedemptions ?? []).filter(
    (r) => !rewardIds.has(r.reward_id)
  );
  integrityChecks.push({
    id: "orphaned-redemptions",
    label: "No orphaned redemptions",
    passed: orphanedRedemptions.length === 0,
    detail:
      orphanedRedemptions.length === 0
        ? "All redemption reward_ids exist in rewards"
        : `${orphanedRedemptions.length} orphaned redemption(s) found`,
  });

  // 5. Completed referrals have points_awarded > 0
  const { data: completedReferrals } = await admin
    .from("referrals")
    .select("id, points_awarded")
    .eq("status", "installation_complete");
  const completedNoPoints = (completedReferrals ?? []).filter(
    (r) => !r.points_awarded || r.points_awarded <= 0
  );
  integrityChecks.push({
    id: "completed-referrals-points",
    label: "Completed referrals have points awarded",
    passed: completedNoPoints.length === 0,
    detail:
      completedNoPoints.length === 0
        ? "All completed referrals have points_awarded > 0"
        : `${completedNoPoints.length} completed referral(s) missing points`,
  });

  // 6. Free plan companies within customer limits
  const { data: allCompanies } = await admin
    .from("businesses")
    .select("id, name, plan_tier");
  const freeLimit = PLAN_LIMITS.free.maxCustomers;
  let overLimitCount = 0;
  for (const co of (allCompanies ?? []).filter((c) => c.plan_tier === "free")) {
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", co.id)
      .eq("role", "customer");
    if ((count ?? 0) > freeLimit) overLimitCount++;
  }
  integrityChecks.push({
    id: "plan-limits",
    label: "Free plan companies within customer limits",
    passed: overLimitCount === 0,
    detail:
      overLimitCount === 0
        ? `All free-plan companies are within the ${freeLimit}-customer limit`
        : `${overLimitCount} free-plan company(ies) exceed customer limit`,
  });

  // 7. Leaderboard consistency — top profile's total_points matches txn sum
  const { data: topProfile } = await admin
    .from("profiles")
    .select("id, total_points")
    .order("total_points", { ascending: false })
    .limit(1)
    .single();

  let leaderboardPassed = true;
  let leaderboardDetail = "No profiles with points";
  if (topProfile && topProfile.total_points > 0) {
    const { data: txns } = await admin
      .from("point_transactions")
      .select("amount")
      .eq("user_id", topProfile.id);
    const txnSum = (txns ?? []).reduce((sum, t) => sum + t.amount, 0);
    leaderboardPassed = topProfile.total_points === txnSum;
    leaderboardDetail = leaderboardPassed
      ? `Top profile (${topProfile.total_points} pts) matches transaction sum`
      : `Top profile shows ${topProfile.total_points} pts but transactions sum to ${txnSum}`;
  }
  integrityChecks.push({
    id: "leaderboard-consistency",
    label: "Leaderboard consistency",
    passed: leaderboardPassed,
    detail: leaderboardDetail,
  });

  return NextResponse.json({ integrityChecks });
}
