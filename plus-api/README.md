# DentCast Plus API (Phase 1)

Small TypeScript Node API for the DentCast Plus learning layer. It is a separate
service from the static site; the site talks to it over HTTPS as progressive
enhancement. Anonymous visitors never need it.

Phase 1 scope: SMS/Telegram OTP auth, highlights + card archive, activity log,
the Asia/Tehran streak engine, the dashboard navigation tree, and founder KPIs.
The Leitner scheduling engine is **premium** and is **not** built in this phase;
`requirePremium` is wired but no premium endpoint ships.

## Stack

- **Fastify** (HTTP) + **pg** (node-postgres), no ORM.
- **PostgreSQL 16** in Docker for local dev.
- **node-pg-migrate** for migrations (`migrations/0001_init.cjs` is the exact
  schema from spec section 4; do not edit its shape).
- **Vitest** for tests.

Providers sit behind interfaces so they can be swapped by changing one env var:
the **SMS sender** (`SMS_PROVIDER`, `console` in dev) and the **notification
sender** (`NOTIFY_PROVIDER`, Telegram-first, `stub` in dev). Business logic never
imports a provider directly.

## Prerequisites

- Node >= 20 (tested on 24)
- Docker + Docker Compose

## Local setup

```bash
cd plus-api
cp .env.example .env          # dev defaults work as-is
npm install
docker compose up -d          # Postgres on localhost:5432
npm run migrate               # apply migrations
npm run seed                  # optional: demo users + highlights
npm run dev                   # API on http://localhost:8787
```

`npm run seed` creates two demo users (a free `09120000001` and a premium
`09120000002`) with highlights and card_state rows. In dev, OTP codes are
**printed to the API console**, so you log in with the printed code.

## Data model notes

- `card_state` rows are created for **every** highlight on **every** plan. Only
  the future premium engine writes `box` / `next_review_at`. Manual card review
  must never touch them (enforced by test).
- The append-only `user_activity` log is the source of truth. All streak caches
  on `profiles` are reconstructable with `npm run rebuild-streaks`.
- **OTP codes and rate-limit counters are held in-process, not in the DB.** The
  schema is fixed to exactly spec section 4, so no OTP/rate-limit tables are
  added. This is fine for the single Phase 1 container (codes live ~2 min); a
  multi-instance deployment would move these to Redis behind the same interface.

## Scripts

| script | purpose |
| --- | --- |
| `npm run dev` | run the API with reload |
| `npm run migrate` | apply pending migrations |
| `npm run migrate:down` | roll back the last migration |
| `npm run seed` | load demo data (idempotent) |
| `npm run rebuild-streaks` | recompute all streak caches from `user_activity` |
| `npm test` | run the test suite |

The taxonomy index the tree/archive/map share is generated from the repo root
(not npm): `node tools/build_plus_index.mjs` writes `plus/content-index.json`.

## API surface (Phase 1)

Auth: `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/logout`,
`POST /auth/telegram/link`, `GET /auth/telegram/callback`,
`POST /auth/telegram/unlink`, `POST /auth/phone/link`, `POST /auth/bale/connect`,
`POST /auth/bale/unlink`, `POST /webhooks/bale/:secret` (Bale bot webhook),
`GET /me`, `PATCH /me`. Data: `POST /activity`,
`POST /anon/event`, `GET/POST/PATCH/DELETE /highlights`,
`GET /highlights/recent`, `GET /highlights?topic=`, `GET /tree`, `GET /progress`,
`GET /profile/stats`, `GET /export/highlights`. Web push:
`GET /push/public-key`, `POST /push/subscribe`, `POST /push/unsubscribe`. Admin
(HTTP Basic): `GET /admin` (rendered KPI page), `GET /admin/kpis` (JSON),
`POST /admin/articles/published` (the `article_published` event),
`POST /admin/articles/run-free-digest` (manual digest run), and
`POST /admin/articles/backfill` (one-time go-live: record all existing pages as
already-notified). `requirePremium` is wired but no premium endpoint ships in Phase 1.

## New-article notifications

Built in two layers so the rule is written once and channels are swappable
destinations underneath it.

