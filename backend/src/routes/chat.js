import express from 'express';
import llmService from '../services/llm.service.js';
import pool from '../config/database.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { participantId, message, conversationHistory, language, model } = req.body;

    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await llmService.chat(messages, language || 'de', participantId, model);

    // Save chat messages ONLY for AI participants (privacy by design)
    if (participantId) {
      try {
        const { rows } = await pool.query(
          'SELECT is_ai_participant FROM participants WHERE id = $1',
          [participantId]
        );

        if (rows[0]?.is_ai_participant) {
          // Save both user message and assistant response
          await pool.query(
            'INSERT INTO chat_messages (participant_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)',
            [participantId, 'user', message, 'assistant', response]
          );
        }
      } catch (dbError) {
        // Log but don't fail the request if chat message saving fails
        console.log('[Chat] Skipping message save (participant not in DB or invalid ID)');
      }
    }

    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
