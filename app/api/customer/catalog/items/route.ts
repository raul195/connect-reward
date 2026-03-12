import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { searchItems } from "@/lib/catalog-api";

const DEFAULT_SOCKET_ID = Number(process.env.CATALOG_SOCKET_ID ?? "999");

export async function GET(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;

  const url = request.nextUrl;
  const socketId = Number(url.searchParams.get("socket_id")) || DEFAULT_SOCKET_ID;

  const res = await searchItems(socketId, {
    search: url.searchParams.get("search") ?? undefined,
    category_id: url.searchParams.has("category_id")
      ? Number(url.searchParams.get("category_id"))
      : undefined,
    brand_id: url.searchParams.has("brand_id")
      ? Number(url.searchParams.get("brand_id"))
      : undefined,
    tag_id: url.searchParams.has("tag_id")
      ? Number(url.searchParams.get("tag_id"))
      : undefined,
    fulfillment_type: url.searchParams.get("fulfillment_type") as
      | "physical"
      | "digital"
      | undefined,
    min_points: url.searchParams.has("min_points")
      ? Number(url.searchParams.get("min_points"))
      : undefined,
    max_points: url.searchParams.has("max_points")
      ? Number(url.searchParams.get("max_points"))
      : undefined,
    page: Number(url.searchParams.get("page")) || 1,
    per_page: Number(url.searchParams.get("per_page")) || 24,
    sort: url.searchParams.get("sort") ?? undefined,
    brand_faceting: "top",
    tag_faceting: "top",
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}
