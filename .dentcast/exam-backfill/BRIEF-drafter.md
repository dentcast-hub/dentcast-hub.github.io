# Brief: draft pathway-exam MCQs for DentCast pages (Persian)

You draft certificate-exam questions for pages that are steps of DentCast learning pathways. Readers are dentists. A wrong key fails a dentist who answered correctly, so a question you are not sure of is worse than no question.

## Inputs
- Page bodies (plain text, the ONLY knowledge source): `pages/<content_id with / → __>.txt`
- Existing questions in the pathways these pages belong to, keyed by pathway id (do not duplicate their concept): `existing-prompts.json`
- Standard (read it): repo file `/home/user/dentcast-hub.github.io/reports/exam-questions-from-quiz-2026-10-25.md` and section «4.12-ب» of `/home/user/dentcast-hub.github.io/.dentcast/workflows/modules/07-flashcards-and-quiz.md` (lines 68–80). Example of accepted rows: `byContent["insight/insight-73"]` in `/home/user/dentcast-hub.github.io/plus/exam-questions.json`.

## Rules (from the standard)
- 1 to 3 four-option MCQs per page. Fewer is fine for a thin page; 0 is allowed only if the page truly teaches no gradable concept (say why).
- Conceptual, not article-recall: a dentist who knows the concept but never read this page can answer. No study numbers, no «according to the authors», no single patient's story.
- Self-contained stem: no deixis («این مقاله»، «این مطلب»، «در متن بالا»، «این بیمار»…). Embed case conditions in the stem when the concept depends on them.
- Exactly four options, ONE correct per the body; the three distractors must be WRONG ACCORDING TO THE BODY (contradicted by it), not merely less complete or unmentioned. Same grammatical form and category; longest option ≤ 1.25× shortest (character count); the key must NOT be the single longest option; no «همهٔ موارد»/«هیچ‌کدام»; no option restating the stem; no stem word that recurs only in the key.
- Never yes/no dressed as two options; never a claim the body does not make; never an «it depends» forced into one key. Do not use your own dental knowledge to go beyond the body — if your knowledge disagrees with the body, skip that concept.
- Persian ی/ک (never Arabic ي/ك), ZWNJ (نیم‌فاصله) as the page writes, Latin terms as the page writes them.
- Vary the key position (`correct`, 0-based) across your questions.

## Output — one file per page: `drafts/<content_id with / → __>.json`
```json
{"content_id": "insight/insight-67",
 "questions": [
  {"prompt_fa": "…", "options": ["…","…","…","…"], "correct": 2,
   "reason": "one line, Persian: why the key is right per the body",
   "anchor_quote": "a sentence copied VERBATIM (byte-exact substring) from the page txt that supports the key",
   "distractor_refutation": ["for each of the 3 wrong options, in option order skipping the key: a short verbatim body quote or a one-line reason why the body makes it wrong"]}
 ],
 "skipped_concepts": ["optional: concept + why you dropped it"]}
```
`anchor_quote` is checked mechanically as a substring of the page txt; if it is not byte-exact the question is discarded.

## Mechanical check — run before finishing, fix every ERROR and every leak WARN
`cd /home/user/dentcast-hub.github.io && python3 tools/validate_exam_questions.py --draft-check <your draft file>`
(it reads `questions[]` and ignores the extra fields).

Do not edit any repo file. Write only into the drafts/ folder. Final reply: per page, number of questions written and any skipped concepts — short.

## Lessons from reviewed batches — the blind reviewer rejects these
1. Distractors that all use absolutes («فقط»، «به‌تنهایی»، «هیچ»، «کاملاً») while the key is the only hedged or inclusive option.
2. A key that is the only option with opposite polarity, or the only one echoing a stem word.
3. A distractor that is a recognised clinical technique the page merely does not mention — distractors must be clearly WRONG, not just absent from the page.
4. Source-specific numbers, or one author's position presented as settled fact when a dentist could reasonably hold another view.
5. Ambiguous Persian. Make distractors plausible and parallel in form.
6. Distractors must not share a pattern the key lacks (three options «…بدونِ X» and the key not; three «ثابت می‌کند» and the key «شاید»; three "advantages" and the key a "problem"). Vary structure so the key's form matches at least one distractor.
