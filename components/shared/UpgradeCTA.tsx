import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeCTAProps {
  message?: string;
  className?: string;
}

export function UpgradeCTA({
  message = "Upgrade your plan to unlock more features",
  className,
}: UpgradeCTAProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-600 dark:text-amber-400 shrink-0"
        >
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {message}
        </p>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50">
        <Link href="/admin/settings">Upgrade</Link>
      </Button>
    </div>
  );
}
