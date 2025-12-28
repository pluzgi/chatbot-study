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
    const { language } = req.body;
    const fingerprint = generateFingerprint(req);

    // Check for duplicate COMPLETED participation (within last 7 days)
    // Users who dropped out can restart fresh - only completed surveys are blocked
    const existingParticipation = await experimentService.checkDuplicateParticipation(fingerprint);

    if (existingParticipation) {
      return res.status(409).json({
        error: 'already_participated',
        message: 'You have already participated in this study recently.'
      });
    }

    // Create new participant with fingerprint
    const { participant, config } = await experimentService.createParticipant(language, fingerprint);

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

export default router;
