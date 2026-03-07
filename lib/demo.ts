export const DEMO_EMAIL_DOMAIN = "@connectreward.io";
export const DEMO_COMPANY_SLUG = "demo-solar-co";

export function isDemoAccount(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.endsWith(DEMO_EMAIL_DOMAIN);
}
