import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

async function findCompanyByStripeCustomer(
  admin: ReturnType<typeof createAdminClient>,
  stripeCustomerId: string
) {
  const { data } = await admin
    .from("companies")
    .select("id, name, plan_tier, logo_url, settings")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  return data;
}

async function findBusinessOwner(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string
) {
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name, notification_preferences")
    .eq("company_id", companyId)
    .in("role", ["business_owner", "business"])
    .limit(1)
    .single();
  return data;
}

async function sendBusinessEmail(
  admin: ReturnType<typeof createAdminClient>,
  owner: { id: string; email: string; full_name: string; notification_preferences: unknown },
  company: { id: string; name: string; logo_url: string | null; settings: unknown },
  subject: string,
  body: string
) {
  const settings = (company.settings ?? {}) as Record<string, unknown>;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

  // Use the welcome template as a generic email carrier
  await sendTransactionalEmail({
    template: "welcome",
    to: owner.email,
    props: {
      customerName: owner.full_name,
      dashboardUrl: `${baseUrl}/admin`,
      companyName: company.name,
      logoUrl: company.logo_url,
      primaryColor: (settings.brandColor as string) || "#0D9488",
    },
    companyId: company.id,
    customerId: null,
    preferences: null,
    adminClient: admin,
    subjectOverride: subject,
  }).catch((error) => console.error("Stripe webhook email failed:", error));
}

export async function POST(request: NextRequest) {
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        if (!stripeCustomerId) break;

        const company = await findCompanyByStripeCustomer(admin, stripeCustomerId);
        if (!company) break;

        const owner = await findBusinessOwner(admin, company.id);
        if (!owner) break;

        // Count failed payment attempts on this subscription
        const attemptCount = invoice.attempt_count ?? 1;

        if (attemptCount >= 3) {
          // Downgrade to free after 3+ failed attempts
          await admin
            .from("companies")
            .update({ plan_tier: "free" })
            .eq("id", company.id);

          await sendBusinessEmail(
            admin, owner, company,
            "Your account has been downgraded — Connect Reward",
            "Your account has been downgraded to the free plan due to failed payments. Upgrade anytime to restore access."
          );
        } else {
          // Warn about failed payment
          await sendBusinessEmail(
            admin, owner, company,
            "Payment failed — action needed",
            "Your payment failed — please update your payment method to keep your account active."
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        if (!stripeCustomerId) break;

        const company = await findCompanyByStripeCustomer(admin, stripeCustomerId);
        if (!company) break;

        // Downgrade to free
        await admin
          .from("companies")
          .update({ plan_tier: "free" })
          .eq("id", company.id);

        const owner = await findBusinessOwner(admin, company.id);
        if (owner) {
          await sendBusinessEmail(
            admin, owner, company,
            "Subscription cancelled — Connect Reward",
            "Your Starter subscription has been cancelled. You've been moved to the free plan."
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        if (!stripeCustomerId) break;

        const company = await findCompanyByStripeCustomer(admin, stripeCustomerId);
        if (!company) break;

        // Sync plan tier based on subscription status
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        await admin
          .from("companies")
          .update({ plan_tier: isActive ? "starter" : "free" })
          .eq("id", company.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        if (!stripeCustomerId) break;

        const company = await findCompanyByStripeCustomer(admin, stripeCustomerId);
        if (!company) break;

        // If business is on free plan (from failed payments), restore to starter
        if (company.plan_tier === "free") {
          await admin
            .from("companies")
            .update({ plan_tier: "starter" })
            .eq("id", company.id);

          const owner = await findBusinessOwner(admin, company.id);
          if (owner) {
            await sendBusinessEmail(
              admin, owner, company,
              "Payment successful — plan restored!",
              "Payment successful — your Starter plan has been restored."
            );
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Stripe webhook handler error [${event.type}]:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
