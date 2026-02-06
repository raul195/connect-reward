-- ============================================================
-- RLS Policy Test Queries
-- Run these in the Supabase SQL Editor to verify RLS policies.
-- Replace UUIDs with actual values from your database.
-- ============================================================

-- ============================================================
-- TEST 1: Customer A cannot see Customer B's data
-- ============================================================
-- Set role to Customer A
-- SELECT set_config('request.jwt.claim.sub', '<customer_a_uuid>', true);

-- Should return only Customer A's referrals
-- SELECT * FROM referrals WHERE referrer_id = '<customer_a_uuid>';

-- Should NOT return Customer B's referrals
-- SELECT * FROM referrals WHERE referrer_id = '<customer_b_uuid>';
-- Expected: 0 rows (blocked by RLS)

-- ============================================================
-- TEST 2: Customer cannot see other companies' data
-- ============================================================
-- Customer in Company 1 should not see Company 2's rewards
-- SELECT * FROM rewards WHERE company_id = '<company_2_uuid>';
-- Expected: 0 rows

-- ============================================================
-- TEST 3: Contractor can only see their own company's data
-- ============================================================
-- As contractor of Company 1:
-- SELECT * FROM profiles WHERE company_id = '<company_1_uuid>';
-- Expected: Returns profiles from Company 1

-- SELECT * FROM profiles WHERE company_id = '<company_2_uuid>';
-- Expected: 0 rows

-- ============================================================
-- TEST 4: Super admin can access everything
-- ============================================================
-- As super_admin:
-- SELECT count(*) FROM companies;
-- Expected: Returns total count of all companies

-- SELECT count(*) FROM early_access_applications;
-- Expected: Returns total count of all applications

-- ============================================================
-- TEST 5: Public can INSERT early_access_applications
-- ============================================================
-- As anon role:
-- INSERT INTO early_access_applications (full_name, email, company_name, industry, company_size)
-- VALUES ('Test User', 'test@example.com', 'Test Co', 'solar', 'solo');
-- Expected: Succeeds

-- Anon should NOT be able to read applications
-- SELECT * FROM early_access_applications;
-- Expected: 0 rows (anon can't read, only super_admin can)

-- ============================================================
-- TEST 6: Point transactions integrity
-- ============================================================
-- Verify a user's total_points matches their transaction sum
-- SELECT
--   p.id, p.total_points,
--   COALESCE(SUM(pt.amount), 0) AS calculated_total
-- FROM profiles p
-- LEFT JOIN point_transactions pt ON pt.profile_id = p.id
-- WHERE p.role = 'customer'
-- GROUP BY p.id, p.total_points
-- HAVING p.total_points != COALESCE(SUM(pt.amount), 0);
-- Expected: 0 rows (no mismatches)

-- ============================================================
-- TEST 7: Users without company_id
-- ============================================================
-- A user with NULL company_id should not see any company data
-- SELECT * FROM referrals;
-- Expected: 0 rows (no company_id match)

-- ============================================================
-- TEST 8: Notifications are private
-- ============================================================
-- Customer A should only see their own notifications
-- SELECT * FROM notifications WHERE profile_id != '<current_user_uuid>';
-- Expected: 0 rows
