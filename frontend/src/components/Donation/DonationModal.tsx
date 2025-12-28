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
    // New validation: scope is required, retention is required only when scope is selected
    // Purpose and storage are optional
    if (config.showDashboard) {
      if (!dashboardConfig || !dashboardConfig.scope) {
        setValidationError(t('dashboard.validationError'));
        return;
      }
      // Retention is required when scope is selected
      if (dashboardConfig.scope && !dashboardConfig.retention) {
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

  // Determine condition type
  const isConditionA = !config.showDNL && !config.showDashboard;
  const isConditionB = config.showDNL && !config.showDashboard;
  const isConditionC = !config.showDNL && config.showDashboard;
  const isConditionD = config.showDNL && config.showDashboard;

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 ${isConditionD ? 'max-w-3xl' : 'max-w-2xl'}`}>
        {showConfirmation ? (
          /* Confirmation Screen */
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
            {/* ===== SHARED HEADER (all conditions) ===== */}

            {/* Main Headline */}
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black leading-tight">
              <span className="text-gray-500 font-normal">Step 2 of 3 — </span>
              {t('donation.headline').replace('Step 2 of 3 — ', '')}
            </h2>

            {/* Transition Sentence */}
            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8 leading-relaxed">
              {t('donation.transition')}
            </p>

            {/* ===== CONDITION-SPECIFIC CONTENT ===== */}

            {/* Condition A: Baseline (no DNL, no Dashboard) */}
            {isConditionA && (
              <div className="mb-6 md:mb-8">
                <p className="text-base md:text-lg text-black leading-relaxed">
                  {t('donation.conditionA.text')}
                </p>
              </div>
            )}

            {/* Condition B: DNL only */}
            {isConditionB && (
              <div className="mb-6 md:mb-8">
                <p className="text-base md:text-lg text-black mb-4 leading-relaxed">
                  {t('donation.conditionB.intro')}
                </p>
                <DataNutritionLabel />
              </div>
            )}

            {/* Condition C: Dashboard only */}
            {isConditionC && (
              <div className="mb-6 md:mb-8">
                <p className="text-base md:text-lg text-black mb-4 leading-relaxed">
                  {t('donation.conditionC.intro')}
                </p>
                <GranularDashboard onChange={setDashboardConfig} />
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                  {t('donation.dashboardHelper')}
                </p>
              </div>
            )}

            {/* Condition D: DNL + Dashboard (stacked layout to reduce cognitive overload) */}
            {isConditionD && (
              <div className="mb-6 md:mb-8">
                <p className="text-base md:text-lg text-black mb-4 leading-relaxed">
                  {t('donation.conditionD.intro')}
                </p>

                {/* Section 1: About the Model (compact DNL) */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-xl">ℹ️</span>
                    {t('dnl.title')}
                  </h3>
                  <DataNutritionLabel />
                </div>

                {/* Visual separator */}
                <div className="border-t border-gray-200 my-6" />

                {/* Section 2: Your Preferences (Dashboard) */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-xl">⚙️</span>
                    {t('dashboard.title')}
                  </h3>
                  <GranularDashboard onChange={setDashboardConfig} />
                </div>
              </div>
            )}

            {/* ===== DECISION SECTION (all conditions) ===== */}
            <div className="mt-8">
              {/* Decision Question */}
              <p className="text-xl md:text-2xl font-semibold text-black mb-6 leading-relaxed">
                {t('donation.decisionQuestion')}
              </p>

            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-base">
                {validationError}
              </div>
            )}

            {/* Buttons - Matching landing page style (neutral, no color bias) */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Left: Donate Data (filled neutral, like "Start study") */}
              <button
                onClick={handleDonate}
                className="w-full md:flex-1 bg-gray-200 text-black py-4 rounded-md font-medium text-base md:text-lg min-h-[48px] hover:bg-green-600 hover:text-white transition"
              >
                {t('donation.accept')}
              </button>
              {/* Right: Don't Donate (outlined, like "Not interested") */}
              <button
                onClick={handleDecline}
                className="w-full md:flex-1 bg-white text-black border border-gray-300 py-4 rounded-md font-medium text-base md:text-lg min-h-[48px] hover:bg-gray-100 transition"
              >
                {t('donation.decline')}
              </button>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DonationModal;
