export const TEST_BUSINESS = {
  email: "test-e2e-business@connectreward.io",
  password: "TestAccount123!",
  name: "E2E Test Owner",
  companyName: "E2E Test Solar Co",
};

export const TEST_CUSTOMER = {
  email: "test-e2e-customer@connectreward.io",
  password: "TestAccount123!",
  name: "E2E Test Customer",
  phone: "5551234567",
};

/*
 * BEFORE RUNNING DEEP TESTS:
 *
 * 1. Start the dev server: npm run dev
 * 2. Clean up previous test data in Supabase SQL Editor:
 *
 * DELETE FROM customer_favorites WHERE customer_id IN (SELECT id FROM profiles WHERE email = 'test-e2e-customer@connectreward.io');
 * DELETE FROM redemptions WHERE user_id IN (SELECT id FROM profiles WHERE email = 'test-e2e-customer@connectreward.io');
 * DELETE FROM point_transactions WHERE user_id IN (SELECT id FROM profiles WHERE email = 'test-e2e-customer@connectreward.io');
 * DELETE FROM referrals WHERE company_id IN (SELECT id FROM companies WHERE slug LIKE 'e2e-test-%');
 * DELETE FROM rewards WHERE company_id IN (SELECT id FROM companies WHERE slug LIKE 'e2e-test-%');
 * DELETE FROM services WHERE company_id IN (SELECT id FROM companies WHERE slug LIKE 'e2e-test-%');
 * DELETE FROM email_automation_triggers WHERE company_id IN (SELECT id FROM companies WHERE slug LIKE 'e2e-test-%');
 * DELETE FROM automation_settings WHERE company_id IN (SELECT id FROM companies WHERE slug LIKE 'e2e-test-%');
 * DELETE FROM companies WHERE slug LIKE 'e2e-test-%';
 * DELETE FROM profiles WHERE email IN ('test-e2e-business@connectreward.io', 'test-e2e-customer@connectreward.io');
 * DELETE FROM auth.users WHERE email IN ('test-e2e-business@connectreward.io', 'test-e2e-customer@connectreward.io');
 *
 * 3. Run tests: npx playwright test
 */
