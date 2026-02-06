"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import type confettiType from "canvas-confetti";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Gift, CreditCard, Plane, Monitor, Ticket, Home } from "lucide-react";
import type { Reward, RewardType } from "@/lib/types";

const CATEGORY_ICONS: Record<RewardType | string, React.ReactNode> = {
  gift_card: <CreditCard className="h-10 w-10" />,
  discount: <Gift className="h-10 w-10" />,
  cashback: <CreditCard className="h-10 w-10" />,
  service_credit: <Home className="h-10 w-10" />,
  custom: <Ticket className="h-10 w-10" />,
  travel: <Plane className="h-10 w-10" />,
  electronics: <Monitor className="h-10 w-10" />,
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "gift_card", label: "Gift Cards" },
  { value: "discount", label: "Discounts" },
  { value: "cashback", label: "Cashback" },
  { value: "service_credit", label: "Services" },
  { value: "custom", label: "Special" },
];

export default function RewardsCatalog() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [redeemDialog, setRedeemDialog] = useState<Reward | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  const isFreePlan = company?.plan === "free";

  const fetchRewards = useCallback(async () => {
    if (!profile?.company_id) return;
    const supabase = createClient();

    const { data } = await supabase
      .from("rewards")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("active", true)
      .order("points_cost", { ascending: true });

    if (data) setRewards(data as Reward[]);
    setUserPoints(profile.total_points);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const filtered = category === "all" ? rewards : rewards.filter((r) => r.type === category);

  async function handleRedeem(reward: Reward) {
    if (!profile) return;
    setRedeeming(true);

    const supabase = createClient();

    // Insert redemption
    const { error: rError } = await supabase.from("redemptions").insert({
      reward_id: reward.id,
      profile_id: profile.id,
      company_id: profile.company_id!,
      status: "pending",
    });

    if (rError) {
      toast.error("Failed to redeem reward. Please try again.");
      setRedeeming(false);
      return;
    }

    // Insert negative point transaction
    await supabase.from("point_transactions").insert({
      profile_id: profile.id,
      company_id: profile.company_id!,
      type: "redeemed",
      amount: -reward.points_cost,
      description: `Redeemed: ${reward.name}`,
    });

    // Update profile points
    await supabase
      .from("profiles")
      .update({ total_points: userPoints - reward.points_cost })
      .eq("id", profile.id);

    setUserPoints((prev) => prev - reward.points_cost);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          Your balance: <span className="font-bold text-foreground">{userPoints.toLocaleString()} pts</span>
        </p>
      </div>

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
          {filtered.map((reward) => {
            const canAfford = userPoints >= reward.points_cost;
            const diff = reward.points_cost - userPoints;

            return (
              <Card key={reward.id} className="relative overflow-hidden">
                {/* Free plan overlay */}
                {isFreePlan && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="text-center">
                      <Lock className="mx-auto h-8 w-8 text-gray-400" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setUpgradeDialog(true)}
                      >
                        Upgrade to Unlock
                      </Button>
                    </div>
                  </div>
                )}

                <CardContent className="flex flex-col p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    {CATEGORY_ICONS[reward.type] || <Gift className="h-10 w-10" />}
                  </div>
                  <h3 className="mt-3 font-bold">{reward.name}</h3>
                  {reward.description && (
                    <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
                  )}
                  <p className="mt-3 text-2xl font-extrabold text-amber-600">
                    {reward.points_cost.toLocaleString()} <span className="text-sm font-medium">pts</span>
                  </p>
                  {reward.quantity_left !== null && (
                    <Badge variant="outline" className="mt-1 w-fit text-xs">{reward.quantity_left} left</Badge>
                  )}

                  {!isFreePlan && (
                    canAfford ? (
                      <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setRedeemDialog(reward)}>
                        Redeem
                      </Button>
                    ) : (
                      <Button className="mt-4" variant="outline" disabled>
                        Need {diff.toLocaleString()} more pts
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Redeem confirmation dialog */}
      <Dialog open={!!redeemDialog} onOpenChange={() => setRedeemDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {redeemDialog?.name}?</DialogTitle>
            <DialogDescription>
              Redeem <span className="font-semibold">{redeemDialog?.name}</span> for{" "}
              <span className="font-semibold">{redeemDialog?.points_cost.toLocaleString()}</span> points?
              Your balance will go from{" "}
              <span className="font-semibold">{userPoints.toLocaleString()}</span> to{" "}
              <span className="font-semibold">{(userPoints - (redeemDialog?.points_cost ?? 0)).toLocaleString()}</span> points.
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

      {/* Upgrade dialog */}
      <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Reward redemption is available on paid plans. Upgrade now to start redeeming your points!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog(false)}>Cancel</Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <a href="/admin/settings">View Plans</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
