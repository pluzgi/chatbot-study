# AI User Testing

Automated AI-based user research testing for the Swiss Ballot Chatbot Study.

## Overview

This module simulates ~1,000 AI participants completing the full survey flow based on 12 defined personas across 4 behavioral clusters.

## Setup

```bash
cd ai-testing
npm install
cp .env.example .env
# Edit .env with your API keys
```

## Usage

```bash
# Run 50 test participants (default)
npm run test

# Run with custom settings
npm run test -- --participants=100 --concurrency=5

# Dry run (no API calls)
npm run dry-run -- --participants=1000

# Show persona statistics
npm run stats

# Generate report for previous run
npm run report -- --report=<run-id>
```

## Personas

12 core personas across 4 behavioral clusters:

| Cluster | Description | Donation Tendency |
|---------|-------------|-------------------|
| **A** | High civic / Low privacy | Donation-prone (65%) |
| **B** | High civic / High privacy | Control-seeking (40%) |
| **C** | Low civic / High privacy | Decline-prone (20%) |
| **D** | Low civic / Low privacy | Indifferent (45%) |

### Cluster A Personas
- **A1_civic_optimist**: Engaged citizen, trusts institutions
- **A2_young_idealist**: First-time voter, excited about participation
- **A3_community_elder**: Retired, strong civic traditions

### Cluster B Personas
- **B1_privacy_advocate**: Tech-savvy, values data control
- **B2_informed_skeptic**: Well-educated, questions but engages
- **B3_careful_parent**: Family-oriented, concerned about data legacy

### Cluster C Personas
- **C1_distrustful_avoider**: Highly skeptical of institutions
- **C2_overwhelmed_worker**: Busy, little time for civic engagement
- **C3_cynical_observer**: Disenchanted with politics

### Cluster D Personas
- **D1_passive_compliant**: Goes along without strong opinions
- **D2_disengaged_youth**: Low political interest
- **D3_busy_pragmatist**: Treats voting as checkbox task

## Language Distribution

Follows Swiss demographics:
- German (de): 63%
- French (fr): 23%
- Italian (it): 8%
- Romansh (rm): 6%

## Output

Results are saved to `results/run-<id>/` with individual logs per participant.
