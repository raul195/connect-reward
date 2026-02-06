"use client";

import { FadeIn } from "./FadeIn";

const industries = [
  "Solar",
  "Roofing",
  "HVAC",
  "Windows",
  "Turf",
  "Pest Control",
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
            Trusted by contractors across industries
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {industries.map((name) => (
              <span
                key={name}
                className="rounded-full bg-[#F1F5F9] px-6 py-3 font-medium text-[#475569] transition-colors hover:bg-[#E2E8F0]"
              >
                {name}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
