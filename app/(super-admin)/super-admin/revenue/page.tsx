"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

interface RevenueData {
  mrr: number;
  totalBusinesses: number;
  freeCount: number;
  starterCount: number;
  conversionRate: number;
  monthlyHistory: { month: string; mrr: number; businesses: number; newSignups: number; churned: number }[];
  recentChanges: { business: string; action: string; plan: string; date: string }[];
}

export default function RevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/revenue");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load revenue data.</p>;

  const mrrChange = data.monthlyHistory.length >= 2
    ? data.mrr - data.monthlyHistory[data.monthlyHistory.length - 2].mrr
    : 0;

  const metrics = [
    {
      label: "Monthly Recurring Revenue",
      value: `$${data.mrr.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-100",
      change: mrrChange,
    },
    {
      label: "Starter Plan Businesses",
      value: data.starterCount,
      icon: Users,
      color: "text-teal-600 bg-teal-100",
      change: null,
    },
    {
      label: "Free Plan Businesses",
      value: data.freeCount,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      change: null,
    },
    {
      label: "Free → Starter Conversion",
      value: `${data.conversionRate}%`,
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-100",
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">Track your MRR, plan distribution, and growth trends.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${m.color}`}>
                <m.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-bold">{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                {m.change !== null && m.change !== 0 && (
                  <p className={`flex items-center gap-1 text-xs font-medium ${m.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {m.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {m.change >= 0 ? "+" : ""}${Math.abs(m.change)} vs last month
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">MRR History</CardTitle></CardHeader>
        <CardContent>
          {data.monthlyHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No history yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-muted-foreground uppercase border-b pb-2">
                <span>Month</span>
                <span>MRR</span>
                <span>Total Businesses</span>
                <span>New Signups</span>
                <span>Churned</span>
              </div>
              {[...data.monthlyHistory].reverse().map((row) => (
                <div key={row.month} className="grid grid-cols-5 gap-4 text-sm items-center">
                  <span className="font-medium">{row.month}</span>
                  <span className="font-bold text-green-600">${row.mrr.toLocaleString()}</span>
                  <span>{row.businesses}</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-3 w-3" />{row.newSignups}
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    {row.churned > 0 && <ArrowDownRight className="h-3 w-3" />}{row.churned}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Plan Changes */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Plan Changes</CardTitle></CardHeader>
        <CardContent>
          {data.recentChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent plan changes.</p>
          ) : (
            <div className="space-y-3">
              {data.recentChanges.map((change, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{change.business}</p>
                    <p className="text-xs text-muted-foreground">{change.action}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={
                      change.plan === "starter" ? "border-teal-300 bg-teal-50 text-teal-700" :
                      "border-gray-300 bg-gray-50 text-gray-700"
                    }>
                      {change.plan}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(change.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
