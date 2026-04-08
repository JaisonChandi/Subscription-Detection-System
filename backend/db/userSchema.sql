-- Users table for Subscription Detection System
CREATE TABLE IF NOT EXISTS users (
  id                        SERIAL PRIMARY KEY,
  full_name                 VARCHAR(255) NOT NULL,
  email                     VARCHAR(255) NOT NULL UNIQUE,
  password_hash             VARCHAR(255) NOT NULL,
  email_verified            BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token        VARCHAR(255),
  verification_token_expires TIMESTAMP WITH TIME ZONE,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at'
  ) THEN
    CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();
  END IF;
END;
$$;
