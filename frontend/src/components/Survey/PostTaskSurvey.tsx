/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE SURVEY QUESTION LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UNIVERSAL QUESTIONS (All Conditions A/B/C/D):

Q1. I trust the Apertus model (Likert 1-7: Strongly disagree → Strongly agree)
Q2. I trust that my data would be handled responsibly (Likert 1-7: Strongly disagree → Strongly agree)
Q3. The information provided about data donation was clear (Likert 1-7: Strongly disagree → Strongly agree)
Q4. I had enough information to make an informed decision (Likert 1-7: Strongly disagree → Strongly agree)
Q5. This chatbot helps users with questions about: (Dropdown)
    Options:
    - Swiss ballot initiatives ✓ CORRECT
    - Swiss tax regulations
    - Swiss immigration law
    - I don't remember

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONDITIONAL: TRANSPARENCY (Only Conditions B & D - saw Data Nutrition Label):

Q6. I understood where the Apertus model has been developed (Likert 1-7)
Q7. I know what data the Apertus model was trained on (Likert 1-7)
Q8. The transparency information about the model was helpful (Likert 1-7)
Q9. I understood the privacy protections in place (Likert 1-7)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONDITIONAL: CONTROL (Only Conditions C & D - saw Granular Dashboard):

Q10. I had control over what happens to my data (Likert 1-7)
Q11. I could choose how my data would be used (Likert 1-7)
Q12. I had meaningful options for data donation (Likert 1-7)
Q13. The privacy settings gave me the flexibility I wanted (Likert 1-7)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIVACY PREFERENCES (All Conditions):

Q14. When thinking about the exact questions you type into the chatbot, which statement
     comes closest to your view? (Dropdown)
     Options:
     - Only general summaries should be used (e.g., "100 people asked about taxes"),
       not my exact questions
     - My exact questions can be used, as long as they are made fully anonymous and
       cannot be traced back to me
     - My exact questions can be used without any special privacy protection
     - Not sure

Q15. Who should be allowed to use your anonymized data for training? (Dropdown)
     Sub-instruction: Please select the most permissive option you are comfortable with.
     Options:
     - No one should be allowed to use my anonymized data
     - ONLY the Swiss non-profit association that develops the chatbot
     - The Swiss non-profit association AND Swiss public researchers (e.g., EPFL/ETH)
     - Any academic or non-profit researcher (Swiss or international)
     - Anyone (including commercial use)
     - Not sure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[TRANSITION PAGE: "Almost done! Finally, just a few questions about yourself..."]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEMOGRAPHICS (All Conditions):

Q16. What is your age? (Dropdown)
     Options: 18-24, 25-34, 35-44, 45-54, 55-64, 65+, Prefer not to say

Q17. What is your gender? (Dropdown)
     Options: Female, Male, Non-binary, Other, Prefer not to say

Q18. What is your primary language? (Dropdown)
     Options: English, French, German / Swiss German, Italian, Romansh, Other

Q19. What is your highest level of education? (Dropdown)
     Options: Mandatory schooling, Matura / Baccalaureate, Vocational training (Berufslehre),
     Higher vocational education, University of Applied Sciences,
     University (Bachelor/Master/PhD), Prefer not to say

Q20. Are you eligible to vote in Swiss federal elections? (Dropdown)
     Options: Yes, No, Prefer not to say

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTIONAL QUESTIONS (All Conditions):

Q21. How important is it to you that the Apertus model is hosted on Swiss servers? (Optional)
     (Likert 1-7: Not at all important → Extremely important)

Q22. Additional comments (Text area, OPTIONAL)
     Placeholder: "Share any additional thoughts or feedback..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL QUESTIONS BY CONDITION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Condition A (Baseline - No DNL, No Dashboard):
  - 5 Universal + 2 Privacy + 5 Demographics + 2 Optional = 14 required questions + 2 optional

Condition B (Transparency Only - DNL, No Dashboard):
  - 5 Universal + 4 Transparency + 2 Privacy + 5 Demographics + 2 Optional = 18 required + 2 optional

Condition C (Control Only - No DNL, Dashboard):
  - 5 Universal + 4 Control + 2 Privacy + 5 Demographics + 2 Optional = 18 required + 2 optional

Condition D (Both - DNL + Dashboard):
  - 5 Universal + 4 Transparency + 4 Control + 2 Privacy + 5 Demographics + 2 Optional = 22 required + 2 optional

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL DESIGN PRINCIPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. RESEARCH VALIDITY: Only ask about features participants actually saw
   - Transparency questions (Q6-Q9) → ONLY conditions B & D (who saw DNL)
   - Control questions (Q10-Q13) → ONLY conditions C & D (who saw Dashboard)

