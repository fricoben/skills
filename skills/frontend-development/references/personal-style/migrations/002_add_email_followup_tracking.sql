-- Track outbound email sends for payments (thank-you + one-week follow-up)
-- This enables a scheduled job to send follow-ups exactly once.

-- Stripe payments
ALTER TABLE stripe_payments
  ADD COLUMN IF NOT EXISTS thank_you_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS thank_you_email_message_id text,
  ADD COLUMN IF NOT EXISTS followup_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_email_message_id text;

-- PayPal payments
ALTER TABLE paypal_payments
  ADD COLUMN IF NOT EXISTS thank_you_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS thank_you_email_message_id text,
  ADD COLUMN IF NOT EXISTS followup_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_email_message_id text;

-- Helpful partial indexes for the follow-up cron query
CREATE INDEX IF NOT EXISTS stripe_payments_followup_candidates_idx
  ON stripe_payments (thank_you_email_sent_at)
  WHERE thank_you_email_sent_at IS NOT NULL
    AND followup_email_sent_at IS NULL
    AND buyer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS paypal_payments_followup_candidates_idx
  ON paypal_payments (thank_you_email_sent_at)
  WHERE thank_you_email_sent_at IS NOT NULL
    AND followup_email_sent_at IS NULL
    AND buyer_email IS NOT NULL;

-- Fast lookup to detect “registered” users by email
CREATE INDEX IF NOT EXISTS profiles_email_idx
  ON profiles (email);

