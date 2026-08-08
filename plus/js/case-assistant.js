// «دستیار هوشمند» (premium): a narrowing WIZARD, not a chat — the user picks
// from a short multiple-choice round (plus a free-text "غیر از این‌ها" escape
// hatch) until the assistant points at real DentCast articles. All state lives
// in this module (the browser); the server is stateless (plus-api's
// /assistant/next re-derives everything from the history sent each call).
// Visual language borrows the shape of a real AI product (a spark mark on
// every assistant turn, a typing indicator while waiting, a recap trail of
// the case + past answers) without becoming free-form chat - see
// dcp-assist-* in plus-pages.css.
import { el, faNum } from './util.js';
import { api, ApiError } from './api.js';
import { FOLDER_EN, getModel } from './content-index.js';
import { quotaStrip, quotaWall, isQuotaError, quotaOf } from './quota.js';

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
      el('div', { class: 'dcp-assist-recap-case' }, description),
    ]));
  }
  for (const h of history) {
    wrap.appendChild(el('div', { class: 'dcp-assist-recap' }, [
      el('span', { class: 'dcp-assist-recap-text' }, h.question),
      el('span', { class: 'dcp-assist-recap-answer' }, '✓ ' + answerLabel(h.answer)),
    ]));
  }
  return wrap;
}

