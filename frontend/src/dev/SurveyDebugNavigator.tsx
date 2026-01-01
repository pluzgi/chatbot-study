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
 * - Hypothesis-driven metadata for Step 3 screens
 * - Condition matrix showing what differs between A/B/C/D
 *
 * Step 3 Hypothesis Mapping:
 * - MC-T (blue): Manipulation Check for Transparency (H1)
 * - MC-C (green): Manipulation Check for Control (H2)
 * - OUT-RISK (yellow): Risk Perception outcome (H3)
 * - OUT-TRUST (yellow): Trust outcome (interpretation)
 * - QUAL (gray): Qualitative feedback
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import LikertScale from '../components/Survey/LikertScale';

// Import components that work standalone
import ChatbotInstruction from '../components/Chat/ChatbotInstruction';
import ChatInterface from '../components/Chat/ChatInterface';
import Debriefing from '../components/Survey/Debriefing';
import DataNutritionLabel from '../components/Donation/DataNutritionLabel';

// ============================================
// HYPOTHESIS TAGS AND COLORS
// ============================================

type HypothesisTag = 'MC-T' | 'MC-C' | 'OUT-RISK' | 'OUT-TRUST' | 'QUAL' | 'DEMO' | 'ATTN' | 'COV';

const TAG_COLORS: Record<HypothesisTag, { bg: string; border: string; text: string }> = {
  'MC-T': { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700' },
  'MC-C': { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-700' },
  'OUT-RISK': { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700' },
  'OUT-TRUST': { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700' },
  'QUAL': { bg: 'bg-gray-50', border: 'border-l-gray-400', text: 'text-gray-600' },
  'DEMO': { bg: 'bg-gray-50', border: 'border-l-gray-300', text: 'text-gray-500' },
  'ATTN': { bg: 'bg-purple-50', border: 'border-l-purple-400', text: 'text-purple-600' },
  'COV': { bg: 'bg-orange-50', border: 'border-l-orange-400', text: 'text-orange-600' }
};

// ============================================
// SCREENS REGISTRY WITH HYPOTHESIS METADATA
// ============================================

interface ScreenConfig {
  id: string;
  name: string;
  stage: 'onboarding' | 'task' | 'donation' | 'survey' | 'debrief' | 'journey';
  conditionDependent?: boolean;
  description?: string;
  // Hypothesis-driven metadata for Step 3 screens
  tag?: HypothesisTag;
  construct?: string;
  hypothesis?: string;
  items?: string[];
  expectedPattern?: string;
}

export const SCREENS: ScreenConfig[] = [
  // ========== ONBOARDING STAGE ==========
  { id: '1', name: 'Landing Page', stage: 'onboarding', description: 'Welcome page with Start/Decline buttons' },
  { id: '1B', name: 'Declined Page', stage: 'onboarding', description: 'Thank you message for users who decline study participation' },
  { id: '1C', name: 'Consent Modal', stage: 'onboarding', description: 'Eligibility confirmation (18+, Swiss voter)' },
  { id: '2A', name: 'Baseline Q1', stage: 'onboarding', description: 'Tech comfort question' },
  { id: '2B', name: 'Baseline Q2', stage: 'onboarding', description: 'Privacy concern question' },
  { id: '2C', name: 'Baseline Q3', stage: 'onboarding', tag: 'COV', construct: 'Ballot Familiarity', description: 'How familiar are you with Swiss ballot initiatives?' },
  { id: '3', name: 'Instruction', stage: 'onboarding', description: 'Chatbot introduction and task explanation' },

  // ========== TASK STAGE ==========
  { id: '4', name: 'Chat Interface', stage: 'task', description: 'Chatbot interaction (2 questions minimum)' },

  // ========== DONATION STAGE ==========
  { id: '5', name: 'Donation Modal', stage: 'donation', conditionDependent: true, description: 'Data donation decision (varies by condition A/B/C/D)' },
  { id: '5-DNL', name: 'Model Data Facts', stage: 'donation', description: 'Standalone preview of the Model Data Facts label (Condition B/D)' },
  { id: '5B', name: 'Thank You Page', stage: 'donation', description: 'Confirmation screen after confirming donation' },
  { id: '5C', name: 'Decline Confirmation', stage: 'donation', description: 'Confirmation screen after declining donation' },

  // ========== SURVEY STAGE (Hypothesis-Driven) ==========
  {
    id: '6',
    name: 'Q4: Transparency',
    stage: 'survey',
    tag: 'MC-T',
    construct: 'Perceived Transparency',
    hypothesis: 'H1',
    items: [
      'The information about how my anonymized chat questions may be used was clear.',
      'I understood what would happen to my anonymized chat questions if I agreed to share them.'
    ],
    expectedPattern: 'Higher in B & D (with DNL) than A & C',
    description: '2 Likert items - H1 manipulation check'
  },
  {
    id: '7',
    name: 'Q5: Control',
    stage: 'survey',
    tag: 'MC-C',
    construct: 'Perceived User Control',
    hypothesis: 'H2',
    items: [
      'I felt I had control over how my anonymized chat questions could be used.',
      'I felt I had meaningful choices about sharing my anonymized chat questions.'
    ],
    expectedPattern: 'Higher in C & D (with Dashboard) than A & B',
    description: '2 Likert items - H2 manipulation check'
  },
  {
    id: '8',
    name: 'Q6: Risk',
    stage: 'survey',
    tag: 'OUT-RISK',
    construct: 'Risk Perception',
    hypothesis: 'H3',
    items: [
      'Even if anonymized, my chat questions could be traced back to me.',
      'My anonymized chat questions could be used in ways I would not agree with.'
    ],
    expectedPattern: 'Lowest in D (high transparency reduces risk), highest in A',
    description: '2 Likert items - H3 interaction mechanism'
  },
  {
    id: '9',
    name: 'Q7: Trust',
    stage: 'survey',
    tag: 'OUT-TRUST',
    construct: 'Trust',
    hypothesis: 'Interpretation',
    items: [
      'I trust the organization behind this study to handle my data responsibly.',
      'I believe my anonymized data would be handled securely.'
    ],
    expectedPattern: 'Exploratory - not required for H1-H3 testing',
    description: '2 Likert items - Supporting construct'
  },
  {
    id: '10',
    name: 'Q8: Attention Check',
    stage: 'survey',
    tag: 'ATTN',
    construct: 'Data Quality',
    description: 'Checkbox-style attention check question'
  },
  {
    id: '11',
    name: 'Transition',
    stage: 'survey',
    description: 'Transition screen before demographics'
  },
  { id: '12', name: 'Q9: Age', stage: 'survey', tag: 'DEMO', description: 'Demographics - age range' },
  { id: '13', name: 'Q10: Gender', stage: 'survey', tag: 'DEMO', description: 'Demographics - gender' },
  { id: '14', name: 'Q11: Language', stage: 'survey', tag: 'DEMO', description: 'Demographics - primary language' },
  { id: '15', name: 'Q12: Education', stage: 'survey', tag: 'DEMO', description: 'Demographics - education level' },
  { id: '16', name: 'Q13: Voting Eligibility', stage: 'survey', tag: 'DEMO', description: 'Demographics - are you eligible to vote in Switzerland?' },
  {
    id: '17',
    name: 'Q14: Open Feedback',
    stage: 'survey',
    tag: 'QUAL',
    construct: 'Qualitative Insight',
    hypothesis: 'Interpretation',
    items: ['In your own words, what was the main reason for your decision?'],
    description: 'Optional open text feedback'
  },
  // ========== DEBRIEF STAGE ==========
  { id: '18', name: 'Debriefing', stage: 'debrief', description: 'Study explanation and thank you' },

  // ========== FULL JOURNEY VIEWS (hidden from grid, accessed via purple buttons) ==========
  { id: 'journey-A', name: 'Full Journey - Condition A', stage: 'journey', description: 'Complete user flow for Condition A (Baseline)' },
  { id: 'journey-B', name: 'Full Journey - Condition B', stage: 'journey', description: 'Complete user flow for Condition B (DNL only)' },
  { id: 'journey-C', name: 'Full Journey - Condition C', stage: 'journey', description: 'Complete user flow for Condition C (Dashboard only)' },
  { id: 'journey-D', name: 'Full Journey - Condition D', stage: 'journey', description: 'Complete user flow for Condition D (DNL + Dashboard)' },
];

// ============================================
// STATIC PREVIEW COMPONENTS
// ============================================

const PreviewWrapper: React.FC<{
  children: React.ReactNode;
  title: string;
  tag?: HypothesisTag;
  construct?: string;
  showBack?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
}> = ({ children, title, tag, construct, showBack = true, showNext = true, showSubmit = false, backLabel = '← Back', nextLabel = 'Next →', submitLabel = 'Submit' }) => {
  const colors = tag ? TAG_COLORS[tag] : null;

  // Format step prefix in grey if title starts with "Step X of 3 —"
  const stepMatch = title.match(/^(Step \d+ of \d+ — )(.*)/);
  const renderTitle = () => {
    if (stepMatch) {
      return (
        <>
          <span className="text-gray-500 font-normal">{stepMatch[1]}</span>
          {stepMatch[2]}
        </>
      );
    }
    return title;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10 ${colors ? `border-l-4 ${colors.border}` : ''}`}>
          {/* Tag Badge */}
          {tag && (
            <div className="mb-4 flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${colors?.bg} ${colors?.text}`}>
                {tag}
              </span>
              {construct && (
                <span className="text-sm text-gray-500">{construct}</span>
              )}
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-6">{renderTitle()}</h2>
          {children}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse md:flex-row gap-3 justify-between items-stretch mt-6">
            {/* Back Button */}
            {showBack ? (
              <button
                type="button"
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-base min-h-[48px] hover:bg-gray-50 transition"
                disabled
              >
                {backLabel}
              </button>
            ) : (
              <div></div>
            )}

            {/* Next/Submit Button */}
            {showSubmit ? (
              <button
                type="button"
                className="px-8 py-3 rounded-md font-medium text-base min-h-[48px] transition bg-gray-200 text-black"
                disabled
              >
                {submitLabel}
              </button>
            ) : showNext ? (
              <button
                type="button"
                className="px-8 py-3 rounded-md font-medium text-base min-h-[48px] transition bg-gray-200 text-black"
                disabled
              >
                {nextLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

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
// STEP 3 DOCUMENTATION COMPONENT
// ============================================

const Step3Documentation: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({ isOpen, onToggle }) => (
  <div className="mb-6 border border-blue-200 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full p-4 bg-blue-50 text-left flex justify-between items-center hover:bg-blue-100 transition"
    >
      <span className="font-semibold text-blue-900">Step 3 Documentation — Hypothesis Mapping</span>
      <span className="text-blue-600">{isOpen ? '▼' : '▶'}</span>
    </button>
    {isOpen && (
      <div className="p-4 bg-white text-sm space-y-4">
        {/* Purpose */}
        <div>
          <h4 className="font-bold text-gray-900 mb-1">Purpose</h4>
          <p className="text-gray-600">
            Step 3 validates H1–H3 via perceived transparency, perceived user control, and risk perception
            after the donation decision. Trust is included as a supporting construct for interpretation.
          </p>
        </div>

        {/* What is measured */}
        <div>
          <h4 className="font-bold text-gray-900 mb-1">What is Measured</h4>
          <ul className="text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">MC-T</span>
              Perceived Transparency (2 items) — H1 manipulation check
            </li>
            <li className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">MC-C</span>
              Perceived User Control (2 items) — H2 manipulation check
            </li>
            <li className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">OUT-RISK</span>
              Risk Perception (2 items) — H3 interaction mechanism
            </li>
            <li className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">OUT-TRUST</span>
              Trust (2 items) — Supporting construct
            </li>
            <li className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">QUAL</span>
              Open Text — Qualitative reasoning
            </li>
          </ul>
        </div>

        {/* What is excluded */}
        <div>
          <h4 className="font-bold text-gray-900 mb-1">Intentionally Excluded</h4>
          <ul className="text-gray-600 list-disc pl-5 space-y-1">
            <li><strong>Model origin items</strong> — Measures institutional trust cues, not procedural transparency</li>
            <li><strong>Agency items</strong> — Redundant with control construct</li>
            <li><strong>Acceptable use checkboxes</strong> — Exploratory, not needed for H1-H3</li>
          </ul>
        </div>

        {/* Expected patterns */}
        <div>
          <h4 className="font-bold text-gray-900 mb-1">Expected Condition Patterns</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 pr-2">Construct</th>
                  <th className="text-center py-1 px-2">A</th>
                  <th className="text-center py-1 px-2">B</th>
                  <th className="text-center py-1 px-2">C</th>
                  <th className="text-center py-1 px-2">D</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-1 pr-2">Transparency</td>
                  <td className="text-center py-1 px-2">Low</td>
                  <td className="text-center py-1 px-2 font-bold text-blue-600">High</td>
                  <td className="text-center py-1 px-2">Low</td>
                  <td className="text-center py-1 px-2 font-bold text-blue-600">High</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 pr-2">User Control</td>
                  <td className="text-center py-1 px-2">Low</td>
                  <td className="text-center py-1 px-2">Low</td>
                  <td className="text-center py-1 px-2 font-bold text-green-600">High</td>
                  <td className="text-center py-1 px-2 font-bold text-green-600">High</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 pr-2">Risk Perception</td>
                  <td className="text-center py-1 px-2 font-bold text-red-600">Highest</td>
                  <td className="text-center py-1 px-2">Medium</td>
                  <td className="text-center py-1 px-2">Medium</td>
                  <td className="text-center py-1 px-2 font-bold text-green-600">Lowest</td>
                </tr>
                <tr>
                  <td className="py-1 pr-2">Trust</td>
                  <td className="text-center py-1 px-2 text-gray-400" colSpan={4}>Exploratory — not required for H1-H3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Item count */}
        <div className="pt-2 border-t">
          <p className="text-gray-600">
            <strong>Total items:</strong> 8 core Likert items + 1 attention check + 4 demographics + 1 optional text + 1 optional email
          </p>
        </div>
      </div>
    )}
  </div>
);

// ============================================
// FULL JOURNEY VIEW COMPONENT
// ============================================

interface FullJourneyViewProps {
  condition: 'A' | 'B' | 'C' | 'D';
  onBack: () => void;
}

// Compact card wrapper for journey view (no min-h-screen)
const JourneyCard: React.FC<{
  children: React.ReactNode;
  title: string;
  tag?: HypothesisTag;
  construct?: string;
}> = ({ children, title, tag, construct }) => {
  const colors = tag ? TAG_COLORS[tag] : null;
  const stepMatch = title.match(/^(Step \d+ of \d+ — )(.*)/);
  const renderTitle = () => {
    if (stepMatch) {
      return (
        <>
          <span className="text-gray-500 font-normal">{stepMatch[1]}</span>
          {stepMatch[2]}
        </>
      );
    }
    return title;
  };

  return (
    <div className="bg-gray-50 py-4 rounded-lg border border-gray-200">
      <div className="max-w-2xl mx-auto px-4">
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${colors ? `border-l-4 ${colors.border}` : ''}`}>
          {tag && (
            <div className="mb-4 flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${colors?.bg} ${colors?.text}`}>
                {tag}
              </span>
              {construct && (
                <span className="text-sm text-gray-500">{construct}</span>
              )}
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-6">{renderTitle()}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};

const FullJourneyView: React.FC<FullJourneyViewProps> = ({ condition, onBack }) => {
  const { t } = useTranslation();

  const conditionDescriptions = {
    A: { name: 'Baseline', description: 'No transparency info, binary choice only', color: 'bg-gray-100 border-gray-300' },
    B: { name: 'Transparency', description: 'Data Nutrition Label shown, binary choice', color: 'bg-blue-50 border-blue-300' },
    C: { name: 'Control', description: 'Granular Dashboard with 4 configurable options', color: 'bg-green-50 border-green-300' },
    D: { name: 'Full', description: 'Both DNL + Dashboard (transparency + control)', color: 'bg-purple-50 border-purple-300' },
  };

  const info = conditionDescriptions[condition];

  // Screen divider with number and title
  const ScreenDivider = ({ id, name, tag }: { id: string; name: string; tag?: HypothesisTag }) => {
    const colors = tag ? TAG_COLORS[tag] : null;
    return (
      <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
        <span className="text-2xl font-bold text-gray-300">{id}</span>
        <span className="font-medium text-gray-700">{name}</span>
        {tag && (
          <span className={`text-xs px-2 py-1 rounded font-bold ${colors?.bg} ${colors?.text}`}>
            {tag}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
            >
              ← Back to Navigator
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Full Journey — Condition {condition}
              </h1>
              <p className="text-sm text-gray-500">{info.name}: {info.description}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border-2 ${info.color}`}>
            <span className="text-2xl font-bold">{condition}</span>
          </div>
        </div>
      </div>

      {/* Journey Content - Each screen exactly as in navigator */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ========== 1: LANDING PAGE ========== */}
        <ScreenDivider id="1" name="Landing Page" />
        <div className="min-h-[600px] flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 md:p-10 lg:p-12 shadow-sm">
            <div className="flex justify-end gap-2 mb-6 md:mb-8">
              <span className="text-sm text-gray-500">[Language Selector]</span>
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

        {/* ========== 1B: DECLINED PAGE ========== */}
        <ScreenDivider id="1B" name="Declined Page" />
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 md:p-10 lg:p-12 shadow-sm text-center">
            <div className="flex justify-end gap-2 mb-6 md:mb-8">
              <span className="text-sm text-gray-500">[Language Selector]</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-black">
              {t('landing.declineMessage')}
            </h2>
            <a
              href="http://publicai.ch/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
            >
              {t('landing.declinedPage.button')}
            </a>
          </div>
        </div>

        {/* ========== 1C: CONSENT MODAL ========== */}
        <ScreenDivider id="1C" name="Consent Modal" />
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-md mx-auto p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-black leading-tight">{t('landing.consentModal.title')}</h2>
            <p className="text-base md:text-lg text-black mb-6 leading-relaxed">{t('landing.consentModal.text')}</p>
            <ul className="list-disc pl-5 space-y-2 text-base text-black mb-6 leading-relaxed">
              <li>{t('landing.consentModal.age')}</li>
              <li>{t('landing.consentModal.residence')}</li>
              <li>{t('landing.consentModal.voluntary')}</li>
            </ul>
            <label className="flex items-start gap-3 cursor-pointer min-h-[44px] items-center mb-8">
              <input type="checkbox" className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-600 flex-shrink-0" disabled />
              <span className="text-base text-black leading-relaxed">{t('landing.consentModal.confirm_checkbox')}</span>
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <button className="w-full md:flex-1 px-6 py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] transition bg-gray-300 text-gray-500 cursor-not-allowed">
                {t('landing.consentModal.confirm')}
              </button>
              <button className="w-full md:flex-1 bg-gray-300 text-black px-6 py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] hover:bg-gray-400 transition">
                {t('landing.consentModal.back')}
              </button>
            </div>
          </div>
        </div>

        {/* ========== 2A: BASELINE Q1 ========== */}
        <ScreenDivider id="2A" name="Baseline Q1" />
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
            <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
              {t('baseline.aboutYou', 'About you')}
            </p>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
              {t('baseline.techComfort.question')}
            </h2>
            <LikertScale
              name="techComfort-preview"
              value={null}
              onChange={() => {}}
              leftLabel={t('baseline.techComfort.stronglyDisagree')}
              rightLabel={t('baseline.techComfort.stronglyAgree')}
              points={7}
            />
            <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
              <div></div>
              <button className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                {t('survey.navigation.next')} →
              </button>
            </div>
          </div>
        </div>

        {/* ========== 2B: BASELINE Q2 ========== */}
        <ScreenDivider id="2B" name="Baseline Q2" />
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
            <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
              {t('baseline.aboutYou', 'About you')}
            </p>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
              {t('baseline.privacyConcern.question')}
            </h2>
            <LikertScale
              name="privacyConcern-preview"
              value={null}
              onChange={() => {}}
              leftLabel={t('baseline.privacyConcern.stronglyDisagree')}
              rightLabel={t('baseline.privacyConcern.stronglyAgree')}
              points={7}
            />
            <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
              <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-base min-h-[48px] hover:bg-gray-50 transition">
                ← {t('survey.navigation.back')}
              </button>
              <button className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                {t('survey.navigation.next')} →
              </button>
            </div>
          </div>
        </div>

        {/* ========== 2C: BASELINE Q3 ========== */}
        <ScreenDivider id="2C" name="Baseline Q3" tag="COV" />
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
            <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
              {t('baseline.aboutYou', 'About you')}
            </p>
            <div className="mb-4 flex items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600">COV</span>
              <span className="text-sm text-gray-500">Ballot Familiarity - Covariate</span>
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
              {t('baseline.ballotFamiliarity.question')}
            </h2>
            <LikertScale
              name="ballotFamiliarity-preview"
              value={null}
              onChange={() => {}}
              leftLabel={t('baseline.ballotFamiliarity.notFamiliar')}
              rightLabel={t('baseline.ballotFamiliarity.veryFamiliar')}
              points={7}
            />
            <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
              <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-base min-h-[48px] hover:bg-gray-50 transition">
                ← {t('survey.navigation.back')}
              </button>
              <button className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                {t('baseline.continue')}
              </button>
            </div>
          </div>
        </div>

        {/* ========== 3: INSTRUCTION ========== */}
        <ScreenDivider id="3" name="Instruction" />
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="bg-white rounded-lg max-w-2xl mx-auto p-6 shadow-lg">
            <div className="mb-6 text-left">
              <h1 className="text-2xl font-bold mb-4 text-black">{t('instruction.aboutTitle')}</h1>
              <div className="space-y-3">
                <p className="text-base text-black leading-relaxed">{t('instruction.aboutText1')}</p>
                <p className="text-base text-black leading-relaxed">{t('instruction.aboutText2')}</p>
              </div>
            </div>
            <h2 className="text-lg font-bold mb-3 text-black text-left">
              <span className="text-gray-500 font-normal">Step 1 of 3 — </span>
              {t('instruction.headline').replace('Step 1 of 3 — ', '')}
            </h2>
            <div className="mb-6 space-y-4 text-left">
              <p className="text-base text-black leading-relaxed">{t('instruction.text1')}</p>
              <p className="text-base text-black leading-relaxed">{t('instruction.text2')}</p>
              <p className="text-base text-black leading-relaxed">{t('instruction.text3')}</p>
            </div>
            <div className="mb-6 text-left">
              <p className="text-base font-semibold text-black mb-2">{t('instruction.task')}</p>
              <p className="text-base text-black">{t('instruction.taskSubtitle')}</p>
            </div>
            <div className="mb-6 text-left">
              <p className="text-sm font-semibold text-black mb-2">{t('instruction.examplesLabel')}</p>
              <ul className="space-y-1.5">
                <li className="text-sm text-black pl-3 border-l-2 border-gray-300">{t('instruction.example1')}</li>
                <li className="text-sm text-black pl-3 border-l-2 border-gray-300">{t('instruction.example2')}</li>
                <li className="text-sm text-black pl-3 border-l-2 border-gray-300">{t('instruction.example3')}</li>
              </ul>
            </div>
            <div className="flex flex-col-reverse md:flex-row gap-3 justify-between">
              <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-base min-h-[48px] hover:bg-gray-50 transition">
                ← {t('survey.navigation.back')}
              </button>
              <button className="bg-gray-200 text-black px-8 py-3 rounded-lg font-medium text-base min-h-[48px]">
                {t('instruction.button')}
              </button>
            </div>
          </div>
        </div>

        {/* ========== 4: CHAT INTERFACE ========== */}
        <ScreenDivider id="4" name="Chat Interface" />
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
          <div className="flex flex-col h-full max-w-4xl mx-auto">
            <div className="bg-[#FF0000] text-white p-4">
              <h2 className="text-xl font-bold">{t('chat.title')}</h2>
              <p className="text-sm">{t('chat.subtitle')}</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                    What is the Klimafonds Initiative about?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-md">
                    The Klimafonds Initiative proposes establishing a climate fund to invest in renewable energy and climate protection measures...
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input type="text" placeholder={t('chat.placeholder')} className="flex-1 p-3 border border-gray-300 rounded-lg" disabled />
                <button className="px-6 py-3 bg-blue-500 text-white rounded-lg">{t('chat.send')}</button>
              </div>
            </div>
            <div className="p-2 text-center text-sm text-gray-500 bg-yellow-50 border-t border-yellow-200">
              {t('chat.minQuestions', { count: 1 })}
            </div>
          </div>
        </div>

        {/* ========== 5: DONATION MODAL (CONDITION-SPECIFIC) ========== */}
        <ScreenDivider id="5" name="Donation Modal" />
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className={`bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 mx-auto ${condition === 'D' ? 'max-w-3xl' : 'max-w-2xl'}`}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black leading-tight">
              <span className="text-gray-500 font-normal">Step 2 of 3 — </span>
              Your decision about data donation
            </h2>
            <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed whitespace-pre-line font-semibold">
              {t(`donation.condition${condition}.intro`)}
            </p>

            {/* Condition A: Baseline - no extra content, just intro → decision */}

            {/* Condition B: DNL only */}
            {condition === 'B' && (
              <div className="mb-6">
                <DataNutritionLabel />
              </div>
            )}

            {/* Condition C: Dashboard only */}
            {condition === 'C' && (
              <div className="space-y-3 mb-6">
                {[
                  { title: t('dashboard.scope.label'), options: [t('dashboard.scope.topicsOnly'), t('dashboard.scope.questionsOnly'), t('dashboard.scope.full')] },
                  { title: t('dashboard.purpose.label'), options: [t('dashboard.purpose.academic'), t('dashboard.purpose.commercial')] },
                  { title: t('dashboard.storage.label'), options: [t('dashboard.storage.swiss'), t('dashboard.storage.swissOrEu'), t('dashboard.storage.noPreference')] },
                  { title: t('dashboard.retention.label'), options: [t('dashboard.retention.untilFulfilled'), t('dashboard.retention.6months'), t('dashboard.retention.1year'), t('dashboard.retention.indefinite')] }
                ].map((panel, idx) => (
                  <div key={idx} className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg text-gray-900 bg-gray-100 inline-block px-3 py-1 rounded-md">{panel.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {panel.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-400 cursor-pointer">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center flex-shrink-0" />
                          <span className="text-base font-medium text-gray-900">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Condition D: Both DNL + Dashboard */}
            {condition === 'D' && (
              <>
                <div className="mb-6">
                  <DataNutritionLabel />
                </div>
                <div className="border-t border-gray-200 my-6" />
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-xl">⚙️</span>
                    {t('dashboard.title')}
                  </h3>
                  <div className="space-y-3">
                    {[
                      { title: t('dashboard.scope.label'), options: [t('dashboard.scope.topicsOnly'), t('dashboard.scope.questionsOnly'), t('dashboard.scope.full')] },
                      { title: t('dashboard.purpose.label'), options: [t('dashboard.purpose.academic'), t('dashboard.purpose.commercial')] },
                      { title: t('dashboard.storage.label'), options: [t('dashboard.storage.swiss'), t('dashboard.storage.swissOrEu'), t('dashboard.storage.noPreference')] },
                      { title: t('dashboard.retention.label'), options: [t('dashboard.retention.untilFulfilled'), t('dashboard.retention.6months'), t('dashboard.retention.1year'), t('dashboard.retention.indefinite')] }
                    ].map((panel, idx) => (
                      <div key={idx} className="rounded-lg border-2 border-gray-200 bg-white p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold text-lg text-gray-900 bg-gray-100 inline-block px-3 py-1 rounded-md">{panel.title}</h3>
                        </div>
                        <div className="space-y-2">
                          {panel.options.map((opt, optIdx) => (
                            <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-400 cursor-pointer">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center flex-shrink-0" />
                              <span className="text-base font-medium text-gray-900">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Decision buttons */}
            <div className="mt-8">
              <p className="text-xl md:text-2xl font-semibold text-black mb-6 leading-relaxed">
                {t('donation.decisionQuestion')}
              </p>
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <button className="w-full md:flex-1 bg-gray-200 text-black py-4 rounded-md font-medium text-base md:text-lg min-h-[48px] hover:bg-green-600 hover:text-white transition">
                  {t('donation.accept')}
                </button>
                <button className="w-full md:flex-1 bg-white text-black border border-gray-300 py-4 rounded-md font-medium text-base md:text-lg min-h-[48px] hover:bg-gray-100 transition">
                  {t('donation.decline')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 5B: THANK YOU PAGE ========== */}
        <ScreenDivider id="5B" name="Thank You Page" />
        <JourneyCard title="Confirmation Screen">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-black">{t('donation.confirmDonate.title')}</h2>
            <p className="text-xl text-black mb-4 leading-relaxed">
              {t('donation.confirmDonate.message')}
            </p>
            <p className="text-xl text-black mb-8 leading-relaxed">
              {t('donation.confirmDonate.nextStep')}
            </p>
            <button className="px-8 py-4 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
              {t('donation.confirmDonate.button')}
            </button>
          </div>
        </JourneyCard>

        {/* ========== 5C: DECLINE CONFIRMATION ========== */}
        <ScreenDivider id="5C" name="Decline Confirmation" />
        <JourneyCard title="Confirmation Screen">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-black">{t('donation.confirmDecline.title')}</h2>
            <p className="text-xl text-black mb-4 leading-relaxed">
              {t('donation.confirmDecline.message')}
            </p>
            <p className="text-xl text-black mb-8 leading-relaxed">
              {t('donation.confirmDecline.nextStep')}
            </p>
            <button className="px-8 py-4 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
              {t('donation.confirmDecline.button')}
            </button>
          </div>
        </JourneyCard>

        {/* ========== 6: Q4 TRANSPARENCY (MC-T) ========== */}
        <ScreenDivider id="6" name="Q4: Transparency" tag="MC-T" />
        <JourneyCard title="Step 3 of 3 — Your View on Data Use" tag="MC-T" construct="Perceived Transparency">
          <p className="text-lg md:text-xl text-gray-900 mb-6 leading-relaxed font-medium">{t('survey.transparency.intro')}</p>
          <LikertItemPreview label={t('survey.transparency.q1')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <LikertItemPreview label={t('survey.transparency.q2')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <div className="mt-6 p-3 bg-blue-50 rounded text-sm text-blue-700">
            <strong>Expected:</strong> Higher in B & D (with DNL) than A & C
          </div>
        </JourneyCard>

        {/* ========== 7: Q5 CONTROL (MC-C) ========== */}
        <ScreenDivider id="7" name="Q5: Control" tag="MC-C" />
        <JourneyCard title="Step 3 of 3 — Your View on Data Use" tag="MC-C" construct="Perceived User Control">
          <p className="text-lg md:text-xl text-gray-900 mb-6 leading-relaxed font-medium">{t('survey.control.intro')}</p>
          <LikertItemPreview label={t('survey.control.q1')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <LikertItemPreview label={t('survey.control.q2')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <div className="mt-6 p-3 bg-green-50 rounded text-sm text-green-700">
            <strong>Expected:</strong> Higher in C & D (with Dashboard) than A & B
          </div>
        </JourneyCard>

        {/* ========== 8: Q6 RISK (OUT-RISK) ========== */}
        <ScreenDivider id="8" name="Q6: Risk" tag="OUT-RISK" />
        <JourneyCard title="Step 3 of 3 — Your View on Data Use" tag="OUT-RISK" construct="Risk Perception">
          <p className="text-lg md:text-xl text-gray-900 mb-6 leading-relaxed font-medium">{t('survey.risk.intro')}</p>
          <LikertItemPreview label={t('survey.risk.traceability')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <LikertItemPreview label={t('survey.risk.misuse')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <div className="mt-6 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
            <strong>Expected:</strong> Lowest in D (high transparency reduces risk), highest in A
          </div>
        </JourneyCard>

        {/* ========== 9: Q7 TRUST (OUT-TRUST) ========== */}
        <ScreenDivider id="9" name="Q7: Trust" tag="OUT-TRUST" />
        <JourneyCard title="Step 3 of 3 — Your View on Data Use" tag="OUT-TRUST" construct="Trust">
          <LikertItemPreview label={t('survey.trust.q1')} leftLabel={t('survey.likert.disagree')} rightLabel={t('survey.likert.agree')} />
          <div className="mt-6 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
            <strong>Note:</strong> Exploratory - not required for H1-H3 testing
          </div>
        </JourneyCard>

        {/* ========== 10: Q8 ATTENTION CHECK ========== */}
        <ScreenDivider id="10" name="Q8: Attention Check" />
        <JourneyCard title={t('survey.chatbotQuestion.header')}>
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{t('survey.chatbotQuestion.question')}</p>
          <div className="space-y-3">
            {[
              { key: 'voting', label: t('survey.chatbotQuestion.voting') },
              { key: 'tax', label: t('survey.chatbotQuestion.tax') },
              { key: 'immigration', label: t('survey.chatbotQuestion.immigration') },
              { key: 'dontremember', label: t('survey.chatbotQuestion.dontremember') }
            ].map((opt) => (
              <button key={opt.key} type="button" className="w-full text-left px-5 py-4 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-150 min-h-[52px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </JourneyCard>

        {/* ========== 11: TRANSITION ========== */}
        <ScreenDivider id="11" name="Transition" />
        <div className="bg-gray-50 py-4 rounded-lg border border-gray-200">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-4">
                <div className="text-5xl mb-6">🙏🏻</div>
                <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-900">{t('survey.transition.title')}</h2>
                <p className="text-lg text-gray-600 mb-8">{t('survey.transition.message')}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-lg mx-auto mb-8">
                  <p className="text-sm text-blue-800 leading-relaxed">{t('survey.transition.reminder')}</p>
                </div>
                <button type="button" className="bg-gray-200 text-black px-8 py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                  {t('survey.navigation.next')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 12: Q9 AGE ========== */}
        <ScreenDivider id="12" name="Q9: Age" tag="DEMO" />
        <JourneyCard title="A few questions about you" tag="DEMO">
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{t('survey.demographics.age.question')}</p>
          <div className="space-y-3">
            {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((age) => (
              <button key={age} type="button" className="w-full text-left px-5 py-4 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-150 min-h-[52px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                  <span className="text-base font-medium">{t(`survey.demographics.age.${age}`)}</span>
                </div>
              </button>
            ))}
          </div>
        </JourneyCard>

        {/* ========== 13: Q10 GENDER ========== */}
        <ScreenDivider id="13" name="Q10: Gender" tag="DEMO" />
        <JourneyCard title="A few questions about you" tag="DEMO">
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{t('survey.demographics.gender.question')}</p>
          <div className="space-y-3">
            {[
              { key: 'female', label: t('survey.demographics.gender.female') },
              { key: 'male', label: t('survey.demographics.gender.male') },
              { key: 'nonBinary', label: t('survey.demographics.gender.nonBinary') },
              { key: 'other', label: t('survey.demographics.gender.other') },
              { key: 'preferNotSay', label: t('survey.demographics.preferNotSay') }
            ].map((opt) => (
              <button key={opt.key} type="button" className="w-full text-left px-5 py-4 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-150 min-h-[52px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </JourneyCard>

        {/* ========== 14: Q11 LANGUAGE ========== */}
        <ScreenDivider id="14" name="Q11: Language" tag="DEMO" />
        <JourneyCard title="A few questions about you" tag="DEMO">
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{t('survey.demographics.language.question')}</p>
          <div className="space-y-3">
            {[
              { key: 'german', label: t('survey.demographics.language.german') },
              { key: 'french', label: t('survey.demographics.language.french') },
              { key: 'italian', label: t('survey.demographics.language.italian') },
              { key: 'english', label: t('survey.demographics.language.english') },
              { key: 'romansh', label: t('survey.demographics.language.romansh') },
              { key: 'other', label: t('survey.demographics.language.other') }
            ].map((opt) => (
              <button key={opt.key} type="button" className="w-full text-left px-5 py-4 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-150 min-h-[52px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </JourneyCard>

        {/* ========== 15: Q12 EDUCATION ========== */}
        <ScreenDivider id="15" name="Q12: Education" tag="DEMO" />
        <JourneyCard title="A few questions about you" tag="DEMO">
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{t('survey.demographics.education.question')}</p>
          <div className="space-y-3">
            {[
              { key: 'mandatory', label: t('survey.demographics.education.mandatory') },
              { key: 'matura', label: t('survey.demographics.education.matura') },
              { key: 'vocational', label: t('survey.demographics.education.vocational') },
              { key: 'higherVocational', label: t('survey.demographics.education.higherVocational') },
              { key: 'appliedSciences', label: t('survey.demographics.education.appliedSciences') },
              { key: 'university', label: t('survey.demographics.education.university') },
              { key: 'preferNotSay', label: t('survey.demographics.preferNotSay') }
            ].map((opt) => (
              <button key={opt.key} type="button" className="w-full text-left px-5 py-4 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-150 min-h-[52px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </JourneyCard>

        {/* ========== 16: Q13 VOTING ELIGIBILITY ========== */}
        <ScreenDivider id="16" name="Q13: Voting Eligibility" tag="DEMO" />
        <JourneyCard title="A few questions about you" tag="DEMO">
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{t('survey.demographics.votingEligibility.question')}</p>
          <div className="space-y-3">
            {[
              { key: 'eligible', label: t('survey.demographics.votingEligibility.eligible') },
              { key: 'notEligible', label: t('survey.demographics.votingEligibility.notEligible') },
              { key: 'notSure', label: t('survey.demographics.votingEligibility.notSure') }
            ].map((opt) => (
              <button key={opt.key} type="button" className="w-full text-left px-5 py-4 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-all duration-150 min-h-[52px]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </JourneyCard>

        {/* ========== 17: Q14 OPEN FEEDBACK ========== */}
        <ScreenDivider id="17" name="Q14: Open Feedback" tag="QUAL" />
        <div className="bg-gray-50 py-4 rounded-lg border border-gray-200">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 border-l-4 border-l-yellow-400">
              <div className="mb-4 flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">QUAL</span>
                <span className="text-sm text-gray-500">Qualitative Insight</span>
              </div>
              <p className="text-lg md:text-xl text-gray-900 font-medium mb-1 leading-relaxed">{t('survey.openFeedback.question')}</p>
              <p className="text-base text-gray-500 mb-4">{t('survey.openFeedback.note')}</p>
              <textarea rows={5} className="w-full p-4 text-base border border-gray-300 rounded-md bg-white resize-none" placeholder={t('survey.openFeedback.placeholder')} disabled />
              <p className="text-sm text-gray-400 mt-2 text-right">0/500</p>
            </div>
          </div>
        </div>

        {/* ========== 18: DEBRIEFING ========== */}
        <ScreenDivider id="18" name="Debriefing" />
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-10 bg-white rounded-lg shadow-lg">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-black text-center leading-tight">{t('debrief.title')}</h1>

            {/* Important Notice - Yellow Box */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <p className="text-base md:text-lg text-black leading-relaxed">
                <strong>{t('debrief.important')}</strong> {t('debrief.simulationNote')}
              </p>
            </div>

            {/* What We're Studying Section */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-black">{t('debrief.whatWeStudy')}</h2>
              <p className="text-base md:text-lg text-black leading-relaxed mb-4">{t('debrief.studyPurpose')}</p>

              {/* Email Input */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-base text-black mb-2">{t('debrief.emailPrompt')}</label>
                <input
                  type="email"
                  className="w-full max-w-md p-3 text-base border border-gray-300 rounded-md bg-white"
                  placeholder={t('debrief.emailPlaceholder')}
                  disabled
                />
              </div>
            </div>

            {/* Questions/Contact Section */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-black">{t('debrief.questions')}</h2>
              <p className="text-base md:text-lg text-black mb-3 leading-relaxed">{t('debrief.contactIntro')}</p>
              <div className="space-y-1 text-base md:text-lg text-black">
                <p>{t('debrief.researcher')}</p>
                <p>{t('debrief.institution')}</p>
                <p>{t('debrief.supervisor')}</p>
              </div>
            </div>

            {/* Submit Button */}
            <button className="w-full bg-gray-200 text-black py-4 rounded-lg font-semibold text-base md:text-lg min-h-[48px] hover:bg-green-600 hover:text-white transition">
              {t('debrief.submit')}
            </button>
          </div>
        </div>

        {/* Back to top */}
        <div className="text-center py-8">
          <button onClick={onBack} className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition">
            ← Back to Navigator
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [showDocumentation, setShowDocumentation] = useState(false);
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

  const navigateToScreen = (screenId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('screen', screenId);
    window.history.replaceState({}, '', `?${params.toString()}`);
    setSelectedScreen(screenId);
  };

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

  const getExperimentConfig = () => {
    const configs = {
      A: { transparency: 'low' as const, control: 'low' as const, showDNL: false, showDashboard: false },
      B: { transparency: 'high' as const, control: 'low' as const, showDNL: true, showDashboard: false },
      C: { transparency: 'low' as const, control: 'high' as const, showDNL: false, showDashboard: true },
      D: { transparency: 'high' as const, control: 'high' as const, showDNL: true, showDashboard: true },
    };
    return configs[debugState.condition];
  };

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
    survey: 'Post-Task Survey (Step 3)',
    debrief: 'Debriefing',
  };

  const noop = () => console.log('[DEBUG] Callback triggered');

  // Render the selected screen component
  const renderScreen = () => {
    if (!selectedScreen) return null;

    const config = getExperimentConfig();
    const screenConfig = SCREENS.find(s => s.id === selectedScreen);

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

      case '1B': // Declined Page - exact copy from App.tsx
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="bg-white rounded-lg max-w-xl w-full p-6 md:p-10 lg:p-12 shadow-sm text-center">
              <div className="flex justify-end gap-2 mb-6 md:mb-8">
                <LanguageSelector />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-black">
                {t('landing.declineMessage')}
              </h2>
              <a
                href="http://publicai.ch/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
              >
                {t('landing.declinedPage.button')}
              </a>
            </div>
          </div>
        );

      case '1C': // Consent Modal - exact copy from App.tsx
        return (
          <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-black leading-tight">{t('landing.consentModal.title')}</h2>
              <p className="text-base md:text-lg text-black mb-6 leading-relaxed">{t('landing.consentModal.text')}</p>

              <ul className="list-disc pl-5 space-y-2 text-base text-black mb-6 leading-relaxed">
                <li>{t('landing.consentModal.age')}</li>
                <li>{t('landing.consentModal.residence')}</li>
                <li>{t('landing.consentModal.voluntary')}</li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer min-h-[44px] items-center mb-8">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-600 flex-shrink-0"
                />
                <span className="text-base text-black leading-relaxed">{t('landing.consentModal.confirm_checkbox')}</span>
              </label>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  disabled={true}
                  className="w-full md:flex-1 px-6 py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] transition bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  {t('landing.consentModal.confirm')}
                </button>
                <button
                  className="w-full md:flex-1 bg-gray-300 text-black px-6 py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] hover:bg-gray-400 transition"
                >
                  {t('landing.consentModal.back')}
                </button>
              </div>
            </div>
          </div>
        );

      case '2A':
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-white">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
              <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
                {t('baseline.aboutYou', 'About you')}
              </p>
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
              <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
                <div></div>
                <button className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                  {t('survey.navigation.next')} →
                </button>
              </div>
            </div>
          </div>
        );

      case '2B':
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-white">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
              <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
                {t('baseline.aboutYou', 'About you')}
              </p>
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
              <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
                <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-base min-h-[48px] hover:bg-gray-50 transition">
                  ← {t('survey.navigation.back')}
                </button>
                <button className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                  {t('survey.navigation.next')} →
                </button>
              </div>
            </div>
          </div>
        );

      case '2C':
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-white">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 md:p-8 lg:p-12 shadow-lg">
              <p className="text-base text-black uppercase tracking-wide mb-8 md:mb-10">
                {t('baseline.aboutYou', 'About you')}
              </p>
              <div className="mb-4 flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-600">COV</span>
                <span className="text-sm text-gray-500">Ballot Familiarity - Covariate</span>
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-8 md:mb-12 text-black text-left leading-relaxed">
                {t('baseline.ballotFamiliarity.question')}
              </h2>
              <LikertScale
                name="ballotFamiliarity"
                value={null}
                onChange={() => {}}
                leftLabel={t('baseline.ballotFamiliarity.notFamiliar')}
                rightLabel={t('baseline.ballotFamiliarity.veryFamiliar')}
                points={7}
              />
              <div className="mt-8 md:mt-12 flex flex-col-reverse md:flex-row gap-3 justify-between">
                <button className="w-full md:w-auto px-6 py-4 md:py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-base min-h-[48px] hover:bg-gray-50 transition">
                  ← {t('survey.navigation.back')}
                </button>
                <button className="w-full md:w-auto bg-gray-200 text-black px-8 py-4 md:py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                  {t('baseline.continue')}
                </button>
              </div>
            </div>
          </div>
        );

      case '3':
        return <ChatbotInstruction onContinue={noop} onBack={noop} />;

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

      // ========== DONATION (Simplified Static Previews) ==========
      case '5': {
        const isConditionA = !config.showDNL && !config.showDashboard;
        const isConditionB = config.showDNL && !config.showDashboard;
        const isConditionC = !config.showDNL && config.showDashboard;
        const isConditionD = config.showDNL && config.showDashboard;

        // Shared components
        const Headline = () => (
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black leading-tight">
            <span className="text-gray-500 font-normal">Step 2 of 3 — </span>
            Your decision about data donation
          </h2>
        );

        const IntroText = () => (
          <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed whitespace-pre-line font-semibold">
            {isConditionD
              ? "You have just finished testing the chatbot. To help improve this Swiss open-source model, we invite you to donate your anonymized chatbot questions. Please review the data facts below. You can also configure how your data will be used."
              : isConditionC
              ? "You have just finished testing the chatbot. To help improve this Swiss open-source model, we invite you to donate your anonymized chatbot questions. First, you can configure how your data will be used."
              : isConditionB
              ? "You have just finished testing the chatbot. To help improve this Swiss open-source model, we invite you to donate your anonymized chatbot questions.\nPlease review the data facts below to make an informed decision:"
              : "You have just finished testing the chatbot. To help improve this Swiss open-source model, we invite you to donate your anonymized chatbot questions."}
          </p>
        );

        const DecisionSection = ({ disabled = false }: { disabled?: boolean }) => (
          <div className="mt-8">
            <p className="text-xl md:text-2xl font-semibold text-black mb-6 leading-relaxed">
              Do you want to donate your anonymized chat questions for academic research?
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <button
                disabled={disabled}
                className={`w-full md:flex-1 py-4 rounded-md font-medium text-base md:text-lg min-h-[48px] transition ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-black hover:bg-green-600 hover:text-white'
                }`}
              >
                Donate Data
              </button>
              <button
                disabled={disabled}
                className={`w-full md:flex-1 py-4 rounded-md font-medium text-base md:text-lg min-h-[48px] transition ${
                  disabled
                    ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Don't Donate
              </button>
            </div>
          </div>
        );

        // ========== DASHBOARD: TRUE PROGRESSIVE DISCLOSURE ==========
        const SimplifiedDashboard = ({ onAllAnswered }: { onAllAnswered?: (complete: boolean) => void }) => {
          // State management
          const [shareChoice, setShareChoice] = React.useState<string | null>(null);
          const [usageChoice, setUsageChoice] = React.useState<string | null>(null);
          const [storageChoice, setStorageChoice] = React.useState<string | null>(null);
          const [retentionChoice, setRetentionChoice] = React.useState<string | null>(null);

          // Report completion state to parent
          React.useEffect(() => {
            const allAnswered = !!(shareChoice && usageChoice && storageChoice && retentionChoice);
            onAllAnswered?.(allAnswered);
          }, [shareChoice, usageChoice, storageChoice, retentionChoice, onAllAnswered]);

          // Options (no descriptions)
          const shareOptions = [
            { key: 'topics-only', label: 'High-level topics only' },
            { key: 'questions-only', label: 'My questions' },
            { key: 'full', label: 'My questions and chatbot answers' }
          ];
          const usageOptions = [
            { key: 'academic', label: 'Academic research only' },
            { key: 'commercial', label: 'Academic research and commercial use' }
          ];
          const storageOptions = [
            { key: 'swiss', label: 'Swiss servers only' },
            { key: 'swiss-or-eu', label: 'Swiss or EU servers' },
            { key: 'no-preference', label: 'No preference' }
          ];
          const retentionOptions = [
            { key: 'until-fulfilled', label: 'Until research purpose is fulfilled' },
            { key: '6months', label: 'Up to 6 months' },
            { key: '1year', label: 'Up to 1 year' },
            { key: 'indefinite', label: 'Indefinitely' }
          ];

          // Progressive disclosure: determine active step
          const getActiveStep = (): number => {
            if (!shareChoice) return 1;
            if (!usageChoice) return 2;
            if (!storageChoice) return 3;
            if (!retentionChoice) return 4;
            return 5; // All completed
          };
          const activeStep = getActiveStep();

          // Get selected label helper
          const getSelectedLabel = (options: { key: string; label: string }[], value: string | null) => {
            return options.find(opt => opt.key === value)?.label || '';
          };

          // Handle value changes with clearing logic
          const handleShareChange = (val: string) => {
            if (val === '') {
              setShareChoice(null);
              setUsageChoice(null);
              setStorageChoice(null);
              setRetentionChoice(null);
            } else {
              setShareChoice(val);
            }
          };
          const handleUsageChange = (val: string) => {
            if (val === '') {
              setUsageChoice(null);
              setStorageChoice(null);
              setRetentionChoice(null);
            } else {
              setUsageChoice(val);
            }
          };
          const handleStorageChange = (val: string) => {
            if (val === '') {
              setStorageChoice(null);
              setRetentionChoice(null);
            } else {
              setStorageChoice(val);
            }
          };
          const handleRetentionChange = (val: string) => {
            if (val === '') {
              setRetentionChoice(null);
            } else {
              setRetentionChoice(val);
            }
          };

          // Radio option component
          const RadioOption = ({ selected, label, onClick, name, id }: {
            selected: boolean; label: string; onClick: () => void; name: string; id: string;
          }) => (
            <label
              htmlFor={id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                selected
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                id={id}
                name={name}
                checked={selected}
                onChange={onClick}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? 'border-green-600' : 'border-gray-400'
              }`}>
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
              </div>
              <span className="text-base font-medium text-gray-900">{label}</span>
            </label>
          );

          // Collapsed answer display (shows selected answer)
          const CollapsedAnswer = ({ label }: { label: string }) => (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-800">{label}</span>
            </div>
          );

          // Pending question display (grayed out, only title visible)
          const PendingQuestion = ({ title }: { title: string }) => (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 opacity-60">
              <h3 className="font-semibold text-base text-gray-400">{title}</h3>
            </div>
          );

          // Question panel component with three states: pending, active, completed
          const QuestionPanel = ({
            step,
            title,
            options,
            value,
            onChange,
            name
          }: {
            step: number;
            title: string;
            options: { key: string; label: string }[];
            value: string | null;
            onChange: (val: string) => void;
            name: string;
          }) => {
            const isCompleted = activeStep > step;
            const isPending = activeStep < step;

            // PENDING: Show only grayed-out title
            if (isPending) {
              return <PendingQuestion title={title} />;
            }

            // COMPLETED: Show collapsed with selected answer + change button
            if (isCompleted && value) {
              return (
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base text-gray-700">{title}</h3>
                    <button
                      type="button"
                      onClick={() => onChange('')}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Change
                    </button>
                  </div>
                  <CollapsedAnswer label={getSelectedLabel(options, value)} />
                </div>
              );
            }

            // ACTIVE: Show full options
            return (
              <fieldset className="rounded-lg border-2 border-gray-300 bg-white p-4">
                <legend className="sr-only">{title}</legend>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">{title}</h3>
                <div className="space-y-2" role="radiogroup" aria-label={title}>
                  {options.map(opt => (
                    <RadioOption
                      key={opt.key}
                      id={`${name}-${opt.key}`}
                      name={name}
                      selected={value === opt.key}
                      label={opt.label}
                      onClick={() => onChange(opt.key)}
                    />
                  ))}
                </div>
              </fieldset>
            );
          };

          return (
            <div className="space-y-3" role="form" aria-label="Data donation configuration">
              {/* Q1: What to share */}
              <QuestionPanel
                step={1}
                title="What data would you like to share?"
                options={shareOptions}
                value={shareChoice}
                onChange={handleShareChange}
                name="share-choice"
              />

              {/* Q2: How data will be used */}
              <QuestionPanel
                step={2}
                title="How may your data be used?"
                options={usageOptions}
                value={usageChoice}
                onChange={handleUsageChange}
                name="usage-choice"
              />

              {/* Q3: Where stored */}
              <QuestionPanel
                step={3}
                title="Where should your data be stored?"
                options={storageOptions}
                value={storageChoice}
                onChange={handleStorageChange}
                name="storage-choice"
              />

              {/* Q4: Retention */}
              <QuestionPanel
                step={4}
                title="How long should your data be kept?"
                options={retentionOptions}
                value={retentionChoice}
                onChange={handleRetentionChange}
                name="retention-choice"
              />

              {/* Info text */}
              <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You can change these settings in your dashboard anytime.
              </p>
            </div>
          );
        };

        // Wrapper for Condition C: Dashboard + Decision with disabled buttons until complete
        const ConditionCContent = () => {
          const [allAnswered, setAllAnswered] = React.useState(false);
          return (
            <>
              <SimplifiedDashboard onAllAnswered={setAllAnswered} />
              <DecisionSection disabled={!allAnswered} />
            </>
          );
        };

        // Wrapper for Condition D: DNL + Dashboard + Decision with disabled buttons until complete
        const ConditionDContent = () => {
          const [allAnswered, setAllAnswered] = React.useState(false);
          return (
            <>
              {/* Section 1: About the Model (same DNL as condition B) */}
              <div className="mb-6">
                <DataNutritionLabel />
              </div>

              {/* Visual separator */}
              <div className="border-t border-gray-200 my-6" />

              {/* Section 2: Your Preferences (Dashboard) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-xl">⚙️</span>
                  Configure Your Data Donation
                </h3>
                <SimplifiedDashboard onAllAnswered={setAllAnswered} />
              </div>

              <DecisionSection disabled={!allAnswered} />
            </>
          );
        };

        return (
          <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 ${isConditionD ? 'max-w-3xl' : 'max-w-2xl'}`}>
              <Headline />
              <IntroText />

              {/* Condition A: Baseline - just binary question */}
              {isConditionA && (
                <DecisionSection />
              )}

              {/* Condition B: DNL + binary question */}
              {isConditionB && (
                <>
                  <DataNutritionLabel />
                  <DecisionSection />
                </>
              )}

              {/* Condition C: Dashboard + binary question */}
              {isConditionC && (
                <ConditionCContent />
              )}

              {/* Condition D: DNL + Dashboard (stacked layout to reduce cognitive overload) */}
              {isConditionD && (
                <ConditionDContent />
              )}
            </div>
          </div>
        );
      }

      // ========== MODEL DATA FACTS (Standalone Preview) ==========
      case '5-DNL':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <div className="text-center mb-6">
                <span className="text-sm text-gray-500 uppercase tracking-wide">Component Preview</span>
                <h2 className="text-xl font-bold text-black mt-1">Model Data Facts</h2>
                <p className="text-sm text-gray-600 mt-2">Shown in Condition B and D</p>
              </div>
              <DataNutritionLabel />
            </div>
          </div>
        );

      // ========== THANK YOU PAGE ==========
      case '5B':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-8 md:p-12 shadow-sm text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-6 text-black">{t('donation.confirmDonate.title')}</h2>
              <p className="text-xl text-black mb-4 leading-relaxed">
                {t('donation.confirmDonate.message')}
              </p>
              <p className="text-xl text-black mb-8 leading-relaxed">
                {t('donation.confirmDonate.nextStep')}
              </p>
              <button className="px-8 py-4 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition">
                {t('donation.confirmDonate.button')}
              </button>
            </div>
          </div>
        );

      // ========== DECLINE CONFIRMATION ==========
      case '5C':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-8 md:p-12 shadow-sm text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-6 text-black">{t('donation.confirmDecline.title')}</h2>
              <p className="text-xl text-black mb-4 leading-relaxed">
                {t('donation.confirmDecline.message')}
              </p>
              <p className="text-xl text-black mb-8 leading-relaxed">
                {t('donation.confirmDecline.nextStep')}
              </p>
              <button className="px-8 py-4 bg-gray-200 text-black rounded-md font-medium text-base min-h-[48px] hover:bg-gray-900 hover:text-white transition">
                {t('donation.confirmDecline.button')}
              </button>
            </div>
          </div>
        );

      // ========== SURVEY - HYPOTHESIS-DRIVEN PREVIEWS ==========
      case '6': // Q3: Perceived Transparency (MC-T)
        return (
          <PreviewWrapper
            title="Step 3 of 3 — Your View on Data Use"
            tag="MC-T"
            construct="Perceived Transparency"
          >
            <p className="text-base text-gray-900 mb-6 leading-relaxed">
              {t('survey.transparency.intro')}
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
            {screenConfig?.expectedPattern && (
              <div className="mt-6 p-3 bg-blue-50 rounded text-sm text-blue-700">
                <strong>Expected:</strong> {screenConfig.expectedPattern}
              </div>
            )}
          </PreviewWrapper>
        );

      case '7': // Q4: Perceived User Control (MC-C)
        return (
          <PreviewWrapper
            title="Step 3 of 3 — Your View on Data Use"
            tag="MC-C"
            construct="Perceived User Control"
          >
            <p className="text-base text-gray-900 mb-6 leading-relaxed">
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
            {screenConfig?.expectedPattern && (
              <div className="mt-6 p-3 bg-green-50 rounded text-sm text-green-700">
                <strong>Expected:</strong> {screenConfig.expectedPattern}
              </div>
            )}
          </PreviewWrapper>
        );

      case '8': // Q5: Risk Perception (OUT-RISK)
        return (
          <PreviewWrapper
            title="Step 3 of 3 — Your View on Data Use"
            tag="OUT-RISK"
            construct="Risk Perception"
          >
            <p className="text-base text-gray-900 mb-6 leading-relaxed">
              {t('survey.risk.intro')}
            </p>
            <LikertItemPreview
              label={t('survey.risk.traceability')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            <LikertItemPreview
              label={t('survey.risk.misuse')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            {screenConfig?.expectedPattern && (
              <div className="mt-6 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
                <strong>Expected:</strong> {screenConfig.expectedPattern}
              </div>
            )}
          </PreviewWrapper>
        );

      case '9': // Q6: Trust (OUT-TRUST)
        return (
          <PreviewWrapper
            title="Step 3 of 3 — Your View on Data Use"
            tag="OUT-TRUST"
            construct="Trust"
          >
            <LikertItemPreview
              label={t('survey.trust.q1')}
              leftLabel={t('survey.likert.disagree')}
              rightLabel={t('survey.likert.agree')}
            />
            {screenConfig?.expectedPattern && (
              <div className="mt-6 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
                <strong>Note:</strong> {screenConfig.expectedPattern}
              </div>
            )}
          </PreviewWrapper>
        );

      case '10': // Q7: Chatbot Question
        return (
          <PreviewWrapper title={t('survey.chatbotQuestion.header')}>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.chatbotQuestion.question')}
            </p>
            <div className="space-y-3">
              {[
                { key: 'voting', label: t('survey.chatbotQuestion.voting') },
                { key: 'tax', label: t('survey.chatbotQuestion.tax') },
                { key: 'immigration', label: t('survey.chatbotQuestion.immigration') },
                { key: 'dontremember', label: t('survey.chatbotQuestion.dontremember') }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                    'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      'border-gray-300 bg-white'
                    }`}>
                    </div>
                    <span className="text-base font-medium">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '11': // Transition
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-lg mx-auto mb-8">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {t('survey.transition.reminder')}
                    </p>
                  </div>
                  {/* Next button */}
                  <button
                    type="button"
                    className="bg-gray-200 text-black px-8 py-3 rounded-lg font-medium text-base min-h-[48px] hover:bg-green-600 hover:text-white transition"
                  >
                    {t('survey.navigation.next')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case '12': // Q8: Age
        return (
          <PreviewWrapper title="A few questions about you" tag="DEMO">
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.age.question')}
            </p>
            <div className="space-y-3">
              {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((age) => (
                <button
                  key={age}
                  type="button"
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                    'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      'border-gray-300 bg-white'
                    }`}>
                    </div>
                    <span className="text-base font-medium">{t(`survey.demographics.age.${age}`)}</span>
                  </div>
                </button>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '13': // Q9: Gender
        return (
          <PreviewWrapper title="A few questions about you" tag="DEMO">
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.gender.question')}
            </p>
            <div className="space-y-3">
              {[
                { key: 'female', label: t('survey.demographics.gender.female') },
                { key: 'male', label: t('survey.demographics.gender.male') },
                { key: 'nonBinary', label: t('survey.demographics.gender.nonBinary') },
                { key: 'other', label: t('survey.demographics.gender.other') },
                { key: 'preferNotSay', label: t('survey.demographics.preferNotSay') }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                    'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      'border-gray-300 bg-white'
                    }`}>
                    </div>
                    <span className="text-base font-medium">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '14': // Q10: Language
        return (
          <PreviewWrapper title="A few questions about you" tag="DEMO">
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.language.question')}
            </p>
            <div className="space-y-3">
              {[
                { key: 'german', label: t('survey.demographics.language.german') },
                { key: 'french', label: t('survey.demographics.language.french') },
                { key: 'italian', label: t('survey.demographics.language.italian') },
                { key: 'english', label: t('survey.demographics.language.english') },
                { key: 'romansh', label: t('survey.demographics.language.romansh') },
                { key: 'other', label: t('survey.demographics.language.other') }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                    'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      'border-gray-300 bg-white'
                    }`}>
                    </div>
                    <span className="text-base font-medium">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '15': // Q11: Education
        return (
          <PreviewWrapper title="A few questions about you" tag="DEMO">
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.education.question')}
            </p>
            <div className="space-y-3">
              {[
                { key: 'mandatory', label: t('survey.demographics.education.mandatory') },
                { key: 'matura', label: t('survey.demographics.education.matura') },
                { key: 'vocational', label: t('survey.demographics.education.vocational') },
                { key: 'higherVocational', label: t('survey.demographics.education.higherVocational') },
                { key: 'appliedSciences', label: t('survey.demographics.education.appliedSciences') },
                { key: 'university', label: t('survey.demographics.education.university') },
                { key: 'preferNotSay', label: t('survey.demographics.preferNotSay') }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                    'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      'border-gray-300 bg-white'
                    }`}>
                    </div>
                    <span className="text-base font-medium">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '16': // Q13: Voting Eligibility
        return (
          <PreviewWrapper title="A few questions about you" tag="DEMO">
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {t('survey.demographics.votingEligibility.question')}
            </p>
            <div className="space-y-3">
              {[
                { key: 'eligible', label: t('survey.demographics.votingEligibility.eligible') },
                { key: 'notEligible', label: t('survey.demographics.votingEligibility.notEligible') },
                { key: 'notSure', label: t('survey.demographics.votingEligibility.notSure') }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                    'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      'border-gray-300 bg-white'
                    }`}>
                    </div>
                    <span className="text-base font-medium">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </PreviewWrapper>
        );

      case '17': // Q14: Open Feedback (LAST PAGE - "Next" button submits survey)
        return (
          <div className="min-h-screen bg-gray-50 py-6 md:py-10">
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10 border-l-4 border-l-yellow-400">
                <div className="mb-4 flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">QUAL</span>
                  <span className="text-sm text-gray-500">Qualitative Insight</span>
                </div>
                <p className="text-lg md:text-xl text-gray-900 font-medium mb-1 leading-relaxed">{t('survey.openFeedback.question')}</p>
                <p className="text-base text-gray-500 mb-4">{t('survey.openFeedback.note')}</p>
                <textarea
                  rows={5}
                  className="w-full p-4 text-base border border-gray-300 rounded-md bg-white resize-none"
                  placeholder={t('survey.openFeedback.placeholder')}
                />
                <p className="text-sm text-gray-400 mt-2 text-right">0/500</p>

                {/* Navigation Buttons - "Next" submits on last page */}
                <div className="flex flex-col-reverse md:flex-row gap-3 justify-between items-stretch mt-6">
                  <button
                    type="button"
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-base min-h-[48px] hover:bg-gray-50 transition"
                    disabled
                  >
                    ← {t('survey.navigation.back')}
                  </button>
                  <button
                    type="button"
                    className="px-8 py-3 rounded-md font-medium text-base min-h-[48px] transition bg-gray-200 text-black"
                    disabled
                  >
                    {t('survey.navigation.next')} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      // ========== DEBRIEF ==========
      case '18':
        return <Debriefing />;

      // ========== FULL JOURNEY VIEWS ==========
      case 'journey-A':
        return <FullJourneyView condition="A" onBack={backToList} />;
      case 'journey-B':
        return <FullJourneyView condition="B" onBack={backToList} />;
      case 'journey-C':
        return <FullJourneyView condition="C" onBack={backToList} />;
      case 'journey-D':
        return <FullJourneyView condition="D" onBack={backToList} />;

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
        {/* Floating Debug Controls */}
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

        {/* Current Screen Badge */}
        <div className="fixed top-4 left-4 z-[200] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs">
          <span className="font-mono mr-2">{selectedScreen}</span>
          <span className="opacity-70">{SCREENS.find(s => s.id === selectedScreen)?.name}</span>
          {SCREENS.find(s => s.id === selectedScreen)?.conditionDependent && (
            <span className="ml-2 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">{debugState.condition}</span>
          )}
          {SCREENS.find(s => s.id === selectedScreen)?.tag && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${TAG_COLORS[SCREENS.find(s => s.id === selectedScreen)!.tag!].bg} ${TAG_COLORS[SCREENS.find(s => s.id === selectedScreen)!.tag!].text}`}>
              {SCREENS.find(s => s.id === selectedScreen)?.tag}
            </span>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {renderScreen()}
        </div>
      </div>
    );
  }

  // Journey steps with condition-specific content
  const getJourneySteps = (condition: 'A' | 'B' | 'C' | 'D') => {
    const donationContent = {
      A: 'Simple text asking to donate data. Binary choice: Donate / Don\'t Donate',
      B: 'Data Nutrition Label shown with model transparency info. Binary choice.',
      C: 'Granular Dashboard with 4 configurable options (scope, purpose, storage, retention).',
      D: 'Both DNL and Dashboard shown side-by-side. Full transparency + control.',
    };

    return [
      { id: '1', step: 1, name: 'Landing Page', content: 'Study introduction, requirements (18+, Swiss resident), consent' },
      { id: '1B', step: 2, name: 'Declined Page', content: 'Message: "Thank you for your consideration." Link to try Apertus chatbot at publicai.ch' },
      { id: '1C', step: 3, name: 'Consent Modal', content: 'Eligibility confirmation: 18+, Swiss voter, voluntary participation' },
      { id: '2A', step: 4, name: 'Baseline Q1', content: 'Tech comfort: "I am comfortable using new digital technology..."' },
      { id: '2B', step: 5, name: 'Baseline Q2', content: 'Privacy concern: "I am concerned about how my personal information..."' },
      { id: '2C', step: 6, name: 'Baseline Q3', content: 'Ballot familiarity: "How familiar are you with Swiss ballot initiatives?"', tag: 'COV' as HypothesisTag },
      { id: '3', step: 7, name: 'Instruction', content: 'About Apertus, task explanation, example questions' },
      { id: '4', step: 8, name: 'Chat Interface', content: 'Ask minimum 2 questions about Swiss ballot initiatives' },
      { id: '5', step: 9, name: 'Donation Modal', content: donationContent[condition], highlight: true },
      { id: '5B', step: 10, name: 'Thank You Page', content: 'Confirmation: "Your support helps us improve this ballot chatbot for everyone. Your feedback in the next step will make this tool even better for future users like you." Button: Share Your Thoughts →' },
      { id: '5C', step: 11, name: 'Decline Confirmation', content: 'Confirmation: "We appreciate your participation in this study. Your feedback in the next step is valuable and will help us improve this chatbot." Button: Share Your Thoughts →' },
      { id: '6', step: 12, name: 'Q4: Transparency', content: '2 items: information clarity, understood consequences', tag: 'MC-T' as HypothesisTag },
      { id: '7', step: 13, name: 'Q5: Control', content: '2 items: control over use, meaningful choices', tag: 'MC-C' as HypothesisTag },
      { id: '8', step: 14, name: 'Q6: Risk', content: '2 items: traceability, misuse concerns', tag: 'OUT-RISK' as HypothesisTag },
      { id: '9', step: 15, name: 'Q7: Trust', content: '1 item: trust to handle data responsibly', tag: 'OUT-TRUST' as HypothesisTag },
      { id: '10', step: 16, name: 'Q8: Attention', content: '"This chatbot helps with questions about:" checkbox selection', tag: 'ATTN' as HypothesisTag },
      { id: '11', step: 17, name: 'Transition', content: '"Almost done!" reminder that donation was simulated' },
      { id: '12', step: 18, name: 'Q9: Age', content: 'Age range dropdown (18-24 to 65+)', tag: 'DEMO' as HypothesisTag },
      { id: '13', step: 19, name: 'Q10: Gender', content: 'Gender dropdown with "Other" option', tag: 'DEMO' as HypothesisTag },
      { id: '14', step: 20, name: 'Q11: Language', content: 'Primary language (DE/FR/IT/EN/Romansh)', tag: 'DEMO' as HypothesisTag },
      { id: '15', step: 21, name: 'Q12: Education', content: 'Education level dropdown', tag: 'DEMO' as HypothesisTag },
      { id: '16', step: 22, name: 'Q13: Voting Eligibility', content: 'Are you eligible to vote in Switzerland?', tag: 'DEMO' as HypothesisTag },
      { id: '17', step: 23, name: 'Q14: Feedback', content: 'Optional: "What mattered most for your data donation decision?"', tag: 'QUAL' as HypothesisTag },
      { id: '18', step: 24, name: 'Debriefing', content: 'Thank you, simulation disclosure, contact info, email signup' },
    ];
  };

  // ========== LANDING VIEW ==========
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
                {getJourneySteps(debugState.condition).map((step) => {
                  const colors = step.tag ? TAG_COLORS[step.tag] : null;
                  return (
                    <button
                      key={step.id}
                      onClick={() => navigateToScreen(step.id)}
                      className={`w-full text-left p-3 rounded-lg transition group ${
                        step.highlight
                          ? 'bg-yellow-50 border-2 border-yellow-300 hover:border-yellow-400'
                          : colors
                            ? `${colors.bg} border-l-4 ${colors.border} hover:opacity-80`
                            : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          step.highlight
                            ? 'bg-yellow-400 text-yellow-900'
                            : colors
                              ? `${colors.bg} ${colors.text} border ${colors.border}`
                              : 'bg-gray-200 text-gray-600 group-hover:bg-green-500 group-hover:text-white'
                        }`}>
                          {step.step}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${step.highlight ? 'text-yellow-900' : colors ? colors.text : 'text-gray-900'}`}>
                              {step.name}
                            </p>
                            {step.tag && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${colors?.bg} ${colors?.text}`}>
                                {step.tag}
                              </span>
                            )}
                          </div>
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
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></span>
                  Varies by condition
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-orange-100 border-l-2 border-orange-400 rounded-r"></span>
                  COV: Covariate
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-100 border-l-2 border-blue-500 rounded-r"></span>
                  MC-T: Transparency (H1)
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-100 border-l-2 border-green-500 rounded-r"></span>
                  MC-C: Control (H2)
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-100 border-l-2 border-yellow-500 rounded-r"></span>
                  OUT: Risk/Trust (H3)
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
                    ?debug=survey&screen=7&condition=D
                  </code>
                </div>
                <LanguageSelector />
              </div>

              {/* Step 3 Documentation */}
              <Step3Documentation
                isOpen={showDocumentation}
                onToggle={() => setShowDocumentation(!showDocumentation)}
              />

              {/* Condition Matrix */}
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

              {/* Full Journey Views */}
              <div className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
                <h2 className="text-lg font-bold text-purple-900 mb-4">Full Journey Views</h2>
                <p className="text-sm text-purple-700 mb-4">
                  View the complete user flow with all questions displayed for each condition.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map(cond => {
                    const condInfo = {
                      A: { name: 'Baseline', desc: 'No DNL, No Dashboard', color: 'bg-gray-100 hover:bg-gray-200 border-gray-300' },
                      B: { name: 'Transparency', desc: 'DNL only', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
                      C: { name: 'Control', desc: 'Dashboard only', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
                      D: { name: 'Full', desc: 'DNL + Dashboard', color: 'bg-purple-100 hover:bg-purple-200 border-purple-300' },
                    };
                    const info = condInfo[cond];
                    return (
                      <button
                        key={cond}
                        onClick={() => navigateToScreen(`journey-${cond}`)}
                        className={`p-4 rounded-lg border-2 ${info.color} transition text-left`}
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1">{cond}</div>
                        <div className="text-sm font-medium text-gray-700">{info.name}</div>
                        <div className="text-xs text-gray-500">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Screens Grid */}
              {stageOrder.map(stage => (
                <div key={stage} className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    {stageLabels[stage]}
                    {stage === 'survey' && (
                      <span className="text-xs font-normal text-gray-500 ml-2">(hypothesis-driven)</span>
                    )}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {groupedScreens[stage]?.map(screen => {
                      const colors = screen.tag ? TAG_COLORS[screen.tag] : null;
                      return (
                        <button
                          key={screen.id}
                          onClick={() => navigateToScreen(screen.id)}
                          className={`p-4 border rounded-lg hover:shadow-md transition text-left group ${
                            screen.conditionDependent
                              ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                              : colors
                                ? `${colors.bg} border-l-4 ${colors.border} border-gray-200`
                                : 'bg-white border-gray-200 hover:border-green-500'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`text-2xl font-bold transition ${
                              screen.conditionDependent
                                ? 'text-yellow-400 group-hover:text-yellow-600'
                                : colors
                                  ? colors.text
                                  : 'text-gray-300 group-hover:text-green-500'
                            }`}>
                              {screen.id}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p className="font-medium text-gray-900 text-sm">{screen.name}</p>
                                {screen.tag && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${colors?.bg} ${colors?.text}`}>
                                    {screen.tag}
                                  </span>
                                )}
                              </div>
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
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Instructions */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How to use</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Full Journey Views:</strong> Click A/B/C/D buttons to see complete flow with all questions for that condition</li>
                  <li>• <strong>Left panel:</strong> Quick journey overview for selected condition</li>
                  <li>• <strong>Right panel:</strong> Click any screen to preview it individually</li>
                  <li>• <strong>Tags:</strong> MC-T (blue) = H1, MC-C (green) = H2, OUT (yellow) = H3</li>
                  <li>• Switch conditions (A/B/C/D) to see different journey descriptions</li>
                  <li>• Yellow items are condition-dependent (only Donation Modal differs)</li>
                  <li>• Deep-link to journey: <code className="bg-blue-100 px-1 rounded">?debug=survey&screen=journey-D</code></li>
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
