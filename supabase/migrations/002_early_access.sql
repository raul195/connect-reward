-- ============================================================
-- Early Access Applications
-- ============================================================

CREATE TABLE early_access_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Contact Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  -- Business Info
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL CHECK (industry IN ('solar', 'roofing', 'hvac', 'windows', 'turf', 'pest_control', 'other')),
  industry_other TEXT,
  company_size TEXT NOT NULL CHECK (company_size IN ('solo', '2-5', '6-15', '16-50', '50+')),
  website TEXT,
  -- Current Referral Process
  current_referral_method TEXT CHECK (current_referral_method IN (
    'none', 'cash_bonuses', 'gift_cards', 'referral_software', 'word_of_mouth', 'other'
  )),
  current_referral_method_other TEXT,
  monthly_referral_volume TEXT CHECK (monthly_referral_volume IN (
    '0', '1-5', '6-15', '16-30', '30+'
  )),
  -- Interest Level
  biggest_challenge TEXT,
  desired_plan TEXT CHECK (desired_plan IN ('free', 'starter', 'growth', 'pro', 'not_sure')),
  how_did_you_hear TEXT,
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'approved', 'declined', 'converted')),
  notes TEXT,
  -- Metadata
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_early_access_status ON early_access_applications(status);
CREATE INDEX idx_early_access_industry ON early_access_applications(industry);
CREATE INDEX idx_early_access_submitted ON early_access_applications(submitted_at);

-- RLS
ALTER TABLE early_access_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage applications" ON early_access_applications
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
  );

CREATE POLICY "Anyone can submit application" ON early_access_applications
  FOR INSERT WITH CHECK (true);

-- Updated_at trigger (reuses the function from 001)
CREATE TRIGGER early_access_updated_at BEFORE UPDATE ON early_access_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
