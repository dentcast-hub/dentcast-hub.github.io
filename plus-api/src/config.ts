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
  },

  notify: {
    provider: str('NOTIFY_PROVIDER', 'stub'),
    telegramBotToken: str('TELEGRAM_BOT_TOKEN', ''),
    telegramWebhookSecret: str('TELEGRAM_WEBHOOK_SECRET', ''),
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
  },

  anon: {
    maxPerIpPerHour: int('ANON_EVENT_MAX_PER_IP_PER_HOUR', 60),
  },

  admin: {
    user: str('ADMIN_USER', 'founder'),
    password: str('ADMIN_PASSWORD', 'change-me-admin-password'),
  },

  streakTimezone: str('STREAK_TIMEZONE', 'Asia/Tehran'),

  // Path to the generated taxonomy index (tools/build_plus_index.mjs output).
  // Defaults to the repo's plus/ dir in dev; set explicitly in the container.
  contentIndexPath: process.env.CONTENT_INDEX_PATH || '',
};

export type Config = typeof config;
