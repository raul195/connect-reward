import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { getStripe } from "@/lib/stripe";

// POST — Create a Stripe SetupIntent + customer (if needed) for card collection
export async function POST() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;

  // Fetch company to check for existing Stripe customer
  const { data: company } = await admin
    .from("companies")
    .select("stripe_customer_id, name")
    .eq("id", cid)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  let customerId = company.stripe_customer_id;

  // Create Stripe customer if none exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name,
      email: profile.email,
      metadata: { company_id: cid, profile_id: profile.id },
    });
    customerId = customer.id;

    await admin
      .from("companies")
      .update({ stripe_customer_id: customerId })
      .eq("id", cid);
  }

  // Create SetupIntent for card collection
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { company_id: cid },
  });

  return NextResponse.json({
    data: {
      clientSecret: setupIntent.client_secret,
      customerId,
    },
  });
}
