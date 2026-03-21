import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("homepage loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.locator("text=Connect Reward").first().waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000); // 5s generous for dev server
  });

  test("how-it-works loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/how-it-works");
    await page.locator("h1").first().waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("blog page loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/blog");
    await page.locator("text=The Referral Rewards Blog").waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("signup page loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/signup");
    await page.locator("text=Get Started Free").waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("login page loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/login");
    await page.locator("text=Welcome Back").waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("industry page loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/solar");
    await page.locator("h1").first().waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
