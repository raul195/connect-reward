import { test, expect } from "@playwright/test";

const INDUSTRIES = [
  { slug: "solar", name: "Solar" },
  { slug: "roofing", name: "Roofing" },
  { slug: "hvac", name: "HVAC" },
  { slug: "pest-control", name: "Pest Control" },
  { slug: "windows", name: "Windows" },
  { slug: "landscaping", name: "Landscaping" },
  { slug: "window-washing", name: "Window Washing" },
  { slug: "plumbing", name: "Plumbing" },
  { slug: "electrical", name: "Electrical" },
  { slug: "gutters", name: "Gutters" },
  { slug: "pool-service", name: "Pool Service" },
  { slug: "painting", name: "Painting" },
];

test.describe("Industry Landing Pages", () => {
  for (const industry of INDUSTRIES) {
    test(`/${industry.slug} page loads with correct content`, async ({ page }) => {
      await page.goto(`/${industry.slug}`);
      await expect(page.locator("h1").first()).toBeVisible();
      // Should have a signup CTA
      await expect(page.locator("a[href='/signup']").first()).toBeVisible();
      // Should have FAQ section
      await expect(page.locator("text=Frequently Asked Questions")).toBeVisible();
    });
  }

  test("industry pages have JSON-LD schema", async ({ page }) => {
    await page.goto("/solar");
    const scripts = await page.locator('script[type="application/ld+json"]').count();
    expect(scripts).toBeGreaterThan(0);
  });

  test("industry pages have signup CTA buttons", async ({ page }) => {
    await page.goto("/roofing");
    const ctaLinks = await page.locator("a[href='/signup']").count();
    expect(ctaLinks).toBeGreaterThan(0);
  });
});
