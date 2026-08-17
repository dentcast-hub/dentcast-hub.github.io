# ارزیاب DES — handoff

**Feature:** a premium tool on the homepage that runs the DentCast Evidence
Score on a paper the *reader* pastes, and remembers every paper it has scored so
the same study is never paid for twice.

**Status:** design is settled and a working reference mockup exists. Nothing is
built in the product yet. This document is the specification; build from it.

**Reference implementation:** `.dentcast/des-scorer-mockup.html` — a
single-file, self-contained mockup with the real algorithms in plain JS
(identity keys, extraction, the validity gate, the upgrade rule) plus a
«پشت صحنه» panel that shows the store and the decision for every request. Open
it before writing code. Every rule below is implemented and tested there; where
this document and the mockup disagree, **this document wins**, but check the
mockup first — it probably encodes a case the prose glossed over.

---

## 0. How to read this

Sections marked **RULE** are non-negotiable and each one exists because it was
already gotten wrong once during design. Do not "improve" them without reading
the rationale attached — the rationale *is* the reason the rule looks
over-cautious.

Everything in `§13` is an executable test fixture with an expected result. Your
implementation is not done until all of them pass.

---

## 1. What it is, in one page

A second tab on the homepage, directly under the existing «DentCast Evidence
Score چیست؟» explainer box. It is a formal twin of that box — same height, same
icon circle, same 3px leading edge, same radius, same inline-disclosure
behaviour — differing only in colour: the explainer is DES chrome (indigo), the
tool is **amber**, because amber means «this is what a subscription buys»
site-wide and this is the one thing here that a subscription buys.

Pressing it expands a panel **in flow, on the homepage**. It does not navigate,
it is not a modal, it is not a bottom sheet. It closes back to the same place,
three ways: pressing the tab again, «بستن» inside the panel, and `Escape`.

Inside the panel: a title field, a text field, two chips («چکیده است» /
«متن کامل است»), an optional link field, and one button. On submit the reader
gets a DES band, a question type, a 0–100 score, a short interpretation and a
collapsed reasoning trace.

Behind it: a store of every paper ever scored, keyed by the paper's identity.
A paper already in the store is answered from the store — no model call, no
quota spent, and **the reader is told nothing about any of it**.

Two model roles, and they are different models with different API keys: a cheap
one that extracts `{title, first_author, year, doi}` when regex cannot, and a
**reasoning** model that does the scoring. The expensive one is what the whole
store exists to protect.

---

## 2. Non-negotiables

### RULE 1 — Ambiguity means decline

> If we are not sure a key identifies this paper, **no key is minted.**

A missed cache hit costs a few tokens. A *wrong* key returns **another paper's
evaluation**, which is not a degraded answer — it is a false one, presented with
a band and a number and a reasoning trace.

The failure that produced this rule: a reader pasted a whole PubMed web page.
The title heuristic was "first non-empty line", so the title became
`Skip to main page content`. That is not a one-off — it is the title *every*
PubMed page dump would produce, so all of them collide on one title key and the
second reader is served the first reader's score for an unrelated study.

Consequence you must implement: a paper whose title cannot be trusted is stored
with `sha:` (and identifiers, if any) and **no `ttl:` key**. It scores fine; it
just caches badly.

### RULE 2 — Hashtags are stored, never matched

Hashtags are a *topic* vocabulary, not an identity. Two different RCTs on
single-visit endodontics carry identical hashtags. Matching on them hands one
paper's score to another. They are stored because they make the corpus a
searchable asset; they never enter the lookup path.

### RULE 3 — The free gate is generous; the expensive layer is strict

The regex/heuristic layer runs before any model call and must only stop what it
is **certain** about. Everything else passes through to the reasoning model,
which reads the text and is the real judge.

This was gotten wrong three times in a row during design, always the same way:
an early guess asserted with confidence. The last instance shipped a validity
gate whose signal families were five Persian and one English, so **every fully
English abstract scored at most 1 of 6 and was rejected outright** — i.e. most
real input. A language-shaped gate is not a gate, it is a filter on language.

### RULE 4 — The reader's claim never overrides the measurement

`ABSTRACT_ONLY` caps the method multiplier at 0.75 (DES spec v2.2). So calling
an abstract a full text **inflates the score**. It is the one place this tool
can be gamed. The chips are a hint; the word count decides; and the final
authoritative `text_basis` is whatever the scoring model returns in its own
output object.

Direction of error is deliberate: under-claiming is allowed (it only lowers your
own score), over-claiming is caught.

### RULE 5 — Nothing derivable is stored beside the spec output

