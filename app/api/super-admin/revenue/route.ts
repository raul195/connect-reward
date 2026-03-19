import { NextResponse } from "next/server";
import { getAuthContext, requireSuperAdmin } from "@/lib/api-helpers";

const STARTER_PRICE = 99;

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireSuperAdmin(profile);
    if (forbidden) return forbidden;

    // Get all companies
    const { data: companies } = await admin
      .from("companies")
      .select("id, name, plan_tier, created_at, updated_at")
      .order("created_at", { ascending: false });

    const allCompanies = companies ?? [];
    const freeCount = allCompanies.filter((c) => c.plan_tier === "free").length;
    const starterCount = allCompanies.length - freeCount;
    const mrr = starterCount * STARTER_PRICE;
    const conversionRate = allCompanies.length > 0
      ? Math.round((starterCount / allCompanies.length) * 100)
      : 0;

    // Build monthly history (last 6 months)
    const monthlyHistory: { month: string; mrr: number; businesses: number; newSignups: number; churned: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      // Companies that existed by end of this month
      const existedByEnd = allCompanies.filter(
        (c) => new Date(c.created_at) < monthEnd
      );

      // New signups this month
      const newSignups = allCompanies.filter(
        (c) => new Date(c.created_at) >= monthStart && new Date(c.created_at) < monthEnd
      ).length;

      // Starter count at end of month (approximate — we don't track historical plan changes)
      const starterAtMonth = existedByEnd.filter((c) => c.plan_tier !== "free").length;

      monthlyHistory.push({
        month: monthLabel,
        mrr: starterAtMonth * STARTER_PRICE,
        businesses: existedByEnd.length,
        newSignups,
        churned: 0, // Would need historical data to calculate accurately
      });
    }

    // Recent plan-related activity (companies updated recently)
    const recentChanges = allCompanies
      .slice(0, 10)
      .map((c) => ({
        business: c.name,
        action: c.plan_tier === "free" ? "On free plan" : "Upgraded to Starter",
        plan: c.plan_tier,
        date: c.created_at,
      }));

    return NextResponse.json({
      mrr,
      totalBusinesses: allCompanies.length,
      freeCount,
      starterCount,
      conversionRate,
      monthlyHistory,
      recentChanges,
    });
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json({ error: "Failed to load revenue data" }, { status: 500 });
  }
}
