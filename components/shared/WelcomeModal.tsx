"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Send, Gift, Trophy, Star } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  companyName: string;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Send,
    title: "Submit Referrals",
    description: "Know someone who could use our services? Submit their name and contact info through your dashboard. It takes less than a minute.",
    color: "bg-teal-100 text-teal-600",
  },
  {
    icon: Star,
    title: "Earn Points",
    description: "When your referral becomes a customer, you earn points automatically. You also earn points for leaving reviews.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Gift,
    title: "Redeem Rewards",
    description: "Use your points to claim gift cards, prizes, and rewards from the catalog. The more you refer, the more you earn.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Trophy,
    title: "Level Up",
    description: "Climb the leaderboard, earn achievement badges, and advance through tiers — Bronze, Silver, Gold, and Platinum.",
    color: "bg-blue-100 text-blue-600",
  },
];

export function WelcomeModal({ open, companyName, onDismiss }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDismiss(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Welcome to {companyName}&apos;s Rewards Program!
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-muted-foreground">
          Here&apos;s how you can earn rewards by referring friends and family.
        </p>

        <div className="mt-4 space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={onDismiss} className="bg-teal-600 hover:bg-teal-700 px-8">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
