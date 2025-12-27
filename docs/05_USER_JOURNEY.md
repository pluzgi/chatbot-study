# Complete User Journey - Swiss Ballot Chatbot Survey

## Overview
This document describes the complete participant experience from landing page to debrief, including all text, questions, answer options, and scale types.

**Total Phases:** 9
1. Landing Page
2. Consent Modal
3. Baseline Questions (Q1-Q3)
4. Chatbot Instruction Page
5. Chat Interface
6. Donation Decision Screen (varies by condition A/B/C/D)
7. Confirmation Screen
8. Post-Task Survey (Q3-Q14) — Hypothesis-Driven
9. Debrief Screen

---

## 📍 PHASE 1: Landing Page

### Main Content
**Title:**
"Swiss Civic AI Study"

**Subtitle:**
"A short academic study on data donation and trust in open-source AI"

**What this is about:**
"We explore how people decide whether to donate anonymized chatbot questions for AI language model research."

**What to expect:**
- About 8 minutes
- Anonymous participation
- Academic research only

**Who can participate:**
- 18+
- Live in Switzerland

**Contact:**
Questions? Please send an email (hello@ailights.org)
Sabine Wildemann, Data Science & Business Analytics
DBU Digital Business University of Applied Sciences · Prof. Daniel Ambach

**Buttons:**
- [Start study] (gray, turns green on hover)
- [Not interested] (gray, turns green on hover) → Tracks click anonymously, shows Declined Page

---

## 📍 PHASE 1b: Declined Page

Shown when user clicks "Not Interested"

**Title:** "Thank you for your consideration."

**Button:** [Try Apertus] → Links to http://publicai.ch/ (tracks click anonymously)

**Note:** Both button clicks ("Not Interested" and "Try Apertus") are tracked anonymously via `click_counters` table without storing any personal data.

---

## 📍 PHASE 2: Consent Modal

Triggered when user clicks "Start study"

**Title:** "Before we start"

**Text:** "By continuing, you confirm that:"

**Listing:**
- you are 18 years or older
- you currently live in Switzerland
- your participation is voluntary and you may stop at any time

**Checkbox (required):**
- ☐ I confirm the above and agree to participate

**Buttons:**
- [Continue] (proceeds to baseline, only enabled when checkbox is checked)
- [Go back] (returns to landing page)

**Database Tracking:**
When participant clicks Continue with checkbox checked:
- `consent_given` = TRUE
- `consent_at` = timestamp

**Decline Message (if "Not Interested"):**
"Thank you for your consideration."

---

## 📍 PHASE 3: Baseline Questions (Q1-Q3)

### Layout
- **Small header:** "ABOUT YOU" (uppercase, gray, left-aligned)
- **Card:** Centered, max-width 672px (max-w-2xl), white background, shadow
- **No progress bar, no question numbers, no "Before We Start" title**

---

### Question 1: Technology Comfort

**Question Text:**
"I am comfortable using new digital technology (like AI chatbots, new apps, or online tools)."

**Scale Type:** 7-point Likert scale
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Display:** Standard square Likert buttons (same as rest of survey)

**Validation:** Required

---

### Question 2: Privacy Concern

**Question Text:**
"In general, I am concerned about how my personal information is used online."

**Scale Type:** 7-point Likert scale
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Display:** Standard square Likert buttons (same as Q1)

**Validation:** Required

---

### Question 3: Ballot Familiarity (Covariate)

**Question Text:**
"How familiar are you with Swiss ballot initiatives?"

**Scale Type:** 7-point Likert scale
**Scale Endpoints:**
- Left: "Not at all familiar"
- Right: "Very familiar"

**Display:** Standard square Likert buttons (same as Q1-Q2)

**Validation:** Required

**Button:**
[Next] / [Continue] (right-aligned, gray, hover green)

---

## 📍 PHASE 4: Chatbot Instruction Page

### About this study (Main Headline)
**Main Headline (large, bold):** "About this study"

**Paragraph 1:**
"In this study, we explore how people use a chatbot in a civic context and how they decide whether their anonymized chat questions may be used for academic AI research."

