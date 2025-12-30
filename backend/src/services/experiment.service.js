import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class ExperimentService {
  /**
   * Assign condition using block randomization.
   * Ensures balanced distribution across A, B, C, D.
   */
  async assignCondition() {
    const result = await pool.query(`
      SELECT condition, COUNT(*) as count
      FROM participants
      GROUP BY condition
    `);

    const counts = { A: 0, B: 0, C: 0, D: 0 };
    result.rows.forEach(r => counts[r.condition] = parseInt(r.count));

    const minCount = Math.min(...Object.values(counts));
    const available = Object.keys(counts).filter(c => counts[c] === minCount);

    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Get UI configuration for a condition.
   * Derived from condition - not stored in DB.
   */
  getConditionConfig(condition) {
    return {
      A: { transparency: 'low', control: 'low', showDNL: false, showDashboard: false },
      B: { transparency: 'high', control: 'low', showDNL: true, showDashboard: false },
      C: { transparency: 'low', control: 'high', showDNL: false, showDashboard: true },
      D: { transparency: 'high', control: 'high', showDNL: true, showDashboard: true }
    }[condition];
  }

  /**
   * Check for duplicate COMPLETED participation within 7 days.
   * Only blocks users who have fully completed the survey.
   * Users who dropped out can restart fresh.
   */
  async checkDuplicateParticipation(fingerprint) {
    const result = await pool.query(
      `SELECT id FROM participants
       WHERE fingerprint = $1
       AND completed_at IS NOT NULL
       AND created_at > NOW() - INTERVAL '7 days'
       LIMIT 1`,
      [fingerprint]
    );
    return result.rows.length > 0;
  }

  /**
   * Create new participant with assigned condition.
   * Records consent and sets initial phase to 'consent'.
   * For AI participants, also stores persona and run metadata.
   */
  async createParticipant(lang = 'de', fingerprint = null, aiMeta = {}) {
    const id = uuidv4();
    const sessionId = uuidv4();
    const condition = await this.assignCondition();
    const { isAiParticipant, aiPersonaId, aiRunId } = aiMeta;

    const result = await pool.query(
      `INSERT INTO participants (id, session_id, condition, language, fingerprint, current_phase, consent_given, consent_at, is_ai_participant, ai_persona_id, ai_run_id)
       VALUES ($1, $2, $3, $4, $5, 'consent', TRUE, NOW(), $6, $7, $8)
       RETURNING *`,
      [id, sessionId, condition, lang, fingerprint, isAiParticipant || false, aiPersonaId || null, aiRunId || null]
    );

    return {
      participant: result.rows[0],
      config: this.getConditionConfig(condition)
    };
  }

  /**
   * Update participant's current phase for dropout tracking.
   */
  async updatePhase(participantId, phase) {
    await pool.query(
      `UPDATE participants SET current_phase = $1 WHERE id = $2`,
      [phase, participantId]
    );
  }

  /**
   * Record baseline measures (Q1-Q3) and advance to chatbot phase.
   * Q1: Tech comfort, Q2: Privacy concern, Q3: Ballot familiarity
   */
  async recordBaseline(participantId, techComfort, privacyConcern, ballotFamiliarity) {
    await pool.query(
      `UPDATE participants
       SET tech_comfort = $1, baseline_privacy_concern = $2, ballot_familiarity = $3, current_phase = 'chatbot'
       WHERE id = $4`,
      [techComfort, privacyConcern, ballotFamiliarity, participantId]
    );
  }

  /**
   * Record donation decision and advance to survey phase.
   */
  async recordDonation(participantId, decision, dashboardConfig = null) {
    const configValue = dashboardConfig ? JSON.stringify(dashboardConfig) : null;

    await pool.query(
      `UPDATE participants
       SET donation_decision = $1, donation_config = $2, decision_at = NOW(), current_phase = 'survey'
       WHERE id = $3`,
      [decision, configValue, participantId]
    );
  }

  /**
   * Record post-task survey measures (Q4-Q14) and mark as complete.
   * Also handles optional notify_email (Q15).
   * Schema matches frontend SurveyData type and migrate.js table definition.
   */
  async recordPostMeasures(participantId, measures) {
    // Insert survey measures
    await pool.query(
      `INSERT INTO post_task_measures (
        participant_id,
        transparency1, transparency2,
        control1, control2,
        risk_traceability, risk_misuse,
        trust1,
        attention_check,
        age, gender, gender_other, primary_language, education, eligible_to_vote_ch,
        open_feedback
      ) VALUES (
        $1,
        $2, $3,
        $4, $5,
        $6, $7,
        $8,
        $9,
        $10, $11, $12, $13, $14, $15,
        $16
      )`,
      [
        participantId,
        measures.transparency1, measures.transparency2,
        measures.control1, measures.control2,
        measures.riskTraceability, measures.riskMisuse,
        measures.trust1,
        measures.attentionCheck,
        measures.age, measures.gender, measures.genderOther, measures.primaryLanguage, measures.education, measures.eligibleToVoteCh,
        measures.openFeedback
      ]
    );

    // Mark participant as complete and optionally store email
    await pool.query(
      `UPDATE participants
       SET current_phase = 'complete', completed_at = NOW(), notify_email = $1
       WHERE id = $2`,
      [measures.notifyEmail || null, participantId]
    );
  }

  /**
   * Get dropout statistics by phase.
   */
  async getDropoutStats() {
    const result = await pool.query(`
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
        END
    `);
    return result.rows;
  }

  /**
   * Increment a click counter (anonymous tracking).
   * Used for tracking "Not interested" and "Try Apertus" button clicks.
   */
  async incrementClickCounter(eventType) {
    await pool.query(
      `UPDATE click_counters
       SET count = count + 1, last_clicked_at = NOW()
       WHERE event_type = $1`,
      [eventType]
    );
  }

  /**
   * Get click counter statistics.
   */
  async getClickStats() {
    const result = await pool.query(`
      SELECT event_type, count, last_clicked_at
      FROM click_counters
      ORDER BY event_type
    `);
    return result.rows;
  }

  /**
   * Get participant count for the landing page counter.
   * Counts completed human participants (excludes AI participants).
   * Uses study_config table for target and reset functionality.
   */
  async getParticipantCount() {
    // Get count of completed human participants since the counter reset date
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM participants
      WHERE completed_at IS NOT NULL
      AND (is_ai_participant = FALSE OR is_ai_participant IS NULL)
      AND created_at >= COALESCE(
        (SELECT reset_at FROM study_config WHERE key = 'counter_reset'),
        '1970-01-01'
      )
    `);

    // Get target from study_config (default 200)
    const targetResult = await pool.query(`
      SELECT value FROM study_config WHERE key = 'participant_target'
    `);

    const count = parseInt(countResult.rows[0]?.count || 0);
    const target = parseInt(targetResult.rows[0]?.value || 200);

    return { count, target };
  }

  /**
   * Reset the participant counter (sets new reset date).
   */
  async resetParticipantCounter() {
    await pool.query(`
      INSERT INTO study_config (key, value, reset_at)
      VALUES ('counter_reset', 'reset', NOW())
      ON CONFLICT (key) DO UPDATE SET reset_at = NOW()
    `);
  }

  /**
   * Update the participant target number.
   */
  async updateParticipantTarget(target) {
    await pool.query(`
      INSERT INTO study_config (key, value)
      VALUES ('participant_target', $1)
      ON CONFLICT (key) DO UPDATE SET value = $1
    `, [target.toString()]);
  }

  /**
   * Delete all AI test participants and their related data.
   * Use with caution - this permanently removes data.
   */
  async deleteAiTestData() {
    // Delete in correct order due to foreign key constraints
    const chatResult = await pool.query(`
      DELETE FROM chat_messages
      WHERE participant_id IN (SELECT id FROM participants WHERE is_ai_participant = TRUE)
    `);

    const apiResult = await pool.query(`
      DELETE FROM api_usage_logs
      WHERE participant_id IN (SELECT id FROM participants WHERE is_ai_participant = TRUE)
    `);

    const postResult = await pool.query(`
      DELETE FROM post_task_measures
      WHERE participant_id IN (SELECT id FROM participants WHERE is_ai_participant = TRUE)
    `);

    const participantResult = await pool.query(`
      DELETE FROM participants WHERE is_ai_participant = TRUE
    `);

    return {
      chatMessages: chatResult.rowCount,
      apiLogs: apiResult.rowCount,
      postMeasures: postResult.rowCount,
      participants: participantResult.rowCount
    };
  }

  /**
   * Delete ALL data from all tables (use with extreme caution).
   */
  async deleteAllData() {
    const chatResult = await pool.query(`DELETE FROM chat_messages`);
    const apiResult = await pool.query(`DELETE FROM api_usage_logs`);
    const postResult = await pool.query(`DELETE FROM post_task_measures`);
    const participantResult = await pool.query(`DELETE FROM participants`);

    return {
      chatMessages: chatResult.rowCount,
      apiLogs: apiResult.rowCount,
      postMeasures: postResult.rowCount,
      participants: participantResult.rowCount
    };
  }
}

export default new ExperimentService();
