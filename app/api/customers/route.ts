import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAtLimit } from "@/lib/plan-limits";
import {
  sanitizeText,
  isValidEmail,
  isValidPhone,
  isValidZipCode,
} from "@/lib/validation";
import type { PlanTier } from "@/lib/types";

export async function POST(request: NextRequest) {
  // 1. Authenticate the caller via session cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Verify the caller is a contractor/super_admin with a company
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (
    !callerProfile?.company_id ||
    !["contractor", "super_admin"].includes(callerProfile.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = callerProfile.company_id;

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
  const { data: company } = await supabase
    .from("companies")
    .select("plan")
    .eq("id", companyId)
    .single();

  const plan: PlanTier = company?.plan ?? "free";

  const { count: currentCustomers } = await supabase
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

  // 5. Create the auth user via admin API (service role key)
  const admin = createAdminClient();

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

  // 6. Update the auto-created profile with company_id and extra fields
  //    The handle_new_user trigger already created a profile row.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      company_id: companyId,
      phone,
      address,
      city,
      state,
      zip,
    })
    .eq("id", newUser.user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "User created but profile update failed: " + updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: newUser.user.id }, { status: 201 });
}
