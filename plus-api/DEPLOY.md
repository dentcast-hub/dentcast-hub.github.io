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
(the image bakes in `plus/content-index.json` for the dashboard tree and
`plus/pathways.json` for the learning pathways):

```bash
# from the repo root. TAG is the registry tag you are about to push (v46, ...).
TAG=v46
docker build -f plus-api/Dockerfile -t dentcast-plus-api:$TAG   --build-arg BUILD_TAG=$TAG   --build-arg GIT_SHA=$(git rev-parse --short HEAD)   --build-arg BUILT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)   .
```

**Always pass the three build args.** They are what `GET /health` reports back:

```json
{ "ok": true, "version": "v46", "commit": "b17c208", "built_at": "2026-07-31T20:10:00Z" }
```

Without them the image still runs, but answers `"version": "dev"` — and then a
container serving last week's image is indistinguishable from a fresh one on any
release that changed only internals (copy, a query, a default). After every
deploy, confirm the tag you expect:

```bash
curl -s https://api.dentcast.ir/health
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
| `NOTIFY_PROVIDER` | `webpush,telegram,bale` (comma list; fans out to all) |
| `BALE_BOT_TOKEN` | (Bale bot token — see step 5c) |
| `BALE_WEBHOOK_SECRET` | (random secret embedded in the webhook URL — step 5c) |
| `VAPID_PUBLIC_KEY` | (from step 1) |
| `VAPID_PRIVATE_KEY` | (from step 1) |
| `VAPID_SUBJECT` | `mailto:foad.shahabian@gmail.com` |
| `OUTBOUND_PROXY_URL` | leave empty unless the pod has no international egress — see below |
| `OUTBOUND_TIMEOUT_MS` | `10000` (optional; hard timeout per notification send) |
| `ADMIN_USER` | `founder` |
| `ADMIN_PASSWORD` | (a strong secret) |
| `STREAK_TIMEZONE` | `Asia/Tehran` |
| `CONTENT_INDEX_PATH` | leave unset — baked into the image at `/app/content-index.json` |
| `PATHWAYS_PATH` | leave unset — baked into the image at `/app/pathways.json` |
| `CONTENT_INDEX_URL` | leave unset — the Dockerfile points it at the `.ir`/`.org` mirrors |
| `PATHWAYS_URL` | leave unset — same |
| `CONTENT_REFRESH_SECONDS` | leave unset — defaults to 300 |

> **Publishing content no longer needs a redeploy** (changed 2026-08-04). All
> four of the variables above are defaulted by the Dockerfile. The two `_PATH`
> files are still baked in at build time, but they are now only the boot value
> and the fallback: `content-refresh.ts` re-fetches the published
> `content-index.json` / `pathways.json` from the live site every
> `CONTENT_REFRESH_SECONDS` (default 5 min), so an article published on the
> static site reaches the assistant, the dashboard tree and the pathway pages on
> its own.
>
> A refresh can only ever be an upgrade: the payload must parse and pass a shape
> check (all four collections present, at least one content item — an empty but
> structurally valid file is refused precisely because it would silently blank
> the taxonomy), and if every mirror fails the last good copy keeps serving.
>
> You still rebuild the image for **code** changes and migrations, and one last
> time to pick this mechanism up.

### 4b. Payments (Zibal) — the switch that turns the buy button on

The pricing page is public and complete before a single rial can be taken, and
the site reads its state from the API rather than from its own code: the
«هنوز فعال نیست» line on `/plus/pricing.html` is `enabled` from
`GET /pay/plans`, which is `PAYMENT_ENABLED`. **So there is nothing to edit on
the frontend to go live** — set the variable, redeploy the API, and the button
appears by itself. (Editing the page instead would show a button that then gets
a 503 from `POST /pay/start`, which checks the same flag.)

| Var | Production value |
|---|---|
| `PAYMENT_ENABLED` | `false` until the gateway is proven; `true` opens the buy button |
| `ZIBAL_MERCHANT` | the **real** merchant key from Zibal |
| `ZIBAL_CALLBACK_URL` | `https://api.dentcast.ir/pay/callback` — must match what is registered with Zibal |
| `ZIBAL_API_BASE_URL` | `https://pay.dentcast.ir` — our fixed-IP reverse proxy, so `/v1/request` and `/v1/verify` leave from the address Zibal whitelisted |
| `ZIBAL_PROXY_TOKEN` | the shared secret that proxy demands as `X-Proxy-Token`; **set it with the line above or the proxy answers 403** |
| `ZIBAL_EGRESS_PROXY_URL` | leave empty — that is the forward-proxy (CONNECT) route, and ours is the reverse proxy above |
| `PAYMENT_MONTHLY_RIAL` | `10000000` (۱ میلیون تومان a month) |
| `PAYMENT_PLAN_MONTHS` | `1,3,6` |
| `PAYMENT_CAP_RIAL` / `PAYMENT_CAP_COUNT` | `1000000000` / `100` — the e-namad کسب‌وکار خرد ceiling |
| `PAYMENT_CAP_ALERT_PHONE` | founder's number, warned as the monthly ceiling fills |
| `PAYMENT_RESULT_URL` | leave unset unless the result page moves |
| `GIFTCARD_RECIPIENT_EMAIL` | inbox the US Apple gift card is emailed to |
| `GIFTCARD_ALERT_PHONE` | founder's number, told when a claim opens |
| `SUBSCRIPTION_REMINDER_SMS_TEMPLATE_ID` | sms.ir template for the renewal reminder (SMS is the fallback when a user has no messenger) |

