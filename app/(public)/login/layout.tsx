import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Connect Reward account to manage referrals, track points, and redeem rewards.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Log In | Connect Reward",
    description: "Log in to your Connect Reward account to manage referrals, track points, and redeem rewards.",
    url: "/login",
  },
  twitter: {
    title: "Log In | Connect Reward",
    description: "Log in to your Connect Reward account to manage referrals, track points, and redeem rewards.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
