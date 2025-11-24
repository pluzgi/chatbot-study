-- Swiss Voting Assistant Chatbot Database Schema
-- 2×2 Factorial Design: Transparency (Low/High) × Control (Low/High)

-- Drop existing tables if they exist
DROP TABLE IF EXISTS post_task_measures CASCADE;
DROP TABLE IF EXISTS donation_decisions CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('A', 'B', 'C', 'D')),
    language VARCHAR(5) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Donation decisions table
CREATE TABLE donation_decisions (
    id UUID PRIMARY KEY,
    participant_id UUID REFERENCES participants(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('donate', 'decline')),
    condition VARCHAR(10) NOT NULL,
    transparency_level VARCHAR(10) NOT NULL,
    control_level VARCHAR(10) NOT NULL,
    configuration JSONB DEFAULT '{}'::jsonb,
    decision_timestamp TIMESTAMP DEFAULT NOW()
);

-- Post-task measures table
CREATE TABLE post_task_measures (
    id UUID PRIMARY KEY,
    participant_id UUID REFERENCES participants(id),
    transparency_perception INT CHECK (transparency_perception BETWEEN 1 AND 7),
    control_perception INT CHECK (control_perception BETWEEN 1 AND 7),
    trust_score INT CHECK (trust_score BETWEEN 1 AND 7),
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_participants_condition ON participants(condition);
CREATE INDEX idx_participants_language ON participants(language);
CREATE INDEX idx_donation_decisions_participant ON donation_decisions(participant_id);
CREATE INDEX idx_donation_decisions_condition ON donation_decisions(condition);
CREATE INDEX idx_post_task_measures_participant ON post_task_measures(participant_id);

-- Comments for documentation
COMMENT ON TABLE participants IS 'Stores experiment participants with their assigned condition';
COMMENT ON TABLE donation_decisions IS 'Records donation decisions made by participants';
COMMENT ON TABLE post_task_measures IS 'Stores post-task survey responses';

COMMENT ON COLUMN participants.condition IS 'Experimental condition: A (low/low), B (high/low), C (low/high), D (high/high)';
COMMENT ON COLUMN donation_decisions.configuration IS 'JSON configuration of the donation interface shown to participant';
