-- Subscription Detection System - Database Schema

CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100) NOT NULL DEFAULT 'Other',
  cost        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  start_date  DATE NOT NULL,
  renewal_date DATE NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'Active',
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
