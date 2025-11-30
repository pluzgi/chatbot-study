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
  // Q3: Clarity (4 items - always shown)
  clarity1: number | null;  // I understood where the Apertus chatbot was developed
  clarity2: number | null;  // I knew what information the chatbot was trained on
  clarity3: number | null;  // The privacy protections were clearly explained
  clarity4: number | null;  // I had enough information to make my decision

  // Q4: Control (4 items - always shown)
  control1: number | null;  // I had control over what happens to my questions
  control2: number | null;  // I could choose how my data would be used
  control3: number | null;  // I had real options for how to donate
  control4: number | null;  // The process gave me the flexibility I wanted

  // Q5: Risk Concerns (5 items - always shown)
  riskPrivacy: number | null;     // Privacy: My questions could be traced back to me
  riskMisuse: number | null;      // Misuse: Data used for things I don't agree with
  riskCompanies: number | null;   // Companies: Businesses profiting from my data
  riskTrust: number | null;       // Trust: Not knowing who's behind this
  riskSecurity: number | null;    // Security: Data could be hacked or stolen

  // Q6: Agency (3 items - always shown)
  agency1: number | null;  // I felt in control of my data in this situation
  agency2: number | null;  // My choices actually mattered for my data
  agency3: number | null;  // I felt empowered to decide what's right for me

  // Q7: Trust (2 items - always shown)
  trust1: number | null;  // I trust the Apertus chatbot
  trust2: number | null;  // I trust my data would be handled responsibly

  // Q8: Acceptable Use (checkboxes - always shown)
  acceptableUseNonprofit: boolean;     // The Swiss non-profit organization
  acceptableUseSwissUni: boolean;      // Swiss university researchers
  acceptableUseIntlUni: boolean;       // International university researchers
  acceptableUseSwissCompany: boolean;  // Swiss companies
  acceptableUseIntlCompany: boolean;   // International companies
  acceptableUseNone: boolean;          // None of these

  // Q9: Attention Check (single choice - always shown)
  attentionCheck: string | null;  // voting/tax/immigration/news/dontremember

  // Q10-Q13: Demographics (always shown)
  age: string | null;
  gender: string | null;
  genderOther: string;  // For "Other" option
  primaryLanguage: string | null;
  education: string | null;

  // Q14: Open Feedback (optional)
  openFeedback: string;
}
