"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isDemoAccount } from "@/lib/demo";
import { sampleAdminReferrals } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
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
  { value: "submitted", label: "Submitted", color: "bg-gray-100 text-gray-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "consultation_scheduled", label: "Consultation Scheduled", color: "bg-orange-100 text-orange-700" },
  { value: "installation_complete", label: "Installation Complete", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

interface ReferralRow {
  id: string;
  referral_name: string;
  referral_email: string | null;
  referral_phone: string | null;
  status: ReferralStatus;
  created_at: string;
  points_awarded: number;
  referrer_name: string;
  submitted_by: string;
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
  const [useSample, setUseSample] = useState(false);

  const fetchReferrals = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/referrals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch referrals");
      const data = await res.json();

      if (data.stats.total === 0 && !isDemoAccount(adminProfile.email)) {
        setReferrals(sampleAdminReferrals.referrals as ReferralRow[]);
        setStats(sampleAdminReferrals.stats);
        setUseSample(true);
      } else {
        setReferrals(data.referrals as ReferralRow[]);
        setStats(data.stats);
        setUseSample(false);
      }
    } catch {
      setReferrals(sampleAdminReferrals.referrals as ReferralRow[]);
      setStats(sampleAdminReferrals.stats);
      setUseSample(true);
    }
    setLoading(false);
  }, [adminProfile?.company_id, adminProfile?.email, statusFilter, search]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  async function changeStatus(referralId: string, newStatus: ReferralStatus) {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: referralId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update status.");
        return;
      }

      if (newStatus === "installation_complete") {
        import("canvas-confetti").then(mod => {
          mod.default({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#14b8a6", "#f59e0b", "#8b5cf6"] });
        });
        toast.success("Installation marked complete! Points awarded.");
      } else {
        toast.success("Status updated.");
      }
    } catch {
      toast.error("Failed to update status.");
      return;
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
      {useSample && <SampleDataBanner />}
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
                        <p className="font-medium">{r.referral_name}</p>
                        {r.referral_email && <p className="text-xs text-muted-foreground">{r.referral_email}</p>}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{r.referrer_name}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.service_name || "—"}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.referral_phone || "—"}</td>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Referral actions"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => changeStatus(r.id, "cancelled")}>Cancel Referral</DropdownMenuItem>
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
