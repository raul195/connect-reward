import { cn } from "@/lib/utils";
import type { ReferralStatus } from "@/lib/types";

const statusConfig: Record<ReferralStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  contacted: {
    label: "Contacted",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  quoted: {
    label: "Quoted",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  won: {
    label: "Won",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  lost: {
    label: "Lost",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  expired: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  },
};

interface StatusBadgeProps {
  status: ReferralStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
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
