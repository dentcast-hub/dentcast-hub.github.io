// «دستیار هوشمند» (premium): a narrowing WIZARD, not a chat — the user picks
// from a short multiple-choice round (plus a free-text "غیر از این‌ها" escape
// hatch) until the assistant points at real DentCast articles. All state lives
// in this module (the browser); the server is stateless (plus-api's
// /assistant/next re-derives everything from the history sent each call).
// Visual language borrows the shape of a real AI product (a spark mark on
// every assistant turn, a typing indicator while waiting, a recap trail of
// the case + past answers) without becoming free-form chat - see
// dcp-assist-* in plus-pages.css.
import { el, faNum } from './util.js?v=214';
import { api, ApiError } from './api.js?v=214';
import { FOLDER_EN } from './content-index.js?v=214';
import { premiumCta } from './premium-cta.js?v=214';

// The server reads 500 characters of a case; past that it would silently drop
// the tail, so the box stops there and counts down instead.
const MAX_CASE = 500;
const MAX_CUSTOM = 200;
// Results shown at once; the rest open with «مطالب بیشتر».
const SHOWN = 4;
const PAPERS_SHOWN = 3;
// A model round normally answers in a few seconds; past this the label says so.
const SLOW_MS = 6000;
// Characters that render as nothing (zero-width, joiners, bidi controls): text
// made only of these is empty, the same rule the server applies.
const INVISIBLE = /[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g;
const isBlank = (text) => !text.replace(INVISIBLE, '').trim();

// Just the hashtag labels for the scan line (tools/build_plus_index.mjs), not
// the whole content index. Fetched once, as the wizard opens.
let labelsPromise = null;
function tagLabels() {
  if (!labelsPromise) {
    labelsPromise = fetch('/plus/assistant-tags.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((j) => (Array.isArray(j.tags) ? j.tags : []))
      .catch(() => { labelsPromise = null; return []; });
  }
  return labelsPromise;
}

function sparkAvatar(isSmall) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"/>';
  const badge = el('div', { class: 'dcp-assist-avatar' + (isSmall ? ' is-sm' : '') });
  badge.appendChild(svg);
  return badge;
}

function sendButton(className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M3 20l18-8L3 4l0 6 12 2-12 2z"/>';
  return el('button', { class: className, type: 'button', 'aria-label': 'ارسال' }, [svg]);
}

function answerLabel(ans) {
  return ans.label || ans.custom || '';
}

// The case text + every resolved question/answer so far, kept visible above
// the live turn - otherwise each step() wipes the screen and the exchange
// looks amnesiac instead of like an ongoing conversation.
function recapTrail(description, history) {
  const wrap = el('div', { class: 'dcp-assist-thread' });
  if (description) {
    wrap.appendChild(el('div', { class: 'dcp-assist-recap' }, [
      el('span', { class: 'dcp-assist-recap-label' }, 'شرح شما'),
      el('div', { class: 'dcp-assist-recap-case', dir: 'auto' }, description),
    ]));
  }
  for (const h of history) {
    wrap.appendChild(el('div', { class: 'dcp-assist-recap' }, [
      // Only the sentence's first clause: the fallback questions carry long
      // instructions that turned a few failed rounds into a wall of text.
      el('span', { class: 'dcp-assist-recap-text' }, String(h.question || '').split('؛')[0]),
      el('span', { class: 'dcp-assist-recap-answer', dir: 'auto' }, '✓ ' + answerLabel(h.answer)),
    ]));
  }
  return wrap;
}

function articleRow(item, roundId) {
  const row = el('a', { class: 'dcp-pw-step', href: item.url }, [
    el('span', { class: 'dcp-pw-step-marker', 'aria-hidden': 'true' }, '📖'),
    el('div', { class: 'dcp-pw-step-body' }, [
      el('div', { class: 'dcp-pw-step-top' }, el('span', { class: 'dcp-pw-step-kind', dir: 'ltr' }, FOLDER_EN[item.type] || item.type)),
      el('div', { class: 'dcp-pw-step-title', dir: 'auto' }, item.title),
    ]),
  ]);
  // Report the open, then let the navigation happen. Fire-and-forget: telemetry
  // must never delay or block the reader getting to the article.
  if (roundId) {
    row.addEventListener('click', () => {
      api.assistantFeedback(roundId, 'click', item.content_id).catch(() => {});
    });
  }
  return row;
}

/**
 * A paper from «کتابخانهٔ دنت‌کست» on the matched topic: title, design and
 * source, its key finding behind a disclosure, and the library's own View /
 * Download links. English content, so the row is left-to-right.
 */
function paperRow(p) {
  const meta = [p.type, p.journal, p.year ? String(p.year) : ''].filter(Boolean).join(' · ');
  const links = el('div', { class: 'dcp-assist-paper-links' }, [
    p.view_url ? el('a', { href: p.view_url, target: '_blank', rel: 'noopener' }, 'View') : null,
    p.download_url ? el('a', { href: p.download_url, target: '_blank', rel: 'noopener' }, 'Download') : null,
  ].filter(Boolean));
  return el('div', { class: 'dcp-assist-paper', dir: 'ltr', lang: 'en', tabindex: '-1' }, [
    el('div', { class: 'dcp-assist-paper-title' }, p.title),
    meta ? el('div', { class: 'dcp-assist-paper-meta' }, meta) : null,
    p.key_finding ? el('details', { class: 'dcp-assist-paper-kf' }, [
      el('summary', {}, 'Key finding'),
      el('p', { dir: 'auto' }, p.key_finding),
    ]) : null,
    links,
  ].filter(Boolean));
}

/** The library section under the site's own results; absent when there is nothing to offer. */
function papersBlock(papers, expanded) {
  if (!papers || !papers.length) return null;
  const head = el('p', { class: 'dcp-assist-papers-lead' }, 'از کتابخانه‌ی دنت‌کست، مقاله‌هایی که ممکن است جواب سؤالت باشند:');
  const list = el('div', { class: 'dcp-assist-papers' }, papers.slice(0, PAPERS_SHOWN).map(paperRow));
  if (papers.length > PAPERS_SHOWN && expanded) {
    papers.slice(PAPERS_SHOWN).forEach((p) => list.appendChild(paperRow(p)));
  } else if (papers.length > PAPERS_SHOWN) {
    const more = el('button', { class: 'dcp-assist-more', type: 'button', 'data-more': 'papers' },
      'مقاله‌های بیشتر (' + faNum(papers.length - PAPERS_SHOWN) + ')');
    more.addEventListener('click', () => {
      const rows = papers.slice(PAPERS_SHOWN).map(paperRow);
      more.replaceWith(...rows);
      // The button is gone; without this, focus fell back to the page body.
      if (rows[0]) rows[0].focus();
    });
    list.appendChild(more);
  }
  return el('section', { class: 'dcp-assist-papers-wrap', 'aria-label': 'مقاله‌های کتابخانه' }, [head, list]);
}

/** GET /plus/assistant.html — the whole wizard, one screen at a time. */
export function renderCaseAssistant(container) {
  // Each scan gets a token; a scan whose index arrives after its screen is gone
  // never starts its timer (the old one leaked an interval on a detached node).
  let scanTimer = null;
  let scanToken = 0;
  const stopScan = () => { scanToken += 1; if (scanTimer) { window.clearInterval(scanTimer); scanTimer = null; } };
  let description = '';
  let history = [];
  let lastStep = null;   // the last screen the server sent: what «انصراف» and a reload go back to
  let pending = 0;       // id of the request in flight; a cancelled or superseded answer is ignored

  // One polite live region for the whole wizard, outside what each screen
  // replaces, so a screen reader hears «در حال جست‌وجو», the question, the result.
  const live = el('p', { class: 'dcp-sr', 'aria-live': 'polite', role: 'status' });
  const stage = el('div', { class: 'dcp-assist-stage' });
  container.replaceChildren(live, stage);
  const announce = (text) => { live.textContent = ''; window.setTimeout(() => { live.textContent = text; }, 30); };
  const show = (node, focusEl) => {
    stage.replaceChildren(node);
    if (focusEl) focusEl.focus({ preventScroll: true });
  };

  // The case survives a reload, and a Back from an article it opened.
  const SS = 'dcp-assist-state';
  // An unsent case survives a reload too, kept apart from the case state.
  const DRAFT = 'dcp-assist-draft';
  // Rounds already voted on: the vote is asked once, not again after a reload.
  const VOTES = 'dcp-assist-votes';
  const ssGet = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const ssSet = (k, v) => { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  const voted = () => { try { return JSON.parse(ssGet(VOTES) || '[]'); } catch (e) { return []; } };
  // How the result screen was left when an article was opened, so Back finds
  // it as it was: the same scroll and the same «بیشتر» lists open.
  let view = null;
  // `waiting`: the last answer was sent but not yet answered — a reload then
  // re-asks that round instead of showing the screen it was answered from.
  const save = (waiting = false, leaving = null) => {
    try { sessionStorage.setItem(SS, JSON.stringify({ description, history, lastStep, waiting, view: leaving })); } catch (e) { /* private mode */ }
  };
  const forget = () => { try { sessionStorage.removeItem(SS); } catch (e) { /* ignore */ } };

  function showIntro(keepText, restoreDraft = false) {
    stopScan();
    pending += 1;
    if (!restoreDraft && !keepText) ssSet(DRAFT, null);
    const draft = keepText ? description : (restoreDraft ? ssGet(DRAFT) || '' : '');
    description = '';
    history = [];
    lastStep = null;
    forget();
    const ta = el('textarea', {
      rows: 3,
      dir: 'auto',
      maxlength: String(MAX_CASE),
      'aria-label': 'شرح وضعیت بیمار',
      placeholder: 'وضعیت بیمار را با متن آزاد شرح بده؛ مثلاً چه شکایتی دارد و چه چیزی در معاینه دیده‌ای...',
    });
    ta.value = draft;
    const counter = el('span', { class: 'dcp-assist-count', 'aria-hidden': 'true' });
    const syncCount = () => { counter.textContent = faNum(ta.value.length) + ' / ' + faNum(MAX_CASE); };
    syncCount();
    const err = el('p', { class: 'dcp-inline-msg', role: 'alert', hidden: 'hidden' }, 'اول شرح بیمار را بنویس.');
    ta.addEventListener('input', () => { syncCount(); err.hidden = true; ssSet(DRAFT, ta.value || null); });
    const send = sendButton('dcp-assist-composer-send');
    const submit = () => {
      const text = ta.value.trim();
      if (isBlank(text)) { err.hidden = false; ta.focus(); return; }
      description = text;
      ssSet(DRAFT, null);
      step();
    };
    send.addEventListener('click', submit);
    // Enter writes a new line (a case can run to several); Ctrl/Cmd+Enter sends.
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
    });
    show(el('div', { class: 'dcp-assist-intro' }, [
      el('p', { class: 'dcp-sec-hint' }, 'شرح بده، بعد از بین چند گزینه انتخاب کن تا به مقاله‌ی مرتبط برسیم.'),
      el('div', { class: 'dcp-assist-composer' }, [ta, send]),
      counter,
      err,
      el('p', { class: 'dcp-assist-disclaimer' },
        'ⓘ نه گفتگوی آزاد، و نه تشخیص یا توصیه‌ی درمانی؛ فقط مسیر به محتوای خودِ سایت.'),
    ]), keepText || draft ? ta : null);
  }

  /**
   * While it thinks, show what it is actually doing: real site hashtags,
   * drifting past at reading pace.
   *
   * A model round takes a few seconds, and three bouncing dots for that long
   * reads as "stuck". These are the REAL tags from the site's own index
   * (already loaded in the browser) and the search really is a match against
   * them — so this is a window onto the work, not a fake progress bar.
   * Nothing invented: if the index has not loaded, the line just stays quiet.
   */
  function thinking() {
    stopScan();
    const trail = recapTrail(description, history);
    const label = el('div', { class: 'dcp-assist-scan-lbl' }, 'دارم هشتگ‌های سایت را می‌خوانم…');
    const stream = el('div', { class: 'dcp-assist-scan', 'aria-hidden': 'true' });
    const cancel = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'انصراف');
    cancel.addEventListener('click', cancelStep);
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [
        label,
        stream,
        el('div', { class: 'dcp-assist-thinking' }, [el('span'), el('span'), el('span')]),
        cancel,
      ]),
    ]));
    show(trail, cancel); // focus stays on the one control this screen has, not the page body
    announce('در حال جست‌وجو در هشتگ‌های سایت…');
    startScan(stream);
    const token = scanToken;
    window.setTimeout(() => {
      if (token !== scanToken || !label.isConnected) return;
      label.textContent = 'کمی بیشتر از معمول طول کشید؛ هنوز دارم می‌گردم…';
      announce(label.textContent);
    }, SLOW_MS);
  }

  /** Drift real tags through `node` until the answer arrives. */
  function startScan(node) {
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const token = scanToken;
    tagLabels().then((labels) => {
      if (token !== scanToken || !node.isConnected) return;
      const tags = labels.filter(Boolean);
      if (!tags.length) return;
      if (still) {
        // No motion: state the scope once instead of animating.
        node.textContent = 'جست‌وجو میان ' + faNum(tags.length) + ' هشتگ سایت';
        return;
      }
      const pick = () => {
        node.replaceChildren(...Array.from({ length: 3 }, () =>
          el('span', { class: 'dcp-assist-scan-t' }, '#' + tags[Math.floor(Math.random() * tags.length)])));
      };
      pick();
      scanTimer = window.setInterval(pick, 420);
    }).catch(() => {});
  }

  function optionsScreen(body) {
    stopScan();
    view = null;
    const { question, options } = body;
    const trail = recapTrail(description, history);

    // One answer per screen: a second activation before the screen is
    // replaced (key repeat, assistive tech) recorded the answer twice.
    let answered = false;
    const once = (ans) => { if (answered) return; answered = true; answer(ans, question, options); };
    const optWrap = el('div', { class: 'dcp-assist-opts' });
    for (const o of options) {
      const b = el('button', { class: 'dcp-assist-opt', type: 'button', dir: 'auto' }, o.label);
      b.addEventListener('click', () => once({ key: o.key, label: o.label }));
      optWrap.appendChild(b);
    }
    // The model was not reached: the same round may well work a moment later.
    // Right under the sentence that tells the user to press it, before the chips.
    let retry = null;
    if (body.retry) {
      retry = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'دوباره امتحان کن');
      retry.addEventListener('click', step);
    }

    const q = el('p', { class: 'dcp-assist-q', tabindex: '-1' }, question);
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [
        q,
        retry,
        options.length ? null : el('p', { class: 'dcp-muted' }, 'گزینه‌ای پیدا نشد؛ با «غیر از این‌ها» بیشتر توضیح بده.'),
      ].filter(Boolean)),
    ]));
    trail.appendChild(optWrap);

    // The last round resolves whatever is answered, so free text would have
    // nothing left to refine: the server marks it and the escape hatch goes.
    if (!body.final_round) {
      const customInput = el('input', {
        type: 'text', dir: 'auto', maxlength: String(MAX_CUSTOM),
        'aria-label': 'توضیح بیشتر', placeholder: 'توضیح بده...',
      });
      const customSend = sendButton('dcp-assist-send');
      const customRow = el('div', { class: 'dcp-assist-custom', hidden: 'hidden' }, [customInput, customSend]);
      const sendCustom = () => {
        const text = customInput.value.trim();
        if (isBlank(text)) { customInput.focus(); return; }
        once({ custom: text });
      };
      customSend.addEventListener('click', sendCustom);
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendCustom(); }
      });
      const moreBtn = el('button', { class: 'dcp-assist-more', type: 'button', 'aria-expanded': 'false' }, 'غیر از این‌ها');
      moreBtn.addEventListener('click', () => {
        customRow.hidden = !customRow.hidden;
        moreBtn.setAttribute('aria-expanded', String(!customRow.hidden));
        if (!customRow.hidden) customInput.focus();
      });
      trail.appendChild(el('div', { class: 'dcp-assist-opts' }, moreBtn));
      trail.appendChild(customRow);
    }
    // A case typed wrong can be dropped from any screen, not only the last one.
    const restart = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'شروع دوباره');
    restart.addEventListener('click', () => showIntro(false));
    trail.appendChild(el('div', { class: 'dcp-assist-opts' }, restart));
    show(trail, q);
    announce(question);
  }

  function doneScreen(body) {
    stopScan();
    const back = view; // set only when coming Back from an article this screen opened
    view = null;
    const articleLink = (a) => {
      const row = articleRow(a, body.round_id);
      row.addEventListener('click', () => save(false, {
        scrollY: window.scrollY,
        articles: !list.querySelector('[data-more="articles"]'),
        papers: !trail.querySelector('[data-more="papers"]'),
      }));
      return row;
    };
    const trail = recapTrail(description, history);
    const restart = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'شروع دوباره');
    restart.addEventListener('click', () => showIntro(false));
    const articles = body.articles || [];
    const papers = body.papers || [];
    const lead = el('p', { class: 'dcp-assist-result-lead', tabindex: '-1', dir: 'auto' },
      body.matched_fa ? 'نزدیک‌ترین حیطه: ' + body.matched_fa : 'نتیجه‌ی روشنی پیدا نشد.');
    let list;
    if (articles.length || papers.length) {
      const open = back && back.articles;
      list = articles.length
        ? el('div', { class: 'dcp-pw-steps' }, articles.slice(0, open ? articles.length : SHOWN).map(articleLink))
        : el('div', { class: 'dcp-muted' }, 'در مطالب سایت چیزی پیدا نشد.');
      if (articles.length > SHOWN && !open) {
        const more = el('button', { class: 'dcp-assist-more', type: 'button', 'data-more': 'articles' },
          'مطالب بیشتر (' + faNum(articles.length - SHOWN) + ')');
        more.addEventListener('click', () => {
          const rows = articles.slice(SHOWN).map(articleLink);
          more.replaceWith(...rows);
          if (rows[0]) rows[0].focus();
        });
        list.appendChild(more);
      }
    } else {
      list = el('div', { class: 'dcp-muted' }, 'مقاله‌ی مرتبطی پیدا نشد.');
    }
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [
        lead, list, papersBlock(papers, back && back.papers),
        articles.length || papers.length ? verdictBox(body.round_id) : null, restart,
      ].filter(Boolean)),
    ]));
    show(trail, lead);
    if (back) window.scrollTo(0, back.scrollY || 0);
    else lead.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    announce(articles.length || papers.length
      ? [articles.length ? faNum(articles.length) + ' مطلب' : '', papers.length ? faNum(papers.length) + ' مقاله‌ی کتابخانه' : '']
        .filter(Boolean).join(' و ') + ' پیدا شد'
        + (body.matched_fa ? '؛ ' + body.matched_fa : '')
      : 'مقاله‌ی مرتبطی پیدا نشد.');
  }

  /**
   * Two buttons, asked at the moment of the result — the only signal that says
   * outright whether the match was right, rather than being inferred from what
   * the reader did next. Two options and not more: every extra choice costs
   * responses. It answers once and then thanks, so a second press cannot
   * double-count and the user is not nagged.
   */
  function verdictBox(roundId) {
    if (!roundId) return null;
    const box = el('div', { class: 'dcp-assist-verdict' });
    const THANKS = 'ممنون — همین بازخورد دفعه‌ی بعد را دقیق‌تر می‌کند.';
    if (voted().includes(roundId)) {
      box.appendChild(el('span', { class: 'dcp-assist-verdict-done' }, THANKS));
      return box;
    }
    const ask = el('span', { class: 'dcp-assist-verdict-q' }, 'این نتیجه به کارت آمد؟');
    const send = (kind) => {
      api.assistantFeedback(roundId, kind).catch(() => {});
      ssSet(VOTES, JSON.stringify([...voted(), roundId].slice(-50)));
      const done = el('span', { class: 'dcp-assist-verdict-done', tabindex: '-1' }, THANKS);
      box.replaceChildren(done);
      // The pressed button is gone: focus the thanks, and say it through the
      // live region, which a screen reader is already listening to.
      done.focus({ preventScroll: true });
      announce(THANKS);
    };
    const yes = el('button', { class: 'dcp-assist-verdict-btn', type: 'button' }, 'به کارم آمد');
    const no = el('button', { class: 'dcp-assist-verdict-btn', type: 'button' }, 'چیزی که می‌خواستم نبود');
    yes.addEventListener('click', () => send('up'));
    no.addEventListener('click', () => send('down'));
    box.append(ask, yes, no);
    return box;
  }

  /**
   * An error keeps the case. «دوباره امتحان کن» re-sends the same round; only
   * «شروع دوباره» clears it. `actions` replaces the retry where retrying cannot
   * help (logged out, no subscription, the hourly limit).
   */
  function errorScreen(message, actions, detail) {
    stopScan();
    const trail = recapTrail(description, history);
    const restart = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'شروع دوباره');
    restart.addEventListener('click', () => showIntro(false));
    let buttons = actions;
    if (!buttons) {
      const retry = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'دوباره امتحان کن');
      retry.addEventListener('click', step);
      buttons = [retry];
    }
    live.textContent = ''; // the alert below speaks; a stale «در حال جست‌وجو» must not
    const msg = el('p', { role: 'alert' }, message);
    const code = detail ? el('p', { class: 'dcp-assist-errcode', dir: 'ltr' }, detail) : null;
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [msg, code, el('div', { class: 'dcp-assist-actions' }, [...buttons, restart])].filter(Boolean)),
    ]));
    show(trail, buttons[0] || restart); // the hourly-limit screen has no retry: focus «شروع دوباره»
  }

  function answer(ans, question, options) {
    history.push({ question, options, answer: ans });
    step();
  }

  /** «انصراف» while waiting: back to the screen the question was asked from. */
  function cancelStep() {
    pending += 1;
    if (!lastStep) { showIntro(true); return; }
    history.pop();
    save();
    render(lastStep);
  }

  function render(body) {
    if (body.done) doneScreen(body);
    else optionsScreen(body);
  }

  async function step() {
    const id = ++pending;
    save(true);
    thinking();
    try {
      const body = await api.assistantNext(description, history);
      if (id !== pending) return; // cancelled, or a newer request owns the screen
      lastStep = body;
      save();
      render(body);
    } catch (e) {
      if (id !== pending) return;
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 401) {
        const login = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود دوباره');
        login.addEventListener('click', async () => {
          const { openLoginModal } = await import('./login-modal.js?v=214');
          const res = await openLoginModal({ returnTo: '/plus/assistant.html' });
          if (res && res.user) step();
        });
        errorScreen('نشستت تمام شده؛ دوباره وارد شو تا همین‌جا ادامه بدهیم.', [login]);
      } else if (status === 402) {
        errorScreen('دستیار هوشمند ویژه‌ی اشتراک پریمیوم است و اشتراکت فعال نیست.', [premiumCta('assistant-lapsed')]);
      } else if (status === 400) {
        errorScreen('شرح کیس خوانده نشد؛ کوتاه‌تر یا کامل‌تر بنویس.');
      } else if (status === 429) {
        const ms = Number(e.body && e.body.retry_after_ms) || 0;
        const mins = Math.max(1, Math.ceil(ms / 60000));
        errorScreen('در این ساعت بیش از حد استفاده شده؛ ' + (ms ? 'حدود ' + faNum(mins) + ' دقیقه‌ی دیگر' : 'کمی بعد') + ' دوباره امتحان کن.', []);
      } else {
        // The code is shown small under the sentence: it is what tells a 500
        // from a timeout from an unreachable API when the founder sends a
        // screenshot, and it costs the reader nothing.
        const why = (e && e.body && (e.body.error || e.body.message)) || (e && (e.name && e.name !== 'Error' ? e.name : e.message)) || '';
        errorScreen('مشکلی پیش اومد؛ دوباره امتحان کن.', null, 'کد: ' + (status || 'network') + (why ? ' · ' + String(why).slice(0, 60) : ''));
      }
    }
  }

  tagLabels(); // warm it while the reader types
  // Pick up a case left mid-way (a reload, or Back from an article it opened).
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SS) || 'null'); } catch (e) { saved = null; }
  if (saved && typeof saved.description === 'string' && saved.description && Array.isArray(saved.history)) {
    description = saved.description;
    history = saved.history;
    lastStep = saved.lastStep || null;
    view = saved.view || null;
    if (!saved.waiting && lastStep && (lastStep.done || Array.isArray(lastStep.options))) render(lastStep);
    else step();
  } else {
    showIntro(false, true);
  }
}
