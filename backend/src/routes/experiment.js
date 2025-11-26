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

    // Check for duplicate participation (within last 7 days)
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

export default router;
