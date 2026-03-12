import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from "@/lib/achievements";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  // Get user's earned achievements from the new table
  const { data: earned } = await admin
    .from("customer_achievements")
    .select("achievement_key, earned_at")
    .eq("customer_id", profile.id);

  // Build earned map: key -> earned_at
  const earnedMap: Record<string, string> = {};
  for (const e of earned ?? []) {
    earnedMap[e.achievement_key] = e.earned_at;
  }

  // Merge with static definitions
  const achievements = ACHIEVEMENTS.map((a) => ({
    key: a.key,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    earned: !!earnedMap[a.key],
    earned_at: earnedMap[a.key] ?? null,
  }));

  const earnedCount = achievements.filter((a) => a.earned).length;

  return NextResponse.json({
    achievements,
    categories: ACHIEVEMENT_CATEGORIES,
    earned_count: earnedCount,
    total_count: achievements.length,
  });
}
