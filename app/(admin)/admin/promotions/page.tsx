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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  XCircle,
  Zap,
  Bell,
  Clock,
  CalendarDays,
} from "lucide-react";
import type { Promotion } from "@/lib/types";

interface PromotionForm {
  name: string;
  description: string;
  multiplier: string;
  multiplierPreset: string;
  start_date: string;
  end_date: string;
  notify_customers: boolean;
  send_reminder: boolean;
}

const emptyForm: PromotionForm = {
  name: "",
  description: "",
  multiplier: "2",
  multiplierPreset: "2",
  start_date: "",
  end_date: "",
  notify_customers: true,
  send_reminder: true,
};

function getPromoStatus(promo: Promotion): {
  label: string;
  color: string;
  detail: string;
} {
  const now = new Date();
  const start = new Date(promo.start_date);
  const end = new Date(promo.end_date);

  if (!promo.is_active || end < now) {
    return {
      label: "Ended",
      color: "bg-gray-100 text-gray-700",
      detail: `Ended ${end.toLocaleDateString()}`,
    };
  }

  if (start > now) {
    const daysUntil = Math.ceil(
      (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      label: "Upcoming",
      color: "bg-blue-100 text-blue-700",
      detail: `Starts in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
    };
  }

  const daysLeft = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    label: "Active",
    color: "bg-green-100 text-green-700",
    detail: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`,
  };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function PromotionsPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  const fetchPromotions = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/promotions");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPromotions(data.promotions as Promotion[]);
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const now = new Date();
  const activePromos = promotions.filter(
    (p) => p.is_active && new Date(p.end_date) >= now
  );
  const pastPromos = promotions.filter(
    (p) => !p.is_active || new Date(p.end_date) < now
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, start_date: todayStr() });
    setModalOpen(true);
    setEstimatedReach(null);
  }

  function openEdit(p: Promotion) {
    setEditing(p.id);
    const mult = String(p.multiplier);
    setForm({
      name: p.name,
      description: p.description ?? "",
      multiplier: mult,
      multiplierPreset: ["1.5", "2", "3"].includes(mult) ? mult : "custom",
      start_date: p.start_date.split("T")[0],
      end_date: p.end_date.split("T")[0],
      notify_customers: p.notify_customers,
      send_reminder: p.send_reminder,
    });
    setModalOpen(true);
    setEstimatedReach(null);
  }

  async function handleSave() {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const multiplier = parseFloat(form.multiplier);
    if (isNaN(multiplier) || multiplier < 1 || multiplier > 10) {
      toast.error("Multiplier must be between 1.0 and 10.0");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      multiplier,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date + "T23:59:59").toISOString(),
      notify_customers: form.notify_customers,
      send_reminder: form.send_reminder,
    };

    try {
      const res = await fetch("/api/admin/promotions", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save promotion.");
        setSaving(false);
        return;
      }

      if (data.estimatedReach !== undefined) {
        setEstimatedReach(data.estimatedReach);
      }

      toast.success(editing ? "Promotion updated!" : "Promotion created!");
      setModalOpen(false);
      fetchPromotions();
    } catch {
      toast.error("Failed to save promotion.");
    }
    setSaving(false);
  }

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to cancel promotion.");
        return;
      }
      toast.success("Promotion cancelled.");
      setCancelConfirm(null);
      fetchPromotions();
    } catch {
      toast.error("Failed to cancel promotion.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            Create time-limited campaigns to boost referrals
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "active"
              ? "bg-white border border-b-white -mb-[1px] text-teal-700"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active & Upcoming ({activePromos.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "past"
              ? "bg-white border border-b-white -mb-[1px] text-teal-700"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past Promotions ({pastPromos.length})
        </button>
      </div>

      {activeTab === "active" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Add card */}
          <Card
            className="flex cursor-pointer items-center justify-center border-2 border-dashed border-amber-300 transition-colors hover:border-amber-500 hover:bg-amber-50/50"
            onClick={openAdd}
          >
            <CardContent className="flex flex-col items-center gap-2 py-12 text-amber-600">
              <Plus className="h-10 w-10" />
              <span className="font-semibold">Add Promotion</span>
            </CardContent>
          </Card>

          {activePromos.map((promo) => {
            const status = getPromoStatus(promo);
            return (
              <Card key={promo.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Zap className="h-8 w-8" />
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <h3 className="mt-3 font-bold">{promo.name}</h3>
                  {promo.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {promo.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-2xl font-extrabold text-amber-600">
                      {promo.multiplier}x
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {status.detail}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      {new Date(promo.start_date).toLocaleDateString()} —{" "}
                      {new Date(promo.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {promo.notify_customers && (
                      <span className="flex items-center gap-1">
                        <Bell className="h-3 w-3" /> Notify
                      </span>
                    )}
                    {promo.send_reminder && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Reminders
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(promo)}
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setCancelConfirm(promo.id)}
                    >
                      <XCircle className="mr-1 h-3 w-3" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {activePromos.length === 0 && (
            <Card className="sm:col-span-2">
              <CardContent className="py-12 text-center">
                <Zap className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No active promotions. Create one to boost referrals!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "past" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastPromos.map((promo) => {
            const status = getPromoStatus(promo);
            return (
              <Card key={promo.id} className="opacity-75">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                      <Zap className="h-8 w-8" />
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <h3 className="mt-3 font-bold">{promo.name}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-2xl font-extrabold text-gray-500">
                      {promo.multiplier}x
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      {new Date(promo.start_date).toLocaleDateString()} —{" "}
                      {new Date(promo.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {pastPromos.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No past promotions yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Promotion" : "Create Promotion"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Summer Blitz"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="Earn double points on every referral!"
              />
            </div>

            {/* Multiplier */}
            <div className="space-y-2">
              <Label>Points Multiplier *</Label>
              <div className="flex gap-2">
                {["1.5", "2", "3"].map((val) => (
                  <button
                    key={val}
                    className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                      form.multiplierPreset === val
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        multiplierPreset: val,
                        multiplier: val,
                      }))
                    }
                  >
                    {val}x
                  </button>
                ))}
                <button
                  className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                    form.multiplierPreset === "custom"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setForm((f) => ({ ...f, multiplierPreset: "custom" }))
                  }
                >
                  Custom
                </button>
              </div>
              {form.multiplierPreset === "custom" && (
                <Input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={form.multiplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, multiplier: e.target.value }))
                  }
                  className="mt-2 w-32"
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  min={todayStr()}
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  min={form.start_date || todayStr()}
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Notification toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify Customers</Label>
                  <p className="text-xs text-muted-foreground">
                    Send announcement email when promotion starts
                  </p>
                </div>
                <Switch
                  checked={form.notify_customers}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, notify_customers: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Send reminder at halfway and before expiry
                  </p>
                </div>
                <Switch
                  checked={form.send_reminder}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, send_reminder: v }))
                  }
                />
              </div>
            </div>

            {estimatedReach !== null && (
              <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-700">
                Estimated reach: {estimatedReach} customer
                {estimatedReach !== 1 ? "s" : ""} with promotional emails
                enabled
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Update Promotion"
                  : "Create Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <Dialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Promotion?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The multiplier will stop immediately. Points already earned will not
            be affected.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelConfirm(null)}
            >
              Keep Active
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelConfirm && handleCancel(cancelConfirm)}
            >
              Cancel Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
