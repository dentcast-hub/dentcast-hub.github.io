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

/** Where a premium CTA points, remembering which surface it was pressed on. */
export function pricingHref(from) {
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
