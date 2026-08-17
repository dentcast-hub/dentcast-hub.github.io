# ارزیاب DES — handoff

Build this exactly as written. Every decision below is already made; nothing
here is a suggestion. Where a Persian string is given, use it character for
character. Where a rule is marked **RULE**, it exists because it was already
gotten wrong once — the rationale is attached so you do not "improve" it.

**Reference mockup:** `.dentcast/des-scorer-mockup.html` — open it first. It is
the visual and behavioural target, self-contained, with a «پشت صحنه» panel.

---

## 0. What this is, in one paragraph

A premium tab on the homepage, directly under the existing «DES چیست؟» box. A
reader pastes a paper (or ticks «PDF دارم» and sends it to Telegram) and submits
it. **A human — the founder — scores it**, not a model in the API. The result
lands in the reader's اطلاعیه inbox. Every scored paper is remembered in a
library, so the *next* reader who submits the same paper is answered instantly
with no queue at all.

There is **no AI provider, no API key, no model call anywhere in this feature.**
Do not build one. Do not add an adapter "for later".

---

## 1. The flow, end to end

```
READER                          SYSTEM                        FOUNDER
──────                          ──────                        ───────
opens the amber tab
fills عنوان + متن
(or ticks PDF)
presses «بفرست»
                    ──►  key lookup in the library
                         ├─ HIT  ──► instant answer, no queue,
                         │           no open-request spent
                         └─ MISS ──► row in des_requests (pending)
                                     reference code D-XXX-XXX
                                                              sees it in GET /admin
                                                              runs the DES prompt
                                                              in their own Claude
                                                              pastes JSON + title
                                                              presses «ثبت و اطلاع بده»
                                     ◄── library row written
                                     ◄── اطلاعیه sent
sees the دot on 🔔
opens اطلاعیه → the result
```

---

## 2. Files

| Action | Path |
|---|---|
| create | `plus-api/migrations/0047_des_scorer.cjs` |
| create | `plus-api/src/services/des-identity.ts` |
| create | `plus-api/src/services/des-library.ts` |
| create | `plus-api/src/routes/des.ts` |
| edit | `plus-api/src/server.ts` — register `desRoutes` |
| edit | `plus-api/src/routes/admin.ts` — add the «ارزیاب DES» block (§7) |
| edit | `plus-api/src/services/notify-policy.ts` — add the `des_result` kind |
| edit | `plus-api/src/services/merge-profiles.ts` — carry two columns (§3) |
| create | `plus/js/des-scorer.js` |
| edit | `index.html` — the tab markup + critical CSS |
| edit | `plus/plus.css` — the panel CSS |
| edit | `plus/js/plus.js` — mount `des-scorer.js` on the homepage |
| create | `plus-api/test/des-scorer.test.ts` |

Latest existing migration is `0046_notice_reads.cjs`. Confirm before numbering.

Read these three first; they are the patterns to copy, not invent:
- `plus-api/src/routes/support.ts` — a reader queue with a founder inbox
- `plus-api/src/routes/admin.ts` lines ~802–900 — the «صندوق پشتیبانی» block,
  which the DES block in §7 mirrors exactly
- `plus/js/des.js` — the DES display vocabulary; reuse it, do not re-draw a band

---

## 3. Migration `0047_des_scorer.cjs`

Write a header comment in the style of `0044_referrals.cjs`.

