-- Migration: Add fingerprint column to participants table
-- Purpose: Enable server-side duplicate participation detection
-- Date: 2025-01-26

-- Add fingerprint column to participants table
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(64);

-- Create index on fingerprint for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_participants_fingerprint
ON participants(fingerprint);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_participants_created_at
ON participants(created_at);

-- Optional: Add comment to document the column
COMMENT ON COLUMN participants.fingerprint IS
'SHA256 hash of browser fingerprint (IP + user-agent + accept-language + accept-encoding) for duplicate detection';
