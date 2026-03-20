"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { TIER_THRESHOLDS } from "@/lib/points";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Save, Gem, Star, Trophy, DollarSign } from "lucide-react";
import type { Service } from "@/lib/types";

const REVIEW_PLATFORMS = [
  { id: "google", name: "Google", icon: "⭐" },
  { id: "yelp", name: "Yelp", icon: "🔴" },
  { id: "bbb", name: "BBB", icon: "🏛️" },
  { id: "facebook", name: "Facebook", icon: "👍" },
  { id: "trustpilot", name: "Trustpilot", icon: "✅" },
];

const TIER_ORDER: { key: string; label: string; color: string }[] = [
  { key: "bronze", label: "Bronze", color: "text-orange-600 bg-orange-100" },
  { key: "silver", label: "Silver", color: "text-gray-600 bg-gray-100" },
  { key: "gold", label: "Gold", color: "text-amber-600 bg-amber-100" },
  { key: "platinum", label: "Platinum", color: "text-violet-600 bg-violet-100" },
];

export default function PointsRewardsPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [services, setServices] = useState<Service[]>([]);
  const [reviewPoints, setReviewPoints] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingReview, setSavingReview] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data.services ?? []);

      // Get review points from company settings
      const settings = (data.company?.settings ?? {}) as Record<string, unknown>;
      const reviewPlatformPoints = (settings.review_platform_points ?? {}) as Record<string, number>;
      setReviewPoints({
        google: reviewPlatformPoints.google ?? 500,
        yelp: reviewPlatformPoints.yelp ?? 300,
        bbb: reviewPlatformPoints.bbb ?? 300,
        facebook: reviewPlatformPoints.facebook ?? 300,
        trustpilot: reviewPlatformPoints.trustpilot ?? 300,
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function saveReviewPoints() {
    setSavingReview(true);
    try {
      const currentSettings = (company?.settings ?? {}) as Record<string, unknown>;
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { ...currentSettings, review_platform_points: reviewPoints },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Review points saved!");
    } catch {
      toast.error("Failed to save review points.");
    }
    setSavingReview(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Points & Rewards</h1>
        <p className="text-muted-foreground">Configure how customers earn and redeem points.</p>
      </div>

      {/* Points rate explanation banner */}
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-200 text-teal-700">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-teal-900">100 points = $1.00</p>
            <p className="mt-1 text-sm text-teal-800">
              When you approve a referral, your customer earns points based on the reward value you set.
              For example, a <strong>$500 referral reward = 50,000 points</strong>.
              Customers redeem points from your rewards catalog for gift cards and prizes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* A. Referral Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gem className="h-5 w-5 text-teal-600" />
            Referral Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No services configured yet. Add services in Settings → Services & Points.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Points awarded when a referral is approved for each service. Edit values in Settings → Services & Points.
              </p>
              <div className="space-y-3">
                {services.map((svc) => {
                  const dollars = Math.round(svc.points_value / 100);
                  return (
                    <div key={svc.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {svc.industry ? `${svc.industry} · ` : ""}
                          Job value: ${(svc.job_value ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-600">
                          {svc.points_value.toLocaleString()} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          = ${dollars.toLocaleString()} reward
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* B. Review Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Review Points
          </CardTitle>
          <Button
            size="sm"
            onClick={saveReviewPoints}
            disabled={savingReview}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Save className="mr-1 h-3 w-3" />
            {savingReview ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Points awarded when a customer leaves a verified review on each platform.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {REVIEW_PLATFORMS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1">
                  <Label className="text-sm font-medium">{p.name}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      value={reviewPoints[p.id] ?? 0}
                      onChange={(e) => setReviewPoints((prev) => ({
                        ...prev,
                        [p.id]: Math.max(0, parseInt(e.target.value) || 0),
                      }))}
                      className="w-24"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">
                      pts (${Math.round((reviewPoints[p.id] ?? 0) / 100)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* C. Tier Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-purple-600" />
            Tier Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Customers automatically advance through tiers as they earn points. These thresholds are system-wide.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TIER_ORDER.map((tier) => {
              const threshold = TIER_THRESHOLDS[tier.key as keyof typeof TIER_THRESHOLDS];
              const dollars = Math.round(threshold / 100);
              return (
                <div key={tier.key} className="rounded-lg border p-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${tier.color}`}>
                    {tier.label}
                  </span>
                  <p className="mt-3 text-2xl font-bold">
                    {threshold.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    points ({threshold === 0 ? "starting tier" : `$${dollars}`})
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* D. Points economy summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Points Economy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-teal-50 p-4 text-center">
              <p className="text-sm text-teal-700">Conversion Rate</p>
              <p className="mt-1 text-xl font-bold text-teal-900">100 pts = $1</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-sm text-amber-700">Services Configured</p>
              <p className="mt-1 text-xl font-bold text-amber-900">{services.length}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-sm text-purple-700">Highest Tier</p>
              <p className="mt-1 text-xl font-bold text-purple-900">Platinum (7,500 pts)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
