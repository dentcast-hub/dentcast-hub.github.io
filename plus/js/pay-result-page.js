// /plus/pay-result.html — where the customer lands coming back from the bank.
//
// IT DOES NOT BELIEVE ITS OWN URL. The API puts ?status= on the address for
// speed, so the first paint is right, but the page then asks /pay/status what
// the server actually recorded and redraws from that answer. Anyone can type
// ?status=activated into a browser; nobody can make the server agree.
//
// The state that matters most here is not success — it is DON'T KNOW. When the
// gateway did not answer, the payment stays pending and this page says so
// plainly, because telling someone who has just been charged that their payment
// failed is the single worst thing this flow can do.
import { el } from './util.js';
import { api, currentUser } from './api.js';
import { registerSW } from './pwa.js';
import { paymentsNeedIrHost, paymentsIrUrl } from './config.js';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (s) => String(s).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
const toman = (rial) => toFa(Math.round(rial / 10).toLocaleString('en-US').replace(/,/g, '٬'));

const JALALI = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric',
});

/** The one sentence the whole product uses for "until when". */
function activeUntil(sub) {
  if (!sub) return null;
  if (sub.is_founder) return 'اشتراک شما مادام‌العمر است.';
  if (!sub.expires_at) return null;
  return `تا پایان روز ${JALALI.format(new Date(sub.expires_at))} فعال است.`;
}

function verdict(kind, glyph, title, sub) {
  return el('div', { class: `dcp-pay-verdict is-${kind}` }, [
    el('div', { class: 'dcp-pay-glyph' }, glyph),
    el('h1', { class: 'dcp-pay-title' }, title),
    sub ? el('p', { class: 'dcp-pay-sub' }, sub) : null,
  ].filter(Boolean));
}

function receipt(rows) {
  const dl = el('dl', {});
  rows.filter(Boolean).forEach(([k, v]) => {
    dl.append(el('dt', {}, k), el('dd', {}, v));
  });
  return el('div', { class: 'dcp-pay-receipt' }, dl);
}

const TERM = { 1: 'یک ماه', 3: 'سه ماه', 6: 'شش ماه', 12: 'دوازده ماه' };

/**
 * What to draw, from the SERVER's record of the payment plus the account's
 * current subscription. `status` is the payment row's own status, not the query
 * string — 'paid' | 'pending' | 'failed' | 'canceled'.
 */
function screen(payment, me) {
  const root = el('div', { class: 'dcp-pay' });
  const dashboard = el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان');
  const retry = el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/pricing.html' }, 'تلاش دوباره');
  const back = el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/' }, 'بازگشت به سایت');

  if (!payment) {
    root.append(
      verdict('warn', '؟', 'پرداختی پیدا نشد',
        'سفارشی با این مشخصات در حساب شما ثبت نشده است.'),
      el('div', { class: 'dcp-pay-actions' }, [retry, back]),
    );
    return root;
  }

  const months = payment.months ? (TERM[payment.months] || `${toFa(payment.months)} ماه`) : null;

  if (payment.status === 'paid') {
    root.append(
      verdict('ok', '✓', 'اشتراک شما فعال شد', activeUntil(me && me.subscription)),
      receipt([
        months ? ['مدت', months] : null,
        ['مبلغ', `${toman(payment.amount_rial)} تومان`],
        payment.order_id ? ['شماره سفارش', payment.order_id] : null,
      ]),
      el('div', { class: 'dcp-pay-actions' }, [dashboard]),
    );
    return root;
  }

  // Pending is the honest "we don't know yet". Never dressed up as either
  // outcome: the money may well have left their account.
  if (payment.status === 'pending') {
    const check = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'بررسی دوباره');
    check.addEventListener('click', async () => {
      check.disabled = true;
      check.textContent = 'در حال بررسی…';
      await api.paySettle(payment.order_id).catch(() => {});
      location.reload();
    });
    root.append(
      verdict('warn', '⏳', 'در حال بررسی',
        'پاسخ درگاه هنوز نرسیده است. اگر مبلغ از حساب شما کسر شده باشد، اشتراک به‌صورت خودکار فعال می‌شود.'),
      el('div', { class: 'dcp-pay-note' },
        el('p', {}, 'می‌توانید این صفحه را ببندید؛ نتیجه روی حساب شما ثبت می‌شود.')),
      receipt([payment.order_id ? ['شماره سفارش', payment.order_id] : null]),
      el('div', { class: 'dcp-pay-actions' }, [check, dashboard]),
    );
    return root;
  }

  // failed / canceled — and the first thing said is the only thing they are
  // actually wondering about.
  root.append(
    verdict('stop', '↺', 'پرداخت انجام نشد', 'مبلغی از حساب شما کسر نشده است.'),
    el('div', { class: 'dcp-pay-actions' }, [retry, back]),
    el('p', { class: 'dcp-pay-fine' },
      'اگر مبلغی کسر شده باشد، طبق قوانین بانکی تا ۷۲ ساعت به‌صورت خودکار برمی‌گردد.'),
  );
  return root;
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  // A payment can only have happened on .ir, so this page has nothing of its
  // own to report anywhere else.
  if (paymentsNeedIrHost()) {
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'وضعیت پرداخت روی نسخه‌ی dentcast.ir دیده می‌شود.'),
      el('a', { class: 'dcp-btn dcp-btn-primary',
        href: paymentsIrUrl('/plus/pay-result.html' + location.search) }, 'ادامه در dentcast.ir'),
    ]));
    return;
  }

  const params = new URLSearchParams(location.search);
  const order = params.get('order') || '';

  root.replaceChildren(el('p', { class: 'dcp-muted' }, 'در حال بررسی وضعیت پرداخت…'));

  const me = await currentUser().catch(() => null);
  if (!me) {
    // The bank's redirect chain can land in a different browser context than
    // the one they left from. The payment itself is already settled server-side
    // either way — this page just cannot show it without knowing who they are.
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای دیدن وضعیت پرداخت وارد شوید.'),
      el('p', { class: 'dcp-muted' }, 'نتیجه‌ی پرداخت روی حساب شما ثبت شده است و با ورود دیده می‌شود.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'ورود'),
    ]));
    return;
  }

  // The server's record, not the query string.
  const res = await api.payStatus(order || undefined).catch(() => null);
  root.replaceChildren(screen(res && res.payment, me));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
