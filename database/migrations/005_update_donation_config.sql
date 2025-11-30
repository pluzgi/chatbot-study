-- Migration: Update donation_decisions config column
-- Date: 2025-01-30
-- Description: Rename configuration to config and change default to NULL

-- Rename column from 'configuration' to 'config'
ALTER TABLE donation_decisions
  RENAME COLUMN configuration TO config;

-- Update default value to NULL instead of empty object
ALTER TABLE donation_decisions
  ALTER COLUMN config DROP DEFAULT;

ALTER TABLE donation_decisions
  ALTER COLUMN config SET DEFAULT NULL;

-- Add condition constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_decisions_condition_check'
  ) THEN
    ALTER TABLE donation_decisions
      ADD CONSTRAINT donation_decisions_condition_check
      CHECK (condition IN ('A', 'B', 'C', 'D'));
  END IF;
END $$;

-- Add GIN index for JSON queries on config column
CREATE INDEX IF NOT EXISTS idx_donation_config ON donation_decisions USING GIN (config);

-- Add comments
COMMENT ON COLUMN donation_decisions.config IS 'Dashboard configuration (NULL for A/B or decline, JSON object for C/D donate)';

-- Example config structure for reference:
-- Conditions A & B: NULL (no dashboard shown)
-- Conditions C & D (donate): {"scope": "full"|"topics", "purpose": "academic"|"commercial", "storage": "swiss"|"eu"|"no-preference", "retention": "1month"|"3months"|"6months"|"1year"|"indefinite"}
-- Conditions C & D (decline): NULL
