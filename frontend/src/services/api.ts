import { Message } from '../types';

const API_BASE = import.meta.env.VITE_API_ENDPOINT;

export const api = {
  async initializeExperiment(language: string) {
    const res = await fetch(`${API_BASE}/experiment/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    });
    return res.json();
  },

  async sendMessage(participantId: string, message: string, history: Message[], language: string) {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        message,
        conversationHistory: history,
        language
      })
    });
    return res.json();
  },

  async recordDonation(participantId: string, decision: 'donate' | 'decline', config?: any) {
    const res = await fetch(`${API_BASE}/donation/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, decision, configuration: config })
    });
    return res.json();
  },

  async submitSurvey(participantId: string, measures: any) {
    const res = await fetch(`${API_BASE}/donation/post-measures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, measures })
    });
    return res.json();
  }
};
