-- ============================================================
-- Rewards schema fixes: column renames + customer_favorites
-- ============================================================

-- 1. Rename rewards columns to match application code
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rewards' AND column_name = 'points_cost'
  ) THEN
    ALTER TABLE rewards RENAME COLUMN points_cost TO points_required;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rewards' AND column_name = 'active'
  ) THEN
    ALTER TABLE rewards RENAME COLUMN active TO is_active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rewards' AND column_name = 'quantity_left'
  ) THEN
    ALTER TABLE rewards RENAME COLUMN quantity_left TO quantity_available;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rewards' AND column_name = 'type'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'rewards' AND column_name = 'category'
    )
  ) THEN
    ALTER TABLE rewards RENAME COLUMN type TO category;
  END IF;
END $$;

-- 2. Create customer_favorites table
CREATE TABLE IF NOT EXISTS customer_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id   UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, reward_id)
);

-- RLS policies for customer_favorites
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customer_favorites' AND policyname = 'Customers manage own favorites'
  ) THEN
    CREATE POLICY "Customers manage own favorites"
      ON customer_favorites FOR ALL
      USING (customer_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customer_favorites' AND policyname = 'Business reads company favorites'
  ) THEN
    CREATE POLICY "Business reads company favorites"
      ON customer_favorites FOR SELECT
      USING (
        reward_id IN (
          SELECT id FROM rewards WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('business', 'business_owner')
          )
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer ON customer_favorites (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_reward ON customer_favorites (reward_id);

-- 3. Add fulfilled_at to redemptions for tracking fulfillment timestamp
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
