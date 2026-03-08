import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface AvailableReward {
  name: string;
  pointsRequired: number;
}

interface MonthlyReminderEmailProps extends BrandingProps {
  customerName: string;
  totalPoints: number;
  pointsEarnedThisMonth: number;
  referralsThisMonth: number;
  availableRewards: AvailableReward[];
  dashboardUrl: string;
}

export function MonthlyReminderEmail({
  customerName,
  totalPoints,
  pointsEarnedThisMonth,
  referralsThisMonth,
  availableRewards,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: MonthlyReminderEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Your monthly rewards summary from ${companyName}`}
    >
      <Text style={headingStyle}>
        Your Monthly Summary
      </Text>

      <Text style={paragraphStyle}>
        Hi {customerName}, here&apos;s a recap of your activity this month with{" "}
        {companyName}&apos;s referral program.
      </Text>

      <Section style={statsGrid}>
        <table style={{ width: "100%" }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={statCell}>
                <Text style={statValue}>{totalPoints.toLocaleString()}</Text>
                <Text style={statLabel}>Total Points</Text>
              </td>
              <td style={statCell}>
                <Text style={statValue}>
                  {pointsEarnedThisMonth > 0 ? "+" : ""}
                  {pointsEarnedThisMonth.toLocaleString()}
                </Text>
                <Text style={statLabel}>Points This Month</Text>
              </td>
              <td style={statCell}>
                <Text style={statValue}>{referralsThisMonth}</Text>
                <Text style={statLabel}>Referrals</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {availableRewards.length > 0 && (
        <>
          <Text style={sectionTitle}>Rewards You Can Redeem</Text>
          <Section style={rewardsList}>
            {availableRewards.slice(0, 3).map((reward, i) => (
              <Text key={i} style={rewardItem}>
                {"\u2022"} <strong>{reward.name}</strong> &mdash;{" "}
                {reward.pointsRequired.toLocaleString()} points
              </Text>
            ))}
            {availableRewards.length > 3 && (
              <Text style={moreRewards}>
                + {availableRewards.length - 3} more available
              </Text>
            )}
          </Section>
        </>
      )}

      <Text style={paragraphStyle}>
        {referralsThisMonth === 0
          ? "Submit a referral this month to start earning more points!"
          : "Keep up the great work! Every referral gets you closer to your next reward."}
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

export function getMonthlyReminderSubject(companyName: string) {
  return `Your monthly rewards summary from ${companyName}`;
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

const statsGrid: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "0 0 16px",
};

const statCell: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "8px",
};

const statValue: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 2px",
};

const statLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 8px",
};

const rewardsList: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 16px",
};

const rewardItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "24px",
  margin: "0",
};

const moreRewards: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  fontStyle: "italic" as const,
  margin: "4px 0 0",
};
