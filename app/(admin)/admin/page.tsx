"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/relative-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Gem,
  Percent,
  ClipboardList,
  Gift,
  UserPlus,
  Star,
  Trophy,
  Send as SendIcon,
} from "lucide-react";

interface Metrics {
  activeCustomers: number;
  referralsThisMonth: number;
  referralsLastMonth: number;
  pointsDistributed: number;
  totalReferrals: number;
  completedReferrals: number;
}

interface PipelineCounts {
  pending: number;
  contacted: number;
  quoted: number;
  won: number;
  lost: number;
}

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  text: string;
  time: string;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    activeCustomers: 0, referralsThisMonth: 0, referralsLastMonth: 0,
    pointsDistributed: 0, totalReferrals: 0, completedReferrals: 0,
  });
  const [pipeline, setPipeline] = useState<PipelineCounts>({ pending: 0, contacted: 0, quoted: 0, won: 0, lost: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) return;
    const cid = profile.company_id;

    // Active customers
    const { count: custCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      .eq("company_id", cid).eq("role", "customer");

    // Referrals this month
    const now = new Date();
    const som = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: thisMonth } = await supabase.from("referrals").select("*", { count: "exact", head: true })
      .eq("company_id", cid).gte("created_at", som);

    // Referrals last month
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lmEnd = som;
    const { count: lastMonth } = await supabase.from("referrals").select("*", { count: "exact", head: true })
      .eq("company_id", cid).gte("created_at", lmStart).lt("created_at", lmEnd);

    // Points distributed this month
    const { data: ptData } = await supabase.from("point_transactions").select("amount")
      .eq("company_id", cid).eq("type", "earned").gte("created_at", som);
    const ptsDist = ptData?.reduce((s, t) => s + t.amount, 0) ?? 0;

    // Total + completed referrals
    const { count: totalRef } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", cid);
    const { count: compRef } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("status", "won");

    setMetrics({
      activeCustomers: custCount ?? 0,
      referralsThisMonth: thisMonth ?? 0,
      referralsLastMonth: lastMonth ?? 0,
      pointsDistributed: ptsDist,
      totalReferrals: totalRef ?? 0,
      completedReferrals: compRef ?? 0,
    });

    // Pipeline counts
    const statuses = ["pending", "contacted", "quoted", "won", "lost"] as const;
    const pipe: PipelineCounts = { pending: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
    for (const s of statuses) {
      const { count } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("status", s);
      pipe[s] = count ?? 0;
    }
    setPipeline(pipe);

    // Recent activity (point_transactions as proxy)
    const { data: recentTx } = await supabase.from("point_transactions").select("*, profiles!point_transactions_profile_id_fkey(full_name)")
      .eq("company_id", cid).order("created_at", { ascending: false }).limit(20);

    const items: ActivityItem[] = (recentTx ?? []).map((tx) => {
      const name = (tx.profiles as { full_name: string } | null)?.full_name ?? "Customer";
      let icon: React.ReactNode = <Star className="h-4 w-4" />;
      let text = `${name}: ${tx.description || tx.type}`;
      if (tx.type === "earned") icon = <Star className="h-4 w-4 text-amber-500" />;
      if (tx.type === "redeemed") { icon = <Gift className="h-4 w-4 text-purple-500" />; }
      return { id: tx.id, icon, text, time: relativeTime(tx.created_at) };
    });
    setActivity(items);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const conversionRate = metrics.totalReferrals > 0
    ? Math.round((metrics.completedReferrals / metrics.totalReferrals) * 100) : 0;
  const refTrend = metrics.referralsLastMonth > 0
    ? Math.round(((metrics.referralsThisMonth - metrics.referralsLastMonth) / metrics.referralsLastMonth) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted"/>)}
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-muted"/>
      </div>
    );
  }

  const metricCards = [
    { label: "Active Customers", value: metrics.activeCustomers, icon: Users, color: "text-blue-600 bg-blue-100", trend: null },
    { label: "Referrals This Month", value: metrics.referralsThisMonth, icon: ClipboardList, color: "text-teal-600 bg-teal-100", trend: refTrend },
    { label: "Points Distributed", value: metrics.pointsDistributed, icon: Gem, color: "text-amber-600 bg-amber-100", trend: null },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: Percent, color: "text-green-600 bg-green-100", trend: null },
  ];

  const pipeStages = [
    { label: "Submitted", count: pipeline.pending, status: "pending" },
    { label: "Contacted", count: pipeline.contacted, status: "contacted" },
    { label: "Quote Sent", count: pipeline.quoted, status: "quoted" },
    { label: "Complete", count: pipeline.won, status: "won" },
  ];
  const maxPipe = Math.max(...pipeStages.map(s => s.count), 1);

  const quickActions = [
    { label: "Add Customer", href: "/admin/customers", icon: UserPlus, color: "text-teal-600 bg-teal-100" },
    { label: "View Referrals", href: "/admin/referrals", icon: ClipboardList, color: "text-blue-600 bg-blue-100" },
    { label: "Manage Rewards", href: "/admin/rewards", icon: Gift, color: "text-amber-600 bg-amber-100" },
    { label: "Invite Team", href: "/admin/team", icon: Users, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your referral program and track performance.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(c => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                <c.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-bold">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                {c.trend !== null && (
                  <p className={`flex items-center gap-1 text-xs font-medium ${c.trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {c.trend >= 0 ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
                    {c.trend >= 0 ? "+" : ""}{c.trend}% vs last month
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Referral Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipeStages.map(s => (
              <Link key={s.status} href={`/admin/referrals?status=${s.status}`} className="group flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-muted-foreground">{s.label}</span>
                <div className="flex-1 rounded-full bg-muted h-7 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-500 transition-all flex items-center px-3"
                       style={{ width: `${Math.max((s.count / maxPipe) * 100, 8)}%` }}>
                    <span className="text-xs font-bold text-white">{s.count}</span>
                  </div>
                </div>
              </Link>
            ))}
            {pipeline.lost > 0 && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-red-500">Cancelled</span>
                <div className="flex-1 rounded-full bg-muted h-7 overflow-hidden">
                  <div className="h-full rounded-full bg-red-400 flex items-center px-3"
                       style={{ width: `${Math.max((pipeline.lost / maxPipe) * 100, 8)}%` }}>
                    <span className="text-xs font-bold text-white">{pipeline.lost}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activity.map(a => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">{a.icon}</span>
                    <p className="flex-1 truncate">{a.text}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickActions.map(a => (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.color}`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="font-medium text-sm">{a.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
