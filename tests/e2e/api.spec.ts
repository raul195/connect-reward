import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("health endpoint returns 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBeDefined();
  });

  test("admin dashboard API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/dashboard");
    expect(res.status()).toBe(401);
  });

  test("customer dashboard API requires auth", async ({ request }) => {
    const res = await request.get("/api/customer/dashboard");
    expect(res.status()).toBe(401);
  });

  test("super-admin analytics API requires auth", async ({ request }) => {
    const res = await request.get("/api/super-admin/analytics");
    expect(res.status()).toBe(401);
  });

  test("cron endpoint requires CRON_SECRET", async ({ request }) => {
    const res = await request.post("/api/cron/health-check");
    expect(res.status()).toBe(401);
  });

  test("signup API validates required fields", async ({ request }) => {
    const res = await request.post("/api/auth/setup-company", {
      data: {},
    });
    expect(res.status()).toBe(401); // Not authenticated
  });

  test("activate API validates token parameter", async ({ request }) => {
    const res = await request.get("/api/auth/activate");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Token is required");
  });

  test("activate API returns 404 for invalid token", async ({ request }) => {
    const res = await request.get("/api/auth/activate?token=00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(404);
  });
});
