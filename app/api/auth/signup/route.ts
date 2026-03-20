import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const fullName = String(body.fullName || "").trim();
    const companyName = String(body.companyName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !companyName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Create auth user (auto-confirmed, skips email verification)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "business_owner",
      },
    });

    if (authError) {
      // Handle duplicate email
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Check if the handle_new_user trigger already created a profile
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      // Trigger already created it — update with correct data
      await admin
        .from("profiles")
        .update({
          full_name: fullName,
          email,
          role: "business_owner",
        })
        .eq("id", userId);
    } else {
      // Trigger didn't fire — create profile explicitly
      const { error: profileError } = await admin
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          email,
          role: "business_owner",
        });

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        return NextResponse.json(
          { error: "Failed to create profile." },
          { status: 500 }
        );
      }
    }

    // 3. Create company
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
        settings: {},
      })
      .select()
      .single();

    if (companyError) {
      console.error("Company creation failed:", companyError);
      return NextResponse.json(
        { error: "Failed to create company." },
        { status: 500 }
      );
    }

    // 4. Link profile to company
    await admin
      .from("profiles")
      .update({ company_id: company.id })
      .eq("id", userId);

    // 5. Seed automation triggers
    const triggerTypes = [
      "inactivity_30", "inactivity_60", "points_close_to_reward",
      "referral_nudge", "milestone_reached", "program_reminder",
    ];
    const { error: triggerError } = await admin
      .from("email_automation_triggers")
      .insert(triggerTypes.map((t) => ({
        company_id: company.id,
        trigger_type: t,
        is_active: true,
        condition_data: {},
      })));
    if (triggerError) console.error("Trigger seed failed:", triggerError.message);

    // 6. Create default automation settings
    const { error: settingsError } = await admin
      .from("automation_settings")
      .insert({
        company_id: company.id,
        auto_approve_emails: false,
        preferred_send_time: "10:00",
        timezone: "America/New_York",
        monthly_reminders_enabled: true,
        reminder_frequency: "monthly",
        tone_preference: "friendly",
      });
    if (settingsError) console.error("Automation settings seed failed:", settingsError.message);

    // 7. Send welcome email to business owner
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
    try {
      const emailResult = await sendTransactionalEmail({
        template: "business_welcome",
        to: email,
        props: {
          ownerName: fullName,
          businessName: companyName,
          dashboardUrl: `${baseUrl}/admin`,
          companyName: "Connect Reward",
          logoUrl: null,
          primaryColor: "#0D9488",
        },
        companyId: company.id,
        customerId: userId,
        preferences: null,
        adminClient: admin,
      });
      console.log("Welcome email result:", JSON.stringify(emailResult));
    } catch (err) {
      console.error("Welcome email failed:", err);
    }

    // 8. Notify super admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.emails.send({
        from: "Connect Reward <notifications@connectreward.io>",
        to: adminEmail,
        subject: `New Business Signup: ${companyName}`,
        text: `A new business just signed up for Connect Reward!\n\nBusiness: ${companyName}\nOwner: ${fullName}\nEmail: ${email}\nPlan: Free\nTime: ${new Date().toLocaleString()}\n\nLog in to your super-admin dashboard to view: ${baseUrl}/super-admin`,
      }).catch((err) => console.error("Admin notification failed:", err));
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
