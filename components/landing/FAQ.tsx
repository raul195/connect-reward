"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FadeIn } from "./FadeIn";

const faqs = [
  {
    question: "How does Connect Reward work?",
    answer:
      "It's simple: after you complete a job, add your customer to Connect Reward. They get access to a portal where they can submit referrals and earn points. When their referrals become your customers, they redeem points for rewards. You get new business, they get rewarded — everyone wins.",
  },
  {
    question: "How long does it take to set up?",
    answer:
      "It depends on how many customers you have, but it should take 1-2 business days to get fully up and running.",
  },
  {
    question: "What does it cost?",
    answer:
      "We're currently in early access and finalizing pricing. Request access to be the first to know when we launch and lock in early adopter rates.",
  },
  {
    question: "What industries does Connect Reward support?",
    answer:
      "Connect Reward is built for home service contractors — solar, roofing, HVAC, windows, turf, pest control, and more. If your business relies on referrals, it's built for you.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-semibold text-[#1A202C] pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#64748B] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[#64748B] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            Got questions? We&apos;ve got answers.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-12 rounded-2xl border border-gray-100 bg-white px-6 shadow-sm">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
