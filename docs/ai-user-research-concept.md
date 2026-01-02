# AI User Research Testing Concept

## Overview

This document outlines the architecture and implementation approach for conducting automated AI-based user research testing on the Swiss Ballot Chatbot Study platform. The goal is to simulate ~1,000 AI participants who complete the full survey flow based on defined personas.

---

## 1. Architecture Options

### Option A: Direct API Testing
**Approach:** A standalone test runner that calls your existing backend APIs directly, bypassing the frontend UI.

```
┌─────────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Test Runner       │ ───► │  Your Backend    │ ───► │   PostgreSQL    │
│   (Node.js/Python)  │      │  (Express API)   │      │   Database      │
│                     │      │                  │      │                 │
│  - Persona Engine   │      │  Existing APIs:  │      │  participants   │
│  - LLM Integration  │      │  /initialize     │      │  post_measures  │
│  - Orchestrator     │      │  /baseline       │      │  (with ai_flag) │
└─────────────────────┘      │  /chat/message   │      └─────────────────┘
                             │  /donation       │
                             │  /post-measures  │
                             └──────────────────┘
```

**Pros:**
- No frontend changes needed
- Fast execution (no browser overhead)
- Easy to parallelize
- Full control over timing and data

**Cons:**
- Doesn't test actual UI interactions
- Won't catch frontend bugs

### Option B: Browser Automation (E2E Testing)
**Approach:** Playwright/Puppeteer scripts that control actual browser instances.

```
┌─────────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Playwright/       │ ───► │  Frontend        │ ───► │   Backend       │
│   Puppeteer         │      │  (Browser)       │      │   + Database    │
│                     │      │                  │      │                 │
│  - Click buttons    │      │  React App       │      │                 │
│  - Fill forms       │      │  ailights.org    │      │                 │
│  - LLM for chat     │      │                  │      │                 │
└─────────────────────┘      └──────────────────┘      └─────────────────┘
```

**Pros:**
- Tests real UI behavior
- Catches frontend bugs
- More realistic simulation

**Cons:**
- Slower execution
- More resource-intensive
- Complex to maintain

### Option C: Hybrid Approach
Use **Option A for bulk testing** (1,000 participants) + **Option B for a smaller sample** (50-100) to validate UI behavior.

---

## 2. Data Separation Strategy

### Database Modifications

Add a flag to the `participants` table to identify AI participants:

```sql
ALTER TABLE participants ADD COLUMN is_ai_participant BOOLEAN DEFAULT FALSE;
ALTER TABLE participants ADD COLUMN ai_persona_id VARCHAR(50);
ALTER TABLE participants ADD COLUMN ai_run_id UUID; -- Groups participants from same test run
```

### Modified `/initialize` Endpoint

Add an optional parameter for AI participants:

```javascript
// POST /api/experiment/initialize
{
  "language": "de",
  "isAiParticipant": true,        // New field
  "aiPersonaId": "skeptic_elder", // New field
  "aiRunId": "uuid-of-test-run"   // New field
}
```

### Querying Human vs AI Data

```sql
-- Human participants only (for real analysis)
SELECT * FROM participants WHERE is_ai_participant = FALSE;

-- AI participants only (for validation)
SELECT * FROM participants WHERE is_ai_participant = TRUE;

-- Specific test run
SELECT * FROM participants WHERE ai_run_id = 'uuid';
```

### API Usage Monitoring

All Apertus LLM API calls are logged for monitoring production usage:

```sql
CREATE TABLE api_usage_logs (
    id SERIAL PRIMARY KEY,
    participant_id UUID REFERENCES participants(id),
    model VARCHAR(100) NOT NULL,
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    response_time_ms INT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Query examples:**

```sql
-- Today's API usage
SELECT COUNT(*), SUM(total_tokens) FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '1 day';

-- Failed calls
SELECT * FROM api_usage_logs WHERE success = false ORDER BY created_at DESC;

-- Average response time
SELECT AVG(response_time_ms) FROM api_usage_logs WHERE success = true;
```

### Chat Message Storage (AI Only)

**Privacy by design:** Chat messages are ONLY stored for AI participants. Human participant chat messages are never persisted to the database.

```sql
-- Chat messages table (stores AI participant conversations only)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES participants(id),
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_participant ON chat_messages(participant_id);
```

The backend automatically checks `is_ai_participant` before saving messages:

```javascript
// In /chat/message endpoint
if (participantId && rows[0]?.is_ai_participant) {
  // Only save for AI participants
  await pool.query(
    'INSERT INTO chat_messages (participant_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)',
    [participantId, 'user', message, 'assistant', response]
  );
}
```

This allows analysis of AI-generated conversations for validation while ensuring human participant privacy.

---

## 3. Persona System

### System Prompt Philosophy

**Important:** Do NOT use role-based system prompts like "You are a lawyer" or "You are a privacy advocate" for AI personas. Instead, keep the system prompt minimal:

```typescript
const SYSTEM_PROMPT = "You are completing a study about Swiss voting information.";
```

Personas are simulated through **behavioral patterns and survey answers**, not by instructing the LLM to roleplay. This produces more realistic and measurable variance.

### Persona Definition Schema

```typescript
interface Persona {
  id: string;
  name: string;
  cluster: 'A' | 'B' | 'C' | 'D';  // Behavioral cluster
  description: string;

  // Demographics (determines survey answers)
  demographics: {
    age: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
    gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
    education: 'no-degree' | 'apprenticeship' | 'matura' | 'bachelor' | 'master' | 'doctorate';
    language: 'de' | 'fr' | 'it' | 'rm';  // Swiss national languages
    eligibleToVote: boolean;
  };

  // Behavioral drivers (all 1-6 Likert scale)
  behavioralDrivers: {
    privacy_concern: number;           // 1-6: How concerned about data privacy
    institutional_trust: number;       // 1-6: Trust in institutions/government
    data_sovereignty_salience: number; // 1-6: Importance of data control
    civic_motivation: number;          // 1-6: Motivation to participate in civic duties
    cognitive_load_sensitivity: number;// 1-6: How easily overwhelmed by complexity
    ai_literacy: number;               // 1-6: Understanding of AI/tech systems
    ballot_familiarity: number;        // 1-6: Familiarity with Swiss voting
  };

