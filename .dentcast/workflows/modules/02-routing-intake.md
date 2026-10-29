<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: 0, A, B.1, B.2, B.3, B.3.5, B.4, B.4.7, B.4.8, B.4.9, B.5. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
> **Fixed page deliveries:** after `C.4.9`, then after `C.6` for new v2 editorial-locked publications (legacy v1-only publications keep `C.4.13`), then after actual Phase F + report G. Cuts 1/2 deliver work plus handoff; cut 3 delivers final work, completion receipt and handoff deletion together. All intermediate checkpoints stay local; no extra turn-end or cleanup push.

<!-- /dentcast-checkpoint-protocol:v1 -->

## Phase 0 — Routing: is there an attached paper file? is there text to publish?

Before anything else, classify what the user handed you along two independent axes:

- **Is there text/content to publish?** (a متن for a page)
- **Is there an attached research paper/article file?** (a PDF or similar)

The **attached-paper actions are triggered by the paper file itself — independent
of content type.** They are **not** tied to DentAI; whenever a paper file is
present, the paper branch (**Phase C step 4.10**) fires, whatever the locked
category is (or even when there is no category at all). Route as follows:

| Text to publish? | Paper file attached? | What runs |
|---|---|---|
| **Yes** | **No** | Normal publish only (Phases A–D). No paper branch. |
| **Yes** | **Yes** | Normal publish for that type (any type — **not just DentAI**) **plus** step 4.10's **all three parts** (Drive filing + catalog enrichment + first-author→DOI credit on the published page). |
| **No** | **Yes** | **Paper-only fast path** — do **NOT** run the publishing phases (no page clone, no brain entry, no pillar, no Pulse, no en mirror, no rebuild). Run **only step 4.10 Part 1 (Drive) and Part 2 (catalog)**. **Skip Part 3** — there is no published page to put a credit under. Then commit. |
| **No** | **No** | Nothing to do — ask the user what they want. |

**Paper file without text, but a page is asked for → ASK.** If the paper
arrives with no متن but the request only makes sense on a page — DES/Fidelity,
the first-author→DOI credit, a post/page itself — or the user says the text lives
elsewhere (a document, an artifact, an earlier message), do **not** silently take
the paper-only path. Ask, with the two named options: «متن صفحه کجاست؟ (لینک یا
فایلش را بده)» / «فقط paper-only بماند (Drive + کاتالوگ، بدون صفحه)». Route only
after the answer.

**Paper-only fast path (text-less) detail.** When the user gives you just a paper
file with no متن: jump straight to **step 4.10**, run **Parts 1 & 2 only**, and
stop. The cabinet catalog (`dentcast_cabinet_full_catalog.json`) is read
client-side by `dentcast_cabinet_search.html` via `fetch`, and it is **not** part
of the site version hash (step 7), so a paper-only addition needs **no** builder
run and **no** version bump — Drive upload + catalog edit + commit is the whole job.
The one exception is step 4.10 Part 2 item 7: when the paper count crosses a round
hundred, the advertised figure changes and `python3 tools/asset_version.py --bump`
runs with it — a cache-buster for the shared gate module, not the site version stamp.

The catalog is also deliberately **kept out of search**: `robots.txt` disallows
both `dentcast_cabinet_full_catalog.json` and its `.enriched.json` sibling,
`_headers` carries `X-Robots-Tag: noindex` for the catalog, and
`dentcast_cabinet_search.html` carries its own `<meta robots noindex>`. Adding a
paper therefore **never** touches `robots.txt` and **never** puts anything in a
sitemap — leave both alone, and never "fix" the disallow.

When there **is** text, proceed through Phases A–D as usual; the paper branch (if a
file is attached) runs as step 4.10 inside Phase C.

## Phase A — Discover

Before asking the user anything other than "what type is this":

1. Read `dentcast-brain.json` end-to-end.
2. Identify every distinct content category present (top-level arrays/sections, or a `type`/`category` field on entries — whatever the actual schema is). Build a list of categories.
3. For each category, find the most recent entry. That entry defines:
   - The directory + URL pattern for that type.
   - The schema shape (which fields exist, what they mean).
   - Which media fields the type uses: text body, image, audio, video link, external link, transcript, etc.
   - Whether previous entries link to a page file on disk (e.g., `/notecast/episode-33.html`) — if yes, that page is the structural HTML template.
