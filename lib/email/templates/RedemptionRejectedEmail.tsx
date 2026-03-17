import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface RedemptionRejectedEmailProps extends BrandingProps {
  customerName: string;
  rewardName: string;
  rejectionReason: string;
  pointsRestored: number;
  dashboardUrl: string;
}

export function RedemptionRejectedEmail({
  customerName,
  rewardName,
  rejectionReason,
  pointsRestored,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: RedemptionRejectedEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Update on your redemption request`}
    >
      <Text style={headingStyle}>Update on your redemption request</Text>
      <Text style={paragraphStyle}>Hi {customerName},</Text>
      <Text style={paragraphStyle}>
        Your request to redeem <strong>{rewardName}</strong> was not approved
        by {companyName}.
      </Text>

      <Section style={reasonBoxStyle}>
        <Text style={reasonLabelStyle}>Reason</Text>
        <Text style={reasonTextStyle}>{rejectionReason}</Text>
      </Section>

      <Text style={paragraphStyle}>
        Your <strong>{pointsRestored.toLocaleString()} points</strong> have
        been restored to your account. You can use them toward other rewards.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Browse Rewards"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getRedemptionRejectedSubject() {
  return "Update on your redemption request";
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

const reasonBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "16px",
  margin: "8px 0 16px",
};

const reasonLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#991b1b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const reasonTextStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#7f1d1d",
  margin: 0,
};
