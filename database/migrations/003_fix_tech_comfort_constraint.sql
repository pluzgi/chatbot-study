-- Migration: Fix tech_comfort constraint to 1-7 instead of 1-5
-- Created: 2025-11-30
-- Description: Update tech_comfort to use 7-point Likert scale

-- Drop the old constraint
ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_tech_comfort_check;

-- Add the new constraint with correct range
ALTER TABLE participants
ADD CONSTRAINT participants_tech_comfort_check CHECK (tech_comfort BETWEEN 1 AND 7);

-- Update comment
COMMENT ON COLUMN participants.tech_comfort IS 'Baseline technology comfort - 7-point Likert (1=strongly disagree to 7=strongly agree)';
