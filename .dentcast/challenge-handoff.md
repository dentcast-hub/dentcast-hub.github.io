# چالش — handoff

Build this exactly as written. Every decision below is already made; nothing
here is a suggestion. Where a Persian string is given, use it character for
character. Where a rule is marked **RULE**, it exists because the alternative
was already considered and rejected for the reason attached — do not "improve"
it.

---

## 0. What this is, in one paragraph

A **چالش** is an attribute of an ordinary publish, not a content type. The
founder publishes a page in its normal folder (`chairside/`, `notecast/`, …)
and says «این پست چالش هم دارد». The page then carries, under the article, a
question the founder wrote, an image, and a box the reader writes a free-text
answer into. On submit, a model compares that answer against **key points the
founder wrote at publish time** and reports which ones were covered. If the
model is not sure about even one key point, nothing is shown as a verdict —
the attempt goes into the founder's queue in `GET /admin`, the founder rules,
and the reader is told in اطلاعیه. Answering is premium; reading the question
is public. Every settled attempt earns score, and score feeds a badge that
mints a real subscription discount.

The model **never writes a sentence a reader sees.** It returns a verdict per
key point from a closed three-value set, and plain code renders the founder's
own prose. See RULE 2.

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
                                                     (workflow step 4.14,
                                                      filed via GET /admin)
reads the article
sees the چالش block
(public: question + image)

writes an answer,
presses «بفرست»
                    ──►  premium gate (402 → the card)
                    ──►  one attempt per (user, page)
                    ──►  ai.matchKeyPoints(key_points, answer, examples)
                         ├─ every point covered/missing  ──► SETTLED NOW
                         │      verdict + the founder's own answer
                         │      shown immediately
                         └─ ANY point «unsure»           ──► QUEUED
                                reference code C-XXX-XXX
                                the founder's answer is STILL shown
                                                              sees it in GET /admin
                                                              ticks each key point
                                                              presses «ثبت و اطلاع بده»
                                     ◄── ruling stored as an EXAMPLE
                                     ◄── اطلاعیه sent
