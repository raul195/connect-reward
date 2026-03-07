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
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { Plus, Pencil, Trash2, Gift, Lock, CreditCard, Plane, Monitor, Ticket, Home } from "lucide-react";
import type { Reward, RewardCategory } from "@/lib/types";

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
}

const emptyForm: RewardForm = { name: "", description: "", points_required: "", type: "gift_card", quantity_available: "", is_active: true };

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

  const isFreePlan = company?.plan_tier === "free";

  const [useSample, setUseSample] = useState(false);

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

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

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
    });
    setModalOpen(true);
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
      const res = await fetch("/api/admin/rewards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
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

      {isFreePlan && <UpgradeCTA message="Upgrade to customize your rewards catalog." />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Add card */}
        {!isFreePlan && (
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
            {isFreePlan && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-[1px]">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  {CAT_ICONS[r.category] || <Gift className="h-8 w-8" />}
                </div>
                {!isFreePlan && (
                  <div className="flex items-center gap-1">
                    <Switch checked={r.is_active} onCheckedChange={(v) => toggleActive(r.id, v)} />
                  </div>
                )}
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
              {!isFreePlan && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteConfirm(r.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
