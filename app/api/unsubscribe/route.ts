import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public unsubscribe API — no auth required, uses unsubscribe_token.
 *
 * GET  ?token=xxx           → returns current preferences for the token
 * POST { token, action }    → "unsubscribe_all" | "resubscribe" | "update_preferences"
 */

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: prefs, error } = await admin
    .from("email_preferences")
    .select("opt_out, reminders_enabled, reward_suggestions_enabled, referral_nudges_enabled, milestone_emails_enabled, promotional_emails_enabled")
    .eq("unsubscribe_token", token)
    .single();

  if (error || !prefs) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  return NextResponse.json({ preferences: prefs });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token as string | undefined;
  const action = body.action as string | undefined;

  if (!token || !action) {
    return NextResponse.json({ error: "Missing token or action" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify token exists
  const { data: existing, error: lookupError } = await admin
    .from("email_preferences")
    .select("id")
    .eq("unsubscribe_token", token)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (action === "unsubscribe_all") {
    const { error } = await admin
      .from("email_preferences")
      .update({
        opt_out: true,
        reminders_enabled: false,
        reward_suggestions_enabled: false,
        referral_nudges_enabled: false,
        milestone_emails_enabled: false,
        promotional_emails_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", token);

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "You have been unsubscribed from all engagement emails." });
  }

  if (action === "resubscribe") {
    const { error } = await admin
      .from("email_preferences")
      .update({
        opt_out: false,
        reminders_enabled: true,
        reward_suggestions_enabled: true,
        referral_nudges_enabled: true,
        milestone_emails_enabled: true,
        promotional_emails_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", token);

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "You have been resubscribed to all engagement emails." });
  }

  if (action === "update_preferences") {
    const prefs = body.preferences as Record<string, boolean> | undefined;
    if (!prefs) {
      return NextResponse.json({ error: "Missing preferences" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedKeys = [
      "reminders_enabled",
      "reward_suggestions_enabled",
      "referral_nudges_enabled",
      "milestone_emails_enabled",
      "promotional_emails_enabled",
    ];

    for (const key of allowedKeys) {
      if (typeof prefs[key] === "boolean") {
        updates[key] = prefs[key];
      }
    }

    // If all engagement prefs are off, set opt_out = true
    const allOff = allowedKeys.every((k) => updates[k] === false || (updates[k] === undefined && prefs[k] === false));
    updates.opt_out = allOff;

    const { error } = await admin
      .from("email_preferences")
      .update(updates)
      .eq("unsubscribe_token", token);

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
