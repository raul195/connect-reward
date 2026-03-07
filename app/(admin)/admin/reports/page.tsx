"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { isDemoAccount } from "@/lib/demo";
import { sampleAdminReports } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
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

  const canExport = company?.plan_tier === "growth" || company?.plan_tier === "pro";
  const [useSample, setUseSample] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();

      if (data.metrics.totalRef === 0 && !isDemoAccount(profile.email)) {
        setMetrics(sampleAdminReports.metrics);
        setRefOverTime(sampleAdminReports.refOverTime);
        setFunnel(sampleAdminReports.funnel);
        setTopReferrers(sampleAdminReports.topReferrers);
        setTopRewards(sampleAdminReports.topRewards);
        setUseSample(true);
      } else {
        setMetrics(data.metrics);
        setRefOverTime(data.refOverTime ?? []);
        setFunnel(data.funnel ?? []);
        setTopReferrers(data.topReferrers ?? []);
        setTopRewards(data.topRewards ?? []);
        setUseSample(false);
      }
    } catch {
      setMetrics(sampleAdminReports.metrics);
      setRefOverTime(sampleAdminReports.refOverTime);
      setFunnel(sampleAdminReports.funnel);
      setTopReferrers(sampleAdminReports.topReferrers);
      setTopRewards(sampleAdminReports.topRewards);
      setUseSample(true);
    }
    setLoading(false);
  }, [profile?.company_id, profile?.email, range]);

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
      {useSample && <SampleDataBanner />}
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
