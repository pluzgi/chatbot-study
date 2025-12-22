# Backend Implementation

## 1. Python Microservice (Your Existing Code)

### Wrap existing swiss_voting_tools in Flask API

**Create: swiss_voting_api.py**

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
from swiss_voting_tools import (
    get_upcoming_initiatives,
    get_vote_by_id,
    get_brochure_text,
    search_votes_by_keyword
)

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/initiatives/upcoming')
def upcoming():
    try:
        data = get_upcoming_initiatives()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<vote_id>')
def get_vote(vote_id):
    try:
        lang = request.args.get('lang', 'de')
        vote = get_vote_by_id(vote_id)
        brochure = get_brochure_text(vote_id, lang)
        return jsonify({
            'vote': vote,
            'brochure': brochure
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/search')
def search():
    try:
        keyword = request.args.get('q', '')
        results = search_votes_by_keyword(keyword)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Deploy to Jelastic:**
```bash
# SSH into Jelastic Python environment
pip install flask flask-cors
python swiss_voting_api.py &
# Or use PM2: pm2 start swiss_voting_api.py
```

---

## 2. Node.js Backend

### Project Structure
```
backend/
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── services/
│   │   ├── apertus.service.js
│   │   ├── ballot.service.js
│   │   └── experiment.service.js
│   ├── routes/
│   │   ├── chat.js
│   │   ├── experiment.js
│   │   └── donation.js
│   └── middleware/
│       └── cors.js
├── package.json
└── .env
```

### Environment Variables (.env)
```
# Infomaniak
INFOMANIAK_APERTUS_ENDPOINT=https://api.infomaniak.com/apertus
INFOMANIAK_API_KEY=your_api_key

# Python Service
PYTHON_SERVICE_URL=http://localhost:5000

# Database
DATABASE_HOST=postgresql.jelastic.infomaniak.com
DATABASE_PORT=5432
DATABASE_NAME=voting_assistant
DATABASE_USER=admin
DATABASE_PASSWORD=your_password

# CORS
FRONTEND_URL=https://ailights.org

# Server
PORT=3000
NODE_ENV=production
```

### package.json
```json
{
  "name": "swiss-voting-backend",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1"
  }
}
```

### src/index.js
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import experimentRoutes from './routes/experiment.js';
import donationRoutes from './routes/donation.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/experiment', experimentRoutes);
app.use('/api/donation', donationRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Backend running on port ${process.env.PORT || 3000}`);
});
```

### src/services/ballot.service.js
```javascript
class BallotService {
  constructor() {
    this.pythonUrl = process.env.PYTHON_SERVICE_URL;
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
Abstimmung: ${vote.title}
Datum: ${vote.date}

${brochure}

Positionen:
- Bundesrat: ${vote.federal_council_position}
- Parteien: ${vote.party_positions}
    `.trim();
  }
}

export default new BallotService();
```

### src/services/apertus.service.js
```javascript
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
      `- ${v.title} (${v.date})`
    ).join('\n');

    const systemPrompt = this.getSystemPrompt(lang) + `

Aktuelle Abstimmungen:
${ballotContext}`;

    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model: "Apertus-70B-Instruct-2509",
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
```

### src/services/experiment.service.js
```javascript
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class ExperimentService {
  async assignCondition() {
    // Block randomization
    const result = await pool.query(`
      SELECT condition, COUNT(*) as count 
      FROM participants 
      GROUP BY condition
    `);
    
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    result.rows.forEach(r => counts[r.condition] = parseInt(r.count));
    
    const minCount = Math.min(...Object.values(counts));
    const available = Object.keys(counts).filter(c => counts[c] === minCount);
    
    return available[Math.floor(Math.random() * available.length)];
  }

  getConditionConfig(condition) {
    return {
      A: { transparency: 'low', control: 'low', showDNL: false, showDashboard: false },
      B: { transparency: 'high', control: 'low', showDNL: true, showDashboard: false },
      C: { transparency: 'low', control: 'high', showDNL: false, showDashboard: true },
      D: { transparency: 'high', control: 'high', showDNL: true, showDashboard: true }
    }[condition];
  }

  async createParticipant(lang = 'de') {
    const sessionId = uuidv4();
    const condition = await this.assignCondition();
    
    const result = await pool.query(
      `INSERT INTO participants (id, session_id, condition, language, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [uuidv4(), sessionId, condition, lang]
    );
    
    return {
      participant: result.rows[0],
      config: this.getConditionConfig(condition)
    };
  }

  async recordDonation(participantId, decision, configuration = null) {
    // Donation stored directly in participants table (normalized design)
    await pool.query(
      `UPDATE participants
       SET donation_decision = $1,
           donation_config = $2,
           decision_at = NOW(),
           current_phase = 'survey'
       WHERE id = $3`,
      [decision, configuration ? JSON.stringify(configuration) : null, participantId]
    );
  }
}

export default new ExperimentService();
```

### src/routes/chat.js
```javascript
import express from 'express';
import apertusService from '../services/apertus.service.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { participantId, message, conversationHistory, language } = req.body;
    
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    
    const response = await apertusService.chat(messages, language || 'de');
    
    // Log interaction (implement if needed)
    
    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
```

### src/routes/experiment.js
```javascript
import express from 'express';
import experimentService from '../services/experiment.service.js';

const router = express.Router();

router.post('/initialize', async (req, res) => {
  try {
    const { language } = req.body;
    const { participant, config } = await experimentService.createParticipant(language);
    
    res.json({
      sessionId: participant.session_id,
      participantId: participant.id,
      condition: participant.condition,
      config
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: 'Failed to initialize' });
  }
});

export default router;
```

### src/routes/donation.js
```javascript
import express from 'express';
import experimentService from '../services/experiment.service.js';

const router = express.Router();

router.post('/decision', async (req, res) => {
  try {
    const { participantId, decision, configuration } = req.body;
    
    await experimentService.recordDonation(participantId, decision, configuration);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to record decision' });
  }
});

export default router;
```

---

## 3. Database Schema

See [database/CONFIG_SCHEMA.md](../database/CONFIG_SCHEMA.md) for complete database documentation.

**Summary:** Normalized 2-table design (participants, post_task_measures). Donation decision is stored directly in participants table. Schema is auto-created on backend startup via `migrate.js`.

---

## 4. Deployment (Infomaniak Jelastic)

### Python Service
```bash
# Create Python environment
# Upload code + requirements.txt
pip install -r requirements.txt
python swiss_voting_api.py &
```

### Node.js Backend
```bash
# Create Node.js environment
# Upload code
npm install
node src/index.js
# Or: pm2 start src/index.js --name voting-backend
```

### PostgreSQL
```bash
# Create PostgreSQL node
# Run schema migration
psql -h host -U user -d voting_assistant -f schema.sql
```