Same doctrine as `plus/des-scores.json`, `pathways.json`, `badges.json`. The
`des` column holds the spec's output object **verbatim**. `band`,
`question_type`, `provisional`, `text_basis` already live inside it. A second
copy is a second source of truth. (Identity fields — doi/pmid/title/author/year
— are *not* derivable from the spec output and are separate columns; that is
fine and intended.)

### RULE 6 — `plus/des-scores.json` is not touched

Not "prefer not to" — must not.

- `plus/js/des.js` fetches it on **every article page load**. Reader
  submissions would grow a file every visitor downloads.
- Its keys are `content_id` (a page path). A reader's paper has no page.
- It is written by the publishing workflow and gated by
  `tools/verify_publish.py`. A second writer means merge conflicts and a gate
  that sees rows it does not understand.
- CLAUDE.md: "An absent `content_id` is how the display knows there is nothing
  to show." Polluting it breaks that.

### RULE 7 — The store is a Postgres table, not a repo file

The API container's disk is **ephemeral**. A JSON file written at runtime by the
API vanishes on the next restart. Every JSON file in this repo
(`pathways.json`, `badges.json`, `des-scores.json`) is written by an *agent at
deploy time*; this data is written by *users at runtime*. Different lifetime,
different home.

If a reader-facing browsable corpus is ever wanted, a job can publish a curated
subset from the table into a repo JSON. That is a later feature, not this one.

### RULE 8 — No network is required, anywhere

We never *resolve* a DOI. It is a key string: extracted by regex, stored, looked
up. Zero outbound calls.

Optional enrichment (title/journal/year from Crossref) runs **in the reader's
browser**, never in the container — the established pattern in this codebase
(`§9.3`). If it fails, nothing breaks; we simply do not have it.

---

## 3. Where it lives

| Layer | Path | New? |
|---|---|---|
| Migration | `plus-api/migrations/0047_des_scorer.cjs` | new |
| Identity + extraction | `plus-api/src/services/des-identity.ts` | new |
| Validity gate | `plus-api/src/services/des-validate.ts` | new |
| Orchestration | `plus-api/src/services/des-scorer.ts` | new |
| Routes | `plus-api/src/routes/des-scorer.ts` | new |
| Reasoning provider | `plus-api/src/providers/ai/` | extend |
| Config | `plus-api/src/config.ts` | extend |
| Server registration | `plus-api/src/server.ts` | edit |
| Tab markup + critical CSS | `index.html` | edit |
| Panel CSS | `plus/plus.css` | edit |
| Panel behaviour | `plus/js/des-scorer.js` | new |
| Mount | `plus/js/…` whatever `plus.js` boots on the homepage | edit |
| Tests | `plus-api/test/des-scorer.test.ts`, `plus/js/…des-scorer.dom.test.ts` | new |

**Latest existing migration is `0046_notice_reads.cjs`** — confirm before
numbering, another branch may have landed one.

Read these first, they are the closest precedents:
- `plus-api/src/routes/case-assistant.ts` — premium gate + per-user rate limit +
  a model call. The nearest structural sibling.
- `plus-api/src/providers/ai/openai-compatible.ts` — retry policy, JSON-mode
  latching, `outboundFetch`.
- `plus-api/migrations/0044_referrals.cjs` — the house style for a migration
  that documents its own decisions in a header comment. Match it.
- `plus/js/des.js` — the DES display vocabulary. **Reuse its visual language**
  (band bar, `question_type` welded to the band, provisional hatching); do not
  invent a second way to draw a band.

---

## 4. Data model

Migration `0047_des_scorer.cjs`. Write a header comment in the style of
`0044_referrals.cjs` explaining the two-table split and RULE 1.

