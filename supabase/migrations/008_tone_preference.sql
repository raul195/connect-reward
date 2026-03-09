ALTER TABLE automation_settings
  ADD COLUMN tone_preference TEXT NOT NULL DEFAULT 'friendly'
  CHECK (tone_preference IN ('friendly', 'professional', 'motivational'));
