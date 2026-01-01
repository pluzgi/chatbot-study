import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { SurveyData } from '../../types';
import LikertScale from './LikertScale';

/**
 * PostTaskSurvey - Hypothesis-Driven Survey Component
 *
 * This survey measures constructs aligned with H1-H3:
 * - Q3: Perceived Transparency (MC-T) - H1 manipulation check
 * - Q4: Perceived User Control (MC-C) - H2 manipulation check
 * - Q5: Risk Perception (OUT-RISK) - H3 interaction mechanism
 * - Q6: Trust (OUT-TRUST) - Supporting construct
 * - Q7: Attention Check
 * - Q8-Q11: Demographics
 * - Q12: Open Feedback (QUAL)
 * - Q13: Email (optional)
 *
 * Intentionally excluded:
 * - Agency items (redundant with control)
 * - Acceptable use checkboxes (exploratory, not needed for H1-H3)
 * - Model origin items (measures institutional trust, not procedural transparency)
 */

interface Props {
  participantId: string;
  condition: 'A' | 'B' | 'C' | 'D';
  onComplete: () => void;
}

const PostTaskSurvey: React.FC<Props> = ({ participantId, onComplete }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // All survey answers - aligned with hypothesis-driven structure
  const [answers, setAnswers] = useState<Partial<SurveyData>>({
    // Q3: Perceived Transparency (MC-T) - 2 items
    transparency1: null,
    transparency2: null,
    // Q4: Perceived User Control (MC-C) - 2 items
    control1: null,
    control2: null,
    // Q5: Risk Perception (OUT-RISK) - 2 items
    riskTraceability: null,
    riskMisuse: null,
    // Q6: Trust (OUT-TRUST) - 1 item
    trust1: null,
    // Q7: Attention Check
    attentionCheck: null,
    // Q8-Q12: Demographics
    age: null,
    gender: null,
    genderOther: '',
    primaryLanguage: null,
    education: null,
    eligibleToVoteCh: null,
    // Q13: Open Feedback (QUAL)
    openFeedback: ''
  });

  // Build dynamic page structure
  const pageStructure = useMemo(() => {
    const pages: Array<{ questionNum: number; type: string; field?: keyof SurveyData }> = [];
    let questionNum = 3; // Starting from Q3 (after baseline Q1-Q2)

    // Q3: Perceived Transparency (MC-T) - 2 items
    pages.push({ questionNum, type: 'transparency-section', field: undefined });
    questionNum++;

    // Q4: Perceived User Control (MC-C) - 2 items
    pages.push({ questionNum, type: 'control-section', field: undefined });
    questionNum++;

    // Q5: Risk Perception (OUT-RISK) - 2 items
    pages.push({ questionNum, type: 'risk-section', field: undefined });
    questionNum++;

    // Q6: Trust (OUT-TRUST) - 2 items
    pages.push({ questionNum, type: 'trust-section', field: undefined });
    questionNum++;

    // Q7: Attention Check
    pages.push({ questionNum, type: 'attentionCheck', field: 'attentionCheck' });
    questionNum++;

    // Transition page (before demographics)
    pages.push({ questionNum: -1, type: 'transition', field: undefined });

    // Q8-Q12: Demographics
    pages.push({ questionNum, type: 'age', field: 'age' });
    questionNum++;
    pages.push({ questionNum, type: 'gender', field: 'gender' });
    questionNum++;
    pages.push({ questionNum, type: 'primaryLanguage', field: 'primaryLanguage' });
    questionNum++;
    pages.push({ questionNum, type: 'education', field: 'education' });
    questionNum++;
    pages.push({ questionNum, type: 'eligibleToVoteCh', field: 'eligibleToVoteCh' });
    questionNum++;

    // Q13: Open Feedback (QUAL) - this is the last page
    pages.push({ questionNum, type: 'openFeedback', field: 'openFeedback' });

    return pages;
  }, []);

  const totalPages = pageStructure.length;

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const updateAnswer = (field: keyof SurveyData, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = useCallback(() => {
    const currentPageData = pageStructure[currentPage - 1];
    if (!currentPageData) return false;

    // Transition page can always proceed
    if (currentPageData.type === 'transition') {
      return true;
    }

    // Open feedback is optional
    if (currentPageData.type === 'openFeedback') {
      return true;
    }

    // Check section-based validations
    switch (currentPageData.type) {
      case 'transparency-section':
        return answers.transparency1 !== null && answers.transparency2 !== null;
      case 'control-section':
        return answers.control1 !== null && answers.control2 !== null;
      case 'risk-section':
        return answers.riskTraceability !== null && answers.riskMisuse !== null;
      case 'trust-section':
        return answers.trust1 !== null;
      case 'attentionCheck':
      case 'age':
      case 'gender':
      case 'primaryLanguage':
      case 'education':
      case 'eligibleToVoteCh':
        const field = currentPageData.field;
        return field ? answers[field] !== null && answers[field] !== '' : false;
      default:
        return true;
    }
  }, [pageStructure, currentPage, answers]);

  const handleNext = useCallback(() => {
    if (canProceed() && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [canProceed, currentPage, totalPages]);

  const handleBack = useCallback(() => {
    if (currentPage > 1 && pageStructure[currentPage - 1]?.type !== 'transition') {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage, pageStructure]);

  // Keyboard navigation
  useEffect(() => {
    const currentPageData = pageStructure[currentPage - 1];
    // Don't add Enter key handler for text input pages
    if (currentPageData?.type === 'openFeedback') {
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'Enter' && canProceed()) {
        handleNext();
      } else if (e.key === 'Escape' && currentPage > 1 && pageStructure[currentPage - 1]?.type !== 'transition') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, pageStructure, handleNext, handleBack, canProceed]);

  const isFormComplete = () => {
    return (
      // Q3: Perceived Transparency
      answers.transparency1 !== null && answers.transparency2 !== null &&
      // Q4: Perceived User Control
      answers.control1 !== null && answers.control2 !== null &&
      // Q5: Risk Perception
      answers.riskTraceability !== null && answers.riskMisuse !== null &&
      // Q6: Trust
      answers.trust1 !== null &&
      // Q7: Attention Check
      answers.attentionCheck !== null && answers.attentionCheck !== '' &&
      // Q8-Q12: Demographics
      answers.age !== null && answers.age !== '' &&
      answers.gender !== null && answers.gender !== '' &&
      answers.primaryLanguage !== null && answers.primaryLanguage !== '' &&
      answers.education !== null && answers.education !== '' &&
      answers.eligibleToVoteCh !== null && answers.eligibleToVoteCh !== ''
      // Q13: Open Feedback is optional
      // Q14: Email is optional
    );
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      setValidationError(t('survey.validationError'));
      return;
    }

    setValidationError(null);
    setSubmitting(true);

    try {
      const surveyData: SurveyData = {
        transparency1: answers.transparency1!,
        transparency2: answers.transparency2!,
        control1: answers.control1!,
        control2: answers.control2!,
        riskTraceability: answers.riskTraceability!,
        riskMisuse: answers.riskMisuse!,
        trust1: answers.trust1!,
        attentionCheck: answers.attentionCheck!,
        age: answers.age!,
        gender: answers.gender!,
        genderOther: answers.genderOther || '',
        primaryLanguage: answers.primaryLanguage!,
        education: answers.education!,
        eligibleToVoteCh: answers.eligibleToVoteCh!,
        openFeedback: answers.openFeedback || ''
      };

      await api.submitSurvey(participantId, surveyData);
      onComplete();
    } catch (error) {
      console.error('Survey submission error:', error);
      setValidationError(t('survey.submissionError'));
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // REUSABLE COMPONENTS
  // ============================================

  // QuestionLabel removed - no visible question numbering per design requirements

  const LikertItem = ({ label, field, leftLabel, rightLabel }: {
    label: string;
    field: keyof SurveyData;
    leftLabel: string;
    rightLabel: string;
  }) => (
    <div className="py-6 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
      <p className="text-lg md:text-xl text-gray-900 font-medium mb-5 leading-relaxed">
        {label}
      </p>
      <LikertScale
        name={field}
        value={answers[field] as number | null}
        onChange={(value) => updateAnswer(field, value)}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        points={7}
        compact={true}
      />
    </div>
  );

  const QuestionBlock = ({ intro, children }: { intro: string; children: React.ReactNode }) => (
    <div>
      <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed font-semibold">
        {intro}
      </p>
      <div>
        {children}
      </div>
    </div>
  );

  // ============================================
  // SECTION COMPONENTS
  // ============================================

  // Q3: Perceived Transparency (MC-T) - H1 manipulation check
  const TransparencySection = () => (
    <div>
      <QuestionBlock intro={t('survey.transparency.intro')}>
        <LikertItem
          label={t('survey.transparency.q1')}
          field="transparency1"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.transparency.q2')}
          field="transparency2"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  // Q4: Perceived User Control (MC-C) - H2 manipulation check
  const ControlSection = () => (
    <div>
      <QuestionBlock intro={t('survey.control.intro')}>
        <LikertItem
          label={t('survey.control.q1')}
          field="control1"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.control.q2')}
          field="control2"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  // Q5: Risk Perception (OUT-RISK) - H3 interaction mechanism
  const RiskSection = () => (
    <div>
      <QuestionBlock intro={t('survey.risk.intro')}>
        <LikertItem
          label={t('survey.risk.traceability')}
          field="riskTraceability"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.risk.misuse')}
          field="riskMisuse"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  // Q6: Trust (OUT-TRUST) - Supporting construct (single item)
  const TrustSection = () => (
    <div>
      <LikertItem
        label={t('survey.trust.q1')}
        field="trust1"
        leftLabel={t('survey.likert.disagree')}
        rightLabel={t('survey.likert.agree')}
      />
    </div>
  );

  // Radio-style selection (single select with radio indicator)
  const RadioQuestion = ({ field, header, label, options, showOtherInput }: {
    field: keyof SurveyData;
    header?: string;
    label: string;
    options: { value: string; label: string }[];
    showOtherInput?: boolean;
  }) => (
    <div>
        {header && <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{header}</h2>}
        <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{label}</p>
        <div className="space-y-3">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAnswer(field, opt.value)}
              className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 min-h-[52px] ${
                answers[field] === opt.value
                  ? 'border-green-600 bg-green-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  answers[field] === opt.value
                    ? 'border-green-600'
                    : 'border-gray-300'
                }`}>
                  {answers[field] === opt.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  )}
                </div>
                <span className="text-base font-medium">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Gender "Other" text field */}
        {showOtherInput && field === 'gender' && answers.gender === 'other' && (
          <div className="mt-4">
            <input
              type="text"
              value={answers.genderOther || ''}
              onChange={(e) => updateAnswer('genderOther', e.target.value)}
              placeholder={t('survey.demographics.gender.otherPlaceholder')}
              className="w-full p-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 min-h-[52px]"
            />
          </div>
        )}
    </div>
  );

  const TransitionPage = () => (
    <div className="text-center py-8">
      <div className="text-5xl mb-6">🙏🏻</div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-900">{t('survey.transition.title')}</h2>
      <p className="text-lg text-gray-600 mb-8">{t('survey.transition.message')}</p>

      {/* Simulation Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-lg mx-auto">
        <p className="text-base text-blue-800 leading-relaxed">
          {t('survey.transition.reminder')}
        </p>
      </div>
    </div>
  );

  const renderPage = () => {
    const currentPageData = pageStructure[currentPage - 1];
    if (!currentPageData) return null;

    const { type } = currentPageData;

    switch (type) {
      case 'transparency-section':
        return <TransparencySection />;
      case 'control-section':
        return <ControlSection />;
      case 'risk-section':
        return <RiskSection />;
      case 'trust-section':
        return <TrustSection />;
      case 'attentionCheck':
        return <RadioQuestion
          field="attentionCheck"
          header={t('survey.chatbotQuestion.header')}
          label={t('survey.chatbotQuestion.question')}
          options={[
            { value: 'voting', label: t('survey.chatbotQuestion.voting') },
            { value: 'tax', label: t('survey.chatbotQuestion.tax') },
            { value: 'immigration', label: t('survey.chatbotQuestion.immigration') },
            { value: 'dontremember', label: t('survey.chatbotQuestion.dontremember') }
          ]}
        />;
      case 'transition':
        return <TransitionPage />;
      case 'age':
        return <RadioQuestion
          field="age"
          header={t('survey.demographics.header')}
          label={t('survey.demographics.age.question')}
          options={[
            { value: '18-24', label: t('survey.demographics.age.18-24') },
            { value: '25-34', label: t('survey.demographics.age.25-34') },
            { value: '35-44', label: t('survey.demographics.age.35-44') },
            { value: '45-54', label: t('survey.demographics.age.45-54') },
            { value: '55-64', label: t('survey.demographics.age.55-64') },
            { value: '65+', label: t('survey.demographics.age.65+') }
          ]}
        />;
      case 'gender':
        return <RadioQuestion
          field="gender"
          header={t('survey.demographics.header')}
          label={t('survey.demographics.gender.question')}
          options={[
            { value: 'female', label: t('survey.demographics.gender.female') },
            { value: 'male', label: t('survey.demographics.gender.male') },
            { value: 'non-binary', label: t('survey.demographics.gender.nonBinary') },
            { value: 'other', label: t('survey.demographics.gender.other') },
            { value: 'prefer-not-say', label: t('survey.demographics.preferNotSay') }
          ]}
          showOtherInput={true}
        />;
      case 'primaryLanguage':
        return <RadioQuestion
          field="primaryLanguage"
          header={t('survey.demographics.header')}
          label={t('survey.demographics.language.question')}
          options={[
            { value: 'german', label: t('survey.demographics.language.german') },
            { value: 'french', label: t('survey.demographics.language.french') },
            { value: 'italian', label: t('survey.demographics.language.italian') },
            { value: 'english', label: t('survey.demographics.language.english') },
            { value: 'romansh', label: t('survey.demographics.language.romansh') },
            { value: 'other', label: t('survey.demographics.language.other') }
          ]}
        />;
      case 'education':
        return <RadioQuestion
          field="education"
          header={t('survey.demographics.header')}
          label={t('survey.demographics.education.question')}
          options={[
            { value: 'mandatory', label: t('survey.demographics.education.mandatory') },
            { value: 'matura', label: t('survey.demographics.education.matura') },
            { value: 'vocational', label: t('survey.demographics.education.vocational') },
            { value: 'higher-vocational', label: t('survey.demographics.education.higherVocational') },
            { value: 'applied-sciences', label: t('survey.demographics.education.appliedSciences') },
            { value: 'university', label: t('survey.demographics.education.university') },
            { value: 'prefer-not-say', label: t('survey.demographics.preferNotSay') }
          ]}
        />;
      case 'eligibleToVoteCh':
        return <RadioQuestion
          field="eligibleToVoteCh"
          header={t('survey.demographics.header')}
          label={t('survey.demographics.votingEligibility.question')}
          options={[
            { value: 'eligible', label: t('survey.demographics.votingEligibility.eligible') },
            { value: 'not-eligible', label: t('survey.demographics.votingEligibility.notEligible') },
            { value: 'not-sure', label: t('survey.demographics.votingEligibility.notSure') }
          ]}
        />;
      case 'openFeedback':
        return (
          <div>
            <p className="text-lg md:text-xl text-gray-900 font-medium mb-1 leading-relaxed">
              {t('survey.openFeedback.question')}
            </p>
            <p className="text-base text-gray-500 mb-4">
              {t('survey.openFeedback.note')}
            </p>
            <textarea
              value={answers.openFeedback || ''}
              onChange={(e) => updateAnswer('openFeedback', e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full p-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white resize-none"
              placeholder={t('survey.openFeedback.placeholder')}
            />
            <p className="text-sm text-gray-400 mt-2 text-right">
              {(answers.openFeedback || '').length}/500
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Check if we're on a Likert section page
  const isLikertPage = ['transparency-section', 'control-section', 'risk-section', 'trust-section'].includes(
    pageStructure[currentPage - 1]?.type || ''
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Step Headline - shown on first Likert page */}
        {(currentPage === 1 || isLikertPage) && (
          <div className="mb-6 text-left">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              <span className="text-gray-500 font-normal">Step 3 of 3 — </span>
              {t('survey.stepHeadline').replace('Step 3 of 3 — ', '')}
            </h1>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10">
          {renderPage()}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
            {validationError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse md:flex-row gap-3 justify-between items-stretch mt-6">
          {/* Back Button */}
          {currentPage > 1 && pageStructure[currentPage - 1]?.type !== 'transition' ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-base min-h-[48px] hover:bg-gray-50 transition"
            >
              ← {t('survey.navigation.back')}
            </button>
          ) : (
            <div></div>
          )}

          {/* Next/Submit Button */}
          {currentPage < totalPages ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-md font-medium text-base min-h-[48px] transition ${
                canProceed()
                  ? 'bg-gray-200 text-black hover:bg-green-600 hover:text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('survey.navigation.next')} →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !isFormComplete()}
              className={`px-8 py-3 rounded-md font-medium text-base min-h-[48px] transition ${
                submitting || !isFormComplete()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-black hover:bg-green-600 hover:text-white'
              }`}
            >
              {submitting ? t('survey.submitting') : <>{t('survey.navigation.next')} →</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostTaskSurvey;
