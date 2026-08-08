// The free tier's allowance, on the client side — the one place a "you have N
// left" line or a "that was your last one" card is drawn.
//
// WHAT CHANGED, AND WHY THIS FILE EXISTS. Every premium feature used to answer a
// free reader with one full-page wall: «... ویژه‌ی دنت‌کست پریمیوم است», a buy
// button, and nothing else. Nine surfaces, nine copies of the same dead end,
// reaching people at the exact moment they could do nothing. The features now
// work for everybody up to a bounded point, so the wall moves off the door and
// onto the EDGE of the action — you see the real thing, you use it, and the
// offer arrives when you reach the end of what is free.
//
// NOTHING HERE IS A BOUNDARY. Every limit is enforced by the API, in the process
// that owns the data (plus-api/src/services/quota.ts). What this module draws is
// a courtesy: the count, the copy, and the next step. A page that failed to load
// this file would look worse and behave identically — which is the only safe way
// to build a paywall, because the browser is the attacker's computer.
//
// The numbers and every Persian sentence come from /plus/quota.json, the same
// file the API reads. One source, so a limit retuned in one commit cannot leave
// the site telling people the old number.
import { el, faNum } from './util.js';
import { premiumCta } from './premium-cta.js';

const QUOTA_URL = '/plus/quota.json';

/**
 * The floor if the config cannot be fetched.
 *
 * Only ever used for COPY, never for a decision — a missing config must not turn
 * into a wall the server did not ask for, so everything here is worded to be
 * true regardless of the real number.
 */
const FALLBACK_COPY = {
  highlight_library_fa: 'بخشی از دفترچه را می‌بینی؛ کل آن با پریمیوم.',
  pathways_fa: 'مسیر اول باز است؛ بقیه با پریمیوم.',
  compass_fa: 'درصد کلی را می‌بینی؛ نقشه‌ی کامل با پریمیوم.',
  library_fa: 'جستجوی رایگانِ امروز تمام شد؛ فهرست همچنان باز است.',
};

let configPromise = null;

/** The published config, fetched at most once per page. Never rejects. */
export function quotaConfig() {
  if (!configPromise) {
    configPromise = fetch(QUOTA_URL, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((c) => c || { quotas: {}, previews: {}, copy: FALLBACK_COPY });
  }
  return configPromise;
}

/** One of the four preview sentences, with a safe default. */
export async function quotaCopy(key) {
  const c = await quotaConfig();
  return (c.copy && c.copy[key]) || FALLBACK_COPY[key] || '';
}

/** Is this the API saying "you have used your allowance"? */
export function isQuotaError(err) {
  return !!err && err.status === 402 && err.body && err.body.error === 'quota_exhausted';
}

/** Is this the API saying "this part is premium" (a preview boundary)? */
export function isPremiumError(err) {
  return !!err && err.status === 402 && err.body && err.body.error === 'premium_required';
}

/** The quota state carried by a 402, or null. */
export function quotaOf(err) {
  return (err && err.body && err.body.quota) || null;
}

/**
 * True when this state describes a bounded (free) allowance at all.
 *
 * A premium reader's state has `limit: null`, and every renderer below returns
 * nothing for it. That is deliberate: a subscriber must never see a counter,
 * because a number that only ever says "unlimited" is noise on a paid product.
 */
export function isMetered(state) {
  return !!state && state.limit !== null && state.limit !== undefined;
}

/**
 * The quiet line above a feature a free reader is using: how much is left.
 *
 * Shown from the FIRST use, not from the last one. Someone who discovers the
 * limit only when they hit it has been surprised by a rule that was never
 * stated, and the moment they find out is the moment they are also annoyed —
 * the worst possible time to ask for money. Stating it up front makes the same
 * limit read as a free sample rather than a trap.
 *
 * Returns null when there is nothing honest to say (premium, or exhausted — the
 * wall speaks for that case).
 */
export function quotaStrip(state, from) {
  if (!isMetered(state) || state.remaining <= 0) return null;
  return el('div', { class: 'dcp-quota-strip' }, [
    el('span', { class: 'dcp-quota-count' }, state.remaining_fa || ''),
    premiumCta(from, { label: 'نامحدود کن', ghost: true }),
  ]);
}

/**
 * The card shown where the action was, once the allowance is spent.
 *
 * Deliberately NOT a page replacement. Whatever the reader has already done
 * stays on screen underneath — the cards they reviewed, the boards they own —
 * because the argument for subscribing is the work they just did, and clearing
 * it away to make room for a sales pitch throws that argument out.
 */
export function quotaWall(state, from, extra = null) {
  return el('div', { class: 'dcp-quota-wall' }, [
    el('p', { class: 'dcp-quota-wall-msg' }, (state && state.exhausted_fa) || 'سقف رایگان این بخش پر شده است.'),
    resetNote(state),
    extra,
    premiumCta(from),
  ].filter(Boolean));
}

/**
 * «فردا دوباره باز می‌شود» — but only when it is true.
 *
 * A lifetime cap (one collection) carries `resets_at: null` and gets no line at
 * all. Promising a refill that never comes is the one thing that would make the
 * whole counter untrustworthy.
 */
function resetNote(state) {
  if (!state || !state.resets_at) return null;
  const at = new Date(state.resets_at);
  if (Number.isNaN(at.getTime())) return null;
  const hours = Math.max(1, Math.round((at.getTime() - Date.now()) / 3_600_000));
  const text = hours <= 36
    ? `تا ${faNum(hours)} ساعت دیگر دوباره باز می‌شود.`
    : `${faNum(Math.round(hours / 24))} روز دیگر دوباره باز می‌شود.`;
  return el('p', { class: 'dcp-quota-reset' }, text);
}

/**
 * The note beside a PREVIEW boundary — the locked pathways, the compass's
 * blind-spot map, the rest of the highlight library.
 *
 * Separate from quotaWall because nothing here refills and saying otherwise
 * would be false: these are not spent allowances, they are simply the premium
 * part of a feature whose free part the reader is looking at right now.
 */
export function lockedNote(message, from, { compact = false } = {}) {
  return el('div', { class: `dcp-quota-locked${compact ? ' dcp-quota-locked-sm' : ''}` }, [
    el('p', {}, message),
    premiumCta(from, { ghost: compact }),
  ]);
}

/**
 * Draw the right thing for whatever the API just refused, into `host`.
 *
 * One entry point so every call site handles the two 402s the same way, and so
 * a THIRD kind of error is never silently rendered as a sales pitch — anything
 * that is not one of the two is re-thrown for the page's own error path.
 */
export function renderQuotaError(host, err, from) {
  if (isQuotaError(err)) {
    host.replaceChildren(quotaWall(quotaOf(err), from));
    return true;
  }
  if (isPremiumError(err)) {
    host.replaceChildren(lockedNote(err.body.message || '', from));
    return true;
  }
  return false;
}
