import { Message } from '../types';

const API_BASE = import.meta.env.VITE_API_ENDPOINT;
const API_ENABLED = import.meta.env.VITE_API_ENABLED === 'true';
const IS_DEV = import.meta.env.DEV;

// Helper to detect development mode
const isDevelopment = IS_DEV || !API_ENABLED ||
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';

// Local storage helper
const saveToLocalStorage = (key: string, data: any) => {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify({ ...data, timestamp }));
    console.log(`[DEV] Saved to localStorage:`, key, data);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Mock successful response for development
const mockSuccess = (data: any = {}) => ({
  success: true,
  mode: 'development',
  ...data
});

export const api = {
  async initializeExperiment(language: string) {
    const data = { language };
    saveToLocalStorage('experiment_init', data);

    if (isDevelopment) {
      console.log('[DEV] Mock: initializeExperiment', data);
      const condition = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as 'A' | 'B' | 'C' | 'D';

      // Generate config based on condition
      const config = {
        A: { transparency: 'low' as const, control: 'low' as const, showDNL: false, showDashboard: false },
        B: { transparency: 'high' as const, control: 'low' as const, showDNL: true, showDashboard: false },
        C: { transparency: 'low' as const, control: 'high' as const, showDNL: false, showDashboard: true },
        D: { transparency: 'high' as const, control: 'high' as const, showDNL: true, showDashboard: true }
      }[condition];

      return mockSuccess({
        participantId: `dev-${Date.now()}`,
        sessionId: `session-${Date.now()}`,
        condition,
        config
      });
    }

    try {
      const res = await fetch(`${API_BASE}/experiment/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.warn('API failed, using fallback:', error);
      return mockSuccess({
        participantId: `fallback-${Date.now()}`,
        sessionId: `session-${Date.now()}`,
        condition: 'A',
        config: {
          transparency: 'low' as const,
          control: 'low' as const,
          showDNL: false,
          showDashboard: false
        }
      });
    }
  },

  async recordBaseline(participantId: string, techComfort: number, privacyConcern: number) {
    const data = { participantId, techComfort, privacyConcern };
    saveToLocalStorage('baseline_data', data);

    if (isDevelopment) {
      console.log('[DEV] Mock: recordBaseline', data);
      return mockSuccess();
    }

    try {
      const res = await fetch(`${API_BASE}/experiment/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.warn('API failed, data saved locally:', error);
      return mockSuccess(); // Don't block user
    }
  },

  async sendMessage(participantId: string, message: string, history: Message[], language: string) {
    const data = { participantId, message, conversationHistory: history, language };
    saveToLocalStorage(`chat_${Date.now()}`, { message, timestamp: new Date().toISOString() });

    if (isDevelopment) {
      console.log('[DEV] Mock: sendMessage', message);
      // Return a mock response for development
      return mockSuccess({
        response: "This is a mock response in development mode. The chatbot is not connected to the real API."
      });
    }

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.warn('Chat API failed:', error);
      return mockSuccess({
        response: "I'm sorry, I'm currently unavailable. Please try again later."
      });
    }
  },

  async recordDonation(participantId: string, decision: 'donate' | 'decline', config?: any) {
    const data = { participantId, decision, configuration: config };
    saveToLocalStorage('donation_decision', data);

    if (isDevelopment) {
      console.log('[DEV] Mock: recordDonation', data);
      return mockSuccess();
    }

    try {
      const res = await fetch(`${API_BASE}/donation/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.warn('API failed, data saved locally:', error);
      return mockSuccess(); // Don't block user
    }
  },

  async submitSurvey(participantId: string, measures: any) {
    const data = { participantId, measures };
    saveToLocalStorage('survey_data', data);

    if (isDevelopment) {
      console.log('[DEV] Mock: submitSurvey', data);
      return mockSuccess();
    }

    try {
      const res = await fetch(`${API_BASE}/donation/post-measures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.warn('API failed, data saved locally:', error);
      return mockSuccess(); // Don't block user
    }
  }
};
