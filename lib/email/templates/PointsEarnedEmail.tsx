import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";
import type { LoyaltyTier } from "@/lib/types";

interface PointsEarnedEmailProps extends BrandingProps {
  customerName: string;
  pointsEarned: number;
  reason: string;
  totalPoints: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number | null;
  rewardsUrl: string;
}

export function PointsEarnedEmail({
  customerName,
  pointsEarned,
  reason,
  totalPoints,
  tier,
  nextTier,
  pointsToNextTier,
  rewardsUrl,
  companyName,
  logoUrl,
  primaryColor,
}: PointsEarnedEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`You earned ${pointsEarned} points!`}
    >
      <Text style={headingStyle}>Points Earned!</Text>
      <Text style={paragraphStyle}>Hi {customerName},</Text>

      <Section style={pointsBoxStyle}>
        <Text style={bigPointsStyle}>+{pointsEarned.toLocaleString()}</Text>
        <Text style={reasonStyle}>{reason}</Text>
      </Section>

      <Section style={detailsStyle}>
        <Text style={detailRowStyle}>
          Total Balance: <strong>{totalPoints.toLocaleString()} points</strong>
        </Text>
        <Text style={detailRowStyle}>
          Current Tier:{" "}
          <strong style={{ textTransform: "capitalize" }}>{tier}</strong>
        </Text>
        {nextTier && pointsToNextTier !== null && (
          <Text style={detailRowStyle}>
            {pointsToNextTier.toLocaleString()} points to{" "}
            <strong style={{ textTransform: "capitalize" }}>{nextTier}</strong>
          </Text>
        )}
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={rewardsUrl}
          label="Browse Rewards"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getPointsEarnedSubject(pointsEarned: number) {
  return `You earned ${pointsEarned} points!`;
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

const pointsBoxStyle: React.CSSProperties = {
  backgroundColor: "#eef2ff",
  borderRadius: "8px",
  padding: "20px 16px",
  textAlign: "center" as const,
  margin: "8px 0 16px",
};

const bigPointsStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 800,
  color: "#4f46e5",
  margin: "0 0 4px",
};

const reasonStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: 0,
};

const detailsStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "12px 16px",
};

const detailRowStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: "0 0 4px",
};
