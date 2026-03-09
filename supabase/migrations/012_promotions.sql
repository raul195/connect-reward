-- ============================================================
-- 012 — Promotions & Double Points
-- ============================================================

-- 1a. Create promotions table
CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  multiplier      NUMERIC(3,1) NOT NULL DEFAULT 2.0
                    CHECK (multiplier >= 1.0 AND multiplier <= 10.0),
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notify_customers BOOLEAN NOT NULL DEFAULT true,
  send_reminder   BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE INDEX idx_promotions_company ON promotions(company_id);
CREATE INDEX idx_promotions_active ON promotions(company_id, is_active) WHERE is_active = true;

CREATE TRIGGER set_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 1b. RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Businesses manage their own promotions
CREATE POLICY "businesses_manage_promotions" ON promotions
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('business', 'business_owner')
    )
  );

-- Super admins full access
CREATE POLICY "super_admins_all_promotions" ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Customers can view active promotions for their company
CREATE POLICY "customers_view_active_promotions" ON promotions
  FOR SELECT
  USING (
    is_active = true
    AND company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- 1c. Add promotion_id to point_transactions
ALTER TABLE point_transactions
  ADD COLUMN promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL;
