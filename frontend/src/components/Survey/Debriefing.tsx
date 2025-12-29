import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DebriefingProps {
  onEmailSubmit?: (email: string) => void;
}

const Debriefing: React.FC<DebriefingProps> = ({ onEmailSubmit }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleClose = () => {
    // Submit email if provided
    if (onEmailSubmit && email.trim()) {
      onEmailSubmit(email.trim());
    }
    window.location.href = 'https://luma.com/aiLights';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-10 bg-white rounded-lg shadow-lg">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-black text-center leading-tight">
          {t('debrief.title')}
        </h1>

        {/* Important Notice - Yellow Box */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
          <p className="text-base md:text-lg text-black leading-relaxed">
            <strong>{t('debrief.important')}</strong> {t('debrief.simulationNote')}
          </p>
        </div>

        {/* What We're Studying Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-black">
            {t('debrief.whatWeStudy')}
          </h2>
          <p className="text-base md:text-lg text-black leading-relaxed mb-4">
            {t('debrief.studyPurpose')}
          </p>

          {/* Email Input - integrated here */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label htmlFor="results-email" className="block text-base text-black mb-2">
              {t('debrief.emailPrompt')}
            </label>
            <input
              id="results-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-md p-3 text-base border border-gray-300 rounded-md bg-white"
              placeholder={t('debrief.emailPlaceholder')}
            />
          </div>
        </div>

        {/* Questions/Contact Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-black">
            {t('debrief.questions')}
          </h2>
          <p className="text-base md:text-lg text-black mb-3 leading-relaxed">
            {t('debrief.contactIntro')}
          </p>
          <div className="space-y-1 text-base md:text-lg text-black">
            <p>{t('debrief.researcher')}</p>
            <p>{t('debrief.institution')}</p>
            <p>{t('debrief.supervisor')}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full bg-gray-200 text-black py-4 rounded-lg font-semibold text-base md:text-lg min-h-[48px] hover:bg-green-600 hover:text-white transition"
        >
          {t('debrief.close')}
        </button>
      </div>
    </div>
  );
};

export default Debriefing;
