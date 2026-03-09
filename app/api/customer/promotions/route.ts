import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { getActivePromotion } from "@/lib/promotions";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    if (!profile.company_id) {
      return NextResponse.json({ promotion: null });
    }

    const promotion = await getActivePromotion(profile.company_id, admin);

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Customer promotions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load promotion" },
      { status: 500 }
    );
  }
}
