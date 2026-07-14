# DentCast Plus — Technical Spec (FINAL)


Binding input document for implementation with Claude Code. Product design is closed. This spec covers irreversible decisions (schema, boundaries, architecture) plus the agreed UI/UX behavior. Reversible details (exact copy, colors, spacing) are decided during implementation within the rules below.


**Revision note (this version):** the Leitner boundary was re-cut. Highlights, their card form, the per-topic card archive, the dashboard navigation tree, manual review and export are **free**. The *scheduling engine* (boxes, intervals, due queue, forgetting memory) is **premium**. Section 4 now contains the actual SQL, which was missing from the previous file. Sections 1, 2.4, 2.6, 2.8, 4, 6, 7, 8, 9 changed.


---


## 0. Naming


The whole learning layer: **DentCast Plus** (the addition on top of DentCast).
Plans inside Plus: **Free** and **Premium**.


---


## 1. Product boundary (final)


**Positioning:** DentCast's moat is a large, growing, hard-to-read body of content (500+ pages and audio episodes). Free gives every tool for handling the volume yourself. Premium sells help handling the volume. Every new published article automatically increases Premium's value.


### Free (self-handled layer)


- **Workbench (میز کار):** focused study mode on any article. Unlimited highlights, underlines, cloze markers, notes, labels. No caps, no meters. (The energy mechanic from earlier concept drafts is REMOVED; it must not appear anywhere in UI or code. Any visual mockup showing "انرژی" predates this decision — ignore that element.)
- **Card archive:** every highlight exists in card form from the moment it is created. From each topic/category landing page the user reaches that topic's card archive and can read through their own cards manually, in any order, at any time. Manual review counts for the streak.
- **Dashboard navigation tree:** the site taxonomy as a tree, with the user's highlight count per branch, linking into each topic's archive. **Navigation only.** It must not aggregate highlights across articles and must not reorder or select them (that is the premium thematic view).
- **Export my highlights** (full data, any time, any plan).
- Streak, personal progress, personal stats and records.
- Completion map (view of territories and personal gaps). Free deliberately: the map shows the pain; Premium sells the cure (pathways).
- Anonymous percentile stats; pseudonymous leaderboard (events recorded from day one, UI dormant until population justifies it).


### Premium (volume-handling layer)


- **Scheduled Leitner review:** boxes, intervals (1/3/7/14/30), `next_review_at`, the daily due queue, self-grading, and the persistent memory of what the user forgot. The free user can always *read* their cards; the premium user is *told which ones, today*. What is sold is scheduling and memory, never access.
- **Learning pathways:** founder-curated ordered routes with milestones; living (new publications extend them).
- **Thematic retrieval views:** "all my highlights about resin cements," aggregated across every article they appear in, derived from the tag/cluster taxonomy. Plus user-made collections.
- **Monthly review report.**
- Later: AI assistant (narrow recommendation over the platform's own structured data, via Arvan's OpenAI-compatible API, key server-side).
- Later: quizzes (milestone checkpoints) and pathway-completion certificates (verification code, shareable).


### Non-negotiable principles


1. All content stays free and publicly accessible forever. No paywall, no metered reading. Anonymous visitors see the site exactly as today (progressive enhancement; SEO untouched).
2. **User-generated data is never gated.** Highlights, notes, cloze and labels are always visible in place, always browsable through the free archive, always exportable, on every plan. Premium gates *selection and scheduling over that data*, never the data itself and never access to it. Ownership is the user's; scheduling is ours.
3. Rewards and goals tie to completion events (articles finished, highlights created, cards reviewed, streak days), never to raw time. Time-on-page appears only as an informational stat (e.g. in the monthly report), never as a target the user is asked to hit. A presence/minutes-based streak was reconsidered and rejected again.
4. Launch as visible "open beta"; early users get grandfathered founding-member benefits when Premium activates.


---


## 2. UI/UX behavior (agreed)


### 2.1 Design direction


The dashboard, map, archive, review, and other /plus pages may have their own visual identity (dark, card-based; the hexagonal territory map is the approved visual concept for the completion map).


The **workbench**, however, lives inside existing article pages and MUST inherit the site's current typography and visual language. It is a mode of the article page, not a foreign skin.


Mobile-first responsive web, then desktop/tablet refinement. Ship as a PWA (installable, home-screen icon, standalone display). No native app.


