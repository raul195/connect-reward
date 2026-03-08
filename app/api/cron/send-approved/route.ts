import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import type { TemplateName } from "@/lib/email/sendEmail";
import type { NotificationPreferences } from "@/lib/types";

export const dynamic = "force-dynamic";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    // 1. Auto-approve drafts older than 24h for companies with auto_approve_emails=true
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: autoApproveCompanies } = await admin
      .from("automation_settings")
      .select("company_id")
      .eq("auto_approve_emails", true);

    if (autoApproveCompanies && autoApproveCompanies.length > 0) {
      const companyIds = autoApproveCompanies.map((c) => c.company_id);

      await admin
        .from("email_draft_queue")
        .update({ status: "approved" })
        .eq("status", "draft")
        .in("company_id", companyIds)
        .lt("created_at", twentyFourHoursAgo.toISOString());
    }

    // 2. Fetch approved drafts ready to send
    const now = new Date().toISOString();
    const { data: drafts, error: draftsError } = await admin
      .from("email_draft_queue")
      .select("*, profiles!email_draft_queue_customer_id_fkey(email, notification_preferences)")
      .eq("status", "approved")
      .lte("scheduled_send_at", now)
      .order("scheduled_send_at", { ascending: true })
      .limit(100);

    if (draftsError) {
      console.error("Failed to fetch approved drafts:", draftsError.message);
      return NextResponse.json(
        { error: "Failed to fetch drafts" },
        { status: 500 }
      );
    }

    if (!drafts || drafts.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const draft of drafts) {
      try {
        const profile = draft.profiles as unknown as {
          email: string;
          notification_preferences: NotificationPreferences | null;
        } | null;

        if (!profile?.email) {
          // Mark as failed — no email
          await admin
            .from("email_draft_queue")
            .update({ status: "cancelled" })
            .eq("id", draft.id);
          failed++;
          continue;
        }

        const result = await sendTransactionalEmail({
          template: draft.template_name as TemplateName,
          to: profile.email,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          props: draft.email_data as any,
          companyId: draft.company_id,
          customerId: draft.customer_id,
          preferences: profile.notification_preferences,
          adminClient: admin,
          subjectOverride: draft.subject,
        });

        if (result.success && !result.skipped) {
          await admin
            .from("email_draft_queue")
            .update({ status: "sent" })
            .eq("id", draft.id);
          sent++;
        } else if (result.skipped) {
          await admin
            .from("email_draft_queue")
            .update({ status: "cancelled" })
            .eq("id", draft.id);
          failed++;
        } else {
          await admin
            .from("email_draft_queue")
            .update({ status: "cancelled" })
            .eq("id", draft.id);
          failed++;
        }
      } catch (err) {
        console.error(`Failed to send draft ${draft.id}:`, err);
        await admin
          .from("email_draft_queue")
          .update({ status: "cancelled" })
          .eq("id", draft.id);
        failed++;
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error("Send approved failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = POST;