  // Interaction style (influences chat behavior)
  interactionStyle: {
    questionCount: 2 | 3;       // How many questions to ask chatbot
    topics: string[];           // What to ask about
    tone: 'formal' | 'casual' | 'skeptical' | 'curious';
  };
}
```

### Persona Clusters (4 Clusters × 3 Personas = 12 Core Personas)

| Cluster | Civic Motivation | Privacy Concern | Donation Tendency | Description |
|---------|------------------|-----------------|-------------------|-------------|
| **A** | High (5-7) | Low (1-3) | Donation-prone | Civic-minded, trusting |
| **B** | High (5-7) | High (5-7) | Control-seeking | Engaged but protective |
| **C** | Low (1-3) | High (5-7) | Decline-prone | Disengaged, skeptical |
| **D** | Low (1-3) | Low (1-3) | Indifferent | Passive, low stakes |

### 12 Core Personas

```json
{
  "personas": [
    // ═══════════════════════════════════════════════════════════════
    // CLUSTER A: High Civic / Low Privacy (Donation-Prone)
    // ═══════════════════════════════════════════════════════════════
    {
      "id": "A1_civic_optimist",
      "name": "Civic Optimist",
      "cluster": "A",
      "description": "Engaged citizen who trusts institutions and sees data sharing as civic duty",
      "demographics": { "age": "45-54", "gender": "male", "education": "bachelor", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 2, "institutional_trust": 6, "data_sovereignty_salience": 2,
        "civic_motivation": 6, "cognitive_load_sensitivity": 3, "ai_literacy": 4, "ballot_familiarity": 5
      },
      "interactionStyle": { "questionCount": 2, "topics": ["voting recommendations", "ballot summary"], "tone": "formal" }
    },
    {
      "id": "A2_young_idealist",
      "name": "Young Idealist",
      "cluster": "A",
      "description": "First-time voter excited about democratic participation",
      "demographics": { "age": "18-24", "gender": "female", "education": "matura", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 2, "institutional_trust": 5, "data_sovereignty_salience": 2,
        "civic_motivation": 7, "cognitive_load_sensitivity": 4, "ai_literacy": 5, "ballot_familiarity": 2
      },
      "interactionStyle": { "questionCount": 3, "topics": ["how voting works", "youth perspectives", "climate initiatives"], "tone": "curious" }
    },
    {
      "id": "A3_community_elder",
      "name": "Community Elder",
      "cluster": "A",
      "description": "Retired community member with strong civic traditions",
      "demographics": { "age": "65+", "gender": "male", "education": "apprenticeship", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 2, "institutional_trust": 6, "data_sovereignty_salience": 3,
        "civic_motivation": 6, "cognitive_load_sensitivity": 5, "ai_literacy": 2, "ballot_familiarity": 7
      },
      "interactionStyle": { "questionCount": 2, "topics": ["ballot overview", "party positions"], "tone": "formal" }
    },

    // ═══════════════════════════════════════════════════════════════
    // CLUSTER B: High Civic / High Privacy (Control-Seeking)
    // ═══════════════════════════════════════════════════════════════
    {
      "id": "B1_privacy_advocate",
      "name": "Privacy Advocate",
      "cluster": "B",
      "description": "Tech-savvy professional who values both participation and data control",
      "demographics": { "age": "35-44", "gender": "female", "education": "master", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 7, "institutional_trust": 3, "data_sovereignty_salience": 7,
        "civic_motivation": 6, "cognitive_load_sensitivity": 2, "ai_literacy": 6, "ballot_familiarity": 5
      },
      "interactionStyle": { "questionCount": 3, "topics": ["data usage", "privacy policy", "voting deadline"], "tone": "skeptical" }
    },
    {
      "id": "B2_informed_skeptic",
      "name": "Informed Skeptic",
      "cluster": "B",
      "description": "Well-educated voter who questions but engages",
      "demographics": { "age": "45-54", "gender": "male", "education": "doctorate", "language": "fr", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 6, "institutional_trust": 4, "data_sovereignty_salience": 6,
        "civic_motivation": 5, "cognitive_load_sensitivity": 2, "ai_literacy": 5, "ballot_familiarity": 6
      },
      "interactionStyle": { "questionCount": 3, "topics": ["AI transparency", "data retention", "ballot details"], "tone": "skeptical" }
    },
    {
      "id": "B3_careful_parent",
      "name": "Careful Parent",
      "cluster": "B",
      "description": "Family-oriented voter concerned about data legacy",
      "demographics": { "age": "35-44", "gender": "female", "education": "bachelor", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 6, "institutional_trust": 4, "data_sovereignty_salience": 5,
        "civic_motivation": 5, "cognitive_load_sensitivity": 4, "ai_literacy": 4, "ballot_familiarity": 4
      },
      "interactionStyle": { "questionCount": 2, "topics": ["family impact", "data storage"], "tone": "formal" }
    },

    // ═══════════════════════════════════════════════════════════════
    // CLUSTER C: Low Civic / High Privacy (Decline-Prone)
    // ═══════════════════════════════════════════════════════════════
    {
      "id": "C1_distrustful_avoider",
      "name": "Distrustful Avoider",
      "cluster": "C",
      "description": "Highly skeptical of institutions and data collection",
      "demographics": { "age": "25-34", "gender": "male", "education": "apprenticeship", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 7, "institutional_trust": 2, "data_sovereignty_salience": 7,
        "civic_motivation": 2, "cognitive_load_sensitivity": 5, "ai_literacy": 4, "ballot_familiarity": 3
      },
      "interactionStyle": { "questionCount": 2, "topics": ["data risks", "who sees my data"], "tone": "skeptical" }
    },
    {
      "id": "C2_overwhelmed_worker",
      "name": "Overwhelmed Worker",
      "cluster": "C",
      "description": "Busy professional with little time or trust for civic engagement",
      "demographics": { "age": "35-44", "gender": "female", "education": "bachelor", "language": "it", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 5, "institutional_trust": 3, "data_sovereignty_salience": 5,
        "civic_motivation": 3, "cognitive_load_sensitivity": 7, "ai_literacy": 4, "ballot_familiarity": 2
      },
      "interactionStyle": { "questionCount": 2, "topics": ["quick summary", "deadline"], "tone": "casual" }
    },
    {
      "id": "C3_cynical_observer",
      "name": "Cynical Observer",
      "cluster": "C",
      "description": "Disenchanted with politics, protective of personal data",
      "demographics": { "age": "55-64", "gender": "male", "education": "matura", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 6, "institutional_trust": 2, "data_sovereignty_salience": 6,
        "civic_motivation": 2, "cognitive_load_sensitivity": 4, "ai_literacy": 3, "ballot_familiarity": 5
      },
      "interactionStyle": { "questionCount": 2, "topics": ["why should I vote", "what's the point"], "tone": "skeptical" }
    },

    // ═══════════════════════════════════════════════════════════════
    // CLUSTER D: Low Civic / Low Privacy (Indifferent)
    // ═══════════════════════════════════════════════════════════════
    {
      "id": "D1_passive_compliant",
      "name": "Passive Compliant",
      "cluster": "D",
      "description": "Goes along with requests without strong opinions",
      "demographics": { "age": "25-34", "gender": "female", "education": "bachelor", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 3, "institutional_trust": 4, "data_sovereignty_salience": 2,
        "civic_motivation": 3, "cognitive_load_sensitivity": 5, "ai_literacy": 4, "ballot_familiarity": 3
      },
      "interactionStyle": { "questionCount": 2, "topics": ["what should I do", "is this important"], "tone": "casual" }
    },
    {
      "id": "D2_disengaged_youth",
      "name": "Disengaged Youth",
      "cluster": "D",
      "description": "Young adult with low political interest",
      "demographics": { "age": "18-24", "gender": "non-binary", "education": "matura", "language": "de", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 3, "institutional_trust": 4, "data_sovereignty_salience": 2,
        "civic_motivation": 2, "cognitive_load_sensitivity": 4, "ai_literacy": 6, "ballot_familiarity": 1
      },
      "interactionStyle": { "questionCount": 2, "topics": ["what is this about", "do I have to vote"], "tone": "casual" }
    },
    {
      "id": "D3_busy_pragmatist",
      "name": "Busy Pragmatist",
      "cluster": "D",
      "description": "Focused on work, treats voting as checkbox task",
      "demographics": { "age": "45-54", "gender": "male", "education": "bachelor", "language": "rm", "eligibleToVote": true },
      "behavioralDrivers": {
        "privacy_concern": 2, "institutional_trust": 5, "data_sovereignty_salience": 2,
        "civic_motivation": 3, "cognitive_load_sensitivity": 6, "ai_literacy": 3, "ballot_familiarity": 4
      },
      "interactionStyle": { "questionCount": 2, "topics": ["quick overview", "recommendation"], "tone": "formal" }
    }
  ]
}
```

### Persona Distribution & Variation

For ~1,000 participants: **12 personas × 80-90 variations each**

| Cluster | Personas | Variations Each | Total | % |
|---------|----------|-----------------|-------|---|
| **A** (Donation-prone) | A1, A2, A3 | 80-85 | ~250 | 25% |
| **B** (Control-seeking) | B1, B2, B3 | 80-85 | ~250 | 25% |
| **C** (Decline-prone) | C1, C2, C3 | 80-85 | ~250 | 25% |
| **D** (Indifferent) | D1, D2, D3 | 80-85 | ~250 | 25% |

### Language Distribution (Swiss Demographics)

| Language | % of Participants | Count (~1000) |
|----------|-------------------|---------------|
| German (de) | 63% | ~630 |
| French (fr) | 23% | ~230 |
| Italian (it) | 8% | ~80 |
| Romansh (rm) | 6% | ~60 |

### Jitter Implementation

Apply random ±1 jitter to all behavioral driver values to simulate individual variation:

```typescript
function applyJitter(baseValue: number): number {
  const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
  return Math.max(1, Math.min(7, baseValue + jitter));
}
```

---

## 4. Test Runner Implementation

### Project Structure

```
/ai-testing/
├── package.json
├── tsconfig.json
├── .env
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration
│   ├── orchestrator.ts       # Coordinates test runs
│   ├── participant-simulator.ts  # Simulates one participant
│   ├── persona-engine.ts     # Loads and manages personas
│   ├── llm-client.ts         # Generates chat messages via LLM
│   ├── api-client.ts         # Calls your backend APIs
│   ├── response-generator.ts # Generates survey responses based on persona
│   └── types.ts              # TypeScript types
├── personas/
│   └── personas.json         # Persona definitions
└── results/
    └── run-{timestamp}/      # Output logs per run
