"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function FreePlanBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <p className="text-sm text-amber-800">
        You&apos;re on the <span className="font-semibold">Free plan</span>. Upgrade to Starter to unlock email automation and more.
      </p>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white h-7 text-xs">
          <Link href="/admin/billing">Upgrade</Link>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
