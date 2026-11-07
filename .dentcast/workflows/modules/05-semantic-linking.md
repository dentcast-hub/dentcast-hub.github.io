<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages, the save point and the deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `C.4.7`, `C.4.7-b`, `C.4.8`, `C.4.9`. They run after C.4.13, on the final body the text lock froze (any Part 3b fix is already in it). All three are mandatory and template-independent (Hard Rule 11); every match is semantic and split strong/borderline by Hard Rule 14; every «کاوش بیشتر» edit obeys Hard Rule 9.

### 4.7. Semantic glossary back-linking (all content types)

Runs on every publish, whatever the category. It surfaces the new content from the glossary terms it genuinely relates to, by adding one back-link on each related term page's «کاوش بیشتر» section.

**Its scope is narrow on purpose.** Its candidates are `glossary/glossary.json` terms only and it writes only into a «کاوش بیشتر» section, never into prose. The direction *"an already-published article's BODY should link a term published later"* is covered neither here, nor by 4.8 (the page in flight, pointing out) nor by 4.9: its one owner is **`.dentcast/workflows/cross-link.md`**, run scoped to the new slug by **step 4.7-ب** on a glossary publish, or as an unscoped backlog sweep on its own trigger. The unscoped sweep never runs inside a publish — it opens every page in the corpus, which this publish's gate cannot verify.

#### Step 1 — Semantic review of glossary terms

Compare the new content's conceptual subject with each term's meaning and scope. Be **conservative**: link only where the relationship is real and would help a reader. Strong → Step 2; borderline → not linked, recorded.

#### Step 2 — Per-term back-link (independent, per page)

For each related term, independently: open its page, find its «کاوش بیشتر» section and apply Hard Rule 9 — at 5, skip that page; otherwise append a link to the new content at the **bottom** of the section's links, matching the siblings' form, classes and styling, with descriptive link text in the siblings' register (never a generic label).

#### Step 3 — Constraints

- **Add only** — never remove, reorder or restyle existing links.
- A term page with **no** «کاوش بیشتر» section is skipped; never invent one.
- `git diff` of each edited page shows exactly one appended link.

#### Verify after write

Report the full candidate list, which terms were linked (with the link text), which were skipped and why (cap / no section / unrelated / borderline).

### 4.7-ب. Cross-link the new TERM into existing bodies (glossary publishes only)

**Runs only when the locked category is `glossary`.** Every other type records the documented skip ("4.7-ب: skipped — not a glossary publish"): only a glossary publish publishes a *term*.

A new term starts with **zero** inbound in-body links and no other step gives it one. **Run `.dentcast/workflows/cross-link.md` scoped to the slug just published**, as Phase D hands the page to `en-version.md`:

```bash
python3 tools/cross_link_candidates.py --slug <the new slug> --json /tmp/cross-link.json > /tmp/cross-link.md
```

Then follow that workflow's Phases B → E unchanged (anchors only with the mechanical text gate, the ZWNJ word-boundary rule, the AUTO/ASK split, the density ceiling, `episodes/`+LiteCast+en out of scope). Inside a publish its ASK items follow standing acceptance: not applied, recorded and reported. It writes **no** brain entry, needs **no** builder and **no** version stamp; run it here so its edits travel with the publish. **Never run the unscoped sweep from inside a publish** — `--slug` keeps it bounded.

**Report:** the candidate count for the new slug, what was applied, every ASK with its recorded verdict — or the explicit "0 candidates: every tagged page already links it or does not say the term in its body", a real and common outcome.

### 4.8. Suggest in-article internal links (all content types)

**MANDATORY on every publish, core episodes included (Hard Rule 11).** The **inverse** of 4.7: the new article's **own body** gains inline links **out** to existing pages. For core episodes the body is the «درباره این اپیزود» (`ep-caption`) text.

#### Step 1 — Build the candidate target list

Every glossary term (from `glossary/glossary.json`) and **every brain entry with a page on disk** (the loaded brain, Hard Rule 1 — every type, core episodes and this series' own earlier parts included), each with its page URL. No type is out of scope: what separates 4.8 from 4.9 is **where** the link goes, never which pages may be linked.

A **sibling part of the same series** always belongs to **4.9** (ordered first there, Hard Rule 11). 4.8 links it in the body **as well**, and only where the body itself refers back to that part («همان دامنه‌ای که در قسمت ۹ ثبت کردید») — the one place no other step can put that link; a part the body never mentions gets no inline link.

#### Step 2 — Semantic analysis of the article body

For each candidate: does this exact place in the article refer to the concept the term or episode is about? A phrase qualifies **only** when, in its real context, it carries the target's meaning.

**Hard rules for matching:**
- **No junk/generic words** — no ordinary verbs, common adjectives or everyday nouns that merely coincide with a term.
- **Sense-disambiguation:** a word with an everyday and a technical meaning is linked only where it is clearly technical.
- **Conceptual relevance over lexical coincidence**, and the link must help the reader go deeper.
- **When in doubt, don't.** A short list of strong links is the goal.

#### Step 3 — First-occurrence only

One link per term, on its **first** qualifying occurrence in reading order.

#### Step 4 — Apply a strong match; a borderline one is skipped and recorded

Hard Rule 14: unmistakable matches (the word clearly used in its technical sense for exactly that concept) are inserted and recorded (phrase, target, reason); borderline matches (a looser connection, a word readable either way) are not inserted and are recorded.

#### Step 5 — Insert links

Insert each applied match on its first qualifying occurrence with **the anchor markup/classes the body already uses for inline links**.

#### Step 6 — Constraints

- No self-links (a glossary page never links its own term).
- Never a link inside an existing link or heading, or anywhere it breaks the HTML.
- `git diff` of the page shows only the inserted anchors.

### 4.9. Semantic "کاوش بیشتر" links on the new page (all content types)

**MANDATORY on every publish, core episodes included (Hard Rule 11).** Fills the **new page's own** «کاوش بیشتر» section (already holding step 2.5's capsules) with links **out** to semantically related brain entries. For an episode it fills the free slots of the «محتوای مرتبط» (`ep-related-link`) block, **the sibling parts of a multi-part series first**. Directions, to keep apart: 4.7 adds links **to** the new content **from** glossary pages; 4.8 adds inline links **from** its body; 4.9 adds links **into** its own section.

#### Step 1 — Semantic comparison against the whole brain

Compare the new content with **all** entries of the loaded brain (every type, core episodes included): would a reader want to go there next? Real conceptual relatedness only, ranked strongest first; never the new content itself.

#### Step 2 — Apply the global cap

Count the section's links (the capsules count) and fill only the remaining slots under Hard Rule 9, strongest first.

#### Step 3 — Markup for each added link

The **same** capsule markup and classes as the section's existing links; only `href` (the target's page URL) and the label differ. The label is a **short, specific Persian title** derived from the target — not its raw long title, never generic.

#### Step 4 — Apply a strong match; a borderline one is skipped and recorded

Hard Rule 14: strong relatedness is inserted strongest first and recorded (target, URL, label, reason); borderline candidates are not inserted and are recorded.

#### Step 5 — Constraints

**Only add** — never remove, reorder or restyle; `git diff` shows only the added capsules. Report the candidates considered, the free slots, what was added and what was skipped (the budget math), or the explicit "at cap" / "0 qualifying entries".
