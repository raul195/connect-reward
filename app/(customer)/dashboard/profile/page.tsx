"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTierProgress, getPointsToNextTier, calculateTierFromPoints } from "@/lib/points";
import { TierBadge } from "@/components/shared/TierBadge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import type { Profile, NotificationPreferences } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalReferrals: 0, completedReferrals: 0, totalRedeemed: 0 });
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    referral_status: true,
    points_earned: true,
    milestone_reached: true,
    reward_fulfilled: true,
    weekly_summary: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      const p = data as Profile;
      setProfile(p);
      setFullName(p.full_name);
      setPhone(p.phone ?? "");
      if (p.notification_preferences) {
        setNotifPrefs(p.notification_preferences);
      }
    }

    // Referral stats
    const { count: totalRef } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    const { count: completedRef } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("status", "won");

    // Points redeemed
    const { data: redeemedTx } = await supabase
      .from("point_transactions")
      .select("amount")
      .eq("profile_id", user.id)
      .eq("type", "redeemed");

    const totalRedeemed = Math.abs(redeemedTx?.reduce((sum, t) => sum + t.amount, 0) ?? 0);

    setStats({
      totalReferrals: totalRef ?? 0,
      completedReferrals: completedRef ?? 0,
      totalRedeemed,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to save profile.");
    } else {
      toast.success("Profile updated!");
      setProfile({ ...profile, full_name: fullName, phone: phone || null });
    }
    setSaving(false);
  }

  async function handleSaveNotifPrefs() {
    if (!profile) return;
    setSavingPrefs(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: notifPrefs })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to save notification preferences.");
    } else {
      toast.success("Notification preferences updated!");
    }
    setSavingPrefs(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!profile || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const supabase = createClient();

    const ext = file.name.split(".").pop();
    const path = `avatars/${profile.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload avatar.");
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", profile.id);

    setProfile({ ...profile, avatar_url: urlData.publicUrl });
    toast.success("Avatar updated!");
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }

  const tier = calculateTierFromPoints(profile.total_points);
  const progress = getTierProgress(profile.total_points);
  const next = getPointsToNextTier(profile.total_points);
  const conversionRate = stats.totalReferrals > 0
    ? Math.round((stats.completedReferrals / stats.totalReferrals) * 100)
    : 0;
  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      {/* Account Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {profile.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.full_name} className="rounded-full object-cover" />
                )}
                <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow-sm hover:bg-teal-700">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <p className="font-bold text-lg">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Points Summary */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Points Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.total_points.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalRedeemed.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Redeemed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{(profile.total_points - stats.totalRedeemed).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Available Balance</p>
            </div>
          </div>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Tier:</span>
                <TierBadge tier={tier} />
              </div>
              {next && (
                <span className="text-sm text-muted-foreground">
                  {next.pointsNeeded.toLocaleString()} pts to {next.nextTier}
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2.5 [&>div]:bg-teal-500" />
          </div>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Referral Stats</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              <p className="text-sm text-muted-foreground">Total Submitted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.completedReferrals}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "referral_status" as const, label: "Referral Updates", desc: "Get emailed when your referral status changes" },
            { key: "points_earned" as const, label: "Points Earned", desc: "Get emailed when you earn points" },
            { key: "milestone_reached" as const, label: "Milestone Reached", desc: "Get emailed when you hit a milestone or achievement" },
            { key: "reward_fulfilled" as const, label: "Reward Fulfilled", desc: "Get emailed when your redeemed reward is fulfilled" },
            { key: "weekly_summary" as const, label: "Weekly Summary", desc: "Receive a weekly email summary of your activity" },
          ].map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifPrefs[item.key]}
                  onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, [item.key]: v }))}
                />
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
          <Button onClick={handleSaveNotifPrefs} disabled={savingPrefs} className="bg-teal-600 hover:bg-teal-700 mt-2">
            <Save className="mr-2 h-4 w-4" />
            {savingPrefs ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
