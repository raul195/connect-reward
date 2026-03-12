"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { DEFAULT_SETTINGS } from "@/lib/points";
/* Note: createClient is still imported for logo upload (Supabase Storage) */
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, X, Plus, Pencil, Trash2, GripVertical, HelpCircle, ExternalLink } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { PlanTier, Service, AutomationTriggerType, EmailAutomationTrigger, TonePreference, TicketCategory } from "@/lib/types";

export default function SettingsPage() {
  const { profile } = useProfile();
  const { company } = useCompany(profile?.company_id);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcDescription, setSvcDescription] = useState("");
  const [svcPoints, setSvcPoints] = useState("500");
  const [svcActive, setSvcActive] = useState(true);
  const [savingService, setSavingService] = useState(false);

  // Automation state
  const [autoSettings, setAutoSettings] = useState({
    auto_approve_emails: false,
    preferred_send_time: "10:00",
    timezone: "America/New_York",
    monthly_reminders_enabled: true,
    reminder_frequency: "monthly" as "monthly" | "quarterly",
    tone_preference: "friendly" as TonePreference,
  });
  const [triggers, setTriggers] = useState<EmailAutomationTrigger[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [savingAuto, setSavingAuto] = useState(false);

  // Support ticket state
  const [supportCategory, setSupportCategory] = useState<TicketCategory>("account");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Review links state
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({
    google: "", yelp: "", bbb: "", facebook: "", trustpilot: "", other: "",
  });
  const [otherLabel, setOtherLabel] = useState("");
  const [savingReviewLinks, setSavingReviewLinks] = useState(false);
  const [reviewLinksLoaded, setReviewLinksLoaded] = useState(false);

  useEffect(() => {
    if (company?.settings) {
      setSettings({ ...DEFAULT_SETTINGS, ...(company.settings as Record<string, unknown>) });
    }
  }, [company]);

  function updateSetting(key: string, value: unknown) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function saveSettings() {
    if (!profile?.company_id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        toast.error("Failed to save settings.");
        setSaving(false);
        return;
      }
    } catch {
      toast.error("Failed to save settings.");
      setSaving(false);
      return;
    }
    setSaving(false);
    toast.success("Settings saved!");
  }

  function handleLogoDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  async function uploadLogo() {
    if (!logoFile || !profile?.company_id) return;
    setUploadingLogo(true);
    const supabase = createClient();
    const ext = logoFile.name.split(".").pop();
    const path = `${profile.company_id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, logoFile, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload logo. Make sure the 'logos' bucket exists in Supabase.");
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    // Update company logo_url via API to bypass RLS
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo_url: urlData.publicUrl }),
    });
    updateSetting("logo_url", urlData.publicUrl);
    toast.success("Logo uploaded!");
    setLogoFile(null);
    setLogoPreview(null);
    setUploadingLogo(false);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
  }

  // ── Services CRUD ──────────────────────────────
  const fetchServices = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      if (data.services) setServices(data.services as Service[]);
    } catch { /* ignore */ }
    setServicesLoading(false);
  }, [profile?.company_id]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  function openAddService() {
    setEditingService(null);
    setSvcName("");
    setSvcDescription("");
    setSvcPoints("500");
    setSvcActive(true);
    setServiceDialogOpen(true);
  }

  function openEditService(svc: Service) {
    setEditingService(svc);
    setSvcName(svc.name);
    setSvcDescription(svc.description ?? "");
    setSvcPoints(String(svc.points_value));
    setSvcActive(svc.is_active);
    setServiceDialogOpen(true);
  }

  async function handleSaveService() {
    if (!svcName.trim() || !profile?.company_id) return;
    setSavingService(true);
    const payload = {
      name: svcName.trim(),
      description: svcDescription.trim() || null,
      points_value: parseInt(svcPoints) || 500,
      is_active: svcActive,
      display_order: editingService ? undefined : services.length,
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingService
            ? { action: "update_service", id: editingService.id, ...payload }
            : { action: "create_service", ...payload }
        ),
      });
      if (!res.ok) {
        toast.error("Failed to save service.");
        setSavingService(false);
        return;
      }
      toast.success(editingService ? "Service updated!" : "Service added!");
    } catch {
      toast.error("Failed to save service.");
      setSavingService(false);
      return;
    }

    setServiceDialogOpen(false);
    setSavingService(false);
    fetchServices();
  }

  async function deleteService(id: string) {
    try {
      await fetch("/api/admin/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      toast.error("Failed to delete service.");
      return;
    }
    toast.success("Service deleted.");
    fetchServices();
  }

  async function toggleServiceActive(svc: Service) {
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_service", id: svc.id, is_active: !svc.is_active }),
      });
    } catch { /* ignore */ }
    fetchServices();
  }

  // ── Automation settings ──────────────────────────
  const fetchAutomation = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/automation-settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.settings) {
        setAutoSettings({
          auto_approve_emails: data.settings.auto_approve_emails ?? false,
          preferred_send_time: data.settings.preferred_send_time ?? "10:00",
          timezone: data.settings.timezone ?? "America/New_York",
          monthly_reminders_enabled: data.settings.monthly_reminders_enabled ?? true,
          reminder_frequency: data.settings.reminder_frequency ?? "monthly",
          tone_preference: data.settings.tone_preference ?? "friendly",
        });
      }
      if (data.triggers) setTriggers(data.triggers as EmailAutomationTrigger[]);
    } catch { /* ignore */ }
    setAutoLoading(false);
  }, [profile?.company_id]);

  useEffect(() => { fetchAutomation(); }, [fetchAutomation]);

  async function saveAutomation() {
    setSavingAuto(true);
    try {
      const res = await fetch("/api/admin/automation-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autoSettings),
      });
      if (!res.ok) throw new Error();
      toast.success("Automation settings saved!");
    } catch {
      toast.error("Failed to save automation settings.");
    }
    setSavingAuto(false);
  }

  async function toggleTrigger(trigger: EmailAutomationTrigger) {
    try {
      await fetch("/api/admin/automation-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_id: trigger.id, is_active: !trigger.is_active }),
      });
      fetchAutomation();
    } catch {
      toast.error("Failed to toggle trigger.");
    }
  }

  async function handleSubmitSupportTicket() {
    if (!supportSubject.trim() || !supportDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmittingTicket(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: supportCategory,
          subject: supportSubject,
          description: supportDescription,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Support ticket submitted!");
        setSupportCategory("account");
        setSupportSubject("");
        setSupportDescription("");
      }
    } catch {
      toast.error("Failed to submit ticket");
    }
    setSubmittingTicket(false);
  }

  // ── Review links ──────────────────────────
  const fetchReviewLinks = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const res = await fetch("/api/admin/review-links");
      if (!res.ok) return;
      const { data } = await res.json();
      const map: Record<string, string> = {
        google: "", yelp: "", bbb: "", facebook: "", trustpilot: "", other: "",
      };
      let label = "";
      for (const link of data ?? []) {
        map[link.platform] = link.url ?? "";
        if (link.platform === "other" && link.label) label = link.label;
      }
      setReviewLinks(map);
      setOtherLabel(label);
    } catch { /* ignore */ }
    setReviewLinksLoaded(true);
  }, [profile?.company_id]);

  useEffect(() => { fetchReviewLinks(); }, [fetchReviewLinks]);

  async function saveReviewLinks() {
    // Validate URLs
    for (const [platform, url] of Object.entries(reviewLinks)) {
      if (!url.trim()) continue;
      try {
        const u = new URL(url.trim());
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      } catch {
        toast.error(`Invalid URL for ${platform}: ${url}`);
        return;
      }
    }

    setSavingReviewLinks(true);
    const links = Object.entries(reviewLinks)
      .filter(([, url]) => url.trim())
      .map(([platform, url], i) => ({
        platform,
        url: url.trim(),
        label: platform === "other" ? otherLabel.trim() || undefined : undefined,
        display_order: i,
      }));

    try {
      const res = await fetch("/api/admin/review-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || "Failed to save review links");
      } else {
        toast.success("Review links saved!");
      }
    } catch {
      toast.error("Failed to save review links");
    }
    setSavingReviewLinks(false);
  }

  const REVIEW_PLATFORMS = [
    { key: "google", name: "Google", icon: "\u{1F50D}" },
    { key: "yelp", name: "Yelp", icon: "\u{2B50}" },
    { key: "bbb", name: "BBB", icon: "\u{1F3DB}\uFE0F" },
    { key: "facebook", name: "Facebook", icon: "\u{1F44D}" },
    { key: "trustpilot", name: "Trustpilot", icon: "\u{2705}" },
    { key: "other", name: "Other", icon: "\u{1F517}" },
  ];

  const TRIGGER_INFO: Record<AutomationTriggerType, { label: string; description: string }> = {
    inactivity_30: { label: "30-day inactivity", description: "Send a gentle nudge to customers who haven't been active in 30 days" },
    inactivity_60: { label: "60-day inactivity (urgent)", description: "Send an urgent reminder to customers inactive for 60 days" },
    points_close_to_reward: { label: "Close to reward", description: "Notify customers who are within 20% of earning a reward" },
    referral_nudge: { label: "Referral follow-up", description: "Check in with customers whose referrals have been pending for 14+ days" },
    milestone_reached: { label: "Milestone celebration", description: "Congratulate customers when they hit referral milestones" },
    program_reminder: { label: "Monthly summary", description: "Send a monthly or quarterly activity recap to all customers" },
    feedback_request: { label: "Feedback request", description: "Ask business admins for feedback 7 days after signup" },
  };

  const SEND_TIMES = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 7; // 7am to 5pm
    const label = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
    const value = `${String(hour).padStart(2, "0")}:00`;
    return { label, value };
  });

  const TIMEZONES = [
    { label: "Eastern (ET)", value: "America/New_York" },
    { label: "Central (CT)", value: "America/Chicago" },
    { label: "Mountain (MT)", value: "America/Denver" },
    { label: "Pacific (PT)", value: "America/Los_Angeles" },
    { label: "Alaska (AKT)", value: "America/Anchorage" },
    { label: "Hawaii (HT)", value: "Pacific/Honolulu" },
    { label: "Arizona (MST)", value: "America/Phoenix" },
  ];

  const isFreePlan = company?.plan_tier === "free";
  const planTier = (company?.plan_tier ?? "free") as PlanTier;
  const serviceLimit = PLAN_LIMITS[planTier].maxServices;
  const atServiceLimit = services.length >= serviceLimit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program Settings</h1>
        <p className="text-muted-foreground">Configure your referral rewards program.</p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services & Points</TabsTrigger>
          <TabsTrigger value="points">Bonuses</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="reviews">Review Links</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Bonuses & Settings Tab */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Bonuses & Points Settings</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure milestone bonuses, review rewards, and expiration rules. Per-referral points are set in the Services & Points tab.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Milestone bonus amount</Label>
                  <Input type="number" min="0" value={String(settings.milestone_bonus ?? 500)}
                    onChange={(e) => updateSetting("milestone_bonus", parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Bonus points awarded when customers hit milestones</p>
                </div>
                <div className="space-y-2">
                  <Label>Milestone threshold (every N referrals)</Label>
                  <Input type="number" min="1" value={String(settings.milestone_threshold ?? 5)}
                    onChange={(e) => updateSetting("milestone_threshold", parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">Award milestone bonus after every N completed referrals</p>
                </div>
                <div className="space-y-2">
                  <Label>Review points</Label>
                  <Input type="number" min="0" value={String(settings.review_points ?? 25)}
                    onChange={(e) => updateSetting("review_points", parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Points for leaving a verified review</p>
                </div>
                <div className="space-y-2">
                  <Label>Photo review bonus</Label>
                  <Input type="number" min="0" value={String(settings.photo_review_bonus ?? 10)}
                    onChange={(e) => updateSetting("photo_review_bonus", parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Extra points when review includes a photo</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Points expiration</Label>
                  <Select value={String(settings.points_expiration ?? "never")} onValueChange={(v) => updateSetting("points_expiration", v)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">How long before unused points expire</p>
                </div>
              </div>
              <Button onClick={saveSettings} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Services & Points</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define the services you offer and set the point value for each. When a referral is completed, the customer earns points based on the service selected.
                  </p>
                </div>
                <Button onClick={openAddService} disabled={atServiceLimit} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No services configured yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your services so customers can select them when submitting referrals.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">{services.length}/{serviceLimit} services used</p>
                  {atServiceLimit && <UpgradeCTA message={`You've reached your ${serviceLimit}-service limit. Upgrade to add more.`} className="mb-2" />}
                  {services.map(svc => (
                    <div key={svc.id} className={`flex items-center justify-between rounded-lg border p-4 ${!svc.is_active ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{svc.name}</p>
                          {svc.description && <p className="text-sm text-muted-foreground">{svc.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-teal-600">{svc.points_value.toLocaleString()} pts</span>
                        <Switch checked={svc.is_active} onCheckedChange={() => toggleServiceActive(svc)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${svc.name}`} onClick={() => openEditService(svc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" aria-label={`Delete ${svc.name}`} onClick={() => deleteService(svc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Dialog */}
          <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
                <DialogDescription>Configure the service name, description, and points value.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Service Name *</Label>
                  <Input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="e.g. Solar Panel Installation" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={svcDescription} onChange={e => setSvcDescription(e.target.value)} placeholder="Brief description of this service..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Points Value</Label>
                  <Input type="number" min="0" value={svcPoints} onChange={e => setSvcPoints(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Points awarded to the referrer when a referral for this service is completed.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={svcActive} onCheckedChange={setSvcActive} />
                  <Label className="font-normal">Active (visible to customers)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveService} disabled={savingService || !svcName.trim()} className="bg-teal-600 hover:bg-teal-700">
                  {savingService ? "Saving..." : editingService ? "Update Service" : "Add Service"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader><CardTitle>Tier Thresholds</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Silver threshold</Label>
                  <Input type="number" min="1" value={String(settings.tier_silver ?? 1000)}
                    onChange={(e) => updateSetting("tier_silver", parseInt(e.target.value) || 1000)} />
                </div>
                <div className="space-y-2">
                  <Label>Gold threshold</Label>
                  <Input type="number" min="1" value={String(settings.tier_gold ?? 3000)}
                    onChange={(e) => updateSetting("tier_gold", parseInt(e.target.value) || 3000)} />
                </div>
                <div className="space-y-2">
                  <Label>Platinum threshold</Label>
                  <Input type="number" min="1" value={String(settings.tier_platinum ?? 7500)}
                    onChange={(e) => updateSetting("tier_platinum", parseInt(e.target.value) || 7500)} />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "notify_referral_status", label: "Referral status updates → customer email", default: true },
                { key: "notify_points_earned", label: "Points earned → customer email", default: true },
                { key: "notify_milestone", label: "Milestone reached → customer email", default: true },
                { key: "notify_weekly_summary", label: "Weekly summary → customer email", default: true },
                { key: "notify_new_referral", label: "New referral submitted → business email", default: true },
                { key: "notify_referral_complete", label: "Referral completed → business email", default: true },
                { key: "notify_reward_redeemed", label: "Reward redeemed → business email", default: true },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-2">
                    <Label className="font-normal">{item.label}</Label>
                    <Switch
                      checked={settings[item.key] !== undefined ? Boolean(settings[item.key]) : item.default}
                      onCheckedChange={(v) => updateSetting(item.key, v)}
                    />
                  </div>
                  <Separator />
                </div>
              ))}
              <Button onClick={saveSettings} disabled={saving} className="bg-teal-600 hover:bg-teal-700 mt-2">
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          {isFreePlan ? (
            <UpgradeCTA message="Upgrade to customize your branding." />
          ) : (
            <Card>
              <CardHeader><CardTitle>Brand Customization</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  {(logoPreview || Boolean(settings.logo_url)) && (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview || String(settings.logo_url)}
                        alt="Company logo"
                        className="h-24 w-24 rounded-lg border object-contain bg-white p-2"
                      />
                      {logoPreview && (
                        <button onClick={removeLogo} aria-label="Remove logo" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    onDrop={handleLogoDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-teal-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById("logo-input")?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drag & drop your logo here, or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 2MB</p>
                    <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                  </div>
                  {logoFile && (
                    <Button onClick={uploadLogo} disabled={uploadingLogo} className="bg-teal-600 hover:bg-teal-700">
                      <Upload className="mr-2 h-4 w-4" /> {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={String(settings.brandColor ?? "#0D9488")} onChange={(e) => updateSetting("brandColor", e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                      <Input value={String(settings.brandColor ?? "#0D9488")} onChange={(e) => updateSetting("brandColor", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={String(settings.secondaryColor ?? "#F59E0B")} onChange={(e) => updateSetting("secondaryColor", e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                      <Input value={String(settings.secondaryColor ?? "#F59E0B")} onChange={(e) => updateSetting("secondaryColor", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={String(settings.accentColor ?? "#10B981")} onChange={(e) => updateSetting("accentColor", e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                      <Input value={String(settings.accentColor ?? "#10B981")} onChange={(e) => updateSetting("accentColor", e.target.value)} />
                    </div>
                  </div>
                </div>
                <Button onClick={saveSettings} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Review Links Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Review Links
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add your review platform URLs. Customers will see buttons to leave reviews on the platforms you configure.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!reviewLinksLoaded ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}
                </div>
              ) : (
                <>
                  {REVIEW_PLATFORMS.map((p) => (
                    <div key={p.key}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-8 text-center">{p.icon}</span>
                        <div className="flex-1 space-y-1">
                          <Label className="text-sm font-medium">{p.name}</Label>
                          {p.key === "other" && (
                            <Input
                              placeholder="Platform name (e.g. Angi, HomeAdvisor)"
                              value={otherLabel}
                              onChange={(e) => setOtherLabel(e.target.value)}
                              className="mb-1"
                            />
                          )}
                          <Input
                            placeholder={`https://www.${p.key === "other" ? "example" : p.key}.com/your-business`}
                            value={reviewLinks[p.key] ?? ""}
                            onChange={(e) => setReviewLinks(prev => ({ ...prev, [p.key]: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                  <Button onClick={saveReviewLinks} disabled={savingReviewLinks} className="bg-teal-600 hover:bg-teal-700 mt-2">
                    <Save className="mr-2 h-4 w-4" />
                    {savingReviewLinks ? "Saving..." : "Save Review Links"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Submit a Support Ticket
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Need help? Submit a ticket and our team will get back to you.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={supportCategory} onValueChange={(v) => setSupportCategory(v as TicketCategory)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Brief summary of your issue" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={supportDescription} onChange={(e) => setSupportDescription(e.target.value)} placeholder="Describe your issue in detail..." rows={4} />
              </div>
              <Button onClick={handleSubmitSupportTicket} disabled={submittingTicket} className="bg-teal-600 hover:bg-teal-700">
                {submittingTicket ? "Submitting..." : "Submit Ticket"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          {isFreePlan ? (
            <UpgradeCTA message="Upgrade to Beta to unlock email automation." />
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Email Automation</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure automated email triggers and delivery preferences. Emails are queued as drafts for your review before sending.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {autoLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}
                </div>
              ) : (
                <>
                  {/* Trigger Toggles */}
                  <div>
                    <Label className="text-base font-semibold">Email Triggers</Label>
                    <p className="text-sm text-muted-foreground mb-4">Enable or disable automated email triggers.</p>
                    <div className="space-y-1">
                      {(Object.keys(TRIGGER_INFO) as AutomationTriggerType[]).map((type) => {
                        const trigger = triggers.find(t => t.trigger_type === type);
                        const info = TRIGGER_INFO[type];
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between py-3">
                              <div>
                                <Label className="font-medium">{info.label}</Label>
                                <p className="text-sm text-muted-foreground">{info.description}</p>
                              </div>
                              <Switch
                                checked={trigger?.is_active ?? true}
                                onCheckedChange={() => trigger && toggleTrigger(trigger)}
                                disabled={!trigger}
                              />
                            </div>
                            <Separator />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Preferences */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Preferred send time</Label>
                      <Select
                        value={autoSettings.preferred_send_time}
                        onValueChange={(v) => setAutoSettings(prev => ({ ...prev, preferred_send_time: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SEND_TIMES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">When approved emails should be delivered</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={autoSettings.timezone}
                        onValueChange={(v) => setAutoSettings(prev => ({ ...prev, timezone: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Auto-approve toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Auto-approve emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically approve draft emails after 24 hours without manual review
                      </p>
                    </div>
                    <Switch
                      checked={autoSettings.auto_approve_emails}
                      onCheckedChange={(v) => setAutoSettings(prev => ({ ...prev, auto_approve_emails: v }))}
                    />
                  </div>

                  <Separator />

                  {/* Monthly reminders */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Monthly reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send activity recap emails to all customers
                      </p>
                    </div>
                    <Switch
                      checked={autoSettings.monthly_reminders_enabled}
                      onCheckedChange={(v) => setAutoSettings(prev => ({ ...prev, monthly_reminders_enabled: v }))}
                    />
                  </div>

                  {autoSettings.monthly_reminders_enabled && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      <Label>Reminder frequency</Label>
                      <Select
                        value={autoSettings.reminder_frequency}
                        onValueChange={(v) => setAutoSettings(prev => ({ ...prev, reminder_frequency: v as "monthly" | "quarterly" }))}
                      >
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Separator />

                  {/* Tone preference */}
                  <div className="space-y-2">
                    <Label className="font-medium">Email tone</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose the tone for automated email templates
                    </p>
                    <Select
                      value={autoSettings.tone_preference}
                      onValueChange={(v) => setAutoSettings(prev => ({ ...prev, tone_preference: v as TonePreference }))}
                    >
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="motivational">Motivational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={saveAutomation} disabled={savingAuto} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="mr-2 h-4 w-4" /> {savingAuto ? "Saving..." : "Save Automation Settings"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
