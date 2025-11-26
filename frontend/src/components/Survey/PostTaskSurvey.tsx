import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { SurveyData } from '../../types';

interface Props {
  participantId: string;
  onComplete: () => void;
}

const PostTaskSurvey: React.FC<Props> = ({ participantId, onComplete }) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Manipulation check - Transparency
  const [transparency1, setTransparency1] = useState<number | null>(null);
  const [transparency2, setTransparency2] = useState<number | null>(null);
  const [transparency3, setTransparency3] = useState<number | null>(null);
  const [transparency4, setTransparency4] = useState<number | null>(null);

  // Manipulation check - Control
  const [control1, setControl1] = useState<number | null>(null);
  const [control2, setControl2] = useState<number | null>(null);
  const [control3, setControl3] = useState<number | null>(null);
  const [control4, setControl4] = useState<number | null>(null);

  // Trust
  const [trust1, setTrust1] = useState<number | null>(null);
  const [trust2, setTrust2] = useState<number | null>(null);

  // Attention check
  const [attentionCheck, setAttentionCheck] = useState<string | null>(null);

  // Demographics
  const [age, setAge] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [education, setEducation] = useState<string | null>(null);
  const [votingEligibility, setVotingEligibility] = useState<string | null>(null);

  // Optional
  const [swissServerImportance, setSwissServerImportance] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  const isFormComplete = () => {
    return (
      transparency1 !== null &&
      transparency2 !== null &&
      transparency3 !== null &&
      transparency4 !== null &&
      control1 !== null &&
      control2 !== null &&
      control3 !== null &&
      control4 !== null &&
      trust1 !== null &&
      trust2 !== null &&
      attentionCheck !== null &&
      age !== null &&
      gender !== null &&
      education !== null &&
      votingEligibility !== null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormComplete()) {
      setValidationError(t('survey.validationError'));
      return;
    }

    setValidationError(null);
    setSubmitting(true);

    try {
      const surveyData: SurveyData = {
        transparency1,
        transparency2,
        transparency3,
        transparency4,
        control1,
        control2,
        control3,
        control4,
        trust1,
        trust2,
        attentionCheck,
        age,
        gender,
        education,
        votingEligibility,
        swissServerImportance,
        comments
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

  const LikertScale = ({
    value,
    onChange,
    label
  }: {
    value: number | null;
    onChange: (v: number) => void;
    label: string
  }) => (
    <div className="mb-6">
      <label className="block font-medium mb-3 text-gray-800">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 mr-2">{t('survey.likert.disagree')}</span>
        {[1, 2, 3, 4, 5, 6, 7].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-full border-2 transition ${
              value === num
                ? 'bg-[#DC143C] text-white border-[#DC143C]'
                : 'bg-white border-gray-300 hover:border-[#DC143C]'
            }`}
          >
            {num}
          </button>
        ))}
        <span className="text-xs text-gray-600 ml-2">{t('survey.likert.agree')}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-lg max-w-3xl w-full p-8 my-8">
        <h2 className="text-2xl font-bold mb-6">{t('survey.title')}</h2>

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: Manipulation Check - Transparency */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t('survey.section.transparency')}</h3>
            <LikertScale
              value={transparency1}
              onChange={setTransparency1}
              label={t('survey.transparency.q1')}
            />
            <LikertScale
              value={transparency2}
              onChange={setTransparency2}
              label={t('survey.transparency.q2')}
            />
            <LikertScale
              value={transparency3}
              onChange={setTransparency3}
              label={t('survey.transparency.q3')}
            />
            <LikertScale
              value={transparency4}
              onChange={setTransparency4}
              label={t('survey.transparency.q4')}
            />
          </div>

          {/* SECTION 2: Manipulation Check - Control */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t('survey.section.control')}</h3>
            <LikertScale
              value={control1}
              onChange={setControl1}
              label={t('survey.control.q1')}
            />
            <LikertScale
              value={control2}
              onChange={setControl2}
              label={t('survey.control.q2')}
            />
            <LikertScale
              value={control3}
              onChange={setControl3}
              label={t('survey.control.q3')}
            />
            <LikertScale
              value={control4}
              onChange={setControl4}
              label={t('survey.control.q4')}
            />
          </div>

          {/* SECTION 3: Trust */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t('survey.section.trust')}</h3>
            <LikertScale
              value={trust1}
              onChange={setTrust1}
              label={t('survey.trust.q1')}
            />
            <LikertScale
              value={trust2}
              onChange={setTrust2}
              label={t('survey.trust.q2')}
            />
          </div>

          {/* SECTION 4: Attention Check */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t('survey.section.attentionCheck')}</h3>
            <label className="block font-medium mb-3 text-gray-800">
              {t('survey.attentionCheck.question')}
            </label>
            <div className="space-y-2">
              {['switzerland', 'usa', 'china', 'dontknow'].map((option) => (
                <label key={option} className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                  <input
                    type="radio"
                    name="attentionCheck"
                    checked={attentionCheck === option}
                    onChange={() => setAttentionCheck(option)}
                    className="mr-3"
                  />
                  {t(`survey.attentionCheck.${option}`)}
                </label>
              ))}
            </div>
          </div>

          {/* SECTION 5: Demographics */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t('survey.section.demographics')}</h3>

            {/* Age */}
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-800">
                {t('survey.demographics.age.label')}
              </label>
              <select
                value={age || ''}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
              >
                <option value="" disabled>{t('survey.demographics.placeholder')}</option>
                <option value="18-24">{t('survey.demographics.age.18-24')}</option>
                <option value="25-34">{t('survey.demographics.age.25-34')}</option>
                <option value="35-44">{t('survey.demographics.age.35-44')}</option>
                <option value="45-54">{t('survey.demographics.age.45-54')}</option>
                <option value="55-64">{t('survey.demographics.age.55-64')}</option>
                <option value="65+">{t('survey.demographics.age.65+')}</option>
                <option value="prefer-not-say">{t('survey.demographics.preferNotSay')}</option>
              </select>
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-800">
                {t('survey.demographics.gender.label')}
              </label>
              <select
                value={gender || ''}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
              >
                <option value="" disabled>{t('survey.demographics.placeholder')}</option>
                <option value="female">{t('survey.demographics.gender.female')}</option>
                <option value="male">{t('survey.demographics.gender.male')}</option>
                <option value="non-binary">{t('survey.demographics.gender.nonBinary')}</option>
                <option value="other">{t('survey.demographics.gender.other')}</option>
                <option value="prefer-not-say">{t('survey.demographics.preferNotSay')}</option>
              </select>
            </div>

            {/* Education */}
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-800">
                {t('survey.demographics.education.label')}
              </label>
              <select
                value={education || ''}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
              >
                <option value="" disabled>{t('survey.demographics.placeholder')}</option>
                <option value="high-school">{t('survey.demographics.education.highSchool')}</option>
                <option value="vocational">{t('survey.demographics.education.vocational')}</option>
                <option value="bachelor">{t('survey.demographics.education.bachelor')}</option>
                <option value="master">{t('survey.demographics.education.master')}</option>
                <option value="doctorate">{t('survey.demographics.education.doctorate')}</option>
                <option value="prefer-not-say">{t('survey.demographics.preferNotSay')}</option>
              </select>
            </div>

            {/* Voting Eligibility */}
            <div className="mb-4">
              <label className="block font-medium mb-3 text-gray-800">
                {t('survey.demographics.voting.question')}
              </label>
              <div className="space-y-2">
                {['yes', 'no', 'prefer-not-say'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                    <input
                      type="radio"
                      name="votingEligibility"
                      checked={votingEligibility === option}
                      onChange={() => setVotingEligibility(option)}
                      className="mr-3"
                    />
                    {t(`survey.demographics.voting.${option}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 6: Optional Questions */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t('survey.section.optional')}</h3>

            {/* Swiss Server Importance */}
            <LikertScale
              value={swissServerImportance}
              onChange={setSwissServerImportance}
              label={t('survey.optional.swissServer')}
            />

            {/* Comments */}
            <div className="mb-4">
              <label className="block font-medium mb-2 text-gray-800">
                {t('survey.optional.comments')}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
                placeholder={t('survey.optional.commentsPlaceholder')}
              />
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {validationError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !isFormComplete()}
            className="w-full bg-[#DC143C] text-white py-3 rounded-lg font-semibold hover:bg-[#B01030] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {submitting ? t('survey.submitting') : t('survey.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostTaskSurvey;