**`ZIBAL_MERCHANT` defaults to `zibal`, which is Zibal's own SANDBOX merchant.**
It runs the whole request → start → callback → verify round trip and moves no
money — deliberately, so an unconfigured deployment is in test mode rather than
half-broken. Turning `PAYMENT_ENABLED` on without replacing it gives you a
gateway that looks completely normal, activates subscriptions, and takes
nothing. Set both or neither.

Going live, in order:

```bash
# 1. Is the API answering, and what does it say about payments?
curl -s https://api.dentcast.ir/pay/plans | jq '{enabled, monthly_rial, any_plan_available}'
#    enabled:false  -> PAYMENT_ENABLED is not set on the container yet

# 2. Set PAYMENT_ENABLED=true + the real ZIBAL_MERCHANT, redeploy, then re-read:
curl -s https://api.dentcast.ir/pay/plans | jq '{enabled, plans}'

# 3. Buy one month with your own card. That is the only thing that proves the
#    IP whitelist, the merchant key and the callback URL at once — a flag says
#    nothing about whether Zibal will answer us.
curl -s -u founder:PASSWORD https://api.dentcast.ir/admin/payments/capacity
```

A real purchase is the acceptance test on purpose. `PAYMENT_ENABLED` only says
we are willing to sell; whether Zibal accepts *this* container is decided by the
outbound IP its merchant registration whitelists, and the first person to find
out must not be a customer. Only the two server-to-server calls go through
`pay.dentcast.ir`; the `/start/<trackId>` page is opened by the customer's own
browser and stays on `gateway.zibal.ir`, because the whitelist has nothing to do
with their connection — and the proxy would 403 them anyway.

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

## 5b. Telegram login (dentcast.org; .ir is OTP-only)

"Login with Telegram" is shown on **dentcast.org** only (alongside phone OTP). On
**dentcast.ir** it is deliberately **hidden** in the frontend
(`telegramLoginEnabled()` → .org only): Telegram is filtered in Iran and its widget
loads from `telegram.org`, so the button would be broken for non-VPN users. `.ir`
uses **phone/OTP** now and is slated for **"Login with Bale"** (domestic, unfiltered)
later. The `.ir` bot + `TELEGRAM_BOT_TOKEN_IR` + multi-token callback stay wired, so
re-enabling `.ir` Telegram is just widening that frontend check — no backend change.

A Telegram bot's `/setdomain` is bound to exactly ONE domain, so each site uses its
OWN bot (the `.ir` one is provisioned but currently unused by the frontend):

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

## 5c. Bale (بله) notifications (both sites)

Bale is a **notification channel only** — there is **no login widget** and no
"Login with Bale". A user connects it from their profile to receive the streak
reminder and new-article pushes; connecting deep-links to the Bale bot with a
one-time `?start=` token, and the bot's **webhook** links their `chat_id` (stored
in `profiles.bale_id`, the twin of `profiles.telegram_id`). It is shown on **both**
`.org` and `.ir` (Bale is domestic and unfiltered).

One bot serves both sites (the notification `chat_id` is global to the bot):

| Messenger | Bot | Deep link | Token env var |
|---|---|---|---|
| Bale | `@dentcast_bot` | `ble.ir/dentcast_bot` | `BALE_BOT_TOKEN` |

1. **Container env** — set `BALE_BOT_TOKEN` (from the Bale bot panel) and
   `BALE_WEBHOOK_SECRET` (any long random string), and include `bale` in
   `NOTIFY_PROVIDER` (`webpush,telegram,bale`). `BALE_API_BASE` defaults to
   `https://tapi.bale.ai`.
2. **Register the webhook once** — point Bale's bot at the API path that carries
   the secret:
   ```bash
   curl "https://tapi.bale.ai/bot${BALE_BOT_TOKEN}/setWebhook?url=https://api.dentcast.ir/webhooks/bale/${BALE_WEBHOOK_SECRET}"
   ```
   The secret is in the URL path (not a header), so verification does not depend
   on Bale mirroring Telegram's `secret_token` header. Use whichever `api.*` host
   is reachable to Bale's servers.
3. **Frontend** — the bot username is public and set in `plus/js/config.js`
   (`baleBotUsername()` → `dentcast_bot`); `baleEnabled()` shows the connect UI on
   both sites.

Verify: on the profile page → «اتصال به بله» → the Bale bot opens → press Start →
you get a "connected" reply in Bale and the profile flips to «حساب بله متصل است».

### 5d. When only Bale delivers (international egress)

Two of the three channels live outside Iran — Telegram (`api.telegram.org`) and
web push (`fcm.googleapis.com`, `web.push.apple.com`) — while Bale is domestic.
A pod without international egress therefore loses **exactly those two** and keeps
Bale, which is what happened after the 2026-07-26 redeploy.

Diagnose it in one call (read-only; sends nothing):

```bash
curl -s -u "$ADMIN_USER:$ADMIN_PASSWORD" https://api.dentcast.ir/admin/notify/health | jq
```

Read the answer as follows:

- `channels.<name>.configured: false` → the secret is missing from the container
  env (token / VAPID pair). The channel is skipping silently; re-enter the value.
- `channels.<name>.reachable: false` with Bale reachable → the pod has no route to
  that host. Fix the egress in the ArvanCloud panel, or set `OUTBOUND_PROXY_URL`
  to a proxy that can reach it (the international channels use it; Bale never does).
- `proxy.configured: true` but the `via: "proxy"` probes fail → the proxy itself is
  the broken part.

`GET /admin/notify/health?probe=0` reports configuration only, without touching
the network. Delivery failures are also logged now — grep the container log for
`[notify:telegram:` and `[notify:webpush:` (a line with `failed=N` is a real
delivery failure; `pruned=N` alone is just expired subscriptions being cleaned up).

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
