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

    -- Baseline measures (Q1-Q2)
    tech_comfort INT CHECK (tech_comfort BETWEEN 1 AND 7),
    baseline_privacy_concern INT CHECK (baseline_privacy_concern BETWEEN 1 AND 7),

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
CREATE TABLE IF NOT EXISTS post_task_measures (
    participant_id UUID PRIMARY KEY REFERENCES participants(id),

    -- Q3: Clarity (4 items)
    clarity1 INT CHECK (clarity1 BETWEEN 1 AND 7),
    clarity2 INT CHECK (clarity2 BETWEEN 1 AND 7),
    clarity3 INT CHECK (clarity3 BETWEEN 1 AND 7),
    clarity4 INT CHECK (clarity4 BETWEEN 1 AND 7),

    -- Q4: Control (4 items)
    control1 INT CHECK (control1 BETWEEN 1 AND 7),
    control2 INT CHECK (control2 BETWEEN 1 AND 7),
    control3 INT CHECK (control3 BETWEEN 1 AND 7),
    control4 INT CHECK (control4 BETWEEN 1 AND 7),

    -- Q5: Risk concerns (5 items)
    risk_privacy INT CHECK (risk_privacy BETWEEN 1 AND 7),
    risk_misuse INT CHECK (risk_misuse BETWEEN 1 AND 7),
    risk_companies INT CHECK (risk_companies BETWEEN 1 AND 7),
    risk_trust INT CHECK (risk_trust BETWEEN 1 AND 7),
    risk_security INT CHECK (risk_security BETWEEN 1 AND 7),

    -- Q6: Agency (3 items)
    agency1 INT CHECK (agency1 BETWEEN 1 AND 7),
    agency2 INT CHECK (agency2 BETWEEN 1 AND 7),
    agency3 INT CHECK (agency3 BETWEEN 1 AND 7),

    -- Q7: Trust (2 items)
    trust1 INT CHECK (trust1 BETWEEN 1 AND 7),
    trust2 INT CHECK (trust2 BETWEEN 1 AND 7),

    -- Q8: Acceptable use (checkboxes)
    acceptable_use_improve_chatbot BOOLEAN DEFAULT FALSE,
    acceptable_use_academic_research BOOLEAN DEFAULT FALSE,
    acceptable_use_commercial_products BOOLEAN DEFAULT FALSE,
    acceptable_use_nothing BOOLEAN DEFAULT FALSE,

    -- Q9: Attention check
    attention_check VARCHAR(50),

    -- Q10-Q13: Demographics
    age VARCHAR(20),
    gender VARCHAR(50),
    gender_other VARCHAR(255),
    primary_language VARCHAR(50),
    education VARCHAR(100),

    -- Q14: Open feedback
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
