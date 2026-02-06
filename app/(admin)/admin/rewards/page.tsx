"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
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
import type { Reward, RewardType } from "@/lib/types";

const CATEGORIES: { value: RewardType; label: string }[] = [
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
  points_cost: string;
  type: RewardType;
  quantity_left: string;
  active: boolean;
}

const emptyForm: RewardForm = { name: "", description: "", points_cost: "", type: "gift_card", quantity_left: "", active: true };

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

  const isFreePlan = company?.plan === "free";

  const fetchRewards = useCallback(async () => {
    if (!profile?.company_id) return;
    const supabase = createClient();
    const { data } = await supabase.from("rewards").select("*").eq("company_id", profile.company_id).order("created_at", { ascending: false });
    if (data) setRewards(data as Reward[]);
    setLoading(false);
  }, [profile?.company_id]);

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
      points_cost: String(r.points_cost),
      type: r.type,
      quantity_left: r.quantity_left !== null ? String(r.quantity_left) : "",
      active: r.active,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!profile?.company_id || !form.name || !form.points_cost) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      company_id: profile.company_id,
      name: form.name,
      description: form.description || null,
      points_cost: parseInt(form.points_cost),
      type: form.type,
      quantity_left: form.quantity_left ? parseInt(form.quantity_left) : null,
      active: form.active,
    };

    if (editing) {
      await supabase.from("rewards").update(payload).eq("id", editing);
      toast.success("Reward updated!");
    } else {
      await supabase.from("rewards").insert(payload);
      toast.success("Reward created!");
    }

    setSaving(false);
    setModalOpen(false);
    fetchRewards();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("rewards").delete().eq("id", id);
    toast.success("Reward deleted.");
    setDeleteConfirm(null);
    fetchRewards();
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = createClient();
    await supabase.from("rewards").update({ active }).eq("id", id);
    setRewards(prev => prev.map(r => r.id === id ? { ...r, active } : r));
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
          <Card key={r.id} className={`relative ${!r.active ? "opacity-60" : ""}`}>
            {isFreePlan && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-[1px]">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  {CAT_ICONS[r.type] || <Gift className="h-8 w-8" />}
                </div>
                {!isFreePlan && (
                  <div className="flex items-center gap-1">
                    <Switch checked={r.active} onCheckedChange={(v) => toggleActive(r.id, v)} />
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-bold">{r.name}</h3>
              {r.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xl font-extrabold text-amber-600">{r.points_cost.toLocaleString()} pts</p>
                <Badge variant="outline">{CATEGORIES.find(c => c.value === r.type)?.label ?? r.type}</Badge>
              </div>
              {r.quantity_left !== null && (
                <p className="mt-1 text-xs text-muted-foreground">{r.quantity_left} remaining</p>
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
                <Input type="number" min="1" value={form.points_cost} onChange={(e) => setForm(f => ({ ...f, points_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as RewardType }))}>
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
                <Input type="number" min="0" value={form.quantity_left} onChange={(e) => setForm(f => ({ ...f, quantity_left: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.active} onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))} />
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
