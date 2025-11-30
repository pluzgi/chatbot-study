-- Migration: Add baseline measures to participants table
-- Created: 2025-11-30
-- Description: Add tech_comfort and baseline_privacy_concern columns (both 7-point Likert)

ALTER TABLE participants
ADD COLUMN tech_comfort INT CHECK (tech_comfort BETWEEN 1 AND 7),
ADD COLUMN baseline_privacy_concern INT CHECK (baseline_privacy_concern BETWEEN 1 AND 7);

COMMENT ON COLUMN participants.tech_comfort IS 'Baseline technology comfort (1=strongly disagree to 7=strongly agree)';
COMMENT ON COLUMN participants.baseline_privacy_concern IS 'Baseline privacy concern (1=strongly disagree to 7=strongly agree)';
