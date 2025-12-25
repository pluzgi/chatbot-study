import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LikertScale from './LikertScale';

interface Props {
  participantId: string;
  onComplete: (data: { techComfort: number; privacyConcern: number }) => void;
}

const BaselineSurvey: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentQuestion, setCurrentQuestion] = useState<1 | 2>(1);
  const [techComfort, setTechComfort] = useState<number | null>(null);
  const [privacyConcern, setPrivacyConcern] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const handleContinue = () => {
    if (currentQuestion === 1) {
      if (techComfort === null) {
        setError(true);
        return;
      }
      setError(false);
      setCurrentQuestion(2);
    } else {
      if (privacyConcern === null) {
        setError(true);
        return;
      }
      // Both answers complete, call onComplete
      onComplete({
        techComfort: techComfort!,
        privacyConcern: privacyConcern!
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
        {/* Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-black leading-tight">
            {t('baseline.title')}
          </h1>
          <p className="text-base md:text-lg text-black">
            {t('baseline.subtitle')}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 md:mb-12">
          <p className="text-sm text-gray-400 mb-2">
            {t('baseline.progress', { current: currentQuestion })}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-[3px]">
            <div
              className="bg-[#D1D5DB] h-[3px] rounded-full transition-all"
              style={{ width: `${(currentQuestion / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Question 1: Tech Comfort */}
        {currentQuestion === 1 && (
          <div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
              {t('baseline.techComfort.question')}
            </h2>

            <LikertScale
              name="techComfort"
              value={techComfort}
              onChange={(value) => {
                setTechComfort(value);
                setError(false);
              }}
              leftLabel={t('baseline.techComfort.stronglyDisagree')}
              rightLabel={t('baseline.techComfort.stronglyAgree')}
              points={7}
            />
          </div>
        )}

        {/* Question 2: Privacy Concern */}
        {currentQuestion === 2 && (
          <div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
              {t('baseline.privacyConcern.question')}
            </h2>

            <LikertScale
              name="privacyConcern"
              value={privacyConcern}
              onChange={(value) => {
                setPrivacyConcern(value);
                setError(false);
              }}
              leftLabel={t('baseline.privacyConcern.stronglyDisagree')}
              rightLabel={t('baseline.privacyConcern.stronglyAgree')}
              points={7}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-base mt-4">
            {t('baseline.validationError')}
          </p>
        )}

        {/* Continue Button */}
        <div className="mt-8 md:mt-12 flex justify-end">
          <button
            onClick={handleContinue}
            className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
          >
            {currentQuestion === 2 ? t('baseline.continue') : t('survey.navigation.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaselineSurvey;
