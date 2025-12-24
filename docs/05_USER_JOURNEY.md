# Complete User Journey - Swiss Ballot Chatbot Survey
# COMPLETE_USER_JOURNEY.md

## Overview
This document describes the complete participant experience from landing page to debrief, including all text, questions, answer options, and scale types.

**Total Phases:** 10
1. Landing Page
2. Consent Modal
3. Baseline Questions (Q1-Q2)
4. Chatbot Instruction Page
5. Chat Interface
6. InfoBridge Modal
7. Donation Decision Screen (varies by condition A/B/C/D)
8. Confirmation Screen
9. Post-Task Survey (Q3-Q14)
10. Debrief Screen

---

## 📍 PHASE 1: Landing Page

### Main Content
**Title:**
"Help Improve AI for Swiss Democracy"

**Subtitle:**
"Participate in university research about AI chatbots and data sharing."

**Key Facts:**
- ⏱️ Takes about 8-10 minutes
- 🔒 Completely anonymous
- 🎓 For academic research only

**What you'll do:**
1. Try a voting-info chatbot
2. Make a simulated decision
3. Answer a few questions

**Requirements:**
- 18+ years old
- Can vote in Switzerland

**Contact:**
Questions? Contact: hello@ailights.org

**Buttons:**
- [Start Survey] (primary, red)
- [Not Interested] (secondary, gray)

---

## 📍 PHASE 2: Consent Modal

Triggered when user clicks "Start Survey"

**Title:** "Before You Begin"

**Text:** "By starting this survey, you confirm:"

**Checkboxes (all required):**
- ☐ I am 18 years or older
- ☐ I can vote in Swiss federal elections
- ☐ I participate voluntarily

**Buttons:**
- [I Consent] (proceeds to baseline)
- [Go Back] (returns to landing page)

**Decline Message (if "Not Interested"):**
"Thank you for your consideration."

---

## 📍 PHASE 3: Baseline Questions (Q1-Q2)

### Header
**Title:** "Before We Start"
**Subtitle:** "Just 2 quick questions about you"

