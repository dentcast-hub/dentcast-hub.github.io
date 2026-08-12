// قلبِ مقاله — the reader's vote, and the only writable half of up-board.
//
// Two surfaces, same object, for the same reason share.js has two:
//
//   · A standalone article page gets `#dcArticleMeta`, the reading-time + share
//     chip row dc-nav.js builds above the prose. The heart is a third chip in
//     that row — the count is then above the fold on every article, which is the
//     whole point of printing it.
//   · The desktop shell strips dc-nav.js out of the article it fetches
//     (`index.html`'s chrome-removal list), so that row does not exist there at
//     all. `buildHeartChip()` supplies one for the میز کار bar instead. Without
//     it the feature would quietly work for phone readers and not for desktop
//     ones — the exact gap buildShareButton() was written to close.
//
// Unlike share, this module owns the button on BOTH surfaces rather than
// listening for one dc-nav.js built. A heart is not a fire-and-forget signal: it
// has to show a count it fetched, a pressed state that belongs to this reader,
// and it has to be able to fail. A chip built by a classic script that cannot
// reach the session would be a dead control on any page where this module did
// not load, and a heart that does nothing is worse than no heart.
import { api, currentUser } from './api.js';
import { openLoginModal, openOrgNotice } from './login-modal.js';
import { el, faNum } from './util.js';
import { isOrgHost } from './config.js';

const HEART_PATH = 'M12 20.5s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.3-7.5 10-7.5 10z';

function heartIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'dcp-heart-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', HEART_PATH);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.7');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return svg;
}

/**
 * Build a heart chip for `contentId` and wire it to the API.
 *
 * `extraClass` is the surface's own class — `.dc-meta-chip` in the article's
 * chip row (dc-article.css), `.dcp-wb-heart` in the workbench bar (plus.css) —
 * so one behaviour serves two visual systems without either importing the
 * other's stylesheet.
 */
export function buildHeartChip(contentId, extraClass) {
  const btn = el('button', {
    class: 'dcp-heart' + (extraClass ? ' ' + extraClass : ''),
    type: 'button',
    'aria-pressed': 'false',
  });
  const num = el('span', { class: 'dcp-heart-num' });
  btn.appendChild(heartIcon());
  // The WORD is not decoration. A lone outline heart, at chip size, in the same
  // grey as «زمان مطالعه» beside it, was read as one more piece of article
  // metadata — nobody could tell it was a control, let alone what pressing it
  // meant. The label says so once, and the colour keeps saying it.
  btn.appendChild(el('span', { class: 'dcp-heart-label' }, 'پسندیدم'));
  btn.appendChild(num);

  const wrap = el('div', { class: 'dcp-like' }, [btn]);
  wrap.appendChild(el('span', { class: 'dcp-like-count' }));

  let hearts = 0;
  let voted = false;
  let busy = false;

  // ZERO IS NEVER PRINTED. «۰ ❤» is a public announcement that nobody cared,
  // and it lands hardest on the pages that most need a first reader. An empty
  // heart makes the same invitation and costs nothing. The threshold is 1, not
  // some friendlier number like 5: with a higher floor the first reader to press
  // would see nothing move, or would see a count only they can see — and a
  // number that differs between two people looking at the same page is the one
  // thing a printed count may never do.
  const paint = () => {
    num.textContent = hearts > 0 ? faNum(hearts) : '';
    btn.setAttribute('aria-pressed', String(voted));
    btn.classList.toggle('is-voted', voted);
    btn.setAttribute('aria-label', voted ? 'برداشتن پسند' : 'پسندیدن این مطلب');
    btn.title = btn.getAttribute('aria-label');
    // Spelled out beside the button rather than left as a bare number: «۹» on
    // its own is the kind of thing a reader has to decode, and the whole
    // complaint about the old chip was that nothing said what it counted.
    wrap.querySelector('.dcp-like-count').textContent =
      hearts > 0 ? faNum(hearts) + ' نفر پسندیده‌اند' : '';
  };

  const pop = () => {
    btn.classList.add('is-pop');
    setTimeout(() => btn.classList.remove('is-pop'), 240);
  };

  // The count is public, so this runs for signed-out readers too and simply
  // comes back with voted:false. A failure leaves the chip in its empty state
  // rather than showing an error: nobody may ever be shown a stack trace for
  // opening an article.
  api.votes(contentId).then((state) => {
    hearts = state.hearts || 0;
    voted = Boolean(state.voted);
    paint();
  }).catch(() => {});

  btn.addEventListener('click', async () => {
    if (busy) return;

    // .org cannot hold a Plus session (cross-site cookie), same gate the
    // workbench button uses — so the notice, not a login form that cannot work.
    if (isOrgHost()) { openOrgNotice({ source: 'heart', contentId }); return; }

    const user = await currentUser({ refresh: true });
    if (!user) {
      // Seeing the count is free; adding to it is what needs an account. The
      // modal is opened on the press rather than the chip being hidden or
      // locked, so the invitation arrives at the moment the reader wanted it.
      //
      // A reader who signs in from here came to press a heart, so the chip picks
      // their state up on the way back — otherwise it would sit there empty and
      // they would have to press twice for one vote.
      const signedIn = await openLoginModal({ returnTo: location.pathname });
      if (!signedIn) return;
      try {
        const state = await api.votes(contentId);
        hearts = state.hearts || 0;
        voted = Boolean(state.voted);
        paint();
      } catch (_) { /* leave the chip as it was */ }
      return;
    }

    // Optimistic, because the press must feel instant — and reverted in full on
    // failure, because a heart the server never recorded must not be left
    // looking recorded.
    const prevHearts = hearts;
    const prevVoted = voted;
    voted = !voted;
    hearts = Math.max(0, hearts + (voted ? 1 : -1));
    paint();
    if (voted) pop();

    busy = true;
    try {
      const state = await api.setVote(contentId, voted);
      hearts = state.hearts || 0;
      voted = Boolean(state.voted);
    } catch (_) {
      hearts = prevHearts;
      voted = prevVoted;
    } finally {
      busy = false;
      paint();
    }
  });

  paint();
  return wrap;
}

/**
 * Put the heart in the article's own chip row, if this page has one.
 *
 * Idempotent and safe to call on every page: `#dcArticleMeta` exists only on
 * pages built on the shared article layer (dc-nav.js builds it behind a
 * `link[href^="/dc-article.css"]` check), so the homepage, the /plus/ pages and
 * anything else simply get nothing.
 *
 * @returns true if a chip was mounted.
 */
export function initHeart(contentId) {
  if (!contentId) return false;
  const row = document.getElementById('dcArticleMeta');
  if (!row || document.querySelector('.dcp-like')) return false;
  // AFTER the chip row, not inside it. Sitting among «زمان مطالعه» and
  // «اشتراک‌گذاری» made it the same kind of object they are — a small grey
  // utility — and it disappeared. On its own line it is the only coloured thing
  // above the prose, which is what a call to action has to be. Still at the top,
  // where it was asked to be; just no longer disguised as metadata.
  row.insertAdjacentElement('afterend', buildHeartChip(contentId, 'dcp-heart-lg'));
  return true;
}
