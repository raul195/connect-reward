import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { getItem, checkStock } from "@/lib/catalog-api";

const DEFAULT_SOCKET_ID = Number(process.env.CATALOG_SOCKET_ID ?? "999");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ catalogItemId: string }> }
) {
  const result = await getAuthContext();
  if (result.error) return result.error;

  const { catalogItemId } = await params;
  const socketId =
    Number(request.nextUrl.searchParams.get("socket_id")) || DEFAULT_SOCKET_ID;
  const itemId = Number(catalogItemId);

  if (!itemId) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  const [itemRes, stockRes] = await Promise.all([
    getItem(socketId, itemId),
    checkStock(socketId, itemId),
  ]);

  if (!itemRes.ok) {
    return NextResponse.json({ error: itemRes.error }, { status: itemRes.status });
  }

  return NextResponse.json({
    data: {
      item: itemRes.data,
      stock: stockRes.ok ? stockRes.data : null,
    },
  });
}