RTL Persian. Plain, direct, non-flowery microcopy. No em dashes in Persian copy.


### 2.2 Workbench = same URL, mode toggle (not a separate page)


The article renders once, at its existing public URL. A "میز کار" button toggles study mode: JS adds a mode class; toolbar and panels appear. No `/plus/read/*` duplicate routes (single render source, safe highlight anchoring, shareable links stay one URL).


Study mode is opt-in, never automatic, and the last choice is remembered per session (a logged-in user landing from Google gets the normal page with the button visible).


**Study mode layout:**


- Sticky toolbar: tool select (highlighter colors, underline, cloze), label picker (important / unclear / clinical_pearl), note trigger, exit toggle.
- Table of contents generated client-side from the article's h2/h3: sidebar on desktop, bottom-sheet behind a button on mobile; each entry can show the user's highlight count for that section; tap = jump.
- Notes: bottom drawer on mobile; on desktop a margin column beside the text, each note sitting opposite its highlight.
- Anchoring: TextQuoteSelector (exact + prefix + suffix) with re-anchoring on load; on anchoring failure, show the highlight in a sidebar list instead of silently dropping it.


### 2.3 Login funnel (exactly two invitation points, no more)


1. The workbench button on every article, visible to anonymous visitors too. Anonymous click → a small invitation (one sentence: highlights, notes, and progress tracking, free) → OTP login → return to the same article with study mode already active (the login flow must carry the return destination). Never dump the user on the homepage or dashboard after this flow.
2. The homepage personal card (currently the "یادگیری هفتگی شما" slot) — see 2.4.


No other promotional surfaces on the content site.


### 2.4 Homepage personal card (two states)


**Anonymous:** a quiet invitation card, one sentence + login button.


**Logged-in, free:** daily status bar — streak flame + count; one line pointing back into the user's own material ("ادامه خواندن" if an article is in progress, otherwise the total highlight count linking to the dashboard tree, e.g. "۵۳۲ هایلایت شما"); and a single quiet premium line ("مسیر یادگیری" / scheduled review teaser). Each element links to its destination.


**Logged-in, premium:** the same, plus today's due-card count ("N کارت برای مرور") linking to the review session.


The due-card counter is **premium-only**. It must never render as a zero or a locked stub for free users: a permanently empty counter is exactly the false-sense-of-loss failure that killed the gray streak flame for guests.


This card replaces the current minutes-based weekly-goal widget. The old widget's local-storage presence counter is retired; the Plus card is server-sourced (activity log). No minutes target anywhere (see principle 3).


### 2.5 Header (redesign)


Rule: the header holds only what shows the user's personal state or is needed at any moment. Navigation between sections goes into the hamburger.


- Stays in the header: logo (home), podcast (core identity, must be reachable from everywhere), streak flame, person/avatar icon, hamburger.
- Moves into the hamburger: music, articles, and the other section links currently sitting in the header.
- Streak flame: shown ONLY to logged-in users (a gray/zero flame means nothing to a guest and manufactures a false sense of loss). Visible on ALL pages, not just the dashboard; links to /plus.
- Person icon: guest → a plain person icon labeled "ورود" that opens the login modal. Logged-in → the user's avatar (first letter of their pseudonym), opening a small menu: پیشخوان / پروفایل / خروج.
- Mobile: drop the circular icon frames if space gets tight; never sacrifice the hamburger.


### 2.6 Dashboard (/plus)


Content:


- Streak detail (chain, personal record).
- **Navigation tree** into the user's card archive: the site taxonomy, highlight count per branch, each branch linking to that topic's landing-page archive. This is the free user's way into their own material and the reason the dashboard is worth opening without a due queue.
- "Continue where you were" (last article in progress).
- Recent highlights.
- Per-cluster progress.
- Anonymous percentile stats.
- Visibly locked Premium tiles: مرور زمان‌بندی‌شده، مسیرهای یادگیری، نماهای موضوعی، گزارش ماهانه، دستیار هوشمند ("به زودی"). The free user should see what exists without anything being taken away.
- For premium users only: today's due-card queue block.


The leaderboard section is built into the layout but stays dormant.


Post-login default destination ONLY when the user logged in outside the workbench flow (direct visit / header). Never force-redirect someone out of content.


This is the PWA start URL.


### 2.7 Profile page


