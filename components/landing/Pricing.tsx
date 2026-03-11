"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "./FadeIn";

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  href: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    features: [
      "50 customers",
      "25 referrals",
      "3 rewards & 3 services",
      "1 team member",
      "Basic analytics",
      "Referral tracking",
      '"Powered by Connect Reward" branding',
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/early-access?plan=free",
  },
  {
    name: "Beta",
    price: "$99",
    period: "/mo",
    features: [
      "200 customers",
      "200 referrals",
      "10 rewards & 10 services",
      "5 team members",
      "Full analytics & reports",
      "Email automation",
      "Custom branding",
      "Priority support",
    ],
    cta: "Join Beta",
    highlighted: true,
    href: "/early-access?plan=beta",
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
            Start free, upgrade when you&apos;re ready
          </p>
        </FadeIn>

        <div className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-2">
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
                    Best Value
                  </span>
                )}

                <h3 className="text-lg font-bold text-[#1A202C]">
                  {plan.name}
                </h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1A202C]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-lg text-[#64748B]">{plan.period}</span>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
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
