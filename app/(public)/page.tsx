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
    "@type": "Organization",
    name: "Connect Reward",
    url: "https://connectreward.io",
    logo: "https://connectreward.io/logo.png",
    description:
      "Gamified referral rewards platform for home service businesses including solar, roofing, HVAC, pest control, and windows.",
    foundingDate: "2024",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@connectreward.io",
    },
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Connect Reward",
    applicationCategory: "BusinessApplication",
    description:
      "Turn your happy customers into your best sales reps. Connect Reward is a gamified referral rewards platform that helps home service businesses get more referrals through points, leaderboards, badges, and automated rewards.",
    url: "https://connectreward.io",
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
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can home service businesses get more referrals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Home service businesses get more referrals by creating a structured referral program that rewards customers for sending new business. Connect Reward makes this easy by giving customers a points-based rewards system with leaderboards, badges, and a rewards catalog — turning one-time cash bonuses into an ongoing engagement program.",
        },
      },
      {
        "@type": "Question",
        name: "What is a referral rewards program for solar companies?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A referral rewards program for solar companies gives existing customers points or rewards every time they refer a friend who gets a solar installation. Connect Reward automates this process with email notifications, referral tracking, and a digital rewards catalog so solar businesses can grow through word-of-mouth without manual follow-up.",
        },
      },
      {
        "@type": "Question",
        name: "How do roofing companies get more customer referrals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Roofing companies get more referrals by rewarding customers who recommend their services. A gamified referral platform like Connect Reward motivates customers with points, tiers, and redeemable rewards — making it fun and rewarding to send referrals instead of a one-time transaction.",
        },
      },
      {
        "@type": "Question",
        name: "What is the best referral software for HVAC businesses?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Connect Reward is a referral rewards platform built specifically for home service businesses including HVAC companies. It automates referral tracking, sends email notifications when referrals are approved, and rewards customers with points they can redeem for gift cards and prizes.",
        },
      },
      {
        "@type": "Question",
        name: "How much should I pay customers for referrals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most home service businesses offer 5-15% of their profit margin as a referral reward. Connect Reward helps you calculate the right reward amount based on your actual job values and margins, so you always stay profitable while motivating customers to refer.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://connectreward.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: "https://connectreward.io/#pricing",
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
