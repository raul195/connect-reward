import { Button } from "@react-email/components";
import * as React from "react";

interface CTAButtonProps {
  href: string;
  label: string;
  primaryColor?: string;
}

export function CTAButton({
  href,
  label,
  primaryColor = "#6366f1",
}: CTAButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: primaryColor,
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: 600,
        textDecoration: "none",
        textAlign: "center" as const,
        padding: "12px 24px",
        borderRadius: "8px",
        lineHeight: "100%",
      }}
    >
      {label}
    </Button>
  );
}
