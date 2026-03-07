"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProfile(data.profile as Profile | null);
      } catch {
        // Network error
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  return { profile, loading };
}
