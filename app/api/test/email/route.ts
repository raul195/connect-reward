import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import { getPointsToNextTier, calculateTierFromPoints } from "@/lib/points";

/**
 * Test endpoint for transactional emails.
 * Only available in development mode.
 *
 * Usage:
 *   GET /api/test/email?template=welcome&to=you@example.com
 *   GET /api/test/email?template=all&to=you@example.com
 *
 * Templates: welcome, referral_status, points_earned, reward_redeemed, all
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") || "all";
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { error: "Missing ?to= query param (your email address)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Fake branding for testing
  const branding = {
    companyName: "Test Solar Co",
    logoUrl: null,
    primaryColor: "#6366f1",
  };

  // Use a dummy company/customer ID for logging
  // Fetch a real company if one exists, otherwise use a placeholder
  const { data: company } = await admin
    .from("companies")
    .select("id")
    .limit(1)
    .single();

  const companyId = company?.id ?? "00000000-0000-0000-0000-000000000000";

  const results: Record<string, unknown> = {};
  const templates = template === "all"
    ? ["welcome", "referral_status", "points_earned", "reward_redeemed"] as const
    : [template as "welcome" | "referral_status" | "points_earned" | "reward_redeemed"];

  for (const t of templates) {
    switch (t) {
      case "welcome":
        results.welcome = await sendTransactionalEmail({
          template: "welcome",
          to,
          props: {
            customerName: "Jane Doe",
            dashboardUrl: `${baseUrl}/dashboard`,
            ...branding,
          },
          companyId,
          customerId: null,
          preferences: null,
          adminClient: admin,
        });
        break;

      case "referral_status":
        results.referral_status = await sendTransactionalEmail({
          template: "referral_status",
          to,
          props: {
            customerName: "Jane Doe",
            referralName: "John Smith",
            newStatus: "consultation_scheduled",
            currentPoints: 1500,
            dashboardUrl: `${baseUrl}/dashboard`,
            ...branding,
          },
          companyId,
          customerId: null,
          preferences: null,
          adminClient: admin,
        });
        break;

      case "points_earned": {
        const tierProgress = getPointsToNextTier(1500);
        results.points_earned = await sendTransactionalEmail({
          template: "points_earned",
          to,
          props: {
            customerName: "Jane Doe",
            pointsEarned: 500,
            reason: "Referral completed: John Smith",
            totalPoints: 1500,
            tier: calculateTierFromPoints(1500),
            nextTier: tierProgress?.nextTier ?? null,
            pointsToNextTier: tierProgress?.pointsNeeded ?? null,
            rewardsUrl: `${baseUrl}/dashboard/rewards`,
            ...branding,
          },
          companyId,
          customerId: null,
          preferences: null,
          adminClient: admin,
        });
        break;
      }

      case "reward_redeemed":
        results.reward_redeemed = await sendTransactionalEmail({
          template: "reward_redeemed",
          to,
          props: {
            customerName: "Jane Doe",
            rewardName: "$50 Amazon Gift Card",
            pointsSpent: 2000,
            remainingBalance: 500,
            dashboardUrl: `${baseUrl}/dashboard`,
            ...branding,
          },
          companyId,
          customerId: null,
          preferences: null,
          adminClient: admin,
        });
        break;

      default:
        results[t] = { error: `Unknown template: ${t}` };
    }
  }

  return NextResponse.json({
    message: `Sent ${Object.keys(results).length} test email(s) to ${to}`,
    results,
  });
}
