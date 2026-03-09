import type { AutomationTriggerType } from "@/lib/types";

/**
 * Single source of truth for drip-sequence defaults, min/max constraints,
 * and helpers shared by the cron, API, and UI.
 */

export interface DripConfig {
  field: "delay_days" | "condition_threshold";
  defaultValue: number;
  min: number;
  max: number;
  unit: string;
  label: string;
}

export const DRIP_DEFAULTS: Partial<Record<AutomationTriggerType, DripConfig>> = {
  inactivity_30: {
    field: "delay_days",
    defaultValue: 30,
    min: 14,
    max: 90,
    unit: "days",
    label: "Days of inactivity",
  },
  inactivity_60: {
    field: "delay_days",
    defaultValue: 60,
    min: 31,
    max: 180,
    unit: "days",
    label: "Days of inactivity",
  },
  points_close_to_reward: {
    field: "condition_threshold",
    defaultValue: 200,
    min: 100,
    max: 1000,
    unit: "points",
    label: "Points threshold",
  },
  referral_nudge: {
    field: "delay_days",
    defaultValue: 14,
    min: 3,
    max: 30,
    unit: "days",
    label: "Days pending",
  },
  program_reminder: {
    field: "delay_days",
    defaultValue: 30,
    min: 14,
    max: 180,
    unit: "days",
    label: "Reminder interval",
  },
};

/**
 * Read the effective drip value for a trigger from its condition_data,
 * falling back to the compiled default when condition_data is empty or
 * missing the expected key.
 */
export function getDripValue(
  triggerType: AutomationTriggerType | string,
  conditionData: Record<string, unknown>
): number {
  const config = DRIP_DEFAULTS[triggerType as AutomationTriggerType];
  if (!config) return 0; // event-driven triggers (milestone_reached)

  const raw = conditionData[config.field];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return config.defaultValue;
}

/**
 * Returns true when the stored condition_data differs from the compiled default.
 */
export function isCustomized(
  triggerType: AutomationTriggerType | string,
  conditionData: Record<string, unknown>
): boolean {
  const config = DRIP_DEFAULTS[triggerType as AutomationTriggerType];
  if (!config) return false;

  const raw = conditionData[config.field];
  if (typeof raw !== "number") return false;
  return raw !== config.defaultValue;
}
