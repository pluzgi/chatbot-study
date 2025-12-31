import React from 'react';

// Swiss Flag Icon (Red background, white cross)
const SwissFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#FF0000" />
    <rect x="13" y="6" width="6" height="20" fill="white" />
    <rect x="6" y="13" width="20" height="6" fill="white" />
  </svg>
);

// Book Icon (Dark Grey)
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
  </svg>
);

// Shield with Checkmark Icon (Emerald Green)
const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// Lock Icon (Emerald Green)
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const DataNutritionLabel: React.FC = () => {
  const rows = [
    {
      id: 'origin',
      icon: <SwissFlag className="w-7 h-7" />,
      headline: 'SWISS PUBLIC SCIENCE',
      subtext: 'Non-profit research (EPFL & ETH)',
    },
    {
      id: 'source',
      icon: <BookIcon className="w-7 h-7 text-gray-800" />,
      headline: 'PUBLIC SOURCES ONLY',
      subtext: 'Wikipedia, Science & Open Gov Data',
    },
    {
      id: 'privacy',
      icon: <ShieldCheckIcon className="w-7 h-7 text-emerald-500" />,
      headline: 'IDENTITY REMOVED',
      subtext: 'Personal information are deleted',
    },
    {
      id: 'safety',
      icon: <LockIcon className="w-7 h-7 text-emerald-500" />,
      headline: 'NO DATA STORAGE',
      subtext: 'Your questions are not saved',
    },
  ];

  return (
    <div className="bg-white border-[3px] border-black w-fit mx-auto font-sans">
      {/* Header - Black bar with white text */}
      <div className="bg-black px-4 py-3">
        <h3 className="text-white text-center font-extrabold text-xl tracking-wide">
          MODEL DATA FACTS
        </h3>
      </div>

      {/* Facts rows */}
      {rows.map((row, index) => (
        <div
          key={row.id}
          className={`px-3 py-2 flex items-center gap-3 ${
            index < rows.length - 1 ? 'border-b border-black' : ''
          }`}
        >
          <div className="flex-shrink-0">{row.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-black uppercase text-[16px] leading-tight">
              {row.headline}
            </div>
            <div className="text-gray-600 text-[14px] font-normal">
              {row.subtext}
            </div>
          </div>
        </div>
      ))}

      {/* Footer - Compliance badge */}
      <div className="px-3 py-2 border-t border-black">
        <div className="flex items-center gap-1 text-[13px] text-gray-700">
          <span className="text-emerald-500 font-bold">✓</span>
          <span>Compliant with Swiss Data Protection Law</span>
        </div>
      </div>
    </div>
  );
};

export default DataNutritionLabel;
