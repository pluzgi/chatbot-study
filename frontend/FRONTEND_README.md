# Frontend Structure for Lovable

## Complete File List (17 files to create)

### ✅ Already Created:
1. `src/types/index.ts` - TypeScript interfaces
2. `src/services/api.ts` - Backend API calls

### 📝 To Create Next:

#### **Configuration & Setup (3 files)**
3. `src/i18n/config.ts` - i18next configuration
4. `src/i18n/locales/de.json` - German translations
5. `src/i18n/locales/fr.json` - French translations
6. `src/i18n/locales/it.json` - Italian translations
7. `src/i18n/locales/en.json` - English translations

#### **Hooks (2 files)**
8. `src/hooks/useChat.ts` - Chat message handling
9. `src/hooks/useExperiment.ts` - Experiment state management

#### **Chat Components (3 files)**
10. `src/components/Chat/ChatInterface.tsx` - Main chat container
11. `src/components/Chat/MessageBubble.tsx` - Individual message display
12. `src/components/Chat/InputField.tsx` - Message input box

#### **Donation Components (4 files)**
13. `src/components/Donation/DonationModal.tsx` - Main donation modal (4 conditions)
14. `src/components/Donation/DataNutritionLabel.tsx` - Transparency component
15. `src/components/Donation/GranularDashboard.tsx` - Control component
16. `src/components/Donation/InfoBridge.tsx` - Optional info component

#### **Survey Components (2 files)**
17. `src/components/Survey/PostTaskSurvey.tsx` - Post-task questionnaire
18. `src/components/Survey/Debriefing.tsx` - Final debriefing screen

#### **Main Components (2 files)**
19. `src/components/LanguageSelector.tsx` - Language switcher
20. `src/App.tsx` - Main application logic

#### **Setup Files**
21. `package.json` - Dependencies (react-i18next, i18next, etc.)
22. `.env.example` - Environment variables template

---

## Experimental Conditions (2×2 Factorial Design)

| Condition | Transparency | Control | Components Shown |
|-----------|-------------|---------|------------------|
| **A** | Low | Low | Basic modal only |
| **B** | High | Low | + Data Nutrition Label |
| **C** | Low | High | + Granular Dashboard |
| **D** | High | High | + Both DNL & Dashboard |

---

## Multi-Language Support

All UI text must be translated into 4 languages:
- 🇩🇪 **German (de)** - Primary
- 🇫🇷 **French (fr)**
- 🇮🇹 **Italian (it)**
- 🇬🇧 **English (en)**

Translation keys:
- `landing.*` - Landing page
- `chat.*` - Chat interface
- `donation.*` - Donation modal
- `dnl.*` - Data Nutrition Label
- `dashboard.*` - Granular Dashboard
- `survey.*` - Post-task survey
- `debrief.*` - Debriefing

---

## User Flow

1. **Landing Page** → Select language → Start experiment
2. **Chat Phase** → Ask ≥2 questions → Donation modal appears
3. **Donation Modal** → Accept/Decline (with condition-specific UI)
4. **Survey** → Answer post-task questions
5. **Debriefing** → See study purpose, close

---

## Environment Variables

```env
VITE_API_ENDPOINT=http://localhost:3000/api
```

For production:
```env
VITE_API_ENDPOINT=https://your-backend.jelastic.infomaniak.com/api
```

---

## Lovable Deployment Steps

1. Create new route: `/ballot-chat`
2. Upload all 20 files in correct folder structure
3. Set `VITE_API_ENDPOINT` in Lovable settings
4. Test all 4 experimental conditions
5. Deploy to `chat-study.ailights.org`

---

## Next Steps

Run from this directory:
```bash
# See all files to create
ls -R src/

# Review each component before uploading to Lovable
```
