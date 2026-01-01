import axios from 'axios';
import { Persona, ChatMessage } from './types.js';

/**
 * Question generator for AI personas using Infomaniak LLM.
 * Generates natural, varied questions based on persona behavioral traits.
 * Uses the same Infomaniak LLM API as the main chatbot.
 */
export class QuestionGenerator {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.INFOMANIAK_ENDPOINT || '';
    this.apiKey = process.env.INFOMANIAK_API_KEY || '';
    this.model = process.env.INFOMANIAK_MODEL || 'swiss-ai/Apertus-70B-Instruct-2509';

    if (!this.baseUrl || !this.apiKey) {
      console.warn('WARNING: Infomaniak API credentials not set. Questions will use fallback templates.');
    }
  }

  /**
   * Generate a chat question using Apertus LLM based on persona traits
   */
  async generateChatQuestion(
    persona: Persona,
    history: ChatMessage[],
    questionIndex: number
  ): Promise<string> {
    const topic = persona.interactionStyle.topics[questionIndex] || 'Swiss ballot initiatives';
    const tone = persona.interactionStyle.tone;
    const lang = persona.demographics.language;
    const d = persona.behavioralDrivers;

    // If no API credentials, use fallback
    if (!this.baseUrl || !this.apiKey) {
      return this.getFallbackQuestion(topic, tone, lang);
    }

    const languageNames: Record<string, string> = {
      de: 'German',
      fr: 'French',
      it: 'Italian',
      rm: 'Romansh'
    };

    const systemPrompt = `You are generating a realistic question that a Swiss citizen would ask a voting chatbot.
Generate ONE short question (1-2 sentences) in ${languageNames[lang] || 'German'}.
Output ONLY the question, nothing else.`;

    const userPrompt = `Generate a question about "${topic}" for a Swiss ballot chatbot.

Person characteristics (shape the question style):
- Voting familiarity: ${d.ballot_familiarity}/7 ${d.ballot_familiarity <= 3 ? '(beginner, may ask basic questions)' : '(experienced)'}
- Privacy concern: ${d.privacy_concern}/7 ${d.privacy_concern >= 5 ? '(may ask about data handling)' : ''}
- Tone: ${tone}
- AI/tech comfort: ${d.ai_literacy}/7

${history.length > 0 ? `Previous exchange:\n${history.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nAsk a follow-up or new question.` : 'This is the first question.'}

Write ONE natural question in ${languageNames[lang] || 'German'}.`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const question = response.data.choices[0]?.message?.content?.trim();
      return question || this.getFallbackQuestion(topic, tone, lang);

    } catch (error: any) {
      console.error('[QuestionGenerator] LLM API error:', error.message);
      return this.getFallbackQuestion(topic, tone, lang);
    }
  }

  /**
   * Fallback questions if LLM API fails
   */
  private getFallbackQuestion(topic: string, tone: string, lang: string): string {
    const fallbacks: Record<string, Record<string, string>> = {
      de: {
        formal: 'Können Sie mir Informationen zu den aktuellen Abstimmungsvorlagen geben?',
        casual: 'Was wird gerade abgestimmt?',
        skeptical: 'Wie neutral sind die Informationen hier wirklich?',
        curious: 'Was gibt es Interessantes zu den Abstimmungen?'
      },
      fr: {
        formal: 'Pouvez-vous me donner des informations sur les votations actuelles?',
        casual: 'Qu\'est-ce qu\'on vote en ce moment?',
        skeptical: 'Ces informations sont-elles vraiment neutres?',
        curious: 'Quels sujets intéressants sont soumis au vote?'
      },
      it: {
        formal: 'Può darmi informazioni sulle votazioni attuali?',
        casual: 'Cosa si vota in questo momento?',
        skeptical: 'Queste informazioni sono davvero neutrali?',
        curious: 'Quali sono gli argomenti di voto interessanti?'
      },
      rm: {
        formal: 'Pudais Vus dar infurmaziuns davart las votaziuns actualas?',
        casual: 'Tge vegn votà actualmain?',
        skeptical: 'Èn questas infurmaziuns propi neutralas?',
        curious: 'Tge temas interessants vegnan votads?'
      }
    };

    const langFallbacks = fallbacks[lang] || fallbacks.de;
    return langFallbacks[tone] || langFallbacks.formal;
  }
}

/**
 * Feedback generator for AI personas using Infomaniak LLM.
 * Generates natural open-ended feedback in the persona's language.
 */
