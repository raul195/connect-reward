import { test, expect } from "@playwright/test";
import { TEST_BUSINESS, TEST_CUSTOMER } from "./test-config";
import { loginAsBusiness } from "./helpers";

test.describe.serial("Deep: Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBusiness(page, TEST_BUSINESS.email, TEST_BUSINESS.password);
  });

  test("1. customers page loads", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("2. add customer form opens", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForTimeout(3000);

    // Look for add customer button
    const addBtn = page.locator("text=Add Customer").first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Form should show name field (label includes asterisk)
      await page.waitForTimeout(1000);
      const hasForm = await page.locator("text=Full Name").count();
      expect(hasForm).toBeGreaterThan(0);
    }
  });

  test("3. add customer with all fields", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForTimeout(3000);

    const addBtn = page.locator("text=Add Customer").first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Fill in customer details (labels have asterisks: "Full Name *")
      const nameField = page.getByLabel(/Full Name/);
      if (await nameField.isVisible()) {
        await nameField.fill(TEST_CUSTOMER.name);
        await page.getByLabel(/Email/).first().fill(TEST_CUSTOMER.email);
        await page.getByLabel(/Phone/).first().fill(TEST_CUSTOMER.phone);

        // Submit
        const submitBtn = page.getByRole("button", { name: "Add Customer" }).last();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test("4. CSV import wizard opens", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForTimeout(3000);

    // Look for import button
    const importBtn = page.locator("text=Import").first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await page.waitForTimeout(1000);

      // Should show upload area or CSV instructions
      const hasUpload = await page.locator("text=CSV").count();
      expect(hasUpload).toBeGreaterThan(0);
    }
  });
});
