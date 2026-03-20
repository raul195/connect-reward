import { Text, Section, Hr } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface BusinessWelcomeEmailProps extends BrandingProps {
  ownerName: string;
  businessName: string;
  dashboardUrl: string;
}

export function BusinessWelcomeEmail({
  ownerName,
  businessName,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: BusinessWelcomeEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Welcome to Connect Reward, ${ownerName}! Let's grow ${businessName} through referrals.`}
    >
      <Text style={headingStyle}>
        Welcome to Connect Reward!
      </Text>

      <Text style={paragraphStyle}>
        Hi {ownerName},
      </Text>

      <Text style={paragraphStyle}>
        Thanks for signing up! You&apos;re about to turn your happiest customers into
        your most powerful marketing channel. Here&apos;s what happens next:
      </Text>

      <Section style={stepsContainerStyle}>
        <Section style={stepRowStyle}>
          <Text style={stepNumberStyle}>1</Text>
          <Section style={stepContentStyle}>
            <Text style={stepTitleStyle}>Complete Your Setup</Text>
            <Text style={stepDescStyle}>
              Our onboarding wizard will walk you through setting up your services,
              reward values, and program configuration. It takes about 15 minutes.
            </Text>
          </Section>
        </Section>

        <Section style={stepRowStyle}>
          <Text style={stepNumberStyle}>2</Text>
          <Section style={stepContentStyle}>
            <Text style={stepTitleStyle}>Add Your Customers</Text>
            <Text style={stepDescStyle}>
              Upload your existing customer list via CSV or add them one by one.
              They&apos;ll receive a branded welcome email inviting them to join your
              rewards program.
            </Text>
          </Section>
        </Section>

        <Section style={stepRowStyle}>
          <Text style={stepNumberStyle}>3</Text>
          <Section style={stepContentStyle}>
            <Text style={stepTitleStyle}>Watch the Referrals Come In</Text>
            <Text style={stepDescStyle}>
              Your customers submit referrals through their portal, earn points
              automatically, and redeem rewards from your catalog. You get notified
              on every new referral.
            </Text>
          </Section>
        </Section>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "28px" }}>
        <CTAButton
          href={dashboardUrl}
          label="Start Your Setup"
          primaryColor={primaryColor}
        />
      </Section>

      <Hr style={dividerStyle} />

      <Text style={footerNoteStyle}>
        Have questions? Reach out to us at{" "}
        <a href="mailto:support@connectreward.io" style={{ color: "#0D9488" }}>
          support@connectreward.io
        </a>{" "}
        — we&apos;re here to help you succeed.
      </Text>

      <Text style={signoffStyle}>
        — The Connect Reward Team
      </Text>
    </Layout>
  );
}

export function getBusinessWelcomeSubject() {
  return "Welcome to Connect Reward — let's grow your business through referrals";
}

const headingStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 20px",
  lineHeight: "32px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const stepsContainerStyle: React.CSSProperties = {
  margin: "24px 0",
};

const stepRowStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const stepNumberStyle: React.CSSProperties = {
  display: "inline-block",
  width: "32px",
  height: "32px",
  lineHeight: "32px",
  textAlign: "center" as const,
  borderRadius: "50%",
  backgroundColor: "#0D9488",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  margin: "0 0 8px",
};

const stepContentStyle: React.CSSProperties = {
  paddingLeft: "4px",
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 4px",
};

const stepDescStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "22px",
  margin: "0",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "28px 0 20px",
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "22px",
  margin: "0 0 12px",
};

const signoffStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  fontWeight: 600,
  margin: "0",
};
