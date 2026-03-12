import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { getOrder } from "@/lib/catalog-api";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET — list the user's catalog orders by looking up reference_ids from point_transactions */
export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile } = result.ctx;

  const admin = createAdminClient();

  // Get all catalog redemption transactions for this user
  const { data: transactions } = await admin
    .from("point_transactions")
    .select("reference_id, created_at")
    .eq("user_id", profile.id)
    .eq("type", "redemption")
    .not("reference_id", "is", null)
    .like("reference_id", "cr-%")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Fetch each order from CatalogAPI in parallel
  const orderPromises = transactions.map(async (tx) => {
    const res = await getOrder(tx.reference_id!);
    if (res.ok) return res.data;
    return null;
  });

  const results = await Promise.all(orderPromises);
  const orders = results.filter(Boolean);

  return NextResponse.json({ data: orders });
}
