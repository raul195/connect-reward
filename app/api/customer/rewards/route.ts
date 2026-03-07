import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const { data: rewards } = await admin
    .from("rewards")
    .select("*")
    .eq("company_id", profile.company_id!)
    .eq("is_active", true)
    .order("points_required", { ascending: true });

  return NextResponse.json({ rewards: rewards ?? [] });
}

export async function POST(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rewardId = String(body.rewardId || "");
  if (!rewardId) {
    return NextResponse.json(
      { error: "rewardId is required." },
      { status: 400 }
    );
  }

  // Fetch the reward
  const { data: reward } = await admin
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("company_id", profile.company_id!)
    .eq("is_active", true)
    .single();

  if (!reward) {
    return NextResponse.json(
      { error: "Reward not found or unavailable." },
      { status: 404 }
    );
  }

  // Check user has enough points
  if (profile.total_points < reward.points_required) {
    return NextResponse.json(
      { error: "Insufficient points." },
      { status: 400 }
    );
  }

  // Insert redemption
  const { error: redemptionError } = await admin.from("redemptions").insert({
    user_id: profile.id,
    reward_id: rewardId,
    company_id: profile.company_id!,
    status: "pending",
    points_spent: reward.points_required,
  });

  if (redemptionError) {
    return NextResponse.json(
      { error: "Failed to create redemption: " + redemptionError.message },
      { status: 500 }
    );
  }

  // Insert negative point transaction
  const { error: txError } = await admin.from("point_transactions").insert({
    user_id: profile.id,
    company_id: profile.company_id!,
    amount: -reward.points_required,
    type: "redemption",
    description: `Redeemed: ${reward.name}`,
  });

  if (txError) {
    return NextResponse.json(
      { error: "Redemption created but point transaction failed: " + txError.message },
      { status: 500 }
    );
  }

  // Update profile total_points
  const { error: updateError } = await admin
    .from("profiles")
    .update({ total_points: profile.total_points - reward.points_required })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Points deducted but profile update failed: " + updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
