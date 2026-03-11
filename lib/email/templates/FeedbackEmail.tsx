import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface FeedbackEmailProps extends BrandingProps {
  adminName: string;
  dashboardUrl: string;
}

export function FeedbackEmail({
  adminName,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: FeedbackEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview="We'd love your feedback on Connect Reward"
    >
      <Text style={headingStyle}>Hi {adminName}!</Text>
      <Text style={paragraphStyle}>
        You&apos;ve been using Connect Reward for a week now — we&apos;d love to hear
        how things are going!
      </Text>
      <Text style={paragraphStyle}>
        Your feedback helps us build a better product for home service businesses
        like yours. It only takes a minute.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Share Your Feedback"
          primaryColor={primaryColor}
        />
      </Section>

      <Text style={footerStyle}>
        Just head to your admin dashboard — you&apos;ll see a feedback banner at the top.
      </Text>
    </Layout>
  );
}

export function getFeedbackSubject() {
  return "How's Connect Reward working for you?";
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

const footerStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6B7280",
  lineHeight: "20px",
  marginTop: "24px",
};