4. For NoteCast type specifically, the workflow must also touch the matching parent episode page in `/episodes/` to add a related-content link back to the new NoteCast.
5. Read the **live structured-pillar set** at runtime — never from memory and never from a list written into this workflow. Authoritative source: the `PILLARS` dict in `tools/build_pillar.py`. Its keys are the slugs of the pillars that get a built topical-index page, and `PILLARS[slug]['subtopics']` is the live subtopic list for each. Re-derive on every run so newly structured pillars are picked up automatically. A practical one-liner: `python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"`. The entry's pillar (`pillar.primary`) and — when that pillar is structured — its `subtopic` are decided up front in the semantic determination step (**step 2.4**), *before* the page capsules (step 2.5) and the brain write (step 5) consume them.

## Phase B — Intake

### Question 1 — Type

Ask:

> این مطلب کدوم نوعه؟ (لیست نوع‌هایی که از brain پیدا کردی رو نشون بده)

**Two types the brain still carries are CLOSED and are never offered (founder,
1405/07/15): `dentai` and `photocast`.** Their 35 + 3 pages stay exactly where
they are, but no new entry is ever appended to either. A single- or multi-paper
reading is **`sharehub`**. If the user names one of the closed types, say so and
ask which living section it goes to (`sharehub` for a reading) — never create
`dentai-36` or `photocast/episode-4` (.dentcast/workflows/global/repo-conventions.md).

Wait. Lock the chosen category for the rest of the run.

### Question 2 — Number / identifier

Try to determine the next number automatically (max existing number in this category + 1). Per **Hard Rule 14**: if the series has no gaps and the next number is unambiguous, state it directly (e.g. «شماره‌اش meta-16 است») and move on — no need to wait for a yes. Only ask when the numbering is irregular or ambiguous (a gap in the sequence, a sub-numbered entry, two plausible next values), and phrase it as the specific candidates to pick from:

> شماره‌اش [N] درسته یا [alternative]؟

If user disagrees, accept their number.

### Question 3 — Text

Ask:

> متن کامل رو بفرست.

Wait for it.

### Question 3.5 — Writing-style check (de-AI pass)

**Runs for EVERY type, on EVERY publish, on whatever متن was just received in Question 3 — before any other step.** This gate happens before Phase C (and before Question 4 onward) consumes the text, because if changes are approved, the **edited** text — not the raw submission — is what every downstream step (page build, glossary linking, Pulse, etc.) works from.

**Goal:** read the submitted متن the way an editor would, and flag the spots that read as AI-generated rather than human-written — phrasing/rhythm/word-choice only, **never** facts, claims, numbers, or meaning.

#### Step 1 — Scan for AI tells

Look for patterns like (non-exhaustive — judge by ear, not by a checklist):
- **Formulaic throat-clearing openers/closers** — generic preambles or wrap-up sentences that restate what was just said («در نتیجه می‌توان گفت که...», «به طور کلی...»).
- **Overused AI clichés** — stock phrases such as «بدون شک», «نکته قابل توجه این است که», «در دنیای امروز», «نقش بسزایی دارد», «از اهمیت ویژه‌ای برخوردار است».
- **False-balance hedge stacking** — reflexive «نه‌تنها... بلکه...», «از یک سو... از سوی دیگر...» used as filler rather than because a real contrast exists.
- **Mechanical parallelism / listy prose** — three-item lists or rule-of-three constructions inserted by reflex, or prose chopped into bullet-like sentence fragments where a human would just write a sentence.
- **Uniform sentence rhythm** — every sentence near-identical in length/structure, lacking the natural variation a human writer has.
- **Generic filler with no concrete content** — sentences that sound authoritative but say nothing specific to this topic.
- **Over-punctuated emphasis** — excessive em-dashes, bolding, or exclamation used as a substitute for a real point.

#### Step 2 — Identify and announce, don't edit yet

For each genuine instance found, prepare: the exact original phrase/sentence, a proposed rewrite that keeps the **same meaning, facts, and register** but reads naturally, and a one-line reason it tripped the check. Present the full list to the user as a numbered review **before touching the text** — this is a proposal, not an edit.

If the متن has **no** genuine AI tells, say so explicitly («متن طبیعی به نظر می‌رسه، تغییری لازم نیست») and proceed straight to Question 4 with the text unchanged.

#### Step 3 — Confirm, then branch

Ask the user to confirm. The user may approve all, a subset, or none.

- **Approved (all or a subset):** apply only the approved rewrites to the متن. The resulting edited text becomes the text of record for the rest of this publish (Phase C step 2 and everything downstream uses it).
- **Not approved / rejected:** make no changes — continue with the original متن exactly as submitted. Proceed to Question 4.

