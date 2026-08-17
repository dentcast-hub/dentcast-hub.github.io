# DentCast DES Library — Founder Add Router

Sibling to `README.md` (the «متن جدید دارم» publishing router), `ads.md`, and
`spot-report.md`. Those publish content, ads, and read ad numbers; this one
adds a **scored paper** to the founder's own out-of-band DES corpus —
`plus/des-library.json` — with no reader request behind it and no admin-panel
session involved.

**Trigger (registered in `CLAUDE.md`):** the founder says they have a DES
score to add — **«DES دارم»**, «یه DES دیگه دارم اضافه کنم», «این مقاله رو
امتیاز دادم» — and hands over **two things**: the scored JSON record (one
paper, the spec's own output object) and the paper's title. Anything else
(hashtags, `also_cited_by`, who scored it) is optional and asked for only if
missing. This is **not** the «متن جدید دارم» router — no page, no
`dentcast-brain.json` entry, no Pulse line, nothing on `/pillar/` or `/up-board/`.
It is also not the reader-submission flow (`ارزیاب DES`, `.dentcast/des-scorer-handoff.md`):
that one runs live, in production, when the founder answers a *specific
reader's* pending request through the deployed admin panel — this workflow has
no live request behind it at all.

---

## Why a second shelf exists

`ارزیاب DES`'s reader-submission corpus (`des_papers` / `des_paper_keys`) is
Postgres, written live when the founder pastes a score into the deployed admin
panel while answering an open `des_requests` row. That is correct for what it
is — a real-time action against production — but this agent session has
**no production database credentials and no admin-panel login**. What it does
have is the git repo. `plus/des-library.json` is versioned there, exactly like
`plus/pathways.json` and `plus/badges.json`: a **file the live API re-fetches
from the published site every few minutes** (`content-refresh.ts`), so a paper
added here starts answering real reader submissions on `/des/submit` within
`CONTENT_REFRESH_SECONDS` (default 5 min) of the push landing — **no redeploy**
for a routine add, once the one-time wiring below has shipped.

`plus-api/src/services/des-library.ts`'s `lookupExact`/`nearDuplicates` check
**both** shelves — this file first (an in-memory map, no DB round trip), then
`des_papers`. A `lib:`-prefixed paper id (e.g. `lib:p_0042`) always means this
file; a bare id always means a Postgres row. The two never collide and neither
shelf's data lives in the other.

**One-time deploy gate.** If `plus-api`'s running container predates
`services/des-library-file.ts` / `DES_LIBRARY_PATH` / `DES_LIBRARY_URL` (see
`plus-api/Dockerfile`, `plus-api/DEPLOY.md`), a push to `plus/des-library.json`
sits there inert until the founder rebuilds and redeploys the API image once.
After that one rebuild, every future add is a plain git commit.

---

## Hard rules

1. **`tools/des_library.py` is the only writer.** It validates the record
   against the exact same arithmetic the live API enforces (`validate()` /
   `plus-api/src/services/des-library.ts`'s `validateDesRecord`, kept in
   agreement on purpose), normalises known conventions (Persian digits, the
   four penalty rows' canonical Persian wording), runs the near-duplicate gate,
   and only then appends to `plus/des-library.json`. Never hand-edit the file.
2. **The title is supplied, not guessed (RULE 1).** A scoring model may omit
   the title, truncate it, or pull it from a running head. Whoever handed you
   the record has the real paper in front of them, so the title you were
   given always wins over `record.citation.title` — pass it with `--title`.
   If the record has no usable title and none was given, the tool refuses:
   fix it, don't invent one. An invented title mints a key that collides every
   future submission of THIS paper onto whatever the guess happened to be.
3. **Ambiguity declines — same-as/force is the founder's call, never yours.**
   If `tools/des_library.py add` reports near-duplicate candidates, STOP and
   show them to the founder exactly as printed (score, shelf, title, author/
   year agreement marks). Do not pick `--same-as` or `--force` on your own
   judgement, even when a candidate looks obviously right — this is the same
   rule the admin panel's near-duplicate gate enforces for reader submissions,
   applied here because a bad guess is not "a few tokens wasted", it is
   another paper's evaluation returned to a future reader.
4. **Hashtags are canonical or dropped, never invented.** `--tags` must be
   comma-separated canonical forms already in `dentcast-hashtag-reference.json`
   — the tool refuses to add the paper if any tag is not legal. Resolve each
   proposed tag against that file the same way the publishing workflow's Hard
   Rule 15 does; if a genuinely new concept is needed, that is a separate,
   explicit step (`tools/hashtag_ref.py`), never folded silently into this one.
5. **`plus/des-scores.json` is never touched.** That file is the publishing
   workflow's — keyed by page path, fetched by every article page load, gated
   by `verify_publish.py`. `des_library.py`'s `site_corpus()`/`site_tags()`
   only ever *read* it, to cross-reference and to populate `also_cited_by`;
   nothing in this workflow writes to it.
6. **Every add is a commit, and the commit message says what it added.** No
   silent writes. After `tools/des_library.py add` succeeds, `git add
   plus/des-library.json` and commit with the paper's title in the message,
   then push to the session's designated branch (see the repo's git protocol
   at the top of `CLAUDE.md`/`AGENTS.md`) — never straight to a default branch
   without that protocol's say-so.

---

## Steps

### 1. Get the two required things

- **The JSON record.** One paper — the DES spec's own output object
  (`content_type`, `s_design`, `q_method`, `penalties`, `des_score`, `band`,
  `text_basis`, `provisional`, `interpretation_fa`, ideally `citation`). If the
  founder pastes it inline, write it to a scratch file first (the scratchpad
  directory, never inside the repo) — `tools/des_library.py add` takes a file
  path, not stdin.
- **The title.** Ask if it was not given explicitly, even if the record
  appears to carry one (Hard Rule 2).

Optional, ask only if relevant / offered: `--tags` (canonical hashtags),
`--submitted-by` (a reader's user id, only if this add is retroactively
covering an out-of-band answer to a real submission — leave unset for a
purely proactive add), `--scored-by` (defaults to `gemini`).

### 2. Run the tool

```bash
python3 tools/des_library.py add /path/to/record.json --title "عنوان دقیق مقاله" --tags '#تگ_یک,#تگ_دو'
```

Three outcomes:

- **Rejected — arithmetic problems.** The tool prints each disagreement in
  Persian and exits non-zero. Report them to the founder; nothing was written.
  This is not yours to override — the record needs to be re-scored or the
  disagreement resolved by whoever produced it.
- **Near-duplicate candidates.** The tool exits `2` and prints up to six
  candidates with a similarity score, which shelf they are on (`کتابخانه` or
  `سایت`), title, author/year agreement marks. Relay them verbatim and ask:
  **«همان مقاله است؟»** → re-run with `--same-as <id>` (attaches this
  submission's keys to the existing record; the existing score is never
  touched). **«مقاله‌ی دیگری است؟»** → re-run with `--force` (mints a new
  record). Never choose for the founder (Hard Rule 3).
- **Registered.** The tool prints the new paper id, its keys, its hashtags,
  any normalisation it applied (report these — they are visible changes to
  what was pasted), and — if the same paper already appears among the site's
  own scored pages (`plus/des-scores.json`) — which page(s), filed into
  `also_cited_by` automatically. Nothing to do here beyond relaying the
  summary.

Sanity-check the whole file after any add:

```bash
python3 tools/des_library.py check
```

Non-zero means a key points at the wrong paper or a stored record itself
fails arithmetic — fix before committing, never commit a `check`-failing file.

### 3. Commit and push

```bash
git add plus/des-library.json
git commit -m "des-library: add «<title, shortened>» (<band>, <des_score>/100)"
git push -u origin <the session's designated branch>
```

Follow the repo's git protocol exactly as for any other change in this
session — same branch, same push discipline, no force-push, no `--no-verify`.

### 4. Tell the founder what happens next

- If the one-time API deploy gate above has already shipped: the paper starts
  answering real `/des/submit` calls within `CONTENT_REFRESH_SECONDS` of the
  push landing on the published site — nothing further to do.
- If it has not shipped yet: say so plainly — the commit is real and correct,
  but it will not be *live* until that one deploy happens.

---

## Quick reference

```bash
# Has this paper already been scored, by DOI/PMID/title?
python3 tools/des_library.py lookup --doi 10.1016/j.jdent.2024.105396
python3 tools/des_library.py lookup --title "…" --author "Fan" --year 2024

# Free-text search across the library AND the site's own scored pages
python3 tools/des_library.py search "implant" --band A
python3 tools/des_library.py search --tag '#دخانیات'
python3 tools/des_library.py search --mine   # library only

# Validate the whole file (keys line up, every record still arithmetically sound)
python3 tools/des_library.py check
```