sees the dot on 🔔
opens اطلاعیه → the verdict
```

Score is awarded on **submit**, in both branches — see §8.

---

## 3. Files

| Action | Path |
|---|---|
| create | `plus-api/migrations/0050_challenges.cjs` |
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
| edit | `plus/badges.json` — the «چالشگر» badge (§8.3) |
| edit | `plus-api/src/services/achievements.ts` — the `challenges_settled` metric |
| create | `plus/js/challenge.js` |
| edit | `plus/plus.css` — the block's CSS (§9.4) |
| edit | `plus/plus.js` — mount at all four sites (§9.1) |
| create | `tools/build_challenge_index.mjs` |
| create | `plus/challenges.json` — generated, public half only |
| edit | `.dentcast/workflows/README.md` — Phase B Question 4.9 + step 4.14 |
| edit | `AGENTS.md`, `.cursor/rules/dentcast-router.mdc` — the parity mirror |
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
> never by a count.** A second attempt is not a retry: submitting reveals the
> founder's full answer, so attempt two would be answering with the answer on
> screen. The unique index is the enforcement; do not add a friendlier
> "attempts_used" column that can drift from it.

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
attempt, that attempt's `status`, `verdict`, `answer_text`, and the founder's
`answer_fa`. **`answer_fa` and `key_points` are returned only to a reader who
has already submitted.** Everyone else gets neither.

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
4. `recordActivity(userId, 'challenge_answered', contentId, {})` — see §8.
5. Call the model. On a clean verdict → `status='settled'`, `verdict`,
   `settled_at`. On anything else → leave `status='queued'`.
6. Return `{ status, verdict, answer_fa, key_points, reference }`. **`answer_fa`
   is returned in both branches** — a queued reader still gets the founder's
   answer immediately; only the verdict on their own text is pending.

> **RULE 6 — Score is recorded before the model is called, and never depends on
> the verdict.** `case-assistant.ts` records after its call resolves, because
> there a failed generation means the user got nothing. Here the user got
> something either way: the attempt is stored and the founder's answer is
> shown. Making score wait on the verdict would mean a queued reader waits days
> for points they already earned by writing, and it would make a model error
> cost a reader score — which is the thing §6.2 exists to prevent.

### 7.2 Founder — added to `routes/admin.ts` behind the existing admin guard

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
5. `sendCapped(userId, …, 'challenge_ruled')`

### 7.3 The admin page block

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

Add `challenge_answered` to `SCORING_ACTIONS` in `services/score.ts`.

It belongs there and `content_shared` does not, on that file's own stated test:
a share "costs one second, and score is never deducted", so it would be a farm.
An answer is minutes of writing, capped at one per page by the unique index in
§5. It is the most expensive thing a reader can do on this site.

> **RULE 7 — Never deduct for a wrong answer.** `score.ts`: "Score is never
> deducted — a threshold is a milestone, not a purchase." A reader who tried and
> missed every key point learned more than one who skipped the box, and the
> feature dies the day being wrong is punished.

**Score is for answering, not for being right.** There is deliberately no
correctness bonus in v1: it would reintroduce the dependency on the verdict that
RULE 6 removes, and it would make the model's mistakes cost points. Revisit only
after the queue rate is known.

### 8.2 League

Do **not** add an `xp_*` kind. League XP is a separate currency with per-action
weekly caps, and `xp_share` had to be capped to zero (migration 0028) after
shipping at a value that unbalanced a week. Score plus the badge is enough on
day one; a league kind is a later, separate decision with its own cap analysis.

### 8.3 The badge — «چالشگر»

Append to `plus/badges.json` following the `treasury` entry's shape exactly.
Every badge is derived, so this needs no migration and is retroactive by
construction.

```json
{
  "key": "challenger",
  "title_fa": "چالشگر",
  "icon": "target",
  "group": "premium",
  "premium": true,
  "leveled": true,
  "visibility": "always",
  "metric": "challenges_settled",
  "locked_fa": "به اولین چالش یک مطلب جواب بده.",
  "detail_fa": "چالش‌ها را جواب دادن یعنی قبل از دیدنِ جواب، خودت فکر کرده‌ای.",
  "levels": [
    { "tier": "bronze", "threshold": 1,
      "unlock_fa": "اولین چالشت را جواب دادی." },
    { "tier": "silver", "threshold": 15,
      "unlock_fa": "پانزده چالش. این دیگر عادت است، نه کنجکاوی.",
      "discount_percent": 1 },
    { "tier": "gold", "threshold": 50,
      "unlock_fa": "پنجاه چالش — پیش از هر جوابی، جوابِ خودت را نوشته‌ای.",
      "discount_percent": 2 }
  ],
  "unit_fa": "چالش"
}
```

Add `challenges_settled` to the counts query in
`plus-api/src/services/achievements.ts` beside `collection_items`:

```sql
(select count(*)::int from challenge_attempts
  where user_id = $1) as challenges_settled,
