import type { LoyaltyTier } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "./email/sendEmail";
import { applyPromotionMultiplier } from "./promotions";

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
    .select("*")
    .eq("id", referralId)
    .single();

  if (!referral) return;

  // 2. Get the submitter's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, total_points, company_id")
    .eq("id", referral.submitted_by)
    .single();

  if (!profile) return;

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

  // 3. Apply promotion multiplier
  const { finalAmount: multipliedPoints, promotion } = await applyPromotionMultiplier(
    referral.company_id,
    basePoints,
    supabase
  );

  const promoSuffix = promotion ? ` (${promotion.multiplier}x ${promotion.name})` : "";

  await supabase.from("point_transactions").insert({
    user_id: profile.id,
    company_id: referral.company_id,
    type: "referral_completed",
    amount: multipliedPoints,
    description: `Referral completed: ${referral.referral_name}${promoSuffix}`,
    reference_id: referralId,
    promotion_id: promotion?.id ?? null,
  });

  let totalAwarded = multipliedPoints;

  // 4. Count completed referrals to check milestone
  const { count: completedCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", profile.id)
    .eq("status", "installation_complete");

  if (completedCount && milestoneThreshold > 0 && completedCount % milestoneThreshold === 0) {
    await supabase.from("point_transactions").insert({
      user_id: profile.id,
      company_id: referral.company_id,
      type: "milestone_bonus",
      amount: milestoneBonus,
      description: `Milestone bonus: ${completedCount} completed referrals!`,
    });
    totalAwarded += milestoneBonus;

    await supabase.from("notifications").insert({
      user_id: profile.id,
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
    .update({ total_points: newTotal, tier: newTier })
    .eq("id", profile.id);

  // 6. Update referral points_awarded
  await supabase
    .from("referrals")
    .update({ points_awarded: basePoints, status: "installation_complete" })
    .eq("id", referralId);

  // 7. Create notification
  await supabase.from("notifications").insert({
    user_id: profile.id,
    type: "referral_update",
    title: "Referral Complete!",
    body: `Your referral for ${referral.referral_name}'s installation is complete! +${basePoints} points earned.`,
  });

  // 8. Send points earned email (fire-and-forget)
  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("email, full_name, notification_preferences")
    .eq("id", profile.id)
    .single();

  const { data: companyBranding } = await supabase
    .from("companies")
    .select("name, logo_url, settings")
    .eq("id", referral.company_id)
    .single();

  if (customerProfile && companyBranding) {
    const compSettings = (companyBranding.settings ?? {}) as Record<string, unknown>;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
    const tierProgress = getPointsToNextTier(newTotal);

    sendTransactionalEmail({
      template: "points_earned",
      to: customerProfile.email,
      props: {
        customerName: customerProfile.full_name,
        pointsEarned: totalAwarded,
        reason: `Referral completed: ${referral.referral_name}`,
        totalPoints: newTotal,
        tier: newTier,
        nextTier: tierProgress?.nextTier ?? null,
        pointsToNextTier: tierProgress?.pointsNeeded ?? null,
        rewardsUrl: `${baseUrl}/dashboard/rewards`,
        companyName: companyBranding.name,
        logoUrl: companyBranding.logo_url,
        primaryColor: (compSettings.brandColor as string) || "#6366f1",
      },
      companyId: referral.company_id,
      customerId: profile.id,
      preferences: customerProfile.notification_preferences,
      adminClient: supabase,
    }).catch(() => {});
  }
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
    user_id: userId,
    company_id: companyId,
    type: "manual_adjustment",
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
    .update({ total_points: newTotal, tier: newTier })
    .eq("id", userId);

  // 3. Notify customer
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "reward_earned",
    title: amount > 0 ? "Points Awarded" : "Points Adjusted",
    body: `${amount > 0 ? "+" : ""}${amount} points: ${reason || "Manual adjustment"}`,
  });

  // 4. Send points earned email (fire-and-forget, only for positive adjustments)
  if (amount > 0) {
    const { data: customerData } = await supabase
      .from("profiles")
      .select("email, full_name, notification_preferences")
      .eq("id", userId)
      .single();

    const { data: companyBranding } = await supabase
      .from("companies")
      .select("name, logo_url, settings")
      .eq("id", companyId)
      .single();

    if (customerData && companyBranding) {
      const compSettings = (companyBranding.settings ?? {}) as Record<string, unknown>;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
      const tierProgress = getPointsToNextTier(newTotal);

      sendTransactionalEmail({
        template: "points_earned",
        to: customerData.email,
        props: {
          customerName: customerData.full_name,
          pointsEarned: amount,
          reason: reason || "Manual adjustment",
          totalPoints: newTotal,
          tier: newTier,
          nextTier: tierProgress?.nextTier ?? null,
          pointsToNextTier: tierProgress?.pointsNeeded ?? null,
          rewardsUrl: `${baseUrl}/dashboard/rewards`,
          companyName: companyBranding.name,
          logoUrl: companyBranding.logo_url,
          primaryColor: (compSettings.brandColor as string) || "#6366f1",
        },
        companyId,
        customerId: userId,
        preferences: customerData.notification_preferences,
        adminClient: supabase,
      }).catch(() => {});
    }
  }
}

/** Award review points after business verifies */
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

  // Apply promotion multiplier to review points
  const { finalAmount: multipliedReviewPts, promotion: reviewPromo } = await applyPromotionMultiplier(
    review.company_id,
    reviewPts,
    supabase
  );

  const reviewPromoSuffix = reviewPromo ? ` (${reviewPromo.multiplier}x ${reviewPromo.name})` : "";

  await supabase.from("point_transactions").insert({
    user_id: review.user_id,
    company_id: review.company_id,
    type: "manual_adjustment",
    amount: multipliedReviewPts,
    description: `Review verified${reviewPromoSuffix}`,
    promotion_id: reviewPromo?.id ?? null,
  });

  // Update profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", review.user_id)
    .single();

  if (profile) {
    const newTotal = profile.total_points + multipliedReviewPts;
    await supabase
      .from("profiles")
      .update({
        total_points: newTotal,
        tier: calculateTierFromPoints(newTotal),
      })
      .eq("id", review.user_id);
  }

  await supabase.from("notifications").insert({
    user_id: review.user_id,
    type: "reward_earned",
    title: "Review Verified!",
    body: `Your review has been verified. +${multipliedReviewPts} points earned!`,
  });

  // Send points earned email (fire-and-forget)
  if (profile) {
    const { data: customerData } = await supabase
      .from("profiles")
      .select("email, full_name, notification_preferences")
      .eq("id", review.user_id)
      .single();

    const { data: companyBranding } = await supabase
      .from("companies")
      .select("name, logo_url, settings")
      .eq("id", review.company_id)
      .single();

    if (customerData && companyBranding) {
      const compSettings = (companyBranding.settings ?? {}) as Record<string, unknown>;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
      const updatedTotal = profile.total_points + multipliedReviewPts;
      const tierProgress = getPointsToNextTier(updatedTotal);

      sendTransactionalEmail({
        template: "points_earned",
        to: customerData.email,
        props: {
          customerName: customerData.full_name,
          pointsEarned: multipliedReviewPts,
          reason: `Review verified${reviewPromoSuffix}`,
          totalPoints: updatedTotal,
          tier: calculateTierFromPoints(updatedTotal),
          nextTier: tierProgress?.nextTier ?? null,
          pointsToNextTier: tierProgress?.pointsNeeded ?? null,
          rewardsUrl: `${baseUrl}/dashboard/rewards`,
          companyName: companyBranding.name,
          logoUrl: companyBranding.logo_url,
          primaryColor: (compSettings.brandColor as string) || "#6366f1",
        },
        companyId: review.company_id,
        customerId: review.user_id,
        preferences: customerData.notification_preferences,
        adminClient: supabase,
      }).catch(() => {});
    }
  }
}
