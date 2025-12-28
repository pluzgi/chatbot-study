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

  // Options data (Q1 has no descriptions per requirement)
  const shareOptions = [
    { key: 'topics-only', label: t('dashboard.scope.topicsOnly') },
    { key: 'questions-only', label: t('dashboard.scope.questionsOnly') },
    { key: 'full', label: t('dashboard.scope.full') }
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

  // Progressive disclosure: determine which step is active
  const getActiveStep = (): number => {
    if (!shareChoice) return 1;
    if (!usageChoice) return 2;
    if (!storageChoice) return 3;
    if (!retentionChoice) return 4;
    return 5; // All completed
  };

  const activeStep = getActiveStep();

  // Helper to get selected label
  const getSelectedLabel = (options: { key: string; label: string }[], value: string | null) => {
    return options.find(opt => opt.key === value)?.label || '';
  };

  // Reusable radio option component
  const RadioOption = ({
    selected,
    label,
    onClick,
    name,
    id
  }: {
    selected: boolean;
    label: string;
    onClick: () => void;
    name: string;
    id: string;
  }) => (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
        selected
          ? 'border-green-600 bg-green-50'
          : 'border-gray-200 bg-white hover:border-gray-400'
      }`}
    >
      <input
        type="radio"
        id={id}
        name={name}
        checked={selected}
        onChange={onClick}
        className="sr-only"
      />
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-green-600' : 'border-gray-400'
      }`}>
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
        )}
      </div>
      <span className="text-base font-medium text-gray-900">{label}</span>
    </label>
  );

  // Collapsed answer display (shows selected answer only)
  const CollapsedAnswer = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-sm font-medium text-green-800">{label}</span>
    </div>
  );

  // Pending question display (shows only the question title, grayed out)
  const PendingQuestion = ({ title }: { title: string }) => (
    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 opacity-60">
      <h3 className="font-semibold text-base text-gray-400">{title}</h3>
    </div>
  );

  // Question panel with fieldset for accessibility
  const QuestionPanel = ({
    step,
    title,
    options,
    value,
    onChange: onValueChange,
    name
  }: {
    step: number;
    title: string;
    options: { key: string; label: string }[];
    value: string | null;
    onChange: (val: string) => void;
    name: string;
  }) => {
    const isActive = activeStep === step;
    const isCompleted = activeStep > step;
    const isPending = activeStep < step;

    if (isPending) {
      return <PendingQuestion title={title} />;
    }

    if (isCompleted && value) {
      return (
        <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base text-gray-700">{title}</h3>
            <button
              type="button"
              onClick={() => onValueChange('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
              aria-label={`Change answer for ${title}`}
            >
              Change
            </button>
          </div>
          <CollapsedAnswer label={getSelectedLabel(options, value)} />
        </div>
      );
    }

    return (
      <fieldset
        className="rounded-lg border-2 border-gray-300 bg-white p-4"
        aria-expanded={isActive}
      >
        <legend className="sr-only">{title}</legend>
        <h3 className="font-semibold text-lg text-gray-900 mb-3">{title}</h3>
        <div className="space-y-2" role="radiogroup" aria-label={title}>
          {options.map(opt => (
            <RadioOption
              key={opt.key}
              id={`${name}-${opt.key}`}
              name={name}
              selected={value === opt.key}
              label={opt.label}
              onClick={() => onValueChange(opt.key)}
            />
          ))}
        </div>
      </fieldset>
    );
  };

  // Handle value change with clearing logic
  const handleShareChange = (val: string) => {
    if (val === '') {
      setShareChoice(null);
      setUsageChoice(null);
      setStorageChoice(null);
      setRetentionChoice(null);
    } else {
      setShareChoice(val);
    }
  };

  const handleUsageChange = (val: string) => {
    if (val === '') {
      setUsageChoice(null);
      setStorageChoice(null);
      setRetentionChoice(null);
    } else {
      setUsageChoice(val);
    }
  };

  const handleStorageChange = (val: string) => {
    if (val === '') {
      setStorageChoice(null);
      setRetentionChoice(null);
    } else {
      setStorageChoice(val);
    }
  };

  const handleRetentionChange = (val: string) => {
    if (val === '') {
      setRetentionChoice(null);
    } else {
      setRetentionChoice(val);
    }
  };

  return (
    <div className="space-y-3" role="form" aria-label="Data donation configuration">
      {/* Q1: What to share */}
      <QuestionPanel
        step={1}
        title={t('dashboard.scope.label')}
        options={shareOptions}
        value={shareChoice}
        onChange={handleShareChange}
        name="share-choice"
      />

      {/* Q2: How data will be used */}
      <QuestionPanel
        step={2}
        title={t('dashboard.purpose.label')}
        options={usageOptions}
        value={usageChoice}
        onChange={handleUsageChange}
        name="usage-choice"
      />

      {/* Q3: Where stored */}
      <QuestionPanel
        step={3}
        title={t('dashboard.storage.label')}
        options={storageOptions}
        value={storageChoice}
        onChange={handleStorageChange}
        name="storage-choice"
      />

      {/* Q4: Retention */}
      <QuestionPanel
        step={4}
        title={t('dashboard.retention.label')}
        options={retentionOptions}
        value={retentionChoice}
        onChange={handleRetentionChange}
        name="retention-choice"
      />

      {/* Info text */}
      <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('dashboard.revocability')}
      </p>
    </div>
  );
};

export default GranularDashboard;
