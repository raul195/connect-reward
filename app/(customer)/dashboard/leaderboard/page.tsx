"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TierBadge } from "@/components/shared/TierBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { LoyaltyTier } from "@/lib/types";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  total_points: number;
  loyalty_tier: LoyaltyTier;
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get user's company_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    if (timeFilter === "all") {
      // All-time: use profile total_points and count referrals
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, total_points, loyalty_tier")
        .eq("company_id", profile.company_id)
        .eq("role", "customer")
        .order("total_points", { ascending: false })
        .limit(20);

      if (!profiles) { setLoading(false); return; }

      // Get referral counts for each profile
      const entries: LeaderboardEntry[] = [];
      for (const p of profiles) {
        const { count } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referrer_id", p.id);

        entries.push({
          id: p.id,
          full_name: p.full_name,
          total_points: p.total_points,
          loyalty_tier: p.loyalty_tier as LoyaltyTier,
          referral_count: count ?? 0,
        });
      }

      setEntries(entries);
    } else {
      // Time-filtered: sum point_transactions in the period
      const now = new Date();
      let since: Date;
      if (timeFilter === "month") {
        since = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // this week (Monday)
        const day = now.getDay();
        since = new Date(now);
        since.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        since.setHours(0, 0, 0, 0);
      }

      const { data: txData } = await supabase
        .from("point_transactions")
        .select("profile_id, amount")
        .eq("company_id", profile.company_id)
        .eq("type", "earned")
        .gte("created_at", since.toISOString());

      if (!txData) { setLoading(false); return; }

      // Aggregate by profile
      const agg = new Map<string, number>();
      for (const tx of txData) {
        agg.set(tx.profile_id, (agg.get(tx.profile_id) ?? 0) + tx.amount);
      }

      // Sort and take top 20
      const sorted = [...agg.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      const profileIds = sorted.map(([id]) => id);
      if (profileIds.length === 0) { setEntries([]); setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, total_points, loyalty_tier")
        .in("id", profileIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      const entries: LeaderboardEntry[] = sorted.map(([id, points]) => {
        const p = profileMap.get(id);
        return {
          id,
          full_name: p?.full_name ?? "Unknown",
          total_points: points,
          loyalty_tier: (p?.loyalty_tier ?? "bronze") as LoyaltyTier,
          referral_count: 0,
        };
      });

      setEntries(entries);
    }

    setLoading(false);
  }, [timeFilter]);

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
                      <TierBadge tier={entry.loyalty_tier} />
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
