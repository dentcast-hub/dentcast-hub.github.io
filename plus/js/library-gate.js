/**
 * The premium gate on «کتابخانهٔ دنت‌کست» (the paper cabinet).
 *
 * This used to live as an inline script in index.html bound to ONE element —
 * `#card-library`, the archive tab's hero card. The cabinet has three doors,
 * and the other two are plain `<a href>` links that no script ever saw:
 *
 *   • `#dcd-hdr-cabinet`  — the desktop topbar icon (index.html)
 *   • `#btn-cabinet`      — injected by dc-nav.js into the topbar of EVERY
 *                           page, then moved into the hamburger drawer as
 *                           «کتابخانه» by header.js
 *
 * So the gate held on the mobile homepage and nowhere else: on desktop the
 * topbar icon walked straight in, and on any page at all the hamburger tool
 * did too. Reported 2026-08-09 as "mobile is behind payment, desktop is not" —
 * the desktop half was the visible symptom, the hamburger was the bigger hole.
 *
 * The fix is to gate the DESTINATION rather than an element: one delegated
 * listener catches every link to the cabinet, wherever it is and whenever it
 * was injected — including a node header.js has since moved into the drawer,
 * because moveToDrawer relocates the same anchor rather than rebuilding it.
 *
 * Three rules carried over unchanged from the original card script, because
 * each of them was load-bearing:
 *
 *   • The lock badge comes from a HINT, never a guess. spot.js already stores
 *     this device's last CONFIRMED viewer class, so a premium reader's first
 *     paint does not flash a lock while /me is in flight. The hint only decides
 *     the BADGE; the tap always waits for /me.
 *   • It fails OPEN. If /me cannot be asked at all (offline, API down), the tap
 *     goes through. A subscriber shut out by a network blip is a far worse
 *     outcome than an anonymous visitor getting in — and this is a product
 *     gate, not access control: the cabinet is a static page and its catalogue
 *     is public. For the same reason a ctrl/middle-click is left alone rather
 *     than fought over; anyone determined enough to bypass it could read the
 *     JSON directly, and breaking "open in new tab" for paying readers to stop
 *     them would cost more than it saves.
 *   • The message is the shared gateCard + premiumCta, so the wording and the
 *     ?from= tracking live where every other premium gate's do.
 */

const CABINET = '/dentcast_cabinet_search.html';

function setBadge(isPremium) {
  const badge = document.getElementById('card-library-lock');
  if (badge) badge.style.display = isPremium ? 'none' : '';
}

/**
 * Resolved the way spot.js resolves it: the answer AND why it answered,
 * because "confirmed anonymous" and "could not ask" must not behave alike.
 */
function probe() {
  return import('/plus/js/api.js')
    .then((m) => m.currentUser().then((user) => ({ user, status: m.meStatus() })))
    .catch(() => ({ user: null, status: 'error' }));
}

function openGate(from) {
  return Promise.all([import('/plus/js/sheet.js'), import('/plus/js/premium-cta.js')])
    .then(([sheet, cta]) => {
      sheet.openSheet(sheet.gateCard({
        title: 'کتابخانهٔ دنت‌کست ویژه‌ی پریمیوم است',
        sub: 'بیش از ۲۲۰۰ مقالهٔ دندان‌پزشکی، دسته‌بندی‌شده و قابل جستجو — با کلید یافته و خط پایانی بالینیِ هر مقاله.',
        cta: cta.premiumCta(from),
      }));
    })
    .catch(() => { window.location.href = `/plus/pricing.html?from=${from}`; });
}

/**
 * The decision, for any door. `from` is the gate's own ?from= tag, so the
 * pricing page can still tell which surface sent the reader — the card and the
 * drawer are very different signals about what people were looking for.
 */
export function openLibrary(from = 'gate-library') {
  return probe().then((p) => {
    const isPremium = !!(p.user && p.user.tier === 'premium');
    if (p.status !== 'error') setBadge(isPremium);
    if (isPremium || p.status === 'error') { window.location.href = CABINET; return; }
    openGate(from);
  });
}

/** Does this anchor lead to the cabinet? Compared by PATH, so a query string,
 *  a hash or an absolute same-origin URL all still match. */
function isCabinetLink(a) {
  if (!a || !a.getAttribute) return false;
  const href = a.getAttribute('href');
  if (!href) return false;
  try { return new URL(href, window.location.origin).pathname === CABINET; }
  catch (_) { return false; }
}

export function installLibraryGate() {
  if (window.__dcLibraryGate) return;
  window.__dcLibraryGate = true;

  // On the cabinet page itself there is nothing to gate — the reader is already
  // through whichever door let them in.
  if (window.location.pathname === CABINET) return;

  // Delegated, in the CAPTURE phase: the drawer and the topbar have click
  // handlers of their own, and this has to decide before any of them navigate.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // see fail-open note
    const a = e.target.closest && e.target.closest('a[href]');
    if (!isCabinetLink(a)) return;
    e.preventDefault();
    openLibrary(a.closest('.dc-toolbar-drawer-inner') ? 'gate-library-drawer' : 'gate-library-header');
  }, true);

  // The archive card is a div[role=button], not a link, so it needs its own
  // binding — and it is the one door that also carries a lock badge.
  const card = document.getElementById('card-library');
  if (card && !card.dataset.dcpGated) {
    card.dataset.dcpGated = '1';
    const open = () => openLibrary('gate-library-archive');
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); open(); }
    });
  }

  // Badge first from the stored hint (no flash), then settled from /me.
  try { if (localStorage.getItem('dcAds.vc') === 'premium') setBadge(true); } catch (_) { /* no storage */ }
  probe().then((p) => { if (p.status !== 'error') setBadge(!!(p.user && p.user.tier === 'premium')); });
}
