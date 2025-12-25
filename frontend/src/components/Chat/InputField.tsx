import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const InputField: React.FC<Props> = ({ onSend, disabled = false }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 pb-8 border-t bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          disabled={disabled}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 disabled:bg-gray-100 disabled:border-gray-200 min-h-[48px]"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-gray-200 text-black rounded-md font-medium min-h-[48px] hover:bg-green-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          {t('chat.send')}
        </button>
      </div>
    </form>
  );
};

export default InputField;