Reached from the header avatar menu or the dashboard. Contains: pseudonym (editable), plan (Free / Premium, with the open-beta note), week streak strip, personal records, month-vs-month comparison ("competition with yourself, not others"), phone, Telegram link status, reminder settings, **export my highlights** (the concrete embodiment of principle 2), logout.


### 2.8 Card archive (free) — topic landing pages


Each topic/category landing page carries an entry point ("کارت‌های شما") into the user's cards for that topic. The archive lists the user's highlights for the topic's content in card form: highlight text, cloze blanks revealable on tap, note, label, link back to the source article at the exact anchor.


The user may read through them manually, one by one, in any order. A manual pass logs `card_reviewed_manual` and counts for the streak.


**Hard rule:** manual review must NOT mutate `card_state.box` or `card_state.next_review_at`. If it does, the free tier silently becomes Leitner and the premium boundary disappears.


The archive is **per topic**. It does not aggregate across topics and offers no scheduling, no ordering, and no "what should I review today." That is deliberate: access without aggregation. Cross-article thematic aggregation is the premium retrieval view (Phase 3).


### 2.9 Tree and map are one structure


The dashboard navigation tree (2.6) and the hexagonal completion map (Phase 3) are two views over the same taxonomy: one shows where the user has highlighted, the other shows where the user has read. They must share a single client-side model of the content index (clusters, tags, slugs), with highlight counts and progress states as separate layers over it. Do not build them as two independent features; Phase 3 would then require a rewrite.


---


## 3. Architecture


**Hard constraint:** the entire runtime path must work on Iran's domestic/national internet. No foreign BaaS at runtime.


**Frontend:** the existing static site, unchanged, dual-deployed from one GitHub repo via GitHub Actions (Cloudflare Pages → dentcast.org; ArvanCloud → dentcast.ir). The Plus layer is client-side JS (progressive enhancement).


**API base with failover:** client tries the primary API host, falls back automatically to the secondary (health-checked base URL list; final hostnames at deploy).


**Backend:** one small TypeScript Node API on ArvanCloud Cloud Container + ArvanCloud Managed Database (PostgreSQL). PaaS, not a raw VPS. ArvanCloud Object Storage serves the .ir static files and holds the second backup copy; ArvanCloud AIaaS is used later for the assistant. All secrets (SMS, Telegram bot, later gateway + AI) server-side only. The database must not be publicly reachable; only the API container connects to it.


**Auth:** SMS OTP primary. The SMS provider is NOT fixed; pick whichever Iranian provider grants a service line + OTP pattern fastest (sms.ir, Kavenegar, etc.). The sender sits behind a provider-agnostic interface, so switching providers is a ~10-line change. Plus a Telegram bot as OTP fallback (Iranian SMS lines can be suspended without warning) and as the notification channel (bot: /start → contact share → match phone → store telegram_id). Sessions: httpOnly cookie; OTP rate limits per phone and per IP.


**Notifications:** provider-agnostic interface (`send(userId, message, kind)`); Telegram first implementation; SMS reserved for OTP; in-site indicators always.


**Backups:** automated daily Postgres dumps to a second, independent S3-compatible storage.


**Dev:** everything local-first (Postgres in Docker; OTP printed to console; Telegram provider stubbed). Server accounts needed only at deploy.
---


## 4. Database schema (PostgreSQL)


`content_id` = page slug (SEO-frozen, canonical). `user_activity.content_id` is nullable. Streak fields on `profiles` are caches; the append-only `user_activity` log is the source of truth and every cache must be reconstructable from it. **No energy fields.**


`card_state` rows are created for **every** highlight on **every** plan, so that a later upgrade needs no migration and no backfill. Only the premium scheduling engine writes to `box` and `next_review_at`.


