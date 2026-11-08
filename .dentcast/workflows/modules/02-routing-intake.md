<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages, the save point and the deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `0`, `A`, `B.1`, `B.2`, `B.3`, `B.3.5`, `B.4`, `B.4.7`, `B.4.8`, `B.4.9`, `B.5`.

## Phase 0 — Routing: is there an attached paper file? is there text to publish?

Classify the request along two independent axes: **is there text/content to publish** (a متن for a page), and **is there an attached research paper file** (a PDF or similar)? The paper actions are triggered by the **file itself, for any type** — not only DentAI — so the paper branch (**Phase C step 4.10**) fires whatever the locked category is.

| Text to publish? | Paper file attached? | What runs |
|---|---|---|
| **Yes** | **No** | Normal publish only. No paper branch. |
| **Yes** | **Yes** | Normal publish for that type **plus** all three parts of step 4.10 (Drive filing + catalog entry + first-author→DOI credit on the page). |
| **No** | **Yes** | **Paper-only fast path** — no page clone, brain entry, pillar, Pulse, en mirror or builder. Only step 4.10 Parts 1 and 2; **skip Part 3** (no page to credit). Then commit. |
| **No** | **No** | Nothing to do — ask what the founder wants. |

**Paper file without text, but a page is asked for → ASK.** If the paper arrives with no متن but the request only makes sense on a page — DES/Fidelity, the first-author→DOI credit, a post/page itself — or the founder says the text lives elsewhere (a document, an artifact, an earlier message), do **not** silently take the paper-only path. Ask, with the two named options: «متن صفحه کجاست؟ (لینک یا فایلش را بده)» / «فقط paper-only بماند (Drive + کاتالوگ، بدون صفحه)». Route only after the answer.

**Paper-only fast path (text-less) detail.** The cabinet catalog (`dentcast_cabinet_full_catalog.json`) is read client-side by `dentcast_cabinet_search.html` and is **not** part of the site version hash, so a paper-only addition needs **no** builder and **no** version stamp — Drive + catalog + commit is the whole job. The one exception is step 4.10 Part 2 item 7: when the paper count crosses a round hundred, `python3 tools/asset_version.py --bump` runs with it (a cache-buster for the shared gate module, not the site version stamp).

The catalog is deliberately **kept out of search** (`robots.txt` disallows it and its `.enriched.json` sibling, `_headers` sends `X-Robots-Tag: noindex`, the search page has `<meta robots noindex>`). Adding a paper **never** touches `robots.txt` or a sitemap — never "fix" the disallow.

## Phase A — Discover

Before asking anything other than the type:

