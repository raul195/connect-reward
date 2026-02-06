"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/relative-time";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface AchievementWithStatus {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_bonus: number;
  condition: Record<string, unknown>;
  earned: boolean;
  earned_at: string | null;
}

const ACHIEVEMENT_ICONS: Record<string, string> = {
  trophy: "\u{1F3C6}",
  star: "\u{2B50}",
  zap: "\u{1F525}",
  gem: "\u{1F48E}",
  award: "\u{1F948}",
  crown: "\u{1F451}",
  diamond: "\u{1F48E}",
  "message-square": "\u{2B50}",
};

const DEFAULT_ACHIEVEMENT_ICONS: Record<string, string> = {
  "First Referral": "\u{1F331}",
  "High Five": "\u{1F590}\uFE0F",
  "Perfect Ten": "\u{1F525}",
  "Silver Status": "\u{1F948}",
  "Gold Status": "\u{1F947}",
  "Platinum Elite": "\u{1F48E}",
  "Reviewer": "\u{2B50}",
  "Top Referrer": "\u{1F3C6}",
  "Review Writer": "\u{2B50}",
  "Referral Rookie": "\u{2B50}",
  "Referral Pro": "\u{26A1}",
  "Point Collector": "\u{1F48E}",
  "Silver Achiever": "\u{1F948}",
  "Gold Achiever": "\u{1F451}",
};

function getProgressText(condition: Record<string, unknown>): string {
  const type = condition.type as string;
  const threshold = condition.threshold as number | undefined;
  const tier = condition.tier as string | undefined;

  if (type === "referral_count" && threshold) return `${threshold} referral${threshold > 1 ? "s" : ""}`;
  if (type === "won_count" && threshold) return `${threshold} won referral${threshold > 1 ? "s" : ""}`;
  if (type === "total_points" && threshold) return `${threshold.toLocaleString()} pts`;
  if (type === "review_count" && threshold) return `${threshold} review${threshold > 1 ? "s" : ""}`;
  if (type === "tier_reached" && tier) return `Reach ${tier}`;
  return "";
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's profile to find company_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    // Get all achievements for company
    const { data: allAch } = await supabase
      .from("achievements")
      .select("*")
      .or(`company_id.eq.${profile.company_id},company_id.is.null`);

    // Get user's earned achievements
    const { data: userAch } = await supabase
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("profile_id", user.id);

    const earnedMap = new Map(userAch?.map((ua) => [ua.achievement_id, ua.earned_at]) ?? []);

    const merged: AchievementWithStatus[] = (allAch ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      points_bonus: a.points_bonus,
      condition: a.condition as Record<string, unknown>,
      earned: earnedMap.has(a.id),
      earned_at: earnedMap.get(a.id) ?? null,
    }));

    // Sort: earned first, then by requirement
    merged.sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      return 0;
    });

    setAchievements(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          {achievements.filter((a) => a.earned).length} of {achievements.length} unlocked
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {achievements.map((ach) => {
          const emoji = DEFAULT_ACHIEVEMENT_ICONS[ach.name] || ACHIEVEMENT_ICONS[ach.icon ?? ""] || "\u{1F3C6}";

          return (
            <Card
              key={ach.id}
              className={`relative overflow-hidden transition-all ${
                ach.earned ? "ring-2 ring-amber-400/50 shadow-lg" : "opacity-70 grayscale"
              }`}
            >
              <CardContent className="flex flex-col items-center p-6 text-center">
                {!ach.earned && (
                  <div className="absolute top-3 right-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-4xl">{emoji}</span>
                <h3 className="mt-3 font-bold">{ach.name}</h3>
                {ach.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{ach.description}</p>
                )}
                {ach.earned ? (
                  <p className="mt-2 text-xs font-medium text-amber-600">
                    Earned {ach.earned_at ? relativeTime(ach.earned_at) : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {getProgressText(ach.condition)}
                  </p>
                )}
                {ach.points_bonus > 0 && (
                  <p className="mt-1 text-xs font-semibold text-teal-600">+{ach.points_bonus} pts bonus</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
