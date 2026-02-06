"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Dynamically import MobileSidebar with ssr: false to avoid hydration mismatch
// from Radix Sheet component generating different IDs on server vs client
const MobileSidebar = dynamic(
  () => import("./MobileSidebar").then((mod) => mod.MobileSidebar),
  { ssr: false }
);

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  brandLabel?: string;
}

function NavList({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="h-5 w-5 shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ navItems, brandLabel = "Connect Reward" }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            CR
          </span>
          {brandLabel}
        </Link>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList items={navItems} pathname={pathname} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - client-only to avoid hydration mismatch */}
      <MobileSidebar navItems={navItems} pathname={pathname} />
    </>
  );
}
