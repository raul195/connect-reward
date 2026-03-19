"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Send, Mail, Building2 } from "lucide-react";

interface BusinessOption {
  id: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
}

export default function DirectEmailPage() {
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/analytics");
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Get owner emails for each company
      const bizList: BusinessOption[] = [];
      for (const biz of data.businesses ?? []) {
        bizList.push({
          id: biz.id,
          name: biz.name,
          ownerEmail: "",
          ownerName: "",
        });
      }

      // Fetch owners
      const ownerRes = await fetch("/api/super-admin/business-owners");
      if (ownerRes.ok) {
        const ownerData = await ownerRes.json();
        for (const owner of ownerData.owners ?? []) {
          const biz = bizList.find((b) => b.id === owner.company_id);
          if (biz) {
            biz.ownerEmail = owner.email;
            biz.ownerName = owner.full_name;
          }
        }
      }

      setBusinesses(bizList.filter((b) => b.ownerEmail));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const selectedBiz = businesses.find((b) => b.id === selectedBusiness);

  async function handleSend() {
    if (!selectedBusiness || !subject.trim() || !message.trim()) {
      toast.error("Please select a business and fill in the subject and message.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/super-admin/direct-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusiness,
          subject,
          message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send email.");
        setSending(false);
        return;
      }

      toast.success(`Email sent to ${selectedBiz?.ownerName || selectedBiz?.ownerEmail}!`);
      setSubject("");
      setMessage("");
      setSelectedBusiness("");
    } catch {
      toast.error("Failed to send email.");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Direct Email</h1>
        <p className="text-muted-foreground">
          Send a personal email to a specific business owner.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Compose Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Business *</Label>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a business..." />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((biz) => (
                  <SelectItem key={biz.id} value={biz.id}>
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {biz.name}
                      <span className="text-muted-foreground">({biz.ownerEmail})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBiz && (
              <p className="text-xs text-muted-foreground">
                Sending to: {selectedBiz.ownerName} ({selectedBiz.ownerEmail})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quick question about your referral program"
            />
          </div>

          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder={"Hi [Name],\n\nI noticed...\n\nBest,\nRaul"}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !selectedBusiness || !subject.trim() || !message.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