#### Constraints

- **Style and phrasing only.** Never alter clinical claims, data, numbers, names, citations, or meaning. If a flagged sentence can't be rewritten without touching its substance, drop it from the list rather than risk changing meaning.
- **No new content.** Rewrites tighten or naturalize existing sentences — they don't add claims, examples, or sections that weren't in the original.
- **One pass.** This runs once, here, on the as-submitted متن — it is not repeated later in the same publish.

### Question 4 — Required media (dynamic, based on category)

Look at the latest entry in the locked category and identify which media fields are populated. For each one, ask the user — but phrase the question based on what's actually needed:

- If previous entries have an **image field** populated → ask: «عکس داره؟ اگه آره فایل یا اسمش رو بده.»
- If previous entries have an **audio field** populated:
  - For types where audio lives in a sibling directory (e.g., NoteCast pulls audio from `/episodes/episode-XX`): **don't ask**. Try to fetch automatically from the matching sibling path. If sibling path can't be resolved or has no audio, then ask the user.
  - Otherwise ask the user directly.
  - Audio files never enter the repo: they are uploaded to ArvanCloud object
    storage and only the URL is written (e.g.
    `https://episodes.s3.ir-thr-at1.arvanstorage.ir/dentcast162%20.mp3?versionId=`
    in `dentcast.json`). Ask for the uploaded URL; never commit the file.
- If previous entries have a **video / external link field** populated → ask: «لینک ویدیو/منبع چیه؟»
- If previous entries have a **transcript or attachment field** populated → ask for it.
- For any other populated field that the user clearly needs to supply (not derivable from text), ask.
- For fields that are derivable (slug, date, schema URL, etc.) — don't ask, generate them.

If a field exists in previous entries but you genuinely don't know whether the user wants it this time, ask: «این بار [field] داری یا نه؟»

<!-- insight-conventions:v1 -->
**Insight images and caption (founder, 1405/08/07).** For `insight/` pages:

- **Image file name:** `insight<N>-<k>.webp`, `<k>` from 1 in the order the images
  appear, even when there is only one (`insight100-1.webp`); no slug, no other
  pattern. The page references it by absolute path (`/insight/insight100-1.webp`).
- **Image size:** WebP, long edge at most 1600 px, file at most 300 KB. Shrink a
  larger image; never enlarge a smaller one.
- **Caption you propose** (Hard Rule 1 — a proposal until confirmed): one or two
  sentences, at most 200 characters. A caption the founder wrote is copied as is
  (Hard Rule 16), whatever its length.