1. Load `dentcast-brain.json` **once** (Hard Rule 1) by **parsing** it and inspecting exactly what items 2–5 and Question 2 need — the category set; the latest same-category entry with its **exact key set, nesting and order** (Hard Rule 5's parity, which Phase F row `5 brain` checks); the live `PILLARS` (item 5); a numbered series' last part and its id. It is parsed, never read into context line by line. Later steps query this loaded copy.
2. Identify every distinct content category (a `type`/`category` field, or whatever the actual schema is).
3. For each category, the most recent entry defines the directory + URL pattern, the schema shape, the media fields the type uses (text, image, audio, video, external link, transcript …), and — when entries link to a page on disk — the structural HTML template.
4. A NoteCast also touches its parent episode page in `/episodes/` (step 4.5).
5. Read the **live structured-pillar set** from the `PILLARS` dict in `tools/build_pillar.py` (Hard Rules 7–8), never from memory:
   `python3 -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"`.
   Step 2.4 decides the pillar/subtopic from it (Hard Rule 6).

## Phase B — Intake

Intake collects the founder's **data**; it asks nothing about agent proposals (Hard Rule 14). Ask only for data the request does not already give (Hard Rule 13).

### Question 1 — Type

When the founder's request does not make the type obvious, ask:

> این مطلب کدوم نوعه؟ (لیست نوع‌هایی که از brain پیدا کردی رو نشون بده)

**The locked type is the brain `type`, which is not always the folder's name.** An insight page lives
at `insight/insight-<N>.html` but its brain entry is `type: clinical` with id `clinical-<N>`; the
handoff category is that same brain `type` (`publish-handoff-tool.md`). Phase A's «latest
same-category entry», Question 2's next number and Hard Rule 5's key-set parity all follow the brain
`type`, never the directory.

**Two types in the brain are CLOSED and are never offered: `dentai` and `photocast`.** Their 35 + 3 pages stay, but no new entry is appended to either. A single- or multi-paper reading is **`sharehub`**. If the founder names a closed type, say so and ask which living section it goes to (`sharehub` for a reading) — never create `dentai-36` or `photocast/episode-4` (`.dentcast/workflows/global/repo-conventions.md`).

Lock the category for the rest of the run.

### Question 2 — Number / identifier

The next number is the max existing number in this category + 1. State it («شماره‌اش meta-16 است») and continue; a gap or sub-numbered entry in the series is recorded, never filled by a guess. A number the founder gives wins.

### Question 3 — Text

If the request carries no text, ask:

> متن کامل رو بفرست.

### Question 3.5 — Writing-style check (de-AI pass)

**Runs once, for EVERY type, on the متن just received — before any other step consumes it.** Its output is the text of record for page build, linking, DES and everything downstream.

**Goal:** flag the spots that read as AI-generated rather than human-written — phrasing, rhythm and word choice only, **never** facts, claims, numbers, names, citations or meaning.

#### Step 1 — Scan for AI tells

Judge by ear, not by checklist. Typical tells:
- **Formulaic throat-clearing openers/closers** that restate what was just said («در نتیجه می‌توان گفت که...», «به طور کلی...»).
- **Overused AI clichés** («بدون شک», «نکته قابل توجه این است که», «در دنیای امروز», «نقش بسزایی دارد», «از اهمیت ویژه‌ای برخوردار است»).
- **False-balance hedge stacking** («نه‌تنها... بلکه...», «از یک سو... از سوی دیگر...») used as filler.
- **Mechanical parallelism / listy prose** — reflexive rule-of-three, prose chopped into fragments.
- **Uniform sentence rhythm**, **generic filler with no concrete content**, **over-punctuated emphasis** (em-dashes, bold, exclamation as a substitute for a point).

#### Step 2 — Identify and announce, don't edit yet

For each genuine instance record: the exact original phrase, a rewrite with the **same meaning, facts and register**, and a one-line reason. No genuine tell → record «متن طبیعی به نظر می‌رسه، تغییری لازم نیست» and continue with the text unchanged.

#### Step 3 — Apply, record, then branch

The rewrites are agent proposals under standing acceptance (Hard Rule 14): apply them and record each (original → rewrite → reason) in the handoff; the agent's Push-2 report lists them and the founder may revert any. Every sentence not rewritten stays byte-identical, and the founder's title and caption are never touched (Hard Rule 16).

#### Constraints

- **Style and phrasing only.** If a flagged sentence cannot be rewritten without touching its substance, leave it.
- **No new content** — no added claims, examples or sections.
- **One pass**, here, on the as-submitted متن; not repeated later.

### Question 4 — Required media (dynamic, based on category)

From the latest entry of the locked category, see which media fields are populated, and collect only what the request does not already carry:

- **Image field** → «عکس داره؟ اگه آره فایل یا اسمش رو بده.»
- **Audio field:** where audio lives in a sibling directory (NoteCast from `/episodes/episode-XX`), **don't ask** — fetch it from the sibling path; ask only if it cannot be resolved. Otherwise ask. Audio never enters the repo: it is uploaded to ArvanCloud object storage and only the URL is written (e.g. `https://episodes.s3.ir-thr-at1.arvanstorage.ir/dentcast162%20.mp3?versionId=` in `dentcast.json`).
- **Video / external link** → «لینک ویدیو/منبع چیه؟»; **transcript or attachment** → ask for it.
- Derivable fields (slug, date, schema URL …) are generated, never asked. A field you genuinely do not know is wanted this time: «این بار [field] داری یا نه؟»

<!-- insight-conventions:v1 -->
**Insight images and caption.** For `insight/` pages:

- **Image file name:** `insight<N>-<k>.webp`, `<k>` from 1 in the order the images appear, even when there is only one (`insight100-1.webp`); no slug, no other pattern. The page references it by absolute path (`/insight/insight100-1.webp`).
- **Image size:** WebP, long edge at most 1600 px, file at most 300 KB. Shrink a larger image; never enlarge a smaller one.
- **Caption the agent composes** (standing acceptance, Hard Rule 14): one or two sentences, at most 200 characters. A caption the founder wrote is copied as is (Hard Rule 16), whatever its length.

Existing insight pages keep their file names; this applies to new ones, a چالش image in `insight/` included (module 09's `insight68.webp` does not follow this pattern; do not copy it).
<!-- /insight-conventions:v1 -->

### Question 4.7 — Any type: is there an accompanying article (paper) file?

**Runs for EVERY type** (Phase 0). A paper file attached → the **step-4.10 branch is ACTIVE**; keep the file and its real filename for that step. No paper → a documented skip; the page publishes with no Drive/catalog/DOI actions. Unsure whether a file was provided → ask. The branch is **additive**: the normal publish for the type runs in full. (No متن at all → Phase 0's paper-only fast path.)

### Question 4.8 — DES evidence basis (what text will the score be computed from?)

**Runs on every publish that produces a page** — except LiteCast and a چالش (Question 4.9), the canonical skips of `modules/08-des-fidelity.md`. It arms step 4.13 by answering a factual question: **what text the scoring model will be given**, because that model never fetches anything (DES spec Core Rule 4: "You score ONLY what is inside `source_text` … A DOI is an identifier, never a source of content").

Classify into exactly one basket. Baskets 1 and 2 are mechanical — state the result and continue. Basket 3 is a founder decision, asked when it arises.

**1. COMMENTARY — DentCast's own authored piece.** The متن is the founder's (or a guest specialist's) own clinical reasoning, case narration or reflection, and the page names **no retrievable paper**. No DOI is asked for: the **content's own text is the `source_text`** and step 4.13 runs the COMMENTARY track on it.

**The CONTENT TYPE never decides the basket — what the page CITES does.** ShareHub holds short practical notes with no citation (`share-1…7`, `share-15`) beside literature reviews on real DOIs (`share-11` on **eleven**, `share-14` on **twelve**); those reviews are basket 2.

**The test is mechanical:** does the page carry a **retrievable identifier** — a DOI, a `doi.org` link, a PubMed id, or a «منابع» block listing them? Yes → basket 2, whatever the type. No, and the متن is the author's own reasoning → basket 1. Naming a study in prose without an identifier is **not** basket 2 and does not trigger basket 3: `metanotes/meta-14` quotes one figure from «مطالعه Morimoto» and argues from it under «تحلیل و تفکر خارج از چارچوب» — a write-up of the author's analysis, scored COMMENTARY. Basket 3 is only for a page that plainly IS a write-up of a study while naming no way to retrieve it.

**2. RESEARCH with a determinate source.** The publish writes up identifiable studies, each pinned down well enough to retrieve its abstract:
- a **paper file was attached** (step 4.10 resolves its DOI);
- the **متن or the page names the paper with its DOI** (the DentAI citation-card precedent, `dentai/dentai-21.html`);
- the page carries a **references list with DOIs** (`episodes/episode-161.html`'s «منابع» — three DOIs, three separately scored sources).

A reference with **no** DOI — a textbook, a glossary, a standard — is a source too (step 4.13 records it `NOT_APPRAISABLE`) and gets a FIDELITY call whenever its text is in hand (DES spec v3.1): score and fidelity are two questions, and the gate is the text, never the score.

Carry the DOI(s) to step 4.13 — **one DES record per cited source, never one blended score for the page.**

**Follow the chain one level when the cited source is a SECONDARY REPORT.** A consensus statement, clinical guideline or conference synthesis is not the study it reports: when it names its primary studies with retrievable identifiers, **score those instead of the wrapper**, one record each; the wrapper is the page's citation, not its evidence. Recognise it mechanically: labelled consensus/guideline/position paper/conference report **and** naming its studies by DOI/PubMed id. If it names none, score the wrapper with `text_basis: SECONDARY_REPORT` (spec v2.2), which rates its silences `NR`. Warning sign of a wrapper scored as a study: its score **drops as more of its text is read**.

**3. INDETERMINATE — research-shaped content with no identified paper. ASK.** The content plainly rests on the literature but no study is pinned down (an episode with only caption and audio and no «منابع», a NoteCast summarizing "the studies", a متن reporting findings with no DOI). **Never a guessed answer** (Hard Rule 13). Ask, as a two-option menu:

> این مطلب به مقالهٔ مشخصی وصل نیست. یکی از این دو رو انتخاب کن:
> ۱) DOI مقاله (یا مقاله‌ها) رو می‌دم تا امتیاز DES حساب بشه.
> ۲) این مطلب بدون DES منتشر بشه.

- **DOI(s) supplied** → basket 2.
- **«بدون DES»** → **no DES record at all**; step 4.13 is a documented skip ("4.13: skipped — کاربر انتخاب کرد بدون DES منتشر شود"), recorded as a page-bound entry in `.dentcast/des-exemptions.json` (`publish-checkpoints.md`; reason `unsourced_audio_caption` for a caption+audio-only episode, otherwise `founder_without_des`) — without it Phase F fails. It never falls back to COMMENTARY: scoring a research-derived piece as the author's opinion misstates the page.
- **There is no third option** — no "probably this paper", no caption scored as commentary.

### Question 4.9 — چالش؟

Ask «این پست آزمون است یا مطلب معمولی؟» only when the request does not make it obvious (a plain article is «مطلب معمولی»; a request that names a question/answer post is a چالش). A چالش is a **post whose body is a question**, published through this router into an existing folder with that folder's next number and ordinary brain shape (never a new `type` or folder — step 4.14 / RULE 15 of `.dentcast/challenge-handoff.md`).

For a چالش, collect from the founder the **question**, the **image** and the **answer**. The agent derives **3–5 نکات کلیدی** from the answer (the grading rubric a model compares a reader's answer against) under standing acceptance; the founder sees them in the admin paste box (module 09) and can edit them before pasting. Hard Rule 16 applies to every founder string. Question 3.5 runs on the question and the answer; the key points are not reader-facing prose and are exempt.

«مطلب معمولی» changes nothing about the rest of the publish.

### Question 5 — Pulse sentence

**No spoilers — the Pulse line names the piece, it never narrates it.** It announces that something was published; it never reveals the content's decision, mechanism, finding or conclusion. Reference the **title only** (verbatim or near-verbatim as the link text, optionally inside a short frame like «یک نکتهٔ کلینیکی با عنوانِ «…» منتشر شد») — never a clause describing what the piece is about («درباره‌ی تصمیمِ …», «راهکاری برای …»). The title alone as link text is preferred.

A Pulse sentence the founder wrote is copied (Hard Rule 16). Otherwise the agent drafts it in the type's established pattern — including which word is hyperlinked to the new page's URL — to the no-spoiler standard even where older lines do not follow it (Hard Rule 11), and records it (standing acceptance). Glossary terms are not announced in Pulse (a documented skip); LiteCast follows its own convention (module 03, 0.4). For any other category, check the precedent first: when no existing Pulse line announces that category, the line is a documented skip recorded in the agent's Push-2 report (conservative default, Hard Rule 14), not a question.
