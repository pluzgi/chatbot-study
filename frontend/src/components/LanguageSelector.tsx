import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'de', label: 'DE' },
    { code: 'fr', label: 'FR' },
    { code: 'it', label: 'IT' },
    { code: 'en', label: 'EN' }
  ];

  return (
    <div className="flex gap-2">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1.5 text-xs font-medium rounded transition ${
            i18n.language === lang.code
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
