// چالش — a founder-authored question, model-graded against key points the
// founder wrote at publish time. Design ledger: .dentcast/challenge-handoff.md.
//
// Reading the question is public; answering is premium-gated on submit. Every
// reader sees the same box; non-premium users hear about the subscription only
// when they press «بفرست». RULE 6: `answer_fa` is released by ONE fact —
// this reader has an attempt row for this content_id — never by tier, so a
// lapsed reader who answered while premium keeps seeing it and everyone else does not.
//
// The public half (question + image) is generated into plus/challenges.json
// by tools/build_challenge_index.mjs and fetched here directly, the same
// posture des.js takes with des-scores.json — the founder's answer and key
// points are NEVER in a committed file (RULE 2), only behind the API.
//
// TWO SURFACES, like article-threads.js and des.js before it: a standalone
// page, and the desktop shell's column C. Same lazy-behind-an-
// IntersectionObserver shape as article-threads.js, but the host is never
// inserted until BOTH checks confirm there is something to show — a
// half-published چالش (page markup + challenges.json entry, but no admin
// paste yet) must be invisible, never a box that 404s on submit.
import { api, currentUser, meStatus } from './api.js?v=48';
import { el, faNum } from './util.js?v=48';
import { premiumCta } from './premium-cta.js?v=48';

let filePromise = null;