```sql
-- One row per PAPER. Identity fields + the spec's output object, nothing else.
create table des_papers (
  id            uuid primary key default gen_random_uuid(),
  doi           text,
  pmid          text,
  title         text,
  title_key     text,               -- hash(fold(title)); null when untrusted
  first_author  text,
  year          smallint,
  text_basis    text not null,      -- 'ABSTRACT_ONLY' | 'FULL_TEXT'
  hashtags      text[] not null default '{}',
  des           jsonb not null,     -- the spec's output object, VERBATIM
  spec_version  text not null,      -- e.g. '2.2'
  first_seen_by uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (text_basis in ('ABSTRACT_ONLY','FULL_TEXT'))
);

create unique index des_papers_doi_uq  on des_papers (lower(doi)) where doi  is not null;
create unique index des_papers_pmid_uq on des_papers (pmid)       where pmid is not null;

-- Every key ever seen for a paper. ONE PAPER, MANY KEYS — this is what lets an
-- abstract and a full text of the same study land on a single record.
create table des_paper_keys (
  key        text primary key,      -- 'doi:…' | 'pmid:…' | 'ttl:…' | 'sha:…'
  paper_id   uuid not null references des_papers(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index des_paper_keys_paper on des_paper_keys (paper_id);

-- What a record USED to say, when an upgrade replaced it. Never lost.
create table des_paper_history (
  id         uuid primary key default gen_random_uuid(),
  paper_id   uuid not null references des_papers(id) on delete cascade,
  text_basis text not null,
  des        jsonb not null,
  spec_version text not null,
  replaced_at timestamptz not null default now()
);

-- One row per submission. The quota is counted from here; there is no counter
-- column to drift. `outcome` distinguishes what was actually paid for.
create table des_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  paper_id    uuid references des_papers(id) on delete set null,
  outcome     text not null,       -- see below
  matched_by  text,                -- 'doi' | 'pmid' | 'title' | 'text' | null
  created_at  timestamptz not null default now(),
  check (outcome in ('served','upgraded','scored','rejected','invalid'))
);
create index des_requests_user_day on des_requests (user_id, created_at desc);
```

`outcome` values and what they mean:

| value | model ran? | counts against quota? |
|---|---|---|
| `served` | no — answered from the store | **no** |
| `upgraded` | yes — abstract record replaced by full text | yes |
| `scored` | yes — new paper | yes |
| `rejected` | no — stopped by the free gate | no |
| `invalid` | yes — the model refused it as not-a-study | **no**, but see §10 |

**`merge-profiles.ts` must carry `des_papers.first_seen_by` and
`des_requests.user_id`.** Cascade-deletes off `profiles` would otherwise erase
the corpus when two accounts merge. `first_seen_by` is `on delete set null`
precisely so a departing account cannot take the corpus with it.

---

## 5. The lookup — identity, not similarity

### 5.1 Why not text comparison

An earlier design stored a 5-gram shingle set per paper and matched by
containment. **Do not do this.** It stores thousands of entries per paper and
turns every request into a linear scan of the whole corpus. It is the document
in a costume.

What is stored instead is what a *citation* is made of. Roughly 200–550 bytes a
paper, and lookup is a primary-key hit on a short string.

### 5.2 The key ladder

Strongest first. Each is one `select … where key = $1` against
`des_paper_keys`. The whole search is at most four of them; stop at the first
hit.

```
1.  doi:<lowercased doi>
2.  pmid:<digits>
3.  ttl:<hash(fold(title))>       -- only when the title is trusted (RULE 1)
4.  sha:<hash(fold(whole text))>  -- exact re-paste; free, catches the trivial case
```

**Author+year is deliberately NOT a key.** Two papers by one author in one year
is ordinary. It may corroborate a title match; it may never make one.

### 5.3 `fold()` — Persian normalisation

Applied to key material **only**, never to stored display text. Same reasoning
as `foldFa` in `plus/js/hl-view.js`.

```
strip ZWNJ (U+200C) and bidi marks (U+200E, U+200F)
ي, ى → ی      ك → ک
strip harakat (U+064B–U+0652)
punctuation → space:  . , ; : ! ? ( ) [ ] { } " ' « » ، ؛ ؟ - – — / \
collapse whitespace, trim, lowercase
```

A ZWNJ is not a space. «اندو‌شده» ≠ «اندو شده». Without folding, two copies of
one paper become two keys.

### 5.4 Key accumulation

Every request attaches **all** of its keys to the matched paper, including on a
cache hit. So a paper first stored from an abstract (title key only) gains its
DOI key the first time someone pastes the full text, and every later citation
carrying only that DOI finds it. The corpus cleans itself.

---

## 6. Extraction

### 6.1 The title is a form field

Ask for it. Do not guess it. This single decision removes the largest source of
wrong keys, and a reader with two scores a day will happily type one line.

`findTitle()` survives only as a fallback and as a way to notice disagreement
between the typed title and the text.

### 6.2 `findTitle()` — fallback only

Structure beats position. Position was the bug.

1. Find a line matching `/^(abstract|چکیده)\b[:：]?$/i`. If found, walk **back**
   up to 6 lines and return the first that passes the gate.
2. Otherwise, only the **first 5** non-empty lines are eligible, and only if
   they pass the gate.
3. Nothing passes → `null` → no `ttl:` key.

Gate (`looksLikeTitle`), all must hold:

