"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Bot } from "lucide-react";
import type { TicketStatus, TicketPriority } from "@/lib/types";

interface TicketWithProfile {
  id: string;
  company_id: string;
  profile_id: string;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string; email: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  account: "Account",
  billing: "Billing",
  feature_request: "Feature Request",
  other: "Other",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selected, setSelected] = useState<TicketWithProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editStatus, setEditStatus] = useState<TicketStatus>("open");
  const [editPriority, setEditPriority] = useState<TicketPriority>("medium");
  const [editResolution, setEditResolution] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPriority !== "all") params.set("priority", filterPriority);

      const res = await fetch(`/api/admin/support?${params}`);
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  function openDetail(ticket: TicketWithProfile) {
    setSelected(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditResolution(ticket.resolution || "");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/support/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          resolution: editResolution || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Ticket updated");
        setSelected(null);
        fetchTickets();
      }
    } catch {
      toast.error("Failed to update ticket");
    } finally {
      setSaving(false);
    }
  }

  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">
          Manage customer support tickets.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{counts.open}</p>
            <p className="text-sm text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {counts.in_progress}
            </p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {counts.resolved}
            </p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
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

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
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

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              {/* Submitter info */}
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">From: </span>
                  <span className="font-medium">
                    {selected.profiles?.full_name}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    ({selected.profiles?.email})
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(selected.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[selected.status]}`}
                >
                  {selected.status.replace("_", " ")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[selected.priority]}`}
                >
                  {selected.priority}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {CATEGORY_LABELS[selected.category] || selected.category}
                </span>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              {/* AI Analysis */}
              {selected.ai_analysis && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-semibold text-purple-800">
                      AI Analysis
                    </p>
                  </div>
                  <p className="text-sm text-purple-700">
                    {selected.ai_analysis}
                  </p>
                  {selected.resolved_by === "ai" && (
                    <p className="mt-2 text-xs text-purple-500 italic">
                      This ticket was auto-resolved by AI
                    </p>
                  )}
                </div>
              )}

              {/* Edit controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as TicketStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editPriority}
                    onValueChange={(v) => setEditPriority(v as TicketPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resolution</Label>
                <Textarea
                  value={editResolution}
                  onChange={(e) => setEditResolution(e.target.value)}
                  placeholder="Write a resolution for the customer..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tickets Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <p className="text-muted-foreground">No tickets found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => openDetail(ticket)}
                >
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {ticket.subject}
                    {ticket.ai_analysis && (
                      <Bot className="inline-block ml-1 h-3.5 w-3.5 text-purple-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.profiles?.full_name || "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    {CATEGORY_LABELS[ticket.category] || ticket.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
