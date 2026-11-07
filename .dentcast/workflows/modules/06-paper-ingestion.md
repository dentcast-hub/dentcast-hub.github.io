<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages, the save point and the deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `C.4.10.1` (Part 1), `C.4.10.2` (Part 2), `C.4.10.3` (Part 3). They run after C.4.6, before C.4.7, and before C.4.13, which reuses their DOI.

### 4.10. Attached-paper branch (ANY type — triggered by the paper file, not the category)

**Runs whenever the founder supplied a paper file, for every type** (Question 4.7). Without one, record "4.10: skipped — no attached paper". The branch is **additive** and overrides nothing.

- **Paper file + text (any type):** all three parts.
- **Paper file only (paper-only fast path, Phase 0):** Parts 1 and 2 only; record "Part 3: skipped — no published page (paper-only)".

**Facts and judgments in this branch.** The paper's real title, DOI, first author, journal and year come only from the PDF itself or a real lookup (PubMed/Crossref, cross-checked against title/journal/year); what no real source answers — and which Drive file is the founder's upload when several could be — is an open fact for **M1** (Hard Rule 13). The Drive subfolder among existing ones and the catalog tags are agent judgments (Hard Rule 14: closest semantic match, recorded). A **new** Drive subfolder is a founder decision, asked when it arises. Never invent a subfolder, a DOI, an author or a tag.

#### Part 1 — File the paper into Google Drive (correct topical subfolder)

The DentCast paper cabinet is the Drive folder `https://drive.google.com/drive/folders/1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f` (id `1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f`), organised into **topical subfolders** mirroring the catalog's `topic_path` values (e.g. `abutment`, `zirconia`, `fresh socket`, `GBR`, `periimplantitis`, `biomimetic`, nested `biomimetic/Bonding`, `zirconia/flexural strength`, …).

1. **Read the live subfolder set** with the Google Drive MCP tools (this list is illustrative) and cross-reference the catalog's distinct `topic_path` values.
2. **Choose the single best-matching existing subfolder semantically** from the paper's actual topic, never from filename keywords.
3. **Upload the file into that subfolder**, keeping the paper's real filename, and capture for Part 2:
   - `drive_id` = the uploaded file's id
   - `drive_view` = `https://drive.google.com/file/d/<drive_id>/view`
   - `drive_download` = `https://drive.google.com/uc?export=download&id=<drive_id>`
   **Founder-uploaded file (the usual case).** When the founder already put the PDF in the cabinet root, never upload a second copy:
   - **Find** it among the files directly under the parent folder and confirm it is this paper (title/first page, size); several candidates → M1.
   - **Rename** it to the paper's verified real title, keeping its extension; Part 2's `file_name` is this name.
   - **Move** that same file into the chosen subfolder — never a copy or re-upload.
   - Capture `drive_id` from **that same file**; `drive_view` and `drive_download` derive from it.

   **Doing the Drive work early.** If the founder asks for it «اول از همه», before the ledger reaches `C.4.10.1`, do it then and record it as an `external_action` `C.4.10.1:<name>` (e.g. `C.4.10.1:drive-move`; `started` before acting, the observed outcome with evidence such as `drive:<drive_id>` right after). At `C.4.10.1` do not repeat it: complete the step with evidence referencing that receipt. Every rule of this branch applies to the early run unchanged.
4. **No existing subfolder fits** → asking for a new subfolder is a founder decision; **never create a subfolder without the founder's explicit yes.** Two equally good existing ones → the closer match, with the reason recorded.

#### Part 2 — Enrich `dentcast_cabinet_full_catalog.json` (root)

The root catalog is a JSON **object** whose `papers` key holds a flat array of entries. Add the new paper:

1. **Next id.** `P` + the zero-padded successor of the current max `P####` (after `P2876` → `P2877`), confirmed by scanning `papers`.
2. **Match the ENRICHED entry shape exactly.** A recent `semantic_tagged: true` entry is the template — same keys, nesting and order, no extras, no omissions. Its key set: `id`, `title`, `file_name`, `topic`, `topic_path`, `type`, `local_path`, `file_size`, `key_finding`, `clinical_bottom_line`, `linked_episodes`, `drive_link`, `status`, `drive_download`, `drive_view`, `drive_id`, `tags`, `name_bucket`, `semantic_tagged`, `real_title`, `doi`, `journal`, `crossref_year`, `subjects`, `abstract`, `display_title`. **Confirm the live shape from the file**; never add a field the template lacks.
3. **Fill from the paper and the lookup:**
   - `real_title` / `title` / `display_title` → the paper's real title (`dentcast_cabinet_search.html` shows `display_title || real_title || title`).
   - `topic`, `topic_path` → the Part 1 subfolder (the search page filters on `topic`).
   - `doi`, `journal`, `crossref_year`, `abstract` → from the Part 3 step 1 lookup (on the paper-only path, run that lookup alone, without the page credit).
   - `file_name` → the real filename; `file_size` → its byte size.
   - **`drive_link` / `drive_view` / `drive_download` / `drive_id` → from Part 1.**
   - `status` → as the template (e.g. `"linked"`); `semantic_tagged` → `true`.
   - `linked_episodes` → the page being published, if any, in the template's value shape — never a LiteCast page (nothing links to LiteCast); paper-only keeps the template's empty shape (e.g. `[]`). `key_finding` / `clinical_bottom_line` may stay `""` unless the content gives them clearly.
