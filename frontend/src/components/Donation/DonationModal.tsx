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
  const [showConfirmation, setShowConfirmation] = useState<'donate' | 'decline' | null>(null);

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
    setShowConfirmation('donate');
  };

  const handleDecline = () => {
    setShowConfirmation('decline');
  };

  const handleContinue = () => {
    onDecision(showConfirmation!, dashboardConfig || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
        {showConfirmation ? (
          /* Confirmation Modal - Manual dismiss with button */
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              {showConfirmation === 'donate'
                ? t('donation.confirmDonate.title')
                : t('donation.confirmDecline.title')}
            </h2>

            <p className="text-lg text-gray-900 mb-4 leading-relaxed">
              {showConfirmation === 'donate'
                ? t('donation.confirmDonate.message')
                : t('donation.confirmDecline.message')}
            </p>

            <p className="text-base text-gray-700 mb-8">
              {t('donation.confirmDonate.nextStep')}
            </p>

            <button
              onClick={handleContinue}
              className="bg-[#DC143C] text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-[#B01030] transition"
            >
              {t('donation.confirmDonate.button')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('donation.title')}</h2>

            {/* Show baseline text if Condition A (no DNL, no Dashboard) */}
            {!config.showDNL && !config.showDashboard && (
              <>
                <p className="mb-6 text-gray-900 text-lg leading-relaxed">
                  {t('donation.baselineText')}
                </p>
                <p className="mb-8 text-gray-900 text-base leading-relaxed">
                  {t('donation.baselineHelp')}
                </p>
              </>
            )}

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
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleDonate}
                className="flex-1 bg-[#DC143C] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#B01030] transition"
              >
                {t('donation.accept')}
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-gray-300 text-gray-800 py-4 rounded-lg font-semibold text-lg hover:bg-gray-400 transition"
              >
                {t('donation.decline')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DonationModal;
