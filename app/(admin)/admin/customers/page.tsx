"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { manualPointAdjustment } from "@/lib/points";
import { isAtLimit } from "@/lib/plan-limits";
import { relativeTime } from "@/lib/relative-time";
import { TierBadge } from "@/components/shared/TierBadge";
import { UpgradeCTA } from "@/components/shared/UpgradeCTA";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { Search, UserPlus, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import type { Profile, LoyaltyTier } from "@/lib/types";

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
const PAGE_SIZE = 20;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CustomersPage() {
  const { profile: adminProfile } = useProfile();
  const { company } = useCompany(adminProfile?.company_id);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<"total_points" | "full_name" | "created_at">("total_points");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState<Profile | null>(null);
  const [detailOpen, setDetailOpen] = useState<Profile | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const fetchCustomers = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("company_id", adminProfile.company_id)
      .eq("role", "customer")
      .order(sortCol, { ascending: sortAsc })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (tierFilter !== "all") {
      query = query.eq("loyalty_tier", tierFilter);
    }

    const { data, count } = await query;
    if (data) setCustomers(data as Profile[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [adminProfile?.company_id, page, search, tierFilter, sortCol, sortAsc]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  }

  async function handleAddCustomer() {
    if (!adminProfile?.company_id || !newName.trim() || !newEmail.trim() || !newPhone.trim()) return;
    const phoneDigits = newPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) { toast.error("Phone must be 10 digits."); return; }
    if (company && isAtLimit(company.plan, "customers", total)) {
      toast.error("Customer limit reached. Upgrade your plan.");
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newName.trim(),
          email: newEmail.trim(),
          phone: phoneDigits,
          address: newAddress || null,
          city: newCity || null,
          state: newState || null,
          zip: newZip || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add customer.");
        return;
      }
    } catch {
      toast.error("Failed to add customer.");
      return;
    }

    toast.success(`${newName} added!`);
    setAddOpen(false);
    setNewName(""); setNewEmail(""); setNewPhone("");
    setNewAddress(""); setNewCity(""); setNewState(""); setNewZip("");
    fetchCustomers();
  }

  async function handleAdjustPoints() {
    if (!adjustOpen || !adjAmount) return;
    const supabase = createClient();
    await manualPointAdjustment(
      adjustOpen.id,
      adjustOpen.company_id!,
      parseInt(adjAmount),
      adjReason,
      supabase
    );
    toast.success(`Points adjusted for ${adjustOpen.full_name}`);
    setAdjustOpen(null);
    setAdjAmount("");
    setAdjReason("");
    fetchCustomers();
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const atLimit = company ? isAtLimit(company.plan, "customers", total) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">{total} total customers</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {atLimit && <UpgradeCTA message="You've reached your customer limit. Upgrade to add more." />}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Tiers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 w-12">Rank</th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => toggleSort("full_name")}>
                  Customer {sortCol === "full_name" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="p-3 hidden md:table-cell">Email</th>
                <th className="p-3 cursor-pointer hover:text-foreground text-right" onClick={() => toggleSort("total_points")}>
                  Points {sortCol === "total_points" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center">Tier</th>
                <th className="p-3 hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => toggleSort("created_at")}>
                  Joined {sortCol === "created_at" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="p-3"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No customers found.</td></tr>
              ) : (
                customers.map((c, i) => {
                  const rank = page * PAGE_SIZE + i;
                  return (
                    <tr key={c.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setDetailOpen(c)}>
                      <td className="p-3 font-bold">
                        {sortCol === "total_points" && !sortAsc && rank < 3
                          ? <span className="text-lg">{MEDALS[rank]}</span>
                          : <span className="text-muted-foreground">{rank + 1}</span>}
                      </td>
                      <td className="p-3 font-medium">{c.full_name}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{c.email}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">{c.total_points.toLocaleString()}</td>
                      <td className="p-3 text-center"><TierBadge tier={c.loyalty_tier as LoyaltyTier} /></td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{relativeTime(c.created_at)}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailOpen(c)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdjustOpen(c)}>Adjust Points</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to your rewards program.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(formatPhone(e.target.value))} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <AddressAutocomplete
                value={newAddress}
                onChange={setNewAddress}
                onSelect={(addr) => {
                  setNewAddress(addr.street);
                  setNewCity(addr.city);
                  setNewState(addr.state);
                  setNewZip(addr.zip);
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Springfield" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={newState} onValueChange={setNewState}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input value={newZip} onChange={(e) => setNewZip(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="62704" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} className="bg-teal-600 hover:bg-teal-700">Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Points Modal */}
      <Dialog open={!!adjustOpen} onOpenChange={() => setAdjustOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points — {adjustOpen?.full_name}</DialogTitle>
            <DialogDescription>Current balance: {adjustOpen?.total_points.toLocaleString()} pts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (positive to add, negative to subtract)</Label>
              <Input type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} placeholder="500" />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Reason for adjustment..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(null)}>Cancel</Button>
            <Button onClick={handleAdjustPoints} className="bg-teal-600 hover:bg-teal-700">Adjust Points</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Modal */}
      <Dialog open={!!detailOpen} onOpenChange={() => setDetailOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailOpen?.full_name}</DialogTitle>
            <DialogDescription>{detailOpen?.email}</DialogDescription>
          </DialogHeader>
          {detailOpen && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{detailOpen.total_points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div>
                  <TierBadge tier={detailOpen.loyalty_tier as LoyaltyTier} />
                  <p className="text-xs text-muted-foreground mt-1">Tier</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{relativeTime(detailOpen.created_at)}</p>
                  <p className="text-xs text-muted-foreground">Joined</p>
                </div>
              </div>
              {detailOpen.phone && <p className="text-sm text-muted-foreground">Phone: {detailOpen.phone}</p>}
              {(detailOpen.address || detailOpen.city) && (
                <p className="text-sm text-muted-foreground">
                  Address: {[detailOpen.address, detailOpen.city, detailOpen.state, detailOpen.zip].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailOpen(null); if (detailOpen) setAdjustOpen(detailOpen); }}>
              Adjust Points
            </Button>
            <Button variant="outline" onClick={() => setDetailOpen(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