**Paragraph 2:**
"To explore this, the study combines a short hands-on interaction with a chatbot and follow-up questions about your experience."

---

### Step 1 of 3 (Subheadline)

**Subheadline (smaller, bold):**
"Step 1 of 3 — Try the Chatbot"

**Paragraph 1:**
"In this first step, you will interact with a chatbot designed to provide information about Swiss ballot initiatives."

**Paragraph 2:**
"The chatbot is based on a Swiss open-source AI language model. Such models are trained to understand questions and generate text-based answers, similar to other chat-based tools you may already know."

**Paragraph 3:**
"The AI model used for the chatbot, Apertus, is a Swiss open-source large language model developed by EPFL, ETH Zurich, and the Swiss National Supercomputing Centre."

**Task (bold):**
"Please ask at least 2 questions about Swiss ballot initiatives."
"This helps you get a sense of how the system works before continuing with the study."

**Example questions**
- What is the Klimafonds Initiative about?
- Explain the Cash Initiative and the counter-proposal.
- What are the main arguments for and against the SRG Initiative?

**Button:**
[Start Chatbot] (proceeds to chat interface)

---

## 📍 PHASE 5: Chat Interface

### Header
**Title:** "Swiss Ballot Chatbot"
**Subtitle:** "Powered by Apertus - Swiss AI"

### Interface Elements
**Input Placeholder:** "Ask a question..."
**Send Button:** "Send"
**Thinking State:** "Thinking..." (with loading indicator)

### Minimum Requirement
**Validation Message (if < 2 questions):**
"Please ask at least 2 questions (X/2)"
- Displayed in chat interface
- Prevents progression until 2 questions asked

### User Experience
- Participant types questions about Swiss ballot initiatives
- AI responds with voting information
- After 2nd question receives a response → "Continue to Next Step" button appears
- User can read the answer before clicking continue → Donation modal appears

---

## 📍 PHASE 6: Donation Decision Screen

### Shared Layout (All Conditions)

All four conditions share the same header structure:

**Eyebrow (small, uppercase, gray):**
"Step 2 of 3 — Data Donation Decision"

**Headline (large, bold):**
"Your decision about data donation"

**Transition Sentence:**
"You have just used the chatbot. Now we ask you to decide whether your anonymized chat questions may be used for academic AI research."

---

### Condition-Specific Content

---

### 🅰️ Condition A: Baseline (Low Transparency, Low Control)

**Content:**
"Your anonymized chat questions would be used to improve a Swiss open-source AI model for academic research. Data would be handled securely and not used for commercial purposes."

**Components Shown:**
- ❌ No Data Nutrition Label
- ❌ No Granular Dashboard

---

### 🅱️ Condition B: High Transparency, Low Control

**Intro Text:**
"To support your decision, here is factual information about the chatbot and how data is handled:"

**Components Shown:**
- ✅ Data Nutrition Label (DNL)
- ❌ No Granular Dashboard

#### Data Nutrition Label Content:

**🏠 Swiss-Made**
"Built by EPFL, ETH Zurich & CSCS in Switzerland"

**📚 Training Data**
"Only publicly available data from 1,000+ languages & sources"

**🔒 Privacy Protection**
"Personal data removed before training; respects opt-outs"

**⚖️ Legal Compliance**
"Follows Swiss privacy & copyright laws, EU AI Act standards"

**🌍 Multilingual & Current**
"Includes Swiss German & Romansh; data through January 2025"

---

### 🅲 Condition C: Low Transparency, High Control

**Intro Text:**
"You can decide how your anonymized chat questions would be used."

**Components Shown:**
- ❌ No Data Nutrition Label
- ✅ Granular Dashboard

**Helper Text (below dashboard):**
"You can leave the default settings or adjust them before deciding."

#### Granular Dashboard Options:

**1. What data to share**
- Dropdown (required)
- Options:
  - "Only topics I asked about (e.g., 'climate policy')"
  - "Full anonymized conversations (your exact questions with all identifying info removed)"

**2. How data will be used**
- Dropdown (required)
- Options:
  - "Academic research only"
  - "Academic research and commercial use"

