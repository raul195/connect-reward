"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = ["#0D9488", "#F59E0B", "#3B82F6", "#8B5CF6", "#EF4444", "#10B981"];

type DateRange = "week" | "month" | "30d" | "90d" | "year";

export default function ReportsPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [range, setRange] = useState<DateRange>("month");
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({ totalRef: 0, completed: 0, rate: 0, ptsDist: 0, ptsRedeemed: 0, activeCust: 0 });
  const [refOverTime, setRefOverTime] = useState<{ date: string; submitted: number; completed: number }[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [topReferrers, setTopReferrers] = useState<{ name: string; count: number }[]>([]);
  const [topRewards, setTopRewards] = useState<{ name: string; count: number }[]>([]);

  const canExport = company?.plan === "growth" || company?.plan === "pro";

  const getStartDate = useCallback((): Date => {
    const now = new Date();
    switch (range) {
      case "week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month": return new Date(now.getFullYear(), now.getMonth(), 1);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "year": return new Date(now.getFullYear(), 0, 1);
      default: return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }, [range]);

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    const supabase = createClient();
    const cid = profile.company_id;
    const since = getStartDate().toISOString();

    // Metrics
    const { count: totalRef } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", cid).gte("created_at", since);
    const { count: completed } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("status", "won").gte("created_at", since);
    const { data: earnedTx } = await supabase.from("point_transactions").select("amount").eq("company_id", cid).eq("type", "earned").gte("created_at", since);
    const { data: redeemedTx } = await supabase.from("point_transactions").select("amount").eq("company_id", cid).eq("type", "redeemed").gte("created_at", since);
    const { count: activeCust } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("role", "customer");

    const ptsDist = earnedTx?.reduce((s, t) => s + t.amount, 0) ?? 0;
    const ptsRedeemed = Math.abs(redeemedTx?.reduce((s, t) => s + t.amount, 0) ?? 0);
    const t = totalRef ?? 0;
    const c = completed ?? 0;

    setMetrics({ totalRef: t, completed: c, rate: t > 0 ? Math.round((c / t) * 100) : 0, ptsDist, ptsRedeemed, activeCust: activeCust ?? 0 });

    // Funnel
    const statuses = ["pending", "contacted", "quoted", "won"] as const;
    const funnelData: { stage: string; count: number }[] = [];
    for (const s of statuses) {
      const { count: sc } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("status", s);
      const labels: Record<string, string> = { pending: "Submitted", contacted: "Contacted", quoted: "Quote Sent", won: "Complete" };
      funnelData.push({ stage: labels[s], count: sc ?? 0 });
    }
    setFunnel(funnelData);

    // Referrals over time (simplified: group by week)
    const { data: allRef } = await supabase.from("referrals").select("status, created_at").eq("company_id", cid).gte("created_at", since).order("created_at");
    const timeMap = new Map<string, { submitted: number; completed: number }>();
    for (const r of allRef ?? []) {
      const d = new Date(r.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!timeMap.has(key)) timeMap.set(key, { submitted: 0, completed: 0 });
      const entry = timeMap.get(key)!;
      entry.submitted++;
      if (r.status === "won") entry.completed++;
    }
    setRefOverTime([...timeMap.entries()].map(([date, v]) => ({ date, ...v })));

    // Top referrers
    const { data: refProfiles } = await supabase.from("referrals").select("referrer_id, profiles!referrals_referrer_id_fkey(full_name)")
      .eq("company_id", cid).gte("created_at", since);
    const refMap = new Map<string, { name: string; count: number }>();
    for (const r of refProfiles ?? []) {
      const profiles = r.profiles as unknown as { full_name: string }[] | { full_name: string } | null;
      const name = Array.isArray(profiles) ? profiles[0]?.full_name ?? "Unknown" : profiles?.full_name ?? "Unknown";
      const existing = refMap.get(r.referrer_id) ?? { name, count: 0 };
      existing.count++;
      refMap.set(r.referrer_id, existing);
    }
    setTopReferrers([...refMap.values()].sort((a, b) => b.count - a.count).slice(0, 10));

    // Top rewards
    const { data: redemptions } = await supabase.from("redemptions").select("reward_id, rewards!redemptions_reward_id_fkey(name)")
      .eq("company_id", cid).gte("created_at", since);
    const rwdMap = new Map<string, { name: string; count: number }>();
    for (const rd of redemptions ?? []) {
      const rewards = rd.rewards as unknown as { name: string }[] | { name: string } | null;
      const name = Array.isArray(rewards) ? rewards[0]?.name ?? "Unknown" : rewards?.name ?? "Unknown";
      const existing = rwdMap.get(rd.reward_id) ?? { name, count: 0 };
      existing.count++;
      rwdMap.set(rd.reward_id, existing);
    }
    setTopRewards([...rwdMap.values()].sort((a, b) => b.count - a.count).slice(0, 5));

    setLoading(false);
  }, [profile?.company_id, getStartDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metricCards = [
    { label: "Total Referrals", value: metrics.totalRef },
    { label: "Completed", value: metrics.completed },
    { label: "Conversion Rate", value: `${metrics.rate}%` },
    { label: "Points Distributed", value: metrics.ptsDist.toLocaleString() },
    { label: "Points Redeemed", value: metrics.ptsRedeemed.toLocaleString() },
    { label: "Active Customers", value: metrics.activeCust },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your program performance.</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" disabled={!canExport} onClick={() => toast.info("CSV export coming soon!")}>
                    {!canExport && <Lock className="mr-1 h-3 w-3" />}
                    <Download className="mr-1 h-3 w-3" /> CSV
                  </Button>
                </span>
              </TooltipTrigger>
              {!canExport && <TooltipContent>Upgrade to Growth to export data</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
          <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Metric Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {metricCards.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1,2,3,4].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Referrals Over Time */}
            <Card>
              <CardHeader><CardTitle className="text-base">Referrals Over Time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={refOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RTooltip />
                    <Line type="monotone" dataKey="submitted" stroke="#3B82F6" strokeWidth={2} name="Submitted" />
                    <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={80} />
                    <RTooltip />
                    <Bar dataKey="count" fill="#0D9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader><CardTitle className="text-base">Top Referrers</CardTitle></CardHeader>
              <CardContent>
                {topReferrers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topReferrers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                      <RTooltip />
                      <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Referrals" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Most Popular Rewards */}
            <Card>
              <CardHeader><CardTitle className="text-base">Popular Rewards</CardTitle></CardHeader>
              <CardContent>
                {topRewards.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No redemptions yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={topRewards} dataKey="count" nameKey="name" cx="50%" cy="50%"
                        outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {topRewards.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
