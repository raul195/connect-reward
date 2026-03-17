"use client";

import Link from "next/link";
import {
  Settings,
  Upload,
  Send,
  Award,
  ShoppingBag,
  Trophy,
  BarChart3,
  Medal,
  Layers,
  Zap,
  Eye,
  Sun,
  Home,
  Wind,
  Bug,
  PanelTop,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FadeIn } from "@/components/landing/FadeIn";

const steps = [
  {
    icon: Settings,
    title: "Set up your program",
    desc: "Choose your industry, add your services, and set your referral reward values based on your actual profit margins. Connect Reward calculates the right point values so you're always profitable on every referred job.",
  },
  {
    icon: Upload,
    title: "Invite your customers",
    desc: "Upload your existing customer list via CSV. Connect Reward sends a branded welcome email inviting them to join your rewards program.",
  },
  {
    icon: Send,
    title: "Customers start referring",
    desc: "Customers log into their portal and submit referrals directly — entering the name, contact info, and any relevant details about the person they're referring. You're notified instantly when a new referral comes in.",
  },
  {
    icon: Award,
    title: "Points are awarded automatically",
    desc: "When you approve a referral, points are added to the customer's account automatically. They get notified and can see their progress toward rewards.",
  },
  {
    icon: ShoppingBag,
    title: "Customers redeem rewards",
    desc: "Customers browse your rewards catalog and redeem points for gift cards and prizes. You're notified when a redemption is requested.",
  },
];

const gamificationFeatures = [
  {
    icon: Trophy,
    title: "Points System",
    desc: "Every approved referral earns points. Customers see their balance grow and stay motivated to keep referring.",
  },
  {
    icon: BarChart3,
    title: "Leaderboards",
    desc: "Customers see how they rank against other advocates. A little friendly competition goes a long way.",
  },
  {
    icon: Medal,
    title: "Achievement Badges",
    desc: "Milestones like 'Hat Trick' (3 referrals) and 'High Five' (5 referrals) give customers recognition they can show off.",
  },
  {
    icon: Layers,
    title: "Tiers",
    desc: "Bronze, Silver, Gold, Platinum — customers level up as they refer more, unlocking higher reward options at each tier.",
  },
  {
    icon: Zap,
    title: "Ongoing Engagement",
    desc: "Instead of a one-time cash bonus that's forgotten in a week, gamification creates an ongoing relationship with your brand.",
  },
];

const industries = [
  {
    icon: Sun,
    name: "Solar",
    slug: "solar",
    desc: "Solar installations are high-ticket, high-trust purchases. A single referral from a happy customer can be worth thousands in revenue — and neighbors talk.",
  },
  {
    icon: Home,
    name: "Roofing",
    slug: "roofing",
    desc: "Roofing is hyper-local. When one house on the block gets a new roof, the neighbors notice. A referral program turns that visibility into leads.",
  },
  {
    icon: Wind,
    name: "HVAC",
    slug: "hvac",
    desc: "HVAC customers call when something breaks — and they ask friends who they trust. Referral rewards keep your name top of mind for those moments.",
  },
  {
    icon: Bug,
    name: "Pest Control",
    slug: "pest-control",
    desc: "Pest control is recurring and reputation-driven. Happy customers who refer neighbors create clusters of business in the same area.",
  },
  {
    icon: PanelTop,
    name: "Windows",
    slug: "windows",
    desc: "Window replacement is a considered purchase. Homeowners research and ask around — a referral from a satisfied customer carries enormous weight.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Set Up a Referral Rewards Program with Connect Reward",
  description:
    "A step-by-step guide to setting up a gamified referral rewards program for your home service business using Connect Reward.",
  step: steps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.title,
    text: s.desc,
  })),
};

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h1 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl lg:text-5xl">
                How Connect Reward Works
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#64748B]">
                A simple, automated referral rewards system built for home
                service businesses. Set it up once and let your happy customers
                do the selling for you.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* The Problem */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                The Problem With Traditional Referral Bonuses
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#64748B]">
                Most home service businesses offer a one-time cash bonus for
                referrals — $50 here, $100 there. The problem is cash bonuses
                are forgettable. Customers pocket the money and move on.
                There&apos;s no reason to keep referring, no recognition for
                being a top advocate, and no ongoing relationship with your
                brand.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#64748B]">
                Connect Reward replaces the forgettable cash bonus with a
                points-based rewards program that keeps customers engaged long
                after their installation is complete.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Step by Step */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                Step by Step: How It Works for Your Business
              </h2>
              <p className="mt-3 text-lg text-[#64748B]">
                Five steps from setup to your first referred customer
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((s, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-md border border-gray-100">
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D9488]">
                      <s.icon className="h-7 w-7 text-white" />
                    </span>
                    <span className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F59E0B] text-sm font-bold text-white">
                      {i + 1}
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

        {/* Gamification */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                What Makes It Gamified
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-[#64748B]">
                Connect Reward isn&apos;t just a referral tracker — it&apos;s a
                rewards experience that keeps customers coming back
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {gamificationFeatures.map((f, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-md">
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D9488]">
                      <f.icon className="h-7 w-7 text-white" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-[#1A202C]">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-[#64748B]">{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3}>
              <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <p className="text-center text-[#64748B] leading-relaxed">
                  <span className="font-semibold text-[#1A202C]">
                    Example:
                  </span>{" "}
                  A customer who refers 3 people earns the &quot;Hat Trick&quot;
                  badge and moves up to Gold tier, unlocking higher reward
                  options like premium gift cards and exclusive prizes.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Customer Portal */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                What It Looks Like for Your Customers
              </h2>
              <div className="mt-8 space-y-4 text-lg leading-relaxed text-[#64748B]">
                <p>
                  Your customers get their own branded portal where everything
                  is at their fingertips. They log in and immediately see their
                  points balance, current tier, and how close they are to the
                  next reward.
                </p>
                <p>
                  The leaderboard shows them where they rank among your other
                  advocates — adding a layer of friendly competition that keeps
                  them engaged. They can browse the rewards catalog and see
                  exactly what they&apos;re saving toward, whether it&apos;s a
                  $25 gift card or a premium prize.
                </p>
                <p>
                  Their referral history tracks every submission, so they always
                  know the status of their referrals — pending, approved, or
                  completed. When a referral is approved and points hit their
                  account, they get an email notification celebrating the
                  milestone.
                </p>
                <p>
                  It&apos;s not just a form — it&apos;s an experience that makes
                  referring feel rewarding from start to finish.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Industries */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                Industries We Serve
              </h2>
              <p className="mt-3 text-lg text-[#64748B]">
                Built specifically for home service businesses that grow through
                referrals
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((ind, i) => (
                <FadeIn key={ind.slug} delay={i * 0.1}>
                  <Link
                    href={`/industries/${ind.slug}`}
                    className="group flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-md transition-shadow hover:shadow-lg"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D9488]">
                      <ind.icon className="h-7 w-7 text-white" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-[#1A202C]">
                      {ind.name}
                    </h3>
                    <p className="mt-2 text-[#64748B]">{ind.desc}</p>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                Ready to turn your customers into your sales team?
              </h2>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:brightness-110"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              <p className="mt-6 text-[#64748B]">
                Have more questions?{" "}
                <Link
                  href="/faq"
                  className="font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors"
                >
                  Visit our FAQ page
                </Link>
                .
              </p>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
