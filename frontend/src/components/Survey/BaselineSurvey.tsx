import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LikertScale from './LikertScale';

interface Props {
  participantId: string;
  onComplete: (data: { techComfort: number; privacyConcern: number }) => void;
}

const BaselineSurvey: React.FC<Props> = ({ participantId, onComplete }) => {
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
      <div className="bg-white rounded-lg max-w-2xl w-full p-8 md:p-12 shadow-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            {t('baseline.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('baseline.subtitle')}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-12">
          <p className="text-xs text-gray-400 mb-2">
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
            <h2 className="text-xl md:text-2xl font-semibold mb-12 text-gray-900 text-left">
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
            <h2 className="text-xl md:text-2xl font-semibold mb-12 text-gray-900 text-left">
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
          <p className="text-red-600 text-sm mt-4">
            {t('baseline.validationError')}
          </p>
        )}

        {/* Continue Button */}
        <div className="mt-12 flex justify-end">
          <button
            onClick={handleContinue}
            className="bg-[#FF0000] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#CC0000] transition"
          >
            {currentQuestion === 2 ? t('baseline.continue') : t('survey.navigation.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaselineSurvey;
