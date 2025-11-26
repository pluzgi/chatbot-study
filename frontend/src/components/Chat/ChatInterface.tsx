import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import InputField from './InputField';

interface Props {
  participantId: string;
  onMinimumReached: () => void;
}

const ChatInterface: React.FC<Props> = ({ participantId, onMinimumReached }) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage } = useChat(participantId);
  const [count, setCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    await sendMessage(content);
    const newCount = count + 1;
    setCount(newCount);
    if (newCount >= 2) {
      onMinimumReached();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="bg-[#DC143C] text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">{t('chat.title')}</h2>
        <p className="text-sm">{t('chat.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-600 rounded-lg px-4 py-2">
              {t('chat.thinking')}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputField onSend={handleSend} disabled={loading} />

      {count < 2 && (
        <div className="p-2 text-center text-sm text-gray-500 bg-yellow-50 border-t border-yellow-200">
          {t('chat.minQuestions', { count })}
        </div>
      )}

      {/* Add spacing at bottom for better visibility */}
      <div className="pb-8"></div>
    </div>
  );
};

export default ChatInterface;
