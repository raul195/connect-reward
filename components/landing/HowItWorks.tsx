"use client";

import { Users, Gift, TrendingUp } from "lucide-react";
import { FadeIn } from "./FadeIn";

const steps = [
  {
    icon: Users,
    step: 1,
    title: "Invite Customers",
    desc: "Add customers after completing their job",
  },
  {
    icon: Gift,
    step: 2,
    title: "They Refer Friends",
    desc: "Customers submit referrals through their dashboard",
  },
  {
    icon: TrendingUp,
    step: 3,
    title: "Everyone Wins",
    desc: "You get leads, they get rewards",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            Three simple steps to grow your business
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <FadeIn key={s.step} delay={i * 0.1}>
              <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-md">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D9488]">
                  <s.icon className="h-7 w-7 text-white" />
                </span>
                <span className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F59E0B] text-sm font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#1A202C]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[#64748B]">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
