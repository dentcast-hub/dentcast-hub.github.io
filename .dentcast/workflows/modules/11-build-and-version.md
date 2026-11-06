<!-- dentcast-checkpoint-protocol:v1 -->
> **Checkpoint protocol.** Read `.dentcast/workflows/publish-checkpoints.md` completely once per unchanged revision. Mark each ledger step `started` with `tools/dentcast_publish_handoff.py`, then record its real evidence or canonical skip reason before the next; never auto-mark semantic or scientific work complete. Interrupted publication: `publish-checkpoints.md`, «Interrupted publication».
> **Order, founder messages and the three deliveries:** `.dentcast/workflows/publish-checkpoints.md` («Order, messages, text lock, deliveries»). Delivery 3 (C.8, C.7, D, E, F, G) is the post-Push-2 runner's, never run locally; intermediate checkpoints stay local.
<!-- /dentcast-checkpoint-protocol:v1 -->

Ledger steps in this module: `C.6` (agent: Pulse, then the second-cut editorial lock — every founder, scientific and semantic choice closed and the authored English mirror + toggle on disk, or the documented LiteCast/چالش exemption; then delivery 2), `C.8` and `C.7` (the post-Push-2 runner's, `tools/dentcast_post_cut2_runner.py` via `.github/workflows/post-cut2-mechanical.yml`).

### 6. Pulse update

Use the Pulse sentence from Question 5 (the founder's, copied; or the agent's draft, standing acceptance). **No spoilers (Question 5): it names the piece by its title and never narrates its decision, mechanism, finding or conclusion** — a draft that describes content beyond the title is rewritten before inserting.

- Locate the Pulse section in `index.html` (or its data source if data-driven).
- Insert the new sentence at the **absolute top** — it becomes the first line, above every existing line.
- Remove the **bottom-most** (oldest) line entirely — no empty container left behind; the rule is positional.
- The chosen word links to the new page's URL; match the exact HTML/classes of the other Pulse items.
- Keep exactly **7** Pulse lines. Phase F checks the count, first position, and preservation of the previous first six lines when a new URL is added against main.

Glossary terms are not announced (documented skip); LiteCast follows its own convention.

### 7. Bump the site content version (cache-bust)

**The runner's step C.7, after C.8 — never run by the agent during a publication.** The site-wide version is derived from a hash of the content sources (`dentcast-brain.json`, `glossary/glossary.json`, `litecast/lite-glossary.json`, `dentcast-music.json`) **plus the shared cached assets** (`dc-theme.css`, `dc-article.css`, `dc-nav.css`, `dc-nav.js`, `global-search.css`, `global-search.js`, `global-search-ui.js`, `episodes-drawer.js`) — never hand-picked. `python tools/stamp-version.py` computes `ver = sha256(content sources)[:10]` and stamps it into `service-worker.js` (`CACHE_NAME = 'dentcast-assets-<ver>'`; the worker is no-cache, so the stamp only makes browsers fetch and activate the new worker; `service-worker.js` is excluded from the hash) and every `dentcast-brain.json?v=<ver>` fetch URL (`index.html` ×2, `player.html`).

**Stamp-last — the only home of this rule.** The stamp is a hash of the content, so any write to a hashed source **after** it silently invalidates it (nothing errors; caches still bust, but the version no longer derives from what the site serves). So the stamper runs **last**, after every builder (C.8 before C.7), the runner's Phase D restamps after its own regeneration, and it owns every version string a builder template might emit (no builder may hard-code a `dentcast-brain.json?v=` or `CACHE_NAME`). Phase F row `7 version` fails a stamp that differs from the recomputed hash. `.github/workflows/sitemap_only.yml` re-stamps on every push to `main` — a net for two publishes merged in sequence, never a reason to skip it; updating a completed PR after `main` advanced reruns the stamp last (`publish-after-push2.md`).

### 8. Rebuild

**The runner's step C.8, from the exact Push-2 commit — the agent never runs these builders locally during a publication** (Hard Rule 8's `main`-reflecting state is the Push-2 branch built on fresh `origin/main`). The agent monitors the run, reports it, and on failure uses only the guarded recovery of `publish-after-push2.md`; a correction after Push 2 is an invalidation and a new Push 2, never a local rebuild.

The runner's builder list, in order, and its conditions (the single home of the skip rules):

1. `python3 tools/update-homepage-counters.py` — always. Refreshes the three COUNTER stats, the hero card and each «تازه‌های دنت‌کست» rail card from the brain, and the «دسته‌های محتوا» per-category counts (episodes from `dentcast.json`, LiteCast from `litecast/lite-glossary.json`).
2. `python3 tools/build_pillar.py all` — always. Every `/pillar/<slug>/index.html` (the flat date-ordered list), its `structure.json` sidecar (subtopic foldering for `/pillar/premium-index.js`), the pillar landing page with `pillar/structure.json`, and `/glossary/index.html`. Never hand-add subtopic cards to a pillar page or edit a `structure.json`.
3. `python3 tools/build_episodes.py` — when `dentcast.json` is a target path or the category is an episode: the fully static `episodes.html` from `dentcast.json` + the brain + `tools/episodes_template.html`.
4. `node tools/build_flashcards_index.mjs` — iff C.4.11 completed (not for its LiteCast, DentCast+-without-tips or چالش skips).
5. `node tools/build_quiz_index.mjs` — iff C.4.12 completed.
6. `node tools/build_challenge_index.mjs` and `python3 .github/scripts/gen_sitemap.py` — iff C.4.14 completed (a چالش, whose Phase D does not regenerate the sitemap).
7. `python3 .github/scripts/inject_img_attrs.py` — always (intrinsic `width`/`height`, `alt`).
8. `node tools/build_plus_index.mjs` and `python3 tools/build_upboard_index.py` — unless paper-only: `plus/content-index.json` (the میز کار tree, last-read resolver and the hashtag/alias mirror; it reads each pillar's `structure.json`, so the pillar builder runs first) and `up-board/index.json` (global publication order and dates).

Every generated file has its builder as its only writer — never hand-edit `episodes.html`, `/glossary/index.html`, a pillar page or sidecar, `plus/flashcards-index.json`, `plus/quiz-index.json`, `plus/challenges.json`, `plus/content-index.json` or `up-board/index.json`. **Asset-version guard (a runner/Phase F concern):** `tools/build_pillar.py` and `tools/episodes_template.html` hard-code shared-asset `?v=` suffixes; on the direct and queue routes the post-cut2 runner checks this itself (`ASSET_VERSION_REGRESSION` after C.8 and before Phase F) and refuses delivery 3 when a builder lowered or dropped a `?v=` stamp a page carried at Push 2; for a manual rebuild outside the runner, verify with `git diff -G'\?v=' pillar/`. The fix is bumping the builder's hard-coded suffix to the live value, never shipping the rollback. Phase F rows `8 pillar` / `8 pillar-structure` / `8 plus-index` / `8 flashcards` / `8 sitemap` verify the outputs; the report quotes the run's Phase F summary.
