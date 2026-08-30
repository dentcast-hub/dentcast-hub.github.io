# چالش — handoff

Build this exactly as written. Every decision below is already made; nothing
here is a suggestion. Where a Persian string is given, use it character for
character. Where a rule is marked **RULE**, it exists because the alternative
was already considered and rejected for the reason attached — do not "improve"
it.

---

## 0. What this is, in one paragraph

A **چالش** is a **post whose body is a question**. It is published through the
ordinary publishing router, into an **existing folder** — `chairside/`,
`insight/`, whichever the founder names — taking that folder's next number and
that folder's brain shape. It is not a new folder and not a new brain type
(RULE 15). What differs is the *page*: where a chairside post carries an article,
a چالش carries a question, an image, and a box the reader writes a free-text
answer into.

The founder gives the question **and the answer** at publish time. Only the
question is published; the answer stays in the database and is released to one
person at one moment — **the reader who just answered** (RULE 6).

On submit, a model compares the reader's answer against **key points the founder
wrote at publish time** and decides, per key point, whether it was covered. If
the model is not sure about even one of them, no verdict is shown — the attempt
goes into the founder's queue in `GET /admin`, the founder rules, and the reader
is told in اطلاعیه.

**Reading the question is public. Everything else is premium.** A signed-out or
free reader gets the question, the image, and one line saying answering is part
of premium — **no answer box at all** (RULE 11), no answer, no verdict. The lock
arrives before the effort, never after it.

A premium reader writes once and gets **whether their answer was right, and then
the founder's answer** — that is the payoff, and it is why one attempt is all
anyone gets. A fully-correct answer earns score, league XP, and the «چلنجر»
badge; a miss earns none of those.

The model **never writes a sentence a reader sees.** It returns a verdict per
key point from a closed three-value set, and plain code renders a verdict word.
See RULE 2.

---

## 1. Naming — read this before you create a single file

**The word «quiz» is already taken and this feature is not it.**
`plus/quiz-index.json` (167 pages, ~380 binary questions) is a scored yes/no
bank derived from each page's FAQ corpus, built by
`tools/build_quiz_index.mjs`, authored under workflow **step 4.12**, and gated
by `tools/verify_publish.py:1207`. It has no reader surface and no API
consumer today — it is a built, dormant asset waiting for a frontend.

This feature is a different object: founder-authored, one per page, open
free-text answer, model-assisted grading, a founder queue. It is called
**چالش / challenge** everywhere — tables, files, routes, CSS classes, XP
action, badge.

> **RULE 1 — Never merge these two, never rename either.** A future reader of
> the code will notice two quiz-shaped things and want to unify them. They are
> not unifiable: one is derived mechanically from FAQ text and graded by string
> equality against a boolean, the other is hand-authored and graded by a model
> against prose key points. Merging them would put a model in the path of the
> binary bank (which needs none) and a boolean answer key in the path of an
> essay (which cannot have one). If a surface for `quiz-index.json` is ever
> built, it is a separate feature with a separate name.

---

## 2. The flow, end to end

```
READER                          SYSTEM                        FOUNDER
──────                          ──────                        ───────
                                                     publishes a page with
                                                     چالش: question + image
                                                     + 3–5 نکات کلیدی
                                                     (step 4.14; answer filed
                                                      via GET /admin)
reads the article
sees the چالش block
(public: question + image)

    ├─ not premium ──► the lock line, NO BOX. ends here.
    └─ premium     ──► the box

writes an answer,
presses «بفرست»
                    ──►  requirePremium on the route too
                    ──►  one attempt per (user, page)
                    ──►  ai.matchKeyPoints(key_points, answer, examples)
                         ├─ every point covered/missing  ──► SETTLED NOW
                         │      «N از M نکته» + THE FOUNDER'S ANSWER
                         └─ ANY point «unsure»           ──► QUEUED
                                reference code C-XXX-XXX
                                + THE FOUNDER'S ANSWER anyway
                                                              sees it in GET /admin
                                                              ticks each key point
                                                              presses «ثبت و اطلاع بده»
                                     ◄── ruling stored as an EXAMPLE
                                     ◄── اطلاعیه sent
sees the dot on 🔔
opens اطلاعیه → the verdict
```

Score is awarded when the attempt settles as **`full`** — see §8.

---

## 3. Files

| Action | Path |
|---|---|
| create | `plus-api/migrations/0053_challenges.cjs` |
| create | `plus-api/migrations/0054_challenge_xp.cjs` |
| create | `plus-api/src/services/challenge.ts` |
| create | `plus-api/src/routes/challenge.ts` |
| edit | `plus-api/src/server.ts` — import + `app.register(challengeRoutes)` |
| edit | `plus-api/src/providers/ai/types.ts` — the second provider method (§6) |
| edit | `plus-api/src/providers/ai/openai-compatible.ts` — implement it |
| edit | `plus-api/src/providers/ai/stub.ts` — implement it (§6.4) |
| edit | `plus-api/src/routes/admin.ts` — the «صندوق چالش» block (§7) |
| edit | `plus-api/src/services/notify-policy.ts` — `challenge_ruled`, UNCAPPED |
| edit | `plus-api/src/providers/notifications/types.ts` — the kind + its doc comment |
| edit | `plus-api/src/services/merge-profiles.ts` — carry `challenge_attempts.user_id` |
| edit | `plus-api/src/services/score.ts` — `challenge_answered` in `SCORING_ACTIONS` |
| edit | `plus-api/src/config.ts` — the `challenge` block (§10) |
| edit | `plus/badges.json` — the «چلنجر» badge (§8.3) |
| edit | `plus-api/src/services/achievements.ts` — the `challenges_settled` metric |
| create | `plus/js/challenge.js` |
| edit | `plus/plus.css` — the block's CSS (§9.4) |
| edit | `plus/plus.js` — mount at all four sites (§9.1) |
| create | `tools/build_challenge_index.mjs` |
| create | `plus/challenges.json` — generated, public half only |
| edit | `.dentcast/workflows/README.md` — Phase B Question 4.9 + step 4.14 |
| edit | `CLAUDE.md` — Hard Rule 12's exception list + the conventions entry (§11.6) |
| edit | `AGENTS.md`, `.cursor/rules/dentcast-router.mdc` — the parity mirror, same commit |
| edit | `tools/verify_publish.py` — the چالش row (§11) |
| create | `plus-api/test/challenge.test.ts` |
| create | `plus-api/test/challenge.dom.test.ts` |