```sql
create extension if not exists "pgcrypto";


-- users
create table profiles (
  id              uuid primary key default gen_random_uuid(),
  phone           text unique not null,
  telegram_id     bigint unique,
  display_name    text not null,
  tier            text not null default 'free',
  current_streak  int  not null default 0,
  longest_streak  int  not null default 0,
  last_active_day date,
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);


-- append-only event log: source of truth for everything
create table user_activity (
  id          bigserial primary key,
  user_id     uuid not null references profiles(id) on delete cascade,
  action      text not null,
  content_id  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on user_activity (user_id, created_at desc);
create index on user_activity (action, created_at desc);
create index on user_activity (content_id);


-- highlights (a "card" is a highlight; there is no separate card entity)
create table highlights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  content_id    text not null,
  exact         text not null,
  prefix        text,
  suffix        text,
  color         text,
  underline     boolean not null default false,
  cloze_markers jsonb not null default '[]'::jsonb,
  note          text,
  label         text,
  content_hash  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on highlights (user_id, content_id);
create index on highlights (user_id, created_at desc);


-- leitner state: created with every highlight, written only by the premium engine
create table card_state (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  highlight_id   uuid not null references highlights(id) on delete cascade,
  box            int  not null default 1,
  next_review_at timestamptz,
  last_result    text,
  reviewed_count int  not null default 0,
  updated_at     timestamptz not null default now(),
  unique (user_id, highlight_id)
);
create index on card_state (user_id, next_review_at);


-- premium: user-made collections
create table collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);


create table collection_items (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  highlight_id  uuid references highlights(id) on delete cascade,
  content_id    text,
  created_at    timestamptz not null default now()
);


-- premium: pathway enrollment (definitions live in static JSON, not here)
create table user_pathways (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  pathway_id   text not null,
  current_step int  not null default 0,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, pathway_id)
);


-- created empty from day one so payment can be switched on without migration
create table subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  status     text not null,
  plan       text not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  is_founder boolean not null default false
);


create table payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  amount_rial bigint not null,
  gateway     text,
  ref_id      text,
  status      text not null,
  created_at  timestamptz not null default now()
);


create table certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  pathway_id  text not null,
  verify_code text unique not null,
  issued_at   timestamptz not null default now()
);


-- identity-free demand signal
create table anon_events (
  id         bigserial primary key,
  event      text not null,
  content_id text,
  created_at timestamptz not null default now()
);
create index on anon_events (event, created_at desc);
```


Column notes: `profiles.display_name` is a generated pseudonym by default; `profiles.tier` is `'free' | 'premium'`; `last_active_day` is an Asia/Tehran day and a cache. `user_activity.action` is an open vocabulary, deliberately NOT an enum. `highlights.cloze_markers` holds offset pairs within `exact`; `highlights.label` is `'important' | 'unclear' | 'clinical_pearl'`; `content_hash` records the provenance of the source text at capture time. `card_state.box` is 1..5, `next_review_at` stays null until the premium engine schedules it, `last_result` is `'remembered' | 'forgot'`, and `reviewed_count` counts scheduled reviews only. `user_pathways.pathway_id` is a key from `pathways.json`. `subscriptions.is_founder` carries grandfathering.


**Streak logic.** A day counts if the user performed at least one qualifying action. The qualifying set (configurable, but initially):


- `article_completed`
- `highlight_created`
- `card_reviewed_manual` (free path)
- `review_finished` (premium scheduled session)


On each qualifying event, update the profile caches transactionally and append a `streak_kept` event when a new day is counted. Day boundary: **Asia/Tehran**. A rebuild script must recompute all caches from `user_activity` alone.


---


## 5. Static JSON in the repo (versioned, no DB)


`pathways.json`:


```json
[{ "id": "...", "title_fa": "...", "description_fa": "...", "premium": true,
   "steps": [{ "content_id": "...", "milestone": true }], "reserved": {} }]
```


v1 strictly linear; `reserved` allows future conditional logic without a format break. Pathways are living lists: republishing content extends them, and that is the core premium value proposition.


`curated_cards.json` (optional, later); quiz definitions (later) follow the same pattern.


The existing content index (`dentcast.json` / tags / clusters) is the source for the dashboard tree, the map, and the retrieval views. Before the map phase, run a data-health audit of tags/clusters; map and pathway quality is capped by taxonomy quality.


---


## 6. API surface (Phase 1)


JSON over HTTPS; session cookie auth except OTP endpoints. A `requirePremium` middleware exists from day one (clean 402-style response). Phase 1 ships no premium endpoint, but Phase 2's review endpoints go behind it from their first commit.


