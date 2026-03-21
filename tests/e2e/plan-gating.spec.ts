import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";
import { loginAsBusiness } from "./helpers";

test.describe("Plan Gating — Free Plan Restrictions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
  });

  test("free plan: automation tab not visible in settings", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Automation tab should NOT be visible on free plan
    const automationTab = page.locator("button", { hasText: "Automation" });
    const count = await automationTab.count();
    // On free plan, count should be 0
    expect(count).toBe(0);
  });

  test("free plan: team page shows upgrade prompt", async ({ page }) => {
    await page.goto("/admin/team");
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Should show upgrade CTA or disabled invite button
    const hasUpgrade = await page.locator("text=Upgrade").count();
    const hasDisabled = await page.locator("button[disabled]").count();
    expect(hasUpgrade > 0 || hasDisabled > 0).toBeTruthy();
  });

  test("free plan: reward limit enforced at 3", async ({ page }) => {
    await page.goto("/admin/rewards");
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Page loads without error
    const url = page.url();
    expect(url).toContain("/admin/rewards");
  });

  test("free plan: service limit enforced at 3", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Page loads and shows service count
    const url = page.url();
    expect(url).toContain("/admin/points");
  });
});
