// TODO: CatalogAPI integration — not yet active
import { NextResponse } from "next/server";

const notAvailable = () =>
  NextResponse.json({ error: "Catalog store is not yet available" }, { status: 404 });

export async function GET() { return notAvailable(); }
export async function POST() { return notAvailable(); }
export async function DELETE() { return notAvailable(); }
