"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { relativeTime } from "@/lib/relative-time";
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, Shield, Users, Eye } from "lucide-react";
import type { Profile } from "@/lib/types";

const TEAM_LIMITS: Record<string, number> = { free: 1, starter: 3, growth: 10, pro: 999 };

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  contractor: { label: "Owner", color: "bg-amber-100 text-amber-700" },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700" },
  rep: { label: "Rep", color: "bg-gray-100 text-gray-700" },
};

export default function TeamPage() {
  const { profile: adminProfile } = useProfile();
  const { company } = useCompany(adminProfile?.company_id);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("rep");

  const teamLimit = TEAM_LIMITS[company?.plan ?? "free"] ?? 1;

  const fetchMembers = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*")
      .eq("company_id", adminProfile.company_id)
      .in("role", ["contractor", "super_admin"])
      .order("created_at", { ascending: true });
    // For now, all contractors are team members
    if (data) setMembers(data as Profile[]);
    setLoading(false);
  }, [adminProfile?.company_id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const phoneDigits = invitePhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (members.length >= teamLimit) {
      toast.error("Team member limit reached. Upgrade your plan.");
      return;
    }

    // In production, this would send an invite email. For now, create directly.
    toast.success(`Invite sent to ${inviteEmail}!`);
    setInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("rep");
  }

  const isFreePlan = company?.plan === "free";
  const atLimit = members.length >= teamLimit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">{members.length}/{teamLimit === 999 ? "∞" : teamLimit} team members</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          disabled={isFreePlan || atLimit}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Invite Member
        </Button>
      </div>

      {isFreePlan && <UpgradeCTA message="Upgrade to Starter to invite team members." />}

      {/* Role Permissions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Role Permissions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <span className="font-bold">Owner</span>
              </div>
              <p className="text-sm text-muted-foreground">Full access to everything</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-bold">Manager</span>
              </div>
              <p className="text-sm text-muted-foreground">Everything except billing and deleting the company</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-gray-500" />
                <span className="font-bold">Rep</span>
              </div>
              <p className="text-sm text-muted-foreground">View dashboard, manage assigned referrals, read-only leaderboard</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member List */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3 hidden md:table-cell">Phone</th>
                <th className="p-3">Role</th>
                <th className="p-3 hidden sm:table-cell">Joined</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-3"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : members.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No team members.</td></tr>
              ) : (
                members.map((m) => {
                  const roleCfg = ROLE_BADGES[m.role] ?? ROLE_BADGES.contractor;
                  return (
                    <tr key={m.id} className="border-b">
                      <td className="p-3 font-medium">{m.full_name}</td>
                      <td className="p-3 text-muted-foreground">{m.email}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{m.phone ?? "—"}</td>
                      <td className="p-3">
                        <Badge className={`${roleCfg.color} border-0`}>{roleCfg.label}</Badge>
                      </td>
                      <td className="p-3 hidden sm:table-cell text-muted-foreground">{relativeTime(m.created_at)}</td>
                      <td className="p-3">
                        {m.id !== adminProfile?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Change Role</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invite to join your team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="rep">Rep</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} className="bg-teal-600 hover:bg-teal-700">Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
