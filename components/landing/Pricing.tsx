"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "./FadeIn";

interface PricingPlan {
  name: string;
  price: string;
  includesFrom?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  href: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "Free",
    features: [
      "100 customers max",
      "Referral tracking",
      "Earn points (cannot redeem)",
      "Tier 1 only",
      "1 service type",
      "Basic analytics",
      '"Powered by Connect Reward" branding',
      "Community support",
    ],
    cta: "Join Waitlist",
    href: "/early-access?plan=free",
  },
  {
    name: "Starter",
    price: "Coming Soon",
    includesFrom: "Free",
    features: [
      "Full reward redemption",
      "Tiers 1-3",
      "3 service types",
      "Standard analytics",
      "Automated email notifications",
      "Review tracking",
      "Customer leaderboard",
      "Add your logo",
      "3 team members",
      "Email support",
    ],
    cta: "Request Access",
    highlighted: true,
    href: "/early-access?plan=starter",
  },
  {
    name: "Growth",
    price: "Coming Soon",
    includesFrom: "Starter",
    features: [
      "All tiers available",
      "10 service types",
      "Advanced analytics",
      "Full custom branding",
      "10 team members",
      "Read-only API access",
      "1:1 onboarding call",
      "Priority support",
    ],
    cta: "Request Access",
    href: "/early-access?plan=growth",
  },
  {
    name: "Pro",
    price: "Coming Soon",
    includesFrom: "Growth",
    features: [
      "Unlimited service types",
      "Advanced analytics + export",
      "Priority notifications + SMS",
      "White-label (no Connect Reward branding)",
      "Unlimited team members",
      "Full API access",
      "Dedicated onboarding rep",
      "Dedicated support",
    ],
    cta: "Request Access",
    href: "/early-access?plan=pro",
  },
];

export function Pricing() {
  return (
    <section className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <p className="mb-3 text-sm font-semibold text-[#0D9488]">
            Now accepting early access applications
          </p>
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            Start free, scale as you grow
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md ${
                  plan.highlighted
                    ? "border-2 border-[#0D9488] shadow-lg"
                    : "border border-gray-100"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0D9488] px-4 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}

                <h3 className="text-lg font-bold text-[#1A202C]">
                  {plan.name}
                </h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`font-extrabold text-[#1A202C] ${plan.price === "Coming Soon" ? "text-2xl" : "text-4xl"}`}>
                    {plan.price}
                  </span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.includesFrom && (
                    <li className="text-sm italic text-[#94A3B8] pb-1">
                      Everything in {plan.includesFrom}, plus:
                    </li>
                  )}
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0D9488]" />
                      <span className="text-[#475569]">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white shadow-sm hover:brightness-110"
                      : "border border-gray-300 text-[#1A202C] hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
