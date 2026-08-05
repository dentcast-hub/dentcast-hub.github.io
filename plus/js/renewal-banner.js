// The renewal banner: "your subscription ends soon" / "it has ended".
//
// COMPUTED, NOT DELIVERED. It reads `days_left` off the /me every page already
// makes, so there is no cron behind it, nothing to schedule, and nothing that
// can fail to arrive. The pushed reminders (three days out and on the last day)
// are the same fact travelling by a channel the user might not have connected;
// this is the copy that is always there, for anyone who simply opens the site.
//
// That division is why the notification side deliberately sends only two
// messages and never a third "it has ended" push: by then the user cannot act
// to prevent anything, and the thing they actually need to hear — that none of
// their work has gone anywhere — is better said here, where they are already
// looking at it.
import { el } from './util.js';
import { pricingHref } from './premium-cta.js';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const JALALI = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric',
});

/** Show the warning from this many days out — the same distance as the push. */
const WARN_WITHIN_DAYS = 7;

/**
 * What, if anything, to say about this account's subscription.
 *
 * Returns null far more often than not: a founder, a healthy subscription with
 * weeks to run, a league-prize premium (which has no subscription of its own and
 * whose own banner already speaks for it), and anyone who has never subscribed
 * all get nothing. A banner that is always there is furniture, and furniture is
 * invisible on the day it matters.
 */
export function renewalState(me) {
  const sub = me && me.subscription;
  if (!sub || sub.is_founder) return null;

  // Lapsed: the sweep has taken premium back, or the date has simply passed.
  if (!sub.is_premium) return { kind: 'lapsed', sub };

  if (typeof sub.days_left !== 'number' || sub.days_left > WARN_WITHIN_DAYS) return null;
  return { kind: sub.days_left === 0 ? 'last-day' : 'soon', sub };
}

function copy(state) {
  const { kind, sub } = state;
  const day = sub.expires_at ? JALALI.format(new Date(sub.expires_at)) : '';

  if (kind === 'lapsed') {
    return {
      tone: 'lapsed',
      title: 'اشتراک پریمیوم شما تمام شده است',
      // The sentence that decides whether they come back. A lapsed reader's
      // first fear is that their highlights are gone; they are not, and saying
      // so is worth more than any offer.
      body: 'هایلایت‌ها، یادداشت‌ها و کالکشن‌های شما همگی محفوظ‌اند و دست‌نخورده باقی می‌مانند. '
        + 'با تمدید، دوباره به همه‌شان یکجا دسترسی خواهید داشت.',
      cta: 'تمدید اشتراک',
    };
  }
  if (kind === 'last-day') {
    return {
      tone: 'urgent',
      title: 'امروز آخرین روز اشتراک شماست',
      body: `اشتراک شما تا پایان امروز (${day}) فعال است.`,
      cta: 'تمدید اشتراک',
    };
  }
  return {
    tone: 'soon',
    title: `${toFa(sub.days_left)} روز تا پایان اشتراک`,
    body: `تا پایان روز ${day} فعال است. تمدیدِ زودهنگام روزهای باقی‌مانده را نمی‌سوزاند — `
      + 'به انتهای همین اشتراک اضافه می‌شود.',
    cta: 'تمدید اشتراک',
  };
}

/** The banner element, or null when there is nothing worth saying. */
export function renewalBanner(me, from = 'banner') {
  const state = renewalState(me);
  if (!state) return null;
  const c = copy(state);

  return el('div', { class: `dcp-renew dcp-renew-${c.tone}` }, [
    el('h2', { class: 'dcp-renew-title' }, c.title),
    el('p', { class: 'dcp-renew-body' }, c.body),
    el('a', { class: 'dcp-btn dcp-btn-primary', href: pricingHref(from) }, c.cta),
  ]);
}
