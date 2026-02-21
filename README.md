# Trust by Context, Not by Design?

A Quantitative Study of Data Donation Willingness for Open-Source Civic AI in Switzerland

## Project Overview

This project implements a 2x2 factorial experimental design to study the effects of transparency and user control on data donation behavior in a Swiss ballot information chatbot context.

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

**Sample:** N=205 (final analytic sample) across 4 languages (DE/FR/IT/EN)

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
- Frontend: Infomaniak Jelastic (chat-study.ailights.org)
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
| [frontend/DEVELOPMENT.md](frontend/DEVELOPMENT.md) | Frontend development guide |
| [database/CONFIG_SCHEMA.md](database/CONFIG_SCHEMA.md) | Database schema documentation |
| [analysis/MEASUREMENT_PLAN.md](analysis/MEASUREMENT_PLAN.md) | Statistical analysis plan |
| [ai-testing/README.md](ai-testing/README.md) | AI testing framework documentation |

## Live Study

> **Note:** The live URLs below were active during the data collection period (January–February 2026) and may no longer be available. All analysis results are preserved as HTML files in `frontend/dist/results/` and can be viewed locally by opening them in a browser.

**Study URL:** https://chat-study.ailights.org/

**Survey Navigator (debug mode):** https://chat-study.ailights.org/?debug=survey&key=apertus

## Analysis

The `analysis/` folder contains Jupyter notebooks for statistical analysis:

- `phase1_descriptive_statistics.ipynb` - Sample characteristics and response distributions
- `phase2_chi_square_analysis.ipynb` - Chi-square tests for donation rates across conditions
- `phase3_logistic_regression.ipynb` - Logistic regression models (primary hypothesis testing)
- `phase4_effect_analysis.ipynb` - Effect sizes and confidence intervals
- `phase5_manipulation_checks.ipynb` - Validation of experimental manipulations
- `phase6_exploratory_analysis.ipynb` - Exploratory and secondary analyses
- `phase7_bayesian_robustness.ipynb` - Bayesian robustness checks (Bayes Factors)

Pre-rendered HTML versions of all notebooks are available in `frontend/dist/results/` for viewing without running the code.

## Research Context

This prototype supports the bachelor thesis:
- **Title:** Trust by Context, Not by Design? A Quantitative Study of Data Donation Willingness for Open-Source Civic AI in Switzerland
- **Question:** What makes citizens willing to donate data?
- **Method:** 2x2 experimental design (transparency x control)
- **Context:** Swiss ballot information chatbot
- **Institution:** Digital Business University of Applied Sciences
- **Supervisors:** Prof. Daniel Ambach, Prof. David Lubeck

## Contact

- Sabine Wildemann
- Email: hello@ailights.org
- Institution: DBU Digital Business University of Applied Sciences