**3. Where data is stored**
- Dropdown (required)
- Options:
  - "Swiss servers only"
  - "EU servers allowed"
  - "No preference"

**4. How long to keep data**
- Dropdown (required)
- Options:
  - "1 month"
  - "3 months"
  - "6 months"
  - "1 year"
  - "Indefinitely"

**Revocability Note:**
"You can change these settings in your dashboard anytime."

**Validation:**
If user clicks "Donate Data" without filling all fields:
→ Error: "Please configure all privacy settings"

---

### 🅳 Condition D: High Transparency, High Control

**Intro Text:**
"To support your decision, you can review information about the chatbot and adjust how your anonymized data would be used."

**Components Shown:**
- ✅ Data Nutrition Label (left column)
- ✅ Granular Dashboard (right column)

**Layout:** Two-column on desktop (side by side), stacked on mobile

**Helper Text (below dashboard):**
"You can leave the default settings or adjust them before deciding."

**Validation:**
If user clicks "Donate Data" without filling all dashboard fields:
→ Error: "Please configure all privacy settings"

---

### Decision Section (All Conditions)

**Decision Question (bold, prominent):**
"Do you want to donate your anonymized chat questions for research purposes?"

**Buttons (neutral styling, no color bias):**
- [Donate Data] — Left button, filled gray (#E5E7EB), turns green on hover
- [Don't Donate] — Right button, outlined white with gray border, turns gray-50 on hover

**Note:** Both buttons have equal visual weight with no color bias to avoid influencing participant decisions. Styling matches landing page buttons.

---

## 📍 PHASE 7: Confirmation Screen

Shown after donation decision (donate OR decline)

### If User Chose "Donate Data":

**Visual:** ✓ Green checkmark icon (large, centered)

**Title:** "Thank You!"

**Message:**
"Your contribution will help improve the Apertus model."

**Next Step Text:**
"Next: Please answer a few questions about your experience."

**Button:**
[Continue to Survey →]

### If User Chose "Don't Donate":

**Visual:** ✓ Green checkmark icon (large, centered)

**Title:** "Choice Recorded"

**Message:**
"Thank you for considering this request."

**Next Step Text:**
"Next: Please answer a few questions about your experience."

**Button:**
[Continue to Survey →]

**Note:** Confirmation screen does NOT auto-dismiss. User must click button to proceed.

---

## 📍 PHASE 8: Post-Task Survey (Q3-Q14) — Hypothesis-Driven

**Headline (shown on first page only):**
"Step 3 of 3 — Share Your Perspective"

### Hypothesis Mapping

| Question | Construct | Tag | Hypothesis | Expected Pattern |
|----------|-----------|-----|------------|------------------|
| Q3 | Perceived Transparency | MC-T | H1 | Higher in B & D (with DNL) |
| Q4 | Perceived User Control | MC-C | H2 | Higher in C & D (with Dashboard) |
| Q5 | Risk Perception | OUT-RISK | H3 | Lowest in D, highest in A |
| Q6 | Trust | OUT-TRUST | — | Supporting construct |
| Q7 | Attention Check | ATTN | — | Validation |
| Q8-Q12 | Demographics | DEMO | — | Covariates |
| Q13 | Open Feedback | QUAL | — | Qualitative insight |
| Q14 | Email Notification | — | — | Optional |

### Survey Structure
- **Total Questions:** 11 required + 2 optional (Q13 feedback, Q14 email)
- **Core Likert Items:** 8 items across 4 constructs (2 items each)
- **Display:** One question section per page
- **Navigation:** Back button (from Q3 onwards), Next/Submit button
- **Progress Bar:** 3px gray bar showing progress through questions

---

### Question 3: Perceived Transparency (MC-T)

**Tag:** 🔵 MC-T — H1 Manipulation Check
**Expected Pattern:** Higher in conditions B & D (with Data Nutrition Label)

**Section Header:** "About Your Experience"

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**3.1** "The information about how my anonymized chat questions may be used was clear."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `transparency1`

**3.2** "I understood what would happen to my anonymized chat questions if I agreed to share them."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `transparency2`

**Validation:** Both items required

---

### Question 4: Perceived User Control (MC-C)

**Tag:** 🟢 MC-C — H2 Manipulation Check
**Expected Pattern:** Higher in conditions C & D (with Dashboard)

**Section Header:** "Question 4"

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**4.1** "I felt I had control over how my anonymized chat questions could be used."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `control1`

**4.2** "I felt I had meaningful choices about sharing my anonymized chat questions."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `control2`

**Validation:** Both items required

---

### Question 5: Risk Perception (OUT-RISK)

**Tag:** 🟡 OUT-RISK — H3 Interaction Mechanism
**Expected Pattern:** Lowest in D (high transparency + high control), highest in A

**Section Header:** "Question 5"

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**5.1** "Even if anonymized, my chat questions could be traced back to me."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `riskTraceability`

**5.2** "My anonymized chat questions could be used in ways I would not agree with."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `riskMisuse`

**Validation:** Both items required

---

### Question 6: Trust (OUT-TRUST)

**Tag:** 🟡 OUT-TRUST — Supporting Construct
**Purpose:** Interpretation and additional insight

**Section Header:** "Question 6"

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**6.1** "I trust the organization behind this study to handle my data responsibly."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `trust1`

**6.2** "I believe my anonymized data would be handled securely."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `trust2`

**Validation:** Both items required

---

### Question 7: Attention Check (ATTN)

**Tag:** 🟣 ATTN — Validation
**Purpose:** Data quality check

**Section Header:** "Question 7"

**Question:**
"This chatbot helps people with questions about:"

**Question Type:** Checkbox-style selection (single select enforced)

**Display:** All options visible as selectable buttons with checkbox indicators

**Options:**
1. Swiss votes and ballot initiatives ✓ (CORRECT)
2. Swiss tax questions
3. Swiss immigration rules
4. General political news
5. I don't remember

**Field:** `attentionCheck`
**Validation:** Required (one selection)

---

### 🎬 TRANSITION PAGE

**Visual:** 🙏🏻 (prayer hands emoji, large)

**Title:** "Almost done!"

**Message:** "Finally, just a few questions about yourself..."

**Important Reminder Box (blue background):**
"REMINDER: The data donation was simulated for research purposes. Your chatbot questions were NOT actually stored."

**Button:** [Next] (auto-enabled, no validation needed)

---

### Question 8: Age (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** "Question 8"

**Question:** "What is your age?"

**Question Type:** Checkbox-style selection (single select enforced)

**Display:** All options visible as selectable buttons with checkbox indicators

**Options:**
1. 18–24
2. 25–34
3. 35–44
4. 45–54
5. 55–64
6. 65+

**Field:** `age`
**Validation:** Required (one selection)

---

### Question 9: Gender (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** "Question 9"

**Question:** "What is your gender?"

**Question Type:** Checkbox-style selection (single select enforced) with conditional text field

**Display:** All options visible as selectable buttons with checkbox indicators

**Options:**
1. Female
2. Male
3. Non-binary
4. Other
5. Prefer not to say

**Conditional Text Field:**
If "Other" is selected:
- Text input appears below options
- Placeholder: "Please specify..."
- Max length: 255 characters
- Optional to fill

**Fields:** `gender`, `genderOther`
**Validation:** Selection required

---

### Question 10: Primary Language (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** "Question 10"

**Question:** "What is your primary language?"

**Question Type:** Checkbox-style selection (single select enforced)

**Display:** All options visible as selectable buttons with checkbox indicators

**Options:**
1. German / Swiss German
2. French
3. Italian
4. English
5. Romansh
6. Other

**Field:** `primaryLanguage`
**Validation:** Required (one selection)

---

### Question 11: Education (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** "Question 11"

**Question:** "What is your highest level of education?"

**Question Type:** Checkbox-style selection (single select enforced)

**Display:** All options visible as selectable buttons with checkbox indicators

**Options:**
1. Mandatory schooling
2. Matura / Baccalaureate
3. Vocational training (Berufslehre)
4. Higher vocational education
5. University of Applied Sciences
6. University (Bachelor/Master/PhD)
7. Prefer not to say

**Field:** `education`
**Validation:** Required (one selection)

---

### Question 12: Voting Eligibility (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** "Question 12"

**Question:** "Are you eligible to vote in Swiss federal elections?"

**Question Type:** Checkbox-style selection (single select enforced)

**Display:** All options visible as selectable buttons with checkbox indicators

**Options:**
1. I am eligible to vote in Swiss federal elections
2. I live in Switzerland but am not eligible to vote
3. I am not sure

**Field:** `eligibleToVoteCh` (string: 'eligible' | 'not-eligible' | 'not-sure')
**Validation:** Required

---

### Question 13: Open Feedback (QUAL)

**Tag:** ⚫ QUAL — Qualitative Insight

**Section Header:** "Question 13"

**Question:**
"In your own words, what was the main reason for your decision?"

**Note (italic, gray text):**
"This question is optional, but your thoughts help us understand how people make these decisions."

**Question Type:** Free-text area

**Text Area:**
- Placeholder: "Type your response here..."
- Rows: 6
- Max length: 500 characters
- Character counter: "X/500 - Maximum 500 characters"

**Field:** `openFeedback`
**Validation:** Optional (can leave empty)

---

### Question 14: Email Notification (Optional)

**Section Header:** "Question 14"

**Question:**
"Would you like to receive the study results?"

**Note (italic, gray text):**
"Optional. Enter your email if you'd like to be notified when results are published."

**Question Type:** Email input field

**Input Field:**
- Placeholder: "your.email@example.com"
- Type: email (browser validation)
- Max length: 255 characters

**Field:** `notifyEmail`
**Validation:** Optional (can leave empty), but if filled must be valid email format

**Button:** [Submit] (submits entire survey)

---

## 📍 PHASE 9: Debrief Screen

Shown after survey submission

**Title:** "Thank You for Participating!"

### Important Notice (Yellow Box)

**Text:**
"**Important:** The data donation was SIMULATED. Your chatbot questions were NOT stored or used. Only your survey answers were recorded anonymously."

**Display:** Yellow background box (bg-yellow-50, border-yellow-400)

### What We're Studying

**Section Header:** "What We're Studying"

**Text:**
"We're researching what makes Swiss citizens comfortable donating their data to train open-source artificial intelligent models. Your responses help design better privacy-respecting AI systems."

### Contact Information

**Section Header:** "If you have questions, feel free to contact me."

**Details:**
- Sabine Wildemann, hello@ailights.org
- Institution: Digital Business University of Applied Sciences
- Supervisor: Prof. Daniel Ambach

**Button:** [Close] (ends survey session)

---

## 📊 Technical Details

### Question Numbering (Hypothesis-Aligned)
- Q1-Q3: Baseline (tech comfort, privacy concern, ballot familiarity)
- Q3: Perceived Transparency (MC-T) — 2 items
- Q4: Perceived User Control (MC-C) — 2 items
- Q5: Risk Perception (OUT-RISK) — 2 items
- Q6: Trust (OUT-TRUST) — 2 items
- Q7: Attention Check (ATTN)
- Q8-Q12: Demographics (DEMO) — including voting eligibility
- Q13: Open Feedback (QUAL) — optional
- Q14: Email notification — optional
- **Total:** 14 questions (Q13 and Q14 optional)
- **Core Likert Items:** 8 items across 4 constructs

### Scale Types Used
1. **7-point Likert:**
   - Used in: Q1, Q2, Q3 (baseline), Q3-Q6 (post-task survey)
   - Baseline endpoints: "Strongly disagree" → "Strongly agree" (Q1-Q2), "Not at all familiar" → "Very familiar" (Q3)
   - Post-task endpoints: Strongly disagree (1) → Strongly agree (7)
   - Standard square buttons, consistent visual treatment

2. **Checkbox-Style Selection (Single Select Enforced):**
   - Used in: Q7 (attention check), Q8-Q12 (all demographics)
   - All options visible as selectable buttons with checkbox indicators
   - No hidden menus or dropdowns
   - Consistent visual treatment across all questions
   - Validation: One selection required per question

3. **Free Text:**
   - Used in: Q9 (gender other), Q13 (open feedback)
   - Validation: Optional

4. **Email Input:**
   - Used in: Q14
   - Validation: Optional, but must be valid format if provided

### Hypothesis-Construct Mapping

| Tag | Construct | Hypothesis | Items | Expected Pattern |
|-----|-----------|------------|-------|------------------|
| MC-T | Perceived Transparency | H1 | transparency1, transparency2 | Higher in B & D |
| MC-C | Perceived User Control | H2 | control1, control2 | Higher in C & D |
| OUT-RISK | Risk Perception | H3 | riskTraceability, riskMisuse | Lowest in D |
| OUT-TRUST | Trust | Supporting | trust1, trust2 | — |

### Conditional Elements
- **Gender "Other" text field:** Only shows when "Other" selected in Q9
- **Dashboard configuration:** Only shown in Conditions C & D
- **Data Nutrition Label:** Only shown in Conditions B & D
- **Back button:** Available from Q3 onwards (not on Q1-Q2)

### Validation Rules
- **Required questions:** Q3-Q12 (all)
- **Optional questions:** Q13 (open feedback), Q14 (email)
- **Minimum chat messages:** 2 questions before progression
- **Dashboard validation:** All 4 fields required in Conditions C/D when donating

### Button States
- **Disabled state:** Gray background (#D1D5DB), no hover effect, gray text
- **Enabled state:** Gray background (#E5E7EB), turns green (#16A34A) on hover
- **Selected/Active state:** Green background with white text
- **Submit button:** Only enabled when all required questions answered

---

## 🎯 Condition Summary

| Condition | Transparency | Control | Shows DNL | Shows Dashboard |
|-----------|--------------|---------|-----------|-----------------|
| A         | Low          | Low     | No        | No              |
| B         | High         | Low     | Yes       | No              |
| C         | Low          | High    | No        | Yes             |
| D         | High         | High    | Yes       | Yes             |

---

## ⏱️ Estimated Time

- Landing & Consent: ~1 minute
- Baseline Questions (Q1-Q3): ~1 minute
- Chatbot Instruction: ~30 seconds
- Chat Interface: ~2-3 minutes (minimum 2 questions)
- Donation Decision: ~1-2 minutes (longer for C/D with dashboard)
- Confirmation Screen: ~15 seconds
- Post-Task Survey (Q3-Q14): ~3-4 minutes
- Debrief: ~1 minute

**Total:** 8-10 minutes

---

## 🎨 Visual Design Elements

### Colors
- **Primary Button (default):** #E5E7EB (gray-200)
- **Primary Button (hover/selected):** #16A34A (green-600)
- **Progress Bar:** #D1D5DB (gray)
- **Background:** #F9FAFB (light gray)
- **Text:** #000000 (black)

### Spacing
- **Consistent:** 48px (mb-12) between elements
- **Progress bar height:** 3px
- **Button padding:** 32px horizontal, 12px vertical

### Typography

**Survey Questions (Q3-Q7):**
- **Main question/intro:** 20-24px (text-xl md:text-2xl), semibold, gray-700
- **Item statements:** 20px (text-lg md:text-xl), medium weight, gray-900 (THE HERO - most prominent)
- **Likert scale numbers:** 16px (text-base), medium weight, 48px touch targets
- **Scale labels:** 14-16px (text-sm md:text-base), gray-600
- **Item spacing:** 40px (mb-10) between Likert items

**Donation Modal:**
- **Main heading:** 32-36px (text-3xl md:text-4xl), bold
- **Body text:** 18-20px (text-lg md:text-xl)
- **Supporting text:** 16-18px (text-base md:text-lg), gray-600
- **Button labels:** 16-18px (text-base md:text-lg), semibold

**General:**
- **Helper text:** 14-16px (text-sm md:text-base), gray-600
- **Section headers:** 28-32px (text-2xl md:text-3xl), bold

### Keyboard Navigation
- **Enter:** Proceed to next question (when answer selected)
- **Escape:** Go back to previous question (except on transition page)
- **Note:** Keyboard shortcuts disabled when focused on input/textarea/select elements

---

## 🗄️ Database Schema

See [database/CONFIG_SCHEMA.md](../database/CONFIG_SCHEMA.md) for complete database documentation.

---
