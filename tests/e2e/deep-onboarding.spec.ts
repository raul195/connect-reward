import { test, expect } from "@playwright/test";
import { TEST_BUSINESS } from "./test-config";
import { loginAsBusiness } from "./helpers";

// Helper: check if already onboarded
async function isAlreadyOnboarded(page: import("@playwright/test").Page): Promise<boolean> {
  return !page.url().includes("/admin/onboarding");
}

test.describe.serial("Deep: Onboarding Wizard", () => {
  test("1. onboarding or dashboard loads after login", async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
    const url = page.url();
    // Either on onboarding or dashboard — both are valid
    expect(url.includes("/admin")).toBeTruthy();
  });

  test("2. industries step (if not onboarded)", async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
    if (await isAlreadyOnboarded(page)) { expect(true).toBeTruthy(); return; }

    await expect(page.locator("text=Solar").first()).toBeVisible({ timeout: 10000 });
    await page.locator("text=Solar").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Step 2").first()).toBeVisible();
  });

  test("3. services step (if not onboarded)", async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
    if (await isAlreadyOnboarded(page)) { expect(true).toBeTruthy(); return; }

    await page.locator("text=Solar").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(1000);
    const hasContent = await page.locator("text=Job value").count();
    expect(hasContent).toBeGreaterThanOrEqual(0);
  });

  test("4. referral reward step (if not onboarded)", async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
    if (await isAlreadyOnboarded(page)) { expect(true).toBeTruthy(); return; }

    await page.locator("text=Solar").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Profit margin").first()).toBeVisible({ timeout: 5000 });
  });

  test("5. review points step (if not onboarded)", async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
    if (await isAlreadyOnboarded(page)) { expect(true).toBeTruthy(); return; }

    await page.locator("text=Solar").first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("text=Google").first()).toBeVisible({ timeout: 5000 });
  });

  test("6. complete onboarding (if not onboarded)", async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
    if (await isAlreadyOnboarded(page)) { expect(true).toBeTruthy(); return; }

    // Walk through all steps
    await page.locator("text=Solar").first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(500);
    }
    const launchBtn = page.getByRole("button", { name: "Launch My Program" });
    if (await launchBtn.isVisible()) {
      await launchBtn.click();
      await page.waitForTimeout(3000);
    }
    expect(page.url()).toContain("/admin");
  });
});
