"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";

export function useCompany(companyId: string | null | undefined) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchCompany() {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      setCompany(data as Company | null);
      setLoading(false);
    }

    fetchCompany();
  }, [companyId]);

  return { company, loading };
}
