import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoAccount } from "@/lib/demo";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ profile: null, company: null }, { status: 401 });
  }

  // Use admin client to bypass RLS recursion on profiles
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch company in the same request (eliminates a round trip)
  let company = null;
  if (profile?.company_id) {
    const { data: companyData } = await admin
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();

    company = companyData;

    // Demo accounts always get "beta" plan so all features are visible
    if (company && isDemoAccount(profile.email)) {
      company.plan_tier = "beta";
    }
  }

  return NextResponse.json({ profile, company });
}
