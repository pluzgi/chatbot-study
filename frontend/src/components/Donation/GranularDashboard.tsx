import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DonationConfig } from '../../types';

interface Props {
  onChange: (config: DonationConfig) => void;
}

const GranularDashboard: React.FC<Props> = ({ onChange }) => {
  const { t } = useTranslation();

  // State management
  const [shareChoice, setShareChoice] = useState<string | null>(null);
  const [usageChoice, setUsageChoice] = useState<string | null>(null);
  const [storageChoice, setStorageChoice] = useState<string | null>(null);
  const [retentionChoice, setRetentionChoice] = useState<string | null>(null);

  // Update parent whenever config changes
  useEffect(() => {
    const config: DonationConfig = {};
    if (shareChoice) config.scope = shareChoice as DonationConfig['scope'];
    if (usageChoice) config.purpose = usageChoice as DonationConfig['purpose'];
    if (storageChoice) config.storage = storageChoice as DonationConfig['storage'];
    if (retentionChoice) config.retention = retentionChoice as DonationConfig['retention'];
    onChange(config);
  }, [shareChoice, usageChoice, storageChoice, retentionChoice, onChange]);

  // Panel configuration matching navigator exactly
  const panels = [
    {
      title: t('dashboard.scope.label'),
      options: [
        { key: 'topics-only', label: t('dashboard.scope.topicsOnly') },
        { key: 'questions-only', label: t('dashboard.scope.questionsOnly') },
        { key: 'full', label: t('dashboard.scope.full') }
      ],
      value: shareChoice,
      onChange: setShareChoice,
      name: 'share-choice'
    },
    {
      title: t('dashboard.purpose.label'),
      options: [
        { key: 'academic', label: t('dashboard.purpose.academic') },
        { key: 'commercial', label: t('dashboard.purpose.commercial') }
      ],
      value: usageChoice,
      onChange: setUsageChoice,
      name: 'usage-choice'
    },
    {
      title: t('dashboard.storage.label'),
      options: [
        { key: 'swiss', label: t('dashboard.storage.swiss') },
        { key: 'swiss-or-eu', label: t('dashboard.storage.swissOrEu') },
        { key: 'no-preference', label: t('dashboard.storage.noPreference') }
      ],
      value: storageChoice,
      onChange: setStorageChoice,
      name: 'storage-choice'
    },
    {
      title: t('dashboard.retention.label'),
      options: [
        { key: 'until-fulfilled', label: t('dashboard.retention.untilFulfilled') },
        { key: '6months', label: t('dashboard.retention.6months') },
        { key: '1year', label: t('dashboard.retention.1year') },
        { key: 'indefinite', label: t('dashboard.retention.indefinite') }
      ],
      value: retentionChoice,
      onChange: setRetentionChoice,
      name: 'retention-choice'
    }
  ];

  return (
    <div className="space-y-3">
      {panels.map((panel, idx) => (
        <div key={idx} className="rounded-lg border-2 border-gray-200 bg-white p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 bg-gray-100 inline-block px-3 py-1 rounded-md">{panel.title}</h3>
          </div>
          <div className="space-y-2">
            {panel.options.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  panel.value === opt.key
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name={panel.name}
                  checked={panel.value === opt.key}
                  onChange={() => panel.onChange(opt.key)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  panel.value === opt.key ? 'border-green-600' : 'border-gray-400'
                }`}>
                  {panel.value === opt.key && (
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  )}
                </div>
                <span className="text-base font-medium text-gray-900">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GranularDashboard;
