import Link from "next/link";
import { Sparkles, ChevronDown } from "lucide-react";
import { INDUSTRY_NAV_LIST } from "@/lib/industry-pages";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D9488]">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-bold text-[#1A202C]">
            Connect Reward
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/how-it-works"
            className="hidden text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C] sm:inline-block"
          >
            How It Works
          </Link>

          {/* Industries dropdown */}
          <div className="relative hidden sm:block group">
            <span className="flex cursor-default items-center gap-1 text-sm font-medium text-[#64748B] transition-colors group-hover:text-[#1A202C]">
              Industries
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
              <div className="w-52 rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                {INDUSTRY_NAV_LIST.map((ind) => (
                  <Link
                    key={ind.slug}
                    href={`/${ind.slug}`}
                    className="block px-4 py-2 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
                  >
                    {ind.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/faq"
            className="hidden text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C] sm:inline-block"
          >
            FAQ
          </Link>
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C] sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/early-access"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
          >
            Request Access
          </Link>
        </div>
      </div>
    </header>
  );
}
