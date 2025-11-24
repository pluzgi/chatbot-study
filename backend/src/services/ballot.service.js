class BallotService {
  constructor() {
    this.pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
  }

  async getUpcoming() {
    const res = await fetch(`${this.pythonUrl}/api/initiatives/upcoming`);
    return res.json();
  }

  async getVote(voteId, lang = 'de') {
    const res = await fetch(`${this.pythonUrl}/api/initiatives/${voteId}?lang=${lang}`);
    return res.json();
  }

  async search(keyword) {
    const res = await fetch(`${this.pythonUrl}/api/initiatives/search?q=${keyword}`);
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
