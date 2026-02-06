import { Resend } from "resend";
import type { NotificationPreferences } from "@/lib/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Connect Reward <noreply@connectreward.com>",
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error };
  }
}

/**
 * Send an email to a customer, respecting their notification preferences.
 * `prefKey` maps to one of the NotificationPreferences keys.
 * If the customer has disabled that preference, the email is silently skipped.
 */
export async function sendCustomerEmail({
  to,
  subject,
  html,
  preferences,
  prefKey,
}: {
  to: string;
  subject: string;
  html: string;
  preferences: NotificationPreferences | null;
  prefKey: keyof NotificationPreferences;
}) {
  // Default to sending if preferences haven't been set
  if (preferences && preferences[prefKey] === false) {
    return { success: true, skipped: true };
  }
  return sendEmail({ to, subject, html });
}

export async function notifyAdmin(subject: string, html: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set, skipping admin notification");
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }
  return sendEmail({ to: adminEmail, subject, html });
}
