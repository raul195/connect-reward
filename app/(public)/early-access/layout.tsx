import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Early Access",
  description:
    "Join the Connect Reward beta — gamified referral rewards for solar, roofing, HVAC, and home service businesses. Lock in early adopter pricing.",
  alternates: { canonical: "/early-access" },
  openGraph: {
    title: "Request Early Access | Connect Reward",
    description:
      "Join the Connect Reward beta — gamified referral rewards for solar, roofing, HVAC, and home service businesses.",
    url: "/early-access",
  },
  twitter: {
    title: "Request Early Access | Connect Reward",
    description:
      "Join the Connect Reward beta — gamified referral rewards for solar, roofing, HVAC, and home service businesses.",
  },
};

export default function EarlyAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
