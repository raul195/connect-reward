-- ============================================================
-- 014 — Support Tickets & System Health Checks
-- ============================================================

-- ── Support Tickets ──────────────────────────────────────────

CREATE TABLE support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id),
  category        TEXT NOT NULL CHECK (category IN ('bug','account','billing','feature_request','other')),
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','resolved','closed')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),
  resolution      TEXT,
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT,  -- 'ai' or profile UUID
  ai_analysis     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_company ON support_tickets(company_id);
CREATE INDEX idx_support_tickets_company_status ON support_tickets(company_id, status);

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Business roles: full access to own company tickets
CREATE POLICY "Business manages own support tickets" ON support_tickets
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('business', 'business_owner', 'business_manager', 'business_rep')
    )
  );

-- Customers: read/create own tickets only
CREATE POLICY "Customers read own tickets" ON support_tickets
  FOR SELECT USING (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'customer'
    )
  );

CREATE POLICY "Customers create own tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Super admins: full access
CREATE POLICY "Super admins full access support tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ── System Health Checks ─────────────────────────────────────

CREATE TABLE system_health_checks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status      TEXT NOT NULL CHECK (status IN ('healthy','degraded','down')),
  checks      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — accessed only via admin client in API routes
