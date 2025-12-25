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
   * Check for duplicate participation within 7 days.
   */
  async checkDuplicateParticipation(fingerprint) {
    const result = await pool.query(
      `SELECT id FROM participants
       WHERE fingerprint = $1
       AND created_at > NOW() - INTERVAL '7 days'
       LIMIT 1`,
      [fingerprint]
    );
    return result.rows.length > 0;
  }

  /**
   * Create new participant with assigned condition.
   * Records consent and sets initial phase to 'consent'.
   */
  async createParticipant(lang = 'de', fingerprint = null) {
    const id = uuidv4();
    const sessionId = uuidv4();
    const condition = await this.assignCondition();

    const result = await pool.query(
      `INSERT INTO participants (id, session_id, condition, language, fingerprint, current_phase, consent_given, consent_at)
       VALUES ($1, $2, $3, $4, $5, 'consent', TRUE, NOW())
       RETURNING *`,
      [id, sessionId, condition, lang, fingerprint]
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
   * Record baseline measures (Q1-Q2) and advance to chatbot phase.
   */
  async recordBaseline(participantId, techComfort, privacyConcern) {
    await pool.query(
      `UPDATE participants
       SET tech_comfort = $1, baseline_privacy_concern = $2, current_phase = 'chatbot'
       WHERE id = $3`,
      [techComfort, privacyConcern, participantId]
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
   * Record post-task survey measures (Q3-Q14) and mark as complete.
   * Also handles optional notify_email.
   */
  async recordPostMeasures(participantId, measures) {
    // Insert survey measures
    await pool.query(
      `INSERT INTO post_task_measures (
        participant_id,
        clarity1, clarity2, clarity3, clarity4,
        control1, control2, control3, control4,
        risk_privacy, risk_misuse, risk_companies, risk_trust, risk_security,
        agency1, agency2, agency3,
        trust1, trust2,
        acceptable_use_improve_chatbot, acceptable_use_academic_research,
        acceptable_use_commercial_products, acceptable_use_nothing,
        attention_check,
        age, gender, gender_other, primary_language, education,
        open_feedback
      ) VALUES (
        $1,
        $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19,
        $20, $21, $22, $23,
        $24,
        $25, $26, $27, $28, $29,
        $30
      )`,
      [
        participantId,
        measures.clarity1, measures.clarity2, measures.clarity3, measures.clarity4,
        measures.control1, measures.control2, measures.control3, measures.control4,
        measures.riskPrivacy, measures.riskMisuse, measures.riskCompanies, measures.riskTrust, measures.riskSecurity,
        measures.agency1, measures.agency2, measures.agency3,
        measures.trust1, measures.trust2,
        measures.acceptableUseImproveChatbot, measures.acceptableUseAcademicResearch,
        measures.acceptableUseCommercialProducts, measures.acceptableUseNothing,
        measures.attentionCheck,
        measures.age, measures.gender, measures.genderOther, measures.primaryLanguage, measures.education,
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
}

export default new ExperimentService();
