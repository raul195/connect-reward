import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    [key: string]: unknown;
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Get headers for Svix verification
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  const body = await request.text();

  // Verify webhook signature
  let event: ResendWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Handle bounce and complaint events
  if (event.type === "email.bounced" || event.type === "email.complained") {
    const recipients = event.data.to ?? [];
    const newStatus = event.type === "email.bounced" ? "bounced" : "complained";

    for (const email of recipients) {
      await admin
        .from("profiles")
        .update({ email_status: newStatus })
        .eq("email", email.toLowerCase());
    }
  }

  return NextResponse.json({ received: true });
}