- does not match the chrome pattern (below)
- does not end in `.` or `؛` — that is a sentence
- **contains a letter, tested with `/\p{L}/u`**
- contains no identifier: `/10\.\d{4}|pmid|doi\s*:/i` → reject
- contains no author list: `/et\s*al\.?|و همکاران/i` → reject
- 6 ≤ words ≤ 35

> **Trap, found the hard way:** the "contains a letter" test was originally
> `/^[\d\W_]+$/` → reject. In JavaScript `\W` is **ASCII-only**, so that pattern
> matches every pure-Persian string ever written and rejected exactly the titles
> this site is made of. Use `\p{L}` with the `u` flag. Assume this class of bug
> exists elsewhere in anything you write.

> **Trap:** without the identifier/author rejections, the line immediately below
> the title on a PubMed page — `Shahabian F, et al. J Endod. 2024. PMID: … doi: …`
> — passes the word-count gate and wins the look-back.

Chrome pattern (case-insensitive, extend freely):

```
skip to | main (page )?content | official website | \.gov\b | cookie |
sign in | log ?in | create account | navigation | search | menu | javascript |
browser | save\b | email\b | permalink | clipboard | share\b | cite\b |
display options | full[- ]text links | similar articles | cited by |
mesh terms | related information | figures?\b | copy download | actions\b |
https?:// | www\.
```

### 6.3 `paperScope()` — cut before harvesting identifiers

Before looking for any DOI or PMID, truncate the text at the first line that
announces **other papers' identifiers**:

```
similar articles | cited by | references? | bibliography |
related information | mesh terms | publication types |
منابع | مراجع | فهرست منابع
```

This is not a heuristic window — those sections name themselves, and everything
after the name belongs to somebody else's paper.

It solves two problems at once: the PubMed page whose «Similar articles» block
supplies a plausible-looking wrong PMID, and the full text whose reference list
supplies dozens of wrong DOIs.

> The original report: a reader pasted a PubMed page and got `pmid:9340725`,
> which was a *related* article. The tell was in the same panel — that PMID is
> from ~1997 while the extracted year was 2016.

### 6.4 Identifier selection

```
allDois(s)  →  /10\.\d{4,9}\/[^\s"'<>,;)\]]+/g   (dedup, lowercase, strip trailing .,;)
allPmids(s) →  /(?:pmid[:\s]*|pubmed\.ncbi\.nlm\.nih\.gov\/)([0-9]{6,9})/gi  (dedup)
```

Note the PMID pattern requires a **label or a PubMed URL**. A bare 8-digit
number is not a PMID.

Selection order (`pick()`), for DOI and PMID independently:

| condition | result |
|---|---|
| link field has exactly 1 | use it — *the link field always wins* |
| link field has >1 | decline |
| body (within `paperScope`) has exactly 1 | use it |
| body has >1, exactly 1 of them in the first 900 chars | use that one |
| body has >1 otherwise | **decline** |
| none anywhere | none |

### 6.5 The link field

One optional input under the text box, **after** the paste, never in front of
it. Label it «لینک مقاله را هم داری؟ (اختیاری)» — *not* "DOI"; many readers do
not know the word. It accepts a bare DOI, a `doi.org` URL, a PubMed URL, a
PMID, or a journal page URL carrying either.

**Auto-fill:** on every `input` event on the text box, run the identifier
regexes over it. If one is found and the field is empty (or was auto-filled
before), fill it and show a small confirmation chip. Clear it if the text
changes and no identifier remains. Mark auto-filled state with a data attribute
so a reader's own typing is never overwritten.

Net effect: the common case — an abstract copied from a journal page, which
carries its DOI — never asks the reader anything.

### 6.6 When the cheap model is called

Only when there is **no DOI, no PMID, and no trusted title**. That is the entire
trigger. A few hundred tokens for `{title, first_author, year, doi}`. See §9.2.

---

## 7. The validity gate

Free, deterministic, runs before any model call. Two severities.

### 7.1 Research signals — five bilingual families

What separates a study from an opinion is **methodological language**, not
topical vocabulary. «دندان» and «روش» appear in a home-remedy post as readily as
in a trial; `p = 0.014` and `n = 42` and `Methods:` do not.

Every family carries both languages. (See RULE 3 for what happens otherwise.)

