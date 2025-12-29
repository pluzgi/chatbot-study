import React, { useState, useEffect, useMemo } from 'react';
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

  // Calculate active step based on filled values
  const activeStep = useMemo(() => {
    if (!shareChoice) return 1;
    if (!usageChoice) return 2;
    if (!storageChoice) return 3;
    if (!retentionChoice) return 4;
    return 5; // All complete
  }, [shareChoice, usageChoice, storageChoice, retentionChoice]);

  // Panel configuration
  const panels = [
    {
      step: 1,
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
      step: 2,
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
      step: 3,
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
      step: 4,
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

  // Get selected label for collapsed view
  const getSelectedLabel = (options: { key: string; label: string }[], value: string | null) => {
    const option = options.find(opt => opt.key === value);
    return option?.label || '';
  };

  // Pending question (grayed out, only title visible)
  const PendingPanel = ({ title }: { title: string }) => (
    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 opacity-60">
      <h3 className="font-semibold text-base text-gray-400">{title}</h3>
    </div>
  );

  // Collapsed answer display (completed questions)
  const CollapsedPanel = ({
    title,
    selectedLabel,
    onEdit
  }: {
    title: string;
    selectedLabel: string;
    onEdit: () => void;
  }) => (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-base text-gray-700">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Change
        </button>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-medium text-green-800">{selectedLabel}</span>
      </div>
    </div>
  );

  // Active panel (expanded with radio options)
  const ActivePanel = ({
    panel
  }: {
    panel: typeof panels[0];
  }) => (
    <fieldset className="rounded-lg border-2 border-gray-300 bg-white p-4">
      <legend className="sr-only">{panel.title}</legend>
      <h3 className="font-semibold text-lg text-gray-900 mb-3">{panel.title}</h3>
      <div className="space-y-2" role="radiogroup" aria-label={panel.title}>
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
    </fieldset>
  );

  return (
    <div className="space-y-3">
      {panels.map((panel) => {
        const isCompleted = activeStep > panel.step;
        const isPending = activeStep < panel.step;
        const isActive = activeStep === panel.step;

        // PENDING: Show only grayed-out title
        if (isPending) {
          return <PendingPanel key={panel.name} title={panel.title} />;
        }

        // COMPLETED: Show collapsed with selected answer + change button
        if (isCompleted && panel.value) {
          return (
            <CollapsedPanel
              key={panel.name}
              title={panel.title}
              selectedLabel={getSelectedLabel(panel.options, panel.value)}
              onEdit={() => panel.onChange(null)}
            />
          );
        }

        // ACTIVE: Show full options
        if (isActive) {
          return <ActivePanel key={panel.name} panel={panel} />;
        }

        return null;
      })}

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
