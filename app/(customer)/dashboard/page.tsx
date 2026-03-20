"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTierProgress, getPointsToNextTier, calculateTierFromPoints } from "@/lib/points";
import { isDemoAccount } from "@/lib/demo";
import { sampleCustomerDashboard } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
import { relativeTime } from "@/lib/relative-time";
import { TierBadge } from "@/components/shared/TierBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Zap,
} from "lucide-react";
import type { Profile, PointTransaction, Service } from "@/lib/types";
import type { ActivePromotion } from "@/lib/promotions";

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

// ── Promotion Banner ───────────────────────────
function PromotionBanner({ promotion }: { promotion: ActivePromotion }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function updateCountdown() {
      const end = new Date(promotion.end_date).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Ending soon");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(
        days > 0
          ? `${days}d ${hours}h remaining`
          : `${hours}h remaining`
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [promotion.end_date]);

  return (
    <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-700">
              <Zap className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900">{promotion.name}</h3>
                <Badge className="bg-amber-500 text-white font-bold hover:bg-amber-500">
                  {promotion.multiplier}x POINTS
                </Badge>
              </div>
              <p className="text-sm text-amber-700">
                Earn {promotion.multiplier}x points on every referral!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-amber-700">{timeLeft}</span>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/dashboard/refer">
                <Send className="mr-2 h-4 w-4" />
                Refer Now
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
                  {(tx.type === "referral_completed" || tx.type === "signup_bonus" || tx.type === "milestone_bonus") && <TrendingUp className="h-4 w-4" />}
                  {tx.type === "redemption" && <Gift className="h-4 w-4" />}
                  {tx.type === "manual_adjustment" && <Star className="h-4 w-4" />}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{tx.description || tx.type}</p>
                    {tx.promotion_id && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Zap className="h-2.5 w-2.5" />
                        Boosted
                      </span>
                    )}
                  </div>
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

// ── Rewards Widget ──────────────────────────────
function RewardsWidget({ profile }: { profile: Profile }) {
  const [rewardsData, setRewardsData] = useState<{
    rewards: { id: string; name: string; points_required: number }[];
    favoriteIds: string[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rwRes, favRes] = await Promise.all([
          fetch("/api/customer/rewards"),
          fetch("/api/customer/favorites"),
        ]);
        const rwData = rwRes.ok ? await rwRes.json() : { rewards: [] };
        const favData = favRes.ok ? await favRes.json() : { favoriteIds: [] };
        setRewardsData({
          rewards: rwData.rewards ?? [],
          favoriteIds: favData.favoriteIds ?? [],
        });
      } catch { /* ignore */ }
    })();
  }, []);

  if (!rewardsData) return null;

  const { rewards, favoriteIds } = rewardsData;

  if (rewards.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Gift className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold">Your rewards catalog is coming soon!</p>
            <p className="text-sm text-muted-foreground">Check back later for exciting rewards.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const affordable = rewards.filter(
    (r: { points_required: number }) => profile.total_points >= r.points_required
  ).length;
  const topFav = favoriteIds.length > 0
    ? rewards.find((r: { id: string }) => favoriteIds.includes(r.id) && r.id)
    : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Gift className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Rewards You Can Afford</p>
              <p className="text-2xl font-bold">{affordable}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/rewards">Browse Rewards</Link>
          </Button>
        </div>
        {topFav && profile.total_points < (topFav as { points_required: number }).points_required && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">
              Saving for: <span className="font-medium text-foreground">{(topFav as { name: string }).name}</span>
            </p>
            <Progress
              value={(profile.total_points / (topFav as { points_required: number }).points_required) * 100}
              className="h-2 [&>div]:bg-amber-500"
            />
          </div>
        )}
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

// ── Review Links ───────────────────────────────
interface ReviewLink {
  platform: string;
  url: string;
  label: string | null;
  display_order: number;
}

const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  google: { name: "Google", icon: "\u{1F50D}", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  yelp: { name: "Yelp", icon: "\u{2B50}", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  bbb: { name: "BBB", icon: "\u{1F3DB}\uFE0F", color: "bg-sky-100 text-sky-700 hover:bg-sky-200" },
  facebook: { name: "Facebook", icon: "\u{1F44D}", color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
  trustpilot: { name: "Trustpilot", icon: "\u{2705}", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  other: { name: "Review", icon: "\u{1F517}", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
};

function ReviewLinksSection({ links }: { links: ReviewLink[] }) {
  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Leave Us a Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Love our service? We&apos;d appreciate a review on any of these platforms:
        </p>
        <div className="flex flex-wrap gap-3">
          {links.map((link) => {
            const info = PLATFORM_INFO[link.platform] ?? PLATFORM_INFO.other;
            const displayName = link.platform === "other" && link.label
              ? link.label
              : info.name;

            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${info.color}`}
              >
                <span className="text-lg">{info.icon}</span>
                {displayName}
              </a>
            );
          })}
        </div>
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
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalReferrals: 0,
    completedInstalls: 0,
    pointsThisMonth: 0,
    rewardsRedeemed: 0,
  });
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [useSample, setUseSample] = useState(false);

  const fetchReviewLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/review-links");
      if (res.ok) {
        const { data } = await res.json();
        setReviewLinks(data ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();

      const p = data.profile as Profile;
      setProfile(p);
      setServices((data.services ?? []) as Service[]);
      setTransactions((data.transactions ?? []) as PointTransaction[]);
      setActivePromotion(data.activePromotion ?? null);
      setStats({
        totalReferrals: data.stats?.totalReferrals ?? 0,
        completedInstalls: data.stats?.completedInstalls ?? 0,
        pointsThisMonth: data.stats?.pointsThisMonth ?? 0,
        rewardsRedeemed: data.stats?.rewardsRedeemed ?? 0,
      });

      // Show sample data for new non-demo users
      if (
        (data.stats?.totalReferrals ?? 0) === 0 &&
        (p?.total_points ?? 0) === 0 &&
        isDemoAccount(p?.email)
      ) {
        const s = sampleCustomerDashboard;
        setProfile(s.profile as unknown as Profile);
        setServices(s.services as unknown as Service[]);
        setTransactions(s.transactions as unknown as PointTransaction[]);
        setStats(s.stats);
        setUseSample(true);
      }
    } catch {
      // fetch error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    fetchReviewLinks();
  }, [fetchData, fetchReviewLinks]);

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

  const isNewUser = stats.totalReferrals === 0 && profile.total_points === 0;

  return (
    <div className="space-y-6">
      {useSample && <SampleDataBanner />}
      {/* Welcome banner for new customers */}
      {isNewUser && (
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                <Trophy className="h-7 w-7" />
              </span>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Welcome to the Rewards Program!</h2>
                <p className="text-muted-foreground mt-1">
                  Earn points by referring friends and family. Redeem your points for exclusive rewards!
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/dashboard/refer">Submit Your First Referral</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/rewards">Browse Rewards</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activePromotion && <PromotionBanner promotion={activePromotion} />}

      <PointsCard profile={profile} />
      <StatsGrid stats={stats} />
      <RewardsWidget profile={profile} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed transactions={transactions} />
        <QuickActions />
      </div>
      <PointsGuide services={services} />
      <ReviewLinksSection links={reviewLinks} />
    </div>
  );
}
