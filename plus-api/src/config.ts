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

export const config = {
  env: str('NODE_ENV', 'development'),
  isProd: str('NODE_ENV', 'development') === 'production',

  databaseUrl: str('DATABASE_URL', 'postgres://dentcast:dentcast@localhost:5432/dentcast_plus'),

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
  // OUTBOUND_PROXY_URL routes the INTERNATIONAL channels through a proxy
  // (http://host:port, credentials allowed); empty = direct, the normal case.
  // HTTPS_PROXY is honoured as a fallback so a platform-level setting also works.
  outbound: {
    proxyUrl: str('OUTBOUND_PROXY_URL', '') || str('HTTPS_PROXY', '') || str('https_proxy', ''),
    // A plain fetch has no timeout: against a filtered host it can hang until the
    // socket dies, stalling every later user in a notification batch.
    timeoutMs: int('OUTBOUND_TIMEOUT_MS', 10_000),
    // The /admin/notify/health reachability check fails fast — it is a diagnosis,
    // not a delivery.
    probeTimeoutMs: int('OUTBOUND_PROBE_TIMEOUT_MS', 5_000),
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

  streakTimezone: str('STREAK_TIMEZONE', 'Asia/Tehran'),

  // Path to the generated taxonomy index (tools/build_plus_index.mjs output).
  // Defaults to the repo's plus/ dir in dev; set explicitly in the container.
  contentIndexPath: process.env.CONTENT_INDEX_PATH || '',

  // Path to plus/pathways.json (spec section 5 — versioned in the repo, no DB).
  // Defaults to the repo's plus/ dir in dev; set explicitly in the container.
  pathwaysPath: process.env.PATHWAYS_PATH || '',
};

export type Config = typeof config;
