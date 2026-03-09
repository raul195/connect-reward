-- Seed condition_data with default drip values for existing trigger rows.
-- Only updates rows where condition_data is still the empty default '{}',
-- so re-running after a manual edit is safe (idempotent).

UPDATE email_automation_triggers SET condition_data = '{"delay_days": 30}'
  WHERE trigger_type = 'inactivity_30' AND condition_data = '{}'::jsonb;

UPDATE email_automation_triggers SET condition_data = '{"delay_days": 60}'
  WHERE trigger_type = 'inactivity_60' AND condition_data = '{}'::jsonb;

UPDATE email_automation_triggers SET condition_data = '{"condition_threshold": 200}'
  WHERE trigger_type = 'points_close_to_reward' AND condition_data = '{}'::jsonb;

UPDATE email_automation_triggers SET condition_data = '{"delay_days": 14}'
  WHERE trigger_type = 'referral_nudge' AND condition_data = '{}'::jsonb;

UPDATE email_automation_triggers SET condition_data = '{"delay_days": 30}'
  WHERE trigger_type = 'program_reminder' AND condition_data = '{}'::jsonb;

-- milestone_reached: leave as '{}' (event-driven, no timing config)
