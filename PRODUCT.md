# Product: Forward

Practice-exam web app for Thai upper-secondary students preparing for the Thammasat University IBMP entrance exam.

## Audience and purpose
- Students (Mathayom 6) practising three subjects: Business Quantitative Analysis, Business Qualitative Analysis, Business English Communication.
- Job: sit timed or untimed sets or a Full Mock (3 subjects, 30 questions each, 40 minutes per subject), then learn from per-option explanations and a strengths/weaknesses report.

## Operating context
- Web only, Thai UI, no emoji. Hosted on Vercel; Gemini generates 5 extra questions per set through a server-side proxy (key never in the client).
- History keeps answers so any past set can be reviewed or retaken.
- Calculator and per-question scratchpad in the quantitative subject only.

## Constraints (from the client)
- While answering any subject: black and white only. Colour is allowed only inside charts.
- Palette from Thammasat University: red #C3002F, yellow #FFD13F, orange #F2A73C for buttons, plus #00A1DF only on the landing CTA and the start button.
- Must not read as AI-generated. Easy to read, uncluttered.

## Voice
Plain Thai, short verbs, sentence case. Controls name their action.

## Evidence
Source is a single-file app (index.html) with api/generate.js.
