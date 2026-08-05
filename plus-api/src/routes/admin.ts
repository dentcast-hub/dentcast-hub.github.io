import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAdmin } from '../middleware/basic-auth.js';
import { computeKpis, type Kpis } from '../services/kpis.js';
import {
  onArticlePublished, runFreeDigest, runPremiumBacklog, backfillExistingContent,
} from '../services/article-notify.js';
import { runReactivationNudges } from '../services/reactivation.js';
import { runStreakReminders } from '../services/streak-reminder.js';
import { one } from '../db.js';
import { normalizePhone } from '../services/phone.js';
import {
  activateMonths, grantLifetime, revokeSubscription, getSubscription,
  summarizeSubscription, sweepExpiredSubscriptions, type Subscription,
} from '../services/subscription.js';
import { getCapacity } from '../services/payment-capacity.js';
import {
  getSpotStats, defaultRange, isCalendarDay, SPOT_HOSTS, type GroupBy,
} from '../services/spot-stats.js';
import { withPageViews } from '../services/view-stats.js';
import { notifications, ai } from '../providers/registry.js';
import {
  probe, proxyConfigured, proxyHost, outboundFetch, describeError, type ProbeResult,
} from '../providers/outbound.js';
import { config } from '../config.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * The shape every admin subscription endpoint answers with. Built from the same
 * summarizeSubscription() that GET /me uses, so "days left" cannot come to mean
 * one thing to the founder and another to the user looking at their own banner.
 */
function subscriptionView(phone: string, userId: string, sub: Subscription | null) {
  const summary = summarizeSubscription(sub);
  return {
    ok: true,
    user_id: userId,
    phone,
    subscription: summary && { ...summary, started_at: sub!.started_at },
    is_premium: summary?.is_premium ?? false,
    days_left: summary?.days_left ?? null,
  };
}

function fmtPct(v: number | null): string {
  return v == null ? '—' : v.toFixed(1) + '٪';
}
function fmtNum(v: number | null): string {
  return v == null ? '—' : String(v);
}

