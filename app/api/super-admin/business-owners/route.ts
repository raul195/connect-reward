import { NextResponse } from "next/server";
import { getAuthContext, requireSuperAdmin } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    const { data: owners } = await admin
      .from("profiles")
      .select("id, email, full_name, company_id")
      .in("role", ["business_owner", "business"])
      .not("company_id", "is", null);

    return NextResponse.json({ owners: owners ?? [] });
  } catch (error) {
    console.error("Business owners GET error:", error);
    return NextResponse.json({ error: "Failed to load owners" }, { status: 500 });
  }
}
