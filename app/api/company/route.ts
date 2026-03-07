import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

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

  return NextResponse.json({ company });
}
