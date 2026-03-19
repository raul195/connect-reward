import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireSuperAdmin } from "@/lib/api-helpers";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    const body = await request.json();
    const { businessId, subject, message } = body;

    if (!businessId || !subject || !message) {
      return NextResponse.json(
        { error: "businessId, subject, and message are required" },
        { status: 400 }
      );
    }

    // Find the business owner
    const { data: owner } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("company_id", businessId)
      .in("role", ["business_owner", "business"])
      .limit(1)
      .single();

    if (!owner) {
      return NextResponse.json(
        { error: "Business owner not found" },
        { status: 404 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Connect Reward <notifications@connectreward.io>",
      to: owner.email,
      subject,
      text: `Hi ${owner.full_name || "there"},\n\n${message}`,
    });

    // Log the email
    await admin.from("email_logs").insert({
      company_id: businessId,
      customer_id: owner.id,
      template_name: "direct_email",
      recipient_email: owner.email,
      status: "sent",
      metadata: { subject, sentBy: profile.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Direct email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
