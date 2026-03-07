"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isDemoAccount } from "@/lib/demo";

export function DemoModeBanner() {
  const { profile } = useProfile();
  const [resetting, setResetting] = useState(false);

  if (!isDemoAccount(profile?.email)) return null;

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Reset failed");
        setResetting(false);
        return;
      }
      window.location.href = "/login";
    } catch {
      alert("Reset failed — check your connection.");
      setResetting(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-yellow-400 px-4 py-2 text-sm font-medium text-yellow-900">
      <span>Demo Mode — This account uses sample data</span>
      <button
        onClick={handleReset}
        disabled={resetting}
        className="rounded bg-yellow-900 px-3 py-1 text-xs font-semibold text-yellow-100 transition hover:bg-yellow-800 disabled:opacity-50"
      >
        {resetting ? "Resetting…" : "Reset Demo Data"}
      </button>
    </div>
  );
}
