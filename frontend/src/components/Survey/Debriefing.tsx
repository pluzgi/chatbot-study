import React from 'react';
import { useTranslation } from 'react-i18next';

const Debriefing: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{t('debrief.title')}</h2>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="font-bold mb-2">⚠️ {t('debrief.important')}</p>
          <p className="text-sm">{t('debrief.simulationNote')}</p>
        </div>

        <div className="space-y-4 mb-6">
          <p>{t('debrief.purpose')}</p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
            <p className="font-semibold text-gray-900">{t('debrief.participationNote')}</p>
            <p className="text-sm text-gray-700 mt-2">
              {t('debrief.participationMessage')}
            </p>
          </div>

          <p className="text-sm text-gray-600">
            {t('debrief.contact')}: sabine.wildemann@example.com
          </p>
        </div>

        <button
          onClick={() => window.location.href = 'https://ailights.org'}
          className="w-full bg-[#DC143C] text-white py-3 rounded-lg font-semibold hover:bg-[#B01030] transition"
        >
          {t('debrief.close')}
        </button>
      </div>
    </div>
  );
};

export default Debriefing;
