"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { isDemoAccount } from "@/lib/demo";
import { sampleAdminReports } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function ReportsPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({ totalRef: 0, completed: 0, rate: 0, ptsDist: 0, ptsRedeemed: 0, activeCust: 0 });
  const [refOverTime, setRefOverTime] = useState<{ date: string; submitted: number; completed: number }[]>([]);

  const isFreePlan = company?.plan_tier === "free";

  const [useSample, setUseSample] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=month`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();

      if (data.metrics.totalRef === 0 && !isDemoAccount(profile.email)) {
        setMetrics(sampleAdminReports.metrics);
        setRefOverTime(sampleAdminReports.refOverTime);
        setUseSample(true);
      } else {
        setMetrics(data.metrics);
        setRefOverTime(data.refOverTime ?? []);
        setUseSample(false);
      }
    } catch {
      setMetrics(sampleAdminReports.metrics);
      setRefOverTime(sampleAdminReports.refOverTime);
      setUseSample(true);
    }
    setLoading(false);
  }, [profile?.company_id, profile?.email]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Free plan: show upgrade CTA
  if (!loading && isFreePlan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your program performance.</p>
        </div>
        <UpgradeCTA message="Full analytics and reports are available on the Starter plan. Upgrade to unlock." />
      </div>
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Track your program performance.</p>
      </div>

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
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : (
        /* Referrals Over Time — the only chart for beta */
        <Card>
          <CardHeader><CardTitle className="text-base">Referrals Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
      )}
    </div>
  );
}
