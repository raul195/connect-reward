import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET — validate token and return customer info
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, company_id, activation_token_expires")
    .eq("activation_token", token)
    .eq("role", "customer")
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Invalid or expired activation link" }, { status: 404 });
  }

  // Check expiry
  if (profile.activation_token_expires && new Date(profile.activation_token_expires) < new Date()) {
    return NextResponse.json({ error: "This activation link has expired. Please contact your business to request a new one." }, { status: 410 });
  }

  // Get company info for branding
  const { data: company } = await admin
    .from("companies")
    .select("name, logo_url, settings")
    .eq("id", profile.company_id)
    .single();

  return NextResponse.json({
    email: profile.email,
    fullName: profile.full_name,
    companyName: company?.name || "Connect Reward",
    companyLogo: company?.logo_url || null,
    primaryColor: ((company?.settings as Record<string, unknown>)?.brandColor as string) || "#0D9488",
  });
}

// POST — create password and activate the customer account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Find the profile by token
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, activation_token_expires")
      .eq("activation_token", token)
      .eq("role", "customer")
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Invalid or expired activation link" }, { status: 404 });
    }

    // Check expiry
    if (profile.activation_token_expires && new Date(profile.activation_token_expires) < new Date()) {
      return NextResponse.json({ error: "This activation link has expired" }, { status: 410 });
    }

    // Update the auth user's password
    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password,
    });

    if (updateError) {
      return NextResponse.json({ error: "Failed to set password: " + updateError.message }, { status: 500 });
    }

    // Invalidate the token (single-use)
    await admin
      .from("profiles")
      .update({ activation_token: null, activation_token_expires: null })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, email: profile.email });
  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
