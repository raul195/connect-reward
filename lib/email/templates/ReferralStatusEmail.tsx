import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";
import type { ReferralStatus } from "@/lib/types";

const STATUS_LABELS: Record<ReferralStatus, string> = {
  submitted: "Submitted",
  contacted: "Contacted",
  consultation_scheduled: "Consultation Scheduled",
  installation_complete: "Installation Complete",
  cancelled: "Cancelled",
};

interface ReferralStatusEmailProps extends BrandingProps {
  customerName: string;
  referralName: string;
  newStatus: ReferralStatus;
  currentPoints: number;
  dashboardUrl: string;
}

export function ReferralStatusEmail({
  customerName,
  referralName,
  newStatus,
  currentPoints,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: ReferralStatusEmailProps) {
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus.replace(/_/g, " ");

  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Referral update: ${referralName} — ${statusLabel}`}
    >
      <Text style={headingStyle}>Referral Update</Text>
      <Text style={paragraphStyle}>Hi {customerName},</Text>
      <Text style={paragraphStyle}>
        Your referral for <strong>{referralName}</strong> has been updated:
      </Text>

      <Section style={statusBoxStyle}>
        <Text style={statusLabelStyle}>{statusLabel}</Text>
      </Section>

      <Text style={paragraphStyle}>
        Your current points balance: <strong>{currentPoints.toLocaleString()} points</strong>
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Submit Another Referral"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getReferralStatusSubject(
  referralName: string,
  newStatus: ReferralStatus
) {
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus.replace(/_/g, " ");
  return `Referral update: ${referralName} — ${statusLabel}`;
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

const statusBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "12px 16px",
  textAlign: "center" as const,
  margin: "8px 0 16px",
};

const statusLabelStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#15803d",
  margin: 0,
};
