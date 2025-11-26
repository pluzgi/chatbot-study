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

type Phase = 'landing' | 'chat' | 'donation' | 'survey' | 'debrief';

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
    } catch (error) {
      console.error('Failed to start experiment:', error);
      alert('Failed to start experiment. Please try again.');
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
        onComplete={() => setPhase('debrief')}
      />
    );
  }

  // Debriefing Phase
  if (phase === 'debrief') {
    return <Debriefing />;
  }

  return null;
}

export default App;