Latest existing migration is `0049_share_xp_boost.cjs`. Confirm before numbering.

Read these four first; they are the patterns to copy, not invent:
- `plus-api/src/services/des-requests.ts` — a reader queue with a founder inbox,
  which itself says it "Mirrors `services/support.ts`'s ticket queue on purpose"
- `plus-api/src/routes/case-assistant.ts` — the only route that spends model
  money: rate limit, `recordActivity` after the call resolves, never before
- `plus/js/article-threads.js` — the lazy block under the prose that removes
  itself when there is nothing to show
- `.dentcast/des-scorer-handoff.md` §7 — the admin block this one mirrors

---

## 4. Where the answer lives — the decision that shapes everything

The reader-facing half of a چالش (question, image, the invitation line) is
**public**, generated into `plus/challenges.json` by the builder and fetched by
the browser. The **answer and the key points are never in the repo and never in
any published file.**

> **RULE 2 — The key points live in the database only, written through
> `GET /admin`.** The obvious design is a sidecar beside `des-scores.json` and
> `flashcards-index.json`. It cannot be used here. Those files are fetched by
> the browser — `plus/js/des.js` does `fetch('/plus/des-scores.json',
> { credentials: 'omit' })` — and this repo *is* the website, so anything
> committed is readable at a URL. A `robots.txt` entry is not a permission
> system. An answer key in a published file defeats the premium gate and the
> feature itself in one devtools tab. It is also the wrong home for a second
> reason: a wrong key point should be fixable in thirty seconds without a
> deploy, which the DB gives and a committed file does not.

So the publish workflow (step 4.14) writes the public half and **prints the
proposed key points into the publish report**; the founder pastes/edits them
into the admin form once. This is the same motion the DES scorer already asks
of them and costs one paste per چالش publish.

---

## 5. Migration `0050_challenges.cjs`

Write a header comment in the style of `0044_referrals.cjs`.

```sql
-- The founder's half. One row per page that HAS a چالش.
-- key_points is [{ id: 'kp1', text: '…' }, …] — 3 to 5 of them.
create table challenges (
  content_id  text primary key,
  answer_fa   text not null,
  key_points  jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A reader's single attempt. verdict is [{ id, state, by }] where
-- state ∈ covered|missing and by ∈ 'ai'|'founder'. NULL while queued.
create table challenge_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content_id  text not null references challenges(content_id) on delete cascade,
  answer_text text not null,
  reference   text not null unique,
  status      text not null default 'queued',
  verdict     jsonb,
  created_at  timestamptz not null default now(),
  settled_at  timestamptz,
  check (status in ('queued','settled'))
);
create unique index challenge_attempts_one_per_page
  on challenge_attempts (user_id, content_id);
create index challenge_attempts_queue
  on challenge_attempts (created_at) where status = 'queued';

-- A founder ruling, kept as a worked example for the SAME challenge.
-- This is what makes the queue shrink as a چالش ages (§6.3).
create table challenge_examples (
  id          uuid primary key default gen_random_uuid(),
  content_id  text not null references challenges(content_id) on delete cascade,
  answer_text text not null,
  verdict     jsonb not null,
  created_at  timestamptz not null default now()
);
create index challenge_examples_content
  on challenge_examples (content_id, created_at desc);
```

**`merge-profiles.ts` must carry `challenge_attempts.user_id`.** Without it a
profile merge cascade-deletes a reader's attempts, which are score-bearing.
`challenge_examples` has no user column on purpose — an example is a ruling
about *text*, and it outlives the account that produced it.

> **RULE 3 — One attempt per reader per page, enforced by the unique index,
> never by a count.** Submitting reveals the founder's answer (RULE 6), so a
> second attempt is not a retry — it is answering with the answer on screen.
> There is no version of this where attempt two means anything, which is also
> why the reader is told before they write that they get one. The unique index
> is the enforcement; do not add a friendlier "attempts_used" column that can
> drift from it.

---

## 6. The AI contract

### 6.1 The interface gains a second method

`AiProvider` today has exactly one method, `selectTags`, and its doc comment
says the model "never gives a diagnosis or free-form advice". Add a second
method of the same character — closed input, closed output, nothing free-form.

```ts
export interface KeyPoint { id: string; text: string; }
export interface MatchExample { answer: string; verdict: { id: string; state: 'covered'|'missing' }[]; }

export interface MatchKeyPointsInput {
  /** The founder's key points, 3–5 of them. The model may return no other id. */
  keyPoints: KeyPoint[];
  /** The reader's answer, capped by the route at config.challenge.maxAnswerChars. */
  answer: string;
  /** Founder rulings on earlier answers to THIS challenge, most recent first. */
  examples: MatchExample[];
}

export type PointState = 'covered' | 'missing' | 'unsure';

export interface AiProvider {
  readonly name: string;
  selectTags(input: SelectTagsInput): Promise<string[]>;
  /**
   * For each key point, did the reader's answer cover it? Returns one entry per
   * key point, in the same order, or [] on anything unusable — which the caller
   * treats exactly like an all-`unsure` answer and queues.
   */
  matchKeyPoints(input: MatchKeyPointsInput): Promise<{ id: string; state: PointState }[]>;
}
```

Implement it on `OpenAiCompatibleProvider` with the existing private helpers —
`this.withRetry(() => …)` around one `this.chatJson(SYSTEM, userContent)`. Do
not add a second HTTP path, a second timeout, or a second retry policy.

