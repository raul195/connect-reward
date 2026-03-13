import type { PlanTier } from "./types";

export interface PlanLimits {
  maxRewards: number;
  maxCustomers: number;
  maxServices: number;
  maxTeamMembers: number;
  customBranding: boolean;
  analytics: boolean;
  reports: boolean;
  emailAutomation: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxRewards: 3,
    maxCustomers: 50,
    maxServices: 3,
    maxTeamMembers: 1,
    customBranding: false,
    analytics: true,
    reports: false,
    emailAutomation: false,
    apiAccess: false,
    prioritySupport: false,
  },
  beta: {
    maxRewards: 10,
    maxCustomers: 200,
    maxServices: 10,
    maxTeamMembers: 3,
    customBranding: true,
    analytics: true,
    reports: true,
    emailAutomation: true,
    apiAccess: true,
    prioritySupport: true,
  },
  starter: {
    maxRewards: 10,
    maxCustomers: 200,
    maxServices: 10,
    maxTeamMembers: 3,
    customBranding: true,
    analytics: true,
    reports: true,
    emailAutomation: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

/** Normalize plan tier — "beta" legacy records behave as "starter" */
export function normalizePlan(plan: string | undefined | null): PlanTier {
  if (plan === "starter" || plan === "beta") return plan as PlanTier;
  return "free";
}

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function isFreePlan(plan: string | undefined | null): boolean {
  return normalizePlan(plan) === "free";
}

export function isAtLimit(
  plan: PlanTier,
  resource: "rewards" | "customers" | "services" | "team",
  currentCount: number
): boolean {
  const limits = PLAN_LIMITS[plan];
  const mapping = {
    rewards: limits.maxRewards,
    customers: limits.maxCustomers,
    services: limits.maxServices,
    team: limits.maxTeamMembers,
  };
  return currentCount >= mapping[resource];
}
