// ============================================================
// Achievements Engine — evaluates and awards achievements
// Safe to call multiple times (idempotent via unique constraint)
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { ACHIEVEMENTS } from "./achievements";

/**
 * Check all achievements for a customer and award any newly earned ones.
 * Returns the keys of newly awarded achievements.
 */
export async function checkAndAwardAchievements(
  customerId: string,
  businessId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  // 1. Fetch already-earned keys
  const { data: earned } = await supabase
    .from("customer_achievements")
    .select("achievement_key")
    .eq("customer_id", customerId);

  const earnedKeys = new Set((earned ?? []).map((e) => e.achievement_key));

  // 2. Fetch customer data needed for evaluation
  const [profileRes, referralsRes, reviewsRes, companyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, tier, total_points, created_at, company_id")
      .eq("id", customerId)
      .single(),
    supabase
      .from("referrals")
      .select("id, status, created_at")
      .eq("submitted_by", customerId)
      .eq("company_id", businessId)
      .order("created_at", { ascending: true }),
    supabase
      .from("reviews")
      .select("id")
      .eq("profile_id", customerId)
      .eq("company_id", businessId)
      .limit(1),
    supabase
      .from("businesses")
      .select("created_at")
      .eq("id", businessId)
      .single(),
  ]);

  const profile = profileRes.data;
  const referrals = referralsRes.data ?? [];
  const hasReview = (reviewsRes.data?.length ?? 0) > 0;
  const companyCreatedAt = companyRes.data?.created_at;

  if (!profile) return [];

  const allReferrals = referrals;
  const approvedReferrals = referrals.filter(
    (r) => r.status === "installation_complete"
  );
  const approvedCount = approvedReferrals.length;

  // 3. Evaluate each achievement
  const newlyEarned: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (earnedKeys.has(achievement.key)) continue;

    let qualified = false;

    switch (achievement.key) {
      // ── Referral milestones ──
      case "first_referral_submitted":
        qualified = allReferrals.length >= 1;
        break;
      case "first_referral_approved":
        qualified = approvedCount >= 1;
        break;
      case "three_approved":
        qualified = approvedCount >= 3;
        break;
      case "five_approved":
        qualified = approvedCount >= 5;
        break;
      case "ten_approved":
        qualified = approvedCount >= 10;
        break;
      case "twentyfive_approved":
        qualified = approvedCount >= 25;
        break;

      // ── Streaks ──
      case "streak_2_months":
        qualified = getConsecutiveMonthStreak(approvedReferrals) >= 2;
        break;
      case "streak_3_months":
        qualified = getConsecutiveMonthStreak(approvedReferrals) >= 3;
        break;
      case "streak_6_months":
        qualified = getConsecutiveMonthStreak(approvedReferrals) >= 6;
        break;

      // ── Engagement ──
      case "early_bird":
        if (companyCreatedAt && profile.created_at) {
          const compDate = new Date(companyCreatedAt);
          const custDate = new Date(profile.created_at);
          const diffDays =
            (custDate.getTime() - compDate.getTime()) / (1000 * 60 * 60 * 24);
          qualified = diffDays <= 30;
        }
        break;
      case "quick_start":
        if (allReferrals.length > 0 && profile.created_at) {
          const joinDate = new Date(profile.created_at);
          const firstRef = new Date(allReferrals[0].created_at);
          const diffDays =
            (firstRef.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
          qualified = diffDays <= 7;
        }
        break;
      case "left_review":
        qualified = hasReview;
        break;

      // ── Tiers ──
      case "reached_silver":
        qualified =
          profile.tier === "silver" ||
          profile.tier === "gold" ||
          profile.tier === "platinum";
        break;
      case "reached_gold":
        qualified =
          profile.tier === "gold" || profile.tier === "platinum";
        break;
      case "reached_platinum":
        qualified = profile.tier === "platinum";
        break;
    }

    if (qualified) {
      newlyEarned.push(achievement.key);
    }
  }

  // 4. Insert newly earned (ignore duplicates via onConflict)
  if (newlyEarned.length > 0) {
    await supabase.from("customer_achievements").upsert(
      newlyEarned.map((key) => ({
        customer_id: customerId,
        business_id: businessId,
        achievement_key: key,
      })),
      { onConflict: "customer_id,achievement_key", ignoreDuplicates: true }
    );

    // Create notifications for each new achievement
    const { ACHIEVEMENTS_MAP } = await import("./achievements");
    const notifications = newlyEarned.map((key) => {
      const def = ACHIEVEMENTS_MAP[key];
      return {
        user_id: customerId,
        type: "achievement" as const,
        title: `Achievement Unlocked: ${def?.name ?? key}`,
        body: def?.description ?? "You earned a new achievement!",
      };
    });

    await supabase.from("notifications").insert(notifications);
  }

  return newlyEarned;
}

/**
 * Calculate the longest consecutive month streak from approved referrals.
 * Groups by YYYY-MM, then finds the longest run of consecutive months.
 */
function getConsecutiveMonthStreak(
  approvedReferrals: { created_at: string }[]
): number {
  if (approvedReferrals.length === 0) return 0;

  // Collect unique months (YYYY-MM)
  const monthSet = new Set<string>();
  for (const r of approvedReferrals) {
    const d = new Date(r.created_at);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Sort months chronologically
  const months = Array.from(monthSet).sort();
  if (months.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < months.length; i++) {
    const [prevY, prevM] = months[i - 1].split("-").map(Number);
    const [curY, curM] = months[i].split("-").map(Number);

    // Check if consecutive: either same year + next month, or Dec→Jan
    const isConsecutive =
      (curY === prevY && curM === prevM + 1) ||
      (curY === prevY + 1 && prevM === 12 && curM === 1);

    if (isConsecutive) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
