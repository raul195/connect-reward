"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/relative-time";

interface Metrics {
  totalApplications: number;
  totalCompanies: number;
  totalUsers: number;
  totalReferrals: number;
  weekApplications: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

export default function SuperAdminOverview() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalApplications: 0, totalCompanies: 0, totalUsers: 0, totalReferrals: 0, weekApplications: 0,
  });
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [recentApps, setRecentApps] = useState<{ company_name: string; industry: string; submitted_at: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalApps },
      { count: weekApps },
      { count: totalCompanies },
      { count: totalUsers },
      { count: totalReferrals },
    ] = await Promise.all([
      supabase.from("early_access_applications").select("*", { count: "exact", head: true }),
      supabase.from("early_access_applications").select("*", { count: "exact", head: true }).gte("submitted_at", weekAgo),
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("referrals").select("*", { count: "exact", head: true }),
    ]);

    setMetrics({
      totalApplications: totalApps ?? 0,
      weekApplications: weekApps ?? 0,
      totalCompanies: totalCompanies ?? 0,
      totalUsers: totalUsers ?? 0,
      totalReferrals: totalReferrals ?? 0,
    });

    // Funnel
    const stages = [
      { key: "new", label: "New", color: "bg-blue-500" },
      { key: "contacted", label: "Contacted", color: "bg-amber-500" },
      { key: "demo_scheduled", label: "Demo", color: "bg-purple-500" },
      { key: "approved", label: "Approved", color: "bg-green-500" },
      { key: "converted", label: "Converted", color: "bg-teal-500" },
    ];
    const funnelData: FunnelStage[] = [];
    for (const s of stages) {
      const { count } = await supabase.from("early_access_applications").select("*", { count: "exact", head: true }).eq("status", s.key);
      funnelData.push({ stage: s.label, count: count ?? 0, color: s.color });
    }
    setFunnel(funnelData);

    // Recent applications
    const { data: recent } = await supabase.from("early_access_applications")
      .select("company_name, industry, submitted_at, status")
      .order("submitted_at", { ascending: false })
      .limit(10);
    setRecentApps(recent ?? []);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metricCards = [
    { label: "Total Applications", value: metrics.totalApplications, color: "text-blue-600" },
    { label: "This Week", value: metrics.weekApplications, color: "text-teal-600" },
    { label: "Total Companies", value: metrics.totalCompanies, color: "text-purple-600" },
    { label: "Total Users", value: metrics.totalUsers, color: "text-amber-600" },
    { label: "Total Referrals", value: metrics.totalReferrals, color: "text-green-600" },
  ];

  const maxFunnel = Math.max(...funnel.map(f => f.count), 1);

  const STATUS_BADGES: Record<string, string> = {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground">Super admin dashboard.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-base">Application Funnel</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{f.stage}</span>
                  <span className="text-muted-foreground">{f.count}</span>
                </div>
                <div className="h-6 rounded bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${f.color} rounded transition-all`}
                    style={{ width: `${Math.max((f.count / maxFunnel) * 100, f.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                {i < funnel.length - 1 && f.count > 0 && funnel[i + 1].count > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Math.round((funnel[i + 1].count / f.count) * 100)}% conversion
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Applications</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {recentApps.length === 0 ? (
                  <tr><td className="p-6 text-center text-muted-foreground">No applications yet.</td></tr>
                ) : recentApps.map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3">
                      <p className="font-medium">{a.company_name}</p>
                      <p className="text-xs text-muted-foreground">{INDUSTRY_LABELS[a.industry] || a.industry}</p>
                    </td>
                    <td className="p-3">
                      <Badge className={`${STATUS_BADGES[a.status] || STATUS_BADGES.new} border-0 text-xs`}>
                        {a.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{relativeTime(a.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
