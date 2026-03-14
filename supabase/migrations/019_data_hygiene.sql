-- ============================================================
-- Data Hygiene: column renames, missing columns, last_active
-- ============================================================

-- 1. Rename profile_id → user_id on redemptions & point_transactions
--    (all application code already uses user_id)
ALTER TABLE redemptions RENAME COLUMN profile_id TO user_id;
ALTER TABLE point_transactions RENAME COLUMN profile_id TO user_id;

-- Update indexes to match new column name
DROP INDEX IF EXISTS idx_redemptions_profile;
CREATE INDEX idx_redemptions_user ON redemptions (user_id);

DROP INDEX IF EXISTS idx_point_tx_profile;
CREATE INDEX idx_point_tx_user ON point_transactions (user_id);

-- 2. Add points_spent to redemptions (code already inserts this)
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS points_spent INTEGER NOT NULL DEFAULT 0;

-- 3. Add fulfillment_notes to redemptions (referenced in types)
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

-- 4. Add last_active to companies for activity tracking
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- Backfill last_active from updated_at for existing rows
UPDATE companies SET last_active = updated_at WHERE last_active IS NULL;
