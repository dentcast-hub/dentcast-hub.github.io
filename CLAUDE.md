# DentCast Repo — Publishing Protocol

> **Agent parity — read before acting.** This repo is worked on by more than one
> agent (Claude Code, Cursor, Codex/GPT). The behavioral contract that makes
> their output identical — conversation language, which confirmation gates are
> never automatic, what to do when a capability (web search, Google Drive,
> ffprobe) is missing, the deterministic hash/build/validate commands, the
> output-parity checklist, and the git protocol — lives in
> **`.dentcast/workflows/agent-parity.md`**. `AGENTS.md` at the repo root is the
> agent-neutral mirror of this file, and `.cursor/rules/*.mdc` are Cursor's
> routers into the same canonical workflows.
>
> **Maintenance rule:** if you change a trigger, a rule, or a section here, make
> the same change to `AGENTS.md` and `.cursor/rules/dentcast-router.mdc` **in the
> same commit**. Logic lives in the canonical workflow files; routers only point
> at them; behavior lives in `agent-parity.md`. None of them duplicates another.

This repo powers DentCast. When the user brings new content to publish:

1. Read `.dentcast/workflows/README.md` and follow it strictly.
2. `dentcast-brain.json` is the source of truth for every content type's structure, schema, and category. Always use the most recent entry of the SAME category as the template for any new entry.
3. Never mix categories. NoteCast stays in NoteCast. Insight stays in Insight. Each category's entries go to their own section/array in the brain and their own directory on disk.
4. The "latest content" widget on the homepage reads the LAST entries from `dentcast-brain.json`. Therefore, every new entry MUST be appended at the END of its category in the brain — never inserted mid-list.
5. Auto-discover whatever you can. Ask the user only for things you genuinely cannot determine.
6. Brain entry schema is sacred. Never add new fields to a brain entry that don't exist on previous same-category entries. Match the existing shape exactly.

## English-version protocol (trigger)

There is a **second** workflow alongside the publishing router. When the user
asks to produce the **English (en) version of an existing page** — trigger
phrase **«… رو انگلیسی کن»** (e.g. «پرامپتولوژیست ۱ رو انگلیسی کن»,
«نسخه‌ی انگلیسیِ متانوت ۳») — do **not** use the «متن جدید دارم» publishing
router. Instead read `.dentcast/workflows/en-version.md` and follow it
strictly. That workflow mirrors one existing page into
`/{type}/en/{same-filename}.html`: English chrome cloned from
`metanotes/en/meta-1.html`, body/schema inherited and translated from the
source's own type, a real per-document fa↔en toggle on both sides, and
disk-discovered hreflang pairing. en pages are standalone translations — they
get **no** `dentcast-brain.json` entry, **no** Pulse line, and **no**
specialist cross-linking.

**Note — the publishing router already invokes this workflow automatically.**
Every normal `.org` publish ends with **Phase D** of
`.dentcast/workflows/README.md`, which runs this same en-version workflow on
the page it just published — so a freshly published page **always** ships with
its English mirror + a working fa↔en language toggle (Hard Rule 12), never a
toggle-less page. The **«… رو انگلیسی کن»** trigger therefore remains for
mirroring an **older/pre-existing** page that predates that rule (or any page
whose en version is missing) — it is the on-demand entry point to the *same*
machinery the router now calls on its own. **LiteCast is the sole exception:**
it is `.ir`-only with no hreflang, so it gets no en mirror or toggle in either
path.

## Ad-publishing protocol (trigger)

There is a **third** workflow alongside the publishing router and the
en-version router. When the user says they have an **advertisement** to
publish or manage — trigger phrases like **«تبلیغ دارم»**, «آگهی دارم»,
«اسپانسر گرفتیم», «تبلیغ X رو خاموش کن», «سهم اسپانسر رو کم/زیاد کن» — do
**not** use the «متن جدید دارم» publishing router. Instead read
`.dentcast/workflows/ads.md` and follow it strictly. An ad is not content:
it gets **no** page, **no** brain entry, **no** Pulse line, **no** en mirror
— the whole ad system lives in `spot/spot-config.json` (see `spot/README.md`).
That workflow interviews for the gaps (sponsor vs internal, link, copy,
image, slots, rotation share) and files sponsors so they automatically ship
with `rel="sponsored"` (Google compliance). Never hardcode an ad into a page.
**Always ask which of the four زمان‌ها (rotation beats) the new ad takes and
what fills the rest** — the rotation advances once per **session**, so a
four-entry `rotation.sequence` = four visits, and an ad assigned to no beat
renders never (ads.md hard rule 6 + Phase B question 6).

## Ad-reporting protocol (trigger)

