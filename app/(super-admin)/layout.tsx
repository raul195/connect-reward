"use client";

import { Sidebar, type NavItem } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useProfile } from "@/hooks/useProfile";

const superAdminNav: NavItem[] = [
  {
    label: "Overview",
    href: "/super-admin",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    ),
  },
  {
    label: "Applications",
    href: "/super-admin/applications",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
    ),
  },
  {
    label: "Companies",
    href: "/super-admin/companies",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
    ),
  },
  {
    label: "Users",
    href: "/super-admin/users",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
    ),
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useProfile();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={superAdminNav} brandLabel="CR Admin" />
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
