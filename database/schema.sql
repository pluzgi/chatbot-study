-- Swiss Ballot Chatbot Database Schema
-- 2×2 Factorial Design: Transparency (Low/High) × Control (Low/High)
-- Source of truth: backend/src/config/migrate.js

-- Drop existing tables if they exist
DROP TABLE IF EXISTS post_task_measures CASCADE;
DROP TABLE IF EXISTS donation_decisions CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

-- Participants table (normalized: includes donation decision)
-- Tracks complete participant journey with dropout detection
CREATE TABLE participants (
    id UUID PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    condition VARCHAR(1) NOT NULL CHECK (condition IN ('A', 'B', 'C', 'D')),
    language VARCHAR(5) NOT NULL,
    fingerprint VARCHAR(64),

    -- Dropout tracking: where participant currently is in the flow
    -- consent → baseline → chatbot → decision → survey → complete
    current_phase VARCHAR(20) NOT NULL DEFAULT 'consent'
        CHECK (current_phase IN ('consent', 'baseline', 'chatbot', 'decision', 'survey', 'complete')),

    -- Consent tracking
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_at TIMESTAMP,

    -- Baseline measures (Q1-Q3)
    tech_comfort INT CHECK (tech_comfort BETWEEN 1 AND 7),
    baseline_privacy_concern INT CHECK (baseline_privacy_concern BETWEEN 1 AND 7),
    ballot_familiarity INT CHECK (ballot_familiarity BETWEEN 1 AND 7),

    -- Donation decision (merged from donation_decisions table)
    donation_decision VARCHAR(10) CHECK (donation_decision IN ('donate', 'decline')),
    donation_config JSONB DEFAULT NULL,  -- Dashboard selections for conditions C/D
    decision_at TIMESTAMP,

    -- Optional: participant wants study results
    notify_email VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Post-task survey measures (Q4-Q14)
-- Separate table: logically distinct data collected after main experiment
-- Aligned with hypothesis-driven survey structure
CREATE TABLE post_task_measures (
    participant_id UUID PRIMARY KEY REFERENCES participants(id),

    -- Q4: Perceived Transparency (MC-T) - H1 manipulation check - 2 items
    transparency1 INT CHECK (transparency1 BETWEEN 1 AND 7),
    transparency2 INT CHECK (transparency2 BETWEEN 1 AND 7),

    -- Q5: Perceived User Control (MC-C) - H2 manipulation check - 2 items
    control1 INT CHECK (control1 BETWEEN 1 AND 7),
    control2 INT CHECK (control2 BETWEEN 1 AND 7),

    -- Q6: Risk Perception (OUT-RISK) - H3 interaction mechanism - 2 items
    risk_traceability INT CHECK (risk_traceability BETWEEN 1 AND 7),
    risk_misuse INT CHECK (risk_misuse BETWEEN 1 AND 7),

    -- Q7: Trust (OUT-TRUST) - Supporting construct - 1 item
    trust1 INT CHECK (trust1 BETWEEN 1 AND 7),

    -- Q8: Attention check
    attention_check VARCHAR(50),

    -- Q9-Q13: Demographics (checkbox-style selection, stored as strings)
    age VARCHAR(20),
    gender VARCHAR(50),
    gender_other VARCHAR(255),
    primary_language VARCHAR(50),
    education VARCHAR(100),
    eligible_to_vote_ch VARCHAR(20) CHECK (eligible_to_vote_ch IN ('eligible', 'not-eligible', 'not-sure')),

    -- Q14: Open feedback (QUAL)
    open_feedback TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Click counters for anonymous tracking
-- Tracks "Not interested" and "Try Apertus" button clicks without personal data
CREATE TABLE click_counters (
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

-- Study configuration for resettable counters and targets
-- Used by the landing page participant counter (displays "X/200")
CREATE TABLE study_config (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255),
    reset_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default participant target
INSERT INTO study_config (key, value) VALUES
    ('participant_target', '200')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PARTICIPANT COUNTER OPERATIONS
-- ============================================================
-- The landing page shows a counter: "Participants so far: X/200"
-- It counts completed participants (completed_at IS NOT NULL)
-- created after the reset date.
--
-- RESET COUNTER (start fresh, e.g., after testing):
--   INSERT INTO study_config (key, value, reset_at)
--   VALUES ('counter_reset', 'reset', NOW())
--   ON CONFLICT (key) DO UPDATE SET reset_at = NOW();
--
-- CHANGE TARGET (e.g., from 200 to 300):
--   UPDATE study_config SET value = '300' WHERE key = 'participant_target';
--
-- VIEW CURRENT SETTINGS:
--   SELECT * FROM study_config;
-- ============================================================

-- Indexes for performance
CREATE INDEX idx_participants_condition ON participants(condition);
CREATE INDEX idx_participants_language ON participants(language);
CREATE INDEX idx_participants_fingerprint ON participants(fingerprint);
CREATE INDEX idx_participants_phase ON participants(current_phase);
CREATE INDEX idx_participants_created_at ON participants(created_at);

-- Comments for documentation
COMMENT ON TABLE participants IS 'Stores experiment participants with dropout tracking and donation decision';
COMMENT ON TABLE post_task_measures IS 'Stores post-task survey responses (Q4-Q14)';
COMMENT ON TABLE click_counters IS 'Anonymous click counters for tracking button interactions without personal data';
COMMENT ON COLUMN participants.condition IS 'Experimental condition: A (low/low), B (high/low), C (low/high), D (high/high)';
COMMENT ON COLUMN participants.current_phase IS 'Dropout tracking: consent → baseline → chatbot → decision → survey → complete';
COMMENT ON COLUMN participants.consent_given IS 'TRUE when participant confirmed consent checkbox';
COMMENT ON COLUMN participants.consent_at IS 'Timestamp when consent was given';
COMMENT ON COLUMN participants.donation_config IS 'Dashboard configuration for C/D: {"scope","purpose","storage","retention"}';