```

### Core Components

#### 1. Orchestrator (`orchestrator.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';
import { ParticipantSimulator } from './participant-simulator';
import { PersonaEngine } from './persona-engine';

export class Orchestrator {
  private runId: string;
  private personaEngine: PersonaEngine;
  private concurrency: number;

  constructor(concurrency = 10) {
    this.runId = uuidv4();
    this.personaEngine = new PersonaEngine();
    this.concurrency = concurrency;
  }

  async runTest(totalParticipants: number): Promise<void> {
    console.log(`Starting test run ${this.runId} with ${totalParticipants} participants`);

    const personas = this.personaEngine.generateDistribution(totalParticipants);
    const batches = this.chunk(personas, this.concurrency);

    for (const batch of batches) {
      await Promise.all(
        batch.map(persona => this.simulateParticipant(persona))
      );
    }

    console.log(`Test run ${this.runId} complete`);
  }

  private async simulateParticipant(persona: Persona): Promise<void> {
    const simulator = new ParticipantSimulator(persona, this.runId);
    await simulator.run();
  }

  private chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, (i + 1) * size)
    );
  }
}
```

#### 2. Participant Simulator (`participant-simulator.ts`)

```typescript
import { ApiClient } from './api-client';
import { ResponseGenerator } from './response-generator';
import { LLMClient } from './llm-client';

export class ParticipantSimulator {
  private persona: Persona;
  private runId: string;
  private api: ApiClient;
  private responseGen: ResponseGenerator;
  private llm: LLMClient;

  constructor(persona: Persona, runId: string) {
    this.persona = persona;
    this.runId = runId;
    this.api = new ApiClient();
    this.responseGen = new ResponseGenerator(persona);
    this.llm = new LLMClient();
  }

  async run(): Promise<void> {
    try {
      // Phase 1: Initialize
      const { participantId, condition } = await this.api.initialize({
        language: this.persona.demographics.language,
        isAiParticipant: true,
        aiPersonaId: this.persona.id,
        aiRunId: this.runId
      });

      // Phase 2: Baseline Survey
      await this.api.submitBaseline(participantId, {
        aiLiteracy: this.responseGen.likert('ai_literacy'),
        privacyConcern: this.responseGen.likert('privacy_concern'),
        ballotFamiliarity: this.responseGen.likert('ballot_familiarity')
      });

      // Phase 3: Chat Interaction
      await this.simulateChat(participantId, condition);

      // Phase 4: Donation Decision
      const donates = this.responseGen.donationDecision(condition);
      const config = donates ? this.responseGen.donationConfig(condition) : null;
      await this.api.submitDonation(participantId, donates, config);

      // Phase 5: Post-Task Survey
      await this.api.submitPostMeasures(participantId,
        this.responseGen.postTaskResponses(condition)
      );

      console.log(`✓ Participant ${participantId} (${this.persona.id}) completed`);

    } catch (error) {
      console.error(`✗ Participant failed (${this.persona.id}):`, error.message);
    }
  }

