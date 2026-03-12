"use client";

import { useEffect, useState, useCallback } from "react";
import { relativeTime } from "@/lib/relative-time";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface AchievementWithStatus {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  earned_at: string | null;
}

interface CategoryDef {
  key: string;
  label: string;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      const data = await res.json();

      setAchievements(data.achievements ?? []);
      setCategories(data.categories ?? []);
      setEarnedCount(data.earned_count ?? 0);
      setTotalCount(data.total_count ?? 0);
    } catch {
      // fetch error
    }
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          {earnedCount} of {totalCount} earned
        </p>
      </div>

      {categories.map((cat) => {
        const catAchievements = achievements.filter(
          (a) => a.category === cat.key
        );
        if (catAchievements.length === 0) return null;

        const catEarned = catAchievements.filter((a) => a.earned).length;

        return (
          <div key={cat.key} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">{cat.label}</h2>
              <span className="text-sm text-muted-foreground">
                {catEarned}/{catAchievements.length}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catAchievements.map((ach) => (
                <Card
                  key={ach.key}
                  className={`relative overflow-hidden transition-all ${
                    ach.earned
                      ? "ring-2 ring-amber-400/50 shadow-lg"
                      : "opacity-60 grayscale"
                  }`}
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    {!ach.earned && (
                      <div className="absolute top-3 right-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-4xl">{ach.icon}</span>
                    <h3 className="mt-3 font-bold">{ach.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ach.description}
                    </p>
                    {ach.earned ? (
                      <p className="mt-2 text-xs font-medium text-amber-600">
                        Earned {ach.earned_at ? relativeTime(ach.earned_at) : ""}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Locked
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