- `POST /auth/otp/request { phone }` — rate-limited (dev: console).
- `POST /auth/otp/verify { phone, code, return_to? }` — creates profile on first login (generated pseudonym); returns session + the return destination for the client to honor.
- `POST /auth/telegram/link` — via bot webhook (contact share → match phone → set telegram_id).
- `GET /me` — profile, tier, streak, active pathway summary, and (premium only) due-card count. For free users the due-card field is absent, not zero.
- `POST /activity { action, content_id?, meta? }` — append event (permissive action validation, not a closed enum). Accepts `card_reviewed_manual`, which counts for the streak and MUST NOT touch `card_state`.
- `POST /anon/event { event, content_id? }` — unauthenticated, heavily rate-limited; only whitelisted events (`workbench_button_anon_click`).
- `GET/POST/PATCH/DELETE /highlights` — CRUD; creating a highlight also creates its `card_state` row (box 1, `next_review_at` null) and logs the event. `GET /highlights?content_id=` returns one article's highlights; `GET /highlights?topic=` returns the topic archive (2.8).
- `GET /tree` — the user's highlight counts per taxonomy branch, for the dashboard tree. Counts and links only; no highlight bodies, no cross-article aggregation.
- `GET /progress` — per-content completion states + personal stats.
- `GET /export/highlights` — full dump of the user's own data (any plan).


**Phase 2** adds `GET /review/due` and `POST /review/answer`, both behind `requirePremium`.
**Phase 3** adds pathway / report / map / thematic-view endpoints, with `requirePremium` where applicable (map: free; thematic views and pathways: premium).


---


## 7. KPIs (from day one)


Computed from `user_activity` + `anon_events`; shown on a founder-only admin page.


1. **Anonymous demand:** workbench-button clicks by non-logged-in visitors, and the % of those that convert to login within the same flow.
2. **Activation:** % of new signups creating their first highlight within 48h.
3. **D1 return:** % returning the next day for any qualifying action (read, highlight, or review). Deliberately not review-only, since free users have no scheduled review.
4. **D7 streak survival**, split by tier. If free-tier D7 collapses toward zero, the free loop is not producing a returning population and the boundary needs re-cutting; that is the whole point of measuring it separately.
5. **Depth:** median highlights per active user per week.
6. **Archive usage:** manual card-archive sessions per free user per week. The best available free-side predictor of willingness to pay for scheduled review.
7. (Post-launch) pathway starts/completions; free→premium conversion.


---


## 8. Build phases


- **Phase 1 (local-first):** OTP auth + Telegram linking + workbench mode + highlights + **card archive on topic landing pages** + **dashboard navigation tree** + manual review + activity log + streak + header changes + homepage card + /plus dashboard + profile page + admin KPIs. Deploy at phase end (Arvan Cloud Container + Managed Postgres + api subdomain + backup job + PWA manifest).
- **Phase 2:** scheduled Leitner engine (boxes, intervals, due queue, self-grading) behind `requirePremium` + Telegram reminders (provider-agnostic layer).
- **Phase 3:** completion map (free, hex-territory concept, sharing the Phase 1 taxonomy model) + pathways (premium) + thematic retrieval views (premium) + collections + monthly report + percentile stats.
- **Phase 4:** payment gateway (Zarinpal-class) + subscriptions + founding-member grandfathering + premium enforcement.
- **Phase 5:** AI assistant (server-side proxy, pre-filtered context); quizzes; certificates.


---


## 9. Phase 1 prompt for Claude Code


*Copy from here down into Claude Code, run from the repo root.*


You are implementing Phase 1 of "DentCast Plus", a learning layer on top of an existing static Persian dental-education site (this repo). Read `dentcast-plus-technical-spec-final.md` in full before writing any code; it is the binding spec. Do not deviate from the schema, the free/premium boundary, or the UI/UX rules in section 2. There is NO energy mechanic anywhere.


**Context you must respect:**


- The site is static HTML deployed from this repo (Cloudflare Pages + ArvanCloud). Do NOT change the existing build, URLs, or SEO-relevant markup. The Plus layer is progressive enhancement: anonymous visitors must see the site exactly as today, except the two invitation points defined in spec section 2.3.
- Everything runs locally first: PostgreSQL via docker-compose; OTP codes printed to console in dev; Telegram provider stubbed behind an interface.
- The backend is a new small TypeScript Node API (minimal, well-maintained framework) in a separated directory (e.g. `/plus-api`) with its own README, `.env.example`, and migrations implementing EXACTLY the SQL schema from spec section 4 (use a migration tool).
- `content_id` is the page slug, detected client-side from the canonical URL.
- RTL Persian UI. The workbench inherits the site's existing typography and visual language (spec 2.1). The /plus pages may use the darker card-based Plus identity. No em dashes in Persian copy; plain, direct, non-flowery microcopy.
- Mobile-first responsive; ship the PWA manifest + service worker (app shell only, no offline content claims) with /plus as start URL.
- **The free/premium line in Phase 1:** highlights, their card form, the per-topic card archive, the dashboard tree, manual review, and export are FREE. The Leitner scheduling engine is PREMIUM and is NOT built in this phase. Wire `requirePremium` now; ship no premium endpoint.


