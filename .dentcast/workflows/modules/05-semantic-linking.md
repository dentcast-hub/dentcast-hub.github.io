<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md`. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: C.4.7, C.4.7-b, C.4.8, C.4.9. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
<!-- /dentcast-checkpoint-protocol:v1 -->

### 4.7. Semantic glossary back-linking (all content types)

Runs whenever new content is published, regardless of category. The goal is to surface the new content from the glossary terms it genuinely relates to — by adding a single back-link on each truly-related term's page.

**This step is narrower than its name suggests, and the gap is a separate workflow, not something to widen it into.** Its candidate pool is `glossary/glossary.json` only — an insight, a chairside or an episode is never a candidate here — and it writes only into a «کاوش بیشتر» section, never into prose. So the direction *"an already-published article's BODY should link a term published later"* is **not** covered by this step, by 4.8 (which only ever runs on the page in flight, pointing outward), or by 4.9. That direction has one owner: **`.dentcast/workflows/cross-link.md`**, reached two ways — automatically and **scoped to the new slug** by **step 4.7-ب** on a glossary publish, and as an unscoped backlog sweep on its own trigger. The unscoped sweep is what must never run from inside a publish: it opens every page in the corpus, which this publish's gate cannot verify.

#### Step 1 — Semantic review of glossary terms

Read `glossary/glossary.json`. Perform a genuinely **semantic** review of its terms — **not** keyword/string matching. Compare the *conceptual subject* of the new content against each glossary term's meaning and scope, and identify the terms whose topic is genuinely conceptually related to the new content.

Be **conservative**: link only where the relationship is real and would genuinely help a reader, not tangential. Per **Hard Rule 14**: when a term's relatedness is genuinely unmistakable (the new content is clearly, substantively about that exact concept), proceed to Step 2 directly for that term — no need to ask. When you are uncertain whether a term is related enough (real but borderline/tangential relevance), **list that candidate and ask the user to confirm** (a simple link-it/skip-it choice) before editing — do not guess, and do not silently drop a genuine-but-uncertain candidate without asking.

#### Step 2 — Per-term back-link (independent, per page)

For each glossary term judged semantically related (auto-applied or user-confirmed), treat it **independently** — one related term may get the link (under the cap) while another is skipped (at the cap):

- Open that glossary term's page on disk.
- Find its **"کاوش بیشتر"** section.
- Apply the **global 5-link cap (Hard Rule 9)**: count every link already present in that section. If it is already at 5, skip that glossary page entirely — add nothing, remove/reorder nothing. If there is room, add a link to the **new** content at the **bottom** of that section's link list, matching the exact form, classes, and styling of the other links already there. Use link text that fits naturally and descriptively for the new content, written in the same style/register as the sibling links — meaningful and specific, never a generic label.

#### Step 3 — Constraints

- **Add only** — never remove, reorder, or restyle existing links in any glossary "کاوش بیشتر" section.
- The added link's markup must match the sibling links **exactly** (same classes, same structure); only the URL and the descriptive text differ.
- The link text must be meaningful and specific to the new content, in the same style/register as the existing links in that section — not generic.
- If a glossary page has **no** "کاوش بیشتر" section, skip it — do not invent one — unless this document's conventions elsewhere already define how that section is created, in which case follow that.
- **Hash each glossary page before and after editing.** The only allowed diff is the single appended link. Report before/after hashes for every edited page.

#### Verify after write

- Each edited page differs from its pre-edit state by exactly one appended link, nothing else (confirmed by the before/after hashes and a diff).
- No page that was at the 5-link cap was touched.
- Report the full candidate list, which terms were linked, which were skipped (and why: cap reached / no section / judged unrelated), and the link text used on each edited page.

### 4.7-ب. Cross-link the new TERM into existing bodies (glossary publishes only)

**Runs only when the locked category is `glossary`.** Every other type reports it
as a documented skip ("4.7-ب: skipped — not a glossary publish") and moves on:
this step is about a newly published *term*, and a NoteCast or an Insight
publishes no term.

A glossary term is born with **zero** inbound in-body links, and nothing in this
workflow would ever give it one: 4.7 links only *from glossary pages* and only
into a «کاوش بیشتر» section, and 4.8 runs on the page in flight pointing
outward. So a term's inbound link count is a function of how much content is
published *after* it — which for a term published today is nothing, forever.
This step closes that at the moment it opens.

**Run `.dentcast/workflows/cross-link.md` scoped to the slug just published**, the
same way Phase D hands the finished page to `en-version.md`:

```bash
python3 tools/cross_link_candidates.py --slug <the new slug> --json /tmp/cross-link.json > /tmp/cross-link.md
```

Then follow that workflow's Phases B → E. Everything it says applies unchanged —
anchors only with the mechanical text gate, the ZWNJ word-boundary rule, the
AUTO/ASK split, the density ceiling, `episodes/`+LiteCast+en out of scope. It
writes **no** brain entry, runs **no** builder, and needs **no** version bump, so
it does not disturb the ordering of steps 5–8; run it here, before the brain
write, so its page edits are in the same commit as the publish.

**Do not run the unscoped sweep from inside a publish.** `--slug` is what keeps
this bounded (today's `dental-implant` produced 32 candidates; the full sweep
opens 71 pages, which this publish's gate cannot verify).

**Report:** the candidate count for the new slug, what was applied, and every ASK
with its verdict — or the explicit "0 candidates: every tagged page already links
it or does not say the term in its body", which is a real and common outcome.

### 4.8. Suggest in-article internal links (all content types)

**MANDATORY on every publish, for every type (core episodes included) — see Hard Rule 11.** This is the **inverse** of step 4.7: where 4.7 links existing pages *to* the new content, this step enriches the new article's **own body** with internal links pointing **out** to existing glossary terms and episodes. It operates on the new content's page, so it belongs with the page-mutation steps.

**This step is NOT governed by the template/clone or by what the previous same-category page contained (Hard Rule 11).** You **must** run a fresh semantic analysis of *this* body regardless of whether the cloned page had inline links. Any link that merely came across in the clone does **not** count as executing this step. **For core episodes, the "body" is the «درباره این اپیزود» (`ep-caption`) text.** Skipping is allowed **only** when, after the analysis below, there are **zero genuinely-qualifying candidates** — and you must then report that explicit empty result (never silence, never "matched the previous page").

#### Step 1 — Build the candidate target list

Read **both** `glossary/glossary.json` **and** `dentcast-brain.json`. Build one candidate target list:
- Every glossary term, with its page URL.
- Every episode, with its page URL, from `dentcast-brain.json`.

#### Step 2 — Semantic analysis of the article body

Perform a genuinely **semantic** analysis of the new article's body — **not** surface keyword/string matching. For each candidate target the question is conceptual: does this exact place in the article actually refer to the concept that the glossary term or episode is about? A term qualifies **only** when the word/phrase, in its real context, carries the meaning of the target concept — not merely because the same letters appear.

**Hard rules for matching:**
- **No junk/generic words.** Do not propose links on common, generic, or filler words that merely coincide with a term string (ordinary verbs, common adjectives, everyday nouns not used as the technical concept). If a reader wouldn't gain anything from the link, it's junk — discard it.
- **Sense-disambiguation required.** If a word has both an everyday meaning and a technical/glossary meaning, link it **only** where it is clearly used in the technical sense. Skip everyday-sense occurrences entirely.
- **Conceptual relevance over lexical coincidence.** A match is valid only when the linked concept is genuinely the thing being discussed at that point, and the link would genuinely help the reader go deeper.
- **When in doubt, DON'T propose it.** Precision beats coverage. A short list of strong, meaningful links is the goal — never a flood of weak matches.

#### Step 3 — First-occurrence only

For each term that survives the semantic filter, the link targets **only the FIRST occurrence** of that word/phrase in the article body (the first place it appears in the qualifying technical sense). Do not link later occurrences of the same term. **One link per term, on its first qualifying appearance, in reading order.**

#### Step 4 — Auto-apply high-confidence matches; ask only for the rest

Per **Hard Rule 14**, split the surviving candidates by confidence:

- **Unmistakable matches** (the word is clearly being used in its technical sense to discuss exactly that concept, per Step 2's sense-disambiguation rule) → proceed straight to Step 5 for these; no confirmation round-trip needed. State them plainly in the running commentary (matched phrase, target, one-line reason) so the user can see and override afterward.
- **Borderline or judgment-call matches** (plausible but not unmistakable — a looser conceptual connection, a term that could be read either technically or generically here) → **do not** insert yet. Present these as a numbered review list — matched phrase with context, target type, target URL, one-line reason — and ask the user which (if any) to apply. The user may approve all, a subset, or reject.

#### Step 5 — Insert links

Insert the auto-applied matches and any user-approved matches, each on the **first qualifying occurrence** of its term in the body, using the **same anchor markup/classes the article body already uses for inline links** (match the existing in-body link style exactly — do not introduce a new link style).

#### Step 6 — Constraints

- **First occurrence only, one link per term** — never link the same term twice.
- **Semantic, not lexical** — never link a word purely because its characters match a term; the concept must actually be present at that spot.
- **No self-links** — if the new content IS the glossary page for "X", don't link "X" in its own body to itself.
- **Don't break structure** — never create a link inside an existing link, inside a heading, or anywhere it would break the HTML.
- **Hash the new page before and after this step.** The only allowed diffs are the approved anchor insertions. Report before/after hashes.

### 4.9. Semantic "کاوش بیشتر" links on the new page (all content types)

**MANDATORY on every publish, for every type (core episodes included) — see Hard Rule 11.** Enriches the **new content's own** "کاوش بیشتر" section with links pointing **out** to semantically related existing brain entries.

**Episode mapping (Hard Rule 11):** core episodes have **no** `dc-related-section` "کاوش بیشتر" — for an episode this step targets the **«محتوای مرتبط»** (`ep-related-link`) block instead, filling its free slots (under the Hard-Rule-9 cap) with related brain entries; **the sibling parts of a multi-part series are the highest-priority candidates** and must be proposed first. The «محتوای مرتبط» / «کاوش بیشتر» naming difference is **not** grounds to skip. As with 4.8, this step is **template-independent**: that the cloned/previous page held only the pillar capsule is **not** a reason to leave it at one link. Skipping a slot is allowed **only** when the section is at the 5-link cap or there are **zero qualifying candidates**, and that empty result must be **reported explicitly**.

Direction matters — don't confuse this with the neighbouring steps:
- Step 4.7 adds a link **to** the new content **from** related glossary pages' "کاوش بیشتر" sections.
- Step 4.8 adds inline in-body links **from** the new article's text to glossary terms / episodes.
- **This step (4.9)** adds links **into** the new content's **own** "کاوش بیشتر" section, pointing to semantically related entries from `dentcast-brain.json`.

It mutates the new page, so it sits with the page-mutation steps. It runs **after** step 2.5 has already injected the site-wide capsule block, so the "کاوش بیشتر" section already exists on the new page.

#### Step 1 — Semantic comparison against the whole brain

Read `dentcast-brain.json` end-to-end and perform a genuinely **semantic** comparison of the new content against **all** existing entries (every type, plus core episodes) — **not** keyword/string matching. For each entry the question is conceptual: is this entry's subject genuinely, substantively related to the new content, such that a reader would want to go there next?

**Hard rules for matching:**
- **Real conceptual relatedness only.** No tangential or coincidental matches — discard weak/adjacent ones.
- **Rank** candidates by strength of semantic relationship; strongest first.
- **When in doubt, DON'T propose it.** A few strong links beat a pile of weak ones.
- **Never link the new content to itself.**

#### Step 2 — Apply the global cap

Locate the new page's "کاوش بیشتر" section (injected in step 2.5) and apply the **global 5-link cap (Hard Rule 9)**: count the links already present (the site-wide capsules count). If already at 5, skip entirely. If fewer, you may add only up to the remaining slots, filling them with the **highest-ranked** semantic matches from Step 1, strongest first.

#### Step 3 — Markup for each added link

- Use the **same** button/capsule markup, classes, and styling as the links already in that section — only `href` and label differ.
- The label is a **short, semantically meaningful Persian title** derived from the target entry — a concise descriptive phrase, not the raw long title and not a generic word.
- The `href` is the target entry's page URL.

#### Step 4 — Auto-apply high-confidence matches; ask only for the rest

Per **Hard Rule 14**, split the ranked candidates within the available slots by confidence:

- **Strong, unmistakable relatedness** (a reader would obviously want to go there next) → insert directly, filling the available slots strongest-first; no confirmation round-trip needed. State the additions plainly (target, URL, label, one-line reason) so the user can see and override afterward.
- **Real but borderline relatedness** (worth surfacing, but not obviously a must-include) → present these as a numbered list — target, URL, proposed label, one-line reason — and ask which (if any) to add. The user may approve all, a subset, or none; respect the global cap on whatever subset they approve.

#### Step 5 — Constraints

- **Defer to the global 5-link cap (Hard Rule 9)** — never exceed it.
- **Only add** — never remove, reorder, or restyle existing links.
- Added links must match the existing capsule markup/classes **exactly** — only `href` and label differ.
- Labels must be **short, semantic, Persian, and specific** to the target — never generic.
- **Hash the new page before and after this step.** The only allowed diffs are the approved capsule additions. Report before/after hashes.