| family | pattern (case-insensitive) |
|---|---|
| طرح مطالعه | `randomi[sz]ed\|controlled trial\|clinical trial\|cohort\|case[-\s]?control\|cross[-\s]?sectional\|systematic review\|meta[-\s]?analys\|in vitro\|in vivo\|double[-\s]?blind\|placebo\|split[-\s]?mouth\|کارآزمایی\|مرور نظام\|فراتحلیل\|هم‌?گروهی\|مورد[-\s]?شاهد\|مقطعی\|آزمایشگاهی\|دوسوکور` |
| آمار | `\bp\s*[<=>]\s*0?[.,]\d\|\bp[-\s]?value\|\bn\s*=\s*\d\|95\s*%\|confidence interval\|standard deviation\|\bSD\b\|\bCI\b\|statistically significan\|معنادار\|انحراف معیار\|فاصله اطمینان\|سطح معنی` |
| نمونه با عدد | `\d+\s*(patients?\|subjects?\|teeth\|tooth\|specimens?\|samples?\|participants?\|cases\|volunteers?)\|[\d۰-۹]+\s*(بیمار\|نمونه\|دندان\|شرکت‌کننده\|مورد\|داوطلب)` |
| سرتیتر ساختاری | `\b(background\|objectives?\|aims?\|materials?\|methods?\|results?\|conclusions?\|discussion)\s*[:：]\|(زمینه\|هدف\|روش‌?ها\|مواد و روش\|نتایج\|نتیجه‌?گیری\|بحث\|یافته‌?ها)\s*[:：]` |
| سنجه | `\b(mean\|median\|prevalence\|incidence\|odds ratio\|risk ratio\|hazard ratio\|survival rate\|follow[-\s]?up)\b\|میانگین\|میانه\|شیوع\|نسبت شانس\|پیگیری` |

> **RULE — match these against the RAW text, never the folded text.** `fold()`
> strips punctuation, and `p < 0.05` and `Methods:` both lose the exact
> character that makes them a signal.

### 7.2 Severities

**STOP** (do not score, do not spend a slot):

- title empty
- fewer than 80 words
- **zero** research signals **and** fewer than 300 words

**WARN** (score anyway, but say this first):

- zero research signals and ≥ 300 words
- title shorter than 4 words
- title/text incoherence: of the title's words with ≥4 characters (folded),
  fewer than 34% appear in the folded text. Only checked when the title has ≥3
  such words. This is a short string against a long one — cheap, and a
  legitimate use of text comparison, unlike §5.1.
- the reader's basis claim disagrees with the word count

**One signal is enough to pass.** Not three. RULE 3.

### 7.3 Word counting

`words(t) = fold(paperScope(t)).split(' ').filter(Boolean).length`

Chrome and reference lists are cut first. Count words, never characters.

---

## 8. `text_basis` and the upgrade rule

### 8.1 Detection

```
words ≥ 1200  →  FULL_TEXT
words ≤ 600   →  ABSTRACT_ONLY
between       →  null (genuinely ambiguous → defer to the reader's chip)
```

The previous rule was `chars > 1500 || hasSectionHeadings` and it was wrong on
both halves: a **structured abstract carries its own Background/Methods/Results
headings**, and page chrome inflates the character count. Neither signal
separates the two things.

### 8.2 The four outcomes

`RANK = { ABSTRACT_ONLY: 1, FULL_TEXT: 2 }`

| incoming | in store | outcome | model | quota |
|---|---|---|---|---|
| abstract | abstract | serve stored | — | — |
| **abstract** | **full text** | **serve the full-text answer** | — | — |
| **full text** | **abstract** | **re-score, replace record, push old to history** | ✓ | −1 |
| anything | nothing | score, create record | ✓ | −1 |

Full is always preferred. This is not a rule we invented — DES spec v2.2 caps
`ABSTRACT_ONLY` at a 0.75 method multiplier and rates silence as `NR`, so the
full-text evaluation is strictly the better-founded one.

### 8.3 What the reader is told

Never anything about the store. **Always** the text basis, because the DES spec
already treats it as part of the score's meaning:

- `provisional: true` → the existing hatched «امتیاز مقدماتی — فقط از روی چکیده»
- otherwise → «بر پایه‌ی متن کامل مقاله»

The second one matters for honesty: a reader who pasted an abstract and is
served a stored full-text score needs to know the evaluation rests on the
complete paper, not on what they pasted.

---

## 9. The models

### 9.1 Two roles, two configurations

The repo already has a provider abstraction: `plus-api/src/providers/ai/` with
`createAiProvider()`, `AiProvider`, an `openai-compatible` implementation and a
`stub`. Config lives at `config.ai` (`AI_PROVIDER`, `AI_API_BASE`, `AI_API_KEY`,
`AI_MODEL`, `AI_MAX_ATTEMPTS`, `AI_RETRY_BUDGET_MS`, `AI_JSON_MODE`).

**Do not reuse `config.ai` for the scorer.** The reasoning model is a separate
account with a separate key, chosen for a different job, and will be swapped
independently. Add a parallel block:

