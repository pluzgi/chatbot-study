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
  scope?: 'full' | 'topics';
  purpose?: 'academic' | 'commercial';
  storage?: 'swiss' | 'eu' | 'no-preference';
  retention?: '1month' | '3months' | '6months' | '1year' | 'indefinite';
}

export interface SurveyData {
  // Section 1: Universal questions - Trust (2 items)
  trust1: number | null;
  trust2: number | null;

  // General information quality (2 items)
  infoQuality1: number | null;
  infoQuality2: number | null;

  // Attention check (1 item)
  attentionCheck: string | null;

  // Section 2: Transparency manipulation check (4 items - CONDITIONAL: B & D only)
  transparency1: number | null;
  transparency2: number | null;
  transparency3: number | null;
  transparency4: number | null;

  // Section 3: Control manipulation check (4 items - CONDITIONAL: C & D only)
  control1: number | null;
  control2: number | null;
  control3: number | null;
  control4: number | null;

  // Section 4: Privacy understanding (2 dropdowns)
  dataScopeUnderstanding: string | null;
  dataPurposePreference: string | null;

  // Section 5: Demographics (5 dropdowns)
  age: string | null;
  gender: string | null;
  primaryLanguage: string | null;
  education: string | null;
  votingEligibility: string | null;

  // Section 6: Final questions (optional)
  swissServerImportance: number | null;
  comments: string;
}
