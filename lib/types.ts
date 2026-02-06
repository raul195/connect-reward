// ============================================================
// Database types — mirrors the SQL schema
// ============================================================

export type UserRole = "customer" | "contractor" | "super_admin";
export type ReferralStatus = "pending" | "contacted" | "quoted" | "won" | "lost" | "expired";
export type RewardType = "discount" | "cashback" | "gift_card" | "service_credit" | "custom";
export type RedemptionStatus = "pending" | "approved" | "fulfilled" | "rejected";
export type NotificationType = "referral_update" | "reward_earned" | "achievement" | "system";
export type PlanTier = "free" | "starter" | "growth" | "pro";
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";
export type PointTxType = "earned" | "redeemed" | "expired" | "adjusted";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: PlanTier;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  referral_status: boolean;
  points_earned: boolean;
  milestone_reached: boolean;
  reward_fulfilled: boolean;
  weekly_summary: boolean;
}

export interface Profile {
  id: string;
  company_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  loyalty_tier: LoyaltyTier;
  total_points: number;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  company_id: string;
  referrer_id: string;
  referee_name: string;
  referee_email: string | null;
  referee_phone: string | null;
  service_type: string | null;
  service_id: string | null;
  status: ReferralStatus;
  notes: string | null;
  job_value: number | null;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  points_value: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  type: RewardType;
  points_cost: number;
  min_tier: LoyaltyTier;
  image_url: string | null;
  active: boolean;
  quantity_left: number | null;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  reward_id: string;
  profile_id: string;
  company_id: string;
  status: RedemptionStatus;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  profile_id: string;
  company_id: string;
  type: PointTxType;
  amount: number;
  description: string | null;
  referral_id: string | null;
  redemption_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  company_id: string;
  profile_id: string;
  referral_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface Achievement {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  condition: Record<string, unknown>;
  points_bonus: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  profile_id: string;
  achievement_id: string;
  earned_at: string;
}

export type ApplicationStatus = "new" | "contacted" | "demo_scheduled" | "approved" | "declined" | "converted";
export type IndustryType = "solar" | "roofing" | "hvac" | "windows" | "turf" | "pest_control" | "other";
export type CompanySize = "solo" | "2-5" | "6-15" | "16-50" | "50+";
export type ReferralMethod = "none" | "cash_bonuses" | "gift_cards" | "referral_software" | "word_of_mouth" | "other";
export type MonthlyVolume = "0" | "1-5" | "6-15" | "16-30" | "30+";

export interface EarlyAccessApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  industry: IndustryType;
  industry_other: string | null;
  company_size: CompanySize;
  website: string | null;
  current_referral_method: ReferralMethod | null;
  current_referral_method_other: string | null;
  monthly_referral_volume: MonthlyVolume | null;
  biggest_challenge: string | null;
  desired_plan: PlanTier | "not_sure" | null;
  how_did_you_hear: string | null;
  status: ApplicationStatus;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  submitted_at: string;
  updated_at: string;
}