**Progress Indicator:**
- Shows: "Question 1 of 2" / "Question 2 of 2"
- Progress bar: 3px height, gray (#D1D5DB)

---

### Question 1: Technology Comfort

**Question Text:**
"I am comfortable using new digital technology (like AI chatbots, new apps, or online tools)."

**Scale Type:** 7-point Likert scale
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Answer Options:**
1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

**Display:** Interactive boxes (clickable)
**Validation:** Required

---

### Question 2: Privacy Concern

**Question Text:**
"In general, I am concerned about how my personal information is used online."

**Scale Type:** 7-point Likert scale
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Answer Options:**
1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

**Display:** Interactive boxes (clickable)
**Validation:** Required

**Button:**
[Continue →] (enabled after both questions answered, proceeds to Chatbot Instruction Page)

---

## 📍 PHASE 4: Chatbot Instruction Page

**Headline:** "Try the Chatbot"

**Main Text:**
"Imagine Swiss researchers have built a chatbot to help citizens get clear, unbiased information about upcoming ballot initiatives.

The chatbot uses Apertus, a Swiss open-source large language artificial intelligence model developed by EPFL, ETH Zurich, and the Swiss National Supercomputing Centre."

**Task:**
"Ask the chatbot at least 2 questions about upcoming ballot initiatives."

**Examples:**
- What is the Klimafonds Initiative about?
- Explain the Cash Initiative and the counter-proposal.
- What is the National Council's position on "For a fair energy and climate policy"?

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
- After 2nd question is sent → InfoBridge modal appears

---

## 📍 PHASE 6: InfoBridge Modal

**Timing:** Appears after participant sends 2nd question to chatbot

**Title:** "Hoi and welcome,"

**Main Text:**
"This chatbot is powered by Apertus, the first Swiss open-source large language artificial intelligence model.

To improve such models, questions from chatbot users are needed for training the data.

Would you donate your anonymized questions?"

**Purpose:** Bridge between chat and donation decision

**Button:**
- [Learn More] (proceeds to donation modal)

**Note:** This modal is the same for all conditions (A/B/C/D)

---

## 📍 PHASE 7: Donation Decision Screen

### Varies by Experimental Condition

---

### 🅰️ Condition A: Baseline (Low Transparency, Low Control)

**Title:** "Help Improve the Apertus Model"

**Main Text:**
"We would like to use your anonymized questions to improve the Apertus model. Your data will be handled securely and used only for research and model development."

**Help Text:**
"Donating your questions helps train better AI models."

**Components Shown:**
- ❌ No Data Nutrition Label
- ❌ No Granular Dashboard

**Buttons:**
- [Donate Data] (filled gray button - #D1D5DB)
- [Don't Donate] (filled gray button - #E5E7EB)

**Note:** Both buttons have equal visual weight with no color bias to avoid influencing participant decisions.

---

### 🅱️ Condition B: High Transparency, Low Control

**Title:** "Help Improve the Apertus Model"

**Intro Text:**
"To help you decide, here are key facts about the Apertus model:"

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

**Buttons:**
- [Donate Data]
- [Don't Donate]

---

### 🅲 Condition C: Low Transparency, High Control

**Title:** "Configure Your Data Donation"

**Main Text:**
"We would like to use your anonymized questions to improve the Apertus model. Please configure how your data will be used:"

**Components Shown:**
- ❌ No Data Nutrition Label
- ✅ Granular Dashboard

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

**Buttons:**
- [Donate Data] (only enabled when all fields filled)
- [Don't Donate]

---

### 🅳 Condition D: High Transparency, High Control

**Title:** "Configure Your Data Donation"

**Intro Text:**
"To help you decide, here are key facts about the Apertus model:"

**Components Shown:**
- ✅ Data Nutrition Label (same as Condition B)
- ✅ Granular Dashboard (same as Condition C)

**Buttons:**
- [Donate Data] (requires all dashboard fields filled)
- [Don't Donate]

---

## 📍 PHASE 8: Confirmation Screen

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

## 📍 PHASE 9: Post-Task Survey (Q3-Q14)

### Survey Structure
- **Total Questions:** 12 required + 1 optional
- **Display:** One question per page
- **Navigation:** Back button (from Q3 onwards), Next/Submit button
- **Progress Bar:** 3px gray bar showing progress through questions

---

### Question 3: Clarity Section

**Section Header:** "About Your Decision"

**Intro:** "Please tell us what you thought about the information you saw:"

**Question Type:** 4 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**3.1** "I understood where the Apertus chatbot was developed."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**3.2** "I knew what information the chatbot was trained on."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**3.3** "The privacy protections were clearly explained."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**3.4** "I had enough information to make my decision."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**Validation:** All 4 items required

---

### Question 4: Control Section

**Section Header:** "Question 4"

**Intro:** "Please tell us about the choices you had:"

**Question Type:** 4 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**4.1** "I had control over what happens to my questions."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**4.2** "I could choose how my data would be used."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**4.3** "I had real options for how to donate."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**4.4** "The process gave me the flexibility I wanted."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**Validation:** All 4 items required

---

### Question 5: Risk Concerns Section

**Section Header:** "Question 5"

**Intro:** "When thinking about donating your questions, how concerned were you about:"

**Question Type:** 5 Likert items on one page

**Scale Type:** 7-point Likert (CONCERN scale)
**Scale Endpoints:**
- Left: "Not at all concerned"
- Right: "Extremely concerned"

**Items:**

**5.1** "Privacy: My questions could be traced back to me"
- Scale: 1-7 (Not at all concerned → Extremely concerned)

**5.2** "Misuse: Data used for things I don't agree with"
- Scale: 1-7 (Not at all concerned → Extremely concerned)

**5.3** "Companies: Businesses profiting from my data"
- Scale: 1-7 (Not at all concerned → Extremely concerned)

**5.4** "Trust: Not knowing who's behind this"
- Scale: 1-7 (Not at all concerned → Extremely concerned)

**5.5** "Security: Data could be hacked or stolen"
- Scale: 1-7 (Not at all concerned → Extremely concerned)

**Validation:** All 5 items required

---

### Question 6: Agency Section

**Section Header:** "Question 6"

**Intro:** "Please tell us how you felt about the data donation choice you just made:"

**Question Type:** 3 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**6.1** "I felt in control of what would happen to my questions."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**6.2** "My choices actually influenced what would happen to my data."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**6.3** "I felt able to make the right decision for myself."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**Validation:** All 3 items required

---

### Question 7: Trust Section

**Section Header:** "Question 7"

**Intro:** "Please indicate your agreement:"

**Question Type:** 2 Likert items on one page

**Scale Type:** 7-point Likert
**Scale Endpoints:**
- Left: "Strongly disagree"
- Right: "Strongly agree"

**Items:**

**7.1** "I believe my data would be safe with this chatbot."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**7.2** "I trust the organization behind this chatbot to do the right thing."
- Scale: 1-7 (Strongly disagree → Strongly agree)

**Validation:** Both items required

---

### Question 8: Acceptable Use

**Section Header:** "Question 8"

**Question:**
"What should donated questions be used for?"

**Sub-instruction:**
"Select all that apply"

**Question Type:** Multiple checkboxes

**Options:**
- ☐ Improving this chatbot
- ☐ Academic research
- ☐ Commercial products
- ☐ Nothing

**Special Behavior:**
- If "Nothing" is checked → all other boxes uncheck
- If any other box is checked → "Nothing" unchecks

**Validation:** At least one checkbox required

---

### Question 9: Attention Check

**Section Header:** "Question 9"

**Question:**
"This chatbot helps people with questions about:"

**Question Type:** Single-select dropdown

**Dropdown Placeholder:** "Select topic..."

**Options:**
1. Swiss votes and ballot initiatives ✓ (CORRECT)
2. Swiss tax questions
3. Swiss immigration rules
4. General political news
5. I don't remember

**Validation:** Required (must select an option)

---

### 🎬 TRANSITION PAGE

**Visual:** 🙏🏻 (prayer hands emoji, large)

**Title:** "Almost done!"

**Message:** "Finally, just a few questions about yourself..."

**Important Reminder Box (blue background):**
"REMINDER: The data donation was simulated for research purposes. Your chatbot questions were NOT actually stored."

**Button:** [Next] (auto-enabled, no validation needed)

---

### Question 10: Age

**Section Header:** "Question 10"

**Question:** "What is your age?"

**Question Type:** Single-select dropdown

**Dropdown Placeholder:** "Select age range..."

**Options:**
1. 18-24
2. 25-34
3. 35-44
4. 45-54
5. 55-64
6. 65+
7. Prefer not to say

**Validation:** Required

---

### Question 11: Gender

**Section Header:** "Question 11"

**Question:** "What is your gender?"

**Question Type:** Single-select dropdown with conditional text field

**Dropdown Placeholder:** "Select gender..."

**Options:**
1. Female
2. Male
3. Non-binary
4. Other
5. Prefer not to say

**Conditional Text Field:**
If "Other" is selected:
- Text input appears below dropdown
- Placeholder: "Please specify..."
- Max length: 255 characters
- Optional to fill

**Validation:** Dropdown selection required

---

### Question 12: Primary Language

**Section Header:** "Question 12"

**Question:** "What is your primary language?"

**Question Type:** Single-select dropdown

**Dropdown Placeholder:** "Select language..."

**Options:**
1. English
2. French
3. German / Swiss German
4. Italian
5. Romansh
6. Other

**Validation:** Required

---

### Question 13: Education

**Section Header:** "Question 13"

**Question:** "What is your highest level of education?"

**Question Type:** Single-select dropdown

**Dropdown Placeholder:** "Select education level..."

**Options:**
1. Mandatory schooling
2. Matura / Baccalaureate
3. Vocational training (Berufslehre)
4. Higher vocational education
5. University of Applied Sciences
6. University (Bachelor/Master/PhD)
7. Prefer not to say

**Validation:** Required

---

### Question 14: Open Feedback

**Section Header:** "Question 14"

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

**Validation:** Optional (can leave empty)

---

### Question 15: Email Notification (Optional)

**Section Header:** "Question 15"

**Question:**
"Would you like to receive the study results?"

**Note (italic, gray text):**
"Optional. Enter your email if you'd like to be notified when results are published."

**Question Type:** Email input field

**Input Field:**
- Placeholder: "your.email@example.com"
- Type: email (browser validation)
- Max length: 255 characters

**Validation:** Optional (can leave empty), but if filled must be valid email format

**Button:** [Submit] (submits entire survey)

---

## 📍 PHASE 10: Debrief Screen

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

### Question Numbering
- Q1-Q2: Baseline (tech comfort, privacy concern)
- Q3-Q14: Post-task survey
- Q15: Email notification (optional)
- Total: 15 questions (Q14 and Q15 optional)

### Scale Types Used
1. **7-point Likert (Agreement):**
   - Used in: Q1, Q2, Q3 (all 4 items), Q4 (all 4 items), Q6 (all 3 items), Q7 (all 2 items)
   - Endpoints: Strongly disagree (1) → Strongly agree (7)

2. **7-point Likert (Concern):**
   - Used in: Q5 (all 5 items)
   - Endpoints: Not at all concerned (1) → Extremely concerned (7)

3. **Multiple Choice (Checkboxes):**
   - Used in: Q8 (acceptable use)
   - Validation: At least one required

4. **Single Select (Dropdowns):**
   - Used in: Q9, Q10, Q11, Q12, Q13
   - Validation: Selection required

5. **Free Text:**
   - Used in: Q11 (gender other), Q14 (open feedback)
   - Validation: Optional

### Conditional Elements
- **Gender "Other" text field:** Only shows when "Other" selected in Q11
- **Dashboard configuration:** Only shown in Conditions C & D
- **Data Nutrition Label:** Only shown in Conditions B & D
- **Back button:** Available from Q3 onwards (not on Q1-Q2)

### Validation Rules
- **Required questions:** All except Q14 (open feedback) and Q11 gender text
- **Minimum chat messages:** 2 questions before progression
- **Dashboard validation:** All 4 fields required in Conditions C/D when donating
- **Checkbox validation:** At least 1 selection in Q8

### Button States
- **Disabled state:** Gray background, no hover effect
- **Enabled state:** Red (#FF0000) background, darker red (#CC0000) on hover
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
- Baseline Questions (Q1-Q2): ~1 minute
- Chatbot Instruction: ~30 seconds
- Chat Interface: ~2-3 minutes (minimum 2 questions)
- InfoBridge Modal: ~15 seconds
- Donation Decision: ~1-2 minutes (longer for C/D with dashboard)
- Confirmation Screen: ~15 seconds
- Post-Task Survey (Q3-Q14): ~3-4 minutes
- Debrief: ~1 minute

**Total:** 8-10 minutes

---

## 🎨 Visual Design Elements

### Colors
- **Primary (Swiss Red):** #FF0000
- **Hover:** #CC0000
- **Progress Bar:** #D1D5DB (gray)
- **Background:** #F9FAFB (light gray)

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