  private async simulateChat(participantId: string, condition: string): Promise<void> {
    const conversationHistory = [];
    const questionCount = this.persona.interactionStyle.questionCount;

    for (let i = 0; i < questionCount; i++) {
      // Generate a contextual question using LLM
      const question = await this.llm.generateChatQuestion(
        this.persona,
        conversationHistory,
        i
      );

      // Send to chatbot and get response
      const response = await this.api.sendChatMessage(
        participantId,
        question,
        conversationHistory,
        this.persona.demographics.language
      );

      conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: response }
      );

      // Small delay between messages (realistic pacing)
      await this.delay(1000 + Math.random() * 2000);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 3. LLM Generators using Apertus (`llm-client.ts`)

Uses the Swiss Apertus LLM to generate **all dynamic text content**:
- **Chat questions**: Natural, varied questions based on persona traits
- **Open feedback**: Survey feedback in the persona's language (DE/FR/IT/RM)

All text generation respects the persona's language setting - no hardcoded text is used.

```typescript
import axios from 'axios';

export class QuestionGenerator {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.INFOMANIAK_ENDPOINT || '';
    this.apiKey = process.env.INFOMANIAK_API_KEY || '';
    this.model = process.env.INFOMANIAK_MODEL || 'swiss-ai/Apertus-70B-Instruct-2509';
  }

  async generateChatQuestion(
    persona: Persona,
    history: Array<{role: string, content: string}>,
    questionIndex: number
  ): Promise<string> {
    const topic = persona.interactionStyle.topics[questionIndex] || 'Swiss ballot initiatives';
    const tone = persona.interactionStyle.tone;
    const lang = persona.demographics.language;
    const d = persona.behavioralDrivers;

    const systemPrompt = `You are generating a realistic question that a Swiss citizen would ask a voting chatbot.
Generate ONE short question (1-2 sentences) in ${lang === 'de' ? 'German' : lang === 'fr' ? 'French' : lang === 'it' ? 'Italian' : 'Romansh'}.
Output ONLY the question, nothing else.`;

    const userPrompt = `Generate a question about "${topic}" for a Swiss ballot chatbot.

Person characteristics (shape the question style):
- Voting familiarity: ${d.ballot_familiarity}/7 ${d.ballot_familiarity <= 3 ? '(beginner)' : '(experienced)'}
- Privacy concern: ${d.privacy_concern}/7 ${d.privacy_concern >= 5 ? '(may ask about data handling)' : ''}
- Tone: ${tone}
- AI/tech comfort: ${d.ai_literacy}/7

${history.length > 0 ? `Previous exchange:\n${history.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nAsk a follow-up or new question.` : 'This is the first question.'}`;

    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model: 'swiss-ai/Apertus-70B-Instruct-2509',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150
      },
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );

    return response.data.choices[0]?.message?.content?.trim();
  }
}

/**
 * Feedback generator - generates open-ended survey feedback in persona's language
 */
export class FeedbackGenerator {
  async generateFeedback(persona: Persona, donated: boolean): Promise<string> {
    // 30% chance of empty feedback (realistic)
    if (Math.random() < 0.3) return '';

    const systemPrompt = `Generate realistic feedback for a Swiss voting chatbot study.
Write ONE short comment (1-2 sentences) in ${persona.demographics.language}.
Output ONLY the feedback text.`;

    const userPrompt = `Person profile:
- Attitude: ${persona.cluster === 'A' ? 'trusting' : persona.cluster === 'B' ? 'privacy-conscious' : persona.cluster === 'C' ? 'skeptical' : 'indifferent'}
- Decision: ${donated ? 'donated data' : 'declined'}

Write ONE natural feedback comment in the persona's language.`;

    // Call Apertus LLM...
    return response.data.choices[0]?.message?.content?.trim();
  }
}
```

#### 4. Response Generator (`response-generator.ts`)

```typescript
export class ResponseGenerator {
  private persona: Persona;
  private drivers: Persona['behavioralDrivers'];

  constructor(persona: Persona) {
    this.persona = persona;
    this.drivers = persona.behavioralDrivers;
  }

  // Generate Likert response (1-6) with ±1 jitter
  likert(driver: keyof Persona['behavioralDrivers']): number {
    const base = this.drivers[driver];
    return this.applyJitter(base);
  }

  private applyJitter(value: number): number {
    const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    return Math.max(1, Math.min(7, value + jitter));
  }

