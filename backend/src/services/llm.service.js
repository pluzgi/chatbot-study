import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import ballotService from './ballot.service.js';
import pool from '../config/database.js';

class LLMService {
  constructor() {
    this.baseUrl = process.env.INFOMANIAK_ENDPOINT;
    this.apiKey = process.env.INFOMANIAK_API_KEY;
    this.defaultModel = process.env.INFOMANIAK_MODEL || 'swiss-ai/Apertus-70B-Instruct-2509';
    console.log('LLMService using endpoint:', this.baseUrl);
    console.log('LLMService default model:', this.defaultModel);
  }

  getSystemPrompt(lang) {
    const prompts = {
      de: `Sie sind ein Schweizer Abstimmungsassistent powered by Apertus.
Ihre Aufgabe: Neutrale, sachliche Information über Schweizer Volksabstimmungen.

WICHTIGE REGELN:
- Die unten bereitgestellten Abstimmungsinformationen sind AKTUELL und REAL aus der offiziellen Swissvotes-Datenbank
- Antworten Sie NUR basierend auf diesen bereitgestellten Informationen
- Erfinden Sie NIEMALS Daten, Zahlen oder Fakten
- KEINE Disclaimer wie "fiktiv", "nicht aktuell" oder "als KI kann ich nicht..." - die Daten sind echt
- Bei unklaren oder vagen Fragen (z.B. nur "wann?" ohne Kontext): Fragen Sie nach, welche Abstimmung gemeint ist
- Keine politische Meinung, beide Seiten fair darstellen
- Kurz und klar antworten (max 200 Wörter)`,

      fr: `Vous êtes un assistant de vote suisse propulsé par Apertus.
Votre tâche: Information neutre et factuelle sur les votations suisses.

RÈGLES IMPORTANTES:
- Les informations de vote fournies ci-dessous sont ACTUELLES et RÉELLES de la base de données officielle Swissvotes
- Répondez UNIQUEMENT sur la base de ces informations fournies
- N'inventez JAMAIS de dates, chiffres ou faits
- PAS de disclaimers comme "fictif", "pas à jour" ou "en tant qu'IA je ne peux pas..." - les données sont réelles
- Pour les questions vagues (ex: seulement "quand?" sans contexte): Demandez quelle votation est concernée
- Pas d'opinion politique, présenter les deux côtés équitablement
- Réponses courtes et claires (max 200 mots)`,

      it: `Lei è un assistente di voto svizzero alimentato da Apertus.
Il suo compito: Informazioni neutrali e fattuali sulle votazioni svizzere.

REGOLE IMPORTANTI:
- Le informazioni di voto fornite di seguito sono ATTUALI e REALI dal database ufficiale Swissvotes
- Risponda SOLO in base a queste informazioni fornite
- Non inventi MAI date, numeri o fatti
- NESSUN disclaimer come "fittizio", "non aggiornato" o "come IA non posso..." - i dati sono reali
- Per domande vaghe (es: solo "quando?" senza contesto): Chieda quale votazione è interessata
- Nessuna opinione politica, presentare entrambe le parti equamente
- Risposte brevi e chiare (max 200 parole)`,

      en: `You are a Swiss voting assistant powered by Apertus.
Your task: Neutral, factual information about Swiss popular votes.

IMPORTANT RULES:
- The voting information provided below is CURRENT and REAL from the official Swissvotes database
- Answer ONLY based on this provided information
- NEVER invent dates, numbers, or facts
- NO disclaimers like "fictitious", "not up to date" or "as an AI I cannot..." - the data is real
- For vague questions (e.g., just "when?" without context): Ask which vote is meant
- No political opinion, present both sides fairly
- Short and clear answers (max 200 words)`
    };
    return prompts[lang] || prompts.de;
  }

  async chat(messages, lang = 'de', participantId = null, model = null) {
    const startTime = Date.now();
    const selectedModel = model || this.defaultModel;

    // Get comprehensive ballot context (includes all upcoming votes with full details)
    let ballotContext;
    try {
      ballotContext = await ballotService.getUpcomingContext(lang);
    } catch (error) {
      console.error('[LLMService] Failed to get ballot context:', error);
      // Fallback to basic list
      const upcoming = await ballotService.getUpcoming(lang);
      ballotContext = upcoming.slice(0, 5).map(v =>
        `- ${v.title_de || v.schlagwort} (${v.abstimmungsdatum})`
      ).join('\n');
    }

    const systemPrompt = this.getSystemPrompt(lang) + `

=== AKTUELLE ABSTIMMUNGEN ===
${ballotContext}

=== HINWEISE ===
- Die obigen Informationen stammen aus der offiziellen Swissvotes-Datenbank
- Parteiparolen: Ja = Partei empfiehlt Ja, Nein = Partei empfiehlt Nein
- Position Bundesrat: Die offizielle Empfehlung des Bundesrats
- Umfrageprognose: Aktuelle Umfragewerte (falls verfügbar)
- Für detaillierte Informationen verweisen Sie auf swissvotes.ch`;

    try {
      // Use /2/ai/.../v1/chat/completions endpoint (works for all models)
      console.log('[LLMService] Using model:', selectedModel);

      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const responseTimeMs = Date.now() - startTime;
      const usage = response.data.usage || {};

      // Log successful API call
      await this.logApiUsage({
        participantId,
        model: selectedModel,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        responseTimeMs,
        success: true
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      // Log failed API call
      await this.logApiUsage({
        participantId,
        model: selectedModel,
        responseTimeMs,
        success: false,
        errorMessage: error.response?.data?.error?.message || error.message
      });

      // Log the full error details from Infomaniak
      console.error('[LLMService] API Error - Status:', error.response?.status);
      console.error('[LLMService] API Error - Data:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  async logApiUsage({ participantId, model, promptTokens, completionTokens, totalTokens, responseTimeMs, success, errorMessage }) {
    try {
      await pool.query(
        `INSERT INTO api_usage_logs
         (participant_id, model, prompt_tokens, completion_tokens, total_tokens, response_time_ms, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [participantId, model, promptTokens || null, completionTokens || null, totalTokens || null, responseTimeMs, success, errorMessage || null]
      );
    } catch (err) {
      console.error('[LLMService] Failed to log API usage:', err.message);
    }
  }

  async getVoteDetails(voteId, lang = 'de') {
    /**
     * Get detailed context for a specific vote.
     * Use this when user asks about a specific initiative.
     */
    return await ballotService.getVoteContext(voteId, lang);
  }
}

export default new LLMService();