4. **Hashtags (`tags`) — semantic + the article's own name.** Semantic tags for the paper's concepts in the **lowercase-kebab style of existing `tags`** (`marginal-bone-loss`, `rct`, `clinical-trial`), **the `topic:<subfolder>` tag** of the catalog convention, **and a tag derived from the article's own title.** No junk/generic tags (standing acceptance, recorded).
5. **Top-level counters.** Keep roll-up integers that track the array (`unique_papers`, `total_files_scanned`, the drive-match count) consistent with the added entry. Never hand-rewrite the derived analytics blocks (`tag_index`, `semantic_pass`, `enrichment`, `drive_match_breakdown`); whether a counter should move, when unclear, is an M1 fact.
6. **Verify:** the entry is appended to `papers`, the JSON is well-formed, its key set equals the template's, the Drive link is present, and the paper appears and filters correctly in `dentcast_cabinet_search.html` (title, topic, tags, View/Download). **Open that page directly** — on the site the library is premium-gated (`plus/js/library-gate.js`, installed from `plus/js/header.js`, gates the archive card, the desktop topbar icon and the hamburger's «کتابخانه» for `tier === 'premium'`), so the three doors are no way to check your work. The page itself is a plain static file; the gate is a product gate, not access control.
7. **The paper-count claim.** The library is advertised with a hand-written number — «بیش از ۲۲۰۰ مقاله» on the `#card-library` card (`index.html`) and the same figure in the premium gate sheet (`plus/js/library-gate.js`). After adding the entry, count and find every place the number lives — **two files, not one**:

   ```bash
   python3 -c "import json;print(len(json.load(open('dentcast_cabinet_full_catalog.json'))['papers']))"
   grep -rn '۲۲۰۰' index.html plus/js/library-gate.js   # card copy + gate-sheet copy
   ```

   Below the next round hundred nothing changes. Once it crosses one, update **every** hit in the same commit (Hard Rule 17) and run `python3 tools/asset_version.py --bump` with it (the gate sheet's text is in a shared module) or returning browsers keep the old figure. This holds on the paper-only path too: Phase 0's «no version stamp» means the site stamp, not this cache-buster.

<!-- paper-reachability-step-8:v1 -->
8. **Reachability through the assistant (the paper must be findable from a site tag).**
   A paper reaches a reader only under a chip of the «دستیار هوشمند», and a chip reaches papers only through `plus/cabinet-bridge.json` (`map`: site tag key → library tags, closest first; `tooth_topics`; compiled into `plus/cabinet-papers.json` by `tools/build_cabinet_papers.py`, see its docstring). A catalog entry nobody can reach is filed, not published.
   - **With a page being published:** nothing is written here. Record the new paper's catalog `id` and DOI in the C.4.10.2 evidence; **step 5.0** (module 10, Step 4) makes it reachable once the page's canonical hashtags exist, by the rules below (keys = the tag without `#`, `_` → space, lowercased). The paper must be reachable from **at least one** of them: a `map` row for that key **and** a library tag of the paper it names (after `tag_aliases`), **and** after `python3 tools/build_cabinet_papers.py` the paper's `id` appears in `byTag[<key>]` (ideally inside its 12). If not: (a) the row exists but the paper lacks the library tag it names, and the paper **is** about that topic → add that **existing** library tag to the paper's `tags`; (b) the tag has no row and the library holds papers on the topic → add the row (1–4 existing tags, closest first; `tooth_topics` for natural-tooth topics); (c) no library tag names the topic and this paper is the first of its kind → mint a kebab library tag with it (1–3 English words in the style of its neighbours, e.g. `tooth-implant-connection`), put it first in the row, and keep `tag_index` consistent (the one derived counter you touch: `+1` per paper, or a new key) — never rewrite the other analytics blocks. A `topic:<subfolder>` tag is never a bridge target.
   - **Paper-only fast path (no page):** check here that the paper is reachable from at least one existing row (`python3 tools/build_cabinet_papers.py`, then search `plus/cabinet-papers.json` for its `id`). If not, do (a) when an existing library tag plainly fits, otherwise **report** it as a library-only paper — never invent a site hashtag for it.
   - Wherever the edit happens, finish with `python3 tools/build_cabinet_papers.py --check` (green) and commit the catalog, the bridge and `plus/cabinet-papers.json` together.
   **Report:** the site tag key(s) the paper is reachable from, its position in `byTag`, and every (a)/(b)/(c) edit — or the explicit «library-only» line.
<!-- /paper-reachability-step-8:v1 -->

#### Part 3 — Find the DOI on the web and add a first-author → DOI credit on the page (ShareHub style)

**Runs only when a page is being published.** It mirrors how **ShareHub** credits its source: a `.author` block reading «نویسنده:» and one hyperlinked name — here the **paper's first author**, linked to the **DOI**.

1. **Find the DOI + first author from a real source.** The PDF itself, `WebSearch` and the article-lookup MCP tools (`search_articles`, `lookup_article_by_citation`, `get_article_metadata`, `convert_article_ids`); cross-check that the DOI resolves to this paper (title/journal/year). Neither is ever auto-applied from a guess (Hard Rule 13): unresolved → M1. The DOI/journal/year found here also feed Part 2 and step 4.13.
2. **Add the credit under the article body**, the first author's name an anchor to the DOI:
   ```html
   <div class="author">
     نویسنده:
     <a href="https://doi.org/<doi>" target="_blank" rel="noopener noreferrer">First Author</a>
   </div>
   ```
   - Follow the **credit precedent of the page's own type**. DentAI has a citation card (`dentai/dentai-3.html`: title, authors, journal, DOI, plus a JSON-LD `isBasedOn` → `doi.org`); when such a card is on the page, **make its first author** a real `<a href="https://doi.org/<doi>">` link instead of adding a duplicate block. Otherwise add the `.author` credit and make sure its `.author` CSS exists in the page (ShareHub-derived pages have it).
   - **This is the SOURCE paper's author** — never confuse it with or overwrite the site's own author credit (DentCast's `.author-note`, دکتر فواد شهابیان); the two coexist.
3. **Keep JSON-LD consistent.** A template `isBasedOn` (CreativeWork) gets `url` = `https://doi.org/<doi>` and `name` = the paper title (the `dentai-3` precedent).
4. **Evidence:** `git diff` of the page shows only the credit (and any `isBasedOn` update); no link inside an existing link or heading.
5. **Several attached papers.** Parts 1–2 once per paper (one catalog entry each, all linking this page), and **each** paper gets its own first-author→DOI anchor in a «منابع» list like `sharehub/share-22.html`, not N `.author` blocks.

**Report after the branch:** the Drive subfolder and `drive_view` URL; the catalog entry's `id`, `topic`/`topic_path`, `tags` and Drive link; and with a page the DOI, first author and rendered anchor (or the paper-only skip line). Name every M1 fact and confirm nothing was guessed.
