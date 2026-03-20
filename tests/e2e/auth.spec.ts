import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("signup page loads without error", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Get Started Free")).toBeVisible();
    await expect(page.locator("text=Create Account")).toBeVisible();
  });

  test("login page loads without error", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Welcome Back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("login page has forgot password link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Forgot password?")).toBeVisible();
  });

  test("login page has signup link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Sign up free")).toBeVisible();
  });

  test("signup page has login link", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Sign in")).toBeVisible();
  });

  test("unauthenticated user on /admin sees login redirect or spinner", async ({ page }) => {
    await page.goto("/admin");
    // Should either redirect to /login or show a spinner (layout handles auth)
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasLogin = url.includes("/login");
    const hasSpinner = await page.locator(".animate-spin").count();
    expect(hasLogin || hasSpinner > 0).toBeTruthy();
  });
});
