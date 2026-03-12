import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import {
  validateCart,
  placeOrder,
  type LineItemPayment,
} from "@/lib/catalog-api";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_SOCKET_ID = Number(process.env.CATALOG_SOCKET_ID ?? "999");

export async function POST(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile } = result.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const socketId = Number(body.socket_id) || DEFAULT_SOCKET_ID;

  // 1. Validate & lock the cart
  const valRes = await validateCart(socketId, profile.id, true);
  if (!valRes.ok) {
    return NextResponse.json({ error: valRes.error }, { status: valRes.status });
  }

  const { cart, errors } = valRes.data;
  if (errors && errors.length > 0) {
    return NextResponse.json(
      { error: "Cart validation failed", details: errors },
      { status: 400 }
    );
  }

  if (cart.line_items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // 2. Calculate total points needed
  const totalPoints = cart.line_items.reduce(
    (sum, li) => sum + (li.points ?? 0),
    0
  );

  // Re-read the profile to get the freshest points balance
  const admin = createAdminClient();
  const { data: freshProfile } = await admin
    .from("profiles")
    .select("total_points")
    .eq("id", profile.id)
    .single();

  if (!freshProfile || freshProfile.total_points < totalPoints) {
    return NextResponse.json(
      {
        error: "Insufficient points",
        required: totalPoints,
        available: freshProfile?.total_points ?? profile.total_points,
      },
      { status: 400 }
    );
  }

  // 3. Build line item payments (paying with points)
  const lineItemPayments: LineItemPayment[] = cart.line_items.map((li) => ({
    line_item_id: li.line_item_id,
    price_paid: li.price,
    points_paid: li.points ?? 0,
    shipping_paid: li.shipping_estimate ?? "0",
  }));

  // 4. Place the order
  const externalOrderId = `cr-${profile.company_id}-${profile.id}-${Date.now()}`;
  const orderRes = await placeOrder(
    socketId,
    profile.id,
    cart.cart_version,
    externalOrderId,
    lineItemPayments
  );

  if (!orderRes.ok) {
    return NextResponse.json(
      { error: orderRes.error },
      { status: orderRes.status }
    );
  }

  // 5. Deduct points in our database
  const { error: txError } = await admin.from("point_transactions").insert({
    user_id: profile.id,
    company_id: profile.company_id!,
    amount: -totalPoints,
    type: "redemption",
    description: `Catalog order: ${orderRes.data.order_number}`,
    reference_id: externalOrderId,
  });

  if (txError) {
    return NextResponse.json(
      { error: "Order placed but point deduction failed: " + txError.message },
      { status: 500 }
    );
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      total_points: freshProfile.total_points - totalPoints,
      redeemed_points: (profile.redeemed_points ?? 0) + totalPoints,
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Order placed but profile update failed: " + updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      order_number: orderRes.data.order_number,
      external_order_id: orderRes.data.external_order_id,
      points_spent: totalPoints,
      remaining_points: freshProfile.total_points - totalPoints,
    },
  });
}
