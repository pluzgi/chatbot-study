import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import ballotService from './ballot.service.js';

class ApertusService {
  constructor() {
    this.baseUrl = process.env.INFOMANIAK_APERTUS_ENDPOINT;
    this.apiKey = process.env.INFOMANIAK_API_KEY;
    console.log('ApertusService using endpoint:', this.baseUrl);
  }

  getSystemPrompt(lang) {
    const prompts = {
      de: `Sie sind ein Schweizer Abstimmungsassistent powered by Apertus.
Ihre Aufgabe: Neutrale, sachliche Information über Schweizer Volksabstimmungen.
- Keine politische Meinung
- Beide Seiten fair darstellen
- Quellen nennen wenn möglich
- Kurz und klar antworten (max 200 Wörter)`,

      fr: `Vous êtes un assistant de vote suisse propulsé par Apertus.
Votre tâche: Information neutre et factuelle sur les votations suisses.
- Pas d'opinion politique
- Présenter les deux côtés équitablement
- Citer les sources si possible
- Réponses courtes et claires (max 200 mots)`,

      it: `Lei è un assistente di voto svizzero alimentato da Apertus.
Il suo compito: Informazioni neutrali e fattuali sulle votazioni svizzere.
- Nessuna opinione politica
- Presentare entrambe le parti equamente
- Citare le fonti se possibile
- Risposte brevi e chiare (max 200 parole)`,

      en: `You are a Swiss voting assistant powered by Apertus.
Your task: Neutral, factual information about Swiss popular votes.
- No political opinion
- Present both sides fairly
- Cite sources when possible
- Short and clear answers (max 200 words)`
    };
    return prompts[lang] || prompts.de;
  }

  async chat(messages, lang = 'de') {
    // Get comprehensive ballot context (includes all upcoming votes with full details)
    let ballotContext;
    try {
      ballotContext = await ballotService.getUpcomingContext(lang);
    } catch (error) {
      console.error('[ApertusService] Failed to get ballot context:', error);
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
      // Use /2/ API endpoint with /v1/ path for beta models like Apertus
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: "swiss-ai/Apertus-70B-Instruct-2509",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      // Log the full error details from Infomaniak
      console.error('[ApertusService] API Error:', {
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2)
      });
      throw error;
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

export default new ApertusService();
