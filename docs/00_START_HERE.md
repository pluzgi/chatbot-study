# Quick Start Guide

## What You're Building

A multi-language Swiss voting chatbot on **ailights.org/ballot-chat** that:
1. Uses Apertus 8B to answer questions about Swiss ballots
2. Tests 4 experimental conditions (transparency × control)
3. Measures willingness to donate data (simulated, not actual)
4. Collects data in German, French, Italian, and English

---

## Setup Steps

### 1. Python Microservice (1 day)
```bash
# Your existing swiss_voting_tools.py
# + New: swiss_voting_api.py (Flask wrapper)
# Deploy to Infomaniak Jelastic Python environment
```
**See:** 02_BACKEND.md (Section 1)

### 2. Backend API (2 days)
```bash
# Node.js + Express
# Services: Apertus, Ballot (calls Python), Experiment
# Deploy to Infomaniak Jelastic Node.js environment
```
**See:** 02_BACKEND.md (Sections 2-4)

### 3. Database (1 hour)
```sql
-- PostgreSQL on Infomaniak
-- 3 tables: participants, donation_decisions, post_task_measures
```
**See:** 02_BACKEND.md (Section 3)

### 4. Frontend (3 days)
```typescript
// React + TypeScript on Lovable
// Components: Chat, Donation Modal (4 variants), Survey
// i18next for multi-language
```
**See:** 03_FRONTEND.md

---

## Key Implementation Details

### Your Existing Code
**Keep 100%** - Your `swiss_voting_tools.py` functions are perfect.
Just wrap in Flask API (swiss_voting_api.py).

### Multi-Language
- **Frontend:** react-i18next with DE/FR/IT/EN translations
- **Backend:** System prompts per language
- **Data:** Your get_brochure_text() already supports multiple languages

### Experimental Design

| Condition | What User Sees |
|-----------|----------------|
| A | Generic text + Binary choice |
| B | Data Nutrition Label + Binary choice |
| C | Generic text + Dashboard |
| D | Data Nutrition Label + Dashboard |

### Data Collection (SIMULATED)
- User makes decision: "donate" or "decline"
- Decision recorded in database
- **NO actual chat data stored for training**
- User debriefed: "This was a simulation"

---

## File Overview

**Created for you:**

1. **01_ARCHITECTURE.md** - System overview, data flow, experimental design
2. **02_BACKEND.md** - Complete backend code (Python + Node.js)
3. **03_FRONTEND.md** - Complete React components (Lovable)
4. **04_DEPLOYMENT.md** - Step-by-step deployment & testing

---

## Quick Deploy Commands

### Python Service
```bash
pip install flask flask-cors
python swiss_voting_api.py &
```

### Node.js Backend
```bash
npm install
node src/index.js
```

### Database
```bash
psql -h host -U user -d voting_assistant -f schema.sql
```

### Frontend
```bash
# In Lovable: Upload files, set VITE_API_ENDPOINT, deploy
```

---

## URLs After Deployment

- **Study:** https://ailights.org/ballot-chat
- **Backend:** https://api.ailights.org (or .jelastic.infomaniak.com)
- **Python:** Internal only (called by Node.js)

---

## Testing Checklist

- [ ] Visit ailights.org/ballot-chat
- [ ] Select language → Start study
- [ ] Chat works (2+ questions)
- [ ] Donation modal appears (correct variant)
- [ ] Decision recorded in database
- [ ] Survey → Debriefing
- [ ] Test all 4 conditions
- [ ] Test all 4 languages

---

## Data Export for Analysis

```sql
SELECT 
  p.condition,
  dd.decision,
  dd.transparency_level,
  dd.control_level,
  p.language,
  ptm.transparency_perception,
  ptm.control_perception
FROM participants p
JOIN donation_decisions dd ON p.id = dd.participant_id
JOIN post_task_measures ptm ON p.id = ptm.participant_id;
```

Export to CSV → R/Python for logistic regression.

---

## Research Hypotheses

**H1:** Data Nutrition Label increases donation (T1 > T0)  
**H2:** Granular Dashboard increases donation (C1 > C0)  
**H3:** Combined effect is synergistic (T1×C1 > T1 + C1)

**Analysis:**
```r
model <- glm(donation ~ transparency * control + language, 
             data = data, family = binomial)
summary(model)
```

---

## Need Help?

**Technical Issues:**
- Infomaniak Support: support@infomaniak.com
- Apertus API: Check with Infomaniak

**Questions About Code:**
- Backend: See 02_BACKEND.md
- Frontend: See 03_FRONTEND.md
- Deployment: See 04_DEPLOYMENT.md

---

## Critical Success Factors

1. **Keep your Python code** - It's your competitive advantage
2. **Test with real users** - Pilot with 10-20 before full launch
3. **Monitor condition balance** - Check database regularly
4. **Clear debriefing** - Users must know donation was simulated
5. **Multi-language** - Essential for representative Swiss sample

---

## Timeline Estimate

- **Week 1:** Backend (Python wrapper + Node.js + DB)
- **Week 2:** Frontend (React + i18next + experimental conditions)
- **Week 3:** Testing + refinements
- **Week 4:** Pilot study (10-20 participants)
- **Week 5+:** Data collection (target N=200)

---

## You're Ready! 🚀

Start with 02_BACKEND.md → Build Python wrapper → Deploy backend → Build frontend.

All code is production-ready. Copy, adapt, deploy.