  /**
   * Donation decision based on TRAIT-CONDITION INTERACTIONS
   * NO global "+0.1" effects per condition.
   * Effects depend on persona characteristics.
   */
  donationDecision(condition: string): boolean {
    const d = this.drivers;

    // Base probability from cluster tendency
    let probability = this.getClusterBaseProbability();

    // ─────────────────────────────────────────────────────────────
    // CONDITION A (Control): No intervention effects
    // ─────────────────────────────────────────────────────────────
    if (condition === 'A') {
      // No modification - pure baseline
    }

    // ─────────────────────────────────────────────────────────────
    // CONDITION B (DNL - Data Nutrition Label):
    // Increases donation ONLY for:
    //   - High cognitive_load_sensitivity (>=5): DNL simplifies complexity
    //   - Low institutional_trust (<=3): DNL provides transparency they need
    // ─────────────────────────────────────────────────────────────
    if (condition === 'B') {
      if (d.cognitive_load_sensitivity >= 5) {
        probability += 0.15; // DNL reduces cognitive burden
      }
      if (d.institutional_trust <= 3) {
        probability += 0.10; // DNL builds trust through transparency
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CONDITION C (Dashboard - Control Interface):
    // Helps: High privacy_concern + Low cognitive_load_sensitivity
    // Hurts: High cognitive_load_sensitivity ("overloaded avoiders")
    // ─────────────────────────────────────────────────────────────
    if (condition === 'C') {
      // Dashboard helps privacy-conscious who can handle complexity
      if (d.privacy_concern >= 5 && d.cognitive_load_sensitivity <= 4) {
        probability += 0.20; // Control satisfies their need for agency
      }

      // Dashboard overwhelms high cognitive load sensitivity personas
      if (d.cognitive_load_sensitivity >= 6) {
        probability -= 0.10; // Too many options = decision paralysis
      }

      // Data sovereignty salient personas appreciate control options
      if (d.data_sovereignty_salience >= 5) {
        probability += 0.10;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CONDITION D (DNL + Dashboard - Synergy):
    // Works for MOST persona types - transparency + control combo
    // Strongest effect for Cluster B (control-seeking)
    // ─────────────────────────────────────────────────────────────
    if (condition === 'D') {
      // Base synergy effect for most personas
      probability += 0.10;

      // Extra boost for control-seeking (Cluster B) personas
      if (d.privacy_concern >= 5 && d.civic_motivation >= 5) {
        probability += 0.15; // Perfect match: engaged + wants control
      }

      // DNL component helps high cognitive load personas
      if (d.cognitive_load_sensitivity >= 5) {
        probability += 0.10; // DNL offsets dashboard complexity
      }

      // Trust-building through combined transparency
      if (d.institutional_trust <= 4) {
        probability += 0.05;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Universal modifiers (trait-based, not condition-based)
    // ─────────────────────────────────────────────────────────────

    // High civic motivation always increases donation likelihood
    if (d.civic_motivation >= 6) {
      probability += 0.10;
    }

    // Very low trust is a strong negative factor
    if (d.institutional_trust <= 2) {
      probability -= 0.15;
    }

    // Clamp to valid probability range
    probability = Math.max(0.05, Math.min(0.95, probability));

    return Math.random() < probability;
  }

  private getClusterBaseProbability(): number {
    const cluster = this.persona.cluster;
    switch (cluster) {
      case 'A': return 0.65; // Donation-prone
      case 'B': return 0.40; // Control-seeking (donates with right conditions)
      case 'C': return 0.20; // Decline-prone
      case 'D': return 0.45; // Indifferent (coin-flip tendency)
      default: return 0.40;
    }
  }

  // Generate donation config for conditions C and D
  donationConfig(condition: string): DonationConfig | null {
    if (condition !== 'C' && condition !== 'D') return null;

    const d = this.drivers;

    return {
      shareScope: d.privacy_concern > 5 ? 'topics-only' : d.privacy_concern > 3 ? 'questions-only' : 'full',
      usagePurpose: d.data_sovereignty_salience > 4 ? 'academic' : 'commercial',
      storageLocation: d.privacy_concern > 5 ? 'swiss' : d.privacy_concern > 3 ? 'swiss-or-eu' : 'no-preference',
      retentionPeriod: d.data_sovereignty_salience > 5 ? '6months' : d.data_sovereignty_salience > 3 ? '1year' : 'indefinite'
    };
  }

  // Generate all post-task survey responses
  postTaskResponses(condition: string): PostTaskMeasures {
    const d = this.drivers;

    return {
      // Perceived transparency (higher if DNL shown)
      transparency1: this.adjustForCondition(4, condition, 'transparency'),
      transparency2: this.adjustForCondition(4, condition, 'transparency'),

      // Perceived control (higher if Dashboard shown)
      control1: this.adjustForCondition(4, condition, 'control'),
      control2: this.adjustForCondition(4, condition, 'control'),

      // Risk perception (inversely related to trust)
      riskTraceability: this.applyJitter(8 - d.institutional_trust),
      riskMisuse: this.applyJitter(8 - d.institutional_trust),

      // Trust
      trust1: this.applyJitter(d.institutional_trust),

      // Attention check (always correct for AI)
      attentionCheck: 'voting',

      // Demographics from persona
      age: this.persona.demographics.age,
      gender: this.persona.demographics.gender,
      primaryLanguage: this.persona.demographics.language,
      education: this.persona.demographics.education,
      eligibleToVoteCh: this.persona.demographics.eligibleToVote,

      // Feedback is generated via LLM in participant-simulator.ts
      openFeedback: ''
    };
  }

  private adjustForCondition(base: number, condition: string, factor: 'transparency' | 'control'): number {
    let value = base;

    if (factor === 'transparency' && (condition === 'B' || condition === 'D')) {
      value += 2; // DNL increases perceived transparency
    }
    if (factor === 'control' && (condition === 'C' || condition === 'D')) {
      value += 2; // Dashboard increases perceived control
    }

    return Math.max(1, Math.min(7, this.applyJitter(value)));
  }
}
```

---

## 5. Load Throttling & Rate Limiting

Running 1,000 simulated participants can overwhelm your backend if not properly throttled. This section covers strategies to prevent overload.

### Configuration Parameters

```typescript
interface ThrottleConfig {
  concurrency: number;        // Max parallel participants (default: 10)
  requestsPerSecond: number;  // Global rate limit (default: 20)
  minDelayBetweenSteps: number; // Min ms between participant steps (default: 500)
  maxDelayBetweenSteps: number; // Max ms between participant steps (default: 2000)
  backoffBaseMs: number;      // Initial backoff on failure (default: 1000)
  backoffMaxMs: number;       // Max backoff delay (default: 30000)
  circuitBreakerThreshold: number; // Consecutive failures to pause (default: 5)
  circuitBreakerCooldown: number;  // Ms to wait when circuit breaks (default: 60000)
}
```

### Rate Limiter Implementation

```typescript
// src/rate-limiter.ts
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per ms
  private lastRefill: number;

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate;
      await this.delay(waitTime);
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Circuit Breaker Pattern

```typescript
// src/circuit-breaker.ts
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailure: number = 0;
  private isOpen: boolean = false;

  constructor(
    private threshold: number = 5,
    private cooldownMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should close
    if (this.isOpen && Date.now() - this.lastFailure > this.cooldownMs) {
      this.isOpen = false;
      this.failures = 0;
      console.log('🔄 Circuit breaker closed, resuming operations');
    }

    if (this.isOpen) {
      const waitTime = this.cooldownMs - (Date.now() - this.lastFailure);
      console.log(`⏸️  Circuit open, waiting ${Math.round(waitTime / 1000)}s...`);
      await this.delay(waitTime);
      this.isOpen = false;
      this.failures = 0;
    }

    try {
      const result = await fn();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= this.threshold) {
        this.isOpen = true;
        console.error(`🔴 Circuit breaker OPEN after ${this.failures} consecutive failures`);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Exponential Backoff for Retries

```typescript
// src/api-client.ts (updated)
export class ApiClient {
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private config: ThrottleConfig;

  constructor(config: ThrottleConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.requestsPerSecond);
    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold,
      config.circuitBreakerCooldown
    );
  }

  async request<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    await this.rateLimiter.acquire();

    return this.circuitBreaker.execute(async () => {
      let lastError: Error;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;

          // Don't retry client errors (4xx except 429)
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
          }

          // Exponential backoff
          const backoffMs = Math.min(
            this.config.backoffBaseMs * Math.pow(2, attempt),
            this.config.backoffMaxMs
          );

          console.log(`⚠️  Request failed (attempt ${attempt + 1}/${retries}), retrying in ${backoffMs}ms...`);
          await this.delay(backoffMs);
        }
      }

      throw lastError;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Updated Orchestrator with Throttling

```typescript
// src/orchestrator.ts (updated)
export class Orchestrator {
  private runId: string;
  private personaEngine: PersonaEngine;
  private config: ThrottleConfig;
  private activeCount: number = 0;
  private completedCount: number = 0;
  private failedCount: number = 0;

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.runId = uuidv4();
    this.personaEngine = new PersonaEngine();
    this.config = {
      concurrency: 10,
      requestsPerSecond: 20,
      minDelayBetweenSteps: 500,
      maxDelayBetweenSteps: 2000,
      backoffBaseMs: 1000,
      backoffMaxMs: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerCooldown: 60000,
      ...config
    };
  }

  async runTest(totalParticipants: number): Promise<RunSummary> {
    console.log(`🚀 Starting test run ${this.runId}`);
    console.log(`   Participants: ${totalParticipants}`);
    console.log(`   Concurrency: ${this.config.concurrency}`);
    console.log(`   Rate limit: ${this.config.requestsPerSecond} req/s`);

    const personas = this.personaEngine.generateDistribution(totalParticipants);
    const queue = [...personas];

    // Process with concurrency limit
    const workers = Array(this.config.concurrency).fill(null).map(() =>
      this.worker(queue)
    );

    await Promise.all(workers);

    const summary = {
      runId: this.runId,
      total: totalParticipants,
      completed: this.completedCount,
      failed: this.failedCount,
      duration: Date.now() - this.startTime
    };

    console.log(`\n✅ Test run complete`);
    console.log(`   Completed: ${summary.completed}/${summary.total}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);

    return summary;
  }

  private async worker(queue: Persona[]): Promise<void> {
    while (queue.length > 0) {
      const persona = queue.shift();
      if (!persona) break;

      this.activeCount++;
      try {
        const simulator = new ParticipantSimulator(persona, this.runId, this.config);
        await simulator.run();
        this.completedCount++;
      } catch (error) {
        this.failedCount++;
        console.error(`Failed: ${persona.id} - ${error.message}`);
      }
      this.activeCount--;

      // Progress update every 10 completions
      if ((this.completedCount + this.failedCount) % 10 === 0) {
        console.log(`📊 Progress: ${this.completedCount + this.failedCount}/${this.completedCount + this.failedCount + queue.length + this.activeCount}`);
      }
    }
  }
}
```

### Recommended Settings by Scale

| Participants | Concurrency | Rate Limit | Est. Duration |
|--------------|-------------|------------|---------------|
| 50 (test)    | 5           | 10 req/s   | ~10 min       |
| 200          | 10          | 20 req/s   | ~30 min       |
| 500          | 10          | 20 req/s   | ~1.5 hours    |
| 1,000        | 15          | 30 req/s   | ~2.5 hours    |

**Note:** These assume your backend can handle the load. Monitor your server metrics during initial runs and adjust accordingly.

---

## 6. Logging & Debugging

Structured logging enables debugging, replay of failed runs, and analysis of test behavior.

### Log Structure

```typescript
// src/types.ts
interface ParticipantLog {
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

interface StepLog {
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
```

### Logger Implementation

```typescript
// src/logger.ts
import * as fs from 'fs';
import * as path from 'path';

export class ParticipantLogger {
  private log: ParticipantLog;
  private logDir: string;

