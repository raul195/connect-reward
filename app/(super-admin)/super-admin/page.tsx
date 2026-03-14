"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  Send,
  CheckCircle2,
  TrendingUp,
  Gift,
  Gem,
  Download,
  ArrowUpDown,
  Search,
  Loader2,
  Activity,
} from "lucide-react";
import { relativeTime } from "@/lib/relative-time";

// ── Types ──

interface Overview {
  totalBusinesses: number;
  freePlanCount: number;
  starterPlanCount: number;
  totalCustomers: number;
  totalReferrals: number;
  approvedReferrals: number;
  approvalRate: number;
  totalPoints: number;
  totalRedemptions: number;
}

interface Business {
  id: string;
  name: string;
  industry: string;
  plan_tier: string;
  customers: number;
  referrals_submitted: number;
  referrals_approved: number;
  approval_rate: number;
  points_awarded: number;
  redemptions: number;
  date_joined: string;
  last_active: string;
}

interface IndustryRow {
  industry: string;
  businesses: number;
  avg_approval_rate: number;
  avg_points_per_referral: number;
  avg_job_value: number;
}

interface ServiceRow {
  name: string;
  industry: string;
  count: number;
  avg_job_value: number;
  avg_margin: number;
  avg_points: number;
}

interface ActivityItem {
  type: string;
  business: string;
  detail: string;
  timestamp: string;
}

// ── Helpers ──

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  new_business: { label: "New Business", color: "bg-blue-100 text-blue-800" },
  referral_approved: { label: "Referral Approved", color: "bg-green-100 text-green-800" },
  reward_redeemed: { label: "Reward Redeemed", color: "bg-amber-100 text-amber-800" },
};

type SortKey = keyof Business;

