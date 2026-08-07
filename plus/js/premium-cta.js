// The one way to say "buy premium" anywhere on the site.
//
// Before this, nine different surfaces told a visitor that something was
// «ویژه‌ی پریمیوم» and then stopped — no link, no price, nowhere to go. Every
// one of those is a person who has just shown exactly the interest we want,
// and each was a dead end. This module gives them all the same next step so
// the wording, the destination and the tracking stay in one place instead of
// drifting across nine files.
//
// The `from` argument is not decoration: it rides along as ?from= so the
// pricing page can report WHICH gate sends people who actually buy. That is the
// only way to learn whether the review cards or the collections are what people
// are really paying for.
import { el } from './util.js';

export const PRICING_URL = '/plus/pricing.html';

/**
 * "We could not reach the server" — NOT "you are not a subscriber".
 *
 * currentUser() returns null on ANY failure, a 401 and an unreachable API alike
 * (api.js). That is right for progressive enhancement, and wrong for a gate: for
 * as long as the API is down — a redeploy is a few minutes of exactly that — every
 * premium page told its paying readers to go and buy a subscription. On
 * 2026-08-07 a subscriber messaged that premium «نمی‌شه», then that it worked a
 * few minutes later; nothing had changed but the API coming back.
 *
 * The distinction already existed and was already understood: meStatus() was
 * written for the ad system, whose comment says a premium visitor must not get an
 * ad they paid never to see. The gates for the features people actually pay for
 * were the ones still making that mistake. This is the shared answer, so a page
 * that gates cannot forget it.
 *
 * Deliberately NOT an upsell and NOT a login prompt: it names the real cause, and
 * offers the only thing that helps — trying again.
 */
export function unreachableGate(root) {
  const retry = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'تلاش دوباره');
  retry.addEventListener('click', () => location.reload());
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'ارتباط با سرور برقرار نشد.'),
    el('p', { class: 'dcp-muted' }, 'این یعنی نتوانستیم حسابت را بخوانیم — نه این‌که اشتراک نداری. اگر مشترکی، اشتراکت سرِ جایش است؛ چند لحظه بعد دوباره تلاش کن.'),
    retry,
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ]));
}

/** Where a premium CTA points, remembering which surface it was pressed on. */
export function pricingHref(from) {
  // Always the local pricing page, on either host.
  //
  // This used to cross straight to .ir, back when the rial gateway was the only
  // way to pay and a .org visitor could do nothing here. That is no longer
  // true: the gift-card route has no Iranian-gateway constraint at all, and
  // .org is precisely where the people it is for actually are. Sending them to
  // .ir would have handed them the one page they cannot use. The pricing page
  // itself now decides which of the two rails to offer, per host.
  return from ? `${PRICING_URL}?from=${encodeURIComponent(from)}` : PRICING_URL;
}

/**
 * The primary "buy premium" button. Rendered as a LINK, not a button with a
 * click handler: it navigates, so it must be openable in a new tab, focusable,
 * and visible to a crawler as a real destination.
 */
export function premiumCta(from, { label = 'خرید اشتراک پریمیوم', ghost = false } = {}) {
  return el('a', {
    class: `dcp-btn ${ghost ? 'dcp-btn-ghost' : 'dcp-btn-primary'}`,
    href: pricingHref(from),
  }, label);
}

/**
 * What an existing subscriber sees instead — or nothing at all.
 *
 * Three states, because "buy premium" is wrong for two of them: a founder has
 * nothing to buy, and a paying subscriber wants to EXTEND, which is the same
 * page but not the same sentence. Returns null when there is nothing honest to
 * offer, and callers are expected to render nothing rather than a placeholder.
 */
export function subscriptionCta(me, from) {
  const sub = me && me.subscription;
  if (sub && sub.is_founder) return null;            // nothing to sell
  if (me && me.tier === 'premium' && sub) {
    return premiumCta(from, { label: 'تمدید اشتراک', ghost: true });
  }
  // Premium via the weekly league prize (no subscription behind it) also lands
  // here, and correctly: the prize runs out, and buying is how it continues.
  return premiumCta(from);
}

/**
 * The label the header menu shows. Null means "leave the item out entirely" —
 * offering a founder a subscription is noise, not an upsell.
 */
export function subscriptionMenuLabel(me) {
  const sub = me && me.subscription;
  if (sub && sub.is_founder) return null;
  return me && me.tier === 'premium' && sub ? 'تمدید اشتراک' : 'خرید اشتراک پریمیوم';
}

/**
 * The line a premium gate shows ABOVE its own explanation — or null.
 *
 * A reader who let a subscription lapse and a reader who never had one are
 * standing in the same doorway with completely different questions. The second
 * is asking what this is; the first is asking what happened to their work. A
 * gate that answers only the first question reads, to somebody who has paid
 * before, as though their highlights were taken away — which is exactly what
 * did not happen, and exactly the thing that decides whether they come back.
 */
export function lapsedNote(me) {
  const sub = me && me.subscription;
  if (!sub || sub.is_founder || sub.is_premium) return null;
  return 'اشتراک شما تمام شده است. هایلایت‌ها، یادداشت‌ها و کالکشن‌های شما محفوظ‌اند '
    + 'و با تمدید دوباره در دسترس‌تان قرار می‌گیرند.';
}

/**
 * The two things a SIGNED-OUT visitor on a premium feature's page was missing.
 *
 * All eight of those pages used to say one thing to a guest — «برای دیدن X
 * وارد شوید» — and nothing else. Somebody arriving from a search result at
 * /plus/cards.html was told to sign in, with no hint that the thing they came
 * for is premium or how one gets it; signing in then showed them a second wall
 * they had no warning about. That sequence is what makes a site feel like it is
 * hiding the ball.
 *
 * SIGN-IN STAYS THE PRIMARY ACTION and this comes after it, quieter. A
 * signed-out visitor may already be a paying subscriber who is simply logged
 * out on this device, and trying to sell a subscription to somebody who owns
 * one is worse than saying nothing at all.
 */
export function guestPremiumExtras(from) {
  return [
    el('p', { class: 'dcp-muted' },
      'این بخش ویژه‌ی اشتراک پریمیوم است. اگر اشتراک دارید وارد شوید.'),
    premiumCta(from, { ghost: true }),
  ];
}
