-- Migration: Update Question 8 structure
-- Date: 2025-01-30
-- Description: Replace Q8 acceptable use fields from organization-based to purpose-based

-- Drop old Q8 columns (organization-based)
ALTER TABLE post_task_measures
    DROP COLUMN IF EXISTS acceptable_use_nonprofit,
    DROP COLUMN IF EXISTS acceptable_use_swiss_uni,
    DROP COLUMN IF EXISTS acceptable_use_intl_uni,
    DROP COLUMN IF EXISTS acceptable_use_swiss_company,
    DROP COLUMN IF EXISTS acceptable_use_intl_company,
    DROP COLUMN IF EXISTS acceptable_use_none;

-- Add new Q8 columns (purpose-based)
ALTER TABLE post_task_measures
    ADD COLUMN acceptable_use_improve_chatbot BOOLEAN DEFAULT FALSE,
    ADD COLUMN acceptable_use_academic_research BOOLEAN DEFAULT FALSE,
    ADD COLUMN acceptable_use_commercial_products BOOLEAN DEFAULT FALSE,
    ADD COLUMN acceptable_use_nothing BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN post_task_measures.acceptable_use_improve_chatbot IS 'Improving this chatbot';
COMMENT ON COLUMN post_task_measures.acceptable_use_academic_research IS 'Academic research';
COMMENT ON COLUMN post_task_measures.acceptable_use_commercial_products IS 'Commercial products';
COMMENT ON COLUMN post_task_measures.acceptable_use_nothing IS 'Nothing';
