import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

/** GET — list configured review links for the customer's business */
export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  if (!profile.company_id) {
    return NextResponse.json({ data: [] });
  }

  const { data: links } = await admin
    .from("business_review_links")
    .select("platform, url, label, display_order")
    .eq("business_id", profile.company_id)
    .order("display_order", { ascending: true });

  return NextResponse.json({ data: links ?? [] });
}
