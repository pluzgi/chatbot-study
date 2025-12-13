import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
}

const DataNutritionLabel: React.FC<Props> = ({ compact = false }) => {
  const { t } = useTranslation();

  const allItems = [
    { icon: '🇨🇭', key: 'provenance' },
    { icon: '📖', key: 'ingredients' },
    { icon: '🛡️', key: 'protection' },
    { icon: '✅', key: 'compliance' },
    { icon: '📅', key: 'freshness' }
  ];

  // Compact list view for Condition D
  if (compact) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-3 md:p-4">
        <div className="space-y-3">
          {allItems.map(item => (
            <div key={item.key} className="flex items-start gap-2 md:gap-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
              <div className="text-xl md:text-2xl flex-shrink-0 mt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-base font-semibold text-black mb-1 leading-tight">{t(`dnl.${item.key}`)}</div>
                <div className="text-xs md:text-sm text-gray-700 leading-relaxed">{t(`dnl.${item.key}Value`)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Standard badge grid view for Conditions B
  const row1Items = allItems.slice(0, 3);
  const row2Items = allItems.slice(3);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg px-4 md:px-6 py-4 md:py-6">
      {/* Row 1: 3 badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
        {row1Items.map(item => (
          <div key={item.key} className="flex flex-col items-center text-center p-4 border-2 rounded-lg bg-green-50 border-green-400 hover:shadow-md transition min-h-[160px] md:min-h-[180px]">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-base font-semibold text-black mb-2 leading-tight">{t(`dnl.${item.key}`)}</div>
            <div className="text-[15px] md:text-base text-black leading-relaxed">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>

      {/* Row 2: 2 badges, centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 md:max-w-2xl md:mx-auto">
        {row2Items.map(item => (
          <div key={item.key} className="flex flex-col items-center text-center p-4 border-2 rounded-lg bg-green-50 border-green-400 hover:shadow-md transition min-h-[160px] md:min-h-[180px]">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-base font-semibold text-black mb-2 leading-tight">{t(`dnl.${item.key}`)}</div>
            <div className="text-[15px] md:text-base text-black leading-relaxed">{t(`dnl.${item.key}Value`)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataNutritionLabel;
