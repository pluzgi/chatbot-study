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

  console.log('[DonationModal] Rendered with config:', config);

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

  // Condition D: Both DNL and Dashboard shown (needs special layout)
  const isConditionD = config.showDNL && config.showDashboard;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 ${isConditionD ? 'max-w-5xl' : 'max-w-2xl'}`}>
        {showConfirmation ? (
          /* Confirmation Modal - Manual dismiss with button */
          <div className="text-center py-6 md:py-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-black leading-tight">
              {showConfirmation === 'donate'
                ? t('donation.confirmDonate.title')
                : t('donation.confirmDecline.title')}
            </h2>

            <p className="text-base md:text-lg text-black mb-3 md:mb-4 leading-relaxed">
              {showConfirmation === 'donate'
                ? t('donation.confirmDonate.message')
                : t('donation.confirmDecline.message')}
            </p>

            <p className="text-base text-black mb-6 md:mb-8 leading-relaxed">
              {t('donation.confirmDonate.nextStep')}
            </p>

            <button
              onClick={handleContinue}
              className="w-full md:w-auto bg-gray-200 text-black px-10 py-4 rounded-lg font-semibold text-base md:text-lg min-h-[48px] hover:bg-green-600 hover:text-white transition"
            >
              {t('donation.confirmDonate.button')}
            </button>
          </div>
        ) : (
          <>
            {/* Step Headline */}
            <p className="text-base md:text-lg font-semibold text-black mb-4">{t('donation.stepHeadline')}</p>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-black leading-tight">{t('donation.title')}</h2>

            {/* Show baseline text if Condition A (no DNL, no Dashboard) */}
            {!config.showDNL && !config.showDashboard && (
              <>
                <p className="mb-4 md:mb-6 text-black text-lg md:text-xl leading-relaxed">
                  {t('donation.baselineText')}
                </p>
                <p className="mb-6 md:mb-8 text-black text-base md:text-lg leading-relaxed">
                  {t('donation.baselineHelp')}
                </p>
              </>
            )}

            {/* Condition D: Two-column layout (DNL + Dashboard) */}
            {isConditionD ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 items-start">
                {/* Left column: Data Nutrition Label (original card design) */}
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-black">
                    {t('donation.dnlIntro')}
                  </h3>
                  <DataNutritionLabel />
                </div>

                {/* Right column: Dashboard */}
                <div>
                  <GranularDashboard onChange={setDashboardConfig} />
                </div>
              </div>
            ) : (
              <>
                {/* Show DNL only (Condition B) */}
                {config.showDNL && (
                  <>
                    <p className="text-lg md:text-xl text-black mb-4 md:mb-6 leading-relaxed">
                      {t('donation.dnlIntro')}
                    </p>
                    <div className="mb-4 md:mb-6">
                      <DataNutritionLabel />
                    </div>
                  </>
                )}

                {/* Show Dashboard only (Condition C) */}
                {config.showDashboard && (
                  <div className="mb-4 md:mb-6">
                    <GranularDashboard onChange={setDashboardConfig} />
                  </div>
                )}
              </>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-base">
                {validationError}
              </div>
            )}

            {/* Buttons - Equal visual weight (no bias) */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-6 md:mt-8">
              <button
                onClick={handleDecline}
                className="w-full md:flex-1 bg-[#E5E7EB] text-black py-4 rounded-lg font-semibold text-base md:text-lg min-h-[48px] hover:bg-gray-300 transition"
              >
                {t('donation.decline')}
              </button>
              <button
                onClick={handleDonate}
                className="w-full md:flex-1 bg-[#D1D5DB] text-black py-4 rounded-lg font-semibold text-base md:text-lg min-h-[48px] hover:bg-gray-400 transition"
              >
                {t('donation.accept')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DonationModal;
