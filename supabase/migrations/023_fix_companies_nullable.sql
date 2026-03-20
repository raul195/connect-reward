-- Fix companies columns to allow signup without onboarding data
-- These fields are collected during onboarding, not at signup

-- Make industry nullable (collected in onboarding step 1)
ALTER TABLE companies ALTER COLUMN industry DROP NOT NULL;
ALTER TABLE companies ALTER COLUMN industry SET DEFAULT NULL;

-- Ensure other columns have sensible defaults for signup
ALTER TABLE companies ALTER COLUMN logo_url SET DEFAULT NULL;
ALTER TABLE companies ALTER COLUMN branding SET DEFAULT NULL;
ALTER TABLE companies ALTER COLUMN customer_count SET DEFAULT 0;
ALTER TABLE companies ALTER COLUMN is_active SET DEFAULT true;
