import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './services/api';
import { Session } from './types';
import LanguageSelector from './components/LanguageSelector';
import ChatInterface from './components/Chat/ChatInterface';
import InfoBridge from './components/Donation/InfoBridge';
import DonationModal from './components/Donation/DonationModal';
import PostTaskSurvey from './components/Survey/PostTaskSurvey';
import Debriefing from './components/Survey/Debriefing';
import './i18n/config';

type Phase = 'landing' | 'chat' | 'donation' | 'survey' | 'debrief' | 'already-participated';

function App() {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<Phase>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [showInfoBridge, setShowInfoBridge] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const startExperiment = async () => {
    setLoading(true);
    try {
      const data = await api.initializeExperiment(i18n.language);
      setSession(data);
      setPhase('chat');
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

  const handleMinimumReached = () => {
    setShowInfoBridge(true);
  };

  const handleInfoBridgeContinue = () => {
    setShowInfoBridge(false);
    setShowDonationModal(true);
  };

  const handleDonationDecision = async (decision: 'donate' | 'decline', config?: any) => {
    if (session) {
      try {
        await api.recordDonation(session.participantId, decision, config);
        setShowDonationModal(false);
        setPhase('survey');
      } catch (error) {
        console.error('Failed to record donation:', error);
        alert('Failed to record decision. Please try again.');
      }
    }
  };

  // Landing Page
  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
        <div className="mb-8">
          <LanguageSelector />
        </div>
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">{t('landing.title')}</h1>
          <p className="text-lg mb-8 text-gray-700">{t('landing.description')}</p>
          <button
            onClick={startExperiment}
            disabled={loading}
            className="bg-[#DC143C] text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[#B01030] disabled:bg-gray-400 transition"
          >
            {loading ? '...' : t('landing.start')}
          </button>
        </div>
      </div>
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
