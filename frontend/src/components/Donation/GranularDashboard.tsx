import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DonationConfig } from '../../types';

interface Props {
  onChange: (config: DonationConfig) => void;
}

const GranularDashboard: React.FC<Props> = ({ onChange }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<DonationConfig>({});

  const update = (key: keyof DonationConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 p-4 md:p-6 rounded-lg">
      <h3 className="text-lg md:text-xl font-bold leading-tight">{t('dashboard.title')}</h3>

      {/* Scope */}
      <div>
        <label className="block font-semibold mb-2 text-base">{t('dashboard.scope.label')}</label>
        <select
          value={config.scope || ''}
          onChange={e => update('scope', e.target.value)}
          className="w-full p-3 md:p-2 border rounded text-base min-h-[48px] md:min-h-[40px]"
        >
          <option value="" disabled>{t('dashboard.placeholder')}</option>
          <option value="topics">{t('dashboard.scope.topics')}</option>
          <option value="full">{t('dashboard.scope.full')}</option>
        </select>
      </div>

      {/* Purpose */}
      <div>
        <label className="block font-semibold mb-2 text-base">{t('dashboard.purpose.label')}</label>
        <select
          value={config.purpose || ''}
          onChange={e => update('purpose', e.target.value)}
          className="w-full p-3 md:p-2 border rounded text-base min-h-[48px] md:min-h-[40px]"
        >
          <option value="" disabled>{t('dashboard.placeholder')}</option>
          <option value="academic">{t('dashboard.purpose.academic')}</option>
          <option value="commercial">{t('dashboard.purpose.commercial')}</option>
        </select>
      </div>

      {/* Storage Location */}
      <div>
        <label className="block font-semibold mb-2 text-base">{t('dashboard.storage.label')}</label>
        <select
          value={config.storage || ''}
          onChange={e => update('storage', e.target.value)}
          className="w-full p-3 md:p-2 border rounded text-base min-h-[48px] md:min-h-[40px]"
        >
          <option value="" disabled>{t('dashboard.placeholder')}</option>
          <option value="swiss">{t('dashboard.storage.swiss')}</option>
          <option value="eu">{t('dashboard.storage.eu')}</option>
          <option value="no-preference">{t('dashboard.storage.noPreference')}</option>
        </select>
      </div>

      {/* Retention */}
      <div>
        <label className="block font-semibold mb-2 text-base">{t('dashboard.retention.label')}</label>
        <select
          value={config.retention || ''}
          onChange={e => update('retention', e.target.value)}
          className="w-full p-3 md:p-2 border rounded text-base min-h-[48px] md:min-h-[40px]"
        >
          <option value="" disabled>{t('dashboard.placeholder')}</option>
          <option value="1month">{t('dashboard.retention.1month')}</option>
          <option value="3months">{t('dashboard.retention.3months')}</option>
          <option value="6months">{t('dashboard.retention.6months')}</option>
          <option value="1year">{t('dashboard.retention.1year')}</option>
          <option value="indefinite">{t('dashboard.retention.indefinite')}</option>
        </select>
      </div>

      <div className="bg-green-50 border border-green-200 p-3 md:p-4 rounded text-base leading-relaxed">
        {t('dashboard.revocability')}
      </div>
    </div>
  );
};

export default GranularDashboard;
