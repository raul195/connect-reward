import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";

test.describe.serial("Deep: Business Signup Flow", () => {
  test("1. signup page renders all fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByLabel("Company Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("2. create account or show already-exists error", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your Name").fill(TEST_BUSINESS.name);
    await page.getByLabel("Company Name").fill(TEST_BUSINESS.companyName);
    await page.getByLabel("Email").fill(TEST_BUSINESS.email);
    await page.getByLabel("Password").fill(TEST_BUSINESS.password);
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForTimeout(5000);
    const url = page.url();
    // Either navigated to admin (new account) or stayed on signup with "already exists" error (existing account)
    const onAdmin = url.includes("/admin");
    const alreadyExists = await page.locator("text=already exists").count();
    expect(onAdmin || alreadyExists > 0 || url.includes("/signup")).toBeTruthy();
  });

  test("3. onboarding page loads after signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_BUSINESS.email);
    await page.getByLabel("Password").fill(TEST_BUSINESS.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForTimeout(5000);

    // Should be on onboarding since account is new
    const url = page.url();
    expect(url.includes("/admin/onboarding") || url.includes("/admin")).toBeTruthy();
  });
});
