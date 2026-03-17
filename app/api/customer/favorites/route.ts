import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const { data: favorites } = await admin
      .from("customer_favorites")
      .select("reward_id")
      .eq("customer_id", profile.id);

    return NextResponse.json({
      favoriteIds: (favorites ?? []).map((f: { reward_id: string }) => f.reward_id),
    });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { error: "Failed to load favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const body = await request.json();
    const rewardId = String(body.rewardId || "");

    if (!rewardId) {
      return NextResponse.json(
        { error: "rewardId is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const { data: existing } = await admin
      .from("customer_favorites")
      .select("id")
      .eq("customer_id", profile.id)
      .eq("reward_id", rewardId)
      .maybeSingle();

    if (existing) {
      // Unfavorite
      await admin
        .from("customer_favorites")
        .delete()
        .eq("id", existing.id);

      return NextResponse.json({ favorited: false });
    } else {
      // Favorite
      await admin.from("customer_favorites").insert({
        customer_id: profile.id,
        reward_id: rewardId,
      });

      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 }
    );
  }
}
