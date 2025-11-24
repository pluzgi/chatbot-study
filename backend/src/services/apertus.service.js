import axios from 'axios';
import ballotService from './ballot.service.js';

class ApertusService {
  constructor() {
    this.baseUrl = process.env.INFOMANIAK_APERTUS_ENDPOINT;
    this.apiKey = process.env.INFOMANIAK_API_KEY;
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
    // Enrich with ballot context
    const upcoming = await ballotService.getUpcoming();
    const ballotContext = upcoming.slice(0, 3).map(v =>
      `- ${v.title_de || v.schlagwort} (${v.abstimmungsdatum})`
    ).join('\n');

    const systemPrompt = this.getSystemPrompt(lang) + `

Aktuelle Abstimmungen:
${ballotContext}`;

    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model: "apertus-8b-instruct",
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
        timeout: 15000
      }
    );

    return response.data.choices[0].message.content;
  }
}

export default new ApertusService();
