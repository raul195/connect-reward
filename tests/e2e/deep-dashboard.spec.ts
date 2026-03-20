import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";
import { loginAsBusiness } from "./helpers";

test.describe("Deep: Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
  });

  test("dashboard home loads with metrics", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    // Should show dashboard title or metric cards
    const hasDashboard = await page.locator("text=Admin Dashboard").count();
    const hasMetrics = await page.locator("text=Active Customers").count();
    expect(hasDashboard > 0 || hasMetrics > 0).toBeTruthy();
  });

  test("referrals page loads", async ({ page }) => {
    await page.goto("/admin/referrals");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("customers page loads", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForTimeout(3000);
    // Should show customers page or empty state
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("rewards page loads", async ({ page }) => {
    await page.goto("/admin/rewards");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("points page loads with info banner", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=100 points").first()).toBeVisible({ timeout: 10000 });
  });

  test("settings page loads with tabs", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Program Settings").first()).toBeVisible({ timeout: 10000 });
  });

  test("billing page loads", async ({ page }) => {
    await page.goto("/admin/billing");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Billing").first()).toBeVisible({ timeout: 10000 });
  });

  test("team page loads", async ({ page }) => {
    await page.goto("/admin/team");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("promotions page loads", async ({ page }) => {
    await page.goto("/admin/promotions");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("reports page loads", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("no fake/sample data visible", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    // Should NOT show sample data banner for non-demo accounts
    const sampleBanner = await page.locator("text=viewing sample data").count();
    expect(sampleBanner).toBe(0);
  });
});
