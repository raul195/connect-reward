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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Connect Reward",
  applicationCategory: "BusinessApplication",
  description:
    "Gamified referral rewards platform for home service contractors. Points, tiers, and prizes that turn happy customers into your best salespeople.",
  operatingSystem: "Web",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "149", priceCurrency: "USD", name: "Starter" },
    { "@type": "Offer", price: "299", priceCurrency: "USD", name: "Growth" },
    { "@type": "Offer", price: "499", priceCurrency: "USD", name: "Pro" },
  ],
};

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
