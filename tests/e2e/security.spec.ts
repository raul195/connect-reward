import { test, expect } from "@playwright/test";

test.describe("Security — API Authentication & Authorization", () => {
  // All admin APIs require auth
  const ADMIN_ROUTES = [
    "/api/admin/dashboard",
    "/api/admin/rewards",
    "/api/admin/customers",
    "/api/admin/referrals",
    "/api/admin/promotions",
    "/api/admin/team",
    "/api/admin/settings",
    "/api/admin/billing",
    "/api/admin/redemptions",
    "/api/admin/reports",
    "/api/admin/imports",
    "/api/admin/review-links",
    "/api/admin/emails",
    "/api/admin/support",
    "/api/admin/onboarding",
    "/api/admin/feedback",
  ];

  for (const route of ADMIN_ROUTES) {
    test(`unauthenticated: ${route} returns 401`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status()).toBe(401);
    });
  }

  // All customer APIs require auth
  const CUSTOMER_ROUTES = [
    "/api/customer/dashboard",
    "/api/customer/rewards",
    "/api/customer/referrals",
    "/api/customer/points",
    "/api/customer/achievements",
    "/api/customer/leaderboard",
    "/api/customer/notifications",
    "/api/customer/promotions",
    "/api/customer/favorites",
    "/api/customer/redemptions",
    "/api/customer/profile",
  ];

  for (const route of CUSTOMER_ROUTES) {
    test(`unauthenticated: ${route} returns 401`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status()).toBe(401);
    });
  }

  // Super admin APIs require auth
  const SUPER_ADMIN_ROUTES = [
    "/api/super-admin/analytics",
    "/api/super-admin/revenue",
    "/api/super-admin/blog",
    "/api/super-admin/export",
  ];

  for (const route of SUPER_ADMIN_ROUTES) {
    test(`unauthenticated: ${route} returns 401`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status()).toBe(401);
    });
  }

  test("activation token cannot be reused (invalid token returns 404)", async ({ request }) => {
    const res = await request.get("/api/auth/activate?token=00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(404);
  });
});
