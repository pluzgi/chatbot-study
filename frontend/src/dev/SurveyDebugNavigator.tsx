/**
 * Survey Debug Navigator
 *
 * A development-only tool for jumping directly to any survey screen.
 * Access via: ?debug=survey or ?debug=survey&screen=8
 *
 * Features:
 * - Chronological numbered list of all screens
 * - Deep-linking via URL params (?screen=8, ?lang=en, ?condition=A)
 * - Static previews for each survey page
 * - Condition matrix showing what differs between A/B/C/D
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import LikertScale from '../components/Survey/LikertScale';

// Import components that work standalone
import ChatbotInstruction from '../components/Chat/ChatbotInstruction';
import ChatInterface from '../components/Chat/ChatInterface';
import DonationModal from '../components/Donation/DonationModal';
import Debriefing from '../components/Survey/Debriefing';

// ============================================
// SCREENS REGISTRY
// ============================================

interface ScreenConfig {
  id: string;
  name: string;
  stage: 'onboarding' | 'task' | 'donation' | 'survey' | 'debrief';
  conditionDependent?: boolean;
  description?: string;
}

export const SCREENS: ScreenConfig[] = [
  // Onboarding Stage
  { id: '1', name: 'Landing Page', stage: 'onboarding', description: 'Welcome page with consent modal' },
  { id: '2A', name: 'Baseline Q1', stage: 'onboarding', description: 'Tech comfort question' },
  { id: '2B', name: 'Baseline Q2', stage: 'onboarding', description: 'Privacy concern question' },
  { id: '3', name: 'Instruction', stage: 'onboarding', description: 'Chatbot introduction and task explanation' },

  // Task Stage
  { id: '4', name: 'Chat Interface', stage: 'task', description: 'Chatbot interaction (2 questions minimum)' },

  // Donation Stage
  { id: '5', name: 'Info Bridge', stage: 'donation', description: 'Transition modal asking about data donation' },
  { id: '6', name: 'Donation Modal', stage: 'donation', conditionDependent: true, description: 'Data donation decision (varies by condition A/B/C/D)' },

  // Survey Stage (PostTaskSurvey pages)
  { id: '7', name: 'Survey Q3: Clarity', stage: 'survey', description: '4 Likert items about information clarity' },
  { id: '8', name: 'Survey Q4: Control', stage: 'survey', description: '4 Likert items about perceived control' },
  { id: '9', name: 'Survey Q5: Risk', stage: 'survey', description: '5 Likert items about risk concerns' },
  { id: '10', name: 'Survey Q6: Agency', stage: 'survey', description: '3 Likert items about decision agency' },
  { id: '11', name: 'Survey Q7: Trust', stage: 'survey', description: '2 Likert items about trust' },
  { id: '12', name: 'Survey Q8: Acceptable Use', stage: 'survey', description: 'Checkbox selection for acceptable uses' },
  { id: '13', name: 'Survey Q9: Attention Check', stage: 'survey', description: 'Dropdown attention check question' },
  { id: '14', name: 'Survey Transition', stage: 'survey', description: 'Transition screen before demographics' },
  { id: '15', name: 'Survey Q10: Age', stage: 'survey', description: 'Demographics - age range' },
  { id: '16', name: 'Survey Q11: Gender', stage: 'survey', description: 'Demographics - gender' },
  { id: '17', name: 'Survey Q12: Language', stage: 'survey', description: 'Demographics - primary language' },
  { id: '18', name: 'Survey Q13: Education', stage: 'survey', description: 'Demographics - education level' },
  { id: '19', name: 'Survey Q14: Open Feedback', stage: 'survey', description: 'Optional open text feedback' },
  { id: '20', name: 'Survey Q15: Notify Email', stage: 'survey', description: 'Optional email for results notification' },

  // Debrief Stage
  { id: '21', name: 'Debriefing', stage: 'debrief', description: 'Study explanation and thank you' },
];

// ============================================
// STATIC PREVIEW COMPONENTS
// ============================================

// Reusable preview wrapper
const PreviewWrapper: React.FC<{ children: React.ReactNode; title: string; questionNum?: number }> = ({
  children,
  title,
  questionNum
}) => (
  <div className="min-h-screen bg-gray-50 py-6 md:py-10">
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10">
        {questionNum && (
          <div className="mb-6">
            <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">
              Question {questionNum}
            </span>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  </div>
);

// Static Likert item preview
const LikertItemPreview: React.FC<{ label: string; leftLabel: string; rightLabel: string }> = ({
  label,
  leftLabel,
  rightLabel
}) => (
  <div className="py-6 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
    <p className="text-lg md:text-xl text-gray-900 font-medium mb-5 leading-relaxed">{label}</p>
    <LikertScale
      name="preview"
      value={null}
      onChange={() => {}}
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      points={7}
      compact={true}
    />
  </div>
);

// ============================================
// DEBUG NAVIGATOR COMPONENT
// ============================================

interface DebugState {
  condition: 'A' | 'B' | 'C' | 'D';
  participantId: string;
}

const SurveyDebugNavigator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [debugState, setDebugState] = useState<DebugState>({
    condition: 'A',
    participantId: 'debug-participant-001'
  });

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen');
    const langParam = params.get('lang');
    const conditionParam = params.get('condition');

    if (screenParam) {
      setSelectedScreen(screenParam);
    }
    if (langParam && ['en', 'de', 'fr'].includes(langParam)) {
      i18n.changeLanguage(langParam);
    }
    if (conditionParam && ['A', 'B', 'C', 'D'].includes(conditionParam)) {
      setDebugState(prev => ({ ...prev, condition: conditionParam as 'A' | 'B' | 'C' | 'D' }));
    }
  }, [i18n]);

  // Update URL when screen changes
  const navigateToScreen = (screenId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('screen', screenId);
    window.history.replaceState({}, '', `?${params.toString()}`);
    setSelectedScreen(screenId);
  };

  // Get current screen index for prev/next navigation
  const currentIndex = SCREENS.findIndex(s => s.id === selectedScreen);

  const goToPrev = () => {
    if (currentIndex > 0) {
      navigateToScreen(SCREENS[currentIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (currentIndex < SCREENS.length - 1) {
      navigateToScreen(SCREENS[currentIndex + 1].id);
    }
  };

  const backToList = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('screen');
    window.history.replaceState({}, '', `?${params.toString()}`);
    setSelectedScreen(null);
  };

  // Get experiment config based on condition
  const getExperimentConfig = () => {
    const configs = {
      A: { transparency: 'low' as const, control: 'low' as const, showDNL: false, showDashboard: false },
      B: { transparency: 'high' as const, control: 'low' as const, showDNL: true, showDashboard: false },
      C: { transparency: 'low' as const, control: 'high' as const, showDNL: false, showDashboard: true },
      D: { transparency: 'high' as const, control: 'high' as const, showDNL: true, showDashboard: true },
    };
    return configs[debugState.condition];
  };

  // Group screens by stage
  const groupedScreens = SCREENS.reduce((acc, screen) => {
    if (!acc[screen.stage]) {
      acc[screen.stage] = [];
    }
    acc[screen.stage].push(screen);
    return acc;
  }, {} as Record<string, ScreenConfig[]>);

  const stageOrder = ['onboarding', 'task', 'donation', 'survey', 'debrief'];
  const stageLabels: Record<string, string> = {
    onboarding: 'Onboarding',
    task: 'Task',
    donation: 'Donation Decision',
    survey: 'Post-Task Survey',
    debrief: 'Debriefing',
  };

  const noop = () => console.log('[DEBUG] Callback triggered');

  // Render the selected screen component with STATIC previews for survey pages
  const renderScreen = () => {
    if (!selectedScreen) return null;

    const config = getExperimentConfig();

    switch (selectedScreen) {
      // ========== ONBOARDING ==========
      case '1':
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="bg-white rounded-lg max-w-xl w-full p-6 md:p-10 lg:p-12 shadow-sm">
              <div className="flex justify-end gap-2 mb-6 md:mb-8">
                <LanguageSelector />
              </div>
              <div className="text-left">
                <h1 className="text-2xl md:text-[28px] font-semibold mb-2 text-black leading-tight">
                  {t('landing.title')}
                </h1>
                <p className="text-base md:text-lg text-black mb-6 leading-relaxed">
                  {t('landing.subtitle')}
                </p>
                <div className="mb-6">
                  <p className="font-semibold text-base md:text-lg text-black mb-2">{t('landing.whatWeStudy')}</p>
                  <p className="text-[15px] md:text-base text-black leading-relaxed">{t('landing.whatWeStudyText')}</p>
                </div>
                <div className="mb-6">
                  <p className="font-semibold text-base md:text-lg text-black mb-3">{t('landing.whatToExpect')}</p>
                  <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base text-black leading-relaxed">
                    <li>{t('landing.expect1')}</li>
                    <li>{t('landing.expect2')}</li>
                    <li>{t('landing.expect3')}</li>
                  </ul>
                </div>
                <div className="mb-8">
                  <p className="font-semibold text-base md:text-lg text-black mb-3">{t('landing.requirements')}</p>
                  <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base text-black leading-relaxed">
                    <li>{t('landing.req1')}</li>
                    <li>{t('landing.req2')}</li>
                  </ul>
                </div>
                <div className="flex flex-col md:flex-row gap-3 mb-8">
                  <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                    {t('landing.startButton')}
                  </button>
                  <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-black border border-gray-300 rounded-md font-medium text-base min-h-[48px] hover:bg-gray-50 transition">
                    {t('landing.declineButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case '2A':
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
              <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-black leading-tight">
                  {t('baseline.title')}
                </h1>
                <p className="text-base md:text-lg text-black">{t('baseline.subtitle')}</p>
              </div>
              <div className="mb-8 md:mb-12">
                <p className="text-sm text-gray-400 mb-2">{t('baseline.progress', { current: 1 })}</p>
                <div className="w-full bg-gray-200 rounded-full h-[3px]">
                  <div className="bg-[#D1D5DB] h-[3px] rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
                {t('baseline.techComfort.question')}
              </h2>
              <LikertScale
                name="techComfort"
                value={null}
                onChange={() => {}}
                leftLabel={t('baseline.techComfort.stronglyDisagree')}
                rightLabel={t('baseline.techComfort.stronglyAgree')}
                points={7}
              />
            </div>
          </div>
        );

      case '2B':
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
              <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-black leading-tight">
                  {t('baseline.title')}
                </h1>
                <p className="text-base md:text-lg text-black">{t('baseline.subtitle')}</p>
              </div>
              <div className="mb-8 md:mb-12">
                <p className="text-sm text-gray-400 mb-2">{t('baseline.progress', { current: 2 })}</p>
                <div className="w-full bg-gray-200 rounded-full h-[3px]">
                  <div className="bg-[#D1D5DB] h-[3px] rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
                {t('baseline.privacyConcern.question')}
              </h2>
              <LikertScale
                name="privacyConcern"
                value={null}
                onChange={() => {}}
                leftLabel={t('baseline.privacyConcern.stronglyDisagree')}
                rightLabel={t('baseline.privacyConcern.stronglyAgree')}
                points={7}
              />
            </div>
          </div>
        );

      case '3':
        return <ChatbotInstruction onContinue={noop} />;

      // ========== TASK ==========
      case '4':
        return (
          <div className="min-h-screen bg-gray-50">
            <ChatInterface
              key={selectedScreen}
              participantId={debugState.participantId}
              onMinimumReached={noop}
            />
          </div>
        );

      // ========== DONATION ==========
      case '5':
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
            <div className="relative w-full max-w-xl">
              <div className="bg-white rounded-lg w-full p-6 md:p-8 shadow-lg">
                <p className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-black leading-tight">
                  Hoi and welcome,
                </p>
                <div className="space-y-4 md:space-y-5 mb-6 md:mb-8 text-black text-base md:text-lg leading-relaxed">
                  <p>
                    This chatbot is powered by <strong>Apertus</strong>, the first Swiss open-source large language artificial intelligence model.
                  </p>
                  <p>
                    To improve such models, questions from chatbot users are needed for training the data.
                  </p>
                  <p className="font-semibold text-lg md:text-xl">
                    Would you donate your anonymized questions?
                  </p>
                </div>
                <button
                  onClick={noop}
                  className="w-full bg-gray-200 text-black py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        );

      case '6':
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
            <div className="relative">
              <DonationModal
                key={`donation-${debugState.condition}`}
                config={config}
                onDecision={(decision, cfg) => console.log('[DEBUG] Donation decision:', decision, cfg)}
              />
            </div>
          </div>
        );

      // ========== SURVEY - STATIC PREVIEWS ==========
      case '7': // Q3: Clarity
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={3}>
            <p className="text-base text-gray-500 mb-6 leading-relaxed">
              Please tell us how clear the information was:
            </p>
            <LikertItemPreview
              label={t('survey.transparency.q1')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.transparency.q2')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.transparency.q3')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.transparency.q4')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
          </PreviewWrapper>
        );

      case '8': // Q4: Control
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={4}>
            <p className="text-base text-gray-500 mb-6 leading-relaxed">
              {t('survey.control.intro')}
            </p>
            <LikertItemPreview
              label={t('survey.control.q1')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.control.q2')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.control.q3')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.control.q4')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
          </PreviewWrapper>
        );

      case '9': // Q5: Risk
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={5}>
            <p className="text-base text-gray-500 mb-6 leading-relaxed">
              {t('survey.risk.intro')}
            </p>
            <LikertItemPreview
              label={t('survey.risk.privacy')}
              leftLabel="Not concerned"
              rightLabel="Extremely concerned"
            />
            <LikertItemPreview
              label={t('survey.risk.misuse')}
              leftLabel="Not concerned"
              rightLabel="Extremely concerned"
            />
            <LikertItemPreview
              label={t('survey.risk.companies')}
              leftLabel="Not concerned"
              rightLabel="Extremely concerned"
            />
            <LikertItemPreview
              label={t('survey.risk.trust')}
              leftLabel="Not concerned"
              rightLabel="Extremely concerned"
            />
            <LikertItemPreview
              label={t('survey.risk.security')}
              leftLabel="Not concerned"
              rightLabel="Extremely concerned"
            />
          </PreviewWrapper>
        );

      case '10': // Q6: Agency
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={6}>
            <p className="text-base text-gray-500 mb-6 leading-relaxed">
              {t('survey.agency.intro')}
            </p>
            <LikertItemPreview
              label={t('survey.agency.q1')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.agency.q2')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.agency.q3')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
          </PreviewWrapper>
        );

      case '11': // Q7: Trust
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={7}>
            <p className="text-base text-gray-500 mb-6 leading-relaxed">
              {t('survey.trust.intro')}
            </p>
            <LikertItemPreview
              label={t('survey.trust.q1')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.trust.q2')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
          </PreviewWrapper>
        );

      case '12': // Q8: Acceptable Use
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={8}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-2 leading-relaxed">
              {t('survey.acceptableUse.question')}
            </p>
            <p className="text-base text-gray-500 mb-6">
              {t('survey.acceptableUse.instruction')}
            </p>
            <div className="space-y-3">
              {[
                t('survey.acceptableUse.improveChatbot'),
                t('survey.acceptableUse.academicResearch'),
                t('survey.acceptableUse.commercialProducts'),
                t('survey.acceptableUse.nothing')
              ].map((label, i) => (
                <label key={i} className="flex items-center gap-4 p-4 border border-gray-300 rounded-md cursor-pointer bg-white hover:border-gray-400 hover:bg-gray-50 min-h-[52px]">
                  <input type="checkbox" className="w-5 h-5 text-gray-800 border-gray-300 rounded" />
                  <span className="text-base text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '13': // Q9: Attention Check
        return (
          <PreviewWrapper title="Step 3 of 3 — Survey" questionNum={9}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.attentionCheck.question')}
            </p>
            <select className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md bg-white min-h-[52px]">
              <option>{t('survey.attentionCheck.placeholder')}</option>
              <option>{t('survey.attentionCheck.voting')}</option>
              <option>{t('survey.attentionCheck.tax')}</option>
              <option>{t('survey.attentionCheck.immigration')}</option>
              <option>{t('survey.attentionCheck.news')}</option>
              <option>{t('survey.attentionCheck.dontremember')}</option>
            </select>
          </PreviewWrapper>
        );

      case '14': // Transition
        return (
          <div className="min-h-screen bg-gray-50 py-6 md:py-10">
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10">
                <div className="text-center py-8">
                  <div className="text-5xl mb-6">🙏🏻</div>
                  <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-900">
                    {t('survey.transition.title')}
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    {t('survey.transition.message')}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-lg mx-auto">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {t('survey.transition.reminder')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case '15': // Q10: Age
        return (
          <PreviewWrapper title="Demographics" questionNum={10}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.age.question')}
            </p>
            <select className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md bg-white min-h-[52px]">
              <option>{t('survey.demographics.age.placeholder')}</option>
              <option>18-24</option>
              <option>25-34</option>
              <option>35-44</option>
              <option>45-54</option>
              <option>55-64</option>
              <option>65+</option>
            </select>
          </PreviewWrapper>
        );

      case '16': // Q11: Gender
        return (
          <PreviewWrapper title="Demographics" questionNum={11}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.gender.question')}
            </p>
            <select className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md bg-white min-h-[52px]">
              <option>{t('survey.demographics.gender.placeholder')}</option>
              <option>{t('survey.demographics.gender.female')}</option>
              <option>{t('survey.demographics.gender.male')}</option>
              <option>{t('survey.demographics.gender.nonBinary')}</option>
              <option>{t('survey.demographics.gender.other')}</option>
            </select>
          </PreviewWrapper>
        );

      case '17': // Q12: Language
        return (
          <PreviewWrapper title="Demographics" questionNum={12}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.language.question')}
            </p>
            <select className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md bg-white min-h-[52px]">
              <option>{t('survey.demographics.language.placeholder')}</option>
              <option>{t('survey.demographics.language.german')}</option>
              <option>{t('survey.demographics.language.french')}</option>
              <option>{t('survey.demographics.language.italian')}</option>
              <option>{t('survey.demographics.language.english')}</option>
              <option>{t('survey.demographics.language.romansh')}</option>
            </select>
          </PreviewWrapper>
        );

      case '18': // Q13: Education
        return (
          <PreviewWrapper title="Demographics" questionNum={13}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.education.question')}
            </p>
            <select className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md bg-white min-h-[52px]">
              <option>{t('survey.demographics.education.placeholder')}</option>
              <option>{t('survey.demographics.education.mandatory')}</option>
              <option>{t('survey.demographics.education.matura')}</option>
              <option>{t('survey.demographics.education.vocational')}</option>
              <option>{t('survey.demographics.education.higherVocational')}</option>
              <option>{t('survey.demographics.education.appliedSciences')}</option>
              <option>{t('survey.demographics.education.university')}</option>
            </select>
          </PreviewWrapper>
        );

      case '19': // Q14: Open Feedback
        return (
          <PreviewWrapper title="Your Feedback" questionNum={14}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-2 leading-relaxed">
              In your own words, what was the main reason for your decision?
            </p>
            <p className="text-base text-gray-500 mb-6">
              This question is optional, but your thoughts help us understand how people make these decisions.
            </p>
            <textarea
              rows={5}
              className="w-full p-4 text-base border border-gray-300 rounded-md bg-white resize-none"
              placeholder="Write your answer here..."
            />
            <p className="text-sm text-gray-400 mt-2 text-right">0/500</p>
          </PreviewWrapper>
        );

      case '20': // Q15: Notify Email
        return (
          <PreviewWrapper title="Stay Updated" questionNum={15}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-2 leading-relaxed">
              Would you like to receive the study results?
            </p>
            <p className="text-base text-gray-500 mb-6">
              Optional. Enter your email if you would like to be notified when results are published.
            </p>
            <input
              type="email"
              className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md bg-white min-h-[52px]"
              placeholder="your.email@example.ch"
            />
          </PreviewWrapper>
        );

      // ========== DEBRIEF ==========
      case '21':
        return <Debriefing />;

      default:
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="text-center">
              <p className="text-xl text-gray-600">Unknown screen: {selectedScreen}</p>
            </div>
          </div>
        );
    }
  };

  // Navigator panel (sidebar view when screen is selected)
  if (selectedScreen) {
    return (
      <div className="flex min-h-screen">
        {/* Floating Debug Controls - Always visible above everything */}
        <div className="fixed top-4 right-4 z-[200] flex gap-2">
          <button
            onClick={goToPrev}
            disabled={currentIndex <= 0}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition"
            title="Previous screen"
          >
            ← Prev
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex >= SCREENS.length - 1}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition"
            title="Next screen"
          >
            Next →
          </button>
          <button
            onClick={backToList}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm shadow-lg hover:bg-blue-700 transition"
            title="Back to screen list"
          >
            ☰ List
          </button>
        </div>

        {/* Current Screen Badge - Always visible */}
        <div className="fixed top-4 left-4 z-[200] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs">
          <span className="font-mono mr-2">{selectedScreen}</span>
          <span className="opacity-70">{SCREENS.find(s => s.id === selectedScreen)?.name}</span>
          {SCREENS.find(s => s.id === selectedScreen)?.conditionDependent && (
            <span className="ml-2 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">{debugState.condition}</span>
          )}
        </div>

        {/* Main Content Area - Full width for preview */}
        <div className="flex-1">
          {renderScreen()}
        </div>
      </div>
    );
  }

  // Journey steps with condition-specific content descriptions
  const getJourneySteps = (condition: 'A' | 'B' | 'C' | 'D') => {
    const donationContent = {
      A: 'Simple text asking to donate data. Binary choice: Donate / Don\'t Donate',
      B: 'Data Nutrition Label shown with model transparency info. Binary choice.',
      C: 'Granular Dashboard with 4 configurable options (scope, purpose, storage, retention).',
      D: 'Both DNL and Dashboard shown side-by-side. Full transparency + control.',
    };

    return [
      { id: '1', step: 1, name: 'Landing Page', content: 'Study introduction, requirements (18+, Swiss voter), consent checkbox' },
      { id: '2A', step: 2, name: 'Baseline Q1', content: 'Tech comfort: "I am comfortable using new digital technology..."' },
      { id: '2B', step: 3, name: 'Baseline Q2', content: 'Privacy concern: "I am concerned about how my personal information is used..."' },
      { id: '3', step: 4, name: 'Instruction', content: 'About Apertus, task explanation, example questions' },
      { id: '4', step: 5, name: 'Chat Interface', content: 'Ask minimum 2 questions about Swiss ballot initiatives' },
      { id: '5', step: 6, name: 'Info Bridge', content: '"Would you donate your anonymized questions?" - Learn More button' },
      { id: '6', step: 7, name: 'Donation Modal', content: donationContent[condition], highlight: true },
      { id: '7', step: 8, name: 'Q3: Clarity', content: '4 items: understood origin, training data, privacy protections, enough info' },
      { id: '8', step: 9, name: 'Q4: Control', content: '4 items: control over questions, choice in usage, real options, flexibility' },
      { id: '9', step: 10, name: 'Q5: Risk', content: '5 items: privacy, misuse, companies, trust, security concerns' },
      { id: '10', step: 11, name: 'Q6: Agency', content: '3 items: felt in control, choices mattered, able to decide' },
      { id: '11', step: 12, name: 'Q7: Trust', content: '2 items: data safety, trust in organization' },
      { id: '12', step: 13, name: 'Q8: Acceptable Use', content: 'Checkboxes: improve chatbot, academic research, commercial, nothing' },
      { id: '13', step: 14, name: 'Q9: Attention Check', content: '"This chatbot helps users with questions about:" dropdown' },
      { id: '14', step: 15, name: 'Transition', content: '"Almost done!" reminder that donation was simulated' },
      { id: '15', step: 16, name: 'Q10: Age', content: 'Age range dropdown (18-24 to 65+)' },
      { id: '16', step: 17, name: 'Q11: Gender', content: 'Gender dropdown with "Other" option' },
      { id: '17', step: 18, name: 'Q12: Language', content: 'Primary language (DE/FR/IT/EN/Romansh)' },
      { id: '18', step: 19, name: 'Q13: Education', content: 'Education level dropdown' },
      { id: '19', step: 20, name: 'Q14: Open Feedback', content: 'Optional: "What was the main reason for your decision?"' },
      { id: '20', step: 21, name: 'Q15: Email', content: 'Optional: Email for study results notification' },
      { id: '21', step: 22, name: 'Debriefing', content: 'Thank you, simulation disclosure, contact info' },
    ];
  };

  // ========== LANDING VIEW - SCREEN LIST ==========
  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT SIDE - Journey Preview */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                User Journey - Condition {debugState.condition}
              </h2>

              {/* Condition Quick Switch */}
              <div className="flex gap-1 mb-4">
                {(['A', 'B', 'C', 'D'] as const).map(cond => (
                  <button
                    key={cond}
                    onClick={() => setDebugState(prev => ({ ...prev, condition: cond }))}
                    className={`flex-1 py-2 rounded text-sm font-bold transition ${
                      debugState.condition === cond
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>

              {/* Condition Description */}
              <div className={`p-3 rounded-lg mb-4 text-sm ${
                debugState.condition === 'A' ? 'bg-gray-100' :
                debugState.condition === 'B' ? 'bg-blue-50' :
                debugState.condition === 'C' ? 'bg-green-50' :
                'bg-purple-50'
              }`}>
                {debugState.condition === 'A' && <p><strong>Baseline:</strong> No transparency info, binary choice only</p>}
                {debugState.condition === 'B' && <p><strong>Transparency:</strong> Data Nutrition Label shown, binary choice</p>}
                {debugState.condition === 'C' && <p><strong>Control:</strong> Granular Dashboard with 4 configurable options</p>}
                {debugState.condition === 'D' && <p><strong>Full:</strong> Both DNL + Dashboard (transparency + control)</p>}
              </div>

              {/* Journey Steps */}
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                {getJourneySteps(debugState.condition).map((step) => (
                  <button
                    key={step.id}
                    onClick={() => navigateToScreen(step.id)}
                    className={`w-full text-left p-3 rounded-lg transition group ${
                      step.highlight
                        ? 'bg-yellow-50 border-2 border-yellow-300 hover:border-yellow-400'
                        : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        step.highlight
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-gray-200 text-gray-600 group-hover:bg-green-500 group-hover:text-white'
                      }`}>
                        {step.step}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${step.highlight ? 'text-yellow-900' : 'text-gray-900'}`}>
                          {step.name}
                        </p>
                        <p className={`text-xs mt-0.5 leading-snug ${step.highlight ? 'text-yellow-700' : 'text-gray-500'}`}>
                          {step.content}
                        </p>
                      </div>
                    </div>
                    {step.highlight && (
                      <div className="mt-2 ml-9">
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                          Condition-specific
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></span>
                  Varies by condition
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Survey Debug Navigator</h1>
                  <p className="text-gray-600">Click any screen to preview. Deep-link:</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                    ?debug=survey&screen=6&condition=D
                  </code>
                </div>
                <LanguageSelector />
              </div>

              {/* Condition Matrix - What differs between conditions */}
              <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h2 className="text-lg font-bold text-yellow-900 mb-4">Condition Matrix - What Differs</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-yellow-300">
                        <th className="text-left py-2 pr-4 font-semibold text-yellow-900">Condition</th>
                        <th className="text-left py-2 px-4 font-semibold text-yellow-900">DNL</th>
                        <th className="text-left py-2 px-4 font-semibold text-yellow-900">Dashboard</th>
                        <th className="text-left py-2 pl-4 font-semibold text-yellow-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-yellow-800">
                      <tr className={`border-b border-yellow-200 ${debugState.condition === 'A' ? 'bg-yellow-100' : ''}`}>
                        <td className="py-2 pr-4 font-mono font-bold">A</td>
                        <td className="py-2 px-4">❌</td>
                        <td className="py-2 px-4">❌</td>
                        <td className="py-2 pl-4">Baseline - minimal info, binary choice</td>
                      </tr>
                      <tr className={`border-b border-yellow-200 ${debugState.condition === 'B' ? 'bg-yellow-100' : ''}`}>
                        <td className="py-2 pr-4 font-mono font-bold">B</td>
                        <td className="py-2 px-4">✅</td>
                        <td className="py-2 px-4">❌</td>
                        <td className="py-2 pl-4">Transparency only</td>
                      </tr>
                      <tr className={`border-b border-yellow-200 ${debugState.condition === 'C' ? 'bg-yellow-100' : ''}`}>
                        <td className="py-2 pr-4 font-mono font-bold">C</td>
                        <td className="py-2 px-4">❌</td>
                        <td className="py-2 px-4">✅</td>
                        <td className="py-2 pl-4">Control only</td>
                      </tr>
                      <tr className={`${debugState.condition === 'D' ? 'bg-yellow-100' : ''}`}>
                        <td className="py-2 pr-4 font-mono font-bold">D</td>
                        <td className="py-2 px-4">✅</td>
                        <td className="py-2 px-4">✅</td>
                        <td className="py-2 pl-4">Full (both)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Screens Grid */}
              {stageOrder.map(stage => (
                <div key={stage} className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    {stageLabels[stage]}
                    {stage === 'survey' && (
                      <span className="text-xs font-normal text-gray-500 ml-2">(same for all conditions)</span>
                    )}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {groupedScreens[stage]?.map(screen => (
                      <button
                        key={screen.id}
                        onClick={() => navigateToScreen(screen.id)}
                        className={`p-4 border rounded-lg hover:shadow-md transition text-left group ${
                          screen.conditionDependent
                            ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                            : 'bg-white border-gray-200 hover:border-green-500'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-2xl font-bold transition ${
                            screen.conditionDependent
                              ? 'text-yellow-400 group-hover:text-yellow-600'
                              : 'text-gray-300 group-hover:text-green-500'
                          }`}>
                            {screen.id}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{screen.name}</p>
                            {screen.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{screen.description}</p>
                            )}
                            {screen.conditionDependent && (
                              <span className="inline-block mt-1 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                Varies
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Instructions */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How to use</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Left panel:</strong> Complete journey overview for selected condition</li>
                  <li>• <strong>Right panel:</strong> Click any screen to preview it</li>
                  <li>• Switch conditions (A/B/C/D) to see different journey descriptions</li>
                  <li>• Yellow items are condition-dependent (only Donation Modal differs)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyDebugNavigator;
