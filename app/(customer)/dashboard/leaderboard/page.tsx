"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isDemoAccount } from "@/lib/demo";
import { TierBadge } from "@/components/shared/TierBadge";
import { sampleCustomerLeaderboard } from "@/lib/sample-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { LoyaltyTier } from "@/lib/types";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  total_points: number;
  tier: LoyaltyTier;
  referral_count: number;
}

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

function privacyName(fullName: string, isCurrentUser: boolean): string {
  if (isCurrentUser) return fullName;
  const parts = fullName.trim().split(" ");
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function LeaderboardPage() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/leaderboard?period=${timeFilter}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();

      const e = (data.entries ?? []) as LeaderboardEntry[];
      setCurrentUserId(data.currentUserId ?? null);

      if (e.length === 0 && isDemoAccount(profile?.email)) {
        const s = sampleCustomerLeaderboard;
        setEntries(s.entries as unknown as LeaderboardEntry[]);
        setCurrentUserId(s.currentUserId);
      } else {
        setEntries(e);
      }
    } catch {
      // fetch error
    }
    setLoading(false);
  }, [timeFilter, profile?.email]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Top referrers in your company</p>
      </div>

      <Tabs value={timeFilter} onValueChange={setTimeFilter}>
        <TabsList>
          <TabsTrigger value="all">All Time</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" /> Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No data for this period yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Customer</div>
                <div className="col-span-2 text-right">Referrals</div>
                <div className="col-span-2 text-right">Points</div>
                <div className="col-span-2 text-right">Tier</div>
              </div>

              {entries.map((entry, i) => {
                const isMe = entry.id === currentUserId;
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 items-center gap-2 rounded-lg px-3 py-3 text-sm ${
                      isMe ? "bg-teal-50 ring-1 ring-teal-200" : i % 2 === 0 ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="col-span-1 font-bold">
                      {i < 3 ? <span className="text-lg">{MEDALS[i]}</span> : <span className="text-muted-foreground">{i + 1}</span>}
                    </div>
                    <div className="col-span-5 font-medium truncate">
                      {privacyName(entry.full_name, isMe)}
                      {isMe && <span className="ml-1 text-xs text-teal-600">(You)</span>}
                    </div>
                    <div className="col-span-2 text-right tabular-nums">{entry.referral_count}</div>
                    <div className="col-span-2 text-right font-semibold tabular-nums">{entry.total_points.toLocaleString()}</div>
                    <div className="col-span-2 flex justify-end">
                      <TierBadge tier={entry.tier} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
