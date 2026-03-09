import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROMOTION_TEMPLATES, type PromotionEmailType } from "@/lib/email/promotionTemplates";
import { injectVariables, textToHtml } from "@/lib/email/injectVariables";
import { ensureEmailPreferences } from "@/lib/email/ensureEmailPreferences";
import type { TonePreference } from "@/lib/types";

export const dynamic = "force-dynamic";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function processPromotions() {
  const admin = createAdminClient();
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

  let deactivated = 0;
  let draftsCreated = 0;

  // 1. Deactivate expired promotions
  const { data: expiredData } = await admin
    .from("promotions")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("end_date", now.toISOString())
    .select("id");

  deactivated = expiredData?.length ?? 0;

  // 2. Get all active promotions for announcement/reminder/last-chance processing
  const { data: activePromos } = await admin
    .from("promotions")
    .select("*, companies!inner(id, name, logo_url, settings)")
    .eq("is_active", true);

  if (!activePromos || activePromos.length === 0) {
    return { deactivated, draftsCreated };
  }

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const promo of activePromos) {
    const company = promo.companies as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      settings: Record<string, unknown>;
    };

    const companySettings = (company.settings ?? {}) as Record<string, unknown>;
    const primaryColor = (companySettings.brandColor as string) || "#0D9488";

    // Get company tone preference
    const { data: automationSettings } = await admin
      .from("automation_settings")
      .select("tone_preference")
      .eq("company_id", company.id)
      .single();

    const tone = (automationSettings?.tone_preference || "friendly") as TonePreference;

    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    const totalDuration = endDate.getTime() - startDate.getTime();
    const halfwayPoint = new Date(startDate.getTime() + totalDuration / 2);
    const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysRemaining = Math.ceil(hoursUntilEnd / 24);

    // Determine which email types to send
    const emailTypes: PromotionEmailType[] = [];

    // Announcement: start_date passed within the last hour
    if (
      promo.notify_customers &&
      startDate >= oneHourAgo &&
      startDate <= now
    ) {
      emailTypes.push("promotion_announcement");
    }

    // Reminder: halfway point within last hour
    if (
      promo.send_reminder &&
      halfwayPoint >= oneHourAgo &&
      halfwayPoint <= now
    ) {
      emailTypes.push("promotion_reminder");
    }

    // Last chance: ending in 23-25 hours
    if (promo.send_reminder && hoursUntilEnd >= 23 && hoursUntilEnd <= 25) {
      emailTypes.push("promotion_last_chance");
    }

    if (emailTypes.length === 0) continue;

    // Get customers for this company
    const { data: customers } = await admin
      .from("profiles")
      .select("id, full_name, email, total_points")
      .eq("company_id", company.id)
      .eq("role", "customer");

    if (!customers || customers.length === 0) continue;

    for (const emailType of emailTypes) {
      const templateSet = PROMOTION_TEMPLATES[emailType][tone];
      // Use variation 0 for promotions (no rotation needed — one per promo)
      const template = templateSet[0];

      for (const customer of customers) {
        // Check email preferences
        const emailPrefs = await ensureEmailPreferences(customer.id, admin);
        if (emailPrefs.opt_out) continue;
        if (!emailPrefs.promotional_emails_enabled) continue;

        // Dedup: check if this email type was already queued for this promo + customer
        const templateName = `promotion_${promo.id}`;
        const { count: existingCount } = await admin
          .from("email_draft_queue")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customer.id)
          .eq("template_name", templateName)
          .eq("trigger_type", emailType)
          .in("status", ["draft", "approved", "sent"]);

        if ((existingCount ?? 0) > 0) continue;

        const unsubscribeUrl = emailPrefs.unsubscribe_token
          ? `${appUrl}/unsubscribe?token=${emailPrefs.unsubscribe_token}`
          : `${appUrl}/unsubscribe`;

        const endDateFormatted = endDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        const varData: Record<string, string | number> = {
          customerName: customer.full_name,
          businessName: company.name,
          promotionName: promo.name,
          multiplier: `${promo.multiplier}x`,
          endDate: endDateFormatted,
          daysRemaining,
          pointsBalance: customer.total_points,
          dashboardUrl: `${appUrl}/dashboard`,
          unsubscribeUrl,
        };

        const subject = injectVariables(template.subject, varData);
        const bodyText = injectVariables(template.body, varData);
        const bodyHtml = textToHtml(bodyText);

        await admin.from("email_draft_queue").insert({
          company_id: company.id,
          customer_id: customer.id,
          trigger_type: emailType,
          template_name: templateName,
          subject,
          preview_text: subject,
          email_data: {
            companyName: company.name,
            logoUrl: company.logo_url,
            primaryColor,
            customerName: customer.full_name,
            promotionName: promo.name,
            multiplier: promo.multiplier,
            endDate: endDateFormatted,
            daysRemaining,
            pointsBalance: customer.total_points,
            dashboardUrl: `${appUrl}/dashboard`,
            variant: emailType.replace("promotion_", "") as "announcement" | "reminder" | "last_chance",
            body_text: bodyText,
            body_html: bodyHtml,
          },
          status: "draft",
          scheduled_send_at: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
        });
        draftsCreated++;
      }
    }
  }

  return { deactivated, draftsCreated };
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processPromotions();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Process promotions failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = POST;
