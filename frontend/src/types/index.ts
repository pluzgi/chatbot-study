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
  // Manipulation check - Transparency (4 items)
  transparency1: number | null;
  transparency2: number | null;
  transparency3: number | null;
  transparency4: number | null;

  // Manipulation check - Control (4 items)
  control1: number | null;
  control2: number | null;
  control3: number | null;
  control4: number | null;

  // Trust (2 items)
  trust1: number | null;
  trust2: number | null;

  // Attention check
  attentionCheck: string | null;

  // Demographics
  age: string | null;
  gender: string | null;
  education: string | null;
  votingEligibility: string | null;

  // Optional
  swissServerImportance: number | null;
  comments: string;
}
