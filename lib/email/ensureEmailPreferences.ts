import type { SupabaseClient } from "@supabase/supabase-js";

interface EmailPrefsRow {
  unsubscribe_token: string;
  opt_out: boolean;
  reminders_enabled: boolean;
  reward_suggestions_enabled: boolean;
  referral_nudges_enabled: boolean;
  milestone_emails_enabled: boolean;
  promotional_emails_enabled: boolean;
}

/**
 * Ensure an email_preferences row exists for the given customer.
 * Returns the existing row or creates one with defaults.
 */
export async function ensureEmailPreferences(
  customerId: string,
  adminClient: SupabaseClient
): Promise<EmailPrefsRow> {
  const { data: existing } = await adminClient
    .from("email_preferences")
    .select(
      "unsubscribe_token, opt_out, reminders_enabled, reward_suggestions_enabled, referral_nudges_enabled, milestone_emails_enabled, promotional_emails_enabled"
    )
    .eq("customer_id", customerId)
    .single();

  if (existing) return existing as EmailPrefsRow;

  // Create with defaults
  const { data: created, error } = await adminClient
    .from("email_preferences")
    .insert({ customer_id: customerId })
    .select(
      "unsubscribe_token, opt_out, reminders_enabled, reward_suggestions_enabled, referral_nudges_enabled, milestone_emails_enabled, promotional_emails_enabled"
    )
    .single();

  if (error || !created) {
    // Return permissive defaults if insert fails (e.g. race condition)
    return {
      unsubscribe_token: "",
      opt_out: false,
      reminders_enabled: true,
      reward_suggestions_enabled: true,
      referral_nudges_enabled: true,
      milestone_emails_enabled: true,
      promotional_emails_enabled: true,
    };
  }

  return created as EmailPrefsRow;
}
