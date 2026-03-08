import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface MilestoneEmailProps extends BrandingProps {
  customerName: string;
  milestoneCount: number;
  bonusPoints: number;
  totalPoints: number;
  dashboardUrl: string;
}

export function MilestoneEmail({
  customerName,
  milestoneCount,
  bonusPoints,
  totalPoints,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: MilestoneEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Congrats! You've completed ${milestoneCount} referrals!`}
    >
      <Section style={{ textAlign: "center" as const }}>
        <Text style={emojiStyle}>{"\uD83C\uDF89"}</Text>
        <Text style={headingStyle}>
          Congrats, {customerName}!
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        You&apos;ve completed <strong>{milestoneCount} referrals</strong> with{" "}
        {companyName}! That&apos;s an incredible achievement.
      </Text>

      <Section style={bonusSection}>
        <Text style={bonusLabel}>Milestone Bonus Earned</Text>
        <Text style={bonusValue}>+{bonusPoints.toLocaleString()} points</Text>
      </Section>

      <Section style={statsRow}>
        <Text style={statItem}>
          <strong>{milestoneCount}</strong>
          {"\n"}Referrals
        </Text>
        <Text style={statItem}>
          <strong>{totalPoints.toLocaleString()}</strong>
          {"\n"}Total Points
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Keep up the great work! Every referral helps grow your rewards balance.
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

export function getMilestoneSubject(milestoneCount: number) {
  return `Congrats! You've completed ${milestoneCount} referrals!`;
}

const emojiStyle: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 8px",
  lineHeight: "1",
};

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

const bonusSection: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const bonusLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#065f46",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const bonusValue: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#059669",
  margin: "0",
};

const statsRow: React.CSSProperties = {
  display: "flex" as const,
  justifyContent: "center" as const,
  gap: "32px",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const statItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  whiteSpace: "pre-line" as const,
  margin: "0",
};
