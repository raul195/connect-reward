import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AutomationTriggerType } from "@/lib/types";

export const dynamic = "force-dynamic";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// Convert preferred_send_time + timezone → UTC timestamptz for tomorrow
function computeNextSendTime(
  preferredTime: string, // "10:00"
  timezone: string // "America/New_York"
): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  // Build a date string in the target timezone
  // We'll use Intl to get the offset, then compute UTC
  const targetDate = new Date(`${dateStr}T${preferredTime}:00`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Get the offset between UTC and the target timezone
  const utcDate = new Date(`${dateStr}T${preferredTime}:00Z`);
  const tzParts = formatter.formatToParts(utcDate);
  const tzHour = parseInt(tzParts.find((p) => p.type === "hour")?.value || "0");
  const utcHour = utcDate.getUTCHours();
  const offsetHours = tzHour - utcHour;

  // Adjust targetDate by negative offset to get UTC equivalent
  targetDate.setHours(targetDate.getHours() - offsetHours);

  return targetDate.toISOString();
}

async function processAutomations() {
  const admin = createAdminClient();
  const results: { company_id: string; drafts_created: number; error?: string }[] = [];

  // Fetch all active companies
  const { data: companies, error: compErr } = await admin
    .from("companies")
    .select("id, name, logo_url, settings")
    .eq("is_active", true);

  if (compErr || !companies) {
    return { error: "Failed to fetch companies", details: compErr?.message };
  }

  for (const company of companies) {
    try {
      // Get automation settings (use defaults if no row)
      const { data: automationSettings } = await admin
        .from("automation_settings")
        .select("*")
        .eq("company_id", company.id)
        .single();

      const settings = automationSettings || {
        auto_approve_emails: false,
        preferred_send_time: "10:00",
        timezone: "America/New_York",
        monthly_reminders_enabled: true,
        reminder_frequency: "monthly",
      };

      // Get active triggers for this company
      const { data: triggers } = await admin
        .from("email_automation_triggers")
        .select("*")
        .eq("company_id", company.id)
        .eq("is_active", true);

      if (!triggers || triggers.length === 0) {
        results.push({ company_id: company.id, drafts_created: 0 });
        continue;
      }

      const scheduledSendAt = computeNextSendTime(
        settings.preferred_send_time,
        settings.timezone
      );

      const companySettings = (company.settings || {}) as Record<string, unknown>;
      const primaryColor = (companySettings.brandColor as string) || "#0D9488";
      const branding = {
        companyName: company.name,
        logoUrl: company.logo_url,
        primaryColor,
      };

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
      let draftsCreated = 0;

      for (const trigger of triggers) {
        const triggerType = trigger.trigger_type as AutomationTriggerType;

        switch (triggerType) {
          case "inactivity_30":
          case "inactivity_60": {
            const days = triggerType === "inactivity_30" ? 30 : 60;
            const severity = triggerType === "inactivity_30" ? "mild" : "urgent";
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            // NULL last_activity = never active = treat as inactive
            const { data: inactiveCustomers } = await admin
              .from("profiles")
              .select("id, full_name, email, total_points, notification_preferences")
              .eq("company_id", company.id)
              .eq("role", "customer")
              .or(`last_activity.lt.${cutoff.toISOString()},last_activity.is.null`);

            if (!inactiveCustomers) break;

            for (const customer of inactiveCustomers) {
              const prefs = customer.notification_preferences as Record<string, boolean> | null;
              if (prefs && prefs.weekly_summary === false) continue;

              const isDuplicate = await checkDuplicate(admin, company.id, customer.id, triggerType);
              if (isDuplicate) continue;

              const templateName = "inactivity";
              const subject = severity === "urgent"
                ? "Don\u2019t let your points go to waste!"
                : `We miss you, ${customer.full_name}!`;

              await admin.from("email_draft_queue").insert({
                company_id: company.id,
                customer_id: customer.id,
                trigger_type: triggerType,
                template_name: templateName,
                subject,
                preview_text: subject,
                email_data: {
                  ...branding,
                  customerName: customer.full_name,
                  pointsBalance: customer.total_points,
                  daysSinceActivity: days,
                  severity,
                  dashboardUrl: `${appUrl}/dashboard`,
                },
                status: "draft",
                scheduled_send_at: scheduledSendAt,
              });
              draftsCreated++;
            }
            break;
          }

          case "points_close_to_reward": {
            // Find customers within 20% of cheapest unaffordable reward
            const { data: customers } = await admin
              .from("profiles")
              .select("id, full_name, email, total_points, redeemed_points, notification_preferences")
              .eq("company_id", company.id)
              .eq("role", "customer");

            const { data: rewards } = await admin
              .from("rewards")
              .select("id, name, points_required")
              .eq("company_id", company.id)
              .eq("is_active", true)
              .order("points_required", { ascending: true });

            if (!customers || !rewards || rewards.length === 0) break;

            for (const customer of customers) {
              const prefs = customer.notification_preferences as Record<string, boolean> | null;
              if (prefs && prefs.weekly_summary === false) continue;

              const availablePoints = customer.total_points - customer.redeemed_points;

              // Find cheapest reward they can't quite afford
              const targetReward = rewards.find(
                (r) => r.points_required > availablePoints
              );
              if (!targetReward) continue;

              const pointsNeeded = targetReward.points_required - availablePoints;
              const threshold = targetReward.points_required * 0.2;
              if (pointsNeeded > threshold) continue;

              const isDuplicate = await checkDuplicate(admin, company.id, customer.id, triggerType);
              if (isDuplicate) continue;

              const subject = `You're only ${pointsNeeded.toLocaleString()} points away from ${targetReward.name}!`;

              await admin.from("email_draft_queue").insert({
                company_id: company.id,
                customer_id: customer.id,
                trigger_type: triggerType,
                template_name: "points_close_to_reward",
                subject,
                preview_text: subject,
                email_data: {
                  ...branding,
                  customerName: customer.full_name,
                  currentPoints: availablePoints,
                  rewardName: targetReward.name,
                  rewardCost: targetReward.points_required,
                  pointsNeeded,
                  rewardsUrl: `${appUrl}/dashboard/rewards`,
                },
                status: "draft",
                scheduled_send_at: scheduledSendAt,
              });
              draftsCreated++;
            }
            break;
          }

          case "referral_nudge": {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 14);

            const { data: pendingReferrals } = await admin
              .from("referrals")
              .select("id, submitted_by, referral_name, created_at, status")
              .eq("company_id", company.id)
              .in("status", ["submitted", "contacted"])
              .lt("created_at", cutoff.toISOString());

            if (!pendingReferrals) break;

            for (const referral of pendingReferrals) {
              const { data: submitter } = await admin
                .from("profiles")
                .select("id, full_name, email, notification_preferences")
                .eq("id", referral.submitted_by)
                .single();

              if (!submitter) continue;

              const prefs = submitter.notification_preferences as Record<string, boolean> | null;
              if (prefs && prefs.weekly_summary === false) continue;

              const isDuplicate = await checkDuplicate(admin, company.id, submitter.id, triggerType);
              if (isDuplicate) continue;

              const daysPending = Math.floor(
                (Date.now() - new Date(referral.created_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              const subject = `Checking in on your referral for ${referral.referral_name}`;

              await admin.from("email_draft_queue").insert({
                company_id: company.id,
                customer_id: submitter.id,
                trigger_type: triggerType,
                template_name: "referral_nudge",
                subject,
                preview_text: subject,
                email_data: {
                  ...branding,
                  customerName: submitter.full_name,
                  referralName: referral.referral_name,
                  daysPending,
                  dashboardUrl: `${appUrl}/dashboard/referrals`,
                },
                status: "draft",
                scheduled_send_at: scheduledSendAt,
              });
              draftsCreated++;
            }
            break;
          }

          case "milestone_reached": {
            const milestoneThreshold = (companySettings.milestone_threshold as number) || 5;
            const milestoneBonus = (companySettings.milestone_bonus as number) || 500;

            const { data: customers } = await admin
              .from("profiles")
              .select("id, full_name, email, referral_count, total_points, notification_preferences")
              .eq("company_id", company.id)
              .eq("role", "customer")
              .gt("referral_count", 0);

            if (!customers) break;

            for (const customer of customers) {
              // Check if referral count is exactly at a milestone
              if (customer.referral_count % milestoneThreshold !== 0) continue;

              const prefs = customer.notification_preferences as Record<string, boolean> | null;
              if (prefs && prefs.milestone_reached === false) continue;

              const isDuplicate = await checkDuplicate(admin, company.id, customer.id, triggerType);
              if (isDuplicate) continue;

              const subject = `Congrats! You've completed ${customer.referral_count} referrals!`;

              await admin.from("email_draft_queue").insert({
                company_id: company.id,
                customer_id: customer.id,
                trigger_type: triggerType,
                template_name: "milestone",
                subject,
                preview_text: subject,
                email_data: {
                  ...branding,
                  customerName: customer.full_name,
                  milestoneCount: customer.referral_count,
                  bonusPoints: milestoneBonus,
                  totalPoints: customer.total_points,
                  dashboardUrl: `${appUrl}/dashboard`,
                },
                status: "draft",
                scheduled_send_at: scheduledSendAt,
              });
              draftsCreated++;
            }
            break;
          }

          case "program_reminder": {
            if (!settings.monthly_reminders_enabled) break;

            // Check frequency — monthly = 1st of month, quarterly = 1st of Jan/Apr/Jul/Oct
            const now = new Date();
            const dayOfMonth = now.getDate();
            const month = now.getMonth(); // 0-indexed

            if (dayOfMonth !== 1) break;
            if (settings.reminder_frequency === "quarterly" && ![0, 3, 6, 9].includes(month)) break;

            const { data: customers } = await admin
              .from("profiles")
              .select("id, full_name, email, total_points, notification_preferences")
              .eq("company_id", company.id)
              .eq("role", "customer");

            const { data: rewards } = await admin
              .from("rewards")
              .select("name, points_required")
              .eq("company_id", company.id)
              .eq("is_active", true)
              .order("points_required", { ascending: true });

            if (!customers) break;

            // Calculate month boundaries
            const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

            for (const customer of customers) {
              const prefs = customer.notification_preferences as Record<string, boolean> | null;
              if (prefs && prefs.weekly_summary === false) continue;

              const isDuplicate = await checkDuplicate(admin, company.id, customer.id, triggerType);
              if (isDuplicate) continue;

              // Points earned last month
              const { data: txns } = await admin
                .from("point_transactions")
                .select("amount")
                .eq("user_id", customer.id)
                .eq("company_id", company.id)
                .gte("created_at", monthStart.toISOString())
                .lt("created_at", monthEnd.toISOString())
                .gt("amount", 0);

              const pointsEarnedThisMonth = (txns || []).reduce(
                (sum, t) => sum + (t.amount || 0),
                0
              );

              // Referrals completed last month
              const { count: referralsThisMonth } = await admin
                .from("referrals")
                .select("id", { count: "exact", head: true })
                .eq("submitted_by", customer.id)
                .eq("company_id", company.id)
                .eq("status", "installation_complete")
                .gte("updated_at", monthStart.toISOString())
                .lt("updated_at", monthEnd.toISOString());

              // Available rewards the customer can afford
              const availableRewards = (rewards || [])
                .filter((r) => r.points_required <= customer.total_points)
                .map((r) => ({ name: r.name, pointsRequired: r.points_required }));

              const subject = `Your monthly rewards summary from ${company.name}`;

              await admin.from("email_draft_queue").insert({
                company_id: company.id,
                customer_id: customer.id,
                trigger_type: triggerType,
                template_name: "monthly_reminder",
                subject,
                preview_text: subject,
                email_data: {
                  ...branding,
                  customerName: customer.full_name,
                  totalPoints: customer.total_points,
                  pointsEarnedThisMonth,
                  referralsThisMonth: referralsThisMonth || 0,
                  availableRewards,
                  dashboardUrl: `${appUrl}/dashboard`,
                },
                status: "draft",
                scheduled_send_at: scheduledSendAt,
              });
              draftsCreated++;
            }
            break;
          }
        }
      }

      results.push({ company_id: company.id, drafts_created: draftsCreated });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Automation failed for company ${company.id}:`, message);
      results.push({ company_id: company.id, drafts_created: 0, error: message });
    }
  }

  return { results };
}

// Check for duplicate draft or sent email within the last 30 days
async function checkDuplicate(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string,
  customerId: string,
  triggerType: string
): Promise<boolean> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Check email_draft_queue
  const { count: draftCount } = await admin
    .from("email_draft_queue")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("trigger_type", triggerType)
    .in("status", ["draft", "approved", "sent"])
    .gte("created_at", thirtyDaysAgo.toISOString());

  if ((draftCount || 0) > 0) return true;

  // Check email_logs for sent emails with same trigger
  const { count: logCount } = await admin
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("status", "sent")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Only consider it a duplicate if there's a matching template in logs
  // We check template_name since email_logs doesn't have trigger_type
  return (logCount || 0) > 0 && (draftCount || 0) > 0;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAutomations();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Process automations failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = POST;