```sql
-- One row per PAPER. Identity + the spec's output object. Never the text.
create table des_papers (
  id            uuid primary key default gen_random_uuid(),
  doi           text,
  pmid          text,
  title         text not null,
  first_author  text,
  year          smallint,
  hashtags      text[] not null default '{}',
  des           jsonb  not null,
  spec_version  text   not null,
  scored_at     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create unique index des_papers_doi_uq  on des_papers (lower(doi)) where doi  is not null;
create unique index des_papers_pmid_uq on des_papers (pmid)       where pmid is not null;

-- Every key ever seen for a paper. ONE PAPER, MANY KEYS.
create table des_paper_keys (
  key      text primary key,
  paper_id uuid not null references des_papers(id) on delete cascade
);
create index des_paper_keys_paper on des_paper_keys (paper_id);

-- A reader's submission.
create table des_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  reference  text not null unique,
  title      text not null,
  body       text,
  claim      text not null,
  link       text,
  has_pdf    boolean not null default false,
  status     text not null default 'pending',
  paper_id   uuid references des_papers(id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  check (claim  in ('ABSTRACT_ONLY','FULL_TEXT')),
  check (status in ('pending','answered','rejected'))
);
create index des_requests_open on des_requests (user_id) where status = 'pending';
create index des_requests_queue on des_requests (created_at) where status = 'pending';
```

**`merge-profiles.ts` must carry `des_requests.user_id`.** Without it a profile
merge cascade-deletes a reader's pending submissions. `des_papers` has no user
column on purpose — the corpus outlives any account.

---

## 4. `services/des-identity.ts`

Port these from `tools/des_library.py`, which is the tested reference. Same
behaviour, same names.

```ts
export function fold(s: string): string
export function keyHash(s: string): string
export function keysFor(c: {doi?, pmid?, title?}): string[]
export function titleTokens(t: string): Set<string>
export function jaccard(a: Set<string>, b: Set<string>): number
export function authorWords(authors: string): Set<string>
export function sameAuthor(a: string, b: string): boolean
```

**`fold`** — strip `‌‎‏`, `ي ى → ی`, `ك → ک`, strip
`ً-ْ`, punctuation `.,;:!?()[]{}"'«»،؛؟-–—/\` → space, collapse
whitespace, trim, lowercase.

**`keyHash`** — `sha1(fold(s).replace(/\s+/g,'')).slice(0,10)`.

> **RULE — the whitespace is REMOVED, not collapsed.** `fold` strips ZWNJ, so
> «نظام‌مند» becomes «نظاممند» while a reader who typed a real space gives
> «نظام مند». Two strings, two keys, and the same title never matched itself.
> Removing whitespace outright collapses all three spellings onto one key.
> `hl-view.js`'s `foldFa` has the same shape and survives it only because its
> search is a substring test; a key is an equality test and cannot.

**`keysFor`** returns, in this order, skipping absent ones:
`doi:<lowercased>` · `pmid:<digits>` · `ttl:<keyHash(title)>`.
Author+year is **not** a key — two papers by one author in one year is ordinary.

**`titleTokens`** — words of `fold(t)` with length > 2, minus this stopword set:
`a an the of in on for to and or with by from at as is are its this that after
before during between vs versus study studies`.

**`authorWords`** — words ≥3 letters of the **first** author only (split on
`,;،`).

> **RULE — never compare "the last name token".** Journals write `Fan YY`, a
> model writes `Ying-Ying Fan`; the last token is `yy` versus `fan`, and the
> same paper fails its own author check. Compare the word SETS and intersect.

---

## 5. `services/des-library.ts`

```ts
export interface LookupHit { paperId: string; via: 'doi'|'pmid'|'title'; des: unknown; hashtags: string[]; }
export interface Candidate { paperId: string; score: number; title: string; authors: string;
                             year: number|null; doi: string|null; authorAgrees: boolean|null; }