### 6.2 The three-value verdict is the confidence mechanism

> **RULE 4 — Never ask the model for a confidence number.** The founder's
> requirement is "answer only where it is ≥90% sure, otherwise wait for me".
> The naive implementation asks for `confidence: 0–100` and thresholds it. That
> number is not a probability: models cluster it on round values and it tracks
> the shape of the request more than the correctness of the answer, so the
> threshold produces confidence theatre and queues nothing. The requirement is
> instead met **structurally**: each key point gets `covered`, `missing`, or
> `unsure`, and `unsure` is a first-class answer the prompt actively invites.
> That is a classification, which is the one thing this model is being trusted
> with anywhere on this site.

**Any `unsure`, on any key point, queues the whole attempt.** Not the point —
the attempt. A partial verdict with one hole is not showable and not storable.

The same treatment applies to every degraded outcome: `[]` from the provider, a
wrong-length array, an unknown id, a state outside the three, or a thrown error
after retries. All of them queue. **A model failure must never be rendered as
«missing»** — that tells a reader they were wrong because a gateway hiccuped.

### 6.3 Examples — why the queue shrinks

Every founder ruling is written to `challenge_examples` for that `content_id`,
and the newest `config.challenge.maxExamples` (12) are passed into the next
call for the same چالش. A چالش therefore gets *more* automatic as it ages: the
first readers teach it the ways people phrase this particular answer, and later
readers are settled instantly.

This is the same move DES's library makes one level over — there, the second
reader to submit a paper is answered with no queue at all; here, the second
reader to phrase an answer a familiar way is.

Cap it at 12 and order by `created_at desc`. Unbounded examples would grow the
prompt without bound on the most popular چالش, which is exactly where cost
matters most.

### 6.4 The stub

`StubAiProvider.matchKeyPoints` returns `[]`. With `AI_PROVIDER=stub` (the
default, and what CI runs) every attempt therefore queues, which is the correct
degraded behaviour and lets every test below run without a key.

### 6.5 The system prompt

Store it as a module constant beside `SELECT_TAGS_SYSTEM_PROMPT`. English, like
its neighbour. Do not add examples of clinical content to it — the examples
come from `challenge_examples` at call time.

```
You compare a student's written answer against a list of key points an expert
wrote in advance. You are not a teacher, an examiner, or a clinician. You do
not evaluate whether the answer is medically correct, only whether each key
point is present in it.

For each key point, answer exactly one of:
  "covered" — the answer states this point, in any wording, including a
              paraphrase or an equivalent clinical synonym.
  "missing" — the answer does not state this point at all.
  "unsure"  — you cannot tell. Use this whenever the answer is ambiguous,
              partially states the point, uses a term you cannot confidently
              map onto it, or is written in a way you cannot parse.

"unsure" is a correct and expected answer. A human reviews every "unsure",
so choosing it costs nothing and is always better than a guess. Never choose
between "covered" and "missing" to avoid it.

Judge only the key points given. Never invent a key point, never merge two,
never comment on anything the answer says beyond them.

Answer with a bare JSON object and nothing else:
{"points":[{"id":"kp1","state":"covered"},{"id":"kp2","state":"unsure"}]}
Return exactly one entry per key point, in the order given.
```

> **RULE 5 — The model is never shown the founder's prose answer.** It sees the
> key points, the reader's answer and the examples. Showing it `answer_fa`
> invites it to grade the essay against the essay — a similarity judgement over
> two paragraphs, which is exactly the open-ended reasoning this design removed.
> The key points are the interface; the prose is for the reader.

### 6.6 Validate the output

In `services/challenge.ts`, before anything is stored or shown:
one entry per key point · every `id` in the key-point set, no extras, no
duplicates · every `state` in the three. Any violation → treat as all-`unsure`
and queue. Same posture `case-assistant.ts` takes when it re-validates every
tag the model returns against the live content index.

---

## 7. Routes

### 7.1 Reader — `plus-api/src/routes/challenge.ts`

```
GET  /challenge/:contentId        requireAuth-optional  → the reader's own state
POST /challenge/:contentId/answer requireAuth + requirePremium
```

**`GET /challenge/:contentId`** is the only endpoint here without
`requirePremium`, and it must stay that way — the block needs to render for a
signed-out reader. It returns `{ exists: true }` plus, when the caller has an
attempt, that attempt's `status`, `answer_text`, `answer_fa`, and — only when
settled — `result` and `covered_count` / `point_count` (§7.2).

> **RULE 6 — `answer_fa` is released by ONE fact and one only: this reader has
> an attempt row for this `content_id`.** Not by being premium, not by being
> signed in, not by asking twice. Having written an answer is what buys the
> answer, which is the whole shape of the feature — publishing only the question
> is what makes the answer worth having, and a premium reader who has not
> written anything is in exactly the position everyone else is.
>
> Derive it from the attempt query, never from the session: `answer_fa` is
> attached where the attempt is found, so there is no branch that can be true
> with no attempt in hand. A tier check is the wrong gate here and would grant
> it to every subscriber who merely opened the page.
>
> **The key-point TEXTS stay server-side regardless** — they are the grading
> rubric, they leave with the model call and nowhere else, and §7.2 reduces the
> per-point array before it crosses the wire. The route shapes its response
> object explicitly: never `select *`, never spread the challenge row into a
> reply.
>
> Two consequences of "the attempt row is the key", both correct, both worth
> stating so nobody `requirePremium`s them away later. **A reader whose
> subscription has lapsed still sees the answer to a چالش they answered while
> subscribed** — they paid, they wrote, it is theirs; taking it back would be
> the only place on this site where expiry removes something already earned.
> And **a lapsed reader still cannot answer a NEW چالش**, because that needs a
> new attempt row and `POST` is `requirePremium`. One rule produces both.

**`POST /challenge/:contentId/answer`**, in order:

