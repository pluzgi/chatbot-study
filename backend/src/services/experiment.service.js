import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class ExperimentService {
  async assignCondition() {
    // Block randomization
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

  getConditionConfig(condition) {
    return {
      A: { transparency: 'low', control: 'low', showDNL: false, showDashboard: false },
      B: { transparency: 'high', control: 'low', showDNL: true, showDashboard: false },
      C: { transparency: 'low', control: 'high', showDNL: false, showDashboard: true },
      D: { transparency: 'high', control: 'high', showDNL: true, showDashboard: true }
    }[condition];
  }

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

  async createParticipant(lang = 'de', fingerprint = null) {
    const sessionId = uuidv4();
    const condition = await this.assignCondition();

    const result = await pool.query(
      `INSERT INTO participants (id, session_id, condition, language, fingerprint, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [uuidv4(), sessionId, condition, lang, fingerprint]
    );

    return {
      participant: result.rows[0],
      config: this.getConditionConfig(condition)
    };
  }

  async recordDonation(participantId, decision, dashboardConfig = null) {
    const p = await pool.query('SELECT condition FROM participants WHERE id = $1', [participantId]);
    const condition = p.rows[0].condition;
    const config = this.getConditionConfig(condition);

    // Config is NULL for:
    // - Conditions A & B (no dashboard)
    // - Any decline decision
    // Config is JSON object for:
    // - Conditions C & D when user donates (contains dashboard selections)
    const configValue = dashboardConfig ? JSON.stringify(dashboardConfig) : null;

    await pool.query(
      `INSERT INTO donation_decisions (id, participant_id, decision, condition,
       transparency_level, control_level, config, decision_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [uuidv4(), participantId, decision, condition, config.transparency,
       config.control, configValue]
    );
  }

  async recordBaseline(participantId, techComfort, privacyConcern) {
    await pool.query(
      `UPDATE participants
       SET tech_comfort = $1, baseline_privacy_concern = $2
       WHERE id = $3`,
      [techComfort, privacyConcern, participantId]
    );
  }

  async recordPostMeasures(participantId, measures) {
    await pool.query(
      `INSERT INTO post_task_measures (
        id, participant_id,
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
        $1, $2,
        $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18,
        $19, $20,
        $21, $22, $23, $24,
        $25,
        $26, $27, $28, $29, $30,
        $31
      )`,
      [
        uuidv4(), participantId,
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
  }
}

export default new ExperimentService();
