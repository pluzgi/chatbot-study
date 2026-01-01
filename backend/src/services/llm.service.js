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
Aktuelles Jahr: 2026

KRITISCH - BEFOLGEN SIE DIESE REGELN STRIKT:
1. Antworten Sie IMMER auf DEUTSCH - niemals auf Englisch oder einer anderen Sprache
2. Die Abstimmungsdaten unten stammen LIVE aus der offiziellen Swissvotes-Datenbank - sie sind 100% REAL und AKTUELL
3. Antworten Sie direkt und sachlich basierend auf diesen Daten
4. VERBOTEN: Sätze wie "Dies sind fiktive Daten", "Als KI habe ich keinen Zugang", "Die Daten könnten veraltet sein", "Bitte überprüfen Sie auf offiziellen Quellen"
5. Die Daten sind ECHT - behandeln Sie sie als Fakten, nicht als Beispiele
6. Bei vagen Fragen: Fragen Sie nach, welche Abstimmung gemeint ist
7. Neutral bleiben, beide Seiten fair darstellen
8. Kurz antworten (max 200 Wörter)`,

      fr: `Vous êtes un assistant de vote suisse propulsé par Apertus.
Votre tâche: Information neutre et factuelle sur les votations suisses.
Année actuelle: 2026

CRITIQUE - SUIVEZ CES RÈGLES STRICTEMENT:
1. Répondez TOUJOURS en FRANÇAIS - jamais en anglais ou dans une autre langue
2. Les données de vote ci-dessous proviennent EN DIRECT de la base de données officielle Swissvotes - elles sont 100% RÉELLES et ACTUELLES
3. Répondez directement et factuellement sur la base de ces données
4. INTERDIT: Phrases comme "Ce sont des données fictives", "En tant qu'IA je n'ai pas accès", "Les données pourraient être obsolètes", "Veuillez vérifier sur les sources officielles"
5. Les données sont RÉELLES - traitez-les comme des faits, pas comme des exemples
6. Pour les questions vagues: Demandez quelle votation est concernée
7. Rester neutre, présenter les deux côtés équitablement
8. Réponses courtes (max 200 mots)`,

      it: `Lei è un assistente di voto svizzero alimentato da Apertus.
Il suo compito: Informazioni neutrali e fattuali sulle votazioni svizzere.
Anno corrente: 2026

CRITICO - SEGUA QUESTE REGOLE RIGOROSAMENTE:
1. Risponda SEMPRE in ITALIANO - mai in inglese o in un'altra lingua
2. I dati di voto sotto provengono IN DIRETTA dal database ufficiale Swissvotes - sono 100% REALI e ATTUALI
3. Risponda direttamente e fattualmente in base a questi dati
4. VIETATO: Frasi come "Questi sono dati fittizi", "Come IA non ho accesso", "I dati potrebbero essere obsoleti", "Si prega di verificare sulle fonti ufficiali"
5. I dati sono REALI - li tratti come fatti, non come esempi
6. Per domande vaghe: Chieda quale votazione è interessata
7. Rimanere neutrale, presentare entrambe le parti equamente
8. Risposte brevi (max 200 parole)`,

      en: `You are a Swiss voting assistant powered by Apertus.
Your task: Neutral, factual information about Swiss popular votes.
Current year: 2026

CRITICAL - FOLLOW THESE RULES STRICTLY:
1. ALWAYS respond in ENGLISH - never in German or any other language
2. The voting data below comes LIVE from the official Swissvotes database - it is 100% REAL and CURRENT
3. Answer directly and factually based on this data
4. FORBIDDEN: Phrases like "This is fictitious data", "As an AI I don't have access", "The data might be outdated", "Please verify on official sources"
5. The data is REAL - treat it as facts, not examples
6. For vague questions: Ask which vote is meant
7. Stay neutral, present both sides fairly
8. Short answers (max 200 words)`
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

    const contextSection = {
      de: `

=== AKTUELLE ABSTIMMUNGEN ===
${ballotContext}

=== HINWEISE ===
- Parteiparolen: Ja = Partei empfiehlt Ja, Nein = Partei empfiehlt Nein
- Position Bundesrat: Die offizielle Empfehlung des Bundesrats
- Für detaillierte Informationen verweisen Sie auf swissvotes.ch`,

      fr: `

=== VOTATIONS ACTUELLES ===
${ballotContext}

=== NOTES ===
- Mots d'ordre des partis: Oui = le parti recommande Oui, Non = le parti recommande Non
- Position du Conseil fédéral: La recommandation officielle du Conseil fédéral
- Pour des informations détaillées, consultez swissvotes.ch`,

      it: `

=== VOTAZIONI ATTUALI ===
${ballotContext}

=== NOTE ===
- Parole d'ordine dei partiti: Sì = il partito raccomanda Sì, No = il partito raccomanda No
- Posizione del Consiglio federale: La raccomandazione ufficiale del Consiglio federale
- Per informazioni dettagliate, consultare swissvotes.ch`,

      en: `

=== CURRENT VOTES ===
${ballotContext}

=== NOTES ===
- Party recommendations: Yes = party recommends Yes, No = party recommends No
- Federal Council position: The official recommendation of the Federal Council
- For detailed information, refer to swissvotes.ch`
    };

    const systemPrompt = this.getSystemPrompt(lang) + (contextSection[lang] || contextSection.de);

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
