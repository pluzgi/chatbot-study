import React from 'react';
import { useTranslation } from 'react-i18next';

const DataNutritionLabel: React.FC = () => {
  const { t } = useTranslation();

  const items = [
    { icon: '🇨🇭', key: 'provenance' },
    { icon: '📖', key: 'ingredients' },
    { icon: '🛡️', key: 'protection' },
    { icon: '✅', key: 'compliance' },
    { icon: '📅', key: 'freshness' }
  ];

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-2 text-center">
        {t('dnl.title')}
      </h3>

      <p className="text-sm text-gray-600 text-center mb-4">
        {t('dnl.intro')}
      </p>

      {/* Horizontal at-a-glance badges */}
      <div className="grid grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.key} className="flex flex-col items-center text-center p-3 border-2 rounded-lg bg-green-50 border-green-400 hover:shadow-md transition">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs font-bold text-gray-800 mb-1">{t(`dnl.${item.key}`)}</div>
            <div className="text-[10px] text-gray-600 leading-tight">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataNutritionLabel;
