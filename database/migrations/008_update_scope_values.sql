-- Migration: Update scope values in donation_config
-- Date: 2025-12-27
-- Description: Change scope values from "full"|"topics" to "topics-only"|"questions-only"|"full"

-- Update existing records with old scope values
-- "topics" becomes "topics-only" (more restrictive interpretation)
-- "full" stays "full"
UPDATE participants
SET donation_config = jsonb_set(
  donation_config,
  '{scope}',
  '"topics-only"'
)
WHERE donation_config->>'scope' = 'topics';

-- Add comment for new scope values
COMMENT ON COLUMN participants.donation_config IS
'Dashboard configuration for conditions C/D. Scope values: topics-only (high-level topics only), questions-only (questions text, no answers), full (complete conversations)';

-- New scope values:
-- "topics-only": Only high-level topics (no text)
-- "questions-only": All chat questions (text only, no answers)
-- "full": Full anonymized conversations (questions + answers)
