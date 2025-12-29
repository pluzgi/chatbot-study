import React from 'react';
import { useTranslation } from 'react-i18next';

const DataNutritionLabel: React.FC = () => {
  const { t } = useTranslation();

  const row1Items = [
    { icon: '🇨🇭', key: 'provenance' },
    { icon: '📖', key: 'ingredients' },
    { icon: '🛡️', key: 'protection' }
  ];

  const row2Items = [
    { icon: '✅', key: 'compliance' },
    { icon: '📅', key: 'freshness' }
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Row 1: 3 badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {row1Items.map(item => (
          <div key={item.key} className="border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-base font-medium text-black mb-1">{t(`dnl.${item.key}`)}</div>
            <div className="text-sm text-black">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>

      {/* Row 2: 2 badges, centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
        {row2Items.map(item => (
          <div key={item.key} className="border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-base font-medium text-black mb-1">{t(`dnl.${item.key}`)}</div>
            <div className="text-sm text-black">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataNutritionLabel;
