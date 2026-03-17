import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const platform = String(body.platform || "").trim();
    const reviewUrl = String(body.reviewUrl || "").trim();

    if (!platform || !reviewUrl) {
      return NextResponse.json(
        { error: "Platform and review URL are required." },
        { status: 400 }
      );
    }

    const { error } = await admin.from("reviews").insert({
      company_id: profile.company_id!,
      profile_id: profile.id,
      rating: 5,
      comment: `Platform: ${platform}\nReview URL: ${reviewUrl}`,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to submit review: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