```
DES_AI_PROVIDER, DES_AI_API_BASE, DES_AI_API_KEY, DES_AI_MODEL,
DES_AI_MAX_ATTEMPTS, DES_AI_RETRY_BUDGET_MS, DES_AI_JSON_MODE,
DES_AI_REASONING_EFFORT      (pass through if the endpoint supports it)
```

Extend the provider interface with a second method rather than inventing a
second abstraction:

```ts
export interface DesScoreInput {
  title: string;
  text: string;
  text_basis: 'ABSTRACT_ONLY' | 'FULL_TEXT';
  doi: string | null;
  pmid: string | null;
}

export interface DesScoreOutput {
  ok: boolean;
  reason?: 'not_a_study' | 'insufficient_text' | 'not_appraisable';
  des?: unknown;        // the spec's output object, VERBATIM — do not reshape
  hashtags?: string[];  // proposed, raw; resolved server-side (§9.4)
  reasoning?: string[]; // short trace lines for the «مسیر استدلال» disclosure
}
```

Reuse `outboundFetch`, the retry policy, and the JSON-mode latching from
`openai-compatible.ts` — including its unusual decision to treat `400` as
transient for the ArvanCloud gateway. Read the comment there before copying.

### 9.2 The cheap extractor

Same file, a third method, but pointed at `config.ai` (the existing cheap
model), **not** the DES config. It is called only under §6.6 and returns
`{title, first_author, year, doi}` or nulls. A few hundred tokens.

### 9.3 Crossref enrichment — browser only

If the reader supplies a DOI, the **client** may fetch Crossref for
title/journal/year and send it along with the submission. The container's
international egress is unreliable; this is the established pattern — see the
reference pins in `.dentcast/collections-pins-export-handoff.md`, which do
exactly this for the same reason. It is optional everywhere: never block a
submission on it, never call it server-side.

### 9.4 The scoring prompt

Load `.dentcast/dentcast-evidence-score-v2.2.md` **whole, minus its appendix**
(the appendix is a pipeline contract, not prompt text) as the system prompt.
Send exactly **one** input block — the reader's paper is one source.

Two additions on top of the spec, both of which must be additive and must not
alter the spec's own output object:

1. **A validity verdict first.** Instruct the model that if the text is not a
   report of a study, it must answer `{"ok": false, "reason": "not_a_study"}`
   and nothing else. This is the strict layer RULE 3 defers to. On this answer:
   show the reader a plain message, write `outcome='invalid'`, and **store
   nothing** — the corpus is shared, and a non-study must not enter it.
2. **Hashtags.** Ask for topic hashtags in the same call — no second request.
   Then resolve them server-side against `dentcast-hashtag-reference.json` to
   canonical forms, exactly the way a publish does (`tools/hashtag_ref.py`).
   Never store a free-text tag; never store an alias as a tag. Drop anything
   that will not resolve rather than minting a concept from a reader submission.

Stamp `spec_version` on the record from the file name you loaded.

---

## 10. Quota

Two per user per day. **Calendar day, Tehran time** — the same convention
`spot_stats` uses; do not implement a rolling 24-hour window and do not describe
it as one.

Counted with a `select count(*) from des_requests where user_id = $1 and
outcome in ('scored','upgraded') and created_at >= <Tehran midnight>`. No
counter column.

- `served` never counts. There was no model call to pay for, and telling a
  reader their free instant answer cost them a slot would be a lie about work
  that did not happen.
- `rejected` never counts — the free gate caught it.
- `invalid` does not count against the two, **but** cap it separately at 3 per
  day per user so a bad actor cannot burn the reasoning model indefinitely. On
  the fourth, refuse without calling the model.

Also add a per-user-per-hour limiter with `services/rate-limit.ts`'s `consume()`,
mirroring `case-assistant.ts`. The daily quota is the product rule; the limiter
bounds a runaway client.

---

## 11. API surface

All routes premium-gated: `app.addHook('preHandler', requireAuth)` then
`requirePremium`, as `case-assistant.ts` does. Register in `server.ts`.

### `GET /des/quota`

```json
{ "limit": 2, "used": 1, "resets_at": "2026-08-18T20:30:00Z" }
```

Used to paint the quota strip when the panel opens.

### `POST /des/score`

Request:

```json
{
  "title": "…",
  "text": "…",
  "claim": "ABSTRACT_ONLY",
  "link": "https://pubmed.ncbi.nlm.nih.gov/38550112/",
  "crossref": { "title": "…", "year": 2024, "journal": "…" }
}
```

Cap `text` server-side (suggest 60 000 chars) and `title` (300). Never trust the
client's `claim` — see RULE 4.

