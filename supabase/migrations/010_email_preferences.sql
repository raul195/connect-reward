-- Email Preferences table — per-customer opt-out + individual engagement toggles
-- Separate from notification_preferences (JSONB on profiles) which controls in-app notifications.

CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  opt_out BOOLEAN NOT NULL DEFAULT false,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  reward_suggestions_enabled BOOLEAN NOT NULL DEFAULT true,
  referral_nudges_enabled BOOLEAN NOT NULL DEFAULT true,
  milestone_emails_enabled BOOLEAN NOT NULL DEFAULT true,
  promotional_emails_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id),
  UNIQUE (unsubscribe_token)
);

-- RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Customers can read/update their own preferences
CREATE POLICY "Customers can view own email preferences"
  ON email_preferences
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can update own email preferences"
  ON email_preferences
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Business owners can read their customers' email preferences (for admin views)
CREATE POLICY "Business owners can view customer email preferences"
  ON email_preferences
  FOR SELECT
  USING (customer_id IN (
    SELECT p.id FROM profiles p
    WHERE p.company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- Generate email_preferences rows for all existing customers who don't have one
INSERT INTO email_preferences (customer_id)
SELECT id FROM profiles
WHERE role = 'customer'
  AND id NOT IN (SELECT customer_id FROM email_preferences);
