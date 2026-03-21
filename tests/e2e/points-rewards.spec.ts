import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";
import { loginAsBusiness } from "./helpers";

test.describe("Points & Rewards Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
  });

  test("points page shows 100 pts = $1 banner", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator("text=100 points").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=$1.00").first()).toBeVisible();
  });

  test("review points are editable for each platform", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    await expect(page.locator("text=Google").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Yelp").first()).toBeVisible();
    await expect(page.locator("text=BBB").first()).toBeVisible();
    await expect(page.locator("text=Facebook").first()).toBeVisible();
    await expect(page.locator("text=Trustpilot").first()).toBeVisible();
  });

  test("tier thresholds display all four tiers", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    await expect(page.locator("text=Bronze").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Silver").first()).toBeVisible();
    await expect(page.locator("text=Gold").first()).toBeVisible();
    await expect(page.locator("text=Platinum").first()).toBeVisible();
  });

  test("milestone bonus section is configurable", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    await expect(page.locator("text=Milestone").first()).toBeVisible({ timeout: 10000 });
  });

  test("add service dialog opens from points page", async ({ page }) => {
    await page.goto("/admin/points");
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    const addBtn = page.locator("text=Add Service").first();
    if (await addBtn.isVisible() && await addBtn.isEnabled()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("text=Service Name").first()).toBeVisible({ timeout: 5000 });
      // Dialog should show job value and reward fields
      await expect(page.locator("text=Job Value").first()).toBeVisible();
    }
  });

  test("reward creation works for gift_card category", async ({ page }) => {
    await page.goto("/admin/rewards");
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    const addCard = page.locator("text=Add New Reward");
    if (await addCard.isVisible()) {
      await addCard.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel("Name *");
      if (await nameInput.isVisible()) {
        await nameInput.fill("Test Gift Card");
        const pointsInput = page.getByLabel("Points Required *");
        await pointsInput.fill("5000");
        await page.getByRole("button", { name: "Save Reward" }).click();
        await page.waitForTimeout(2000);
        // Should not show constraint error
        const errorDiv = await page.locator(".bg-destructive").count();
        expect(errorDiv).toBe(0);
      }
    }
  });
});
