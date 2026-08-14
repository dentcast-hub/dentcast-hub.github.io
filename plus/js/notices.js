import { el, faNum } from './util.js';
import { api } from './api.js';
import { sameMirrorUrl } from './config.js';

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
  article: '📄',
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
  article: 'محتوای تازه',
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

/**
 * Acknowledge exactly the one card the reader opened. Optimistic: the tint
 * comes off immediately and the request is fire-and-forget, the same
 * tolerance the old mark-all write already had ("the dot clears next load").
 *
 * This is the fix for the 2026-08-14 support ticket: the panel used to move a
 * single per-user watermark the instant it rendered, which marked every
 * unread card seen at once — opening one made all of them stop being
 * coloured. Per-card acknowledgement (POST /notices/:id/seen) is what lets an
 * unopened card stay coloured next to one that was just opened.
 */
function markOneSeen(card, id) {
  if (!card.classList.contains('is-unread')) return;
  card.classList.remove('is-unread');
  card.removeAttribute('role');
  card.removeAttribute('tabindex');
  api.noticeSeen(id)
    .then(() => { document.dispatchEvent(new CustomEvent(NOTICES_SEEN_EVENT)); })
    .catch(() => { /* the card is readable either way; the dot corrects on next /me */ });
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
        //
        // sameMirrorUrl, because a stored row outlives the mistake that wrote
        // it: an announcement that named one mirror by its full URL would sign
        // out every reader of the other one, and rewriting it here repairs the
        // rows already in people's inboxes as well as everything sent later.
        n.url ? el('a', { class: 'dcp-nt-go', href: sameMirrorUrl(n.url) }, 'باز کن ›') : null,
      ]),
    ]),
  ];
  const attrs = { class: 'dcp-nt' + (n.unread ? ' is-unread' : '') };
  if (n.unread) {
    attrs.role = 'button';
    attrs.tabindex = '0';
    attrs.onclick = (e) => markOneSeen(e.currentTarget, n.id);
    attrs.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); markOneSeen(e.currentTarget, n.id); }
    };
  }
  return el('div', attrs, kids);
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
 * Each unread card acknowledges itself when opened (see markOneSeen) — the
 * panel no longer moves a blanket watermark on render, which used to mark
 * every unread card seen the instant the list appeared. The celebration queue
 * is untouched by this either way — it has its own acknowledgement, so opening
 * the inbox can never silently spend a badge card the reader was never shown.
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
}

/** Fired once the watermark has moved, so the header dot can go out live. */
export const NOTICES_SEEN_EVENT = 'dcp:notices-seen';