1. `consume('challenge:' + userId, config.challenge.maxPerUserPerHour, HOUR_MS)`
   → 429 `{ error: 'rate_limited', retry_after_ms }`. Same guard shape as
   `case-assistant.ts`, and for the same reason: this is the second route on
   the site that spends real money per call.
2. Trim the answer, cap at `config.challenge.maxAnswerChars` (1500). Empty or
   under `minAnswerChars` (40) → 400 `{ error: 'answer_too_short' }`.
3. `insert … on conflict do nothing` on `challenge_attempts`. No row inserted →
   409 `{ error: 'already_answered' }`, and return the existing attempt so the
   client can render it rather than showing an error.
4. Call the model. On a clean verdict → `status='settled'`, `verdict`,
   `settled_at`. On anything else → leave `status='queued'`.
5. `awardIfCorrect` — writes `challenge_answered` **only** when the reduced
   result is `full`. Queued / partial / none write nothing. A later founder
   ruling of `full` is the other call site.
6. Return `{ status, reference, answer_fa }` plus, when settled, the §7.2
   verdict. **`answer_fa` is returned in both branches** — a queued reader has
   written their answer and earned it; only the verdict on their own text is
   pending. Never `key_points`, never the per-point array.

### 7.2 What a settled attempt returns

The per-point array is stored in `challenge_attempts.verdict` — the founder
needs it in the queue and the examples are built from it — but it is **reduced
before it crosses the wire**:

```ts
{ result: 'full' | 'partial' | 'none',   // covered === total | > 0 | 0
  covered_count: number,
  point_count: number }
```

Do the reduction in `services/challenge.ts` in one exported function and call it
from both `GET` and `POST`. Two shapes for one answer is how the raw array ends
up on the wire from the endpoint somebody edits later.

The count is deliberately not a per-point checklist even though `answer_fa` is
now on screen beside it and a checklist would leak nothing further. Reading the
founder's answer and working out which two you missed is the learning act;
ticking the boxes for the reader does that work for them. It is a one-line
change if it is ever wanted (§14).

> **RULE 7 — Score is awarded only on a `full` verdict, after the model (or
> the founder) has spoken.** A wrong or partial answer writes no
> `challenge_answered` row: no shield points, no league XP, no badge credit.
> A queued attempt waits; if the founder then rules it full, `awardIfCorrect`
> runs at settle time. The original v1 rule recorded score on submit so a
> model error could not cost the reader points — that is the thing this
> revisits, founder decision 1405/06/07: being right is what is valuable, and
> a miss is zero rather than a consolation. `POST /activity` refuses the
> action; only this service mints the row.

### 7.3 Founder — added to `routes/admin.ts` behind the existing admin guard

```
GET  /admin/challenges                  → { pending: [...], count }
GET  /admin/challenges/by-reference/:ref
POST /admin/challenges/upsert           → { content_id, answer_fa, key_points }
POST /admin/challenges/attempts/:id/rule → { verdict: [{id, state}] }
```

`POST /admin/challenges/upsert` is where a چالش is created and edited
(`on conflict (content_id) do update`, touching `updated_at`). Validate: 3–5
key points, each with a non-empty `id` and `text`, ids unique.

`POST /admin/challenges/attempts/:id/rule` in one transaction:
1. reject `state: 'unsure'` in the founder's own verdict — 400. The queue is
   where ambiguity is resolved, not deferred again.
2. every id present, exactly the challenge's key points
3. `challenge_attempts` → `status='settled'`, `verdict` (each entry stamped
   `by: 'founder'`), `settled_at`
4. insert into `challenge_examples`
5. `awardIfCorrect` — only if the ruling is `full`
6. `sendCapped(userId, …, 'challenge_ruled')`

### 7.4 The admin page block

Insert into `renderHtml` in `routes/admin.ts` immediately **after** the
«ارزیاب DES» block, mirroring its markup conventions exactly: `<h3>`, `.muted`,
`<form class="bc" onsubmit="return false">`, `.pill`, `.pill.hot`, an inline
`<script>` that fetches and renders, and the local `esc` and `when` helpers.
Copy the small CSS into the page's existing `<style>`; introduce no stylesheet.

```html
<h3 style="margin-top:26px">صندوق چالش <span id="chWaiting" class="pill"></span></h3>
<div class="muted">پاسخ‌هایی که مدل مطمئن نبود. قدیمی‌ترین بالاتر. هر نکته را
  تیک بزن یا خالی بگذار.</div>
<div id="chList"></div>
```

Each queued row is a card carrying `<b>{content_id}</b>`, the reference pill,
the reader's `display_name` and `when(created_at)`, the answer in a scrollable
`.tk-x`, and one checkbox per key point (label = the key point's text, checked
= `covered`). One «ثبت و اطلاع بده» button. Ordered oldest-first — whoever
waited longest for a human is first, the same ordering the support queue uses.

---

## 8. Score, and what it buys

### 8.1 The action

Add `challenge_answered` to `SCORING_ACTIONS` in `services/score.ts` (active
day) and to `QUALIFYING_ACTIONS` in `streak.ts`. It is **not** in
`CONSUMPTION_ACTIONS`. A correct چالش has its own term:
`challenges_correct * POINTS_PER_CHALLENGE` where `POINTS_PER_CHALLENGE = 10`
— twice an article. The row is written only by `awardIfCorrect`, only when
`reduceVerdict` is `full`.

It belongs in SCORING_ACTIONS and `content_shared` does not, on that file's
own stated test: a share "costs one second, and score is never deducted", so
it would be a farm. A fully-correct answer is minutes of writing, capped at
one per page by the unique index in §5.

> **RULE 8 — Never deduct for a wrong answer.** `score.ts`: "Score is never
> deducted — a threshold is a milestone, not a purchase." A miss earns
> **nothing** (no row), which is not a deduction. Do not subtract points, do
> not write a negative, do not "undo" a full that was later reconsidered —
> there is no second attempt (RULE 3).

