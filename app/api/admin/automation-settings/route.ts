import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;

  // Get settings (return defaults if no row exists)
  const { data: settings } = await ctx.admin
    .from("automation_settings")
    .select("*")
    .eq("company_id", companyId)
    .single();

  const automationSettings = settings || {
    company_id: companyId,
    auto_approve_emails: false,
    preferred_send_time: "10:00",
    timezone: "America/New_York",
    monthly_reminders_enabled: true,
    reminder_frequency: "monthly",
    tone_preference: "friendly",
  };

  // Get all triggers for this company
  const { data: triggers } = await ctx.admin
    .from("email_automation_triggers")
    .select("*")
    .eq("company_id", companyId)
    .order("trigger_type");

  return NextResponse.json({
    settings: automationSettings,
    triggers: triggers || [],
  });
}

export async function PUT(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;
  const body = await req.json();

  const {
    auto_approve_emails,
    preferred_send_time,
    timezone,
    monthly_reminders_enabled,
    reminder_frequency,
    tone_preference,
  } = body;

  const upsertData: Record<string, unknown> = {
    company_id: companyId,
  };

  if (auto_approve_emails !== undefined) upsertData.auto_approve_emails = auto_approve_emails;
  if (preferred_send_time !== undefined) upsertData.preferred_send_time = preferred_send_time;
  if (timezone !== undefined) upsertData.timezone = timezone;
  if (monthly_reminders_enabled !== undefined) upsertData.monthly_reminders_enabled = monthly_reminders_enabled;
  if (reminder_frequency !== undefined) upsertData.reminder_frequency = reminder_frequency;
  if (tone_preference !== undefined) upsertData.tone_preference = tone_preference;

  const { error: upsertError } = await ctx.admin
    .from("automation_settings")
    .upsert(upsertData, { onConflict: "company_id" });

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;
  const body = await req.json();
  const { trigger_id, is_active } = body;

  if (!trigger_id || is_active === undefined) {
    return NextResponse.json(
      { error: "Missing trigger_id or is_active" },
      { status: 400 }
    );
  }

  const { error: updateError } = await ctx.admin
    .from("email_automation_triggers")
    .update({ is_active })
    .eq("id", trigger_id)
    .eq("company_id", companyId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update trigger" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
