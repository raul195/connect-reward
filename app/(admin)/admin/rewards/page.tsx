"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { isDemoAccount } from "@/lib/demo";
import { sampleAdminRewards } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  Plus, Pencil, Trash2, Gift, CreditCard, Ticket, Home, Upload,
  CheckCircle, XCircle, Clock, ImageIcon,
} from "lucide-react";
import type { Reward, RewardCategory, Redemption } from "@/lib/types";

const CATEGORIES: { value: RewardCategory; label: string }[] = [
  { value: "gift_card", label: "Gift Cards" },
  { value: "discount", label: "Discounts" },
  { value: "cashback", label: "Cashback" },
  { value: "service_credit", label: "Home / Services" },
  { value: "custom", label: "Special" },
];

const CAT_ICONS: Record<string, React.ReactNode> = {
  gift_card: <CreditCard className="h-8 w-8" />,
  discount: <Gift className="h-8 w-8" />,
  cashback: <CreditCard className="h-8 w-8" />,
  service_credit: <Home className="h-8 w-8" />,
  custom: <Ticket className="h-8 w-8" />,
};

interface RewardForm {
  name: string;
  description: string;
  points_required: string;
  type: RewardCategory;
  quantity_available: string;
  is_active: boolean;
  image_url: string;
}

const emptyForm: RewardForm = {
  name: "", description: "", points_required: "", type: "gift_card",
  quantity_available: "", is_active: true, image_url: "",
};

interface RedemptionRow extends Redemption {
  reward: { name: string; category: string; image_url: string | null };
  customer: { full_name: string; email: string };
}

const STATUS_FILTERS = ["all", "pending", "fulfilled", "rejected"] as const;

