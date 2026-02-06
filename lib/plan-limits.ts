import type { PlanTier } from "./types";

export interface PlanLimits {
  maxReferrals: number;
  maxRewards: number;
  maxCustomers: number;
  customBranding: boolean;
  analytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxReferrals: 25,
    maxRewards: 3,
    maxCustomers: 50,
    customBranding: false,
    analytics: false,
    apiAccess: false,
    prioritySupport: false,
  },
  starter: {
    maxReferrals: 100,
    maxRewards: 10,
    maxCustomers: 200,
    customBranding: false,
    analytics: true,
    apiAccess: false,
    prioritySupport: false,
  },
  growth: {
    maxReferrals: 500,
    maxRewards: 25,
    maxCustomers: 1000,
    customBranding: true,
    analytics: true,
    apiAccess: true,
    prioritySupport: false,
  },
  pro: {
    maxReferrals: Infinity,
    maxRewards: Infinity,
    maxCustomers: Infinity,
    customBranding: true,
    analytics: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function isAtLimit(
  plan: PlanTier,
  resource: "referrals" | "rewards" | "customers",
  currentCount: number
): boolean {
  const limits = PLAN_LIMITS[plan];
  const mapping = {
    referrals: limits.maxReferrals,
    rewards: limits.maxRewards,
    customers: limits.maxCustomers,
  };
  return currentCount >= mapping[resource];
}
