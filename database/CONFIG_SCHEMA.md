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
| ballot_familiarity | INT | CHECK (1-7) | Q3: Familiarity with Swiss ballot initiatives |
| donation_decision | VARCHAR(10) | CHECK (donate, decline) | User's donation choice |
| donation_config | JSONB | DEFAULT NULL | Dashboard selections (C/D only) |
| decision_at | TIMESTAMP | | When donation decision was made |
| notify_email | VARCHAR(255) | | Q14: Optional email for study results |
| created_at | TIMESTAMP | DEFAULT NOW() | Session start |
| completed_at | TIMESTAMP | | Survey completion (NULL = dropout) |

### Phase Progression (Dropout Tracking)

```
consent → baseline → chatbot → decision → survey → complete
```

Participants who don't complete will have `current_phase` set to where they stopped.

---

## Table: post_task_measures

Stores post-task survey responses (Q3-Q13). One-to-one relationship with participants.
Note: Q14 (notify_email) is stored in participants table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| participant_id | UUID | PRIMARY KEY, FK | Links to participants.id |
| transparency1 | INT | CHECK (1-7) | Q3.1: Perceived Transparency (MC-T) |
| transparency2 | INT | CHECK (1-7) | Q3.2: Perceived Transparency (MC-T) |
| control1 | INT | CHECK (1-7) | Q4.1: Perceived User Control (MC-C) |
| control2 | INT | CHECK (1-7) | Q4.2: Perceived User Control (MC-C) |
| risk_traceability | INT | CHECK (1-7) | Q5.1: Risk Perception (OUT-RISK) |
| risk_misuse | INT | CHECK (1-7) | Q5.2: Risk Perception (OUT-RISK) |
| trust1 | INT | CHECK (1-7) | Q6: Trust (OUT-TRUST) - single item |
| attention_check | VARCHAR(50) | | Q7: Chatbot topic (voting, tax, immigration, dontremember) |
| age | VARCHAR(20) | | Q8: Age range |
| gender | VARCHAR(50) | | Q9: Gender |
| gender_other | VARCHAR(255) | | Q9: Gender (other text) |
| primary_language | VARCHAR(50) | | Q10: Primary language |
| education | VARCHAR(100) | | Q11: Education level |
| eligible_to_vote_ch | VARCHAR(20) | CHECK (eligible, not-eligible, not-sure) | Q12: Voting eligibility |
| open_feedback | TEXT | | Q13: Open feedback (optional) |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

### Hypothesis Mapping

| Construct | Fields | Hypothesis | Expected Pattern |
|-----------|--------|------------|------------------|
| MC-T (Transparency) | transparency1, transparency2 | H1 | Higher in B & D (with DNL) |
| MC-C (Control) | control1, control2 | H2 | Higher in C & D (with Dashboard) |
| OUT-RISK (Risk) | risk_traceability, risk_misuse | H3 | Lowest in D, highest in A |
| OUT-TRUST (Trust) | trust1 | Supporting | Exploratory |

---

## Donation Config Structure

For conditions C & D when user donates, `donation_config` contains:

```json
{
  "scope": "topics-only" | "questions-only" | "full",
  "purpose": "academic" | "commercial",
  "storage": "swiss" | "swiss-or-eu" | "no-preference",
  "retention": "until-fulfilled" | "6months" | "1year" | "indefinite"
}
```

### Scope Values
- `topics-only`: Only high-level topics (no text)
- `questions-only`: All chat questions (text only, no answers)
- `full`: Full anonymized conversations (questions + answers)

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

## Table: click_counters

Anonymous click counters for tracking button interactions and key events without personal data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| event_type | VARCHAR(50) | UNIQUE NOT NULL | Event identifier |
| count | INTEGER | DEFAULT 0 | Number of occurrences |
| last_clicked_at | TIMESTAMP | DEFAULT NOW() | Last occurrence timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

### Event Types

| Event Type | Description | Triggered By |
|------------|-------------|--------------|
| `decline_study` | User clicked "Not Interested" on landing | `POST /experiment/track-click` |
| `try_apertus` | User clicked "Try Apertus" on landing | `POST /experiment/track-click` |
| `survey_completed` | User completed the post-task survey | Auto-incremented in `recordPostMeasures()` |
| `donation_accepted` | User chose to donate data | Auto-incremented in `recordDonation()` |
| `donation_declined` | User declined to donate data | Auto-incremented in `recordDonation()` |

### Query Click Statistics

```sql
SELECT event_type, count, last_clicked_at
FROM click_counters
ORDER BY event_type;
```

---

## Email Flow

The optional email for study results (`notify_email`) is collected on the **Debriefing page** (after survey completion).

| Step | Frontend | Backend | Storage |
|------|----------|---------|---------|
| 1 | User enters email on Debriefing page | - | - |
| 2 | User clicks "Close" button | `POST /donation/notify-email` | - |
| 3 | - | `updateNotifyEmail()` | `participants.notify_email` |

**Note:** Email is separate from survey submission. The survey is submitted first (`POST /donation/post-measures`), then the email is sent from the Debriefing page.

---

## Migration

### Fresh Install

The schema is automatically created on backend startup via `backend/src/config/migrate.js`.

### Add New Click Counters (for existing databases)

```sql
INSERT INTO click_counters (event_type, count) VALUES
  ('survey_completed', 0),
  ('donation_accepted', 0),
  ('donation_declined', 0)
ON CONFLICT (event_type) DO NOTHING;
```

### Reset Existing Database

```sql
DROP TABLE IF EXISTS post_task_measures CASCADE;
DROP TABLE IF EXISTS donation_decisions CASCADE;  -- Old table
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS click_counters CASCADE;
```

Then restart the backend to recreate tables.
