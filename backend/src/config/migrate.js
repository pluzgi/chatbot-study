import pool from './database.js';

const schema = `
-- Participants table (normalized: includes donation decision)
-- Tracks complete participant journey with dropout detection
CREATE TABLE IF NOT EXISTS participants (
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

-- Post-task survey measures (Q3-Q14)
-- Separate table: logically distinct data collected after main experiment
-- Aligned with hypothesis-driven survey structure
CREATE TABLE IF NOT EXISTS post_task_measures (
    participant_id UUID PRIMARY KEY REFERENCES participants(id),

    -- Q3: Perceived Transparency (MC-T) - H1 manipulation check - 2 items
    transparency1 INT CHECK (transparency1 BETWEEN 1 AND 7),
    transparency2 INT CHECK (transparency2 BETWEEN 1 AND 7),

    -- Q4: Perceived User Control (MC-C) - H2 manipulation check - 2 items
    control1 INT CHECK (control1 BETWEEN 1 AND 7),
    control2 INT CHECK (control2 BETWEEN 1 AND 7),

    -- Q5: Risk Perception (OUT-RISK) - H3 interaction mechanism - 2 items
    risk_traceability INT CHECK (risk_traceability BETWEEN 1 AND 7),
    risk_misuse INT CHECK (risk_misuse BETWEEN 1 AND 7),

    -- Q6: Trust (OUT-TRUST) - Supporting construct - 1 item
    trust1 INT CHECK (trust1 BETWEEN 1 AND 7),

    -- Q7: Attention check
    attention_check VARCHAR(50),

    -- Q8-Q12: Demographics (checkbox-style selection, stored as strings)
    age VARCHAR(20),
    gender VARCHAR(50),
    gender_other VARCHAR(255),
    primary_language VARCHAR(50),
    education VARCHAR(100),
    eligible_to_vote_ch VARCHAR(20) CHECK (eligible_to_vote_ch IN ('eligible', 'not-eligible', 'not-sure')),

    -- Q13: Open feedback (QUAL)
    open_feedback TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Click counters for anonymous tracking
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_participants_condition ON participants(condition);
CREATE INDEX IF NOT EXISTS idx_participants_language ON participants(language);
CREATE INDEX IF NOT EXISTS idx_participants_fingerprint ON participants(fingerprint);
CREATE INDEX IF NOT EXISTS idx_participants_phase ON participants(current_phase);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at);
`;

export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await pool.query(schema);
    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  }
}

export default runMigrations;
