-- Migration: Add click_counters table
-- Purpose: Track anonymous click counts for "Not interested" and "Try Apertus" buttons
-- Date: 2024-12-24

-- Create click_counters table for simple anonymous click tracking
CREATE TABLE IF NOT EXISTS click_counters (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial counter rows
INSERT INTO click_counters (event_type, count) VALUES
  ('decline_study', 0),
  ('try_apertus', 0)
ON CONFLICT (event_type) DO NOTHING;

-- Add comment to document the table
COMMENT ON TABLE click_counters IS 'Anonymous click counters for tracking button interactions without personal data';
