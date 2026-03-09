"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MailX, MailCheck, Loader2 } from "lucide-react";

interface Preferences {
  opt_out: boolean;
  reminders_enabled: boolean;
  reward_suggestions_enabled: boolean;
  referral_nudges_enabled: boolean;
  milestone_emails_enabled: boolean;
  promotional_emails_enabled: boolean;
}

const PREF_LABELS: { key: keyof Omit<Preferences, "opt_out">; label: string; desc: string }[] = [
  { key: "reminders_enabled", label: "Program Reminders", desc: "Monthly/quarterly recap emails about your points and rewards" },
  { key: "reward_suggestions_enabled", label: "Reward Suggestions", desc: "Emails when you're close to earning a reward" },
  { key: "referral_nudges_enabled", label: "Referral Follow-ups", desc: "Updates and encouragement about your submitted referrals" },
  { key: "milestone_emails_enabled", label: "Milestone Celebrations", desc: "Congratulatory emails when you hit referral milestones" },
  { key: "promotional_emails_enabled", label: "Re-engagement Emails", desc: "Check-in emails if you haven't visited in a while" },
];

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Invalid unsubscribe link. No token provided.");
      return;
    }

    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired link");
        return res.json();
      })
      .then((data) => {
        setPrefs(data.preferences);
        setLoading(false);
      })
      .catch(() => {
        setError("This unsubscribe link is invalid or expired.");
        setLoading(false);
      });
  }, [token]);

  async function handleAction(action: string, preferences?: Record<string, boolean>) {
    if (!token) return;
    setSaving(true);
    setSuccess(null);

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, preferences }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh preferences
      const refreshRes = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setPrefs(refreshData.preferences);
      }

      setSuccess(data.message || "Preferences updated successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error && !prefs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <MailX className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!prefs) return null;

  const allOff = PREF_LABELS.every((p) => !prefs[p.key]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <Card>
          <CardHeader className="text-center">
            {prefs.opt_out ? (
              <MailX className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            ) : (
              <MailCheck className="mx-auto h-12 w-12 text-teal-500 mb-2" />
            )}
            <CardTitle className="text-xl">Email Preferences</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage which emails you receive. Service emails (account confirmations, password resets, referral status updates) cannot be disabled.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                {success}
              </div>
            )}
            {error && prefs && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Engagement Emails
              </p>
              {PREF_LABELS.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={prefs[item.key]}
                      onCheckedChange={(v) => setPrefs((p) => p ? { ...p, [item.key]: v, opt_out: false } : p)}
                      disabled={saving}
                    />
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  const updated: Record<string, boolean> = {};
                  PREF_LABELS.forEach((p) => { updated[p.key] = prefs[p.key]; });
                  handleAction("update_preferences", updated);
                }}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Preferences
              </Button>

              <Separator />

              {!allOff && !prefs.opt_out ? (
                <Button
                  variant="outline"
                  onClick={() => handleAction("unsubscribe_all")}
                  disabled={saving}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Unsubscribe from All Engagement Emails
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleAction("resubscribe")}
                  disabled={saving}
                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                >
                  Re-subscribe to All Engagement Emails
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              You will continue to receive important service emails such as referral status updates, points earned confirmations, and reward fulfillment notices.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
