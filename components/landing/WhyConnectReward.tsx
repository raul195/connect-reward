"use client";

import {
  ClipboardList,
  Trophy,
  Settings,
  Users,
  Gift,
  LineChart,
} from "lucide-react";
import { FadeIn } from "./FadeIn";

const features = [
  {
    icon: ClipboardList,
    title: "Automated Referral Tracking",
    description:
      "Track every referral from submission to installation. No more spreadsheets or lost leads.",
  },
  {
    icon: Trophy,
    title: "Gamified Rewards System",
    description:
      "Points, tiers, achievements, and leaderboards keep customers engaged and referring.",
  },
  {
    icon: Settings,
    title: "Custom Point Values",
    description:
      "Set different point values for each service you offer. Solar installs, add-ons, upgrades — you decide what each is worth.",
  },
  {
    icon: Users,
    title: "Customer Leaderboard",
    description:
      "Friendly competition drives more referrals. Your top advocates get recognized and rewarded.",
  },
  {
    icon: Gift,
    title: "Flexible Rewards Catalog",
    description:
      "Gift cards, experiences, electronics, travel — customize rewards your customers actually want.",
  },
  {
    icon: LineChart,
    title: "Analytics Dashboard",
    description:
      "See what's working. Track conversion rates, popular rewards, and program ROI at a glance.",
  },
];

export function WhyConnectReward() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            Why Connect Reward?
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            Everything you need to turn happy customers into your best marketing
            channel
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.08}>
              <div className="flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                  <feature.icon className="h-6 w-6 text-[#0D9488]" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#1A202C]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
