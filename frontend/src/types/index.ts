export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExperimentConfig {
  transparency: 'low' | 'high';
  control: 'low' | 'high';
  showDNL: boolean;
  showDashboard: boolean;
}

export interface Session {
  sessionId: string;
  participantId: string;
  condition: 'A' | 'B' | 'C' | 'D';
  config: ExperimentConfig;
}

export interface DonationConfig {
  scope?: 'topics-only' | 'questions-only' | 'full';
  purpose?: 'academic' | 'commercial';
  storage?: 'swiss' | 'swiss-or-eu' | 'no-preference';
  retention?: 'until-fulfilled' | '6months' | '1year' | 'indefinite';
}

/**
 * SurveyData - Hypothesis-Driven Structure
 *
 * This interface captures survey responses aligned with H1-H3:
 * - H1 (Transparency): DNL → ↑ donation (measured by perceived transparency)
 * - H2 (Control): Dashboard → ↑ donation (measured by perceived control)
 * - H3 (Interaction): Transparency × Control (mediated by risk perception)
 *
 * Constructs:
 * - MC-T: Manipulation Check for Transparency (Q3)
 * - MC-C: Manipulation Check for Control (Q4)
 * - OUT-RISK: Risk Perception outcome (Q5)
 * - OUT-TRUST: Trust outcome (Q6)
 * - QUAL: Qualitative feedback (Q12)
 */
export interface SurveyData {
  // ============================================
  // Q3: Perceived Transparency (MC-T) - H1 manipulation check
  // Expected: Higher in conditions B & D (with DNL)
  // Scale: 1-6 (Strongly disagree → Strongly agree)
  // ============================================
  transparency1: number | null;  // "The information about how my anonymized chat questions may be used was clear."
  transparency2: number | null;  // "I understood what would happen to my anonymized chat questions if I agreed to share them."

  // ============================================
  // Q4: Perceived User Control (MC-C) - H2 manipulation check
  // Expected: Higher in conditions C & D (with Dashboard)
  // Scale: 1-6 (Strongly disagree → Strongly agree)
  // ============================================
  control1: number | null;  // "I felt I had control over how my anonymized chat questions could be used."
  control2: number | null;  // "I felt I had meaningful choices about sharing my anonymized chat questions."

  // ============================================
  // Q5: Risk Perception (OUT-RISK) - H3 interaction mechanism
  // Expected: Lowest in D (high transparency reduces risk), highest in A
  // Scale: 1-6 (Strongly disagree → Strongly agree)
  // ============================================
  riskTraceability: number | null;  // "Even if anonymized, my chat questions could be traced back to me."
  riskMisuse: number | null;        // "My anonymized chat questions could be used in ways I would not agree with."

  // ============================================
  // Q6: Trust (OUT-TRUST) - Supporting construct for interpretation
  // Scale: 1-6 (Strongly disagree → Strongly agree)
  // ============================================
  trust1: number | null;  // "I trust the system behind this chatbot to handle anonymized questions responsibly."

  // ============================================
  // Q7: Chatbot Question
  // ============================================
  attentionCheck: string | null;  // voting/tax/immigration/dontremember

  // ============================================
  // Q8-Q12: Demographics
  // ============================================
  age: string | null;
  gender: string | null;
  genderOther: string;  // For "Other" option
  primaryLanguage: string | null;
  education: string | null;
  eligibleToVoteCh: string | null;  // "Are you eligible to vote in Swiss federal elections?" (eligible/not-eligible/not-sure)

  // ============================================
  // Q13: Open Feedback (QUAL) - Qualitative insight
  // ============================================
  openFeedback: string;
}
