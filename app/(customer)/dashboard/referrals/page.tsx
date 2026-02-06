"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/relative-time";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Send, UserPlus } from "lucide-react";
import type { Referral, ReferralStatus, Service } from "@/lib/types";

// ── Status badge config ──────────────────────────
const STATUS_CONFIG: Record<ReferralStatus, { label: string; className: string }> = {
  pending: { label: "Submitted", className: "bg-gray-100 text-gray-700" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-700" },
  quoted: { label: "Quote Sent", className: "bg-orange-100 text-orange-700" },
  won: { label: "Installation Complete", className: "bg-green-100 text-green-700" },
  lost: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500" },
};

// ── Pipeline steps ───────────────────────────────
const PIPELINE_STEPS = ["pending", "contacted", "quoted", "won"] as const;
const PIPELINE_LABELS = ["Submitted", "Contacted", "Consultation", "Quote Sent", "Complete"];

function PipelineTracker({ status }: { status: ReferralStatus }) {
  const isCancelled = status === "lost" || status === "expired";

  // Map status to step index
  let currentIdx: number;
  if (status === "pending") currentIdx = 0;
  else if (status === "contacted") currentIdx = 1;
  else if (status === "quoted") currentIdx = 3;
  else if (status === "won") currentIdx = 4;
  else currentIdx = -1; // cancelled

  return (
    <div className="mt-4 flex items-center justify-between">
      {PIPELINE_LABELS.map((label, i) => {
        const isCompleted = !isCancelled && i <= currentIdx;
        const isCurrent = !isCancelled && i === currentIdx;
        const isFuture = !isCancelled && i > currentIdx;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              {isCancelled && i === Math.max(currentIdx, 0) ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">✕</span>
              ) : isCompleted ? (
                <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white text-xs ${isCurrent ? "ring-4 ring-teal-200 animate-pulse" : ""}`}>✓</span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
              )}
              <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">{label}</span>
            </div>
            {i < PIPELINE_LABELS.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 ${isCompleted && !isCancelled ? "bg-teal-500" : "border-t-2 border-dashed border-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Referral Card ────────────────────────────────
function ReferralCard({ referral, serviceName }: { referral: Referral; serviceName?: string }) {
  const cfg = STATUS_CONFIG[referral.status];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg">{referral.referee_name}</h3>
            <p className="text-sm text-muted-foreground">{relativeTime(referral.created_at)}</p>
          </div>
          <Badge className={`${cfg.className} border-0 font-semibold`}>
            {referral.status === "won" && "✅ "}{cfg.label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {serviceName && (
            <Badge variant="outline" className="text-xs">{serviceName}</Badge>
          )}
          {referral.service_type && !serviceName && (
            <Badge variant="outline" className="text-xs">{referral.service_type}</Badge>
          )}
        </div>

        <PipelineTracker status={referral.status} />

        <div className="mt-3 text-sm">
          {referral.status === "won" ? (
            <p className="font-semibold text-green-600">{referral.points_awarded.toLocaleString()} pts earned!</p>
          ) : referral.status === "lost" || referral.status === "expired" ? (
            <p className="text-muted-foreground italic">No points earned</p>
          ) : (
            <p className="text-muted-foreground">Points: Pending</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty State ──────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
        <UserPlus className="h-10 w-10 text-teal-600" />
      </div>
      <h3 className="mt-4 text-lg font-bold">No referrals yet</h3>
      <p className="mt-1 text-muted-foreground">You haven&apos;t submitted any referrals yet. Start earning points!</p>
      <Button asChild className="mt-4 bg-teal-600 hover:bg-teal-700">
        <Link href="/dashboard/refer">
          <Send className="mr-2 h-4 w-4" /> Submit a Referral
        </Link>
      </Button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────
export default function MyReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<string>("newest");

  const fetchReferrals = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's company_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setReferrals(data as Referral[]);

    // Fetch services for name lookup
    if (profile?.company_id) {
      const { data: svcData } = await supabase
        .from("services")
        .select("id, name")
        .eq("company_id", profile.company_id);
      if (svcData) {
        const map: Record<string, string> = {};
        svcData.forEach((s: { id: string; name: string }) => { map[s.id] = s.name; });
        setServiceMap(map);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const sorted = [...referrals].sort((a, b) => {
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === "status") return a.status.localeCompare(b.status);
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Referrals</h1>
          <Badge variant="secondary" className="font-semibold">{referrals.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/dashboard/refer">
              <Plus className="mr-1 h-4 w-4" /> Submit New
            </Link>
          </Button>
        </div>
      </div>

      {referrals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((r) => (
            <ReferralCard key={r.id} referral={r} serviceName={r.service_id ? serviceMap[r.service_id] : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
