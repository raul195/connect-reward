import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";

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

  // Send reward redeemed email to customer (fire-and-forget)
  const { data: companyData } = await admin
    .from("companies")
    .select("name, logo_url, settings")
    .eq("id", profile.company_id!)
    .single();

  const settings = (companyData?.settings ?? {}) as Record<string, unknown>;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

  if (companyData) {
    sendTransactionalEmail({
      template: "reward_redeemed",
      to: profile.email,
      props: {
        customerName: profile.full_name,
        rewardName: reward.name,
        pointsSpent: reward.points_required,
        remainingBalance: profile.total_points - reward.points_required,
        dashboardUrl: `${baseUrl}/dashboard`,
        companyName: companyData.name,
        logoUrl: companyData.logo_url,
        primaryColor: (settings.brandColor as string) || "#0D9488",
      },
      companyId: profile.company_id!,
      customerId: profile.id,
      preferences: profile.notification_preferences,
      adminClient: admin,
    }).catch((err) => console.error("Email send failed:", err));
  }

  // Send notification email to business owner (all plans)
  const { data: businessOwner } = await admin
    .from("profiles")
    .select("id, email, notification_preferences")
    .eq("company_id", profile.company_id!)
    .in("role", ["business_owner", "business"])
    .limit(1)
    .single();

  if (businessOwner && companyData) {
    const dollarValue = (reward.points_required / 100).toFixed(2);
    sendTransactionalEmail({
      template: "redemption_requested",
      to: businessOwner.email,
      props: {
        customerName: profile.full_name,
        rewardName: reward.name,
        pointsSpent: reward.points_required,
        dollarValue,
        dashboardUrl: `${baseUrl}/admin/rewards`,
        companyName: companyData.name,
        logoUrl: companyData.logo_url,
        primaryColor: (settings.brandColor as string) || "#0D9488",
      },
      companyId: profile.company_id!,
      customerId: null,
      preferences: businessOwner.notification_preferences,
      adminClient: admin,
    }).catch((err) => console.error("Email send failed:", err));
  }

  return NextResponse.json({ success: true });
}
