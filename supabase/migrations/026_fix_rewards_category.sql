-- Fix rewards category constraint
-- The column was renamed from 'type' to 'category' in migration 020
-- but may still have a check constraint or enum restriction

-- Drop any check constraint on category
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_category_check;
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_type_check;

-- Change the column type from reward_type enum to TEXT to allow flexible categories
-- This avoids enum issues when new categories are needed
ALTER TABLE rewards ALTER COLUMN category TYPE TEXT USING category::TEXT;
ALTER TABLE rewards ALTER COLUMN category SET DEFAULT 'gift_card';