**Score is for being right.** Partial and none are zero. A queued reader
waits for the founder; that wait is the cost of model-uncertainty, not a
punishment for writing.

### 8.2 League

`xp_challenge = 5` (same weight as `xp_read` / `xp_listen`),
`xp_challenge_weekly_cap = 0` (no ceiling: supply is founder-gated). Migration
`0054_challenge_xp.cjs`. `POST /activity` must refuse the action so a client
cannot mint the row. Weekly XP already granted under the v1 "score on submit"
rule is not unwound; the all-time score is derived from the log, so 0054's
DELETE of non-full rows is enough for shields.

### 8.3 The badge — «چلنجر»

Append to `plus/badges.json` following the `treasury` entry's shape exactly.
Every badge is derived, so this needs no migration and is retroactive by
construction. Silver/gold discounts are the file's existing convention (٪۱
and ٪۲).

```json
{
  "key": "challenger",
  "title_fa": "چلنجر",
  "icon": "target",
  "group": "premium",
  "premium": true,
  "leveled": true,
  "visibility": "always",
  "metric": "challenges_settled",
  "locked_fa": "اولین چالش را درست جواب بده.",
  "detail_fa": "فقط جوابِ کامل امتیاز می‌سازد — اشتباه صفر است.",
  "levels": [
    { "tier": "bronze", "threshold": 1,
      "unlock_fa": "اولین چالش را درست جواب دادی." },
    { "tier": "silver", "threshold": 15,
      "unlock_fa": "پانزده چالشِ درست. این دیگر عادت است، نه کنجکاوی.",
      "discount_percent": 1 },
    { "tier": "gold", "threshold": 50,
      "unlock_fa": "پنجاه چالشِ درست — پیش از هر جوابی، جوابِ خودت را نوشته‌ای.",
      "discount_percent": 2 }
  ],
  "unit_fa": "چالش"
}
```

Count **fully-correct settled attempts only** — the same fact that writes the
score row, so the wall and the shield number cannot disagree:

```sql
(select count(*)::int from challenge_attempts a
  where a.user_id = $1
    and a.status = 'settled'
    and a.verdict is not null
    and jsonb_array_length(a.verdict) > 0
    and not exists (
      select 1 from jsonb_array_elements(a.verdict) e
       where e->>'state' is distinct from 'covered'
    )) as challenges_settled,
```

The silver/gold `discount_percent` values are the file's existing convention
(٪۱ and ٪۲, capped with everything else at `CREDIT_CAP_PERCENT`). Nothing else
is needed to make them real — the credit engine reads `badges.json`.

---

## 9. Frontend

### 9.1 Mounting

`plus/js/challenge.js` exports `mountChallenge(anchor, contentId, scope)`, drawn
lazily behind an `IntersectionObserver`, following `article-threads.js` line
for line.

There are **four** mount sites in `plus/plus.js`, not two. Add a call
immediately **before** the `mountArticleThreads` call in each:

| # | function | line | anchor |
|---|---|---|---|
| 1 | `initEpisodeActions()` — standalone episode | ~313 | `findProseEnd() \|\| box` |
| 2 | `initArticle()` — standalone article | ~353 | `findProseEnd() \|\| proseRoot` |
| 3 | `mountArticleWorkbench()` episode branch — desktop shell, column C | ~437 | `findProseEnd(root) \|\| box` |
| 4 | `mountArticleWorkbench()` article branch — desktop shell, column C | ~450 | `findProseEnd(root) \|\| proseRoot` |

On the two shell sites `findProseEnd` takes `root` and the mount takes the same
`root` as its scope — copy `mountDesHere`'s signature there exactly.

> **RULE 9 — Mount on all four, including episodes, and let the data decide.**
> Do not add an "articles only" condition. Both neighbours in this area learned
> this the hard way and say so in their own comments: DES mounts on episodes
> "and NOT because episodes are special — the badge is driven entirely by
> whether `plus/des-scores.json` has a record", and گفت‌وگوی زیر مطلب reached
> articles only "because `initArticle()` mounts it and `initArticle()` bows out
> here — an accident of where the call sat, not a decision… a podcast was never
> excluded, only unreachable". A چالش is written against a `content_id` and
> nothing else. If a podcast should not have one, it gets no row in
> `challenges.json` and the block removes itself.

Anchor on **`findProseEnd()`**, never `findProseBox()`.

> **RULE 10 — `findProseEnd()`, and this is not a style preference.** On every
> page whose body is a single box the three anchors in `config.js` agree, which
> is why picking the wrong one stays invisible in testing. گفت‌وگوی زیر مطلب
> shipped on `findProseBox()` and read correctly on 400-odd pages while opening
> after section 1 of 8 on the 26 legacy NoteCast pages. `findProseRoot()` is not
> the fix either — on exactly those pages it is `main.article-content-wrap`, so
> inserting after it lands outside the article shell.

Order under the prose is: چالش → گفت‌وگوی زیر مطلب → ارزیابی شواهد. Insert
before `mountArticleThreads` so the block that asks the reader to *do* something
comes above the one that shows what others said. Follow `mountBottomActions`'s
comment at `plus.js:137` for how the ordering of `afterend` insertions is kept
deterministic when one of them awaits.

**The block removes itself when there is nothing to show** — no چالش for this
`content_id` in `plus/challenges.json`, or a fetch failure. A heading with an
upsell under it is an advert on every page.

### 9.2 The gate

Exactly one thing is public: **the question and its image.** A reader who is not
premium sees that, plus one line saying answering is part of premium. Nothing
else — no answer, no key points, no verdict, and **no answer box**.

> **RULE 11 — The box is not rendered for a reader who cannot submit.** Decide
> the view on load from `/me`, the way every other gated surface on this site
> already does; do not render the textarea to everyone and reject on submit.
> That version is worse than a lock: it invites somebody to think about a
> clinical question, type out a real answer, press «بفرست» and only then be told
> it was never going to be accepted. The lock has to arrive **before** the
> effort, not after it. It is also the only version that can lose their text.
>
> This is presentation only. **`POST` stays `requirePremium` regardless** — a
> hidden box is not an authorization check, and the route is what actually
> enforces this.

