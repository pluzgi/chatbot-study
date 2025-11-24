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

  async createParticipant(lang = 'de') {
    const sessionId = uuidv4();
    const condition = await this.assignCondition();

    const result = await pool.query(
      `INSERT INTO participants (id, session_id, condition, language, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [uuidv4(), sessionId, condition, lang]
    );

    return {
      participant: result.rows[0],
      config: this.getConditionConfig(condition)
    };
  }

  async recordDonation(participantId, decision, configuration = {}) {
    const p = await pool.query('SELECT condition FROM participants WHERE id = $1', [participantId]);
    const condition = p.rows[0].condition;
    const config = this.getConditionConfig(condition);

    await pool.query(
      `INSERT INTO donation_decisions (id, participant_id, decision, condition,
       transparency_level, control_level, configuration, decision_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [uuidv4(), participantId, decision, condition, config.transparency,
       config.control, JSON.stringify(configuration)]
    );
  }
}

export default new ExperimentService();
