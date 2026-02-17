## Appendix A.2 — Database Schema Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| participants | Core participant data, condition assignment, dropout tracking, donation decision | id (UUID PK), condition (A/B/C/D), language, current_phase, donation_decision, donation_config (JSONB), tech_comfort, baseline_privacy_concern, ballot_familiarity |
| post_task_measures | Post-task survey responses (Q4–Q14) | participant_id (FK), transparency1/2, control1/2, risk_traceability, risk_misuse, trust1, attention_check, demographics (age, gender, education, etc.), open_feedback |
| chat_messages | Chat history (AI participants only; human messages never stored) | participant_id (FK), role (user/assistant), content |
| click_counters | Anonymous event counters (landing page tracking) | event_type (decline_study, try_apertus, survey_completed, etc.), count |
| study_config | Resettable study parameters | key, value (e.g., participant_target = 200) |
| api_usage_logs | LLM API call monitoring | participant_id (FK), model, prompt_tokens, completion_tokens, response_time_ms, success |
| server_restarts | Backend uptime monitoring | started_at, node_version, reason |

*Note: Human participant chat messages are never stored (privacy by design). The donation_config column stores dashboard selections (scope, purpose, storage, retention) as JSON for conditions C and D. Full schema: database/schema.sql.*