2. TERMINOLOGY CONSISTENCY:
   - "Swiss ballot initiatives" (not "voting initiatives and referendums")
   - "Apertus model" (not just "Apertus")
   - "Transparency information about the model" (not "Data Nutrition Label" - users don't know this term!)

3. TENSE ACCURACY:
   - Present perfect: "has been developed" (Q6)
   - Present: "I know" (Q7), "is it" (Q21)
   - Past: "was trained on" (Q7)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { SurveyData } from '../../types';

interface Props {
  participantId: string;
  condition: 'A' | 'B' | 'C' | 'D';
  onComplete: () => void;
}

const PostTaskSurvey: React.FC<Props> = ({ participantId, condition, onComplete }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Determine which sections to show based on condition
  const sawTransparencyInfo = condition === 'B' || condition === 'D';
  const hadControlOptions = condition === 'C' || condition === 'D';

  // All survey answers
  const [answers, setAnswers] = useState<Partial<SurveyData>>({
    trust1: null,
    trust2: null,
    infoQuality1: null,
    infoQuality2: null,
    attentionCheck: null,
    transparency1: null,
    transparency2: null,
    transparency3: null,
    transparency4: null,
    control1: null,
    control2: null,
    control3: null,
    control4: null,
    dataScopeUnderstanding: null,
    dataPurposePreference: null,
    age: null,
    gender: null,
    primaryLanguage: null,
    education: null,
    votingEligibility: null,
    swissServerImportance: null,
    comments: ''
  });

  // Build dynamic page structure based on condition
  const pageStructure = useMemo(() => {
    const pages: Array<{ questionNum: number; type: string; field?: keyof SurveyData }> = [];
    let questionNum = 1;

    // Section 1: Universal questions
    pages.push({ questionNum: questionNum++, type: 'trust1', field: 'trust1' });
    pages.push({ questionNum: questionNum++, type: 'trust2', field: 'trust2' });
    pages.push({ questionNum: questionNum++, type: 'infoQuality1', field: 'infoQuality1' });
    pages.push({ questionNum: questionNum++, type: 'infoQuality2', field: 'infoQuality2' });
    pages.push({ questionNum: questionNum++, type: 'attentionCheck', field: 'attentionCheck' });

    // Section 2: Transparency (conditional - B & D only)
    if (sawTransparencyInfo) {
      pages.push({ questionNum: questionNum++, type: 'transparency1', field: 'transparency1' });
      pages.push({ questionNum: questionNum++, type: 'transparency2', field: 'transparency2' });
      pages.push({ questionNum: questionNum++, type: 'transparency3', field: 'transparency3' });
      pages.push({ questionNum: questionNum++, type: 'transparency4', field: 'transparency4' });
    }

    // Section 3: Control (conditional - C & D only)
    if (hadControlOptions) {
      pages.push({ questionNum: questionNum++, type: 'control1', field: 'control1' });
      pages.push({ questionNum: questionNum++, type: 'control2', field: 'control2' });
      pages.push({ questionNum: questionNum++, type: 'control3', field: 'control3' });
      pages.push({ questionNum: questionNum++, type: 'control4', field: 'control4' });
    }

    // Section 4: Privacy understanding
    pages.push({ questionNum: questionNum++, type: 'dataScopeUnderstanding', field: 'dataScopeUnderstanding' });
    pages.push({ questionNum: questionNum++, type: 'dataPurposePreference', field: 'dataPurposePreference' });

    // Transition page
    pages.push({ questionNum: -1, type: 'transition' });

    // Section 5: Demographics
    pages.push({ questionNum: questionNum++, type: 'age', field: 'age' });
    pages.push({ questionNum: questionNum++, type: 'gender', field: 'gender' });
    pages.push({ questionNum: questionNum++, type: 'primaryLanguage', field: 'primaryLanguage' });
    pages.push({ questionNum: questionNum++, type: 'education', field: 'education' });
    pages.push({ questionNum: questionNum++, type: 'votingEligibility', field: 'votingEligibility' });

    // Section 6: Final optional questions
    pages.push({ questionNum: -1, type: 'final' });

    return pages;
  }, [sawTransparencyInfo, hadControlOptions]);

  const totalPages = pageStructure.length;

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canProceed()) {
        handleNext();
      } else if (e.key === 'Escape' && currentPage > 1 && pageStructure[currentPage - 1]?.type !== 'transition') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, answers]);

  const updateAnswer = (field: keyof SurveyData, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    const currentPageData = pageStructure[currentPage - 1];

    // Transition and final pages can always proceed
    if (currentPageData.type === 'transition' || currentPageData.type === 'final') {
      return true;
    }

    // Check if current question is answered
    const field = currentPageData.field;
    return field ? answers[field] !== null && answers[field] !== '' : false;
  };

  const handleNext = () => {
    if (canProceed() && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 1 && pageStructure[currentPage - 1]?.type !== 'transition') {
      setCurrentPage(prev => prev - 1);
    }
  };

  const isFormComplete = () => {
    // Universal required fields
    const universalComplete =
      answers.trust1 !== null &&
      answers.trust2 !== null &&
      answers.infoQuality1 !== null &&
      answers.infoQuality2 !== null &&
      answers.attentionCheck !== null && answers.attentionCheck !== '' &&
      answers.dataScopeUnderstanding !== null && answers.dataScopeUnderstanding !== '' &&
      answers.dataPurposePreference !== null && answers.dataPurposePreference !== '' &&
      answers.age !== null && answers.age !== '' &&
      answers.gender !== null && answers.gender !== '' &&
      answers.primaryLanguage !== null && answers.primaryLanguage !== '' &&
      answers.education !== null && answers.education !== '' &&
      answers.votingEligibility !== null && answers.votingEligibility !== '';

    // Conditional transparency fields (only for B & D)
    const transparencyComplete = !sawTransparencyInfo || (
      answers.transparency1 !== null &&
      answers.transparency2 !== null &&
      answers.transparency3 !== null &&
      answers.transparency4 !== null
    );

    // Conditional control fields (only for C & D)
    const controlComplete = !hadControlOptions || (
      answers.control1 !== null &&
      answers.control2 !== null &&
      answers.control3 !== null &&
      answers.control4 !== null
    );

    return universalComplete && transparencyComplete && controlComplete;
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
        trust1: answers.trust1!,
        trust2: answers.trust2!,
        infoQuality1: answers.infoQuality1!,
        infoQuality2: answers.infoQuality2!,
        attentionCheck: answers.attentionCheck!,
        transparency1: answers.transparency1 || null,
        transparency2: answers.transparency2 || null,
        transparency3: answers.transparency3 || null,
        transparency4: answers.transparency4 || null,
        control1: answers.control1 || null,
        control2: answers.control2 || null,
        control3: answers.control3 || null,
        control4: answers.control4 || null,
        dataScopeUnderstanding: answers.dataScopeUnderstanding!,
        dataPurposePreference: answers.dataPurposePreference!,
        age: answers.age!,
        gender: answers.gender!,
        primaryLanguage: answers.primaryLanguage!,
        education: answers.education!,
        votingEligibility: answers.votingEligibility!,
        swissServerImportance: answers.swissServerImportance || null,
        comments: answers.comments || ''
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

  const LikertQuestion = ({ questionNum, field, label }: { questionNum: number; field: keyof SurveyData; label: string }) => (
    <div className="text-center">
      <div className="mb-6 text-sm text-gray-500 font-medium">
        {t('survey.progress.question')} {questionNum}
      </div>
      <h2 className="text-2xl font-medium mb-8 text-gray-900 max-w-2xl mx-auto">{label}</h2>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <span className="text-sm text-gray-600 mr-2 text-right" style={{ minWidth: '140px' }}>
            {t('survey.likert.disagree')}
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => updateAnswer(field, num)}
              className={`w-14 h-14 rounded-full border-2 transition font-bold text-lg ${
                answers[field] === num
                  ? 'bg-[#DC143C] text-white border-[#DC143C] scale-110 shadow-lg'
                  : 'bg-white border-gray-300 hover:border-[#DC143C] hover:scale-105'
              }`}
            >
              {num}
            </button>
          ))}
          <span className="text-sm text-gray-600 ml-2" style={{ minWidth: '140px' }}>
            {t('survey.likert.agree')}
          </span>
        </div>
      </div>
    </div>
  );

  const LikertImportance = ({ questionNum, field, label }: { questionNum: number; field: keyof SurveyData; label: string }) => (
    <div className="text-center">
      <div className="mb-6 text-sm text-gray-500 font-medium">
        {t('survey.progress.question')} {questionNum}
      </div>
      <h2 className="text-2xl font-medium mb-8 text-gray-900 max-w-2xl mx-auto">{label}</h2>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <span className="text-sm text-gray-600 mr-2 text-right" style={{ minWidth: '140px' }}>
            {t('survey.likert.notImportant')}
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => updateAnswer(field, num)}
              className={`w-14 h-14 rounded-full border-2 transition font-bold text-lg ${
                answers[field] === num
                  ? 'bg-[#DC143C] text-white border-[#DC143C] scale-110 shadow-lg'
                  : 'bg-white border-gray-300 hover:border-[#DC143C] hover:scale-105'
              }`}
            >
              {num}
            </button>
          ))}
          <span className="text-sm text-gray-600 ml-2" style={{ minWidth: '140px' }}>
            {t('survey.likert.veryImportant')}
          </span>
        </div>
      </div>
    </div>
  );

  const DropdownQuestion = ({ questionNum, field, label, options, subInstruction }: {
    questionNum: number;
    field: keyof SurveyData;
    label: string;
    options: { value: string; label: string }[];
    subInstruction?: string;
  }) => (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-6 text-sm text-gray-500 font-medium">
        {t('survey.progress.question')} {questionNum}
      </div>
      <h2 className="text-2xl font-medium mb-4 text-gray-900">{label}</h2>
      {subInstruction && (
        <p className="text-sm text-gray-600 mb-6 italic">{subInstruction}</p>
      )}
      <select
        value={answers[field] as string || ''}
        onChange={(e) => updateAnswer(field, e.target.value)}
        className="w-full max-w-md p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] bg-white mx-auto block"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const TransitionPage = () => (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-6">🙏🏻</div>
      <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('survey.transition.title')}</h2>
      <p className="text-xl text-gray-600">{t('survey.transition.message')}</p>
    </div>
  );

  const FinalPage = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-900">{t('survey.section.finalQuestion')}</h2>
      </div>

      {/* Swiss Server Importance */}
      <div className="mb-8 p-6 bg-white rounded-lg border-2 border-gray-200">
        <label className="block text-lg font-medium mb-4 text-gray-900 text-center">
          {t('survey.optional.swissServer')} <span className="text-gray-500 text-sm">({t('survey.optional.optional')})</span>
        </label>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <span className="text-xs text-gray-600 mr-2 text-right" style={{ minWidth: '120px' }}>
            {t('survey.likert.notImportant')}
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => updateAnswer('swissServerImportance', num)}
              className={`w-12 h-12 rounded-full border-2 transition font-semibold ${
                answers.swissServerImportance === num
                  ? 'bg-[#DC143C] text-white border-[#DC143C] scale-110'
                  : 'bg-white border-gray-300 hover:border-[#DC143C] hover:scale-105'
              }`}
            >
              {num}
            </button>
          ))}
          <span className="text-xs text-gray-600 ml-2" style={{ minWidth: '120px' }}>
            {t('survey.likert.veryImportant')}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div className="p-6 bg-white rounded-lg border-2 border-gray-200">
        <label className="block text-lg font-medium mb-4 text-gray-900">
          {t('survey.optional.comments')} <span className="text-gray-500 text-sm">({t('survey.optional.optional')})</span>
        </label>
        <textarea
          value={answers.comments || ''}
          onChange={(e) => updateAnswer('comments', e.target.value)}
          rows={4}
          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
          placeholder={t('survey.optional.commentsPlaceholder')}
        />
      </div>
    </div>
  );

  const renderPage = () => {
    const currentPageData = pageStructure[currentPage - 1];
    if (!currentPageData) return null;

    const { type, questionNum } = currentPageData;

    switch (type) {
      // Section 1: Universal questions
      case 'trust1':
        return <LikertQuestion questionNum={questionNum} field="trust1" label={t('survey.trust.q1')} />;
      case 'trust2':
        return <LikertQuestion questionNum={questionNum} field="trust2" label={t('survey.trust.q2')} />;
      case 'infoQuality1':
        return <LikertQuestion questionNum={questionNum} field="infoQuality1" label={t('survey.universal.infoQuality1')} />;
      case 'infoQuality2':
        return <LikertQuestion questionNum={questionNum} field="infoQuality2" label={t('survey.universal.infoQuality2')} />;
      case 'attentionCheck':
        return <DropdownQuestion
          questionNum={questionNum}
          field="attentionCheck"
          label={t('survey.universal.attentionCheck.question')}
          options={[
            { value: '', label: t('survey.universal.attentionCheck.placeholder') },
            { value: 'voting', label: t('survey.universal.attentionCheck.voting') },
            { value: 'tax', label: t('survey.universal.attentionCheck.tax') },
            { value: 'immigration', label: t('survey.universal.attentionCheck.immigration') },
            { value: 'dontremember', label: t('survey.universal.attentionCheck.dontremember') }
          ]}
        />;

      // Section 2: Transparency (conditional)
      case 'transparency1':
        return <LikertQuestion questionNum={questionNum} field="transparency1" label={t('survey.transparency.q1')} />;
      case 'transparency2':
        return <LikertQuestion questionNum={questionNum} field="transparency2" label={t('survey.transparency.q2')} />;
      case 'transparency3':
        return <LikertQuestion questionNum={questionNum} field="transparency3" label={t('survey.transparency.q3')} />;
      case 'transparency4':
        return <LikertQuestion questionNum={questionNum} field="transparency4" label={t('survey.transparency.q4')} />;

      // Section 3: Control (conditional)
      case 'control1':
        return <LikertQuestion questionNum={questionNum} field="control1" label={t('survey.control.q1')} />;
      case 'control2':
        return <LikertQuestion questionNum={questionNum} field="control2" label={t('survey.control.q2')} />;
      case 'control3':
        return <LikertQuestion questionNum={questionNum} field="control3" label={t('survey.control.q3')} />;
      case 'control4':
        return <LikertQuestion questionNum={questionNum} field="control4" label={t('survey.control.q4')} />;

      // Section 4: Privacy understanding
      case 'dataScopeUnderstanding':
        return <DropdownQuestion
          questionNum={questionNum}
          field="dataScopeUnderstanding"
          label={t('survey.privacyUnderstanding.scope.question')}
          options={[
            { value: '', label: t('survey.privacyUnderstanding.scope.placeholder') },
            { value: 'summaries-only', label: t('survey.privacyUnderstanding.scope.summariesOnly') },
            { value: 'exact-anonymized', label: t('survey.privacyUnderstanding.scope.exactAnonymized') },
            { value: 'exact-no-protection', label: t('survey.privacyUnderstanding.scope.exactNoProtection') },
            { value: 'not-sure', label: t('survey.privacyUnderstanding.scope.notSure') }
          ]}
        />;

      case 'dataPurposePreference':
        return <DropdownQuestion
          questionNum={questionNum}
          field="dataPurposePreference"
          label={t('survey.privacyUnderstanding.purpose.question')}
          subInstruction={t('survey.privacyUnderstanding.purpose.subInstruction')}
          options={[
            { value: '', label: t('survey.privacyUnderstanding.purpose.placeholder') },
            { value: 'no-one', label: t('survey.privacyUnderstanding.purpose.noOne') },
            { value: 'swiss-nonprofit-only', label: t('survey.privacyUnderstanding.purpose.swissNonprofitOnly') },
            { value: 'swiss-nonprofit-and-researchers', label: t('survey.privacyUnderstanding.purpose.swissNonprofitAndResearchers') },
            { value: 'any-academic', label: t('survey.privacyUnderstanding.purpose.anyAcademic') },
            { value: 'anyone-commercial', label: t('survey.privacyUnderstanding.purpose.anyoneCommercial') },
            { value: 'not-sure', label: t('survey.privacyUnderstanding.purpose.notSure') }
          ]}
        />;

      // Transition
      case 'transition':
        return <TransitionPage />;

      // Section 5: Demographics
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

      case 'votingEligibility':
        return <DropdownQuestion
          questionNum={questionNum}
          field="votingEligibility"
          label={t('survey.demographics.voting.question')}
          options={[
            { value: '', label: t('survey.demographics.voting.placeholder') },
            { value: 'yes', label: t('survey.demographics.voting.yes') },
            { value: 'no', label: t('survey.demographics.voting.no') },
            { value: 'prefer-not-say', label: t('survey.demographics.preferNotSay') }
          ]}
        />;

      // Section 6: Final optional questions
      case 'final':
        return <FinalPage />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-8 md:p-12 my-8 shadow-lg">
        <div className="mb-12">
          {renderPage()}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            {validationError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between items-center mt-12">
          <button
            onClick={handleBack}
            disabled={currentPage === 1 || pageStructure[currentPage - 1]?.type === 'transition'}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              currentPage === 1 || pageStructure[currentPage - 1]?.type === 'transition'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
            }`}
          >
            ← {t('survey.navigation.back')}
          </button>

          {currentPage < totalPages ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-lg font-semibold transition ${
                canProceed()
                  ? 'bg-[#DC143C] text-white hover:bg-[#B01030]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('survey.navigation.next')} →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !isFormComplete()}
              className={`px-8 py-3 rounded-lg font-semibold transition ${
                submitting || !isFormComplete()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#DC143C] text-white hover:bg-[#B01030]'
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
