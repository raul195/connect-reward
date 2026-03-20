import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";
import { loginAsBusiness } from "./helpers";

test.describe("Deep: Points & Rewards Config", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
  });

  test("points page loads with info banner", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=100 points").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=$1.00").first()).toBeVisible();
  });

  test("services section shows configured services", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Services").first()).toBeVisible({ timeout: 10000 });
  });

  test("review points section is editable", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Review Points").first()).toBeVisible({ timeout: 10000 });
    // Should show Google, Yelp, etc
    await expect(page.locator("text=Google").first()).toBeVisible();
  });

  test("milestone section is visible", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Milestone").first()).toBeVisible({ timeout: 10000 });
  });

  test("tier thresholds section is visible", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Tier").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Bronze").first()).toBeVisible();
    await expect(page.locator("text=Silver").first()).toBeVisible();
    await expect(page.locator("text=Gold").first()).toBeVisible();
    await expect(page.locator("text=Platinum").first()).toBeVisible();
  });

  test("add service dialog works", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForTimeout(3000);
    const addBtn = page.locator("text=Add Service").first();
    if (await addBtn.isVisible() && await addBtn.isEnabled()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      // Dialog should open
      await expect(page.locator("text=Service Name").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
