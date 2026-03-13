"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";
import type {
  SupportTicket,
  EmailLog,
  SystemHealthCheck,
} from "@/lib/types";

// ── Color maps ──

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: "bg-green-100 text-green-700",
  degraded: "bg-amber-100 text-amber-700",
  down: "bg-red-100 text-red-700",
};

const HEALTH_ROW_COLORS: Record<string, string> = {
  healthy: "bg-green-50/50",
  degraded: "bg-amber-50/50",
  down: "bg-red-50/50",
};

const EMAIL_STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-500",
};

type Tab = "tickets" | "health" | "emails" | "feedback";

// ── Types for joined data ──

type TicketRow = SupportTicket & {
  company_name?: string;
  profile_name?: string;
  profile_email?: string;
};

export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>("tickets");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground">
          Cross-company tickets, system health, and email delivery
        </p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {(
          [
            ["tickets", "Tickets"],
            ["health", "Health"],
            ["emails", "Emails"],
            ["feedback", "Feedback"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-teal-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tickets" && <TicketsTab />}
      {tab === "health" && <HealthTab />}
      {tab === "emails" && <EmailsTab />}
      {tab === "feedback" && <FeedbackTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab 1: Tickets
// ════════════════════════════════════════════════════════════════

function TicketsTab() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [detail, setDetail] = useState<TicketRow | null>(null);

  // Load company list once
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("businesses")
        .select("id, name")
        .order("name");
      setCompanies(data ?? []);
    })();
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("support_tickets")
      .select("*, profiles(full_name, email), companies(name)")
      .order("created_at", { ascending: false });

    if (filterCompany !== "all") query = query.eq("company_id", filterCompany);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterPriority !== "all") query = query.eq("priority", filterPriority);
    if (search.trim()) {
      query = query.ilike("subject", `%${search.trim()}%`);
    }

    const { data } = await query;

    const mapped: TicketRow[] = (data ?? []).map((t) => {
      const profiles = t.profiles as unknown as {
        full_name: string;
        email: string;
      } | null;
      const companyObj = t.companies as unknown as { name: string } | null;
      return {
        ...t,
        company_name: companyObj?.name || "—",
        profile_name: profiles?.full_name || "—",
        profile_email: profiles?.email || "—",
      } as TicketRow;
    });

    setTickets(mapped);
    setLoading(false);
  }, [filterCompany, filterStatus, filterPriority, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Summary counts
  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    ai_resolved: tickets.filter(
      (t) => t.status === "resolved" && t.ai_analysis && t.resolved_by === null
    ).length,
  };

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Open", counts.open, "text-yellow-700"],
          ["In Progress", counts.in_progress, "text-blue-700"],
          ["Resolved", counts.resolved, "text-green-700"],
          ["AI-Resolved", counts.ai_resolved, "text-purple-700"],
        ].map(([label, count, color]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>
                {count as number}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterCompany}
          onValueChange={(v) => setFilterCompany(v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterPriority}
          onValueChange={(v) => setFilterPriority(v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">
                  Subject
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Company
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">
                  Customer
                </th>
                <th className="p-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Priority
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">
                  AI
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-3">
                      <div className="h-10 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b cursor-pointer hover:bg-muted/30"
                    onClick={() => setDetail(t)}
                  >
                    <td className="p-3 font-medium max-w-[200px] truncate">
                      {t.subject}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">
                      {t.company_name}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {t.profile_name}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`${STATUS_COLORS[t.status] || ""} border-0 text-xs`}
                      >
                        {t.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge
                        className={`${PRIORITY_COLORS[t.priority] || ""} border-0 text-xs`}
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {t.ai_analysis ? (
                        <span title="AI analyzed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-purple-500"
                          >
                            <path d="M12 8V4H8" />
                            <rect width="16" height="12" x="4" y="8" rx="2" />
                            <path d="M2 14h2" />
                            <path d="M20 14h2" />
                            <path d="M15 13v2" />
                            <path d="M9 13v2" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {relativeTime(t.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Category:</strong> {detail.category}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge
                    className={`${STATUS_COLORS[detail.status] || ""} border-0 text-xs`}
                  >
                    {detail.status.replace("_", " ")}
                  </Badge>
                </p>
                <p>
                  <strong>Priority:</strong>{" "}
                  <Badge
                    className={`${PRIORITY_COLORS[detail.priority] || ""} border-0 text-xs`}
                  >
                    {detail.priority}
                  </Badge>
                </p>
                <p>
                  <strong>Company:</strong> {detail.company_name}
                </p>
                <p>
                  <strong>Customer:</strong> {detail.profile_name} (
                  {detail.profile_email})
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(detail.created_at).toLocaleString()}
                </p>
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {detail.description}
                  </p>
                </div>
                {detail.resolution && (
                  <div>
                    <strong>Resolution:</strong>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {detail.resolution}
                    </p>
                  </div>
                )}
                {detail.ai_analysis && (
                  <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
                    <p className="font-medium text-purple-700 mb-1">
                      AI Analysis
                    </p>
                    <p className="whitespace-pre-wrap text-purple-900/80">
                      {detail.ai_analysis}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab 2: Health
// ════════════════════════════════════════════════════════════════

function HealthTab() {
  const [checks, setChecks] = useState<SystemHealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/super-admin/operations?section=health");
        if (res.ok) {
          const json = await res.json();
          setChecks(json.data ?? []);
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    })();
  }, []);

  const latest = checks[0];

  return (
    <>
      {/* Current status */}
      {latest && (
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                latest.status === "healthy"
                  ? "bg-green-100"
                  : latest.status === "degraded"
                    ? "bg-amber-100"
                    : "bg-red-100"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full ${
                  latest.status === "healthy"
                    ? "bg-green-500"
                    : latest.status === "degraded"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
            </div>
            <div>
              <p className="text-lg font-semibold capitalize">
                {latest.status}
              </p>
              <p className="text-xs text-muted-foreground">
                Last check: {new Date(latest.created_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 font-medium text-muted-foreground">DB</th>
                <th className="p-3 font-medium text-muted-foreground">Auth</th>
                <th className="p-3 font-medium text-muted-foreground">
                  Email
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-3">
                      <div className="h-10 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : checks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No health checks recorded yet.
                  </td>
                </tr>
              ) : (
                checks.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b ${HEALTH_ROW_COLORS[c.status] || ""}`}
                  >
                    <td className="p-3">
                      <Badge
                        className={`${HEALTH_COLORS[c.status] || ""} border-0 text-xs`}
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <CheckDot status={c.checks?.db?.status} />
                    </td>
                    <td className="p-3">
                      <CheckDot status={c.checks?.auth?.status} />
                    </td>
                    <td className="p-3">
                      <CheckDot status={c.checks?.email?.status} />
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function CheckDot({ status }: { status?: string }) {
  if (status === "healthy")
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />;
  if (status === "degraded")
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />;
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />;
}

// ════════════════════════════════════════════════════════════════
// Tab 3: Emails
// ════════════════════════════════════════════════════════════════

interface FeedbackRow {
  id: string;
  rating: number;
  improvements: string | null;
  likes: string | null;
  created_at: string;
  company_name?: string;
  profile_name?: string;
  profile_email?: string;
}

function FeedbackTab() {
  const [responses, setResponses] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("feedback_responses")
          .select("*, profiles(full_name, email), companies(name)")
          .order("created_at", { ascending: false });

        const mapped: FeedbackRow[] = (data ?? []).map((r) => {
          const profiles = r.profiles as unknown as { full_name: string; email: string } | null;
          const companyObj = r.companies as unknown as { name: string } | null;
          return {
            id: r.id,
            rating: r.rating,
            improvements: r.improvements,
            likes: r.likes,
            created_at: r.created_at,
            company_name: companyObj?.name || "—",
            profile_name: profiles?.full_name || "—",
            profile_email: profiles?.email || "—",
          };
        });

        setResponses(mapped);
      } catch {
        // silently fail
      }
      setLoading(false);
    })();
  }, []);

  const totalResponses = responses.length;
  const avgRating = totalResponses > 0
    ? (responses.reduce((sum, r) => sum + r.rating, 0) / totalResponses).toFixed(1)
    : "—";

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Average Rating</p>
            <p className="text-2xl font-bold text-amber-600">{avgRating} / 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Responses</p>
            <p className="text-2xl font-bold">{totalResponses}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">Company</th>
                <th className="p-3 font-medium text-muted-foreground">User</th>
                <th className="p-3 font-medium text-muted-foreground">Rating</th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Improvements</th>
                <th className="p-3 font-medium text-muted-foreground hidden lg:table-cell">Likes</th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-3"><div className="h-10 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : responses.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No feedback responses yet.</td></tr>
              ) : (
                responses.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 font-medium">{r.company_name}</td>
                    <td className="p-3">
                      <p>{r.profile_name}</p>
                      <p className="text-xs text-muted-foreground">{r.profile_email}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-amber-600">{r.rating}/5</span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                      {r.improvements || "—"}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                      {r.likes || "—"}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {relativeTime(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function EmailsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [counts, setCounts] = useState({ sent: 0, failed: 0, skipped: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/super-admin/operations?section=emails");
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data ?? []);
          setCounts(json.counts ?? { sent: 0, failed: 0, skipped: 0 });
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ["Sent (30d)", counts.sent, "text-green-700"],
          ["Failed (30d)", counts.failed, "text-red-700"],
          ["Skipped (30d)", counts.skipped, "text-gray-500"],
        ].map(([label, count, color]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>
                {count as number}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">
                  Recipient
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Template
                </th>
                <th className="p-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">
                  Company
                </th>
                <th className="p-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-3">
                      <div className="h-10 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No email logs found.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="p-3 text-muted-foreground">
                      {l.recipient_email}
                    </td>
                    <td className="p-3 hidden sm:table-cell font-medium">
                      {l.template_name}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`${EMAIL_STATUS_COLORS[l.status] || ""} border-0 text-xs`}
                      >
                        {l.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">
                      {l.company_id.slice(0, 8)}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {relativeTime(l.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
