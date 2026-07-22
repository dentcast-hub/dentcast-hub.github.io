import type { FastifyInstance, FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { one, query, pool } from '../db.js';
import { normalizePhone } from '../services/phone.js';
import { issueCode, verifyCode } from '../services/otp.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { setSessionCookie, clearSessionCookie } from '../services/session.js';
import { sanitizeReturnTo } from '../services/return-to.js';
import { generatePseudonym } from '../services/pseudonym.js';
import { sms } from '../providers/registry.js';
import { loadUser } from '../middleware/auth.js';
import { displayStreak } from '../services/streak.js';
import { dayInTz } from '../services/time.js';

function clientIp(request: FastifyRequest): string {
  return request.ip || 'unknown';
}

function publicUser(u: {
  id: string;
  display_name: string;
  tier: string;
  current_streak: number;
  longest_streak: number;
}) {
  return {
    id: u.id,
    display_name: u.display_name,
    tier: u.tier,
    current_streak: u.current_streak,
    longest_streak: u.longest_streak,
  };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // --- POST /auth/otp/request ------------------------------------------------
  app.post('/auth/otp/request', {
    schema: {
      body: {
        type: 'object',
        required: ['phone'],
        properties: { phone: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { phone: rawPhone } = request.body as { phone: string };
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return reply.code(400).send({ error: 'invalid_phone', message: 'شماره موبایل معتبر نیست.' });
    }

    // Rate limit per phone and per IP.
    const perPhone = consume(`otp:phone:${phone}`, config.otp.maxPerPhonePerHour, HOUR_MS);
    const perIp = consume(`otp:ip:${clientIp(request)}`, config.otp.maxPerIpPerHour, HOUR_MS);
    if (!perPhone.allowed || !perIp.allowed) {
      const retryAfterMs = Math.max(perPhone.retryAfterMs, perIp.retryAfterMs);
      reply.header('retry-after', Math.ceil(retryAfterMs / 1000));
      return reply.code(429).send({
        error: 'rate_limited',
        message: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
      });
    }

    const code = issueCode(phone);
    await sms.sendOtp(phone, code);

    const body: Record<string, unknown> = { ok: true, ttl_seconds: config.otp.ttlSeconds };
    // Dev convenience: expose the code only when using the console provider.
    if (config.otp.provider === 'console') body.dev_code = code;
    return reply.send(body);
  });

  // --- POST /auth/otp/verify -------------------------------------------------
  app.post('/auth/otp/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string' },
          code: { type: 'string' },
          return_to: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { phone: rawPhone, code, return_to } = request.body as {
      phone: string;
      code: string;
      return_to?: string;
    };
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return reply.code(400).send({ error: 'invalid_phone', message: 'شماره موبایل معتبر نیست.' });
    }

    const result = verifyCode(phone, code);
    if (result !== 'ok') {
      const map: Record<string, string> = {
        no_code: 'کدی برای این شماره صادر نشده است.',
        expired: 'کد منقضی شده است. دوباره درخواست کنید.',
        mismatch: 'کد وارد شده درست نیست.',
        too_many_attempts: 'تلاش زیاد. دوباره درخواست کنید.',
      };
      return reply.code(400).send({ error: result, message: map[result] ?? 'کد نامعتبر است.' });
    }

    // Create the profile on first login with a generated pseudonym; otherwise
    // return the existing one. The no-op update lets RETURNING see the row.
    const user = await one<{
      id: string;
      display_name: string;
      tier: string;
      current_streak: number;
      longest_streak: number;
      is_new: boolean;
    }>(
      `insert into profiles (phone, display_name)
       values ($1, $2)
       on conflict (phone) do update set phone = excluded.phone
       returning id, display_name, tier, current_streak, longest_streak, (xmax = 0) as is_new`,
      [phone, generatePseudonym()],
    );

    setSessionCookie(reply, user!.id);
    return reply.send({
      user: publicUser(user!),
      is_new: user!.is_new === true, // first login -> client shows onboarding
      return_to: sanitizeReturnTo(return_to),
    });
  });

  // --- POST /auth/logout -----------------------------------------------------
  app.post('/auth/logout', async (request, reply) => {
    clearSessionCookie(reply, request);
    return reply.send({ ok: true });
  });

  // --- POST /auth/telegram/link ---------------------------------------------
  // Called by the Telegram bot webhook after a contact share: match the shared
  // phone to a profile and store telegram_id. Guarded by the webhook secret.
  app.post('/auth/telegram/link', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'telegram_id', 'secret'],
        properties: {
          phone: { type: 'string' },
          telegram_id: { type: 'integer' },
          secret: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { phone: rawPhone, telegram_id, secret } = request.body as {
      phone: string;
      telegram_id: number;
      secret: string;
    };
    if (!config.notify.telegramWebhookSecret || secret !== config.notify.telegramWebhookSecret) {
      return reply.code(403).send({ error: 'forbidden' });
    }
    const phone = normalizePhone(rawPhone);
    if (!phone) return reply.code(400).send({ error: 'invalid_phone' });

    const res = await query(
      `update profiles set telegram_id = $1 where phone = $2`,
      [telegram_id, phone],
    );
    if (res.rowCount === 0) {
      return reply.code(404).send({ error: 'no_profile', message: 'شماره‌ای با این مشخصات یافت نشد.' });
    }
    return reply.send({ ok: true });
  });

  // --- GET /me ---------------------------------------------------------------
  // Reads the session; part of the auth surface. Streak fields are caches that
  // the streak engine (later milestone) keeps current. The due-card field is
  // ABSENT for free users (never zero, never a locked stub).
  app.get('/me', async (request, reply) => {
    const user = await loadUser(request);
    if (!user) return reply.code(401).send({ error: 'unauthorized' });

    // Show the streak only while it is still alive. The cache resets lazily (on
    // the next qualifying action), so after an unbridgeable gap the cached
    // number is stale — the client must see 0, not last week's run.
    const shownStreak = await displayStreak(pool, user.id, user, dayInTz(new Date()));

    const me: Record<string, unknown> = {
      id: user.id,
      display_name: user.display_name,
      tier: user.tier,
      phone: user.phone,
      telegram_linked: user.telegram_id !== null,
      current_streak: shownStreak,
      longest_streak: user.longest_streak,
      last_active_day: user.last_active_day,
      // Surface settings (e.g. reminders) so the profile can reflect saved
      // toggle state. Without this the reminder checkboxes always render empty
      // after a reload even though PATCH /me persisted them.
      settings: user.settings ?? {},
      active_pathway: null, // Phase 3
    };
    // due_card_count is premium-only and intentionally absent for free users.
    if (user.tier === 'premium') me.due_card_count = 0; // Phase 2 fills this in
    return reply.send(me);
  });
}
