"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";
import type { Company, PlanTier } from "@/lib/types";

const PAGE_SIZE = 20;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  growth: "bg-teal-100 text-teal-700",
  pro: "bg-amber-100 text-amber-700",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<(Company & { user_count?: number; referral_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [detail, setDetail] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase.from("companies")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterPlan !== "all") query = query.eq("plan", filterPlan);
    if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);

    const { data, count } = await query;
    const comps = (data ?? []) as Company[];

    // Enrich with counts
    const enriched = await Promise.all(comps.map(async (c) => {
      const { count: uc } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", c.id);
      const { count: rc } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("company_id", c.id);
      return { ...c, user_count: uc ?? 0, referral_count: rc ?? 0 };
    }));

    setCompanies(enriched);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, filterPlan, search]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function updatePlan(id: string, plan: PlanTier) {
    const supabase = createClient();
    await supabase.from("companies").update({ plan }).eq("id", id);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, plan } : c));
    toast.success("Plan updated.");
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-muted-foreground">{total} companies</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search companies..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={filterPlan} onValueChange={v => { setFilterPlan(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">Company</th>
                <th className="p-3 font-medium text-muted-foreground">Slug</th>
                <th className="p-3 font-medium text-muted-foreground">Plan</th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Users</th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Referrals</th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-3"><div className="h-10 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : companies.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No companies found.</td></tr>
              ) : (
                companies.map(c => (
                  <tr key={c.id} className="border-b cursor-pointer hover:bg-muted/30" onClick={() => setDetail(c)}>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.slug}</td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <Select value={c.plan} onValueChange={v => updatePlan(c.id, v as PlanTier)}>
                        <SelectTrigger className="h-7 text-xs w-[100px]">
                          <Badge className={`${PLAN_COLORS[c.plan]} border-0 text-xs`}>{c.plan}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 hidden sm:table-cell">{c.user_count}</td>
                    <td className="p-3 hidden sm:table-cell">{c.referral_count}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{relativeTime(c.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {detail.id}</p>
                <p><strong>Slug:</strong> {detail.slug}</p>
                <p><strong>Plan:</strong> {detail.plan}</p>
                <p><strong>Created:</strong> {new Date(detail.created_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
