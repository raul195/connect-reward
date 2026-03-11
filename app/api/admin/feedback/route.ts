import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    // Check if this profile has already submitted feedback
    const { count } = await admin
      .from("feedback_responses")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id);

    return NextResponse.json({ submitted: (count ?? 0) > 0 });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json(
      { error: "Failed to check feedback status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const body = await request.json();

    const { rating, improvements, likes } = body;

    // Validate rating
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { error } = await admin.from("feedback_responses").insert({
      company_id: cid,
      profile_id: profile.id,
      rating,
      improvements: improvements?.slice(0, 2000) || null,
      likes: likes?.slice(0, 2000) || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
