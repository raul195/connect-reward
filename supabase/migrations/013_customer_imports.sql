-- 013_customer_imports.sql
-- Adds customer CSV import support: import jobs, per-row results, email throttle, bounce tracking

-- ── 1a. customer_imports table ──────────────────────────────────────────────
CREATE TABLE customer_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
  total_rows      INT NOT NULL DEFAULT 0,
  processed_rows  INT NOT NULL DEFAULT 0,
  created_count   INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  error_count     INT NOT NULL DEFAULT 0,
  send_welcome    BOOLEAN NOT NULL DEFAULT true,
  original_filename TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_imports_company ON customer_imports(company_id);

CREATE TRIGGER set_customer_imports_updated_at
  BEFORE UPDATE ON customer_imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 1b. import_rows table ──────────────────────────────────────────────────
CREATE TABLE import_rows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id       UUID NOT NULL REFERENCES customer_imports(id) ON DELETE CASCADE,
  row_number      INT NOT NULL,
  raw_data        JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','created','skipped_duplicate','skipped_invalid','error')),
  error_message   TEXT,
  profile_id      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_rows_import ON import_rows(import_id);
CREATE INDEX idx_import_rows_status ON import_rows(import_id, status);

-- ── 1c. email_send_log table ───────────────────────────────────────────────
CREATE TABLE email_send_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email_type      TEXT NOT NULL,
  recipient_id    UUID REFERENCES profiles(id),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_send_log_throttle ON email_send_log(company_id, email_type, sent_at);

-- ── 1d. email_status on profiles ───────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN email_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (email_status IN ('unknown','valid','bounced','complained'));

-- ── 1e. import_id on profiles ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN import_id UUID REFERENCES customer_imports(id) ON DELETE SET NULL;

-- ── 1f. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE customer_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

-- customer_imports: business roles for their company
CREATE POLICY "Business manages own imports" ON customer_imports
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('business', 'business_owner')
    )
  );

CREATE POLICY "Super admin full access to imports" ON customer_imports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- import_rows: access via parent import's company
CREATE POLICY "Business manages own import rows" ON import_rows
  FOR ALL USING (
    import_id IN (
      SELECT id FROM customer_imports
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
          AND role IN ('business', 'business_owner')
      )
    )
  );

CREATE POLICY "Super admin full access to import rows" ON import_rows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- email_send_log: business roles for their company
CREATE POLICY "Business views own email send log" ON email_send_log
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('business', 'business_owner')
    )
  );

CREATE POLICY "Super admin full access to email send log" ON email_send_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
