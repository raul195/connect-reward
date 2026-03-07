import { NextResponse } from "next/server";
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

  // Demo accounts always get "pro" plan so all features are visible
  if (company && isDemoAccount(profile.email)) {
    company.plan_tier = "pro";
  }

  return NextResponse.json({ company });
}
