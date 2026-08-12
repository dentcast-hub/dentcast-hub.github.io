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
  summarizeSubscription, sweepExpiredSubscriptions, subscriptionReport, type Subscription,
} from '../services/subscription.js';
import { getCapacity } from '../services/payment-capacity.js';
import { reconcilePendingPayments } from '../services/payment-reconcile.js';
import { pillarRoster, grantPillarSeat, revokePillarSeat } from '../services/pillar.js';
import { pillarWelcomeBackfill, schedulePillarWelcome } from '../services/pillar-notify.js';
import {
  availableCredits, creditPercent, pickCredits, insertGrant, CREDIT_CAP_PERCENT,
} from '../services/discount-credits.js';
import {
  pendingRedemptions, approveRedemption, rejectRedemption, setRedemptionAmount,
  approveRedemptionAndGrantBadge,
} from '../services/gift-redemption.js';
import { grantBadge, revokeBadgeGrant, listBadgeGrants } from '../services/badge-grants.js';
import { grantableBadges } from '../badges.js';
import {
  getSpotStats, defaultRange, isCalendarDay, SPOT_HOSTS, type GroupBy,
} from '../services/spot-stats.js';
import { withPageViews } from '../services/view-stats.js';
import {
  recordBroadcast, claimBroadcastPush, pendingBroadcastPushes, mirrorPath,
  recordInAppNotice, type NoticeAudience,
} from '../services/notices.js';
import { sendCapped, inAwakeWindow } from '../services/notify-policy.js';
import { dayInTz } from '../services/time.js';
import {
  deliverBroadcast, broadcastMessage, releaseHeldBroadcastPushes,
} from '../services/broadcast.js';
import { notifications, ai } from '../providers/registry.js';
import {
  probe, proxyForChannel, hostOfProxy, outboundFetch, describeError,
  type ProbeResult, type NotifyChannel,
} from '../providers/outbound.js';
import { telegramBreakerStatus } from '../providers/notifications/telegram.js';
import {
  ticketQueue, getTicket, messagesOf, addMessage, closeTicket, reopenTicket,
  ticketByReference, kindTitle, setThreadPublic, notifyPublished,
} from '../services/support.js';
import { normalizeReference } from '../services/reference.js';
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

