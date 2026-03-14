-- ============================================================
-- Data Hygiene: column renames, missing columns, last_active
-- ============================================================

-- 1. Rename profile_id → user_id on redemptions & point_transactions
--    (all application code already uses user_id)
--    Guarded so it's safe to re-run if columns were already renamed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'redemptions' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE redemptions RENAME COLUMN profile_id TO user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'point_transactions' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE point_transactions RENAME COLUMN profile_id TO user_id;
  END IF;
END $$;

-- Update RLS policies to use new column name (drop old, create new)
DO $$
BEGIN
  -- Redemptions: users see own
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'redemptions' AND policyname = 'Users manage own redemptions'
  ) THEN
    DROP POLICY "Users manage own redemptions" ON redemptions;
  END IF;
  CREATE POLICY "Users manage own redemptions"
    ON redemptions FOR ALL
    USING (user_id = auth.uid());

  -- Point transactions: users see own
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'point_transactions' AND policyname = 'Users read own transactions'
  ) THEN
    DROP POLICY "Users read own transactions" ON point_transactions;
  END IF;
  CREATE POLICY "Users read own transactions"
    ON point_transactions FOR SELECT
    USING (user_id = auth.uid());
END $$;

-- Update indexes to match new column name
DROP INDEX IF EXISTS idx_redemptions_profile;
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions (user_id);

DROP INDEX IF EXISTS idx_point_tx_profile;
CREATE INDEX IF NOT EXISTS idx_point_tx_user ON point_transactions (user_id);

-- 2. Add points_spent to redemptions (code already inserts this)
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS points_spent INTEGER DEFAULT 0;

-- 3. Add fulfillment_notes to redemptions (referenced in types)
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

-- 4. Add last_active to companies for activity tracking
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- Backfill last_active from updated_at for existing rows
UPDATE companies SET last_active = updated_at WHERE last_active IS NULL;
