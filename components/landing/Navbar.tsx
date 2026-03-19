"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ChevronDown, Menu, X } from "lucide-react";
import { INDUSTRY_NAV_LIST } from "@/lib/industry-pages";

function IndustriesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C]"
      >
        Industries
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
          <div className="w-52 rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
            {INDUSTRY_NAV_LIST.map((ind) => (
              <Link
                key={ind.slug}
                href={`/${ind.slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
              >
                {ind.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C]"
          >
            How It Works
          </Link>
          <IndustriesDropdown />
          <Link
            href="/faq"
            className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C]"
          >
            FAQ
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C]"
          >
            Blog
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#1A202C]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
          >
            Sign Up Free
          </Link>
        </div>

        {/* Mobile nav toggle + CTA */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
          >
            Sign Up Free
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-[#64748B]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 sm:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href="/how-it-works"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
            >
              How It Works
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
            >
              FAQ
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
            >
              Blog
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
            >
              Log in
            </Link>
            <div className="mt-1 border-t border-gray-100 pt-2">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Industries
              </p>
              {INDUSTRY_NAV_LIST.map((ind) => (
                <Link
                  key={ind.slug}
                  href={`/${ind.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1A202C]"
                >
                  {ind.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
