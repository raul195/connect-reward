-- ============================================================
-- Feature Updates Migration
-- ============================================================

-- 1. Profile address fields + notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "referral_status": true,
  "points_earned": true,
  "milestone_reached": true,
  "reward_fulfilled": true,
  "weekly_summary": true
}'::jsonb;

-- 2. Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read services" ON services FOR SELECT USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Contractors manage services" ON services FOR ALL USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('contractor', 'super_admin'))
);

CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Add service_id to referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

-- 4. Logo storage bucket + policies (run in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
--   ON CONFLICT DO NOTHING;
