"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { isDemoAccount } from "@/lib/demo";
import { sampleAdminDashboard } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
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
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Metrics {
  activeCustomers: number;
  referralsThisMonth: number;
  referralsLastMonth: number;
  pointsDistributed: number;
  totalReferrals: number;
  completedReferrals: number;
}

interface PipelineCounts {
  submitted: number;
  contacted: number;
  consultation_scheduled: number;
  installation_complete: number;
  cancelled: number;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
}

export default function AdminDashboard() {
  const { profile } = useProfile();
  const [metrics, setMetrics] = useState<Metrics>({
    activeCustomers: 0, referralsThisMonth: 0, referralsLastMonth: 0,
    pointsDistributed: 0, totalReferrals: 0, completedReferrals: 0,
  });
  const [pipeline, setPipeline] = useState<PipelineCounts>({ submitted: 0, contacted: 0, consultation_scheduled: 0, installation_complete: 0, cancelled: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSample, setUseSample] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackImprovements, setFeedbackImprovements] = useState("");
  const [feedbackLikes, setFeedbackLikes] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();

      const m = data.metrics as Metrics;
      const isDemo = isDemoAccount(profile?.email);

      if (m.activeCustomers === 0 && m.totalReferrals === 0 && !isDemo) {
        setMetrics(sampleAdminDashboard.metrics);
        setPipeline(sampleAdminDashboard.pipeline);
        setActivity(sampleAdminDashboard.activity);
        setUseSample(true);
      } else {
        setMetrics(m);
        setPipeline(data.pipeline);
        setActivity(data.activity ?? []);
        setUseSample(false);
      }
    } catch {
      setMetrics(sampleAdminDashboard.metrics);
      setPipeline(sampleAdminDashboard.pipeline);
      setActivity(sampleAdminDashboard.activity);
      setUseSample(true);
    }
    setLoading(false);
  }, [profile?.email]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if feedback banner should show
  useEffect(() => {
    if (!profile?.created_at) return;

    const dismissed = localStorage.getItem("feedback_dismissed");
    if (dismissed) return;

    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const daysSinceSignup = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSignup < 7) return;

    // Check if already submitted
    (async () => {
      try {
        const res = await fetch("/api/admin/feedback");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.submitted) {
          setShowFeedback(true);
        }
      } catch { /* ignore */ }
    })();
  }, [profile?.created_at]);

  function dismissFeedback() {
    localStorage.setItem("feedback_dismissed", "true");
    setShowFeedback(false);
  }

  async function submitFeedback() {
    if (feedbackRating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          improvements: feedbackImprovements || null,
          likes: feedbackLikes || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Thanks for your feedback!");
      setFeedbackDialogOpen(false);
      setShowFeedback(false);
      localStorage.setItem("feedback_dismissed", "true");
    } catch {
      toast.error("Failed to submit feedback.");
    }
    setSubmittingFeedback(false);
  }

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
    { label: "Submitted", count: pipeline.submitted, status: "submitted" },
    { label: "Contacted", count: pipeline.contacted, status: "contacted" },
    { label: "Consultation Scheduled", count: pipeline.consultation_scheduled, status: "consultation_scheduled" },
    { label: "Complete", count: pipeline.installation_complete, status: "installation_complete" },
  ];
  const maxPipe = Math.max(...pipeStages.map(s => s.count), 1);

  const quickActions = [
    { label: "Add Customer", href: "/admin/customers", icon: UserPlus, color: "text-teal-600 bg-teal-100" },
    { label: "View Referrals", href: "/admin/referrals", icon: ClipboardList, color: "text-blue-600 bg-blue-100" },
    { label: "Manage Rewards", href: "/admin/rewards", icon: Gift, color: "text-amber-600 bg-amber-100" },
    { label: "Invite Team", href: "/admin/team", icon: Users, color: "text-purple-600 bg-purple-100" },
  ];

  const isEmpty = metrics.activeCustomers === 0 && metrics.totalReferrals === 0;

  return (
    <div className="space-y-6">
      {useSample && <SampleDataBanner />}

      {/* Feedback Banner */}
      {showFeedback && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-teal-600 shrink-0" />
            <p className="text-sm font-medium text-teal-800">
              You&apos;ve been using Connect Reward for a week! We&apos;d love to hear your feedback.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setFeedbackDialogOpen(true)}>
              Give Feedback
            </Button>
            <button onClick={dismissFeedback} aria-label="Dismiss feedback prompt" className="text-teal-600 hover:text-teal-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your referral program and track performance.</p>
      </div>

      {/* Welcome banner for new users */}
      {isEmpty && (
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                <Trophy className="h-7 w-7" />
              </span>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Welcome to Connect Reward!</h2>
                <p className="text-muted-foreground mt-1">
                  Get started by setting up your services, creating rewards for your customers, and adding your first customer.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/admin/settings">Set Up Services</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/rewards">Create Rewards</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/customers">Add Customers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            {pipeline.cancelled > 0 && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-red-500">Cancelled</span>
                <div className="flex-1 rounded-full bg-muted h-7 overflow-hidden">
                  <div className="h-full rounded-full bg-red-400 flex items-center px-3"
                       style={{ width: `${Math.max((pipeline.cancelled / maxPipe) * 100, 8)}%` }}>
                    <span className="text-xs font-bold text-white">{pipeline.cancelled}</span>
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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"><Star className="h-4 w-4 text-amber-500" /></span>
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

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Connect Reward. Your feedback is invaluable!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">How would you rate your experience so far?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setFeedbackRating(n)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={`h-8 w-8 ${n <= feedbackRating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">What could be better?</label>
              <Textarea
                value={feedbackImprovements}
                onChange={e => setFeedbackImprovements(e.target.value)}
                placeholder="Any features you'd like to see, issues you've run into..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">What do you like most? (optional)</label>
              <Textarea
                value={feedbackLikes}
                onChange={e => setFeedbackLikes(e.target.value)}
                placeholder="What's working well for you..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={submitFeedback}
              disabled={submittingFeedback || feedbackRating === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submittingFeedback ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
