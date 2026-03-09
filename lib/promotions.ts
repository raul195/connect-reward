import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActivePromotion {
  id: string;
  name: string;
  multiplier: number;
  start_date: string;
  end_date: string;
}

/**
 * Get the currently active promotion with the highest multiplier for a company.
 * Returns null if no active promotion exists.
 */
export async function getActivePromotion(
  companyId: string,
  supabase: SupabaseClient
): Promise<ActivePromotion | null> {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("promotions")
    .select("id, name, multiplier, start_date, end_date")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .order("multiplier", { ascending: false })
    .limit(1)
    .single();

  return data ?? null;
}

/**
 * Apply the active promotion multiplier to base points.
 * Returns the final amount and the promotion (if any).
 */
export async function applyPromotionMultiplier(
  companyId: string,
  basePoints: number,
  supabase: SupabaseClient
): Promise<{ finalAmount: number; promotion: ActivePromotion | null }> {
  const promotion = await getActivePromotion(companyId, supabase);

  if (!promotion) {
    return { finalAmount: basePoints, promotion: null };
  }

  const finalAmount = Math.round(basePoints * promotion.multiplier);
  return { finalAmount, promotion };
}

/**
 * Check if a new promotion would overlap with existing ones for the same company.
 * Uses the interval overlap formula: A.start < B.end AND A.end > B.start
 */
export async function hasOverlappingPromotion(
  companyId: string,
  startDate: string,
  endDate: string,
  supabase: SupabaseClient,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("promotions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("is_active", true)
    .lt("start_date", endDate)
    .gt("end_date", startDate);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count } = await query;
  return (count ?? 0) > 0;
}