function renderHtml(k: Kpis, grantable: { key: string; title_fa: string }[]): string {
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
  .wrap{overflow-x:hidden}
  table{width:100%;border-collapse:collapse;margin-top:8px;background:#171e2d;border:1px solid #2a3448;border-radius:14px;overflow:hidden}
  th,td{padding:8px 12px;text-align:center;border-bottom:1px solid #2a3448}
  /* Wide report tables (5 unbreakable-value columns: phone numbers, dates) can
     exceed a phone's viewport. Scrolling THIS box, not the RTL page body, is
     what keeps the fix local — an unconstrained overflow here shifts the whole
     document's scroll origin and reads as the entire page being broken. */
  .tblwrap{overflow-x:auto;margin-top:8px;border-radius:14px}
  .tblwrap table{margin-top:0;min-width:480px}
  .tblwrap th,.tblwrap td{white-space:nowrap}
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
  #bcOut,#bgOut,#tkOut{font-size:.85rem;color:#93a1b8;min-height:1.6em}
  .tabs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  .tabs button{background:#171e2d;color:#c8d4e6;border:1px solid #2a3448;border-radius:999px;
    padding:7px 16px;font:inherit;font-weight:700;cursor:pointer}
  .tabs button.on{background:#2f7de0;color:#fff;border-color:#2f7de0}
  .sp-c{background:#171e2d;border:1px solid #2a3448;border-radius:14px;padding:12px 14px;margin-top:10px}
  .sp-c h4{margin:0;font-size:1rem}
  .sp-c .head{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}
  .sp-c .big{font-size:1.25rem;font-weight:900}
  .sp-row{margin-top:9px}
  .sp-row .lbl{display:flex;justify-content:space-between;gap:10px;font-size:.86rem;color:#c8d4e6}
  .sp-bar{height:7px;border-radius:99px;background:#0f1420;border:1px solid #2a3448;margin-top:3px;overflow:hidden}
  .sp-bar i{display:block;height:100%;background:#4f9cf0}
  .warn{color:#e0b657;font-size:.83rem;margin-top:10px}
  .pill{display:inline-block;background:#0f1420;border:1px solid #2a3448;border-radius:999px;
    padding:1px 9px;font-size:.74rem;color:#93a1b8;margin-inline-start:6px;vertical-align:middle}
  .pill.hot{background:#3a2a12;border-color:#7a5a20;color:#e3b849}
  .tk{background:#171e2d;border:1px solid #2a3448;border-radius:14px;padding:12px 14px;margin-top:10px;cursor:pointer}
  .tk.need{border-color:#7a5a20}
  .tk-h{display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:.95rem}
  .tk-x{color:#c8d4e6;font-size:.87rem;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tk-body{cursor:auto}
  .tk-body:not(:empty){margin-top:12px;border-top:1px solid #2a3448;padding-top:12px}
  .thread{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
  .msg{border-radius:12px;padding:8px 11px;font-size:.9rem;max-width:88%}
  .msg.them{background:#0f1420;border:1px solid #2a3448;align-self:flex-start}
  .msg.me{background:#16304f;border:1px solid #2f7de0;align-self:flex-end}
  .tk-body textarea.reply{width:100%;box-sizing:border-box;min-height:76px;background:#0f1420;color:#e8eef7;
    border:1px solid #2a3448;border-radius:9px;padding:9px 11px;font:inherit;font-size:.92rem;resize:vertical}
  .tk-body button{background:#2f7de0;color:#fff;border:0;border-radius:999px;padding:8px 18px;
    font:inherit;font-weight:800;cursor:pointer;margin-top:8px;margin-inline-end:8px}
  .tk-out{min-height:1.4em;font-size:.85rem}
  .bt-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
  .bt-actions input[type=text]{flex:1 1 140px;box-sizing:border-box;background:#0f1420;color:#e8eef7;
    border:1px solid #2a3448;border-radius:9px;padding:8px 10px;font:inherit;font-size:.86rem}
  .bt-actions button{background:#2f7de0;color:#fff;border:0;border-radius:999px;padding:7px 16px;
    font:inherit;font-weight:800;cursor:pointer}
  .bt-actions button.gold{background:#7a5a20}
  .bt-actions button.danger{background:#7a2020}
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

  <h3 style="margin-top:26px">گزارش کاربران — پرمیوم و اشتراک</h3>
  <div class="muted">«چند ماهه» یعنی ماهِ اولین شروعِ اشتراک (started_at) — تمدید ماه شروع را عوض نمی‌کند، پس هر ردیف یک کوهورتِ واقعیِ جذب است، نه شمارشِ تمدیدها. «پرمیومِ لیگی» جدا شمرده می‌شود چون جایزهٔ هفتگیِ لیگ هیچ‌وقت ردیفی در subscriptions نمی‌سازد.</div>
  <div id="subOut" class="muted" style="margin-top:10px">در حال خواندن…</div>
  <script>
  (function () {
    var out = document.getElementById('subOut');
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function num(n) { return Number(n || 0).toLocaleString('en-US'); }

    function monthRows(byMonth) {
      if (!byMonth.length) return '<tr><td colspan="3">هنوز داده‌ای نیست</td></tr>';
      return byMonth.slice().reverse().map(function (r) {
        return '<tr><td>' + esc(r.month) + '</td><td>' + num(r.new_subscribers)
          + '</td><td>' + num(r.founders) + '</td></tr>';
      }).join('');
    }

    function bucketBar(label, n, total) {
      var w = total ? Math.round((n / total) * 1000) / 10 : 0;
      return '<div class="sp-row"><div class="lbl"><span>' + esc(label)
        + '</span><span>' + num(n) + ' نفر</span></div>'
        + '<div class="sp-bar"><i style="width:' + w + '%"></i></div></div>';
    }

    function soonestRows(rows) {
      if (!rows.length) return '<tr><td colspan="5">اشتراکِ رو‌به‌اتمامی نیست</td></tr>';
      return rows.map(function (r) {
        return '<tr><td>' + esc(r.display_name || r.username || r.phone || r.user_id) + '</td>'
          + '<td>' + esc(r.phone || '—') + '</td><td>' + esc(r.plan) + '</td>'
          + '<td>' + esc(r.expires_on) + '</td><td>' + num(r.days_left) + '</td></tr>';
      }).join('');
    }

    function card(title, value, sub) {
      return '<div class="card"><h3>' + esc(title) + '</h3><div class="v">' + value
        + '</div><div class="s">' + esc(sub) + '</div></div>';
    }

    function render(b) {
      var t = b.totals;
      var d = b.days_left_buckets;
      var activeCounted = d.d0_3 + d.d4_7 + d.d8_30 + d.d31_plus;
      out.className = '';
      out.innerHTML =
        '<div class="grid">'
        + card('پرمیومِ الان', num(t.active_now + t.league_premium_now),
            num(t.active_now) + ' با اشتراک · ' + num(t.league_premium_now) + ' با جایزهٔ لیگ')
        + card('عمرِ همیشگی', num(t.lifetime_total), 'بنیان‌گذار یا نشانِ اهدایی')
        + card('کل تاریخِ اشتراک', num(t.ever_subscribed), 'هر کسی که حداقل یک بار خرید/هدیه گرفت')
        + '</div>'
        + '<h4 style="margin:18px 0 0">به تفکیک ماهِ شروع</h4>'
        + '<div class="tblwrap"><table><thead><tr><th>ماه</th><th>مشترکِ جدید</th><th>عمرِ همیشگی</th></tr></thead>'
        + '<tbody>' + monthRows(b.by_month) + '</tbody></table></div>'
        + '<h4 style="margin:18px 0 0">چقدر مانده (اشتراک‌های فعالِ غیرِ همیشگی)</h4>'
        + '<div class="sp-c">'
        + bucketBar('۰ تا ۳ روز', d.d0_3, activeCounted)
        + bucketBar('۴ تا ۷ روز', d.d4_7, activeCounted)
        + bucketBar('۸ تا ۳۰ روز', d.d8_30, activeCounted)
        + bucketBar('بیش از ۳۰ روز', d.d31_plus, activeCounted)
        + '</div>'
        + '<h4 style="margin:18px 0 0">زودتر از همه تمام می‌شود (تا ۳۰ ردیف)</h4>'
        + '<div class="tblwrap"><table><thead><tr><th>کاربر</th><th>موبایل</th><th>پلن</th><th>تا</th><th>روزِ مانده</th></tr></thead>'
        + '<tbody>' + soonestRows(b.soonest_expiring) + '</tbody></table></div>';
    }

    fetch('/admin/subscriptions/report', { credentials: 'include' })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) { out.textContent = 'خوانده نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
        render(res.j);
      })
      .catch(function () { out.textContent = 'خوانده نشد (شبکه).'; });
  })();
  </script>

  <h3 style="margin-top:26px">گزارش لیگ</h3>
  <div class="muted">«لیگ فعال» یعنی گروهی که این هفته برایش تشکیل شده — این آدم‌ها با هم رقابت می‌کنند. عددهای این بخش از همان API نظارتیِ لیگ (<code>/admin/league</code>) خوانده می‌شوند؛ اینجا فقط رندرِ آن است.</div>
  <div id="lgOut" class="muted" style="margin-top:10px">در حال خواندن…</div>
  <script>
  (function () {
    var out = document.getElementById('lgOut');
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function num(n) { return Number(n || 0).toLocaleString('en-US'); }
    function pct(v) { return v == null ? '—' : v.toFixed(1) + '٪'; }

    function tierRows(perTier) {
      if (!perTier.length) return '<tr><td colspan="5">رده‌ای نیست</td></tr>';
      return perTier.map(function (t) {
        return '<tr><td>' + esc(t.name_fa) + (t.is_active ? '' : ' <span class="pill">غیرفعال</span>') + '</td>'
          + '<td>' + num(t.groups) + '</td><td>' + pct(t.fill_pct) + '</td>'
          + '<td>' + (t.median_weekly_xp == null ? '—' : num(t.median_weekly_xp)) + '</td></tr>';
      }).join('');
    }

    function trendRows(trend) {
      if (!trend.length) return '<tr><td colspan="5">هنوز داده‌ای نیست</td></tr>';
      return trend.map(function (w) {
        return '<tr><td>' + esc(w.week_start) + '</td><td>' + num(w.active_users) + '</td>'
          + '<td>' + num(w.groups_count) + '</td>'
          + '<td>' + (w.avg_fill_pct == null ? '—' : pct(Number(w.avg_fill_pct))) + '</td>'
          + '<td>' + num(w.promotions) + ' / ' + num(w.demotions) + '</td></tr>';
      }).join('');
    }

    function warnings(below) {
      if (!below.length) return '';
      var rows = below.map(function (g) {
        return '⚠️ رده «' + esc(g.tier) + '» — گروه ' + esc(g.league_id) + ': ' + num(g.size)
          + ' از ' + num(g.capacity) + ' نفر (کف اعتبار: ' + num(g.min_valid) + ')';
      }).join('<br>');
      return '<div class="warn">' + rows + '</div>';
    }

    function render(b) {
      var totalGroups = b.per_tier.reduce(function (a, t) { return a + t.groups; }, 0);
      out.className = '';
      out.innerHTML =
        '<div class="muted">هفتهٔ جاری: ' + esc(b.current_week) + '</div>'
        + '<div class="grid">'
        + '<div class="card"><h3>لیگ‌های فعالِ این هفته</h3><div class="v">' + num(totalGroups)
        + '</div><div class="s">جمعِ گروه‌ها روی همهٔ رده‌ها</div></div>'
        + '<div class="card"><h3>کاربرِ فعالِ این هفته</h3><div class="v">'
        + num(b.last_week ? b.last_week.active_users : 0) + '</div><div class="s">آخرین هفتهٔ ثبت‌شده</div></div>'
        + '<div class="card"><h3>میانگینِ ۴ هفتهٔ اخیر</h3><div class="v">' + num(b.smoothed_active)
        + '</div><div class="s">کاربرِ فعالِ هموارشده</div></div>'
        + '</div>'
        + '<h4 style="margin:18px 0 0">به تفکیکِ رده (هفتهٔ جاری)</h4>'
        + '<div class="tblwrap"><table><thead><tr><th>رده</th><th>تعدادِ گروه</th><th>پرشدگی</th><th>میانهٔ امتیازِ هفتگی</th></tr></thead>'
        + '<tbody>' + tierRows(b.per_tier) + '</tbody></table></div>'
        + warnings(b.groups_below_validity)
        + '<h4 style="margin:18px 0 0">روندِ ۸ هفتهٔ اخیر</h4>'
        + '<div class="tblwrap"><table><thead><tr><th>هفته</th><th>کاربرِ فعال</th><th>تعدادِ گروه</th><th>میانگینِ پرشدگی</th><th>ارتقا/تنزل</th></tr></thead>'
        + '<tbody>' + trendRows(b.weekly_trend) + '</tbody></table></div>';
    }

    fetch('/admin/league', { credentials: 'include' })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) { out.textContent = 'خوانده نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
        render(res.j);
      })
      .catch(function () { out.textContent = 'خوانده نشد (شبکه).'; });
  })();
  </script>

  <h3 style="margin-top:26px">گزارش تبلیغ‌ها</h3>
  <div class="muted">هر ردیف یک <b>زمانِ چرخش</b> است — کمپینی که یکی از خانه‌های <code>rotation.sequence</code> را گرفته — و زیرش تفکیکِ جایگاه‌هایی که نمایش‌هایش آن‌جا افتاده.
  واحد همه‌جا <b>تعدادِ بارِ نمایش</b> است، نه تعدادِ آدم: یک نفر که در یک مرور ۲۰ بار یک تبلیغ ببیند، ۲۰ شمرده می‌شود.
  «نمایش» یعنی کارت دست‌کم ۵۰٪ روی صفحه، یک ثانیهٔ پیوسته، در تبِ فعال دیده شده — پس از تعداد صفحه‌هایی که تبلیغ داشته‌اند کمتر است و همین آن را برای اسپانسر قابل‌دفاع می‌کند.</div>
  <div class="tabs" id="spWin">
    <button type="button" data-days="1" class="on">۲۴ ساعت (امروزِ تهران)</button>
    <button type="button" data-days="7">۷ روز</button>
    <button type="button" data-days="30">۳۰ روز</button>
  </div>
  <div id="spOut" class="muted" style="margin-top:10px">در حال خواندن…</div>
  <script>
  (function () {
    var SERVER_TODAY = '${dayInTz(new Date())}';
    // Slot ids are shown in Persian, and "episode" / "episodes" are NEVER merged
    // into one row: the first is a single episode page, the second is the
    // episodes archive. One letter apart, two different placements.
    // (No backticks anywhere in this script — it lives inside a TS template
    // literal, and one would end the string mid-page.)
    var SLOT_FA = {
      home: 'صفحهٔ اصلی', article: 'مقاله', pillar: 'ستون موضوعی', search: 'جستجوی سراسری',
      archive: 'تب آرشیو', player: 'پلیر', episode: 'صفحهٔ اپیزود', episodes: 'آرشیو اپیزودها',
      dashboard: 'پیشخوان', profile: 'پروفایل'
    };
    var FIRST_DAY = '2026-07-26';    // nothing exists before the emitter shipped
    var SLOT_SPLIT_DAY = '2026-07-28'; // pillar + episode arrived; article was relabelled
    var out = document.getElementById('spOut');
    var tabs = document.getElementById('spWin');

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    // Latin digits with a thousands separator — the rest of this panel is Latin,
    // and a section that switched to Persian numerals would not be comparable to
    // the KPI cards above it at a glance.
    function num(n) { return Number(n || 0).toLocaleString('en-US'); }
    function pct(v) { return v == null ? '—' : v.toFixed(1) + '٪'; }
    // The Tehran day, from the browser. Falls back to the day the server stamped
    // into this page if Intl has no tz database.
    function tehranToday() {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
      } catch (e) { return SERVER_TODAY; }
    }
    function shift(day, n) {
      var p = day.split('-').map(Number);
      return new Date(Date.UTC(p[0], p[1] - 1, p[2]) + n * 86400000).toISOString().slice(0, 10);
    }

    function viewerRows(b) {
      var pv = (b.page_views && b.page_views.totals) || { anon: 0, plus: 0, premium: 0 };
      var ipv = b.impressions_per_view || {};
      var seen = function (v) {
        var e = (b.by_viewer || []).filter(function (x) { return x.viewer === v; })[0];
        return e ? e.impressions : 0;
      };
      // A ratio is null (never 0) when the window has no page-view data — a
      // missing denominator must not read as "nobody saw anything".
      var ratio = function (v) { return ipv[v] == null ? 'داده‌ای نیست' : String(ipv[v]); };
      return '<table><thead><tr><th>بیننده</th><th>نمایش</th><th>بازدید صفحه</th>'
        + '<th>نمایش به ازای هر بازدید</th></tr></thead><tbody>'
        + '<tr><td>مهمان (لاگین‌نکرده)</td><td>' + num(seen('anon')) + '</td><td>' + num(pv.anon)
        + '</td><td>' + ratio('anon') + '</td></tr>'
        + '<tr><td>پلاسِ رایگان</td><td>' + num(seen('plus')) + '</td><td>' + num(pv.plus)
        + '</td><td>' + ratio('plus') + '</td></tr>'
        // Premium is zero by DEFINITION, not by measurement — it is never shown
        // as a measured 0, which would read as "they ignored the ads".
        + '<tr><td>پریمیوم</td><td colspan="2">تبلیغ نمی‌بیند (طبق طراحی) · '
        + num(pv.premium) + ' بازدید صفحه</td><td>—</td></tr>'
        + '</tbody></table>';
    }

    function creativeCard(c) {
      var h = '<div class="sp-c"><div class="head"><h4>' + esc(c.creative) + '</h4>'
        + '<span class="big">' + num(c.impressions) + '</span>'
        + '<span class="muted">نمایش · ' + pct(c.share_pct) + ' از کلِ بازه · '
        + num(c.clicks) + ' کلیک · CTR ' + pct(c.ctr_pct) + '</span></div>';
      if (!c.slots.length) return h + '</div>';
      h += '<div class="muted" style="margin-top:8px;font-size:.82rem">تفکیک محل (درصدها از نمایش‌های همین تبلیغ):</div>';
      c.slots.forEach(function (s) {
        var w = s.share_pct == null ? 0 : s.share_pct;
        h += '<div class="sp-row"><div class="lbl"><span>' + esc(SLOT_FA[s.slot] || s.slot)
          + '</span><span>' + num(s.impressions) + ' نمایش · ' + pct(s.share_pct) + '</span></div>'
          + '<div class="sp-bar"><i style="width:' + w + '%"></i></div></div>';
      });
      return h + '</div>';
    }

    function warnings(b, days) {
      var w = [];
      if (days === 1) w.push('امروز یک روزِ ناقص است — از نیمه‌شبِ تهران تا همین لحظه، نه ۲۴ ساعتِ لغزان.');
      if (b.from < FIRST_DAY) w.push('پیش از ' + FIRST_DAY + ' هیچ دادهٔ تبلیغی وجود ندارد؛ روزهای قبلِ آن در این بازه خالی‌اند، نه صفر.');
      if (b.from <= SLOT_SPLIT_DAY && b.to >= SLOT_SPLIT_DAY) {
        w.push('این بازه روی ' + SLOT_SPLIT_DAY + ' افتاده: تا آن روز صفحه‌های تکِ اپیزود زیر «مقاله» شمرده می‌شدند و از آن روز زیر «صفحهٔ اپیزود». افتِ «مقاله» در این مرز برچسب‌گذاریِ دوباره است، نه ریزش.');
      }
      if (!b.totals.impressions) w.push('در این بازه هیچ نمایشی ثبت نشده. اگر انتظارِ ترافیک داشتی، پیش از نتیجه‌گیری رویدادِ spot_report_failed را در GA ببین.');
      return w.length ? '<div class="warn">' + w.map(function (t) { return '⚠️ ' + esc(t); }).join('<br>') + '</div>' : '';
    }

    function render(b, days) {
      var cs = b.by_creative_slot || [];
      out.className = '';
      out.innerHTML =
        '<div class="muted">بازه: ' + esc(b.from) + ' تا ' + esc(b.to)
        + ' (روزِ تقویمیِ ' + esc(b.tz) + ') · منبع: API خودمان</div>'
        + '<div class="grid">'
        + '<div class="card"><h3>کل نمایش</h3><div class="v">' + num(b.totals.impressions) + '</div><div class="s">بارِ دیده‌شدن، نه تعدادِ آدم</div></div>'
        + '<div class="card"><h3>کل کلیک</h3><div class="v">' + num(b.totals.clicks) + '</div><div class="s">کارت‌های بدون لینک اصلاً کلیک‌پذیر نیستند</div></div>'
        + '<div class="card"><h3>CTR</h3><div class="v">' + pct(b.totals.ctr_pct) + '</div><div class="s">کلیک تقسیم بر نمایش</div></div>'
        + '</div>'
        + '<h4 style="margin:18px 0 0">به تفکیک بیننده</h4>' + viewerRows(b)
        + '<h4 style="margin:18px 0 0">هر تبلیغ (زمانِ چرخش) و محل‌هایش</h4>'
        + (cs.length ? cs.map(creativeCard).join('') : '<div class="muted" style="margin-top:8px">هیچ تبلیغی در این بازه نمایشی نداشته.</div>')
        + warnings(b, days);
    }

    function load(days) {
      var to = tehranToday();
      var from = shift(to, -(days - 1));
      out.className = 'muted';
      out.textContent = 'در حال خواندن…';
      fetch('/admin/spot/stats?from=' + from + '&to=' + to + '&group_by=day', { credentials: 'include' })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { out.textContent = 'خوانده نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
          render(res.j, days);
        })
        .catch(function () { out.textContent = 'خوانده نشد (شبکه).'; });
    }

    tabs.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-days]');
      if (!btn) return;
      [].forEach.call(tabs.querySelectorAll('button'), function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      load(Number(btn.getAttribute('data-days')));
    });
    load(1);
  })();
  </script>

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

  <h3 style="margin-top:26px">اهدای نشان</h3>
  <div class="muted">نشان‌های کلاسِ اهدایی (مثل «همراه») را این‌جا به یک نفر بده. یک بار برای هر نفر — دوباره زدن هیچ‌چیزِ تازه‌ای نمی‌سازد. تخفیفِ اختیاری، یک اعتبارِ یک‌بارمصرفِ عادی است (سهم اعتبارها در هر خرید تا سقف ٪۱۰).</div>
  <form class="bc" id="bgForm" onsubmit="return false">
    <div><label for="bgUser">کاربر (موبایل، نام کاربری یا شناسه)</label><input id="bgUser" type="text"></div>
    <div class="row">
      <div style="flex:1 1 200px"><label for="bgBadge">نشان</label><select id="bgBadge">
        ${grantable.map((b) => `<option value="${b.key}">${b.title_fa}</option>`).join('')}
      </select></div>
      <div style="flex:0 0 150px"><label for="bgPct">تخفیف ٪ (اختیاری)</label><input id="bgPct" type="text" inputmode="numeric" placeholder="مثلاً 5"></div>
    </div>
    <div><label for="bgNote">یادداشت (چرا؟ — فقط برای خودت)</label><input id="bgNote" type="text" maxlength="300" placeholder="مثلاً: باگ گیت‌وی پرداخت را گزارش کرد"></div>
    <button id="bgSend" type="button" ${grantable.length ? '' : 'disabled'}>اهدا</button>
    <div id="bgOut">${grantable.length ? '' : 'هیچ نشانِ اهدایی‌ای در کاتالوگ تعریف نشده.'}</div>
  </form>
  <script>
  (function () {
    var btn = document.getElementById('bgSend');
    var out = document.getElementById('bgOut');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var user = document.getElementById('bgUser').value.trim();
      if (!user) { out.textContent = 'کاربر را مشخص کن.'; return; }
      var sel = document.getElementById('bgBadge');
      var pctRaw = document.getElementById('bgPct').value.trim();
      var pct = pctRaw ? parseInt(pctRaw, 10) : null;
      if (pctRaw && (!pct || pct < 1 || pct > 100)) { out.textContent = 'درصد تخفیف معتبر نیست.'; return; }
      var label = sel.options[sel.selectedIndex].text;
      if (!confirm('نشان «' + label + '»' + (pct ? ' با ٪' + pct + ' تخفیف' : '') + ' به این کاربر اهدا شود؟')) return;
      btn.disabled = true; out.textContent = 'در حال اهدا...';
      fetch('/admin/badges/grant', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user: user,
          badge: sel.value,
          note: document.getElementById('bgNote').value.trim() || undefined,
          discount_percent: pct || undefined
        })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
          if (res.j.already) {
            out.textContent = 'این کاربر «' + label + '» را از قبل داشت — چیزی تغییر نکرد (تخفیفی هم ساخته نشد).';
            return;
          }
          out.textContent = 'اهدا شد به ' + (res.j.display_name || res.j.user_id)
            + (res.j.discount_grant_id ? ' — با اعتبار تخفیف.' : '.')
            + ' جشن و اطلاعیه خودکار می‌رسد.';
          document.getElementById('bgUser').value = '';
          document.getElementById('bgNote').value = '';
          document.getElementById('bgPct').value = '';
        })
        .catch(function () { btn.disabled = false; out.textContent = 'اهدا نشد.'; });
    });
  })();
  </script>

  <h3 style="margin-top:26px">صف واریز به حساب</h3>
  <div class="muted">درخواست‌های واریز به شبا. صفحه‌ی خرید به خریدار می‌گوید <b>قبل از واریز</b> مبلغ را با تو هماهنگ کند، و عددی که این‌جا می‌نویسی همان است که او می‌بیند — پس مبلغ را قبل از واریزِ او ثبت کن، نه بعدش. تا وقتی چیزی ننوشته‌ای، عددِ ردیف قیمتِ لیست است. برای دانشجو (٪۱۵ روی شش‌ماهه) مبلغ را بنویس و بعد «تأیید + اهدای نشان دانشجو» را بزن — نشان و اشتراک با هم و در یک تراکنش ثبت می‌شوند.</div>
  <div id="btList"></div>
  <script>
  (function () {
    var list = document.getElementById('btList');
    if (!list) return;

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function when(iso) {
      try { return new Date(iso).toLocaleString('fa-IR'); } catch (e) { return iso; }
    }
    function toman(rial) {
      return rial == null ? '—' : Math.round(rial / 10).toLocaleString('en-US') + ' ت';
    }
    function who(r) {
      return esc(r.display_name || r.phone || r.username || r.user_id);
    }

    function row(r) {
      return '<div class="tk" data-ref="' + esc(r.reference) + '" style="cursor:auto">'
        + '<div class="tk-h"><b>' + esc(r.reference) + '</b>'
        + '<span class="pill">' + r.months + ' ماهه</span>'
        + '<span class="pill">' + toman(r.amount_rial) + '</span>'
        + '</div>'
        + '<div class="muted">' + who(r) + ' · ' + when(r.created_at) + '</div>'
        + '<div class="bt-actions">'
        + '<input type="text" class="btAmount" inputmode="numeric" placeholder="مبلغ تازه (تومان، اختیاری)">'
        + '<button type="button" data-act="set-amount">ثبت مبلغ</button>'
        + '<button type="button" data-act="approve">تأیید</button>'
        + '<button type="button" class="gold" data-act="approve-badge">تأیید + اهدای نشان دانشجو</button>'
        + '<button type="button" class="danger" data-act="reject">رد</button>'
        + '</div>'
        + '<div class="bt-out muted"></div>'
        + '</div>';
    }

    function render(rows) {
      if (!rows.length) { list.innerHTML = '<div class="muted">صف خالی است.</div>'; return; }
      list.innerHTML = rows.map(row).join('');
    }

    function load() {
      list.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/bank-transfer/pending', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) { render(j.redemptions || []); })
        .catch(function () { list.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    list.addEventListener('click', function (ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute('data-act');
      if (!act) return;
      var wrap = ev.target.closest('.tk');
      if (!wrap) return;
      var ref = wrap.getAttribute('data-ref');
      var out = wrap.querySelector('.bt-out');

      if (act === 'set-amount') {
        var raw = wrap.querySelector('.btAmount').value.trim();
        var toman2 = raw ? parseInt(raw, 10) : NaN;
        if (!raw || !toman2 || toman2 <= 0) { out.textContent = 'مبلغ معتبر نیست.'; return; }
        out.textContent = 'در حال ثبت…';
        fetch('/admin/bank-transfer/amount', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reference: ref, amount_rial: toman2 * 10 })
        }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || res.j.error); return; }
            load();
          })
          .catch(function () { out.textContent = 'ثبت نشد.'; });
        return;
      }

      if (act === 'reject') {
        var reason = prompt('دلیل رد (برای کاربر فرستاده می‌شود):');
        if (!reason) return;
        fetch('/admin/gift/reject', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reference: ref, reason: reason })
        }).then(function () { load(); })
          .catch(function () { out.textContent = 'رد نشد.'; });
        return;
      }

      if (act === 'approve') {
        if (!confirm('واریز ' + ref + ' تأیید و اشتراک فعال شود؟')) return;
        out.textContent = 'در حال تأیید…';
        fetch('/admin/gift/approve', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reference: ref })
        }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || res.j.error); return; }
            load();
          })
          .catch(function () { out.textContent = 'تأیید نشد.'; });
        return;
      }

      if (act === 'approve-badge') {
        if (!confirm('واریز ' + ref + ' تأیید، اشتراک فعال و نشان «دانشجو» اهدا شود؟')) return;
        out.textContent = 'در حال تأیید…';
        fetch('/admin/bank-transfer/approve-with-badge', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reference: ref })
        }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || res.j.error); return; }
            load();
          })
          .catch(function () { out.textContent = 'تأیید نشد.'; });
      }
    });

    load();
  })();
  </script>

  <h3 style="margin-top:26px">صندوق پشتیبانی <span id="tkWaiting" class="pill"></span></h3>
  <div class="muted">درخواست‌های خواننده‌ها. ترتیب صف: هرکس بیشتر منتظر مانده، بالاتر. برای کارت دانشجویی، کد پیگیری را از پیام بله/تلگرام این‌جا جست‌وجو کن.</div>
  <form class="bc" onsubmit="return false">
    <div class="row">
      <div style="flex:0 0 auto"><label for="tkStatus">نمایش</label><select id="tkStatus">
        <option value="open">باز</option><option value="closed">بسته</option><option value="all">همه</option>
      </select></div>
      <div style="flex:1 1 220px"><label for="tkRef">جست‌وجوی کد پیگیری</label><input id="tkRef" type="text" placeholder="T-ABC-DEF"></div>
      <div style="flex:0 0 auto;align-self:flex-end"><button id="tkFind" type="button">پیدا کن</button></div>
    </div>
    <div id="tkOut"></div>
  </form>
  <div id="tkList"></div>
  <script>
  (function () {
    var list = document.getElementById('tkList');
    var out = document.getElementById('tkOut');
    var waiting = document.getElementById('tkWaiting');
    if (!list) return;

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function when(iso) {
      try { return new Date(iso).toLocaleString('fa-IR'); } catch (e) { return iso; }
    }
    function who(t) {
      return esc(t.display_name || t.phone || t.user_id)
        + (t.tier === 'premium' ? ' · پریمیوم' : '');
    }

    function card(t) {
      var needs = t.status === 'open' && t.awaiting === 'founder';
      return '<div class="tk' + (needs ? ' need' : '') + '" data-id="' + esc(t.id) + '">'
        + '<div class="tk-h"><b>' + esc(t.subject) + '</b>'
        + '<span class="pill">' + esc(t.kind_title_fa) + '</span>'
        + (t.content_id ? '<span class="pill">' + esc(t.content_id) + '</span>' : '')
        + (t.is_public ? '<span class="pill hot">عمومی</span>' : '')
        + (t.has_photo ? '<span class="pill hot">📎 عکس در راه</span>' : '')
        + '<span class="pill">' + esc(t.reference) + '</span>'
        + (t.status === 'closed' ? '<span class="pill">بسته</span>'
           : (needs ? '<span class="pill hot">منتظر پاسخ توست</span>' : '<span class="pill">منتظر کاربر</span>'))
        + '</div>'
        + '<div class="muted">' + who(t) + ' · ' + t.message_count + ' پیام · آخرین: ' + when(t.last_at) + '</div>'
        + (t.has_photo
           ? '<div class="muted">عکس را با کد <b>' + esc(t.reference) + '</b> در تلگرام پشتیبانی جست‌وجو کن.</div>'
           : '')
        + '<div class="tk-x">' + esc(t.last_excerpt) + '</div>'
        + '<div class="tk-body"></div></div>';
    }

    function render(tickets) {
      if (!tickets.length) { list.innerHTML = '<div class="muted">چیزی این‌جا نیست.</div>'; return; }
      list.innerHTML = tickets.map(card).join('');
    }

    function load() {
      list.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/support?status=' + document.getElementById('tkStatus').value, { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          waiting.textContent = j.waiting ? j.waiting + ' منتظر پاسخ' : '';
          render(j.tickets || []);
        })
        .catch(function () { list.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    function thread(box, id) {
      box.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/support/' + id, { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) { box.innerHTML = '<div class="muted">پیدا نشد.</div>'; return; }
          var msgs = (j.messages || []).map(function (m) {
            return '<div class="msg ' + (m.author === 'founder' ? 'me' : 'them') + '">'
              + '<div class="muted">' + (m.author === 'founder' ? 'تو' : 'کاربر') + ' · ' + when(m.created_at) + '</div>'
              + esc(m.body).replace(/\\n/g, '<br>') + '</div>';
          }).join('');
          var closed = j.ticket.status === 'closed';
          // Only an article thread has a page to appear on, so only it gets the
          // switch. Private is the default and publishing is a decision — this
          // button IS that decision.
          var pub = j.ticket.content_id
            ? '<div class="row"><button type="button" class="pubbtn" data-act="'
              + (j.ticket.is_public ? 'unpublish">خصوصی کن (الان عمومی است)' : 'publish">عمومی کن')
              + '</button></div>'
            : '';
          box.innerHTML = '<div class="thread">' + msgs + '</div>'
            + (closed
              ? '<button type="button" data-act="reopen">بازکردن دوباره</button>'
              : '<textarea class="reply" placeholder="پاسخ…"></textarea>'
                + '<div class="row"><button type="button" data-act="reply">ارسال پاسخ</button>'
                + '<button type="button" data-act="reply-close">ارسال و بستن</button>'
                + '<button type="button" data-act="close">فقط بستن</button></div>')
            + pub
            + '<div class="tk-out muted"></div>';
        })
        .catch(function () { box.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    list.addEventListener('click', function (ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute('data-act');
      var wrap = ev.target.closest ? ev.target.closest('.tk') : null;
      if (!wrap) return;
      var id = wrap.getAttribute('data-id');
      var box = wrap.querySelector('.tk-body');

      if (!act) { // a tap on the card itself toggles the thread open
        if (box.innerHTML) { box.innerHTML = ''; return; }
        thread(box, id);
        return;
      }

      var o = box.querySelector('.tk-out');
      if (act === 'publish' || act === 'unpublish') {
        var going = act === 'publish';
        if (going && !confirm('این گفت‌وگو زیر همان مطلب برای همه دیده می‌شود و به نویسنده‌اش خبر می‌رسد. مطمئنی؟')) return;
        fetch('/admin/support/' + id + '/publish', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ public: going })
        }).then(function () { thread(box, id); })
          .catch(function () { if (o) o.textContent = 'نشد.'; });
        return;
      }
      if (act === 'reopen' || act === 'close') {
        fetch('/admin/support/' + id + '/' + (act === 'reopen' ? 'reopen' : 'close'),
          { method: 'POST', credentials: 'include' })
          .then(function () { load(); })
          .catch(function () { if (o) o.textContent = 'نشد.'; });
        return;
      }

      var ta = box.querySelector('.reply');
      var body = ta ? ta.value.trim() : '';
      if (!body) { if (o) o.textContent = 'متن پاسخ خالی است.'; return; }
      if (o) o.textContent = 'در حال ارسال…';
      fetch('/admin/support/' + id + '/reply', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: body, close: act === 'reply-close' })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { if (o) o.textContent = 'نشد: ' + (res.j.message || res.j.error); return; }
          load();
        })
        .catch(function () { if (o) o.textContent = 'ارسال نشد.'; });
    });

    document.getElementById('tkStatus').addEventListener('change', load);
    document.getElementById('tkFind').addEventListener('click', function () {
      var ref = document.getElementById('tkRef').value.trim();
      if (!ref) { out.textContent = 'کد پیگیری را بنویس.'; return; }
      out.textContent = 'در حال جست‌وجو…';
      fetch('/admin/support/by-reference/' + encodeURIComponent(ref), { credentials: 'include' })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { out.textContent = 'کدی با این نشانی پیدا نشد.'; return; }
          out.textContent = 'پیدا شد: ' + res.j.ticket.subject + ' — ' + who(res.j.user);
          waiting.textContent = '';
          render([Object.assign({}, res.j.ticket, {
            kind_title_fa: res.j.ticket.kind_title_fa,
            message_count: res.j.messages.length,
            last_at: res.j.messages[res.j.messages.length - 1].created_at,
            last_excerpt: res.j.messages[res.j.messages.length - 1].body.slice(0, 160),
            awaiting: res.j.messages[res.j.messages.length - 1].author === 'user' ? 'founder' : 'user',
            display_name: res.j.user && res.j.user.display_name,
            phone: res.j.user && res.j.user.phone,
            tier: res.j.user && res.j.user.tier
          })]);
        })
        .catch(function () { out.textContent = 'جست‌وجو نشد.'; });
    });

    load();
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
    const grantable = grantableBadges().map((b) => ({ key: b.key, title_fa: b.title_fa }));
    return reply.type('text/html; charset=utf-8').send(renderHtml(kpis, grantable));
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
    const body = (b.body || '').trim() || null;
    // Normalised HERE, not only inside recordBroadcast, because the push is
    // built from this value too — and the push is the half that opens on the
    // reader's own mirror only if the link is a path. Pasting a full
    // https://dentcast.ir/... into the admin form is the natural thing to do
    // and must not be able to sign .org readers out (see mirrorPath).
    const url = mirrorPath((b.url || '').trim() || null);

    const now = new Date();
    const wantsPush = Boolean(b.push);
    const sendingNow = wantsPush && (inAwakeWindow(now) || Boolean(b.force));

    const id = await recordBroadcast({
      kind: 'system', title, body, url, audience,
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
          id, title, body, url,
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

  /**
   * POST /admin/notices/user { user|phone, title, body?, url?, push?, force? }
   * — one message to ONE reader.
   *
   * The broadcast above is for everybody and its narrowest audience is a whole
   * tier, so thanking one person with it would have told every premium reader
   * they had been thanked. This goes through the same door every other
   * notification does (sendCapped), which is what gives the message an اطلاعیه
   * row carrying its own text, and it uses the `system` kind, which is uncapped:
   * a personal note from the founder never spends a reader's daily push budget.
   *
   * The اطلاعیه row ALWAYS lands, instantly, whatever the hour — that half is a
   * row in a table nobody's phone can be woken by. Only `push` is an
   * interruption, so it respects the awake window unless `force`, exactly as the
   * broadcast does. Unlike a broadcast there is no HOLD: the morning release
   * sweep walks `notice_broadcasts`, which a personal notice has no row in, so
   * an out-of-hours push is reported as skipped and the founder decides whether
   * to force it or send it again later — rather than being silently queued into
   * machinery that would never pick it up.
   */
  // The schema is spelled out rather than built with userBody() below: this
  // route registers before that helper's declaration is reached, and moving the
  // endpoint away from the other notice routes to borrow it would cost more in
  // readability than the six lines it saves.
  app.post('/admin/notices/user', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          user: { type: 'string' },
          phone: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          url: { type: 'string' },
          push: { type: 'boolean' },
          force: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as {
      user?: string; phone?: string; title: string;
      body?: string; url?: string; push?: boolean; force?: boolean;
    };
    const who = await resolveUser(pick(b), reply);
    if (!who) return reply;
    const title = (b.title || '').trim();
    if (!title) return reply.code(400).send({ error: 'empty_title' });

    const now = new Date();
    const message: NotificationMessage = {
      title,
      body: (b.body || '').trim() || '',
      // Same normalisation as the broadcast, for the same reason: a full
      // https://dentcast.ir/... pasted into the form must not open .org readers
      // on the wrong mirror and sign them out (see mirrorPath).
      url: mirrorPath((b.url || '').trim() || null) ?? undefined,
      tag: 'admin_notice',
    };
    const travels = Boolean(b.push) && (inAwakeWindow(now) || Boolean(b.force));

    if (travels) {
      await sendCapped(who.id, message, 'system', now, { inbox: true });
    } else {
      // Inbox-only: written with delivered = false, which is the same shape a
      // capped-out message takes — in the panel, never counted as sent.
      await recordInAppNotice(who.id, 'system', message, dayInTz(now, config.streakTimezone));
    }

    return reply.send({
      ok: true,
      user_id: who.id,
      display_name: who.display_name,
      notice: 'delivered',
      push: travels ? 'queued' : 'off',
      push_skipped: !travels && b.push ? 'outside_awake_window' : null,
    });
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

    // ?deep=1 additionally times ONE real tag-selection round. The /models probe
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
        const out = await ai.selectTags({
          description: 'روکش بیمار مدام می‌افتد و سمان قبلی شسته شده',
          refinements: [],
          catalog: ['سمان', 'روکش'],
        });
        return {
          ok: true, provider: ai.name, ms: Date.now() - t0, tags: out.length,
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

  // GET /admin/subscriptions/report — the aggregate the single-user lookup
  // above cannot answer: how many became premium, by month, and how much time
  // is left across everyone currently subscribed. Read-only, JSON; the
  // rendered GET /admin page's «گزارش کاربران» section is a client for it.
  app.get('/admin/subscriptions/report', async (_request, reply) => {
    return reply.send({ ok: true, ...await subscriptionReport() });
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

  /**
   * GET /admin/users/search?q= — find an account by PART of a name.
   *
   * resolveUser matches exactly, which is right for "do this to that account"
   * and useless for "who is صدرا?" — a display name is rarely the whole handle,
   * and on 2026-08-08 that was the only thing standing between a suspected
   * farming account and any look at its data.
   */
  app.get('/admin/users/search', async (request, reply) => {
    const q = ((request.query as { q?: string }).q ?? '').trim();
    if (q.length < 2) return reply.code(400).send({ error: 'query_too_short' });
    const rows = await query<{
      id: string; display_name: string | null; username: string | null;
      phone: string | null; tier: string; created_at: string;
    }>(
      `select distinct p.id, p.display_name, ai.username, nullif(p.phone,'') as phone,
              p.tier, p.created_at
         from profiles p
         left join auth_identities ai on ai.user_id = p.id
        where p.display_name ilike '%' || $1 || '%'
           or ai.username     ilike '%' || $1 || '%'
        order by p.created_at desc
        limit 25`,
      [q],
    );
    return reply.send({ ok: true, count: rows.rowCount, users: rows.rows });
  });

  /**
   * GET /admin/score?user=&hours= — where one account's points came from.
   *
   * The question this answers is "is this score real?", and before it existed
   * the only way to ask was a direct connection to the production database —
   * which is exactly the thing that makes a suspicion sit unexamined.
   *
   * `max_per_minute` is the column that matters. Every honest signal here is
   * paced by a human: reading an article takes minutes, a highlight needs a
   * selection, a review needs a card in front of you. One row a minute is a
   * reader; thirty is a loop. The XP columns are what league.ts WOULD pay per
   * row at today's weights, so a lane that is over-paying is visible as a
   * number rather than as a hunch.
   */
  app.get('/admin/score', async (request, reply) => {
    const q = request.query as { user?: string; phone?: string; hours?: string };
    const who = await resolveUser(pick(q), reply);
    if (!who) return reply;
    const hours = Math.min(Math.max(Number(q.hours ?? 168) || 168, 1), 24 * 90);

    const [breakdown, league, profile] = await Promise.all([
      query<{
        action: string; rows: number; distinct_content: number;
        first_at: string; last_at: string; max_per_minute: number;
      }>(
        `select action,
                count(*)::int                     as rows,
                count(distinct content_id)::int   as distinct_content,
                min(created_at)                   as first_at,
                max(created_at)                   as last_at,
                max(per_min)::int                 as max_per_minute
           from (
             select a.action, a.content_id, a.created_at,
                    count(*) over (partition by a.action, date_trunc('minute', a.created_at)) as per_min
               from user_activity a
              where a.user_id = $1 and a.created_at > now() - ($2 || ' hours')::interval
           ) t
          group by action
          order by rows desc`,
        [who.id, String(hours)],
      ),
      one<{ weekly_xp: number; week_start: string; tier_slug: string | null }>(
        `select lm.weekly_xp, l.week_start, t.slug as tier_slug
           from league_members lm
           join leagues l on l.id = lm.league_id
           left join league_tiers t on t.id = l.tier_id
          where lm.user_id = $1
          order by l.week_start desc
          limit 1`,
        [who.id],
      ),
      one<{ created_at: string; current_streak: number; tier: string }>(
        'select created_at, current_streak, tier from profiles where id = $1',
        [who.id],
      ),
    ]);

    return reply.send({
      ok: true,
      user_id: who.id,
      display_name: who.display_name,
      username: who.username,
      account_created_at: profile?.created_at ?? null,
      tier: profile?.tier ?? null,
      current_streak: profile?.current_streak ?? null,
      league: league ?? null,
      window_hours: hours,
      breakdown: breakdown.rows,
    });
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

  /**
   * POST /admin/pillar/grant { user|phone, note?, welcome? } — seat somebody the
   * gateway will never seat.
   *
   * The seat is derived from claims, and until now the only claim was money
   * (services/pillar.ts). A person who helped build this and is never going to
   * appear in a payments ledger had no way in that did not involve forging a
   * payment — which would lie to revenue, to the gateway's monthly ceiling and
   * to the discount-credit join. So the grant is stored as a decision, beside
   * the ledger, and ranked in the same one query.
   *
   * `seated: false` in the response is not an error and must be read: the grant
   * row is real, but the seats were already gone, so it bought nothing. The
   * count never grows to make room — a granted seat SPENDS one of the fifty.
   *
   * `welcome` (default true) sends the same «تو ستون شدی» message a purchased
   * seat gets, once ever per account. It is on by default here and off by
   * default in the backfill above for the same reason: this is one person at a
   * moment the founder chose, not a batch of phones.
   */
  app.post('/admin/pillar/grant', userBody({
    note: { type: 'string', maxLength: 200 },
    welcome: { type: 'boolean' },
  }), async (request, reply) => {
    const b = request.body as {
      user?: string; phone?: string; note?: string; welcome?: boolean;
    };
    const who = await resolveUser(pick(b), reply);
    if (!who) return reply;
    const result = await grantPillarSeat(who.id, (b.note || '').trim() || null);
    if (result.seated && b.welcome !== false) schedulePillarWelcome(who.id);
    return reply.send({
      ok: true,
      user_id: who.id,
      display_name: who.display_name,
      ...result,
      welcome: result.seated && b.welcome !== false ? 'queued' : 'off',
    });
  });

  /**
   * POST /admin/pillar/revoke { user|phone } — take a granted seat back.
   *
   * Deletes the grant row and nothing else, so a seat somebody PAID for cannot
   * be revoked here however the endpoint is called: `removed: false` with a
   * non-null seat is exactly that case, and it is the honest answer rather than
   * a 400. The response's `seat` is what the account holds afterwards.
   */
  app.post('/admin/pillar/revoke', userBody(), async (request, reply) => {
    const who = await resolveUser(pick(request.body as { user?: string; phone?: string }), reply);
    if (!who) return reply;
    return reply.send({
      ok: true, user_id: who.id, display_name: who.display_name,
      ...await revokePillarSeat(who.id),
    });
  });

  // --- one-time discount credits --------------------------------------------
  // The founder's side of the generic credit engine (services/discount-credits.ts).
  // Badge credits are derived and need no admin surface; these two endpoints
  // exist for the credits that CANNOT be derived — a birthday, an Eid campaign,
  // an apology — which become ordinary credits under the same per-purchase cap.

  // POST /admin/discounts/grant { user|phone, percent, label, kind?, days? }
  // One gift for one account. `label` is what the reader's own surfaces call
  // it, so it is written in Persian here, once, and never assembled by code.
  // `days` bounds a seasonal credit's life; omitted means it waits forever.
  //
  // `percent` is the TOTAL meant, not a per-purchase figure: anything above the
  // cap is written as several credits and spent one per purchase (20 → two 10s
  // over two payments). Typing a number the engine could never pay out used to
  // answer `ok: true` and hand the reader nothing — see splitGrantPercent().
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
    const grants = await insertGrant(who.id, {
      percent: body.percent, label_fa: body.label, kind: body.kind, days: body.days,
    });
    return reply.send({
      ok: true,
      user_id: who.id,
      // `grant` stays the first (largest) part, so every gift at or under the
      // cap — which is all of them, most days — reads back exactly as before.
      grant: grants[0] ?? null,
      grants,
      parts: grants.map((g) => g.percent),
      total_percent: grants.reduce((sum, g) => sum + g.percent, 0),
    });
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

  // --- granted badges ---------------------------------------------------------
  // The founder-given class of the badge wall («همراه» is the first member).
  // What these endpoints write is the DECISION — one badge_grants row — never
  // the badge: the wall keeps deriving (services/badge-grants.ts explains the
  // whole move). Which keys are legal is the catalog's call: a badge is
  // grantable iff its metric is `grant:<its own key>`, so «شعله» can never be
  // handed out by typo.

  // POST /admin/badges/grant { user|phone, badge, note?, discount_percent?, discount_days? }
  // Idempotent per (user, badge): pressing twice is `already: true` and mints
  // nothing — including the optional one-time discount, which rides along as
  // an ordinary discount_grants row under the same per-purchase cap.
  app.post('/admin/badges/grant', userBody({
    badge: { type: 'string', minLength: 1, maxLength: 40 },
    note: { type: 'string', maxLength: 300 },
    discount_percent: { type: 'integer', minimum: 1, maximum: 100 },
    discount_days: { type: 'integer', minimum: 1, maximum: 3660 },
  }, ['badge']), async (request, reply) => {
    const body = request.body as {
      user?: string; phone?: string; badge: string; note?: string;
      discount_percent?: number; discount_days?: number;
    };
    const who = await resolveUser(pick(body), reply);
    if (!who) return reply;
    try {
      const r = await grantBadge(who.id, body.badge, {
        note: body.note,
        discountPercent: body.discount_percent,
        discountDays: body.discount_days,
      });
      return reply.send({ user_id: who.id, display_name: who.display_name, ...r });
    } catch (err) {
      if ((err as Error).message === 'not_grantable') {
        return reply.code(400).send({
          error: 'not_grantable',
          message: 'این نشان اهدایی نیست. فقط نشان‌های کلاسِ اهدایی را می‌شود داد.',
          grantable: grantableBadges().map((b) => b.key),
        });
      }
      throw err;
    }
  });

  // POST /admin/badges/revoke { user|phone, badge } — take a grant back. The
  // badge goes dark on the next derive; the announcement ledger's high-water
  // mark keeps a later re-grant silent. Any discount that rode along is NOT
  // clawed back here (see revokeBadgeGrant's note).
  app.post('/admin/badges/revoke', userBody({
    badge: { type: 'string', minLength: 1, maxLength: 40 },
  }, ['badge']), async (request, reply) => {
    const body = request.body as { user?: string; phone?: string; badge: string };
    const who = await resolveUser(pick(body), reply);
    if (!who) return reply;
    const removed = await revokeBadgeGrant(who.id, body.badge);
    return reply.send({ ok: true, user_id: who.id, badge_key: body.badge, removed });
  });

  // GET /admin/badges/grants?user= — one account's grant list, plus the keys
  // that are legal to grant (so the founder never has to remember them).
  app.get('/admin/badges/grants', {
    schema: {
      querystring: {
        type: 'object',
        properties: { user: { type: 'string' }, phone: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const who = await resolveUser(pick(request.query as { user?: string; phone?: string }), reply);
    if (!who) return reply;
    return reply.send({
      ok: true,
      user_id: who.id,
      display_name: who.display_name,
      grants: await listBadgeGrants(who.id),
      grantable: grantableBadges().map((b) => ({ key: b.key, title_fa: b.title_fa })),
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

  // --- bank-transfer queue -----------------------------------------------------
  // The manual half of واریز به شبا: read the bank statement, then say yes or
  // no here. Approval and rejection reuse approveRedemption/rejectRedemption
  // above — both are already kind-agnostic (keyed by reference, not by rail).
  app.get('/admin/bank-transfer/pending', async (_request, reply) => {
    return reply.send({ ok: true, redemptions: await pendingRedemptions(50, 'bank_transfer') });
  });

  // POST /admin/bank-transfer/amount { reference, amount_rial } — write the
  // amount onto a still-pending claim. This is how the student-discounted
  // price (full price × ٪85) reaches the row: the founder types it in after
  // seeing the student's card, never an engine (handoff decision 2.3).
  app.post('/admin/bank-transfer/amount', {
    schema: {
      body: {
        type: 'object', required: ['reference', 'amount_rial'],
        properties: {
          reference: { type: 'string' },
          amount_rial: { type: 'integer', minimum: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { reference, amount_rial: amountRial } = request.body as {
      reference: string; amount_rial: number;
    };
    const row = await setRedemptionAmount(reference, amountRial);
    if (!row) return reply.code(404).send({ error: 'not_pending', message: 'این کد پیگیری در صف بررسی نیست.' });
    return reply.send({ ok: true, redemption: row });
  });

  // POST /admin/bank-transfer/approve-with-badge { reference, note? } — the
  // «تأیید + اهدای نشان دانشجو» button: approves the claim, activates the
  // subscription and grants the `student` badge in ONE transaction, so a
  // failure on any one of the three leaves none of them written.
  app.post('/admin/bank-transfer/approve-with-badge', {
    schema: {
      body: {
        type: 'object', required: ['reference'],
        properties: { reference: { type: 'string' }, note: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { reference, note } = request.body as { reference: string; note?: string };
    const r = await approveRedemptionAndGrantBadge(reference, 'student', { note });
    if (!r.ok) return reply.code(404).send({ error: 'not_pending', message: r.message });
    return reply.send({
      ok: true,
      months: r.redemption!.months,
      expires_at: r.subscription!.expires_at,
      badge: r.badge,
    });
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
  // --- support tickets --------------------------------------------------------
  // The founder's side of services/support.ts. The reader's own endpoints live
  // in routes/support.ts and are scoped to their owner; these are not scoped at
  // all, which is the whole difference between the two files.

  // GET /admin/support?status=open|closed|all&limit= — the queue, ordered so the
  // person who has been waiting longest for a human is first.
  app.get('/admin/support', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'closed', 'all'] },
          limit: { type: 'integer', minimum: 1, maximum: 200 },
        },
      },
    },
  }, async (request, reply) => {
    const q = request.query as { status?: 'open' | 'closed' | 'all'; limit?: number };
    const tickets = await ticketQueue({ status: q.status, limit: q.limit });
    return reply.send({
      ok: true,
      waiting: tickets.filter((t) => t.status === 'open' && t.awaiting === 'founder').length,
      tickets,
    });
  });

  // GET /admin/support/:id — one whole thread, with the account it belongs to.
  app.get('/admin/support/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = await getTicket(id);
    if (!ticket) return reply.code(404).send({ error: 'not_found' });
    const who = await one<{ phone: string | null; display_name: string | null; tier: string }>(
      'select phone, display_name, tier from profiles where id = $1', [ticket.user_id],
    );
    return reply.send({
      ok: true,
      ticket: { ...ticket, kind_title_fa: kindTitle(ticket.kind) },
      user: who,
      messages: await messagesOf(ticket.id),
    });
  });

  // GET /admin/support/by-reference/:reference — the lookup that makes the tag
  // worth minting: a photo arrives in a messenger with «T-ABC-DEF» typed under
  // it, and this is how that becomes an account.
  app.get('/admin/support/by-reference/:reference', async (request, reply) => {
    const { reference } = request.params as { reference: string };
    const ticket = await ticketByReference(normalizeReference(reference));
    if (!ticket) return reply.code(404).send({ error: 'not_found' });
    const who = await one<{ id: string; phone: string | null; display_name: string | null; tier: string }>(
      'select id, phone, display_name, tier from profiles where id = $1', [ticket.user_id],
    );
    return reply.send({
      ok: true,
      ticket: { ...ticket, kind_title_fa: kindTitle(ticket.kind) },
      user: who,
      messages: await messagesOf(ticket.id),
    });
  });

  // POST /admin/support/:id/reply { body, close? } — answer, and optionally end
  // the thread in the same press. The reader is notified by addMessage().
  app.post('/admin/support/:id/reply', {
    schema: {
      body: {
        type: 'object', required: ['body'],
        properties: {
          body: { type: 'string', minLength: 1, maxLength: 4000 },
          close: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as { body: string; close?: boolean };
    const r = await addMessage({ ticketId: id, author: 'founder', body: b.body });
    if (!r.ok) return reply.code(r.ticket ? 400 : 404).send({ error: 'rejected', message: r.message });
    const ticket = b.close ? await closeTicket(id) : r.ticket;
    return reply.send({ ok: true, message: r.row, ticket });
  });

  // POST /admin/support/:id/publish { public } — the founder's switch, and the
  // only thing that ever makes a reader's words visible to anybody else. Only an
  // article thread can be published; a support ticket has no page to appear on,
  // which the service's `content_id is not null` guard enforces rather than
  // trusting the caller to pass the right id.
  app.post('/admin/support/:id/publish', {
    schema: {
      body: { type: 'object', properties: { public: { type: 'boolean' } } },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { public?: boolean };
    const isPublic = body.public !== false;
    const ticket = await setThreadPublic(id, isPublic);
    if (!ticket) return reply.code(404).send({ error: 'not_an_article_thread' });
    // Their words are on a public page now — they hear it from us, not by
    // stumbling on it. Fire-and-forget: publishing must not fail on a push.
    if (isPublic) notifyPublished(ticket).catch(() => { /* logged upstream */ });
    return reply.send({ ok: true, ticket });
  });

  app.post('/admin/support/:id/close', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = await closeTicket(id);
    if (!ticket) return reply.code(404).send({ error: 'not_open' });
    return reply.send({ ok: true, ticket });
  });

  app.post('/admin/support/:id/reopen', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = await reopenTicket(id);
    if (!ticket) return reply.code(404).send({ error: 'not_closed' });
    return reply.send({ ok: true, ticket });
  });

  app.post('/admin/subscriptions/run-sweep', async (_request, reply) => {
    const result = await sweepExpiredSubscriptions(new Date());
    return reply.send({ ok: true, ...result });
  });
}
