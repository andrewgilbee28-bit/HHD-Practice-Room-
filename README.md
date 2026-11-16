# HHD Practice Room

VCE Health and Human Development Units 1 & 2 exam practice for Year 11 students.

- 45 questions (42 short answer, 3 extended responses) across all five areas of study, each with a VCAA-style marking guide and a model answer.
- No logins and no accounts. Nothing a student writes leaves their browser.
- Marking is a guided self-check. Automatic checks flag common VCAA mistakes, then the student marks their own answer point by point against the marking guide, with the model answer beside it. The site does not use AI to mark.
- Progress, a 7-day revision plan and history are saved in the student's browser on that device.

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | The design (light and dark mode, phone layout) |
| `app.js` | How the site works: question list, self-check marking, progress |
| `questions.js` | The question bank: case studies, questions, marking guides, model answers |

## Editing questions

All questions are in `questions.js`. Each marking guide line must start with its mark value so the self-check can score it:

- `1 mark: …` or `2 marks: …`
- `1 mark each (×2): …` (becomes two separate points)
- `2 marks per dimension (×2): …`
- `Note: …` (shown to students, never scored)
- Extended responses use `Criterion 1: …` lines plus one `Holistic bands: 7–8 = …; 5–6 = …; 3–4 = …; 1–2 = …; 0 = …` line.

If a guide doesn't add up to the question's marks, the browser console shows a warning naming the question.

## Privacy

There's no server, database, analytics or AI service. The only outside request is to Google Fonts for the typefaces, which shares the visitor's IP address with Google but no answers. Answers are stored in the browser's local storage. On a shared computer, the next person using the same browser can see them, so students can use **Clear my progress** on the Progress page.
