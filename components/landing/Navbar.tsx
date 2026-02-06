import Link from "next/link";
import { Sparkles } from "lucide-react";

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
