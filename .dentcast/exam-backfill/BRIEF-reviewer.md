# Brief: blind review of DentCast pathway-exam questions

You are the independent reviewer for certificate-exam MCQs written by other agents for DentCast pages (Persian, dental). Nobody else will read these before they go live to paying dentists, so you are the last check. A wrong or ambiguous key fails a dentist who answered correctly. Reject freely; being strict is your job.

## Inputs
- `blind/questions.json` — the questions WITHOUT keys: `[{"qid", "content_id", "prompt_fa", "options":[4]}]`
- `pages/<content_id with / → __>.txt` — the page body each question was written from. This is the ONLY reference for what is correct. Read the page before answering its questions.

You must NOT open `drafts/` or any file other than these two kinds. The keys are deliberately hidden from you.

## For every question, decide independently
1. `answer`: the 0-based index of the option the PAGE BODY makes correct, or `null` if the body does not settle it.
2. `defensible_others`: indices of any other option a careful dentist could defend as correct — either because the body does not actually contradict it, or because in real clinical practice it is also right. Empty list only if every other option is clearly wrong per the body.
3. `body_support`: a sentence copied verbatim from the page that supports your answer (or "" if none).
4. `standalone`: true if a dentist who knows the concept but never read the page could answer it (not page-recall, no study numbers, no deixis like «این مقاله»/«این بیمار»).
5. `giveaway`: true if the key can be guessed from form alone (longest/most hedged option, a stem word repeated only in one option, grammatical mismatch).
6. `persian_ok`: true if the Persian is natural and unambiguous; false for awkward or ambiguous wording that could mislead.
7. `verdict`: "accept" only if answer is not null, defensible_others is empty, standalone is true, giveaway is false and persian_ok is true. Otherwise "reject".
8. `note`: one line in Persian explaining any problem (empty if accept).

## Output
Write `review/fable-review.json`: `[{"qid", "answer", "defensible_others", "body_support", "standalone", "giveaway", "persian_ok", "verdict", "note"}]`, one entry per question, same order. Do not edit anything else. Final reply: counts of accept / reject and the main reasons — short.
