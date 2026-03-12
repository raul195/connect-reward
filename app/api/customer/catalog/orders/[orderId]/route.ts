import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { getOrder } from "@/lib/catalog-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const result = await getAuthContext();
  if (result.error) return result.error;

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const res = await getOrder(orderId);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  // Ensure the order belongs to this user
  if (res.data.external_user_id !== result.ctx.profile.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ data: res.data });
}
