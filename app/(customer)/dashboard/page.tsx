"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTierProgress, getPointsToNextTier, calculateTierFromPoints } from "@/lib/points";
import { relativeTime } from "@/lib/relative-time";
import { TierBadge } from "@/components/shared/TierBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  CheckCircle2,
  Star,
  Gift,
  Send,
  Trophy,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { Profile, PointTransaction, Service } from "@/lib/types";

// ── Animated counter ────────────────────────────
function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{count.toLocaleString()}</>;
}

// ── Points Card ─────────────────────────────────
function PointsCard({ profile }: { profile: Profile }) {
  const tier = calculateTierFromPoints(profile.total_points);
  const progress = getTierProgress(profile.total_points);
  const next = getPointsToNextTier(profile.total_points);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Available Points</p>
            <p className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              <AnimatedCounter target={profile.total_points} />
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} className="text-sm px-3 py-1" />
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md">
              <Link href="/dashboard/refer">
                <Send className="mr-2 h-4 w-4" />
                Submit a Referral
              </Link>
            </Button>
          </div>
        </div>

        {next && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Progress to {next.nextTier.charAt(0).toUpperCase() + next.nextTier.slice(1)}</span>
              <span>{next.pointsNeeded.toLocaleString()} pts to go</span>
            </div>
            <Progress value={progress} className="mt-2 h-2.5 bg-white/20 [&>div]:bg-amber-400" />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Stats Cards ─────────────────────────────────
interface StatsData {
  totalReferrals: number;
  completedInstalls: number;
  pointsThisMonth: number;
  rewardsRedeemed: number;
}

function StatsGrid({ stats }: { stats: StatsData }) {
  const cards = [
    { label: "Total Referrals Submitted", value: stats.totalReferrals, icon: ArrowUpRight, color: "text-blue-600 bg-blue-100" },
    { label: "Completed Installations", value: stats.completedInstalls, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
    { label: "Points Earned This Month", value: stats.pointsThisMonth, icon: Star, color: "text-amber-600 bg-amber-100" },
    { label: "Rewards Redeemed", value: stats.rewardsRedeemed, icon: Gift, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Activity Feed ───────────────────────────────
function ActivityFeed({ transactions }: { transactions: PointTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity yet. Submit a referral to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((tx) => {
          const isPositive = tx.amount > 0;
          return (
            <div key={tx.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {tx.type === "earned" && <TrendingUp className="h-4 w-4" />}
                  {tx.type === "redeemed" && <Gift className="h-4 w-4" />}
                  {tx.type === "adjusted" && <Star className="h-4 w-4" />}
                  {tx.type === "expired" && <Star className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-sm font-medium">{tx.description || tx.type}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(tx.created_at)}</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Quick Actions ───────────────────────────────
function QuickActions() {
  const actions = [
    { label: "Submit Referral", href: "/dashboard/refer", icon: Send, color: "text-teal-600 bg-teal-100" },
    { label: "Browse Rewards", href: "/dashboard/rewards", icon: Gift, color: "text-amber-600 bg-amber-100" },
    { label: "Leave a Review", href: "/dashboard/reviews", icon: MessageSquare, color: "text-blue-600 bg-blue-100" },
    { label: "View Leaderboard", href: "/dashboard/leaderboard", icon: Trophy, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.color}`}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="font-medium text-sm">{a.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Points Guide ────────────────────────────────
function PointsGuide({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Points Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Earn points by referring friends and family for these services:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((svc) => (
            <div key={svc.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{svc.name}</p>
                {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
              </div>
              <span className="text-sm font-bold text-teal-600 whitespace-nowrap ml-3">
                {svc.points_value.toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Dashboard Page ──────────────────────────────
export default function CustomerDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalReferrals: 0,
    completedInstalls: 0,
    pointsThisMonth: 0,
    rewardsRedeemed: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);

      // Fetch active services for Points Guide
      if ((profileData as Profile).company_id) {
        const { data: svcData } = await supabase
          .from("services")
          .select("*")
          .eq("company_id", (profileData as Profile).company_id!)
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        if (svcData) setServices(svcData as Service[]);
      }
    }

    // Fetch last 10 transactions
    const { data: txData } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (txData) setTransactions(txData as PointTransaction[]);

    // Fetch referral counts
    const { count: totalRef } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    const { count: completedRef } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("status", "won");

    // Points earned this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthTx } = await supabase
      .from("point_transactions")
      .select("amount")
      .eq("profile_id", user.id)
      .eq("type", "earned")
      .gte("created_at", startOfMonth.toISOString());

    const pointsThisMonth = monthTx?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

    // Redemptions count
    const { count: redemptionCount } = await supabase
      .from("redemptions")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id);

    setStats({
      totalReferrals: totalRef ?? 0,
      completedInstalls: completedRef ?? 0,
      pointsThisMonth,
      rewardsRedeemed: redemptionCount ?? 0,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <PointsCard profile={profile} />
      <StatsGrid stats={stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed transactions={transactions} />
        <QuickActions />
      </div>
      <PointsGuide services={services} />
    </div>
  );
}
