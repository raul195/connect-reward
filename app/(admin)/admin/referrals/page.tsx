"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { awardReferralCompletion } from "@/lib/points";
import { relativeTime } from "@/lib/relative-time";
import type confettiType from "canvas-confetti";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal } from "lucide-react";
import type { ReferralStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ReferralStatus; label: string; color: string }[] = [
  { value: "pending", label: "Submitted", color: "bg-gray-100 text-gray-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "quoted", label: "Quote Sent", color: "bg-orange-100 text-orange-700" },
  { value: "won", label: "Complete", color: "bg-green-100 text-green-700" },
  { value: "lost", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

interface ReferralRow {
  id: string;
  referee_name: string;
  referee_email: string | null;
  referee_phone: string | null;
  status: ReferralStatus;
  created_at: string;
  points_awarded: number;
  referrer_name: string;
  referrer_id: string;
  service_id: string | null;
  service_name: string | null;
}

function ReferralManagementInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const { profile: adminProfile } = useProfile();
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, rate: 0 });

  const fetchReferrals = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("referrals")
      .select("*, profiles!referrals_referrer_id_fkey(full_name), services(name)")
      .eq("company_id", adminProfile.company_id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (search) {
      query = query.or(`referee_name.ilike.%${search}%,referee_email.ilike.%${search}%`);
    }

    const { data } = await query;
    const rows: ReferralRow[] = (data ?? []).map((r) => {
      const svc = r.services as unknown as { name: string } | null;
      return {
        id: r.id,
        referee_name: r.referee_name,
        referee_email: r.referee_email,
        referee_phone: r.referee_phone,
        status: r.status as ReferralStatus,
        created_at: r.created_at,
        points_awarded: r.points_awarded,
        referrer_name: (r.profiles as { full_name: string } | null)?.full_name ?? "Unknown",
        referrer_id: r.referrer_id,
        service_id: r.service_id ?? null,
        service_name: svc?.name ?? null,
      };
    });
    setReferrals(rows);

    // Stats
    const { count: totalC } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", adminProfile.company_id);
    const { count: pendingC } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", adminProfile.company_id).eq("status", "pending");
    const { count: compC } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", adminProfile.company_id).eq("status", "won");
    const t = totalC ?? 0;
    const c = compC ?? 0;
    setStats({ total: t, pending: pendingC ?? 0, completed: c, rate: t > 0 ? Math.round((c / t) * 100) : 0 });
    setLoading(false);
  }, [adminProfile?.company_id, statusFilter, search]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  async function changeStatus(referralId: string, newStatus: ReferralStatus) {
    const supabase = createClient();

    if (newStatus === "won") {
      await awardReferralCompletion(referralId, supabase);
      import("canvas-confetti").then(mod => {
        mod.default({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#14b8a6", "#f59e0b", "#8b5cf6"] });
      });
      toast.success("Installation marked complete! Points awarded.");
    } else {
      await supabase.from("referrals").update({ status: newStatus }).eq("id", referralId);

      // Notify the referrer
      const ref = referrals.find(r => r.id === referralId);
      if (ref) {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label ?? newStatus;
        await supabase.from("notifications").insert({
          profile_id: ref.referrer_id,
          type: "referral_update",
          title: "Referral Status Updated",
          body: `Your referral for ${ref.referee_name} is now: ${statusLabel}`,
        });
      }
      toast.success("Status updated.");
    }
    fetchReferrals();
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === referrals.length) setSelected(new Set());
    else setSelected(new Set(referrals.map(r => r.id)));
  }

  async function bulkUpdateStatus(newStatus: ReferralStatus) {
    for (const id of selected) {
      await changeStatus(id, newStatus);
    }
    setSelected(new Set());
  }

  const statPills = [
    { label: "Total", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "Completed", value: stats.completed },
    { label: "Conversion", value: `${stats.rate}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Management</h1>
        <p className="text-muted-foreground">Track and manage all referrals.</p>
      </div>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        {statPills.map(s => (
          <Badge key={s.label} variant="secondary" className="text-sm px-3 py-1.5 font-medium">
            {s.label}: <span className="ml-1 font-bold">{s.value}</span>
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select onValueChange={(v) => bulkUpdateStatus(v as ReferralStatus)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Bulk update..." /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 w-10">
                  <input type="checkbox" className="rounded" checked={selected.size === referrals.length && referrals.length > 0}
                    onChange={toggleAll} />
                </th>
                <th className="p-3">Referral Name</th>
                <th className="p-3 hidden md:table-cell">Submitted By</th>
                <th className="p-3 hidden lg:table-cell">Service</th>
                <th className="p-3 hidden lg:table-cell">Phone</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-3"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : referrals.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No referrals found.</td></tr>
              ) : (
                referrals.map((r) => {
                  const sCfg = STATUS_OPTIONS.find(s => s.value === r.status)!;
                  return (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <input type="checkbox" className="rounded" checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)} />
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{r.referee_name}</p>
                        {r.referee_email && <p className="text-xs text-muted-foreground">{r.referee_email}</p>}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{r.referrer_name}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.service_name || "—"}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.referee_phone || "—"}</td>
                      <td className="p-3 text-muted-foreground">{relativeTime(r.created_at)}</td>
                      <td className="p-3">
                        <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v as ReferralStatus)}>
                          <SelectTrigger className={`w-32 h-8 text-xs font-semibold ${sCfg.color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => changeStatus(r.id, "lost")}>Cancel Referral</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReferralsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <ReferralManagementInner />
    </Suspense>
  );
}
