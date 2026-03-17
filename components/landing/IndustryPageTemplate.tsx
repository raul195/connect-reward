"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Settings,
  Upload,
  Send,
  CheckCircle,
  Star,
  Award,
  Target,
  TrendingUp,
  Quote,
} from "lucide-react";
import type { IndustryPageData } from "@/lib/industry-pages";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { FadeIn } from "./FadeIn";

const steps = [
  {
    icon: Settings,
    title: "Set your reward values",
    desc: "Set your referral reward values based on your actual job margins. Connect Reward calculates the right point values so you're always profitable on every referred job.",
  },
  {
    icon: Upload,
    title: "Invite your customers",
    desc: "Upload your existing customer list via CSV. Connect Reward sends a branded welcome email inviting them to join your rewards program.",
  },
  {
    icon: Send,
    title: "Customers submit referrals",
    desc: "Customers log into their portal and submit referrals directly — entering the name and contact info of who they're referring. You're notified instantly.",
  },
  {
    icon: CheckCircle,
    title: "Approve, reward, redeem",
    desc: "Approve referrals, award points automatically, and customers redeem rewards from your catalog. The whole cycle runs itself.",
  },
];

const earnPoints = [
  {
    icon: Target,
    title: "Successful Referral Approved",
    desc: "Earn points every time a referral you submitted is approved by the business.",
  },
  {
    icon: Star,
    title: "Leaving a Google Review",
    desc: "Get bonus points for leaving a review on Google to help boost the business's online reputation.",
  },
  {
    icon: Award,
    title: "Leaving a BBB Review",
    desc: "Earn points for leaving a review on the Better Business Bureau to build trust and credibility.",
  },
  {
    icon: TrendingUp,
    title: "Hitting Referral Milestones",
    desc: "Unlock bonus points and achievement badges when you hit referral milestones like 3, 5, and 10 referrals.",
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

export function IndustryPageTemplate({ data }: { data: IndustryPageData }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Connect Reward",
      applicationCategory: "BusinessApplication",
      description: data.metaDescription,
      url: `https://connectreward.io/${data.slug}`,
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "USD",
          description:
            "Get started free with up to 50 customers, referral tracking, and manual rewards catalog.",
        },
        {
          "@type": "Offer",
          name: "Starter Plan",
          price: "99",
          priceCurrency: "USD",
          description:
            "Full email automation, custom branding, and up to 200 customers.",
        },
      ],
      operatingSystem: "Web",
    },
  ];

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
                {data.heroHeading}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#64748B]">
                {data.heroSubheading}
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:brightness-110"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-sm font-semibold text-[#0D9488] transition-colors hover:text-[#0F766E]"
                >
                  See How It Works &rarr;
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Why Referrals Matter */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                Why Referrals Matter for {data.name} Companies
              </h2>
              <div className="mt-6 space-y-4">
                {data.whyReferralsMatter.map((p, i) => (
                  <p
                    key={i}
                    className="text-lg leading-relaxed text-[#64748B]"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-lg text-[#64748B]">
                Four steps from setup to your first referral
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* What Customers Earn Points For */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                What Customers Earn Points For
              </h2>
              <p className="mt-3 text-lg text-[#64748B]">
                Multiple ways for your customers to earn and stay engaged
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {earnPoints.map((ep, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-md">
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D9488]">
                      <ep.icon className="h-7 w-7 text-white" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-[#1A202C]">
                      {ep.title}
                    </h3>
                    <p className="mt-2 text-[#64748B]">{ep.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-lg text-[#64748B]">
                Common questions about referral rewards for {data.name.toLowerCase()} companies
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="mt-12 rounded-2xl border border-gray-100 bg-white px-6 shadow-sm">
                {data.faq.map((faq, i) => (
                  <FAQItem
                    key={i}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === i}
                    onToggle={() =>
                      setOpenIndex(openIndex === i ? null : i)
                    }
                  />
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                What {data.name} Companies Are Saying
              </h2>
              <p className="mt-3 text-sm font-medium text-[#F59E0B]">
                [PLACEHOLDER — replace with real testimonials]
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data.testimonials.map((t, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="flex flex-col rounded-2xl bg-white p-8 shadow-md">
                    <Quote className="h-8 w-8 text-[#0D9488] opacity-40" />
                    <p className="mt-4 flex-1 text-[#64748B] leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <p className="font-semibold text-[#1A202C]">
                        {t.name}
                      </p>
                      <p className="text-sm text-[#64748B]">{t.company}</p>
                      <p className="mt-1 text-xs text-[#F59E0B]">
                        [PLACEHOLDER]
                      </p>
                    </div>
                  </div>
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
                {data.ctaHeading}
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
                <Link
                  href="/"
                  className="font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors"
                >
                  See all industries
                </Link>{" "}
                we serve
              </p>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
