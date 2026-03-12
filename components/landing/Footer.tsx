import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1E293B]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D9488]">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold text-gray-200">
            Connect Reward
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Terms of Service
          </Link>
        </div>
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Connect Reward. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
