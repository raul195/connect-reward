import { test, expect } from "@playwright/test";

test.describe("Dashboard Pages (unauthenticated)", () => {
  test("admin dashboard requires auth", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(3000);
    // Should show spinner or redirect to login
    const url = page.url();
    const hasLogin = url.includes("/login");
    const hasSpinner = await page.locator(".animate-spin").count();
    expect(hasLogin || hasSpinner > 0).toBeTruthy();
  });

  test("customer dashboard does not show data without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(5000);
    // Without auth, customer layout shows nothing useful — no points, no referrals
    const hasPoints = await page.locator("text=Available Points").count();
    const hasLogin = page.url().includes("/login");
    // Either redirected to login or shows empty/loading state
    expect(hasLogin || hasPoints === 0).toBeTruthy();
  });

  test("super-admin requires auth", async ({ page }) => {
    await page.goto("/super-admin");
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasLogin = url.includes("/login");
    const hasSpinner = await page.locator(".animate-spin").count();
    expect(hasLogin || hasSpinner > 0).toBeTruthy();
  });

  test("admin onboarding requires auth", async ({ page }) => {
    await page.goto("/admin/onboarding");
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasLogin = url.includes("/login");
    const hasSpinner = await page.locator(".animate-spin").count();
    expect(hasLogin || hasSpinner > 0).toBeTruthy();
  });
});