```

Count **attempts, not settled attempts**, despite the metric name reading that
way — rename the metric `challenges_answered` if that reads better to you, but
keep the semantics: a queued attempt already earned its score under RULE 6, and
a badge that lights only once the founder gets around to the queue would make
the wall disagree with the score for days.

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

> **RULE 8 — Mount on all four, including episodes, and let the data decide.**
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

> **RULE 9 — `findProseEnd()`, and this is not a style preference.** On every
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

The question, the image and the invitation line are **public**. The answer box
renders for everyone. The gate fires on submit.

> **RULE 10 — Three answers, never two.** 401 = signed out → the sign-in path
> leads and the purchase link follows quieter (they may be a subscriber logged
> out on this device). 402 = free → the premium card. **Anything else = «we
> could not ask», which must never render as an upsell.** A redeploy is minutes
> of exactly that. `premium-cta.js`'s `unreachableGate` exists for this and is
> what you reuse.

### 9.3 Views

`idle` (the box) · `sending` · `settled` · `queued` · `locked` · `done`
(the reader's own earlier attempt, re-rendered on a later visit — `GET` returns
it, so a returning reader never sees an empty box).

**`settled`** shows each key point with its state — covered and missing, both
listed, never a bare score — then the founder's `answer_fa` under a heading.
**`queued`** shows the reference code in a monospace dashed box, the line below,
and `answer_fa` exactly as `settled` does. The only difference between the two
views is the verdict area.

> **RULE 11 — The founder's answer is shown on submit in every branch,
> including queued and including a model failure.** It is the thing the reader
> actually came for; the verdict is commentary on it. A queued reader who is
> shown nothing but a wait message has been charged an attempt and given
> nothing.

### 9.4 CSS

Goes in `plus/plus.css`, **not** `dc-article.css`.

> **RULE 12 — plus.css, for the same reason article threads live there.** The
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
| invite | `قبل از دیدن جواب، خودت جواب بده.` |
| box placeholder | `جوابت را این‌جا بنویس…` |
| submit | `بفرست` |
| too short | `کمی بیشتر بنویس تا بشود سنجید.` |
| locked (title) | `جواب‌دادن بخشی از پریمیوم است` |
| locked (body) | `سؤال برای همه باز است. جواب‌دادن و دیدنِ تطبیقِ جوابت با جوابِ من، بخشی از پریمیوم است.` |
| signed out | `برای جواب‌دادن وارد شو.` |
| unreachable | `الان نتوانستیم بررسی کنیم. کمی بعد دوباره امتحان کن.` |
| settled heading | `تطبیق جوابت` |
| covered | `گفتی` |
| missing | `این را جا انداختی` |
| queued (title) | `جوابت رسید` |
| queued (body) | `این یکی را خودم می‌خوانم — مدل مطمئن نبود. نتیجه در **اطلاعیه‌ات** می‌آید.` |
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

### 11.1 Phase B — Question 4.9 (new, after Question 4.8)

> **Question 4.9 — چالش؟** Ask only when the user has not already said. «این
> پست چالش هم دارد؟» If yes, collect: the question text, the image, and 3–5
> نکات کلیدی. **Propose the key points from the متن and have the user confirm
> or rewrite them** — they are the answer key and Hard Rule 16 applies to every
> string the user supplies. If no, the publish carries no چالش and step 4.14 is
> a documented skip.

### 11.2 Phase C — step 4.14 (new, after 4.13)

Writes the **public half only**: appends this `content_id` to
`plus/challenges.json` via `node tools/build_challenge_index.mjs` in step 8, and
puts the question + image markup on the page.

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

### 11.3 `tools/build_challenge_index.mjs`

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

### 11.4 `tools/verify_publish.py`

Add a row beside the existing quiz row (line ~1207): when the publish declared a
چالش, `content_id` must be present in `plus/challenges.json`, and the entry must
carry a question and an image and **must not** carry `answer_fa` or
`key_points`. Print the fix command on FAIL, like every other row.

### 11.5 Parity

`CLAUDE.md`, `AGENTS.md` and `.cursor/rules/dentcast-router.mdc` are updated
**in the same commit** — that is the maintenance rule at the top of `CLAUDE.md`,
not a nicety. Add چالش to the repo-conventions list with a pointer here.

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
| 11 | any of 5–10 | `challenge_answered` recorded exactly once |
| 12 | second submit, same user + page | 409, existing attempt returned, no second score row |
| 13 | 11 submits in an hour | 429 on the 11th |
| 14 | founder rules a queued attempt | `settled`, example row written, `challenge_ruled` sent |
| 15 | founder verdict containing `unsure` | 400, nothing written |
| 16 | founder verdict missing a key point | 400, nothing written |
| 17 | 20 examples exist | the call carries the newest 12 |
| 18 | `GET` as the answer's owner, settled | `answer_fa` present |
| 19 | `GET` as a premium reader with no attempt | `answer_fa` and `key_points` **absent** |
| 20 | `GET` for a `content_id` with no row | `{ exists: false }` |
| 21 | profile merge | attempts survive, score unchanged |
| 22 | upsert with 6 key points | 400 |
| 23 | upsert with duplicate ids | 400 |

Fixtures 7–10 are the ones that matter most: each is a way a model failure could
have reached a reader as «missing».

### `plus-api/test/challenge.dom.test.ts`

Renders the block against a stub `GET`: no entry → the host is removed; 402 →
the premium card, amber only there; a network error → the unreachable copy and
**not** an upsell (RULE 10); settled → both covered and missing points listed
plus `answer_fa`; queued → the reference code **and** `answer_fa`.

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

- **A correctness bonus on score.** Out of scope by RULE 6/7. Revisit once the
  real queue rate is known.
- **A league XP kind.** §8.2.
- **Publishing an exemplary answer.** گفت‌وگوی زیر مطلب already has the
  machinery (`is_public` per message, founder-decided). If it is ever wanted
  here, it is that switch again — a founder decision written down, never a
  default.
- **A surface for `quiz-index.json`.** Still dormant, still separate (RULE 1).
- **Retries.** RULE 3 forbids them while submitting reveals the answer. A
  "practice mode" that does not reveal is a different feature.
