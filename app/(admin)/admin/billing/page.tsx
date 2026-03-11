"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, Crown } from "lucide-react";
import type { PlanTier } from "@/lib/types";

interface PlanInfo {
  name: string;
  price: string;
  customers: string;
  teamMembers: string;
  features: { label: string; included: boolean }[];
}

const PLANS: Record<PlanTier, PlanInfo> = {
  free: {
    name: "Free", price: "$0", customers: "50", teamMembers: "1",
    features: [
      { label: "Referral tracking", included: true },
      { label: "Basic dashboard", included: true },
      { label: "Up to 3 rewards", included: true },
      { label: "Up to 3 services", included: true },
      { label: "Basic analytics", included: true },
      { label: "Reports & charts", included: false },
      { label: "Email automation", included: false },
      { label: "Custom branding", included: false },
    ],
  },
  beta: {
    name: "Beta", price: "$99/mo", customers: "200", teamMembers: "3",
    features: [
      { label: "Referral tracking", included: true },
      { label: "Full dashboard", included: true },
      { label: "Up to 10 rewards", included: true },
      { label: "Up to 10 services", included: true },
      { label: "Full analytics", included: true },
      { label: "Reports & charts", included: true },
      { label: "Email automation", included: true },
      { label: "Custom branding", included: true },
    ],
  },
};

const PLAN_ORDER: PlanTier[] = ["free", "beta"];

export default function BillingPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [customerCount, setCustomerCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);

  const fetchUsage = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/billing");
      if (!res.ok) throw new Error("Failed to fetch billing");
      const data = await res.json();
      setCustomerCount(data.customerCount ?? 0);
      setTeamCount(data.teamCount ?? 0);
    } catch { /* ignore */ }
  }, [profile?.company_id]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const currentPlan = company?.plan_tier ?? "free";
  const planInfo = PLANS[currentPlan as PlanTier] ?? PLANS.free;
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as PlanTier);

  const custLimit = parseInt(planInfo.customers) || 9999;
  const teamLimit = parseInt(planInfo.teamMembers) || 9999;
  const custPct = Math.min((customerCount / custLimit) * 100, 100);
  const teamPct = Math.min((teamCount / teamLimit) * 100, 100);

  // Mock invoices
  const invoices = [
    { date: "Jan 1, 2025", amount: planInfo.price === "$0" ? "$0.00" : planInfo.price.replace("/mo", ""), status: "Paid" },
    { date: "Dec 1, 2024", amount: planInfo.price === "$0" ? "$0.00" : planInfo.price.replace("/mo", ""), status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plan</h1>
        <p className="text-muted-foreground">Manage your subscription and billing.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            <Badge className="bg-teal-600">{planInfo.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-extrabold">{planInfo.price === "$0" ? "Free" : planInfo.price}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Customers</span>
                <span className="font-medium">{customerCount} / {planInfo.customers}</span>
              </div>
              <Progress value={custPct} className="h-2 [&>div]:bg-teal-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Members</span>
                <span className="font-medium">{teamCount} / {planInfo.teamMembers}</span>
              </div>
              <Progress value={teamPct} className="h-2 [&>div]:bg-teal-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader><CardTitle>Compare Plans</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-medium text-muted-foreground">Feature</th>
                {PLAN_ORDER.map(p => (
                  <th key={p} className={`p-3 text-center ${p === currentPlan ? "bg-teal-50" : ""}`}>
                    <div className="font-bold">{PLANS[p].name}</div>
                    <div className="text-muted-foreground font-normal">{PLANS[p].price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium">Customers</td>
                {PLAN_ORDER.map(p => (
                  <td key={p} className={`p-3 text-center ${p === currentPlan ? "bg-teal-50" : ""}`}>{PLANS[p].customers}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">Team Members</td>
                {PLAN_ORDER.map(p => (
                  <td key={p} className={`p-3 text-center ${p === currentPlan ? "bg-teal-50" : ""}`}>{PLANS[p].teamMembers}</td>
                ))}
              </tr>
              {PLANS.free.features.map((_, fi) => (
                <tr key={fi} className="border-b">
                  <td className="p-3 font-medium">{PLANS.free.features[fi].label}</td>
                  {PLAN_ORDER.map(p => {
                    const feat = PLANS[p].features[fi];
                    return (
                      <td key={p} className={`p-3 text-center ${p === currentPlan ? "bg-teal-50" : ""}`}>
                        {feat.included
                          ? <Check className="mx-auto h-4 w-4 text-teal-600" />
                          : <X className="mx-auto h-4 w-4 text-gray-300" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="p-3"></td>
                {PLAN_ORDER.map((p, i) => (
                  <td key={p} className={`p-3 text-center ${p === currentPlan ? "bg-teal-50" : ""}`}>
                    {p === currentPlan ? (
                      <Badge variant="outline">Current Plan</Badge>
                    ) : i > currentIdx ? (
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => toast.info("Stripe integration coming soon!")}>
                        <Crown className="mr-1 h-3 w-3" /> Upgrade
                      </Button>
                    ) : null}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader><CardTitle>Billing History</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">Date</th>
                <th className="p-3 font-medium text-muted-foreground">Amount</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">{inv.date}</td>
                  <td className="p-3 font-medium">{inv.amount}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
