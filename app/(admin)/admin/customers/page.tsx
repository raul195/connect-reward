"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useCompany } from "@/hooks/useCompany";
import { isDemoAccount } from "@/lib/demo";
import { sampleAdminCustomers } from "@/lib/sample-data";
import { SampleDataBanner } from "@/components/shared/SampleDataBanner";
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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import {
  Search, UserPlus, MoreHorizontal, ChevronLeft, ChevronRight,
  Upload, FileUp, AlertCircle, CheckCircle2, XCircle, Clock, AlertTriangle,
} from "lucide-react";
import type { Profile, LoyaltyTier, CustomerImport } from "@/lib/types";
import {
  parseCSV, detectColumnMapping, validateRow, applyMapping, buildFullName,
  type ColumnMapping, type MappableField, type ParseResult,
} from "@/lib/import";

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
const PAGE_SIZE = 20;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const MAPPABLE_FIELDS: { value: MappableField; label: string }[] = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip", label: "Zip Code" },
  { value: "skip", label: "Skip" },
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ── Email Status Icon ──────────────────────────────────────────────────────

function EmailStatusIcon({ status }: { status?: string }) {
  if (!status || status === "unknown" || status === "valid") return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex ml-1">
            {status === "bounced" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
            {status === "complained" && <XCircle className="h-3.5 w-3.5 text-orange-500" />}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {status === "bounced" && "Email bounced — delivery failed"}
          {status === "complained" && "Recipient marked as spam"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function CustomersPage() {
  const router = useRouter();
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
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const [useSample, setUseSample] = useState(false);

  // Import wizard state
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [sendWelcome, setSendWelcome] = useState(true);
  const [importId, setImportId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<CustomerImport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{
    valid: number;
    invalid: { row: number; errors: string[] }[];
    duplicates: number;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recent imports
  const [recentImports, setRecentImports] = useState<CustomerImport[]>([]);

  const fetchCustomers = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tierFilter !== "all") params.set("tier", tierFilter);
      params.set("sort", sortCol);
      params.set("asc", String(sortAsc));
      params.set("page", String(page));

      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();

      if (data.total === 0 && isDemoAccount(adminProfile?.email)) {
        setCustomers(sampleAdminCustomers.customers as Profile[]);
        setTotal(sampleAdminCustomers.total);
        setUseSample(true);
      } else {
        setCustomers(data.customers as Profile[]);
        setTotal(data.total);
        setUseSample(false);
      }
    } catch {
      if (isDemoAccount(adminProfile?.email)) {
        setCustomers(sampleAdminCustomers.customers as Profile[]);
        setTotal(sampleAdminCustomers.total);
        setUseSample(true);
      }
    }
    setLoading(false);
  }, [adminProfile?.company_id, adminProfile?.email, page, search, tierFilter, sortCol, sortAsc]);

  const fetchRecentImports = useCallback(async () => {
    if (!adminProfile?.company_id) return;
    try {
      const res = await fetch("/api/admin/imports");
      if (res.ok) {
        const data = await res.json();
        setRecentImports(data.data ?? []);
      }
    } catch {
      // silently ignore
    }
  }, [adminProfile?.company_id]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchRecentImports(); }, [fetchRecentImports]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  }

  async function handleAddCustomer() {
    if (!adminProfile?.company_id || !newName.trim() || !newEmail.trim() || !newPhone.trim()) return;
    const phoneDigits = newPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) { toast.error("Phone must be 10 digits."); return; }
    if (company && isAtLimit(company.plan_tier, "customers", total)) {
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
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustOpen.id,
          amount: parseInt(adjAmount),
          reason: adjReason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to adjust points.");
        return;
      }
    } catch {
      toast.error("Failed to adjust points.");
      return;
    }
    toast.success(`Points adjusted for ${adjustOpen.full_name}`);
    setAdjustOpen(null);
    setAdjAmount("");
    setAdjReason("");
    fetchCustomers();
  }

  // ── Import Wizard Handlers ─────────────────────────────────────────────

  function resetImportWizard() {
    setImportStep(1);
    setCsvFile(null);
    setParseResult(null);
    setColumnMapping({});
    setSendWelcome(true);
    setImportId(null);
    setImportProgress(null);
    setIsProcessing(false);
    setValidationSummary(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleFileSelect(file: File) {
    setCsvFile(file);
    const result = await parseCSV(file);
    setParseResult(result);

    if (result.headers.length > 0) {
      const autoMapping = detectColumnMapping(result.headers);
      setColumnMapping(autoMapping);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileSelect(file);
    } else {
      toast.error("Please upload a CSV file.");
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function runValidation() {
    if (!parseResult) return;

    let validCount = 0;
    const invalidRows: { row: number; errors: string[] }[] = [];
    const seenEmails = new Set<string>();
    let dupeCount = 0;

    parseResult.rows.forEach((row, index) => {
      const result = validateRow(row, parseResult.headers, columnMapping);
      if (!result.valid) {
        invalidRows.push({ row: index + 1, errors: result.errors });
        return;
      }

      // Check in-file duplicates
      const mapped = applyMapping(row, parseResult.headers, columnMapping);
      const email = mapped.email.toLowerCase();
      if (seenEmails.has(email)) {
        dupeCount++;
        return;
      }
      seenEmails.add(email);
      validCount++;
    });

    setValidationSummary({ valid: validCount, invalid: invalidRows, duplicates: dupeCount });
    setImportStep(2);
  }

  async function handleStartImport() {
    if (!parseResult || !validationSummary) return;
    setIsProcessing(true);

    // Map rows using the column mapping
    const mappedRows = parseResult.rows
      .map((row) => {
        const mapped = applyMapping(row, parseResult.headers, columnMapping);
        return mapped;
      })
      .filter((mapped) => {
        // Only include valid rows
        const fullName = buildFullName(mapped.firstName, mapped.lastName);
        return fullName && mapped.email && mapped.phone.replace(/\D/g, "").length === 10;
      });

    try {
      const res = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: mappedRows,
          mapping: columnMapping,
          sendWelcome,
          filename: csvFile?.name || "import.csv",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start import.");
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      setImportId(data.id);

      // Start polling for batch processing
      startProcessing(data.id);
    } catch {
      toast.error("Failed to start import.");
      setIsProcessing(false);
    }
  }

  function startProcessing(id: string) {
    async function processBatch() {
      try {
        const res = await fetch(`/api/admin/imports/${id}`, { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        setImportProgress(data.data);

        if (!data.hasMore) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setIsProcessing(false);
          fetchCustomers();
          fetchRecentImports();
        }
      } catch {
        // will retry on next poll
      }
    }

    // Process first batch immediately
    processBatch();
    // Then poll every 2 seconds
    pollRef.current = setInterval(processBatch, 2000);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const atLimit = company ? isAtLimit(company.plan_tier, "customers", total) : false;

  // Filter recent imports to last 30 days
  const recentImportsFiltered = recentImports.filter((imp) => {
    const created = new Date(imp.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created >= thirtyDaysAgo;
  });

  return (
    <div className="space-y-6">
      {useSample && <SampleDataBanner />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">{total} total customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { resetImportWizard(); setImportOpen(true); }}>
            <Upload className="mr-2 h-4 w-4" /> Import Customers
          </Button>
          <Button onClick={() => setAddOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <UserPlus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {atLimit && <UpgradeCTA message="You've reached your customer limit. Upgrade to add more." />}

      {/* Post-Import Card */}
      {recentImportsFiltered.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentImportsFiltered.slice(0, 3).map((imp) => (
                <div key={imp.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {imp.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {imp.status === "processing" && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
                      {imp.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                      {imp.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="font-medium">{imp.original_filename || "Import"}</span>
                    </div>
                    <span className="text-muted-foreground">{relativeTime(imp.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-green-600">{imp.created_count} created</span>
                    {imp.skipped_count > 0 && <span className="text-amber-600">{imp.skipped_count} skipped</span>}
                    {imp.error_count > 0 && <span className="text-red-600">{imp.error_count} errors</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  Customer {sortCol === "full_name" && (sortAsc ? "\u2191" : "\u2193")}
                </th>
                <th className="p-3 hidden md:table-cell">Email</th>
                <th className="p-3 cursor-pointer hover:text-foreground text-right" onClick={() => toggleSort("total_points")}>
                  Points {sortCol === "total_points" && (sortAsc ? "\u2191" : "\u2193")}
                </th>
                <th className="p-3 text-center">Tier</th>
                <th className="p-3 hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => toggleSort("created_at")}>
                  Joined {sortCol === "created_at" && (sortAsc ? "\u2191" : "\u2193")}
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
                    <tr key={c.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/admin/customers/${c.id}`)}>
                      <td className="p-3 font-bold">
                        {sortCol === "total_points" && !sortAsc && rank < 3
                          ? <span className="text-lg">{MEDALS[rank]}</span>
                          : <span className="text-muted-foreground">{rank + 1}</span>}
                      </td>
                      <td className="p-3 font-medium">{c.full_name}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {c.email}
                        <EmailStatusIcon status={c.email_status} />
                      </td>
                      <td className="p-3 text-right font-semibold tabular-nums">{c.total_points.toLocaleString()}</td>
                      <td className="p-3 text-center"><TierBadge tier={c.tier as LoyaltyTier} /></td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{relativeTime(c.created_at)}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Customer actions"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/customers/${c.id}`)}>View Profile</DropdownMenuItem>
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
            <Button variant="outline" size="sm" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" aria-label="Next page" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
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


      {/* Import Wizard Modal */}
      <Dialog open={importOpen} onOpenChange={(open) => {
        if (!open && isProcessing) return; // Prevent closing during processing
        setImportOpen(open);
        if (!open) resetImportWizard();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Import Customers
              {importStep <= 4 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  Step {importStep} of 4
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {importStep === 1 && "Upload a CSV file with your customer data."}
              {importStep === 2 && "Review validation results before importing."}
              {importStep === 3 && "Configure email settings for imported customers."}
              {importStep === 4 && "Confirm and start the import."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Upload & Map */}
          {importStep === 1 && (
            <div className="space-y-4">
              {!parseResult ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById("csv-input")?.click()}
                >
                  <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .csv files</p>
                  <input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{csvFile?.name}</span>
                      <Badge variant="secondary">{parseResult.rows.length} rows</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setCsvFile(null); setParseResult(null); setColumnMapping({}); }}>
                      Change file
                    </Button>
                  </div>

                  {parseResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                      <p className="font-medium">Parse warnings:</p>
                      {parseResult.errors.slice(0, 3).map((err, i) => <p key={i}>{err}</p>)}
                    </div>
                  )}

                  {/* Column Mapping */}
                  <div>
                    <Label className="text-sm font-medium">Column Mapping</Label>
                    <p className="text-xs text-muted-foreground mb-2">Map your CSV columns to customer fields.</p>
                    <div className="grid gap-2">
                      {parseResult.headers.map((header, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm w-40 truncate font-mono">{header}</span>
                          <span className="text-muted-foreground">&rarr;</span>
                          <Select
                            value={columnMapping[index] || "skip"}
                            onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [index]: v as MappableField }))}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MAPPABLE_FIELDS.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview first 5 rows */}
                  <div>
                    <Label className="text-sm font-medium">Preview (first 5 rows)</Label>
                    <div className="mt-2 overflow-x-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            {parseResult.headers.map((h, i) => (
                              <th key={i} className="p-2 text-left font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.rows.slice(0, 5).map((row, ri) => (
                            <tr key={ri} className="border-b last:border-0">
                              {parseResult.headers.map((h, ci) => (
                                <td key={ci} className="p-2 truncate max-w-[150px]">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Review */}
          {importStep === 2 && validationSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{validationSummary.valid}</p>
                  <p className="text-xs text-green-600">Valid</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{validationSummary.invalid.length}</p>
                  <p className="text-xs text-amber-600">Invalid</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{validationSummary.duplicates}</p>
                  <p className="text-xs text-blue-600">In-file Duplicates</p>
                </div>
              </div>

              {validationSummary.invalid.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-amber-50 px-3 py-2 border-b flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-800">
                      Issues found ({validationSummary.invalid.length} rows)
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {validationSummary.invalid.slice(0, 20).map((inv, i) => (
                      <div key={i} className="px-3 py-2 border-b last:border-0 text-sm flex items-start gap-2">
                        <span className="text-muted-foreground font-mono">Row {inv.row}</span>
                        <span className="text-red-600">{inv.errors.join(", ")}</span>
                      </div>
                    ))}
                    {validationSummary.invalid.length > 20 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        ...and {validationSummary.invalid.length - 20} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {validationSummary.valid === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="font-medium text-red-800">No valid rows to import</p>
                  <p className="text-sm text-red-600">Please check your CSV and column mapping.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Email Settings */}
          {importStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Send welcome email to imported customers</p>
                  <p className="text-sm text-muted-foreground">
                    New customers will receive a welcome email with their dashboard link.
                  </p>
                </div>
                <Switch checked={sendWelcome} onCheckedChange={setSendWelcome} />
              </div>

              {sendWelcome && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-800">
                      Emails are sent at ~50/hour to maintain deliverability
                    </span>
                  </div>
                  {validationSummary && validationSummary.valid > 50 && (
                    <p className="text-sm text-blue-700">
                      Estimated time: ~{Math.ceil(validationSummary.valid / 50)} hours for all welcome emails
                    </p>
                  )}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  Imported customers will receive your drip sequence emails based on your current automation settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Confirm & Import */}
          {importStep === 4 && (
            <div className="space-y-4">
              {!importId ? (
                <>
                  {/* Summary before starting */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-medium">Import Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">File:</span>
                      <span>{csvFile?.name}</span>
                      <span className="text-muted-foreground">Customers to import:</span>
                      <span className="font-medium text-green-600">{validationSummary?.valid ?? 0}</span>
                      <span className="text-muted-foreground">Will be skipped:</span>
                      <span className="text-amber-600">
                        {(validationSummary?.invalid.length ?? 0) + (validationSummary?.duplicates ?? 0)}
                      </span>
                      <span className="text-muted-foreground">Welcome emails:</span>
                      <span>{sendWelcome ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Progress during import */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {importProgress?.status === "completed" ? "Import complete!" : "Importing..."}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {importProgress?.processed_rows ?? 0} / {importProgress?.total_rows ?? 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        importProgress?.total_rows
                          ? (importProgress.processed_rows / importProgress.total_rows) * 100
                          : 0
                      }
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xl font-bold text-green-700">{importProgress?.created_count ?? 0}</p>
                        <p className="text-xs text-green-600">Created</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-xl font-bold text-amber-700">{importProgress?.skipped_count ?? 0}</p>
                        <p className="text-xs text-amber-600">Skipped</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-xl font-bold text-red-700">{importProgress?.error_count ?? 0}</p>
                        <p className="text-xs text-red-600">Errors</p>
                      </div>
                    </div>

                    {importProgress?.status === "completed" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="font-medium text-green-800">
                          Successfully imported {importProgress.created_count} customers!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === 1 && (
              <>
                <Button variant="outline" onClick={() => { setImportOpen(false); resetImportWizard(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={runValidation}
                  disabled={!parseResult || parseResult.rows.length === 0}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Next: Review
                </Button>
              </>
            )}
            {importStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setImportStep(1)}>Back</Button>
                <Button
                  onClick={() => setImportStep(3)}
                  disabled={!validationSummary || validationSummary.valid === 0}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Continue with {validationSummary?.valid ?? 0} valid rows
                </Button>
              </>
            )}
            {importStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setImportStep(2)}>Back</Button>
                <Button onClick={() => setImportStep(4)} className="bg-teal-600 hover:bg-teal-700">
                  Next: Confirm
                </Button>
              </>
            )}
            {importStep === 4 && (
              <>
                {!importId && (
                  <>
                    <Button variant="outline" onClick={() => setImportStep(3)} disabled={isProcessing}>
                      Back
                    </Button>
                    <Button
                      onClick={handleStartImport}
                      disabled={isProcessing}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {isProcessing ? "Starting..." : "Start Import"}
                    </Button>
                  </>
                )}
                {importId && importProgress?.status === "completed" && (
                  <Button onClick={() => { setImportOpen(false); resetImportWizard(); }} className="bg-teal-600 hover:bg-teal-700">
                    Done
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
