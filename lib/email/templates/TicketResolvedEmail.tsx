import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout } from "../components/Layout";
import { CTAButton } from "../components/CTAButton";
import type { BrandingProps } from "./types";

interface TicketResolvedEmailProps extends BrandingProps {
  customerName: string;
  ticketSubject: string;
  resolution: string;
  dashboardUrl: string;
}

export function TicketResolvedEmail({
  customerName,
  ticketSubject,
  resolution,
  dashboardUrl,
  companyName,
  logoUrl,
  primaryColor,
}: TicketResolvedEmailProps) {
  return (
    <Layout
      companyName={companyName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      preview={`Your support ticket has been resolved`}
    >
      <Text style={headingStyle}>Ticket Resolved</Text>
      <Text style={paragraphStyle}>
        Hi {customerName}, your support ticket has been resolved.
      </Text>

      <Section style={ticketBoxStyle}>
        <Text style={labelStyle}>Subject</Text>
        <Text style={valueStyle}>{ticketSubject}</Text>
        <Text style={{ ...labelStyle, marginTop: "12px" }}>Resolution</Text>
        <Text style={valueStyle}>{resolution}</Text>
      </Section>

      <Text style={paragraphStyle}>
        If you have any further questions, feel free to open a new ticket from
        your dashboard.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
        <CTAButton
          href={dashboardUrl}
          label="View Dashboard"
          primaryColor={primaryColor}
        />
      </Section>
    </Layout>
  );
}

export function getTicketResolvedSubject(ticketSubject: string) {
  return `Ticket Resolved: ${ticketSubject}`;
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

const ticketBoxStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#111827",
  lineHeight: "22px",
  margin: "0",
};
