import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface RedemptionRequestedEmailProps extends BrandingProps {
  customerName: string;
  rewardName: string;
  pointsSpent: number;
  dollarValue: string;
  dashboardUrl: string;
}

export function RedemptionRequestedEmail({
  customerName,
  rewardName,
  pointsSpent,
  dollarValue,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: RedemptionRequestedEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`New redemption request from ${customerName}`}
    >
      <Text style={headingStyle}>New Redemption Request</Text>
      <Text style={paragraphStyle}>
        {customerName} has requested to redeem {pointsSpent.toLocaleString()}{" "}
        points for {rewardName} (worth ${dollarValue}).
      </Text>

      <Section style={detailBoxStyle}>
        <Text style={detailLabelStyle}>Customer</Text>
        <Text style={detailValueStyle}>{customerName}</Text>
        <Text style={detailLabelStyle}>Reward</Text>
        <Text style={detailValueStyle}>{rewardName}</Text>
        <Text style={detailLabelStyle}>Points</Text>
        <Text style={detailValueStyle}>
          {pointsSpent.toLocaleString()} pts (${dollarValue})
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Log in to your dashboard to fulfill this request.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="View Redemption Requests"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getRedemptionRequestedSubject(customerName: string) {
  return `New Redemption Request — ${customerName}`;
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

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px",
  margin: "8px 0 16px",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "8px 0 2px",
};

const detailValueStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 4px",
};
