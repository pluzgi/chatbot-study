import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LikertScale from './LikertScale';

interface Props {
  participantId: string;
  onComplete: (data: { techComfort: number; privacyConcern: number; ballotFamiliarity: number }) => void;
  onBack?: () => void;
}

const BaselineSurvey: React.FC<Props> = ({ onComplete, onBack }) => {
  const { t } = useTranslation();
  const [currentQuestion, setCurrentQuestion] = useState<1 | 2 | 3>(1);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [techComfort, setTechComfort] = useState<number | null>(null);
  const [privacyConcern, setPrivacyConcern] = useState<number | null>(null);
  const [ballotFamiliarity, setBallotFamiliarity] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const handleBack = () => {
    setError(false);
    if (currentQuestion === 1) {
      // Go back to landing page
      if (onBack) onBack();
    } else if (currentQuestion === 2) {
      setCurrentQuestion(1);
    } else {
      setCurrentQuestion(2);
    }
  };

  const handleContinue = () => {
    if (currentQuestion === 1) {
      if (techComfort === null) {
        setError(true);
        return;
      }
      setError(false);
      setCurrentQuestion(2);
    } else if (currentQuestion === 2) {
      if (privacyConcern === null) {
        setError(true);
        return;
      }
      setError(false);
      setCurrentQuestion(3);
    } else {
      if (ballotFamiliarity === null) {
        setError(true);
        return;
      }
      // All answers complete, call onComplete
      onComplete({
        techComfort: techComfort!,
        privacyConcern: privacyConcern!,
        ballotFamiliarity: ballotFamiliarity!
      });
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8 md:pt-12 bg-white">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
        {/* Small header */}
        <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
          {t('baseline.aboutYou', 'About you')}
        </p>

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

        {/* Question 3: Ballot Familiarity */}
        {currentQuestion === 3 && (
          <div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
              {t('baseline.ballotFamiliarity.question')}
            </h2>

            <LikertScale
              name="ballotFamiliarity"
              value={ballotFamiliarity}
              onChange={(value) => {
                setBallotFamiliarity(value);
                setError(false);
              }}
              leftLabel={t('baseline.ballotFamiliarity.notFamiliar')}
              rightLabel={t('baseline.ballotFamiliarity.veryFamiliar')}
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

        {/* Navigation Buttons */}
        <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
          {/* Back Button */}
          {(currentQuestion > 1 || onBack) ? (
            <button
              onClick={handleBack}
              className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-base min-h-[48px] hover:bg-gray-50 transition"
            >
              ← {t('survey.navigation.back')}
            </button>
          ) : (
            <div></div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
          >
            {currentQuestion === 3 ? t('baseline.continue') : `${t('survey.navigation.next')} →`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaselineSurvey;
