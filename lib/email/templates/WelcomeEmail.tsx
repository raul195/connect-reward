import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface WelcomeEmailProps extends BrandingProps {
  customerName: string;
  dashboardUrl: string;
}

export function WelcomeEmail({
  customerName,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: WelcomeEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Welcome to ${companyName}'s referral program!`}
    >
      <Text style={headingStyle}>Welcome, {customerName}!</Text>
      <Text style={paragraphStyle}>
        You&apos;ve been added to {companyName}&apos;s referral program. Here&apos;s
        how it works:
      </Text>

      <Section style={stepsStyle}>
        <Text style={stepStyle}>
          <strong>1. Refer</strong> — Share your friends&apos; and family&apos;s
          contact info through your dashboard.
        </Text>
        <Text style={stepStyle}>
          <strong>2. Earn</strong> — When your referral completes their
          installation, you earn points.
        </Text>
        <Text style={stepStyle}>
          <strong>3. Redeem</strong> — Use your points to claim rewards from the
          catalog.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Go to Your Dashboard"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getWelcomeSubject(companyName: string) {
  return `Welcome to ${companyName}'s referral program!`;
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

const stepsStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
};

const stepStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: "0 0 8px",
};
