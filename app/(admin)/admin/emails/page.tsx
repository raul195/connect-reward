"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Check,
  X,
  CheckCheck,
  Mail,
  Eye,
  Save,
  RefreshCw,
  Pencil,
  RotateCcw,
  Clock,
  Zap,
  ArrowRight,
} from "lucide-react";
import type { EmailDraft, AutomationTriggerType, TonePreference } from "@/lib/types";
import { textToHtml, injectVariables } from "@/lib/email/injectVariables";
import {
  TEMPLATE_LIBRARY,
  type TemplateContent,
  type TriggerTemplates,
} from "@/lib/email/templateLibrary";

interface DraftWithProfile extends EmailDraft {
  profiles: { full_name: string; email: string } | null;
}

interface CustomTemplate {
  id: string;
  company_id: string;
  trigger_type: string;
  tone: string;
  variation_index: number;
  subject: string;
  body: string;
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

// Sample data for template previews
const SAMPLE_DATA: Record<string, string | number> = {
  customerName: "Sarah Johnson",
  businessName: "SunPower Solar",
  pointsBalance: 1250,
  pointsNeeded: 150,
  rewardName: "$50 Amazon Gift Card",
  rewardCatalogUrl: "https://example.com/rewards",
  dashboardUrl: "https://example.com/dashboard",
  referralSubmitUrl: "https://example.com/referrals",
  referralName: "Mike Thompson",
  daysPending: 18,
  milestoneCount: 10,
  bonusPoints: 500,
  totalPoints: 3750,
  periodLabel: "monthly",
  unsubscribeUrl: "https://example.com/unsubscribe?token=example",
};

// Transactional email definitions (no template library — display only)
const TRANSACTIONAL_EMAILS = [
  {
    key: "welcome",
    name: "Welcome Email",
    description: "Sent immediately when a new customer joins your referral program.",
  },
  {
    key: "referral_status",
    name: "Referral Status Update",
    description: "Sent each time a referral status changes (contacted, scheduled, completed).",
  },
  {
    key: "points_earned",
    name: "Points Earned",
    description: "Sent when a customer earns points from a completed referral.",
  },
  {
    key: "reward_redeemed",
    name: "Reward Redeemed",
    description: "Sent when a customer successfully redeems a reward.",
  },
];

// Automated engagement email definitions
const AUTOMATED_EMAILS: {
  triggerType: AutomationTriggerType;
  name: string;
  description: string;
}[] = [
  {
    triggerType: "inactivity_30",
    name: "30-Day Inactivity Check-in",
    description: "Sent when a customer hasn't visited in 30 days to re-engage them.",
  },
  {
    triggerType: "inactivity_60",
    name: "60-Day Inactivity Nudge",
    description: "Stronger follow-up sent when a customer has been inactive for 60 days.",
  },
  {
    triggerType: "points_close_to_reward",
    name: "Points Close to Reward",
    description: "Sent when a customer is within 20% of affording their next reward.",
  },
  {
    triggerType: "referral_nudge",
    name: "Referral Follow-up",
    description: "Sent when a referral has been pending for 14+ days, encouraging more referrals.",
  },
  {
    triggerType: "milestone_reached",
    name: "Milestone Celebration",
    description: "Sent when a customer hits a referral milestone (e.g. every 5 referrals).",
  },
  {
    triggerType: "program_reminder",
    name: "Program Reminder",
    description: "Monthly or quarterly activity recap sent to all customers on the 1st.",
  },
];

// Drip sequence timeline items
const DRIP_TIMELINE = [
  {
    timing: "Day 0",
    name: "Welcome Email",
    condition: "Automatically sent when a new customer signs up",
    type: "transactional" as const,
    templateKey: "welcome",
    triggerType: null as AutomationTriggerType | null,
  },
  {
    timing: "Day 1+",
    name: "Points Earned Confirmation",
    condition: "Sent each time points are awarded for a completed referral",
    type: "transactional" as const,
    templateKey: "points_earned",
    triggerType: null as AutomationTriggerType | null,
  },
  {
    timing: "Day 30",
    name: "30-Day Inactivity Check-in",
    condition: "Sent if the customer hasn't logged in or taken action in 30 days",
    type: "automated" as const,
    templateKey: null,
    triggerType: "inactivity_30" as AutomationTriggerType,
  },
  {
    timing: "Day 60",
    name: "60-Day Inactivity Nudge",
    condition: "Sent if the customer is still inactive after 60 days",
    type: "automated" as const,
    templateKey: null,
    triggerType: "inactivity_60" as AutomationTriggerType,
  },
  {
    timing: "Monthly",
    name: "Program Reminder",
    condition: "Sent on the 1st of each month (or quarter) with an activity recap",
    type: "automated" as const,
    templateKey: null,
    triggerType: "program_reminder" as AutomationTriggerType,
  },
  {
    timing: "Event",
    name: "Referral Status Update",
    condition: "Sent each time a referral's status changes",
    type: "transactional" as const,
    templateKey: "referral_status",
    triggerType: null as AutomationTriggerType | null,
  },
  {
    timing: "Event",
    name: "Points Close to Reward",
    condition: "Sent when the customer is within 20% of earning their next reward",
    type: "automated" as const,
    templateKey: null,
    triggerType: "points_close_to_reward" as AutomationTriggerType,
  },
  {
    timing: "Event",
    name: "Referral Follow-up",
    condition: "Sent when a submitted referral has been pending for 14+ days",
    type: "automated" as const,
    templateKey: null,
    triggerType: "referral_nudge" as AutomationTriggerType,
  },
  {
    timing: "Event",
    name: "Milestone Celebration",
    condition: "Sent when the customer completes every 5th referral",
    type: "automated" as const,
    templateKey: null,
    triggerType: "milestone_reached" as AutomationTriggerType,
  },
  {
    timing: "Event",
    name: "Reward Redeemed",
    condition: "Sent when a customer successfully redeems points for a reward",
    type: "transactional" as const,
    templateKey: "reward_redeemed",
    triggerType: null as AutomationTriggerType | null,
  },
];

const TONES: TonePreference[] = ["friendly", "professional", "motivational"];

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

/**
 * Reconstruct body text for a draft from email_data.
 * Tries body_text first, then falls back to template library + variable injection.
 */
function getBodyFromDraft(draft: DraftWithProfile): string {
  const emailData = draft.email_data as Record<string, unknown>;
  if (!emailData) return "";

  // Phase 3 drafts have body_text stored
  if (typeof emailData.body_text === "string" && emailData.body_text) {
    return emailData.body_text;
  }

  // Fallback: reconstruct from template library
  const triggerType = draft.trigger_type as AutomationTriggerType;
  const templates = TEMPLATE_LIBRARY[triggerType];
  if (!templates) return "";

  const tone = (typeof emailData.tone === "string" ? emailData.tone : "friendly") as TonePreference;
  const variationIndex = typeof emailData.variation_index === "number" ? emailData.variation_index : 0;
  const toneTemplates = templates[tone];
  if (!toneTemplates) return "";

  const template = toneTemplates[variationIndex] || toneTemplates[0];
  if (!template) return "";

  // Build variable map from email_data
  const varData: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(emailData)) {
    if (typeof value === "string" || typeof value === "number") {
      varData[key] = value;
    }
  }

