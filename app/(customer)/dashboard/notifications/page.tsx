"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/relative-time";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ClipboardList, Star, Trophy, Gift, Megaphone } from "lucide-react";
import type { Notification, NotificationType } from "@/lib/types";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  referral_update: { icon: ClipboardList, color: "text-blue-600 bg-blue-100" },
  reward_earned: { icon: Star, color: "text-amber-600 bg-amber-100" },
  achievement: { icon: Trophy, color: "text-purple-600 bg-purple-100" },
  system: { icon: Megaphone, color: "text-gray-600 bg-gray-100" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setNotifications(data as Notification[]);
    setLoading(false);

    // Subscribe to realtime inserts
    supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllAsRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("profile_id", user.id)
      .eq("read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-teal-600">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-bold">You&apos;re all caught up!</h3>
            <p className="text-muted-foreground">No new notifications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50 ${
                  !n.read ? "bg-teal-50/50 border-teal-200" : ""
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-bold" : "font-medium"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{relativeTime(n.created_at)}</p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
