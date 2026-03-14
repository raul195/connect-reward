// TODO: CatalogAPI integration — not yet active
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Catalog store is not yet available" },
    { status: 404 }
  );
}
