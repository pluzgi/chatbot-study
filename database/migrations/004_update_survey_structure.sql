-- Migration: Update survey structure to match comprehensive briefing
-- Date: 2025-01-30
-- Description: Replace old survey fields with new comprehensive survey structure

-- Drop old post_task_measures table and create new one
DROP TABLE IF EXISTS post_task_measures CASCADE;

CREATE TABLE post_task_measures (
    id UUID PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) NOT NULL,

    -- Q3: Clarity (4 items - always shown)
    clarity1 INT CHECK (clarity1 BETWEEN 1 AND 7),
    clarity2 INT CHECK (clarity2 BETWEEN 1 AND 7),
    clarity3 INT CHECK (clarity3 BETWEEN 1 AND 7),
    clarity4 INT CHECK (clarity4 BETWEEN 1 AND 7),

    -- Q4: Control (4 items - always shown)
    control1 INT CHECK (control1 BETWEEN 1 AND 7),
    control2 INT CHECK (control2 BETWEEN 1 AND 7),
    control3 INT CHECK (control3 BETWEEN 1 AND 7),
    control4 INT CHECK (control4 BETWEEN 1 AND 7),

    -- Q5: Risk Concerns (5 items - always shown)
    risk_privacy INT CHECK (risk_privacy BETWEEN 1 AND 7),
    risk_misuse INT CHECK (risk_misuse BETWEEN 1 AND 7),
    risk_companies INT CHECK (risk_companies BETWEEN 1 AND 7),
    risk_trust INT CHECK (risk_trust BETWEEN 1 AND 7),
    risk_security INT CHECK (risk_security BETWEEN 1 AND 7),

    -- Q6: Agency (3 items - always shown)
    agency1 INT CHECK (agency1 BETWEEN 1 AND 7),
    agency2 INT CHECK (agency2 BETWEEN 1 AND 7),
    agency3 INT CHECK (agency3 BETWEEN 1 AND 7),

    -- Q7: Trust (2 items - always shown)
    trust1 INT CHECK (trust1 BETWEEN 1 AND 7),
    trust2 INT CHECK (trust2 BETWEEN 1 AND 7),

    -- Q8: Acceptable Use (checkboxes - always shown)
    acceptable_use_nonprofit BOOLEAN DEFAULT FALSE,
    acceptable_use_swiss_uni BOOLEAN DEFAULT FALSE,
    acceptable_use_intl_uni BOOLEAN DEFAULT FALSE,
    acceptable_use_swiss_company BOOLEAN DEFAULT FALSE,
    acceptable_use_intl_company BOOLEAN DEFAULT FALSE,
    acceptable_use_none BOOLEAN DEFAULT FALSE,

    -- Q9: Attention Check (single choice - always shown)
    attention_check VARCHAR(50), -- voting/tax/immigration/news/dontremember

    -- Q10-Q13: Demographics (always shown)
    age VARCHAR(20), -- 18-24, 25-34, etc.
    gender VARCHAR(50), -- female/male/non-binary/other/prefer-not-say
    gender_other VARCHAR(255), -- For "Other" option
    primary_language VARCHAR(50), -- english/french/german/italian/romansh/other
    education VARCHAR(100), -- mandatory/matura/vocational/etc.

    -- Q14: Open Feedback (optional)
    open_feedback TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_post_task_measures_participant ON post_task_measures(participant_id);

-- Add comments for documentation
COMMENT ON TABLE post_task_measures IS 'Stores comprehensive post-task survey responses (updated 2025-01-30)';
COMMENT ON COLUMN post_task_measures.clarity1 IS 'I understood where the Apertus chatbot was developed';
COMMENT ON COLUMN post_task_measures.clarity2 IS 'I knew what information the chatbot was trained on';
COMMENT ON COLUMN post_task_measures.clarity3 IS 'The privacy protections were clearly explained';
COMMENT ON COLUMN post_task_measures.clarity4 IS 'I had enough information to make my decision';
COMMENT ON COLUMN post_task_measures.control1 IS 'I had control over what happens to my questions';
COMMENT ON COLUMN post_task_measures.control2 IS 'I could choose how my data would be used';
COMMENT ON COLUMN post_task_measures.control3 IS 'I had real options for how to donate';
COMMENT ON COLUMN post_task_measures.control4 IS 'The process gave me the flexibility I wanted';
COMMENT ON COLUMN post_task_measures.risk_privacy IS 'Privacy: My questions could be traced back to me';
COMMENT ON COLUMN post_task_measures.risk_misuse IS 'Misuse: Data used for things I don''t agree with';
COMMENT ON COLUMN post_task_measures.risk_companies IS 'Companies: Businesses profiting from my data';
COMMENT ON COLUMN post_task_measures.risk_trust IS 'Trust: Not knowing who''s behind this';
COMMENT ON COLUMN post_task_measures.risk_security IS 'Security: Data could be hacked or stolen';
COMMENT ON COLUMN post_task_measures.agency1 IS 'I felt in control of my data in this situation';
COMMENT ON COLUMN post_task_measures.agency2 IS 'My choices actually mattered for my data';
COMMENT ON COLUMN post_task_measures.agency3 IS 'I felt empowered to decide what''s right for me';
COMMENT ON COLUMN post_task_measures.trust1 IS 'I trust the Apertus chatbot';
COMMENT ON COLUMN post_task_measures.trust2 IS 'I trust my data would be handled responsibly';
COMMENT ON COLUMN post_task_measures.acceptable_use_nonprofit IS 'Swiss non-profit organization acceptable';
COMMENT ON COLUMN post_task_measures.acceptable_use_swiss_uni IS 'Swiss university researchers acceptable';
COMMENT ON COLUMN post_task_measures.acceptable_use_intl_uni IS 'International university researchers acceptable';
COMMENT ON COLUMN post_task_measures.acceptable_use_swiss_company IS 'Swiss companies acceptable';
COMMENT ON COLUMN post_task_measures.acceptable_use_intl_company IS 'International companies acceptable';
COMMENT ON COLUMN post_task_measures.acceptable_use_none IS 'None of these acceptable';
COMMENT ON COLUMN post_task_measures.attention_check IS 'This chatbot helps people with questions about...';
COMMENT ON COLUMN post_task_measures.age IS 'Age range';
COMMENT ON COLUMN post_task_measures.gender IS 'Gender';
COMMENT ON COLUMN post_task_measures.gender_other IS 'Gender (other - specify)';
COMMENT ON COLUMN post_task_measures.primary_language IS 'Primary language';
COMMENT ON COLUMN post_task_measures.education IS 'Highest level of education';
COMMENT ON COLUMN post_task_measures.open_feedback IS 'Open-ended feedback (optional)';