Older insight pages keep their file names; this applies to new ones, a چالش
image in `insight/` included (module 09's `insight68.webp` is an older example).
<!-- /insight-conventions:v1 -->

### Question 4.7 — Any type: is there an accompanying article (paper) file?

**Runs for EVERY type, not just DentAI** (Phase 0 routing). The attached-paper
actions key off the **paper file**, not the content category — so check this on
every publish regardless of the locked category.

When the user supplies the content **together with a research paper/article file**
(a PDF or similar attachment), the publish gains **three extra, additive actions**
beyond the normal flow — Drive filing, cabinet-catalog enrichment, and a
first-author→DOI credit on the published page. These are specified in **Phase C
step 4.10**.

- If the user attached a paper file → set the **attached-paper branch (step 4.10)
  ACTIVE** and keep the file (and its real filename) for that step.
- If no paper file accompanies this publish → the branch is a documented **skip**;
  the page publishes normally with no Drive/catalog/DOI actions.
- If you're unsure whether a file was provided, **ask** — don't assume either way.

This branch is **additive**: it never replaces or overrides any general step. The
normal publish for the locked type (clone, pillar, brain entry, enrichment, Pulse,
en mirror) runs in full; step 4.10 only adds the three paper-specific actions.
(For a paper file with **no** متن at all, see the **paper-only fast path** in
Phase 0 — Parts 1 & 2 only, no publish.)

### Question 4.8 — DES evidence basis (what text will the score be computed from?)

**Runs for EVERY type, on EVERY publish that produces a page** — except LiteCast and
a چالش (Question 4.9), the canonical skips of `modules/08-des-fidelity.md`. This arms the **DES
scoring step (Phase C step 4.13)**. The question is *not* "how good is this
content" — it is the purely factual one of **what text the scoring model will be
given**, because that model never fetches anything (DES spec Core Rule 4: "You score
ONLY what is inside `source_text` … A DOI is an identifier, never a source of
content").

Classify the publish into exactly one of three baskets. Per **Hard Rule 14**,
baskets 1 and 2 are normally unambiguous — state the classification plainly and move
on. Basket 3 always stops and asks.

**1. COMMENTARY — DentCast's own authored piece.** The متن is the founder's (or a
guest specialist's) own clinical reasoning, case narration, or reflection, and the
page names **no retrievable paper**. No DOI is needed and none is asked for: the
**content's own text is the `source_text`**, and step 4.13 runs the COMMENTARY
track on it.

**The CONTENT TYPE never decides the basket — what the page CITES does.** Until
2026-08-15 this step said Chairside, MetaNote and ShareHub were COMMENTARY *by
definition*, and ShareHub is the section that proves that wrong. Its fifteen pages
are three different things: eight short practical notes with no citation at all
(`share-1…7`, `share-15`, 1.2–3.2k chars), two carrying audio, and five that are
literature reviews standing on real DOIs — `share-11` on **eleven**, `share-14` on
**twelve**. Calling those five COMMENTARY scores the founder's transparency on a
page whose actual basis is a dozen published studies, and hides all twelve from
the reader. The same trap is waiting in every other section, which is why the rule
is now about the page rather than the folder.

**The test is mechanical, and it is the one `episodes/episode-161` already
passed:** does the page carry a **retrievable identifier** — a DOI, a `doi.org`
link, a PubMed id, or a «منابع» block listing them? If yes it is basket 2, whatever
type the page is. If no, and the متن is the author's own reasoning, it is basket 1.
Naming a study in prose without an identifier is **not** basket 2 and does not
trigger basket 3 either: `metanotes/meta-14` quotes one figure from «مطالعه
Morimoto» and then argues from it under its own heading «تحلیل و تفکر خارج از
چارچوب» — the page is a write-up of the author's analysis, not of the review, and
it scores COMMENTARY. Basket 3 is only for a page that plainly IS a write-up of a
study while naming no way to retrieve it.

**2. RESEARCH with a determinate source.** The publish writes up one or more
identifiable studies, **and** each is pinned down well enough to retrieve its
abstract. It qualifies when any of these holds:
- a **paper file was attached** (Question 4.7 → step 4.10 already resolves its DOI);
- the **متن or the page names the paper and carries its DOI** (the DentAI
  citation-card precedent, e.g. `dentai/dentai-21.html`);
- the page carries a **references list with DOIs** (the episode precedent, e.g.
  `episodes/episode-161.html`'s «منابع» — three DOIs, therefore three separately
  scored sources).

A reference in that block with **no** DOI — a textbook, a glossary, a standard — is a
source too (step 4.13 records it `NOT_APPRAISABLE`), and from spec v3.1 it gets a
FIDELITY call whenever its text is in hand: the score and the fidelity are two
questions, and the gate is the text, never the score.

Record the DOI(s) and carry them to step 4.13, which resolves each into its own
`source_text` and scores each one separately — **one DES record per cited source,
never one blended score for the page.**

**Follow the chain one level when the cited source is a SECONDARY REPORT.** A
consensus statement, a clinical guideline or a conference synthesis is not the
study it reports: its methods live in the papers it summarises, which it cites by
DOI in its own reference list. Scoring the wrapper asks AMSTAR-2 whether *it*
searched databases and appraised studies, when the answer is five pages away in a
different document — so when a cited source names its primary studies with
retrievable identifiers, **score those instead of the wrapper**, one record each.
The wrapper then gets no record of its own; it is the page's citation, not the
page's evidence.

Recognise the case mechanically: the source is labelled a consensus statement,
guideline, position paper or conference report, **and** its own text names the
studies behind it with a DOI/PubMed id. If it names them, follow. If it does not
— an expert-panel consensus that rests on nothing retrievable — score the wrapper
itself with `text_basis: SECONDARY_REPORT` (spec v2.2), which rates its silences
as `NR` rather than as absent safeguards.

This was found on `dentai/dentai-29` (2026-08-16). The SSRD/SEPES/PROSEC
consensus statement was scored as though it were the review, earning `high` on
search strategy, risk-of-bias appraisal and excluded studies — three claims that
are false: the two systematic reviews it summarises searched three and five
databases and both appraised their studies independently. The tell was that the
same class of document scored 55/C from its abstract alone and 30/D once the full
text was read, i.e. **reading more of it made it worse**, which never happens when
the tool fits the document.

**3. INDETERMINATE — research-shaped content with no identified paper. ASK.**
The content plainly rests on the literature but no specific study is pinned down:
an episode with only a caption and audio and no «منابع» block, a NoteCast
summarizing "the studies" without naming one, a متن that reports findings with no
DOI anywhere. **This case never resolves itself and never gets a guessed answer**
(Hard Rule 13 — a DOI you did not receive or verify is not a fact you have). Stop
and ask, as a two-option menu:

> این مطلب به مقالهٔ مشخصی وصل نیست. یکی از این دو رو انتخاب کن:
> ۱) DOI مقاله (یا مقاله‌ها) رو می‌دم تا امتیاز DES حساب بشه.
> ۲) این مطلب بدون DES منتشر بشه.

- **User supplies DOI(s)** → the publish becomes basket 2; carry them to step 4.13.
- **User picks «بدون DES»** → the publish carries **no DES record at all**, and step
  4.13 is a documented skip ("4.13: skipped — کاربر انتخاب کرد بدون DES منتشر شود").
  Record that decision as a page-bound entry in `.dentcast/des-exemptions.json`
  (`publish-checkpoints.md`; reason `unsourced_audio_caption` for a caption+audio-only
  episode, otherwise `founder_without_des`) — without it Phase F fails. It does **not** quietly fall back to the COMMENTARY track: scoring a
  research-derived piece as though it were the author's own opinion is a false
  statement about what the page is, and a band E on a paper summary is worse than no
  band at all.
- **There is no third option.** Do not go hunting for "probably this paper", do not
  score the caption as commentary just to have *something*, and do not defer the
  question to the final report.

### Question 4.9 — چالش؟

**Skip when the user already said so at Question 1.** Otherwise, on every publish,
ask: «این پست آزمون است یا مطلب معمولی؟» A چالش is a **post whose body is a
question** — published through this same router, into an existing folder, taking
that folder's next number and its ordinary brain shape (never a new `type`, never a
new folder — see step 4.14/RULE 15 in `.dentcast/challenge-handoff.md`).

