import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAdmin } from '../middleware/basic-auth.js';
import { computeKpis, type Kpis } from '../services/kpis.js';
import {
  onArticlePublished, runFreeDigest, runPremiumBacklog, backfillExistingContent,
} from '../services/article-notify.js';
import { runReactivationNudges } from '../services/reactivation.js';
import { runStreakReminders } from '../services/streak-reminder.js';
import { one, query } from '../db.js';
import { normalizePhone } from '../services/phone.js';
import {
  activateMonths, grantLifetime, revokeSubscription, getSubscription,
  summarizeSubscription, sweepExpiredSubscriptions, type Subscription,
} from '../services/subscription.js';
import { getCapacity } from '../services/payment-capacity.js';
import { reconcilePendingPayments } from '../services/payment-reconcile.js';
import { pillarRoster } from '../services/pillar.js';
import { pillarWelcomeBackfill } from '../services/pillar-notify.js';
import {
  availableCredits, creditPercent, pickCredits, CREDIT_CAP_PERCENT,
} from '../services/discount-credits.js';
import {
  pendingRedemptions, approveRedemption, rejectRedemption,
} from '../services/gift-redemption.js';
import {
  getSpotStats, defaultRange, isCalendarDay, SPOT_HOSTS, type GroupBy,
} from '../services/spot-stats.js';
import { withPageViews } from '../services/view-stats.js';
import {
  recordBroadcast, claimBroadcastPush, pendingBroadcastPushes, type NoticeAudience,
} from '../services/notices.js';
import { sendCapped, inAwakeWindow } from '../services/notify-policy.js';
import {
  deliverBroadcast, broadcastMessage, releaseHeldBroadcastPushes,
} from '../services/broadcast.js';
import { notifications, ai } from '../providers/registry.js';
import {
  probe, proxyForChannel, hostOfProxy, outboundFetch, describeError,
  type ProbeResult, type NotifyChannel,
} from '../providers/outbound.js';
import { telegramBreakerStatus } from '../providers/notifications/telegram.js';
import { config } from '../config.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * The shape every admin subscription endpoint answers with. Built from the same
 * summarizeSubscription() that GET /me uses, so "days left" cannot come to mean
 * one thing to the founder and another to the user looking at their own banner.
 */
/**
 * `phone` stays in the response for every existing reader, but it is null for a
 * Telegram-only account — so username/display_name ride along, or the answer
 * would name nobody.
 */
