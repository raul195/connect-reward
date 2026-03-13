import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { awardReferralCompletion } from "@/lib/points";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import { checkAndAwardAchievements } from "@/lib/achievements-engine";

export async function GET(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const search = searchParams.get("search") ?? "";

    // Fetch referrals with joins
    let query = admin
      .from("referrals")
      .select("*, profiles!referrals_submitted_by_fkey(full_name), services(name)")
      .eq("company_id", cid)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `referral_name.ilike.%${search}%,referral_email.ilike.%${search}%`
      );
    }

    const { data: rows } = await query;

    // Compute stats from all referrals (unfiltered)
    const { data: allReferrals } = await admin
      .from("referrals")
      .select("status")
      .eq("company_id", cid);

    const total = allReferrals?.length ?? 0;
    const pending = allReferrals?.filter((r) => r.status === "submitted").length ?? 0;
    const completed = allReferrals?.filter((r) => r.status === "installation_complete").length ?? 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Map rows to flat shape
    const referrals = (rows ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      referrer_name:
        (row.profiles as { full_name: string } | null)?.full_name ?? "Unknown",
      service_name:
        (row.services as { name: string } | null)?.name ?? null,
      profiles: undefined,
      services: undefined,
    }));

    return NextResponse.json({
      referrals,
      stats: { total, pending, completed, rate },
    });
  } catch (error) {
    console.error("Referrals GET error:", error);
    return NextResponse.json(
      { error: "Failed to load referrals" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    if (status === "installation_complete") {
      // Award points using the shared helper
      await awardReferralCompletion(id, admin);

      // Check achievements for the referral submitter
      const { data: ref } = await admin
        .from("referrals")
        .select("submitted_by")
        .eq("id", id)
        .single();
      if (ref) {
        checkAndAwardAchievements(ref.submitted_by, cid, admin).catch(() => {});
      }
    } else {
      // Update referral status
      await admin
        .from("referrals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", cid);

      // Get the referral to find the referrer for notification
      const { data: referral } = await admin
        .from("referrals")
        .select("submitted_by, referral_name")
        .eq("id", id)
        .single();

      if (referral) {
        await admin.from("notifications").insert({
          user_id: referral.submitted_by,
          type: "referral_update",
          title: "Referral Status Updated",
          body: `Your referral for ${referral.referral_name} has been updated to: ${status.replace(/_/g, " ")}`,
        });

        // Send referral status email (fire-and-forget)
        const { data: customer } = await admin
          .from("profiles")
          .select("email, full_name, total_points, notification_preferences")
          .eq("id", referral.submitted_by)
          .single();

        const { data: companyData } = await admin
          .from("companies")
          .select("name, logo_url, settings")
          .eq("id", cid)
          .single();

        if (customer && companyData) {
          const settings = (companyData.settings ?? {}) as Record<string, unknown>;
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

          sendTransactionalEmail({
            template: "referral_status",
            to: customer.email,
            props: {
              customerName: customer.full_name,
              referralName: referral.referral_name,
              newStatus: status,
              currentPoints: customer.total_points,
              dashboardUrl: `${baseUrl}/dashboard`,
              companyName: companyData.name,
              logoUrl: companyData.logo_url,
              primaryColor: (settings.brandColor as string) || "#6366f1",
            },
            companyId: cid,
            customerId: referral.submitted_by,
            preferences: customer.notification_preferences,
            adminClient: admin,
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referrals PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update referral" },
      { status: 500 }
    );
  }
}
