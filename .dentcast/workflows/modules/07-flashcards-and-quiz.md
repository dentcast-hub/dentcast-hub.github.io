<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: C.4.11, C.4.12. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
<!-- /dentcast-checkpoint-protocol:v1 -->

### 4.11. Flashcards (Leitner) — semantic `DefinedTermSet` in the FAQ corpus

**Runs for EVERY type, on EVERY publish that produces a page — LiteCast and
DentCast+ (`dentcast_plus`) are the two exceptions.** LiteCast stays outside
the specialist ecosystem, same as the glossary/pillar linking it skips in
step 0. **DentCast+ is optional, not skipped:** a video's real content is
in the video itself, not in re-typable prose — the page's own text is often
just a one-line caption — so authoring a card/question requires the founder
to supply the actual clinical tips from the recording. When that text is
available, run this step normally (same standard as every other type). When
it is not, and the founder declines to supply it, no cards are written and
that is a **documented skip**, never a fabricated card standing in for real
content (Hard Rule 13; a thin or fabricated card is worse than no card —
see the "ask, don't guess" note below). Decided 2026-08-22 on
`dentcast-plus/video-10`; `tools/verify_publish.py`'s `FLASHCARD_OPTIONAL_TYPES`
enforces the same two-type exception so the gate reports a skip, not a FAIL.
A flashcard is **a concept, not a
question** — so it lives in schema.org's real vocabulary for exactly that:
`DefinedTermSet` → `hasDefinedTerm[]` of `DefinedTerm { name, description }`.
This block is written into **`plus/faq-corpus.json`, under the new page's
content id** — **never into the page's own JSON-LD**. FAQ/flashcards used to
live on the page itself; that shipped hidden markup with no visible rendering
at scale and was an SEO liability, so it was migrated into this corpus (see
`.dentcast/faq-schema-removal-handoff.md`). `verify_publish.py` fails any page
whose own HTML still carries a `#flashcards`-tagged `DefinedTermSet`.
`plus/flashcards-index.json` (the premium app's Leitner-seed catalog) is
**generated**, never edited directly: run
`node tools/build_flashcards_index.mjs` (added to step 8's rebuild list) to
read every content id's `DefinedTermSet` out of the corpus and regenerate it.
**This step never touches `dentcast-brain.json`** — Hard Rule 6 (brain schema
is sacred; never add a field absent from the previous same-category entry)
makes the brain the wrong home for a feature being rolled out prospectively
while older entries wait for a later, separate backfill pass.

**Card content must be semantic, never a mechanical FAQ dump.** Each
`DefinedTerm` tests recall of **one concept**: `name` is a tight recall
prompt, `description` is the complete, precise answer to that one concept —
never a verbatim copy of a FAQ question/answer pair.

**"Verbatim" includes the near-copy — this is the step's most common failure.**
Deleting the answer's opening verdict («بله؛ …» → «…») and shipping the rest
unchanged is **not** a rewrite; neither is reordering a clause or swapping one
word. The test is whether the text was **re-authored as a definition**: a FAQ
answer argues a case *about this article*, while a card states what a concept
*is*, standing alone, for a reader meeting it cold months later. If your
`description` would still read as an answer to the question it came from, it
has not been rewritten. Phase F fails the publish on a description that matches
a FAQ answer with or without its verdict prefix, so this is enforced, not
advisory.

**FAQ → flashcard compression, but judged, not mechanical.** Where this
content's corpus entry already carries a FAQPage node, walk its `mainEntity`
and classify each Q/A pair:
- **Genuinely "define/explain X" shaped** (the question names one concept,
  the answer explains it) → compress it into one `DefinedTerm`: rewrite the
  question into a `name` recall prompt, rewrite the answer into a complete
  `description` for that one concept. If the answer bundles more than one
  concept, split it into multiple atomic terms instead of one crowded one.
- **Comparison/decision/procedural shaped** (e.g. "ایمپلنت کوتاه یا سینوس
  لیفت؟", "کدوم بهتره؟") — these have no single concept to define. **Skip
  them** rather than forcing a card; note the skip in the report.
- **Ambiguous cases** — ask the user rather than guessing which bucket a Q/A
  pair falls into.

Where no FAQ exists yet, author `DefinedTerm`s directly from the published
body using the same atomicity rule.

**Ask, don't guess — same standard as step 4.10's paper branch.** Anywhere
you're not confident a candidate concept is genuinely atomic, clinically
accurate, or worth a card at all, stop and present it to the user rather than
forcing a term into existence. A thin or fabricated card is worse than no
card.

Written into `plus/faq-corpus.json`, under this content id's
`definedTermSets` array (the node's own shape — including the `@id`
convention below — is unchanged from the old on-page form; only its storage
location moved):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": "https://dentcast.org/insight/insight-12.html#flashcards",
  "hasDefinedTerm": [
    {
      "@type": "DefinedTerm",
      "@id": "https://dentcast.org/insight/insight-12.html#flashcards-c1",
      "name": "single-concept recall prompt",
      "description": "complete, precise answer to that one concept",
      "source": "faq",
      "sourceFaqIndex": 2
    }
  ]
}
</script>
```

- `@id` on each `DefinedTerm` ends in `#flashcards-c<n>`, 1-indexed per page,
  stable once published — a later wording fix must not renumber existing ids
  (the backend's `card_state` rows key off the fragment).
- `source` and `sourceFaqIndex` are non-standard but harmless extra
  properties (ignored by anything reading strict schema.org): `source` is
  `"faq"` or `"authored"`; `sourceFaqIndex` is present **only** when `source`
  is `"faq"`, pointing at the FAQPage `mainEntity` index the term was derived
  from, for traceability if that FAQ entry changes later.
- No other properties beyond real `DefinedTerm`/`DefinedTermSet` fields plus
  these two. Match this shape exactly on every future publish — this is now
  the schema template.

**Verify:** confirm the `DefinedTermSet` node is present in
`plus/faq-corpus.json` and is valid JSON; that every `DefinedTerm` has a
unique `@id`; that no `name`/`description` is a verbatim copy of a FAQ Q/A
pair; and report the count of terms written, how many came from `faq` vs
`authored`, and which FAQ entries (if any) were judged comparison/decision-
shaped and skipped.

### 4.12. Quiz-ready FAQ + scored binary bank

**Runs for EVERY type, on EVERY publish that produces a page — LiteCast is the
sole exception** (same scope as flashcards: LiteCast is patient-facing and
stays out of the specialist quiz/flashcard ecosystem). The FAQPage node
authored for this content — written into `plus/faq-corpus.json` under its
content id, **never into the page's own JSON-LD** (see step 4.11) — feeds
two premium surfaces: the Leitner flashcards (step 4.11) **and** a scored
yes/no quiz (`plus/quiz-index.json`, awarding premium XP). Both consume the
same corpus entry, so FAQ questions must be authored to a
**standalone-quiz standard**, not written as page-bound reading aids. Two
hard requirements on every FAQ Question:

**(a) Self-contained — no article deixis.** Each question must be
understandable and answerable by a dentist who read the article a month ago and
remembers only the concept, not which article it was. **Forbidden in a
question `name`:** «این کیس», «این بیمار», «این مطالعه», «این متن», «این
ویدیو», «این تکنیک/روش/وضعیت/تصمیم/خطا», or any other reference that only
resolves by seeing this specific page. Case-based content (chairside, insight
case-studies, dentcast-plus videos) must embed the case's key conditions **into
the question itself** — turn «چرا MTA برای این کیس انتخاب شد؟» into «در تحلیلِ
خارجیِ سرویکالِ (ECR) پیشرفته، چرا MTA ماده‌ی مناسبی برای ترمیم است؟». A
question that is pure narrative recall of one unnamed patient («تصمیمِ نهایی
برای این بیمار چه بود؟») with no concept to generalize does not belong in the
FAQ at all — don't author it. The answer stays 100% grounded in the body;
never add a clinical claim the article doesn't make.

**(b) Binary answers open with an explicit verdict.** `tools/build_quiz_index.mjs`
selects the yes/no subset mechanically: a question qualifies only when it is
phrased as a yes/no question (opens with «آیا»/«مگر», or ends «… درست است؟» /
«… امکان دارد؟» etc.) **and** its answer's **first clause** states «بله» or
«خیر»/«نه». So whenever a FAQ question is yes/no-shaped, **write the answer to
open with the verdict** — «خیر؛ …», «بله، …», or a short concession then the
verdict («برخلافِ باورِ قدیمی، خیر؛ …»). That one word becomes the graded
answer key. If the honest answer is genuinely "it depends" (no clean yes/no),
that's fine — write it hedged and it is correctly **excluded** from the scored
bank (it still serves as a flashcard / reference FAQ entry). Never contort a real "it
depends" into a false yes/no just to get it scored: accuracy over coverage,
the bank must never grade against a guessed key.

The builder is generated-only, run in step 8 (never hand-edit
`plus/quiz-index.json`); its `content_id` is the page path without `.html`, and
each question keeps its `source_faq_index` so a later FAQ edit is traceable to
its quiz entry — the same identifier convention as flashcards, so the premium
app maps "reader finished article X" → X's quiz questions and flashcards alike.

**When to run — and fix, not just flag.** This is an authoring gate, not a
report-only check: it runs on the FAQ **before** the corpus entry is
finalized (right after the step-2 clone establishes the new page, alongside
the step-4.11 flashcard pass which reads the same FAQ). Walk every
`mainEntity` question and **bring it into compliance in place** — a
cloned/adapted question that still carries deixis (per (a)) gets
**rewritten standalone or removed here**, and a yes/no-shaped question whose
answer buries or omits the verdict gets its answer **reopened with
«بله»/«خیر» (per (b))** — so the corpus entry is already correct and never
needs a later correction pass. Editing is confined to the corpus entry's
FAQPage node; the answer stays grounded in the body.

**Ask, don't guess — same standard as steps 4.10/4.11.** Where a call is
genuinely borderline, stop and ask the user rather than deciding silently:
whether a case-bound question can be rewritten into a self-contained vignette
**or** should be dropped entirely; whether an answer is truly a clean yes/no
**or** an honest "it depends" (so it should stay hedged and fall out of the
scored bank); or whether embedding the case conditions would smuggle in a claim
the body doesn't actually make. A wrong auto-decision here ships a
misleading quiz key or an unanswerable question — exactly the outcomes worth a
one-line question to prevent. Phrase it as a concrete rewrite-vs-drop choice,
not an open question.

**Verify:** after step 8's quiz build, report how many binary questions this
page contributed (and, if zero, confirm its FAQ is intentionally all
open/comparison-shaped); confirm no question `name` on the page contains a
deictic reference per (a); and list any question you rewrote/dropped for
compliance and anything you asked the user about.