export class FeedbackGenerator {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.INFOMANIAK_ENDPOINT || '';
    this.apiKey = process.env.INFOMANIAK_API_KEY || '';
    this.model = process.env.INFOMANIAK_MODEL || 'swiss-ai/Apertus-70B-Instruct-2509';
  }

  /**
   * Generate open-ended feedback using Infomaniak LLM based on persona traits
   */
  async generateFeedback(persona: Persona, donated: boolean): Promise<string> {
    const lang = persona.demographics.language;
    const cluster = persona.cluster;
    const d = persona.behavioralDrivers;

    // 30% chance of empty feedback (realistic)
    if (Math.random() < 0.3) {
      return '';
    }

    // If no API credentials, use fallback
    if (!this.baseUrl || !this.apiKey) {
      return this.getFallbackFeedback(cluster, lang);
    }

    const languageNames: Record<string, string> = {
      de: 'German',
      fr: 'French',
      it: 'Italian',
      rm: 'Romansh'
    };

    const clusterDescriptions: Record<string, string> = {
      A: 'trusting, civic-minded, supportive of research',
      B: 'privacy-conscious but engaged, values transparency and control',
      C: 'skeptical, distrustful, concerned about data misuse',
      D: 'indifferent, pragmatic, not strongly opinionated'
    };

    const systemPrompt = `You are generating realistic feedback that a Swiss citizen would write after using a voting chatbot.
Write ONE short feedback comment (1-2 sentences) in ${languageNames[lang] || 'German'}.
Output ONLY the feedback text, nothing else. Keep it natural and brief.`;

    const userPrompt = `Generate feedback for a Swiss voting chatbot study.

Person profile:
- Attitude: ${clusterDescriptions[cluster] || 'neutral'}
- Privacy concern: ${d.privacy_concern}/7
- Trust in institutions: ${d.institutional_trust}/7
- Decision: ${donated ? 'chose to donate data' : 'declined to donate data'}

Write ONE short, natural feedback comment in ${languageNames[lang] || 'German'}.
Match the tone to their attitude (${cluster === 'A' ? 'positive' : cluster === 'B' ? 'constructive' : cluster === 'C' ? 'critical' : 'neutral'}).`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const feedback = response.data.choices[0]?.message?.content?.trim();
      return feedback || '';

    } catch (error: any) {
      console.error('[FeedbackGenerator] LLM API error:', error.message);
      return this.getFallbackFeedback(cluster, lang);
    }
  }

  /**
   * Fallback feedback if LLM API fails
   */
  private getFallbackFeedback(cluster: string, lang: string): string {
    const fallbacks: Record<string, Record<string, string[]>> = {
      de: {
        A: ['Gute Initiative für die demokratische Teilhabe.', 'Klarer und unkomplizierter Prozess.', ''],
        B: ['Die Transparenz über die Datennutzung war hilfreich.', 'Mehr Kontrolle über die Datenspeicherung wäre wünschenswert.', ''],
        C: ['Ich bin mir nicht sicher, wer davon profitiert.', 'Bedenken bezüglich der Datennutzung.', ''],
        D: ['Interessantes Konzept.', 'Schnell und einfach.', '']
      },
      fr: {
        A: ['Bonne initiative pour la participation démocratique.', 'Processus clair et simple.', ''],
        B: ['La transparence sur l\'utilisation des données était utile.', 'Plus de contrôle sur la rétention des données serait souhaitable.', ''],
        C: ['Je ne suis pas sûr de qui en bénéficie.', 'Préoccupations concernant l\'utilisation des données.', ''],
        D: ['Concept intéressant.', 'Rapide et facile.', '']
      },
      it: {
        A: ['Buona iniziativa per la partecipazione democratica.', 'Processo chiaro e semplice.', ''],
        B: ['La trasparenza sull\'uso dei dati è stata utile.', 'Sarebbe auspicabile più controllo sulla conservazione dei dati.', ''],
        C: ['Non sono sicuro di chi ne beneficia.', 'Preoccupazioni sull\'uso dei dati.', ''],
        D: ['Concetto interessante.', 'Veloce e facile.', '']
      },
      rm: {
        A: ['Buna iniziativa per la participaziun democratica.', 'Process cler e simpel.', ''],
        B: ['La transparenza davart l\'utilisaziun da las datas era utila.', 'Dapli controlla sur la retentiun da datas fiss giavischabel.', ''],
        C: ['Jau n\'sun betg segir, tgi che profitescha da quai.', 'Preoccupaziuns areguard l\'utilisaziun da las datas.', ''],
        D: ['Concept interessant.', 'Svelt e simpel.', '']
      }
    };

    const langFallbacks = fallbacks[lang] || fallbacks.de;
    const clusterFallbacks = langFallbacks[cluster] || langFallbacks.D;
    return clusterFallbacks[Math.floor(Math.random() * clusterFallbacks.length)];
  }
}
