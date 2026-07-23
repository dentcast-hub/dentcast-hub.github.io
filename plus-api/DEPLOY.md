# DentCast Plus — Production Deploy Guide

Going live has **two independent halves**:

1. **Static site** (frontend + Plus JS) — already automated: push to `main` →
   ArvanCloud (`.ir`) via `.github/workflows/deploy-arvan.yml`, and Cloudflare
   Pages → `.org`. Plus is progressive enhancement, so this is safe to ship
   even before the API exists (anonymous visitors see today's site unchanged).
2. **Plus API + database** — NOT automated yet. This guide covers it.

**Order (agreed): API first, frontend last.** Bring the API + DB up and verify a
real OTP login, then merge `plus-phase-1` → `main` so the site's login button
works from the first minute it's live.

---

## 0. What you (the founder) must provide

These need your accounts/secrets — they cannot be done from the repo:

- An **ArvanCloud** account with **Cloud Container** + **Managed Database
  (PostgreSQL)** enabled.
- An **SMS.ir** account with an approved **OTP template** (قالب).
- DNS control for `dentcast.org` / `dentcast.ir` (to add the `api.*` subdomain).

---

## 1. Generate the production secrets (local, one-time)

```bash
# Session cookie signing secret (64 hex chars):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Web Push (VAPID) keypair — public key is safe to expose, private stays secret:
npx web-push generate-vapid-keys
```

Keep these; they go into the container env in step 4.

---

## 2. SMS.ir (real OTP)

1. In the SMS.ir panel create a **verification template** (قالب کد تأیید) with a
   **single parameter** carrying the code. Note:
   - the **numeric template id** → `SMSIR_TEMPLATE_ID`
   - the **parameter name** (e.g. `CODE`) → `SMSIR_PARAM_NAME` (default `CODE`)
2. Copy your **API key** → `SMSIR_API_KEY`.
3. The code path is already implemented (`src/providers/sms/smsir.ts`, selected
   by `SMS_PROVIDER=smsir`). It POSTs to `https://api.sms.ir/v1/send/verify`.

> Test the template once from the SMS.ir panel before wiring it up, so you know
> the parameter name and that the line is approved for OTP.

---

## 3. Provision the Managed Postgres

1. Create an ArvanCloud **Managed PostgreSQL** instance (v16 to match dev).
2. Put it on the **private network** with the container — the DB must **not** be
   publicly reachable (only the API connects to it).
3. Copy its connection string → `DATABASE_URL`
   (`postgres://USER:PASS@PRIVATE_HOST:5432/DBNAME`).

Migrations run automatically on container start (the image's entrypoint runs
`npm run migrate` before `node dist/index.js`), so no manual schema step.

---

## 4. Deploy the API container

The image is defined in `plus-api/Dockerfile`. **Build context = repo root**
(the image bakes in `plus/content-index.json` for the dashboard tree):

```bash
# from the repo root:
docker build -f plus-api/Dockerfile -t dentcast-plus-api .
```

Push it to ArvanCloud's container registry (or point Arvan Cloud Container at
this repo + Dockerfile path and let it build). Then set these **environment
variables** on the container:

| Var | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (managed Postgres, private host) |
| `PORT` | `8787` |
| `HOST` | `0.0.0.0` |
| `CORS_ORIGINS` | `https://dentcast.org,https://www.dentcast.org,https://dentcast.ir,https://www.dentcast.ir` |
| `SESSION_SECRET` | (from step 1) |
| `SESSION_COOKIE_SECURE` | `true` |
| `SESSION_COOKIE_NAME` | `dcp_session` |
| `SESSION_TTL_DAYS` | `30` |
| `SMS_PROVIDER` | `smsir` |
| `SMSIR_API_KEY` | (from step 2) |
| `SMSIR_TEMPLATE_ID` | (from step 2) |
| `SMSIR_PARAM_NAME` | `CODE` (or your template's param) |
| `NOTIFY_PROVIDER` | `webpush` |
| `VAPID_PUBLIC_KEY` | (from step 1) |
| `VAPID_PRIVATE_KEY` | (from step 1) |
| `VAPID_SUBJECT` | `mailto:foad.shahabian@gmail.com` |
| `ADMIN_USER` | `founder` |
| `ADMIN_PASSWORD` | (a strong secret) |
| `STREAK_TIMEZONE` | `Asia/Tehran` |
| `CONTENT_INDEX_PATH` | leave unset — baked into the image at `/app/content-index.json` |

> `CONTENT_INDEX_PATH` is already defaulted by the Dockerfile. It is baked in at
> build time, so **rebuild/redeploy the API image whenever new content ships**
> if you want the dashboard tree to include the newest articles.

---

## 5. The `api.*` subdomain (DNS + TLS)

The client reaches the API via the health-checked base list in
`plus/js/config.js` → `defaultBases()`:

```js
return ['https://api.dentcast.org', 'https://api.dentcast.ir'];
```

1. Point `api.dentcast.org` and `api.dentcast.ir` (DNS) at the ArvanCloud
   container's public endpoint / load balancer.
2. Ensure valid **HTTPS/TLS** on both (Arvan can terminate TLS).
3. If you use different hostnames, update `defaultBases()` accordingly before
   the frontend merge (step 7). Otherwise leave it as-is.

---

## 5b. Telegram login (dentcast.org AND dentcast.ir)

"Login with Telegram" runs on BOTH sites (alongside phone OTP). A Telegram bot's
`/setdomain` is bound to exactly ONE domain, so each site uses its OWN bot:

| Site | Bot | `/setdomain` | Token env var |
|---|---|---|---|
| dentcast.org | `@Dentcast_bot` | `dentcast.org` | `TELEGRAM_BOT_TOKEN` |
| dentcast.ir  | `@Dentcast_irbot` | `dentcast.ir` | `TELEGRAM_BOT_TOKEN_IR` |

The Telegram **user id is global** (identical across bots), so a person who signs
in on both sites is ONE account. The single API container serves both `api.` hosts
and the callback accepts a payload signed by **either** bot.

1. **BotFather** — for each bot run `/setdomain` and set the bare domain (no
   scheme/path): `@Dentcast_bot` → `dentcast.org`, `@Dentcast_irbot` → `dentcast.ir`.
   The widget only renders on a page whose domain matches its bot's setdomain. (The
   redirect target — the API callback — may live on the `api.` subdomain; only the
   *embedding* page's domain is checked.)
2. **Container env** — set BOTH `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_TOKEN_IR`
   (one container, both api hosts). With neither set the callback sends users to
   `/plus/auth-error.html?reason=not_configured`. Optional:
   `TELEGRAM_AUTH_MAX_AGE_SECONDS` (default `86400` = reject payloads older than 24h).
3. **Frontend** — the bot usernames are public and set in `plus/js/config.js`
   (`Dentcast_bot` / `Dentcast_irbot`); `telegramBotUsername()` picks by host and
   `telegramLoginEnabled()` shows the widget on both `.org` and `.ir`.
4. **HTTPS** — the widget requires the embedding page over HTTPS and a valid-TLS
   callback (`https://api.dentcast.{org,ir}/auth/telegram/callback`), covered by step 5.

Note (future): the notification sender currently uses only `TELEGRAM_BOT_TOKEN`, so a
bot can message only users who authorized IT. Per-bot notification delivery for
`.ir`-only users is a later task.

Verify on each site: open the login modal → the Telegram button renders → authorize
→ you land back logged in (session cookie set); a first-time user is prompted for a
nickname (the leaderboard name).

## 6. Daily backup

Schedule a daily `pg_dump` of the managed Postgres to a **second, independent**
S3-compatible store (ArvanCloud Object Storage), per the spec — separate from
the primary DB so a loss of one doesn't take the backup with it.

---

## 7. Verify, then ship the frontend

**Verify the API first:**

- [ ] `curl https://api.dentcast.org/health` → `200`
- [ ] Request an OTP from the live site → a real SMS arrives via SMS.ir
- [ ] Enter the code → logged in, session cookie set (Secure, httpOnly)
- [ ] Create a highlight + an article note → survives reload
- [ ] `/admin` KPIs load behind Basic auth

**Then ship the frontend:**

```bash
git checkout main
git merge plus-phase-1
git push        # → Cloudflare Pages (.org) + Arvan deploy workflow (.ir)
```

From here the login button on the live site is backed by the running API.

---

## Rollback

- **Frontend:** revert the merge commit on `main` and push — Plus disappears,
  the static site is untouched (progressive enhancement).
- **API:** redeploy the previous container image tag. Migrations are additive
  (`0001`–`0003`); avoid `migrate:down` in production unless you know a specific
  migration must be reversed.
