class BallotService {
  constructor() {
    this.pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
  }

  async getUpcoming(lang = 'de') {
    const res = await fetch(`${this.pythonUrl}/api/initiatives/upcoming?lang=${lang}`);
    return res.json();
  }

  async getUpcomingContext(lang = 'de') {
    /**
     * Get comprehensive context for all upcoming votes.
     * Returns LLM-formatted text with full vote details.
     */
    const res = await fetch(`${this.pythonUrl}/api/initiatives/upcoming/context?lang=${lang}`);
    const data = await res.json();
    return data.context;
  }

  async getVote(voteId, lang = 'de') {
    const res = await fetch(`${this.pythonUrl}/api/initiatives/${voteId}?lang=${lang}`);
    return res.json();
  }

  async getVoteContext(voteId, lang = 'de') {
    /**
     * Get comprehensive context for a specific vote.
     * Returns LLM-formatted text with full vote details.
     */
    const res = await fetch(`${this.pythonUrl}/api/initiatives/${voteId}/context?lang=${lang}`);
    const data = await res.json();
    return data.context;
  }

  async search(keyword, includeHistorical = false) {
    const res = await fetch(
      `${this.pythonUrl}/api/initiatives/search?q=${encodeURIComponent(keyword)}&historical=${includeHistorical}`
    );
    return res.json();
  }

  async getHistorical(year = null, type = null, lang = 'de') {
    /**
     * Get historical votes with optional filtering.
     * @param year - Filter by year (e.g., 2024)
     * @param type - Filter by rechtsform (3=Volksinitiative)
     */
    let url = `${this.pythonUrl}/api/initiatives/historical?lang=${lang}`;
    if (year) url += `&year=${year}`;
    if (type) url += `&type=${type}`;
    const res = await fetch(url);
    return res.json();
  }

  async refreshCache() {
    const res = await fetch(`${this.pythonUrl}/api/cache/refresh`, { method: 'POST' });
    return res.json();
  }

  formatForContext(voteData, lang) {
    const { vote, brochure } = voteData;
    return `
Abstimmung: ${vote.title_de || vote.schlagwort}
Datum: ${vote.abstimmungsdatum}

${brochure}

Positionen:
- Bundesrat: ${vote.position_bundesrat || 'N/A'}
- Parteien: ${vote.parteiparolen ? vote.parteiparolen.join(', ') : 'N/A'}
    `.trim();
  }
}

export default new BallotService();
