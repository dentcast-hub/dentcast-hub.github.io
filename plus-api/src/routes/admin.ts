import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAdmin } from '../middleware/basic-auth.js';
import { refreshOnce, contentStatus } from '../content-refresh.js';
import { computeKpis, type Kpis } from '../services/kpis.js';
import {
  onArticlePublished, runFreeDigest, runPremiumBacklog, backfillExistingContent,
} from '../services/article-notify.js';
import { runReactivationNudges } from '../services/reactivation.js';
import { runStreakReminders } from '../services/streak-reminder.js';
import { one, query } from '../db.js';
import { normalizePhone } from '../services/phone.js';
import {
  activateMonths, activateDays, grantLifetime, revokeSubscription, getSubscription,
  summarizeSubscription, sweepExpiredSubscriptions, subscriptionReport, neverPremiumUserIds,
  type Subscription,
} from '../services/subscription.js';
import { getCapacity } from '../services/payment-capacity.js';
import { reconcilePendingPayments } from '../services/payment-reconcile.js';
import { pillarRoster, grantPillarSeat, revokePillarSeat } from '../services/pillar.js';
import { pillarWelcomeBackfill, schedulePillarWelcome } from '../services/pillar-notify.js';
import {
  availableCredits, creditPercent, pickCredits, insertGrant, CREDIT_CAP_PERCENT,
} from '../services/discount-credits.js';
import {
  pendingRedemptions, approveRedemption, rejectRedemption, confirmRedemptionAmount,
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
  ticketByReference, kindTitle, setMessagePublic, notifyPublished,
} from '../services/support.js';
import { normalizeReference } from '../services/reference.js';
import {
  pathwayStandings, runPathwayAlerts, levelFor, alertable,
} from '../services/pathway-standings.js';
import {
  issueCertificate, revokeCertificate, listCertificates, certificateRoster, getCertificate,
} from '../services/certificates.js';
import {
  assignExam, deleteAssignment, listAssignments, assignmentRoster, getAssignment, notifyAssigned,
  upsertForm, getForm, deleteForm, formRoster, queueRows, attemptRoster, ruleAttempt, notifyAssigneesOfNewForm,
  parseQuestions, addQuestion, removeQuestion,
} from '../services/pathway-exams.js';
import { getPathways } from '../pathways.js';
import {
  requestQueue, getRequest, requestByReference, markAnswered, markRejected,
} from '../services/des-requests.js';
import {
  nearDuplicates, createPaper, attachKeys,
  validateDesRecord, normaliseDesRecord, resolveHashtags,
} from '../services/des-library.js';
import { keyHash, keysFor, allDois, allPmids, paperScope, pickIdentifier } from '../services/des-identity.js';
import {
  queueRows as challengeQueueRows, attemptReport as challengeAttemptReport,
  getAttempt as getChallengeAttempt,
  settleByFounder, upsertChallenge, validateKeyPoints,
} from '../services/challenge.js';
import {
  listClosures, addClosure, removeClosure, clinicStatus, backOn, closureText, today as tehranToday,
} from '../services/clinic.js';
import { parseJalali, formatJalaliLong, formatJalaliDay } from '../services/jalali.js';
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

/**
 * What the bank-transfer queue needs to offer the student amount as a button
 * rather than as mental arithmetic.
 *
 * The discount is still ANNOUNCED, not computed by the engine (decision 2.3) —
 * this only fills the field with the figure the rule implies, and the founder
 * still presses «ثبت مبلغ» to write it. Handing over the number rather than
 * the multiplication is what stops the one mistake with no undo: a typo here
 * is a price somebody transfers.
 */
interface StudentTerms {
  percent: number;
  months: number;
  prices: Record<number, number>;
}

