# FAQ-Schema Removal — Execution Handoff

**Status:** decided, not started. Every design decision in this document is
MADE — the founder approved removal on 2026-08-11. The executing agent's job
is mechanical execution + running the gates. **Nothing here is open for
reinterpretation; where this doc and your own judgment disagree, this doc
wins. Where this doc is genuinely silent or the repo contradicts it, STOP and
ask the founder — never improvise** (same standard as the publishing
workflow's «اگر جایی شک داشتی سوال کن عمل نکن»).

**Branch:** `claude/google-ranking-drop-at7352` (already created from `main`).
Commit and push here. Do NOT open a PR unless the founder asks.

---

## 1. Why (context, do not re-litigate)

The 2026-08-11 SEO audit found the site's single biggest ranking-risk:
**~300+ content pages carry `FAQPage` JSON-LD (and a sibling
`DefinedTermSet` "flashcards" block) with ZERO visible rendering on any
page.** Google's structured-data guidelines require marked-up content to be
visible; hidden Q&A at this scale is exactly what spam/core updates punish,
and the mass-addition date (2026-07-18, 92 commits) sits right after the
June-2026 core update rollout. `FAQ_AUDIT.md` (repo root) independently
documents the same fact: 1,062 hidden Q&A items, no visible UI anywhere.

**Founder decision:** remove the hidden schema. Do NOT add any visible FAQ
for free users. The FAQ/flashcard *content* must survive, because two premium
features are built from it (quiz + Leitner flashcards). So the corpus moves
out of the pages into a data file, and the pages are stripped.

**What this task is NOT:** no visible-DOM change of any kind, no touching of
other schema types (`BlogPosting`, `WebPage`, `MedicalWebPage`,
`BreadcrumbList`, `PodcastEpisode`, `DefinedTerm` inside glossary body
schema, etc.), no en-title fixes, no ad changes, no redesign work. One task:
FAQ/flashcards schema out of pages, premium pipeline unbroken.

---

## 2. Verified inventory (measured 2026-08-11 — re-verify in Phase 0)

- **477 HTML files** contain `"FAQPage"` and/or `"DefinedTermSet"`, across:
  `chairside/`, `dentai/`, `dentcast-plus/`, `episodes/`, `glossary/`,
  `insight/`, `litecast/`, `metanotes/`, `notecast/`, `photocast/`,
  `sharehub/`, their `*/en/` mirrors, **and the homepage `index.html`**
  (a 2-item FAQPage about رادار).
- **Three embedding patterns** (script-block counts):
  1. `FAQPage` as a node inside the `@graph` array of the page's main
     `<script type="application/ld+json">` — 326 scripts.
  2. `FAQPage` as its own standalone `<script type="application/ld+json">`
     (older pages: litecast/glossary era) — 40 scripts.
  3. `DefinedTermSet` (`@id` ending `#flashcards`) as its own standalone
     script — 319 scripts.
- **No cross-references:** no other JSON-LD node anywhere references the
  `#faq` or `#flashcards`/`#flashcards-cN` `@id`s (verified by grep count).
  Deleting the nodes orphans nothing.
- **Consumers of the schema (these are what you must NOT break):**
  - `tools/build_quiz_index.mjs` — walks every page, extracts `FAQPage`
    (incl. inside `@graph`), keeps binary yes/no questions, writes
    `plus/quiz-index.json`. Skips LiteCast, `/en/` mirrors, homepage.
  - `tools/build_flashcards_index.mjs` — same walk for `DefinedTermSet`,
    writes `plus/flashcards-index.json`. Skips LiteCast and `/en/`.
  - `tools/verify_publish.py` — Phase-F gate; steps «4.12 quiz» / «4.11
    cards» REQUIRE a FAQPage on the page today (see the
    `# ---------------- FAQ + flashcards ----------------` section). Without
    the Phase-3 change below, every future publish fails the gate.
- **Docs that assert "FAQPage on the page itself" and must change in the
  same commit as the doc phase (agent-parity rule):**
  - `.dentcast/workflows/README.md` — steps 4.11 (~line 873), 4.12 (~line
    972), builder-run steps 4/4b (~lines 1327–1328), report checklist
    (~lines 1505–1506).
  - `AGENTS.md` line ~247 (`FAQPage روی خودِ صفحه`).
  - `.cursor/rules/dentcast-plus-premium.mdc` line ~17 (same phrase).
  - `.cursor/rules/dentcast-publishing.mdc` (~line 30) if its 4.11/4.12
    wording implies on-page schema.

---

## 3. Hard rules for the executor

1. **Persian strings are copied, never re-typed** (repo Hard Rule 16). The
   corpus file is built by *programmatic extraction* from the pages — no
   model ever writes the question/answer text by hand. A ZWNJ is content.
2. **Only `FAQPage` and `DefinedTermSet` nodes leave the pages.** Every other
   JSON-LD node, and every byte of visible HTML, is untouched. Gate 5c below
   proves it mechanically.
3. **All scripts you write are idempotent** (second run = zero diff), live in
   `tools/`, and are committed — same convention as `inject_ga.py`.
4. **Never hand-edit** `plus/quiz-index.json` or `plus/flashcards-index.json`
   — the builders are their only writers (workflow rule).
5. **No `asset_version.py --bump`.** No stamped shared asset changes in this
   task: the two index JSONs are data under `/plus/*` `no-cache`
   (`_headers`), and no `.js`/`.css` entry in the import graph is edited. If
   you find yourself editing a stamped asset, you have left the task's scope
   — stop.
6. **LiteCast doctrine unchanged:** LiteCast stays outside the quiz/flashcard
   ecosystem (the `verify_publish.py` skips stay). Its pages still get
   stripped like everyone else's — stripping is removal, not enrollment.
7. Work in the phase order below. Each phase ends with its gate green before
   the next phase starts. Commit per phase (7 small commits > 1 giant one).

---

## 4. Phases

### Phase 0 — Baseline snapshot (no repo changes)

```bash
node tools/build_flashcards_index.mjs
node tools/build_quiz_index.mjs
git diff --stat   # expect: no diff, or only regenerated-index noise; if the
                  # indexes changed, commit that separately FIRST as
                  # "chore: refresh quiz/flashcards indexes" so the baseline is clean
cp plus/quiz-index.json /tmp/baseline-quiz.json
cp plus/flashcards-index.json /tmp/baseline-flashcards.json
```

Also record the inventory numbers (files with FAQPage / DefinedTermSet) with
a grep — they should match §2 modulo pages published since 2026-08-11.

### Phase 1 — Extract the corpus (new file: `plus/faq-corpus.json`)

New one-time-but-idempotent script `tools/faq_corpus_extract.py`:

- Walk every `*.html` under the repo root, excluding `node_modules/`,
  `plus-api/`, and `mockup-home.html`.
- From each page, extract **verbatim** every `FAQPage` node (standalone
  script OR inside `@graph`) and every `DefinedTermSet` node whose `@id`
  ends in `#flashcards` (the flashcards block — do NOT take glossary
  `DefinedTermSet`s that are the page's *own subject matter*; the flashcards
  one is identified by the `#flashcards` `@id` and/or `source`/`sourceFaqIndex`
  keys on its terms).
- Key = content id = repo-relative path minus `.html` (identical to
  `toContentId()` in `tools/build_quiz_index.mjs`).
- Output shape (nodes stored VERBATIM — this is what makes the migration
  provably lossless and satisfies Hard Rule 16):

```json
{
  "version": 1,
  "extracted_at": "<date>",
  "note": "FAQ + flashcard corpus removed from page JSON-LD on 2026-08-…; feeds plus/quiz-index.json and plus/flashcards-index.json. Never served as page markup again.",
  "byContent": {
    "insight/insight-55": {
      "faqPages": [ { "...the FAQPage node exactly as extracted..." : "" } ],
      "definedTermSets": [ { "...the #flashcards node exactly as extracted..." : "" } ]
    }
  }
}
```

- Include EVERY page that has the nodes — en mirrors, litecast, homepage,
  dentcast-plus, photocast, episodes. The corpus is the lossless archive of
  everything Phase 5 deletes; the builders do their own filtering.
- Deterministic output: `byContent` keys sorted, `json.dumps(...,
  ensure_ascii=False, indent=2)`, trailing newline.

**Gate 1:** script re-run produces zero diff; total FAQPage-node count and
Question count in the corpus equal the counts extracted from pages (print
both); spot-check `insight/insight-55`, one glossary page, one litecast page,
`index.html`, and one `/en/` page by eye in the corpus.

### Phase 2 — Point the two builders at the corpus

- In both `tools/build_quiz_index.mjs` and `tools/build_flashcards_index.mjs`:
  replace the HTML-walk + extract with reading `plus/faq-corpus.json` and
  iterating `byContent`. **Keep every existing filter exactly**: quiz skips
  LiteCast + `/en/` + homepage; flashcards skip LiteCast + `/en/`. Implement
  the filters on the content-id string (`litecast/`, `/en/`, `index`),
  mirroring the current dir-walk skips.
- Keep ALL classification logic (`YES_NO_QUESTION`, `deriveKey`, deixis
  handling, id shape `${contentId}#q${idx}`) byte-for-byte untouched.
- Update each output's `generatedFrom` string to name the corpus file.

**Gate 2:** run both builders. Diff against the Phase-0 baselines:
`byContent`, `contentCount`, `questionCount` (and the flashcards
equivalents) must be **identical**; the only allowed difference is the
`generatedFrom` string. A one-liner:

```bash
python3 - <<'EOF'
import json
for name in ('quiz','flashcards'):
    a=json.load(open(f'/tmp/baseline-{name}.json')); b=json.load(open(f'plus/{name}-index.json'))
    a.pop('generatedFrom',None); b.pop('generatedFrom',None)
    assert a==b, f'{name}: MISMATCH'
    print(name,'identical ✅')
EOF
```

If this gate fails, the corpus or the rewiring is wrong — fix THAT; never
"fix" the gate or hand-tune an index.

### Phase 3 — `tools/verify_publish.py`

In the `# ---- FAQ + flashcards ----` section:

- Load `plus/faq-corpus.json`; resolve the publish's content id the same way
  the script already derives `page_rel`.
- «4.12 quiz» / «4.11 cards» checks now read the corpus entry instead of the
  page's JSON-LD. All existing sub-checks (deixis, binary-verdict opening)
  keep running on the corpus text. LiteCast skips unchanged.
- **Add one new check** (regression guard), e.g. labeled «4.12 no-page-schema»:
  FAIL if the page's HTML contains `"FAQPage"` or a `#flashcards`
  `DefinedTermSet` — so no future publish/clone silently re-introduces the
  hidden markup. Its printed fix command: `python3 tools/strip_faq_schema.py <page>`.

**Gate 3:** `python3 tools/verify_publish.py --last` — the FAQ rows must
evaluate (against the corpus) with the same verdicts as before Phase 3 for
the latest publish, and everything that was green stays green. (The new
no-page-schema check will FAIL until Phase 5 runs — that is expected;
record it and move on, then re-run in Phase 7.)

### Phase 4 — Documentation sweep (one commit, agent-parity rule)

Rewrite the "where FAQ lives" story in ALL of (see §2 pointers):
`.dentcast/workflows/README.md` steps 4.11 + 4.12 + builder steps 4/4b +
report checklist; `AGENTS.md`; `.cursor/rules/dentcast-plus-premium.mdc`;
`.cursor/rules/dentcast-publishing.mdc` if needed. The new story, in the
docs' own voice:

> FAQ + flashcards are still authored on every non-LiteCast publish (same
> quality rules: standalone questions, binary answers open with an explicit
> «بله»/«خیر»), but they are written into `plus/faq-corpus.json` under the
> new page's content id — **never into the page's JSON-LD**. The page itself
> carries no `FAQPage`/`DefinedTermSet`; `verify_publish.py` fails any page
> that does. Builders read the corpus.

Also add one line to `.dentcast/workflows/en-version.md`: the en clone
carries no `FAQPage`/`DefinedTermSet` either (en pages are outside the quiz
ecosystem already — the corpus keys for en pages exist only as archive).

**Gate 4:** `grep -rn 'FAQPage' .dentcast/workflows/ AGENTS.md .cursor/rules/`
— every remaining mention describes the corpus model, none says "on the
page". CLAUDE.md itself needs no edit (it doesn't specify FAQ placement) —
if you believe it does, stop and ask.

### Phase 5 — Strip the pages (new script: `tools/strip_faq_schema.py`)

Script contract:

- Args: one or more paths, or `--all` for the sitewide sweep (same walk +
  exclusions as Phase 1).
- Per page: for each `<script type="application/ld+json">` block, parse the
  JSON. If the top-level node is a `FAQPage`, or a `DefinedTermSet` whose
  `@id` ends `#flashcards` → **remove the whole script element** including
  its trailing newline. If the node has an `@graph` → remove any
  `FAQPage`/`#flashcards`-`DefinedTermSet` members from the array and
  re-serialize **only that script's JSON** (`ensure_ascii=False, indent=2`),
  leaving the rest of the file byte-identical. Unparseable ld+json → print
  the path and touch nothing on that page.
- Idempotent: pages without the nodes are not rewritten at all.

**Gate 5 (all four, mechanical):**

- **a.** `grep -rl '"FAQPage"' --include='*.html' . | grep -v node_modules`
  → empty. Same for a `#flashcards` `DefinedTermSet` grep.
- **b.** Every ld+json block on every modified page still parses
  (`python3` loop over `git diff --name-only`).
- **c.** Visible text unchanged: for every modified file, strip ALL
  `<script>` blocks from old (`git show HEAD:<f>`) and new, then compare —
  must be byte-identical. Script this; do not eyeball it.
- **d.** Second `--all` run → `git status` clean.

Commit the sweep as its own commit (it is ~470 files; keep it mechanically
reviewable by containing NOTHING but the strip).

### Phase 6 — Keep the corpus itself out of search

- `robots.txt`: add `Disallow: /plus/faq-corpus.json` next to the
  `dentcast-music.json` rule, with a one-line comment in the same voice.
- `_headers`: add an `X-Robots-Tag: noindex` entry for
  `/plus/faq-corpus.json` (mirror the cabinet-catalog pattern; .ir/Arvan
  ignores `_headers` — that asymmetry is documented and fine).
- Do NOT sitemap it (the sitemap generator only lists pages — verify it
  didn't pick the JSON up: `grep faq-corpus sitemap.xml` → empty after CI
  regenerates, and locally if you run the generator).

### Phase 7 — Final gates, then push

```bash
node tools/build_flashcards_index.mjs && node tools/build_quiz_index.mjs   # rerun post-strip
# Gate-2 comparison must STILL pass (corpus, not pages, feeds them now)
python3 tools/verify_publish.py --last                                      # all green incl. the new no-page-schema check
python3 .github/scripts/inject_ga.py --check                                # GA untouched on every page
python3 .github/scripts/inject_preconnect.py --check                        # preconnect untouched
python3 tools/asset_version.py --check                                      # proves rule 5 (no bump needed)
git push -u origin claude/google-ranking-drop-at7352                        # retry ×4 w/ backoff on network error only
```

Paste every gate's output into the final report to the founder.

---

## 5. Explicit DO-NOTs (each of these was considered and rejected)

- Do NOT render a visible FAQ section — founder explicitly declined adding
  anything for free users.
- Do NOT gate FAQ behind premium on the pages — a crawler is an anonymous
  user; premium-only rendering recreates the exact hidden-content problem
  (and schema-for-hidden-content is the cloaking direction).
- Do NOT delete the corpus content itself, and do NOT drop en/litecast/
  homepage entries from the corpus "because builders skip them" — the corpus
  is the lossless archive; skipping is the builders' job.
- Do NOT touch `spot/`, en titles, pillar pages, or anything from the other
  audit findings — separate tasks, separate branches.
- Do NOT reformat, re-indent, or "clean up" any HTML beyond the exact script
  blocks being removed.
- Do NOT merge to `main` or open a PR without the founder.

## 6. Rollback

The corpus stores the removed nodes verbatim, keyed by page. Re-injecting
them (should the decision ever reverse) is a mechanical inverse of
`strip_faq_schema.py`. Nothing in this task destroys information — that is
by design; keep it that way.
