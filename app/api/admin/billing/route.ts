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

    const [customerRes, teamRes] = await Promise.all([
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid)
        .eq("role", "customer"),

      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid)
        .in("role", ["contractor", "contractor_owner"]),
    ]);

    return NextResponse.json({
      customerCount: customerRes.count ?? 0,
      teamCount: teamRes.count ?? 0,
    });
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json(
      { error: "Failed to load billing data" },
      { status: 500 }
    );
  }
}