function articleRow(item, roundId) {
  const row = el('a', { class: 'dcp-pw-step', href: item.url }, [
    el('span', { class: 'dcp-pw-step-marker', 'aria-hidden': 'true' }, '📖'),
    el('div', { class: 'dcp-pw-step-body' }, [
      el('div', { class: 'dcp-pw-step-top' }, el('span', { class: 'dcp-pw-step-kind', dir: 'ltr' }, FOLDER_EN[item.type] || item.type)),
      el('div', { class: 'dcp-pw-step-title' }, item.title),
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

/** GET /plus/assistant.html — the whole wizard, one screen at a time. */
export function renderCaseAssistant(container) {
  let scanTimer = null;
  const stopScan = () => { if (scanTimer) { window.clearInterval(scanTimer); scanTimer = null; } };
  let description = '';
  let history = [];

  function showIntro() {
    stopScan();
    description = '';
    history = [];
    const ta = el('textarea', {
      rows: 3,
      placeholder: 'وضعیت بیمار را با متن آزاد شرح بده؛ مثلاً چه شکایتی دارد و چه چیزی در معاینه دیده‌ای...',
    });
    const err = el('p', { class: 'dcp-inline-msg', hidden: true }, 'اول شرح بیمار را بنویس.');
    const send = sendButton('dcp-assist-composer-send');
    send.addEventListener('click', () => {
      const text = ta.value.trim();
      if (!text) { err.hidden = false; return; }
      description = text;
      step();
    });
    container.replaceChildren(el('div', { class: 'dcp-assist-intro' }, [
      el('p', { class: 'dcp-sec-hint' }, 'شرح بده، بعد از بین چند گزینه انتخاب کن تا به مقاله‌ی مرتبط برسیم.'),
      el('div', { class: 'dcp-assist-composer' }, [ta, send]),
      err,
      el('p', { class: 'dcp-assist-disclaimer' },
        'ⓘ نه گفتگوی آزاد، و نه تشخیص یا توصیه‌ی درمانی؛ فقط مسیر به محتوای خودِ سایت.'),
    ]));
  }

  /**
   * While it thinks, show what it is actually doing: real site hashtags,
   * drifting past at reading pace.
   *
   * The round takes 20-40s on the current gateway, and three bouncing dots for
   * that long reads as "stuck". These are the REAL tags from the site's own
   * index (already loaded in the browser) and the search really is a match
   * against them — so this is a window onto the work, not a fake progress bar.
   * Nothing invented: if the index has not loaded, the line just stays quiet.
   */
  function thinking() {
    stopScan();
    const trail = recapTrail(description, history);
    const label = el('div', { class: 'dcp-assist-scan-lbl' }, 'دارم هشتگ‌های سایت را می‌خوانم…');
    const stream = el('div', { class: 'dcp-assist-scan' });
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [
        label,
        stream,
        el('div', { class: 'dcp-assist-thinking' }, [el('span'), el('span'), el('span')]),
      ]),
    ]));
    container.replaceChildren(trail);
    startScan(stream);
  }

  /** Drift real tags through `node` until the answer arrives. */
  function startScan(node) {
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    getModel().then((model) => {
      const tags = (model.tags || []).map((t) => t.fa).filter(Boolean);
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

  function optionsScreen(question, options) {
    stopScan();
    const trail = recapTrail(description, history);

    const optWrap = el('div', { class: 'dcp-assist-opts' });
    for (const o of options) {
      const b = el('button', { class: 'dcp-assist-opt', type: 'button' }, o.label);
      b.addEventListener('click', () => answer({ key: o.key, label: o.label }, question, options));
      optWrap.appendChild(b);
    }

    const customInput = el('input', { type: 'text', placeholder: 'توضیح بده...' });
    const customSend = sendButton('dcp-assist-send');
    const customRow = el('div', { class: 'dcp-assist-custom', hidden: true }, [customInput, customSend]);
    customSend.addEventListener('click', () => {
      const text = customInput.value.trim();
      if (!text) return;
      answer({ custom: text }, question, options);
    });
    const moreBtn = el('button', { class: 'dcp-assist-more', type: 'button' }, 'غیر از این‌ها');
    moreBtn.addEventListener('click', () => { customRow.hidden = !customRow.hidden; });

    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, el('p', { class: 'dcp-assist-q' }, question)),
    ]));
    trail.appendChild(optWrap);
    trail.appendChild(el('div', { class: 'dcp-assist-opts' }, moreBtn));
    trail.appendChild(customRow);
    container.replaceChildren(trail);
  }

  function doneScreen(body) {
    stopScan();
    const trail = recapTrail(description, history);
    const restart = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'شروع دوباره');
    restart.addEventListener('click', showIntro);
    const lead = el('p', { class: 'dcp-assist-result-lead' },
      body.matched_fa ? 'نزدیک‌ترین حیطه: ' + body.matched_fa : 'نتیجه‌ی روشنی پیدا نشد؛ دوباره امتحان کن.');
    const list = body.articles.length
      ? el('div', { class: 'dcp-pw-steps' }, body.articles.map((a) => articleRow(a, body.round_id)))
      : el('div', { class: 'dcp-muted' }, 'مقاله‌ی مرتبطی پیدا نشد.');
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [lead, list, verdictBox(body.round_id), restart]),
    ]));
    container.replaceChildren(trail);
  }

  /**
   * Two buttons, asked at the moment of the result — the only signal that says
   * outright whether the match was right, rather than being inferred from what
   * the reader did next. Two options and not more: every extra choice costs
   * responses. It answers once and then thanks, so a second press cannot
   * double-count and the user is not nagged.
   */
  function verdictBox(roundId) {
    if (!roundId) return el('div', { hidden: 'hidden' });
    const box = el('div', { class: 'dcp-assist-verdict' });
    const ask = el('span', { class: 'dcp-assist-verdict-q' }, 'این نتیجه به کارت آمد؟');
    const send = (kind) => {
      api.assistantFeedback(roundId, kind).catch(() => {});
      box.replaceChildren(el('span', { class: 'dcp-assist-verdict-done' }, 'ممنون — همین بازخورد دفعه‌ی بعد را دقیق‌تر می‌کند.'));
    };
    const yes = el('button', { class: 'dcp-assist-verdict-btn', type: 'button' }, 'به کارم آمد');
    const no = el('button', { class: 'dcp-assist-verdict-btn', type: 'button' }, 'چیزی که می‌خواستم نبود');
    yes.addEventListener('click', () => send('up'));
    no.addEventListener('click', () => send('down'));
    box.append(ask, yes, no);
    return box;
  }

  function errorScreen(message) {
    stopScan();
    const trail = recapTrail(description, history);
    const retry = el('button', { class: 'dcp-assist-restart', type: 'button' }, 'دوباره امتحان کن');
    retry.addEventListener('click', showIntro);
    trail.appendChild(el('div', { class: 'dcp-assist-turn' }, [
      sparkAvatar(true),
      el('div', { class: 'dcp-assist-card' }, [el('p', {}, message), retry]),
    ]));
    container.replaceChildren(trail);
  }

  function answer(ans, question, options) {
    history.push({ question, options, answer: ans });
    step();
  }

  async function step() {
    thinking();
    try {
      const body = await api.assistantNext(description, history);
      if (body.done) doneScreen(body);
      else optionsScreen(body.question, body.options);
      // Only ever after a delivered round, and only for a metered reader. The
      // count is of CASES, not rounds — narrowing the case in hand is free, so
      // showing it mid-wizard would otherwise read as a countdown on the
      // questions being asked right now.
      const strip = quotaStrip(body.quota, 'assistant-quota');
      if (strip) container.prepend(strip);
    } catch (e) {
      if (isQuotaError(e)) {
        // Out of free cases. Whatever the reader already reached stays where it
        // is — this replaces the wizard, not the answers above it.
        container.replaceChildren(quotaWall(quotaOf(e), 'assistant-quota'));
      } else if (e instanceof ApiError && e.status === 429) {
        errorScreen('در این ساعت بیش از حد استفاده شده؛ کمی بعد دوباره امتحان کن.');
      } else {
        errorScreen('مشکلی پیش اومد؛ دوباره امتحان کن.');
      }
    }
  }

  showIntro();
}
