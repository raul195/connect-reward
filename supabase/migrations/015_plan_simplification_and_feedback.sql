-- 015: Plan simplification (free + beta) and feedback survey
-- Adds 'beta' enum value, migrates existing paid plans, creates feedback_responses table

-- 1. Ensure plan_tier enum exists (in case migrations were applied out of order)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'growth', 'pro', 'beta');
  ELSE
    ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'beta';
  END IF;
END
$$;

-- 2. Drop check constraint on plan_tier if it exists (may have been added outside migrations)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_plan_tier_check;

-- 3. Migrate existing paid plans to 'beta'
-- Note: 'starter', 'growth', 'pro' remain in the DB enum (Postgres can't remove enum values)
-- but TypeScript enforces "free" | "beta" only.
UPDATE companies SET plan_tier = 'beta' WHERE plan_tier IN ('starter', 'growth', 'pro');

-- 3. Create feedback_responses table
CREATE TABLE IF NOT EXISTS feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  improvements text,
  likes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_responses_company_id ON feedback_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_profile_id ON feedback_responses(profile_id);

-- 5. RLS
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Business admins can INSERT their own company's feedback
CREATE POLICY feedback_insert_own ON feedback_responses
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('business', 'business_owner', 'business_manager')
    )
  );

-- Business admins can SELECT their own company's feedback
CREATE POLICY feedback_select_own ON feedback_responses
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('business', 'business_owner', 'business_manager')
    )
  );

-- Super admins can SELECT all feedback
CREATE POLICY feedback_select_super_admin ON feedback_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- 6. Updated_at trigger (not needed here since feedback_responses has no updated_at)
