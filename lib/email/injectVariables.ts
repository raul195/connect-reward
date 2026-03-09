/**
 * Variable injection for email templates and plain-text → HTML conversion.
 */

const FALLBACKS: Record<string, string> = {
  customerName: "there",
  businessName: "our team",
  pointsBalance: "your",
  pointsNeeded: "a few more",
  wishlistItem: "a great reward",
  referralCount: "your",
  nextTierName: "the next level",
  rewardCatalogUrl: "#",
  dashboardUrl: "#",
  referralSubmitUrl: "#",
  rewardName: "a reward",
  milestoneCount: "an amazing number of",
  bonusPoints: "bonus",
  referralName: "your referral",
  daysPending: "several",
  totalPoints: "your",
  periodLabel: "monthly",
  unsubscribeUrl: "#",
};

/**
 * Replace `{{varName}}` tokens with data values.
 * Numbers are auto-formatted with `toLocaleString()`.
 * Falls back to FALLBACKS → empty string so raw tokens never reach customers.
 */
export function injectVariables(
  template: string,
  data: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      return typeof value === "number" ? value.toLocaleString() : String(value);
    }
    return FALLBACKS[key] ?? "";
  });
}

/**
 * Convert plain text (with `\n\n` paragraph breaks and `\n` line breaks)
 * into email-safe HTML with simple inline styles.
 */
export function textToHtml(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  const html = paragraphs
    .map((p) => {
      const inner = p
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        // Auto-link bare URLs
        .replace(
          /(https?:\/\/[^\s<]+)/g,
          '<a href="$1" style="color:#0D9488;text-decoration:underline;">$1</a>'
        );
      return `<p style="margin:0 0 16px 0;line-height:1.6;color:#333333;">${inner}</p>`;
    })
    .join("\n");

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;">\n${html}\n</div>`;
}
