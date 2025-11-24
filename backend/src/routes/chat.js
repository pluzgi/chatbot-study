import express from 'express';
import apertusService from '../services/apertus.service.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { participantId, message, conversationHistory, language } = req.body;

    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await apertusService.chat(messages, language || 'de');

    // Log interaction (implement if needed)

    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
