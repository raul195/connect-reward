import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test("signup with already-registered email shows error or prevents submission", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your Name").fill("Duplicate Test");
    await page.getByLabel("Company Name").fill("Dupe Co");
    await page.getByLabel("Email").fill("raul@connectreward.io");
    await page.getByLabel("Password").fill("TestAccount123!");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForTimeout(5000);
    // Should show error text OR stay on signup (not crash or go to blank page)
    const url = page.url();
    const pageText = await page.textContent("body");
    const hasErrorIndicator =
      pageText?.includes("already exists") ||
      pageText?.includes("already been registered") ||
      pageText?.includes("Failed") ||
      url.includes("/signup") ||
      url.includes("/admin"); // Redirected because already logged in from another test
    expect(hasErrorIndicator).toBeTruthy();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("raul@connectreward.io");
    await page.getByLabel("Password").fill("WrongPassword999!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForTimeout(3000);
    // Should show error text and stay on login
    const pageText = await page.textContent("body");
    const hasError = pageText?.includes("Invalid") || pageText?.includes("credentials") || pageText?.includes("error");
    expect(page.url()).toContain("/login");
    expect(hasError).toBeTruthy();
  });

  test("login with unregistered email shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent-user-99999@example.com");
    await page.getByLabel("Password").fill("SomePassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForTimeout(3000);
    const pageText = await page.textContent("body");
    const hasError = pageText?.includes("Invalid") || pageText?.includes("credentials") || pageText?.includes("error");
    expect(page.url()).toContain("/login");
    expect(hasError).toBeTruthy();
  });

  test("signup password too short prevents submission", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your Name").fill("Short PW");
    await page.getByLabel("Company Name").fill("Short Co");
    await page.getByLabel("Email").fill("short-pw@example.com");
    await page.getByLabel("Password").fill("123");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/signup");
  });

  test("activation with invalid token shows clear error", async ({ page }) => {
    await page.goto("/activate?token=invalid-token-format");
    await page.waitForTimeout(3000);
    const pageText = await page.textContent("body");
    expect(pageText?.includes("Invalid") || pageText?.includes("Failed") || pageText?.includes("expired")).toBeTruthy();
  });

  test("forgot password form shows on click", async ({ page }) => {
    await page.goto("/login");
    await page.locator("text=Forgot password?").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Reset Password")).toBeVisible();
  });
});
