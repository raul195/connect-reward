"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Check, X, CheckCheck, Mail, Eye, Save } from "lucide-react";
import type { EmailDraft, AutomationTriggerType } from "@/lib/types";
import { textToHtml } from "@/lib/email/injectVariables";

interface DraftWithProfile extends EmailDraft {
  profiles: { full_name: string; email: string } | null;
}

const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  inactivity_30: "Inactivity (30d)",
  inactivity_60: "Inactivity (60d)",
  points_close_to_reward: "Close to Reward",
  referral_nudge: "Referral Nudge",
  milestone_reached: "Milestone",
  program_reminder: "Monthly Reminder",
};

const TRIGGER_COLORS: Record<AutomationTriggerType, string> = {
  inactivity_30: "bg-amber-100 text-amber-800",
  inactivity_60: "bg-red-100 text-red-800",
  points_close_to_reward: "bg-emerald-100 text-emerald-800",
  referral_nudge: "bg-blue-100 text-blue-800",
  milestone_reached: "bg-purple-100 text-purple-800",
  program_reminder: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EmailsPage() {
  const { profile } = useProfile();
  const [pendingDrafts, setPendingDrafts] = useState<DraftWithProfile[]>([]);
  const [sentDrafts, setSentDrafts] = useState<DraftWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Preview panel state
  const [previewDraft, setPreviewDraft] = useState<DraftWithProfile | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingPreview, setSavingPreview] = useState(false);

  const fetchDrafts = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const [pendingRes, sentRes] = await Promise.all([
        fetch("/api/admin/email-drafts?status=draft"),
        fetch("/api/admin/email-drafts?status=sent"),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingDrafts(data.drafts || []);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentDrafts(data.drafts || []);
      }
    } catch {
      toast.error("Failed to load email drafts.");
    }
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  function openPreview(draft: DraftWithProfile) {
    setPreviewDraft(draft);
    setEditSubject(draft.subject);
    const emailData = draft.email_data as Record<string, unknown>;
    setEditBody((emailData?.body_text as string) || "");
  }

  function closePreview() {
    setPreviewDraft(null);
    setEditSubject("");
    setEditBody("");
  }

  // Live HTML preview from edited body text
  const previewHtml = useMemo(() => {
    if (!editBody) return "";
    return textToHtml(editBody);
  }, [editBody]);

  // Resolved variable badges from email_data
  const resolvedVars = useMemo(() => {
    if (!previewDraft) return [];
    const emailData = previewDraft.email_data as Record<string, unknown>;
    if (!emailData) return [];
    const skipKeys = new Set(["body_text", "body_html", "edited_by_admin", "variation_index", "tone", "companyName", "logoUrl", "primaryColor"]);
    return Object.entries(emailData)
      .filter(([key]) => !skipKeys.has(key))
      .map(([key, value]) => ({ key, value: String(value) }));
  }, [previewDraft]);

  async function savePreviewEdits() {
    if (!previewDraft) return;
    setSavingPreview(true);
    try {
      const res = await fetch("/api/admin/email-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: previewDraft.id,
          subject: editSubject,
          body_text: editBody,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Changes saved!");
      // Update local state
      setPreviewDraft((prev) =>
        prev ? { ...prev, subject: editSubject } : null
      );
      fetchDrafts();
    } catch {
      toast.error("Failed to save changes.");
    }
    setSavingPreview(false);
  }

  async function approveFromPreview() {
    if (!previewDraft) return;
    setSavingPreview(true);
    try {
      // Save any pending edits first, then approve
      const res = await fetch("/api/admin/email-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: previewDraft.id,
          status: "approved",
          subject: editSubject,
          body_text: editBody,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Draft approved!");
      closePreview();
      fetchDrafts();
    } catch {
      toast.error("Failed to approve draft.");
    }
    setSavingPreview(false);
  }

  async function cancelFromPreview() {
    if (!previewDraft) return;
    setSavingPreview(true);
    try {
      const res = await fetch("/api/admin/email-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: previewDraft.id,
          status: "cancelled",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Draft cancelled.");
      closePreview();
      fetchDrafts();
    } catch {
      toast.error("Failed to cancel draft.");
    }
    setSavingPreview(false);
  }

  async function approveDraft(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/email-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Draft approved!");
      fetchDrafts();
    } catch {
      toast.error("Failed to approve draft.");
    }
    setActionLoading(null);
  }

  async function cancelDraft(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/email-drafts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Draft cancelled.");
      fetchDrafts();
    } catch {
      toast.error("Failed to cancel draft.");
    }
    setActionLoading(null);
  }

  async function bulkApprove() {
    if (selectedIds.size === 0) return;
    setActionLoading("bulk");
    try {
      const res = await fetch("/api/admin/email-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_approve",
          ids: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${selectedIds.size} drafts approved!`);
      setSelectedIds(new Set());
      fetchDrafts();
    } catch {
      toast.error("Failed to bulk approve.");
    }
    setActionLoading(null);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === pendingDrafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingDrafts.map((d) => d.id)));
    }
  }

  // Group pending drafts by scheduled date
  const groupedDrafts = pendingDrafts.reduce<Record<string, DraftWithProfile[]>>(
    (acc, draft) => {
      const dateKey = draft.scheduled_send_at
        ? formatDate(draft.scheduled_send_at)
        : "Unscheduled";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(draft);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Emails</h1>
        <p className="text-muted-foreground">
          Review and approve automated email drafts before they are sent.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Drafts
            {pendingDrafts.length > 0 && (
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                {pendingDrafts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent History</TabsTrigger>
        </TabsList>

        {/* Pending Drafts Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Drafts</CardTitle>
                {pendingDrafts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                    >
                      {selectedIds.size === pendingDrafts.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    {selectedIds.size > 0 && (
                      <Button
                        size="sm"
                        onClick={bulkApprove}
                        disabled={actionLoading === "bulk"}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        {actionLoading === "bulk"
                          ? "Approving..."
                          : `Approve ${selectedIds.size} Selected`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded bg-muted"
                    />
                  ))}
                </div>
              ) : pendingDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No pending drafts. Automated emails will appear here for
                    your review.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedDrafts).map(([dateKey, drafts]) => (
                    <div key={dateKey}>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        Scheduled for {dateKey}
                      </p>
                      <div className="space-y-2">
                        {drafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => openPreview(draft)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(draft.id)}
                              onChange={() => toggleSelect(draft.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-gray-300"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {draft.profiles?.full_name || "Unknown"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {draft.profiles?.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    TRIGGER_COLORS[
                                      draft.trigger_type as AutomationTriggerType
                                    ] || "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {TRIGGER_LABELS[
                                    draft.trigger_type as AutomationTriggerType
                                  ] || draft.trigger_type}
                                </span>
                                <span className="text-sm text-muted-foreground truncate">
                                  {draft.subject}
                                </span>
                              </div>
                            </div>

                            {draft.scheduled_send_at && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(draft.scheduled_send_at)}
                              </span>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreview(draft);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => approveDraft(draft.id)}
                                disabled={actionLoading === draft.id}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => cancelDraft(draft.id)}
                                disabled={actionLoading === draft.id}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent History Tab */}
        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded bg-muted"
                    />
                  ))}
                </div>
              ) : sentDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No sent emails yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Trigger</th>
                        <th className="pb-3 font-medium">Subject</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentDrafts.map((draft) => (
                        <tr key={draft.id} className="border-b last:border-0">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">
                                {draft.profiles?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {draft.profiles?.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                TRIGGER_COLORS[
                                  draft.trigger_type as AutomationTriggerType
                                ] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {TRIGGER_LABELS[
                                draft.trigger_type as AutomationTriggerType
                              ] || draft.trigger_type}
                            </span>
                          </td>
                          <td className="py-3 max-w-[200px] truncate">
                            {draft.subject}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_COLORS[draft.status] || ""
                              }`}
                            >
                              {draft.status}
                            </span>
                          </td>
                          <td className="py-3 whitespace-nowrap text-muted-foreground">
                            {formatDate(draft.updated_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Sheet */}
      <Sheet open={!!previewDraft} onOpenChange={(open) => !open && closePreview()}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Email Preview</SheetTitle>
            <SheetDescription>
              Review and edit this draft before approving.
            </SheetDescription>
          </SheetHeader>

          {previewDraft && (
            <div className="space-y-6 py-4">
              {/* Customer info + trigger badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {previewDraft.profiles?.full_name || "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {previewDraft.profiles?.email}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    TRIGGER_COLORS[
                      previewDraft.trigger_type as AutomationTriggerType
                    ] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {TRIGGER_LABELS[
                    previewDraft.trigger_type as AutomationTriggerType
                  ] || previewDraft.trigger_type}
                </span>
                {typeof (previewDraft.email_data as Record<string, unknown>)?.tone === "string" && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
                    {String((previewDraft.email_data as Record<string, unknown>).tone)}
                  </span>
                )}
              </div>

              {/* Editable subject */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>

              {/* Editable body */}
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Live HTML preview */}
              {editBody && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div
                    className="rounded-lg border bg-white p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}

              {/* Resolved variable badges */}
              {resolvedVars.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {resolvedVars.map(({ key, value }) => (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        <span className="font-medium text-muted-foreground mr-1">
                          {key}:
                        </span>
                        <span className="truncate max-w-[150px]">{value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <SheetFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={cancelFromPreview}
              disabled={savingPreview}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Draft
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={savePreviewEdits}
                disabled={savingPreview}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingPreview ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                size="sm"
                onClick={approveFromPreview}
                disabled={savingPreview}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
