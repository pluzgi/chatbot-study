# Documentation Package - Swiss Voting Assistant

## 📦 What's Included

**6 focused technical documents** (67KB total) for building your thesis prototype:

---

## 📄 Files Overview

### **[00_START_HERE.md](computer:///mnt/user-data/outputs/00_START_HERE.md)** (5KB)
**Read this first!**
- Quick overview of what you're building
- Setup steps (4 phases)
- Key decisions summary
- Testing checklist
- Research hypotheses

---

### **[01_ARCHITECTURE.md](computer:///mnt/user-data/outputs/01_ARCHITECTURE.md)** (3KB)
**System design**
- Architecture diagram
- Technology stack
- Data flow
- Experimental design (2×2 factorial)
- Multi-language approach
- Data collection (simulated)

---

### **[02_BACKEND.md](computer:///mnt/user-data/outputs/02_BACKEND.md)** (13KB)
**Complete backend implementation**
- Python microservice (Flask wrapper for your existing code)
- Node.js backend (Express + services)
- Database schema (PostgreSQL)
- All API endpoints with complete code
- Deployment instructions

**Key files provided:**
- `swiss_voting_api.py` - Wraps your existing tools
- `src/services/apertus.service.js` - Apertus integration
- `src/services/ballot.service.js` - Calls Python service
- `src/services/experiment.service.js` - Random assignment
- `src/routes/*.js` - API endpoints
- SQL schema

---

### **[03_FRONTEND.md](computer:///mnt/user-data/outputs/03_FRONTEND.md)** (20KB)
**Complete React implementation**
- Full project structure
- All components with complete code
- Hooks for chat and experiment
- Multi-language setup (i18next)
- 4 experimental conditions (A/B/C/D)
- Lovable deployment

**Key components provided:**
- `ChatInterface.tsx` - Main chat UI
- `DonationModal.tsx` - Experimental conditions
- `DataNutritionLabel.tsx` - Transparency condition
- `GranularDashboard.tsx` - Control condition
- `PostTaskSurvey.tsx` - Manipulation checks
- `Debriefing.tsx` - Study conclusion
- `LanguageSelector.tsx` - Language picker

---

### **[04_DEPLOYMENT.md](computer:///mnt/user-data/outputs/04_DEPLOYMENT.md)** (7KB)
**Step-by-step deployment**
- Infomaniak Jelastic setup
- Python service deployment
- Node.js backend deployment
- PostgreSQL configuration
- Lovable deployment to ailights.org/ballot-chat
- Testing checklist
- Troubleshooting guide
- Monitoring queries

---

### **[05_TRANSLATIONS.md](computer:///mnt/user-data/outputs/05_TRANSLATIONS.md)** (19KB)
**Complete translation files**
- German (de.json)
- French (fr.json)
- Italian (it.json)
- English (en.json)

All UI strings translated and ready to copy-paste.

---

## 🚀 How to Use This Documentation

### Phase 1: Understanding (1 hour)
1. Read **00_START_HERE.md** - Get the big picture
2. Skim **01_ARCHITECTURE.md** - Understand the system
3. Review your existing code compatibility

### Phase 2: Backend (2-3 days)
1. Follow **02_BACKEND.md** step-by-step
2. Create Flask wrapper for your Python tools
3. Build Node.js backend
4. Set up database
5. Deploy to Infomaniak

### Phase 3: Frontend (3-4 days)
1. Follow **03_FRONTEND.md**
2. Copy all components to Lovable
3. Use **05_TRANSLATIONS.md** for i18n files
4. Test locally
5. Deploy to ailights.org/ballot-chat

### Phase 4: Testing & Launch
1. Use **04_DEPLOYMENT.md** testing checklist
2. Test all 4 conditions
3. Test all 4 languages
4. Pilot with 10-20 users
5. Launch study

---

## 🎯 Key Features

### What Makes This Special

✅ **Reuses your existing code** - Your swiss_voting_tools.py stays intact  
✅ **Multi-language** - Full DE/FR/IT/EN support  
✅ **Production-ready code** - Copy-paste and deploy  
✅ **Experimental design** - 2×2 factorial built-in  
✅ **Data collection** - Simulated donation for ethics  
✅ **Domain-specific** - Configured for ailights.org  

