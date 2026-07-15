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

  anon: {
    maxPerIpPerHour: int('ANON_EVENT_MAX_PER_IP_PER_HOUR', 60),
  },

  admin: {
    user: str('ADMIN_USER', 'founder'),
    password: str('ADMIN_PASSWORD', 'change-me-admin-password'),
  },

  streakTimezone: str('STREAK_TIMEZONE', 'Asia/Tehran'),
};

export type Config = typeof config;
