import React from 'react';
import { useTranslation } from 'react-i18next';

const Debriefing: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-10 bg-white rounded-lg shadow-lg">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-900 text-center leading-tight">
          {t('debrief.title')}
        </h1>

        {/* Important Notice - Yellow Box */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
          <p className="text-base md:text-lg text-gray-800 leading-relaxed">
            <strong>{t('debrief.important')}</strong> {t('debrief.simulationNote')}
          </p>
        </div>

        {/* What We're Studying Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-900">
            {t('debrief.whatWeStudy')}
          </h2>
          <p className="text-base md:text-lg text-gray-800 leading-relaxed">
            {t('debrief.studyPurpose')}
          </p>
        </div>

        {/* Questions/Contact Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-900">
            {t('debrief.questions')}
          </h2>
          <p className="text-base md:text-lg text-gray-800 mb-3 leading-relaxed">
            {t('debrief.contactIntro')}
          </p>
          <div className="space-y-1 text-base md:text-lg text-gray-800">
            <p>{t('debrief.researcher')}</p>
            <p>{t('debrief.institution')}</p>
            <p>{t('debrief.supervisor')}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => window.location.href = 'https://ailights.org'}
          className="w-full bg-[#FF0000] text-white py-4 rounded-lg font-semibold text-base md:text-lg min-h-[48px] hover:bg-[#CC0000] transition"
        >
          {t('debrief.close')}
        </button>
      </div>
    </div>
  );
};

export default Debriefing;
