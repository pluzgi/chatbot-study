import express from 'express';
import crypto from 'crypto';
import experimentService from '../services/experiment.service.js';

const router = express.Router();

function generateFingerprint(req) {
  const components = [
    req.ip || req.connection.remoteAddress || '',
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || ''
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(components)
    .digest('hex');
}

router.post('/initialize', async (req, res) => {
  try {
    const { language, isAiParticipant, aiPersonaId, aiRunId } = req.body;
    const fingerprint = generateFingerprint(req);

    // DISABLED: Duplicate check - fingerprint still saved for post-hoc analysis
    // To re-enable, uncomment the block below:
    /*
    if (!isAiParticipant) {
      const existingParticipation = await experimentService.checkDuplicateParticipation(fingerprint);
      if (existingParticipation) {
        return res.status(409).json({
          error: 'already_participated',
          message: 'You have already participated in this study recently.'
        });
      }
    }
    */

    // Create new participant with fingerprint and AI metadata
    const { participant, config } = await experimentService.createParticipant(
      language,
      fingerprint,
      { isAiParticipant, aiPersonaId, aiRunId }
    );

    res.json({
      sessionId: participant.session_id,
      participantId: participant.id,
      condition: participant.condition,
      config
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: 'Failed to initialize' });
  }
});

router.post('/baseline', async (req, res) => {
  try {
    const { participantId, techComfort, privacyConcern, ballotFamiliarity } = req.body;

    if (!participantId || techComfort === undefined || privacyConcern === undefined || ballotFamiliarity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await experimentService.recordBaseline(participantId, techComfort, privacyConcern, ballotFamiliarity);

    res.json({ success: true });
  } catch (error) {
    console.error('Baseline error:', error);
    res.status(500).json({ error: 'Failed to record baseline' });
  }
});

// Track anonymous click events (no personal data)
router.post('/track-click', async (req, res) => {
  try {
    const { eventType } = req.body;

    // Validate event type
    const validEvents = ['decline_study', 'try_apertus'];
    if (!eventType || !validEvents.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    await experimentService.incrementClickCounter(eventType);

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Get participant count for landing page counter
router.get('/participant-count', async (req, res) => {
  try {
    const { count, target } = await experimentService.getParticipantCount();
    res.json({ count, target });
  } catch (error) {
    console.error('Participant count error:', error);
    res.status(500).json({ error: 'Failed to get participant count' });
  }
});

// Admin: Delete AI test data only
router.delete('/admin/ai-data', async (req, res) => {
  try {
    const result = await experimentService.deleteAiTestData();
    res.json({ success: true, deleted: result });
  } catch (error) {
    console.error('Delete AI data error:', error);
    res.status(500).json({ error: 'Failed to delete AI data' });
  }
});

// Admin: Delete ALL data (use with caution)
router.delete('/admin/all-data', async (req, res) => {
  try {
    const result = await experimentService.deleteAllData();
    res.json({ success: true, deleted: result });
  } catch (error) {
    console.error('Delete all data error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Admin: Delete data since a specific date
// Usage: DELETE /admin/data-since?date=2025-01-01
router.delete('/admin/data-since', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Missing required query parameter: date (e.g., ?date=2025-01-01)' });
    }
    const result = await experimentService.deleteDataSinceDate(date);
    res.json({ success: true, deleted: result });
  } catch (error) {
    console.error('Delete data since date error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Admin: Recalculate click counters from actual human participant data
// Use after deleting participants or to fix AI counts
router.post('/admin/recalculate-counters', async (req, res) => {
  try {
    const result = await experimentService.recalculateClickCounters();
    res.json({ success: true, counters: result });
  } catch (error) {
    console.error('Recalculate counters error:', error);
    res.status(500).json({ error: 'Failed to recalculate counters' });
  }
});

export default router;
