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
`POST /auth/telegram/link`, `GET /me`, `PATCH /me`. Data: `POST /activity`,
`POST /anon/event`, `GET/POST/PATCH/DELETE /highlights`,
`GET /highlights/recent`, `GET /highlights?topic=`, `GET /tree`, `GET /progress`,
`GET /profile/stats`, `GET /export/highlights`. Admin (HTTP Basic):
`GET /admin` (rendered KPI page) and `GET /admin/kpis` (JSON). `requirePremium`
is wired but no premium endpoint ships in Phase 1.

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
  `NOTIFY_PROVIDER=telegram` + `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET`
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
