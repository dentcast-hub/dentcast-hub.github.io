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
7. A string the user supplied is **copied, not re-typed** (Hard Rule 16). A ZWNJ (`U+200C`) is not a space — «اندو‌شده» ≠ «اندو شده» — and widening their caption by a clause is a rewrite, not a copy. Propose changes; never make them in passing.
8. Correcting a title or caption after the fact is a **sweep, not a spot edit** (Hard Rule 17). A title lives on ~8 surfaces and a caption on ~4 (including the en mirror); all of them change in the same commit, then the builders re-run.
9. **A publish ends with a green gate, not with a claim.** After Phase E, run Phase F and paste its summary line into the report:
   ```bash
   python3 tools/verify_publish.py <content_id> \
     --expect-title "<title exactly as the user wrote it>" \
     --expect-caption "<caption exactly as the user wrote it>"
   ```
   Non-zero exit = the publish is incomplete. Every `FAIL` row prints its own fix command. The gate does not replace any step — it catches what a long checklist forgets (a builder run out of order, a surface a correction missed, an invisible character that changed).

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
what fills the rest** — the rotation advances once per **ad-showing page
view**, so a four-entry `rotation.sequence` = four page views (four refreshes,
or four articles, is one full lap), and an ad assigned to no beat renders never
(ads.md hard rule 6 + Phase B question 6).

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
- **The topical index is one URL with two arrangements** (`/pillar/` and `/pillar/<slug>/`). `tools/build_pillar.py all` writes **two** files per structured pillar: the **page**, which lists every item of that pillar flat and newest-first (undated last) and is what every visitor and every crawler gets, and **`structure.json`** beside it, which carries the subtopic foldering and the reading-chain order. `/pillar/premium-index.js` fetches the sidecar and swaps it onto the *same* URL once `/me` confirms premium — no second page, no redirect, nothing to noindex. **Never hand-add subtopic cards back into a pillar page and never hand-edit a `structure.json`**: both arrangements in one document would put the same links on the page twice, which is the duplicate-content problem the split exists to avoid. Three consequences worth remembering: dates come from each target page's own JSON-LD `datePublished` (nowhere else has them) and are converted to the Persian calendar **at build time** because a crawler must read the date, not compute it; `tools/build_plus_index.mjs` reads its subtopic taxonomy from these sidecars, so it must run *after* the pillar builder; and `robots.txt` disallows the sidecars, which costs the premium layer nothing because robots rules never apply to a page's own fetch.
- **Cache-buster stamps.** Shared assets are loaded through a stamped URL (`/dc-nav.js?v=40`, `/plus/js/pricing-page.js?v=2`); the path never changes, so the stamp is the only thing that makes a returning browser fetch the new file. After changing **any** shared asset — including a module that a stamped entry merely *imports*, like `plus/js/premium-cta.js` — run `python3 tools/asset_version.py --bump` in the same commit. It fingerprints each asset's whole import graph, raises the stale versions, rewrites every page, and updates `.dentcast/asset-versions.json`. CI runs `--check`.
- `index.html` — homepage with Pulse section + latest-content widget.
- Each content type has its own directory at the repo root (e.g., `/notecast/`, `/insight/`, `/litecast/`, etc.). Confirm exact paths from the URLs stored in brain entries.
- `.dentcast/workflows/` — publishing workflows (+ `agent-parity.md`, the cross-agent behavior contract).
- `AGENTS.md` (repo root) — agent-neutral mirror of this file, for Cursor / Codex / any other agent. `.cursor/rules/*.mdc` — Cursor routers into the same canonical workflows. All three are kept in sync (see the maintenance rule at the top).
- `spot/` — central config-driven ad system ("Spot"; the name is deliberately neutral — EasyList's generic `##.dc-ad` rule hid the old `/ads/` + `dc-ad` naming under every adblocker, so never use "ad/ads" in this system's file names, paths, classes, ids, or data attributes). `spot/spot-config.json` is the single source of truth (master + per-slot on/off, premium/sponsor creatives, rotation sequence, per-creative `slots`/`audience` targeting); `spot/spot.js` is injected on every page by a loader hook at the end of `dc-nav.js`. Anonymous + free Plus users see ads; premium users see none; anything switched off leaves zero trace. Docs: `spot/README.md`. No page carries ad markup — never hardcode ads into pages.
- `plus/pathways.json` — DentCast Plus learning pathways (spec §5 schema; premium Phase 3). A pathway is a curated learning journey, **not** a pillar view: unlike a pillar (one home per item), the **same item can belong to many pathways**, placed at the right prerequisite→advanced position in each. Every specialist publish assigns the new content to its pathway(s) via **workflow step 5.6** (semantic, ask-if-unsure). Tools: `tools/pathway_place.py` (placement proposal + `--insert` + `--coverage`) and `tools/pathway_scout.py` (candidate search + `--steps` + `--coverage`). Catalog/doctrine: `reports/pathways-catalog-2026-07-22.md`. Backend infra is live — `plus-api/src/pathways.ts` loads it (cached, reload-on-change like `content-index.ts`) and `GET/POST /pathways*` (premium-gated) + `GET /me`'s `active_pathway` read through it; `user_pathways` holds enrollment + a derived `current_step`/`completed_at` cache (never advanced by a client call — recomputed from highlights/`user_activity` on every read). Editing the file no longer needs an API redeploy: the baked `PATHWAYS_PATH` copy is only the boot value, and `plus-api/src/content-refresh.ts` re-fetches the published `plus/pathways.json` (and `plus/content-index.json`) from the live site every few minutes — validated, upgrade-only, last-good-copy on any failure. Frontend is live too — `/plus/pathways.html` (catalog), `/plus/pathway.html?id=` (step list + enroll), and a "مسیر یادگیری" block on the `/plus/` dashboard (`plus/js/pathways.js` is the shared renderer).
- `plus/badges.json` — the achievement catalog behind the profile's «افتخارات» section (two league medals + 20 badges). Same machinery as `pathways.json`: versioned in the repo, loaded by `plus-api/src/badges.ts` (reload-on-change, remote copy wins, last-good on error), re-fetched live by `content-refresh.ts`, so **retuning a threshold or rewriting a badge's Persian copy is a commit to the site, not an API deploy**. Served by `GET /achievements` (`plus-api/src/routes/achievements.ts`), rendered by `plus/js/achievements.js` into `profile.js` between «رکوردها» and «لیگ من». Four rules the code depends on: **every badge is DERIVED, never written down** (`plus-api/src/services/achievements.ts` computes all 21 metrics from data that already exists) — which is what makes the whole shelf retroactive, with no `earned_at` column that could disagree with the log it came from and no backfill on launch day; **one comparison, `value >= threshold`**, so anything naturally inverted (signup order in «پیشگام») is normalised to a 0/1 in the service rather than teaching the evaluator a second direction; **a level is a ring colour, never a word** — the wall never writes «طلا», only the medal row does and there it never stands alone («طلای کامپوزیت»), because two metal scales share the section (the league's seven dental materials and the badges' bronze/silver/gold) and the word is what would collide; and **any query touching league rank carries the validity filter** (group `>= min_valid_group_size` **and** `weekly_xp > 0`) because `league-finalize.ts` writes `final_rank` for every member of every group, including ones the UI itself calls non-competitive — without it, most accounts' first medal would be minted for doing nothing. `visibility` decides what an unearned badge looks like: `always` (grey, with its criterion), `mystery` (a «؟» tile that leaks nothing — the server strips the name, icon and copy), `earned_only` (absent entirely, for a condition nobody can meet any more). Tests: `plus-api/test/achievements.test.ts` + `achievements.dom.test.ts`.
- **اطلاعیه — the in-app inbox** (`plus/js/notices.js`, `plus-api/src/services/notices.ts`). Every notification the API produces already passed through exactly ONE function — `sendCapped` in `notify-policy.ts`, "the one door every outgoing notification goes through" — so the inbox is that door also WRITING the message, with its text, to the same `notification_log` row it already counted. Seven kinds got an in-site home without one of their services being touched. It fixes two things that were not visible as bugs: a reader who granted no push permission and linked no messenger received **nothing** (the providers no-op quietly for a user with no destination), and the daily cap **dropped** the overflow rather than queueing it, so a busy day lost news even for readers who did have a channel. Now the cap only decides whether a message TRAVELS; it always lands. **The one rule the whole thing rests on: `delivered` separates the table's two jobs, and every query that asks "was this sent" carries it** (`sentCountOn`, `alreadySentKindOn`) — the table is also the cap counter, so counting in-app-only rows would let the cap feed itself and silently starve a user's push budget. Read state is ONE watermark (`profiles.notices_seen_at`), not a per-row flag, so there is no half-read state and a retry is a no-op. Surfaced as a **dot on the account icon**, never by recolouring it: the person icon is the identity indicator (gray = guest, blue = signed in) and repainting it red would cost the reader the ability to tell whether they are logged in, while reading as "something is wrong with your account". Rendered into the existing `overlay.js` host (like پیشخوان and پروفایل) rather than a new page. **Broadcasts** (`notice_broadcasts`, migration 0026) are the second half: one row for everybody rather than a fan-out, with per-reader read state coming free from the same watermark. Two things use it. **A publish is announced in اطلاعیه the moment it happens, at any hour, to every reader** — the awake window and the daily cap exist to protect a phone and a bot token, and neither is involved in writing a row, so a free reader no longer waits 24 hours for the digest and a 02:00 publish is in the inbox at 02:00. The inbox line is deliberately SHORT and is not the Pulse («مطلب جدید در {بخش}» + the article's title): a paragraph about the argument belongs on a lock screen, not in a row people scan. The pushes that follow then pass `inbox: false` to `sendCapped` so one publish is never shown twice — they still write their (title-less) counter row, because the row *is* the cap counter. And **`POST /admin/notices/broadcast`** is the founder's own announcement, with a form on the rendered `GET /admin` page: the inbox row always lands instantly, while `push` respects the awake window unless forced — «uncapped» was about a broadcast not eating a reader's budget, never a licence to wake people at 03:00. Two rules bound who sees a broadcast: `audience` (all/free/premium, resolved at read time) and `created_at > profiles.created_at`, so nobody is shown news from before they existed; `profiles.notices_seen_at` defaults to `now()` for the same reason. Tests: `plus-api/test/notices.test.ts` + `notices.dom.test.ts`.
- **Announcing a badge that was never written down** (`plus-api/src/services/achievement-sync.ts`, `achievement_announcements`). Because every badge is derived (see `badges.json` above), nothing can know one was *just* earned — so what is stored is deliberately **not** the badge but the **announcement**: a record of what we have already told this reader. Three rules keep it from becoming the second source of truth the derived design ruled out: the wall never reads it (`GET /achievements` is untouched); it is a **high-water mark**, so a badge that goes dark and lights again — «فاتح» un-earns itself the moment a publish drops a folder below complete — is never re-announced; and **nothing is retroactive**. That last one is the whole go-live story and it lives in `profiles.achievements_seeded`, which migration 0025 sets FALSE for every account that existed then and leaves DEFAULT TRUE: an old account gets exactly one silent catch-up (its history filed, pre-acknowledged, no notices), while an account created afterwards starts with an empty ledger and IS told about its very first badge. Syncing is debounced (5 min) and fire-and-forget off the write paths, coalesced per user, and drainable (`drainAchievementSyncs`) so a test suite's `truncate` cannot deadlock against it. The celebration card opens on a **whitelist** of calm surfaces — the profile and the dashboard, never an article — because on the desktop shell an article is not a page at all (`index.html` fetches and injects it into column C), so a reader mid-paragraph is, by URL, on the homepage and a blocklist would have covered their screen at the worst moment. It is acknowledged separately from the inbox watermark (`POST /achievements/seen`), so reading اطلاعیه never silently spends a celebration.
- `plus/js/sheet.js` — the bottom sheet, shared. It was written inside `collections.js` for the save-to-board chooser and moved here when the achievements wall needed the same object; add to this module rather than re-implementing a sheet (same rule as `hl-view.js`).
- **Highlight library** (`/plus/highlights.html`, premium). The one place a reader can review **every** highlight they own, grouped by article, with their notes — no article, no workbench. It exists because without it the highlights were effectively write-only: the dashboard's «هایلایت‌های اخیر» showed six rows, every row was a link into the article, and an article page draws none of the reader's marks until «میز کار» is pressed again (user report, 2026-08-05). Backend: `GET /highlights/library` (`requirePremium`) in `plus-api/src/routes/highlights.ts`; `GET /highlights/recent` also carries whole-library `total`/`article_count` on every plan. Frontend: `plus/js/highlights.js` (renderer) + `plus/js/highlights-page.js` (gate). Four invariants: **a highlight row is a card, never a link** (its full text + note are the content of the row; «متنِ مقاله» is one small action among others); **note/label/colour are edited in place** (`hl-view.js`'s `inlineEditor` → `PATCH /highlights/:id`) because review is when you want to fix a note; **every link to an article carries `?dcphl=<highlight_id>`** — `plus.js` then enters study mode and `Workbench.focusHighlight()` scrolls to that mark and pulses it, so you land ON the highlight; and **every filter lives in the URL** (`?q&label&color&folder&sort&view`, written with `replaceState`) so a filtered view survives a refresh and the back button. It also has two views (grouped by article / a flat timeline), label chips with counts, colour-swatch filters, an article jump list, `/`-to-search, copy-one/copy-article/copy-results, and renders incrementally behind an `IntersectionObserver` sentinel (`PAGE_GROUPS`/`PAGE_CARDS`) so a library of thousands does not build thousands of nodes on first paint. What premium buys is the aggregated **view**, never access to the user's own data: the six-row list, each article's own workbench, and `GET /export/highlights` stay on every plan.
- **`plus/js/hl-view.js`** — the shared vocabulary for *any* surface that shows a saved highlight (the library, a collection board, whatever comes next): `hlMark`/`noteBlock`/`labelChip`/`actionBtn`, `foldFa` (search-only ZWNJ + Arabic ی/ک folding — never applied to stored text), `highlightHref` (the `?dcphl=` link), `toast`, `skeleton`, `confirmStrip`, and `inlineEditor`. Before it, the two pages drew the same object two different ways. Add to this module rather than re-implementing a card.
- **Collections** (premium Phase 3; spec §4's `collections`/`collection_items`, provisioned since migration 0001, live since migration 0012's indexes). Unlike a pathway (founder-curated) or a topic archive (auto-grouped by taxonomy), a collection is **entirely the user's own** — any mix of their own highlights and whole pages, no taxonomy coupling. Backend: `plus-api/src/routes/collections.ts` (full CRUD + idempotent item-add, all `requirePremium`). Frontend: `/plus/collections.html` (catalog), `/plus/collection.html?id=` (items, rename, delete), a "کالکشن‌ها" block on the `/plus/` dashboard, and the **"افزودن به کالکشن"** entry points — a dual-target toolbar button in the workbench (selected highlight, or the whole page if none is selected — same pattern as the یادداشت button) and a per-row button on the dashboard's recent-highlights list. All three go through `plus/js/collections.js`'s `openCollectionPicker()`, which also owns the free-tier gate message (shown on click, not a locked page). A **pin is a card, not a link** — same rule as the library, and it carries the same content (the mark, the note, the label) plus its own actions: inline edit, copy, **انتقال** to another board, «متنِ مقاله ›» (`?dcphl=`), and remove. Move needs no endpoint: `openCollectionMove()` adds to the target and then calls the board's own remove, and the add is idempotent at the DB level, so a half-finished move leaves the item in both boards, never lost. The catalog carries search + sort (تازه‌ترین/آخرین افزوده/پرمورد‌ترین/نام) and each board card shows `item_count` + `last_item_at`, which `GET /collections` **derives** (`max(ci.created_at)`) rather than storing — no column, no migration, no write path to keep true. A board page filters by kind (هایلایت/صفحه) and text. Both surfaces share `hl-view.js`; the chooser sheet (`chooserCard`) is one component used by both "add" and "move", and grows a filter box past six boards. Migration **0018** adds a board's own identity (`emoji`/`color`/`description`, all optional — a board with none renders exactly as before) and `collection_items.position`: **NULL means "never arranged"**, so an untouched board still opens newest-first, and `PUT /collections/:id/items/order` writes the **whole** order at once (empty array clears it), which is why there is no half-arranged state and a retry is a no-op. Arranging is a *mode* in the UI (`⇅ چیدمانِ دستی`): it collapses the masonry to one column, hides the filters (↑/↓ over a filtered subset would move an item past cards that aren't on screen) and gives each pin ↑/↓ + «۲ از ۷» — buttons, not drag, because dragging a masonry card is unusable on a phone and invisible to a keyboard.

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

- **API preconnect on every page.** Every HTML page carries
  `<link rel="preconnect" href="https://api.dentcast.ir" crossorigin>` and the
  same for `.org`, at the very top of `<head>`. This is a paid-sponsor
  correctness issue, not a micro-optimisation: the Spot card cannot render
  until `/me` answers (that gate is what makes "premium sees no ads" true, and
  it is **not** to be relaxed), so on the first page of a tab the cold DNS +
  TLS handshake sat directly in front of the sponsor's impression — measured
  2.7–3.0s to first card, against 70–170ms on a refresh. Preconnect moves the
  handshake into HTML parsing instead.
  - Injector: `.github/scripts/inject_preconnect.py` (idempotent; `--check`
    fails if any page is missing it). `tools/build_pillar.py` emits
    `PRECONNECT_SNIPPET`; `tools/episodes_template.html` carries it inline.
  - **`crossorigin` is required and not decoration** — the API is called with
    credentials, and a connection opened in anonymous mode is not reused for a
    credentialed CORS request, so dropping it silently undoes the whole thing.
  - Both hosts are listed on every page on purpose: the two codebases are
    mirrors and per-domain logic is forbidden. The unused socket is idle and
    the browser drops it.

- **E-NAMAD trust seal (نماد اعتماد الکترونیکی) — three placements, dentcast.ir only.** The seal lives on exactly three surfaces and is **not** a per-page element: `index.html`'s `<footer>` (mobile shell), `index.html`'s `.dcd-a-seal` row in the col-A sidebar (desktop shell, where that footer is `display:none`), and `about.html`'s `.dc-trustseal-box` under the contact card. Do **not** clone it onto content pages — every copy is a request to enamad's server for zero trust value on an article page.
  - **This is the one deliberate exception to "no per-domain logic".** The seal is issued for a single domain (ours: `dentcast.ir`) and `trustseal.enamad.ir/logo.aspx` renders from the request's referrer, so on the `.org` mirror it answers with an *invalid seal* image. Two layers gate it: an inline `<head>` guard in both pages sets `dc-no-seal` on `<html>` off `.ir` (hides it before the body parses, no flash), and a block at the end of `dc-nav.js` removes the node outright. The images are `loading="lazy"` and both seals sit below the fold, so on `.org` the request normally never fires.
  - **The `<a>`/`<img>` attributes enamad verifies are copied verbatim and never rewritten** — `referrerpolicy='origin'`, `id`, `Code`, and the `code` attribute on the `<img>`. Only `alt`, `loading` and the wrapper are ours. The markup ships **statically in the HTML** (never JS-injected) so enamad's own crawler reads it.
  - Styling is `.dc-trustseal` in `dc-theme.css`, mirrored into `index.html`'s inline `<style>` (index loads no shared CSS). The chip is white in **both** themes on purpose — the seal artwork assumes a light background — and its box is fixed-size so nothing shifts when the image lands.
  - The desktop shell's reader strips `.dc-trustseal` along with the rest of the page chrome (`index.html`, chrome-removal selector list): `dc-nav.js` is stripped from that document, so a seal inside the iframe would escape the host gate.