function renderHtml(
  k: Kpis,
  grantable: { key: string; title_fa: string }[],
  student: StudentTerms,
): string {
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
  /* Light palette mirroring the site's own light-mode tokens (dc-theme.css
     :root) — this page is standalone-rendered and never loads that
     stylesheet, so its colors are copied in rather than shared. */
  body{margin:0;background:#f0f2f5;color:#0a1a33;font-family:system-ui,'Segoe UI',Tahoma,sans-serif;line-height:1.8}
  .wrap{max-width:880px;margin:0 auto;padding:22px 16px 60px}
  h1{font-size:1.3rem}
  .muted{color:#62779a;font-size:.85rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:16px}
  .card{background:#fff;border:1px solid rgba(2,35,96,.10);border-radius:14px;padding:14px 16px;
    box-shadow:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04)}
  .card .k{color:#0b5fff;font-weight:800;font-size:.8rem}
  .card h3{margin:.2rem 0;font-size:.95rem;color:#4a5f85}
  .card .v{font-size:1.8rem;font-weight:900}
  .card .s{color:#62779a;font-size:.82rem}
  .wrap{overflow-x:hidden}
  table{width:100%;border-collapse:collapse;margin-top:8px;background:#fff;border:1px solid rgba(2,35,96,.10);
    border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04)}
  th,td{padding:8px 12px;text-align:center;border-bottom:1px solid rgba(2,35,96,.10)}
  /* Wide report tables (5 unbreakable-value columns: phone numbers, dates) can
     exceed a phone's viewport. Scrolling THIS box, not the RTL page body, is
     what keeps the fix local — an unconstrained overflow here shifts the whole
     document's scroll origin and reads as the entire page being broken. */
  .tblwrap{overflow-x:auto;margin-top:8px;border-radius:14px}
  .tblwrap table{margin-top:0;min-width:480px}
  .tblwrap th,.tblwrap td{white-space:nowrap}
  th{color:#62779a;font-weight:700}
  form.bc{background:#fff;border:1px solid rgba(2,35,96,.10);border-radius:14px;padding:14px 16px;margin-top:8px;
    display:flex;flex-direction:column;gap:9px;box-shadow:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04)}
  form.bc label{font-size:.82rem;color:#62779a}
  form.bc input[type=text],form.bc textarea,form.bc select{width:100%;box-sizing:border-box;
    background:#f4f6fb;color:#0a1a33;border:1px solid rgba(2,35,96,.10);border-radius:9px;padding:9px 11px;
    font:inherit;font-size:.92rem}
  form.bc textarea{min-height:64px;resize:vertical}
  form.bc .row{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
  form.bc .chk{display:flex;gap:6px;align-items:center;font-size:.86rem;color:#4a5f85}
  form.bc button{background:#0b5fff;color:#fff;border:0;border-radius:999px;padding:10px 22px;
    font:inherit;font-weight:800;cursor:pointer;align-self:flex-start}
  form.bc button:disabled{opacity:.55;cursor:default}
  #bcOut,#bgOut,#tkOut{font-size:.85rem;color:#62779a;min-height:1.6em}
  .tabs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  .tabs button{background:#f4f6fb;color:#4a5f85;border:1px solid rgba(2,35,96,.10);border-radius:999px;
    padding:7px 16px;font:inherit;font-weight:700;cursor:pointer}
  .tabs button.on{background:#0b5fff;color:#fff;border-color:#0b5fff}
  .sp-c{background:#fff;border:1px solid rgba(2,35,96,.10);border-radius:14px;padding:12px 14px;margin-top:10px;
    box-shadow:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04)}
  .sp-c h4{margin:0;font-size:1rem}
  .sp-c .head{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}
  .sp-c .big{font-size:1.25rem;font-weight:900}
  .sp-row{margin-top:9px}
  .sp-row .lbl{display:flex;justify-content:space-between;gap:10px;font-size:.86rem;color:#4a5f85}
  .sp-bar{height:7px;border-radius:99px;background:#eaecf5;border:1px solid rgba(2,35,96,.10);margin-top:3px;overflow:hidden}
  .sp-bar i{display:block;height:100%;background:#0b5fff}
  .warn{color:#8a6414;font-size:.83rem;margin-top:10px}
  .pill{display:inline-block;background:#f4f6fb;border:1px solid rgba(2,35,96,.10);border-radius:999px;
    padding:1px 9px;font-size:.74rem;color:#62779a;margin-inline-start:6px;vertical-align:middle}
  .pill.hot{background:rgba(201,146,43,.10);border-color:rgba(154,107,21,.30);color:#8a6414}
  .pill.ok{background:rgba(15,122,74,.09);border-color:rgba(15,122,74,.25);color:#0f7a4a}
  .tk{background:#fff;border:1px solid rgba(2,35,96,.10);border-radius:14px;padding:12px 14px;margin-top:10px;
    cursor:pointer;box-shadow:0 1px 3px rgba(2,35,96,.07),0 4px 14px rgba(2,35,96,.04)}
  .tk.need{border-color:rgba(154,107,21,.45)}
  .tk-h{display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:.95rem}
  .tk-x{color:#4a5f85;font-size:.87rem;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  /* چالش queue: whole answer, wrap + scroll. The nowrap .tk-x above stays
     for پشتیبانی/DES one-line previews. */
  .tk-x.full{white-space:pre-wrap;overflow:auto;max-height:16em;text-overflow:unset;word-break:break-word}
  .tk-body{cursor:auto}
  .tk-body:not(:empty){margin-top:12px;border-top:1px solid rgba(2,35,96,.10);padding-top:12px}
  .thread{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
  .msg{border-radius:12px;padding:8px 11px;font-size:.9rem;max-width:88%}
  .msg.them{background:#f4f6fb;border:1px solid rgba(2,35,96,.10);align-self:flex-start}
  .msg.me{background:rgba(11,95,255,.08);border:1px solid #0b5fff;align-self:flex-end}
  .tk-body textarea.reply{width:100%;box-sizing:border-box;min-height:76px;background:#f4f6fb;color:#0a1a33;
    border:1px solid rgba(2,35,96,.10);border-radius:9px;padding:9px 11px;font:inherit;font-size:.92rem;resize:vertical}
  .tk-body button{background:#0b5fff;color:#fff;border:0;border-radius:999px;padding:8px 18px;
    font:inherit;font-weight:800;cursor:pointer;margin-top:8px;margin-inline-end:8px}
  .tk-out{min-height:1.4em;font-size:.85rem}
  .bt-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
  .bt-actions input[type=text]{flex:1 1 140px;box-sizing:border-box;background:#f4f6fb;color:#0a1a33;
    border:1px solid rgba(2,35,96,.10);border-radius:9px;padding:8px 10px;font:inherit;font-size:.86rem}
  .bt-actions button{background:#0b5fff;color:#fff;border:0;border-radius:999px;padding:7px 16px;
    font:inherit;font-weight:800;cursor:pointer}
  .bt-actions button.gold{background:#8a6414}
  .bt-actions button.danger{background:#b3261e}
  .ds-work{display:flex;flex-direction:column;gap:8px}
  .ds-work label{font-size:.82rem;color:#62779a;margin-top:4px}
  .ds-work input[type=text],.ds-work textarea{width:100%;box-sizing:border-box;background:#f4f6fb;
    color:#0a1a33;border:1px solid rgba(2,35,96,.10);border-radius:9px;padding:9px 11px;font:inherit;font-size:.9rem}
  .ds-work textarea.ds-json{min-height:220px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:.8rem;direction:ltr;text-align:left;resize:vertical}
  .ds-work .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
  .ds-cand{background:#f4f6fb;border:1px solid rgba(2,35,96,.10);border-radius:9px;padding:8px 10px;margin-top:6px}
  .ds-cand b{display:block;font-size:.88rem}
  .ds-cand .muted{margin-top:2px}
  .ds-cand .row{margin-top:8px}
  #clOut{font-size:.85rem;color:#62779a;min-height:1.6em}
  #clList td button{background:#b3261e;color:#fff;border:0;border-radius:999px;padding:5px 14px;
    font:inherit;font-weight:800;font-size:.82rem;cursor:pointer}
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
  <div class="muted">«چند ماهه» یعنی ماهِ اولین شروعِ اشتراک (started_at) — تمدید ماه شروع را عوض نمی‌کند، پس هر ردیف یک کوهورتِ واقعیِ جذب است، نه شمارشِ تمدیدها. «پرمیومِ لیگی» معمولاً فقط از premium_grants است؛ اگر برنده‌ی لیگ از قبل اشتراک پولی داشته باشد، روزهای جایزه روی همان اشتراک هم می‌نشیند.</div>
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
        + card('هرگز پریمیوم را تجربه نکرده‌اند', num(t.never_premium), 'نه خرید، نه هدیه، نه جایزه‌ی لیگ')
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

  <h3 style="margin-top:26px">هدیه‌ی پریمیوم به کسانی که تا حالا تجربه نکرده‌اند</h3>
  <div class="muted">همان گروهِ کارتِ «هرگز پریمیوم را تجربه نکرده‌اند» بالا — هر تعداد روز که بخواهی، با یک پیامِ اختصاصی، به همه‌شان یک‌جا. برای هر نفر یک هدیه‌ی جداگانه ثبت و یک اطلاعیه‌ی جداگانه فرستاده می‌شود؛ کسی که تا الان اشتراک نداشته، این روزها را از همین امروز شروع می‌کند.</div>
  <div id="ntCount" class="muted" style="margin-top:6px">در حال شمارش…</div>
  <form class="bc" id="ntForm" onsubmit="return false">
    <div class="row">
      <div style="flex:0 0 140px"><label for="ntDays">چند روز</label><input id="ntDays" type="number" min="1" max="90" value="7"></div>
      <div style="flex:1 1 200px"><label for="ntTitle">عنوانِ پیام</label><input id="ntTitle" type="text" maxlength="120" placeholder="مثلاً: یک هفته پریمیوم مهمانِ ما باش"></div>
    </div>
    <div><label for="ntBody">متن (اختیاری)</label><textarea id="ntBody" maxlength="600"></textarea></div>
    <div class="row">
      <div style="flex:1 1 200px"><label for="ntUrl">لینک (اختیاری)</label><input id="ntUrl" type="text" placeholder="/plus/"></div>
    </div>
    <div class="row">
      <label class="chk"><input id="ntPush" type="checkbox"> پوش/پیام‌رسان هم بفرست</label>
      <label class="chk"><input id="ntForce" type="checkbox"> حتی خارج از ۹ تا ۲۲</label>
    </div>
    <button id="ntSend" type="button">هدیه بده</button>
    <div id="ntOut"></div>
  </form>
  <script>
  (function () {
    var countBox = document.getElementById('ntCount');
    var lastCount = null;

    function loadCount() {
      fetch('/admin/subscriptions/report', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          lastCount = j.totals ? j.totals.never_premium : null;
          countBox.textContent = lastCount == null
            ? 'شمارش نیامد.'
            : 'الان ' + Number(lastCount).toLocaleString('en-US') + ' نفر تا حالا پریمیوم را تجربه نکرده‌اند.';
        })
        .catch(function () { countBox.textContent = 'شمارش نیامد (شبکه).'; });
    }

    var btn = document.getElementById('ntSend');
    var out = document.getElementById('ntOut');
    btn.addEventListener('click', function () {
      var days = parseInt(document.getElementById('ntDays').value, 10);
      var title = document.getElementById('ntTitle').value.trim();
      if (!days || days < 1 || days > 90) { out.textContent = 'تعداد روز باید بین ۱ تا ۹۰ باشد.'; return; }
      if (!title) { out.textContent = 'عنوانِ پیام لازم است.'; return; }
      var who = lastCount == null
        ? 'همه‌ی کسانی که تا حالا پریمیوم را تجربه نکرده‌اند'
        : (Number(lastCount).toLocaleString('en-US') + ' نفر');
      if (!confirm(days + ' روز پریمیوم به ' + who + ' هدیه داده شود؟ برای هر نفر یک پیامِ جداگانه هم می‌رود.')) return;
      btn.disabled = true; out.textContent = 'در حال اهدا... ممکن است کمی طول بکشد.';
      fetch('/admin/subscriptions/gift-never-tried', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          days: days,
          title: title,
          body: document.getElementById('ntBody').value.trim() || undefined,
          url: document.getElementById('ntUrl').value.trim() || undefined,
          push: document.getElementById('ntPush').checked,
          force: document.getElementById('ntForce').checked
        })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { out.textContent = 'نشد: ' + (res.j.error || 'خطا'); return; }
          var m = res.j.targeted + ' نفر هدف؛ ' + res.j.granted + ' نفر هدیه گرفتند';
          if (res.j.failed) m += '، ' + res.j.failed + ' مورد خطا خورد';
          m += '.';
          if (res.j.push === 'queued') { m += ' پوش/پیام‌رسان هم رفت.'; }
          else if (res.j.push_skipped === 'outside_awake_window') { m += ' پوش نرفت (خارج از ۹ تا ۲۲)؛ فقط اطلاعیه نشست.'; }
          out.textContent = m;
          document.getElementById('ntTitle').value = '';
          document.getElementById('ntBody').value = '';
          loadCount();
        })
        .catch(function () { btn.disabled = false; out.textContent = 'ارسال نشد.'; });
    });

    loadCount();
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
    <button type="button" data-days="1" data-offset="0" class="on">۲۴ ساعت (امروزِ تهران)</button>
    <button type="button" data-days="1" data-offset="-1">دیروز (روزِ کاملِ تهران)</button>
    <button type="button" data-days="7" data-offset="0">۷ روز</button>
    <button type="button" data-days="30" data-offset="0">۳۰ روز</button>
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

    function warnings(b, days, offset) {
      var w = [];
      // Only the CURRENT Tehran day is partial (from midnight to right now).
      // Yesterday's tab is the previous calendar day start-to-finish, so it
      // carries no such caveat — that is the whole point of having it.
      if (days === 1 && offset === 0) w.push('امروز یک روزِ ناقص است — از نیمه‌شبِ تهران تا همین لحظه، نه ۲۴ ساعتِ لغزان.');
      if (b.from < FIRST_DAY) w.push('پیش از ' + FIRST_DAY + ' هیچ دادهٔ تبلیغی وجود ندارد؛ روزهای قبلِ آن در این بازه خالی‌اند، نه صفر.');
      if (b.from <= SLOT_SPLIT_DAY && b.to >= SLOT_SPLIT_DAY) {
        w.push('این بازه روی ' + SLOT_SPLIT_DAY + ' افتاده: تا آن روز صفحه‌های تکِ اپیزود زیر «مقاله» شمرده می‌شدند و از آن روز زیر «صفحهٔ اپیزود». افتِ «مقاله» در این مرز برچسب‌گذاریِ دوباره است، نه ریزش.');
      }
      if (!b.totals.impressions) w.push('در این بازه هیچ نمایشی ثبت نشده. اگر انتظارِ ترافیک داشتی، پیش از نتیجه‌گیری رویدادِ spot_report_failed را در GA ببین.');
      return w.length ? '<div class="warn">' + w.map(function (t) { return '⚠️ ' + esc(t); }).join('<br>') + '</div>' : '';
    }

    function render(b, days, offset) {
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
        + warnings(b, days, offset);
    }

    // offset shifts the window's END day back from today — 0 for the
    // current (partial) Tehran day, -1 for the full previous calendar day
    // (yesterday), so right after midnight there is still a complete day's
    // worth of numbers to read instead of an almost-empty "24 hours" tab.
    function load(days, offset) {
      var to = shift(tehranToday(), offset);
      var from = shift(to, -(days - 1));
      out.className = 'muted';
      out.textContent = 'در حال خواندن…';
      fetch('/admin/spot/stats?from=' + from + '&to=' + to + '&group_by=day', { credentials: 'include' })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { out.textContent = 'خوانده نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
          render(res.j, days, offset);
        })
        .catch(function () { out.textContent = 'خوانده نشد (شبکه).'; });
    }

    tabs.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-days]');
      if (!btn) return;
      [].forEach.call(tabs.querySelectorAll('button'), function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      load(Number(btn.getAttribute('data-days')), Number(btn.getAttribute('data-offset') || 0));
    });
    load(1, 0);
  })();
  </script>

  <h3 style="margin-top:26px">محتوا — نسخهٔ زندهٔ فایل‌ها <span id="cnWaiting" class="pill"></span></h3>
  <div class="muted">
    چهار فایلِ JSON در ریپو ویرایش می‌شوند و API همان‌ها را در زمان اجرا از سایت می‌خوانَد — به همین
    دلیل عوض‌کردنِ نامِ یک مسیر یا آستانهٔ یک نشان کامیت است نه دیپلوی. اگر تغییری را روی سایت
    می‌بینی ولی در محصول نه، جواب همین جدول است: <b>image/disk</b> یعنی نسخهٔ پخت‌شده در ایمیج
    سرو می‌شود (آدرس تنظیم نشده، یا هنوز چیزی پذیرفته نشده) و <b>published</b> یعنی نسخهٔ سایت.
    «الان بخوان» همین حالا اجرا می‌کند تا منتظرِ دورهٔ بعدی نمانی.
  </div>
  <div class="row" style="margin-top:10px">
    <button id="cnRun" type="button">الان بخوان</button>
    <span id="cnOut" class="muted"></span>
  </div>
  <div id="cnBox"></div>
  <script>
  (function () {
    var box = document.getElementById('cnBox');
    var btn = document.getElementById('cnRun');
    var out = document.getElementById('cnOut');
    var waiting = document.getElementById('cnWaiting');
    if (!box || !btn) return;
    // Each block on this page carries its own esc/fa: the scripts are separate
    // IIFEs, so a helper defined in one is not in scope in another.
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    var FA = '۰۱۲۳۴۵۶۷۸۹';
    function fa(n) { return String(n == null ? '' : n).replace(/[0-9]/g, function (d) { return FA[+d]; }); }
    function when(t) {
      if (!t) return '—';
      try { return new Date(t).toLocaleString('fa-IR'); } catch (e) { return t; }
    }
    function render(d) {
      if (!d || !d.ok) { box.textContent = 'نیامد.'; return; }
      var files = d.files || [];
      var stale = files.filter(function (f) { return f.configured && f.source.indexOf('published') !== 0; });
      waiting.textContent = stale.length ? fa(stale.length) : '';
      var body = files.map(function (f) {
        var live = f.source.indexOf('published') === 0
          ? '<span class="pill"><b>' + esc(f.source) + '</b></span>'
          : '<span class="pill">' + esc(f.source) + '</span>';
        var cfg = f.configured
          ? '<span class="pill">' + esc(f.env) + '</span>'
          : '<span class="pill"><b>' + esc(f.env) + ' تنظیم نشده</b></span>';
        return '<tr><td>' + esc(f.key) + '</td><td>' + live + '</td><td>' + cfg + '</td>'
          + '<td>' + esc(when(f.published_at)) + '</td>'
          + '<td>' + esc(when(f.last_ok_at)) + '</td>'
          + '<td class="muted">' + (f.last_error ? esc(f.last_error) : '') + '</td></tr>';
      }).join('');
      box.innerHTML = '<div class="muted" style="margin-top:10px">دورهٔ خواندن: هر '
        + fa(d.refresh_seconds || 0) + ' ثانیه · ایمیج ساخته‌شده در ' + esc(when(d.built_at))
        + ' (' + esc(d.commit || '') + ') — نسخهٔ سایت فقط وقتی پذیرفته می‌شود که از ایمیج تازه‌تر باشد</div>'
        + '<div class="tblwrap"><table><tr><th>فایل</th><th>نسخهٔ در سرویس</th><th>آدرس</th>'
        + '<th>تاریخِ فایلِ سایت</th><th>آخرین پذیرش</th><th>آخرین خطا</th></tr>' + body + '</table></div>';
    }
    function load() {
      fetch('/admin/content', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(render)
        .catch(function () { box.textContent = 'وضعیت نیامد.'; });
    }
    btn.addEventListener('click', function () {
      btn.disabled = true; out.textContent = 'در حال خواندن…';
      fetch('/admin/content/refresh', { method: 'POST', credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          btn.disabled = false;
          out.textContent = 'خوانده شد.';
          render(j);
        })
        .catch(function () { btn.disabled = false; out.textContent = 'اجرا نشد.'; });
    });
    load();
  })();
  </script>

  <h3 style="margin-top:26px">مسیرها — چه کسی نزدیک پایان است <span id="pwWaiting" class="pill"></span></h3>
  <div class="muted">
    پیشرفتِ مسیر هیچ‌جا ذخیره نمی‌شود؛ از روی چیزی که هر نفر واقعاً خوانده/شنیده حساب می‌شود.
    این‌جا همان حساب برای همه اجرا می‌شود تا معلوم شود چه کسی به انتها نزدیک است — یعنی چه وقت
    باید آزمونِ آن مسیر آماده باشد.
    <br>
    <b>باندل‌ها این‌جا نیستند</b> (۵ تا ۸ قدم، اندازهٔ گواهی نیست). معیار، تعدادِ قدمِ
    <i>نخوانده</i>ست، نه درصد. کاربرِ رایگان در جدول هست ولی برایش نوتیف نمی‌رود —
    اصلاً صفحهٔ مسیر را نمی‌بیند.
  </div>
  <div class="row" style="margin-top:10px">
    <button id="pwRun" type="button">اجرای دستیِ بررسی</button>
    <span id="pwOut" class="muted"></span>
  </div>
  <div id="pwBox"></div>
  <script>
  (function () {
    var box = document.getElementById('pwBox');
    var out = document.getElementById('pwOut');
    var btn = document.getElementById('pwRun');
    var waiting = document.getElementById('pwWaiting');
    if (!box || !btn) return;
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    var FA = '۰۱۲۳۴۵۶۷۸۹';
    function fa(n) { return String(n).replace(/[0-9]/g, function (d) { return FA[+d]; }); }

    // One table shape for all three buckets: the columns answer the same
    // question, only the urgency differs.
    function table(rows, opts) {
      if (!rows.length) return '<div class="muted">—</div>';
      var body = rows.map(function (r) {
        var who = esc(r.display_name || r.user_id.slice(0, 8));
        var tier = r.tier === 'premium'
          ? '<span class="pill">پریمیوم</span>'
          : '<span class="pill">رایگان</span>';
        var mark = (r.enrolled ? '<span class="pill">ثبت‌نام کرده</span> ' : '')
          + (r.certificate_intent === 'wanted' ? '<span class="pill"><b>گواهی می‌خواهد</b></span>'
            : r.certificate_intent === 'declined' ? '<span class="pill">گواهی نمی‌خواهد</span>' : '');
        // An already-announced row is the normal state, not an error: it means
        // the alert did its job and this is the standing record of it.
        var said = r.alerted
          ? '<span class="pill">خبر داده شد: ' + (r.alerted === 'done' ? 'پایان' : 'نزدیک') + '</span>'
          : (r.alertable ? '' : '<span class="pill">بی‌نوتیف</span>');
        return '<tr><td>' + who + ' ' + tier + '</td><td>' + esc(r.title_fa) + '</td>'
          + '<td>' + fa(r.completed_steps) + ' از ' + fa(r.total_steps) + '</td>'
          + '<td><b>' + fa(r.remaining) + '</b></td>'
          + '<td>' + mark + ' ' + said + '</td></tr>';
      }).join('');
      return '<div class="tblwrap"><table><tr><th>' + esc(opts.who) + '</th><th>مسیر</th>'
        + '<th>خوانده</th><th>مانده</th><th></th></tr>' + body + '</table></div>';
    }

    function render(d) {
      if (!d || !d.ok) { box.textContent = 'نیامد.'; return; }
      var c = d.counts || {};
      waiting.textContent = (c.done || 0) + (c.near || 0)
        ? fa((c.done || 0) + (c.near || 0)) : '';
      var head = '<div class="muted" style="margin-top:10px">'
        + 'آستانه: ' + fa(d.near_remaining) + ' قدمِ مانده · بررسیِ خودکار هر شب ساعت '
        + fa(d.alert_hour) + ' · ' + fa(c.readers || 0) + ' نفر روی مسیرها'
        + ' · نوتیف فقط برای کسی که گفته <b>گواهی می‌خواهد</b> (بقیه فقط در همین جدول)'
        + (d.alert_phone_set ? '' : ' · <b>شمارهٔ هشدار تنظیم نشده — فقط همین جدول</b>')
        + '</div>';
      box.innerHTML = head
        + '<h4 style="margin-top:14px">تمام کرده‌اند (' + fa(c.done || 0) + ')</h4>'
        + table(d.done || [], { who: 'کاربر' })
        + '<h4 style="margin-top:14px">نزدیک پایان (' + fa(c.near || 0) + ')</h4>'
        + table(d.near || [], { who: 'کاربر' })
        + '<h4 style="margin-top:14px">در راه (' + fa(c.walking || 0) + ')</h4>'
        + table(d.walking || [], { who: 'کاربر' });
    }

    function load() {
      fetch('/admin/pathways', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(render)
        .catch(function () { box.textContent = 'فهرست نیامد.'; });
    }

    btn.addEventListener('click', function () {
      btn.disabled = true; out.textContent = 'در حال بررسی…';
      fetch('/admin/pathways/run-alerts', { method: 'POST', credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          btn.disabled = false;
          var n = (j.crossings || []).length;
          out.textContent = n
            ? fa(n) + ' مورد تازه' + (j.notified ? ' — نوتیف رفت.' : ' — نوتیف نرفت (شماره؟).')
            : 'چیز تازه‌ای نبود.';
          load();
        })
        .catch(function () { btn.disabled = false; out.textContent = 'اجرا نشد.'; });
    });

    load();
  })();
  </script>

  <h3 id="exams" style="margin-top:26px">آزمونِ مسیر <span id="exqWaiting" class="pill"></span></h3>
  <div class="muted">
    سه چیز این‌جا نوشته می‌شود. <b>فرم آزمون</b> برای هر مسیر یک بار: سؤال‌ها را از NotebookLM می‌گیری (الگوی
    پرامپت پایین همین بخش) و همین‌جا می‌چسبانی — تستی، تشریحی، یا هر دو، به هر تعداد. <b>واگذاری</b> وقتی
    می‌خواهی کسی را پیش از تمام‌کردن مسیر راه بدهی؛ کسی که مسیر را تمام کرده خودش راه دارد. و <b>حکم</b> روی
    تلاش‌هایی که در صف‌اند: پاسخ تشریحی را مدل دو بار جداگانه تصحیح می‌کند و فقط اگر هر دو بار یک حکم بدهد مطمئن
    حساب می‌شود — و تا وقتی روی یک فرم کمتر از «حدِ نظارت» حکم داده باشی، هر تلاشِ تشریحی با حکمِ آمادهٔ مدل به
    صف تو می‌آید نه این‌که خودش بسته شود. حکم تو نمونهٔ آموزشیِ همان سؤال می‌شود. تستی خودش بسته می‌شود.
    قبولی یعنی هر بخش (تستی / نکته‌های تشریحی) به نصاب برسد؛ قبولی همان لحظه گواهی صادر می‌کند.
  </div>

  <h4 style="margin-top:14px">فرم آزمون هر مسیر</h4>
  <form class="bc" id="efForm" onsubmit="return false">
    <div class="row">
      <div style="flex:1 1 220px"><label for="efPath">مسیر</label><select id="efPath"></select></div>
      <div style="flex:0 0 90px"><label for="efMcq">قرعهٔ تستی</label><input id="efMcq" type="number" min="0" max="200" value="0" title="۰ = همهٔ سؤال‌های تستیِ مخزن"></div>
      <div style="flex:0 0 90px"><label for="efFree">قرعهٔ تشریحی</label><input id="efFree" type="number" min="0" max="200" value="0" title="۰ = همهٔ سؤال‌های تشریحیِ مخزن"></div>
      <div style="flex:0 0 80px"><label for="efPass">نصاب ٪</label><input id="efPass" type="number" min="1" max="100" value="70"></div>
      <div style="flex:0 0 80px"><label for="efMax">تلاش</label><input id="efMax" type="number" min="1" max="10" value="2"></div>
      <div style="flex:0 0 90px"><label for="efRetry">فاصله (روز)</label><input id="efRetry" type="number" min="0" max="365" value="7"></div>
      <div style="flex:0 0 90px"><label for="efSup">حدِ نظارت</label><input id="efSup" type="number" min="0" max="1000" value="5" title="چند حکم تو لازم است تا مدل خودش تشریحی را ببندد"></div>
    </div>
    <div><label for="efQ">سؤال‌ها — همان‌طور که نوشته‌ای بچسبان (متن ساده؛ JSON هم قبول است)</label>
      <textarea id="efQ" rows="9" dir="auto" placeholder="۱. متن سؤال تستی … / الف) گزینه / ب) گزینه ✓ …"></textarea>
      <div class="muted">
        هر سؤال با <b>شمارهٔ خودش</b> شروع شود؛ گزینه‌ها با <b>الف/ب/ج/د</b> (یا a/b/c/d یا خط تیره)؛
        گزینهٔ درست را با <b>✓</b> علامت بزن یا زیرش بنویس «پاسخ: ب». سؤال تشریحی گزینه ندارد و زیرش
        «<b>نکته‌ها:</b>» و نکته‌های کلیدی می‌آید. اول «بررسی متن» را بزن تا ببینی چه خوانده شد.
      </div></div>
    <div><label for="efNote">یادداشت (اختیاری)</label><input id="efNote" type="text" maxlength="400"></div>
    <div class="row">
      <button id="efCheck" type="button">بررسی متن</button>
      <button id="efSend" type="button">ذخیرهٔ فرم</button>
      <button id="efPrompt" type="button">الگوی پرامپت NotebookLM</button>
      <span id="efOut" class="muted"></span>
    </div>
    <div id="efPreview"></div>
    <pre id="efPromptBox" dir="rtl" style="display:none;white-space:pre-wrap;font-family:inherit;font-size:.9em;border:1px solid rgba(2,35,96,.14);padding:10px;border-radius:8px"></pre>
  </form>
  <div id="efList"></div>

  <h4 style="margin-top:18px">سؤال‌ها را یکی‌یکی بنویس — مسیر: <b id="qbPath">…</b></h4>
  <div class="muted">
    دو قالب، هر کدام جدا. هر سؤالی که «افزودن» بزنی همان لحظه به مخزنِ <b>همین مسیرِ بالا</b>
    اضافه می‌شود (تنظیماتِ فرم — نصاب، قرعه، تلاش — دست‌نخورده می‌ماند). در تستی لازم نیست
    تعداد گزینه‌ها را از قبل بگویی: تا در آخرین کادر بنویسی، کادر بعدی خودش باز می‌شود و
    هرجا ننویسی همان‌جا تمام است.
  </div>
  <div class="row" style="align-items:flex-start">
    <form class="bc" id="qbMcqForm" style="flex:1 1 330px" onsubmit="return false">
      <b>۱) سؤال تستی</b>
      <div><label for="qbMcqStem">صورت سؤال</label><textarea id="qbMcqStem" rows="2" style="min-height:52px"></textarea></div>
      <div><label>گزینه‌ها — تیکِ جلوی گزینهٔ درست</label><div id="qbOpts"></div></div>
      <button id="qbMcqAdd" type="button">افزودن سؤال تستی</button>
      <span id="qbMcqOut" class="muted"></span>
    </form>
    <form class="bc" id="qbFreeForm" style="flex:1 1 330px" onsubmit="return false">
      <b>۲) سؤال تشریحی</b>
      <div><label for="qbFreeStem">صورت سؤال</label><textarea id="qbFreeStem" rows="2" style="min-height:52px"></textarea></div>
      <div><label>پاسخ درست — هر نکتهٔ کلیدی در یک خط</label><div id="qbPoints"></div></div>
      <div class="muted">همین نکته‌هاست که هوش مصنوعی پاسخِ خواننده را با آن‌ها می‌سنجد.</div>
      <button id="qbFreeAdd" type="button">افزودن سؤال تشریحی</button>
      <span id="qbFreeOut" class="muted"></span>
    </form>
  </div>
  <div id="qbList"></div>

  <h4 style="margin-top:18px">واگذاریِ زودهنگام</h4>
  <form class="bc" id="exForm" onsubmit="return false">
    <div class="row">
      <div style="flex:1 1 200px"><label for="exUser">کاربر (موبایل / نام کاربری / شناسه)</label>
        <input id="exUser" type="text" placeholder="0912…"></div>
      <div style="flex:1 1 220px"><label for="exPath">مسیر</label><select id="exPath"></select></div>
    </div>
    <div><label for="exNote">یادداشت (اختیاری)</label><input id="exNote" type="text" maxlength="200"></div>
    <button id="exSend" type="button">راه بده و خبر بده</button>
    <span id="exOut" class="muted"></span>
  </form>
  <div id="exList"></div>

  <h4 style="margin-top:18px">صندوق آزمون — منتظر حکم تو</h4>
  <div id="exqList"></div>

  <h4 style="margin-top:18px">گزارش تلاش‌ها</h4>
  <div id="exrList"></div>
  <script>
  (function () {
    var efList = document.getElementById('efList'), efOut = document.getElementById('efOut');
    var exList = document.getElementById('exList'), exOut = document.getElementById('exOut');
    var exqList = document.getElementById('exqList'), exrList = document.getElementById('exrList');
    var waiting = document.getElementById('exqWaiting');
    var efBtn = document.getElementById('efSend'), exBtn = document.getElementById('exSend');
    if (!efList || !exqList) return;
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    var FA = '۰۱۲۳۴۵۶۷۸۹';
    function fa(n) { return String(n == null ? '' : n).replace(/[0-9]/g, function (d) { return FA[+d]; }); }
    function val(id) { return document.getElementById(id).value.trim(); }
    function num(id, dflt) { var n = parseInt(val(id).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }), 10); return isNaN(n) ? dflt : n; }
    function when(iso) {
      if (!iso) return '';
      try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); }
      catch (e) { return ''; }
    }
    function post(url, body) {
      return fetch(url, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
    }
    function get(url) { return fetch(url, { credentials: 'include', cache: 'no-store' }).then(function (r) { return r.json(); }); }
    var titles = {};
    var STATUS = { open: 'باز', queued: 'در صف', passed: 'قبول', failed: 'رد', void: 'باطل' };

    get('/admin/pathways/catalog').then(function (d) {
      var opts = (d.pathways || []).map(function (p) {
        titles[p.id] = p.title_fa;
        return '<option value="' + esc(p.id) + '">' + esc(p.title_fa) + ' (' + fa(p.steps) + ')</option>';
      }).join('');
      document.getElementById('efPath').innerHTML = opts;
      document.getElementById('exPath').innerHTML = opts;
      var ce = document.getElementById('cePath'); if (ce) ce.innerHTML = opts;
    }).catch(function () { efOut.textContent = 'فهرست مسیرها نیامد.'; })
      .then(function () { loadForms(); loadAssign(); loadQueue(); loadPool(); });

    // NotebookLM answers in prose, so the prompt asks for the shape the panel
    // itself reads (services/exam-text.ts) rather than for JSON it will not
    // produce. Built with String.fromCharCode(10): a backslash-n here would be
    // a raw newline inside a browser string literal and take the block down.
    var NL = String.fromCharCode(10);
    var PROMPT = [
      'از روی منابع همین نوت‌بوک یک آزمون پایانِ مسیر بساز. خروجی را فقط به شکل زیر بنویس و هیچ توضیح دیگری اضافه نکن:',
      '',
      '۱. متن سؤال تستی',
      'الف) گزینهٔ اول',
      'ب) گزینهٔ دوم ✓',
      'ج) گزینهٔ سوم',
      'د) گزینهٔ چهارم',
      '',
      '۲. متن سؤال تشریحی',
      'نکته‌ها:',
      '- نکتهٔ کلیدی اول',
      '- نکتهٔ کلیدی دوم',
      '- نکتهٔ کلیدی سوم',
      '',
      'قواعد: هر سؤال با شمارهٔ خودش شروع شود. گزینه‌ها با الف/ب/ج/د و گزینهٔ درست با ✓ علامت بخورد (فقط یکی).',
      'سؤالِ تشریحی گزینه ندارد؛ زیرش «نکته‌ها:» بنویس و ۳ تا ۵ نکتهٔ کلیدیِ قابل‌بررسی بگذار که یک پاسخ خوب باید پوشش بدهد.',
      'سؤال تستی باید یک پاسخ درستِ قطعی داشته باشد و گزینه‌های غلط باورپذیر باشند؛ سؤال تشریحی فهم مفهومی و استدلال بالینی را بسنجد.',
      'فقط از محتوای منابع استفاده کن و چیزی از خودت اضافه نکن.'
    ].join(NL);
    document.getElementById('efPrompt').addEventListener('click', function () {
      var box = document.getElementById('efPromptBox');
      box.textContent = PROMPT;
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
      if (navigator.clipboard) navigator.clipboard.writeText(PROMPT).then(function () { efOut.textContent = 'پرامپت کپی شد.'; }, function () {});
    });

    function loadForms() {
      get('/admin/exam-forms').then(function (d) {
        var rows = d.forms || [];
        if (!rows.length) { efList.innerHTML = '<div class="muted">هنوز فرمی ذخیره نشده.</div>'; return; }
        efList.innerHTML = '<div class="tblwrap"><table><tr><th>مسیر</th><th>مخزن</th><th>قرعه</th><th>نصاب</th>'
          + '<th>تلاش / فاصله</th><th>حکم‌های تو</th><th>تلاش‌ها</th><th></th></tr>'
          + rows.map(function (f) {
            var a = f.attempts || {};
            var sup = f.rulings >= f.supervised_until
              ? '<span class="pill">خودکار</span>' : fa(f.rulings) + ' از ' + fa(f.supervised_until);
            return '<tr><td>' + esc(f.title_fa) + (f.note ? '<div class="muted">' + esc(f.note) + '</div>' : '') + '</td>'
              + '<td>' + fa(f.mcq_count) + ' تستی · ' + fa(f.free_count) + ' تشریحی</td>'
              + '<td>' + (f.mcq_draw ? fa(f.mcq_draw) : 'همه') + ' / ' + (f.free_draw ? fa(f.free_draw) : 'همه') + '</td>'
              + '<td>٪' + fa(f.pass_percent) + '</td>'
              + '<td>' + fa(f.max_attempts) + ' / ' + fa(f.retry_days) + ' روز</td>'
              + '<td>' + sup + '</td>'
              + '<td>' + (a.queued ? '<b>' + fa(a.queued) + ' در صف</b> · ' : '') + fa(a.passed || 0) + ' قبول · ' + fa(a.failed || 0) + ' رد' + (a.open ? ' · ' + fa(a.open) + ' باز' : '') + '</td>'
              + '<td><button type="button" data-ef-edit="' + esc(f.pathway_id) + '">ویرایش</button> '
              + '<button type="button" data-ef-del="' + esc(f.pathway_id) + '">حذف</button></td></tr>';
          }).join('') + '</table></div>';
      }).catch(function () { efList.textContent = 'فهرست نیامد.'; });
    }

    // What the parser read, once «بررسی متن» has confirmed it. Saving sends
    // THIS rather than the text, so what was reviewed is what is stored; any
    // edit to the box clears it and the review has to happen again.
    var parsed = null;
    var efPreview = document.getElementById('efPreview');
    var efCheck = document.getElementById('efCheck');
    document.getElementById('efQ').addEventListener('input', function () {
      parsed = null; efPreview.innerHTML = '';
    });

    function drawPreview(d) {
      var qs = d.questions || [];
      var rows = qs.map(function (q, i) {
        var body;
        if (q.kind === 'mcq') {
          body = '<ul style="margin:4px 0 0;padding-inline-start:1.3em">' + q.options.map(function (o, k) {
            return '<li>' + esc(o) + (k === q.correct ? ' <b>✓ درست</b>' : '') + '</li>';
          }).join('') + '</ul>';
        } else {
          body = '<div class="muted" style="margin-top:2px">نکته‌های کلیدی:</div><ul style="margin:2px 0 0;padding-inline-start:1.3em">'
            + q.key_points.map(function (kp) { return '<li>' + esc(kp.text) + '</li>'; }).join('') + '</ul>';
        }
        return '<div style="padding:8px 0;border-top:1px solid rgba(2,35,96,.08)">'
          + '<b>' + fa(i + 1) + '.</b> <span class="pill">' + (q.kind === 'mcq' ? 'تستی' : 'تشریحی') + '</span> '
          + esc(q.prompt_fa) + body + '</div>';
      }).join('');
      efPreview.innerHTML = '<div class="tk"><div class="tk-head"><b>' + fa(qs.length) + ' سؤال خوانده شد</b> — '
        + fa(d.mcq_count) + ' تستی، ' + fa(d.free_count) + ' تشریحی. اگر درست است «ذخیرهٔ فرم» را بزن.</div>'
        + rows + '</div>';
    }

    efCheck.addEventListener('click', function () {
      if (!val('efQ')) { efOut.textContent = 'اول سؤال‌ها را بچسبان.'; return; }
      efCheck.disabled = true; efOut.textContent = 'در حال خواندن…';
      post('/admin/exam-forms/parse', { questions: val('efQ') }).then(function (res) {
        efCheck.disabled = false;
        if (!res.ok) { parsed = null; efPreview.innerHTML = ''; efOut.textContent = 'خوانده نشد: ' + (res.j.message || 'خطا'); return; }
        parsed = res.j.questions;
        efOut.textContent = '';
        drawPreview(res.j);
      }).catch(function () { efCheck.disabled = false; efOut.textContent = 'ارسال نشد.'; });
    });

    efBtn.addEventListener('click', function () {
      var qs = parsed || val('efQ');
      if (!qs || (typeof qs === 'string' && !qs.trim())) { efOut.textContent = 'اول سؤال‌ها را بچسبان.'; return; }
      efBtn.disabled = true; efOut.textContent = 'در حال ذخیره…';
      post('/admin/exam-forms', {
        pathway_id: val('efPath'), questions: qs,
        mcq_draw: num('efMcq', 0), free_draw: num('efFree', 0), pass_percent: num('efPass', 70),
        max_attempts: num('efMax', 2), retry_days: num('efRetry', 7), supervised_until: num('efSup', 5),
        note: val('efNote') || undefined
      }).then(function (res) {
        efBtn.disabled = false;
        if (!res.ok) { efOut.textContent = 'نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
        var q = (res.j.form && res.j.form.questions) || [];
        var m = q.filter(function (x) { return x.kind === 'mcq'; }).length;
        efOut.textContent = (res.j.created ? 'ذخیره شد' : 'به‌روز شد') + ' — ' + fa(m) + ' تستی، ' + fa(q.length - m) + ' تشریحی.'
          + (res.j.notified ? ' به ' + fa(res.j.notified) + ' نفر که منتظر بودند خبر رفت.' : '');
        parsed = null; efPreview.innerHTML = '';
        loadForms();
      }).catch(function () { efBtn.disabled = false; efOut.textContent = 'ارسال نشد.'; });
    });

    efList.addEventListener('click', function (ev) {
      var e = ev.target.closest ? ev.target.closest('[data-ef-edit]') : null;
      if (e) {
        get('/admin/exam-forms/' + encodeURIComponent(e.getAttribute('data-ef-edit'))).then(function (d) {
          var f = d.form; if (!f) return;
          document.getElementById('efPath').value = f.pathway_id;
          document.getElementById('efQ').value = JSON.stringify(f.questions, null, 2);
          document.getElementById('efMcq').value = f.mcq_draw; document.getElementById('efFree').value = f.free_draw;
          document.getElementById('efPass').value = f.pass_percent; document.getElementById('efMax').value = f.max_attempts;
          document.getElementById('efRetry').value = f.retry_days; document.getElementById('efSup').value = f.supervised_until;
          document.getElementById('efNote').value = f.note || '';
          efOut.textContent = 'فرم «' + (titles[f.pathway_id] || f.pathway_id) + '» بارگذاری شد — ویرایش کن و ذخیره بزن.';
          document.getElementById('efQ').focus();
        });
        return;
      }
      var b = ev.target.closest ? ev.target.closest('[data-ef-del]') : null;
      if (!b) return;
      if (!confirm('فرم این مسیر حذف شود؟ تلاش‌ها و حکم‌های آن هم می‌روند (گواهی‌های صادرشده می‌مانند).')) return;
      b.disabled = true;
      post('/admin/exam-forms/delete', { pathway_id: b.getAttribute('data-ef-del') })
        .then(function () { efOut.textContent = 'حذف شد.'; loadForms(); loadQueue(); })
        .catch(function () { b.disabled = false; efOut.textContent = 'حذف نشد.'; });
    });

    /* ── سؤال‌ساز: two composers, growing rows, one question at a time ── */
    var MAX_ROWS = 6;
    var qbOpts = document.getElementById('qbOpts');
    var qbPoints = document.getElementById('qbPoints');
    var qbList = document.getElementById('qbList');
    var qbMcqOut = document.getElementById('qbMcqOut');
    var qbFreeOut = document.getElementById('qbFreeOut');

    // A row grows the list the moment the LAST one is written in, and nothing
    // is ever removed while typing: a box that empties again would take the
    // box after it with it, and with it whatever was typed there.
    function growRow(host, withRadio) {
      var i = host.children.length;
      var row = document.createElement('label');
      row.className = 'kp';
      var mark = '';
      if (withRadio) mark = '<input type="radio" name="qbCorrect" value="' + i + '">';
      row.innerHTML = mark + '<input type="text" data-qb="1" placeholder="'
        + (withRadio ? 'گزینهٔ ' : 'نکتهٔ ') + fa(i + 1) + '">';
      host.appendChild(row);
      row.querySelector('input[data-qb]').addEventListener('input', function () {
        var boxes = host.querySelectorAll('input[data-qb]');
        var last = boxes[boxes.length - 1];
        if (this === last && this.value.trim() && boxes.length < MAX_ROWS) growRow(host, withRadio);
      });
      return row;
    }
    function resetRows(host, withRadio, n) {
      host.innerHTML = '';
      for (var i = 0; i < n; i += 1) growRow(host, withRadio);
    }
    // Trailing empties are the founder stopping; an empty box BEFORE a filled
    // one is a mistake and is named, never quietly closed up — compacting
    // would move the correct answer to a different option.
    function readRows(host) {
      var vals = Array.prototype.map.call(host.querySelectorAll('input[data-qb]'), function (b) { return b.value.trim(); });
      while (vals.length && !vals[vals.length - 1]) vals.pop();
      for (var i = 0; i < vals.length; i += 1) if (!vals[i]) return { gap: i + 1 };
      return { vals: vals };
    }

    resetRows(qbOpts, true, 2);
    resetRows(qbPoints, false, 2);

    function addQuestion(question, out, done) {
      out.textContent = 'در حال افزودن…';
      post('/admin/exam-forms/questions', { pathway_id: val('efPath'), question: question })
        .then(function (res) {
          if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || 'خطا'); return; }
          out.textContent = 'اضافه شد — مخزن ' + fa(res.j.count) + ' سؤال دارد.';
          done();
          loadPool(); loadForms();
        }).catch(function () { out.textContent = 'ارسال نشد.'; });
    }

    document.getElementById('qbMcqAdd').addEventListener('click', function () {
      var stem = document.getElementById('qbMcqStem').value.trim();
      if (!stem) { qbMcqOut.textContent = 'صورت سؤال را بنویس.'; return; }
      var r = readRows(qbOpts);
      if (r.gap) { qbMcqOut.textContent = 'گزینهٔ ' + fa(r.gap) + ' خالی است.'; return; }
      if (r.vals.length < 2) { qbMcqOut.textContent = 'دست‌کم دو گزینه لازم است.'; return; }
      var picked = qbOpts.querySelector('input[name="qbCorrect"]:checked');
      if (!picked) { qbMcqOut.textContent = 'تیکِ گزینهٔ درست را بزن.'; return; }
      var correct = parseInt(picked.value, 10);
      if (correct >= r.vals.length) { qbMcqOut.textContent = 'گزینه‌ای که تیک خورده خالی است.'; return; }
      addQuestion({ kind: 'mcq', prompt_fa: stem, options: r.vals, correct: correct }, qbMcqOut, function () {
        document.getElementById('qbMcqStem').value = '';
        resetRows(qbOpts, true, 2);
      });
    });

    document.getElementById('qbFreeAdd').addEventListener('click', function () {
      var stem = document.getElementById('qbFreeStem').value.trim();
      if (!stem) { qbFreeOut.textContent = 'صورت سؤال را بنویس.'; return; }
      var r = readRows(qbPoints);
      if (r.gap) { qbFreeOut.textContent = 'نکتهٔ ' + fa(r.gap) + ' خالی است.'; return; }
      if (!r.vals.length) { qbFreeOut.textContent = 'دست‌کم یک نکتهٔ کلیدی لازم است.'; return; }
      addQuestion({ kind: 'free', prompt_fa: stem, key_points: r.vals }, qbFreeOut, function () {
        document.getElementById('qbFreeStem').value = '';
        resetRows(qbPoints, false, 2);
      });
    });

    // The pool of the pathway the picker is on — the answer to «برای کدام مسیر؟»
    function loadPool() {
      var id = val('efPath');
      document.getElementById('qbPath').textContent = titles[id] || id || '—';
      if (!id) { qbList.innerHTML = ''; return; }
      get('/admin/exam-forms/' + encodeURIComponent(id)).then(function (d) {
        var qs = (d.form && d.form.questions) || [];
        if (!qs.length) { qbList.innerHTML = '<div class="muted">مخزنِ این مسیر خالی است.</div>'; return; }
        qbList.innerHTML = '<div class="tk"><div class="tk-head"><b>مخزنِ ' + esc(titles[id] || id) + '</b> — '
          + fa(qs.length) + ' سؤال</div>' + qs.map(function (q, i) {
            var body;
            if (q.kind === 'mcq') {
              body = '<ul style="margin:4px 0 0;padding-inline-start:1.3em">' + q.options.map(function (o, k) {
                return '<li>' + esc(o) + (k === q.correct ? ' <b>✓</b>' : '') + '</li>';
              }).join('') + '</ul>';
            } else {
              body = '<ul style="margin:4px 0 0;padding-inline-start:1.3em">' + q.key_points.map(function (kp) {
                return '<li>' + esc(kp.text) + '</li>';
              }).join('') + '</ul>';
            }
            return '<div style="padding:8px 0;border-top:1px solid rgba(2,35,96,.08);font-size:.88rem">'
              + '<b>' + fa(i + 1) + '.</b> <span class="pill">' + (q.kind === 'mcq' ? 'تستی' : 'تشریحی') + '</span> '
              + esc(q.prompt_fa)
              + ' <button type="button" data-qb-del="' + esc(q.id) + '" style="float:left">حذف</button>'
              + body + '</div>';
          }).join('') + '</div>';
      }).catch(function () { qbList.innerHTML = '<div class="muted">مخزنِ این مسیر خالی است.</div>'; });
    }

    qbList.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-qb-del]') : null;
      if (!b) return;
      if (!confirm('این سؤال از مخزن حذف شود؟ آزمون‌هایی که همین حالا بازند دست‌نخورده می‌مانند.')) return;
      b.disabled = true;
      post('/admin/exam-forms/questions/delete', { pathway_id: val('efPath'), question_id: b.getAttribute('data-qb-del') })
        .then(function () { loadPool(); loadForms(); })
        .catch(function () { b.disabled = false; });
    });

    document.getElementById('efPath').addEventListener('change', loadPool);

    function loadAssign() {
      get('/admin/exams').then(function (d) {
        var rows = d.exams || [];
        if (!rows.length) { exList.innerHTML = '<div class="muted">واگذاریِ زودهنگامی ثبت نشده.</div>'; return; }
        exList.innerHTML = '<div class="tblwrap"><table><tr><th>کاربر</th><th>مسیر</th><th>یادداشت</th><th>تاریخ</th><th></th></tr>'
          + rows.map(function (e) {
            return '<tr><td>' + esc(e.display_name) + '</td><td>' + esc(titles[e.pathway_id] || e.pathway_id)
              + (e.has_form ? '' : ' <span class="pill">بی‌فرم!</span>') + '</td><td>' + esc(e.note || '') + '</td><td>' + when(e.created_at)
              + '</td><td><button type="button" data-ex-del="' + esc(e.id) + '">حذف</button></td></tr>';
          }).join('') + '</table></div>';
      }).catch(function () { exList.textContent = 'فهرست نیامد.'; });
    }

    exBtn.addEventListener('click', function () {
      if (!val('exUser')) { exOut.textContent = 'کاربر را بنویس.'; return; }
      exBtn.disabled = true; exOut.textContent = 'در حال ثبت…';
      post('/admin/exams', { user: val('exUser'), pathway_id: val('exPath'), note: val('exNote') || undefined })
        .then(function (res) {
          exBtn.disabled = false;
          if (!res.ok) { exOut.textContent = 'نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
          exOut.textContent = (res.j.created ? 'راه داده شد' : 'از قبل راه داشت') + ' — ' + (res.j.user && res.j.user.display_name || '')
            + (res.j.has_form ? '' : ' — این مسیر هنوز فرم ندارد؛ تا فرم نسازی آزمونی نمی‌بیند.');
          loadAssign();
        }).catch(function () { exBtn.disabled = false; exOut.textContent = 'ارسال نشد.'; });
    });

    exList.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-ex-del]') : null;
      if (!b) return;
      if (!confirm('این واگذاری حذف شود؟')) return;
      b.disabled = true;
      post('/admin/exams/delete', { id: b.getAttribute('data-ex-del') })
        .then(function () { exOut.textContent = 'حذف شد.'; loadAssign(); })
        .catch(function () { b.disabled = false; exOut.textContent = 'حذف نشد.'; });
    });

    function tallyPill(t) {
      if (!t) return '<span class="pill">مدل مطمئن نبود</span>';
      return '<span class="pill">حکم مدل: ' + (t.passed ? 'قبول' : 'رد') + '</span>';
    }
    function scoreLine(r) {
      var parts = [];
      if (r.mcq_total) parts.push('تستی ' + fa(r.mcq_correct) + ' از ' + fa(r.mcq_total));
      if (r.free_total) parts.push('تشریحی ' + fa(r.free_covered) + ' نکته از ' + fa(r.free_total));
      return parts.join(' · ');
    }

    function work(row) {
      var answers = row.answers || {};
      var verdict = row.verdict || [];
      var html = '';
      var mcq = row.questions.filter(function (q) { return q.kind === 'mcq'; });
      if (mcq.length) {
        var right = 0;
        var items = mcq.map(function (q) {
          var chosen = answers[q.id];
          var ok = chosen === q.correct; if (ok) right += 1;
          return '<li>' + (ok ? '✅' : '❌') + ' ' + esc(q.prompt_fa) + ' <span class="muted">— انتخاب: '
            + esc(q.options[chosen] == null ? '—' : q.options[chosen]) + (ok ? '' : ' · درست: ' + esc(q.options[q.correct])) + '</span></li>';
        }).join('');
        html += '<div><b>تستی: ' + fa(right) + ' از ' + fa(mcq.length) + '</b><ul style="margin:6px 0 10px">' + items + '</ul></div>';
      }
      row.questions.filter(function (q) { return q.kind === 'free'; }).forEach(function (q) {
        var v = null;
        for (var i = 0; i < verdict.length; i += 1) if (verdict[i].id === q.id) v = verdict[i];
        var checks = q.key_points.map(function (kp) {
          var st = null;
          if (v && v.points) for (var k = 0; k < v.points.length; k += 1) if (v.points[k].id === kp.id) st = v.points[k].state;
          var checked = st === 'covered' ? ' checked' : '';
          return '<label style="display:block"><input type="checkbox" data-q="' + esc(q.id) + '" data-kp="' + esc(kp.id) + '"' + checked + '> ' + esc(kp.text)
            + (st ? '' : ' <span class="muted">(مدل تصمیم نگرفت)</span>') + '</label>';
        }).join('');
        html += '<div style="margin-top:10px"><b>' + esc(q.prompt_fa) + '</b>'
          + '<div style="white-space:pre-wrap;border:1px solid #ddd;border-radius:8px;padding:8px;margin:6px 0">' + esc(answers[q.id] || '') + '</div>'
          + '<div class="muted">نکته‌های پوشش‌داده‌شده را تیک بزن:</div>' + checks + '</div>';
      });
      html += '<div class="row" style="margin-top:10px;align-items:flex-end">'
        + '<div style="flex:1 1 220px"><label>نامِ روی گواهی</label><input type="text" data-holder maxlength="120" value="' + esc(row.holder_name || '') + '"></div>'
        + '<button type="button" data-act="pass">قبول + صدور گواهی</button>'
        + '<button type="button" data-act="fail">رد</button>'
        + '<button type="button" data-act="void">باطل (تلاش حساب نشود)</button>'
        + '</div><div class="ds-msg muted"></div>';
      return html;
    }

    function loadQueue() {
      get('/admin/exam-attempts').then(function (d) {
        var q = d.queue || [];
        waiting.textContent = q.length ? fa(q.length) + ' منتظر' : '';
        if (!q.length) exqList.innerHTML = '<div class="muted">چیزی در صف نیست.</div>';
        else exqList.innerHTML = q.map(function (row) {
          return '<div class="tk" data-id="' + esc(row.id) + '">'
            + '<div class="tk-head"><b dir="ltr">' + esc(row.reference) + '</b> · ' + esc(row.display_name || row.phone || '')
            + ' · ' + esc(row.title_fa) + ' · تلاش ' + fa(row.attempt_no) + ' · ' + when(row.submitted_at) + ' ' + tallyPill(row.ai_tally)
            + ' <span class="muted">(حکم‌های تو روی این فرم: ' + fa(row.rulings) + ' از ' + fa(row.supervised_until) + ')</span></div>'
            + '<div class="tk-body"></div></div>';
        }).join('');
        window.__exq = {}; q.forEach(function (row) { window.__exq[row.id] = row; });

        var rows = d.attempts || [];
        if (!rows.length) { exrList.innerHTML = '<div class="muted">هنوز کسی آزمون نداده.</div>'; return; }
        exrList.innerHTML = '<div class="tblwrap"><table><tr><th>ارجاع</th><th>کاربر</th><th>مسیر</th><th>تلاش</th><th>وضعیت</th><th>نمره</th><th>تاریخ</th></tr>'
          + rows.map(function (r) {
            return '<tr><td dir="ltr">' + esc(r.reference) + '</td><td>' + esc(r.display_name || r.phone || '') + '</td><td>' + esc(r.title_fa)
              + '</td><td>' + fa(r.attempt_no) + '</td><td>' + (STATUS[r.status] || r.status) + (r.settled_by ? ' <span class="muted">(' + (r.settled_by === 'ai' ? 'مدل' : 'تو') + ')</span>' : '')
              + '</td><td>' + scoreLine(r) + '</td><td>' + when(r.submitted_at || r.created_at) + '</td></tr>';
          }).join('') + '</table></div>';
      }).catch(function () { exqList.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    exqList.addEventListener('click', function (ev) {
      var act = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (act) {
        var wrap = act.closest('.tk'), body = act.closest('.tk-body');
        var id = wrap.getAttribute('data-id'), msg = body.querySelector('.ds-msg');
        var decision = act.getAttribute('data-act');
        var row = window.__exq[id];
        if (decision === 'void' && !confirm('این تلاش باطل شود؟ در شمار تلاش‌ها نمی‌آید و خواننده می‌تواند دوباره شروع کند.')) return;
        if (decision === 'pass' && !confirm('قبول شود و گواهی به نام «' + body.querySelector('[data-holder]').value.trim() + '» صادر شود؟ نام بعداً قابل تغییر نیست.')) return;
        var free = [];
        (row.questions || []).filter(function (q) { return q.kind === 'free'; }).forEach(function (q) {
          free.push({ id: q.id, points: q.key_points.map(function (kp) {
            var cb = body.querySelector('[data-q="' + q.id + '"][data-kp="' + kp.id + '"]');
            return { id: kp.id, state: cb && cb.checked ? 'covered' : 'missing' };
          }) });
        });
        msg.textContent = 'در حال ثبت…';
        post('/admin/exam-attempts/' + id + '/rule', {
          decision: decision, free: decision === 'void' ? undefined : free,
          holder_name: body.querySelector('[data-holder]').value.trim() || undefined
        }).then(function (res) {
          if (!res.ok) { msg.textContent = res.j.message || res.j.error || 'نشد.'; return; }
          msg.textContent = decision === 'void' ? 'باطل شد.' : (decision === 'pass' ? 'قبول شد؛ گواهی صادر و به کاربر خبر داده شد.' : 'رد شد و به کاربر خبر داده شد.');
          setTimeout(function () { loadQueue(); if (typeof loadCerts === 'function') loadCerts(); }, 900);
        }).catch(function () { msg.textContent = 'ارسال نشد.'; });
        return;
      }
      var wrap2 = ev.target.closest ? ev.target.closest('.tk') : null;
      if (!wrap2) return;
      if (ev.target.closest && ev.target.closest('.tk-body')) return;
      var box = wrap2.querySelector('.tk-body');
      if (box.innerHTML) { box.innerHTML = ''; return; }
      box.innerHTML = work(window.__exq[wrap2.getAttribute('data-id')]);
    });
  })();
  </script>

  <h3 style="margin-top:26px">گواهی</h3>
  <div class="muted">
    گواهی معمولاً با قبولی در آزمون خودش صادر می‌شود؛ این‌جا برای صدور دستی است (یک خوانندهٔ بنیان‌گذار، یک
    پایلوت). کد یکتای <span dir="ltr">DC-XXX-XXX</span> می‌گیرد، صفحهٔ تأییدِ عمومی دارد، و ٪۱۰ تخفیف (یک خرید،
    کامل) همان لحظه برای خواننده نوشته می‌شود. نامِ روی گواهی همان‌جا قفل می‌شود — نه نامِ مستعار. گواهی هرگز حذف
    نمی‌شود، فقط باطل می‌شود (کدش شاید روی لینکدین کسی باشد).
  </div>

  <h4 style="margin-top:14px">گواهی صادر کن</h4>
  <form class="bc" id="ceForm" onsubmit="return false">
    <div class="row">
      <div style="flex:1 1 200px"><label for="ceUser">کاربر</label>
        <input id="ceUser" type="text" placeholder="0912…"></div>
      <div style="flex:1 1 220px"><label for="cePath">مسیر</label><select id="cePath"></select></div>
    </div>
    <div class="row">
      <div style="flex:1 1 260px"><label for="ceName">نامِ روی گواهی (همان‌طور که چاپ می‌شود)</label>
        <input id="ceName" type="text" maxlength="120" placeholder="دکتر …"></div>
      <div style="flex:0 0 120px"><label for="cePct">تخفیف ٪</label>
        <input id="cePct" type="number" min="0" max="100" value="10"></div>
    </div>
    <button id="ceSend" type="button">صدور گواهی</button>
    <span id="ceOut" class="muted"></span>
  </form>
  <div id="ceList"></div>
  <script>
  (function () {
    var ceList = document.getElementById('ceList'), ceOut = document.getElementById('ceOut');
    var ceBtn = document.getElementById('ceSend');
    if (!ceList) return;
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function val(id) { return document.getElementById(id).value.trim(); }
    function when(iso) {
      try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso)); }
      catch (e) { return ''; }
    }
    function post(url, body) {
      return fetch(url, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
    }
    var titles = {};
    fetch('/admin/pathways/catalog', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (d) { (d.pathways || []).forEach(function (p) { titles[p.id] = p.title_fa; }); loadCerts(); })
      .catch(function () {});

    function loadCerts() {
      fetch('/admin/certificates', { credentials: 'include', cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var rows = d.certificates || [];
          if (!rows.length) { ceList.innerHTML = '<div class="muted">گواهی‌ای صادر نشده.</div>'; return; }
          ceList.innerHTML = '<div class="tblwrap"><table><tr><th>کد</th><th>نامِ روی گواهی</th><th>کاربر</th>'
            + '<th>مسیر</th><th>از راه</th><th>تاریخ</th><th></th></tr>'
            + rows.map(function (c) {
              var state = c.revoked_at ? '<span class="pill">باطل</span>' : '';
              return '<tr><td dir="ltr"><a href="/plus/certificate.html?c=' + esc(c.verify_code)
                + '" target="_blank" rel="noopener">' + esc(c.verify_code) + '</a> ' + state + '</td><td>'
                + esc(c.holder_name) + '</td><td>' + esc(c.display_name) + '</td><td>'
                + esc(titles[c.pathway_id] || c.pathway_id) + '</td><td>' + (c.attempt_id ? 'آزمون' : 'دستی') + '</td><td>' + when(c.issued_at) + '</td><td>'
                + (c.revoked_at ? '' : '<button type="button" data-ce-rev="' + esc(c.id) + '">ابطال</button>')
                + '</td></tr>';
            }).join('') + '</table></div>';
        }).catch(function () { ceList.textContent = 'فهرست نیامد.'; });
    }
    window.loadCerts = loadCerts;

    ceBtn.addEventListener('click', function () {
      if (!val('ceUser')) { ceOut.textContent = 'کاربر را بنویس.'; return; }
      if (!val('ceName')) { ceOut.textContent = 'نامِ روی گواهی را بنویس.'; return; }
      if (!confirm('گواهی «' + (titles[val('cePath')] || val('cePath')) + '» به نام «' + val('ceName')
        + '» صادر شود؟ نام بعداً قابل تغییر نیست.')) return;
      ceBtn.disabled = true; ceOut.textContent = 'در حال صدور…';
      post('/admin/certificates/issue', {
        user: val('ceUser'), pathway_id: val('cePath'), holder_name: val('ceName'),
        discount_percent: parseInt(val('cePct') || '10', 10)
      }).then(function (res) {
        ceBtn.disabled = false;
        if (!res.ok) { ceOut.textContent = 'نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
        var c = res.j.certificate || {};
        ceOut.textContent = (res.j.created ? 'صادر شد — کد ' : 'از قبل داشت — کد ') + (c.verify_code || '');
        loadCerts();
      }).catch(function () { ceBtn.disabled = false; ceOut.textContent = 'ارسال نشد.'; });
    });

    ceList.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-ce-rev]') : null;
      if (!b) return;
      if (!confirm('این گواهی باطل شود؟ ردیف می‌ماند و صفحهٔ تأیید «باطل» را نشان می‌دهد.')) return;
      b.disabled = true;
      post('/admin/certificates/revoke', { id: b.getAttribute('data-ce-rev') })
        .then(function () { ceOut.textContent = 'باطل شد.'; loadCerts(); })
        .catch(function () { b.disabled = false; ceOut.textContent = 'باطل نشد.'; });
    });
  })();
  </script>

  <h3 style="margin-top:26px">تعطیلی مطب</h3>
  <div class="muted">
    کارتِ تماس (<span dir="ltr">dentcast.ir/card/</span>) باز یا بسته بودن مطب را خودش از ساعت کاری حساب
    می‌کند — و وسط تعطیلی همین باعث می‌شود به مراجع بگوید فردا ساعت ۱۲:۳۰ باز می‌شود. روزهای تعطیل را
    این‌جا بنویس تا به‌جای آن، خبر تعطیلی بنشیند.
    <br>
    <b>اگر این‌جا چیزی نباشد، همان روال عادی است.</b> ردیف هم که تمام شد خودش از کار می‌افتد —
    پاک کردنش لازم نیست. تاریخ‌ها شمسی‌اند و هر دو سرِ بازه، تعطیل حساب می‌شوند.
  </div>
  <form class="bc" id="clForm" onsubmit="return false">
    <div class="row">
      <div style="flex:1 1 160px"><label for="clFrom">از تاریخ</label>
        <input id="clFrom" type="text" inputmode="numeric" placeholder="۱۴۰۵/۰۶/۰۹"></div>
      <div style="flex:1 1 160px"><label for="clTo">تا تاریخ (خالی = همان یک روز)</label>
        <input id="clTo" type="text" inputmode="numeric" placeholder="۱۴۰۵/۰۶/۱۳"></div>
    </div>
    <div><label for="clNote">متنِ دلخواه روی کارت (اختیاری)</label>
      <input id="clNote" type="text" maxlength="120" placeholder="خالی بگذار تا خودش بنویسد: مطب تعطیل است · شنبه ۱۴ شهریور ساعت ۱۲:۳۰ باز می‌شود"></div>
    <button id="clSend" type="button">ثبت تعطیلی</button>
    <div id="clOut"></div>
  </form>
  <div id="clList"></div>
  <script>
  (function () {
    var box = document.getElementById('clList');
    var out = document.getElementById('clOut');
    var btn = document.getElementById('clSend');
    if (!box || !btn) return;
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function val(id) { return document.getElementById(id).value.trim(); }

    // The first line is the point of the whole section: what the card is saying
    // RIGHT NOW. A list of dates alone leaves the founder converting calendars
    // in their head to answer the only question they came here with.
    function render(d) {
      var head = '<div class="muted" style="margin-top:10px">الان روی کارت: <b>'
        + (d.status.closed ? esc(d.status.text) : 'روال عادی — باز/بسته از روی ساعت کاری')
        + '</b></div>';
      var rows = d.closures || [];
      if (!rows.length) {
        box.innerHTML = head + '<div class="muted">هیچ تعطیلی‌ای ثبت نشده.</div>';
        return;
      }
      var body = rows.map(function (r) {
        var state = r.state === 'active' ? '<span class="pill hot">همین حالا</span>'
          : (r.state === 'upcoming' ? '<span class="pill">پیشِ رو</span>' : '<span class="pill">گذشته</span>');
        var span = esc(r.starts_fa) + (r.ends_on === r.starts_on ? '' : ' تا ' + esc(r.ends_fa));
        return '<tr><td>' + state + '</td><td>' + span + '</td><td>' + esc(r.text) + '</td><td>'
          + esc(r.back_fa) + '</td><td><button type="button" data-cl-del="' + esc(r.id)
          + '">حذف</button></td></tr>';
      }).join('');
      box.innerHTML = head + '<div class="tblwrap"><table><tr><th>وضعیت</th><th>بازه</th>'
        + '<th>متنِ روی کارت</th><th>بازگشت</th><th></th></tr>' + body + '</table></div>';
    }

    function load() {
      fetch('/admin/clinic', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(render)
        .catch(function () { box.textContent = 'فهرست نیامد.'; });
    }

    btn.addEventListener('click', function () {
      if (!val('clFrom')) { out.textContent = 'تاریخ شروع را بنویس.'; return; }
      btn.disabled = true; out.textContent = 'در حال ثبت…';
      fetch('/admin/clinic', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: val('clFrom'),
          to: val('clTo') || undefined,
          note: val('clNote') || undefined
        })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || res.j.error || 'خطا'); return; }
          out.textContent = 'ثبت شد — ' + res.j.summary;
          document.getElementById('clFrom').value = '';
          document.getElementById('clTo').value = '';
          document.getElementById('clNote').value = '';
          load();
        })
        .catch(function () { btn.disabled = false; out.textContent = 'ارسال نشد.'; });
    });

    box.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-cl-del]') : null;
      if (!b) return;
      if (!confirm('این تعطیلی حذف شود؟ کارت برمی‌گردد به روال عادی.')) return;
      b.disabled = true;
      fetch('/admin/clinic/delete', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: b.getAttribute('data-cl-del') })
      }).then(function () { out.textContent = 'حذف شد.'; load(); })
        .catch(function () { b.disabled = false; out.textContent = 'حذف نشد.'; });
    });

    load();
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
  <div class="muted">
    <b>این‌ها واریز نیستند — درخواست‌اند.</b> ردیف همان لحظه‌ای ساخته می‌شود که خریدار «دریافت کد پیگیری»
    را می‌زند، یعنی <b>قبل از</b> جابه‌جایی پول. پس «پولی نیامده» حالتِ عادیِ هر ردیفِ تازه است.
    <br>
    <b>ردیفِ معمولی هیچ کاری با تو ندارد تا وقتی پول برسد.</b> مبلغش قیمتِ لیست است — همان که درگاه هم
    می‌گیرد — و صفحه‌ی خریدار از همان اول به او گفته واریز کند. تو فقط وقتی پول در صورت‌حساب نشست
    «<b>تأیید (پول رسید)</b>» را می‌زنی و اشتراک فعال می‌شود.
    <br>
    <b>فقط ردیفِ «دانشجو» منتظرِ توست.</b> او تیکِ تخفیف را زده، هنوز واریز نکرده، و صفحه‌اش می‌گوید
    منتظرِ عدد بماند. کارت دانشجویی‌اش را که دیدی: «مبلغ دانشجویی» را بزن تا فیلد پر شود، بعد
    «<b>تأیید مبلغ</b>» — این برایش اطلاعیه و پیام می‌فرستد و تازه آن‌وقت واریز می‌کند. (اگر عددِ روی
    ردیف را قبول داری، فیلد را خالی بگذار و همان دکمه را بزن.)
    <br>
    نشان هیچ نقشی در تخفیف یا فعال‌سازی ندارد — «تأیید» به‌تنهایی اشتراک را فعال می‌کند،
    و «تأیید + یادگاریِ دانشجو» فقط همان کار را می‌کند به‌علاوه‌ی یک کاشیِ تزئینی روی دیوار افتخارات.
  </div>
  <div id="btList"></div>
  <script>
  (function () {
    var list = document.getElementById('btList');
    if (!list) return;
    // The announced terms, from config — so retuning ٪۱۵ stays a config change
    // rather than an edit to arithmetic buried in this page.
    var STUDENT = ${JSON.stringify(student)};

    // What the founder was told after their last press, kept ACROSS the reload
    // that press triggers. Without it every action wiped its own confirmation:
    // the list re-rendered, the field cleared, the message vanished, and a
    // «تأیید مبلغ» on an unchanged figure left a row that looked exactly like
    // one nothing had been done to.
    var FLASH = {};

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
    // Persian/Arabic digits -> ASCII. The founder types on a Persian keyboard
    // and pastes from a Persian page; parseInt('۳۳۰۰۰۰۰') is NaN, which read on
    // screen as «مبلغ معتبر نیست» for a number that was perfectly valid.
    function ascii(s) {
      return String(s == null ? '' : s)
        .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
        .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
    }
    // A toman figure out of whatever a human typed, or null.
    //
    // Everything that is not a digit is dropped, and that is the important
    // half: parseInt('3,300,000') is 3, so a copy-pasted separated amount used
    // to sail through the «> 0» check and silently announce THREE TOMAN to a
    // buyer, with a success message and a row that looked fine.
    function parseToman(raw) {
      var s = ascii(raw).replace(/[^0-9]/g, '');
      if (!s) return null;
      var n = parseInt(s, 10);
      return n > 0 ? n : null;
    }
    function faToman(n) {
      return Number(n).toLocaleString('en-US') + ' تومان';
    }
    function who(r) {
      return esc(r.display_name || r.phone || r.username || r.user_id);
    }

    // The student price for a term, in TOMAN (the unit the field takes), or
    // null where the rule does not apply. Floored, so a ragged number always
    // rounds toward the customer rather than asking them for a toman more
    // than the announced discount implies.
    function studentToman(months) {
      if (!STUDENT.percent || months !== STUDENT.months) return null;
      var listRial = STUDENT.prices[months];
      if (!listRial) return null;
      return Math.floor((listRial * (100 - STUDENT.percent) / 100) / 10);
    }

    // Whether this row is waiting on a HUMAN. Only a student's is: an ordinary
    // claim's amount is the list price and was never in question, so marking it
    // «waiting for you» would bury the one row that actually is.
    function needsMe(r) { return r.student_request && !r.amount_confirmed_at; }

    // The queue's own state, and the reason the panel needed one: «تأیید» and
    // «تأیید مبلغ» are two different acts a day apart, and a row that looked
    // identical before and after the first one left the founder unable to tell
    // whether they had done it.
    function stage(r) {
      if (r.amount_confirmed_at) {
        return '<span class="pill ok">مبلغ اعلام شد · ' + when(r.amount_confirmed_at) + '</span>';
      }
      return r.student_request
        ? '<span class="pill hot">دانشجو · منتظر اعلامِ مبلغ</span>'
        : '<span class="pill">منتظر واریز</span>';
    }

    function row(r) {
      var stu = studentToman(r.months);
      var cur = r.amount_rial == null ? '' : Math.round(r.amount_rial / 10);
      return '<div class="tk' + (needsMe(r) ? ' need' : '') + '" data-ref="' + esc(r.reference)
        + '" data-toman="' + cur + '" style="cursor:auto">'
        + '<div class="tk-h"><b>' + esc(r.reference) + '</b>'
        + '<span class="pill">' + r.months + ' ماهه</span>'
        + '<span class="pill">' + toman(r.amount_rial) + '</span>'
        + stage(r)
        + '</div>'
        + '<div class="muted">' + who(r) + ' · ' + when(r.created_at) + '</div>'
        + '<div class="bt-actions">'
        + '<input type="text" class="btAmount" inputmode="numeric" placeholder="مبلغ تازه (تومان) — خالی یعنی همین عدد">'
        // Fills the field, never submits: the founder still reads the number
        // and presses «تأیید مبلغ», so the amount stays theirs to announce.
        + (stu
           ? '<button type="button" data-act="student-amount" data-toman="' + stu + '">'
             + 'مبلغ دانشجویی (٪' + STUDENT.percent + ')</button>'
           : '')
        + '<button type="button" data-act="set-amount">تأیید مبلغ</button>'
        + '<button type="button" data-act="approve">تأیید (پول رسید)</button>'
        // The badge grants NOTHING — months come from «تأیید» either way. The
        // label says «یادگاری» so this never reads as the button that applies
        // the discount; the discount is the amount above, and only that.
        + '<button type="button" class="gold" data-act="approve-badge">تأیید + یادگاریِ دانشجو</button>'
        + '<button type="button" class="danger" data-act="reject">رد</button>'
        + '</div>'
        // Survives the reload that follows every action — see FLASH.
        + '<div class="bt-out muted">' + esc(FLASH[r.reference] || '') + '</div>'
        + '</div>';
    }

    function render(rows) {
      if (!rows.length) { list.innerHTML = '<div class="muted">صف خالی است.</div>'; return; }
      // Whoever is waiting on a person comes first; the sort is stable, so
      // oldest-first still holds inside each group.
      var ordered = rows.slice().sort(function (a, b) {
        return (needsMe(b) ? 1 : 0) - (needsMe(a) ? 1 : 0);
      });
      list.innerHTML = ordered.map(row).join('');
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

      if (act === 'student-amount') {
        wrap.querySelector('.btAmount').value = ev.target.getAttribute('data-toman');
        out.textContent = 'مبلغ دانشجویی پر شد — «تأیید مبلغ» را بزن تا به خریدار اعلام شود.';
        return;
      }

      // «تأیید مبلغ» — the announcement, not the activation. An empty field
      // means «the figure on the row is right»: that is the ordinary case (the
      // claim opened at the list price) and having no way to say it is what
      // deadlocked this rail. A filled field announces a different figure.
      //
      // The number is read back to the founder before it goes out, because the
      // buyer is told to transfer exactly it and nothing downstream checks it
      // against anything.
      if (act === 'set-amount') {
        var typed = parseToman(wrap.querySelector('.btAmount').value);
        var current = parseToman(wrap.getAttribute('data-toman'));
        var raw = wrap.querySelector('.btAmount').value.trim();
        if (raw && typed === null) { out.textContent = 'مبلغ معتبر نیست — فقط عدد بنویس.'; return; }
        var announced = typed === null ? current : typed;
        if (announced === null) { out.textContent = 'این ردیف مبلغی ندارد؛ عدد را بنویس.'; return; }
        if (!confirm('به خریدار اعلام شود: ' + faToman(announced) + '؟\\n'
          + 'برایش اطلاعیه و پیام می‌رود که همین مبلغ را واریز کند. (اشتراک فعال نمی‌شود.)')) return;
        out.textContent = 'در حال اعلام…';
        fetch('/admin/bank-transfer/amount', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          // Omitted when nothing was typed: the server then keeps the figure
          // it already has and only stamps it confirmed.
          body: JSON.stringify(typed === null
            ? { reference: ref }
            : { reference: ref, amount_rial: typed * 10 })
        }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!res.ok) { out.textContent = 'نشد: ' + (res.j.message || res.j.error); return; }
            FLASH[ref] = faToman(announced) + ' به خریدار اعلام شد. حالا منتظر واریز بمان، بعد «تأیید».';
            load();
          })
          .catch(function () { out.textContent = 'اعلام نشد.'; });
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
        if (!confirm('پول ' + ref + ' را در صورت‌حساب دیدی؟\\n'
          + 'با تأیید، اشتراک فعال می‌شود — این دکمه پول نمی‌گیرد.')) return;
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
  <div class="muted">فقط تیکت‌های بی‌جواب بالا می‌آیند؛ از جواب‌داده‌شده‌ها ابتدا ۱۵ تا، بقیه با «نمایش بیشتر» ده‌تا ده‌تا. برای کارت دانشجویی، کد پیگیری را از پیام بله/تلگرام این‌جا جست‌وجو کن.</div>
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

    var ANSWERED_FIRST = 15;
    var ANSWERED_MORE = 10;
    var answeredOffset = 0;
    var answeredTotal = 0;

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
        + (t.has_public_message ? '<span class="pill hot">عمومی</span>' : '')
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

    function moreBtn(hasMore) {
      if (!hasMore) return '';
      var left = Math.max(0, answeredTotal - answeredOffset);
      return '<div id="tkMoreWrap" style="margin:12px 0 4px">'
        + '<button type="button" id="tkMore">نمایش بیشتر'
        + (left ? ' (' + left + ' مانده)' : '')
        + '</button></div>';
    }

    function paint(waitingTickets, answeredTickets, hasMore, append) {
      var waitingHtml = (waitingTickets || []).map(card).join('');
      var answeredHtml = (answeredTickets || []).map(card).join('');
      if (append) {
        var wrap = document.getElementById('tkMoreWrap');
        var host = document.getElementById('tkAnswered');
        if (!host) {
          host = document.createElement('div');
          host.id = 'tkAnswered';
          list.appendChild(host);
        }
        host.insertAdjacentHTML('beforeend', answeredHtml);
        if (wrap) wrap.outerHTML = moreBtn(hasMore);
        else if (hasMore) list.insertAdjacentHTML('beforeend', moreBtn(true));
        return;
      }
      if (!waitingHtml && !answeredHtml) {
        list.innerHTML = '<div class="muted">چیزی این‌جا نیست.</div>';
        return;
      }
      var parts = [];
      if (waitingHtml) {
        parts.push('<div class="muted" style="margin:8px 0 4px">بی‌جواب</div>' + waitingHtml);
      }
      if (answeredHtml || hasMore) {
        parts.push('<div class="muted" style="margin:16px 0 4px">جواب‌داده‌شده'
          + (answeredTotal ? ' · ' + answeredTotal : '') + '</div>'
          + '<div id="tkAnswered">' + answeredHtml + '</div>'
          + moreBtn(hasMore));
      }
      list.innerHTML = parts.join('');
    }

    function render(tickets) {
      paint([], tickets || [], false, false);
    }

    function load(opts) {
      opts = opts || {};
      var append = !!opts.append;
      if (!append) {
        answeredOffset = 0;
        list.innerHTML = '<div class="muted">در حال خواندن…</div>';
      }
      var limit = append ? ANSWERED_MORE : ANSWERED_FIRST;
      var url = '/admin/support?status=' + encodeURIComponent(document.getElementById('tkStatus').value)
        + '&answered_limit=' + limit
        + '&answered_offset=' + answeredOffset;
      fetch(url, { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          answeredTotal = j.answered_total || 0;
          var batch = j.answered || [];
          answeredOffset = (j.answered_offset || 0) + batch.length;
          if (!append) {
            waiting.textContent = j.waiting ? j.waiting + ' منتظر پاسخ' : '';
          }
          paint(append ? [] : (j.waiting_tickets || []), batch, !!j.answered_has_more, append);
        })
        .catch(function () {
          if (!append) list.innerHTML = '<div class="muted">خوانده نشد.</div>';
        });
    }

    function thread(box, id) {
      box.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/support/' + id, { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) { box.innerHTML = '<div class="muted">پیدا نشد.</div>'; return; }
          // Only an article thread has a page to appear on, so only it gets a
          // switch — and it is now PER MESSAGE, not one for the whole thread:
          // the founder's reply and the reader's own line are two decisions,
          // never one (0048 — a thread-level switch published a private aside
          // in the same motion as the reply it was meant to expose).
          var isArticle = !!j.ticket.content_id;
          var msgs = (j.messages || []).map(function (m) {
            var pub = isArticle
              ? '<button type="button" class="pubbtn" data-msg-id="' + esc(m.id) + '" data-act="'
                + (m.is_public ? 'unpublish">خصوصی کن (الان عمومی است)' : 'publish">عمومی کن')
                + '</button>'
              : '';
            return '<div class="msg ' + (m.author === 'founder' ? 'me' : 'them') + '">'
              + '<div class="muted">' + (m.author === 'founder' ? 'تو' : 'کاربر') + ' · ' + when(m.created_at)
              + (m.is_public ? ' · <b>عمومی</b>' : '') + '</div>'
              + esc(m.body).replace(/\\n/g, '<br>')
              + (pub ? '<div class="row">' + pub + '</div>' : '')
              + '</div>';
          }).join('');
          var closed = j.ticket.status === 'closed';
          box.innerHTML = '<div class="thread">' + msgs + '</div>'
            + (closed
              ? '<button type="button" data-act="reopen">بازکردن دوباره</button>'
              : '<textarea class="reply" placeholder="پاسخ…"></textarea>'
                + '<div class="row"><button type="button" data-act="reply">ارسال پاسخ</button>'
                + '<button type="button" data-act="reply-close">ارسال و بستن</button>'
                + '<button type="button" data-act="close">فقط بستن</button></div>')
            + '<div class="tk-out muted"></div>';
        })
        .catch(function () { box.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    list.addEventListener('click', function (ev) {
      if (ev.target && (ev.target.id === 'tkMore' || (ev.target.closest && ev.target.closest('#tkMore')))) {
        load({ append: true });
        return;
      }
      // closest(), not getAttribute() on the target itself: a click can land on
      // a node INSIDE a button, and reading only the target would miss the
      // action and fall through to the toggle below.
      var hit = ev.target.closest ? ev.target.closest('[data-act]') : null;
      var act = hit ? hit.getAttribute('data-act') : null;
      var wrap = ev.target.closest ? ev.target.closest('.tk') : null;
      if (!wrap) return;
      var id = wrap.getAttribute('data-id');
      var box = wrap.querySelector('.tk-body');

      if (!act) { // a tap on the CARD toggles the thread open
        // ...but never a tap INSIDE the open thread. There a click is the
        // founder reaching for the reply box, or selecting a line the reader
        // wrote — and emptying the body would take a half-typed answer with it.
        if (ev.target.closest && ev.target.closest('.tk-body')) return;
        if (box.innerHTML) { box.innerHTML = ''; return; }
        thread(box, id);
        return;
      }

      var o = box.querySelector('.tk-out');
      if (act === 'publish' || act === 'unpublish') {
        var going = act === 'publish';
        var msgId = hit.getAttribute('data-msg-id');
        if (going && !confirm('این پیام زیر همان مطلب برای همه دیده می‌شود؛ بقیه‌ی پیام‌های این گفت‌وگو خصوصی می‌مانند. به نویسنده‌اش خبر می‌رسد. مطمئنی؟')) return;
        fetch('/admin/support/messages/' + msgId + '/publish', {
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
            has_public_message: res.j.messages.some(function (m) { return m.is_public; }),
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

  <h3 style="margin-top:26px">ارزیاب DES <span id="dsWaiting" class="pill"></span></h3>
  <div class="muted">مقاله‌هایی که خواننده‌ها فرستاده‌اند. قدیمی‌ترین بالاتر. برای ارسال‌های PDF، کد را از تلگرام پشتیبانی این‌جا جست‌وجو کن.</div>
  <form class="bc" onsubmit="return false">
    <div class="row">
      <div style="flex:1 1 220px"><label for="dsRef">جست‌وجوی کد</label>
        <input id="dsRef" type="text" placeholder="D-ABC-DEF"></div>
      <div style="flex:0 0 auto;align-self:flex-end"><button id="dsFind" type="button">پیدا کن</button></div>
    </div>
    <div id="dsOut" class="tk-out"></div>
  </form>
  <div id="dsList"></div>
  <script>
  (function () {
    var list = document.getElementById('dsList');
    var out = document.getElementById('dsOut');
    var waiting = document.getElementById('dsWaiting');
    if (!list) return;

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function when(iso) {
      try { return new Date(iso).toLocaleString('fa-IR'); } catch (e) { return iso; }
    }
    function who(r) {
      return esc(r.display_name || r.phone || r.user_id);
    }

    function card(r) {
      return '<div class="tk" data-id="' + esc(r.id) + '">'
        + '<div class="tk-h"><b>' + esc(r.title) + '</b>'
        + '<span class="pill">' + esc(r.reference) + '</span>'
        + (r.has_pdf ? '<span class="pill hot">📎 PDF در تلگرام</span>' : '')
        + '<span class="pill">' + (r.claim === 'FULL_TEXT' ? 'متن کامل' : 'چکیده') + '</span>'
        + '</div>'
        + '<div class="muted">' + who(r) + ' · ' + when(r.created_at) + '</div>'
        + '<div class="tk-x">' + esc(r.excerpt) + (r.excerpt && r.excerpt.length >= 200 ? '…' : '') + '</div>'
        + '<div class="tk-body"></div></div>';
    }

    function render(rows) {
      if (!rows.length) { list.innerHTML = '<div class="muted">چیزی این‌جا نیست.</div>'; return; }
      list.innerHTML = rows.map(card).join('');
    }

    function load() {
      list.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/des', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          waiting.textContent = j.count ? j.count + ' منتظر' : '';
          render(j.pending || []);
        })
        .catch(function () { list.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    function candidateRow(c) {
      var agree = c.authorAgrees === true ? 'نویسنده ✓' : (c.authorAgrees === false ? 'نویسنده ✗' : '');
      return '<div class="ds-cand" data-paper="' + esc(c.paperId) + '">'
        + '<b>' + Math.round(c.score * 100) + '٪ — ' + esc(c.title) + '</b>'
        + '<div class="muted">' + [esc(c.authors), c.year ? esc(String(c.year)) : '', esc(c.doi), agree]
            .filter(Boolean).join(' · ') + '</div>'
        + '<div class="row">'
        + '<button type="button" data-cand-act="same">همان مقاله است</button>'
        + '<button type="button" data-cand-act="force">مقاله‌ی دیگری است</button>'
        + '</div></div>';
    }

    function work(box, id, req) {
      box.innerHTML = '<div class="ds-work">'
        + (req.link ? '<div class="muted">لینک: ' + esc(req.link) + '</div>' : '')
        + '<div class="tk-x" style="white-space:pre-wrap">' + esc(req.body || '(بدون متن — فقط PDF)') + '</div>'
        + '<label>عنوان مقاله</label>'
        + '<input class="ds-title" type="text" value="' + esc(req.title) + '">'
        + '<label>خروجی JSON مدل</label>'
        + '<textarea class="ds-json" placeholder="کل شیء JSON را این‌جا پیست کن" dir="ltr"></textarea>'
        + '<label>هشتگ‌ها (با کاما)</label>'
        + '<input class="ds-tags" type="text" placeholder="#ایمپلنت, #دخانیات">'
        + '<div class="row">'
        + '<button type="button" data-act="save">ثبت و اطلاع بده</button>'
        + '<button type="button" data-act="reject">رد کن</button>'
        + '</div>'
        + '<div class="ds-msg muted"></div>'
        + '</div>';
    }

    function thread(box, id) {
      box.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/des/' + id, { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) { box.innerHTML = '<div class="muted">پیدا نشد.</div>'; return; }
          work(box, id, j.request);
        })
        .catch(function () { box.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    function doSave(box, id, extra) {
      var msg = box.querySelector('.ds-msg');
      var titleEl = box.querySelector('.ds-title');
      var jsonEl = box.querySelector('.ds-json');
      var tagsEl = box.querySelector('.ds-tags');
      var payload = Object.assign({
        title: titleEl.value.trim(),
        record: jsonEl.value.trim(),
        tags: tagsEl.value.trim(),
      }, extra || {});
      if (!payload.title || !payload.record) { msg.textContent = 'عنوان و خروجی JSON هر دو لازم‌اند.'; return; }
      msg.textContent = 'در حال ثبت…';
      fetch('/admin/des/' + id + '/answer', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.status === 409 && res.j.candidates) {
            msg.innerHTML = 'عنوانِ نزدیک در کتابخانه هست — تصمیم بگیر:'
              + res.j.candidates.map(candidateRow).join('');
            return;
          }
          if (res.status === 409) { msg.textContent = res.j.message || 'تداخل.'; return; }
          if (!res.ok) {
            msg.innerHTML = (res.j.issues || [res.j.message || res.j.error || 'نشد.'])
              .map(function (x) { return '<div>· ' + esc(x) + '</div>'; }).join('');
            return;
          }
          msg.innerHTML = 'ثبت شد و به کاربر اطلاع داده شد.'
            + (res.j.warnings || []).map(function (w) { return '<div>· ' + esc(w) + '</div>'; }).join('');
          setTimeout(load, 900);
        })
        .catch(function () { msg.textContent = 'ارسال نشد.'; });
    }

    list.addEventListener('click', function (ev) {
      var candBtn = ev.target.closest ? ev.target.closest('[data-cand-act]') : null;
      if (candBtn) {
        var candRow = candBtn.closest('.ds-cand');
        var box = candBtn.closest('.tk-body');
        var wrap = candBtn.closest('.tk');
        var paperId = candRow.getAttribute('data-paper');
        var act = candBtn.getAttribute('data-cand-act');
        doSave(box, wrap.getAttribute('data-id'),
          act === 'same' ? { same_as: paperId } : { force: true });
        return;
      }

      var actBtn = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (actBtn) {
        var wrap2 = actBtn.closest('.tk');
        var box2 = actBtn.closest('.tk-body');
        var id2 = wrap2.getAttribute('data-id');
        if (actBtn.getAttribute('data-act') === 'reject') {
          if (!confirm('این درخواست رد شود؟')) return;
          fetch('/admin/des/' + id2 + '/reject', { method: 'POST', credentials: 'include' })
            .then(load).catch(function () { box2.querySelector('.ds-msg').textContent = 'نشد.'; });
          return;
        }
        doSave(box2, id2, {});
        return;
      }

      var wrap3 = ev.target.closest ? ev.target.closest('.tk') : null;
      if (!wrap3) return;
      if (ev.target.closest && ev.target.closest('.tk-body')) return;
      var box3 = wrap3.querySelector('.tk-body');
      if (box3.innerHTML) { box3.innerHTML = ''; return; }
      thread(box3, wrap3.getAttribute('data-id'));
    });

    document.getElementById('dsFind').addEventListener('click', function () {
      var ref = document.getElementById('dsRef').value.trim();
      if (!ref) { out.textContent = 'کد را بنویس.'; return; }
      out.textContent = 'در حال جست‌وجو…';
      fetch('/admin/des/by-reference/' + encodeURIComponent(ref), { credentials: 'include' })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { out.textContent = 'کدی با این نشانی پیدا نشد.'; return; }
          out.textContent = '';
          waiting.textContent = '';
          render([Object.assign({}, res.j.request, { excerpt: (res.j.request.body || '').slice(0, 200) })]);
        })
        .catch(function () { out.textContent = 'جست‌وجو نشد.'; });
    });

    load();
  })();
  </script>

  <h3 style="margin-top:26px">صندوق چالش <span id="chWaiting" class="pill"></span></h3>
  <div class="muted">فقط پاسخ‌هایی که مدل مطمئن نبود — نه همهٔ جواب‌ها. قدیمی‌ترین بالاتر. همهٔ کسانی که جواب داده‌اند در «گزارش چالش‌ها»ی زیر است.</div>
  <div id="chList"></div>
  <script>
  (function () {
    var list = document.getElementById('chList');
    var waiting = document.getElementById('chWaiting');
    if (!list) return;

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function when(iso) {
      try { return new Date(iso).toLocaleString('fa-IR'); } catch (e) { return iso; }
    }
    function who(r) {
      return esc(r.display_name || r.phone || r.user_id);
    }

    function card(r) {
      return '<div class="tk" data-id="' + esc(r.id) + '" data-row="' + esc(JSON.stringify(r.key_points)) + '">'
        + '<div class="tk-h"><b>' + esc(r.content_id) + '</b>'
        + '<span class="pill">' + esc(r.reference) + '</span>'
        + '</div>'
        + '<div class="muted">' + who(r) + ' · ' + when(r.created_at) + '</div>'
        + '<div class="tk-x full">' + esc(r.answer_text) + '</div>'
        + '<div class="tk-body"></div></div>';
    }

    function render(rows) {
      if (!rows.length) { list.innerHTML = '<div class="muted">چیزی این‌جا نیست.</div>'; return; }
      list.innerHTML = rows.map(card).join('');
    }

    function load() {
      list.innerHTML = '<div class="muted">در حال خواندن…</div>';
      fetch('/admin/challenges', { credentials: 'include' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          waiting.textContent = j.count ? j.count + ' منتظر' : '';
          render(j.pending || []);
        })
        .catch(function () { list.innerHTML = '<div class="muted">خوانده نشد.</div>'; });
    }

    function work(box, keyPoints) {
      var checks = keyPoints.map(function (kp) {
        return '<label><input type="checkbox" data-kp="' + esc(kp.id) + '" checked> '
          + esc(kp.text) + '</label>';
      }).join('');
      box.innerHTML = '<div class="ds-work">'
        + checks
        + '<div class="row"><button type="button" data-act="rule">ثبت و اطلاع بده</button></div>'
        + '<div class="ds-msg muted"></div>'
        + '</div>';
    }

    list.addEventListener('click', function (ev) {
      var actBtn = ev.target.closest ? ev.target.closest('[data-act="rule"]') : null;
      if (actBtn) {
        var wrap = actBtn.closest('.tk');
        var box = actBtn.closest('.tk-body');
        var id = wrap.getAttribute('data-id');
        var msg = box.querySelector('.ds-msg');
        var verdict = Array.prototype.map.call(box.querySelectorAll('[data-kp]'), function (cb) {
          return { id: cb.getAttribute('data-kp'), state: cb.checked ? 'covered' : 'missing' };
        });
        msg.textContent = 'در حال ثبت…';
        fetch('/admin/challenges/attempts/' + id + '/rule', {
          method: 'POST', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ verdict: verdict })
        }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!res.ok) { msg.textContent = res.j.message || res.j.error || 'نشد.'; return; }
            msg.textContent = 'ثبت شد و به کاربر اطلاع داده شد.';
            setTimeout(load, 900);
          })
          .catch(function () { msg.textContent = 'ارسال نشد.'; });
        return;
      }

      var wrap2 = ev.target.closest ? ev.target.closest('.tk') : null;
      if (!wrap2) return;
      if (ev.target.closest && ev.target.closest('.tk-body')) return;
      var box2 = wrap2.querySelector('.tk-body');
      if (box2.innerHTML) { box2.innerHTML = ''; return; }
      var keyPoints;
      try { keyPoints = JSON.parse(wrap2.getAttribute('data-row')); } catch (e) { keyPoints = []; }
      work(box2, keyPoints);
    });

    load();
  })();
  </script>

  <h3 style="margin-top:26px">گزارش چالش‌ها <span id="chRepCount" class="pill"></span></h3>
  <div class="muted">همهٔ جواب‌ها (settled و در صف)، تازه‌ترین بالاتر. عدد بالای عنوان از خودِ دیتابیس است — نه از طول جدول. «چند شده» یعنی چند نکتهٔ کلیدی پوشش داده شده، نه امتیاز سایت.</div>
  <div id="chRepSum" class="grid" style="margin-top:10px"></div>
  <div id="chRep" class="muted" style="margin-top:10px">در حال خواندن…</div>
  <div class="row" style="margin-top:8px"><button type="button" id="chRepRefresh">تازه‌سازی گزارش</button></div>
  <script>
  (function () {
    var out = document.getElementById('chRep');
    var sumEl = document.getElementById('chRepSum');
    var countEl = document.getElementById('chRepCount');
    var refreshBtn = document.getElementById('chRepRefresh');
    if (!out) return;

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function when(iso) {
      try { return new Date(iso).toLocaleString('fa-IR'); } catch (e) { return iso; }
    }
    function num(n) {
      return Number(n || 0).toLocaleString('fa-IR');
    }
    function who(r) {
      return esc(r.display_name || r.phone || r.id);
    }
    function scoreCell(r) {
      if (r.status !== 'settled' || r.covered_count == null) return 'در صف';
      var word = r.result === 'full' ? 'درست بود'
        : (r.result === 'none' ? 'درست نبود' : 'تا حدی درست بود');
      return Number(r.covered_count).toLocaleString('fa-IR') + ' از '
        + Number(r.point_count).toLocaleString('fa-IR') + ' · ' + word;
    }

    function rowsHtml(rows) {
      if (!rows.length) return '<tr><td colspan="6">هنوز کسی جواب نداده.</td></tr>';
      return rows.map(function (r) {
        return '<tr><td>' + who(r) + '</td>'
          + '<td>' + esc(r.phone || '—') + '</td>'
          + '<td dir="ltr">' + esc(r.content_id) + '</td>'
          + '<td>' + esc(scoreCell(r)) + '</td>'
          + '<td>' + when(r.created_at) + '</td>'
          + '<td><span class="pill">' + esc(r.reference) + '</span></td></tr>';
      }).join('');
    }

    function summaryHtml(s) {
      if (!s) return '';
      var cards = ''
        + '<div class="card"><h3>افراد</h3><div class="v">' + num(s.people) + '</div><div class="s">خوانندهٔ متمایز</div></div>'
        + '<div class="card"><h3>جواب‌ها</h3><div class="v">' + num(s.total) + '</div><div class="s">یک نفر × یک چالش = یک جواب</div></div>'
        + '<div class="card"><h3>سنجیده‌شده</h3><div class="v">' + num(s.settled) + '</div><div class="s">در صف مدل/تو: ' + num(s.queued) + '</div></div>'
        + '<div class="card"><h3>آخرین جواب</h3><div class="v" style="font-size:1rem">'
        + (s.last_at ? when(s.last_at) : '—') + '</div><div class="s">اگر این جلو نرود، جوابِ تازه به دیتابیس نرسیده</div></div>';
      var by = (s.by_content || []).map(function (c) {
        return '<div class="muted" style="margin-top:6px" dir="ltr">' + esc(c.content_id)
          + ' — ' + num(c.people) + ' نفر · ' + num(c.attempts) + ' جواب</div>';
      }).join('');
      return cards + (by ? '<div style="grid-column:1/-1">' + by + '</div>' : '');
    }

    function load() {
      out.textContent = 'در حال خواندن…';
      out.className = 'muted';
      if (sumEl) sumEl.innerHTML = '';
      fetch('/admin/challenges/attempts', { credentials: 'include', cache: 'no-store' })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { out.textContent = 'خوانده نشد.'; return; }
          var rows = res.j.attempts || [];
          var s = res.j.summary || {};
          var people = s.people != null ? s.people : rows.length;
          var total = s.total != null ? s.total : rows.length;
          if (countEl) {
            countEl.textContent = total
              ? num(people) + ' نفر · ' + num(total) + ' جواب'
              : '';
          }
          if (sumEl) sumEl.innerHTML = summaryHtml(s);
          out.className = '';
          out.innerHTML = '<div class="tblwrap"><table><thead><tr>'
            + '<th>کاربر</th><th>موبایل</th><th>چالش</th><th>نتیجه</th><th>زمان</th><th>کد</th>'
            + '</tr></thead><tbody>' + rowsHtml(rows) + '</tbody></table></div>';
        })
        .catch(function () { out.textContent = 'خوانده نشد (شبکه).'; });
    }

    if (refreshBtn) refreshBtn.addEventListener('click', load);
    load();
  })();
  </script>

  <h3 style="margin-top:26px">ثبت/ویرایشِ یک چالش</h3>
  <div class="muted">جواب و نکات کلیدی را این‌جا ثبت کن — تا این کار انجام نشود، چالش روی صفحه زنده نیست (GET /challenge?content_id= همچنان exists:false برمی‌گرداند). همان content_id را دوباره بفرست تا ویرایش شود.</div>
  <div id="chUpBox" class="ds-work" style="margin-top:8px">
    <label>کلِ JSON را یک‌ضرب این‌جا پیست کن — سه فیلدِ زیر خودشان پر می‌شوند</label>
    <textarea id="chUpPaste" class="ds-json" rows="4" placeholder='{&quot;content_id&quot;:&quot;insight/insight-70&quot;, &quot;answer_fa&quot;:&quot;…&quot;, &quot;key_points&quot;:[{&quot;id&quot;:&quot;kp1&quot;,&quot;text&quot;:&quot;…&quot;}]}' dir="ltr"></textarea>
    <div id="chUpPasteMsg" class="muted">آرایه‌ی نکات کلیدی به‌تنهایی هم پذیرفته می‌شود. پیست چیزی را ثبت نمی‌کند — فقط فرم را پر می‌کند؛ ثبت با دکمه‌ی پایین است.</div>
    <label>content_id (مسیر صفحه، بدون / ابتدایی و بدون .html)</label>
    <input id="chUpContentId" type="text" dir="ltr" placeholder="insight/insight-68">
    <label>جواب (برای نمایش به خواننده، بعد از پاسخ‌دادن)</label>
    <textarea id="chUpAnswer" rows="4"></textarea>
    <label>نکات کلیدی — آرایه‌ی JSON، سه تا پنج مورد</label>
    <textarea id="chUpKeyPoints" class="ds-json" placeholder='[{&quot;id&quot;:&quot;kp1&quot;,&quot;text&quot;:&quot;…&quot;}, {&quot;id&quot;:&quot;kp2&quot;,&quot;text&quot;:&quot;…&quot;}]' dir="ltr"></textarea>
    <div class="row">
      <button id="chUpSave" type="button">ثبت</button>
    </div>
    <div id="chUpMsg" class="muted"></div>
  </div>
  <script>
  (function () {
    var pasteEl = document.getElementById('chUpPaste');
    var pasteMsg = document.getElementById('chUpPasteMsg');
    var contentIdEl = document.getElementById('chUpContentId');
    var answerEl = document.getElementById('chUpAnswer');
    var kpEl = document.getElementById('chUpKeyPoints');
    var saveBtn = document.getElementById('chUpSave');
    var msg = document.getElementById('chUpMsg');
    if (!saveBtn) return;

    // Same rule the server enforces (services/challenge.ts validateKeyPoints):
    // three to five points, each with a non-empty id and text, no repeated id.
    // Checked here too so a bad paste says what is wrong in Persian instead of
    // coming back as a bare 400.
    function keyPointProblem(kp) {
      if (!Array.isArray(kp)) return 'نکات کلیدی باید یک آرایه باشد.';
      if (kp.length < 3 || kp.length > 5) return 'نکات کلیدی باید سه تا پنج مورد باشد — الان ' + kp.length + ' مورد است.';
      var seen = {};
      for (var i = 0; i < kp.length; i++) {
        var it = kp[i];
        var n = i + 1;
        if (!it || typeof it !== 'object' || Array.isArray(it)) return 'موردِ ' + n + ' یک شیء با id و text نیست.';
        if (typeof it.id !== 'string' || !it.id.trim()) return 'موردِ ' + n + ' id ندارد.';
        if (typeof it.text !== 'string' || !it.text.trim()) return 'موردِ ' + n + ' text ندارد.';
        if (seen[it.id]) return 'id تکراری: ' + it.id;
        seen[it.id] = true;
      }
      return '';
    }

    // A paste fills the three fields; it never posts. JSON.parse is also what
    // turns the answer's escaped newlines into real ones, which is the half of
    // this that hand-splitting got wrong.
    function fillFrom(raw) {
      var obj;
      try { obj = JSON.parse(raw); } catch (e) { return 'JSONِ پیست‌شده نامعتبر است — چیزی پر نشد.'; }
      var kp = null;
      var filled = [];
      if (Array.isArray(obj)) {
        kp = obj;
      } else if (obj && typeof obj === 'object') {
        if (typeof obj.content_id === 'string' && obj.content_id.trim()) {
          contentIdEl.value = obj.content_id.trim();
          filled.push('content_id');
        }
        if (typeof obj.answer_fa === 'string' && obj.answer_fa.trim()) {
          answerEl.value = obj.answer_fa;
          filled.push('جواب');
        }
        if (obj.key_points != null) kp = obj.key_points;
      } else {
        return 'JSONِ پیست‌شده نه شیء است نه آرایه.';
      }
      var problem = '';
      if (kp != null) {
        kpEl.value = JSON.stringify(kp, null, 2);
        filled.push('نکات کلیدی' + (Array.isArray(kp) ? ' (' + kp.length + ' مورد)' : ''));
        problem = keyPointProblem(kp);
      }
      if (!filled.length) return 'چیزی برای پرکردن پیدا نشد — کلیدهای content_id / answer_fa / key_points نبودند.';
      return 'پر شد: ' + filled.join('، ') + (problem ? ' — ولی ' + problem : '');
    }

    if (pasteEl) {
      pasteEl.addEventListener('input', function () {
        var raw = pasteEl.value.trim();
        if (!raw) { pasteMsg.textContent = ''; return; }
        pasteMsg.textContent = fillFrom(raw);
      });
    }

    saveBtn.addEventListener('click', function () {
      var contentId = contentIdEl.value.trim();
      var answer = answerEl.value.trim();
      var kpRaw = kpEl.value.trim();
      var keyPoints;
      try {
        keyPoints = JSON.parse(kpRaw);
      } catch (e) {
        msg.textContent = 'JSONِ نکات کلیدی نامعتبر است.';
        return;
      }
      if (!contentId || !answer) {
        msg.textContent = 'content_id و جواب هر دو لازم‌اند.';
        return;
      }
      var problem = keyPointProblem(keyPoints);
      if (problem) { msg.textContent = problem; return; }
      msg.textContent = 'در حال ثبت…';
      fetch('/admin/challenges/upsert', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content_id: contentId, answer_fa: answer, key_points: keyPoints })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { msg.textContent = res.j.message || res.j.error || 'نشد.'; return; }
          msg.textContent = 'ثبت شد — چالش زنده است.';
        })
        .catch(function () { msg.textContent = 'ارسال نشد.'; });
    });
  })();
  </script>

  <h3 style="margin-top:26px">افزودنِ مستقیم به کتابخانه‌ی DES</h3>
  <div class="muted">بدون درخواستِ خواننده — یک امتیازی که خودت داری و می‌خواهی به کتابخانه اضافه شود. هیچ اطلاعیه‌ای فرستاده نمی‌شود.</div>
  <div id="dlBox" class="ds-work" style="margin-top:8px">
    <label>عنوان مقاله</label>
    <input id="dlTitle" type="text">
    <label>خروجی JSON مدل</label>
    <textarea id="dlJson" class="ds-json" placeholder="کل شیء JSON را این‌جا پیست کن" dir="ltr"></textarea>
    <label>هشتگ‌ها (با کاما)</label>
    <input id="dlTags" type="text" placeholder="#ایمپلنت, #دخانیات">
    <label>PMID (اختیاری)</label>
    <input id="dlPmid" type="text" dir="ltr">
    <div class="row">
      <button id="dlSave" type="button">ثبت در کتابخانه</button>
    </div>
    <div id="dlMsg" class="muted"></div>
  </div>
  <script>
  (function () {
    var box = document.getElementById('dlBox');
    if (!box) return;
    var titleEl = document.getElementById('dlTitle');
    var jsonEl = document.getElementById('dlJson');
    var tagsEl = document.getElementById('dlTags');
    var pmidEl = document.getElementById('dlPmid');
    var saveBtn = document.getElementById('dlSave');
    var msg = document.getElementById('dlMsg');

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function candidateRow(c) {
      var agree = c.authorAgrees === true ? 'نویسنده ✓' : (c.authorAgrees === false ? 'نویسنده ✗' : '');
      return '<div class="ds-cand" data-paper="' + esc(c.paperId) + '">'
        + '<b>' + Math.round(c.score * 100) + '٪ — ' + esc(c.title) + '</b>'
        + '<div class="muted">' + [esc(c.authors), c.year ? esc(String(c.year)) : '', esc(c.doi), agree]
            .filter(Boolean).join(' · ') + '</div>'
        + '<div class="row">'
        + '<button type="button" data-dl-cand-act="same">همان مقاله است</button>'
        + '<button type="button" data-dl-cand-act="force">مقاله‌ی دیگری است</button>'
        + '</div></div>';
    }

    function save(extra) {
      var payload = Object.assign({
        title: titleEl.value.trim(),
        record: jsonEl.value.trim(),
        tags: tagsEl.value.trim(),
        pmid: pmidEl.value.trim(),
      }, extra || {});
      if (!payload.title || !payload.record) { msg.textContent = 'عنوان و خروجی JSON هر دو لازم‌اند.'; return; }
      msg.textContent = 'در حال ثبت…';
      fetch('/admin/des/library', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.status === 409 && res.j.candidates) {
            msg.innerHTML = 'عنوانِ نزدیک در کتابخانه هست — تصمیم بگیر:'
              + res.j.candidates.map(candidateRow).join('');
            return;
          }
          if (res.status === 409) { msg.textContent = res.j.message || 'تداخل.'; return; }
          if (!res.ok) {
            msg.innerHTML = (res.j.issues || [res.j.message || res.j.error || 'نشد.'])
              .map(function (x) { return '<div>· ' + esc(x) + '</div>'; }).join('');
            return;
          }
          msg.innerHTML = 'ثبت شد (شناسه: ' + esc(res.j.paper_id) + ').'
            + (res.j.warnings || []).map(function (w) { return '<div>· ' + esc(w) + '</div>'; }).join('');
          titleEl.value = ''; jsonEl.value = ''; tagsEl.value = ''; pmidEl.value = '';
        })
        .catch(function () { msg.textContent = 'ارسال نشد.'; });
    }

    saveBtn.addEventListener('click', function () { save({}); });
    msg.addEventListener('click', function (ev) {
      var candBtn = ev.target.closest ? ev.target.closest('[data-dl-cand-act]') : null;
      if (!candBtn) return;
      var candRow = candBtn.closest('.ds-cand');
      var paperId = candRow.getAttribute('data-paper');
      var act = candBtn.getAttribute('data-dl-cand-act');
      save(act === 'same' ? { same_as: paperId } : { force: true });
    });
  })();
  </script>
