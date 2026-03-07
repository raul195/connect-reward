"use client";

import { useEffect, useState, useCallback } from "react";
import { relativeTime } from "@/lib/relative-time";
import { sampleCustomerPoints } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Gift, Star, AlertCircle } from "lucide-react";
import type { PointTransaction, PointTxType } from "@/lib/types";

const TYPE_CONFIG: Record<PointTxType, { label: string; icon: React.ElementType; color: string }> = {
  referral_completed: { label: "Referral Completed", icon: TrendingUp, color: "text-green-600 bg-green-100" },
  redemption: { label: "Redeemed", icon: Gift, color: "text-red-600 bg-red-100" },
  signup_bonus: { label: "Signup Bonus", icon: Star, color: "text-blue-600 bg-blue-100" },
  manual_adjustment: { label: "Adjustment", icon: AlertCircle, color: "text-gray-600 bg-gray-100" },
  milestone_bonus: { label: "Milestone Bonus", icon: Star, color: "text-amber-600 bg-amber-100" },
};

export default function PointsHistoryPage() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSample, setUseSample] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/points");
      if (!res.ok) throw new Error("Failed to fetch points");
      const data = await res.json();

      const txs = (data.transactions ?? []) as PointTransaction[];
      if (txs.length === 0) {
        setTransactions(sampleCustomerPoints.transactions as unknown as PointTransaction[]);
        setUseSample(true);
      } else {
        setTransactions(txs);
      }
    } catch {
      // fetch error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {useSample && <SampleDataBanner />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Points History</h1>
        <p className="text-muted-foreground">{transactions.length} transactions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">+{totalEarned.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">-{totalSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{(totalEarned - totalSpent).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Net Balance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No point transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const cfg = TYPE_CONFIG[tx.type];
                const Icon = cfg.icon;
                const isPositive = tx.amount > 0;

                return (
                  <div key={tx.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || cfg.label}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(tx.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                    </div>
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
