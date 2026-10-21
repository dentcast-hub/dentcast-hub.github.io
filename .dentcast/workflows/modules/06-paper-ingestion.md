<!-- dentcast-checkpoint-protocol:v1 -->
> **Live publication checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision; this repeated reference never requires a reread. Read the fixed handoff exactly once only when the user explicitly says this publication is incomplete/interrupted; a request to resume counts only if it identifies the publication as incomplete/interrupted. During an active run, keep its state in the current session; do not read or inspect the handoff before each step. Use the latest digest returned by the helper, then mark each step `started` with `tools/dentcast_publish_handoff.py step`. After EACH completed/skipped/blocked/failed step, write its real evidence/reason with the same tool before continuing or handing off. Never auto-mark semantic or scientific work complete.
> Checkpoint IDs for this module: C.4.10.1, C.4.10.2, C.4.10.3. Category exceptions require explicit skip reasons. The protocol defines dependency ordering (builders before final stamping; LiteCast links after page construction). Phase F completion uses the real `verify` command.
> **Fixed page deliveries:** after `C.4.9`, after `C.4.13` including lawful skips, and after all final work, Phase F and report G. Cuts 1/2 deliver work plus handoff; cut 3 delivers final work, completion receipt and handoff deletion together. All intermediate checkpoints stay local; no extra turn-end or cleanup push.

<!-- /dentcast-checkpoint-protocol:v1 -->

### 4.10. Attached-paper branch (ANY type — triggered by the paper file, not the category)

**Runs whenever the user supplied an accompanying research paper/article file —
for EVERY type, not just DentAI** (the branch armed in Phase B Question 4.7; the
trigger keys off the **file**, not the locked category). For publishes with **no**
paper file, skip this entire section and **say so in the report** ("4.10: skipped
— no attached paper"). This branch is **additive** — it adds the paper actions on
top of whatever normal publish is running and overrides nothing.

**Which parts run depends on whether a page is being published (Phase 0 routing):**
- **Paper file + text/content (any type):** run **all three parts** — Parts 1 & 2
  (Drive + catalog) and Part 3 (first-author→DOI credit on the published page).
- **Paper file only, no text (paper-only fast path):** run **Parts 1 & 2 only**.
  **Skip Part 3** — there is no published page to put a credit under — and skip the
  rest of the normal publish flow entirely (see Phase 0). Report "Part 3: skipped —
  no published page (paper-only)".

**Overarching rule for this whole branch — ASK, don't guess (the user's
explicit instruction «اگر جایی شک داشتی سوال کن عمل نکن»).** Anywhere in the
parts below where you are not confident — the right Drive subfolder, the correct
topic/tags, the paper's real title, its DOI, or its first author — **stop and ask
the user before acting.** Never invent a subfolder, a DOI, an author, or a tag. A
wrong guess here mis-files a paper and publishes a false citation; a question
costs nothing.

Parts 1 and 2 are data operations (Drive + catalog) and **always** run when a
paper file is present. Part 3 mutates the published page and runs **only when
there is a page** (text-bearing publish). Run them in order; when a page exists,
all three run before the rebuild (step 8).

#### Part 1 — File the paper into Google Drive (correct topical subfolder)

The DentCast paper cabinet lives in this Drive folder:
`https://drive.google.com/drive/folders/1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f`
(folder id `1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f`). It is organised into **topical
subfolders** whose names mirror the `topic_path` values already in
`dentcast_cabinet_full_catalog.json` (e.g. `abutment`, `zirconia`, `fresh
socket`, `GBR`, `periimplantitis`, `biomimetic`, with nested paths like
`biomimetic/Bonding`, `zirconia/flexural strength`, …).

