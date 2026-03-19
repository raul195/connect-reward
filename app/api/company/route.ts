import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { isDemoAccount } from "@/lib/demo";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  if (!profile.company_id) {
    return NextResponse.json({ company: null });
  }

  const { data: company } = await admin
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  // Demo accounts always get "beta" plan so all features are visible
  if (company && isDemoAccount(profile.email)) {
    company.plan_tier = "beta";
  }

  return NextResponse.json({ company });
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    // Don't create if user already has a company
    if (profile.company_id) {
      return NextResponse.json({ error: "You already have a company" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // Generate slug from company name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    // Create company
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({
        name,
        slug,
        plan_tier: "free",
        onboarding_completed: false,
        settings: {},
      })
      .select()
      .single();

    if (companyError) {
      console.error("Company creation error:", companyError);
      return NextResponse.json(
        { error: "Failed to create company: " + companyError.message },
        { status: 500 }
      );
    }

    // Link profile to company
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        company_id: company.id,
        role: "business_owner",
        full_name: profile.full_name || "Business Owner",
      })
      .eq("id", profile.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { error: "Company created but failed to link profile" },
        { status: 500 }
      );
    }

    // Seed default automation triggers for the new company
    const triggerTypes = [
      "inactivity_30", "inactivity_60", "points_close_to_reward",
      "referral_nudge", "milestone_reached", "program_reminder",
    ];
    const triggerRows = triggerTypes.map((t) => ({
      company_id: company.id,
      trigger_type: t,
      is_active: true,
      condition_data: {},
    }));
    const { error: triggerError } = await admin.from("email_automation_triggers").insert(triggerRows);
    if (triggerError) console.error("Trigger seed failed:", triggerError.message);

    // Create default automation settings
    const { error: settingsError } = await admin.from("automation_settings").insert({
      company_id: company.id,
      auto_approve_emails: false,
      preferred_send_time: "10:00",
      timezone: "America/New_York",
      monthly_reminders_enabled: true,
      reminder_frequency: "monthly",
      tone_preference: "friendly",
    });
    if (settingsError) console.error("Automation settings seed failed:", settingsError.message);

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("Company POST error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
