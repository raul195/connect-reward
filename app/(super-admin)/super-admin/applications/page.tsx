"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Download, Search, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";
import type { EarlyAccessApplication, ApplicationStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "demo_scheduled", label: "Demo Scheduled" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "converted", label: "Converted" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  demo_scheduled: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-gray-100 text-gray-700",
  converted: "bg-teal-100 text-teal-700",
};

const INDUSTRY_LABELS: Record<string, string> = {
  solar: "Solar", roofing: "Roofing", hvac: "HVAC", windows: "Windows",
  turf: "Turf", pest_control: "Pest Control", other: "Other",
};

const METHOD_LABELS: Record<string, string> = {
  none: "No referral program", cash_bonuses: "Cash bonuses", gift_cards: "Gift cards",
  referral_software: "Referral software", word_of_mouth: "Word of mouth", other: "Other",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free", starter: "Starter", growth: "Growth", pro: "Pro", not_sure: "Not sure",
};

const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<EarlyAccessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [detailApp, setDetailApp] = useState<EarlyAccessApplication | null>(null);
  const [editingNotes, setEditingNotes] = useState("");

  // Status counts
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  // Quick stats
  const [topIndustry, setTopIndustry] = useState("");
  const [topPlan, setTopPlan] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase.from("early_access_applications")
      .select("*", { count: "exact" })
      .order("submitted_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterIndustry !== "all") query = query.eq("industry", filterIndustry);
    if (filterSize !== "all") query = query.eq("company_size", filterSize);
    if (filterPlan !== "all") query = query.eq("desired_plan", filterPlan);
    if (search.trim()) {
      query = query.or(`company_name.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, count } = await query;
    setApplications((data ?? []) as EarlyAccessApplication[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, filterStatus, filterIndustry, filterSize, filterPlan, search]);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();

    // Status counts
    const counts: Record<string, number> = {};
    for (const s of STATUS_OPTIONS) {
      const { count } = await supabase.from("early_access_applications").select("*", { count: "exact", head: true }).eq("status", s.value);
      counts[s.value] = count ?? 0;
    }
    setStatusCounts(counts);

    // Top industry
    const { data: allApps } = await supabase.from("early_access_applications").select("industry, desired_plan");
    if (allApps && allApps.length > 0) {
      const indCounts: Record<string, number> = {};
      const planCounts: Record<string, number> = {};
      for (const a of allApps) {
        indCounts[a.industry] = (indCounts[a.industry] || 0) + 1;
        if (a.desired_plan) planCounts[a.desired_plan] = (planCounts[a.desired_plan] || 0) + 1;
      }
      const topInd = Object.entries(indCounts).sort((a, b) => b[1] - a[1])[0];
      if (topInd) setTopIndustry(INDUSTRY_LABELS[topInd[0]] || topInd[0]);
      const topP = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0];
      if (topP) setTopPlan(PLAN_LABELS[topP[0]] || topP[0]);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function updateStatus(id: string, status: ApplicationStatus) {
    const supabase = createClient();
    await supabase.from("early_access_applications").update({ status }).eq("id", id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setStatusCounts(prev => ({ ...prev })); // trigger re-render
    toast.success(`Status updated to ${status.replace("_", " ")}`);

    // If approved, trigger invite email
    if (status === "approved") {
      const app = applications.find(a => a.id === id);
      if (app) {
        try {
          await fetch("/api/early-access/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: app.email, full_name: app.full_name }),
          });
          toast.success("Approval email sent!");
        } catch {
          toast.error("Failed to send approval email.");
        }
      }
    }

    fetchStats();
  }

  async function saveNotes(id: string, notes: string) {
    const supabase = createClient();
    await supabase.from("early_access_applications").update({ notes }).eq("id", id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
    if (detailApp?.id === id) setDetailApp(prev => prev ? { ...prev, notes } : prev);
    toast.success("Notes saved.");
  }

  function exportCSV() {
    const headers = [
      "Full Name", "Email", "Phone", "Company", "Industry", "Size",
      "Referral Method", "Monthly Volume", "Biggest Challenge",
      "Desired Plan", "How Heard", "Status", "Submitted",
    ];
    const rows = applications.map(a => [
      a.full_name, a.email, a.phone || "", a.company_name,
      INDUSTRY_LABELS[a.industry] || a.industry, a.company_size,
      a.current_referral_method ? (METHOD_LABELS[a.current_referral_method] || a.current_referral_method) : "",
      a.monthly_referral_volume || "", a.biggest_challenge || "",
      a.desired_plan ? (PLAN_LABELS[a.desired_plan] || a.desired_plan) : "",
      a.how_did_you_hear || "", a.status, a.submitted_at,
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const totalAll = Object.values(statusCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">{total} applications found</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{totalAll}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        {STATUS_OPTIONS.filter(s => s.value !== "declined").map(s => (
          <Card key={s.value}>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{statusCounts[s.value] || 0}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-bold text-muted-foreground">Top Industry</p>
            <p className="text-lg font-bold">{topIndustry || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-bold text-muted-foreground">Most Requested Plan</p>
            <p className="text-lg font-bold">{topPlan || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-bold text-muted-foreground">This Week</p>
            <p className="text-lg font-bold">{statusCounts.new || 0} new</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search company, name, or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterIndustry} onValueChange={v => { setFilterIndustry(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {Object.entries(INDUSTRY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSize} onValueChange={v => { setFilterSize(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Size" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="solo">Solo</SelectItem>
            <SelectItem value="2-5">2-5</SelectItem>
            <SelectItem value="6-15">6-15</SelectItem>
            <SelectItem value="16-50">16-50</SelectItem>
            <SelectItem value="50+">50+</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={v => { setFilterPlan(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">Company</th>
                <th className="p-3 font-medium text-muted-foreground">Contact</th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Industry</th>
                <th className="p-3 font-medium text-muted-foreground hidden lg:table-cell">Size</th>
                <th className="p-3 font-medium text-muted-foreground hidden lg:table-cell">Volume</th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Plan</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Applied</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="p-3"><div className="h-10 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : applications.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No applications found.</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="border-b cursor-pointer hover:bg-muted/30" onClick={() => { setDetailApp(app); setEditingNotes(app.notes || ""); }}>
                    <td className="p-3 font-medium">{app.company_name}</td>
                    <td className="p-3">
                      <p>{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell">{INDUSTRY_LABELS[app.industry] || app.industry}</td>
                    <td className="p-3 hidden lg:table-cell">{app.company_size}</td>
                    <td className="p-3 hidden lg:table-cell">{app.monthly_referral_volume || "—"}</td>
                    <td className="p-3 hidden md:table-cell">{app.desired_plan ? (PLAN_LABELS[app.desired_plan] || app.desired_plan) : "—"}</td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <Select value={app.status} onValueChange={v => updateStatus(app.id, v as ApplicationStatus)}>
                        <SelectTrigger className="h-7 text-xs w-[120px]">
                          <Badge className={`${STATUS_COLORS[app.status] || STATUS_COLORS.new} border-0 text-xs`}>
                            {app.status.replace("_", " ")}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground text-xs">{relativeTime(app.submitted_at)}</td>
                    <td className="p-3">
                      <a href={`mailto:${app.email}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                        <Mail className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailApp} onOpenChange={() => setDetailApp(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {detailApp && (
            <>
              <DialogHeader>
                <DialogTitle>{detailApp.company_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Contact</h4>
                  <p><strong>Name:</strong> {detailApp.full_name}</p>
                  <p><strong>Email:</strong> {detailApp.email}</p>
                  <p><strong>Phone:</strong> {detailApp.phone || "—"}</p>
                </div>
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Business</h4>
                  <p><strong>Industry:</strong> {INDUSTRY_LABELS[detailApp.industry] || detailApp.industry}{detailApp.industry_other ? ` (${detailApp.industry_other})` : ""}</p>
                  <p><strong>Size:</strong> {detailApp.company_size}</p>
                  <p><strong>Website:</strong> {detailApp.website || "—"}</p>
                </div>
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Referral Info</h4>
                  <p><strong>Current method:</strong> {detailApp.current_referral_method ? (METHOD_LABELS[detailApp.current_referral_method] || detailApp.current_referral_method) : "—"}{detailApp.current_referral_method_other ? ` (${detailApp.current_referral_method_other})` : ""}</p>
                  <p><strong>Monthly volume:</strong> {detailApp.monthly_referral_volume || "—"}</p>
                  <p><strong>Biggest challenge:</strong> {detailApp.biggest_challenge || "—"}</p>
                </div>
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Interest</h4>
                  <p><strong>Desired plan:</strong> {detailApp.desired_plan ? (PLAN_LABELS[detailApp.desired_plan] || detailApp.desired_plan) : "—"}</p>
                  <p><strong>How they heard:</strong> {detailApp.how_did_you_hear || "—"}</p>
                </div>
                {(detailApp.utm_source || detailApp.utm_medium || detailApp.utm_campaign) && (
                  <div>
                    <h4 className="font-bold text-muted-foreground mb-1">UTM</h4>
                    <p><strong>Source:</strong> {detailApp.utm_source || "—"}</p>
                    <p><strong>Medium:</strong> {detailApp.utm_medium || "—"}</p>
                    <p><strong>Campaign:</strong> {detailApp.utm_campaign || "—"}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Status</h4>
                  <Select value={detailApp.status} onValueChange={v => { updateStatus(detailApp.id, v as ApplicationStatus); setDetailApp(prev => prev ? { ...prev, status: v as ApplicationStatus } : prev); }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Internal Notes</h4>
                  <Textarea
                    value={editingNotes}
                    onChange={e => setEditingNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes about this application..."
                  />
                  <Button
                    size="sm"
                    className="mt-2 bg-teal-600 hover:bg-teal-700"
                    onClick={() => saveNotes(detailApp.id, editingNotes)}
                  >
                    Save Notes
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(detailApp.submitted_at).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
