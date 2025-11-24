import express from 'express';
import experimentService from '../services/experiment.service.js';

const router = express.Router();

router.post('/initialize', async (req, res) => {
  try {
    const { language } = req.body;
    const { participant, config } = await experimentService.createParticipant(language);

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
