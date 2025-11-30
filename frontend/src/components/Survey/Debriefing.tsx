import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  withdrawalCode?: string;
}

const Debriefing: React.FC<Props> = ({ withdrawalCode }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">
          {t('debrief.title')}
        </h1>

        {/* Important Information Section */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            {t('debrief.important')}
          </h2>
          <p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">
            {t('debrief.simulationNote')}
          </p>
        </div>

        {/* What We're Studying Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            {t('debrief.whatWeStudy')}
          </h2>
          <p className="text-base text-gray-800 mb-4 whitespace-pre-line leading-relaxed">
            {t('debrief.studyPurpose')}
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li className="text-base text-gray-800">{t('debrief.benefit1')}</li>
            <li className="text-base text-gray-800">{t('debrief.benefit2')}</li>
            <li className="text-base text-gray-800">{t('debrief.benefit3')}</li>
          </ul>
        </div>

        {/* Your Data Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            {t('debrief.yourData')}
          </h2>
          <p className="text-base text-gray-800 mb-4 leading-relaxed">
            {t('debrief.dataNote')}
          </p>
          {withdrawalCode && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                {t('debrief.withdrawNote')}
              </p>
              <p className="text-lg font-mono font-bold text-blue-900">
                {withdrawalCode}
              </p>
            </div>
          )}
        </div>

        {/* Questions/Contact Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            {t('debrief.questions')}
          </h2>
          <div className="space-y-2 text-base text-gray-800">
            <p>{t('debrief.researcher')}</p>
            <p>{t('debrief.studentId')}</p>
            <p>{t('debrief.email')}</p>
            <p>{t('debrief.institution')}</p>
            <p>{t('debrief.program')}</p>
            <p>{t('debrief.supervisor')}</p>
          </div>
          <p className="text-base text-gray-700 mt-4 italic">
            {t('debrief.thankYou')}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => window.location.href = 'https://ailights.org'}
          className="w-full bg-[#FF0000] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#CC0000] transition"
        >
          {t('debrief.close')}
        </button>
      </div>
    </div>
  );
};

export default Debriefing;
