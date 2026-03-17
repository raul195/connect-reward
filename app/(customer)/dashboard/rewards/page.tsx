"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { sampleCustomerRewards } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
import type confettiType from "canvas-confetti";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Gift, CreditCard, Ticket, Home, Heart, TrendingUp, Clock, CheckCircle, XCircle,
} from "lucide-react";
import type { Reward, RewardCategory, Redemption } from "@/lib/types";

const CATEGORY_ICONS: Record<RewardCategory | string, React.ReactNode> = {
  gift_card: <CreditCard className="h-10 w-10" />,
  discount: <Gift className="h-10 w-10" />,
  cashback: <CreditCard className="h-10 w-10" />,
  service_credit: <Home className="h-10 w-10" />,
  custom: <Ticket className="h-10 w-10" />,
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "gift_card", label: "Gift Cards" },
  { value: "discount", label: "Discounts" },
  { value: "cashback", label: "Cashback" },
  { value: "service_credit", label: "Services" },
  { value: "custom", label: "Special" },
];

interface RedemptionRow extends Redemption {
  reward: { name: string; category: string; image_url: string | null };
}

export default function RewardsCatalog() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [redeemDialog, setRedeemDialog] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [useSample, setUseSample] = useState(false);
  const [activeView, setActiveView] = useState<"catalog" | "history">("catalog");

  const fetchRewards = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/customer/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      const data = await res.json();

      const rw = (data.rewards ?? []) as Reward[];
      if (rw.length === 0) {
        setRewards(sampleCustomerRewards.rewards as unknown as Reward[]);
        setUseSample(true);
      } else {
        setRewards(rw);
      }
    } catch { /* fetch error */ }
    setUserPoints(profile.total_points);
    setLoading(false);
  }, [profile]);

  const fetchFavorites = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/customer/favorites");
      if (!res.ok) return;
      const data = await res.json();
      setFavoriteIds(new Set(data.favoriteIds as string[]));
    } catch { /* ignore */ }
  }, [profile?.company_id]);

  const fetchRedemptions = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/customer/redemptions");
      if (!res.ok) return;
      const data = await res.json();
      setRedemptions(data.redemptions as RedemptionRow[]);
    } catch { /* ignore */ }
  }, [profile?.company_id]);

  useEffect(() => { fetchRewards(); fetchFavorites(); fetchRedemptions(); }, [fetchRewards, fetchFavorites, fetchRedemptions]);

  async function toggleFavorite(rewardId: string) {
    if (useSample) return;
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(rewardId)) next.delete(rewardId);
      else next.add(rewardId);
      return next;
    });

    try {
      await fetch("/api/customer/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
    } catch {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (next.has(rewardId)) next.delete(rewardId);
        else next.add(rewardId);
        return next;
      });
    }
  }

  const filtered = category === "all" ? rewards : rewards.filter((r) => r.category === category);
  const wishlistRewards = rewards.filter(r => favoriteIds.has(r.id));

  // Progress bar: find the most expensive favorited item that the user is closest to affording but can't yet
  const unaffordableFaves = wishlistRewards
    .filter(r => userPoints < r.points_required)
    .sort((a, b) => a.points_required - b.points_required); // closest first
  const closestFave = unaffordableFaves[0];
  const affordableFave = wishlistRewards.find(r => userPoints >= r.points_required);

  async function handleRedeem(reward: Reward) {
    if (!profile) return;
    setRedeeming(true);

    try {
      const res = await fetch("/api/customer/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });

      if (!res.ok) {
        toast.error("Failed to redeem reward. Please try again.");
        setRedeeming(false);
        return;
      }

      setUserPoints((prev) => prev - reward.points_required);
      setRedeemDialog(null);
      setRedeeming(false);

      import("canvas-confetti").then(mod => {
        mod.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#14b8a6", "#f59e0b", "#8b5cf6"],
        });
      });

      toast.success("Reward redeemed! You'll hear from us within 3-5 business days.");
      fetchRedemptions();
    } catch {
      toast.error("Failed to redeem reward. Please try again.");
      setRedeeming(false);
    }
  }

  function RewardCard({ reward, showFavorite = true }: { reward: Reward; showFavorite?: boolean }) {
    const canAfford = userPoints >= reward.points_required;
    const diff = reward.points_required - userPoints;
    const isFav = favoriteIds.has(reward.id);

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="flex flex-col p-5">
          <div className="flex items-start justify-between">
            {reward.image_url ? (
              <img src={reward.image_url} alt={reward.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                {CATEGORY_ICONS[reward.category] || <Gift className="h-10 w-10" />}
              </div>
            )}
            {showFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(reward.id); }}
                className="p-1 transition-colors"
                aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"}`}
                />
              </button>
            )}
          </div>
          <h3 className="mt-3 font-bold">{reward.name}</h3>
          {reward.description && (
            <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
          )}
          <p className="mt-3 text-2xl font-extrabold text-amber-600">
            {reward.points_required.toLocaleString()} <span className="text-sm font-medium">pts</span>
          </p>
          <p className="text-xs text-muted-foreground">= ${(reward.points_required / 100).toFixed(2)}</p>
          {reward.quantity_available !== null && (
            <Badge variant="outline" className="mt-1 w-fit text-xs">{reward.quantity_available} left</Badge>
          )}

          {canAfford ? (
            <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setRedeemDialog(reward)}>
              Redeem
            </Button>
          ) : (
            <Button className="mt-4" variant="outline" disabled>
              Need {diff.toLocaleString()} more pts
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {useSample && <SampleDataBanner />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          Your balance: <span className="font-bold text-foreground">{userPoints.toLocaleString()} pts</span>
          <span className="text-xs ml-1">(${(userPoints / 100).toFixed(2)})</span>
        </p>
      </div>

      {/* Progress bar toward favorited item */}
      {!useSample && affordableFave && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-green-800">
              You have enough points to redeem <strong>{affordableFave.name}</strong>!
            </p>
            <Button
              size="sm"
              className="mt-2 bg-green-600 hover:bg-green-700"
              onClick={() => setRedeemDialog(affordableFave)}
            >
              Redeem Now
            </Button>
          </CardContent>
        </Card>
      )}
      {!useSample && !affordableFave && closestFave && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              You&apos;re <span className="font-bold text-foreground">{(closestFave.points_required - userPoints).toLocaleString()} points</span> away from <strong>{closestFave.name}</strong>
            </p>
            <Progress
              value={(userPoints / closestFave.points_required) * 100}
              className="mt-2 h-2.5 [&>div]:bg-amber-500"
            />
          </CardContent>
        </Card>
      )}

      {/* View tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "catalog" | "history")}>
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="history">My Redemptions</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeView === "catalog" && (
        <>
          {/* Wishlist section */}
          {!useSample && wishlistRewards.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                My Wishlist
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {wishlistRewards.map(r => <RewardCard key={`wish-${r.id}`} reward={r} />)}
              </div>
            </div>
          )}

          {/* Category filter */}
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="flex-wrap h-auto gap-1">
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No rewards in this category yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((reward) => <RewardCard key={reward.id} reward={reward} />)}
            </div>
          )}
        </>
      )}

      {/* ========== REDEMPTION HISTORY ========== */}
      {activeView === "history" && (
        <div className="space-y-3">
          {redemptions.length === 0 ? (
            <div className="py-16 text-center">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No redemptions yet. Browse the catalog and redeem your first reward!</p>
            </div>
          ) : (
            redemptions.map(r => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.reward?.name ?? "Unknown reward"}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.points_spent.toLocaleString()} pts (${(r.points_spent / 100).toFixed(2)}) &middot;{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    {r.status === "rejected" && r.fulfillment_notes && (
                      <p className="mt-1 text-xs text-red-600">Reason: {r.fulfillment_notes}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      r.status === "pending" ? "border-amber-300 bg-amber-50 text-amber-700 shrink-0" :
                      r.status === "fulfilled" ? "border-green-300 bg-green-50 text-green-700 shrink-0" :
                      "border-red-300 bg-red-50 text-red-700 shrink-0"
                    }
                  >
                    {r.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {r.status === "fulfilled" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {r.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Redeem confirmation dialog */}
      <Dialog open={!!redeemDialog} onOpenChange={() => setRedeemDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {redeemDialog?.name}?</DialogTitle>
            <DialogDescription>
              Redeem <span className="font-semibold">{redeemDialog?.name}</span> for{" "}
              <span className="font-semibold">{redeemDialog?.points_required.toLocaleString()}</span> points?
              Your balance will go from{" "}
              <span className="font-semibold">{userPoints.toLocaleString()}</span> to{" "}
              <span className="font-semibold">{(userPoints - (redeemDialog?.points_required ?? 0)).toLocaleString()}</span> points.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRedeemDialog(null)}>Cancel</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={redeeming}
              onClick={() => redeemDialog && handleRedeem(redeemDialog)}
            >
              {redeeming ? "Redeeming..." : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
