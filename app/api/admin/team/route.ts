import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    const { data: members } = await admin
      .from("profiles")
      .select("*")
      .eq("company_id", cid)
      .in("role", ["business", "business_owner", "super_admin"])
      .order("created_at", { ascending: true });

    return NextResponse.json({ members: members ?? [] });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json(
      { error: "Failed to load team members" },
      { status: 500 }
    );
  }
}
