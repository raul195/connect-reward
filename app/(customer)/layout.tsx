"use client";

import { Sidebar, type NavItem } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard,
  Send,
  Users,
  Gift,
  Trophy,
  Gem,
  Star,
  Bell,
  User,
  BarChart3,
} from "lucide-react";

const customerNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Submit Referral",
    href: "/dashboard/refer",
    icon: <Send className="h-5 w-5" />,
  },
  {
    label: "My Referrals",
    href: "/dashboard/referrals",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Rewards",
    href: "/dashboard/rewards",
    icon: <Gift className="h-5 w-5" />,
  },
  {
    label: "Reviews",
    href: "/dashboard/reviews",
    icon: <Star className="h-5 w-5" />,
  },
  {
    label: "Achievements",
    href: "/dashboard/achievements",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    label: "Leaderboard",
    href: "/dashboard/leaderboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Points History",
    href: "/dashboard/points",
    icon: <Gem className="h-5 w-5" />,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <User className="h-5 w-5" />,
  },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useProfile();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={customerNav} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          fullName={profile?.full_name}
          email={profile?.email}
          totalPoints={profile?.total_points}
          avatarUrl={profile?.avatar_url}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
      </div>
    </div>
  );
}
