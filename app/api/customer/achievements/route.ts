import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  // Get all achievements for the company (or global ones with null company_id)
  const { data: achievements } = await admin
    .from("achievements")
    .select("*")
    .or(`company_id.eq.${profile.company_id!},company_id.is.null`);

  // Get user's earned achievements
  const { data: userAchievements } = await admin
    .from("user_achievements")
    .select("*")
    .eq("profile_id", profile.id);

  // Build earned map: achievement_id -> earned_at
  const earnedMap: Record<string, string> = {};
  for (const ua of userAchievements ?? []) {
    earnedMap[ua.achievement_id] = ua.earned_at;
  }

  // Merge earned status into achievements and sort (earned first)
  const merged = (achievements ?? [])
    .map((a) => ({
      ...a,
      earned: !!earnedMap[a.id],
      earned_at: earnedMap[a.id] ?? null,
    }))
    .sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      return 0;
    });

  return NextResponse.json({
    achievements: merged,
    earned: earnedMap,
  });
}
