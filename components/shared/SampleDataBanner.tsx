"use client";

import { useProfile } from "@/hooks/useProfile";
import { isDemoAccount } from "@/lib/demo";

export function SampleDataBanner() {
  const { profile } = useProfile();

  if (!profile || isDemoAccount(profile.email)) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-blue-500 px-4 py-2 text-sm font-medium text-white">
      <span>
        You&apos;re viewing sample data &mdash; start adding referrals to see
        your real dashboard!
      </span>
    </div>
  );
}
