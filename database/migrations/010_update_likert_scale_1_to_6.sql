-- Migration: Update Likert scale constraints from 1-7 to 1-6
-- Created: 2026-01-02
-- Description: Change all Likert scale fields to use 6-point scale instead of 7-point

-- ============================================
-- PARTICIPANTS TABLE - Baseline measures
-- ============================================

-- Drop old constraints
ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_tech_comfort_check;

ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_baseline_privacy_concern_check;

ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_ballot_familiarity_check;

-- Add new constraints with 1-6 range
ALTER TABLE participants
ADD CONSTRAINT participants_tech_comfort_check CHECK (tech_comfort BETWEEN 1 AND 6);

ALTER TABLE participants
ADD CONSTRAINT participants_baseline_privacy_concern_check CHECK (baseline_privacy_concern BETWEEN 1 AND 6);

ALTER TABLE participants
ADD CONSTRAINT participants_ballot_familiarity_check CHECK (ballot_familiarity BETWEEN 1 AND 6);

-- Update comments
COMMENT ON COLUMN participants.tech_comfort IS 'Baseline technology comfort - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN participants.baseline_privacy_concern IS 'Baseline privacy concern - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN participants.ballot_familiarity IS 'Familiarity with Swiss ballot initiatives - 6-point Likert (1=not familiar to 6=very familiar)';

-- ============================================
-- POST_TASK_MEASURES TABLE - Survey measures
-- ============================================

-- Drop old constraints
ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_transparency1_check;

ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_transparency2_check;

ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_control1_check;

ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_control2_check;

ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_risk_traceability_check;

ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_risk_misuse_check;

ALTER TABLE post_task_measures
DROP CONSTRAINT IF EXISTS post_task_measures_trust1_check;

-- Add new constraints with 1-6 range
ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_transparency1_check CHECK (transparency1 BETWEEN 1 AND 6);

ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_transparency2_check CHECK (transparency2 BETWEEN 1 AND 6);

ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_control1_check CHECK (control1 BETWEEN 1 AND 6);

ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_control2_check CHECK (control2 BETWEEN 1 AND 6);

ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_risk_traceability_check CHECK (risk_traceability BETWEEN 1 AND 6);

ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_risk_misuse_check CHECK (risk_misuse BETWEEN 1 AND 6);

ALTER TABLE post_task_measures
ADD CONSTRAINT post_task_measures_trust1_check CHECK (trust1 BETWEEN 1 AND 6);

-- Update comments
COMMENT ON COLUMN post_task_measures.transparency1 IS 'Perceived Transparency item 1 - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN post_task_measures.transparency2 IS 'Perceived Transparency item 2 - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN post_task_measures.control1 IS 'Perceived User Control item 1 - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN post_task_measures.control2 IS 'Perceived User Control item 2 - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN post_task_measures.risk_traceability IS 'Risk Perception (traceability) - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN post_task_measures.risk_misuse IS 'Risk Perception (misuse) - 6-point Likert (1=strongly disagree to 6=strongly agree)';
COMMENT ON COLUMN post_task_measures.trust1 IS 'Trust item - 6-point Likert (1=strongly disagree to 6=strongly agree)';
