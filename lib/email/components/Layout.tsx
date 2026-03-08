import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Preview,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface LayoutProps {
  companyName: string;
  logoUrl: string | null;
  primaryColor?: string;
  preview: string;
  children: React.ReactNode;
}

export function Layout({
  companyName,
  logoUrl,
  primaryColor = "#6366f1",
  preview,
  children,
}: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={companyName}
                width="140"
                height="40"
                style={{ margin: "0 auto", display: "block" }}
              />
            ) : (
              <Text
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: primaryColor,
                  textAlign: "center" as const,
                  margin: "0",
                }}
              >
                {companyName}
              </Text>
            )}
          </Section>

          {/* Card body */}
          <Section style={cardStyle}>{children}</Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Hr style={{ borderColor: "#e5e7eb", margin: "0 0 16px" }} />
            <Text style={footerTextStyle}>
              Powered by{" "}
              <span style={{ fontWeight: 600 }}>Connect Reward</span>
            </Text>
            <Text style={footerTextStyle}>
              You received this email because you&apos;re enrolled in{" "}
              {companyName}&apos;s referral program.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  padding: "24px 0",
  textAlign: "center" as const,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "32px 24px",
};

const footerStyle: React.CSSProperties = {
  padding: "16px 24px",
};

const footerTextStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "0 0 4px",
};
