import axios from 'axios';
import { Persona, ChatMessage } from './types.js';

/**
 * Question generator for AI personas using Apertus LLM.
 * Generates natural, varied questions based on persona behavioral traits.
 * Uses the same Infomaniak Apertus API as the main chatbot.
 */
export class QuestionGenerator {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.INFOMANIAK_APERTUS_ENDPOINT || '';
    this.apiKey = process.env.INFOMANIAK_API_KEY || '';

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
          model: 'swiss-ai/Apertus-70B-Instruct-2509',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
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
      console.error('[QuestionGenerator] Apertus API error:', error.message);
      return this.getFallbackQuestion(topic, tone, lang);
    }
  }

  /**
   * Fallback questions if Apertus API fails
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