**Deliverables:**


1. docker-compose + migrations + seed script.
2. API endpoints exactly as in spec section 6, with OTP rate limiting, httpOnly session, `requirePremium` middleware (wired, unused), and the unauthenticated rate-limited `/anon/event` endpoint.
3. Streak engine per spec section 4 (Asia/Tehran day boundary, qualifying actions including `card_reviewed_manual`, profile caches, `streak_kept` events, rebuild script).
4. Workbench as a mode toggle on existing article pages (spec 2.2): "میز کار" button (visible to anonymous users; anonymous click logs `workbench_button_anon_click`, shows the one-sentence invitation, and enters the OTP flow carrying `return_to`); on login, return to the same article with study mode active. Study mode: sticky toolbar (highlighter colors, underline, cloze, labels important/unclear/clinical_pearl, note trigger, exit), client-generated TOC from h2/h3 (desktop sidebar, mobile bottom sheet, per-section highlight counts), notes (mobile bottom drawer, desktop margin column), TextQuoteSelector anchoring with re-anchor on load and a sidebar fallback list for failed anchors. Mode choice remembered per session; never auto-enter.
5. **Card archive per spec 2.8:** entry point on each topic/category landing page into the user's cards for that topic; card view with revealable cloze blanks, note, label, and a link back to the source anchor; manual pass logs `card_reviewed_manual`. It MUST NOT mutate `card_state.box` or `card_state.next_review_at`. Creating a highlight still creates its `card_state` row (box 1, `next_review_at` null).
6. **Dashboard navigation tree per spec 2.6 and 2.9:** taxonomy tree with per-branch highlight counts linking into the topic archives. Build it on a single reusable client-side model of the content index (clusters/tags/slugs), because the Phase 3 hex completion map will render from the same model with a different data layer. No cross-article aggregation (that is the premium thematic view).
7. Header rework per spec 2.5: keep logo, podcast, streak flame (logged-in only), person/avatar, hamburger; move music and article links into the hamburger. Person icon = login modal for guests ("ورود"), avatar menu (پیشخوان / پروفایل / خروج) for logged-in users. Login is a MODAL, never a page.
8. Homepage personal card in the existing "یادگیری هفتگی" slot with the states in spec 2.4: anonymous invitation; logged-in free daily status (streak + a line back into the user's own material + one quiet premium line). NO due-card counter for free users, not even as a zero or a locked stub. Remove the minutes-based weekly goal and its local-storage counter. No minutes targets anywhere.
9. /plus dashboard (spec 2.6): streak detail, navigation tree, continue-where-you-were, recent highlights, per-cluster progress placeholder, and visibly locked Premium tiles (مرور زمان‌بندی‌شده، مسیرهای یادگیری، نماهای موضوعی، گزارش ماهانه، دستیار هوشمند "به زودی"). Post-login default destination only outside the workbench flow.
10. Profile page per spec 2.7 (pseudonym, plan, week streak strip, records, month-vs-month, phone, Telegram link, reminders, export my highlights, logout).
11. Founder-only admin page (basic auth) with KPIs 1-6 from spec section 7.
12. Tests: OTP flow (incl. rate limits), highlight CRUD + anchoring round-trip, streak day-boundary edges (23:59 Tehran), streak counting for `card_reviewed_manual`, **a test asserting that manual review does not modify `card_state`**, cache rebuild script, anon event rate limiting.


**Deployment target** (end of phase, not before): ArvanCloud Cloud Container for the API + ArvanCloud Managed Database (Postgres). Keep all provider-specific config in env vars; the SMS sender and the notification sender must both sit behind interfaces so providers can be swapped without touching business logic.


Work in small commits. After each milestone (migrations, auth, highlights+workbench, archive+tree, streak, dashboard+card, admin), stop and show me what to manually verify before continuing.
