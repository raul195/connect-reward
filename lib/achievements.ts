// ============================================================
// Achievement definitions — static config evaluated by the engine
// ============================================================

export type AchievementCategory = "referrals" | "streaks" | "engagement" | "tiers";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
}

export const ACHIEVEMENT_CATEGORIES: { key: AchievementCategory; label: string }[] = [
  { key: "referrals", label: "Referral Milestones" },
  { key: "streaks", label: "Streaks" },
  { key: "engagement", label: "Engagement" },
  { key: "tiers", label: "Tier Achievements" },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Referral Milestones ──
  {
    key: "first_referral_submitted",
    name: "First Step",
    description: "Submitted your first referral",
    icon: "\u{1F331}",
    category: "referrals",
  },
  {
    key: "first_referral_approved",
    name: "Referral Rookie",
    description: "Got your first referral approved",
    icon: "\u{2B50}",
    category: "referrals",
  },
  {
    key: "three_approved",
    name: "Hat Trick",
    description: "3 approved referrals",
    icon: "\u{1F3C6}",
    category: "referrals",
  },
  {
    key: "five_approved",
    name: "Power Referrer",
    description: "5 approved referrals",
    icon: "\u{26A1}",
    category: "referrals",
  },
  {
    key: "ten_approved",
    name: "Referral Legend",
    description: "10 approved referrals",
    icon: "\u{1F525}",
    category: "referrals",
  },
  {
    key: "twentyfive_approved",
    name: "Community Builder",
    description: "25 approved referrals",
    icon: "\u{1F30D}",
    category: "referrals",
  },

  // ── Streaks ──
  {
    key: "streak_2_months",
    name: "On a Roll",
    description: "Referrals approved in 2 consecutive months",
    icon: "\u{1F4AA}",
    category: "streaks",
  },
  {
    key: "streak_3_months",
    name: "Consistent Advocate",
    description: "3 consecutive months with an approved referral",
    icon: "\u{1F4C8}",
    category: "streaks",
  },
  {
    key: "streak_6_months",
    name: "Unstoppable",
    description: "6 consecutive months with an approved referral",
    icon: "\u{1F680}",
    category: "streaks",
  },

  // ── Engagement ──
  {
    key: "early_bird",
    name: "Early Bird",
    description: "Joined within the first 30 days of a business's program launch",
    icon: "\u{1F426}",
    category: "engagement",
  },
  {
    key: "quick_start",
    name: "Quick Start",
    description: "Submitted a referral within 7 days of joining",
    icon: "\u{23F1}\uFE0F",
    category: "engagement",
  },
  {
    key: "left_review",
    name: "Reviewer",
    description: "Left a review through the platform",
    icon: "\u{270D}\uFE0F",
    category: "engagement",
  },

  // ── Tiers ──
  {
    key: "reached_silver",
    name: "Silver Achiever",
    description: "Reached Silver tier",
    icon: "\u{1F948}",
    category: "tiers",
  },
  {
    key: "reached_gold",
    name: "Gold Achiever",
    description: "Reached Gold tier",
    icon: "\u{1F947}",
    category: "tiers",
  },
  {
    key: "reached_platinum",
    name: "Platinum Achiever",
    description: "Reached Platinum tier",
    icon: "\u{1F48E}",
    category: "tiers",
  },
];

/** Quick lookup by key */
export const ACHIEVEMENTS_MAP: Record<string, AchievementDef> = {};
for (const a of ACHIEVEMENTS) {
  ACHIEVEMENTS_MAP[a.key] = a;
}
