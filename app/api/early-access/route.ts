import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, notifyAdmin } from "@/lib/email/send";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, isValidEmail } from "@/lib/validation";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { allowed } = rateLimit(`early-access:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();

    const {
      full_name, email, phone,
      company_name, industry, industry_other, company_size, website,
      current_referral_method, current_referral_method_other, monthly_referral_volume,
      biggest_challenge, desired_plan, how_did_you_hear,
      utm_source, utm_medium, utm_campaign,
    } = body;

    // Validate required fields
    if (!full_name?.trim() || !email?.trim() || !company_name?.trim() || !industry || !company_size) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Validate enum values
    const validIndustries = ["solar", "roofing", "hvac", "windows", "turf", "pest_control", "other"];
    const validSizes = ["solo", "2-5", "6-15", "16-50", "50+"];
    if (!validIndustries.includes(industry) || !validSizes.includes(company_size)) {
      return NextResponse.json({ error: "Invalid selection." }, { status: 400 });
    }

    // Email validation
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Check for duplicate email
    const { data: existing } = await supabaseAdmin
      .from("early_access_applications")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        error: "duplicate",
        message: "Looks like you've already applied! We'll be in touch soon. If you haven't heard from us, email hello@connectreward.com",
      }, { status: 409 });
    }

    // Insert application (sanitize all text inputs)
    const { error: insertError } = await supabaseAdmin
      .from("early_access_applications")
      .insert({
        full_name: sanitizeText(full_name),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company_name: sanitizeText(company_name),
        industry,
        industry_other: industry_other ? sanitizeText(industry_other) : null,
        company_size,
        website: website?.trim() || null,
        current_referral_method: current_referral_method || null,
        current_referral_method_other: current_referral_method_other ? sanitizeText(current_referral_method_other) : null,
        monthly_referral_volume: monthly_referral_volume || null,
        biggest_challenge: biggest_challenge ? sanitizeText(biggest_challenge).slice(0, 500) : null,
        desired_plan: desired_plan || null,
        how_did_you_hear: how_did_you_hear ? sanitizeText(how_did_you_hear).slice(0, 200) : null,
        utm_source: utm_source?.slice(0, 100) || null,
        utm_medium: utm_medium?.slice(0, 100) || null,
        utm_campaign: utm_campaign?.slice(0, 100) || null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
    }

    // Send confirmation email to applicant (non-blocking)
    sendEmail({
      to: email.trim().toLowerCase(),
      subject: "We got your application! — Connect Reward",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A202C;">
          <h2 style="color: #0D9488;">Hi ${full_name.trim()},</h2>
          <p>Thanks for applying for early access to Connect Reward!</p>
          <p>We're reviewing applications and onboarding contractors in batches. Here's what happens next:</p>
          <ol>
            <li><strong>We review your application</strong> (usually within 48 hours)</li>
            <li><strong>We'll reach out</strong> to learn more about your business</li>
            <li><strong>Once approved</strong>, you'll get full access to set up your referral rewards program</li>
          </ol>
          <p>In the meantime, if you have any questions, reply to this email — we'd love to hear from you.</p>
          <p style="margin-top: 32px; color: #64748B;">— The Connect Reward Team</p>
        </div>
      `,
    });

    // Send alert email to admin (non-blocking)
    const industryLabel: Record<string, string> = {
      solar: "Solar", roofing: "Roofing", hvac: "HVAC", windows: "Windows",
      turf: "Turf", pest_control: "Pest Control", other: industry_other || "Other",
    };
    const planLabel: Record<string, string> = {
      free: "Free ($0)", starter: "Starter ($149/mo)", growth: "Growth ($299/mo)",
      pro: "Pro ($499/mo)", not_sure: "Not sure yet",
    };
    const methodLabel: Record<string, string> = {
      none: "No referral program", cash_bonuses: "Cash bonuses", gift_cards: "Gift cards",
      referral_software: "Referral software", word_of_mouth: "Word of mouth",
      other: current_referral_method_other || "Other",
    };

    notifyAdmin(
      `🚀 New Early Access Application: ${company_name} (${industryLabel[industry] || industry})`,
      `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A202C;">
          <h2 style="color: #0D9488;">New application received!</h2>
          <h3>Contact</h3>
          <p>
            <strong>Name:</strong> ${full_name}<br/>
            <strong>Email:</strong> ${email}<br/>
            <strong>Phone:</strong> ${phone || "—"}
          </p>
          <h3>Business</h3>
          <p>
            <strong>Company:</strong> ${company_name}<br/>
            <strong>Industry:</strong> ${industryLabel[industry] || industry}<br/>
            <strong>Size:</strong> ${company_size}<br/>
            <strong>Website:</strong> ${website || "—"}
          </p>
          <h3>Referral Info</h3>
          <p>
            <strong>Current method:</strong> ${current_referral_method ? (methodLabel[current_referral_method] || current_referral_method) : "—"}<br/>
            <strong>Monthly volume:</strong> ${monthly_referral_volume || "—"}<br/>
            <strong>Biggest challenge:</strong> ${biggest_challenge || "—"}
          </p>
          <h3>Interest</h3>
          <p>
            <strong>Desired plan:</strong> ${desired_plan ? (planLabel[desired_plan] || desired_plan) : "—"}<br/>
            <strong>How they heard about us:</strong> ${how_did_you_hear || "—"}
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #E2E8F0;" />
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/super-admin/applications" style="color: #0D9488;">View in dashboard →</a></p>
        </div>
      `,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Early access API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
