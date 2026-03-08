-- Email Automation Phase 2: automation_settings, email_automation_triggers, email_draft_queue

-- ── Table 1: automation_settings (one row per company) ──
CREATE TABLE automation_settings (
  company_id                UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  auto_approve_emails       BOOLEAN NOT NULL DEFAULT false,
  preferred_send_time       TIME NOT NULL DEFAULT '10:00',
  timezone                  TEXT NOT NULL DEFAULT 'America/New_York',
  monthly_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_frequency        TEXT NOT NULL DEFAULT 'monthly'
                            CHECK (reminder_frequency IN ('monthly', 'quarterly')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_automation_settings_updated_at
  BEFORE UPDATE ON automation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses manage own automation settings" ON automation_settings FOR ALL
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
    AND role IN ('business', 'business_owner')
  ));

CREATE POLICY "Super admins full access automation settings" ON automation_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- ── Table 2: email_automation_triggers ──
CREATE TABLE email_automation_triggers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trigger_type   TEXT NOT NULL CHECK (trigger_type IN (
    'inactivity_30', 'inactivity_60', 'points_close_to_reward',
    'referral_nudge', 'milestone_reached', 'program_reminder'
  )),
  condition_data JSONB NOT NULL DEFAULT '{}',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, trigger_type)
);

CREATE TRIGGER set_email_automation_triggers_updated_at
  BEFORE UPDATE ON email_automation_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE email_automation_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses manage own triggers" ON email_automation_triggers FOR ALL
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
    AND role IN ('business', 'business_owner')
  ));

CREATE POLICY "Super admins full access triggers" ON email_automation_triggers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- ── Table 3: email_draft_queue ──
CREATE TABLE email_draft_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_type      TEXT NOT NULL,
  template_name     TEXT NOT NULL,
  subject           TEXT NOT NULL,
  preview_text      TEXT,
  email_data        JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'approved', 'sent', 'cancelled')),
  scheduled_send_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_email_draft_queue_updated_at
  BEFORE UPDATE ON email_draft_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_draft_queue_company ON email_draft_queue(company_id);
CREATE INDEX idx_draft_queue_status ON email_draft_queue(status);
CREATE INDEX idx_draft_queue_approved_send
  ON email_draft_queue(scheduled_send_at)
  WHERE status = 'approved';

ALTER TABLE email_draft_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses manage own drafts" ON email_draft_queue FOR ALL
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
    AND role IN ('business', 'business_owner')
  ));

CREATE POLICY "Super admins full access drafts" ON email_draft_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- ── Seed: cross join all companies × 6 trigger types ──
INSERT INTO email_automation_triggers (company_id, trigger_type)
SELECT c.id, t.trigger_type
FROM companies c
CROSS JOIN (
  VALUES
    ('inactivity_30'),
    ('inactivity_60'),
    ('points_close_to_reward'),
    ('referral_nudge'),
    ('milestone_reached'),
    ('program_reminder')
) AS t(trigger_type)
ON CONFLICT (company_id, trigger_type) DO NOTHING;
