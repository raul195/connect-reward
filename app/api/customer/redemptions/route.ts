import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const { data: redemptions } = await admin
      .from("redemptions")
      .select("*, reward:rewards(name, category, image_url)")
      .eq("user_id", profile.id)
      .eq("company_id", profile.company_id!)
      .order("created_at", { ascending: false });

    return NextResponse.json({ redemptions: redemptions ?? [] });
  } catch (error) {
    console.error("Customer redemptions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load redemptions" },
      { status: 500 }
    );
  }
}