When the user asks for **ad numbers** — «گزارش تبلیغ بده», «آمار تبلیغات»,
«تبلیغ‌ها ماه گذشته چقدر دیده شدن؟», «کلیک اسپانسر X چقدر بوده؟» — read
`.dentcast/workflows/spot-report.md` and follow it. This is read-only: no
config edit, no publish. Every ad render/click already reports to **our own
API** (`spot_impression`/`spot_click` → aggregate counters, read back via
`GET /admin/spot/stats`) **and** to GA4 as a cross-check, so the report is a
lookup, not a build. Our API is the source of truth: adblockers drop GA but
not a same-site subdomain. Three rules that decide whether the answer is
right: the headline number is always **تعداد بارِ نمایش** (one person seeing
an ad 20 times is 20 — there is deliberately no per-user attribution, so
"چند نفر" is unanswerable), **premium is zero by design, not by
measurement**, and no data of any kind exists before 2026-07-26. Numbers are
never guessed — if the data isn't in hand, hand over the command instead.

## Attached paper file (trigger — ANY type, file-driven)

The paper actions are triggered by the **paper file itself**, *not* by the
content type. Whenever the user hands you a research paper/article file — with
content of **any** type (not just DentAI), or with **no** متن at all — the paper
branch fires. Specified in **Phase C step 4.10** of
`.dentcast/workflows/README.md` (routed in **Phase 0**, armed by **Phase B
Question 4.7**):

1. **File the paper into Google Drive** — upload it into the correct *topical
   subfolder* (chosen semantically) of the cabinet folder
   `https://drive.google.com/drive/folders/1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f`.