</div></body></html>`;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // onRequest, not preHandler: Fastify validates a body BEFORE preHandler
  // runs, so with the hook one step later an anonymous caller sending a
  // malformed body got a 400 that names the fields the route wants — and had
  // the body parsed and validated on the way. At onRequest nothing about an
  // unauthenticated request is read but its Authorization header.
  app.addHook('onRequest', requireAdmin);

  app.get('/admin/kpis', async (_request, reply) => {
    const kpis = await computeKpis();
    return reply.send(kpis);
  });

  app.get('/admin', async (_request, reply) => {
    const kpis = await computeKpis();
    const grantable = grantableBadges().map((b) => ({ key: b.key, title_fa: b.title_fa }));
    return reply.type('text/html; charset=utf-8').send(renderHtml(kpis, grantable, {
      percent: config.bankTransfer.studentDiscountPercent,
      months: config.bankTransfer.studentMonths,
      prices: config.payments.planPricesRial,
    }));
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

  /**
   * POST /admin/subscriptions/gift-never-tried { days, title, body?, url?, push?, force? }
   * — gift N days of premium to EVERY account that has never once experienced
   * it (see neverPremiumUserIds()/NEVER_PREMIUM_WHERE in subscription.ts),
   * with one personal message to each.
   *
   * Same building blocks as the single-user tools above, run in a plain loop —
   * the anniversary-campaign script (scripts/anniversary-grant.ts) is the
   * precedent for a one-off bulk grant over `activateDays()`, and this is the
   * same shape wired to a button instead of a CLI, targeting a segment rather
   * than everyone. `activateDays()` keeps its own row lock per user, so this
   * needs no transaction of its own and a re-run only ever extends further.
   *
   * The message goes through the exact door POST /admin/notices/user uses —
   * `sendCapped`'s `system` kind, uncapped, so gifting a hundred people in one
   * click never eats into anyone's ordinary daily push budget — with the same
   * awake-window/`force` rule for the push half and an instant اطلاعیه row
   * either way.
   */
  app.post('/admin/subscriptions/gift-never-tried', {
    schema: {
      body: {
        type: 'object',
        required: ['days', 'title'],
        properties: {
          days: { type: 'integer', minimum: 1, maximum: 90 },
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
      days: number; title: string; body?: string; url?: string; push?: boolean; force?: boolean;
    };
    const title = (b.title || '').trim();
    if (!title) return reply.code(400).send({ error: 'empty_title' });

    const now = new Date();
    const targets = await neverPremiumUserIds();
    if (!targets.length) return reply.send({ ok: true, targeted: 0, granted: 0, failed: 0 });

    const message: NotificationMessage = {
      title,
      body: (b.body || '').trim() || '',
      url: mirrorPath((b.url || '').trim() || null) ?? undefined,
      tag: 'admin_notice',
    };
    const travels = Boolean(b.push) && (inAwakeWindow(now) || Boolean(b.force));

    let granted = 0;
    let failed = 0;
    for (const userId of targets) {
      try {
        await activateDays(userId, b.days, {
          source: 'admin', now, meta: { campaign: 'never_tried_premium' },
        });
        if (travels) {
          await sendCapped(userId, message, 'system', now, { inbox: true });
        } else {
          await recordInAppNotice(userId, 'system', message, dayInTz(now, config.streakTimezone));
        }
        granted += 1;
      } catch (err) {
        failed += 1;
        request.log.error({ err, user_id: userId }, 'gift-never-tried: failed for one user');
      }
    }

    return reply.send({
      ok: true,
      targeted: targets.length,
      granted,
      failed,
      push: travels ? 'queued' : 'off',
      push_skipped: !travels && b.push ? 'outside_awake_window' : null,
    });
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

  // POST /admin/bank-transfer/amount { reference, amount_rial? } — settle the
  // amount on a still-pending claim and tell the buyer they may transfer.
  //
  // `amount_rial` is OPTIONAL, which is the fix for a deadlock this endpoint
  // caused by requiring it: the student-discounted price is the exceptional
  // case, and in the ordinary one the founder has no new number to type — the
  // claim already opened at the list price. With no way to say «that figure is
  // right, go ahead», the buyer went on waiting for the confirmation their own
  // page had promised them, and the founder went on waiting for a deposit.
  // Omit it to confirm what the row already holds; send one to announce a
  // different figure. Either way the claim is stamped confirmed and the buyer
  // is notified — see services/gift-redemption.ts.
  app.post('/admin/bank-transfer/amount', {
    schema: {
      body: {
        type: 'object', required: ['reference'],
        properties: {
          reference: { type: 'string' },
          amount_rial: { type: 'integer', minimum: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { reference, amount_rial: amountRial } = request.body as {
      reference: string; amount_rial?: number;
    };
    const row = await confirmRedemptionAmount(reference, amountRial);
    if (!row) return reply.code(404).send({ error: 'not_pending', message: 'این کد پیگیری در صف بررسی نیست.' });
    return reply.send({ ok: true, redemption: row });
  });

  // POST /admin/bank-transfer/approve-with-badge { reference, note? } — the
  // «تأیید + یادگاریِ دانشجو» button: approves the claim, activates the
  // subscription and grants the `student` badge in ONE transaction, so a
  // failure on any one of the three leaves none of them written.
  //
  // The badge is the ONLY difference from plain /admin/gift/approve, and it
  // confers nothing: the discount is the amount written onto the claim above,
  // and the months come from the approval either way. Named «یادگاری» on the
  // button for exactly that reason — «اهدای نشان» read as the step that gives
  // the student their discount, which it never was.
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

  // GET /admin/support?status=open|closed|all&answered_limit=&answered_offset=
  // Waiting (awaiting founder) comes back in full; answered is one page — the
  // admin UI shows 15 first, then «نمایش بیشتر» walks ten at a time.
  app.get('/admin/support', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'closed', 'all'] },
          answered_limit: { type: 'integer', minimum: 1, maximum: 50 },
          answered_offset: { type: 'integer', minimum: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const q = request.query as {
      status?: 'open' | 'closed' | 'all';
      answered_limit?: number;
      answered_offset?: number;
    };
    const page = await ticketQueue({
      status: q.status,
      answeredLimit: q.answered_limit,
      answeredOffset: q.answered_offset,
    });
    return reply.send({
      ok: true,
      waiting: page.waiting_tickets.length,
      waiting_tickets: page.waiting_tickets,
      answered: page.answered,
      answered_total: page.answered_total,
      answered_offset: page.answered_offset,
      answered_limit: page.answered_limit,
      answered_has_more: page.answered_offset + page.answered.length < page.answered_total,
      // Flat list kept so older callers (and the support tests) keep working.
      tickets: page.tickets,
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

  // POST /admin/support/messages/:messageId/publish { public } — the founder's
  // switch, and the only thing that ever makes a reader's words (or the
  // founder's own reply) visible to anybody else. Scoped to ONE message, not
  // its thread (0048): a thread-level switch published a private aside in the
  // same motion as the reply it was meant to expose. Only a message inside an
  // article thread can be published; a support ticket has no page to appear
  // on, which the service's `content_id is not null` guard enforces rather
  // than trusting the caller to pass the right id.
  app.post('/admin/support/messages/:messageId/publish', {
    schema: {
      body: { type: 'object', properties: { public: { type: 'boolean' } } },
    },
  }, async (request, reply) => {
    const { messageId } = request.params as { messageId: string };
    const body = (request.body ?? {}) as { public?: boolean };
    // Private is the default (migration 0042/0048): an omitted/malformed
    // `public` must NOT publish. `!== false` used to fail OPEN — a request
    // with no body (or one where the field silently didn't parse) published.
    const isPublic = body.public === true;
    const r = await setMessagePublic(messageId, isPublic);
    if (!r) return reply.code(404).send({ error: 'not_a_publishable_message' });
    // Their words are on a public page now — they hear it from us, not by
    // stumbling on it. Fire-and-forget: publishing must not fail on a push.
    if (isPublic) notifyPublished(r.ticket).catch(() => { /* logged upstream */ });
    return reply.send({ ok: true, message: r.message, ticket: r.ticket });
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

  // ارزیاب DES — the founder's side. Reader endpoints live in routes/des.ts;
  // there is no AI provider anywhere in this feature (handoff §0/RULE 7), so
  // everything past the free gate in routes/des.ts waits here for a human.

  // GET /admin/des — the queue, oldest first.
  app.get('/admin/des', async (_request, reply) => {
    const rows = await requestQueue();
    return reply.send({
      ok: true,
      count: rows.length,
      pending: rows.map((r) => ({
        id: r.id,
        reference: r.reference,
        title: r.title,
        claim: r.claim,
        has_pdf: r.has_pdf,
        created_at: r.created_at,
        display_name: r.display_name,
        phone: r.phone,
        excerpt: (r.body || '').slice(0, 200),
      })),
    });
  });

  // GET /admin/des/:id — the full submission, for the work area.
  app.get('/admin/des/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const r = await getRequest(id);
    if (!r) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, request: r });
  });

  // GET /admin/des/by-reference/:reference — the lookup a PDF's code enables:
  // it arrives in Telegram with «D-ABC-DEF» typed under it, and this is how
  // that becomes a submission.
  app.get('/admin/des/by-reference/:reference', async (request, reply) => {
    const { reference } = request.params as { reference: string };
    const r = await requestByReference(reference);
    if (!r) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, request: r });
  });

  // POST /admin/des/:id/answer { title, record, tags, same_as?, force? } — the
  // paste box. One request does the whole job: parse, validate, normalise,
  // check for a near-duplicate paper, write, and notify the reader.
  app.post('/admin/des/:id/answer', {
    schema: {
      body: {
        type: 'object', required: ['title', 'record'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 300 },
          record: { type: 'string', minLength: 1 },
          tags: { type: 'string' },
          same_as: { type: 'string' },
          force: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as {
      title: string; record: string; tags?: string; same_as?: string; force?: boolean;
    };

    const desReq = await getRequest(id);
    if (!desReq) return reply.code(404).send({ error: 'not_found' });

    let parsed: any;
    try {
      parsed = JSON.parse(b.record);
    } catch (err) {
      return reply.code(400).send({ error: 'bad_json', detail: (err as Error).message });
    }

    const warnings: string[] = [];
    const title = b.title.trim();
    parsed.citation = parsed.citation || {};
    const recordTitle = String(parsed.citation.title || '').trim();
    if (recordTitle && keyHash(recordTitle) !== keyHash(title)) {
      warnings.push('عنوانِ داخل رکورد با عنوانی که دادی یکی نیست؛ عنوانِ تو ثبت شد.');
    }
    parsed.citation.title = title;

    const issues = validateDesRecord(parsed);
    if (issues.length) {
      return reply.code(400).send({ error: 'invalid_record', issues });
    }

    const { changed } = normaliseDesRecord(parsed);
    warnings.push(...changed);

    // Identifiers: prefer what the founder's scored record says (it names the
    // paper they actually verified); fall back to what the reader's own
    // submission carried, extracted the same way routes/des.ts does at
    // submit time — a PMID never appears in the DES citation schema, so it
    // can only come from here.
    const scope = paperScope(desReq.body || '');
    const head = scope.slice(0, 900).toLowerCase();
    const fallbackDoi = pickIdentifier(allDois(desReq.link || ''), allDois(scope), head);
    const fallbackPmid = pickIdentifier(allPmids(desReq.link || ''), allPmids(scope), head);
    const doi: string | null = parsed.citation.doi || fallbackDoi;
    const pmid: string | null = fallbackPmid;
    const year: number | null = typeof parsed.citation.year === 'number' ? parsed.citation.year : null;
    const firstAuthor: string | null = String(parsed.citation.authors || '').split(/[,;،]/)[0]?.trim() || null;
    const tags = resolveHashtags((b.tags || '').split(',').map((t) => t.trim()).filter(Boolean));

    let paperId: string;
    if (b.same_as) {
      // Same paper under a title the exact key could not match — attach this
      // submission's keys to the EXISTING record. Its score is never touched:
      // that is the founder's earlier, already-verified evaluation.
      paperId = b.same_as;
      await attachKeys(paperId, keysFor({ doi, pmid, title }));
    } else {
      if (!b.force) {
        const candidates = await nearDuplicates(title, firstAuthor || undefined);
        if (candidates.length) {
          return reply.code(409).send({ error: 'near_duplicate', candidates });
        }
      }
      try {
        paperId = await createPaper({
          doi, pmid, title, firstAuthor, year, hashtags: tags,
          des: parsed, specVersion: String(parsed.des_version || ''),
        });
      } catch (err) {
        // A DOI/PMID unique-index collision means the exact key missed but
        // the identifier itself did not — surface it like a near-duplicate
        // rather than a raw 500.
        if ((err as { code?: string }).code === '23505') {
          return reply.code(409).send({
            error: 'identifier_collision',
            message: 'مقاله‌ای با همین DOI یا PMID از قبل در کتابخانه هست.',
          });
        }
        throw err;
      }
    }

    await markAnswered(id, paperId);
    await sendCapped(desReq.user_id, {
      title: 'ارزیابی مقاله‌ات آماده است',
      body: title,
      url: `/?des=${encodeURIComponent(desReq.reference)}`,
    }, 'des_result');

    return reply.send({ ok: true, paper_id: paperId, warnings });
  });

  // POST /admin/des/:id/reject { reason? } — not a study, spam, or a
  // duplicate already covered by an open request. No reader-facing message
  // is sent: routes/des.ts's free gate already screens for the common case,
  // so a rejection here is the exception, not the flow, and des_result is
  // reserved for an actual score (handoff §8 — the notification is the
  // ANSWER to what the reader asked, not a status update).
  app.post('/admin/des/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string };
    const desReq = await getRequest(id);
    if (!desReq) return reply.code(404).send({ error: 'not_found' });
    await markRejected(id);
    return reply.send({ ok: true });
  });

  // POST /admin/des/library { title, record, tags, pmid?, same_as?, force? }
  // — the founder adding a paper to des_papers with NO reader waiting on it:
  // no des_requests row, no notification. Same validate/normalise/hashtag/
  // near-duplicate/createPaper pipeline as /admin/des/:id/answer, minus
  // everything that pipeline only has because it is ANSWERING a specific
  // submission. A DOI is read from the record's own citation; a PMID has no
  // home in the DES citation schema and there is no submission body/link to
  // sniff one from here, so it is accepted as its own optional field.
  app.post('/admin/des/library', {
    schema: {
      body: {
        type: 'object', required: ['title', 'record'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 300 },
          record: { type: 'string', minLength: 1 },
          tags: { type: 'string' },
          pmid: { type: 'string' },
          same_as: { type: 'string' },
          force: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as {
      title: string; record: string; tags?: string; pmid?: string; same_as?: string; force?: boolean;
    };

    let parsed: any;
    try {
      parsed = JSON.parse(b.record);
    } catch (err) {
      return reply.code(400).send({ error: 'bad_json', detail: (err as Error).message });
    }

    const warnings: string[] = [];
    const title = b.title.trim();
    parsed.citation = parsed.citation || {};
    const recordTitle = String(parsed.citation.title || '').trim();
    if (recordTitle && keyHash(recordTitle) !== keyHash(title)) {
      warnings.push('عنوانِ داخل رکورد با عنوانی که دادی یکی نیست؛ عنوانِ تو ثبت شد.');
    }
    parsed.citation.title = title;

    const issues = validateDesRecord(parsed);
    if (issues.length) {
      return reply.code(400).send({ error: 'invalid_record', issues });
    }

    const { changed } = normaliseDesRecord(parsed);
    warnings.push(...changed);

    const doi: string | null = parsed.citation.doi || null;
    const pmid: string | null = (b.pmid || '').trim() || null;
    const year: number | null = typeof parsed.citation.year === 'number' ? parsed.citation.year : null;
    const firstAuthor: string | null = String(parsed.citation.authors || '').split(/[,;،]/)[0]?.trim() || null;
    const tags = resolveHashtags((b.tags || '').split(',').map((t) => t.trim()).filter(Boolean));

    let paperId: string;
    if (b.same_as) {
      // Same paper under a title the exact key could not match — attach this
      // submission's keys to the EXISTING record. Its score is never touched:
      // that is the founder's earlier, already-verified evaluation.
      paperId = b.same_as;
      await attachKeys(paperId, keysFor({ doi, pmid, title }));
    } else {
      if (!b.force) {
        const candidates = await nearDuplicates(title, firstAuthor || undefined);
        if (candidates.length) {
          return reply.code(409).send({ error: 'near_duplicate', candidates });
        }
      }
      try {
        paperId = await createPaper({
          doi, pmid, title, firstAuthor, year, hashtags: tags,
          des: parsed, specVersion: String(parsed.des_version || ''),
        });
      } catch (err) {
        // A DOI/PMID unique-index collision means the exact key missed but
        // the identifier itself did not — surface it like a near-duplicate
        // rather than a raw 500.
        if ((err as { code?: string }).code === '23505') {
          return reply.code(409).send({
            error: 'identifier_collision',
            message: 'مقاله‌ای با همین DOI یا PMID از قبل در کتابخانه هست.',
          });
        }
        throw err;
      }
    }

    return reply.send({ ok: true, paper_id: paperId, warnings });
  });

  app.post('/admin/subscriptions/run-sweep', async (_request, reply) => {
    const result = await sweepExpiredSubscriptions(new Date());
    return reply.send({ ok: true, ...result });
  });

  // صندوق چالش — the founder's side. Reader endpoints live in routes/challenge.ts;
  // this is where a channel a reader wrote to actually gets a human, exactly
  // like ارزیاب DES and صندوق پشتیبانی before it.

  // GET /admin/challenges — the queue, oldest first.
  app.get('/admin/challenges', async (_request, reply) => {
    const rows = await challengeQueueRows();
    return reply.send({ ok: true, count: rows.length, pending: rows });
  });

  // GET /admin/challenges/attempts — the roster, newest first. Who answered
  // and how many key points they covered. Separate from the queue on purpose:
  // a settled attempt is gone from pending, and an AI-settled one never
  // entered it. `summary` is counted in SQL so the headline cannot drift from
  // the table if a client ever truncates the list.
  app.get('/admin/challenges/attempts', async (_request, reply) => {
    const report = await challengeAttemptReport();
    return reply.send({
      ok: true,
      count: report.summary.total,
      people: report.summary.people,
      summary: report.summary,
      attempts: report.attempts,
    });
  });

  // GET /admin/challenges/by-reference/:reference — same lookup shape as
  // ارزیاب DES's own by-reference route.
  app.get('/admin/challenges/by-reference/:reference', async (request, reply) => {
    const { reference } = request.params as { reference: string };
    const r = await one<{ id: string }>(
      'select id from challenge_attempts where reference = $1',
      [normalizeReference(reference)],
    );
    if (!r) return reply.code(404).send({ error: 'not_found' });
    const attempt = await getChallengeAttempt(r.id);
    if (!attempt) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, attempt });
  });

  // POST /admin/challenges/upsert { content_id, answer_fa, key_points } — where
  // a چالش is created and edited (on conflict … do update). This is the paste
  // box the publish report (workflow step 4.14) sends the founder to: the
  // چالش is not live until this runs (GET /challenge?content_id= answers exists:false
  // until then, and the block on the page renders nothing).
  app.post('/admin/challenges/upsert', {
    schema: {
      body: {
        type: 'object', required: ['content_id', 'answer_fa', 'key_points'],
        properties: {
          content_id: { type: 'string', minLength: 1 },
          answer_fa: { type: 'string', minLength: 1 },
          key_points: { type: 'array' },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { content_id: string; answer_fa: string; key_points: unknown };
    const keyPoints = validateKeyPoints(b.key_points);
    if (!keyPoints) {
      return reply.code(400).send({
        error: 'invalid_key_points',
        message: '۳ تا ۵ نکتهٔ کلیدی لازم است، هر کدام با id و text غیرخالی، و idها یکتا.',
      });
    }
    const challenge = await upsertChallenge({
      contentId: b.content_id, answerFa: b.answer_fa, keyPoints,
    });
    return reply.send({ ok: true, challenge });
  });

  // POST /admin/challenges/attempts/:id/rule { verdict: [{id, state}] } — the
  // founder settles a queued attempt: no `unsure` (the queue is where
  // ambiguity is resolved, not deferred again), exactly the challenge's key
  // points, each stamped by:'founder', and the ruling is kept as a worked
  // example for the SAME چالش (handoff §6.3 — this is what makes the queue
  // shrink as a چالش ages).
  app.post('/admin/challenges/attempts/:id/rule', async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as { verdict?: unknown };
    if (!Array.isArray(b.verdict) || !b.verdict.length) {
      return reply.code(400).send({ error: 'verdict_required' });
    }
    const verdictInput = b.verdict as { id?: unknown; state?: unknown }[];
    if (verdictInput.some((v) => typeof v.id !== 'string' || typeof v.state !== 'string')) {
      return reply.code(400).send({ error: 'invalid_verdict' });
    }
    const result = await settleByFounder(id, verdictInput as { id: string; state: string }[]);
    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'یافت نشد.',
        unsure_not_allowed: 'صف همین‌جا برای رفعِ ابهام است — «نامطمئن» پذیرفته نمی‌شود.',
        key_points_mismatch: 'باید دقیقاً همان نکته‌های کلیدیِ همین چالش باشد، هرکدام covered یا missing.',
      };
      return reply.code(400).send({ error: result.error, message: messages[result.error] });
    }
    await sendCapped(result.userId, {
      title: 'جوابِ چالش رسید',
      body: 'نتیجهٔ جوابت آماده شد.',
      url: `/${result.attempt.content_id}.html`,
    }, 'challenge_ruled');
    return reply.send({ ok: true, attempt: result.attempt });
  });

  /**
   * تعطیلی مطب — the days the contact card announces instead of computing its
   * open/closed pill. See services/clinic.ts; the rule is that no row means the
   * card behaves exactly as it did before this existed.
   *
   * GET /admin/clinic answers with what the card is saying RIGHT NOW plus every
   * row, past ones included — a closure that has expired is not an error to
   * hide, it is the evidence that last month's break ended by itself.
   */
  app.get('/admin/clinic', async (_request, reply) => {
    const day = tehranToday();
    const closures = await listClosures();
    return reply.send({
      ok: true,
      today: day,
      today_fa: formatJalaliLong(day),
      status: await clinicStatus(day),
      closures: closures.map((c) => {
        const back = backOn(c, closures);
        return {
          ...c,
          starts_fa: formatJalaliLong(c.starts_on),
          ends_fa: formatJalaliLong(c.ends_on),
          back_fa: formatJalaliDay(back),
          text: closureText(c, back, c.starts_on),
          state: c.starts_on <= day && c.ends_on >= day ? 'active'
            : (c.starts_on > day ? 'upcoming' : 'past'),
        };
      }),
    });
  });

  /**
   * POST /admin/clinic — { from, to?, note? }, dates typed in JALALI
   * ('1405/06/09'), because that is the calendar the founder has the closure
   * in. They are stored Gregorian like every other day in this API; nothing
   * downstream learns a second calendar.
   *
   * `to` omitted means a single day, which is the shape of most closures and
   * the one a required end date would get wrong most often. `note` is printed
   * on the card verbatim — an empty note is not a missing field, it is the
   * request for the sentence to be built from the dates.
   */
  app.post('/admin/clinic', async (request, reply) => {
    const b = (request.body ?? {}) as { from?: string; to?: string; note?: string };
    const from = parseJalali(b.from ?? '');
    if (!from) {
      return reply.code(400).send({
        error: 'invalid_from',
        message: 'تاریخ شروع را شمسی بنویس، مثل ۱۴۰۵/۰۶/۰۹.',
      });
    }
    const to = b.to && b.to.trim() ? parseJalali(b.to) : from;
    if (!to) {
      return reply.code(400).send({
        error: 'invalid_to',
        message: 'تاریخ پایان را شمسی بنویس، مثل ۱۴۰۵/۰۶/۱۳ (یا خالی بگذار).',
      });
    }
    if (to < from) {
      return reply.code(400).send({
        error: 'invalid_range',
        message: 'تاریخ پایان از شروع جلوتر نیست.',
      });
    }
    const note = (b.note ?? '').trim();
    const closure = await addClosure(from, to, note || null);
    const closures = await listClosures();
    const back = backOn(closure, closures);
    return reply.send({
      ok: true,
      closure,
      back_on: back,
      text: closureText(closure, back, closure.starts_on),
      summary: `از ${formatJalaliLong(from)}`
        + (to === from ? '' : ` تا ${formatJalaliLong(to)}`)
        + ` · بازگشت ${formatJalaliDay(back)}`,
    });
  });

  app.post('/admin/clinic/delete', async (request, reply) => {
    const { id } = (request.body ?? {}) as { id?: string };
    if (!id) return reply.code(400).send({ error: 'id_required' });
    const removed = await removeClosure(id);
    if (!removed) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });

  /**
   * مسیرها — who is near the end of a learning pathway.
   *
   * The read side of services/pathway-standings.ts. Answers the one question
   * the certificate plan depends on and nothing else could answer: is anybody
   * close enough that an exam needs writing?
   *
   * Rows are bucketed rather than returned flat, because the founder is not
   * scanning a table — they are asking "is there anything for me to do", and
   * `done` and `near` are the two answers that mean yes. `walking` is the tail,
   * capped, and exists only to show the pipeline is not empty.
   */
  app.get('/admin/pathways', async (_request, reply) => {
    const near = config.pathwayAlert.nearRemaining;
    const standings = await pathwayStandings();
    const shape = (s: typeof standings[number]) => ({
      user_id: s.user_id,
      display_name: s.display_name,
      tier: s.tier,
      pathway_id: s.pathway_id,
      title_fa: s.title_fa,
      completed_steps: s.completed_steps,
      total_steps: s.total_steps,
      remaining: s.remaining,
      enrolled: s.enrolled,
      certificate_intent: s.certificate_intent,
      alerted: s.alerted,
      // Whether this row would wake anybody, so a free reader sitting at two
      // steps left reads as a deliberate exclusion rather than a missed alert.
      alertable: alertable(s),
    });

    const done = standings.filter((s) => levelFor(s, near) === 'done');
    const nearEnd = standings.filter((s) => levelFor(s, near) === 'near');
    const walking = standings.filter((s) => levelFor(s, near) === null);

    return reply.send({
      ok: true,
      near_remaining: near,
      alert_hour: config.pathwayAlert.hour,
      alert_phone_set: Boolean(config.pathwayAlert.alertPhone || config.support.alertPhone),
      counts: {
        done: done.length,
        near: nearEnd.length,
        walking: walking.length,
        readers: new Set(standings.map((s) => s.user_id)).size,
      },
      done: done.map(shape),
      near: nearEnd.map(shape),
      walking: walking.slice(0, 40).map(shape),
    });
  });

  /**
   * POST /admin/pathways/run-alerts — the same sweep the nightly scheduler
   * runs, on demand. Here for the same reason /admin/streak-reminder/run is:
   * a nightly job you cannot fire by hand is a nightly job you find out is
   * broken a day late. Idempotent — a second press announces nothing.
   */
  app.post('/admin/pathways/run-alerts', async (_request, reply) => {
    const run = await runPathwayAlerts(new Date());
    return reply.send({ ok: true, crossings: run.crossings, notified: run.notified });
  });

  /**
   * محتوا — which copy of each versioned JSON file the API is actually serving.
   *
   * `pathways.json`, `content-index.json`, `badges.json` and
   * `flashcards-index.json` are edited in the site repo and re-fetched at
   * runtime (content-refresh.ts), which is what makes renaming a pathway or
   * retuning a badge a commit rather than a deploy. The failure mode is that it
   * silently does not happen — an env var never set in this deployment, an edge
   * holding an old copy, a payload the validator refuses — and until now the
   * only witness was a line in the container log. So: what is live, when it
   * last arrived, and a button to fetch now rather than wait out the interval.
   */
  const contentReport = () => ({
    ok: true,
    refresh_seconds: config.content.refreshSeconds,
    built_at: config.build.builtAt,
    commit: config.build.commit,
    files: contentStatus(),
  });
  app.get('/admin/content', async (_request, reply) => reply.send(contentReport()));
  app.post('/admin/content/refresh', async (_request, reply) => {
    await refreshOnce();
    return reply.send(contentReport());
  });

  /**
   * گواهی و آزمون مسیر — the founder issuing a certificate, and assigning the
   * exam that earns it. Both are DECISIONS written by a person from this
   * panel (services/certificates.ts, services/pathway-exams.ts); the
   * standings sweep above is what tells the founder it is time.
   */

  // GET /admin/pathways/catalog — the full pathways as {id, title_fa}, so the
  // two forms below offer a picker rather than a free-text id.
  app.get('/admin/pathways/catalog', async (_request, reply) => {
    const pathways = getPathways()
      .filter((p) => p.kind !== 'bundle')
      .map((p) => ({ id: p.id, title_fa: p.title_fa, steps: p.steps.length }));
    return reply.send({ ok: true, pathways });
  });

  // GET /admin/certificates[?user=] — the roster, or one reader's list.
  app.get('/admin/certificates', {
    schema: { querystring: { type: 'object', properties: { user: { type: 'string' }, phone: { type: 'string' } } } },
  }, async (request, reply) => {
    const q = request.query as { user?: string; phone?: string };
    if (pick(q)) {
      const who = await resolveUser(pick(q), reply);
      if (!who) return reply;
      return reply.send({ ok: true, user: who, certificates: await listCertificates(who.id) });
    }
    return reply.send({ ok: true, certificates: await certificateRoster() });
  });

  // POST /admin/certificates/issue — { user|phone, pathway_id, holder_name,
  // exam_id?, discount_percent?, notify? }. Idempotent while a live
  // certificate exists for that reader+pathway (see issueCertificate).
  app.post('/admin/certificates/issue', userBody({
    pathway_id: { type: 'string' },
    holder_name: { type: 'string' },
    exam_id: { type: 'string' },
    discount_percent: { type: 'integer', minimum: 0, maximum: 100 },
    notify: { type: 'boolean' },
  }, ['pathway_id', 'holder_name']), async (request, reply) => {
    const b = request.body as {
      user?: string; phone?: string; pathway_id: string; holder_name: string;
      exam_id?: string; discount_percent?: number; notify?: boolean;
    };
    const who = await resolveUser(pick(b), reply);
    if (!who) return reply;
    try {
      const result = await issueCertificate(who.id, b.pathway_id, {
        holderName: b.holder_name,
        examId: b.exam_id ?? null,
        discountPercent: b.discount_percent,
        notify: b.notify,
      });
      return reply.send({ ...result, user: who });
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'unknown_pathway') return reply.code(400).send({ error: code, message: 'این مسیر وجود ندارد (باندل‌ها گواهی ندارند).' });
      if (code === 'holder_name_required') return reply.code(400).send({ error: code, message: 'نامِ روی گواهی را بنویس.' });
      throw err;
    }
  });

  app.post('/admin/certificates/revoke', {
    schema: { body: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } },
  }, async (request, reply) => {
    const { id } = request.body as { id: string };
    const cert = await getCertificate(id);
    if (!cert) return reply.code(404).send({ error: 'not_found' });
    const revoked = await revokeCertificate(id);
    return reply.send({ ok: true, revoked, already: !revoked });
  });

  /**
   * آزمون مسیر — the founder's side (services/pathway-exams.ts). The FORM
   * (one per pathway: the question pool + its rules), the ASSIGNMENT (let one
   * reader in early), the QUEUE (attempts waiting on a human) and the record.
   */

  // GET /admin/exam-forms — every form with counts; GET /admin/exam-forms/:pathwayId — one, with its questions.
  app.get('/admin/exam-forms', async (_request, reply) => {
    return reply.send({ ok: true, forms: await formRoster() });
  });
  app.get('/admin/exam-forms/:pathwayId', async (request, reply) => {
    const { pathwayId } = request.params as { pathwayId: string };
    const form = await getForm(pathwayId);
    if (!form) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, form });
  });

  /**
   * POST /admin/exam-forms/parse — { questions } → what we read, or why not.
   *
   * A DRY RUN, and the reason it exists: the founder's paste is prose from
   * NotebookLM, and a parser reading prose must show its work before anything
   * is written. The panel previews what came back, and then saves THAT — the
   * reviewed array, not the text — so what he approved is exactly what is
   * stored, with no second parse in between.
   */
  app.post('/admin/exam-forms/parse', {
    schema: { body: { type: 'object', required: ['questions'], properties: { questions: {} } } },
  }, async (request, reply) => {
    const { questions } = request.body as { questions: unknown };
    const r = parseQuestions(questions);
    if (!r.ok) return reply.code(400).send({ error: 'invalid_questions', message: r.error });
    return reply.send({
      ok: true,
      questions: r.questions,
      mcq_count: r.questions.filter((q) => q.kind === 'mcq').length,
      free_count: r.questions.filter((q) => q.kind === 'free').length,
    });
  });

  // POST /admin/exam-forms — { pathway_id, questions, mcq_draw?, free_draw?,
  // pass_percent?, max_attempts?, retry_days?, supervised_until?, note? }.
  // `questions` is the founder's paste, normalised leniently; a bad question
  // is refused by number, and nothing is written.
  app.post('/admin/exam-forms', {
    schema: {
      body: {
        type: 'object', required: ['pathway_id', 'questions'],
        properties: {
          pathway_id: { type: 'string' },
          // Anything: the founder's prose, or an array. parseQuestions decides.
          questions: {},
          mcq_draw: { type: 'integer', minimum: 0, maximum: 200 },
          free_draw: { type: 'integer', minimum: 0, maximum: 200 },
          pass_percent: { type: 'integer', minimum: 1, maximum: 100 },
          max_attempts: { type: 'integer', minimum: 1, maximum: 10 },
          retry_days: { type: 'integer', minimum: 0, maximum: 365 },
          supervised_until: { type: 'integer', minimum: 0, maximum: 1000 },
          note: { type: 'string', maxLength: 400 },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as {
      pathway_id: string; questions: unknown; mcq_draw?: number; free_draw?: number; pass_percent?: number;
      max_attempts?: number; retry_days?: number; supervised_until?: number; note?: string;
    };
    try {
      const r = await upsertForm(b.pathway_id, {
        questions: b.questions, mcqDraw: b.mcq_draw, freeDraw: b.free_draw, passPercent: b.pass_percent,
        maxAttempts: b.max_attempts, retryDays: b.retry_days, supervisedUntil: b.supervised_until, note: b.note,
      });
      // Readers let in BEFORE the form existed were told nothing at the
      // time (there was nothing to sit); the form arriving is their news.
      const told = r.created ? await notifyAssigneesOfNewForm(b.pathway_id) : 0;
      return reply.send({ ok: true, ...r, notified: told });
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'unknown_pathway') return reply.code(400).send({ error: code, message: 'این مسیر وجود ندارد (باندل‌ها آزمون ندارند).' });
      if (code.startsWith('invalid_questions:')) {
        return reply.code(400).send({ error: 'invalid_questions', message: code.slice('invalid_questions:'.length) });
      }
      throw err;
    }
  });

  /**
   * POST /admin/exam-forms/questions — { pathway_id, question } — the panel's
   * question BUILDER: one written question appended to the pathway's pool,
   * creating the form if there is none. Deliberately not `upsertForm`, which
   * would replace the whole array and reset the form's own settings.
   */
  app.post('/admin/exam-forms/questions', {
    schema: {
      body: {
        type: 'object', required: ['pathway_id', 'question'],
        properties: { pathway_id: { type: 'string' }, question: { type: 'object' } },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { pathway_id: string; question: unknown };
    try {
      const r = await addQuestion(b.pathway_id, b.question);
      return reply.send({
        ok: true, created: r.created, question: r.question, count: r.form.questions.length,
      });
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'unknown_pathway') return reply.code(400).send({ error: code, message: 'این مسیر وجود ندارد (باندل‌ها آزمون ندارند).' });
      if (code.startsWith('invalid_questions:')) {
        return reply.code(400).send({ error: 'invalid_questions', message: code.slice('invalid_questions:'.length) });
      }
      throw err;
    }
  });

  // POST /admin/exam-forms/questions/delete — { pathway_id, question_id }.
  // An attempt already open keeps the question: its snapshot is its own copy.
  app.post('/admin/exam-forms/questions/delete', {
    schema: {
      body: {
        type: 'object', required: ['pathway_id', 'question_id'],
        properties: { pathway_id: { type: 'string' }, question_id: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { pathway_id: string; question_id: string };
    const r = await removeQuestion(b.pathway_id, b.question_id);
    if (r.last) {
      return reply.code(400).send({
        error: 'last_question',
        message: 'آخرین سؤال را نمی‌توان برداشت — آزمونِ بی‌سؤال خودش قبول می‌شود. اگر می‌خواهی این آزمون از کار بیفتد، کلِ فرم را حذف کن.',
      });
    }
    if (!r.removed) return reply.code(404).send({ error: 'not_found', message: 'این سؤال در مخزن نبود.' });
    return reply.send({ ok: true, ...r });
  });

  app.post('/admin/exam-forms/delete', {
    schema: { body: { type: 'object', required: ['pathway_id'], properties: { pathway_id: { type: 'string' } } } },
  }, async (request, reply) => {
    const { pathway_id } = request.body as { pathway_id: string };
    return reply.send({ ok: true, deleted: await deleteForm(pathway_id) });
  });

  // GET /admin/exams[?user=] — every early assignment, or one reader's.
  app.get('/admin/exams', {
    schema: { querystring: { type: 'object', properties: { user: { type: 'string' }, phone: { type: 'string' } } } },
  }, async (request, reply) => {
    const q = request.query as { user?: string; phone?: string };
    if (pick(q)) {
      const who = await resolveUser(pick(q), reply);
      if (!who) return reply;
      return reply.send({ ok: true, user: who, exams: await listAssignments(who.id) });
    }
    return reply.send({ ok: true, exams: await assignmentRoster() });
  });

  // POST /admin/exams — { user|phone, pathway_id, note?, notify? }: open the
  // pathway's exam to this reader before they finished it. Tells them, unless
  // notify:false — a door opened silently is a door nobody walks through.
  app.post('/admin/exams', userBody({
    pathway_id: { type: 'string' },
    note: { type: 'string', maxLength: 200 },
    notify: { type: 'boolean' },
  }, ['pathway_id']), async (request, reply) => {
    const b = request.body as { user?: string; phone?: string; pathway_id: string; note?: string; notify?: boolean };
    const who = await resolveUser(pick(b), reply);
    if (!who) return reply;
    try {
      const r = await assignExam(who.id, b.pathway_id, { note: b.note ?? null });
      const hasForm = Boolean(await getForm(b.pathway_id));
      if (r.created && b.notify !== false && hasForm) await notifyAssigned(who.id, b.pathway_id);
      return reply.send({ ok: true, ...r, has_form: hasForm, user: who });
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'unknown_pathway') return reply.code(400).send({ error: code, message: 'این مسیر وجود ندارد (باندل‌ها آزمون ندارند).' });
      throw err;
    }
  });

  app.post('/admin/exams/delete', {
    schema: { body: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } },
  }, async (request, reply) => {
    const { id } = request.body as { id: string };
    if (!(await getAssignment(id))) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true, deleted: await deleteAssignment(id) });
  });

  // GET /admin/exam-attempts — the queue (oldest first, full detail) and the
  // record (newest first, counts only).
  app.get('/admin/exam-attempts', async (_request, reply) => {
    const [queue, attempts] = await Promise.all([queueRows(), attemptRoster()]);
    return reply.send({ ok: true, queue, count: queue.length, attempts });
  });

  // POST /admin/exam-attempts/:id/rule — { decision: pass|fail|void,
  // free?: [{id, points:[{id,state}]}], holder_name? }. The decision is the
  // founder's; the per-point rulings, when given, become worked examples.
  app.post('/admin/exam-attempts/:id/rule', {
    schema: {
      body: {
        type: 'object', required: ['decision'],
        properties: {
          decision: { type: 'string', enum: ['pass', 'fail', 'void'] },
          free: { type: 'array' },
          holder_name: { type: 'string', maxLength: 120 },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as {
      decision: 'pass' | 'fail' | 'void';
      free?: { id: string; points: { id: string; state: 'covered' | 'missing' }[] }[];
      holder_name?: string;
    };
    if (b.free && b.free.some((f) => !f || typeof f.id !== 'string' || !Array.isArray(f.points))) {
      return reply.code(400).send({ error: 'bad_verdict', message: 'شکل حکم درست نیست.' });
    }
    const r = await ruleAttempt(id, { decision: b.decision, free: b.free, holder_name: b.holder_name ?? null });
    if (!r.ok) {
      const messages: Record<string, string> = {
        not_found: 'یافت نشد.',
        not_queued: 'این تلاش در صف نیست (شاید همین حالا حل شد).',
        bad_verdict: 'حکمِ هر سؤال تشریحی باید دقیقاً نکته‌های همان سؤال باشد، هرکدام covered یا missing.',
      };
      return reply.code(r.error === 'not_found' ? 404 : 400).send({ error: r.error, message: messages[r.error] });
    }
    return reply.send({ ok: true, attempt: r.attempt });
  });
}
