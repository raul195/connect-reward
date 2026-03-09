import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { ensureEmailPreferences } from "@/lib/email/ensureEmailPreferences";

export async function GET() {
  const { ctx, error } = await getAuthContext();
  if (error) return error;

  const prefs = await ensureEmailPreferences(ctx.profile.id, ctx.admin);

  return NextResponse.json({ preferences: prefs });
}

export async function PUT(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ensure row exists first
  await ensureEmailPreferences(ctx.profile.id, ctx.admin);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const allowedKeys = [
    "reminders_enabled",
    "reward_suggestions_enabled",
    "referral_nudges_enabled",
    "milestone_emails_enabled",
    "promotional_emails_enabled",
  ];

  for (const key of allowedKeys) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key];
    }
  }

  // Handle opt_out explicitly or derive from all-off state
  if (typeof body.opt_out === "boolean") {
    updates.opt_out = body.opt_out;
    if (body.opt_out) {
      // Unsubscribe all
      for (const key of allowedKeys) {
        updates[key] = false;
      }
    }
  } else {
    // Auto-derive opt_out from individual prefs
    const allOff = allowedKeys.every((k) =>
      updates[k] !== undefined ? updates[k] === false : body[k] === false
    );
    updates.opt_out = allOff;
  }

  const { error: updateError } = await ctx.admin
    .from("email_preferences")
    .update(updates)
    .eq("customer_id", ctx.profile.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update email preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
