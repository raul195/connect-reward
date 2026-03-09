import type { SupabaseClient } from "@supabase/supabase-js";

const HOURLY_LIMIT = 50;

export async function canSendEmail(
  companyId: string,
  emailType: string,
  admin: SupabaseClient
): Promise<boolean> {
  const remaining = await getRemainingQuota(companyId, emailType, admin);
  return remaining > 0;
}

export async function logEmailSend(
  companyId: string,
  emailType: string,
  recipientId: string,
  admin: SupabaseClient
): Promise<void> {
  await admin.from("email_send_log").insert({
    company_id: companyId,
    email_type: emailType,
    recipient_id: recipientId,
  });
}

export async function getRemainingQuota(
  companyId: string,
  emailType: string,
  admin: SupabaseClient
): Promise<number> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { count } = await admin
    .from("email_send_log")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("email_type", emailType)
    .gte("sent_at", oneHourAgo.toISOString());

  return Math.max(0, HOURLY_LIMIT - (count ?? 0));
}
