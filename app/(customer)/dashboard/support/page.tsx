"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2 } from "lucide-react";
import type { SupportTicket, TicketCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug: "Bug Report",
  account: "Account",
  billing: "Billing",
  feature_request: "Feature Request",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

export default function CustomerSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form state
  const [category, setCategory] = useState<TicketCategory>("account");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, description }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Ticket submitted successfully");
        setShowForm(false);
        setSubject("");
        setDescription("");
        setCategory("account");
        fetchTickets();
      }
    } catch {
      toast.error("Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground">
            Submit and track your support tickets.
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TicketCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={4}
              />
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Resolution Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 pt-2">
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[selectedTicket.status]}`}
                >
                  {selectedTicket.status.replace("_", " ")}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {CATEGORY_LABELS[selectedTicket.category]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 text-sm">{selectedTicket.description}</p>
              </div>
              {selectedTicket.resolution && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">
                      Resolution
                    </p>
                  </div>
                  <p className="text-sm text-green-700">
                    {selectedTicket.resolution}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Created{" "}
                {new Date(selectedTicket.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <p className="text-muted-foreground">
              No support tickets yet. Click &quot;New Ticket&quot; to get help.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">
                      {ticket.subject}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
