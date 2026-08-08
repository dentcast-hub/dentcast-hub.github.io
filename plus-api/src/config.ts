import 'dotenv/config';

function str(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Env var ${name} must be a number`);
  return n;
}

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1';
}

function list(name: string, fallback: string[]): string[] {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * A price list: term in months -> price in rial, written "1:12000000,3:33000000".
 *
 * A table rather than a rate, because the price is no longer months × a monthly
 * figure and cannot be recovered from one. Any formula would be a second place
 * the ladder is decided, and the two would disagree the first time a term is
 * repriced on its own.
 */
function priceList(name: string, fallback: Record<number, number>): Record<number, number> {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const out: Record<number, number> = {};
  for (const pair of v.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [months, rial] = pair.split(':').map((s) => Number(s.trim()));
    if (!Number.isInteger(months) || months < 1 || !Number.isFinite(rial) || rial <= 0) {
      throw new Error(`Env var ${name} must look like "1:12000000,3:33000000,6:60000000"`);
    }
    out[months] = rial;
  }
  if (!Object.keys(out).length) throw new Error(`Env var ${name} lists no plan`);
  return out;
}

// The price list, in rial (the site quotes toman: 12,000,000 rial = 1,200,000 toman).
//
// NON-LINEAR SINCE 2026-08-07, and that is the whole point of the table. It used
// to be one monthly figure multiplied by the term, so every term cost the same
// per month and a longer commitment bought nothing but fewer trips to the bank.
// Now the month costs 1,200,000 toman, three months 1,100,000 a month and six
// months 1,000,000 a month. Two things follow, both deliberate: the entry price
// is 20% higher, which is the brake we want while seats are limited; and the
// longer terms are the cheap ones, which moves buyers toward six months — one
// transaction against the monthly regulatory ceiling instead of six, and one
// decision instead of six chances to drop out.
//
// 12 months is deliberately absent until a real transaction proves the gateway
// accepts a single payment that large — answerable by selling one, not by asking.
const PLAN_PRICES_RIAL = priceList('PAYMENT_PLAN_PRICES', {
  1: 12_000_000,  // 1,200,000 toman
  3: 33_000_000,  // 3,300,000 toman  (1,100,000 a month)
  6: 60_000_000,  // 6,000,000 toman  (1,000,000 a month)
});

// The terms on offer ARE the terms with a price. Derived rather than configured
// separately, because a term listed with no price has no meaning and a price
// with no term is never shown.
const PLAN_MONTHS = Object.keys(PLAN_PRICES_RIAL)
  .map(Number)
  .sort((a, b) => a - b);

// The cheapest per-month rate anywhere on the list — the «از ماهی … تومان»
// number, and the only monthly figure that is still true now that the ladder
// bends. NOT the price of the one-month plan.
const FROM_MONTHLY_RIAL = Math.min(...PLAN_MONTHS.map((m) => PLAN_PRICES_RIAL[m] / m));

export const config = {
  env: str('NODE_ENV', 'development'),
  isProd: str('NODE_ENV', 'development') === 'production',

  databaseUrl: str('DATABASE_URL', 'postgres://dentcast:dentcast@localhost:5432/dentcast_plus'),

  // Build stamp, injected by the Dockerfile (see its ARG/ENV block). Reported by
  // GET /health so a deploy can be VERIFIED rather than assumed: without it,
  // a container running last week's image is indistinguishable from a fresh one
  // whenever a release changes only internals (copy, a query, a default).
  build: {
    tag: str('BUILD_TAG', 'dev'),
    commit: str('GIT_SHA', 'unknown'),
    builtAt: str('BUILT_AT', 'unknown'),
  },

  port: int('PORT', 8787),
  host: str('HOST', '0.0.0.0'),
  corsOrigins: list('CORS_ORIGINS', ['http://localhost:5500', 'http://127.0.0.1:5500']),

  session: {
    secret: str('SESSION_SECRET', 'dev-insecure-change-me'),
    cookieName: str('SESSION_COOKIE_NAME', 'dcp_session'),
    secure: bool('SESSION_COOKIE_SECURE', false),
    ttlDays: int('SESSION_TTL_DAYS', 30),
  },

  otp: {
    provider: str('SMS_PROVIDER', 'console'),
    ttlSeconds: int('OTP_TTL_SECONDS', 120),
    length: int('OTP_LENGTH', 5),
    maxPerPhonePerHour: int('OTP_MAX_PER_PHONE_PER_HOUR', 5),
    maxPerIpPerHour: int('OTP_MAX_PER_IP_PER_HOUR', 15),
    // SMS.ir template-based OTP (used only when SMS_PROVIDER=smsir). The template
    // is created in the SMS.ir panel; its numeric id and single parameter name
    // live here. Empty in dev (console provider ignores them).
    smsir: {
      apiKey: str('SMSIR_API_KEY', ''),
      templateId: int('SMSIR_TEMPLATE_ID', 0),
      paramName: str('SMSIR_PARAM_NAME', 'CODE'),
    },
  },

  notify: {
    provider: str('NOTIFY_PROVIDER', 'stub'),
    telegramBotToken: str('TELEGRAM_BOT_TOKEN', ''),
    telegramWebhookSecret: str('TELEGRAM_WEBHOOK_SECRET', ''),
    // Bale (بله) — domestic messenger, notification channel only (no login). One
    // bot, one token (@dentcast_bot on ble.ir). The Bot API is Telegram-compatible
    // but lives on a different host (baleApiBase). The webhook secret is embedded
    // in the webhook URL path (/webhooks/bale/:secret) rather than a header, so it
    // does not depend on Bale mirroring Telegram's secret_token header.
    baleBotToken: str('BALE_BOT_TOKEN', ''),
    baleWebhookSecret: str('BALE_WEBHOOK_SECRET', ''),
    baleApiBase: str('BALE_API_BASE', 'https://tapi.bale.ai'),

    // --- delivery policy (services/notify-policy.ts) -------------------------
    // maxPerDay: hard cap on notifications delivered to ONE user per Tehran day.
    //   The price of instant delivery is that a busy day (several publishes + a
    //   league outcome + cards due) can stack up; over-notifying is how a bot
    //   gets blocked and push permission revoked, and neither comes back. Excess
    //   is DROPPED, not queued — a nudge delivered a day late is worse than none.
    //   `system` (founder broadcast) is exempt and always lands.
    maxPerDay: int('NOTIFY_MAX_PER_DAY', 5),
    // awakeStartHour/awakeEndHour: the Tehran hours in which an EVENT-DRIVEN
    //   notification is allowed to fire the moment its event happens. Inside the
    //   window (09:00-22:00) instant means instant; outside it the notification
    //   is HELD — not dropped — and released at awakeStartHour the next morning.
    //   Both event-driven kinds need this: league weeks finalize at 00:00, and a
    //   publish can land at any hour. The window is half-open [start, end), so
    //   22:00 sharp already waits. Set both equal to disable it and fire always.
    awakeStartHour: int('NOTIFY_AWAKE_START_HOUR', 9),
    awakeEndHour: int('NOTIFY_AWAKE_END_HOUR', 22),
  },

  // Outbound HTTP to the notification destinations (see providers/outbound.ts).
  // A container hosted in Iran may have no route to api.telegram.org / FCM / APNs
  // while domestic hosts (Bale) stay reachable — exactly the 2026-07-26 outage.
  //
  // THE PROXY IS PER CHANNEL, and that is the whole point. It used to be ONE key
  // shared by every international destination, which meant a proxy added to
  // rescue Telegram was silently mounted on web push as well — and if that proxy
  // could not reach FCM/APNs, it took a healthy channel down with it. One knob
  // could not express "Telegram through a proxy, web push direct", so the
  // failure it caused was invisible by construction.
  //
  //   OUTBOUND_PROXY_URL  — Telegram's route (http://host:port, credentials
  //                         allowed). Empty = direct, the normal case.
  //   WEBPUSH_PROXY_URL   — web push's OWN route. Empty = DIRECT. Web push is
  //                         never routed by any other variable.
  //   Bale is domestic and is never proxied at all (providers/outbound.ts).
  //
  // HTTPS_PROXY / https_proxy are deliberately NOT read here. They used to be a
  // fallback for this key, which handed a platform-level variable — one nobody
  // set with notifications in mind — the power to reroute delivery. Notification
  // policy is set by notification variables only. A set-but-ignored HTTPS_PROXY
  // is warned about at startup below rather than honoured in silence.
  outbound: {
    proxyUrl: str('OUTBOUND_PROXY_URL', ''),
    webPushProxyUrl: str('WEBPUSH_PROXY_URL', ''),
    // A plain fetch has no timeout: against a filtered host it can hang until the
    // socket dies, stalling every later user in a notification batch.
    timeoutMs: int('OUTBOUND_TIMEOUT_MS', 10_000),
    // The /admin/notify/health reachability check fails fast — it is a diagnosis,
    // not a delivery.
    probeTimeoutMs: int('OUTBOUND_PROBE_TIMEOUT_MS', 5_000),
    // Circuit breaker for a channel whose host has gone away (providers/outbound.ts).
    // A DEAD channel must fail fast, not slowly: the timeout above is per USER, so
    // a fan-out over N readers costs N x timeoutMs on a route that is not coming
    // back within this run. On 2026-08-07 a broadcast to every reader took the
    // API past the gateway timeout and left it degraded for minutes, entirely on
    // Telegram timeouts. After `breakerThreshold` consecutive NETWORK failures the
    // channel is skipped for `breakerCooldownMs`, then one trial request decides
    // whether it is back — so a route that returns heals itself with no deploy.
    breakerThreshold: int('OUTBOUND_BREAKER_THRESHOLD', 3),
    breakerCooldownMs: int('OUTBOUND_BREAKER_COOLDOWN_MS', 300_000),
  },

  // External-login providers. Layered so a second provider (Bale, on the .ir
  // deployment) slots in beside Telegram without reshaping auth. Telegram Login
  // (dentcast.org sign-in) uses the SAME bot as notifications, so it reuses
  // TELEGRAM_BOT_TOKEN; the callback verifies the widget payload with
  // SHA256(botToken) as the HMAC key. The bot USERNAME is public and lives in the
  // frontend (plus/js/config.js), never here.
  auth: {
    telegram: {
      // Two bots, one per site (a bot's /setdomain is bound to ONE domain):
      //   botToken   = @Dentcast_bot   (/setdomain dentcast.org) — also notifications
      //   botTokenIr = @Dentcast_irbot (/setdomain dentcast.ir)
      // The login callback accepts a payload signed by EITHER (the Telegram user
      // id is global, so both resolve to the same account).
      botToken: str('TELEGRAM_BOT_TOKEN', ''),
      botTokenIr: str('TELEGRAM_BOT_TOKEN_IR', ''),
      // Reject a Telegram auth payload older than this (seconds); 24h per the
      // login-widget guidance ("to prevent the use of outdated data").
      maxAgeSeconds: int('TELEGRAM_AUTH_MAX_AGE_SECONDS', 86400),
    },
  },

  // Web Push (VAPID). The public key is safe to expose; the client fetches it
  // from /push/public-key. With no keys set (dev), the web-push provider logs
  // instead of sending, so the flow still works end to end without secrets.
  push: {
    vapidPublicKey: str('VAPID_PUBLIC_KEY', ''),
    vapidPrivateKey: str('VAPID_PRIVATE_KEY', ''),
    vapidSubject: str('VAPID_SUBJECT', 'mailto:foad.shahabian@gmail.com'),
  },

  // New-article notifications. Premium fires immediately on publish; free is
  // batched into one digest by a cron at freeDigestHour local (Asia/Tehran),
  // for articles whose notify_free_after (published_at + freeDelayHours) passed.
  articleNotify: {
    freeDelayHours: int('ARTICLE_FREE_DELAY_HOURS', 24),
    freeDigestHour: int('ARTICLE_FREE_DIGEST_HOUR', 21),
    // New-article messages are text-only (the Pulse sentence); no link for now.
    // Link plumbing is PREPARED for a later premium feature: flip linkInText on
    // and premium messenger messages append the absolute article link.
    linkInText: bool('ARTICLE_NOTIFY_LINK_IN_TEXT', false),
    siteBaseUrl: str('ARTICLE_NOTIFY_SITE_BASE_URL', 'https://dentcast.ir'),
  },

  // Streak reminder: fired once a day at this Tehran hour to users who opted in
  // and have not kept their streak yet today (see services/streak-reminder.ts).
  // Evening default leaves time to act before Tehran midnight.
  streakReminder: {
    hour: int('STREAK_REMINDER_HOUR', 20),
  },

  // Review (Leitner) reminder — PREMIUM ONLY, because the review schedule itself
  // is premium (routes/review.ts requires it). Fired once a day at this Tehran
  // hour to premium users who have cards due. Morning by default, deliberately
  // NOT 20:00: that hour already carries the streak reminder and the reactivation
  // nudge, and a study prompt lands better before the day than at the end of it.
  reviewReminder: {
    hour: int('REVIEW_REMINDER_HOUR', 9),
  },

  // Subscription renewal reminders: one `daysBefore` days out and one on the
  // last day itself. Sent at reminder hour Tehran — mid-morning, so it lands
  // when someone can act on it rather than at a boundary nobody is awake for.
  //
  // The SMS fallback is for accounts with no messenger and no browser push at
  // all: the ONLY notification the site pays money to deliver, because it is the
  // only one with a subscription on the other side of it. Iranian service lines
  // carry registered templates, not free text, so this needs its own template in
  // the SMS.ir panel with a single parameter (the expiry date). Left at 0, the
  // SMS step is skipped entirely and the in-app + messenger paths still work.
  subscriptionReminder: {
    hour: int('SUBSCRIPTION_REMINDER_HOUR', 10),
    daysBefore: int('SUBSCRIPTION_REMINDER_DAYS_BEFORE', 3),
    smsTemplateId: int('SUBSCRIPTION_REMINDER_SMS_TEMPLATE_ID', 0),
    smsParamName: str('SUBSCRIPTION_REMINDER_SMS_PARAM', 'DATE'),
  },

  // Reactivation nudge for users with NO live streak: a gentle once-a-day
  // "start your streak" push (both channels). Opt-OUT (respects a disabled streak
  // reminder), and CAPPED at maxNudges since the user's last real activity, so a
  // dormant/dead account is never harassed. The moment a user engages they leave
  // this cohort and fall back to the normal streak/new-article notifications.
  reactivation: {
    hour: int('REACTIVATION_HOUR', 20),
    maxNudges: int('REACTIVATION_MAX_NUDGES', 6),
  },

  anon: {
    maxPerIpPerHour: int('ANON_EVENT_MAX_PER_IP_PER_HOUR', 60),
  },

  // Spot (ad) telemetry. Its own budget, an order of magnitude above the generic
  // anonymous-event cap: an impression fires per page view PER enabled slot, and
  // Iranian mobile networks put many readers behind one NAT address, so a 60/h
  // cap would silently drop real traffic and skew the report downwards.
  spot: {
    maxPerIpPerHour: int('SPOT_EVENT_MAX_PER_IP_PER_HOUR', 600),
  },

  admin: {
    user: str('ADMIN_USER', 'founder'),
    password: str('ADMIN_PASSWORD', 'change-me-admin-password'),
  },

  // Payments. Prices are in RIAL everywhere in the code and the database
  // (`payments.amount_rial`, and what Zibal's API expects); the site shows toman.
  // One unit end to end, converted only at the moment of display — a system that
  // carries both is a system that eventually charges ten times too much.
  payments: {
    // The master switch, OFF by default.
    //
    // The pricing page ships and is fully public before the gateway can take a
    // single rial: Zibal's merchant registration whitelists one outbound IP and
    // this container's egress address is not stable, so the buy button has to
    // stay dark until that is settled. A flag rather than an unfinished page —
    // the whole flow is built, tested and deployed, and goes live with one
    // environment variable instead of a release.
    //
    // Default false so it is turned on deliberately. A deployment that forgets
    // this shows "not active yet", which is true; the opposite default would
    // send customers to a gateway that refuses them.
    enabled: bool('PAYMENT_ENABLED', false),
    // What each term costs, and which terms exist. See PLAN_PRICES_RIAL above.
    planPricesRial: PLAN_PRICES_RIAL,
    planMonths: PLAN_MONTHS,
    // The lowest per-month rate on the list, for the «از ماهی …» line only.
    // Nothing is priced FROM it — planAmountRial reads the table.
    fromMonthlyRial: FROM_MONTHLY_RIAL,

    // --- The monthly ceiling -------------------------------------------------
    // Set by the e-namad کسب‌وکار خرد registration, not by us: 100,000,000 toman
    // and 100 transactions per month. Both are hard — the gateway simply starts
    // refusing once either is reached, and a refusal at that point looks to the
    // customer exactly like a broken site.
    capRial: int('PAYMENT_CAP_RIAL', 1_000_000_000),
    capCount: int('PAYMENT_CAP_COUNT', 100),
    // Which calendar the ceiling resets on. The cap comes from an Iranian
    // regulator, so the Persian month is the default; flip to 'gregorian' if
    // Zibal confirms otherwise. Getting this wrong does not fail loudly — it
    // just makes the counter disagree with the gateway's for three weeks.
    capCalendar: str('PAYMENT_CAP_CALENDAR', 'jalali'),
    // Warn the founder once usage crosses this fraction of either ceiling.
    capWarnAt: Number(str('PAYMENT_CAP_WARN_AT', '0.8')),
    // Whose phone gets the "the ceiling is running out" message. Empty = nobody
    // is told (the console line still fires), because there is no sensible
    // default founder and guessing one would page a stranger.
    capAlertPhone: str('PAYMENT_CAP_ALERT_PHONE', ''),
    // Count every attempt that reached the gateway, not just the verified ones.
    //
    // DEFAULTED FALSE on 2026-08-06: the founder confirmed the e-namad allowance
    // governs REAL transactions, which is the answer the previous default was
    // waiting on. It used to be true because we did not know whether Zibal's
    // counter forgives an abandoned payment, and over-counting merely closed the
    // shop early while under-counting could charge somebody for a subscription
    // the ceiling then refused to activate.
    //
    // What made the old default expensive in practice: an abandoned checkout
    // held its slice of the ceiling forever, because nothing ever closed a
    // pending row. Two dead rows were sitting on 4,000,000 toman of the monthly
    // 100,000,000 the day this changed. services/payment-reconcile.ts now closes
    // them, so even flipped back to true the ceiling would no longer silt up.
    capCountsAttempts: bool('PAYMENT_CAP_COUNTS_ATTEMPTS', false),
    // --- Reconciling payments nobody came back from --------------------------
    // How old a pending row must be before we ask the gateway about it. Well
    // past any bank session: below this a `-1` just means the customer is still
    // typing their card number, and closing the row would be a lie about a live
    // payment.
    reconcileAfterMinutes: int('PAYMENT_RECONCILE_AFTER_MINUTES', 30),
    // How often the sweep runs. Minutes, not hours: an unsettled payment is a
    // customer who has been charged and has nothing, and Zibal reverses a
    // transaction that is never verified — so the window to put it right is
    // finite and the cost of checking is one small query.
    reconcileEveryMinutes: int('PAYMENT_RECONCILE_EVERY_MINUTES', 15),
    // Rows per pass. A ceiling on the gateway calls one sweep can make; anything
    // left over is simply picked up by the next pass.
    reconcileBatch: int('PAYMENT_RECONCILE_BATCH', 50),
    // Where the customer's browser lands once we know the answer. On the SITE,
    // not the API: the API's job ends at deciding, and a bare JSON body is not
    // a thing to show somebody who has just paid.
    resultUrl: str('PAYMENT_RESULT_URL', 'https://dentcast.ir/plus/pay-result.html'),
  },

  // Paying from outside Iran: a US Apple gift card, redeemed by hand.
  //
  // ON by default and independent of the Iranian gateway. The two are unrelated
  // rails: Zibal's merchant registration, its e-namad and its .ir-only callback
  // have nothing to do with somebody abroad buying a gift card, so this stays
  // available while that is still dark — and works on the .org mirror, where
  // most of the people it is for actually are.
  //
  // The CODE is never collected. The buyer is given a reference tag, has the
  // card emailed to recipientEmail with that tag in the gift message, and the
  // founder matches the two. See services/gift-redemption.ts.
  //
  // Nothing here counts against the e-namad monthly ceiling: that allowance
  // governs rial through Zibal, and a gift card is neither.
  giftCard: {
    enabled: bool('GIFTCARD_ENABLED', true),
    // US only, and not a preference: an Apple gift card redeems solely into an
    // Apple ID of the same country, so a card from any other region is unusable
    // however genuine it is.
    kind: str('GIFTCARD_KIND', 'apple_us'),
    months: int('GIFTCARD_MONTHS', 10),
    amountUsd: int('GIFTCARD_AMOUNT_USD', 100),
    /** Where the shop emails the card. Shown to the buyer. */
    recipientEmail: str('GIFTCARD_RECIPIENT_EMAIL', 'foad.shahabian@gmail.com'),
    /** Whose phone hears "a card is on its way". Empty = console only. */
    alertPhone: str('GIFTCARD_ALERT_PHONE', ''),
  },

  // Zibal IPG (درگاه پرداخت زیبال).
  zibal: {
    // 'zibal' is Zibal's own SANDBOX merchant: it drives the full request ->
    // start -> callback -> verify round trip without moving money. It is the
    // default on purpose — an unconfigured deployment is then in test mode
    // rather than half-broken, and forgetting to set the real key cannot
    // silently take a customer's money into nowhere.
    merchant: str('ZIBAL_MERCHANT', 'zibal'),
    // The gateway itself. This one owns `startUrl()` — the address the CUSTOMER'S
    // BROWSER is sent to — so it must stay the real gateway even when the two
    // server-to-server calls are routed elsewhere by apiBaseUrl below.
    baseUrl: str('ZIBAL_BASE_URL', 'https://gateway.zibal.ir'),
    callbackUrl: str('ZIBAL_CALLBACK_URL', 'https://api.dentcast.ir/pay/callback'),
    /**
     * Where /v1/request and /v1/verify go. Empty = `baseUrl`, straight at the
     * gateway.
     *
     * Zibal's merchant registration whitelists ONE outbound IP (confirmed by
     * their support, 2026-08-05) and a container platform does not guarantee a
     * stable egress address. `https://pay.dentcast.ir` is our fixed-IP REVERSE
     * proxy (188.121.121.232, built 2026-08-06): it forwards the path, method
     * and body verbatim to gateway.zibal.ir, so pointing this at it moves the
     * source IP without changing a single request.
     *
     * Only the two server calls move. `startUrl()` keeps using `baseUrl`,
     * because that URL is opened by the customer's browser: the IP whitelist
     * does not apply to it, and the proxy would answer 403 anyway — it demands
     * a token no browser sends.
     */
    apiBaseUrl: str('ZIBAL_API_BASE_URL', ''),
    /**
     * Shared secret the reverse proxy above requires, sent as `X-Proxy-Token`.
     * The proxy 403s any request without it and strips the header before
     * forwarding, so it never reaches Zibal. Empty when apiBaseUrl is empty.
     */
    proxyToken: str('ZIBAL_PROXY_TOKEN', ''),
    // A FORWARD proxy (undici ProxyAgent — CONNECT), which is a different thing
    // from apiBaseUrl above: that one is a reverse proxy the request is addressed
    // to, this one is a tunnel the request is sent through. Either fixes the
    // egress IP; use whichever the fixed-IP host actually runs. Ours is the
    // reverse proxy, so this stays empty. Empty = direct.
    egressProxyUrl: str('ZIBAL_EGRESS_PROXY_URL', ''),
    // Longer than the notification timeout: a payment switch is slower than a
    // messenger API, and a verify that times out is the expensive kind of
    // failure — the customer has already paid.
    timeoutMs: int('ZIBAL_TIMEOUT_MS', 25_000),
  },

  // «دستیار هوشمند» (premium, spec's later AI phase): a narrow classifier, not a
  // chatbot — it turns a free-text case description into a short multiple-choice
  // narrowing round, options always drawn from our own taxonomy (never invented),
  // until it can point at real DentCast articles. AI_PROVIDER=stub (default) costs
  // nothing and needs no key — see providers/ai/. Only 'openai-compatible' (Arvan's
  // OpenAI-compatible endpoint) spends real money, and only when explicitly configured.
  ai: {
    provider: str('AI_PROVIDER', 'stub'),
    apiBase: str('AI_API_BASE', ''),
    apiKey: str('AI_API_KEY', ''),
    model: str('AI_MODEL', ''),
    // The ArvanCloud gateway intermittently answers a valid request with a
    // generic 400 that succeeds unchanged seconds later, so the provider retries
    // transient failures. maxAttempts caps the CALLS; retryBudgetMs caps the WALL
    // CLOCK, because a user is watching a spinner while this runs — without it,
    // three 10s timeouts plus backoff would be half a minute of nothing.
    maxAttempts: int('AI_MAX_ATTEMPTS', 3),
    retryBudgetMs: int('AI_RETRY_BUDGET_MS', 15_000),
    // Ask for response_format=json_object, which turns "please answer in JSON"
    // into a hard guarantee — where the endpoint supports it.
    //
    // Defaults to FALSE because the endpoint we actually run on (ArvanCloud's
    // gateway) rejects it outright with a bare 400: measured 3/3 failures with
    // it, 3/3 successes without. The provider still self-heals if it is turned
    // on against such an endpoint (it latches off after the first 400), but
    // that costs one wasted round trip on every container boot for a result we
    // already know. Set true for an endpoint that honours response_format —
    // the prompt-enforced JSON path stays correct either way.
    jsonMode: bool('AI_JSON_MODE', false),
    // Sized to the model actually serving. Measured on GPT-5-Nano: 6/6 runs,
    // median 2.6s, slowest 4.3s — so 10s is ~2x headroom over the worst observed
    // round, and anything past it is a stall rather than a slow answer.
    //
    // These two numbers only make sense together. The retry loop checks the
    // budget BEFORE sleeping, so the worst case is roughly
    // attempts x timeout + backoffs, and a budget larger than the timeout buys
    // another full timeout of waiting:
    //     45s / 20s  -> 1 attempt,  45.0s worst   (the old pair: no retry at all)
    //     15s / 40s  -> 3 attempts, 46.6s worst   (worse than what it replaced)
    //     10s / 15s  -> 2 attempts, 20.4s worst   <- chosen
    // A FAST failure still gets all three attempts (2.6 + 0.4 + 2.6 + 1.2 = 6.4s,
    // well inside the budget); only repeated stalls stop at two.
    timeoutMs: int('AI_TIMEOUT_MS', 10_000),
  },

  // Bounds on the case-assistant's own cost: rounds per session (never more than
  // this many AI calls before it is forced to resolve) and requests per user per
  // hour (abuse/runaway-click guard, same shape as anon.maxPerIpPerHour).
  assistant: {
    maxRounds: int('ASSISTANT_MAX_ROUNDS', 4),
    maxPerUserPerHour: int('ASSISTANT_MAX_PER_USER_PER_HOUR', 20),
  },

  streakTimezone: str('STREAK_TIMEZONE', 'Asia/Tehran'),

  // Path to the generated taxonomy index (tools/build_plus_index.mjs output).
  // Defaults to the repo's plus/ dir in dev; set explicitly in the container.
  contentIndexPath: process.env.CONTENT_INDEX_PATH || '',

  // Path to plus/pathways.json (spec section 5 — versioned in the repo, no DB).
  // Defaults to the repo's plus/ dir in dev; set explicitly in the container.
  pathwaysPath: process.env.PATHWAYS_PATH || '',

  // Path to plus/badges.json (the achievements catalog — versioned in the repo,
  // no DB). Same story as pathwaysPath: repo default in dev, explicit in the
  // container.
  badgesPath: process.env.BADGES_PATH || '',

  // Path to plus/quota.json (the free tier's allowance on every premium
  // feature). Same story again: repo default in dev, explicit in the container.
  quotaPath: process.env.QUOTA_PATH || '',

  // Where to re-fetch those files from at runtime (content-refresh.ts).
  // The paths above are the boot value and the permanent fallback; these URLs
  // are what stop every publish from needing an image rebuild. Comma-separated
  // so the two mirrors can cover each other. Empty = feature off (dev default,
  // where the on-disk file is already the live one).
  content: {
    indexUrls: list('CONTENT_INDEX_URL', []),
    pathwaysUrls: list('PATHWAYS_URL', []),
    badgesUrls: list('BADGES_URL', []),
    quotaUrls: list('QUOTA_URL', []),
    refreshSeconds: int('CONTENT_REFRESH_SECONDS', 300),
  },
};

// A platform-level proxy variable used to be a silent fallback for
// OUTBOUND_PROXY_URL. It no longer is — but a deployment that was relying on
// that fallback would otherwise discover the change as "Telegram stopped
// working" with nothing to read anywhere. Goal: no channel changes its route in
// silence, in EITHER direction.
const strayProxy = ['HTTPS_PROXY', 'https_proxy'].filter((k) => (process.env[k] || '').trim());
if (strayProxy.length > 0 && !config.outbound.proxyUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    `[config] ${strayProxy.join('/')} is set but is NOT used for notifications.`
    + ' Set OUTBOUND_PROXY_URL to route Telegram, WEBPUSH_PROXY_URL to route web push.'
    + ' Both are empty, so every notification channel is going direct.',
  );
}

export type Config = typeof config;
