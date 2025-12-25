# Database Schema Documentation

## Overview

Normalized 2-table design with dropout tracking and optional email notification.

```
participants (1) ──── post_task_measures (1)
```

**Source of truth:** `backend/src/config/migrate.js`

---

## Table: participants

Stores all participant data including baseline measures, dropout tracking, and donation decision.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Participant identifier |
| session_id | VARCHAR(255) | UNIQUE NOT NULL | Session identifier |
| condition | VARCHAR(1) | CHECK (A,B,C,D) | Experimental condition |
| language | VARCHAR(5) | NOT NULL | UI language (de, fr, it, en) |
| fingerprint | VARCHAR(64) | | Browser fingerprint for duplicate detection |
| current_phase | VARCHAR(20) | DEFAULT 'consent' | Dropout tracking phase |
| consent_given | BOOLEAN | NOT NULL DEFAULT FALSE | TRUE when participant confirmed consent |
| consent_at | TIMESTAMP | | When consent was given |
| tech_comfort | INT | CHECK (1-7) | Q1: Technology comfort |
| baseline_privacy_concern | INT | CHECK (1-7) | Q2: Privacy concern |
| donation_decision | VARCHAR(10) | CHECK (donate, decline) | User's donation choice |
| donation_config | JSONB | DEFAULT NULL | Dashboard selections (C/D only) |
| decision_at | TIMESTAMP | | When donation decision was made |
| notify_email | VARCHAR(255) | | Q15: Optional email for study results |
| created_at | TIMESTAMP | DEFAULT NOW() | Session start |
| completed_at | TIMESTAMP | | Survey completion (NULL = dropout) |

### Phase Progression (Dropout Tracking)

```
consent → baseline → chatbot → decision → survey → complete
```

Participants who don't complete will have `current_phase` set to where they stopped.

---

## Table: post_task_measures

Stores post-task survey responses (Q3-Q14). One-to-one relationship with participants.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| participant_id | UUID | PRIMARY KEY, FK | Links to participants.id |
| clarity1-4 | INT | CHECK (1-7) | Q3: Clarity items |
| control1-4 | INT | CHECK (1-7) | Q4: Control items |
| risk_privacy | INT | CHECK (1-7) | Q5.1: Privacy concern |
| risk_misuse | INT | CHECK (1-7) | Q5.2: Misuse concern |
| risk_companies | INT | CHECK (1-7) | Q5.3: Companies concern |
| risk_trust | INT | CHECK (1-7) | Q5.4: Trust concern |
| risk_security | INT | CHECK (1-7) | Q5.5: Security concern |
| agency1-3 | INT | CHECK (1-7) | Q6: Agency items |
| trust1-2 | INT | CHECK (1-7) | Q7: Trust items |
| acceptable_use_improve_chatbot | BOOLEAN | DEFAULT FALSE | Q8: Improve chatbot |
| acceptable_use_academic_research | BOOLEAN | DEFAULT FALSE | Q8: Academic research |
| acceptable_use_commercial_products | BOOLEAN | DEFAULT FALSE | Q8: Commercial products |
| acceptable_use_nothing | BOOLEAN | DEFAULT FALSE | Q8: Nothing |
| attention_check | VARCHAR(50) | | Q9: Attention check |
| age | VARCHAR(20) | | Q10: Age range |
| gender | VARCHAR(50) | | Q11: Gender |
| gender_other | VARCHAR(255) | | Q11: Gender (other) |
| primary_language | VARCHAR(50) | | Q12: Primary language |
| education | VARCHAR(100) | | Q13: Education level |
| open_feedback | TEXT | | Q14: Open feedback |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

---

## Donation Config Structure

For conditions C & D when user donates, `donation_config` contains:

```json
{
  "scope": "full" | "topics",
  "purpose": "academic" | "commercial",
  "storage": "swiss" | "eu" | "no-preference",
  "retention": "1month" | "3months" | "6months" | "1year" | "indefinite"
}
```

**Config value by condition:**
- Condition A (Low/Low): `NULL` (no dashboard)
- Condition B (High/Low): `NULL` (no dashboard)
- Condition C (Low/High): JSON when donate, `NULL` when decline
- Condition D (High/High): JSON when donate, `NULL` when decline

---

## Indexes

```sql
CREATE INDEX idx_participants_condition ON participants(condition);
CREATE INDEX idx_participants_language ON participants(language);
CREATE INDEX idx_participants_fingerprint ON participants(fingerprint);
CREATE INDEX idx_participants_phase ON participants(current_phase);
CREATE INDEX idx_participants_created_at ON participants(created_at);
```

---

## Common Queries

### Dropout Analysis

```sql
SELECT current_phase, COUNT(*) as count
FROM participants
GROUP BY current_phase
ORDER BY
  CASE current_phase
    WHEN 'consent' THEN 1
    WHEN 'baseline' THEN 2
    WHEN 'chatbot' THEN 3
    WHEN 'decision' THEN 4
    WHEN 'survey' THEN 5
    WHEN 'complete' THEN 6
  END;
```

### Donations by Condition

```sql
SELECT condition, donation_decision, COUNT(*)
FROM participants
WHERE donation_decision IS NOT NULL
GROUP BY condition, donation_decision;
```

### Dashboard Configuration Analysis

```sql
-- Users who chose Swiss storage
SELECT * FROM participants
WHERE donation_config->>'storage' = 'swiss';

-- Users who chose full scope
SELECT * FROM participants
WHERE donation_config->>'scope' = 'full';
```

### Completion Rate

```sql
SELECT
  COUNT(*) FILTER (WHERE current_phase = 'complete') as completed,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE current_phase = 'complete') / COUNT(*), 1) as rate
FROM participants;
```

---

## Migration

### Fresh Install

The schema is automatically created on backend startup via `backend/src/config/migrate.js`.

### Reset Existing Database

```sql
DROP TABLE IF EXISTS post_task_measures CASCADE;
DROP TABLE IF EXISTS donation_decisions CASCADE;  -- Old table
DROP TABLE IF EXISTS participants CASCADE;
```

Then restart the backend to recreate tables.