export default function RewardsManagement() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<RewardForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"rewards" | "redemptions">("rewards");

  // Redemptions
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [redemptionFilter, setRedemptionFilter] = useState<typeof STATUS_FILTERS[number]>("all");
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const planTier = (company?.plan_tier ?? "free") as keyof typeof PLAN_LIMITS;
  const rewardLimit = PLAN_LIMITS[planTier]?.maxRewards ?? PLAN_LIMITS.free.maxRewards;
  const atRewardLimit = rewards.length >= rewardLimit;

  const [useSample, setUseSample] = useState(false);

  const pendingCount = redemptions.filter(r => r.status === "pending").length;

  const fetchRewards = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      const data = await res.json();

      if (data.rewards.length === 0 && !isDemoAccount(profile.email)) {
        setRewards(sampleAdminRewards.rewards as Reward[]);
        setUseSample(true);
      } else {
        setRewards(data.rewards as Reward[]);
        setUseSample(false);
      }
    } catch {
      setRewards(sampleAdminRewards.rewards as Reward[]);
      setUseSample(true);
    }
    setLoading(false);
  }, [profile?.company_id, profile?.email]);

  const fetchRedemptions = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoadingRedemptions(true);
    try {
      const res = await fetch("/api/admin/redemptions");
      if (!res.ok) throw new Error("Failed to fetch redemptions");
      const data = await res.json();
      setRedemptions(data.redemptions as RedemptionRow[]);
    } catch {
      setRedemptions([]);
    }
    setLoadingRedemptions(false);
  }, [profile?.company_id]);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);
  useEffect(() => {
    if (activeTab === "redemptions") fetchRedemptions();
  }, [activeTab, fetchRedemptions]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: Reward) {
    setEditing(r.id);
    setForm({
      name: r.name,
      description: r.description ?? "",
      points_required: String(r.points_required),
      type: r.category,
      quantity_available: r.quantity_available !== null ? String(r.quantity_available) : "",
      is_active: r.is_active,
      image_url: r.image_url ?? "",
    });
    setModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/rewards/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to upload image.");
        setUploading(false);
        return;
      }
      const data = await res.json();
      setForm(f => ({ ...f, image_url: data.url }));
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image.");
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!profile?.company_id || !form.name || !form.points_required) return;
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      points_required: parseInt(form.points_required),
      category: form.type,
      quantity_available: form.quantity_available ? parseInt(form.quantity_available) : null,
      is_active: form.is_active,
      image_url: form.image_url || null,
    };

    try {
      const res = await fetch("/api/admin/rewards", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save reward.");
        setSaving(false);
        return;
      }
      toast.success(editing ? "Reward updated!" : "Reward created!");
    } catch {
      toast.error("Failed to save reward.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setModalOpen(false);
    fetchRewards();
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/rewards?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete reward.");
        return;
      }
    } catch {
      toast.error("Failed to delete reward.");
      return;
    }
    toast.success("Reward deleted.");
    setDeleteConfirm(null);
    fetchRewards();
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await fetch("/api/admin/rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: active }),
      });
    } catch { /* ignore */ }
    setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: active } : r));
  }

  async function handleFulfill(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "fulfill" }),
      });
      if (!res.ok) {
        toast.error("Failed to fulfill redemption.");
        setActionLoading(null);
        return;
      }
      toast.success("Redemption marked as fulfilled");
      fetchRedemptions();
    } catch {
      toast.error("Failed to fulfill redemption.");
    }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!rejectDialog || !rejectReason.trim()) return;
    setActionLoading(rejectDialog);
    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rejectDialog, action: "reject", reason: rejectReason }),
      });
      if (!res.ok) {
        toast.error("Failed to reject redemption.");
        setActionLoading(null);
        return;
      }
      toast.success("Redemption rejected and points restored");
      setRejectDialog(null);
      setRejectReason("");
      fetchRedemptions();
    } catch {
      toast.error("Failed to reject redemption.");
    }
    setActionLoading(null);
  }

  const filteredRedemptions = redemptionFilter === "all"
    ? redemptions
    : redemptions.filter(r => r.status === redemptionFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {useSample && <SampleDataBanner />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
          <p className="text-muted-foreground">{rewards.length} rewards configured</p>
        </div>
      </div>

      {/* Tab switcher */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "rewards" | "redemptions")}>
        <TabsList>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="redemptions" className="relative">
            Redemptions
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ========== REWARDS TAB ========== */}
      {activeTab === "rewards" && (
        <>
          {atRewardLimit && (
            <UpgradeCTA
              message={
                planTier === "free"
                  ? "You've reached the free plan limit of 3 rewards. Upgrade to Starter to add up to 10 rewards."
                  : `You've reached your ${rewardLimit}-reward limit. Upgrade to add more.`
              }
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!atRewardLimit && (
              <Card className="flex cursor-pointer items-center justify-center border-2 border-dashed border-teal-300 transition-colors hover:border-teal-500 hover:bg-teal-50/50"
                onClick={openAdd}>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-teal-600">
                  <Plus className="h-10 w-10" />
                  <span className="font-semibold">Add New Reward</span>
                </CardContent>
              </Card>
            )}

            {rewards.map(r => (
              <Card key={r.id} className={`relative ${!r.is_active ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        {CAT_ICONS[r.category] || <Gift className="h-8 w-8" />}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Switch checked={r.is_active} onCheckedChange={(v) => toggleActive(r.id, v)} />
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold">{r.name}</h3>
                  {r.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xl font-extrabold text-amber-600">{r.points_required.toLocaleString()} pts</p>
                    <Badge variant="outline">{CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}</Badge>
                  </div>
                  {r.quantity_available !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">{r.quantity_available} remaining</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteConfirm(r.id)}>
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ========== REDEMPTIONS TAB ========== */}
      {activeTab === "redemptions" && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(f => (
              <Button
                key={f}
                variant={redemptionFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setRedemptionFilter(f)}
                className={redemptionFilter === f ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {loadingRedemptions ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : filteredRedemptions.length === 0 ? (
            <div className="py-16 text-center">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No redemption requests{redemptionFilter !== "all" ? ` with status "${redemptionFilter}"` : ""}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRedemptions.map(r => (
                <Card key={r.id}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block">
                        {r.status === "pending" && <Clock className="h-5 w-5 text-amber-500" />}
                        {r.status === "fulfilled" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {r.status === "rejected" && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{r.customer?.full_name ?? "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.reward?.name ?? "Unknown reward"} &middot;{" "}
                          {r.points_spent.toLocaleString()} pts (${(r.points_spent / 100).toFixed(2)})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                        {r.status === "rejected" && r.fulfillment_notes && (
                          <p className="mt-1 text-xs text-red-600">Reason: {r.fulfillment_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          r.status === "pending" ? "border-amber-300 bg-amber-50 text-amber-700" :
                          r.status === "fulfilled" ? "border-green-300 bg-green-50 text-green-700" :
                          "border-red-300 bg-red-50 text-red-700"
                        }
                      >
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                      {r.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={actionLoading === r.id}
                            onClick={() => handleFulfill(r.id)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {actionLoading === r.id ? "..." : "Mark Fulfilled"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={actionLoading === r.id}
                            onClick={() => { setRejectDialog(r.id); setRejectReason(""); }}
                          >
                            <XCircle className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Reward" : "Add Reward"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="$50 Amazon Gift Card" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Points Required *</Label>
                <Input type="number" min="1" value={form.points_required} onChange={(e) => setForm(f => ({ ...f, points_required: e.target.value }))} />
                {form.points_required && (
                  <p className="text-xs text-muted-foreground">= ${(parseInt(form.points_required) / 100).toFixed(2)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as RewardCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Quantity Available</Label>
                <Input type="number" min="0" value={form.quantity_available} onChange={(e) => setForm(f => ({ ...f, quantity_available: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            {/* Image upload */}
            <div className="space-y-2">
              <Label>Reward Image</Label>
              <div className="flex items-center gap-3">
                {form.image_url ? (
                  <img src={form.image_url} alt="Reward" className="h-16 w-16 rounded-lg object-cover border" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                      <span>
                        <Upload className="mr-1 h-3 w-3" />
                        {uploading ? "Uploading..." : "Upload Image"}
                      </span>
                    </Button>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF. Max 2MB.</p>
                  {form.image_url && (
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-600 mt-1"
                      onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? "Saving..." : "Save Reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Reward?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. Existing redemptions will not be affected.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject modal */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Redemption</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The customer&apos;s points will be restored to their account.
            </p>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this redemption is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || actionLoading === rejectDialog}
            >
              {actionLoading === rejectDialog ? "Rejecting..." : "Reject & Restore Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
