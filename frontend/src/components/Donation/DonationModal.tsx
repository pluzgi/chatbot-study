import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExperimentConfig, DonationConfig } from '../../types';
import DataNutritionLabel from './DataNutritionLabel';
import GranularDashboard from './GranularDashboard';

interface Props {
  config: ExperimentConfig;
  onDecision: (decision: 'donate' | 'decline', config?: DonationConfig) => void;
}

const DonationModal: React.FC<Props> = ({ config, onDecision }) => {
  const { t } = useTranslation();
  const [dashboardConfig, setDashboardConfig] = useState<DonationConfig | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleDonate = () => {
    // Validate if dashboard is shown (Conditions C or D)
    if (config.showDashboard) {
      if (!dashboardConfig ||
          !dashboardConfig.scope ||
          !dashboardConfig.purpose ||
          !dashboardConfig.storage ||
          !dashboardConfig.retention) {
        setValidationError(t('dashboard.validationError'));
        return;
      }
    }
    setValidationError(null);
    onDecision('donate', dashboardConfig || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{t('donation.title')}</h2>
        <p className="mb-6">{t('donation.description')}</p>

        {/* Show DNL if high transparency (Condition B or D) */}
        {config.showDNL && (
          <div className="mb-6">
            <DataNutritionLabel />
          </div>
        )}

        {/* Show Dashboard if high control (Condition C or D) */}
        {config.showDashboard && (
          <div className="mb-6">
            <GranularDashboard onChange={setDashboardConfig} />
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {validationError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleDonate}
            className="flex-1 bg-[#DC143C] text-white py-3 rounded-lg font-semibold hover:bg-[#B01030] transition"
          >
            {t('donation.accept')}
          </button>
          <button
            onClick={() => onDecision('decline')}
            className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            {t('donation.decline')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
