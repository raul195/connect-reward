import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Connect Reward").first()).toBeVisible();
  });

  test("how-it-works page loads", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.locator("text=How Connect Reward Works")).toBeVisible();
  });

  test("faq page loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("text=Frequently Asked Questions")).toBeVisible();
  });

  test("blog page loads", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("text=The Referral Rewards Blog")).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveURL(/\/privacy/);
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).toHaveURL(/\/terms/);
  });

  test("solar industry page loads", async ({ page }) => {
    await page.goto("/solar");
    await expect(page.locator("text=Solar").first()).toBeVisible();
  });

  test("roofing industry page loads", async ({ page }) => {
    await page.goto("/roofing");
    await expect(page.locator("text=Roofing").first()).toBeVisible();
  });

  test("activate page shows error without token", async ({ page }) => {
    await page.goto("/activate");
    await expect(page.locator("text=Missing activation token")).toBeVisible();
  });

  test("navbar has correct links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[href='/how-it-works']").first()).toBeVisible();
    await expect(page.locator("a[href='/faq']").first()).toBeVisible();
    await expect(page.locator("a[href='/blog']").first()).toBeVisible();
    await expect(page.locator("a[href='/signup']").first()).toBeVisible();
  });

  test("404 page shows for invalid routes", async ({ page }) => {
    await page.goto("/this-does-not-exist-12345");
    await expect(page.locator("text=404")).toBeVisible();
  });
});
