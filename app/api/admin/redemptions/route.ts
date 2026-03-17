import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import type { PlanTier } from "@/lib/types";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    const { data: redemptions } = await admin
      .from("redemptions")
      .select("*, reward:rewards(name, category, image_url), customer:profiles!redemptions_user_id_fkey(full_name, email)")
      .eq("company_id", cid)
      .order("created_at", { ascending: false });

    return NextResponse.json({ redemptions: redemptions ?? [] });
  } catch (error) {
    console.error("Redemptions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load redemptions" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const body = await request.json();
    const { id, action, reason } = body as {
      id: string;
      action: "fulfill" | "reject";
      reason?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "id and action are required" },
        { status: 400 }
      );
    }

    // Fetch the redemption with reward and customer info
    const { data: redemption } = await admin
      .from("redemptions")
      .select("*, reward:rewards(name), customer:profiles!redemptions_user_id_fkey(full_name, email, total_points, notification_preferences)")
      .eq("id", id)
      .eq("company_id", cid)
      .eq("status", "pending")
      .single();

    if (!redemption) {
      return NextResponse.json(
        { error: "Pending redemption not found" },
        { status: 404 }
      );
    }

    // Fetch company info for emails
    const { data: companyData } = await admin
      .from("companies")
      .select("name, logo_url, settings, plan_tier")
      .eq("id", cid)
      .single();

    const planTier = (companyData?.plan_tier ?? "free") as PlanTier;
    const isStarter = planTier === "starter" || planTier === "beta";
    const settings = (companyData?.settings ?? {}) as Record<string, unknown>;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

    if (action === "fulfill") {
      const { error } = await admin
        .from("redemptions")
        .update({
          status: "fulfilled",
          fulfilled_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", cid);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Send fulfillment email (Starter only)
      if (isStarter && companyData) {
        sendTransactionalEmail({
          template: "redemption_fulfilled",
          to: redemption.customer.email,
          props: {
            customerName: redemption.customer.full_name,
            rewardName: redemption.reward.name,
            dashboardUrl: `${baseUrl}/dashboard/rewards`,
            companyName: companyData.name,
            logoUrl: companyData.logo_url,
            primaryColor: (settings.brandColor as string) || "#0D9488",
          },
          companyId: cid,
          customerId: redemption.user_id,
          preferences: redemption.customer.notification_preferences,
          adminClient: admin,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      if (!reason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      // Update redemption status
      const { error: updateError } = await admin
        .from("redemptions")
        .update({
          status: "rejected",
          fulfillment_notes: reason,
        })
        .eq("id", id)
        .eq("company_id", cid);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Restore points to customer
      const restoredPoints = redemption.points_spent;
      const newTotal = redemption.customer.total_points + restoredPoints;

      // Insert restoration transaction
      await admin.from("point_transactions").insert({
        user_id: redemption.user_id,
        company_id: cid,
        amount: restoredPoints,
        type: "manual_adjustment",
        description: "Points restored — redemption rejected",
        reference_id: id,
      });

      // Update customer profile points
      await admin
        .from("profiles")
        .update({ total_points: newTotal })
        .eq("id", redemption.user_id);

      // Send rejection email (Starter only)
      if (isStarter && companyData) {
        sendTransactionalEmail({
          template: "redemption_rejected",
          to: redemption.customer.email,
          props: {
            customerName: redemption.customer.full_name,
            rewardName: redemption.reward.name,
            rejectionReason: reason,
            pointsRestored: restoredPoints,
            dashboardUrl: `${baseUrl}/dashboard/rewards`,
            companyName: companyData.name,
            logoUrl: companyData.logo_url,
            primaryColor: (settings.brandColor as string) || "#0D9488",
          },
          companyId: cid,
          customerId: redemption.user_id,
          preferences: null,
          adminClient: admin,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Redemptions PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update redemption" },
      { status: 500 }
    );
  }
}
