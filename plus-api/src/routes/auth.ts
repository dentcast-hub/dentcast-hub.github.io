import type { FastifyInstance, FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { one, query, pool, withTransaction } from '../db.js';
import { normalizePhone } from '../services/phone.js';
import { issueCode, verifyCode } from '../services/otp.js';
import { consume, refund, HOUR_MS } from '../services/rate-limit.js';
import { setSessionCookie, clearSessionCookie, readSession } from '../services/session.js';
import { sanitizeReturnTo } from '../services/return-to.js';
import { generatePseudonym } from '../services/pseudonym.js';
import { verifyTelegramAuthAny } from '../services/telegram-auth.js';
import { mergeProfiles } from '../services/merge-profiles.js';
import { sms } from '../providers/registry.js';
import { loadUser } from '../middleware/auth.js';
import { displayStreak } from '../services/streak.js';
import { dayInTz } from '../services/time.js';
import { getActivePathwaySummary } from '../services/active-pathway.js';
import { getPendingPremiumGrant } from '../services/premium-prize.js';
import { noticeCounters } from '../services/notices.js';
import { getSubscriptionSummary } from '../services/subscription.js';
import { recordPageView } from '../services/view-stats.js';

// The exact fields the Telegram Login Widget sends. Only these participate in
// the signature check; our own auth-url params (return_to, origin) are ignored.
const TELEGRAM_FIELDS = [
  'id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash',
] as const;

function clientIp(request: FastifyRequest): string {
  return request.ip || 'unknown';
}

// The registrable domain of an origin: https://www.dentcast.org -> dentcast.org.
function siteOf(origin: string): string | null {
  try {
    const parts = new URL(origin).hostname.split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : null;
  } catch {
    return null;
  }
}

/**
 * Where the Telegram callback sends the browser back to. Exactly one of the
 * configured origins — never an attacker-supplied host — chosen in this order:
 * the origin the widget was served on, if configured; else the configured
 * origin on the SAME SITE (a reader on www.dentcast.org whose CORS list names
 * only the apex must land on dentcast.org, not on the first entry of the list,
 * which may be the OTHER mirror — where the cookie just set on api.dentcast.org
 * does not exist and the reader arrives signed out); else the first configured
 * origin (dev).
 */
function siteOriginFor(requested: string | undefined): string {
  if (requested && config.corsOrigins.includes(requested)) return requested;
  const site = requested ? siteOf(requested) : null;
  if (site) {
    const sameSite = config.corsOrigins.find((o) => siteOf(o) === site);
    if (sameSite) return sameSite;
  }
  return config.corsOrigins[0] ?? '';
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
    try {
      await sms.sendOtp(phone, code);
    } catch (err) {
      // The provider refused or timed out. Two things follow. The slots taken
      // above are handed back — the reader received nothing, so this attempt
      // must not count toward the hourly limits (five failed sends used to
      // lock a phone out for an hour). And the reader gets a Persian sentence,
      // never the provider's own message: the default 5xx body carried
      // «SMS.ir send failed: …» verbatim into the login modal.
      refund(`otp:phone:${phone}`);
      refund(`otp:ip:${clientIp(request)}`);
      request.log.error({ err }, 'otp sms send failed');
      return reply.code(502).send({
        error: 'sms_failed',
        message: 'ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.',
      });
    }

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

    setSessionCookie(reply, user!.id, request);
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

  // --- POST /auth/phone/link -------------------------------------------------
  // For a logged-in account with NO phone (typically a Telegram-only account):
  // prove ownership of a phone via OTP to RECOVER/MERGE an older phone account.
  // Telegram never gives us the phone, so this is the only way to reunite a
  // Telegram login with a pre-existing phone/streak account. Reuses the same OTP
  // issue/verify as login (call /auth/otp/request first to send the code).
  //   - phone already has an account -> merge THIS account into it (keep the
  //     phone account + its streak; it gains the Telegram identity), switch session.
  //   - phone is new -> just attach it to the current account.
  app.post('/auth/phone/link', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'code'],
        properties: { phone: { type: 'string' }, code: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const current = await loadUser(request);
    if (!current) {
      return reply.code(401).send({ error: 'unauthorized', message: 'ورود لازم است.' });
    }
    if (current.phone) {
      return reply.code(409).send({ error: 'already_has_phone', message: 'این حساب از قبل شماره‌ی موبایل دارد.' });
    }

    const { phone: rawPhone, code } = request.body as { phone: string; code: string };
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

    const outcome = await withTransaction(async (client) => {
      const existing = await one<{ id: string }>(
        'select id from profiles where phone = $1', [phone], client,
      );
      if (existing && existing.id !== current.id) {
        // The phone already identifies an (older) account: fold THIS account into
        // it, keeping the phone account and its streak. mergeProfiles carries the
        // Telegram id + live streak across.
        await mergeProfiles(client, current.id, existing.id);
        return { userId: existing.id, merged: true };
      }
      // No other account for this phone -> attach it to the current account.
      await query('update profiles set phone = $2 where id = $1', [current.id, phone], client);
      return { userId: current.id, merged: false };
    });

    setSessionCookie(reply, outcome.userId, request);
    const u = await one<{
      id: string; display_name: string; tier: string; current_streak: number; longest_streak: number;
    }>(
      'select id, display_name, tier, current_streak, longest_streak from profiles where id = $1',
      [outcome.userId],
    );
    return reply.send({ merged: outcome.merged, user: u ? publicUser(u) : null });
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

  // --- GET /auth/telegram/callback -------------------------------------------
  // The Telegram Login Widget (embedded on dentcast.org) redirects the browser
  // here with the signed payload as query params, PLUS our own return_to/origin.
  // We verify the signature, upsert the account, set the SAME session cookie the
  // OTP flow uses, and 302 the browser back to the site. On any failure we send
  // the browser to the static Persian error page instead of leaking a reason as
  // JSON on the API host.
  app.get('/auth/telegram/callback', async (request, reply) => {
    const q = request.query as Record<string, string>;

    // Decide where to send the browser afterward. `origin` must be one of the
    // configured site origins (never an attacker-supplied host); `return_to` a
    // same-site path. In dev, fall back to the first configured origin.
    const origin = siteOriginFor(q.origin);
    const returnTo = sanitizeReturnTo(q.return_to);
    const fail = (reason: string) =>
      reply.redirect(`${origin}/plus/auth-error.html?reason=${encodeURIComponent(reason)}`);

    // Accept a payload signed by either bot (.org or .ir); both map to the same
    // Telegram account since the user id is global.
    const botTokens = [config.auth.telegram.botToken, config.auth.telegram.botTokenIr]
      .filter(Boolean);
    if (botTokens.length === 0) return fail('not_configured');

    // Feed ONLY Telegram's own fields into the signature check.
    const tg: Record<string, string> = {};
    for (const k of TELEGRAM_FIELDS) {
      if (typeof q[k] === 'string' && q[k] !== '') tg[k] = q[k];
    }

    const verdict = verifyTelegramAuthAny(
      tg, botTokens, config.auth.telegram.maxAgeSeconds,
    );
    if (!verdict.ok) return fail(verdict.reason ?? 'bad_signature');

    const providerUserId = tg.id;                 // text form -> auth_identities
    const telegramIdNum = Number(tg.id);          // bigint    -> profiles.telegram_id
    const username = tg.username || null;
    const name = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || null;
    const photo = tg.photo_url || null;

    // The user may ALREADY be logged in (e.g. a phone/OTP account) and clicking
    // the Telegram button to connect Telegram. The widget's redirect is a
    // top-level navigation to this API host, so the existing session cookie
    // rides along and we can read it.
    const sessionUserId = readSession(request);

    // Resolve which profile this Telegram identity belongs to, in one
    // transaction.
    //   canonical = the account this Telegram ALREADY belongs to (its identity
    //               row, or a profile that carries this telegram_id), if any.
    //   session   = the account the browser is currently logged in as, if real.
    //
    //   (A) canonical exists:
    //         - not logged in, or logged in AS canonical -> use it (a normal
    //           returning Telegram login, or a re-connect of the same account).
    //         - logged in as a DIFFERENT account -> REJECT ('telegram_taken'). This
    //           Telegram already belongs to another account; we must NOT merge the
    //           two — that silently destroys the logged-in account and its phone
    //           (the bug that ate a phone number). To move Telegram to another
    //           account, disconnect it from the old one first (/auth/telegram/unlink).
    //   (B) no canonical, but logged in -> LINK Telegram to the current account
    //       (the "logged-in phone user connects a free Telegram" flow).
    //   (C) neither -> create a phone-less account with an EMPTY display_name so
    //       the mandatory-nickname gate (header.js -> openNameGate) fires.
    const outcome = await withTransaction<{ userId?: string; rejected?: string }>(async (client) => {
      const identity = await one<{ user_id: string }>(
        `select user_id from auth_identities
           where provider = 'telegram' and provider_user_id = $1`,
        [providerUserId], client,
      );
      const linkedProfile = identity
        ? null
        : await one<{ id: string }>(
            'select id from profiles where telegram_id = $1', [telegramIdNum], client,
          );
      const canonical = identity?.user_id ?? linkedProfile?.id ?? null;

      let sessionAccount: string | null = null;
      if (sessionUserId) {
        const s = await one<{ id: string }>(
          'select id from profiles where id = $1', [sessionUserId], client,
        );
        sessionAccount = s?.id ?? null;
      }

      let uid: string;
      if (canonical) {
        // (A) The Telegram already belongs to `canonical`.
        if (sessionAccount && sessionAccount !== canonical) {
          // Logged in as a DIFFERENT account: refuse. Merging would delete the
          // logged-in account (and its phone). No auto-merge — ever.
          return { rejected: 'telegram_taken' };
        }
        uid = canonical;
        if (!identity) {
          await query(
            `insert into auth_identities
               (user_id, provider, provider_user_id, username, display_name, photo_url)
             values ($1, 'telegram', $2, $3, $4, $5)`,
            [uid, providerUserId, username, name, photo], client,
          );
        }
      } else if (sessionAccount) {
        // (B) Link Telegram to the account the user is signed in as.
        uid = sessionAccount;
        await query(
          `insert into auth_identities
             (user_id, provider, provider_user_id, username, display_name, photo_url)
           values ($1, 'telegram', $2, $3, $4, $5)`,
          [uid, providerUserId, username, name, photo], client,
        );
      } else {
        // (C) Brand-new account.
        const created = await one<{ id: string }>(
          `insert into profiles (phone, telegram_id, display_name)
           values (null, $1, '') returning id`,
          [telegramIdNum], client,
        );
        uid = created!.id;
        await query(
          `insert into auth_identities
             (user_id, provider, provider_user_id, username, display_name, photo_url)
           values ($1, 'telegram', $2, $3, $4, $5)`,
          [uid, providerUserId, username, name, photo], client,
        );
      }

      const resolvedUid = uid;

      // Keep the chat_id fresh on the profile (the notification sender reads it)
      // and refresh the identity's cached username/name/photo on every login.
      await query(
        'update profiles set telegram_id = $2 where id = $1 and telegram_id is distinct from $2',
        [resolvedUid, telegramIdNum], client,
      );
      await query(
        `update auth_identities
            set username = $2, display_name = $3, photo_url = $4, updated_at = now()
          where provider = 'telegram' and provider_user_id = $1`,
        [providerUserId, username, name, photo], client,
      );
      return { userId: resolvedUid };
    });

    if (outcome.rejected) return fail(outcome.rejected);
    setSessionCookie(reply, outcome.userId!, request);
    return reply.redirect(`${origin}${returnTo}`);
  });

  // --- POST /auth/telegram/unlink --------------------------------------------
  // Disconnect Telegram from the current account. Requires the account to keep a
  // way in: only allowed if it also has a phone, so a Telegram-only user can't
  // lock themselves out. After this the Telegram id is free to connect elsewhere.
  app.post('/auth/telegram/unlink', async (request, reply) => {
    const user = await loadUser(request);
    if (!user) return reply.code(401).send({ error: 'unauthorized', message: 'ورود لازم است.' });
    if (!user.phone) {
      return reply.code(409).send({
        error: 'no_fallback',
        message: 'برای قطع تلگرام، حساب باید راه ورود دیگری داشته باشد؛ اول شماره موبایل خود را تأیید کنید.',
      });
    }
    await withTransaction(async (client) => {
      await query(
        "delete from auth_identities where user_id = $1 and provider = 'telegram'",
        [user.id], client,
      );
      await query('update profiles set telegram_id = null where id = $1', [user.id], client);
    });
    return reply.send({ ok: true });
  });

  // --- GET /me ---------------------------------------------------------------
  // Reads the session; part of the auth surface. Streak fields are caches that
  // the streak engine (later milestone) keeps current. The due-card field is
  // ABSENT for free users (never zero, never a locked stub).
  app.get('/me', async (request, reply) => {
    const user = await loadUser(request);

    // Page-view counter (see migration 0010). /me is called exactly once per page
    // view by every visitor — guests included, since the ad system must know
    // whether this visitor is premium before it renders anything — which makes
    // this the one place that can count guest traffic first-party. It is the
    // denominator the Spot report was missing: impressions alone cannot be judged
    // without the number of page views that could have produced them.
    //
    // Fire-and-forget on purpose: a counter must never delay a session check, and
    // a failed counter must never turn a valid session into a 401.
    recordPageView(user ? (user.tier === 'premium' ? 'premium' : 'plus') : 'anon')
      .catch(() => { /* telemetry never breaks auth */ });

    if (!user) return reply.code(401).send({ error: 'unauthorized' });

    // Sliding expiry. The cookie used to run out exactly SESSION_TTL_DAYS after
    // the login that set it, however active the reader was, so every regular
    // reader was signed out once a month for no reason they could see. /me is
    // the one call every page makes, so re-issuing the cookie here keeps a
    // reader signed in for as long as they keep coming back. Cheap: one header
    // on a response that is already no-store.
    setSessionCookie(reply, user.id, request);

    // ── ONE ROUND TRIP, NOT SIX ──
    //
    // Everything below reads a different table and none of it depends on any
    // other, but they used to be six awaits in a row — five of them inside the
    // object literal, where a sequential chain does not look like one. On a
    // database that answers in microseconds that is invisible; across a real
    // network it is six round trips on the ONE call every page view makes and
    // waits on, signed in or not: the header, the ad card's tier check, and
    // the first thing a reader sees after logging in or out.
    //
    // The due-card count stays out of it — it is premium-only, and issuing a
    // query for accounts that will not read the answer is the opposite of the
    // point. The streak reads `user`, which is already in hand.
    const [shownStreak, activePathway, pendingGrant, subscription, counters] = await Promise.all([
      // Show the streak only while it is still alive. The cache resets lazily
      // (on the next qualifying action), so after an unbridgeable gap the
      // cached number is stale — the client must see 0, not last week's run.
      displayStreak(pool, user.id, user, dayInTz(new Date())),
      getActivePathwaySummary(user.id),
      getPendingPremiumGrant(user.id),
      getSubscriptionSummary(user.id),
      noticeCounters(user.id),
    ]);

    const me: Record<string, unknown> = {
      id: user.id,
      display_name: user.display_name,
      tier: user.tier,
      phone: user.phone,
      telegram_linked: user.telegram_id !== null,
      bale_linked: user.bale_id !== null,
      current_streak: shownStreak,
      longest_streak: user.longest_streak,
      last_active_day: user.last_active_day,
      // Surface settings (e.g. reminders) so the profile can reflect saved
      // toggle state. Without this the reminder checkboxes always render empty
      // after a reload even though PATCH /me persisted them.
      settings: user.settings ?? {},
      active_pathway: activePathway,
      // The one-time "you won a week of premium" banner (dashboard.js). Present
      // for every tier (a free user's grant already flipped their tier by the
      // time they see this, but the field is computed independent of tier so
      // there is no ordering assumption between the two).
      pending_premium_grant: pendingGrant,
      // Where this account stands: expiry, days of access left, and whether it
      // is a lifetime account. Null for anyone who has never subscribed, and
      // null for a league-prize premium too — the prize is not a subscription
      // and pending_premium_grant above is what speaks for it.
      //
      // Deliberately independent of `tier`: the renewal banner has to appear for
      // someone whose days are running out, i.e. while they are still premium,
      // and the "your subscription ended" message has to appear once they are
      // not. A field that only existed for premium users could say neither.
      subscription,
      // The two numbers behind the account icon. `unread_notices` paints the dot
      // — a silent mark that never covers anything, so it is the one signal that
      // is safe to show while somebody is mid-paragraph. `pending_achievements`
      // is the celebration queue, which the client only ever opens on a calm
      // surface (the profile or the dashboard), never on an article.
      //
      // Both are indexed counts on purpose: /me is called once per page view by
      // every visitor, and it is the call the sponsor card waits on before it can
      // render, so nothing expensive may be added to it.
      ...counters,
    };
    // due_card_count is premium-only and intentionally absent for free users.
    if (user.tier === 'premium') {
      // Joined to the `highlights` VIEW (migration 0066) so a soft-deleted
      // highlight's card — which still exists, box intact, waiting for an
      // undo — is not counted as due for a review page that cannot show it.
      const due = await pool.query<{ n: number }>(
        `select count(*)::int as n from card_state cs
           join highlights h on h.id = cs.highlight_id
          where cs.user_id = $1 and (cs.next_review_at is null or cs.next_review_at <= now())`,
        [user.id],
      );
      me.due_card_count = due.rows[0]?.n ?? 0;
    }
    return reply.send(me);
  });
}
