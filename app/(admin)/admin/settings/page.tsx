"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { DEFAULT_SETTINGS } from "@/lib/points";
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
import { Save, Upload, X, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { Service } from "@/lib/types";

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
    const supabase = createClient();
    await supabase.from("companies").update({ settings }).eq("id", profile.company_id);
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
    await supabase.from("companies").update({ logo_url: urlData.publicUrl }).eq("id", profile.company_id);
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
    const supabase = createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("display_order", { ascending: true });
    if (data) setServices(data as Service[]);
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
    const supabase = createClient();
    const payload = {
      company_id: profile.company_id,
      name: svcName.trim(),
      description: svcDescription.trim() || null,
      points_value: parseInt(svcPoints) || 500,
      is_active: svcActive,
    };

    if (editingService) {
      await supabase.from("services").update(payload).eq("id", editingService.id);
      toast.success("Service updated!");
    } else {
      await supabase.from("services").insert({ ...payload, display_order: services.length });
      toast.success("Service added!");
    }

    setServiceDialogOpen(false);
    setSavingService(false);
    fetchServices();
  }

  async function deleteService(id: string) {
    const supabase = createClient();
    await supabase.from("services").delete().eq("id", id);
    toast.success("Service deleted.");
    fetchServices();
  }

  async function toggleServiceActive(svc: Service) {
    const supabase = createClient();
    await supabase.from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    fetchServices();
  }

  const isFreePlan = company?.plan === "free";

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
                <Button onClick={openAddService} className="bg-teal-600 hover:bg-teal-700">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditService(svc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteService(svc.id)}>
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
                { key: "notify_new_referral", label: "New referral submitted → contractor email", default: true },
                { key: "notify_referral_complete", label: "Referral completed → contractor email", default: true },
                { key: "notify_reward_redeemed", label: "Reward redeemed → contractor email", default: true },
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
                        <button onClick={removeLogo} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
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
      </Tabs>
    </div>
  );
}