1. **Read the live subfolder set.** Use the Google Drive MCP tools to list the
   subfolders actually present under the parent folder (don't trust this list —
   it's illustrative). Cross-reference with the distinct `topic_path` values in
   the catalog so you know the canonical filing taxonomy.
2. **Determine the paper's subject semantically** — conceptual relevance of the
   paper's actual topic, **never** keyword/string matching on the filename — and
   choose the single best-matching existing subfolder.
3. **Upload the file into that subfolder.** Keep the paper's real filename.
   Capture the resulting Drive identifiers for Part 2:
   - `drive_id` = the uploaded file's id
   - `drive_view` = `https://drive.google.com/file/d/<drive_id>/view`
   - `drive_download` = `https://drive.google.com/uc?export=download&id=<drive_id>`
4. **Ambiguity → ASK.** If no existing subfolder clearly fits, or two fit
   equally, **ask the user** which subfolder to use (or whether to create a new
   one). **Never create a new subfolder without explicit confirmation.**

#### Part 2 — Enrich `dentcast_cabinet_full_catalog.json` (root)

`dentcast_cabinet_full_catalog.json` at the repo root is a JSON **object** whose
`papers` key holds a flat array of paper entries. Add the new paper here.

1. **Next id.** `P` + the zero-padded successor of the current max `P####`
   (e.g. after `P2876` → `P2877`). Confirm the max by scanning `papers`.
2. **Match the ENRICHED entry shape exactly.** Use a recent
   `semantic_tagged: true` entry as the schema template — same keys, nesting,
   and order, no extras, no omissions. Its key set is: `id`, `title`,
   `file_name`, `topic`, `topic_path`, `type`, `local_path`, `file_size`,
   `key_finding`, `clinical_bottom_line`, `linked_episodes`, `drive_link`,
   `status`, `drive_download`, `drive_view`, `drive_id`, `tags`, `name_bucket`,
   `semantic_tagged`, `real_title`, `doi`, `journal`, `crossref_year`,
   `subjects`, `abstract`, `display_title`. **Confirm the live shape from the
   file rather than trusting this list**, and never add a field that isn't on
   the template entry.
3. **Fill from the paper + the DOI lookup (Part 3 finds the DOI/metadata):**
   - `real_title` / `title` / `display_title` → the paper's real title (the
     search page `dentcast_cabinet_search.html` shows
     `display_title || real_title || title`).
   - `topic` and `topic_path` → the subfolder chosen in Part 1 (the search
     page's topic filter reads `topic`).
   - `doi`, `journal`, `crossref_year`, `abstract` → from the metadata lookup.
   - `file_name` → the real filename; `file_size` → the file's byte size.
   - **`drive_link` / `drive_view` / `drive_download` / `drive_id` → the Drive
     URLs/id captured in Part 1.** (Putting the paper's Drive link into the JSON
     is the whole point of this part.)
   - `status` → match the template (e.g. `"linked"`); `semantic_tagged` → `true`.
   - `linked_episodes` → the page being published, if any (follow the template's
     value shape); on the **paper-only fast path** there is no page, so leave it
     as the template's empty shape (e.g. `[]`). `key_finding` /
     `clinical_bottom_line` may stay `""` as on most entries unless the content
     gives them clearly.
4. **Hashtags (`tags`) — the user's rule: semantic + the article's own name.**
   Generate genuinely **semantic** tags describing the paper's concepts, in the
   **same lowercase-kebab style as existing `tags`** (e.g. `marginal-bone-loss`,
   `rct`, `clinical-trial`), **include the `topic:<subfolder>` tag** that the
   catalog convention uses, **and include a tag derived from the article's own
   title/name.** No junk/generic tags. If the right topic or any tag is unclear
   → **ask, don't guess.**
5. **Top-level counters.** If the catalog's roll-up integers are meant to track
   the array (`unique_papers`, `total_files_scanned`, the relevant drive-match
   count), keep them consistent with the added entry. Do **not** rewrite the
   derived analytics blocks (`tag_index`, `semantic_pass`, `enrichment`,
   `drive_match_breakdown`) by hand — if you're unsure whether a counter should
   move, **ask** rather than guess.
6. **Verify:** the new entry is appended to `papers`, the JSON is well-formed,
   its key set matches the template enriched entry exactly, the Drive link is
   present, and the paper now appears/filters correctly in
   `dentcast_cabinet_search.html` (title, topic, tags, View/Download links).
   **Open that page directly** — from the site the library is premium-gated
   (`plus/js/library-gate.js`, installed from `plus/js/header.js` on every page,
   gates the *destination*: the archive card, the desktop topbar icon and the
   hamburger's «کتابخانه» all open only for `tier === 'premium'`), so tapping
   any of the three doors is not a way to check your work.
   The page itself is still a plain static file and opens for anyone who knows
   the URL; the gate is a product gate, not access control.
7. **The paper-count claim.** The library is advertised with a number — «بیش از
   ۲۲۰۰ مقاله» on the `#card-library` card (`index.html`) and the same figure in
   the premium gate sheet, whose copy lives in `plus/js/library-gate.js`. It is
   a hand-written claim, not a count read from the catalog, so it drifts as
   papers are added. After adding the entry, count, then find every place the
   number lives — **two files, not one**:

   ```bash
   python3 -c "import json;print(len(json.load(open('dentcast_cabinet_full_catalog.json'))['papers']))"
   grep -rn '۲۲۰۰' index.html plus/js/library-gate.js   # card copy + gate-sheet copy
   ```

   While the total is still under the next round hundred the claim stands and
   nothing changes. Once it crosses one, update **every** hit in the same
   commit — one sentence living on several surfaces, so Hard Rule 17's sweep
   logic applies: never fix one and leave the others. One version bump is now
   needed with it: `index.html`'s copy is its own, but the gate sheet's text is
   in a shared module, so run `python3 tools/asset_version.py --bump` in the same
   commit (see the cache-buster rule) or returning browsers keep the old figure.

#### Part 3 — Find the DOI on the web and add a first-author → DOI credit on the page (ShareHub style)

**Runs only when a page is being published** (text-bearing publish, any type). On
the **paper-only fast path** there is no page — skip this part entirely and report
the skip. This is the on-page action and mirrors how **ShareHub** credits its
source: a `.author` block reading «نویسنده:» followed by a single hyperlinked
name. Here the linked name is the **paper's first author** and the link target is
the **DOI**.

1. **Find the DOI + first author on the web.** Search the net for the paper's
   **DOI** and its **first author** — use `WebSearch` and/or the article-lookup
   MCP tools (`search_articles`, `lookup_article_by_citation`,
   `get_article_metadata`, `convert_article_ids`). Cross-check the DOI resolves
   to the correct paper (matching title/journal/year). **If you cannot confidently
   determine the DOI or the first author, ASK the user — never fabricate either.**
   The DOI/journal/year found here also feed Part 2's catalog fields.
2. **Add the credit under the article body.** On the published page (whatever its
   type), **below the article body**, add a source-credit block crediting the
   paper's first author, where the **first author's name is an anchor to the DOI**:
   ```html
   <div class="author">
     نویسنده:
     <a href="https://doi.org/<doi>" target="_blank" rel="noopener noreferrer">First Author</a>
   </div>
   ```
   - Use the **same markup/style precedent the page's own type already uses** for
     a source credit. DentAI, for instance, has a source-citation precedent (e.g.
     `dentai/dentai-3.html`: a citation card with the paper title, authors,
     journal, and DOI, plus a JSON-LD `isBasedOn` → `doi.org` reference). If such a
     citation card is present on the page, **enhance it** by making the **first
     author** a real `<a href="https://doi.org/<doi>">` link (ShareHub style)
     rather than adding a visually duplicate block; if no such block exists, add
     the ShareHub-style `.author` credit above, and ensure its `.author` CSS exists
     in the page (it does on ShareHub-derived pages; add it if the type's template
     lacks it).
   - **This is the SOURCE paper's author** — do **not** confuse it with, or
     overwrite, any existing site author credit (e.g. DentCast's `.author-note`,
     دکتر فواد شهابیان, the narrator/site author). The two coexist.
3. **Keep JSON-LD consistent.** If the page's template carries an `isBasedOn`
   (CreativeWork) reference, set its `url` to `https://doi.org/<doi>` and its
   `name` to the paper title — matching the `dentai-3` precedent.
4. **Hash the new page before and after Part 3.** The only allowed diffs are the
   first-author→DOI credit (and any `isBasedOn` value update). Report before/after
   hashes. Don't break HTML (no link inside an existing link or heading).

**Verify after the branch:** report the Drive subfolder the paper landed in (and
its `drive_view` URL); the new catalog entry's `id`, `topic`/`topic_path`,
`tags`, and Drive link; and — when a page was published — the DOI + first author
used for the on-page credit (with the rendered anchor), or the "Part 3 skipped —
paper-only" note otherwise. Explicitly flag anything you had to ask the user
about, and confirm nothing was guessed.
