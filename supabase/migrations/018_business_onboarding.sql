-- Add onboarding tracking to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Backfill: mark existing businesses as already onboarded
UPDATE businesses SET onboarding_completed = true WHERE onboarding_completed = false;

-- Add job value and referral percentage to services for onboarding flow
ALTER TABLE services ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS job_value numeric(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS referral_percentage numeric(4,1);

-- Drop restrictive industry check constraint if it exists
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS companies_industry_check;
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_industry_check;
