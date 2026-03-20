-- Customer activation tokens and welcome modal flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activation_token UUID DEFAULT gen_random_uuid();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activation_token_expires TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT false;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_activation_token ON profiles (activation_token) WHERE activation_token IS NOT NULL;
