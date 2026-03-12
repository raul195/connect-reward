import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
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

const META_TITLE = "Connect Reward — Referral Rewards for Home Service Businesses";
const META_DESCRIPTION =
  "Turn your happy customers into your best sales reps. Gamified referral rewards for solar, roofing, HVAC, and more.";

export const metadata: Metadata = {
  title: {
    default: META_TITLE,
    template: "%s | Connect Reward",
  },
  description: META_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://connectreward.io",
    siteName: "Connect Reward",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Connect Reward",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
        <GoogleAnalytics />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
