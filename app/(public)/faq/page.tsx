"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FadeIn } from "@/components/landing/FadeIn";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "What is Connect Reward?",
        answer:
          "Connect Reward is a gamified referral rewards platform built for home service businesses. Instead of one-time cash bonuses, it gives your customers a points-based rewards program with leaderboards, badges, and a digital rewards catalog — creating an ongoing referral engine for your business.",
      },
      {
        question: "What kinds of businesses is Connect Reward for?",
        answer:
          "Connect Reward is built for home service businesses including solar installation companies, roofing contractors, HVAC companies, pest control businesses, and window replacement companies.",
      },
      {
        question: "How long does it take to set up?",
        answer:
          "Most businesses complete setup in under 15 minutes. The onboarding wizard walks you through your services, reward values, and program configuration step by step.",
      },
      {
        question: "Is there a free plan?",
        answer:
          "Yes. The free plan includes up to 50 customers, referral tracking, and a manual rewards catalog. No credit card required to get started.",
      },
    ],
  },
  {
    title: "Referrals & Rewards",
    items: [
      {
        question: "How do customers submit referrals?",
        answer:
          "Customers log into their portal and submit referrals directly — entering the name, contact info, and any relevant details about the person they're referring. The referral is instantly logged in your dashboard for your review and approval.",
      },
      {
        question: "How do I set my referral reward values?",
        answer:
          "Connect Reward calculates reward values based on your actual profit margins — not just your revenue. You enter your average job value and margin percentage, and the platform suggests a referral reward that keeps you profitable on every referred job.",
      },
      {
        question: "How do customers redeem their points?",
        answer:
          "Customers browse your rewards catalog and select what they want to redeem. You receive a notification and fulfill the reward. On the Starter plan, email automation handles the customer communication automatically.",
      },
      {
        question: "Can I offer custom rewards beyond gift cards?",
        answer:
          "Yes. On all plans you can create fully custom reward items — anything from branded merchandise to service discounts to gift cards. You set the name, description, and point cost.",
      },
    ],
  },
  {
    title: "Plans & Pricing",
    items: [
      {
        question: "What is the difference between Free and Starter?",
        answer:
          "The Free plan gives you the core referral tracking and rewards catalog with manual management. The Starter plan ($99/month) adds email automation, custom branding, full analytics, and support for up to 200 customers.",
      },
      {
        question: "Do I need a credit card to start?",
        answer:
          "No credit card is required for the free plan. The Starter plan requires a credit card for the monthly subscription.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. There are no long-term contracts. You can cancel your Starter plan at any time from your account settings.",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        question: "How do I add my existing customers?",
        answer:
          "You can upload your existing customer list as a CSV file. Connect Reward will import the contacts and send them a branded welcome email inviting them to join your rewards program.",
      },
      {
        question: "Is my customer data secure?",
        answer:
          "Yes. All customer data is encrypted and stored securely. Connect Reward is fully CAN-SPAM compliant and includes an unsubscribe option on all marketing emails.",
      },
      {
        question: "What happens if a customer unsubscribes?",
        answer:
          "Customers who unsubscribe are automatically marked as Do Not Contact (DNC) in your dashboard. They will not receive any further marketing emails.",
      },
    ],
  },
];

const allFAQs = faqCategories.flatMap((c) => c.items);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allFAQs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function AccordionItem({
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

function FAQCategorySection({
  category,
  globalOffset,
  openIndex,
  setOpenIndex,
}: {
  category: FAQCategory;
  globalOffset: number;
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A202C]">{category.title}</h2>
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-6 shadow-sm">
        {category.items.map((faq, i) => {
          const globalIndex = globalOffset + i;
          return (
            <AccordionItem
              key={globalIndex}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === globalIndex}
              onToggle={() =>
                setOpenIndex(openIndex === globalIndex ? null : globalIndex)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  let offset = 0;

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h1 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-3 text-lg text-[#64748B]">
                Everything you need to know about Connect Reward&apos;s referral
                rewards platform for home service businesses.
              </p>
            </FadeIn>

            <div className="mt-12 space-y-10">
              {faqCategories.map((category) => {
                const currentOffset = offset;
                offset += category.items.length;
                return (
                  <FadeIn key={category.title} delay={0.1}>
                    <FAQCategorySection
                      category={category}
                      globalOffset={currentOffset}
                      openIndex={openIndex}
                      setOpenIndex={setOpenIndex}
                    />
                  </FadeIn>
                );
              })}
            </div>

            <FadeIn delay={0.2}>
              <div className="mt-16 text-center">
                <p className="text-[#64748B]">
                  Want to see how it all works?{" "}
                  <Link
                    href="/how-it-works"
                    className="font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors"
                  >
                    Learn how Connect Reward works
                  </Link>
                  .
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
