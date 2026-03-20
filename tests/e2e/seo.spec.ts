import { test, expect } from "@playwright/test";

test.describe("SEO & Meta Tags", () => {
  test("homepage has correct title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("Connect Reward");
  });

  test("homepage has OG meta tags", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDesc).toBeTruthy();
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("og-image.png");
  });

  test("homepage has Twitter card meta tags", async ({ page }) => {
    await page.goto("/");
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");
  });

  test("homepage has JSON-LD schema", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator('script[type="application/ld+json"]').count();
    expect(scripts).toBeGreaterThan(0);
  });

  test("how-it-works has correct title", async ({ page }) => {
    await page.goto("/how-it-works");
    const title = await page.title();
    expect(title).toContain("How Connect Reward Works");
  });

  test("faq has correct title", async ({ page }) => {
    await page.goto("/faq");
    const title = await page.title();
    expect(title).toContain("Frequently Asked Questions");
  });

  test("blog has correct title", async ({ page }) => {
    await page.goto("/blog");
    const title = await page.title();
    expect(title).toContain("Blog");
  });

  test("robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("Sitemap");
    expect(text).toContain("Disallow: /dashboard");
    expect(text).toContain("Disallow: /admin");
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("<urlset");
    expect(text).toContain("/how-it-works");
    expect(text).toContain("/faq");
    expect(text).toContain("/blog");
    expect(text).toContain("/solar");
  });
});
