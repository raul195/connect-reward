"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/super-admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send announcement.");
        setSending(false);
        return;
      }

      const data = await res.json();
      setResult(data);
      setSent(true);
      toast.success(`Announcement sent to ${data.sent} business owners!`);
    } catch {
      toast.error("Failed to send announcement.");
    }
    setSending(false);
  }

  if (sent && result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Send updates to all business owners.</p>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Announcement Sent!</h2>
            <p className="mt-2 text-muted-foreground">
              Successfully sent to {result.sent} business owner{result.sent !== 1 ? "s" : ""}.
              {result.failed > 0 && ` ${result.failed} failed.`}
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => { setSent(false); setSubject(""); setMessage(""); setResult(null); }}
            >
              Send Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Send an email to all business owners on the platform. Use this for new features, updates, or important notices.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject Line *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="New Feature: Referral Leaderboards are here!"
            />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder={"Hi there,\n\nWe're excited to announce...\n\nBest,\nThe Connect Reward Team"}
            />
            <p className="text-xs text-muted-foreground">
              This will be sent as a plain text email from notifications@connectreward.io to every business owner.
            </p>
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending..." : "Send to All Business Owners"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
