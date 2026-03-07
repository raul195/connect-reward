"use client";

import { useEffect, useState } from "react";
import type { Company } from "@/lib/types";

export function useCompany(companyId: string | null | undefined) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    async function fetchCompany() {
      try {
        const res = await fetch("/api/company");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCompany(data.company as Company | null);
      } catch {
        // Network error
      }
      setLoading(false);
    }

    fetchCompany();
  }, [companyId]);

  return { company, loading };
}