function subscriptionView(
  who: { id: string; phone: string | null; username: string | null; display_name: string | null },
  sub: Subscription | null,
) {
  const summary = summarizeSubscription(sub);
  return {
    ok: true,
    user_id: who.id,
    phone: who.phone,
    username: who.username,
    display_name: who.display_name,
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
  form.bc{background:#171e2d;border:1px solid #2a3448;border-radius:14px;padding:14px 16px;margin-top:8px;
    display:flex;flex-direction:column;gap:9px}
  form.bc label{font-size:.82rem;color:#93a1b8}
  form.bc input[type=text],form.bc textarea,form.bc select{width:100%;box-sizing:border-box;
    background:#0f1420;color:#e8eef7;border:1px solid #2a3448;border-radius:9px;padding:9px 11px;
    font:inherit;font-size:.92rem}
  form.bc textarea{min-height:64px;resize:vertical}
  form.bc .row{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
  form.bc .chk{display:flex;gap:6px;align-items:center;font-size:.86rem;color:#c8d4e6}
  form.bc button{background:#2f7de0;color:#fff;border:0;border-radius:999px;padding:10px 22px;
    font:inherit;font-weight:800;cursor:pointer;align-self:flex-start}
  form.bc button:disabled{opacity:.55;cursor:default}
  #bcOut{font-size:.85rem;color:#93a1b8;min-height:1.6em}
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

  <h3 style="margin-top:26px">اطلاعیهٔ بنیان‌گذار</h3>
  <div class="muted">در «اطلاعیه‌ها»ی کاربر می‌نشیند و نقطهٔ قرمز را روشن می‌کند — همین حالا، در هر ساعتی. یک ردیف برای همه؛ چیزی برای هیچ‌کس جداگانه فرستاده نمی‌شود.</div>
  <form class="bc" id="bcForm" onsubmit="return false">
    <div><label for="bcTitle">عنوان</label><input id="bcTitle" type="text" maxlength="120" placeholder="مثلاً: فردا سایت حدود یک ساعت به‌روزرسانی می‌شود"></div>
    <div><label for="bcBody">متن (اختیاری)</label><textarea id="bcBody" maxlength="600"></textarea></div>
    <div class="row">
      <div style="flex:1 1 200px"><label for="bcUrl">لینک (اختیاری)</label><input id="bcUrl" type="text" placeholder="/plus/"></div>
      <div style="flex:0 0 160px"><label for="bcAud">مخاطب</label><select id="bcAud">
        <option value="all">همه</option><option value="premium">فقط پریمیوم</option><option value="free">فقط رایگان</option>
      </select></div>
    </div>
    <div class="row">
      <label class="chk"><input id="bcPush" type="checkbox"> پوش/پیام‌رسان هم بفرست</label>
      <label class="chk"><input id="bcForce" type="checkbox"> حتی خارج از ۹ تا ۲۲</label>
    </div>
    <button id="bcSend" type="button">ارسال</button>
    <div id="bcOut"></div>
  </form>
  <script>
  (function () {
    var btn = document.getElementById('bcSend');
    var out = document.getElementById('bcOut');
    btn.addEventListener('click', function () {
      var title = document.getElementById('bcTitle').value.trim();
      if (!title) { out.textContent = 'عنوان لازم است.'; return; }
      // The inbox row is instant and irreversible for anyone who reads it before
      // you change your mind, so this asks once — the only guard that fits a
      // broadcast, since there is no per-user row to unsend.
      if (!confirm('این اطلاعیه برای همهٔ کاربرانِ انتخاب‌شده منتشر شود؟')) return;
      btn.disabled = true; out.textContent = 'در حال ارسال...';
      fetch('/admin/notices/broadcast', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title,
          body: document.getElementById('bcBody').value.trim() || undefined,
          url: document.getElementById('bcUrl').value.trim() || undefined,
          audience: document.getElementById('bcAud').value,
          push: document.getElementById('bcPush').checked,
          force: document.getElementById('bcForce').checked
        })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { out.textContent = 'نشد: ' + (res.j.error || 'خطا'); return; }
          var m = 'منتشر شد.';
          if (res.j.push === 'held') {
            m += ' پوش نگه داشته شد (خارج از ۹ تا ۲۲) و صبح خودکار می‌رود؛ اطلاعیه همین حالا سرِ جایش هست. دوباره نزن — ردیف تکراری می‌سازد.';
          } else if (res.j.push === 'queued') { m += ' پوش در حال ارسال است.'; }
          out.textContent = m;
          document.getElementById('bcTitle').value = '';
          document.getElementById('bcBody').value = '';
        })
        .catch(function () { btn.disabled = false; out.textContent = 'ارسال نشد.'; });
    });
  })();
  </script>
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

  /**
   * POST /admin/notices/broadcast — the founder's own announcement.
   *
   *   { title, body?, url?, audience?: all|free|premium, push?: bool, force?: bool }
   *
   * The اطلاعیه row is written FIRST and always, at any hour: it interrupts
   * nobody, so none of the machinery that protects a phone applies to it. One
   * row serves every reader (services/notices.ts) — there is no fan-out, so this
   * cannot half-send and cannot be retried into duplicates.
   *
   * `push` additionally puts it on phones. That part IS an interruption, so it
   * respects the awake window by default even though the `system` kind is exempt
   * from the daily cap — «uncapped» was always about a broadcast not eating a
   * reader's budget, never about a licence to wake people at 03:00. `force`
   * overrides it for the one case where that is the point.
   *
   * `inbox: false` on the push, because the broadcast above already said it; the
   * row it does write is the counter row and carries no message.
   */
  app.post('/admin/notices/broadcast', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          url: { type: 'string' },
          audience: { type: 'string', enum: ['all', 'free', 'premium'] },
          push: { type: 'boolean' },
          force: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as {
      title: string; body?: string; url?: string;
      audience?: NoticeAudience; push?: boolean; force?: boolean;
    };
    const title = (b.title || '').trim();
    if (!title) return reply.code(400).send({ error: 'empty_title' });
    const audience: NoticeAudience = b.audience ?? 'all';

    const now = new Date();
    const wantsPush = Boolean(b.push);
    const sendingNow = wantsPush && (inAwakeWindow(now) || Boolean(b.force));

    const id = await recordBroadcast({
      kind: 'system',
      title,
      body: (b.body || '').trim() || null,
      url: (b.url || '').trim() || null,
      audience,
    }, {
      // `push_requested` is what makes HOLDING different from dropping. Without
      // it the only way to get a held push out was to broadcast again, which
      // wrote a second row and showed every reader the same announcement twice.
      pushRequested: wantsPush,
      // Claimed up front when it is going out now, so the morning sweep never
      // finds this row and sends it a second time.
      pushedAt: sendingNow ? now : null,
    });

    let push: 'off' | 'queued' | 'held' = 'off';
    if (wantsPush) {
      if (!sendingNow) {
        // Held, not dropped: the inbox already has it, and the morning sweep
        // (scheduler, at awakeStartHour) releases the push by itself.
        push = 'held';
      } else {
        push = 'queued';
        // NOT awaited — see deliverBroadcast. The اطلاعیه row is already
        // committed above and is what every reader actually reads, so there is
        // nothing for the caller to wait for.
        void deliverBroadcast(id, audience, broadcastMessage({
          id, title, body: (b.body || '').trim() || null, url: (b.url || '').trim() || null,
        }), now);
      }
    }

    return reply.send({
      ok: true,
      broadcast_id: id,
      audience,
      // 'queued' means accepted and running, NOT delivered — read the
      // [broadcast:<id>] log lines for the counts.
      push,
      push_skipped: push === 'held' ? 'outside_awake_window' : null,
    });
  });

  /**
   * POST /admin/notices/:id/push — send the push for a broadcast that already
   * exists, WITHOUT writing a second one.
   *
   * The gap this fills: a broadcast published outside the awake window keeps its
   * اطلاعیه row and holds its push. Before this, the only way to get that push
   * out was to broadcast again — which wrote a second row and showed every
   * reader the same announcement twice. So "held" was indistinguishable from
   * "dropped", and the founder had to choose between a lost push and a duplicate.
   *
   * Idempotent by construction: claimBroadcastPush is an UPDATE guarded on
   * `pushed_at is null`, so pressing this twice, or racing the morning sweep,
   * sends once. `already_pushed` is a 200, not an error — the caller asked for
   * the push to have happened and it has.
   */
  app.post('/admin/notices/:id/push', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!UUID_RE.test(id)) return reply.code(400).send({ error: 'bad_id' });

    const row = await claimBroadcastPush(id);
    if (!row) {
      return reply.send({ ok: true, pushed: false, reason: 'already_pushed_or_not_pending' });
    }
    void deliverBroadcast(row.id, row.audience, broadcastMessage(row), new Date());
    return reply.send({ ok: true, pushed: true, broadcast_id: row.id, push: 'queued' });
  });

  // POST /admin/notices/release-held — run the morning release now (the cron does
  // this at NOTIFY_AWAKE_START_HOUR). Twin of run-free-digest: the manual lever
  // for verifying the sweep without waiting for 09:00.
  app.post('/admin/notices/release-held', async (_request, reply) => {
    const result = await releaseHeldBroadcastPushes(new Date());
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
        // `open: true` means sends are being SKIPPED right now, cheaply, after
        // repeated network failures. Without this the channel would be silently
        // absent from every fan-out with nothing here saying why.
        breaker: telegramBreakerStatus(),
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
        // direct AND (when THAT CHANNEL has a proxy of its own) through it, so the
        // answer distinguishes "the pod has no route" from "the proxy is broken"
        // — per channel. Probing web push through Telegram's proxy would have
        // reported a route web push does not use.
        const own = proxyForChannel(t.channel as NotifyChannel);
        const list = [probe(t.url, { proxy: false }).then((r) => ({ ...r, channel: t.channel }))];
        if (t.international && own) {
          list.push(probe(t.url, { proxyUrl: own }).then((r) => ({ ...r, channel: t.channel })));
        }
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

    // Which env var routes this channel — so the advice below names the knob that
    // actually moves it, instead of the one that used to move everything.
    const PROXY_VAR: Record<string, string> = {
      webpush: 'WEBPUSH_PROXY_URL',
      telegram: 'OUTBOUND_PROXY_URL',
    };
    /** The route a channel takes right now: direct, or through which proxy. */
    const routeOf = (name: string): { via: 'direct' | 'proxy'; proxy_host: string | null } => {
      const url = proxyForChannel(name as NotifyChannel);
      return { via: url ? 'proxy' : 'direct', proxy_host: hostOfProxy(url) };
    };

    const problems: string[] = [];
    for (const [name, c] of Object.entries(channels)) {
      if (!c.enabled) continue;
      if (!c.configured) problems.push(`${name}: کلید/توکن در محیط اجرا تنظیم نشده — پیام بی‌صدا رد می‌شود.`);
      const r = reachable(name);
      if (r === false) {
        const route = routeOf(name);
        const knob = PROXY_VAR[name];
        problems.push(
          `${name}: هیچ‌کدام از مقصدهایش از این کانتینر در دسترس نیست`
          + (route.via === 'proxy'
            ? ` (حتی از طریق پراکسیِ خودش، ${route.proxy_host}).`
            : knob
              ? ` — الان مستقیم می‌رود؛ اگر بقیهٔ کانال‌ها سالم‌اند، خروجی بین‌الملل قطع است: ${knob} را تنظیم کن.`
              : '.'),
        );
      }
    }
    if (names.length === 0) problems.push('NOTIFY_PROVIDER خالی است — هیچ کانالی فعال نیست.');

    return reply.send({
      ok: problems.length === 0,
      channel: notifications.name, // the fan-out actually in use, e.g. multi(webpush+telegram+bale)
      provider: config.notify.provider,
      // Every channel states its OWN route. Without this the report could show a
      // single global proxy while three channels took three different paths, and
      // "which of them is even using it?" was left to the reader — which is how a
      // proxy set for Telegram silently killed web push and nothing said so.
      channels: {
        webpush: { ...channels.webpush, reachable: reachable('webpush'), route: routeOf('webpush') },
        telegram: { ...channels.telegram, reachable: reachable('telegram'), route: routeOf('telegram') },
        bale: { ...channels.bale, reachable: reachable('bale'), route: routeOf('bale') },
      },
      proxy: {
        // Per channel, never one number: Bale is null because it is domestic and
        // deliberately not routable, not because nobody configured it.
        webpush: hostOfProxy(proxyForChannel('webpush')),
        telegram: hostOfProxy(proxyForChannel('telegram')),
        bale: null,
      },
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
  // IDENTIFIED BY PHONE **OR** TELEGRAM USERNAME **OR** USER ID.
  //
  // It used to be phone only, on the reasoning that a phone is what the founder
  // has when somebody asks for access. That stopped being true the moment login
  // with Telegram shipped: those accounts have no phone at all, so every
  // endpoint here returned `no_profile` for them and there was no admin path to
  // a real, paying-capable user. Found on 2026-08-06 when a Telegram-only
  // account had to be granted lifetime premium by running the service function
  // by hand — which is exactly the kind of thing an admin panel exists to stop.
  //
  // AMBIGUITY IS AN ERROR, NEVER A GUESS. Usernames are not unique across
  // providers, and display names are not unique at all, so a lookup matching
  // more than one account replies 409 with the candidates and changes nothing.
  // The failure it prevents — giving away a permanent account to the wrong
  // person — is silent, and the person who lost out never knows to complain.

  interface ResolvedUser {
    id: string;
    phone: string | null;
    username: string | null;
    display_name: string | null;
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Resolve whatever the founder typed to exactly one profile, or reply with the
   * right error. Tries the unambiguous keys first (id, then phone) and only then
   * falls back to the human-typed ones.
   */
  async function resolveUser(
    raw: string | undefined,
    reply: FastifyReply,
  ): Promise<ResolvedUser | null> {
    const needle = (raw ?? '').trim();
    if (!needle) {
      void reply.code(400).send({
        error: 'missing_user',
        message: 'شماره‌ی موبایل، نام کاربری، یا شناسه‌ی کاربر را بفرست.',
      });
      return null;
    }

    const SELECT = `
      select p.id,
             nullif(p.phone, '')        as phone,
             ai.username,
             p.display_name
        from profiles p
        left join auth_identities ai on ai.user_id = p.id`;

    let rows: ResolvedUser[];

    if (UUID_RE.test(needle)) {
      rows = (await query<ResolvedUser>(`${SELECT} where p.id = $1`, [needle])).rows;
    } else {
      const phone = normalizePhone(needle);
      if (phone) {
        rows = (await query<ResolvedUser>(`${SELECT} where p.phone = $1`, [phone])).rows;
      } else {
        // A handle. Accept a leading @ because that is how people paste them.
        const handle = needle.replace(/^@/, '');
        rows = (await query<ResolvedUser>(
          `${SELECT} where lower(ai.username) = lower($1) or lower(p.display_name) = lower($1)`,
          [handle],
        )).rows;
      }
    }

    // One profile can hold several auth identities, so collapse by profile id
    // before deciding whether this was actually ambiguous.
    const byId = new Map<string, ResolvedUser>();
    for (const r of rows) {
      const seen = byId.get(r.id);
      // Prefer the row that carries a username, so the answer names them.
      if (!seen || (!seen.username && r.username)) byId.set(r.id, r);
    }
    const found = [...byId.values()];

    if (found.length === 0) {
      void reply.code(404).send({ error: 'no_profile', message: 'کاربری با این مشخصات پیدا نشد.' });
      return null;
    }
    if (found.length > 1) {
      void reply.code(409).send({
        error: 'ambiguous_user',
        message: 'بیش از یک کاربر با این مشخصات هست. با شناسه‌ی کاربر دوباره بفرست.',
        candidates: found.map((f) => ({
          user_id: f.id, phone: f.phone, username: f.username, display_name: f.display_name,
        })),
      });
      return null;
    }
    return found[0];
  }

  /**
   * `user` is the field to use; `phone` stays accepted so nothing that already
   * calls these endpoints breaks. Neither is required by the schema — which one
   * is missing is decided in resolveUser, where the message can say so.
   */
  const userBody = (extra: Record<string, unknown> = {}, required: string[] = []) => ({
    schema: {
      body: {
        type: 'object',
        required,
        properties: { user: { type: 'string' }, phone: { type: 'string' }, ...extra },
      },
    },
  });

  const pick = (b: { user?: string; phone?: string }) => b.user ?? b.phone;

  // GET /admin/subscriptions?user= (or ?phone=) — read the state before changing it.
  app.get('/admin/subscriptions', {
    schema: {
      querystring: {
        type: 'object',
        properties: { user: { type: 'string' }, phone: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const who = await resolveUser(pick(request.query as { user?: string; phone?: string }), reply);
    if (!who) return reply;
    return reply.send(subscriptionView(who, await getSubscription(who.id)));
  });

  // POST /admin/subscriptions/grant { phone, months } — gift N months.
  // Extends an existing subscription rather than replacing it, so gifting a
  // month to an unhappy paying subscriber adds a month instead of costing them
  // whatever they had left.
  app.post('/admin/subscriptions/grant',
    userBody({ months: { type: 'integer', minimum: 1, maximum: 60 } }, ['months']),
    async (request, reply) => {
      const body = request.body as { user?: string; phone?: string; months: number };
      const who = await resolveUser(pick(body), reply);
      if (!who) return reply;
      const sub = await activateMonths(who.id, body.months, { source: 'admin' });
      return reply.send(subscriptionView(who, sub));
    });

  // POST /admin/subscriptions/grant-lifetime { phone } — premium with no end.
  // Deliberately its own endpoint and not a `months: 'lifetime'` variant of the
  // one above: a typo in a number field should never be able to give away a
  // permanent account.
  app.post('/admin/subscriptions/grant-lifetime', userBody(), async (request, reply) => {
    const who = await resolveUser(pick(request.body as { user?: string; phone?: string }), reply);
    if (!who) return reply;
    const sub = await grantLifetime(who.id, { source: 'admin' });
    return reply.send(subscriptionView(who, sub));
  });

  // POST /admin/subscriptions/revoke { phone } — undo a mistaken gift.
  // Leaves `profiles.tier` for the sweep to settle: a league prize may still be
  // holding this account up, and revoking here has no way to know that.
  app.post('/admin/subscriptions/revoke', userBody(), async (request, reply) => {
    const who = await resolveUser(pick(request.body as { user?: string; phone?: string }), reply);
    if (!who) return reply;
    const removed = await revokeSubscription(who.id, { source: 'admin' });
    return reply.send({ ...subscriptionView(who, null), removed });
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

  // GET /admin/pillar — the «ستون» roster: who holds the first-fifty seats and
  // how many remain. THE ONLY SURFACE that ever reports the fill state, by
  // decision (services/pillar.ts): "still open" would announce fewer than
  // fifty paying accounts and "closed" would date the fiftieth, so readers get
  // neither and this is how the founder knows when to stop advertising.
  app.get('/admin/pillar', async (_request, reply) => {
    return reply.send({ ok: true, ...await pillarRoster() });
  });

  // POST /admin/pillar/welcome — thank every seat-holder never yet thanked.
  // The retroactive half of the «ستون» welcome: seats minted before the
  // welcome shipped get the same personal message the settle path now sends.
  // Idempotent (once ever per account, enforced by the notification ledger),
  // so it is safe to press twice — and manual on purpose, so the founder picks
  // the hour a batch of phones buzzes.
  app.post('/admin/pillar/welcome', async (_request, reply) => {
    return reply.send({ ok: true, ...await pillarWelcomeBackfill(new Date()) });
  });

  // --- one-time discount credits --------------------------------------------
  // The founder's side of the generic credit engine (services/discount-credits.ts).
  // Badge credits are derived and need no admin surface; these two endpoints
  // exist for the credits that CANNOT be derived — a birthday, an Eid campaign,
  // an apology — which become ordinary credits under the same per-purchase cap.

  // POST /admin/discounts/grant { user|phone, percent, label, kind?, days? }
  // One credit for one account. `label` is what the reader's own surfaces call
  // it, so it is written in Persian here, once, and never assembled by code.
  // `days` bounds a seasonal credit's life; omitted means it waits forever.
  app.post('/admin/discounts/grant', userBody({
    percent: { type: 'integer', minimum: 1, maximum: 100 },
    label: { type: 'string', minLength: 1, maxLength: 120 },
    kind: { type: 'string', maxLength: 40 },
    days: { type: 'integer', minimum: 1, maximum: 3660 },
  }, ['percent', 'label']), async (request, reply) => {
    const body = request.body as {
      user?: string; phone?: string; percent: number; label: string; kind?: string; days?: number;
    };
    const who = await resolveUser(pick(body), reply);
    if (!who) return reply;
    const grant = await one<{ id: string; percent: number; label_fa: string; expires_at: Date | null }>(
      `insert into discount_grants (user_id, percent, kind, label_fa, expires_at)
       values ($1, $2, $3, $4, case when $5::int is null then null else now() + ($5 || ' days')::interval end)
       returning id, percent, label_fa, expires_at`,
      [who.id, body.percent, body.kind || 'gift', body.label, body.days ?? null],
    );
    return reply.send({ ok: true, user_id: who.id, grant });
  });

  // GET /admin/discounts?user= — what this account could spend right now, and
  // the full grant list. The badge credits appear here too, derived on the
  // spot, so "چقدر تخفیف دارد؟" has one answer and this is where it lives.
  app.get('/admin/discounts', {
    schema: {
      querystring: {
        type: 'object',
        properties: { user: { type: 'string' }, phone: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const who = await resolveUser(pick(request.query as { user?: string; phone?: string }), reply);
    if (!who) return reply;
    const [ready, grants, redemptions] = await Promise.all([
      availableCredits(who.id),
      query('select id, percent, kind, label_fa, expires_at, created_at from discount_grants where user_id = $1 order by created_at desc', [who.id]),
      query(
        `select r.source, r.percent, r.created_at, p.status as payment_status, p.order_id
           from discount_redemptions r join payments p on p.id = r.payment_id
          where r.user_id = $1 order by r.created_at desc`,
        [who.id],
      ),
    ]);
    return reply.send({
      ok: true,
      user_id: who.id,
      ready_percent: creditPercent(ready),
      next_purchase_percent: creditPercent(pickCredits(ready)),
      cap_percent: CREDIT_CAP_PERCENT,
      ready_credits: ready,
      grants: grants.rows,
      redemptions: redemptions.rows,
    });
  });

  // Force the pending-payment sweep now instead of waiting for the next tick.
  // The reason this is worth a button: the thing it resolves is somebody who has
  // been charged and has no subscription, and they are usually on the phone
  // while you read this. Safe to hammer — the sweep is idempotent, and it can
  // only ever close a row the gateway positively said was never paid.
  app.post('/admin/payments/reconcile', async (_request, reply) => {
    return reply.send({ ok: true, ...await reconcilePendingPayments(new Date()) });
  });

  // --- gift-card queue -------------------------------------------------------
  // The manual half of the out-of-country path: read the code into Apple, then
  // say yes or no here. Approving extends the subscription in the same
  // transaction that closes the queue entry.
  app.get('/admin/gift/pending', async (_request, reply) => {
    return reply.send({ ok: true, redemptions: await pendingRedemptions() });
  });

  app.post('/admin/gift/approve', {
    schema: {
      body: {
        type: 'object', required: ['reference'],
        properties: { reference: { type: 'string' }, note: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { reference, note } = request.body as { reference: string; note?: string };
    const r = await approveRedemption(reference, note);
    if (!r.ok) return reply.code(404).send({ error: 'not_pending', message: r.message });
    return reply.send({
      ok: true, months: r.redemption!.months, expires_at: r.subscription!.expires_at,
    });
  });

  // A reason is required, not optional — see rejectRedemption().
  app.post('/admin/gift/reject', {
    schema: {
      body: {
        type: 'object', required: ['reference', 'reason'],
        properties: { reference: { type: 'string' }, reason: { type: 'string', minLength: 3 } },
      },
    },
  }, async (request, reply) => {
    const { reference, reason } = request.body as { reference: string; reason: string };
    const r = await rejectRedemption(reference, reason);
    if (!r.ok) return reply.code(404).send({ error: 'not_pending', message: r.message });
    return reply.send({ ok: true });
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
