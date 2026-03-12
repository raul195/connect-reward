import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { listBrands } from "@/lib/catalog-api";

const DEFAULT_SOCKET_ID = Number(process.env.CATALOG_SOCKET_ID ?? "999");

export async function GET(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;

  const socketId =
    Number(request.nextUrl.searchParams.get("socket_id")) || DEFAULT_SOCKET_ID;

  const res = await listBrands(socketId);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}
