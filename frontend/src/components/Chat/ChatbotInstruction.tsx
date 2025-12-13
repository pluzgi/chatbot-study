import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onContinue: () => void;
}

const ChatbotInstruction: React.FC<Props> = ({ onContinue }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
        {/* Headline */}
        <h1 className="text-2xl md:text-[28px] font-bold mb-6 md:mb-8 text-gray-900 text-left leading-tight">
          {t('instruction.headline')}
        </h1>

        {/* Main Text */}
        <div className="mb-6 md:mb-8 space-y-4 text-left">
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('instruction.text1')}
          </p>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            {t('instruction.text2')}
          </p>
          {t('instruction.text3') && (
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              {t('instruction.text3')}
            </p>
          )}
        </div>

        {/* Task */}
        <div className="mb-6 md:mb-8 text-left">
          <p className="text-base md:text-lg font-semibold text-gray-900 mb-2 leading-relaxed">
            {t('instruction.task')}
          </p>
        </div>

        {/* Examples */}
        <div className="mb-8 md:mb-12 text-left">
          <p className="text-base font-semibold text-gray-700 mb-4">
            {t('instruction.examplesLabel')}
          </p>
          <ul className="space-y-3">
            <li className="text-[15px] md:text-base text-gray-600 pl-4 border-l-2 border-gray-300 leading-relaxed">
              {t('instruction.example1')}
            </li>
            <li className="text-[15px] md:text-base text-gray-600 pl-4 border-l-2 border-gray-300 leading-relaxed">
              {t('instruction.example2')}
            </li>
            <li className="text-[15px] md:text-base text-gray-600 pl-4 border-l-2 border-gray-300 leading-relaxed">
              {t('instruction.example3')}
            </li>
          </ul>
        </div>

        {/* Button */}
        <div className="flex justify-end">
          <button
            onClick={onContinue}
            className="w-full md:w-auto bg-[#FF0000] text-white px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-[#CC0000] transition"
          >
            {t('instruction.button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInstruction;
