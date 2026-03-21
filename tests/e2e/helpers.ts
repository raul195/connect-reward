import { Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

export async function loginAsBusiness(page: Page, email: string, password: string) {
  await login(page, email, password);
  // Wait for URL to reach /admin (login redirect complete)
  await page.waitForURL(/\/admin/, { timeout: 30000 });
  // Wait for page content to render — look for sidebar nav or dashboard content
  // This ensures useProfile has finished loading
  await page.waitForSelector("nav, [data-slot='card'], h1", { timeout: 30000 });
}

export async function loginAsCustomer(page: Page, email: string, password: string) {
  await login(page, email, password);
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForSelector("nav, [data-slot='card'], h1", { timeout: 30000 });
}

export async function expectNoErrors(page: Page) {
  const errorDiv = await page.locator("[class*='destructive']").count();
  expect(errorDiv).toBe(0);
}
