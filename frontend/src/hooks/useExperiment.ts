import { useState, useEffect } from 'react';
import { Session } from '../types';
import { api } from '../services/api';

export const useExperiment = (language: string) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.initializeExperiment(language);
      setSession(data);
    } catch (err) {
      setError('Failed to initialize experiment');
      console.error('Experiment initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { session, loading, error, initialize };
};