export async function lookupExact(c: Citation): Promise<LookupHit | null>
export async function nearDuplicates(title: string): Promise<Candidate[]>   // Jaccard ≥ 0.55
export async function attachKeys(paperId: string, keys: string[]): Promise<void>
export async function createPaper(input): Promise<string>
export function validateDesRecord(rec: unknown): string[]                   // [] = sound
export function normaliseDesRecord(rec: any): { rec: any; changed: string[] }
```

### 5.1 `validateDesRecord` — port §"validate" from `tools/des_library.py`

Returns Persian problem strings. Non-empty = refuse the record. Checks:

1. `content_type` is `RESEARCH` | `COMMENTARY` | `NOT_APPRAISABLE`
   (non-RESEARCH short-circuits with no further checks)
2. `s_design.value` an integer 0–100; `multiplier` ∈ {0.30, 0.55, 0.80, 1.00}
3. domain count matches the tool exactly:
   `RoB2 5 · ROBINS-I 5 · AMSTAR-2 6 · QUIN 6 · QUADAS-2 4`
4. every domain has a rating ∈ `low|some_concerns|high|NR`, and an
   `evidence_quote` **or** a `note`
5. the multiplier follows from the counts (`NR` counts as `some_concerns`):
   `≥2 high → 0.30` · `1 high or ≥3 concerns → 0.55` · `≥1 concern → 0.80` ·
   else `1.00`. Flag only when the record's multiplier is **higher** than this.
6. exactly 4 penalty rows; a fired row equals
   `max(1, roundHalfUp(base_points × s_design ÷ 100))`; a `points: 0` row has a `note`
7. `des_score === max(0, roundHalfUp(s_design × multiplier) − Σ points)`
8. `band` matches: `A 80-100 · B 60-79 · C 40-59 · D 20-39 · E 0-19`
9. `ABSTRACT_ONLY`/`SECONDARY_REPORT` ⇒ `provisional: true`; `FULL_TEXT` ⇒ false
10. `interpretation_fa` ≤ 60 words and ≤ 4 sentences

> `roundHalfUp(x) = Math.floor(x + 0.5)` for x ≥ 0. Not `Math.round` on
> negatives, and never a language default — the spec makes the rounding rule
> part of the score.

### 5.2 `normaliseDesRecord` — conventions the spec does not state

Two fixes, both mechanical, neither touching judgement. Report what changed.

1. **Persian digits** in `fact_fa` and `interpretation_fa`
   (`0123456789` → `۰۱۲۳۴۵۶۷۸۹`). 180 of 181 stored records use them and the
   string renders straight onto the card.
2. **The four penalty item strings**, matched by `base_points` + a keyword:

| base | keyword regex | canonical Persian string |
|---|---|---|
| 8 | `conflict\|interest\|تعارض\|منافع` | `بیانیه‌ی تعارض منافع وجود ندارد` |
| 5 | `regist\|prospectiv\|ثبت\|پیش‌?نگر` | `کارآزمایی به‌صورت پیش‌نگر ثبت نشده` |
| 5 | `sample\|size\|power\|نمونه\|توان` | `توجیه حجم نمونه یا آنالیز توان وجود ندارد` |
| 3 | `follow\|پیگیری` | `دوره‌ی پیگیری کوتاه‌تر از آنچه پیامد لازم دارد` |

### 5.3 Hashtags

Resolve every proposed tag against `dentcast-hashtag-reference.json`
(`concepts[].tag`). **Drop anything that does not resolve** — never mint a
concept from a submission, never store an alias as a tag.

> **RULE — hashtags are stored, never matched on.** They are a topic vocabulary,
> not an identity: two different RCTs on single-visit endodontics carry
> identical tags, and matching on them hands one paper's score to another.

---

## 6. Reader API — `routes/des.ts`

`app.addHook('preHandler', requireAuth)` then `requirePremium`, exactly as
`routes/case-assistant.ts` does. Register in `server.ts`.

### `GET /des/state`

```json
{ "open": [ { "reference": "D-KRM-TQF", "title": "…", "has_pdf": true,
              "created_at": "…" } ], "limit": 2 }
