-- Add unique constraint on transaction_id for paypal_payments and stripe_payments
-- This ensures no duplicate transactions can be inserted at the database level
-- The constraint only applies to non-null values (NULL values are allowed to be duplicated)
-- Uses partial unique index for null safety

CREATE UNIQUE INDEX IF NOT EXISTS paypal_payments_transaction_id_unique 
ON paypal_payments (transaction_id) 
WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stripe_payments_transaction_id_unique 
ON stripe_payments (transaction_id) 
WHERE transaction_id IS NOT NULL;
