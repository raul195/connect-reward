"use client";

import Link from "next/link";
import { Zap, Sparkles, Star, Check, ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

function HeroCard() {
  return (
    <div className="relative">
      {/* Subtle gradient backdrop */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100/60 blur-sm" />

      <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Sparkles className="h-5 w-5 text-[#F59E0B]" />
          </span>
          <div>
            <p className="text-sm font-medium text-[#64748B]">
              Your Rewards Balance
            </p>
            <p className="text-2xl font-bold text-[#1A202C]">2,450 pts</p>
          </div>
        </div>

        {/* Reward rows */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-teal-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#0D9488]" />
              <span className="text-sm font-medium text-[#1A202C]">
                Installation complete!
              </span>
            </div>
            <span className="text-sm font-bold text-[#0D9488]">+500 pts</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F59E0B]" />
              <span className="text-sm font-medium text-[#1A202C]">
                Milestone bonus!
              </span>
            </div>
            <span className="text-sm font-bold text-[#F59E0B]">+500 pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
          {/* Left column */}
          <FadeIn className="lg:col-span-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-[#0D9488]">
              <Zap className="h-4 w-4" />
              For Home Service Contractors
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-[#1A202C] sm:text-5xl lg:text-6xl">
              Turn Happy Customers Into Your{" "}
              <span className="text-[#F59E0B]">Best Salespeople</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#64748B]">
              Reward referrals. Grow your business. Automatically. Perfect for
              solar, roofing, HVAC, and more.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/early-access"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:brightness-110"
              >
                Request Early Access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-[#1A202C] shadow-sm transition-colors hover:bg-gray-50"
              >
                I&apos;m a Customer
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#0D9488]" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#0D9488]" />
                Limited spots available
              </span>
            </div>
          </FadeIn>

          {/* Right column */}
          <FadeIn className="lg:col-span-2" delay={0.2}>
            <HeroCard />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
