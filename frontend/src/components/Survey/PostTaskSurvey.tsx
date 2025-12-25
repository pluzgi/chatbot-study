import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { SurveyData } from '../../types';
import LikertScale from './LikertScale';

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

  // All survey answers
  const [answers, setAnswers] = useState<Partial<SurveyData>>({
    // Q3: Clarity (4 items)
    clarity1: null,
    clarity2: null,
    clarity3: null,
    clarity4: null,
    // Q4: Control (4 items)
    control1: null,
    control2: null,
    control3: null,
    control4: null,
    // Q5: Risk Concerns (5 items)
    riskPrivacy: null,
    riskMisuse: null,
    riskCompanies: null,
    riskTrust: null,
    riskSecurity: null,
    // Q6: Agency (3 items)
    agency1: null,
    agency2: null,
    agency3: null,
    // Q7: Trust (2 items)
    trust1: null,
    trust2: null,
    // Q8: Acceptable Use (checkboxes)
    acceptableUseImproveChatbot: false,
    acceptableUseAcademicResearch: false,
    acceptableUseCommercialProducts: false,
    acceptableUseNothing: false,
    // Q9: Attention Check
    attentionCheck: null,
    // Q10-Q13: Demographics
    age: null,
    gender: null,
    genderOther: '',
    primaryLanguage: null,
    education: null,
    // Q14: Open Feedback
    openFeedback: '',
    // Q15: Email Notification (optional)
    notifyEmail: ''
  });

  // Build dynamic page structure
  const pageStructure = useMemo(() => {
    const pages: Array<{ questionNum: number; type: string; field?: keyof SurveyData }> = [];
    let questionNum = 3; // Starting from Q3

    // Q3: Clarity (4 items)
    pages.push({ questionNum, type: 'clarity-section', field: undefined });
    questionNum++;

    // Q4: Control (4 items)
    pages.push({ questionNum, type: 'control-section', field: undefined });
    questionNum++;

    // Q5: Risk Concerns (5 items)
    pages.push({ questionNum, type: 'risk-section', field: undefined });
    questionNum++;

    // Q6: Agency (3 items)
    pages.push({ questionNum, type: 'agency-section', field: undefined });
    questionNum++;

    // Q7: Trust (2 items)
    pages.push({ questionNum, type: 'trust-section', field: undefined });
    questionNum++;

    // Q8: Acceptable Use (checkboxes)
    pages.push({ questionNum, type: 'acceptableUse', field: undefined });
    questionNum++;

    // Q9: Attention Check
    pages.push({ questionNum, type: 'attentionCheck', field: 'attentionCheck' });
    questionNum++;

    // Transition page
    pages.push({ questionNum: -1, type: 'transition', field: undefined });

    // Q10-Q13: Demographics
    pages.push({ questionNum, type: 'age', field: 'age' });
    questionNum++;
    pages.push({ questionNum, type: 'gender', field: 'gender' });
    questionNum++;
    pages.push({ questionNum, type: 'primaryLanguage', field: 'primaryLanguage' });
    questionNum++;
    pages.push({ questionNum, type: 'education', field: 'education' });
    questionNum++;

    // Q14: Open Feedback
    pages.push({ questionNum, type: 'openFeedback', field: 'openFeedback' });
    questionNum++;

    // Q15: Email Notification (optional)
    pages.push({ questionNum, type: 'notifyEmail', field: 'notifyEmail' });

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

    // Open feedback and email notification are optional, can always proceed
    if (currentPageData.type === 'openFeedback' || currentPageData.type === 'notifyEmail') {
      return true;
    }

    // Check section-based validations
    switch (currentPageData.type) {
      case 'clarity-section':
        return answers.clarity1 !== null && answers.clarity2 !== null &&
               answers.clarity3 !== null && answers.clarity4 !== null;
      case 'control-section':
        return answers.control1 !== null && answers.control2 !== null &&
               answers.control3 !== null && answers.control4 !== null;
      case 'risk-section':
        return answers.riskPrivacy !== null && answers.riskMisuse !== null &&
               answers.riskCompanies !== null && answers.riskTrust !== null &&
               answers.riskSecurity !== null;
      case 'agency-section':
        return answers.agency1 !== null && answers.agency2 !== null && answers.agency3 !== null;
      case 'trust-section':
        return answers.trust1 !== null && answers.trust2 !== null;
      case 'acceptableUse':
        // At least one checkbox must be selected
        return answers.acceptableUseImproveChatbot || answers.acceptableUseAcademicResearch ||
               answers.acceptableUseCommercialProducts || answers.acceptableUseNothing;
      case 'attentionCheck':
      case 'age':
      case 'gender':
      case 'primaryLanguage':
      case 'education':
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
    if (currentPageData?.type === 'openFeedback' || currentPageData?.type === 'notifyEmail') {
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not focused on an input element
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
      // Q3: Clarity
      answers.clarity1 !== null && answers.clarity2 !== null &&
      answers.clarity3 !== null && answers.clarity4 !== null &&
      // Q4: Control
      answers.control1 !== null && answers.control2 !== null &&
      answers.control3 !== null && answers.control4 !== null &&
      // Q5: Risk
      answers.riskPrivacy !== null && answers.riskMisuse !== null &&
      answers.riskCompanies !== null && answers.riskTrust !== null &&
      answers.riskSecurity !== null &&
      // Q6: Agency
      answers.agency1 !== null && answers.agency2 !== null && answers.agency3 !== null &&
      // Q7: Trust
      answers.trust1 !== null && answers.trust2 !== null &&
      // Q8: Acceptable Use (at least one)
      (answers.acceptableUseImproveChatbot || answers.acceptableUseAcademicResearch ||
       answers.acceptableUseCommercialProducts || answers.acceptableUseNothing) &&
      // Q9: Attention Check
      answers.attentionCheck !== null && answers.attentionCheck !== '' &&
      // Q10-Q13: Demographics
      answers.age !== null && answers.age !== '' &&
      answers.gender !== null && answers.gender !== '' &&
      answers.primaryLanguage !== null && answers.primaryLanguage !== '' &&
      answers.education !== null && answers.education !== ''
      // Q14: Open Feedback is optional
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
        clarity1: answers.clarity1!,
        clarity2: answers.clarity2!,
        clarity3: answers.clarity3!,
        clarity4: answers.clarity4!,
        control1: answers.control1!,
        control2: answers.control2!,
        control3: answers.control3!,
        control4: answers.control4!,
        riskPrivacy: answers.riskPrivacy!,
        riskMisuse: answers.riskMisuse!,
        riskCompanies: answers.riskCompanies!,
        riskTrust: answers.riskTrust!,
        riskSecurity: answers.riskSecurity!,
        agency1: answers.agency1!,
        agency2: answers.agency2!,
        agency3: answers.agency3!,
        trust1: answers.trust1!,
        trust2: answers.trust2!,
        acceptableUseImproveChatbot: answers.acceptableUseImproveChatbot!,
        acceptableUseAcademicResearch: answers.acceptableUseAcademicResearch!,
        acceptableUseCommercialProducts: answers.acceptableUseCommercialProducts!,
        acceptableUseNothing: answers.acceptableUseNothing!,
        attentionCheck: answers.attentionCheck!,
        age: answers.age!,
        gender: answers.gender!,
        genderOther: answers.genderOther || '',
        primaryLanguage: answers.primaryLanguage!,
        education: answers.education!,
        openFeedback: answers.openFeedback || '',
        notifyEmail: answers.notifyEmail || ''
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
  // REUSABLE COMPONENTS - IMPROVED READABILITY
  // ============================================

  // Simple question label - no percentage, just "Question X"
  const QuestionLabel = ({ questionNum }: { questionNum: number }) => (
    <div className="mb-6">
      <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">
        {t('survey.progress.question')} {questionNum}
      </span>
    </div>
  );

  // Likert item with improved readability
  // - Larger, bolder statement text
  // - More spacing between items
  const LikertItem = ({ label, field, leftLabel, rightLabel }: {
    label: string;
    field: keyof SurveyData;
    leftLabel: string;
    rightLabel: string;
  }) => (
    <div className="py-6 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
      {/* Statement - PRIMARY FOCUS: larger, medium weight, high contrast */}
      <p className="text-lg md:text-xl text-gray-900 font-medium mb-5 leading-relaxed">
        {label}
      </p>
      {/* Scale - secondary */}
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

  // Question block - clean white background, no nested grays
  const QuestionBlock = ({ intro, children }: { intro: string; children: React.ReactNode }) => (
    <div>
      {/* Block intro - SECONDARY: smaller, lighter, explains what to do */}
      <p className="text-base text-gray-500 mb-6 leading-relaxed">
        {intro}
      </p>
      {/* Likert items with clear separation */}
      <div>
        {children}
      </div>
    </div>
  );

  // ============================================
  // SECTION COMPONENTS
  // ============================================

  const ClaritySection = ({ questionNum }: { questionNum: number }) => (
    <div>
      <QuestionLabel questionNum={questionNum} />
      <QuestionBlock intro={t('survey.clarity.intro')}>
        <LikertItem
          label={t('survey.clarity.q1')}
          field="clarity1"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.clarity.q2')}
          field="clarity2"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.clarity.q3')}
          field="clarity3"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.clarity.q4')}
          field="clarity4"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  const ControlSection = ({ questionNum }: { questionNum: number }) => (
    <div>
      <QuestionLabel questionNum={questionNum} />
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
        <LikertItem
          label={t('survey.control.q3')}
          field="control3"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.control.q4')}
          field="control4"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  const RiskSection = ({ questionNum }: { questionNum: number }) => (
    <div>
      <QuestionLabel questionNum={questionNum} />
      <QuestionBlock intro={t('survey.risk.intro')}>
        <LikertItem
          label={t('survey.risk.privacy')}
          field="riskPrivacy"
          leftLabel={t('survey.likert.notConcerned')}
          rightLabel={t('survey.likert.extremelyConcerned')}
        />
        <LikertItem
          label={t('survey.risk.misuse')}
          field="riskMisuse"
          leftLabel={t('survey.likert.notConcerned')}
          rightLabel={t('survey.likert.extremelyConcerned')}
        />
        <LikertItem
          label={t('survey.risk.companies')}
          field="riskCompanies"
          leftLabel={t('survey.likert.notConcerned')}
          rightLabel={t('survey.likert.extremelyConcerned')}
        />
        <LikertItem
          label={t('survey.risk.trust')}
          field="riskTrust"
          leftLabel={t('survey.likert.notConcerned')}
          rightLabel={t('survey.likert.extremelyConcerned')}
        />
        <LikertItem
          label={t('survey.risk.security')}
          field="riskSecurity"
          leftLabel={t('survey.likert.notConcerned')}
          rightLabel={t('survey.likert.extremelyConcerned')}
        />
      </QuestionBlock>
    </div>
  );

  const AgencySection = ({ questionNum }: { questionNum: number }) => (
    <div>
      <QuestionLabel questionNum={questionNum} />
      <QuestionBlock intro={t('survey.agency.intro')}>
        <LikertItem
          label={t('survey.agency.q1')}
          field="agency1"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.agency.q2')}
          field="agency2"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.agency.q3')}
          field="agency3"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  const TrustSection = ({ questionNum }: { questionNum: number }) => (
    <div>
      <QuestionLabel questionNum={questionNum} />
      <QuestionBlock intro={t('survey.trust.intro')}>
        <LikertItem
          label={t('survey.trust.q1')}
          field="trust1"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
        <LikertItem
          label={t('survey.trust.q2')}
          field="trust2"
          leftLabel={t('survey.likert.disagree')}
          rightLabel={t('survey.likert.agree')}
        />
      </QuestionBlock>
    </div>
  );

  const AcceptableUsePage = ({ questionNum }: { questionNum: number }) => {
    const handleCheckboxChange = (field: keyof SurveyData, checked: boolean) => {
      // If "Nothing" is checked, uncheck all others
      if (field === 'acceptableUseNothing' && checked) {
        setAnswers(prev => ({
          ...prev,
          acceptableUseImproveChatbot: false,
          acceptableUseAcademicResearch: false,
          acceptableUseCommercialProducts: false,
          acceptableUseNothing: true
        }));
      }
      // If any other checkbox is checked, uncheck "Nothing"
      else if (field !== 'acceptableUseNothing' && checked) {
        setAnswers(prev => ({
          ...prev,
          [field]: checked,
          acceptableUseNothing: false
        }));
      }
      // Normal uncheck
      else {
        updateAnswer(field, checked);
      }
    };

    return (
      <div>
        <QuestionLabel questionNum={questionNum} />
        <div>
          <p className="text-lg md:text-xl text-gray-900 font-medium mb-2 leading-relaxed">
            {t('survey.acceptableUse.question')}
          </p>
          <p className="text-base text-gray-500 mb-6">
            {t('survey.acceptableUse.instruction')}
          </p>
          <div className="space-y-3">
            {[
              { field: 'acceptableUseImproveChatbot' as keyof SurveyData, label: t('survey.acceptableUse.improveChatbot') },
              { field: 'acceptableUseAcademicResearch' as keyof SurveyData, label: t('survey.acceptableUse.academicResearch') },
              { field: 'acceptableUseCommercialProducts' as keyof SurveyData, label: t('survey.acceptableUse.commercialProducts') },
              { field: 'acceptableUseNothing' as keyof SurveyData, label: t('survey.acceptableUse.nothing') }
            ].map(({ field, label }) => (
              <label
                key={field}
                className={`
                  flex items-center gap-4 p-4 border rounded-md cursor-pointer transition min-h-[52px]
                  focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-gray-400
                  ${answers[field]
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={answers[field] as boolean || false}
                  onChange={(e) => handleCheckboxChange(field, e.target.checked)}
                  className="w-5 h-5 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
                />
                <span className="text-base text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DropdownQuestion = ({ questionNum, field, label, options }: {
    questionNum: number;
    field: keyof SurveyData;
    label: string;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <QuestionLabel questionNum={questionNum} />
      <div>
        <p className="text-lg md:text-xl text-gray-900 font-medium mb-6 leading-relaxed">{label}</p>
        <select
          value={answers[field] as string || ''}
          onChange={(e) => updateAnswer(field, e.target.value)}
          className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white min-h-[52px]"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Gender "Other" text field */}
        {field === 'gender' && answers.gender === 'other' && (
          <div className="mt-4">
            <input
              type="text"
              value={answers.genderOther || ''}
              onChange={(e) => updateAnswer('genderOther', e.target.value)}
              placeholder={t('survey.demographics.gender.otherPlaceholder')}
              className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 min-h-[52px]"
            />
          </div>
        )}
      </div>
    </div>
  );

  const TransitionPage = () => (
    <div className="text-center py-8">
      <div className="text-5xl mb-6">🙏🏻</div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-900">{t('survey.transition.title')}</h2>
      <p className="text-lg text-gray-600 mb-8">{t('survey.transition.message')}</p>

      {/* Simulation Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-lg mx-auto">
        <p className="text-sm text-blue-800 leading-relaxed">
          {t('survey.transition.reminder')}
        </p>
      </div>
    </div>
  );

  const renderPage = () => {
    const currentPageData = pageStructure[currentPage - 1];
    if (!currentPageData) return null;

    const { type, questionNum } = currentPageData;

    switch (type) {
      case 'clarity-section':
        return <ClaritySection questionNum={questionNum} />;
      case 'control-section':
        return <ControlSection questionNum={questionNum} />;
      case 'risk-section':
        return <RiskSection questionNum={questionNum} />;
      case 'agency-section':
        return <AgencySection questionNum={questionNum} />;
      case 'trust-section':
        return <TrustSection questionNum={questionNum} />;
      case 'acceptableUse':
        return <AcceptableUsePage questionNum={questionNum} />;
      case 'attentionCheck':
        return <DropdownQuestion
          questionNum={questionNum}
          field="attentionCheck"
          label={t('survey.attentionCheck.question')}
          options={[
            { value: '', label: t('survey.attentionCheck.placeholder') },
            { value: 'voting', label: t('survey.attentionCheck.voting') },
            { value: 'tax', label: t('survey.attentionCheck.tax') },
            { value: 'immigration', label: t('survey.attentionCheck.immigration') },
            { value: 'news', label: t('survey.attentionCheck.news') },
            { value: 'dontremember', label: t('survey.attentionCheck.dontremember') }
          ]}
        />;
      case 'transition':
        return <TransitionPage />;
      case 'age':
        return <DropdownQuestion
          questionNum={questionNum}
          field="age"
          label={t('survey.demographics.age.question')}
          options={[
            { value: '', label: t('survey.demographics.age.placeholder') },
            { value: '18-24', label: t('survey.demographics.age.18-24') },
            { value: '25-34', label: t('survey.demographics.age.25-34') },
            { value: '35-44', label: t('survey.demographics.age.35-44') },
            { value: '45-54', label: t('survey.demographics.age.45-54') },
            { value: '55-64', label: t('survey.demographics.age.55-64') },
            { value: '65+', label: t('survey.demographics.age.65+') },
            { value: 'prefer-not-say', label: t('survey.demographics.preferNotSay') }
          ]}
        />;
      case 'gender':
        return <DropdownQuestion
          questionNum={questionNum}
          field="gender"
          label={t('survey.demographics.gender.question')}
          options={[
            { value: '', label: t('survey.demographics.gender.placeholder') },
            { value: 'female', label: t('survey.demographics.gender.female') },
            { value: 'male', label: t('survey.demographics.gender.male') },
            { value: 'non-binary', label: t('survey.demographics.gender.nonBinary') },
            { value: 'other', label: t('survey.demographics.gender.other') },
            { value: 'prefer-not-say', label: t('survey.demographics.preferNotSay') }
          ]}
        />;
      case 'primaryLanguage':
        return <DropdownQuestion
          questionNum={questionNum}
          field="primaryLanguage"
          label={t('survey.demographics.language.question')}
          options={[
            { value: '', label: t('survey.demographics.language.placeholder') },
            { value: 'english', label: t('survey.demographics.language.english') },
            { value: 'french', label: t('survey.demographics.language.french') },
            { value: 'german', label: t('survey.demographics.language.german') },
            { value: 'italian', label: t('survey.demographics.language.italian') },
            { value: 'romansh', label: t('survey.demographics.language.romansh') },
            { value: 'other', label: t('survey.demographics.language.other') }
          ]}
        />;
      case 'education':
        return <DropdownQuestion
          questionNum={questionNum}
          field="education"
          label={t('survey.demographics.education.question')}
          options={[
            { value: '', label: t('survey.demographics.education.placeholder') },
            { value: 'mandatory', label: t('survey.demographics.education.mandatory') },
            { value: 'matura', label: t('survey.demographics.education.matura') },
            { value: 'vocational', label: t('survey.demographics.education.vocational') },
            { value: 'higher-vocational', label: t('survey.demographics.education.higherVocational') },
            { value: 'applied-sciences', label: t('survey.demographics.education.appliedSciences') },
            { value: 'university', label: t('survey.demographics.education.university') },
            { value: 'prefer-not-say', label: t('survey.demographics.preferNotSay') }
          ]}
        />;
      case 'openFeedback':
        return (
          <div>
            <div className="mb-6">
              <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">
                {t('survey.progress.question')} {questionNum}
              </span>
            </div>
            <div>
              <p className="text-lg md:text-xl text-gray-900 font-medium mb-2 leading-relaxed">
                {t('survey.openFeedback.question')}
              </p>
              <p className="text-base text-gray-500 mb-6">
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
          </div>
        );
      case 'notifyEmail':
        return (
          <div>
            <div className="mb-6">
              <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">
                {t('survey.progress.question')} {questionNum}
              </span>
            </div>
            <div>
              <p className="text-lg md:text-xl text-gray-900 font-medium mb-2 leading-relaxed">
                {t('survey.notifyEmail.question')}
              </p>
              <p className="text-base text-gray-500 mb-6">
                {t('survey.notifyEmail.note')}
              </p>
              <input
                type="email"
                value={answers.notifyEmail || ''}
                onChange={(e) => updateAnswer('notifyEmail', e.target.value)}
                maxLength={255}
                className="w-full max-w-md p-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white min-h-[52px]"
                placeholder={t('survey.notifyEmail.placeholder')}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Check if we're on a Likert section page (for showing step headline)
  const isLikertPage = ['clarity-section', 'control-section', 'risk-section', 'agency-section', 'trust-section'].includes(
    pageStructure[currentPage - 1]?.type || ''
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Step Headline - Prominent, shown on Likert pages */}
        {(currentPage === 1 || isLikertPage) && (
          <div className="mb-6 text-left">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {t('survey.stepHeadline')}
            </h1>
          </div>
        )}

        {/* Main Content Card - Clean white, no nested grays */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10">
          {renderPage()}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
            {validationError}
          </div>
        )}

        {/* Navigation Buttons - Matching app button styles */}
        <div className="flex flex-col-reverse md:flex-row gap-3 justify-between items-stretch mt-6">
          {/* Back Button - ghost/outlined style */}
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

          {/* Next/Submit Button - filled neutral style */}
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
              {submitting ? t('survey.submitting') : t('survey.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostTaskSurvey;
