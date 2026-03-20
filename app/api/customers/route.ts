import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { isAtLimit } from "@/lib/plan-limits";
import {
  sanitizeText,
  isValidEmail,
  isValidPhone,
  isValidZipCode,
} from "@/lib/validation";
import type { PlanTier } from "@/lib/types";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";

export async function POST(request: NextRequest) {
  // 1. Authenticate via getAuthContext (uses admin client, avoids RLS issues)
  const authResult = await getAuthContext();
  if (authResult.error) return authResult.error;
  const { profile: callerProfile, admin } = authResult.ctx;

  const forbidden = requireAdmin(callerProfile);
  if (forbidden) return forbidden;

  const companyId = callerProfile.company_id!;

  // 3. Parse and validate input
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fullName = sanitizeText(String(body.full_name || ""));
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\D/g, "");
  const address = body.address ? sanitizeText(String(body.address)) : null;
  const city = body.city ? sanitizeText(String(body.city)) : null;
  const state = body.state ? sanitizeText(String(body.state)) : null;
  const zip = body.zip ? String(body.zip).trim() : null;

  if (!fullName || !email || !phone) {
    return NextResponse.json(
      { error: "Full name, email, and phone are required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email format." },
      { status: 400 }
    );
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Phone must be 10 digits." },
      { status: 400 }
    );
  }
  if (zip && !isValidZipCode(zip)) {
    return NextResponse.json(
      { error: "Zip code must be 5 digits." },
      { status: 400 }
    );
  }

  // 4. Check plan limits
  const { data: company } = await admin
    .from("companies")
    .select("plan_tier")
    .eq("id", companyId)
    .single();

  const plan: PlanTier = company?.plan_tier ?? "free";

  const { count: currentCustomers } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "customer");

  if (isAtLimit(plan, "customers", currentCustomers ?? 0)) {
    return NextResponse.json(
      { error: "Customer limit reached. Upgrade your plan." },
      { status: 403 }
    );
  }

  // 5. Create the auth user via admin API (service role key — admin already from auth context)

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-12),
    user_metadata: { full_name: fullName, role: "customer" },
    email_confirm: true,
  });

  if (createError) {
    return NextResponse.json(
      { error: createError.message },
      { status: 400 }
    );
  }

  // 6. Set activation token expiry and update profile
  const activationExpires = new Date();
  activationExpires.setDate(activationExpires.getDate() + 7);

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      company_id: companyId,
      phone,
      address,
      city,
      state,
      zip,
      activation_token_expires: activationExpires.toISOString(),
    })
    .eq("id", newUser.user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "User created but profile update failed: " + updateError.message },
      { status: 500 }
    );
  }

  // Get the activation token
  const { data: profileWithToken } = await admin
    .from("profiles")
    .select("activation_token")
    .eq("id", newUser.user.id)
    .single();

  // Send welcome email with activation link
  const { data: companyData } = await admin
    .from("companies")
    .select("name, logo_url, settings")
    .eq("id", companyId)
    .single();

  if (companyData) {
    const settings = (companyData.settings ?? {}) as Record<string, unknown>;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";
    const activateUrl = profileWithToken?.activation_token
      ? `${baseUrl}/activate?token=${profileWithToken.activation_token}`
      : `${baseUrl}/dashboard`;

    sendTransactionalEmail({
      template: "welcome",
      to: email,
      props: {
        customerName: fullName,
        dashboardUrl: activateUrl,
        companyName: companyData.name,
        logoUrl: companyData.logo_url,
        primaryColor: (settings.brandColor as string) || "#0D9488",
      },
      companyId,
      customerId: newUser.user.id,
      preferences: null,
      adminClient: admin,
    }).catch((err) => console.error("Email send failed:", err));
  }

  return NextResponse.json({ id: newUser.user.id }, { status: 201 });
}
