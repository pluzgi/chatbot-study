-- Migration: Add survey and donation counters
-- Purpose: Track survey completions and donation decisions
-- Date: 2025-01-01

-- Add new counter rows for survey submissions and donation tracking
INSERT INTO click_counters (event_type, count) VALUES
  ('survey_completed', 0),
  ('donation_accepted', 0),
  ('donation_declined', 0)
ON CONFLICT (event_type) DO NOTHING;

-- Add comment to document the new counters
COMMENT ON TABLE click_counters IS 'Anonymous counters: decline_study, try_apertus, survey_completed, donation_accepted, donation_declined';
