import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { setCartAddress, type SetAddressBody } from "@/lib/catalog-api";

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
  const address: SetAddressBody = {
    given_name: body.given_name as string | undefined,
    surname: body.surname as string | undefined,
    address_1: body.address_1 as string | undefined,
    address_2: body.address_2 as string | undefined,
    city: body.city as string | undefined,
    state_or_region: body.state_or_region as string | undefined,
    postal_code: body.postal_code as string | undefined,
    country: body.country as string | undefined,
    email: body.email as string | undefined,
    phone_number: body.phone_number as string | undefined,
  };

  const res = await setCartAddress(socketId, profile.id, address);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ data: res.data });
}
