import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { DRIP_DEFAULTS } from "@/lib/drip-defaults";
import type { AutomationTriggerType } from "@/lib/types";

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

  // ── Mode 1: Toggle trigger active/inactive ──
  if (body.trigger_id && body.is_active !== undefined) {
    const { error: updateError } = await ctx.admin
      .from("email_automation_triggers")
      .update({ is_active: body.is_active })
      .eq("id", body.trigger_id)
      .eq("company_id", companyId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update trigger" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  }

  // ── Mode 3: Reset to default ──
  if (body.trigger_type && body.reset_to_default === true) {
    const triggerType = body.trigger_type as AutomationTriggerType;
    const config = DRIP_DEFAULTS[triggerType];
    if (!config) {
      return NextResponse.json(
        { error: "No configurable defaults for this trigger type" },
        { status: 400 }
      );
    }

    const defaults = { [config.field]: config.defaultValue };
    const { error: resetError } = await ctx.admin
      .from("email_automation_triggers")
      .update({ condition_data: defaults })
      .eq("company_id", companyId)
      .eq("trigger_type", triggerType);

    if (resetError) {
      return NextResponse.json(
        { error: "Failed to reset trigger defaults" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, defaults });
  }

  // ── Mode 2: Save drip condition_data ──
  if (body.trigger_type && body.condition_data) {
    const triggerType = body.trigger_type as AutomationTriggerType;
    const config = DRIP_DEFAULTS[triggerType];
    if (!config) {
      return NextResponse.json(
        { error: "No configurable defaults for this trigger type" },
        { status: 400 }
      );
    }

    const value = body.condition_data[config.field];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return NextResponse.json(
        { error: `${config.field} must be an integer` },
        { status: 400 }
      );
    }

    if (value < config.min || value > config.max) {
      return NextResponse.json(
        { error: `${config.field} must be between ${config.min} and ${config.max}` },
        { status: 400 }
      );
    }

    // Cross-validation: inactivity_30 < inactivity_60
    if (triggerType === "inactivity_30" || triggerType === "inactivity_60") {
      const otherType = triggerType === "inactivity_30" ? "inactivity_60" : "inactivity_30";
      const { data: otherTrigger } = await ctx.admin
        .from("email_automation_triggers")
        .select("condition_data")
        .eq("company_id", companyId)
        .eq("trigger_type", otherType)
        .single();

      const otherConfig = DRIP_DEFAULTS[otherType]!;
      const otherData = (otherTrigger?.condition_data || {}) as Record<string, unknown>;
      const otherValue = typeof otherData[otherConfig.field] === "number"
        ? (otherData[otherConfig.field] as number)
        : otherConfig.defaultValue;

      if (triggerType === "inactivity_30" && value >= otherValue) {
        return NextResponse.json(
          { error: `Must be less than the 60-day inactivity value (${otherValue})` },
          { status: 400 }
        );
      }
      if (triggerType === "inactivity_60" && value <= otherValue) {
        return NextResponse.json(
          { error: `Must be greater than the 30-day inactivity value (${otherValue})` },
          { status: 400 }
        );
      }
    }

    const { error: saveError } = await ctx.admin
      .from("email_automation_triggers")
      .update({ condition_data: body.condition_data })
      .eq("company_id", companyId)
      .eq("trigger_type", triggerType);

    if (saveError) {
      return NextResponse.json(
        { error: "Failed to save drip settings" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Invalid request body" },
    { status: 400 }
  );
}
