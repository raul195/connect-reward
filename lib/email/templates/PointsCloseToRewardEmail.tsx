import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface PointsCloseToRewardEmailProps extends BrandingProps {
  customerName: string;
  currentPoints: number;
  rewardName: string;
  rewardCost: number;
  pointsNeeded: number;
  rewardsUrl: string;
}

export function PointsCloseToRewardEmail({
  customerName,
  currentPoints,
  rewardName,
  rewardCost,
  pointsNeeded,
  rewardsUrl,
  companyName,
  logoUrl,
  primaryColor,
}: PointsCloseToRewardEmailProps) {
  const percentage = Math.round((currentPoints / rewardCost) * 100);

  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`You're only ${pointsNeeded.toLocaleString()} points away from ${rewardName}!`}
    >
      <Text style={headingStyle}>
        You&apos;re almost there, {customerName}!
      </Text>

      <Text style={paragraphStyle}>
        You&apos;re only <strong>{pointsNeeded.toLocaleString()} points</strong> away
        from redeeming <strong>{rewardName}</strong>!
      </Text>

      <Section style={progressSection}>
        <Text style={rewardLabel}>{rewardName}</Text>
        <div style={progressBarOuter}>
          <div
            style={{
              ...progressBarInner,
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: primaryColor,
            }}
          />
        </div>
        <Text style={progressText}>
          {currentPoints.toLocaleString()} / {rewardCost.toLocaleString()} points ({percentage}%)
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Submit one more referral and you could unlock this reward. Visit your
        dashboard to refer a friend today!
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={rewardsUrl}
          label="View Rewards"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getPointsCloseToRewardSubject(
  pointsNeeded: number,
  rewardName: string
) {
  return `You're only ${pointsNeeded.toLocaleString()} points away from ${rewardName}!`;
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

const progressSection: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "0 0 16px",
};

const rewardLabel: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 8px",
};

const progressBarOuter: React.CSSProperties = {
  width: "100%",
  height: "12px",
  backgroundColor: "#e5e7eb",
  borderRadius: "6px",
  overflow: "hidden" as const,
};

const progressBarInner: React.CSSProperties = {
  height: "100%",
  borderRadius: "6px",
  transition: "width 0.3s",
};

const progressText: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "8px 0 0",
};
