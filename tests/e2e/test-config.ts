// Test account credentials — these must exist in your Supabase
// Run the setup SQL below before running authenticated tests

export const TEST_BUSINESS = {
  email: "test-business@connectreward.io",
  password: "TestBusiness123!",
  name: "Test Solar Co",
};

export const TEST_CUSTOMER = {
  email: "test-customer@connectreward.io",
  password: "TestCustomer123!",
  name: "Test Customer",
};

export const TEST_SUPER_ADMIN = {
  email: "raul@connectreward.io",
  password: "", // Fill in your actual password to run super-admin tests
};

/*
 * SETUP SQL — Run this in Supabase SQL Editor before running tests:
 *
 * -- Clean up any previous test accounts
 * DELETE FROM profiles WHERE email IN ('test-business@connectreward.io', 'test-customer@connectreward.io');
 * DELETE FROM auth.users WHERE email IN ('test-business@connectreward.io', 'test-customer@connectreward.io');
 *
 * The tests will create accounts via the signup flow.
 */
