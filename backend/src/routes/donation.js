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

router.post('/post-measures', async (req, res) => {
  try {
    const { participantId, measures } = req.body;

    await experimentService.recordPostMeasures(participantId, measures);

    res.json({ success: true });
  } catch (error) {
    console.error('Post-measures error:', error);
    res.status(500).json({ error: 'Failed to record survey' });
  }
});

// Update notify email (called from debriefing page)
router.post('/notify-email', async (req, res) => {
  try {
    const { participantId, email } = req.body;

    await experimentService.updateNotifyEmail(participantId, email);

    res.json({ success: true });
  } catch (error) {
    console.error('Notify email error:', error);
    res.status(500).json({ error: 'Failed to save email' });
  }
});

export default router;
