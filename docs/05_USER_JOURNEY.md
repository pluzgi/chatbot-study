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
8. Post-Task Survey (Q4-Q13) — Hypothesis-Driven
9. Debrief Screen (includes optional email signup)

---

## 📍 PHASE 1: Landing Page

### Main Content
**Title:**
"Swiss Civic AI Study"

**Subtitle:**
"A short academic study on data donation and trust in open-source AI"

**What this is about:**
"We explore how people decide whether to donate anonymized chat questions for AI language model research."

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

## 📍 PHASE 1c: Already Participated Screen

Shown when duplicate participation is detected (HTTP 409 response)

**Title:** "Thanks for Your Interest!"

**Message:** "Our records show you have already participated in this study recently."

**Visual:** Centered layout with muted styling

### Duplicate Detection Logic

**How it works:**
- Browser fingerprint generated from: IP + User-Agent + Accept-Language + Accept-Encoding
- Fingerprint stored with each participant record
- Duplicate check runs on `/experiment/initialize` API call

**Completion-based blocking:**
- Only **completed** participations trigger the block (where `completed_at IS NOT NULL`)
- Users who dropped out mid-study can restart fresh
- Block period: 7 days from original participation

**Edge cases handled:**
| Scenario | Behavior |
|----------|----------|
| Clicked "Not interested" | No fingerprint stored → can restart immediately |
| Dropped out before survey completion | Can restart fresh (not blocked) |
| Completed full survey | Blocked for 7 days |
| Same device, different browser | New fingerprint → allowed (different User-Agent) |

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
"Please ask 2–3 questions about Swiss ballot initiatives."
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
**Subtitle:** "Ask 2–3 questions about Swiss ballot initiatives"

### Interface Elements
**Input Placeholder:** "Ask a question..."
**Send Button:** "Send"
**Thinking State:** "Thinking..." (with loading indicator)

### Progress Indicator
**Question Counter:**
"Questions (X/3)"
- Shows count of questions asked (up to 3)
- Minimum 2 questions required to continue

**Validation Message (if < 2 questions):**
"Please ask at least 2 questions to continue."

### User Experience
- Participant types questions about Swiss ballot initiatives
- AI responds with ballot information
- After 2nd question receives a response → "Continue to Next Step →" button appears
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

#### Granular Dashboard Options (Progressive Disclosure):

The dashboard uses **progressive disclosure** - questions appear one at a time. After answering each question, the next one is revealed. Completed answers are shown collapsed with a "Change" link.

**1. What data would you like to share?**
- Radio-style selection (required)
- Options:
  - "High-level topics only"
  - "My questions"
  - "My questions and chatbot answers"

**2. How may your data be used?**
- Radio-style selection (required)
- Options:
  - "Academic research only"
  - "Academic research and commercial use"

**3. Where should your data be stored?**
- Radio-style selection (required)
- Options:
  - "Swiss servers only"
  - "Swiss or EU servers"
  - "No preference"

**4. How long should your data be kept?**
- Radio-style selection (required)
- Options:
  - "Until research purpose is fulfilled"
  - "Up to 6 months"
  - "Up to 1 year"
  - "Indefinitely"

**Revocability Note:**
"You can change these settings in your dashboard anytime."

**Validation:**
- All 4 questions are required
- Donate/Don't Donate buttons are disabled until all questions answered
- Disabled buttons appear grayed out with cursor-not-allowed

---

### 🅳 Condition D: High Transparency, High Control

**Intro Text:**
"To support your decision, you can review information about the chatbot and adjust how your anonymized data would be used."

**Components Shown:**
- ✅ Data Nutrition Label (same badge grid layout as Condition B)
- ✅ Granular Dashboard

**Layout:** Stacked vertically to reduce cognitive overload:
1. **Section 1: "ℹ️ About the Swiss Apertus Model"** - DNL badge grid (same as Condition B)
2. Visual separator (horizontal line)
3. **Section 2: "⚙️ Configure Your Data Donation"** - Dashboard with progressive disclosure

**Design Notes:**
- Uses same DNL badge grid layout as Condition B for consistency
- Section headers have gray background (bg-gray-100) for visibility
- Stacked layout instead of side-by-side columns
- Modal width: max-w-3xl
- Clear section headers with icons for visual hierarchy

**Validation:**
Both "Donate Data" and "Don't Donate" buttons are disabled until all 4 dashboard questions are answered. Disabled buttons appear grayed out (bg-gray-100, text-gray-400) with cursor-not-allowed.

---

### Decision Section (All Conditions)

**Decision Question (bold, prominent):**
"Do you want to donate your anonymized chat questions for research purposes?"

