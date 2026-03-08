-- Rename role values: contractor → business across all role variants
-- The role column is TEXT with a CHECK constraint.
-- Must update data BEFORE adding the new constraint.

ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;

UPDATE profiles SET role = 'business_owner' WHERE role = 'contractor_owner';
UPDATE profiles SET role = 'business_manager' WHERE role = 'contractor_manager';
UPDATE profiles SET role = 'business_rep' WHERE role = 'contractor_rep';

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['super_admin', 'business', 'business_owner', 'business_manager', 'business_rep', 'customer']));
