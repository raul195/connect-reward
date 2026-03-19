import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { INDUSTRIES, INDUSTRIES_MAP } from "@/lib/industries";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = INDUSTRIES_MAP[slug];
  if (!industry) return {};

  const title = `${industry.name} Referral Rewards`;
  return {
    title,
    description: industry.metaDescription,
    alternates: { canonical: `/industries/${slug}` },
    openGraph: {
      title: `${title} | Connect Reward`,
      description: industry.metaDescription,
      url: `/industries/${slug}`,
    },
    twitter: {
      title: `${title} | Connect Reward`,
      description: industry.metaDescription,
    },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = INDUSTRIES_MAP[slug];
  if (!industry) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: industry.headline,
    description: industry.metaDescription,
    url: `https://connectreward.io/industries/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Connect Reward",
      url: "https://connectreward.io",
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-[#0D9488]">
              For {industry.name} Businesses
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-[#1A202C] sm:text-5xl">
              {industry.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#64748B]">
              {industry.description}
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:brightness-110"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pain points */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-extrabold text-[#1A202C]">
              Sound Familiar?
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {industry.painPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-[#475569]">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-extrabold text-[#1A202C]">
              How Connect Reward Helps
            </h2>
            <div className="mt-10 space-y-8">
              {industry.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 rounded-xl border border-gray-100 bg-[#F8FAFC] p-6"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
                    <Check className="h-4 w-4 text-[#0D9488]" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A202C]">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 leading-relaxed text-[#64748B]">
                      {benefit.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
              Ready to Grow Your {industry.name} Business?
            </h2>
            <p className="mt-4 text-lg text-[#64748B]">
              Join the businesses already using Connect Reward to turn customers
              into their best sales channel.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:brightness-110"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
