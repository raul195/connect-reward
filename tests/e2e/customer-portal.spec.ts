import { test, expect } from "@playwright/test";

test.describe("Customer Portal — Public Activation Flow", () => {
  test("activation page without token shows error", async ({ page }) => {
    await page.goto("/activate");
    await expect(page.locator("text=Missing activation token")).toBeVisible({ timeout: 5000 });
  });

  test("activation page with invalid token shows error", async ({ page }) => {
    await page.goto("/activate?token=00000000-0000-0000-0000-000000000000");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Invalid").first()).toBeVisible({ timeout: 5000 });
  });

  test("activation API rejects expired tokens", async ({ request }) => {
    const res = await request.get("/api/auth/activate?token=00000000-0000-0000-0000-000000000000");
    expect([404, 410]).toContain(res.status());
  });

  test("activation API rejects missing token", async ({ request }) => {
    const res = await request.get("/api/auth/activate");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Token is required");
  });

  test("activation API POST rejects without token", async ({ request }) => {
    const res = await request.post("/api/auth/activate", {
      data: { password: "Test1234!" },
    });
    expect(res.status()).toBe(400);
  });

  test("activation API POST rejects short password", async ({ request }) => {
    const res = await request.post("/api/auth/activate", {
      data: { token: "00000000-0000-0000-0000-000000000000", password: "short" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("8 characters");
  });
});
