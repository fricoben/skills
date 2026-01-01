-- Create table to store raw PayPal webhook payloads for debugging
-- This stores all incoming webhooks regardless of processing success

CREATE TABLE IF NOT EXISTS paypal_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on event_id for deduplication checks
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_logs_event_id ON paypal_webhook_logs(event_id);

-- Index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_logs_created_at ON paypal_webhook_logs(created_at);

-- RLS: Only service role can access
ALTER TABLE paypal_webhook_logs ENABLE ROW LEVEL SECURITY;
