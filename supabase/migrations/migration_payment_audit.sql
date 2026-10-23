-- Migration: Add audit and traceability columns to payments table
-- Enforces ECC / AgentShield standards for financial accountability

ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_email TEXT,
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_by_email TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS voided_by_email TEXT,
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_at ON payments(recorded_at);