2. **Enrich `dentcast_cabinet_full_catalog.json`** (repo root) — append the
   paper to its `papers` array with the Drive link, semantic hashtags (plus the
   article's own name), and the enriched-entry schema.
3. **First-author → DOI credit** — find the paper's DOI on the web, then credit
   the **first author** under the article with a link to the DOI, ShareHub-style.

**Routing by what was attached:**
- **Paper file + text (any type):** the page publishes normally for its type
  **and** all three actions run.
- **Paper file only, no text:** run **only actions 1 & 2** (Drive upload +
  catalog update) — **skip action 3** (no page to credit) and skip the rest of
  the publish flow. Drive upload + catalog edit + commit is the whole job.
- **Text, no paper file:** no paper actions; publish normally.

Hard guard for this trigger: **«اگر جایی شک داشتی سوال کن عمل نکن»** — anywhere
you're unsure (subfolder, topic/tags, DOI, first author), **ask first, never
guess.**

## Repo conventions

- `dentcast-brain.json` — central data file, has separate sections/arrays per content type.
- `dentcast-hashtag-reference.json` (repo root) — **the canonical hashtag library and single source of truth for every `#hashtag`** (the AI case-assistant search reads it, mirrored into `plus/content-index.json` by `tools/build_plus_index.mjs`). The reference owns the *vocabulary* (which canonical forms are legal, what each means, their aliases); the brain owns the *assignment* (which article carries which tag). **Standardized, never free text:** on every publish, resolve each proposed hashtag against this library and reuse the existing canonical form, or mint a new canonical concept (with `definition` + `use_when` + `aliases`) if genuinely absent — an alias is never used as a tag, a canonical tag is never filed as an alias, and no concept is duplicated. Tooling is `tools/hashtag_ref.py` (`--simulate`/`--apply`/`--sync`/`--check`); batches live in `.dentcast/hashtag-batches/`; governed by publishing-workflow **Hard Rule 15 / step 5.0** and seeded by `.dentcast/hashtag-campaign-handoff.md`.
- `dentcast_cabinet_full_catalog.json` — root catalog of the paper cabinet (`papers` array; mirrors the Google Drive folder's topical subfolders). Updated by the DentAI-with-paper branch (workflow step 4.10); the search UI is `dentcast_cabinet_search.html`. **Its kebab-style `tags` are a SEPARATE system from the brain `#hashtags` above — not governed by the hashtag reference library.**
- `tools/` — Python scripts including the main index builder.
- `index.html` — homepage with Pulse section + latest-content widget.
- Each content type has its own directory at the repo root (e.g., `/notecast/`, `/insight/`, `/litecast/`, etc.). Confirm exact paths from the URLs stored in brain entries.
- `.dentcast/workflows/` — publishing workflows (+ `agent-parity.md`, the cross-agent behavior contract).
- `AGENTS.md` (repo root) — agent-neutral mirror of this file, for Cursor / Codex / any other agent. `.cursor/rules/*.mdc` — Cursor routers into the same canonical workflows. All three are kept in sync (see the maintenance rule at the top).
- `spot/` — central config-driven ad system ("Spot"; the name is deliberately neutral — EasyList's generic `##.dc-ad` rule hid the old `/ads/` + `dc-ad` naming under every adblocker, so never use "ad/ads" in this system's file names, paths, classes, ids, or data attributes). `spot/spot-config.json` is the single source of truth (master + per-slot on/off, premium/sponsor creatives, rotation sequence, per-creative `slots`/`audience` targeting); `spot/spot.js` is injected on every page by a loader hook at the end of `dc-nav.js`. Anonymous + free Plus users see ads; premium users see none; anything switched off leaves zero trace. Docs: `spot/README.md`. No page carries ad markup — never hardcode ads into pages.
- `plus/pathways.json` — DentCast Plus learning pathways (spec §5 schema; premium Phase 3). A pathway is a curated learning journey, **not** a pillar view: unlike a pillar (one home per item), the **same item can belong to many pathways**, placed at the right prerequisite→advanced position in each. Every specialist publish assigns the new content to its pathway(s) via **workflow step 5.6** (semantic, ask-if-unsure). Tools: `tools/pathway_place.py` (placement proposal + `--insert` + `--coverage`) and `tools/pathway_scout.py` (candidate search + `--steps` + `--coverage`). Catalog/doctrine: `reports/pathways-catalog-2026-07-22.md`. Backend infra is live — `plus-api/src/pathways.ts` loads it (cached, reload-on-change like `content-index.ts`) and `GET/POST /pathways*` (premium-gated) + `GET /me`'s `active_pathway` read through it; `user_pathways` holds enrollment + a derived `current_step`/`completed_at` cache (never advanced by a client call — recomputed from highlights/`user_activity` on every read). Editing the file needs an API redeploy to take effect in production (baked in via `PATHWAYS_PATH`, same as `CONTENT_INDEX_PATH`). Frontend is live too — `/plus/pathways.html` (catalog), `/plus/pathway.html?id=` (step list + enroll), and a "مسیر یادگیری" block on the `/plus/` dashboard (`plus/js/pathways.js` is the shared renderer).
- **Collections** (premium Phase 3; spec §4's `collections`/`collection_items`, provisioned since migration 0001, live since migration 0012's indexes). Unlike a pathway (founder-curated) or a topic archive (auto-grouped by taxonomy), a collection is **entirely the user's own** — any mix of their own highlights and whole pages, no taxonomy coupling. Backend: `plus-api/src/routes/collections.ts` (full CRUD + idempotent item-add, all `requirePremium`). Frontend: `/plus/collections.html` (catalog), `/plus/collection.html?id=` (items, rename, delete), a "کالکشن‌ها" block on the `/plus/` dashboard, and the **"افزودن به کالکشن"** entry points — a dual-target toolbar button in the workbench (selected highlight, or the whole page if none is selected — same pattern as the یادداشت button) and a per-row button on the dashboard's recent-highlights list. All three go through `plus/js/collections.js`'s `openCollectionPicker()`, which also owns the free-tier gate message (shown on click, not a locked page).

## Site-wide invariants

- **Google Analytics 4 (deferred) on every page.** Every HTML page MUST carry the deferred GA4 snippet (measurement ID `G-GMM0WC8X3M`) inside `<head>`. It is lazy-loaded — `gtag.js` is appended only after the `load` event so it never blocks first paint. Do NOT use Google's default async snippet; use the deferred pattern below. Because new pages are cloned from the most recent same-category page, the tag propagates automatically — but always confirm it survived the clone.
  - The canonical injector is `.github/scripts/inject_ga.py` (idempotent; skips pages that already have it, and pages without a `<head>`). To backfill/verify the whole site: `python3 .github/scripts/inject_ga.py` (or `--check` to fail if any page is missing it).
  - The build templates emit it too: `GA_DEFERRED_SNIPPET` in `tools/build_episodes.py` and `tools/build_pillar.py` (and the glossary head literal). Keep all of these in sync if the snippet ever changes.
  - The `.org` and `.ir` codebases are mirrors; the same tag intentionally deploys to both. Do NOT add per-domain logic.
  - The exact deferred snippet (place inside `<head>`):
    ```html
    <!-- Google Analytics (deferred: loads only after the page is fully rendered) -->
    <script>
      window.addEventListener('load', function () {
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'G-GMM0WC8X3M');
        var ga = document.createElement('script');
        ga.async = true;
        ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-GMM0WC8X3M';
        document.head.appendChild(ga);
      });
    </script>
    ```
  - If a Content-Security-Policy is ever added, it must allow `script-src https://www.googletagmanager.com` and `connect-src https://*.google-analytics.com https://*.analytics.google.com`. (No CSP currently exists in this repo.)
