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
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    // Get all business owners
    const { data: owners } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("role", ["business_owner", "business"])
      .not("email", "like", "%@connectreward.io");

    if (!owners || owners.length === 0) {
      return NextResponse.json({ error: "No business owners to send to" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    let failed = 0;

    // Send emails in batches of 10
    for (let i = 0; i < owners.length; i += 10) {
      const batch = owners.slice(i, i + 10);

      const results = await Promise.allSettled(
        batch.map((owner) =>
          resend.emails.send({
            from: "Connect Reward <notifications@connectreward.io>",
            to: owner.email,
            subject,
            text: `Hi ${owner.full_name || "there"},\n\n${message}`,
          })
        )
      );

      for (const r of results) {
        if (r.status === "fulfilled") sent++;
        else {
          failed++;
          console.error("Announcement email failed:", r.reason);
        }
      }
    }

    // Log the announcement
    await admin.from("email_logs").insert({
      company_id: null,
      customer_id: null,
      template_name: "announcement",
      recipient_email: `broadcast:${owners.length}`,
      status: "sent",
      metadata: { subject, recipientCount: owners.length, sent, failed },
    });

    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error("Announcements error:", error);
    return NextResponse.json({ error: "Failed to send announcement" }, { status: 500 });
  }
}
