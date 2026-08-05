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
import { paymentsNeedIrHost, paymentsIrUrl } from './config.js';

export const PRICING_URL = '/plus/pricing.html';

/** Where a premium CTA points, remembering which surface it was pressed on. */
export function pricingHref(from) {
  const path = from ? `${PRICING_URL}?from=${encodeURIComponent(from)}` : PRICING_URL;
  // Cross to .ir here rather than letting the pricing page bounce them: one
  // navigation instead of two, and the link's own href tells the truth about
  // where it goes.
  return paymentsNeedIrHost() ? paymentsIrUrl(path) : path;
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
