import { test, expect } from "@playwright/test";

// iPhone 14 viewport
const MOBILE = { width: 390, height: 844 };

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: MOBILE });

  test("homepage loads on mobile without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test("signup form usable on mobile", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByLabel("Company Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("login form usable on mobile", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("navbar hamburger menu works on mobile", async ({ page }) => {
    await page.goto("/");
    // Hamburger menu button should be visible on mobile
    const menuBtn = page.locator("button[aria-label='Toggle menu']");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await page.waitForTimeout(500);
    // Menu should show navigation links
    await expect(page.locator("text=How It Works").last()).toBeVisible();
    await expect(page.locator("text=FAQ").last()).toBeVisible();
    await expect(page.locator("text=Blog").last()).toBeVisible();
  });

  test("how-it-works page readable on mobile", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.locator("h1").first()).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("faq page readable on mobile", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("text=Frequently Asked Questions")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("blog page readable on mobile", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("text=The Referral Rewards Blog")).toBeVisible();
  });

  test("industry page readable on mobile", async ({ page }) => {
    await page.goto("/solar");
    await expect(page.locator("h1").first()).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("activate page usable on mobile", async ({ page }) => {
    await page.goto("/activate");
    await expect(page.locator("text=Missing activation token")).toBeVisible();
  });
});
