import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface PromotionEmailProps extends BrandingProps {
  customerName: string;
  promotionName: string;
  multiplier: number;
  endDate: string;
  daysRemaining: number;
  pointsBalance: number;
  dashboardUrl: string;
  variant: "announcement" | "reminder" | "last_chance";
}

const VARIANT_CONFIG = {
  announcement: {
    heading: (name: string, mult: number) =>
      `${mult}x Points — ${name} is here!`,
    preview: (name: string, mult: number) =>
      `Earn ${mult}x points on every referral during ${name}!`,
    message: (mult: number, endDate: string) =>
      `For a limited time, every referral you submit earns ${mult}x the usual points! This promotion runs until ${endDate}. Don't miss out!`,
    cta: "Start Referring Now",
  },
  reminder: {
    heading: (_name: string, _mult: number) =>
      `Don't forget — the points boost is still on!`,
    preview: (name: string, mult: number) =>
      `${name} is still active — earn ${mult}x points!`,
    message: (mult: number, endDate: string) =>
      `The ${mult}x points multiplier is still active! You have until ${endDate} to take advantage of this boosted earning rate. Keep those referrals coming!`,
    cta: "Refer Someone Now",
  },
  last_chance: {
    heading: (_name: string, _mult: number) =>
      `Last chance for bonus points!`,
    preview: (name: string, mult: number) =>
      `${name} ends tomorrow — last chance for ${mult}x points!`,
    message: (mult: number, endDate: string) =>
      `Time is almost up! The ${mult}x points multiplier ends ${endDate}. Submit your referrals now before the promotion expires!`,
    cta: "Refer Now — Last Chance!",
  },
};

export function PromotionEmail({
  customerName,
  promotionName,
  multiplier,
  endDate,
  daysRemaining,
  pointsBalance,
  dashboardUrl,
  variant,
  companyName,
  logoUrl,
  primaryColor,
}: PromotionEmailProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={config.preview(promotionName, multiplier)}
    >
      <Text style={headingStyle}>
        {config.heading(promotionName, multiplier)}
      </Text>

      <Text style={paragraphStyle}>Hi {customerName},</Text>

      {/* Multiplier badge */}
      <Section style={badgeContainerStyle}>
        <div style={badgeStyle}>
          <Text style={badgeValueStyle}>{multiplier}x</Text>
          <Text style={badgeLabelStyle}>POINTS</Text>
        </div>
      </Section>

      <Text style={paragraphStyle}>
        {config.message(multiplier, endDate)}
      </Text>

      {/* Countdown */}
      <Section style={countdownStyle}>
        <Text style={countdownLabel}>Time remaining</Text>
        <Text style={countdownValue}>
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
        </Text>
      </Section>

      {/* Points balance */}
      <Section style={highlightStyle}>
        <Text style={balanceLabel}>Your current balance</Text>
        <Text style={balanceValue}>
          {pointsBalance.toLocaleString()} points
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label={config.cta}
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getPromotionSubject(
  variant: "announcement" | "reminder" | "last_chance",
  promotionName: string,
  multiplier: number
): string {
  switch (variant) {
    case "announcement":
      return `${multiplier}x Points — ${promotionName} is here!`;
    case "reminder":
      return `Reminder: ${promotionName} — ${multiplier}x points still active!`;
    case "last_chance":
      return `Last chance! ${promotionName} ends tomorrow!`;
  }
}

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 12px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const badgeContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#fffbeb",
  border: "2px solid #f59e0b",
  borderRadius: "12px",
  padding: "12px 24px",
  textAlign: "center" as const,
};

const badgeValueStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 800,
  color: "#d97706",
  margin: "0",
  lineHeight: "1",
};

const badgeLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#92400e",
  margin: "4px 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
};

const countdownStyle: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "12px 16px",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const countdownLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#92400e",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const countdownValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#d97706",
  margin: "0",
};

const highlightStyle: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const balanceLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const balanceValue: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#0d9488",
  margin: "0",
};
