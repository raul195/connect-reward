import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { user, profile, admin } = result.ctx;

  // Total referrals
  const { count: totalReferrals } = await admin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", user.id);

  // Completed referrals
  const { count: completedReferrals } = await admin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", user.id)
    .eq("status", "installation_complete");

  // Total redeemed: sum of negative point transactions (redemptions)
  const { data: redemptionTx } = await admin
    .from("point_transactions")
    .select("amount")
    .eq("user_id", profile.id)
    .eq("type", "redemption");

  const totalRedeemed = Math.abs(
    (redemptionTx ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)
  );

  return NextResponse.json({
    profile,
    stats: {
      totalReferrals: totalReferrals ?? 0,
      completedReferrals: completedReferrals ?? 0,
      totalRedeemed,
    },
  });
}

export async function PUT(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Update notification preferences
  if (body.notification_preferences !== undefined) {
    const { error } = await admin
      .from("profiles")
      .update({
        notification_preferences: body.notification_preferences,
      })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update notification preferences: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  // Update profile fields (full_name, phone)
  const updates: Record<string, unknown> = {};

  if (body.full_name !== undefined) {
    updates.full_name = String(body.full_name).trim();
  }
  if (body.phone !== undefined) {
    updates.phone = String(body.phone).trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update profile: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
