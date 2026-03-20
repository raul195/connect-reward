import { test, expect } from "@playwright/test";

test.describe("Webhooks & Cron Security", () => {
  test("Stripe webhook rejects without signature", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      data: {},
    });
    // Should reject — no valid signature
    expect([400, 500]).toContain(res.status());
  });

  test("Resend webhook rejects without headers", async ({ request }) => {
    const res = await request.post("/api/webhooks/resend", {
      data: { type: "email.bounced", data: {} },
    });
    expect([400, 500]).toContain(res.status());
  });

  test("process-automations cron rejects without secret", async ({ request }) => {
    const res = await request.post("/api/cron/process-automations");
    expect(res.status()).toBe(401);
  });

  test("send-approved cron rejects without secret", async ({ request }) => {
    const res = await request.post("/api/cron/send-approved");
    expect(res.status()).toBe(401);
  });

  test("process-promotions cron rejects without secret", async ({ request }) => {
    const res = await request.post("/api/cron/process-promotions");
    expect(res.status()).toBe(401);
  });

  test("publish-blog cron rejects without secret", async ({ request }) => {
    const res = await request.post("/api/cron/publish-blog");
    expect(res.status()).toBe(401);
  });

  test("process-tickets cron rejects without secret", async ({ request }) => {
    const res = await request.post("/api/cron/process-tickets");
    expect(res.status()).toBe(401);
  });
});
