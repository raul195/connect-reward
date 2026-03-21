import { Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // Wait for navigation away from login
  await page.waitForTimeout(3000);
}

export async function loginAsBusiness(page: Page, email: string, password: string) {
  await login(page, email, password);
  // Should end up on /admin or /admin/onboarding
  // Allow extra time for cold start (profile + company fetch)
  await page.waitForURL(/\/admin/, { timeout: 20000 });
}

export async function loginAsCustomer(page: Page, email: string, password: string) {
  await login(page, email, password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

export async function expectNoErrors(page: Page) {
  // Check no error toasts or error divs are visible
  const errorDiv = await page.locator(".bg-destructive\\/10").count();
  expect(errorDiv).toBe(0);
}