---

## 📊 What Gets Built

### Frontend (ailights.org/ballot-chat)
- Landing page with language selector
- Chat interface powered by Apertus-70B
- 4 experimental conditions:
  - A: Baseline (generic text + binary)
  - B: Transparency (DNL + binary)
  - C: Agency (generic text + dashboard)
  - D: Trustworthy AI (DNL + dashboard)
- Post-task survey
- Debriefing screen

### Backend (Infomaniak Jelastic)
- Python microservice (your existing voting tools)
- Node.js API server
- PostgreSQL database
- Apertus-70B integration

### Data Collected
- Participant condition (A/B/C/D)
- Language preference
- Donation decision (donate/decline)
- Configuration choices (if applicable)
- Survey responses (transparency/control/trust)

---

## 🔧 Technical Stack

**Frontend:**
- React + TypeScript (Lovable)
- react-i18next (multi-language)
- TailwindCSS (styling)

**Backend:**
- Node.js + Express
- Python + Flask (your existing code wrapper)
- PostgreSQL

**AI:**
- Apertus-70B (Infomaniak API)

**Hosting:**
- Frontend: Lovable → ailights.org
- Backend: Infomaniak Jelastic
- Database: Infomaniak PostgreSQL

---

## 📈 Research Design

**Hypotheses:**
- H1: Data Nutrition Label increases donation
- H2: Granular Dashboard increases donation  
- H3: Combined effect is synergistic

**Sample:**
- Target: N=200 (50 per condition)
- Languages: DE (~60%), FR (~25%), IT (~8%), EN (~7%)

**Analysis:**
- Logistic regression
- Odds ratios with 95% CI
- Control for language

---

## ✅ What's Different from Original Docs

### Simplified:
- ❌ No timelines, budgets, checklists
- ❌ No project management overhead
- ❌ No repetitive explanations

### Enhanced:
- ✅ Integrated multi-language throughout
- ✅ Code reuse strategy for your existing tools
- ✅ Specific to your domain (ailights.org)
- ✅ Complete code (not pseudo-code)
- ✅ All translation files ready

### Focused:
- Just technical implementation
- Step-by-step guides
- Production-ready code
- Clear examples

---

## 🆘 Need Help?

**For specific implementation:**
- Backend questions → See 02_BACKEND.md
- Frontend questions → See 03_FRONTEND.md
- Deployment issues → See 04_DEPLOYMENT.md
- Translation questions → See 05_TRANSLATIONS.md

**For architecture/design:**
- System overview → See 01_ARCHITECTURE.md
- Quick reference → See 00_START_HERE.md

**Technical support:**
- Infomaniak: support@infomaniak.com
- Apertus API: Contact via Infomaniak

---

## 📁 All Files Ready to Download

All 6 markdown files are in `/mnt/user-data/outputs/`:

1. ✅ 00_START_HERE.md
2. ✅ 01_ARCHITECTURE.md
3. ✅ 02_BACKEND.md
4. ✅ 03_FRONTEND.md
5. ✅ 04_DEPLOYMENT.md
6. ✅ 05_TRANSLATIONS.md

**Total size:** 67KB  
**Ready to build!** 🚀

---

## 💡 Pro Tips

1. **Start small** - Get Python wrapper working first
2. **Test incrementally** - Don't build everything then test
3. **Use your existing code** - Your swiss_voting_tools are perfect
4. **Multi-language matters** - Essential for Swiss research
5. **Pilot thoroughly** - 10-20 people before full launch
6. **Monitor balance** - Check condition distribution daily

---

## 🎓 Research Context

This prototype supports your bachelor thesis research:
- **Topic:** Trust factors in civic AI
- **Question:** What makes citizens willing to donate data?
- **Method:** 2×2 experimental design (transparency × control)
- **Context:** Swiss voting information chatbot
- **N:** 200 participants across 4 languages

Your findings will contribute to civic AI design and Swiss AI sovereignty.

---

**Good luck with your implementation!** 🇨🇭🤖
