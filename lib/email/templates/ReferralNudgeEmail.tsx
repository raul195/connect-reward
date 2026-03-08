import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface ReferralNudgeEmailProps extends BrandingProps {
  customerName: string;
  referralName: string;
  daysPending: number;
  dashboardUrl: string;
}

export function ReferralNudgeEmail({
  customerName,
  referralName,
  daysPending,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: ReferralNudgeEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Checking in on your referral for ${referralName}`}
    >
      <Text style={headingStyle}>
        Checking in on your referral
      </Text>

      <Text style={paragraphStyle}>
        Hi {customerName}, we wanted to give you a quick update on your referral
        for <strong>{referralName}</strong>.
      </Text>

      <Section style={statusBox}>
        <Text style={statusLabel}>Referral for</Text>
        <Text style={statusName}>{referralName}</Text>
        <Text style={statusDetail}>
          Submitted {daysPending} days ago &bull; Still in progress
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Our team at {companyName} is actively working on this referral.
        We&apos;ll notify you as soon as there&apos;s a status change. In the
        meantime, you can check the latest updates on your dashboard.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Check Referral Status"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getReferralNudgeSubject(referralName: string) {
  return `Checking in on your referral for ${referralName}`;
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

const statusBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  padding: "16px",
  borderLeft: "4px solid #f59e0b",
  margin: "0 0 16px",
};

const statusLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#92400e",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const statusName: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 4px",
};

const statusDetail: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0",
};
