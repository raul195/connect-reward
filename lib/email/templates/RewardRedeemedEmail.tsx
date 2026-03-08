import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface RewardRedeemedEmailProps extends BrandingProps {
  customerName: string;
  rewardName: string;
  pointsSpent: number;
  remainingBalance: number;
  dashboardUrl: string;
}

export function RewardRedeemedEmail({
  customerName,
  rewardName,
  pointsSpent,
  remainingBalance,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: RewardRedeemedEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`You redeemed ${rewardName}!`}
    >
      <Text style={headingStyle}>Reward Redeemed!</Text>
      <Text style={paragraphStyle}>Hi {customerName},</Text>
      <Text style={paragraphStyle}>
        You&apos;ve successfully redeemed the following reward:
      </Text>

      <Section style={rewardBoxStyle}>
        <Text style={rewardNameStyle}>{rewardName}</Text>
        <Text style={pointsSpentStyle}>
          {pointsSpent.toLocaleString()} points
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Remaining balance:{" "}
        <strong>{remainingBalance.toLocaleString()} points</strong>
      </Text>
      <Text style={noteStyle}>
        Please allow 3-5 business days for delivery and processing.
      </Text>

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

export function getRewardRedeemedSubject(rewardName: string) {
  return `You redeemed ${rewardName}!`;
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
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "8px 0 16px",
};

const rewardNameStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#92400e",
  margin: "0 0 4px",
};

const pointsSpentStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#b45309",
  margin: 0,
};

const noteStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
  fontStyle: "italic",
  margin: "0 0 8px",
};
