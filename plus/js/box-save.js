// «ذخیره در دفترچه» on every callout box of an article (module 03: `.dc-box`).
//
// Built at run time — no page carries this button, and it adds no word to the
// article: the row it sits in is marked `data-dc-presentation`, so the
// highlight anchoring (anchor.js), «در یک نگاه» and every reader of the page
// text step over it. What it keeps is the WHOLE box — the author's words and
// the box's label — as a third kind in the دفترچه beside the highlights and
// the audio clips (routes/boxes.ts, highlights.js).
//
// WHO (the founder's approved mockup): saving is premium, like an audio clip.
//   · premium  — a tap saves; the button says «در دفترچه ذخیره شد»; a second
//                tap takes it out again.
//   · free / guest — the button already wears the lock and the amber of
//                «this is what a subscription buys» BEFORE the tap; a tap opens
//                one line UNDER the box, in the flow of the page. No window,
//                nothing saved. The guest's line also offers the login (they
//                may be a subscriber signed out on this device).
//   · «we could not ask» (/me unreachable) — no button at all. A redeploy must
//                never read as «you are not premium» (unreachableGate's rule).
import { el } from './util.js?v=262';
import { api, currentUser, meStatus } from './api.js?v=262';
import { openLoginModal } from './login-modal.js?v=262';
import { pricingHref } from './premium-cta.js?v=262';

const LAYER = 'data-dc-presentation';
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

const TEXT = {
  fa: {
    save: 'ذخیره در دفترچه',
    saved: 'در دفترچه ذخیره شد',
    busy: '…',
    failed: 'ذخیره نشد؛ دوباره بزن',
    gate: ['ذخیرهٔ کادرها در دفترچه ویژهٔ ', 'پریمیوم', ' است.'],
    login: ['اگر حساب داری، ', 'وارد شو', '.'],
  },
  en: {
    save: 'Save to notebook',
    saved: 'Saved to notebook',
    busy: '…',
    failed: 'Not saved — try again',
    gate: ['Saving boxes to the notebook is a ', 'Premium', ' feature.'],
    login: ['Have an account? ', 'Sign in', '.'],
  },
};

/** The one fold the API uses (routes/boxes.ts foldBoxText). */
export const foldBoxText = (s) => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim();

const isEn = (node) => !!(node.closest && node.closest('[lang="en"], [dir="ltr"]'))
  || /\/en\//.test(location.pathname || '');

/** The box's own label (the layer's «نکته‌ی بالینی» / «نتیجه»), or null for a frame-alone box. */
export function boxLabel(box) {
  const lab = box.querySelector(':scope > .dc-box-label')
    || box.querySelector(`:scope > [${LAYER}]:not(.dc-box-save):not(.dc-box-gate)`);
  return lab ? foldBoxText(lab.textContent) || null : null;
}

let mounted = new WeakSet();

/**
 * @param boxes     the page's boxes (presentation.js pageBoxes)
 * @param contentId the article
 * @param textOf    the author's words in a box (presentation.js boxText)
 */
export async function mountBoxSave(boxes, contentId, textOf) {
  if (!contentId || !boxes.length) return;
  const user = await currentUser();
  if (!user && meStatus() === 'error') return;
  const who = !user ? 'guest' : (user.tier === 'premium' ? 'premium' : 'free');

  // premium: which of these boxes are already in the notebook
  const saved = new Map(); // folded text -> row id
  if (who === 'premium') {
    try {
      const res = await api.listBoxes(contentId);
      for (const b of (res && res.boxes) || []) saved.set(foldBoxText(b.text), b.id);
    } catch (_) { /* the button still saves; it just starts as «not saved» */ }
  }

  for (const box of boxes) {
    if (!box.isConnected || mounted.has(box)) continue;
    const text = foldBoxText(textOf(box));
    if (!text) continue;
    mounted.add(box);
    const T = TEXT[isEn(box) ? 'en' : 'fa'];
    const label = boxLabel(box);
    const locked = who !== 'premium';
    let id = saved.get(text) || null;

    const btn = el('button', { type: 'button', class: 'dc-box-save-btn' + (locked ? ' is-locked' : '') });
    const row = el('p', { class: 'dc-box-save', [LAYER]: '' }, [btn]);
    const paint = (msg) => {
      btn.setAttribute('aria-pressed', id ? 'true' : 'false');
      // <b>, not <span>: the legacy sheets force `.text-box span` to the body colour.
      btn.innerHTML = (locked ? LOCK : '') + '<b></b>';
      btn.lastChild.textContent = msg || (id ? T.saved : T.save);
    };
    paint();
    box.appendChild(row);

    btn.addEventListener('click', async () => {
      if (locked) { toggleGate(box, who, T); return; }
      if (btn.disabled) return;
      btn.disabled = true;
      paint(T.busy);
      try {
        if (id) {
          try { await api.deleteBox(id); } catch (e) { if (!(e && e.status === 404)) throw e; }
          id = null;
        } else {
          const res = await api.saveBox({ content_id: contentId, text, label });
          id = res && res.box ? res.box.id : null;
        }
        paint();
      } catch (_) {
        paint(T.failed);
      } finally {
        btn.disabled = false;
      }
    });
  }
}

/** The one line under the box for a guest or a free reader — never a window. */
function toggleGate(box, who, T) {
  const open = box.querySelector(':scope > .dc-box-gate');
  if (open) { open.remove(); return; }
  // A <div> of <i>/<div>, not a <p> of <span>s: the legacy sheets force
  // `.text-box p` and `.text-box span` to the body text colour.
  const parts = [
    el('i', { class: 'dc-box-gate-ico', html: LOCK }),
    el('div', { class: 'dc-box-gate-t' }, [
      T.gate[0], el('a', { href: pricingHref('box-save') }, T.gate[1]), T.gate[2],
      ...(who === 'guest' ? [' ', T.login[0], (() => {
        const b = el('button', { type: 'button', class: 'dc-box-gate-login' }, T.login[1]);
        b.addEventListener('click', async () => {
          const res = await openLoginModal({ returnTo: location.pathname + location.search + location.hash });
          if (res && res.user) location.reload();
        });
        return b;
      })(), T.login[2]] : []),
    ]),
  ];
  box.appendChild(el('div', { class: 'dc-box-gate', [LAYER]: '', role: 'status' }, parts));
}

/** Test seam: forget which boxes were wired. */
export function _resetBoxSave() { mounted = new WeakSet(); }