- **Layer 1 — scheduling & selection** (`src/services/article-notify.ts`,
  channel-agnostic). Premium fires immediately on `article_published`
  (`kind=article_premium`). Free gets `notify_free_after = published_at + 24h`;
  a cron at **21:00 Asia/Tehran** (`src/scheduler.ts`) batches every due, unsent
  article into a **single digest** (`kind=article_free_digest`), sends once, and
  marks them sent so they are never re-sent. The free/premium split lives on
  `kind`, not on the channel or the article. The article is public and indexed at
  publish time; the delay is only on the active push (principle 1). Effective free
  delay is **24-48h** — describe it to users as `۱ تا ۲ روز`, never "۲۴ ساعت".
- **Layer 2 — delivery** goes through the provider-agnostic
  `send(userId, message, kind)`. `NOTIFY_PROVIDER` is a comma list that fans out
  to every configured channel: **web push** (`webpush`), **Telegram** (`telegram`,
  chat_id from the login widget), and **Bale** (`bale`, chat_id captured by the
  profile connect + bot webhook — notifications only, no login). A user is
  **skipped quietly** on any channel they have not connected (no push
  subscription, no `telegram_id`, no `bale_id`) — an expected state, never an
  error. Adding a channel is one env-var change; Layer 1 never changes.

**Automated trigger.** The `notify-new-articles` GitHub Action (repo
`.github/workflows/notify-new-articles.yml`) fires this on push to `main`. A page
counts as a real publish only when it is an article type (any folder except
`glossary`/`litecast`), carries the `<meta name="dc-notify" content="true">` marker,
and its canonical `content_id` is new. The Action runs `tools/notify_new_articles.py`
(the file diff only picks candidates; those three gates decide). Repo secrets:
`PLUS_API_BASE`, `PLUS_ADMIN_USER`, `PLUS_ADMIN_PASSWORD`.

**One-time before enabling the Action:** `POST /admin/articles/backfill` so every
already-published page is recorded as notified and an old-article edit never fires
premium. For a single manual announce, `tools/notify_new_article.py` still works.

## Founder admin

`GET /admin` is the founder-only KPI page, behind HTTP Basic auth
(`ADMIN_USER` / `ADMIN_PASSWORD`). It computes KPIs 1-6 from spec section 7
(anonymous demand + approx conversion, 48h activation, D1 return, D7 survival by
tier, weekly depth median, archive-usage sessions) from `user_activity` +
`anon_events`. Navigate to it in a browser; it prompts for the credentials.

## Deploy target (end of phase)

ArvanCloud Cloud Container for the API + ArvanCloud Managed Database (Postgres),
DB not publicly reachable. Set every provider-specific value via env:

- `DATABASE_URL` (managed Postgres, private network only)
- `SESSION_SECRET` (long random), `SESSION_COOKIE_SECURE=true` (HTTPS)
- `CORS_ORIGINS=https://dentcast.org,https://dentcast.ir`
- `SMS_PROVIDER` (swap the console sender for an Iranian provider),
  `NOTIFY_PROVIDER=webpush` (live channel) + `VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (generate once with
  `npx web-push generate-vapid-keys`). Telegram/Bale stay locked until the
  messenger connection ships.
- `ADMIN_USER` / `ADMIN_PASSWORD`
- `CONTENT_INDEX_PATH` pointing at the deployed `content-index.json`

Build + run: `npm ci && npm run build && npm run migrate && node dist/index.js`.
Schedule a daily `pg_dump` to a second, independent S3-compatible store
(ArvanCloud Object Storage) for backups. The static site deploys unchanged from
the repo (Cloudflare Pages → .org, ArvanCloud → .ir); the client reaches the API
at the `api.*` host via the health-checked base list in `plus/js/config.js`
(set the final hostnames there at deploy).

## Environment

See `.env.example` for the full list. Everything provider-specific (DB URL,
SMS, Telegram, admin creds, cookie flags) is an env var so nothing changes in
code between local and the ArvanCloud deploy target.

## Deploy target (end of phase)

ArvanCloud Cloud Container for the API + ArvanCloud Managed Database (Postgres),
DB not publicly reachable. Daily Postgres dumps to a second S3-compatible store.
All provider config stays in env vars.
