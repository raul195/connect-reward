import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { getCart, addToCart, removeLineItem, emptyCart } from "@/lib/catalog-api";

const DEFAULT_SOCKET_ID = Number(process.env.CATALOG_SOCKET_ID ?? "999");

/** GET — view cart */
export async function GET(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile } = result.ctx;

  const socketId =
    Number(request.nextUrl.searchParams.get("socket_id")) || DEFAULT_SOCKET_ID;

  const res = await getCart(socketId, profile.id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}

/** POST — add items to cart */
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
  const items = body.items as
    | { catalog_item_id: number; metadata?: Record<string, string> }[]
    | undefined;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  const res = await addToCart(socketId, profile.id, items);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}

/** DELETE — remove line item or empty cart */
export async function DELETE(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile } = result.ctx;

  const url = request.nextUrl;
  const socketId = Number(url.searchParams.get("socket_id")) || DEFAULT_SOCKET_ID;
  const lineItemId = url.searchParams.get("line_item_id");

  if (lineItemId) {
    const res = await removeLineItem(socketId, profile.id, lineItemId);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json({ data: res.data });
  }

  // No line_item_id = empty entire cart
  const res = await emptyCart(socketId, profile.id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}