> **RULE 12 — Three answers, never two.** Signed out → the sign-in path leads
> and the purchase link follows quieter (they may be a subscriber logged out on
> this device). Free → the premium card. **Anything else — `/me` failed, the
> API is mid-redeploy — is «we could not ask», and must never render as an
> upsell.** A redeploy is minutes of exactly that. `premium-cta.js`'s
> `unreachableGate` exists for this and is what you reuse. In that third state
> render the question and stop: no box, no lock copy, no card.

### 9.3 Views

`idle` (the box — **premium only**) · `sending` · `settled` · `queued` ·
`locked` (the question + the lock line, **no box**) · `unknown` (the question
alone, when `/me` could not be reached — RULE 12) · `done` (the reader's own
earlier attempt, re-rendered on a later visit — `GET` returns it, so a returning
reader never sees an empty box).

`locked` and `unknown` are the two views a non-premium reader can ever get, and
neither contains a `<textarea>`.

**`settled`** shows, in this order: the reader's own answer back, the verdict
word with the count line, then **the founder's answer** under its own heading.
**`queued`** is the same page with the verdict area replaced by the reference
code in a monospace dashed box and the waiting line — the founder's answer is
in the same place, at the same moment.

> **RULE 13 — The founder's answer appears on submit, in every branch,
> including queued and including a model failure.** It is what the reader came
> for; the verdict is commentary on it. A queued reader shown nothing but a wait
> message has spent their one attempt and been given nothing, and a model
> hiccup is the worst possible reason for that.
>
> The verdict is a **result, never a correction**: the count says how many key
> points were covered, never which, and no key point is ever named on screen.
> The reader works out what they missed by reading the answer — which is the
> learning act, and which is why the answer is the largest thing in the view and
> the verdict is one line above it.

### 9.4 CSS

Goes in `plus/plus.css`, **not** `dc-article.css`.

> **RULE 14 — plus.css, for the same reason article threads live there.** The
> desktop shell keeps `plus.css` and strips `dc-article.css`, which is linked by
> article pages alone; `index.html` loads no shared CSS at all. A block that
> mounts on both surfaces cannot be styled in a file only one of them has.

Colour: the site's blue. **Never amber** — amber means «this is what a
subscription buys» site-wide, and the چالش itself is public; only the locked
state may show the amber premium card, which `premium-cta.js` already owns.
Never `--des-chrome`, which means "a machine wrote this panel" — here a human
wrote the question and the answer, and the machine only ticked boxes.

### 9.5 Copy — use verbatim

| where | string |
|---|---|
| heading | `چالش` |
| invite | `اول خودت جواب بده، بعد جوابِ من را ببین.` |
| box placeholder | `جوابت رو اینجا بنویس .فقط خودت میبینیش و توسط هوش مصنوعی با جواب اصلی تطابق داده میشه.در صورت درستی امتیاز میگیری و نکته ی کلینیکی هم نمایش داده میشه` |
| submit | `بفرست` |
| under the box | `فقط یک بار می‌توانی جواب بدهی — چون بعدش جوابِ من را می‌بینی.` |
| too short | `کمی بیشتر بنویس تا بشود سنجید.` |
| locked (title) | `جواب‌دادن بخشی از پریمیوم است` |
| locked (body) | `سؤال برای همه باز است. جواب‌دادن — و دیدنِ جوابِ من — بخشی از پریمیوم است.` |
| signed out | `برای جواب‌دادن وارد شو.` |
| unreachable | `الان نتوانستیم بررسی کنیم. کمی بعد دوباره امتحان کن.` |
| your answer heading | `جوابِ تو` |
| result `full` | `درست بود` |
| result `partial` | `تا حدی درست بود` |
| result `none` | `درست نبود` |
| count line | `{N} از {M} نکته‌ی کلیدی` |
| queued (title) | `جوابت رسید` |
| queued (body) | `این یکی را خودم می‌خوانم — مدل مطمئن نبود. نتیجه در **اطلاعیه‌ات** می‌آید. جوابِ من را همین حالا ببین.` |
| answer heading | `جوابِ من` |
| already answered | `به این چالش قبلاً جواب داده‌ای.` |
| footer | `تطبیق با نکات کلیدی انجام می‌شود، نه با کلمه‌به‌کلمه‌ی جواب.` |

---

## 10. Config

```ts
challenge: {
  maxPerUserPerHour: int('CHALLENGE_MAX_PER_USER_PER_HOUR', 10),
  maxAnswerChars:    int('CHALLENGE_MAX_ANSWER_CHARS', 1500),
  minAnswerChars:    int('CHALLENGE_MIN_ANSWER_CHARS', 40),
  maxExamples:       int('CHALLENGE_MAX_EXAMPLES', 12),
},
```

No new AI config. This feature uses `config.ai` unchanged — same provider, same
model, same timeout, same retry budget. Nothing about it requires a different
endpoint or a reasoning model: the task is closed-output classification against
key points a human already wrote, which is the same shape as `selectTags` with a
smaller catalog. If the served model ever proves unequal to it, that is a
`AI_MODEL=` change on the same endpoint, not a code change.

---

## 11. The publishing workflow

### 11.1 What a چالش publish IS — read this before touching the router

A چالش is triggered exactly the way every other publish is: «یه پست جدید دارم
برای انتشار», then the type. The user names **the folder and that it is a
چالش** — «چیرساید، و آزمونه». Two things follow, and getting either wrong
breaks a Hard Rule:

**It takes the folder's brain type, not a new one.** A چالش in `chairside/`
writes an ordinary chairside brain entry —
`{type:'chairside', id, title, caption, hashtags, keywords, page_url, pillar}`,
the exact shape of the last chairside entry, appended at the END of the list.

