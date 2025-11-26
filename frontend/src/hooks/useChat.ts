import { useState, useCallback } from 'react';
import { Message } from '../types';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

export const useChat = (participantId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { i18n } = useTranslation();

  const sendMessage = useCallback(async (content: string) => {
    if (!participantId) return;

    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { response } = await api.sendMessage(
        participantId,
        content,
        messages,
        i18n.language
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  }, [participantId, messages, i18n.language]);

  return { messages, loading, sendMessage };
};
