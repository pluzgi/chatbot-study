import express from 'express';
import experimentService from '../services/experiment.service.js';

const router = express.Router();

router.post('/decision', async (req, res) => {
  try {
    const { participantId, decision, configuration } = req.body;

    await experimentService.recordDonation(participantId, decision, configuration);

    res.json({ success: true });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to record decision' });
  }
});

export default router;