> **RULE 15 — Never mint a `type: 'challenge'` in the brain and never give a
> چالش its own folder.** Hard Rule 3 says categories never mix and each
> category's entries go to their own directory; Hard Rule 6 says the entry
> schema is sacred and no new field may appear. A چالش that is filed in
> `chairside/` but typed `challenge` violates both at once — it would be a
> category whose directory belongs to another category. «نوع پست متفاوت» is a
> property of the PAGE BODY and of `challenges.json`, never of the taxonomy.
> The homepage's latest-content widget, the pillar, the landing page and
> up-board then carry it for free, because to all of them it is a chairside
> post — which is what the founder asked for.

**Its body is a question, so the article-shaped steps do not apply.** Give each
of these an explicit verdict in the publish report; a silent skip is what Hard
Rule 11 exists to forbid.

| step | on a چالش |
|---|---|
| 2.4 pillar & subtopic | **runs** — it is a real page in the taxonomy |
| 2.5 «کاوش بیشتر» capsules | **runs** |
| 2.6 landing/index page | **runs** |
| 4.11 flashcards | **skip** — no FAQ; a چالش has no prose to define terms from |
| 4.12 quiz-ready FAQ | **skip** — same, and see RULE 1 |
| 4.13 DES | **skip, reported** — a question cites nothing and appraises nothing. It is not basket 3: basket 3 is research-shaped content with no identified paper, and this is not research-shaped. Write **no key** in `des-scores.json` |
| 5.0 hashtags | **runs** — Hard Rule 15 is unconditional |
| 5 brain entry | **runs**, per RULE 15 above |
| 5.6 / 5.6-ب pathways & bundles | **skip** — a pathway step is something to read |
| 6 Pulse | **runs** — it is new content and worth announcing |
| Phase D en mirror | **skip — decided** (RULE 16) |
| Phase E / F | **run** |

> **RULE 16 — A چالش ships with no English mirror and no fa↔en toggle. This is
> the SECOND documented exception to Hard Rule 12, decided by the founder on
> 2026-08-28, alongside LiteCast.** Do not "fix" it, and do not let Hard Rule
> 12's own wording — that a missing toggle is "a gap, never a pattern to copy
> forward" — talk you back into building one: that sentence governs pages which
> merely *lack* a mirror, not the two types whose exception is written down.
>
> The reason is mechanical, not editorial. An en mirror lives at
> `chairside/en/chairside-31`, which is a **different `content_id`**. It has no
> row in `challenges.json` and no row in `challenges`, so the block removes
> itself and the toggle leads to a page missing the only thing on it. Making it
> work would mean either a second challenge row per page (two answer keys and
> two attempt namespaces for one question) or teaching the whole feature to fold
> `…/en/…` back to its fa id — a special case in `detectContentId()`, the
> builder, the API and the admin queue, for an unreviewed machine translation of
> a question whose grading is in Persian.
>
> So: no `/en/` page, no `.lang-btn`, no hreflang, out of the sitemap. The
> builder already excludes any `en/` path (§11.4) and `verify_publish.py` must
> not ask a چالش for a mirror.

### 11.2 Phase B — Question 4.9 (new, after Question 4.8)

> **Question 4.9 — چالش؟** Skip when the user already said so at Question 1.
> Otherwise: «این پست آزمون است یا مطلب معمولی؟» When it is a چالش, collect the
> question text, the image, the **answer**, and 3–5 **نکات کلیدی**. Propose the
> key points from the answer and have the user confirm or rewrite them — they
> are the answer key, and Hard Rule 16 applies to every string the user
> supplies: copied, never re-typed.
>
> **Question 3.5's de-AI pass runs on the question and the answer as usual.**
> The key points are not prose the reader ever sees and are exempt.

### 11.3 Phase C — step 4.14 (new, after 4.13)

Writes the **public half only**: the question + image markup on the page, and
this `content_id` into `plus/challenges.json` via
`node tools/build_challenge_index.mjs` in step 8.

Then prints into the publish report, for the founder to paste into
`GET /admin` → «صندوق چالش»:

```json
{ "content_id": "chairside/chairside-31",
  "answer_fa": "…",
  "key_points": [ { "id": "kp1", "text": "…" }, … ] }
```

The report must say in one line that **the چالش is not live until that paste
happens** — the page will render the question with a box that answers 404 until
the row exists. Have `GET /challenge/:id` return `{ exists: false }` for a
missing row and have the block remove itself on it, so a half-published چالش is
invisible rather than broken.

### 11.4 `tools/build_challenge_index.mjs`

Generated-only, run in step 8, never hand-edited — same contract as
`build_flashcards_index.mjs` and `build_quiz_index.mjs`. `content_id` is the
page path without the leading slash and without `.html`. Excludes `litecast/`,
any `en/` path, and any `index` leaf, using the same `isExcludedContentId` shape
`build_flashcards_index.mjs` uses.

Output:

```json
{ "version": 1,
  "byContent": { "chairside/chairside-31": { "question": "…", "image": "/…jpg" } } }
```

No answer, no key points, ever. Add an assertion in the builder that throws if
either key appears in its output — the file is public and this is the one
mistake that cannot be walked back once it is in git history.

### 11.5 `tools/verify_publish.py`

Add a row beside the existing quiz row (line ~1207): when the publish declared a
چالش, `content_id` must be present in `plus/challenges.json`, and the entry must
carry a question and an image and **must not** carry `answer_fa` or
`key_points`. Print the fix command on FAIL, like every other row.

### 11.6 Parity

`CLAUDE.md`, `AGENTS.md` and `.cursor/rules/dentcast-router.mdc` are updated
**in the same commit** — that is the maintenance rule at the top of `CLAUDE.md`,
not a nicety. Add چالش to the repo-conventions list with a pointer here.

