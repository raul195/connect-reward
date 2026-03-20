"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  Info, Save, Gem, Star, Trophy, DollarSign, Plus, Pencil, Trash2, GripVertical,
} from "lucide-react";
import type { PlanTier, Service } from "@/lib/types";

const REVIEW_PLATFORMS = [
  { id: "google", name: "Google", icon: "⭐" },
  { id: "yelp", name: "Yelp", icon: "🔴" },
  { id: "bbb", name: "BBB", icon: "🏛️" },
  { id: "facebook", name: "Facebook", icon: "👍" },
  { id: "trustpilot", name: "Trustpilot", icon: "✅" },
];

const TIER_ORDER = [
  { key: "bronze", label: "Bronze", color: "text-orange-600 bg-orange-100", settingsKey: null },
  { key: "silver", label: "Silver", color: "text-gray-600 bg-gray-100", settingsKey: "tier_silver" },
  { key: "gold", label: "Gold", color: "text-amber-600 bg-amber-100", settingsKey: "tier_gold" },
  { key: "platinum", label: "Platinum", color: "text-violet-600 bg-violet-100", settingsKey: "tier_platinum" },
];

export default function PointsRewardsPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [reviewPoints, setReviewPoints] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Service dialog
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcDescription, setSvcDescription] = useState("");
  const [svcPoints, setSvcPoints] = useState("500");
  const [svcJobValue, setSvcJobValue] = useState("");
  const [svcMargin, setSvcMargin] = useState("");
  const [svcActive, setSvcActive] = useState(true);
  const [savingService, setSavingService] = useState(false);

  // Save states
  const [savingReview, setSavingReview] = useState(false);
  const [savingBonuses, setSavingBonuses] = useState(false);
  const [savingTiers, setSavingTiers] = useState(false);

  const planTier = (company?.plan_tier ?? "free") as PlanTier;
  const serviceLimit = PLAN_LIMITS[planTier]?.maxServices ?? 3;
  const atServiceLimit = services.length >= serviceLimit;
  const isFreePlan = planTier === "free";

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) { setLoading(false); return; }
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data.services ?? []);
      const s = (data.company?.settings ?? {}) as Record<string, unknown>;
      setSettings(s);
      const rpp = (s.review_platform_points ?? {}) as Record<string, number>;
      setReviewPoints({
        google: rpp.google ?? 500, yelp: rpp.yelp ?? 300,
        bbb: rpp.bbb ?? 300, facebook: rpp.facebook ?? 300, trustpilot: rpp.trustpilot ?? 300,
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateSetting(key: string, value: unknown) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  // ── Service CRUD ──
  function openAddService() {
    setEditingService(null);
    setSvcName(""); setSvcDescription(""); setSvcPoints("500");
    setSvcJobValue(""); setSvcMargin(""); setSvcActive(true);
    setServiceDialogOpen(true);
  }

  function openEditService(svc: Service) {
    setEditingService(svc);
    setSvcName(svc.name); setSvcDescription(svc.description ?? "");
    setSvcPoints(String(svc.points_value)); setSvcActive(svc.is_active);
    setSvcJobValue(svc.job_value ? String(svc.job_value) : "");
    setSvcMargin(svc.referral_percentage ? String(svc.referral_percentage) : "");
    setServiceDialogOpen(true);
  }

  async function handleSaveService() {
    if (!svcName.trim() || !profile?.company_id) return;
    setSavingService(true);
    const payload: Record<string, unknown> = {
      name: svcName.trim(),
      description: svcDescription.trim() || null,
      points_value: parseInt(svcPoints) || 500,
      is_active: svcActive,
      display_order: editingService ? undefined : services.length,
    };
    if (svcJobValue) payload.job_value = parseFloat(svcJobValue);
    if (svcMargin) payload.referral_percentage = parseFloat(svcMargin);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService ? { id: editingService.id, ...payload } : payload),
      });
      if (!res.ok) { toast.error("Failed to save service."); setSavingService(false); return; }
      toast.success(editingService ? "Service updated!" : "Service added!");
    } catch { toast.error("Failed to save service."); setSavingService(false); return; }
    setServiceDialogOpen(false); setSavingService(false); fetchData();
  }

  async function deleteService(id: string) {
    try {
      await fetch(`/api/admin/settings?serviceId=${id}`, { method: "DELETE" });
    } catch { toast.error("Failed to delete service."); return; }
    toast.success("Service deleted."); fetchData();
  }

  async function toggleServiceActive(svc: Service) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, is_active: !svc.is_active }),
    }).catch(() => {});
    fetchData();
  }

  // ── Save functions ──
  async function saveReviewPoints() {
    setSavingReview(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ...settings, review_platform_points: reviewPoints } }),
      });
      if (!res.ok) throw new Error();
      toast.success("Review points saved!");
    } catch { toast.error("Failed to save."); }
    setSavingReview(false);
  }

  async function saveBonusSettings() {
    setSavingBonuses(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error();
      toast.success("Bonus settings saved!");
    } catch { toast.error("Failed to save."); }
    setSavingBonuses(false);
  }

  async function saveTierSettings() {
    setSavingTiers(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error();
      toast.success("Tier thresholds saved!");
    } catch { toast.error("Failed to save."); }
    setSavingTiers(false);
  }

  // Points from dollar input
  const dollarFromPoints = (pts: number) => Math.round(pts / 100);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Points & Rewards</h1>
        <p className="text-muted-foreground">Manage what customers earn — all points configuration in one place.</p>
      </div>

      {/* Info banner */}
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-200 text-teal-700">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-teal-900">100 points = $1.00</p>
            <p className="mt-1 text-sm text-teal-800">
              Customers earn 100 points for every dollar you allocate as a referral reward.
              Example: a <strong>$500 referral reward = 50,000 points = $500 charged</strong> when you approve the referral.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* A. Services & Referral Points */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gem className="h-5 w-5 text-teal-600" />
              Services & Referral Points
            </CardTitle>
            <Button onClick={openAddService} disabled={atServiceLimit} className="bg-teal-600 hover:bg-teal-700" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {atServiceLimit && (
            <UpgradeCTA
              message={isFreePlan
                ? "Free plan limit: 3 services. Upgrade to Starter for up to 10."
                : `You've reached your ${serviceLimit}-service limit.`}
              className="mb-4"
            />
          )}
          {services.length === 0 ? (
            <div className="text-center py-8">
              <Gem className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No services yet. Add your first service to start earning referral points.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">{services.length}/{serviceLimit} services</p>
              {services.map(svc => (
                <div key={svc.id} className={`flex items-center justify-between rounded-lg border p-4 ${!svc.is_active ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {svc.job_value ? `$${Number(svc.job_value).toLocaleString()} job` : ""}
                        {svc.job_value && svc.referral_percentage ? " · " : ""}
                        {svc.referral_percentage ? `${svc.referral_percentage}% reward` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold text-teal-600">{svc.points_value.toLocaleString()} pts</span>
                      <p className="text-xs text-muted-foreground">${dollarFromPoints(svc.points_value)}</p>
                    </div>
                    <Switch checked={svc.is_active} onCheckedChange={() => toggleServiceActive(svc)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditService(svc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteService(svc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
          <Button size="sm" onClick={saveReviewPoints} disabled={savingReview} className="bg-teal-600 hover:bg-teal-700">
            <Save className="mr-1 h-3 w-3" /> {savingReview ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEW_PLATFORMS.map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1">
                  <Label className="text-sm font-medium">{p.name}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input type="number" value={reviewPoints[p.id] ?? 0}
                      onChange={e => setReviewPoints(prev => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-24" min={0} />
                    <span className="text-xs text-muted-foreground">pts = ${dollarFromPoints(reviewPoints[p.id] ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* C. Milestone Bonuses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-purple-600" />
            Milestone Bonuses
          </CardTitle>
          <Button size="sm" onClick={saveBonusSettings} disabled={savingBonuses} className="bg-teal-600 hover:bg-teal-700">
            <Save className="mr-1 h-3 w-3" /> {savingBonuses ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Milestone bonus (points)</Label>
              <Input type="number" min="0" value={String(settings.milestone_bonus ?? 500)}
                onChange={e => updateSetting("milestone_bonus", parseInt(e.target.value) || 0)} />
              <p className="text-xs text-muted-foreground">= ${dollarFromPoints(Number(settings.milestone_bonus ?? 500))} value</p>
            </div>
            <div className="space-y-2">
              <Label>Every N referrals</Label>
              <Input type="number" min="1" value={String(settings.milestone_threshold ?? 5)}
                onChange={e => updateSetting("milestone_threshold", parseInt(e.target.value) || 1)} />
              <p className="text-xs text-muted-foreground">Award milestone bonus after every N completed referrals</p>
            </div>
            <div className="space-y-2">
              <Label>Points expiration</Label>
              <Select value={String(settings.points_expiration ?? "never")} onValueChange={v => updateSetting("points_expiration", v)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D. Tier Thresholds */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Tier Thresholds
          </CardTitle>
          <Button size="sm" onClick={saveTierSettings} disabled={savingTiers} className="bg-teal-600 hover:bg-teal-700">
            <Save className="mr-1 h-3 w-3" /> {savingTiers ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Customers advance through tiers as they earn points.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIER_ORDER.map(tier => (
              <div key={tier.key} className="rounded-lg border p-4">
                <Badge className={`${tier.color} border-0`}>{tier.label}</Badge>
                {tier.settingsKey ? (
                  <div className="mt-3 space-y-1">
                    <Input type="number" min="0"
                      value={String(settings[tier.settingsKey] ?? (tier.key === "silver" ? 1000 : tier.key === "gold" ? 3000 : 7500))}
                      onChange={e => updateSetting(tier.settingsKey!, parseInt(e.target.value) || 0)} />
                    <p className="text-xs text-muted-foreground">
                      points (${dollarFromPoints(Number(settings[tier.settingsKey] ?? 0))})
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-2xl font-bold">0</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>Configure the service and its referral reward.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="e.g. Solar Panel Installation" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={svcDescription} onChange={e => setSvcDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Value ($)</Label>
                <Input type="number" min="0" value={svcJobValue} onChange={e => setSvcJobValue(e.target.value)} placeholder="25000" />
              </div>
              <div className="space-y-2">
                <Label>Referral Reward ($)</Label>
                <Input type="number" min="0" value={String(dollarFromPoints(parseInt(svcPoints) || 0))}
                  onChange={e => setSvcPoints(String(Math.round(Number(e.target.value)) * 100))} placeholder="500" />
                <p className="text-xs text-muted-foreground">{parseInt(svcPoints || "0").toLocaleString()} points</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={svcActive} onCheckedChange={setSvcActive} />
              <Label className="font-normal">Active (visible to customers)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveService} disabled={savingService || !svcName.trim()} className="bg-teal-600 hover:bg-teal-700">
              {savingService ? "Saving..." : editingService ? "Update" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