  return injectVariables(template.body, varData);
}

/**
 * Reconstruct original template body (before any admin edits) for regenerate.
 */
function getOriginalTemplateBody(draft: DraftWithProfile): string {
  const emailData = draft.email_data as Record<string, unknown>;
  if (!emailData) return "";

  const triggerType = draft.trigger_type as AutomationTriggerType;
  const templates = TEMPLATE_LIBRARY[triggerType];
  if (!templates) return "";

  const tone = (typeof emailData.tone === "string" ? emailData.tone : "friendly") as TonePreference;
  const variationIndex = typeof emailData.variation_index === "number" ? emailData.variation_index : 0;
  const toneTemplates = templates[tone];
  if (!toneTemplates) return "";

  const template = toneTemplates[variationIndex] || toneTemplates[0];
  if (!template) return "";

  const varData: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(emailData)) {
    if (typeof value === "string" || typeof value === "number") {
      varData[key] = value;
    }
  }

  return injectVariables(template.body, varData);
}

function getOriginalTemplateSubject(draft: DraftWithProfile): string {
  const emailData = draft.email_data as Record<string, unknown>;
  if (!emailData) return draft.subject;

  const triggerType = draft.trigger_type as AutomationTriggerType;
  const templates = TEMPLATE_LIBRARY[triggerType];
  if (!templates) return draft.subject;

  const tone = (typeof emailData.tone === "string" ? emailData.tone : "friendly") as TonePreference;
  const variationIndex = typeof emailData.variation_index === "number" ? emailData.variation_index : 0;
  const toneTemplates = templates[tone];
  if (!toneTemplates) return draft.subject;

  const template = toneTemplates[variationIndex] || toneTemplates[0];
  if (!template) return draft.subject;

  const varData: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(emailData)) {
    if (typeof value === "string" || typeof value === "number") {
      varData[key] = value;
    }
  }

  return injectVariables(template.subject, varData);
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

  // Templates tab state
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [templateEditing, setTemplateEditing] = useState<{
    triggerType: AutomationTriggerType;
    tone: TonePreference;
    variationIndex: number;
  } | null>(null);
  const [templateEditSubject, setTemplateEditSubject] = useState("");
  const [templateEditBody, setTemplateEditBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [triggerStates, setTriggerStates] = useState<
    Record<string, boolean>
  >({});
  const [templatesSubTab, setTemplatesSubTab] = useState<"library" | "drip">("library");
  const [templateTone, setTemplateTone] = useState<TonePreference>("friendly");
  const [activeTone, setActiveTone] = useState<TonePreference>("friendly");

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

  const fetchCustomTemplates = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/custom-templates");
      if (res.ok) {
        const data = await res.json();
        setCustomTemplates(data.templates || []);
      }
    } catch {
      // ignore
    }
  }, [profile?.company_id]);

  const fetchTriggerStates = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/automation-settings");
      if (res.ok) {
        const data = await res.json();
        const states: Record<string, boolean> = {};
        for (const trigger of data.triggers || []) {
          states[trigger.trigger_type] = trigger.is_active;
        }
        setTriggerStates(states);

        // Get the active tone from automation settings
        if (data.settings?.tone_preference) {
          const tone = data.settings.tone_preference as TonePreference;
          setActiveTone(tone);
          setTemplateTone(tone);
        }
      }
    } catch {
      // ignore
    }
  }, [profile?.company_id]);

  useEffect(() => {
    fetchDrafts();
    fetchCustomTemplates();
    fetchTriggerStates();
  }, [fetchDrafts, fetchCustomTemplates, fetchTriggerStates]);

  // Get the effective template (custom override or default)
  function getEffectiveTemplate(
    triggerType: AutomationTriggerType,
    tone: TonePreference,
    variationIndex: number
  ): TemplateContent {
    const custom = customTemplates.find(
      (t) =>
        t.trigger_type === triggerType &&
        t.tone === tone &&
        t.variation_index === variationIndex
    );
    if (custom) {
      return { subject: custom.subject, body: custom.body };
    }
    return TEMPLATE_LIBRARY[triggerType][tone][variationIndex];
  }

  function hasCustomOverride(
    triggerType: AutomationTriggerType,
    tone: TonePreference,
    variationIndex: number
  ): boolean {
    return customTemplates.some(
      (t) =>
        t.trigger_type === triggerType &&
        t.tone === tone &&
        t.variation_index === variationIndex
    );
  }

  // ── Draft preview handlers ──

  function openPreview(draft: DraftWithProfile) {
    setPreviewDraft(draft);
    setEditSubject(draft.subject);
    setEditBody(getBodyFromDraft(draft));
  }

  function closePreview() {
    setPreviewDraft(null);
    setEditSubject("");
    setEditBody("");
  }

  function regenerateDraft() {
    if (!previewDraft) return;
    setEditSubject(getOriginalTemplateSubject(previewDraft));
    setEditBody(getOriginalTemplateBody(previewDraft));
    toast.success("Reset to original template.");
  }

  const previewHtml = useMemo(() => {
    if (!editBody) return "";
    return textToHtml(editBody);
  }, [editBody]);

  const resolvedVars = useMemo(() => {
    if (!previewDraft) return [];
    const emailData = previewDraft.email_data as Record<string, unknown>;
    if (!emailData) return [];
    const skipKeys = new Set([
      "body_text",
      "body_html",
      "edited_by_admin",
      "variation_index",
      "tone",
      "companyName",
      "logoUrl",
      "primaryColor",
    ]);
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

  // ── Template editing handlers ──

  function openTemplateEdit(
    triggerType: AutomationTriggerType,
    tone: TonePreference,
    variationIndex: number
  ) {
    const template = getEffectiveTemplate(triggerType, tone, variationIndex);
    setTemplateEditing({ triggerType, tone, variationIndex });
    setTemplateEditSubject(template.subject);
    setTemplateEditBody(template.body);
  }

  function closeTemplateEdit() {
    setTemplateEditing(null);
    setTemplateEditSubject("");
    setTemplateEditBody("");
  }

  async function saveTemplateEdit() {
    if (!templateEditing) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/admin/custom-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_type: templateEditing.triggerType,
          tone: templateEditing.tone,
          variation_index: templateEditing.variationIndex,
          subject: templateEditSubject,
          body: templateEditBody,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Template saved!");
      closeTemplateEdit();
      fetchCustomTemplates();
    } catch {
      toast.error("Failed to save template.");
    }
    setSavingTemplate(false);
  }

  async function resetTemplate(
    triggerType: AutomationTriggerType,
    tone: TonePreference,
    variationIndex: number
  ) {
    try {
      const res = await fetch("/api/admin/custom-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_type: triggerType,
          tone,
          variation_index: variationIndex,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reset to default template.");
      fetchCustomTemplates();
    } catch {
      toast.error("Failed to reset template.");
    }
  }

  function openTemplatePreview(subject: string, body: string) {
    const resolvedSubject = injectVariables(subject, SAMPLE_DATA);
    const resolvedBody = injectVariables(body, SAMPLE_DATA);
    setTemplatePreview({ subject: resolvedSubject, body: resolvedBody });
  }

  async function toggleTrigger(triggerType: string) {
    try {
      const res = await fetch("/api/admin/automation-settings");
      if (!res.ok) return;
      const data = await res.json();
      const trigger = (data.triggers || []).find(
        (t: { trigger_type: string }) => t.trigger_type === triggerType
      );
      if (!trigger) return;

      await fetch("/api/admin/automation-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_id: trigger.id,
          is_active: !trigger.is_active,
        }),
      });
      setTriggerStates((prev) => ({
        ...prev,
        [triggerType]: !prev[triggerType],
      }));
    } catch {
      toast.error("Failed to toggle trigger.");
    }
  }

  // Group pending drafts by scheduled date
  const groupedDrafts = pendingDrafts.reduce<
    Record<string, DraftWithProfile[]>
  >(
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
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ── Pending Drafts Tab ── */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Drafts</CardTitle>
                {pendingDrafts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
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

        {/* ── Sent History Tab ── */}
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
                        <tr
                          key={draft.id}
                          className="border-b last:border-0"
                        >
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

        {/* ── Templates Tab ── */}
        <TabsContent value="templates">
          <div className="space-y-4">
            {/* Sub-tabs: Library / Drip Sequence */}
            <div className="flex gap-2">
              <Button
                variant={templatesSubTab === "library" ? "default" : "outline"}
                size="sm"
                onClick={() => setTemplatesSubTab("library")}
                className={templatesSubTab === "library" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                Template Library
              </Button>
              <Button
                variant={templatesSubTab === "drip" ? "default" : "outline"}
                size="sm"
                onClick={() => setTemplatesSubTab("drip")}
                className={templatesSubTab === "drip" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                Drip Sequence
              </Button>
            </div>

            {templatesSubTab === "library" && (
              <div className="space-y-8">
                {/* Transactional Emails */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-teal-600" />
                      <CardTitle>Transactional Emails</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These emails are always active and send automatically
                      based on customer actions. They cannot be disabled.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {TRANSACTIONAL_EMAILS.map((email) => (
                        <div
                          key={email.key}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {email.name}
                              </p>
                              <span className="inline-flex items-center rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 text-xs font-medium">
                                Always active
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {email.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Automated Engagement Emails */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <CardTitle>Automated Engagement Emails</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These emails are triggered by customer behavior and can be
                      toggled on or off. Select a tone to view its 3 variations per trigger.
                    </p>

                    {/* Tone selector */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm font-medium text-muted-foreground">Tone:</span>
                      {TONES.map((tone) => (
                        <Button
                          key={tone}
                          variant={templateTone === tone ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTemplateTone(tone)}
                          className={
                            templateTone === tone
                              ? "bg-teal-600 hover:bg-teal-700"
                              : ""
                          }
                        >
                          <span className="capitalize">{tone}</span>
                          {tone === activeTone && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                              Active
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {AUTOMATED_EMAILS.map((email) => (
                        <div
                          key={email.triggerType}
                          id={`template-${email.triggerType}`}
                          className="rounded-lg border"
                        >
                          {/* Template header */}
                          <div className="flex items-center justify-between p-4 border-b">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{email.name}</p>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    TRIGGER_COLORS[email.triggerType]
                                  }`}
                                >
                                  {TRIGGER_LABELS[email.triggerType]}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {email.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {triggerStates[email.triggerType] !== false
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                              <Switch
                                checked={
                                  triggerStates[email.triggerType] !== false
                                }
                                onCheckedChange={() =>
                                  toggleTrigger(email.triggerType)
                                }
                              />
                            </div>
                          </div>

                          {/* Variations for selected tone */}
                          <div className="p-4">
                            <div className="space-y-2">
                              {[0, 1, 2].map((vi) => {
                                const tmpl = getEffectiveTemplate(
                                  email.triggerType,
                                  templateTone,
                                  vi
                                );
                                const isCustom = hasCustomOverride(
                                  email.triggerType,
                                  templateTone,
                                  vi
                                );
                                return (
                                  <div
                                    key={vi}
                                    className="flex items-start justify-between gap-3 rounded border p-3 bg-muted/30"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                          Variation {vi + 1}
                                        </span>
                                        {isCustom && (
                                          <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 px-1.5 py-0.5 text-[10px] font-medium">
                                            Customized
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium mt-1 truncate">
                                        {injectVariables(
                                          tmpl.subject,
                                          SAMPLE_DATA
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {injectVariables(
                                          tmpl.body,
                                          SAMPLE_DATA
                                        )
                                          .split("\n")
                                          .slice(0, 2)
                                          .join(" ")}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          openTemplatePreview(
                                            tmpl.subject,
                                            tmpl.body
                                          )
                                        }
                                        title="Preview"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          openTemplateEdit(
                                            email.triggerType,
                                            templateTone,
                                            vi
                                          )
                                        }
                                        title="Edit"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      {isCustom && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-orange-600"
                                          onClick={() =>
                                            resetTemplate(
                                              email.triggerType,
                                              templateTone,
                                              vi
                                            )
                                          }
                                          title="Reset to default"
                                        >
                                          <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Drip Sequence View ── */}
            {templatesSubTab === "drip" && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Email Journey</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    A chronological view of every email a customer may receive,
                    from signup through ongoing engagement.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-muted" />

                    <div className="space-y-1">
                      {DRIP_TIMELINE.map((item, idx) => {
                        const isActive =
                          item.type === "transactional"
                            ? true
                            : item.triggerType
                            ? triggerStates[item.triggerType] !== false
                            : true;

                        return (
                          <div
                            key={idx}
                            className={`relative flex items-start gap-4 py-3 pl-10 pr-4 rounded-lg transition-colors ${
                              !isActive ? "opacity-50" : ""
                            }`}
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute left-3 top-5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                                item.type === "transactional"
                                  ? "bg-teal-500"
                                  : "bg-blue-500"
                              }`}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                  {item.timing}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    item.type === "transactional"
                                      ? "bg-teal-100 text-teal-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {item.type === "transactional"
                                    ? "Transactional"
                                    : "Automated"}
                                </span>
                                {!isActive && (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-[10px] font-medium">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-sm mt-1">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.condition}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 mt-1">
                              {item.triggerType && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    const template = getEffectiveTemplate(
                                      item.triggerType!,
                                      "friendly",
                                      0
                                    );
                                    openTemplatePreview(
                                      template.subject,
                                      template.body
                                    );
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                              )}
                              {item.triggerType && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setTemplatesSubTab("library");
                                    // Scroll to the template section
                                    setTimeout(() => {
                                      const el = document.getElementById(
                                        `template-${item.triggerType}`
                                      );
                                      el?.scrollIntoView({ behavior: "smooth" });
                                    }, 100);
                                  }}
                                >
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Draft Preview Sheet ── */}
      <Sheet
        open={!!previewDraft}
        onOpenChange={(open) => !open && closePreview()}
      >
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
                {typeof (previewDraft.email_data as Record<string, unknown>)
                  ?.tone === "string" && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
                    {String(
                      (previewDraft.email_data as Record<string, unknown>).tone
                    )}
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
                <div className="flex items-center justify-between">
                  <Label>Body</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={regenerateDraft}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
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

      {/* ── Template Edit Sheet ── */}
      <Sheet
        open={!!templateEditing}
        onOpenChange={(open) => !open && closeTemplateEdit()}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Template</SheetTitle>
            <SheetDescription>
              {templateEditing &&
                `${
                  TRIGGER_LABELS[templateEditing.triggerType]
                } — ${templateEditing.tone} tone — Variation ${
                  templateEditing.variationIndex + 1
                }`}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={templateEditSubject}
                onChange={(e) => setTemplateEditSubject(e.target.value)}
                placeholder="Email subject line with {{variables}}"
              />
              <p className="text-xs text-muted-foreground">
                Use {`{{customerName}}`}, {`{{businessName}}`},{" "}
                {`{{pointsBalance}}`}, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={templateEditBody}
                onChange={(e) => setTemplateEditBody(e.target.value)}
                rows={14}
                className="font-mono text-sm"
                placeholder="Email body with {{variables}}"
              />
            </div>

            {/* Live preview with sample data */}
            {templateEditBody && (
              <div className="space-y-2">
                <Label>Preview (with sample data)</Label>
                <div className="rounded-lg border bg-white p-3">
                  <p className="font-medium text-sm mb-2">
                    {injectVariables(templateEditSubject, SAMPLE_DATA)}
                  </p>
                  <Separator className="mb-3" />
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: textToHtml(
                        injectVariables(templateEditBody, SAMPLE_DATA)
                      ),
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={closeTemplateEdit}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveTemplateEdit}
              disabled={savingTemplate}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingTemplate ? "Saving..." : "Save Template"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Template Preview Sheet ── */}
      <Sheet
        open={!!templatePreview}
        onOpenChange={(open) => !open && setTemplatePreview(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Email Preview</SheetTitle>
            <SheetDescription>
              This is how the email will look with sample customer data.
            </SheetDescription>
          </SheetHeader>

          {templatePreview && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="font-medium text-sm mb-3">
                  Subject: {templatePreview.subject}
                </p>
                <Separator className="mb-4" />
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(templatePreview.body),
                  }}
                />
              </div>
            </div>
          )}

          <SheetFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplatePreview(null)}
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