// One fetch per page-load. `no-cache` (not `no-store`), same posture
// des.js's loadScores() takes — the browser still revalidates cheaply rather
// than re-downloading on every article.
function loadChallenges() {
  if (!filePromise) {
    filePromise = fetch('/plus/challenges.json', { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return filePromise;
}

const COPY = {
  heading: 'چالش',
  placeholder: 'جوابت را این‌جا بنویس…',
  submit: 'بفرست',
  tooShort: 'کمی بیشتر بنویس تا بشود سنجید.',
  premiumRequired: 'برای شرکت در چالش و بررسی پاسختون با هوش مصنوعی اشتراک پرمیوم تهیه کنید',
  unreachable: 'الان نتوانستیم بررسی کنیم. کمی بعد دوباره امتحان کن.',
  yourAnswerHeading: 'جوابِ تو',
  resultFull: 'درست بود',
  resultPartial: 'تا حدی درست بود',
  resultNone: 'درست نبود',
  queuedTitle: 'جوابت رسید',
  queuedBody: 'این یکی را خودم می‌خوانم — مدل مطمئن نبود. نتیجه در **اطلاعیه‌ات** می‌آید. جوابِ من را همین حالا ببین.',
  answerHeading: 'جوابِ من',
  already: 'به این چالش قبلاً جواب داده‌ای.',
  footer: 'تطبیق با نکات کلیدی انجام می‌شود، نه با کلمه‌به‌کلمه‌ی جواب.',
  rateLimited: 'کمی صبر کن و دوباره امتحان کن.',
  sendFailed: 'ارسال نشد.',
};

/** `**bold**` spans only — enough for the one string that needs it (queuedBody). */
function richText(str) {
  return str.split(/\*\*(.+?)\*\*/g).map((s, i) => (i % 2 === 1 ? el('b', {}, s) : s));
}

function countLine(coveredCount, pointCount) {
  return faNum(coveredCount) + ' از ' + faNum(pointCount) + ' نکته‌ی کلیدی';
}

/**
 * §7.2/§9.3: settled shows the reader's own answer, the verdict word + count,
 * then the founder's answer under its own heading. Queued is the same shape
 * with the verdict area replaced by the reference + waiting line — the
 * founder's answer is in the SAME place, at the same moment (RULE 13). Used
 * both on initial load (an attempt already exists — the "done" view) and
 * right after a fresh submit.
 */
function resultView(state) {
  const parts = [];

  if (state.answer_text) {
    parts.push(el('div', { class: 'dc-ch-mine' }, [
      el('div', { class: 'dc-ch-mine-head' }, COPY.yourAnswerHeading),
      el('p', { class: 'dc-ch-mine-body' }, state.answer_text),
    ]));
  }

  if (state.status === 'settled') {
    const label = state.result === 'full' ? COPY.resultFull
      : state.result === 'none' ? COPY.resultNone : COPY.resultPartial;
    parts.push(el('div', { class: 'dc-ch-verdict dc-ch-verdict-' + state.result }, label));
    parts.push(el('div', { class: 'dc-ch-count' }, countLine(state.covered_count, state.point_count)));
  } else if (state.status === 'queued') {
    parts.push(el('div', { class: 'dc-ch-queued' }, [
      el('div', { class: 'dc-ch-queued-title' }, COPY.queuedTitle),
      el('div', { class: 'dc-ch-ref' }, state.reference),
      el('p', { class: 'dc-ch-queued-body' }, richText(COPY.queuedBody)),
    ]));
  }

  // RULE 13: the founder's answer appears in every branch, including queued
  // and including a model failure — it is what the reader came for.
  if (state.answer_fa) {
    parts.push(el('div', { class: 'dc-ch-answer' }, [
      el('div', { class: 'dc-ch-answer-head' }, COPY.answerHeading),
      el('p', { class: 'dc-ch-answer-body' }, state.answer_fa),
    ]));
  }

  parts.push(el('p', { class: 'dc-ch-footer' }, COPY.footer));
  return el('div', { class: 'dc-ch-result' }, parts);
}

/** Everyone sees this box; premium is checked on submit, not at render time. */
function answerBox(contentId, onSettled, { isPremium }) {
  const box = el('textarea', { class: 'dc-ch-input', rows: '5', placeholder: COPY.placeholder });
  const note = el('div', { class: 'dc-ch-note' }, '');
  const gate = el('div', { class: 'dc-ch-gate-cta', hidden: true });
  const send = el('button', { class: 'dc-act dc-act-primary', type: 'button' }, COPY.submit);

  const hideGate = () => {
    gate.hidden = true;
    gate.replaceChildren();
  };

  const showPremiumGate = () => {
    note.textContent = '';
    gate.replaceChildren(
      el('p', { class: 'dc-ch-premium-msg' }, COPY.premiumRequired),
      premiumCta('challenge'),
    );
    gate.hidden = false;
  };

  send.addEventListener('click', async () => {
    const answer = box.value.trim();
    hideGate();
    note.textContent = '';

    if (!isPremium) {
      showPremiumGate();
      return;
    }

    send.disabled = true;
    try {
      const res = await api.submitChallenge(contentId, answer);
      onSettled(res);
    } catch (e) {
      const err = e && e.body && e.body.error;
      if (err === 'answer_too_short') {
        note.textContent = COPY.tooShort;
      } else if (err === 'already_answered') {
        note.textContent = COPY.already;
        onSettled(e.body);
      } else if (e && e.status === 402) {
        showPremiumGate();
      } else if (e && e.status === 429) {
        note.textContent = COPY.rateLimited;
      } else {
        note.textContent = COPY.sendFailed;
      }
    } finally {
      send.disabled = false;
    }
  });

  return el('div', { class: 'dc-ch-box' }, [
    box,
    el('div', { class: 'dc-ch-row' }, [send, note]),
    gate,
  ]);
}

// Step 4.14 leaves question (+ image path as a data attribute) in the page
// for the index builder and the half-published state. The live block renders
// the image; any legacy visible <img data-dc-challenge-image> is suppressed.
function hideStaticChallenge(anchor) {
  const scope = (anchor && anchor.closest && anchor.closest('main')) || anchor || document;
  const q = scope.querySelector('[data-dc-challenge-question]');
  scope.querySelectorAll('img[data-dc-challenge-image]').forEach((img) => { img.hidden = true; });
  if (q) {
    const prev = q.previousElementSibling;
    if (prev && prev.tagName === 'H3') prev.hidden = true;
    q.hidden = true;
  }
}

function challengeQuestionEl(anchor, scope) {
  const root = scope === document
    ? ((anchor && anchor.closest && anchor.closest('main')) || document)
    : scope;
  return root.querySelector('[data-dc-challenge-question]');
}

function insertChallengeHost(host, anchor, scope) {
  const q = challengeQuestionEl(anchor, scope);
  if (q && q.parentNode) {
    // Step 4.14 leaves the question inside `.glass-box`. When findProseEnd()
    // is that same box, `afterend` lands OUTSIDE it — action row and ads stay
    // in/around the box while the live question floats below. Mount in-box.
    const parent = q.parentNode;
    const existing = parent.querySelector('.dc-challenge');
    if (existing) existing.remove();
    parent.insertBefore(host, q);
    return true;
  }
  const parent = anchor && anchor.parentNode;
  if (!parent) return false;
  const existing = parent.querySelector('.dc-challenge');
  if (existing) existing.remove();
  // No step-4.14 markup: hang below the prose anchor, before گفت‌وگو when
  // that block is already on the page (plus.js ordering).
  const threadsHost = parent.querySelector('.dc-threads');
  if (threadsHost) threadsHost.insertAdjacentElement('beforebegin', host);
  else anchor.insertAdjacentElement('afterend', host);
  return true;
}

async function draw(anchor, contentId, scope = document) {
  const map = await loadChallenges();
  const pub = map && map.byContent && map.byContent[contentId];
  if (!pub) return; // handoff 9.1: no entry in plus/challenges.json — never inserted

  const [apiState, user] = await Promise.all([
    api.challengeState(contentId).catch(() => null),
    currentUser(),
  ]);
  // handoff 11.3: exists:false (the page markup + index exist, but the
  // founder has not pasted the admin form yet) — invisible, not broken.
  if (!apiState || !apiState.exists) return;

  hideStaticChallenge(anchor);

  const host = el('section', { class: 'dc-challenge' });
  if (!insertChallengeHost(host, anchor, scope)) return;

  const status = meStatus(); // 'user' | 'anon' | 'error' — set by currentUser() above
  const isPremium = !!user && user.tier === 'premium';

  const render = (state) => {
    const parts = [
      el('h2', { class: 'dc-ch-title' }, COPY.heading),
      pub.image ? el('img', { class: 'dc-ch-img', src: pub.image, alt: '', loading: 'lazy' }) : null,
      el('p', { class: 'dc-ch-q' }, pub.question),
    ].filter(Boolean);

    if (state && state.status) {
      parts.push(resultView(state));
    } else if (status === 'error') {
      // RULE 12, third answer: "we could not ask" must never render as an
      // upsell — the question alone, no box, no lock copy, no card.
    } else {
      parts.push(answerBox(contentId, (res) => render(res), { isPremium }));
    }

    host.replaceChildren(...parts);
  };

  render(apiState.status ? apiState : null);
}

/**
 * Mount the block under `anchor` for `contentId`. Returns false when there is
 * nothing to mount onto (both call sites can stay one line), following
 * article-threads.js's own contract. `scope` mirrors mountDesHere's
 * signature on the two desktop-shell call sites; this module has nothing of
 * its own to look up in it (chained relative to `.dc-threads` instead, via
 * `anchor.parentNode`), so it stays unused beyond that parity.
 */
export function mountChallenge(anchor, contentId, scope = document) {
  if (!anchor || !contentId) return false;
  void scope;

  let drawn = false;
  const go = () => {
    if (drawn) return;
    drawn = true;
    draw(anchor, contentId, scope).catch(() => {});
  };

  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
    }, { rootMargin: '400px' });
    io.observe(anchor);
  } else {
    go();
  }
  return true;
}
