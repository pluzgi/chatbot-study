# Swiss Ballot Chatbot - Technical Architecture

## System Overview

```
User (chat-study.ailights.org)
           ↓
    React Frontend (Infomaniak Jelastic)
    • Chat interface
    • Donation modal (4 conditions)
    • Multi-language (DE/FR/IT/EN)
           ↓
    Express Backend (Infomaniak Jelastic)
    • Apertus integration
    • Experiment logic
    • Data collection
           ↓
    ┌──────────────┬─────────────────┐
    │              │                 │
Apertus-70B   Python Microservice   PostgreSQL
(Infomaniak)  (Your existing code) (Infomaniak)
```

---

## Technology Stack

**Frontend (Infomaniak Jelastic):**
- React + TypeScript
- react-i18next (multi-language)
- TailwindCSS
- Domain: chat-study.ailights.org

**Backend (Infomaniak Jelastic):**
- Node.js + Express
- PostgreSQL database
- Python Flask microservice (your existing swiss_voting_tools)

**AI:**
- Apertus-70B API (Infomaniak)

---

## Data Flow

### User Interaction Flow
1. User visits chat-study.ailights.org
2. System assigns experimental condition (A/B/C/D)
3. User chats with Apertus about Swiss ballots
4. After 2+ questions, donation modal appears
5. User makes decision (recorded, but NOT collected)
6. Post-task survey
7. Debriefing

### Technical Flow
```
User message
    → React captures input
    → POST /api/chat/message
    → Express enriches with ballot data (from Python service)
    → Sends to Apertus-70B
    → Returns response
    → Logs interaction
```

---

## Experimental Design

### 2×2 Factorial Design

| Condition | Transparency | Control | Shows |
|-----------|--------------|---------|-------|
| A (Baseline) | Low (T0) | Low (C0) | Generic text + Binary |
| B (Transparency) | High (T1) | Low (C0) | Data Nutrition Label + Binary |
| C (Agency) | Low (T0) | High (C1) | Generic text + Dashboard |
| D (Trustworthy AI) | High (T1) | High (C1) | DNL + Dashboard |

**Random assignment:** Block randomization (balanced across conditions)

---

## Multi-Language Support

**Languages:** German (DE), French (FR), Italian (IT), English (EN)

**Implementation:**
- Frontend: react-i18next
- Backend: System prompts per language
- Ballot data: Your existing get_brochure_text(vote_id, lang)
- Database: Track user language

**Language detection:** Browser preference → User selection (language picker)

---

## Data Collection (Simulated)

**CRITICAL:** Study measures willingness, NOT actual donation.

**What's recorded:**
- ✅ User decision (donate/decline)
- ✅ Configuration (if condition C or D)
- ✅ Survey responses
- ✅ Interaction count

**What's NOT recorded:**
- ❌ Actual chat messages (not stored for training)
- ❌ Personal information
- ❌ Data sent to Apertus for training

**Debriefing:** Clear message that donation was simulated.

---

## Deployed Infrastructure

### URLs

| Service | URL |
|---------|-----|
| Frontend | https://chat-study.ailights.org |
| Backend API | https://thesis.jcloud-ver-jpe.ik-server.com |
| Python Service | http://thesis-python.jcloud-ver-jpe.ik-server.com (internal) |
| Database | 10.101.29.52:5432 (internal) |

### Jelastic Environments

| Environment | Type | Purpose |
|-------------|------|---------|
| `chat-study` | Apache PHP | Frontend hosting |
| `thesis` | Node.js | Backend API |
| `thesis-python` | Apache PHP | Python microservice |
| PostgreSQL node | PostgreSQL 16.4 | Database |
