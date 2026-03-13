"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { relativeTime } from "@/lib/relative-time";
import { TierBadge } from "@/components/shared/TierBadge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Star, TrendingUp,
  Send, Plus, Minus, BanIcon, CheckCircle2, XCircle, Clock, AlertTriangle,
} from "lucide-react";
import type {
  Profile, Referral, PointTransaction, EmailLog, EmailPreferences,
  LoyaltyTier, ReferralStatus,
} from "@/lib/types";

const STATUS_COLORS: Record<ReferralStatus, string> = {
  submitted: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  consultation_scheduled: "bg-purple-100 text-purple-800",
  installation_complete: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<ReferralStatus, string> = {
  submitted: "Submitted",
  contacted: "Contacted",
  consultation_scheduled: "Scheduled",
  installation_complete: "Completed",
  cancelled: "Cancelled",
};

const TX_TYPE_LABELS: Record<string, string> = {
  referral_completed: "Referral Completed",
  redemption: "Redemption",
  signup_bonus: "Signup Bonus",
  manual_adjustment: "Manual Adjustment",
  milestone_bonus: "Milestone Bonus",
};

interface CustomerData {
  profile: Profile;
  referrals: Referral[];
  pointTransactions: PointTransaction[];
  emailLogs: EmailLog[];
  emailPreferences: EmailPreferences | null;
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Adjust points dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // DNC toggle
  const [togglingDnc, setTogglingDnc] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Customer not found");
          router.push("/admin/customers");
          return;
        }
        throw new Error("Failed to load");
      }
      const json = await res.json();
      setData(json.data);
    } catch {
      toast.error("Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAdjustPoints() {
    if (!adjAmount) return;
    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_points",
          amount: parseInt(adjAmount),
          reason: adjReason,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to adjust points");
        return;
      }
      toast.success("Points adjusted");
      setAdjustOpen(false);
      setAdjAmount("");
      setAdjReason("");
      fetchData();
    } catch {
      toast.error("Failed to adjust points");
    } finally {
      setAdjusting(false);
    }
  }

  async function handleToggleDnc() {
    setTogglingDnc(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_dnc" }),
      });
      if (!res.ok) {
        toast.error("Failed to update DNC status");
        return;
      }
      const json = await res.json();
      toast.success(json.opt_out ? "Marked as Do Not Contact" : "DNC removed");
      fetchData();
    } catch {
      toast.error("Failed to update DNC status");
    } finally {
      setTogglingDnc(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, referrals, pointTransactions, emailLogs, emailPreferences } = data;
  const isDnc = emailPreferences?.opt_out ?? false;
  const availablePoints = profile.total_points - profile.redeemed_points;
  const completedReferrals = referrals.filter(r => r.status === "installation_complete").length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Button>

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xl font-bold shrink-0">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  <TierBadge tier={profile.tier as LoyaltyTier} />
                  {isDnc && (
                    <Badge variant="destructive" className="gap-1">
                      <BanIcon className="h-3 w-3" /> DNC
                    </Badge>
                  )}
                  {profile.email_status === "bounced" && (
                    <Badge variant="destructive">Email Bounced</Badge>
                  )}
                  {profile.email_status === "complained" && (
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Spam Complaint</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {profile.phone}
                    </span>
                  )}
                  {(profile.city || profile.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />{" "}
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined {relativeTime(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setAdjustOpen(true)}>
                <TrendingUp className="mr-1.5 h-4 w-4" /> Adjust Points
              </Button>
              <Button
                variant={isDnc ? "outline" : "destructive"}
                size="sm"
                onClick={handleToggleDnc}
                disabled={togglingDnc}
              >
                <BanIcon className="mr-1.5 h-4 w-4" />
                {isDnc ? "Remove DNC" : "Mark DNC"}
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{profile.total_points.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{availablePoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Available Points</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{profile.referral_count}</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{completedReferrals}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" /> Referrals ({referrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrals yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{r.referral_name}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.points_awarded > 0 && (
                        <span className="text-xs font-medium text-green-600">+{r.points_awarded} pts</span>
                      )}
                      <Badge variant="secondary" className={STATUS_COLORS[r.status]}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" /> Points History ({pointTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pointTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {pointTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">
                        {TX_TYPE_LABELS[tx.type] || tx.type}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tx.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{relativeTime(tx.created_at)}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email Activity ({emailLogs.length})
              {isDnc && (
                <Badge variant="destructive" className="ml-2 text-xs">DNC — Emails paused</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No emails sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Template</th>
                      <th className="pb-2 pr-4 font-medium">Recipient</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">
                          {log.template_name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{log.recipient_email}</td>
                        <td className="py-2 pr-4">
                          {log.status === "sent" && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                            </span>
                          )}
                          {log.status === "failed" && (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-3.5 w-3.5" /> Failed
                            </span>
                          )}
                          {log.status === "skipped" && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-3.5 w-3.5" /> Skipped
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{relativeTime(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adjust Points Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points — {profile.full_name}</DialogTitle>
            <DialogDescription>
              Current balance: {profile.total_points.toLocaleString()} pts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (positive to add, negative to subtract)</Label>
              <Input
                type="number"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Reason for adjustment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdjustPoints}
              disabled={adjusting || !adjAmount}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {adjusting ? "Adjusting..." : "Adjust Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
