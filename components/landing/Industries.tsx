"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";

const industries = [
  { name: "Solar", slug: "solar" },
  { name: "Roofing", slug: "roofing" },
  { name: "HVAC", slug: "hvac" },
  { name: "Windows", slug: "windows" },
  { name: "Turf", slug: "turf" },
  { name: "Pest Control", slug: "pest-control" },
];

export function Industries() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            Built for Home Services
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            Trusted by businesses across industries
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {industries.map((ind) => (
              <Link
                key={ind.slug}
                href={`/industries/${ind.slug}`}
                className="rounded-full bg-[#F1F5F9] px-6 py-3 font-medium text-[#475569] transition-colors hover:bg-[#E2E8F0]"
              >
                {ind.name}
              </Link>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