// ── Component ──

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [industryBreakdown, setIndustryBreakdown] = useState<IndustryRow[]>([]);
  const [servicesBreakdown, setServicesBreakdown] = useState<ServiceRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  // Filters & sorting
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date_joined");
  const [sortAsc, setSortAsc] = useState(false);

  // Export loading
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/analytics");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOverview(data.overview);
      setBusinesses(data.businesses);
      setIndustryBreakdown(data.industryBreakdown);
      setServicesBreakdown(data.servicesBreakdown);
      setActivity(data.activity);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered & sorted businesses
  const filteredBusinesses = useMemo(() => {
    let list = [...businesses];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.industry.toLowerCase().includes(q)
      );
    }
    if (industryFilter !== "all") {
      list = list.filter((b) => b.industry === industryFilter);
    }
    if (planFilter !== "all") {
      list = list.filter((b) => b.plan_tier === planFilter);
    }
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [businesses, search, industryFilter, planFilter, sortKey, sortAsc]);

  const uniqueIndustries = useMemo(
    () => [...new Set(businesses.map((b) => b.industry).filter((i) => i && i !== "—"))],
    [businesses]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  async function handleExport(dataset: string) {
    setExporting(dataset);
    try {
      const res = await fetch(`/api/super-admin/export?dataset=${dataset}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ?? `${dataset}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    setExporting(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground">Cross-business performance overview</p>
        </div>
        <div className="flex gap-2">
          {["businesses", "services", "referrals", "customers"].map((ds) => (
            <Button
              key={ds}
              variant="outline"
              size="sm"
              disabled={exporting === ds}
              onClick={() => handleExport(ds)}
              className="gap-1.5"
            >
              {exporting === ds ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {ds}.csv
            </Button>
          ))}
        </div>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Businesses"
          value={overview.totalBusinesses}
          subtitle={`${overview.freePlanCount} free · ${overview.starterPlanCount} starter`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Total Customers"
          value={overview.totalCustomers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Referrals Submitted"
          value={overview.totalReferrals.toLocaleString()}
          subtitle={`${overview.approvedReferrals.toLocaleString()} approved`}
          icon={<Send className="h-5 w-5" />}
        />
        <MetricCard
          title="Approval Rate"
          value={`${overview.approvalRate}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Points Awarded"
          value={overview.totalPoints.toLocaleString()}
          icon={<Gem className="h-5 w-5" />}
        />
        <MetricCard
          title="Redemptions"
          value={overview.totalRedemptions.toLocaleString()}
          icon={<Gift className="h-5 w-5" />}
        />
      </div>

      {/* ── Businesses Table ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Businesses ({filteredBusinesses.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-40"
                />
              </div>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {uniqueIndustries.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="beta">Starter</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <SortHeader label="Business" sortKey="name" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Industry" sortKey="industry" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <th className="p-2 font-medium text-muted-foreground">Plan</th>
                <SortHeader label="Customers" sortKey="customers" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Refs" sortKey="referrals_submitted" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Approved" sortKey="referrals_approved" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Rate" sortKey="approval_rate" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Points" sortKey="points_awarded" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Redeemed" sortKey="redemptions" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Joined" sortKey="date_joined" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortHeader label="Active" sortKey="last_active" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-muted-foreground">
                    No businesses match your filters.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{b.name}</td>
                    <td className="p-2 text-muted-foreground">{b.industry}</td>
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className={
                          b.plan_tier === "free"
                            ? "border-gray-300 text-gray-600"
                            : "border-teal-300 text-teal-700"
                        }
                      >
                        {b.plan_tier === "free" ? "Free" : "Starter"}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">{b.customers}</td>
                    <td className="p-2 text-right">{b.referrals_submitted}</td>
                    <td className="p-2 text-right">{b.referrals_approved}</td>
                    <td className="p-2 text-right">{b.approval_rate}%</td>
                    <td className="p-2 text-right">{b.points_awarded.toLocaleString()}</td>
                    <td className="p-2 text-right">{b.redemptions}</td>
                    <td className="p-2 text-muted-foreground whitespace-nowrap">
                      {new Date(b.date_joined).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-muted-foreground whitespace-nowrap">
                      {relativeTime(b.last_active)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Industry Breakdown ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Industry Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2 font-medium text-muted-foreground">Industry</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Businesses</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Avg Approval Rate</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Avg Points/Referral</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Avg Job Value</th>
              </tr>
            </thead>
            <tbody>
              {industryBreakdown.map((row) => (
                <tr key={row.industry} className="border-b">
                  <td className="p-2 font-medium">{row.industry}</td>
                  <td className="p-2 text-right">{row.businesses}</td>
                  <td className="p-2 text-right">{row.avg_approval_rate}%</td>
                  <td className="p-2 text-right">{row.avg_points_per_referral.toLocaleString()}</td>
                  <td className="p-2 text-right">${row.avg_job_value.toLocaleString()}</td>
                </tr>
              ))}
              {industryBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No industry data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Services Breakdown ── */}
      <Card>
        <CardHeader>
          <CardTitle>Services Breakdown (Top 30)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2 font-medium text-muted-foreground">Service Name</th>
                <th className="p-2 font-medium text-muted-foreground">Industry</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Count</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Avg Job Value</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Avg Margin %</th>
                <th className="p-2 font-medium text-muted-foreground text-right">Avg Points</th>
              </tr>
            </thead>
            <tbody>
              {servicesBreakdown.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 font-medium">{row.name}</td>
                  <td className="p-2 text-muted-foreground">{row.industry}</td>
                  <td className="p-2 text-right">{row.count}</td>
                  <td className="p-2 text-right">${row.avg_job_value.toLocaleString()}</td>
                  <td className="p-2 text-right">{row.avg_margin > 0 ? `${row.avg_margin}%` : "—"}</td>
                  <td className="p-2 text-right">{row.avg_points.toLocaleString()}</td>
                </tr>
              ))}
              {servicesBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No service data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Activity Feed ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item, i) => {
                const meta = ACTIVITY_LABELS[item.type] ?? {
                  label: item.type,
                  color: "bg-gray-100 text-gray-800",
                };
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={meta.color}>
                        {meta.label}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{item.business}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(item.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ──

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-teal-600">{icon}</div>
        </div>
        <p className="mt-2 text-2xl font-extrabold">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SortHeader({
  label,
  sortKey: key,
  current,
  asc,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
}) {
  const isActive = current === key;
  return (
    <th
      className="p-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => onSort(key)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? "text-teal-600" : "text-muted-foreground/40"}`} />
        {isActive && (
          <span className="text-[10px] text-teal-600">{asc ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );
}
