# Swiss Ballot Chatbot Study

A research prototype for studying trust factors in civic AI, specifically examining what makes citizens willing to donate data to train open-source AI models.

## Project Overview

This project implements a 2x2 factorial experimental design to study the effects of transparency and user control on data donation behavior in a Swiss voting information chatbot context.

### Research Design

**Hypotheses:**
- H1: Data Nutrition Label increases donation (transparency)
- H2: Granular Dashboard increases donation (control)
- H3: Combined effect is synergistic

**Experimental Conditions:**
| Condition | Transparency | Control | Shows DNL | Shows Dashboard |
|-----------|--------------|---------|-----------|-----------------|
| A         | Low          | Low     | No        | No              |
| B         | High         | Low     | Yes       | No              |
| C         | Low          | High    | No        | Yes             |
| D         | High         | High    | Yes       | Yes             |

**Sample:** N=200 (50 per condition) across 4 languages (DE/FR/IT/EN)

## Project Structure

```
chatbot-study/
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express API server
├── python-service/    # Flask wrapper for Swiss voting tools
├── database/          # PostgreSQL schema and migrations
├── analysis/          # Statistical analysis scripts (Jupyter notebooks)
├── ai-testing/        # AI persona testing framework
├── docs/              # Technical documentation
├── scripts/           # Deployment and utility scripts
└── servers/           # Server configurations
```

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS
- react-i18next (multi-language: DE/FR/IT/EN)

**Backend:**
- Node.js + Express
- PostgreSQL (database)
- Axios, UUID, CORS

**Python Service:**
- Flask + Flask-CORS
- Pandas, BeautifulSoup4, pdfplumber
- Swiss voting data tools

**AI:**
- Apertus (Swiss open-source LLM by EPFL/ETH/CSCS)
- Infomaniak API

**Hosting:**
- Frontend: Lovable → ailights.org
- Backend: Infomaniak Jelastic
- Database: Infomaniak PostgreSQL

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
cp .env.example .env  # Configure environment variables
npm install
npm run dev
```

### Python Service
```bash
cd python-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python swiss_voting_api.py
```

### Testing
```bash
# Local testing
./test-locally.sh

# Production testing
./test-production.sh
```

## Documentation

### Core Documentation (`docs/`)

| File | Description |
|------|-------------|
| [00_START_HERE.md](docs/00_START_HERE.md) | Quick overview, setup phases, key decisions |
| [01_ARCHITECTURE.md](docs/01_ARCHITECTURE.md) | System design, data flow, experimental design |
| [02_BACKEND.md](docs/02_BACKEND.md) | Backend implementation, API endpoints, database schema |
| [03_FRONTEND.md](docs/03_FRONTEND.md) | React components, hooks, experimental conditions |
| [04_DEPLOYMENT.md](docs/04_DEPLOYMENT.md) | Deployment guide for Infomaniak Jelastic |
| [05_TRANSLATIONS.md](docs/05_TRANSLATIONS.md) | Complete translation files (DE/FR/IT/EN) |
| [05_USER_JOURNEY.md](docs/05_USER_JOURNEY.md) | Complete participant flow, all screens and questions |
| [ai-user-research-concept.md](docs/ai-user-research-concept.md) | AI user research methodology |

### Reference Data (`docs/`)

| Folder | Contents |
|--------|----------|
| [Infomaniak/](docs/Infomaniak/) | API documentation, available models |
| [Swissvotes/](docs/Swissvotes/) | Swissvotes dataset, codebook, sources |

### Component Documentation

| File | Description |
|------|-------------|
| [frontend/FRONTEND_README.md](frontend/FRONTEND_README.md) | Frontend-specific documentation |
| [frontend/DEVELOPMENT.md](frontend/DEVELOPMENT.md) | Frontend development guide |
| [database/CONFIG_SCHEMA.md](database/CONFIG_SCHEMA.md) | Database schema documentation |
| [analysis/MEASUREMENT_PLAN.md](analysis/MEASUREMENT_PLAN.md) | Statistical analysis plan |
| [ai-testing/README.md](ai-testing/README.md) | AI testing framework documentation |

## Analysis

The `analysis/` folder contains Jupyter notebooks for statistical analysis:

- `phase1_descriptive_statistics.ipynb` - Descriptive statistics
- `phase2_chi_square_analysis.ipynb` - Chi-square analysis
- `phase3_logistic_regression.ipynb` - Logistic regression (primary analysis)

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy-frontend.sh` | Deploy frontend to production |
| `scripts/deploy-analysis-only.sh` | Deploy analysis files only |
| `scripts/test-locally.sh` | Run local tests |
| `scripts/test-production.sh` | Run production tests |

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql://...
APERTUS_API_KEY=...
PYTHON_SERVICE_URL=http://localhost:5000
```

### Frontend (`.env.production`)
```
VITE_API_URL=https://your-backend-url
```

## Research Context

This prototype supports bachelor thesis research:
- **Topic:** Trust factors in civic AI
- **Question:** What makes citizens willing to donate data?
- **Method:** 2x2 experimental design (transparency x control)
- **Context:** Swiss voting information chatbot
- **Institution:** Digital Business University of Applied Sciences
- **Supervisor:** Prof. Daniel Ambach

## Contact

- Sabine Wildemann
- Email: hello@ailights.org
- Institution: DBU Digital Business University of Applied Sciences
