"use client";

import { useEffect, useState } from "react";
import type { Profile, Company } from "@/lib/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
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
        setCompany(data.company as Company | null);
      } catch {
        // Network error
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  return { profile, company, loading };
}