**Hard Rule 12 itself must be edited, in both `CLAUDE.md` and `AGENTS.md`, in
that same commit.** It currently reads "The single exception is LiteCast". It
becomes two exceptions — LiteCast and چالش — with RULE 16's one-line reason
(the mirror is a different `content_id`, so the toggle would lead to a page the
feature cannot reach). Leaving that rule saying "single" while this document
says otherwise is how a later publish rebuilds the mirror: the workflow is the
thing an agent actually reads on a publish, and it must not contradict the
handoff the feature was built from.

Same for the English-version trigger section of `CLAUDE.md`: «… رو انگلیسی کن»
must refuse a چالش page for the same reason, rather than producing an orphan.

---

## 12. Tests

### `plus-api/test/challenge.test.ts`

| # | given | expect |
|---|---|---|
| 1 | free user submits | 402, no attempt row |
| 2 | signed-out submits | 401, no attempt row |
| 3 | answer of 12 chars | 400 `answer_too_short`, no row |
| 4 | answer 2000 chars | accepted, stored truncated to 1500 |
| 5 | provider returns all covered/missing | `settled`, verdict stored, `settled_at` set |
| 6 | provider returns one `unsure` | `queued`, `verdict` NULL |
| 7 | provider returns `[]` | `queued` |
| 8 | provider throws after retries | `queued`, attempt row still written |
| 9 | provider returns an unknown key-point id | `queued`, nothing from the model stored |
| 10 | provider returns 2 entries for 3 key points | `queued` |
| 11 | any of 5–10 | no `challenge_answered` row (verdict is not `full`) |
| 12 | second submit, same user + page | 409, existing attempt returned, no second score row |
| 13 | 11 submits in an hour | 429 on the 11th |
| 14 | founder rules a queued attempt | `settled`, example row written, `challenge_ruled` sent |
| 15 | founder verdict containing `unsure` | 400, nothing written |
| 16 | founder verdict missing a key point | 400, nothing written |
| 17 | 20 examples exist | the call carries the newest 12 |
| 18 | `GET` as the settled attempt's own owner | `answer_fa` + `result` + counts present |
| 19 | `GET`/`POST` as the owner of a **queued** attempt | `answer_fa` present, no verdict |
| 20 | `GET` as a **premium** reader with no attempt | `answer_fa` **absent** |
| 21 | `GET` signed out, and as a free reader | `answer_fa` **absent**, `exists: true` only |
| 21b | reader answered while premium, then lapsed | `GET` still returns `answer_fa`; `POST` to a **different** چالش is 402 |
| 22 | any response carrying `answer_fa` | `key_points` and the per-point array **absent** |
| 23 | 4 key points, 4 covered / 2 covered / 0 covered | `result` = `full` / `partial` / `none`, `covered_count` correct |
| 24 | `GET` for a `content_id` with no row | `{ exists: false }` |
| 25 | profile merge | attempts survive, score unchanged |
| 26 | upsert with 6 key points | 400 |
| 27 | upsert with duplicate ids | 400 |

Fixtures 20–22 are the leak tests and are why RULE 6 is a rule. **20 is the one
that matters**: it is the whole difference between "having answered releases the
answer" and "being a subscriber releases the answer", and it is the mistake a
`requirePremium` on the wrong handler makes silently. Assert on the
**serialized response body**, not a typed object, so a future `select *` or an
object spread fails them.

Fixtures 7–10 are the ones that matter most: each is a way a model failure could
have reached a reader as «missing».

### `plus-api/test/challenge.dom.test.ts`

Renders the block against a stub `GET` + `/me`:

- no entry in `challenges.json` → the host is removed
- **free reader → the question and the lock line, and `querySelector('textarea')`
  is null**; signed out → the same with the sign-in path leading
- `/me` unreachable → the question alone, **no** upsell and **no** box (RULE 12)
- settled → the verdict word, the count line and `answer_fa`, with **no
  key-point text anywhere in the rendered DOM**
- queued → the reference code, the waiting line, **and `answer_fa`**

The `textarea` assertion is the one that encodes RULE 11: a box that renders and
then fails is the exact regression this test exists to catch.

---

## 13. Deployment

- [ ] migration numbered after the current highest (`0049_share_xp_boost.cjs`)
- [ ] `merge-profiles.ts` carries `challenge_attempts.user_id`
- [ ] `server.ts` registers `challengeRoutes`
- [ ] **API container rebuild** — new migration + a changed provider interface,
      not a content refresh
- [ ] `python3 tools/asset_version.py --bump` in the same commit — `plus.js`'s
      module graph gained `challenge.js`, and `plus.css` changed. CI runs
      `--check`.
- [ ] `node tools/build_challenge_index.mjs` runs in step 8, **after**
      `build_pillar.py` and before `build_plus_index.mjs`
- [ ] `python3 .github/scripts/inject_ga.py --check` passes
- [ ] `badges.json` change needs no deploy — `content-refresh.ts` re-fetches it
- [ ] verify light, dark, and the un-stamped system-default theme
- [ ] verify the block on the desktop shell (column C), not only standalone

---

## 14. Later, not now

- **Publishing an exemplary answer.** گفت‌وگوی زیر مطلب already has the
  machinery (`is_public` per message, founder-decided). If it is ever wanted
  here, it is that switch again — a founder decision written down, never a
  default.
- **A surface for `quiz-index.json`.** Still dormant, still separate (RULE 1).
- **Retries.** RULE 3 forbids them.
- **A per-point checklist beside the answer.** It leaks nothing once `answer_fa`
  is on screen, and the data is already stored — `challenge_attempts.verdict`
  holds it and §7.2 is the only thing reducing it away. It is left out because
  reading the answer and finding your own gap is the learning act. If it is
  wanted, widen §7.2's return, do not add a second endpoint.
- **A چالش whose folder has no page template for a question.** All nine
  specialist folders clone their last entry; a چالش clones the same page and
  replaces the body. If a folder ever needs its own چالش layout, that is a
  template decision inside that folder, not a new content type.
