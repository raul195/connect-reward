"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
import type { Profile } from "@/lib/types";

const PAGE_SIZE = 20;

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-green-100 text-green-700",
  contractor: "bg-blue-100 text-blue-700",
  super_admin: "bg-red-100 text-red-700",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-700",
  silver: "bg-gray-100 text-gray-700",
  gold: "bg-amber-100 text-amber-700",
  platinum: "bg-violet-100 text-violet-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<(Profile & { company_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [detail, setDetail] = useState<(Profile & { company_name?: string }) | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase.from("profiles")
      .select("*, companies(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterRole !== "all") query = query.eq("role", filterRole);
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, count } = await query;
    const mapped = (data ?? []).map((u) => {
      const companies = u.companies as unknown as { name: string }[] | { name: string } | null;
      const company_name = Array.isArray(companies) ? companies[0]?.name : companies?.name;
      return { ...u, company_name: company_name || "—" } as Profile & { company_name?: string };
    });

    setUsers(mapped);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, filterRole, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">{total} users</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={filterRole} onValueChange={v => { setFilterRole(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium text-muted-foreground">Name</th>
                <th className="p-3 font-medium text-muted-foreground">Email</th>
                <th className="p-3 font-medium text-muted-foreground">Role</th>
                <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Company</th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Tier</th>
                <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Points</th>
                <th className="p-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b cursor-pointer hover:bg-muted/30" onClick={() => setDetail(u)}>
                    <td className="p-3 font-medium">{u.full_name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <Badge className={`${ROLE_COLORS[u.role] || ROLE_COLORS.customer} border-0 text-xs`}>{u.role}</Badge>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{u.company_name}</td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge className={`${TIER_COLORS[u.loyalty_tier] || TIER_COLORS.bronze} border-0 text-xs`}>{u.loyalty_tier}</Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell font-medium">{u.total_points.toLocaleString()}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">{relativeTime(u.created_at)}</td>
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
              <DialogHeader><DialogTitle>{detail.full_name}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {detail.id}</p>
                <p><strong>Email:</strong> {detail.email}</p>
                <p><strong>Phone:</strong> {detail.phone || "—"}</p>
                <p><strong>Role:</strong> {detail.role}</p>
                <p><strong>Company:</strong> {detail.company_name}</p>
                <p><strong>Tier:</strong> {detail.loyalty_tier}</p>
                <p><strong>Points:</strong> {detail.total_points.toLocaleString()}</p>
                <p><strong>Joined:</strong> {new Date(detail.created_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
