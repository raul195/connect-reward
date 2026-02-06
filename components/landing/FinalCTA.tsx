"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

export function FinalCTA() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            Ready to Grow Your Business?
          </h2>
          <p className="mt-4 text-lg text-[#64748B]">
            Be one of the first contractors to transform your referral program. Limited early access spots available.
          </p>
          <div className="mt-8">
            <Link
              href="/early-access"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:brightness-110"
            >
              Apply for Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
