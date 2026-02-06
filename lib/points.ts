import type { LoyaltyTier } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 1000,
  gold: 3000,
  platinum: 7500,
};

export function calculateTierFromPoints(points: number): LoyaltyTier {
  if (points >= 7500) return "platinum";
  if (points >= 3000) return "gold";
  if (points >= 1000) return "silver";
  return "bronze";
}

export function getPointsToNextTier(
  points: number
): { nextTier: LoyaltyTier; pointsNeeded: number } | null {
  if (points >= 7500) return null;
  if (points >= 3000)
    return { nextTier: "platinum", pointsNeeded: 7500 - points };
  if (points >= 1000)
    return { nextTier: "gold", pointsNeeded: 3000 - points };
  return { nextTier: "silver", pointsNeeded: 1000 - points };
}

export function getTierProgress(points: number): number {
  if (points >= 7500) return 100;
  if (points >= 3000) return ((points - 3000) / (7500 - 3000)) * 100;
  if (points >= 1000) return ((points - 1000) / (3000 - 1000)) * 100;
  return (points / 1000) * 100;
}

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

// Default company settings
export const DEFAULT_SETTINGS = {
  points_per_referral: 500,
  milestone_bonus: 500,
  milestone_threshold: 5,
  review_points: 25,
  photo_review_bonus: 10,
  points_expiration: "never",
};

function getSettingValue(
  settings: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const val = settings[key];
  return typeof val === "number" ? val : fallback;
}

/** Award points when a referral is marked as installation_complete */
export async function awardReferralCompletion(
  referralId: string,
  supabase: SupabaseClient
) {
  // 1. Get referral
  const { data: referral } = await supabase
    .from("referrals")
    .select("*, profiles!referrals_referrer_id_fkey(id, total_points, company_id)")
    .eq("id", referralId)
    .single();

  if (!referral) return;

  const profile = (referral as Record<string, unknown>).profiles as {
    id: string;
    total_points: number;
    company_id: string;
  };

  // 2. Get company settings
  const { data: company } = await supabase
    .from("companies")
    .select("settings")
    .eq("id", referral.company_id)
    .single();

  const settings = (company?.settings ?? {}) as Record<string, unknown>;
  let basePoints = getSettingValue(settings, "points_per_referral", 500);

  // Use service-specific points if a service is attached
  if (referral.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("points_value")
      .eq("id", referral.service_id)
      .single();
    if (service) basePoints = service.points_value;
  }
  const milestoneBonus = getSettingValue(settings, "milestone_bonus", 500);
  const milestoneThreshold = getSettingValue(settings, "milestone_threshold", 5);

  // 3. Award base points
  await supabase.from("point_transactions").insert({
    profile_id: profile.id,
    company_id: referral.company_id,
    type: "earned",
    amount: basePoints,
    description: `Referral completed: ${referral.referee_name}`,
    referral_id: referralId,
  });

  let totalAwarded = basePoints;

  // 4. Count completed referrals to check milestone
  const { count: completedCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", profile.id)
    .eq("status", "won");

  if (completedCount && milestoneThreshold > 0 && completedCount % milestoneThreshold === 0) {
    await supabase.from("point_transactions").insert({
      profile_id: profile.id,
      company_id: referral.company_id,
      type: "earned",
      amount: milestoneBonus,
      description: `Milestone bonus: ${completedCount} completed referrals!`,
    });
    totalAwarded += milestoneBonus;

    await supabase.from("notifications").insert({
      profile_id: profile.id,
      type: "achievement",
      title: "Milestone Bonus!",
      body: `You've completed ${completedCount} referrals! +${milestoneBonus} bonus points.`,
    });
  }

  // 5. Update profile points and tier
  const newTotal = profile.total_points + totalAwarded;
  const newTier = calculateTierFromPoints(newTotal);

  await supabase
    .from("profiles")
    .update({ total_points: newTotal, loyalty_tier: newTier })
    .eq("id", profile.id);

  // 6. Update referral points_awarded
  await supabase
    .from("referrals")
    .update({ points_awarded: basePoints, status: "won" })
    .eq("id", referralId);

  // 7. Create notification
  await supabase.from("notifications").insert({
    profile_id: profile.id,
    type: "referral_update",
    title: "Referral Complete!",
    body: `Your referral for ${referral.referee_name}'s installation is complete! +${basePoints} points earned.`,
  });
}

/** Manually adjust a customer's points */
export async function manualPointAdjustment(
  userId: string,
  companyId: string,
  amount: number,
  reason: string,
  supabase: SupabaseClient
) {
  // 1. Insert point_transaction
  await supabase.from("point_transactions").insert({
    profile_id: userId,
    company_id: companyId,
    type: "adjusted",
    amount,
    description: reason || "Manual adjustment",
  });

  // 2. Get current total and update
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const newTotal = Math.max(0, profile.total_points + amount);
  const newTier = calculateTierFromPoints(newTotal);

  await supabase
    .from("profiles")
    .update({ total_points: newTotal, loyalty_tier: newTier })
    .eq("id", userId);

  // 3. Notify customer
  await supabase.from("notifications").insert({
    profile_id: userId,
    type: "reward_earned",
    title: amount > 0 ? "Points Awarded" : "Points Adjusted",
    body: `${amount > 0 ? "+" : ""}${amount} points: ${reason || "Manual adjustment"}`,
  });
}

/** Award review points after contractor verifies */
export async function awardReviewPoints(
  reviewId: string,
  supabase: SupabaseClient
) {
  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (!review) return;

  const { data: company } = await supabase
    .from("companies")
    .select("settings")
    .eq("id", review.company_id)
    .single();

  const settings = (company?.settings ?? {}) as Record<string, unknown>;
  const reviewPts = getSettingValue(settings, "review_points", 25);

  await supabase.from("point_transactions").insert({
    profile_id: review.profile_id,
    company_id: review.company_id,
    type: "earned",
    amount: reviewPts,
    description: "Review verified",
  });

  // Update profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", review.profile_id)
    .single();

  if (profile) {
    const newTotal = profile.total_points + reviewPts;
    await supabase
      .from("profiles")
      .update({
        total_points: newTotal,
        loyalty_tier: calculateTierFromPoints(newTotal),
      })
      .eq("id", review.profile_id);
  }

  await supabase.from("notifications").insert({
    profile_id: review.profile_id,
    type: "reward_earned",
    title: "Review Verified!",
    body: `Your review has been verified. +${reviewPts} points earned!`,
  });
}
