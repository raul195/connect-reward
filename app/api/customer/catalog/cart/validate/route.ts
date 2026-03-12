import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { validateCart } from "@/lib/catalog-api";

const DEFAULT_SOCKET_ID = Number(process.env.CATALOG_SOCKET_ID ?? "999");

export async function POST(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile } = result.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const socketId = Number(body.socket_id) || DEFAULT_SOCKET_ID;
  const lock = body.lock === true;

  const res = await validateCart(socketId, profile.id, lock);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}
