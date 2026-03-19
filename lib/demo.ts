export const DEMO_EMAIL_DOMAIN = "@connectreward.io";
export const DEMO_COMPANY_SLUG = "demo-solar-co";

// Super admin emails that should NOT be treated as demo accounts
const SUPER_ADMIN_EMAILS = ["raul@connectreward.io"];

export function isDemoAccount(email: string | undefined | null): boolean {
  if (!email) return false;
  if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) return false;
  return email.endsWith(DEMO_EMAIL_DOMAIN);
}
