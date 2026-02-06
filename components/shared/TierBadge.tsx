import { cn } from "@/lib/utils";
import type { LoyaltyTier } from "@/lib/types";

const tierConfig: Record<LoyaltyTier, { label: string; className: string }> = {
  bronze: {
    label: "Bronze",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  silver: {
    label: "Silver",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
  },
  gold: {
    label: "Gold",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  platinum: {
    label: "Platinum",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  },
};

interface TierBadgeProps {
  tier: LoyaltyTier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const config = tierConfig[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
