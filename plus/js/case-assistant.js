// «دستیار هوشمند» (premium): a narrowing WIZARD, not a chat — the user picks
// from a short multiple-choice round (plus a free-text "غیر از این‌ها" escape
// hatch) until the assistant points at real DentCast articles. All state lives
// in this module (the browser); the server is stateless (plus-api's
// /assistant/next re-derives everything from the history sent each call).
import { el } from './util.js';
import { api, ApiError } from './api.js';
import { FOLDER_EN } from './content-index.js';

function articleRow(item) {
  return el('a', { class: 'dcp-pw-step', href: item.url }, [
    el('span', { class: 'dcp-pw-step-marker', 'aria-hidden': 'true' }, '📖'),
    el('div', { class: 'dcp-pw-step-body' }, [
      el('div', { class: 'dcp-pw-step-top' }, el('span', { class: 'dcp-pw-step-kind', dir: 'ltr' }, FOLDER_EN[item.type] || item.type)),
      el('div', { class: 'dcp-pw-step-title' }, item.title),
    ]),
  ]);
}

/** GET /plus/assistant.html — the whole wizard, one screen at a time. */
export function renderCaseAssistant(container) {
  let description = '';
  let history = [];

  function showIntro() {
    description = '';
    history = [];
    const ta = el('textarea', {
      class: 'dcp-input dcp-assist-ta', rows: 4,
      placeholder: 'وضعیت بیمار را با متن آزاد شرح بده؛ مثلاً چه شکایتی دارد و چه چیزی در معاینه دیده‌ای...',
    });
    const err = el('p', { class: 'dcp-inline-msg', hidden: true }, 'اول شرح بیمار را بنویس.');
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'بعدی');
    btn.addEventListener('click', () => {
      const text = ta.value.trim();
      if (!text) { err.hidden = false; return; }
      description = text;
      step();
    });
    container.replaceChildren(el('div', { class: 'dcp-assist-intro' }, [
      el('p', { class: 'dcp-sec-hint' },
        'شرح بده، بعد از بین چند گزینه انتخاب کن تا به مقاله‌ی مرتبط برسیم — نه گفتگوی آزاد، و نه تشخیص یا توصیه‌ی درمانی؛ فقط مسیر به محتوای خودِ سایت.'),
      ta, err, btn,
    ]));
  }

  function loading() {
    container.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بررسی...'));
  }

  function optionsScreen(question, options) {
    const optWrap = el('div', { class: 'dcp-assist-opts' });
    for (const o of options) {
      const b = el('button', { class: 'dcp-btn dcp-assist-opt', type: 'button' }, o.label);
      b.addEventListener('click', () => answer({ key: o.key, label: o.label }, question, options));
      optWrap.appendChild(b);
    }

    const customInput = el('input', { class: 'dcp-input', type: 'text', placeholder: 'توضیح بده...' });
    const customSubmit = el('button', { class: 'dcp-btn', type: 'button' }, 'ثبت');
    const customWrap = el('div', { class: 'dcp-assist-custom', hidden: true }, [customInput, customSubmit]);
    customSubmit.addEventListener('click', () => {
      const text = customInput.value.trim();
      if (!text) return;
      answer({ custom: text }, question, options);
    });
    const customToggle = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'غیر از این‌ها');
    customToggle.addEventListener('click', () => { customWrap.hidden = !customWrap.hidden; });

    container.replaceChildren(el('div', { class: 'dcp-assist-round' }, [
      el('p', { class: 'dcp-assist-q' }, question),
      optWrap,
      customToggle,
      customWrap,
    ]));
  }

  function doneScreen(body) {
    const restart = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'شروع دوباره');
    restart.addEventListener('click', showIntro);
    const head = body.matched_fa
      ? el('p', { class: 'dcp-sec-hint' }, 'نزدیک‌ترین حیطه: ' + body.matched_fa)
      : el('p', { class: 'dcp-sec-hint' }, 'نتیجه‌ی روشنی پیدا نشد؛ دوباره امتحان کن.');
    const list = body.articles.length
      ? el('div', { class: 'dcp-pw-steps' }, body.articles.map(articleRow))
      : el('div', { class: 'dcp-muted' }, 'مقاله‌ی مرتبطی پیدا نشد.');
    container.replaceChildren(el('div', {}, [head, list, restart]));
  }

  function errorScreen(message) {
    const retry = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'دوباره امتحان کن');
    retry.addEventListener('click', showIntro);
    container.replaceChildren(el('div', { class: 'dcp-empty' }, [el('p', {}, message), retry]));
  }

  function answer(ans, question, options) {
    history.push({ question, options, answer: ans });
    step();
  }

  async function step() {
    loading();
    try {
      const body = await api.assistantNext(description, history);
      if (body.done) doneScreen(body);
      else optionsScreen(body.question, body.options);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        errorScreen('در این ساعت بیش از حد استفاده شده؛ کمی بعد دوباره امتحان کن.');
      } else {
        errorScreen('مشکلی پیش اومد؛ دوباره امتحان کن.');
      }
    }
  }

  showIntro();
}
