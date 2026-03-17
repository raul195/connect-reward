import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Connect Reward Works — Referral Rewards for Home Service Businesses",
  description:
    "Connect Reward turns your happy customers into your best sales reps. Here's exactly how our gamified referral rewards platform works for solar, roofing, HVAC, and other home service businesses.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How Connect Reward Works — Referral Rewards for Home Service Businesses",
    description:
      "Connect Reward turns your happy customers into your best sales reps. Here's exactly how our gamified referral rewards platform works for solar, roofing, HVAC, and other home service businesses.",
    url: "https://connectreward.io/how-it-works",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Connect Reward" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Connect Reward Works — Referral Rewards for Home Service Businesses",
    description:
      "Connect Reward turns your happy customers into your best sales reps. Here's exactly how our gamified referral rewards platform works for solar, roofing, HVAC, and other home service businesses.",
    images: ["/og-image.png"],
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
