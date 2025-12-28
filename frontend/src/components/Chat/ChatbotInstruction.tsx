import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onContinue: () => void;
}

const ChatbotInstruction: React.FC<Props> = ({ onContinue }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
        {/* About this study - Main Headline */}
        <div className="mb-8 md:mb-10 text-left">
          <h1 className="text-2xl md:text-[28px] font-bold mb-4 text-black leading-tight">
            {t('instruction.aboutTitle')}
          </h1>
          <div className="space-y-3">
            <p className="text-base md:text-lg text-black leading-relaxed">
              {t('instruction.aboutText1')}
            </p>
            <p className="text-base md:text-lg text-black leading-relaxed">
              {t('instruction.aboutText2')}
            </p>
          </div>
        </div>

        {/* Step 1 - Subheadline */}
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-black text-left leading-tight">
          <span className="text-gray-500 font-normal">Step 1 of 3 — </span>
          {t('instruction.headline').replace('Step 1 of 3 — ', '')}
        </h2>

        {/* Main Text */}
        <div className="mb-6 md:mb-8 space-y-4 text-left">
          <p className="text-base md:text-lg text-black leading-relaxed">
            {t('instruction.text1')}
          </p>
          <p className="text-base md:text-lg text-black leading-relaxed">
            {t('instruction.text2')}
          </p>
          {t('instruction.text3') && (
            <p className="text-base md:text-lg text-black leading-relaxed">
              {t('instruction.text3')}
            </p>
          )}
        </div>

        {/* Task */}
        <div className="mb-6 md:mb-8 text-left">
          <p className="text-base md:text-lg font-semibold text-black mb-2 leading-relaxed">
            {t('instruction.task')}
          </p>
          <p className="text-base md:text-lg text-black leading-relaxed">
            {t('instruction.taskSubtitle')}
          </p>
        </div>

        {/* Examples */}
        <div className="mb-6 md:mb-8 text-left">
          <p className="text-sm md:text-base font-semibold text-black mb-2">
            {t('instruction.examplesLabel')}
          </p>
          <ul className="space-y-1.5">
            <li className="text-sm text-black pl-3 border-l-2 border-gray-300 leading-snug">
              {t('instruction.example1')}
            </li>
            <li className="text-sm text-black pl-3 border-l-2 border-gray-300 leading-snug">
              {t('instruction.example2')}
            </li>
            <li className="text-sm text-black pl-3 border-l-2 border-gray-300 leading-snug">
              {t('instruction.example3')}
            </li>
          </ul>
        </div>

        {/* Button */}
        <div className="flex justify-end">
          <button
            onClick={onContinue}
            className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
          >
            {t('instruction.button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInstruction;