```

### `POST /des/submit`

Body: `{ title, body, claim, link, has_pdf }`.
Server-side caps: `title` 300 chars, `body` 60 000, `link` 500.

Order of operations, exactly:

1. **Free gate** (§6.1). Any `stop` → `400 { ok:false, error:'invalid_input', issues:[…] }`.
2. **Exact lookup** on `keysFor({doi, pmid, title})`, where doi/pmid come from
   `link` first and from `body` second (§6.2). A hit returns
   `200 { ok:true, answered:true, des, hashtags }` — **no row is written, no
   open request is spent, and nothing in the response says it came from the
   library.**
3. `select count(*) … where user_id = $1 and status = 'pending'` ≥ 2 →
   `429 { ok:false, error:'too_many_open' }`.
4. Insert `des_requests` with a fresh reference (§6.3) and return
   `200 { ok:true, answered:false, reference, has_pdf }`.

### 6.1 The free gate

**stop** — refuses:
- `fold(title)` empty → `عنوان مقاله را بنویس — بدون آن نمی‌توانم پیدایش کنم.`
- `has_pdf === false` and word count < 80 →
  `متن برای ارزیابی خیلی کوتاه است (N واژه). یا چکیده‌ی کامل بگذار، یا تیکِ PDF را بزن.`

**warn** — returned in `issues` but does not block:
- no research signal (§6.4) and ≥300 words →
  `نشانه‌های روش‌شناختی در این متن پیدا نشد. اگر مقاله‌ی پژوهشی نباشد نمی‌توانم بسنجمش.`
- no research signal and <300 words → this one is a **stop**:
  `این متن نشانه‌ای از یک گزارش پژوهشی ندارد — نه طرح مطالعه، نه آمار، نه تعداد نمونه.`
- title/body incoherence: of the title's words ≥4 chars (folded), fewer than 34%
  appear in the folded body (only when ≥3 such words) →
  `عنوان با متن هم‌خوان نیست — مطمئنی هر دو مالِ یک مقاله‌اند؟`
- `claim === 'FULL_TEXT'` and 80 ≤ words ≤ 600 →
  `این متن N واژه است — اندازه‌ی یک چکیده. به‌عنوان چکیده می‌سنجمش.`

Word count is `fold(paperScope(body)).split(' ').filter(Boolean).length`.

`paperScope(t)` truncates `t` at the first line matching
`/(^|\n)\s*(similar articles|cited by|references?|bibliography|related information|mesh terms|publication types|منابع|مراجع|فهرست منابع)\b/i`.

> **RULE — the free gate is generous; the founder is strict.** It stops only
> what it is certain about. A false stop costs a reader their paper. The
> version before this had five Persian signal families and one English, so
> every fully English abstract scored at most 1 of 6 and was rejected — most of
> the real input.

### 6.2 Identifier extraction

```
allDois(s)  = /10\.\d{4,9}\/[^\s"'<>,;)\]]+/g   → dedupe, lowercase, strip trailing .,;
allPmids(s) = /(?:pmid[:\s]*|pubmed\.ncbi\.nlm\.nih\.gov\/)([0-9]{6,9})/gi → dedupe
```

Both are harvested from `paperScope(body)`, never the raw body. Selection, per
identifier type: **link field with exactly 1 wins**; else body with exactly 1;
else, if several, the one inside the first 900 chars if exactly one is; else
**none**.

> **RULE — cut before harvesting.** A PubMed page lists the PMIDs of «Similar
> articles»; a full text carries the DOI of everything in its references. A
> reader once got `pmid:9340725` — a related article, not theirs.

### 6.3 Reference codes

`D-` + 3 chars + `-` + 3 chars from the alphabet `ACDEFGHJKMNPQRTUVWXYZ2346799`.
Reuse `services/reference.ts`. No `0/O`, `1/I/L`, `5/S`, `8/B` — a human reads
it aloud and types it into Telegram. `D-` distinguishes it from support's `T-`.

### 6.4 Research signals — five families, each bilingual

At least one must match the **raw** body (not folded — `fold` strips the
punctuation `p < 0.05` and `Methods:` depend on).

| family | pattern (case-insensitive) |
|---|---|
| design | `randomi[sz]ed\|controlled trial\|clinical trial\|cohort\|case[-\s]?control\|cross[-\s]?sectional\|systematic review\|meta[-\s]?analys\|in vitro\|in vivo\|double[-\s]?blind\|placebo\|split[-\s]?mouth\|کارآزمایی\|مرور نظام\|فراتحلیل\|هم‌?گروهی\|مورد[-\s]?شاهد\|مقطعی\|آزمایشگاهی\|دوسوکور` |
| stats | `\bp\s*[<=>]\s*0?[.,]\d\|\bp[-\s]?value\|\bn\s*=\s*\d\|95\s*%\|confidence interval\|standard deviation\|\bSD\b\|\bCI\b\|statistically significan\|معنادار\|انحراف معیار\|فاصله اطمینان\|سطح معنی` |
| counted sample | `\d+\s*(patients?\|subjects?\|teeth\|tooth\|specimens?\|samples?\|participants?\|cases\|volunteers?)\|[\d۰-۹]+\s*(بیمار\|نمونه\|دندان\|شرکت‌کننده\|مورد\|داوطلب)` |
| headings | `\b(background\|objectives?\|aims?\|materials?\|methods?\|results?\|conclusions?\|discussion)\s*[:：]\|(زمینه\|هدف\|روش‌?ها\|مواد و روش\|نتایج\|نتیجه‌?گیری\|بحث\|یافته‌?ها)\s*[:：]` |
| measures | `\b(mean\|median\|prevalence\|incidence\|odds ratio\|risk ratio\|hazard ratio\|survival rate\|follow[-\s]?up)\b\|میانگین\|میانه\|شیوع\|نسبت شانس\|پیگیری` |

---

## 7. Admin — this is where the founder works

### 7.1 Endpoints (all behind the existing admin guard in `routes/admin.ts`)

```
GET  /admin/des                     → { pending: [...], count }
GET  /admin/des/:id                 → the full submission (title, body, claim, link, has_pdf, reader)
GET  /admin/des/by-reference/:ref   → the same, found by the code typed under a Telegram PDF
POST /admin/des/:id/answer          → { title, record, tags }   ← THE PASTE BOX
POST /admin/des/:id/reject          → { reason }
```

**`POST /admin/des/:id/answer`** does all of this in one transaction:

1. `JSON.parse(record)` — bad JSON → `400 { error:'bad_json', detail }`
2. `title` overrides `record.citation.title`. If both exist and their
   `keyHash` differs, still take `title` and return the disagreement in
   `warnings` so the founder sees it.
3. `validateDesRecord` — non-empty → `400 { error:'invalid_record', issues }`.
   **Nothing is written.**
4. `normaliseDesRecord` — collect `changed` into `warnings`
5. `nearDuplicates(title)` — if any and the request carries no `same_as`, return
   `409 { error:'near_duplicate', candidates }`. The founder resubmits with
   `same_as: "<paperId>"` (attach keys to that paper, do not create) or
   `force: true` (create a new paper).
6. write `des_papers` + `des_paper_keys`, set `des_requests.status='answered'`,
   `paper_id`, `answered_at`
7. `sendCapped(userId, 'des_result', …)` (§8)
8. return `200 { ok:true, paperId, warnings }`

### 7.2 The admin page block

Insert into `renderHtml` in `routes/admin.ts`, immediately **after** the
«صندوق پشتیبانی» block. Mirror that block's markup conventions exactly:
`<h3>`, `.muted`, `<form class="bc" onsubmit="return false">`, `.pill`,
`.pill.hot`, an inline `<script>` that fetches and renders, and the local `esc`
and `when` helpers.

```html
<h3 style="margin-top:26px">ارزیاب DES <span id="dsWaiting" class="pill"></span></h3>
<div class="muted">مقاله‌هایی که خواننده‌ها فرستاده‌اند. قدیمی‌ترین بالاتر.
  برای ارسال‌های PDF، کد را از تلگرام پشتیبانی این‌جا جست‌وجو کن.</div>

<form class="bc" onsubmit="return false">
  <div class="row">
    <div style="flex:1 1 220px"><label for="dsRef">جست‌وجوی کد</label>
      <input id="dsRef" type="text" placeholder="D-ABC-DEF"></div>
    <div style="flex:0 0 auto;align-self:flex-end"><button id="dsFind" type="button">پیدا کن</button></div>
  </div>
  <div id="dsOut"></div>
</form>

<div id="dsList"></div>
```

Each pending row renders as a card carrying:
`<b>{title}</b>` · `<span class="pill">{reference}</span>` ·
`has_pdf` → `<span class="pill hot">📎 PDF در تلگرام</span>` ·
`<span class="pill">{claim === 'FULL_TEXT' ? 'متن کامل' : 'چکیده'}</span>` ·
a `.muted` line with the reader's `display_name` and `when(created_at)` ·
and the submitted `body` in a scrollable `.tk-x`.

Clicking the card opens the work area inside it:

```html
<div class="ds-work">
  <label>عنوان مقاله</label>
  <input class="ds-title" type="text" value="{the reader's title, prefilled}">

  <label>خروجی JSON مدل</label>
  <textarea class="ds-json" rows="12" dir="ltr"
            placeholder="کل شیء JSON را این‌جا پیست کن"></textarea>

  <label>هشتگ‌ها (با کاما)</label>
  <input class="ds-tags" type="text" placeholder="#ایمپلنت, #دخانیات">

  <div class="row">
    <button class="ds-save" type="button">ثبت و اطلاع بده</button>
    <button class="ds-reject" type="button">رد کن</button>
  </div>
  <div class="ds-msg muted"></div>
</div>
```

Behaviour of `.ds-save`:
- POST to `/admin/des/{id}/answer` with `{title, record, tags}`
- `400 invalid_record` → print every `issues[]` line into `.ds-msg`, **keep the
  textarea filled** so nothing is retyped
- `409 near_duplicate` → render the candidates with their score, title, author,
  year and `authorAgrees`, plus two buttons: «همان مقاله است» (resend with
  `same_as`) and «مقاله‌ی دیگری است» (resend with `force: true`)
- `200` → print `ثبت شد و به کاربر اطلاع داده شد.` plus any `warnings`, then
  reload the list

Copy the DES block's own small CSS into the page's existing `<style>`; do not
introduce a stylesheet.

---

## 8. The notification

Add `des_result` to `notify-policy.ts` as an **UNCAPPED** kind, on the same
reasoning `support_reply` is uncapped: this is the answer to a question the
reader asked and waited a day for, and a streak nudge that arrived first must
not be why it never lands.

- اطلاعیه row: lands instantly at any hour — it is a row in a table and wakes
  nobody.
- push: respects the awake window, unforced.

Title: `ارزیابی مقاله‌ات آماده است`
Body: the paper's title, nothing else.

> The inbox line is deliberately short and links back to the tool. It does not
> carry the band card — «a paragraph about the argument belongs on a lock
> screen, not in a row people scan».

Tapping it opens the homepage with `?des=<reference>`; `des-scorer.js` reads
that, opens the tab and shows the result.

---

## 9. Frontend

### 9.1 The tab

Markup in `index.html` immediately after `.dc-des-legend-wrap`. A formal twin of
that box: same height, same 2rem icon circle, same 3px leading edge, same
`.875rem` radius — differing only in colour, amber instead of chrome, because
amber means «this is what a subscription buys» site-wide.

`index.html` loads no shared CSS statically (`dc-nav.js` appends `plus*.css` at
runtime), so anything painted before first interaction is inline critical CSS
there — the tab itself. The panel's CSS goes in `plus/plus.css`, because the
panel renders only after a click. Amber tokens already exist in
`index.html`'s `<style id="dcDepthTheme">` as `--x-amber*`.

### 9.2 The panel — `plus/js/des-scorer.js`

Views: `compose` · `queued` · `answer` · `pending` · `spent` · `locked`.

Disclosure animates with `grid-template-rows: 0fr → 1fr` on a wrapper whose
child has `overflow:hidden`. No height measurement. The tab drops its bottom
radius while open. `aria-expanded` + `aria-controls`. Close via the tab, the
«بستن» button, or `Escape` — and closing always resets to `compose`.

**On open**, call `GET /des/state`. If `open.length > 0`, show `pending`, not an
empty form — a reader who submitted an hour ago must not see a blank box.

Compose contains, in this order: the byline (§9.3), the open-request counter,
`عنوان مقاله`, the PDF tick, the textarea, the basis chips, the optional link
row, the issues block, then «بفرست» and «یک نمونه بگذار».

**The PDF tick** (`PDF مقاله را دارم — در تلگرام می‌فرستم`) dims the textarea,
makes it optional, and changes its placeholder to
`اختیاری — اگر متن را هم داری بگذار`.

**The link row auto-fills.** On every `input` on the textarea, run the DOI regex
over it; if found and the field is empty or was auto-filled, fill it and show
the `از متن پیدا شد` chip. Mark auto-filled state with a data attribute so a
reader's own typing is never overwritten.

**Queued view** shows the reference code large, in a monospace dashed box. When
`has_pdf`, it also shows a link button to **`https://t.me/dentcast_support`**
labelled `فرستادن PDF در تلگرام ↗` and the line
`PDF را بفرست و همین کد را زیرش بنویس تا به درخواستت وصل شود.`

**Answer view** reuses `plus/js/des.js`'s vocabulary: five discrete band blocks
with only the current one coloured (never a gauge), `question_type` printed with
the band and never apart from it, the 0–100 number small and dim beside the band
and never a headline, `provisional` drawn as hatching. Band scale `--des-A…E`,
card chrome `--des-chrome`. Amber never appears inside the answer.

### 9.3 Copy — use verbatim

| where | string |
|---|---|
| tab title | `**مقاله‌ی خودت** را بگذار، امتیاز DES بگیر` |
| tab sub | `متن یا چکیده را بفرست تا ببینی چقدر شواهد پشتش هست — با همان DentCast Evidence Score.` |
| tab pill | `پریمیوم` |
| byline | `ارزیابی را **خودم** انجام می‌دهم، نه یک ربات. نتیجه در **اطلاعیه‌ات** می‌آید — معمولاً کمتر از یک روز.` |
| counter | `الان N از ۲ درخواستِ باز داری` |
| submit | `بفرست` |
| queued (text) | `در نوبت ارزیابی` / `خواندمش و در صف گذاشتمش. نتیجه در اطلاعیه‌ات می‌آید.` |
| queued (pdf) | `کد درخواستت آماده است` / `PDF را در تلگرام بفرست و این کد را زیرش بنویس. بعدش می‌خوانمش و نتیجه در اطلاعیه‌ات می‌آید.` |
| two open | `همزمان تا **دو** درخواست می‌توانی باز داشته باشی. تا جواب یکی‌شان بیاید صبر کن — مقاله‌هایی که قبلاً سنجیده‌ام همچنان فوری جواب می‌دهند.` |
| locked | `بخشی از پریمیوم` / `مقاله‌ی دلخواهت را بفرست تا با همان چارچوب DES برایت بسنجم.` |
| whisper | `چطور ارزیابی می‌شود؟` → `با همان چارچوب DES که روی مطالب سایت اجرا می‌شود — طراحی مطالعه، ابزار سنجش روش، و جریمه‌های شفافیت. اگر فقط چکیده بدهی امتیاز مقدماتی است؛ متن کامل امتیاز قطعی‌تری می‌دهد. نتیجه برای مطالعه‌ی شخصی توست.` |
| answer footer | `ساختار مطالعه سنجیده می‌شود، نه مناسب‌بودن یافته برای بیمار شما.` |

---

## 10. Rules that decide correctness

**RULE 1 — Ambiguity declines.** A title that cannot be trusted mints no `ttl:`
key. A wrong key returns *another paper's* evaluation, presented with a band, a
number and a reasoning trace. A reader once pasted a whole PubMed page whose
first line is `Skip to main page content`; under a first-line-is-the-title rule
every such paste collides onto one key.

**RULE 2 — Hashtags are stored, never matched.** §5.3.

**RULE 3 — Never touch `plus/des-scores.json`.** `plus/js/des.js` fetches it on
every article page load; its keys are page paths; the publishing workflow writes
it and `verify_publish.py` gates it. The library is a separate table and the two
are never merged. `lookup` and `search` read both — that is how the corpus is
already 56 papers deep on day one.

**RULE 4 — Nothing derivable is stored beside the spec output.** `band`,
`des_score`, `question_type`, `text_basis`, `provisional` and the citation all
live inside `des`. A second copy is a second source of truth.

**RULE 5 — The library answer is silent about itself.** No `cached` field, no
`served_from`, no timing hint. The reader is never told why it was fast.

**RULE 6 — Private, always.** A DES submission is a reader's own paper. There is
no «عمومی کن» switch, no public thread, no shared view. Do not add one.

**RULE 7 — No AI provider.** §0.

---

## 11. Test fixtures — `plus-api/test/des-scorer.test.ts`

| # | given | expect |
|---|---|---|
| 1 | title empty | 400, stop |
| 2 | body 6 words, no PDF tick | 400, stop |
| 3 | body 97 words, no research signal | 400, stop |
| 4 | English abstract, 253 words | accepted, no stop |
| 5 | PDF ticked, body empty, title present | accepted |
| 6 | claim FULL_TEXT, body 89 words | accepted **with** the size warning |
| 7 | title of a paper already in `des_papers` | `answered:true`, no row written, open count unchanged |
| 8 | same title with ZWNJ vs space vs joined | all three hit the same key |
| 9 | same title with `ي`/`ك` Arabic forms | hits |
| 10 | title with one typo | misses the key; `nearDuplicates` returns it at ~0.82 |
| 11 | PubMed page dump with `Similar articles` | the paper's own PMID, not the related one |
| 12 | body with a 12-DOI reference list | only the front-matter DOI selected |
| 13 | 2 pending, third submit | 429 `too_many_open` |
| 14 | 2 pending, submit a paper in the library | still answered |
| 15 | admin answer with `des_score` off by 5 | 400, nothing written |
| 16 | admin answer, AMSTAR-2 with 5 domains | 400, nothing written |
| 17 | admin answer with Latin digits in `fact_fa` | 200, normalised, reported in `warnings` |
| 18 | admin answer with English penalty names | 200, replaced with the four Persian strings |
| 19 | admin answer whose title near-matches an existing paper | 409 with candidates |
| 20 | same, resent with `same_as` | keys attached, no new paper, score untouched |
| 21 | successful answer | `des_result` notification sent, request `answered` |
| 22 | hashtag not in the reference library | dropped, not stored |

Fixtures 4 and 11 are regressions — both were live bugs.

---

## 12. Deployment

- [ ] migration numbered after the current highest
- [ ] `merge-profiles.ts` carries `des_requests.user_id`
- [ ] `server.ts` registers `desRoutes`
- [ ] **API container rebuild** — new migration, not a content refresh
- [ ] `python3 tools/asset_version.py --bump` in the same commit as any change
      to `plus.js`'s module graph or `plus.css`. CI runs `--check`.
- [ ] `python3 .github/scripts/inject_ga.py --check` passes
- [ ] verify the tab paints on a cold, throttled load (§9.1)
- [ ] verify light, dark, and the un-stamped system-default state

---

## 13. Later, not now

- **Automating the scoring.** Deliberately out of scope. If it is ever built, it
  slots in where the founder's paste box is and changes nothing else — the
  library, the keys, the gate, the display and the notification are all already
  independent of who produced the record. Cost analysis if it becomes relevant:
  the DES prompt is ~13 700 tokens, which is ~95% of the input cost of scoring
  an abstract, so prompt caching or per-question-type prompt assembly is where
  the leverage is, not the choice of model.
- **A public corpus view.** No surface today. `RULE 6` governs submissions;
  a curated, founder-chosen view would be a separate decision.
- **A free-tier taste.** Keep the limit a config number per tier, not a
  constant, so this stays a one-line change.
