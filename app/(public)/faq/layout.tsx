import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Connect Reward",
  description:
    "Everything you need to know about Connect Reward's referral rewards platform for home service businesses.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions — Connect Reward",
    description:
      "Everything you need to know about Connect Reward's referral rewards platform for home service businesses.",
    url: "https://connectreward.io/faq",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Connect Reward" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions — Connect Reward",
    description:
      "Everything you need to know about Connect Reward's referral rewards platform for home service businesses.",
    images: ["/og-image.png"],
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
