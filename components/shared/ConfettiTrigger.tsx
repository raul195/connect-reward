"use client";

import { useCallback } from "react";

interface ConfettiTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function ConfettiTrigger({ children, className }: ConfettiTriggerProps) {
  const fire = useCallback(() => {
    import("canvas-confetti").then(mod => {
      mod.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6"],
      });
    });
  }, []);

  return (
    <div onClick={fire} className={className} role="button" tabIndex={0}>
      {children}
    </div>
  );
}
