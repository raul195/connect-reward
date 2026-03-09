import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutomationTriggerType, TonePreference } from "@/lib/types";
import { TEMPLATE_LIBRARY, type TemplateContent } from "./templateLibrary";

interface SelectTemplateResult {
  template: TemplateContent;
  variationIndex: number;
  tone: TonePreference;
}

/**
 * Select a template variation for a given trigger type and tone,
 * rotating through variations 0 → 1 → 2 → 0 per customer+trigger.
 *
 * Checks custom_templates first (per-company overrides), falls back
 * to the default TEMPLATE_LIBRARY.
 */
export async function selectTemplate(
  triggerType: AutomationTriggerType,
  tonePreference: TonePreference,
  customerId: string,
  adminClient: SupabaseClient,
  companyId?: string
): Promise<SelectTemplateResult> {
  // Find the last variation_index used for this customer + trigger
  const { data: lastDraft } = await adminClient
    .from("email_draft_queue")
    .select("email_data")
    .eq("customer_id", customerId)
    .eq("trigger_type", triggerType)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let variationIndex = 0;
  if (lastDraft?.email_data) {
    const lastIndex =
      typeof lastDraft.email_data === "object" &&
      lastDraft.email_data !== null &&
      "variation_index" in lastDraft.email_data
        ? (lastDraft.email_data as Record<string, unknown>).variation_index
        : undefined;
    if (typeof lastIndex === "number") {
      variationIndex = (lastIndex + 1) % 3;
    }
  }

  // Check for a custom template override
  if (companyId) {
    const { data: custom } = await adminClient
      .from("custom_templates")
      .select("subject, body")
      .eq("company_id", companyId)
      .eq("trigger_type", triggerType)
      .eq("tone", tonePreference)
      .eq("variation_index", variationIndex)
      .single();

    if (custom) {
      return {
        template: { subject: custom.subject, body: custom.body },
        variationIndex,
        tone: tonePreference,
      };
    }
  }

  // Fall back to default template library
  const templates = TEMPLATE_LIBRARY[triggerType][tonePreference];
  return {
    template: templates[variationIndex],
    variationIndex,
    tone: tonePreference,
  };
}
