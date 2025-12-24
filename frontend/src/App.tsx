import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './services/api';
import { Session } from './types';
import LanguageSelector from './components/LanguageSelector';
import ChatInterface from './components/Chat/ChatInterface';
import ChatbotInstruction from './components/Chat/ChatbotInstruction';
import InfoBridge from './components/Donation/InfoBridge';
import DonationModal from './components/Donation/DonationModal';
import PostTaskSurvey from './components/Survey/PostTaskSurvey';
import Debriefing from './components/Survey/Debriefing';
import BaselineSurvey from './components/Survey/BaselineSurvey';
import './i18n/config';

type Phase = 'landing' | 'baseline' | 'instruction' | 'chat' | 'donation' | 'survey' | 'debrief' | 'already-participated';

function App() {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<Phase>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [showInfoBridge, setShowInfoBridge] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentChecks, setConsentChecks] = useState({
    age: false,
    vote: false,
    voluntary: false
  });
  const [_baselineData, setBaselineData] = useState<{ techComfort: number; privacyConcern: number } | null>(null);

  const startExperiment = async () => {
    setLoading(true);
    try {
      const data = await api.initializeExperiment(i18n.language);
      setSession(data);
      setPhase('baseline');
    } catch (error: any) {
      console.error('Failed to start experiment:', error);

      // Check if it's a duplicate participation error (409)
      if (error.response?.status === 409) {
        setPhase('already-participated');
      } else {
        alert('Failed to start experiment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBaselineComplete = async (data: { techComfort: number; privacyConcern: number }) => {
    setBaselineData(data);
    if (session) {
      try {
        await api.recordBaseline(session.participantId, data.techComfort, data.privacyConcern);
      } catch (error) {
        console.error('Failed to record baseline:', error);
        // Don't block user - data is saved locally in development mode
      }
      // Always continue to next phase
      setPhase('instruction');
    }
  };

  const handleMinimumReached = () => {
    setShowInfoBridge(true);
  };

  const handleInfoBridgeContinue = () => {
    console.log('[InfoBridge] Continue button clicked');
    console.log('[InfoBridge] Session:', session);
    setShowInfoBridge(false);
    setShowDonationModal(true);
    console.log('[InfoBridge] State updated - showing donation modal');
  };

  const handleDonationDecision = async (decision: 'donate' | 'decline', config?: any) => {
    if (session) {
      try {
        await api.recordDonation(session.participantId, decision, config);
      } catch (error) {
        console.error('Failed to record donation:', error);
        // Don't block user - data is saved locally in development mode
      }
      // Always continue to next phase
      setShowDonationModal(false);
      setPhase('survey');
    }
  };

  // Landing Page - Professional Research Study
  if (phase === 'landing') {
    const allConsented = consentChecks.age && consentChecks.vote && consentChecks.voluntary;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-lg max-w-xl w-full p-6 md:p-10 lg:p-12 shadow-sm">
          {/* Language selector - top right, subtle */}
          <div className="flex justify-end gap-2 mb-6 md:mb-8">
            <LanguageSelector />
          </div>

          {/* Main content - all left-aligned */}
          <div className="text-left">
            {/* Title */}
            <h1 className="text-2xl md:text-[28px] font-semibold mb-2 text-gray-900 leading-tight">
              {t('landing.title')}
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed">
              {t('landing.subtitle')}
            </p>

            {/* What we study */}
            <div className="mb-6">
              <p className="font-semibold text-base md:text-lg text-gray-900 mb-2">{t('landing.whatWeStudy')}</p>
              <p className="text-[15px] md:text-base text-gray-600 leading-relaxed">{t('landing.whatWeStudyText')}</p>
            </div>

            {/* What you'll do */}
            <div className="mb-6">
              <p className="font-semibold text-base md:text-lg text-gray-900 mb-3">{t('landing.youWill')}</p>
              <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base text-gray-600 leading-relaxed">
                <li>{t('landing.step1')}</li>
                <li>{t('landing.step2')}</li>
                <li>{t('landing.step3')}</li>
              </ul>
            </div>

            {/* Good to know */}
            <div className="mb-6">
              <p className="font-semibold text-base md:text-lg text-gray-900 mb-3">{t('landing.goodToKnow')}</p>
              <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base text-gray-600 leading-relaxed">
                <li>{t('landing.fact1')}</li>
                <li>{t('landing.fact2')}</li>
                <li>{t('landing.fact3')}</li>
              </ul>
            </div>

            {/* Who can participate */}
            <div className="mb-8">
              <p className="font-semibold text-base md:text-lg text-gray-900 mb-3">{t('landing.requirements')}</p>
              <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base text-gray-600 leading-relaxed">
                <li>{t('landing.req1')}</li>
                <li>{t('landing.req2')}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 mb-8">
              <button
                onClick={() => setShowConsentModal(true)}
                className="w-full md:w-auto px-6 py-4 md:py-3 bg-[#FF0000] text-white rounded-md font-medium text-base min-h-[48px] hover:bg-[#CC0000] transition"
              >
                {t('landing.startButton')}
              </button>
              <button
                onClick={() => alert(t('landing.declineMessage'))}
                className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-base min-h-[48px] hover:bg-gray-50 transition"
              >
                {t('landing.declineButton')}
              </button>
            </div>

            {/* Contact */}
            <p className="text-sm text-gray-500">
              {t('landing.contact')} <a href={`mailto:${t('landing.email')}`} className="text-[#FF0000] hover:underline">{t('landing.email')}</a>
            </p>
          </div>
        </div>

        {/* Consent Modal */}
        {showConsentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 leading-tight">{t('landing.consentModal.title')}</h2>
              <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">{t('landing.consentModal.text')}</p>

              <div className="space-y-4 mb-8">
                <label className="flex items-start gap-3 cursor-pointer min-h-[44px] items-center">
                  <input
                    type="checkbox"
                    checked={consentChecks.age}
                    onChange={(e) => setConsentChecks(prev => ({ ...prev, age: e.target.checked }))}
                    className="w-5 h-5 text-[#FF0000] border-gray-300 rounded focus:ring-[#FF0000] flex-shrink-0"
                  />
                  <span className="text-base text-gray-800 leading-relaxed">{t('landing.consentModal.age')}</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer min-h-[44px] items-center">
                  <input
                    type="checkbox"
                    checked={consentChecks.vote}
                    onChange={(e) => setConsentChecks(prev => ({ ...prev, vote: e.target.checked }))}
                    className="w-5 h-5 text-[#FF0000] border-gray-300 rounded focus:ring-[#FF0000] flex-shrink-0"
                  />
                  <span className="text-base text-gray-800 leading-relaxed">{t('landing.consentModal.vote')}</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer min-h-[44px] items-center">
                  <input
                    type="checkbox"
                    checked={consentChecks.voluntary}
                    onChange={(e) => setConsentChecks(prev => ({ ...prev, voluntary: e.target.checked }))}
                    className="w-5 h-5 text-[#FF0000] border-gray-300 rounded focus:ring-[#FF0000] flex-shrink-0"
                  />
                  <span className="text-base text-gray-800 leading-relaxed">{t('landing.consentModal.voluntary')}</span>
                </label>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => {
                    setShowConsentModal(false);
                    startExperiment();
                  }}
                  disabled={!allConsented || loading}
                  className={`w-full md:flex-1 px-6 py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] transition ${
                    allConsented && !loading
                      ? 'bg-[#FF0000] text-white hover:bg-[#CC0000]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '...' : t('landing.consentModal.confirm')}
                </button>
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="w-full md:flex-1 bg-gray-300 text-gray-800 px-6 py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] hover:bg-gray-400 transition"
                >
                  {t('landing.consentModal.back')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Baseline Phase
  if (phase === 'baseline') {
    return (
      <BaselineSurvey
        participantId={session?.participantId || ''}
        onComplete={handleBaselineComplete}
      />
    );
  }

  // Instruction Phase
  if (phase === 'instruction') {
    return (
      <ChatbotInstruction
        onContinue={() => setPhase('chat')}
      />
    );
  }

  // Chat Phase
  if (phase === 'chat') {
    return (
      <div className="min-h-screen bg-gray-50">
        {session && (
          <>
            <ChatInterface
              participantId={session.participantId}
              onMinimumReached={handleMinimumReached}
            />
            {showInfoBridge && (
              <InfoBridge onContinue={handleInfoBridgeContinue} />
            )}
            {showDonationModal && (
              <DonationModal
                config={session.config}
                onDecision={handleDonationDecision}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Survey Phase
  if (phase === 'survey') {
    return (
      <PostTaskSurvey
        participantId={session?.participantId || ''}
        condition={session?.condition || 'A'}
        onComplete={() => setPhase('debrief')}
      />
    );
  }

  // Debriefing Phase
  if (phase === 'debrief') {
    return <Debriefing />;
  }

  // Already Participated Phase
  if (phase === 'already-participated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
        <div className="mb-8">
          <LanguageSelector />
        </div>
        <div className="text-center max-w-2xl bg-white rounded-lg p-10 shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Thank You</h2>
          <p className="text-lg text-gray-900 mb-6 leading-relaxed">
            Our records show you have already participated in this study recently.
          </p>
          <p className="text-base text-gray-700 mb-6 leading-relaxed">
            We appreciate your contribution! To maintain research validity, we ask participants to complete the study only once.
          </p>
          <p className="text-sm text-gray-600">
            If you believe this is an error, please contact the research team.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
