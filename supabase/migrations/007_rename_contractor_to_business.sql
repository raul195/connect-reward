-- Rename user_role enum values: contractor → business, contractor_owner → business_owner
-- This migration updates the live database to match the codebase rename.

ALTER TYPE user_role RENAME VALUE 'contractor' TO 'business';
ALTER TYPE user_role RENAME VALUE 'contractor_owner' TO 'business_owner';
