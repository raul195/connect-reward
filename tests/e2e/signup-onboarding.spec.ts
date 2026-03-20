import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";

test.describe("Signup & Onboarding Flow", () => {
  test.beforeAll(async ({ request }) => {
    // Clean up test account if it exists (via Supabase admin)
    // This runs before the test suite
  });

  test("signup form validates required fields", async ({ page }) => {
    await page.goto("/signup");

    // Try submitting with empty fields
    await page.getByRole("button", { name: "Create Account" }).click();

    // HTML5 validation should prevent submission — form should still be visible
    await expect(page.locator("text=Get Started Free")).toBeVisible();
  });

  test("signup form prevents short passwords", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("Your Name").fill("Test User");
    await page.getByLabel("Company Name").fill("Test Co");
    await page.getByLabel("Email").fill("short-pw-test@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create Account" }).click();

    // HTML5 minLength validation or JS validation prevents submission
    // Either way, the signup form should still be visible (not navigated away)
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Get Started Free")).toBeVisible();
  });

  test("signup page has all required form fields", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByLabel("Company Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });
});
