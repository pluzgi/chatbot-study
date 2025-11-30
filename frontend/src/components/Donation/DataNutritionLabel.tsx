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
    <div className="bg-white border-2 border-gray-300 rounded-lg px-6 py-6">
      {/* Row 1: 3 badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {row1Items.map(item => (
          <div key={item.key} className="flex flex-col items-center text-center p-4 border-2 rounded-lg bg-green-50 border-green-400 hover:shadow-md transition min-h-[180px]">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-base font-semibold text-black mb-2">{t(`dnl.${item.key}`)}</div>
            <div className="text-sm text-black leading-relaxed">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>

      {/* Row 2: 2 badges, centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:max-w-2xl md:mx-auto">
        {row2Items.map(item => (
          <div key={item.key} className="flex flex-col items-center text-center p-4 border-2 rounded-lg bg-green-50 border-green-400 hover:shadow-md transition min-h-[180px]">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-base font-semibold text-black mb-2">{t(`dnl.${item.key}`)}</div>
            <div className="text-sm text-black leading-relaxed">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataNutritionLabel;
