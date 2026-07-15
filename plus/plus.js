// DentCast Plus bootstrap. Loaded on every page by dc-nav.js as progressive
// enhancement. It decides the page type and wires only what belongs there. For
// anonymous visitors the page must look exactly as before except the two
// invitation points (spec 2.3): the workbench button and the homepage card.
import { detectContentId, findProseRoot, INVITE_LINE, SS_MODE, SS_RETURN_STUDY } from './js/config.js';
import { currentUser, api } from './js/api.js';
import { openLoginModal } from './js/login-modal.js';
import { Workbench } from './js/workbench.js';
import { el } from './js/util.js';
import { getModel, landingTopicKey } from './js/content-index.js';
import { initHomeCard } from './js/home-card.js';
import { initHeader } from './js/header.js';

function injectWorkbenchButton(main, proseRoot) {
  const btn = el('button', { class: 'dcp-wb-button', type: 'button', 'aria-pressed': 'false' }, 'میز کار');
  // Place it at the top of the article, just before the readable prose.
  const anchor = proseRoot;
  anchor.parentNode.insertBefore(el('div', { class: 'dcp-wb-bar' }, [btn]), anchor);
  return btn;
}

function showInvitation(anchorBtn, onProceed) {
  const existing = document.querySelector('.dcp-invite');
  if (existing) existing.remove();
  const proceed = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  const dismiss = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'بعدا');
  const box = el('div', { class: 'dcp-invite', role: 'dialog', 'aria-label': 'دعوت به میز کار' }, [
    el('p', { class: 'dcp-invite-line' }, INVITE_LINE),
    el('div', { class: 'dcp-invite-actions' }, [proceed, dismiss]),
  ]);
  anchorBtn.parentNode.insertBefore(box, anchorBtn.nextSibling);
  proceed.onclick = () => { box.remove(); onProceed(); };
  dismiss.onclick = () => box.remove();
}

async function initArticle() {
  const main = document.querySelector('main.article-content-wrap');
  const proseRoot = findProseRoot();
  if (!main || !proseRoot) return; // not an article page

  const contentId = detectContentId();
  const wb = new Workbench({ contentId, proseRoot });
  const btn = injectWorkbenchButton(main, proseRoot);

  function updateBtn() {
    const on = wb.isActive();
    btn.textContent = on ? 'خروج از میز کار' : 'میز کار';
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-active', on);
  }

  async function onClick() {
    const user = await currentUser({ refresh: true });
    if (!user) {
      // Anonymous invitation point: log the demand signal, show one sentence,
      // then OTP login carrying return_to. Never dump on the homepage after.
      api.anonEvent('workbench_button_anon_click', contentId).catch(() => {});
      showInvitation(btn, async () => {
        sessionStorage.setItem(SS_RETURN_STUDY, location.pathname);
        const res = await openLoginModal({ returnTo: location.pathname });
        if (res && res.user) {
          sessionStorage.removeItem(SS_RETURN_STUDY);
          await wb.enter();
          updateBtn();
        }
      });
      return;
    }
    if (wb.isActive()) wb.exit(); else await wb.enter();
    updateBtn();
  }
  btn.addEventListener('click', onClick);

  // Post-login return-to-study (the funnel) or a remembered choice this session.
  // Never auto-enters on a fresh visit: sessionStorage is empty then.
  const user = await currentUser();
  const returnStudy = sessionStorage.getItem(SS_RETURN_STUDY);
  if (user && returnStudy === location.pathname) {
    sessionStorage.removeItem(SS_RETURN_STUDY);
    await wb.enter();
    updateBtn();
  } else if (user && sessionStorage.getItem(SS_MODE + contentId) === 'study') {
    await wb.enter();
    updateBtn();
  }
}

// Folder landing pages carry a flashcard section at the top for that folder's
// cards (prototype feedback). Shown to LOGGED-IN users only: guests see the site
// exactly as today except the two invitation points (spec 2.3).
async function initLanding() {
  if (document.querySelector('main.article-content-wrap')) return; // handled as an article
  if (document.querySelector('.dcp-flash-section')) return;
  const user = await currentUser();
  if (!user) return;
  const model = await getModel();
  const topicKey = landingTopicKey(model, location.pathname);
  if (!topicKey) return;

  const { renderArchive } = await import('./js/archive.js');
  const body = el('div', { class: 'dcp-flash-body' });
  const chevron = el('span', { class: 'dcp-flash-chevron', 'aria-hidden': 'true' }, '▾');
  const head = el('div', { class: 'dcp-flash-head', role: 'button', tabindex: '0' }, [
    el('span', {}, 'فلش‌کارت‌های شما در این پوشه'),
    chevron,
  ]);
  const section = el('section', { class: 'dcp-flash-section is-open', 'aria-label': 'فلش‌کارت‌های شما' }, [head, body]);

  const toggle = () => section.classList.toggle('is-open');
  head.addEventListener('click', toggle);
  head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

  const main = document.querySelector('main') || document.body;
  const h1 = main.querySelector('h1');
  if (h1 && h1.parentNode === main) main.insertBefore(section, h1.nextSibling);
  else main.prepend(section);

  renderArchive(body, topicKey, { inline: true });
}

function boot() {
  try {
    initHeader();
    initArticle();
    initLanding();
    initHomeCard();
  } catch (e) {
    // Progressive enhancement: never break the page.
    if (window.console) console.warn('[plus] init failed', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