function renderHtml(k: Kpis): string {
  const d7Rows = k.d7_survival_by_tier.length
    ? k.d7_survival_by_tier
        .map((r) => `<tr><td>${r.tier}</td><td>${r.cohort}</td><td>${r.kept}</td><td>${fmtPct(r.pct)}</td></tr>`)
        .join('')
    : '<tr><td colspan="4">هنوز داده‌ای نیست</td></tr>';

  const card = (n: string, title: string, value: string, sub: string) =>
    `<div class="card"><div class="k">${n}</div><h3>${title}</h3><div class="v">${value}</div><div class="s">${sub}</div></div>`;

  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>KPI ادمین | دنت‌کست پلاس</title>
<style>
  body{margin:0;background:#0f1420;color:#e8eef7;font-family:system-ui,'Segoe UI',Tahoma,sans-serif;line-height:1.8}
  .wrap{max-width:880px;margin:0 auto;padding:22px 16px 60px}
  h1{font-size:1.3rem}
  .muted{color:#93a1b8;font-size:.85rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:16px}
  .card{background:#171e2d;border:1px solid #2a3448;border-radius:14px;padding:14px 16px}
  .card .k{color:#4f9cf0;font-weight:800;font-size:.8rem}
  .card h3{margin:.2rem 0;font-size:.95rem;color:#c8d4e6}
  .card .v{font-size:1.8rem;font-weight:900}
  .card .s{color:#93a1b8;font-size:.82rem}
  table{width:100%;border-collapse:collapse;margin-top:8px;background:#171e2d;border:1px solid #2a3448;border-radius:14px;overflow:hidden}
  th,td{padding:8px 12px;text-align:center;border-bottom:1px solid #2a3448}
  th{color:#93a1b8;font-weight:700}
</style></head><body><div class="wrap">
  <h1>پیشخوان بنیان‌گذار</h1>
  <div class="muted">تولید: ${k.generated_at} · منطقه زمانی: ${k.tz}</div>
  <div class="grid">
    ${card('KPI 1', 'تقاضای ناشناس', String(k.anonymous_demand.workbench_clicks),
      `کلیک میز کار مهمان · تبدیل تقریبی: ${fmtPct(k.anonymous_demand.conversion_pct_approx)} · ثبت‌نام: ${k.anonymous_demand.total_signups}`)}
    ${card('KPI 2', 'فعال‌سازی (۴۸ ساعت)', fmtPct(k.activation_48h_pct.pct),
      `اولین هایلایت در ۴۸ ساعت · گروه: ${k.activation_48h_pct.cohort}`)}
    ${card('KPI 3', 'بازگشت روز اول', fmtPct(k.d1_return_pct.pct), `گروه: ${k.d1_return_pct.cohort}`)}
    ${card('KPI 5', 'عمق (میانه هفتگی)', fmtNum(k.depth_median_highlights_per_user_week),
      'میانه هایلایت هر کاربر فعال در هفته')}
    ${card('KPI 6', 'استفاده از آرشیو', fmtNum(k.archive_usage.sessions_per_free_user_week),
      `جلسه مرور دستی هر کاربر رایگان در هفته · کل جلسات ۷ روز: ${k.archive_usage.sessions_last_7d}`)}
  </div>
  <h3 style="margin-top:22px">درگیری و اتصال کاربران</h3>
  <div class="grid">
    ${card('', 'کاربرانِ امتیازدار', String(k.engagement.scored_users), 'امتیاز ≥ ۱ (واقعاً درگیر شده‌اند)')}
    ${card('', 'فعال امروز', String(k.engagement.active_today), 'فعالیتِ واجد شرایط امروز (تهران)')}
    ${card('', 'استریک زنده', String(k.engagement.streak_alive), 'استریک ثبت‌شده ≥ ۱')}
    ${card('', 'نوتیف روشن', String(k.engagement.notif_on), 'حداقل یک یادآوری فعال')}
    ${card('', 'اتصال بله', String(k.engagement.bale_connected), 'کاربرانِ متصل به بله')}
    ${card('', 'اتصال تلگرام', String(k.engagement.telegram_connected), 'کاربرانِ متصل به تلگرام')}
    ${card('', 'پوش مرورگر', String(k.engagement.push_subscribed), 'اشتراکِ نوتیفِ مرورگر/PWA')}
  </div>
  <h3 style="margin-top:22px">KPI 4 — ماندگاری روز هفتم بر اساس پلن</h3>
  <table><thead><tr><th>پلن</th><th>گروه</th><th>مانده</th><th>درصد</th></tr></thead><tbody>${d7Rows}</tbody></table>
  <p class="muted" style="margin-top:14px">KPI ها از user_activity و anon_events محاسبه می‌شوند. تبدیل KPI 1 تقریبی است چون رویدادهای ناشناس هویت‌محور نیستند.</p>
</div></body></html>`;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/kpis', async (_request, reply) => {
    const kpis = await computeKpis();
    return reply.send(kpis);
  });

  app.get('/admin', async (_request, reply) => {
    const kpis = await computeKpis();
    return reply.type('text/html; charset=utf-8').send(renderHtml(kpis));
  });

  // GET /admin/spot/stats?from=&to=&group_by=day|week|month - the read path for
  // Spot telemetry. Without it the counters would accumulate unseen. Sums the
  // `spot_stats` counters over the window and returns the cross-cuts the ad
  // business actually needs: per slot (which placement earns), per creative
  // (which campaign earns), per viewer (guest vs signed-in), plus the raw
  // period × slot × creative × viewer rows for a chart.
  // Dates are Asia/Tehran calendar days ('YYYY-MM-DD'), inclusive on both ends;
  // default window is the last 30 days. `week` buckets start on SATURDAY (the
  // Iranian week), matching the league/streak week used elsewhere.
  app.get('/admin/spot/stats', async (request, reply) => {
    const q = request.query as { from?: string; to?: string; group_by?: string; host?: string };
    const fallback = defaultRange();
    const from = q.from ?? fallback.from;
    const to = q.to ?? fallback.to;
    if (!isCalendarDay(from) || !isCalendarDay(to)) {
      return reply.code(400).send({ error: 'invalid_date', message: 'from/to باید YYYY-MM-DD باشند.' });
    }
    if (from > to) {
      return reply.code(400).send({ error: 'invalid_range', message: 'from نباید بعد از to باشد.' });
    }
    const groupBy = (q.group_by ?? 'day') as GroupBy;
    if (!['day', 'week', 'month'].includes(groupBy)) {
      return reply.code(400).send({ error: 'invalid_group_by' });
    }
    // Impressions are returned together with the page views that could have
    // produced them: a delivery number is unreadable on its own, and the guest
    // ratio in particular is the only way to tell a quiet day apart from a hole
    // in the pipeline.
    // ?host=dentcast.ir|dentcast.org|unknown narrows the report to one mirror.
    // Rejected rather than ignored: a silently-dropped filter would return the
    // combined number under a heading that says otherwise.
    if (q.host !== undefined && !SPOT_HOSTS.has(q.host)) {
      return reply.code(400).send({
        error: 'invalid_host',
        message: 'host باید یکی از dentcast.ir | dentcast.org | unknown باشد.',
      });
    }
    return reply.send(await withPageViews(await getSpotStats({ from, to, groupBy, host: q.host })));
  });

  // POST /admin/articles/published - the `article_published` event. The publish
  // pipeline calls this once per new page. Premium users are notified immediately
  // when the publish lands inside the awake window (09:00-22:00 Tehran) and on the
  // next 09:00 sweep otherwise — `deferred` in the response says which; the free
  // digest is scheduled either way (notify_free_after = published_at + delay).
  app.post('/admin/articles/published', {
    schema: {
      body: {
        type: 'object',
        required: ['content_id', 'title', 'url'],
        properties: {
          content_id: { type: 'string', minLength: 1 },
          title: { type: 'string', minLength: 1 },
          url: { type: 'string', minLength: 1 },
          pulse: { type: 'string' }, // the Pulse sentence (brain caption); optional
          published_at: { type: 'string' }, // ISO; defaults to now server-side
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { content_id: string; title: string; url: string; pulse?: string; published_at?: string };
    const publishedAt = b.published_at ? new Date(b.published_at) : undefined;
    if (publishedAt && Number.isNaN(publishedAt.getTime())) {
      return reply.code(400).send({ error: 'invalid_published_at' });
    }
    const result = await onArticlePublished({
      contentId: b.content_id, title: b.title, url: b.url, pulse: b.pulse, publishedAt,
    });
    return reply.send({ ok: true, ...result });
  });

  // POST /admin/articles/run-free-digest - manually trigger the free digest run
  // (the cron does this at 21:00 Asia/Tehran). Useful for ops and verification.
  app.post('/admin/articles/run-free-digest', async (_request, reply) => {
    const result = await runFreeDigest(new Date());
    return reply.send({ ok: true, ...result });
  });

  // POST /admin/articles/run-premium-backlog - manually release the premium
  // pushes held overnight by the awake window (the sweep does this at 09:00
  // Tehran). Twin of run-free-digest; useful to verify a late-night publish
  // actually went out rather than waiting until morning to find out.
  app.post('/admin/articles/run-premium-backlog', async (_request, reply) => {
    const result = await runPremiumBacklog(new Date());
    return reply.send({ ok: true, ...result });
  });

  // POST /admin/articles/backfill - one-time go-live step: mark every existing
  // published page as already-notified so old-article edits never fire premium.
  // Idempotent; run once before enabling the auto-publish Action.
  app.post('/admin/articles/backfill', async (_request, reply) => {
    const result = await backfillExistingContent(new Date());
    return reply.send({ ok: true, ...result });
  });

  // POST /admin/reactivation/run - manually fire the no-streak reactivation nudge
  // run (the cron does this daily at REACTIVATION_HOUR). Ops/verification only.
  app.post('/admin/reactivation/run', async (_request, reply) => {
    const result = await runReactivationNudges(new Date());
    return reply.send({ ok: true, ...result });
  });

  // POST /admin/streak-reminder/run - manually fire the savable-streak reminder
  // run (the cron does this daily at STREAK_REMINDER_HOUR). Ops/verification only.
  app.post('/admin/streak-reminder/run', async (_request, reply) => {
    const result = await runStreakReminders(new Date());
    return reply.send({ ok: true, ...result });
  });

  // GET /admin/notify/health - is the notification pipeline actually able to
  // deliver, RIGHT NOW? Read-only: it sends no message to anyone. It answers the
  // two questions that cost a night on 2026-07-26 — is each channel configured
  // (token / VAPID pair present), and can this container REACH each channel's
  // host — because a silent channel looks identical from the outside whether the
  // secret is missing or the network is blocked.
  // ?probe=0 skips the network checks and reports configuration only.
  app.get('/admin/notify/health', async (request, reply) => {
    const q = request.query as { probe?: string };
    const withProbes = q.probe !== '0';

    const names = config.notify.provider.split(',').map((s) => s.trim()).filter(Boolean);
    const on = (n: string): boolean => names.includes(n);

    const channels = {
      webpush: {
        enabled: on('webpush'),
        configured: Boolean(config.push.vapidPublicKey && config.push.vapidPrivateKey),
        vapid_public: Boolean(config.push.vapidPublicKey),
        vapid_private: Boolean(config.push.vapidPrivateKey),
      },
      telegram: {
        enabled: on('telegram'),
        configured: Boolean(config.notify.telegramBotToken),
        bot_token: Boolean(config.notify.telegramBotToken),
      },
      bale: {
        enabled: on('bale'),
        configured: Boolean(config.notify.baleBotToken),
        bot_token: Boolean(config.notify.baleBotToken),
        api_base: config.notify.baleApiBase,
      },
    };

    // One host per channel that MUST be reachable for it to deliver. Web push has
    // two, because a user's subscription lives on whichever service their browser
    // uses (Chrome -> FCM, Safari/iOS -> APNs) and either can be blocked alone.
    // `international` decides whether the proxy is even relevant: Bale is domestic.
    const targets: { channel: string; url: string; international: boolean }[] = [];
    if (channels.webpush.enabled) {
      targets.push({ channel: 'webpush', url: 'https://fcm.googleapis.com', international: true });
      targets.push({ channel: 'webpush', url: 'https://web.push.apple.com', international: true });
    }
    if (channels.telegram.enabled) {
      targets.push({ channel: 'telegram', url: 'https://api.telegram.org', international: true });
    }
    if (channels.bale.enabled) {
      targets.push({ channel: 'bale', url: config.notify.baleApiBase, international: false });
    }

    const probes: (ProbeResult & { channel: string })[] = [];
    if (withProbes) {
      const runs = targets.flatMap((t) => {
        // Domestic hosts are checked direct only. International hosts are checked
        // direct AND (when a proxy is set) through it, so the answer distinguishes
        // "the pod has no route" from "the proxy is broken".
        const viaProxy = t.international && proxyConfigured();
        const list = [probe(t.url, { proxy: false }).then((r) => ({ ...r, channel: t.channel }))];
        if (viaProxy) list.push(probe(t.url, { proxy: true }).then((r) => ({ ...r, channel: t.channel })));
        return list;
      });
      probes.push(...(await Promise.all(runs)));
    }

    const reachable = (channel: string): boolean | null => {
      const own = probes.filter((p) => p.channel === channel);
      if (own.length === 0) return null; // not probed
      // Web push needs only the service its subscribers actually use, so ANY
      // reachable host counts as a live channel.
      return own.some((p) => p.ok);
    };

    const problems: string[] = [];
    for (const [name, c] of Object.entries(channels)) {
      if (!c.enabled) continue;
      if (!c.configured) problems.push(`${name}: کلید/توکن در محیط اجرا تنظیم نشده — پیام بی‌صدا رد می‌شود.`);
      const r = reachable(name);
      if (r === false) {
        problems.push(
          `${name}: هیچ‌کدام از مقصدهایش از این کانتینر در دسترس نیست`
          + (proxyConfigured() ? ' (حتی از طریق پراکسی).' : ' — اگر بقیهٔ کانال‌ها سالم‌اند، خروجی بین‌الملل قطع است: OUTBOUND_PROXY_URL را تنظیم کن.'),
        );
      }
    }
    if (names.length === 0) problems.push('NOTIFY_PROVIDER خالی است — هیچ کانالی فعال نیست.');

    return reply.send({
      ok: problems.length === 0,
      channel: notifications.name, // the fan-out actually in use, e.g. multi(webpush+telegram+bale)
      provider: config.notify.provider,
      channels: {
        webpush: { ...channels.webpush, reachable: reachable('webpush') },
        telegram: { ...channels.telegram, reachable: reachable('telegram') },
        bale: { ...channels.bale, reachable: reachable('bale') },
      },
      proxy: { configured: proxyConfigured(), host: proxyHost() },
      timeouts_ms: { send: config.outbound.timeoutMs, probe: config.outbound.probeTimeoutMs },
      probes,
      problems,
    });
  });

  // POST /admin/notify/test - send a REAL test notification to one user via the
  // configured channels (fan-out: web push AND Telegram). Locate the user by
  // phone, telegram_id, or user_id. Use this to verify end-to-end delivery (e.g.
  // that a Telegram-linked account actually receives the message). Check the
  // response's channel flags and, on Telegram failure, the server logs
  // ([notify:telegram:...]).
  app.post('/admin/notify/test', {
    schema: {
      body: {
        type: 'object',
        properties: {
          phone: { type: 'string' },
          telegram_id: { type: 'integer' },
          user_id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { phone?: string; telegram_id?: number; user_id?: string };

    let row: { id: string; telegram_id: number | null } | null = null;
    if (b.user_id) {
      row = await one('select id, telegram_id from profiles where id = $1', [b.user_id]);
    } else if (b.telegram_id) {
      row = await one('select id, telegram_id from profiles where telegram_id = $1', [b.telegram_id]);
    } else if (b.phone) {
      const phone = normalizePhone(b.phone);
      if (phone) row = await one('select id, telegram_id from profiles where phone = $1', [phone]);
    } else {
      return reply.code(400).send({ error: 'no_target', message: 'phone | telegram_id | user_id لازم است.' });
    }
    if (!row) return reply.code(404).send({ error: 'no_profile' });

    const message: NotificationMessage = {
      title: 'دنت‌کست پلاس',
      body: 'پیام تست — اتصال نوتیف شما درست کار می‌کند ✅',
      url: '/plus/',
      tag: 'notify_test',
    };
    await notifications.send(row.id, message, 'system');

    return reply.send({
      ok: true,
      user_id: row.id,
      channel: notifications.name,          // e.g. multi(webpush+telegram)
      telegram_linked: row.telegram_id != null,
    });
  });

  // GET /admin/ai/health - is «دستیار هوشمند» actually wired to a model RIGHT NOW?
  // Read-only and FREE: the probe lists models (GET {base}/models), it never asks
  // for a completion, so checking costs no tokens.
  //
  // This exists for the same reason /admin/notify/health does: from outside, an
  // assistant answering from the `stub` provider is indistinguishable from one
  // answering from the real model — both return a sensible question — and the
  // route that would tell you is behind a premium session. It also separates the
  // two failures that look identical in the UI: env not set (still on stub) vs
  // env set but this container cannot reach the gateway.
  app.get('/admin/ai/health', async (request, reply) => {
    const q = request.query as { probe?: string; deep?: string };
    const withProbe = q.probe !== '0';
    const live = config.ai.provider !== 'stub';

    // Diagnostic for "I added them in the panel but the app says they are unset":
    // the NAMES (never the values) of every env var that looks like it was meant
    // for this feature. A name with a stray space, a lowercase letter or a dash
    // reads as "added" in a panel but is invisible to process.env.AI_PROVIDER, and
    // that is indistinguishable from "never added" until you can see the keys.
    // Admin-authed and values-free, so it leaks nothing a key holder lacks.
    const envKeysSeen = Object.keys(process.env)
      .filter((k) => /ai|assist|model|gateway|deepseek|arvancloudai/i.test(k))
      .filter((k) => !/^(npm_|PATH$)/i.test(k))
      .sort();

    const configured = {
      provider: config.ai.provider,
      api_base: Boolean(config.ai.apiBase),
      api_key: Boolean(config.ai.apiKey),
      model: config.ai.model || null,
      json_mode_requested: config.ai.jsonMode,
      timeout_ms: config.ai.timeoutMs,
      max_attempts: config.ai.maxAttempts,
    };

    // ?deep=1 additionally times ONE real narrowing round. The /models probe
    // proves reachability and auth in a few hundred ms and says nothing about
    // GENERATION speed — which, on a reasoning model, is the number that decides
    // whether the assistant is usable. Opt-in because it costs tokens, and
    // measured HERE rather than from a laptop: this is the path and the network
    // a user's request actually takes.
    //
    // It reports which provider it timed, so a 1ms result from the stub can
    // never be mistaken for a fast model.
    const runDeep = async () => {
      if (q.deep !== '1') return null;
      const t0 = Date.now();
      try {
        const out = await ai.narrowCase({
          description: 'روکش بیمار مدام می‌افتد و سمان قبلی شسته شده',
          history: [],
          catalog: [
            { key: 'probe-a', label: 'سمان' },
            { key: 'probe-b', label: 'روکش' },
          ],
        });
        return {
          ok: true, provider: ai.name, ms: Date.now() - t0,
          done: out.done, options: out.done ? undefined : out.options.length,
        };
      } catch (err) {
        return { ok: false, provider: ai.name, ms: Date.now() - t0, error: describeError(err, config.ai.timeoutMs) };
      }
    };

    // Nothing to network-probe on stub: it makes no network call by design.
    if (!live || !withProbe || !config.ai.apiBase) {
      return reply.send({
        ok: !live || Boolean(config.ai.apiBase && config.ai.apiKey),
        live,
        configured,
        env_keys_seen: envKeysSeen,
        probe: null,
        deep: await runDeep(),
      });
    }

    const started = Date.now();
    let result: { ok: boolean; status?: number; models?: string[]; error?: string };
    try {
      const res = await outboundFetch(
        `${config.ai.apiBase}/models`,
        { headers: { authorization: `Bearer ${config.ai.apiKey}` } },
        { proxy: false, timeoutMs: config.ai.timeoutMs },
      );
      const body = (await res.json().catch(() => ({}))) as { data?: Array<{ id?: string }> };
      result = {
        ok: res.ok,
        status: res.status,
        models: (body.data ?? []).map((m) => String(m.id)).slice(0, 10),
      };
    } catch (err) {
      result = { ok: false, error: describeError(err, config.ai.timeoutMs) };
    }

    return reply.send({
      ok: result.ok,
      live,
      configured,
      env_keys_seen: envKeysSeen,
      probe: { ...result, ms: Date.now() - started },
      deep: await runDeep(),
    });
  });

  // POST /admin/users/set-tier — RETIRED, deliberately answering instead of
  // vanishing.
  //
  // It wrote `profiles.tier` directly, which is now a derived cache with exactly
  // three sanctioned writers (see the contract atop services/subscription.ts).
  // Every account it ever touched became premium with nothing behind it, and
  // migration 0019 exists solely to clean up after it — including the founders'
  // own accounts, which the nightly sweep would otherwise have been right to
  // revoke. Leaving it in place would keep manufacturing exactly the rows that
  // migration had to repair.
  //
  // A 410 rather than a deleted route: whoever reaches for this has a real
  // intention, and the useful answer names where it went. There is no 'premium'
  // any more without saying for how long — which is the whole point.
  app.post('/admin/users/set-tier', async (_request, reply) => reply.code(410).send({
    error: 'gone',
    message: 'این مسیر بازنشسته شده. برای هدیه‌ی اشتراک از /admin/subscriptions/grant '
      + '(با months) یا /admin/subscriptions/grant-lifetime استفاده کنید، و برای پس‌گرفتن '
      + 'از /admin/subscriptions/revoke.',
    replaced_by: [
      'POST /admin/subscriptions/grant',
      'POST /admin/subscriptions/grant-lifetime',
      'POST /admin/subscriptions/revoke',
    ],
  }));

  // --- Subscriptions ---------------------------------------------------------
  // Gifting premium by hand, through the same engine the payment gateway will
  // use. These exist so that /admin/users/set-tier above never has to be reached
  // for again: it writes `profiles.tier` and nothing else, which leaves an
  // account premium with no subscription behind it — the exact shape the nightly
  // sweep revokes. Anything granted here has a real subscription row, so it
  // survives the sweep because it is genuinely valid, not because of an
  // exception carved out for it.
  //
  // Keyed by phone rather than user_id: it is what the founder actually has when
  // someone asks for access, and it is what /auth already identifies people by.

  /** Resolve a raw phone to a profile, or reply with the right error. */
  async function resolvePhone(
    rawPhone: string,
    reply: FastifyReply,
  ): Promise<{ id: string; phone: string } | null> {
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      void reply.code(400).send({ error: 'invalid_phone', message: 'شماره‌ی موبایل معتبر نیست.' });
      return null;
    }
    const row = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
    if (!row) {
      void reply.code(404).send({ error: 'no_profile', message: 'این شماره هنوز ثبت‌نام نکرده.' });
      return null;
    }
    return { id: row.id, phone };
  }

  const phoneBody = (extra: Record<string, unknown> = {}, required: string[] = []) => ({
    schema: {
      body: {
        type: 'object',
        required: ['phone', ...required],
        properties: { phone: { type: 'string' }, ...extra },
      },
    },
  });

  // GET /admin/subscriptions?phone= — read the state before changing it.
  app.get('/admin/subscriptions', {
    schema: { querystring: { type: 'object', required: ['phone'], properties: { phone: { type: 'string' } } } },
  }, async (request, reply) => {
    const { phone: rawPhone } = request.query as { phone: string };
    const who = await resolvePhone(rawPhone, reply);
    if (!who) return reply;
    return reply.send(subscriptionView(who.phone, who.id, await getSubscription(who.id)));
  });

  // POST /admin/subscriptions/grant { phone, months } — gift N months.
  // Extends an existing subscription rather than replacing it, so gifting a
  // month to an unhappy paying subscriber adds a month instead of costing them
  // whatever they had left.
  app.post('/admin/subscriptions/grant',
    phoneBody({ months: { type: 'integer', minimum: 1, maximum: 60 } }, ['months']),
    async (request, reply) => {
      const { phone: rawPhone, months } = request.body as { phone: string; months: number };
      const who = await resolvePhone(rawPhone, reply);
      if (!who) return reply;
      const sub = await activateMonths(who.id, months, { source: 'admin' });
      return reply.send(subscriptionView(who.phone, who.id, sub));
    });

  // POST /admin/subscriptions/grant-lifetime { phone } — premium with no end.
  // Deliberately its own endpoint and not a `months: 'lifetime'` variant of the
  // one above: a typo in a number field should never be able to give away a
  // permanent account.
  app.post('/admin/subscriptions/grant-lifetime', phoneBody(), async (request, reply) => {
    const { phone: rawPhone } = request.body as { phone: string };
    const who = await resolvePhone(rawPhone, reply);
    if (!who) return reply;
    const sub = await grantLifetime(who.id, { source: 'admin' });
    return reply.send(subscriptionView(who.phone, who.id, sub));
  });

  // POST /admin/subscriptions/revoke { phone } — undo a mistaken gift.
  // Leaves `profiles.tier` for the sweep to settle: a league prize may still be
  // holding this account up, and revoking here has no way to know that.
  app.post('/admin/subscriptions/revoke', phoneBody(), async (request, reply) => {
    const { phone: rawPhone } = request.body as { phone: string };
    const who = await resolvePhone(rawPhone, reply);
    if (!who) return reply;
    const removed = await revokeSubscription(who.id, { source: 'admin' });
    return reply.send({ ...subscriptionView(who.phone, who.id, null), removed });
  });

  // GET /admin/payments/capacity — how much of this month's gateway ceiling is
  // left, and which plans still fit under it.
  //
  // Reports the conservative count (what actually gates sales) alongside the
  // verified-only count, because the gap between them IS the cost of not yet
  // knowing whether Zibal forgives an abandoned payment. Seeing both is what
  // turns PAYMENT_CAP_COUNTS_ATTEMPTS from a guess into a decision.
  app.get('/admin/payments/capacity', async (_request, reply) => {
    return reply.send({ ok: true, ...await getCapacity() });
  });

  // POST /admin/subscriptions/run-sweep — run the nightly reconciliation now
  // (the cron does this at 00:00 Asia/Tehran). Twin of run-free-digest.
  //
  // This is what makes "tier is derived" an operable claim rather than a comment:
  // whatever `profiles.tier` currently says, one call puts it back in step with
  // what people have paid for. It is the manual lever for a revoke that should
  // take effect immediately, the way to watch a whole lifecycle in one sitting
  // rather than across two midnights, and the recovery path if the timer ever
  // dies unnoticed. Idempotent, so it is always safe to press.
  app.post('/admin/subscriptions/run-sweep', async (_request, reply) => {
    const result = await sweepExpiredSubscriptions(new Date());
    return reply.send({ ok: true, ...result });
  });
}
