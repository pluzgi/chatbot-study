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

  // Derived state
  const isDonatingFlowActive = shareChoice !== null;

  // Clear retention when share choice is cleared
  useEffect(() => {
    if (!shareChoice) {
      setRetentionChoice(null);
    }
  }, [shareChoice]);

  // Update parent whenever config changes
  useEffect(() => {
    const config: DonationConfig = {};
    if (shareChoice) config.scope = shareChoice as DonationConfig['scope'];
    if (usageChoice) config.purpose = usageChoice as DonationConfig['purpose'];
    if (storageChoice) config.storage = storageChoice as DonationConfig['storage'];
    if (retentionChoice) config.retention = retentionChoice as DonationConfig['retention'];
    onChange(config);
  }, [shareChoice, usageChoice, storageChoice, retentionChoice, onChange]);

  // Options data
  const shareOptions = [
    { key: 'topics-only', label: t('dashboard.scope.topicsOnly'), desc: t('dashboard.scope.topicsOnlyDesc') },
    { key: 'questions-only', label: t('dashboard.scope.questionsOnly'), desc: t('dashboard.scope.questionsOnlyDesc') },
    { key: 'full', label: t('dashboard.scope.full'), desc: t('dashboard.scope.fullDesc') }
  ];
  const usageOptions = [
    { key: 'academic', label: t('dashboard.purpose.academic') },
    { key: 'commercial', label: t('dashboard.purpose.commercial') }
  ];
  const storageOptions = [
    { key: 'swiss', label: t('dashboard.storage.swiss') },
    { key: 'swiss-or-eu', label: t('dashboard.storage.swissOrEu') },
    { key: 'no-preference', label: t('dashboard.storage.noPreference') }
  ];
  const retentionOptions = [
    { key: 'until-fulfilled', label: t('dashboard.retention.untilFulfilled') },
    { key: '6months', label: t('dashboard.retention.6months') },
    { key: '1year', label: t('dashboard.retention.1year') },
    { key: 'indefinite', label: t('dashboard.retention.indefinite') }
  ];

  // Reusable radio option component
  const RadioOption = ({
    selected,
    label,
    desc,
    onClick,
    disabled,
    name
  }: {
    selected: boolean;
    label: string;
    desc?: string;
    onClick: () => void;
    disabled?: boolean;
    name: string;
  }) => (
    <label
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
        disabled
          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
          : selected
            ? 'border-gray-900 bg-gray-50'
            : 'border-gray-200 bg-white hover:border-gray-400'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onClick}
        disabled={disabled}
        className="sr-only"
        tabIndex={disabled ? -1 : 0}
      />
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-gray-900 bg-gray-900' : disabled ? 'border-gray-300' : 'border-gray-400'
      }`}>
        {selected && (
          <div className="w-2 h-2 rounded-full bg-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-base font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{label}</p>
        {desc && <p className={`text-sm mt-0.5 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>{desc}</p>}
      </div>
    </label>
  );

  // Panel component
  const Panel = ({
    title,
    children,
    disabled
  }: {
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <div
      className={`rounded-lg border-2 transition-all p-4 ${
        disabled
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white'
      }`}
      aria-disabled={disabled}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-lg text-gray-900 bg-gray-100 inline-block px-3 py-1 rounded-md">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Panel 1: What to share */}
      <Panel title={t('dashboard.scope.label')}>
        <div className="space-y-2">
          {shareOptions.map(opt => (
            <RadioOption
              key={opt.key}
              name="share-choice"
              selected={shareChoice === opt.key}
              label={opt.label}
              desc={opt.desc}
              onClick={() => setShareChoice(shareChoice === opt.key ? null : opt.key)}
            />
          ))}
        </div>
      </Panel>

      {/* Panel 2: How data will be used */}
      <Panel title={t('dashboard.purpose.label')} disabled={!isDonatingFlowActive}>
        <div className="space-y-2">
          {usageOptions.map(opt => (
            <RadioOption
              key={opt.key}
              name="usage-choice"
              selected={usageChoice === opt.key}
              label={opt.label}
              onClick={() => setUsageChoice(usageChoice === opt.key ? null : opt.key)}
              disabled={!isDonatingFlowActive}
            />
          ))}
        </div>
      </Panel>

      {/* Panels 3 & 4: Storage and Retention (side-by-side on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Panel 3: Where stored */}
        <Panel title={t('dashboard.storage.label')} disabled={!isDonatingFlowActive}>
          <div className="space-y-2">
            {storageOptions.map(opt => (
              <RadioOption
                key={opt.key}
                name="storage-choice"
                selected={storageChoice === opt.key}
                label={opt.label}
                onClick={() => setStorageChoice(storageChoice === opt.key ? null : opt.key)}
                disabled={!isDonatingFlowActive}
              />
            ))}
          </div>
        </Panel>

        {/* Panel 4: Retention */}
        <Panel
          title={t('dashboard.retention.label')}
          disabled={!isDonatingFlowActive}
        >
          <div className="space-y-2">
            {retentionOptions.map(opt => (
              <RadioOption
                key={opt.key}
                name="retention-choice"
                selected={retentionChoice === opt.key}
                label={opt.label}
                onClick={() => setRetentionChoice(retentionChoice === opt.key ? null : opt.key)}
                disabled={!isDonatingFlowActive}
              />
            ))}
          </div>
        </Panel>
      </div>

      {/* Info text */}
      <p className="text-base text-gray-500 mt-4 mb-8 flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('dashboard.revocability')}
      </p>
    </div>
  );
};

export default GranularDashboard;
