// چالش — a founder-authored question, model-graded against key points the
// founder wrote at publish time. Design ledger: .dentcast/challenge-handoff.md.
//
// Reading the question is public; everything else — the box, the verdict,
// the founder's own answer — is premium (handoff RULE 11/12). The view is
// decided from /me on load, the way every other gated surface on this site
// already does: a signed-out or free reader never sees a <textarea> at all,
// because a box that renders and then rejects on submit can lose a real
// answer somebody just spent minutes writing. RULE 6: `answer_fa` is
// released by ONE fact — this reader has an attempt row for this
// content_id — never by tier, so a lapsed reader who answered while
// premium keeps seeing it and everyone else does not.
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
import { api, currentUser, meStatus } from './api.js?v=42';
import { el, faNum } from './util.js?v=42';
import { premiumCta } from './premium-cta.js?v=42';
import { openLoginModal } from './login-modal.js?v=42';

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
  invite: 'اول خودت جواب بده، بعد جوابِ من را ببین.',
  placeholder: 'جوابت را این‌جا بنویس…',
  submit: 'بفرست',
  underBox: 'فقط یک بار می‌توانی جواب بدهی — چون بعدش جوابِ من را می‌بینی.',
  tooShort: 'کمی بیشتر بنویس تا بشود سنجید.',
  lockedTitle: 'جواب‌دادن بخشی از پریمیوم است',
  lockedBody: 'سؤال برای همه باز است. جواب‌دادن — و دیدنِ جوابِ من — بخشی از پریمیوم است.',
  signedOut: 'برای جواب‌دادن وارد شو.',
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

/** premium + signed-in, no attempt yet: the box (RULE 11 — the only view a box exists in). */
function answerBox(contentId, onSettled) {
  const box = el('textarea', { class: 'dc-ch-input', rows: '5', placeholder: COPY.placeholder });
  const note = el('div', { class: 'dc-ch-note' }, '');
  const send = el('button', { class: 'dc-act dc-act-primary', type: 'button' }, COPY.submit);

  send.addEventListener('click', async () => {
    const answer = box.value.trim();
    send.disabled = true;
    note.textContent = '';
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
    el('p', { class: 'dc-ch-under' }, COPY.underBox),
    el('div', { class: 'dc-ch-row' }, [send, note]),
    el('p', { class: 'dc-ch-invite' }, COPY.invite),
  ]);
}

/** free/premium-unclear or lapsed-out: the premium card. RULE 12's second answer. */
function lockedView() {
  return el('div', { class: 'dc-ch-gate' }, [
    el('p', { class: 'dc-ch-gate-title' }, COPY.lockedTitle),
    el('p', { class: 'dc-ch-gate-body' }, COPY.lockedBody),
    premiumCta('challenge'),
  ]);
}

/** signed-out: the sign-in path leads, the purchase link follows quieter — they
 * may already be a subscriber logged out on this device. */
function signedOutView(contentId, onSignedIn) {
  const btn = el('button', { class: 'dc-act dc-act-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    const res = await openLoginModal({ returnTo: location.pathname });
    if (res && res.user) onSignedIn();
  });
  return el('div', { class: 'dc-ch-gate' }, [
    el('p', { class: 'dc-ch-gate-title' }, COPY.lockedTitle),
    el('p', { class: 'dc-ch-gate-body' }, COPY.lockedBody),
    el('p', {}, COPY.signedOut),
    btn,
    premiumCta('challenge', { ghost: true }),
  ]);
}

async function draw(anchor, contentId) {
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

  const host = el('section', { class: 'dc-challenge' });
  const parent = anchor.parentNode;
  if (!parent) return;
  const existing = parent.querySelector('.dc-challenge');
  if (existing) existing.remove();
  // Deterministic ordering (plus.js:137's technique, applied here): چالش must
  // land BEFORE گفت‌وگوی زیر مطلب regardless of which of the two resolves
  // first, so it chains onto `.dc-threads` with 'beforebegin' when that block
  // is already there, rather than a raw insert on `anchor` (which would only
  // ever win front position by being the temporally-last synchronous call).
  const threadsHost = parent.querySelector('.dc-threads');
  if (threadsHost) threadsHost.insertAdjacentElement('beforebegin', host);
  else anchor.insertAdjacentElement('afterend', host);

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
    } else if (status === 'anon') {
      parts.push(signedOutView(contentId, () => draw(anchor, contentId)));
    } else if (status === 'error') {
      // RULE 12, third answer: "we could not ask" must never render as an
      // upsell — the question alone, no box, no lock copy, no card.
    } else if (!isPremium) {
      parts.push(lockedView());
    } else {
      parts.push(answerBox(contentId, (res) => render(res)));
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
    draw(anchor, contentId).catch(() => {});
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