  constructor(runId: string, persona: string) {
    this.logDir = path.join('results', `run-${runId}`);
    fs.mkdirSync(this.logDir, { recursive: true });

    this.log = {
      runId,
      participantId: null,
      persona,
      condition: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      error: null,
      steps: []
    };
  }

  setParticipantId(id: string): void {
    this.log.participantId = id;
  }

  setCondition(condition: string): void {
    this.log.condition = condition;
  }

  logStep(step: Omit<StepLog, 'timestamp'>): void {
    this.log.steps.push({
      ...step,
      timestamp: new Date().toISOString()
    });
  }

  complete(): void {
    this.log.status = 'completed';
    this.log.completedAt = new Date().toISOString();
    this.save();
  }

  fail(error: string): void {
    this.log.status = 'failed';
    this.log.error = error;
    this.log.completedAt = new Date().toISOString();
    this.save();
  }

  private save(): void {
    const filename = `${this.log.persona}-${this.log.participantId || 'unknown'}.json`;
    const filepath = path.join(this.logDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.log, null, 2));
  }

  // Get log for replay
  getLog(): ParticipantLog {
    return this.log;
  }
}
```

### Updated Participant Simulator with Logging

```typescript
// src/participant-simulator.ts (updated)
export class ParticipantSimulator {
  private logger: ParticipantLogger;
  // ... other fields

  constructor(persona: Persona, runId: string, config: ThrottleConfig) {
    this.persona = persona;
    this.runId = runId;
    this.config = config;
    this.api = new ApiClient(config);
    this.responseGen = new ResponseGenerator(persona);
    this.llm = new LLMClient();
    this.logger = new ParticipantLogger(runId, persona.id);
  }

  async run(): Promise<void> {
    const startTime = Date.now();

    try {
      // Phase 1: Initialize
      const initStart = Date.now();
      const initPayload = {
        language: this.persona.demographics.language,
        isAiParticipant: true,
        aiPersonaId: this.persona.id,
        aiRunId: this.runId
      };

      const { participantId, condition } = await this.api.request(() =>
        this.api.initialize(initPayload)
      );

      this.logger.setParticipantId(participantId);
      this.logger.setCondition(condition);
      this.logger.logStep({
        phase: 'initialize',
        duration: Date.now() - initStart,
        request: { endpoint: '/experiment/initialize', method: 'POST', body: initPayload },
        response: { status: 200, body: { participantId, condition } },
        error: null
      });

      await this.randomDelay();

      // Phase 2: Baseline (with logging)
      const baselineStart = Date.now();
      const baselinePayload = {
        techComfort: this.responseGen.likert('techComfort'),
        privacyConcern: this.responseGen.likert('privacyConcern'),
        ballotFamiliarity: this.responseGen.likert('ballotFamiliarity')
      };

      await this.api.request(() =>
        this.api.submitBaseline(participantId, baselinePayload)
      );

      this.logger.logStep({
        phase: 'baseline',
        duration: Date.now() - baselineStart,
        request: { endpoint: '/experiment/baseline', method: 'POST', body: baselinePayload },
        response: { status: 200, body: {} },
        error: null
      });

      // ... continue for other phases with similar logging

      this.logger.complete();
      console.log(`✓ ${participantId} (${this.persona.id}) completed in ${Date.now() - startTime}ms`);

    } catch (error) {
      this.logger.fail(error.message);
      throw error;
    }
  }

