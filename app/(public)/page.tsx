import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyConnectReward } from "@/components/landing/WhyConnectReward";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Industries } from "@/components/landing/Industries";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Connect Reward",
    applicationCategory: "BusinessApplication",
    description:
      "Gamified referral rewards platform for home service businesses. Points, tiers, and prizes that turn happy customers into your best salespeople.",
    operatingSystem: "Web",
    url: "https://connectreward.io",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
      { "@type": "Offer", price: "99", priceCurrency: "USD", name: "Starter", billingIncrement: "P1M" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Connect Reward",
    url: "https://connectreward.io",
    logo: "https://connectreward.io/icon.svg",
    description:
      "White-label referral and loyalty platform for home service businesses.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@connectreward.io",
      contactType: "customer support",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Connect Reward work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "After you complete a job, add your customer to Connect Reward. They get a portal to submit referrals and earn points. When their referrals become your customers, they redeem points for rewards.",
        },
      },
      {
        "@type": "Question",
        name: "How long does it take to set up?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It depends on how many customers you have, but it should take 1-2 business days to get fully up and running.",
        },
      },
      {
        "@type": "Question",
        name: "What does it cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Connect Reward offers a Free plan and a Beta plan at $99/month. We're currently in early access — request access to lock in early adopter rates.",
        },
      },
      {
        "@type": "Question",
        name: "What industries does Connect Reward support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Connect Reward is built for home service businesses — solar, roofing, HVAC, windows, turf, pest control, and more. If your business relies on referrals, it's built for you.",
        },
      },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyConnectReward />
        <DashboardPreview />
        <Industries />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
