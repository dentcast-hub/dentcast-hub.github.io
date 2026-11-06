<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages and the three deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger step in this module: `C.4.14`. Read this module before C.1 when Question 4.9 answered «چالش»: its markup shapes the page of delivery 1.

### 4.14. چالش — public half on the page, private half in the admin queue

**Runs only when Question 4.9 answered «چالش».** `C.4.14` has exactly two outcomes: `completed` means *this post is a چالش* (its page carries the `data-dc-challenge-question` markup below and the English mirror is exempt); an ordinary post records `C.4.14` as **`skipped`**, never `completed`. Full design in `.dentcast/challenge-handoff.md`; this step summarizes its §11.3 and is not a second source of truth — read the handoff before touching this step.

Two halves, two homes; mixing them up is the one mistake that cannot be walked back once it is in git history (RULE 2):

1. **The public half — the question + image — goes ON THE PAGE**, inside the folder's normal prose box where an ordinary post's body would go (a چالش clones the same template; only the body differs). The question element carries `data-dc-challenge-question` and the image `data-dc-challenge-image` — exactly the markup `tools/build_challenge_index.mjs` reads. **Never** put the answer or the key points on the page, in the brain entry, or in any committed file.

   **Copy insight-68's markup exactly (RULE 18, handoff §11.3) — it is the reference implementation:**
   ```html
   <p data-dc-challenge-question data-dc-challenge-image="/insight/insight68.webp">
     …the question, verbatim…
   </p>
   ```
   Two things that must not drift: **no separate `<img>` tag** (the live JS draws the image from the attribute; a real `<img>` renders it twice), and the path is **site-absolute** (`/insight/insight68.webp`), never a bare filename (that 404s on the desktop 3-column shell, which injects the article inside `index.html` rather than an iframe). `tools/build_challenge_index.mjs` throws on a non-absolute path and Phase F's چالش row re-checks both.
2. After Push 2 the runner's C.8 runs `node tools/build_challenge_index.mjs` (after the pillar builder, before `build_plus_index.mjs`, plus the sitemap generator), so this `content_id` lands in the generated `plus/challenges.json`.

Then **print the founder's paste box** into the publish report, for `GET /admin` → «صندوق چالش» (the key points are the agent's draft from the answer, Question 4.9; the founder may edit them before pasting):

```json
{ "content_id": "chairside/chairside-31",
  "answer_fa": "…",
  "key_points": [ { "id": "kp1", "text": "…" }, … ] }
```

**Say explicitly, in the report, that the چالش is not live until that paste happens** — until the founder posts it to `/admin/challenges/upsert`, the page shows the question with no answer box (`GET /challenge/:id` answers `{exists:false}` and the block removes itself), so a half-published چالش is invisible rather than broken. This is expected, not a defect.

**A چالش skips the article-shaped steps** that assume prose — each gets its own explicit verdict in the report, never a silent skip (Hard Rule 11):

| step | on a چالش |
|---|---|
| 4.11 flashcards | **skip** — no FAQ; a چالش has no prose to define terms from |
| 4.12 quiz-ready FAQ | **skip** — same reason (and see RULE 1: never confuse this with `quiz-index.json`) |
| 4.13 DES | **skip, reported** — a question cites nothing and appraises nothing; write **no key** in `des-scores.json` |
| 4.12-ب / 5.6 / 5.6-ب exam, pathways & bundles | **skip** — a pathway step is something to read |
| Phase D en mirror | **skip** (Hard Rule 12's second exception, RULE 16) |

Steps 2.4 (pillar), 2.5 (کاوش بیشتر), 2.6 (landing page), 5.0 (hashtags: only the series tag), 5 (brain entry, per RULE 15 — the folder's ordinary shape, never a new `type`), 6 (Pulse), and the runner's E/F all **run** exactly as for an ordinary post in that folder.
