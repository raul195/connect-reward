import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    // 1. Get the authenticated user from session cookies
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const companyName = String(body.companyName || "").trim();
    const fullName = String(body.fullName || "").trim();

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 2. Check if profile already has a company (idempotent)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile?.company_id) {
      return NextResponse.json({ success: true });
    }

    // 3. Ensure profile exists with correct data
    if (existingProfile) {
      await admin.from("profiles")
        .update({ full_name: fullName || user.email, email: user.email!, role: "business_owner" })
        .eq("id", user.id);
    } else {
      await admin.from("profiles").insert({
        id: user.id,
        full_name: fullName || user.email,
        email: user.email!,
        role: "business_owner",
      });
    }

    // 4. Create company
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({
        name: companyName,
        slug,
        plan_tier: "free",
        onboarding_completed: false,
        is_active: true,
        settings: {},
      })
      .select()
      .single();

    if (companyError) {
      console.error("Company creation failed:", JSON.stringify(companyError));
      return NextResponse.json({ error: "Failed to create company: " + companyError.message }, { status: 500 });
    }

    // 5. Link profile to company
    await admin.from("profiles").update({ company_id: company.id }).eq("id", user.id);

    // 6. Seed automation triggers
    const triggerTypes = ["inactivity_30", "inactivity_60", "points_close_to_reward", "referral_nudge", "milestone_reached", "program_reminder"];
    await admin.from("email_automation_triggers").insert(
      triggerTypes.map((t) => ({ company_id: company.id, trigger_type: t, is_active: true, condition_data: {} }))
    );

    // 7. Seed automation settings
    await admin.from("automation_settings").insert({
      company_id: company.id, auto_approve_emails: false, preferred_send_time: "10:00",
      timezone: "America/New_York", monthly_reminders_enabled: true, reminder_frequency: "monthly", tone_preference: "friendly",
    });

    // 8. Send welcome email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
    sendTransactionalEmail({
      template: "business_welcome", to: user.email!,
      props: { ownerName: fullName || "there", businessName: companyName, dashboardUrl: `${baseUrl}/admin`, companyName: "Connect Reward", logoUrl: null, primaryColor: "#0D9488" },
      companyId: company.id, customerId: user.id, preferences: null, adminClient: admin,
    }).catch((err) => console.error("Welcome email failed:", err));

    // 9. Notify super admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      new Resend(process.env.RESEND_API_KEY).emails.send({
        from: "Connect Reward <notifications@connectreward.io>", to: adminEmail,
        subject: `New Business Signup: ${companyName}`,
        text: `New signup!\n\nBusiness: ${companyName}\nOwner: ${fullName}\nEmail: ${user.email}\nPlan: Free\n\n${baseUrl}/super-admin`,
      }).catch((err) => console.error("Admin notification failed:", err));
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Setup company error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
