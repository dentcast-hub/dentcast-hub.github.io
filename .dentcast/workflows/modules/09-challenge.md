### 4.14. چالش — public half on the page, private half in the admin queue

**Runs only when Question 4.9 answered «چالش».** Full design in
`.dentcast/challenge-handoff.md`; this step is a summary of its §11.3, not a
second source of truth for it — read the handoff before touching this step.

Two halves, two homes, and mixing them up is the one mistake that cannot be
walked back once it is in git history (RULE 2):

1. **The public half — the question + image — goes ON THE PAGE**, inside the
   folder's normal prose box, the same place an ordinary post's body would go
   (a چالش clones the same page template; only the body differs). Mark up the
   question element with `data-dc-challenge-question` and the image with
   `data-dc-challenge-image` — `tools/build_challenge_index.mjs` reads exactly
   that markup. **Never** put the answer or the key points on the page, in the
   brain entry, or in any committed file.

   **Copy insight-68's markup exactly (RULE 18, handoff §11.3) — it is the
   reference implementation, not just the first example:**
   ```html
   <p data-dc-challenge-question data-dc-challenge-image="/insight/insight68.webp">
     …the question, verbatim…
   </p>
   ```
   Two things this is not allowed to drift on: **no separate `<img>` tag** —
   the image lives only as that data-attribute value, because insight-68's
   first draft had a real `<img>` *and* the live JS block redrawing the same
   image, so the question and the photo both rendered twice on the page
   before that was fixed. And the path is **site-absolute** (`/insight/
   insight68.webp`), never a bare filename — a bare filename happens to work
   on the standalone page but 404s on the desktop 3-column shell, which
   injects the article in place inside `index.html` rather than in an
   iframe. Both are enforced by `tools/build_challenge_index.mjs` (throws on
   a non-absolute path) and re-checked by `tools/verify_publish.py`'s چالش
   row — do not rely on memory for either.
2. Run `node tools/build_challenge_index.mjs` in step 8 (after the pillar
   builder, before `build_plus_index.mjs`) so this `content_id` lands in the
   generated `plus/challenges.json`.

Then **print the founder's paste box** into the publish report, for
`GET /admin` → «صندوق چالش»:

```json
{ "content_id": "chairside/chairside-31",
  "answer_fa": "…",
  "key_points": [ { "id": "kp1", "text": "…" }, … ] }
```

**Say explicitly, in the report, that the چالش is not live until that paste
happens** — until the founder posts this to `/admin/challenges/upsert`, the
page renders the question with no answer box at all (`GET /challenge/:id`
answers `{exists:false}` and the block removes itself), so a half-published
چالش is invisible rather than broken. This is expected, not a defect to fix
in this step.

**A چالش skips the article-shaped steps** that assume prose to work from —
give each its own explicit verdict in the report, never a silent skip
(Hard Rule 11):

| step | on a چالش |
|---|---|
| 4.11 flashcards | **skip** — no FAQ; a چالش has no prose to define terms from |
| 4.12 quiz-ready FAQ | **skip** — same reason (and see RULE 1: never confuse this with `quiz-index.json`) |
| 4.13 DES | **skip, reported** — a question cites nothing and appraises nothing; write **no key** in `des-scores.json` |
| 5.6 / 5.6-ب pathways & bundles | **skip** — a pathway step is something to read |
| Phase D en mirror | **skip — decided** (RULE 16, the second documented exception to Hard Rule 12 alongside LiteCast) |

Steps 2.4 (pillar), 2.5 (کاوش بیشتر), 2.6 (landing page), 5.0 (hashtags), 5
(brain entry, per RULE 15 — the folder's ordinary shape, never a new `type`),
6 (Pulse), and Phase E/F all **run** exactly as they would for an ordinary
post in that folder.
