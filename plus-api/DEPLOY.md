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
| `TELEGRAM_BOT_TOKEN` | (from step 5b) |
| `TELEGRAM_WEBHOOK_SECRET` | a long random string, e.g. `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |
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

## 5b. Telegram bot (linking + OTP fallback channel)

The bot lets a user link their Telegram account to their DentCast Plus profile
(`/start` → share own phone via the contact button → `telegram_id` stored on
`profiles`), which is both the notification channel and a resilience fallback
if SMS.ir ever goes down. Requires the `api.*` domain from step 5 to already
be live (Telegram needs a real HTTPS URL to call).

1. In Telegram, talk to **@BotFather** → `/newbot` → follow the prompts → copy
   the token it gives you → `TELEGRAM_BOT_TOKEN`.
2. Generate a random webhook secret (see the table in step 4) →
   `TELEGRAM_WEBHOOK_SECRET`. Set both on the container and redeploy/restart it
   so `routes/telegram.ts` picks them up.
3. Point the bot at the running API (run locally, with the same two env vars
   set, or set them inline for one call):
   ```bash
   cd plus-api
   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
     npm run telegram:set-webhook -- https://api.dentcast.ir/telegram/webhook
   ```
   This calls Telegram's `setWebhook` with that URL and `secret_token`; a
   `{"ok":true, ...}` response confirms it. Telegram will now echo the secret
   back on the `X-Telegram-Bot-Api-Secret-Token` header of every webhook call,
   which is how `routes/telegram.ts` verifies a request actually came from
   Telegram (403 otherwise).
4. Test it: open the bot in Telegram, send `/start`, tap the contact-share
   button. It should reply confirming the link. `select telegram_id from
   profiles where phone = '09...'` should show the Telegram user id.

> `NOTIFY_PROVIDER` still picks a single active delivery channel (`webpush` is
> the production default from step 4). Linking works regardless of which
> channel is active; switching `NOTIFY_PROVIDER=telegram` (or building a
> multi-channel fan-out) is a separate decision, not required for linking to
> work.

---

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
- [ ] Send `/start` to the bot, share contact → reply confirms, `telegram_id`
      is set on that phone's profile row (step 5b)

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
