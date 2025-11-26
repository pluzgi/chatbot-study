import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            i18n.language === lang.code
              ? 'bg-[#DC143C] text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
