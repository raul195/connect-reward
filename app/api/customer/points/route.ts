import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const { data: transactions } = await admin
    .from("point_transactions")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ transactions: transactions ?? [] });
}
