// Persona Types
export interface Persona {
  id: string;
  name: string;
  cluster: 'A' | 'B' | 'C' | 'D';
  description: string;
  demographics: Demographics;
  behavioralDrivers: BehavioralDrivers;
  interactionStyle: InteractionStyle;
}

export interface Demographics {
  age: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  education: 'mandatory' | 'apprenticeship' | 'matura' | 'bachelor' | 'master' | 'doctorate';
  language: 'de' | 'fr' | 'it' | 'rm';
  eligibleToVote: boolean;
}

export interface BehavioralDrivers {
  privacy_concern: number;           // 1-7
  institutional_trust: number;       // 1-7
  data_sovereignty_salience: number; // 1-7
  civic_motivation: number;          // 1-7
  cognitive_load_sensitivity: number;// 1-7
  ai_literacy: number;               // 1-7
  ballot_familiarity: number;        // 1-7
}

export interface InteractionStyle {
  questionCount: 2 | 3;
  topics: string[];
  tone: 'formal' | 'casual' | 'skeptical' | 'curious';
}

// Donation Configuration (for conditions C and D)
export interface DonationConfig {
  scope: 'topics-only' | 'questions-only' | 'full';
  purpose: 'academic' | 'commercial';
  storage: 'swiss' | 'swiss-or-eu' | 'no-preference';
  retention: '6months' | '1year' | 'indefinite' | 'until-fulfilled';
}

// Post-Task Survey Measures
export interface PostTaskMeasures {
  // Perceived Transparency (MC-T)
  transparency1: number;
  transparency2: number;

  // Perceived Control (MC-C)
  control1: number;
  control2: number;

  // Risk Perception (OUT-RISK)
  riskTraceability: number;
  riskMisuse: number;

  // Trust (OUT-TRUST)
  trust1: number;

  // Attention check
  attentionCheck: string;

  // Demographics
  age: string;
  gender: string;
  genderOther?: string;
  primaryLanguage: string;
  education: string;
  eligibleToVoteCh: string;

  // Open feedback
  openFeedback: string;
}

// API Response Types
export interface InitializeResponse {
  participantId: string;
  sessionId: string;
  condition: 'A' | 'B' | 'C' | 'D';
  config: {
    showDNL: boolean;
    showDashboard: boolean;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Throttle Configuration
export interface ThrottleConfig {
  concurrency: number;
  requestsPerSecond: number;
  minDelayBetweenSteps: number;
  maxDelayBetweenSteps: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerCooldown: number;
}

// Logging Types
export interface ParticipantLog {
  runId: string;
  participantId: string | null;
  persona: string;
  condition: string | null;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  error: string | null;
  steps: StepLog[];
}

export interface StepLog {
  phase: 'initialize' | 'baseline' | 'chat' | 'donation' | 'post-measures';
  timestamp: string;
  duration: number;
  request: {
    endpoint: string;
    method: string;
    body: any;
  };
  response: {
    status: number;
    body: any;
  } | null;
  error: string | null;
}

export interface RunSummary {
  runId: string;
  total: number;
  completed: number;
  failed: number;
  duration: number;
  byCondition: Record<string, number>;
  byCluster: Record<string, number>;
}

// Persona File Structure
export interface PersonaFile {
  personas: Persona[];
  languageDistribution: Record<string, number>;
  clusterDistribution: Record<string, number>;
  eligibilityDistribution?: Record<string, number>;
}
