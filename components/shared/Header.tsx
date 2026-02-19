"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dynamically import UserMenu with ssr: false to avoid hydration mismatch
// from Radix DropdownMenu component generating different IDs on server vs client
const UserMenu = dynamic(
  () => import("./UserMenu").then((mod) => mod.UserMenu),
  {
    ssr: false,
    loading: () => (
      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            ...
          </AvatarFallback>
        </Avatar>
      </Button>
    ),
  }
);

interface HeaderProps {
  fullName?: string;
  email?: string;
  totalPoints?: number;
  avatarUrl?: string | null;
}

export function Header({
  fullName = "User",
  email = "",
  totalPoints = 0,
  avatarUrl,
}: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Left: spacer for mobile hamburger */}
      <div className="w-10 md:w-0" />

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Points pill — only shown for customers who have points */}
        {totalPoints != null && totalPoints > 0 && (
          <Badge variant="secondary" className="hidden sm:flex gap-1 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12l4 6-10 13L2 9Z" />
            </svg>
            {totalPoints.toLocaleString()} pts
          </Badge>
        )}

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User dropdown */}
        <UserMenu fullName={fullName} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
