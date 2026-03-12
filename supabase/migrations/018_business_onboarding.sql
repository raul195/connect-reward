-- Add onboarding tracking to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Backfill: mark existing companies as already onboarded
UPDATE companies SET onboarding_completed = true WHERE onboarding_completed = false;

-- Add job value and referral percentage to services for onboarding flow
ALTER TABLE services ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS job_value numeric(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS referral_percentage numeric(4,1);
