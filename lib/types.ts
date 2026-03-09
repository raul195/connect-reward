// ============================================================
// Database types — mirrors the live Supabase schema
// ============================================================

export type UserRole = "customer" | "business" | "business_owner" | "business_manager" | "business_rep" | "super_admin";
export type ReferralStatus = "submitted" | "contacted" | "consultation_scheduled" | "installation_complete" | "cancelled";
export type RewardCategory = string;
export type RedemptionStatus = "pending" | "approved" | "fulfilled" | "rejected";
export type NotificationType = "referral_update" | "reward_earned" | "achievement" | "system";
export type PlanTier = "free" | "starter" | "growth" | "pro";
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";
export type PointTxType = "referral_completed" | "redemption" | "signup_bonus" | "manual_adjustment" | "milestone_bonus";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  branding: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  customer_count: number;
  is_active: boolean;
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
  tier: LoyaltyTier;
  total_points: number;
  redeemed_points: number;
  referral_count: number;
  status: string;
  invited_by: string | null;
  notification_preferences: NotificationPreferences;
  last_activity: string | null;
  email_status: 'unknown' | 'valid' | 'bounced' | 'complained';
  import_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  company_id: string;
  submitted_by: string;
  service_id: string | null;
  referral_name: string;
  referral_email: string;
  referral_phone: string | null;
  referral_address: string | null;
  referral_city: string | null;
  referral_state: string | null;
  referral_zip: string | null;
  relationship: string | null;
  notes: string | null;
  status: ReferralStatus;
  points_awarded: number;
  assigned_rep: string | null;
  status_history: Record<string, unknown>[] | null;
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
  category: RewardCategory;
  points_required: number;
  image_url: string | null;
  is_active: boolean;
  quantity_available: number | null;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  reward_id: string;
  user_id: string;
  company_id: string;
  points_spent: number;
  status: RedemptionStatus;
  fulfillment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  company_id: string;
  type: PointTxType;
  amount: number;
  description: string | null;
  reference_id: string | null;
  promotion_id: string | null;
  created_at: string;
}

export interface Promotion {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  notify_customers: boolean;
  send_reminder: boolean;
  created_at: string;
  updated_at: string;
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

export interface EmailLog {
  id: string;
  company_id: string;
  customer_id: string | null;
  template_name: string;
  recipient_email: string;
  status: "sent" | "failed" | "skipped";
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Email Preferences ──

export interface EmailPreferences {
  id: string;
  customer_id: string;
  unsubscribe_token: string;
  opt_out: boolean;
  reminders_enabled: boolean;
  reward_suggestions_enabled: boolean;
  referral_nudges_enabled: boolean;
  milestone_emails_enabled: boolean;
  promotional_emails_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── Email Automation Phase 2 & 3 ──

export type TonePreference = "friendly" | "professional" | "motivational";

export type AutomationTriggerType =
  | "inactivity_30"
  | "inactivity_60"
  | "points_close_to_reward"
  | "referral_nudge"
  | "milestone_reached"
  | "program_reminder";

export type EmailDraftStatus = "draft" | "approved" | "sent" | "cancelled";

export interface AutomationSettings {
  company_id: string;
  auto_approve_emails: boolean;
  preferred_send_time: string; // HH:MM
  timezone: string;
  monthly_reminders_enabled: boolean;
  reminder_frequency: "monthly" | "quarterly";
  tone_preference: TonePreference;
  created_at: string;
  updated_at: string;
}

export interface EmailAutomationTrigger {
  id: string;
  company_id: string;
  trigger_type: AutomationTriggerType;
  condition_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailDraft {
  id: string;
  company_id: string;
  customer_id: string;
  trigger_type: AutomationTriggerType;
  template_name: string;
  subject: string;
  preview_text: string | null;
  email_data: Record<string, unknown>;
  status: EmailDraftStatus;
  scheduled_send_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Customer Imports ──

export interface CustomerImport {
  id: string;
  company_id: string;
  created_by: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  created_count: number;
  skipped_count: number;
  error_count: number;
  send_welcome: boolean;
  original_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportRow {
  id: string;
  import_id: string;
  row_number: number;
  raw_data: Record<string, string>;
  status: 'pending' | 'created' | 'skipped_duplicate' | 'skipped_invalid' | 'error';
  error_message: string | null;
  profile_id: string | null;
  created_at: string;
}

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