**Buttons (neutral styling, no color bias):**
- [Donate Data] — Left button, filled gray (#E5E7EB), turns green on hover
- [Don't Donate] — Right button, outlined white with gray border, turns gray-50 on hover

**Button States (Conditions C & D only):**
- **Disabled:** Both buttons disabled until all 4 dashboard questions answered (gray-100 bg, gray-400 text, cursor-not-allowed)
- **Enabled:** Normal styling once all questions answered

**Note:** Both buttons have equal visual weight with no color bias to avoid influencing participant decisions. Styling matches landing page buttons.

---

## 📍 PHASE 7: Confirmation Screen

Shown after donation decision (donate OR decline)

### If User Chose "Donate Data":

**Visual:** ✓ Green checkmark icon (large, centered)

**Title:** "Thank You!"

**Message:**
"Your support helps us improve this ballot chatbot for everyone."

**Next Step Text:**
"Your feedback in the next step will make this tool even better for future users like you."

**Button:**
[Share Your Thoughts →]

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

## 📍 PHASE 8: Post-Task Survey (Q4-Q13) — Hypothesis-Driven

**Headline (shown on first page only):**
"Step 3 of 3 — Your View on Data Use"

### Hypothesis Mapping

| Question | Construct | Tag | Hypothesis | Expected Pattern |
|----------|-----------|-----|------------|------------------|
| Q4 | Perceived Transparency | MC-T | H1 | Higher in B & D (with DNL) |
| Q5 | Perceived User Control | MC-C | H2 | Higher in C & D (with Dashboard) |
| Q6 | Risk Perception | OUT-RISK | H3 | Lowest in D, highest in A |
| Q7 | Trust | OUT-TRUST | — | Supporting construct |
| Q8 | Chatbot Question | — | — | Single-select recall |
| Q9-Q12 | Demographics | DEMO | — | Covariates |
| Q13 | Open Feedback | QUAL | — | Qualitative insight |

### Survey Structure
- **Total Questions:** 11 pages (10 required + 1 optional: Q13 feedback)
- **Core Likert Items:** 8 items across 4 constructs (2 items each)
- **Display:** One question section per page
- **Navigation:** Back button available, Next/Submit button (Submit on last page)
- **Progress Bar:** 3px gray bar showing progress through questions

**Note on Question Numbering:**
- Baseline phase: Q1-Q3 (tech comfort, privacy concern, ballot familiarity)
- Post-task survey: Q4-Q13 (starts at Q4 to continue from baseline)
- This creates a continuous numbering scheme across the entire study

---

### Question 4: Perceived Transparency (MC-T)

**Tag:** 🔵 MC-T — H1 Manipulation Check
**Expected Pattern:** Higher in conditions B & D (with Data Nutrition Label)

**Section Header:** (No separate header - intro text serves as context)

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**4.1** "The information about how my anonymized chat questions may be used was clear."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `transparency1`

**4.2** "I understood what would happen to my anonymized chat questions if I agreed to share them."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `transparency2`

**Validation:** Both items required

---

### Question 5: Perceived User Control (MC-C)

**Tag:** 🟢 MC-C — H2 Manipulation Check
**Expected Pattern:** Higher in conditions C & D (with Dashboard)

**Section Header:** (No separate header)

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**5.1** "I felt I had control over how my anonymized chat questions could be used."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `control1`

**5.2** "I felt I had meaningful choices about sharing my anonymized chat questions."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `control2`

**Validation:** Both items required

---

### Question 6: Risk Perception (OUT-RISK)

**Tag:** 🟡 OUT-RISK — H3 Interaction Mechanism
**Expected Pattern:** Lowest in D (high transparency + high control), highest in A

**Section Header:** (No separate header)

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**6.1** "Even if anonymized, my chat questions could be traced back to me."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `riskTraceability`

**6.2** "My anonymized chat questions could be used in ways I would not agree with."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `riskMisuse`

**Validation:** Both items required

---

### Question 7: Trust (OUT-TRUST)

**Tag:** 🟡 OUT-TRUST — Supporting Construct
**Purpose:** Interpretation and additional insight

**Section Header:** (No separate header)

**Intro:** "Please indicate your agreement with the following statements:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Item:**

**7.1** "I trust the system behind this chatbot to handle anonymized questions responsibly."
- Scale: 1-7 (Strongly disagree → Strongly agree)
- Field: `trust1`

**Validation:** Item required

---

### Question 8: Chatbot Question

**Purpose:** Recall question about chatbot topic

**Section Header:** "A question about the chatbot"

**Question:**
"This chatbot helps people with questions about:"

**Question Type:** Radio-style selection (single select)

**Display:** All options visible as selectable buttons with radio indicators (circular)

**Options:**
1. Swiss ballot initiatives
2. Swiss tax questions
3. Swiss immigration rules
4. I don't remember

**Field:** `attentionCheck`
**Validation:** Required (one selection)

---

### 🎬 TRANSITION PAGE

**Visual:** 🙏🏻 (prayer hands emoji, large)

**Title:** "Almost done!"

**Message:** "Finally, just a few questions about yourself..."

**Important Reminder Box (blue background):**
"REMINDER: The data donation was simulated for research purposes. Your chat questions were NOT actually stored."

**Button:** [Next] (auto-enabled, no validation needed)

---

### Question 9: Age (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** (No separate header - question is the headline)

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

### Question 10: Gender (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** (No separate header - question is the headline)

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

### Question 11: Primary Language (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** (No separate header - question is the headline)

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

### Question 12: Education (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** (No separate header - question is the headline)

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

### Question 13: Voting Eligibility (DEMO)

**Tag:** ⚫ DEMO — Covariate

**Section Header:** (No separate header - question is the headline)

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

### Question 13: Open Feedback (QUAL) — LAST SURVEY PAGE

**Tag:** ⚫ QUAL — Qualitative Insight

**Headline (displayed as main text):**
"What mattered most for your decision?"

**Note (gray text below headline):**
"(Optional. Your answer helps us understand decision-making.)"

**Question Type:** Free-text area

**Text Area:**
- Placeholder: "Type your response here..."
- Rows: 5
- Max length: 500 characters
- Character counter: "X/500"

**Field:** `openFeedback`
**Validation:** Optional (can leave empty)

**Button:** [Next →] (submits entire survey → proceeds to Debrief)

---

## 📍 PHASE 9: Debrief Screen

Shown after survey submission

**Title:** "Thank You for Participating!"

### Important Notice (Yellow Box)

**Text:**
"**Important:** The data donation was SIMULATED. Your chat questions were NOT stored or used. Only your survey answers were recorded anonymously."

**Display:** Yellow background box (bg-yellow-50, border-yellow-400)

### What We're Studying

**Section Header:** "What We're Studying"

**Text:**
"We're researching what makes Swiss citizens comfortable donating their data to train open-source artificial intelligent models. Your responses help design better privacy-respecting AI systems."

### Email Signup (Optional)

**Display:** Gray box below study purpose text

**Prompt:**
"Enter your email to receive the study results (optional):"

**Input Field:**
- Type: email
- Placeholder: "your.email@example.com"

**Note:** Email is submitted when user clicks "Close the study" button

### Contact Information

**Section Header:** "If you have questions, feel free to contact me."

**Details:**
- Sabine Wildemann, hello@ailights.org
- Institution: Digital Business University of Applied Sciences
- Supervisor: Prof. Daniel Ambach

**Button:** [Close] (ends survey session)

---

## 📊 Technical Details

### Question Numbering (Continuous Scheme)
- **Baseline Phase (Q1-Q3):**
  - Q1: Tech comfort
  - Q2: Privacy concern
  - Q3: Ballot familiarity

- **Post-Task Survey (Q4-Q13):**
  - Q4: Perceived Transparency (MC-T) — 2 items
  - Q5: Perceived User Control (MC-C) — 2 items
  - Q6: Risk Perception (OUT-RISK) — 2 items
  - Q7: Trust (OUT-TRUST) — 1 item
  - Q8: Chatbot Question (attention check)
  - Q9-Q12: Demographics (DEMO) — age, gender, language, education, voting eligibility
  - Q13: Open Feedback (QUAL) — optional

- **Total:** 13 questions (Q13 optional, email signup moved to Debrief)
- **Core Likert Items:** 7 items across 4 constructs

### Scale Types Used
1. **7-point Likert:**
   - Used in: Q1, Q2, Q3 (baseline), Q4-Q7 (post-task survey)
   - Baseline endpoints: "Strongly disagree" → "Strongly agree" (Q1-Q2), "Not at all familiar" → "Very familiar" (Q3)
   - Post-task endpoints: Strongly disagree (1) → Strongly agree (7)
   - Standard square buttons, consistent visual treatment

2. **Radio-Style Selection (Single Select):**
   - Used in: Q8 (chatbot question), Q9-Q13 (all demographics)
   - All options visible as selectable buttons with radio indicators (circular)
   - No hidden menus or dropdowns
   - Consistent visual treatment across all questions
   - Validation: One selection required per question

3. **Free Text:**
   - Used in: Q10 (gender other), Q13 (open feedback)
   - Validation: Optional

4. **Email Input:**
   - Used in: Debrief page (optional email signup)
   - Validation: Optional, but must be valid format if provided

### Hypothesis-Construct Mapping

| Tag | Construct | Hypothesis | Items | Expected Pattern |
|-----|-----------|------------|-------|------------------|
| MC-T | Perceived Transparency | H1 | transparency1, transparency2 | Higher in B & D |
| MC-C | Perceived User Control | H2 | control1, control2 | Higher in C & D |
| OUT-RISK | Risk Perception | H3 | riskTraceability, riskMisuse | Lowest in D |
| OUT-TRUST | Trust | Supporting | trust1 | — |

### Conditional Elements
- **Gender "Other" text field:** Only shows when "Other" selected in Q10
- **Dashboard configuration:** Only shown in Conditions C & D (progressive disclosure)
- **Data Nutrition Label:** Only shown in Conditions B & D
- **Back button:** Available throughout post-task survey

### Validation Rules
- **Required questions:** Q4-Q12 (all post-task questions except Q13)
- **Optional questions:** Q13 (open feedback), email signup on Debrief
- **Minimum chat messages:** 2 questions before progression
- **Dashboard validation:** All 4 questions (Scope, Purpose, Storage, Retention) required in Conditions C/D before Donate/Don't Donate buttons are enabled

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
- Post-Task Survey (Q4-Q13): ~3-4 minutes
- Debrief (with email signup): ~1 minute

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

**Survey Questions (Q4-Q8 Likert sections):**
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