When it **is** a چالش, collect four things from the founder: the **question**, the
**image**, the **answer**, and **3–5 نکات کلیدی**. Propose the key points yourself
from the answer and have the user confirm or rewrite them — they are the grading
rubric a model will compare a reader's answer against, so getting them right here is
what makes the whole feature work. Hard Rule 16 applies to every string the user
supplies: copied, never re-typed.

**Question 3.5's de-AI pass runs on the question and the answer as usual.** The key
points are not prose a reader ever sees and are exempt.

When the answer is «مطلب معمولی» (the ordinary case), proceed exactly as before —
this question changes nothing about the rest of the publish.

### Question 5 — Pulse sentence

**No spoilers — the Pulse line names the piece, it never narrates it.** A Pulse line announces that something new was published; it is not a summary and must never reveal the content's decision, mechanism, finding, or conclusion. Reference the **title only** (verbatim or near-verbatim as the link text, optionally inside a short announcement frame like «یک اینسایت بالینی با عنوانِ «…» منتشر شد») — never a clause describing *what the piece is about* beyond its own title («درباره‌ی تصمیمِ …», «راهکاری برای …» that paraphrases the finding, etc.). If the title itself is the natural link text, that is sufficient and preferred. This applies to every category and every future publish — it is not a one-off preference.

Per **Hard Rule 14**: if this category has an established Pulse phrasing convention (previous entries of this type follow a consistent pattern), draft the sentence yourself in that pattern — including which word gets hyperlinked — and state it directly rather than asking an open question; the hyperlink target is the new content's page URL in its own category's directory. Report the drafted line plainly so the user can correct it if they want something different. **Older Pulse lines that describe content beyond the title are a backlog, not a pattern to copy forward (Hard Rule 11's spirit)** — always draft the new line to the no-spoiler standard above, even where precedent doesn't.

Only ask when there is genuine ambiguity — no established convention to follow, or the category's Pulse phrasing varies enough that a pick isn't obvious:

> جمله‌ی پالس چی باشه و کدوم کلمه‌ش لینک بشه؟

If for some category Pulse announcements aren't customary (you can tell by checking if previous Pulse entries reference that category), draft a line anyway but flag it: «این نوع معمولاً تو پالس اعلان نمی‌شه — همین‌طوری درج کنم یا رد شم؟» (a yes/no option, not an open question).