  private async randomDelay(): Promise<void> {
    const delay = this.config.minDelayBetweenSteps +
      Math.random() * (this.config.maxDelayBetweenSteps - this.config.minDelayBetweenSteps);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### Replay Failed Participants

```typescript
// src/replay.ts
import * as fs from 'fs';
import * as path from 'path';

export class ReplayRunner {

  async replayFailed(runId: string): Promise<void> {
    const logDir = path.join('results', `run-${runId}`);
    const files = fs.readdirSync(logDir).filter(f => f.endsWith('.json'));

    const failedLogs: ParticipantLog[] = [];

    for (const file of files) {
      const log: ParticipantLog = JSON.parse(
        fs.readFileSync(path.join(logDir, file), 'utf-8')
      );
      if (log.status === 'failed') {
        failedLogs.push(log);
      }
    }

    console.log(`Found ${failedLogs.length} failed participants to replay`);

    for (const log of failedLogs) {
      console.log(`Replaying ${log.persona} (failed at: ${log.error})`);
      // Re-run with same persona
      const persona = this.personaEngine.getById(log.persona);
      const simulator = new ParticipantSimulator(persona, runId + '-replay', this.config);
      await simulator.run();
    }
  }

  // Dry run - log what would be sent without calling APIs
  async dryRun(totalParticipants: number): Promise<void> {
    console.log('🔍 DRY RUN - No API calls will be made\n');

    const personas = this.personaEngine.generateDistribution(totalParticipants);

    for (const persona of personas.slice(0, 5)) { // Show first 5
      console.log(`Persona: ${persona.name} (${persona.id})`);
      console.log(`  Demographics: ${JSON.stringify(persona.demographics)}`);
      console.log(`  Traits: ${JSON.stringify(persona.traits)}`);
      console.log(`  Donation probability: ${persona.donationProbability}`);
      console.log('');
    }

    console.log(`... and ${personas.length - 5} more participants`);
  }
}
```

### Run Summary Report

```typescript
// src/report.ts
export function generateRunReport(runId: string): void {
  const logDir = path.join('results', `run-${runId}`);
  const files = fs.readdirSync(logDir).filter(f => f.endsWith('.json'));

  const stats = {
    total: files.length,
    completed: 0,
    failed: 0,
    byCondition: { A: 0, B: 0, C: 0, D: 0 },
    byPersona: {} as Record<string, number>,
    avgDuration: 0,
    errors: [] as string[]
  };

  let totalDuration = 0;

  for (const file of files) {
    const log: ParticipantLog = JSON.parse(
      fs.readFileSync(path.join(logDir, file), 'utf-8')
    );

    if (log.status === 'completed') {
      stats.completed++;
      stats.byCondition[log.condition]++;
      stats.byPersona[log.persona] = (stats.byPersona[log.persona] || 0) + 1;

      const duration = new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime();
      totalDuration += duration;
    } else {
      stats.failed++;
      stats.errors.push(`${log.persona}: ${log.error}`);
    }
  }

  stats.avgDuration = totalDuration / stats.completed;

  console.log('\n📊 RUN REPORT');
  console.log('='.repeat(50));
  console.log(`Run ID: ${runId}`);
  console.log(`Total: ${stats.total} | Completed: ${stats.completed} | Failed: ${stats.failed}`);
  console.log(`\nBy Condition:`);
  Object.entries(stats.byCondition).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  console.log(`\nBy Persona:`);
  Object.entries(stats.byPersona).forEach(([p, n]) => console.log(`  ${p}: ${n}`));
  console.log(`\nAvg Duration: ${Math.round(stats.avgDuration / 1000)}s per participant`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }
}
```

### CLI Commands

```bash
# Normal run
npm run test -- --participants=1000

# Dry run (no API calls, just show what would happen)
npm run test -- --participants=100 --dry-run

# Replay failed from previous run
npm run replay -- --run-id=abc123

# Generate report for a run
npm run report -- --run-id=abc123

# Verbose mode (show each step)
npm run test -- --participants=50 --verbose
```

### Log Directory Structure

```
results/
├── run-abc123/
│   ├── privacy_advocate-p001.json
│   ├── privacy_advocate-p002.json
│   ├── trusting_elder-p003.json
│   ├── young_curious-unknown.json  # Failed before getting ID
│   └── ...
├── run-abc123-replay/
│   └── young_curious-p004.json     # Replayed participant
└── run-def456/
    └── ...
```

---

## 7. Backend Setup (Fresh Installation)

Since this is a fresh setup, here's the complete database schema including AI participant tracking.

### 1. Database Schema

```sql
-- Participants table with AI tracking built-in
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  condition VARCHAR(1) NOT NULL CHECK (condition IN ('A', 'B', 'C', 'D')),
  language VARCHAR(5) NOT NULL DEFAULT 'de',
  fingerprint VARCHAR(64),

  -- AI participant tracking
  is_ai_participant BOOLEAN DEFAULT FALSE,
  ai_persona_id VARCHAR(50),
  ai_run_id UUID,

  -- Participant journey tracking
  current_phase VARCHAR(20) DEFAULT 'consent',

  -- Baseline measures (1-6 Likert)
  tech_comfort INT CHECK (tech_comfort BETWEEN 1 AND 6),
  baseline_privacy_concern INT CHECK (baseline_privacy_concern BETWEEN 1 AND 6),
  ballot_familiarity INT CHECK (ballot_familiarity BETWEEN 1 AND 6),

  -- Donation decision
  donation_decision BOOLEAN,
  donation_config JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  consent_at TIMESTAMP,
  decision_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Post-task survey measures
CREATE TABLE post_task_measures (
  id SERIAL PRIMARY KEY,
  participant_id INT REFERENCES participants(id) ON DELETE CASCADE,

  -- Perceived transparency (MC-T)
  transparency1 INT CHECK (transparency1 BETWEEN 1 AND 7),
  transparency2 INT CHECK (transparency2 BETWEEN 1 AND 7),

  -- Perceived control (MC-C)
  control1 INT CHECK (control1 BETWEEN 1 AND 7),
  control2 INT CHECK (control2 BETWEEN 1 AND 7),

  -- Risk perception (OUT-RISK)
  risk_traceability INT CHECK (risk_traceability BETWEEN 1 AND 7),
  risk_misuse INT CHECK (risk_misuse BETWEEN 1 AND 7),

  -- Trust (OUT-TRUST)
  trust1 INT CHECK (trust1 BETWEEN 1 AND 7),

  -- Attention check
  attention_check VARCHAR(50),

  -- Demographics
  age VARCHAR(10),
  gender VARCHAR(20),
  primary_language VARCHAR(5),
  education VARCHAR(50),
  eligible_to_vote_ch BOOLEAN,

  -- Open feedback
  open_feedback TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Anonymous click tracking
CREATE TABLE click_counters (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_fingerprint ON participants(fingerprint);
CREATE INDEX idx_participants_ai ON participants(is_ai_participant);
CREATE INDEX idx_participants_ai_run ON participants(ai_run_id);
CREATE INDEX idx_participants_condition ON participants(condition);
CREATE INDEX idx_post_measures_participant ON post_task_measures(participant_id);
```

### 2. Update Initialize Endpoint

```javascript
// backend/src/routes/experiment.js
router.post('/initialize', async (req, res) => {
  const {
    language,
    isAiParticipant = false,
    aiPersonaId = null,
    aiRunId = null
  } = req.body;

  // Skip fingerprint check for AI participants
  if (!isAiParticipant) {
    const fingerprint = generateFingerprint(req);
    const existing = await checkDuplicate(fingerprint);
    if (existing) return res.status(409).json({ error: 'Already participated' });
  }

  const participant = await ExperimentService.createParticipant({
    language,
    isAiParticipant,
    aiPersonaId,
    aiRunId,
    fingerprint: isAiParticipant ? `ai-${uuidv4()}` : generateFingerprint(req)
  });

  res.json(participant);
});
```

### 3. Update ExperimentService

```javascript
// backend/src/services/experiment.service.js
async createParticipant({ language, isAiParticipant, aiPersonaId, aiRunId, fingerprint }) {
  const condition = this.assignCondition();

  const result = await pool.query(
    `INSERT INTO participants
     (session_id, condition, language, fingerprint, is_ai_participant, ai_persona_id, ai_run_id, current_phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'consent')
     RETURNING id, session_id, condition`,
    [uuidv4(), condition, language, fingerprint, isAiParticipant, aiPersonaId, aiRunId]
  );

  return {
    participantId: result.rows[0].id,
    sessionId: result.rows[0].session_id,
    condition: result.rows[0].condition,
    config: this.getConfigForCondition(result.rows[0].condition)
  };
}
```

---

## 8. Running the Tests

### Setup

```bash
cd ai-testing
npm install
cp .env.example .env
# Edit .env with your API keys and backend URL
```

### Execute Test Run

**Note:** The `--participants=N` flag is **required** - there is no default value.

```bash
# Run 1,000 AI participants (10 concurrent)
npm run test -- --participants=1000 --concurrency=10

# Run smaller test batch
npm run test -- --participants=50 --concurrency=5

# Dry run (preview without API calls)
npm run test -- --participants=100 --dry-run
```

### Monitor Progress

```bash
# Watch live progress
npm run test -- --participants=1000 --verbose

# Check database counts
psql -c "SELECT condition, COUNT(*) FROM participants WHERE ai_run_id='<run-id>' GROUP BY condition"
```

---

## 9. Data Analysis

### Separate AI from Human Data

```sql
-- Export human data only for actual analysis
COPY (
  SELECT p.*, ptm.*
  FROM participants p
  LEFT JOIN post_task_measures ptm ON p.id = ptm.participant_id
  WHERE p.is_ai_participant = FALSE
) TO '/tmp/human_participants.csv' WITH CSV HEADER;

-- Export AI data for validation
COPY (
  SELECT p.*, ptm.*, p.ai_persona_id
  FROM participants p
  LEFT JOIN post_task_measures ptm ON p.id = ptm.participant_id
  WHERE p.is_ai_participant = TRUE
) TO '/tmp/ai_participants.csv' WITH CSV HEADER;
```

### Validate AI Response Distribution

```sql
-- Check if AI responses match expected hypothesis effects
SELECT
  condition,
  AVG(transparency1) as avg_transparency,
  AVG(control1) as avg_control,
  COUNT(*) FILTER (WHERE donation_decision = TRUE) * 100.0 / COUNT(*) as donation_rate
FROM participants p
JOIN post_task_measures ptm ON p.id = ptm.participant_id
WHERE is_ai_participant = TRUE
GROUP BY condition
ORDER BY condition;
```

### Data Cleanup (Admin Endpoints)

Two admin endpoints are available for cleaning up test data:

```bash
# Delete only AI test participants (preserves human data)
curl -X DELETE https://thesis.jcloud-ver-jpe.ik-server.com/api/experiment/admin/ai-data

# Delete ALL data (use with caution!)
curl -X DELETE https://thesis.jcloud-ver-jpe.ik-server.com/api/experiment/admin/all-data
```

Both endpoints return the count of deleted rows:
```json
{
  "success": true,
  "deleted": {
    "chatMessages": 150,
    "apiLogs": 100,
    "postMeasures": 50,
    "participants": 50
  }
}
```

---

## 10. Cost Estimation

### API Calls per Participant

| Phase | Backend API | Apertus LLM Calls |
|-------|-------------|-------------------|
| Initialize | 1 | 0 |
| Baseline | 1 | 0 |
| Chat (2-3 messages) | 2-3 | 4-6 (2-3 question gen + 2-3 responses) |
| Donation | 1 | 0 |
| Post-measures | 1 | 1 (feedback generation) |
| **Total** | **6-7** | **5-7** |

### For 1,000 Participants

- Backend API calls: ~6,500
- Apertus API calls: ~6,000 (question generation + chatbot responses + feedback generation)
- All LLM calls use Infomaniak Apertus (Swiss infrastructure)
- All text (questions, feedback) generated in persona's language (DE/FR/IT/RM)
- Time estimate: ~2-4 hours (with 10 concurrent participants)

---

## 11. Next Steps

1. **Database Migration** - Add AI participant columns
2. **Backend Updates** - Modify initialize endpoint
3. **Create Test Runner** - Implement the orchestrator and simulators
4. **Define Personas** - Create 6-10 diverse personas
5. **Test with Small Batch** - Run 50 participants, validate data
6. **Scale Up** - Run full 1,000 participant test
7. **Analyze Results** - Compare AI vs expected distributions

---

## 12. Alternative: Informaniac-Only Approach

If you want to avoid backend changes, you could:

1. Create a separate Informaniac form/dataset for AI participants
2. Use the Informaniac API to submit responses directly
3. Merge data later for analysis with an `is_ai` flag

This keeps your production database clean but requires more manual data merging.