Responses:

```json
// scored / upgraded / served — identical shape, deliberately
{ "ok": true, "des": { … spec output verbatim … },
  "hashtags": ["#درمان_ریشه"], "reasoning": ["…"],
  "quota": { "limit": 2, "used": 1 } }

// stopped by the free gate — 400
{ "ok": false, "error": "invalid_input",
  "issues": [ { "severity": "stop", "message": "…" } ] }

// refused by the model — 200, this is a real answer
{ "ok": false, "error": "not_a_study" }

// quota — 429
{ "ok": false, "error": "quota_exhausted", "resets_at": "…" }
```

> **The response must not reveal whether it came from the store.** No `cached`
> field, no `served_from`, no timing hint the client could surface. The reader
> is never told. Latency will differ and that is fine; a field would end up on
> screen.

Founder-facing, on the rendered `GET /admin` page (same pattern as the support
queue and the gift-card queue):

- `GET /admin/des` — corpus size, requests per day, share served from store,
  the papers with the most hits, and the records stored **without** a `ttl:` key
  (RULE 1's cost, made visible so it can be tuned)
- `POST /admin/des/:id/purge` — remove one paper and its keys. Needed because
  the corpus is shared and a poisoned record affects every reader.

---

## 12. Frontend

### 12.1 The tab

Markup goes in `index.html` immediately after the existing
`.dc-des-legend-wrap` block. Mirror that block's structure exactly.

**`index.html` loads no shared CSS statically** — `dc-nav.js` appends
`plus*.css` at runtime. The existing DES legend therefore duplicates its colour
tokens inline, and you must do the same for anything that paints **before**
first interaction:

- the tab itself (inline critical CSS in `index.html`, amber tokens are already
  defined there as `--x-amber*` in `<style id="dcDepthTheme">`)
- the panel's CSS may live in `plus/plus.css`, because the panel only renders
  after a click, by which time `plus.css` has arrived

Verify this on a cold load with a throttled network before calling it done.

### 12.2 The disclosure

Animate with `grid-template-rows: 0fr → 1fr` on a wrapper whose child has
`overflow: hidden`. No height measurement, no `max-height` guess. The tab drops
its bottom corner radius while open so tab and panel read as one card — the
existing legend already does this; copy it.

`aria-expanded` on the tab, `aria-controls` pointing at the panel.

### 12.3 Behaviour

`plus/js/des-scorer.js`, mounted by whatever `plus.js` runs on the homepage.
Views inside the panel: `compose` → `think` → `answer`, plus `spent` and
`locked`. Closing always resets to `compose` and clears the form; it does **not**
reset the quota display or anything server-side.

The thinking state is one quiet line at a time plus a hairline sweep — not a
scrolling terminal. The full trace is a collapsed `<details>` in the answer.

Validation runs on every `input` and on submit; a `stop` blocks submission and
focuses the offending field.

### 12.4 Answer rendering

Reuse the DES display vocabulary from `plus/js/des.js`: five discrete band
blocks with only the current one coloured (never a gauge), `question_type`
printed with the band and never apart from it, the 0–100 number small and dim
beside the band and never as a headline, provisional shown as hatching.

Colours: band scale `--des-A…E` (grey → dark green, never through red), card
chrome `--des-chrome` (indigo, means only «a machine wrote this»), amber for the
premium tab only. Three scales, three meanings, no mixing.

### 12.5 Accessibility and motion

Visible `:focus-visible` on every control. `prefers-reduced-motion: reduce`
disables the drawer animation, the sweep and the block pop. The panel must not
scroll the page body horizontally at 320px.

---

## 13. Test fixtures — all must pass

Fixture texts are in the mockup (`TEXTS.abs`, `.full`, `.en`, `.dump`, `.junk`).
Copy them into the test file rather than re-inventing them; they were written to
break specific rules.

### 13.1 Validity gate + basis

| # | input | title | claim | expect |
|---|---|---|---|---|
| 1 | English abstract, 253 w | given | ABSTRACT_ONLY | pass · all 5 signals · `ABSTRACT_ONLY` |
| 2 | Persian abstract, 89 w | given | ABSTRACT_ONLY | pass · ≥1 signal · `ABSTRACT_ONLY` |
| 3 | Persian full text, 852 w | given | FULL_TEXT | pass · `FULL_TEXT` (ambiguous band defers to claim) |
| 4 | Persian abstract, 89 w | given | **FULL_TEXT** | pass · **WARN** · resolves to `ABSTRACT_ONLY` |
| 5 | PubMed page dump | **empty** | any | **STOP** — title required |
| 6 | home-remedy text, 97 w | given | any | **STOP** — zero signals · also WARN on title/text mismatch |
| 7 | one sentence, 6 w | given | any | **STOP** — too short |

Fixture 1 is the regression test for RULE 3. Fixture 6 must still stop after you
make the gate bilingual — generosity about language, not about evidence.

### 13.2 Extraction

| # | input | expect |
|---|---|---|
| 8 | page dump, DOI in the citation line | `title` = the real title (found above `Abstract`) · `doi` = the paper's own · `pmid` = **38550112**, *not* 9340725 from «Similar articles» |
| 9 | page dump with the DOI removed, PubMed URL in the link field | `pmid` from the link · `doi` null |
| 10 | clean Persian abstract | title from the first line · no identifiers |
| 11 | chrome only, no paper | title null → **no `ttl:` key minted** |
| 12 | full text with a reference list containing 12 DOIs | only the paper's own DOI selected |
| 13 | title = pure Persian, 13 words | **accepted** (the `\p{L}` regression) |

### 13.3 Store behaviour

| # | sequence | expect |
|---|---|---|
| 14 | abstract → score | new record, `ABSTRACT_ONLY`, provisional, keys `ttl:` + `sha:` |
| 15 | then full text of the same paper | matched by `ttl:` · **upgrade** · record replaced · old row in `des_paper_history` · `doi:` key now attached · quota −1 |
| 16 | then the abstract again | matched · **full-text answer served** · no model call · quota unchanged |
| 17 | a different paper | no match · new record |
| 18 | same text pasted twice verbatim | second matched by `sha:` |
| 19 | model answers `not_a_study` | **nothing stored** · `outcome='invalid'` · daily quota unchanged |

### 13.4 Quota

| # | expect |
|---|---|
| 20 | 2 scored → third `scored` refused with 429 |
| 21 | a `served` request while at 2/2 still answers |
| 22 | quota resets at Tehran midnight, not 24h after the first use |
| 23 | 4th `invalid` in a day refused **without** a model call |

---

## 14. Deployment checklist

- [ ] Migration numbered after the current highest (`0046` at time of writing)
- [ ] `merge-profiles.ts` updated for both user-referencing columns
- [ ] `server.ts` registers the new routes
- [ ] `.env` / deploy config carries the `DES_AI_*` block; `plus-api/DEPLOY.md`
      documents it
- [ ] **API container rebuild** — new env vars and a migration, not a content
      refresh
- [ ] `python3 tools/asset_version.py --bump` in the **same commit** as any
      change to `plus.js`'s module graph or `plus.css`. CI runs `--check`.
      A new module imported by `plus.js` is part of that graph.
- [ ] `python3 .github/scripts/inject_ga.py --check` still passes
- [ ] Tests: `plus-api/test/des-scorer.test.ts` and a DOM test for the panel
- [ ] Verify the tab paints correctly on a cold, throttled load (§12.1)
- [ ] Verify light **and** dark, and the un-stamped system-default state

---

## 15. Decisions already made — do not reopen

| question | answer | why |
|---|---|---|
| Same JSON as the site's DES scores? | No | RULE 6 |
| A parallel JSON file in the repo? | No — a table | RULE 7 |
| DOI mandatory? | No — optional, asked after the paste | The cache pays off on papers many people paste, and those carry a DOI in their text anyway. A wall would cost every reader to optimise a case that never pays. And nothing is lost: a title-keyed record **gains** its DOI later (§5.4) |
| Match on hashtags? | No | RULE 2 |
| Match on text similarity? | No | §5.1 |
| Author+year as a key? | No | §5.2 |
| Tell the reader it came from the store? | No | §11 |
| Show the text basis? | Always | §8.3 |
| Do served hits cost quota? | No | §10 |
| Cabinet kebab tags or canonical hashtags? | Canonical | The corpus is meant to be reusable inside the product, and the AI case-assistant reads the hashtag reference |

## 16. Still open

- **Corpus visibility.** The store is invisible to readers today. Whether it
  ever becomes a browsable «papers we have scored» surface is a product
  decision; nothing here forecloses it (§11's admin view is the seed).
- **Cross-user poisoning.** Current defence is the model's validity verdict plus
  the admin purge. If abuse appears, the next step is requiring a strong key
  (DOI/PMID) before a record may be served to a *different* user than the one
  who submitted it — the data model already supports this via
  `first_seen_by`. Do not build it pre-emptively.
- **Free-tier taste.** Whether a signed-in free reader gets one scored paper
  ever, as a taste of the feature, is unresolved. Build the gate so the limit is
  a config number per tier, not a constant.
