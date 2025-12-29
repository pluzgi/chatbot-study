import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import InputField from './InputField';

interface Props {
  participantId: string;
  onMinimumReached: () => void;
}

const MAX_QUESTIONS = 3;
const MIN_QUESTIONS = 2;

const ChatInterface: React.FC<Props> = ({ participantId, onMinimumReached }) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage } = useChat(participantId);
  const [count, setCount] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [maxReached, setMaxReached] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
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
    if (newCount >= MIN_QUESTIONS) {
      setCanContinue(true);
      setShowValidation(false);
    }
    if (newCount >= MAX_QUESTIONS) {
      setMaxReached(true);
    }
  };

  const handleContinue = () => {
    if (count < MIN_QUESTIONS) {
      setShowValidation(true);
      return;
    }
    onMinimumReached();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="bg-[#FF0000] text-white p-4 rounded-t-lg">
        <h2 className="text-2xl font-bold">{t('chat.title')}</h2>
        <p className="text-xl">{t('chat.subtitle')}</p>
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

      <InputField onSend={handleSend} disabled={loading || maxReached} />

      {/* Progress indicator (before max reached) */}
      {!maxReached && count < MIN_QUESTIONS && (
        <div className="p-2 text-center text-sm text-gray-500 bg-yellow-50 border-t border-yellow-200">
          {t('chat.minQuestions', { count })}
        </div>
      )}

      {/* Max questions reached message */}
      {maxReached && (
        <div className="p-2 text-center text-sm text-green-700 bg-green-50 border-t border-green-200">
          {t('chat.maxReached')}
        </div>
      )}

      {/* Validation error */}
      {showValidation && (
        <div className="p-2 text-center text-sm text-red-700 bg-red-50 border-t border-red-200">
          {t('chat.validationError')}
        </div>
      )}

      {/* Continue button after minimum questions answered */}
      {canContinue && !loading && (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <button
            onClick={handleContinue}
            className="w-full bg-gray-200 text-black py-4 rounded-lg font-semibold text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
          >
            {t('chat.continueButton')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
