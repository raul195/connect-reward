import { test, expect } from "@playwright/test";

test.describe("Rewards & Points API", () => {
  test("rewards API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/rewards");
    expect(res.status()).toBe(401);
  });

  test("redemptions API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/redemptions");
    expect(res.status()).toBe(401);
  });

  test("customer rewards API requires auth", async ({ request }) => {
    const res = await request.get("/api/customer/rewards");
    expect(res.status()).toBe(401);
  });

  test("customer favorites API requires auth", async ({ request }) => {
    const res = await request.get("/api/customer/favorites");
    expect(res.status()).toBe(401);
  });

  test("customer redemptions API requires auth", async ({ request }) => {
    const res = await request.get("/api/customer/redemptions");
    expect(res.status()).toBe(401);
  });

  test("settings API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/settings");
    expect(res.status()).toBe(401);
  });

  test("customers API requires auth for POST", async ({ request }) => {
    const res = await request.post("/api/customers", {
      data: { full_name: "Test", email: "test@test.com", phone: "1234567890" },
    });
    expect(res.status()).toBe(401);
  });

  test("imports API requires auth", async ({ request }) => {
    const res = await request.post("/api/admin/imports", {
      data: { rows: [], mapping: {}, sendWelcome: false, filename: "test.csv" },
    });
    expect(res.status()).toBe(401);
  });

  test("referrals API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/referrals");
    expect(res.status()).toBe(401);
  });

  test("promotions API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/promotions");
    expect(res.status()).toBe(401);
  });

  test("team API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/team");
    expect(res.status()).toBe(401);
  });

  test("billing API requires auth", async ({ request }) => {
    const res = await request.get("/api/admin/billing");
    expect(res.status()).toBe(401);
  });

  test("super-admin blog API requires auth", async ({ request }) => {
    const res = await request.get("/api/super-admin/blog");
    expect(res.status()).toBe(401);
  });

  test("super-admin revenue API requires auth", async ({ request }) => {
    const res = await request.get("/api/super-admin/revenue");
    expect(res.status()).toBe(401);
  });
});
