import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface RedemptionFulfilledEmailProps extends BrandingProps {
  customerName: string;
  rewardName: string;
  dashboardUrl: string;
}

export function RedemptionFulfilledEmail({
  customerName,
  rewardName,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: RedemptionFulfilledEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Your reward is on its way!`}
    >
      <Text style={headingStyle}>Your reward is on its way! 🎉</Text>
      <Text style={paragraphStyle}>Hi {customerName},</Text>
      <Text style={paragraphStyle}>
        Great news! {companyName} has fulfilled your redemption for{" "}
        <strong>{rewardName}</strong>. Enjoy your reward and keep earning
        points for more!
      </Text>

      <Section style={rewardBoxStyle}>
        <Text style={rewardNameStyle}>{rewardName}</Text>
        <Text style={statusStyle}>✓ Fulfilled</Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Go to Dashboard"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getRedemptionFulfilledSubject() {
  return "Your reward is on its way! 🎉";
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
  margin: "0 0 12px",
};

const rewardBoxStyle: React.CSSProperties = {
  backgroundColor: "#d1fae5",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "8px 0 16px",
};

const rewardNameStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#065f46",
  margin: "0 0 4px",
};

const statusStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#047857",
  margin: 0,
};
