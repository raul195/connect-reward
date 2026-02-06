import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Connect Reward — Gamified Referral Rewards for Home Service Contractors",
    template: "%s | Connect Reward",
  },
  description:
    "Turn happy customers into your best salespeople. Reward referrals with points, tiers, and prizes. Built for solar, roofing, HVAC, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io"),
  openGraph: {
    title: "Connect Reward",
    description:
      "Gamified referral rewards for home service contractors. Points, tiers, and prizes that keep your customers coming back.",
    type: "website",
    siteName: "Connect Reward",
  },
  twitter: {
    card: "summary_large_image",
    title: "Connect Reward",
    description:
      "Gamified referral rewards for home service contractors.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
