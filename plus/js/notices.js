import { el, faNum } from './util.js';
import { api } from './api.js';

/**
 * اطلاعیه — the in-app inbox, opened from the account menu.
 *
 * The site had seven kinds of notification and exactly one way to receive any of
 * them: a push or a messenger message. A reader who never granted push
 * permission and linked nothing got none — the providers no-op quietly for a
 * user with no destination — and the daily cap in notify-policy.ts drops the
 * overflow rather than queueing it, so a busy day lost news even for the readers
 * who DID have a channel. This is where all of it now lands.
 *
 * It renders into the same overlay host as پیشخوان and پروفایل (overlay.js),
 * which is why there is no /plus/notices.html: a third destination would have
 * been a page, a route and a head, for a list. If the archive ever needs more
 * than sixty rows this follows the path highlights took — dashboard list first,
 * its own page only once the list proved too small.
 *
 * The row is a CARD, not a link: most notices have nowhere useful to go (a
 * streak nudge, a league result) and the ones that do say so with a small
 * action, the same rule the highlight library and the collection boards follow.
 */

/* Kind -> the small glyph on the row. Deliberately not per-kind colour: a wall
   of coloured chips reads as a status board, and none of these are statuses. */
const KIND_ICON = {
  achievement: '🏅',
  league: '🏆',
  article_premium: '📄',
  article_free_digest: '📄',
  streak: '🔥',
  reminder: '⏰',
  review: '🗂',
  premium_prize: '🎁',
  subscription_expiry: '⏳',
  system: '📣',
};

/* Kind -> what to call it under the row. The kind is a machine word; this is
   what a reader would call the thing that just arrived. */
const KIND_FA = {
  achievement: 'افتخارات',
  league: 'لیگ',
  article_premium: 'محتوای تازه',
  article_free_digest: 'محتوای تازه',
  streak: 'استریک',
  reminder: 'یادآوری',
  review: 'مرور',
  premium_prize: 'جایزه',
  subscription_expiry: 'اشتراک',
  system: 'دنت‌کست',
};

/**
 * "امروز" / "دیروز" / "۳ روز پیش" / a Persian date past a week.
 *
 * Relative wording only while it is still useful: after seven days "۹ روز پیش"
 * is arithmetic the reader has to do, and the date is simply shorter to read.
 */
function whenFa(iso) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return faNum(days) + ' روز پیش';
  try {
    return new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' }).format(then);
  } catch (_) {
    return faNum(days) + ' روز پیش';
  }
}

function noticeRow(n) {
  const kids = [
    el('span', { class: 'dcp-nt-ico', 'aria-hidden': 'true' }, KIND_ICON[n.kind] || '•'),
    el('div', { class: 'dcp-nt-body' }, [
      el('p', { class: 'dcp-nt-title' }, n.title),
      n.body ? el('p', { class: 'dcp-nt-text' }, n.body) : null,
      el('div', { class: 'dcp-nt-meta' }, [
        el('span', { class: 'dcp-nt-kind' }, KIND_FA[n.kind] || n.kind),
        el('span', {}, whenFa(n.created_at)),
        // Only where there is somewhere worth going. A row whose link is the
        // page you are already on is a button that does nothing.
        n.url ? el('a', { class: 'dcp-nt-go', href: n.url }, 'باز کن ›') : null,
      ]),
    ]),
  ];
  return el('div', { class: 'dcp-nt' + (n.unread ? ' is-unread' : '') }, kids);
}

function emptyState() {
  return el('div', { class: 'dcp-nt-empty' }, [
    el('p', { class: 'dcp-nt-empty-h' }, 'هنوز اطلاعیه‌ای نداری'),
    el('p', { class: 'dcp-nt-empty-p' },
      'خبرِ محتوای تازه، نتیجهٔ لیگ، یادآوریِ مرور و نشان‌هایی که می‌گیری این‌جا می‌آیند.'),
  ]);
}

/**
 * Render the inbox into `root` (an overlay body).
 *
 * The watermark is moved as soon as the list is on screen, not when the overlay
 * is closed: the reader has now seen these, and asking them to close the panel
 * "properly" to clear a dot would be a rule only we know about. The celebration
 * queue is untouched by this — it has its own acknowledgement, so opening the
 * inbox can never silently spend a badge card the reader was never shown.
 */
export async function renderNotices(root) {
  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));

  let data = null;
  try {
    data = await api.notices();
  } catch (_) {
    root.replaceChildren(el('div', { class: 'dcp-gate' }, 'فهرست اطلاعیه‌ها باز نشد. دوباره تلاش کن.'));
    return;
  }

  const rows = (data && data.notices) || [];
  root.replaceChildren(
    el('div', { class: 'dcp-dash-hello' }, 'اطلاعیه‌ها'),
    rows.length
      ? el('div', { class: 'dcp-nt-list' }, rows.map(noticeRow))
      : emptyState(),
  );

  if (data && data.unread > 0) {
    api.noticesSeen()
      .then(() => { document.dispatchEvent(new CustomEvent(NOTICES_SEEN_EVENT)); })
      .catch(() => { /* the list is readable either way; the dot clears next load */ });
  }
}

/** Fired once the watermark has moved, so the header dot can go out live. */
export const NOTICES_SEEN_EVENT = 'dcp:notices-seen';
