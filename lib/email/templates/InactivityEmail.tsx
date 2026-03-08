import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface InactivityEmailProps extends BrandingProps {
  customerName: string;
  pointsBalance: number;
  daysSinceActivity: number;
  severity: "mild" | "urgent";
  dashboardUrl: string;
}

export function InactivityEmail({
  customerName,
  pointsBalance,
  daysSinceActivity,
  severity,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: InactivityEmailProps) {
  const isUrgent = severity === "urgent";

  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={
        isUrgent
          ? `Don't let your ${pointsBalance.toLocaleString()} points go to waste!`
          : `We miss you, ${customerName}!`
      }
    >
      <Text style={headingStyle}>
        {isUrgent ? "Don\u2019t let your points go to waste!" : `We miss you, ${customerName}!`}
      </Text>

      <Text style={paragraphStyle}>
        It&apos;s been {daysSinceActivity} days since your last activity with{" "}
        {companyName}&apos;s referral program.
      </Text>

      <Section style={highlightStyle}>
        <Text style={balanceLabel}>Your current balance</Text>
        <Text style={balanceValue}>{pointsBalance.toLocaleString()} points</Text>
      </Section>

      <Text style={paragraphStyle}>
        {isUrgent
          ? "Your points are waiting to be redeemed for amazing rewards. Don\u2019t miss out \u2014 log in today and put your points to work!"
          : "You\u2019ve built up a great points balance! Come back and explore what rewards are available to you."}
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="View Your Dashboard"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getInactivitySubject(
  customerName: string,
  severity: "mild" | "urgent"
) {
  return severity === "urgent"
    ? "Don\u2019t let your points go to waste!"
    : `We miss you, ${customerName}!`;
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
