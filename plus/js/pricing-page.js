// /plus/pricing.html — the public price list, and the only place a subscription
// is bought.
//
// PUBLIC ON PURPOSE, and it renders the prices before it knows who is looking:
// asking someone to create an account before they can see what it costs is how
// you lose the person who was about to pay. Signing in only becomes necessary at
// the moment of purchase, which is the first moment it is actually needed.
//
// Three things can each make a plan unbuyable, and they are NOT the same thing:
//   - the gateway is not live yet (config flag) -> every plan is dark
//   - the month's regulatory ceiling has no room for THAT plan -> that one is dark
//   - the visitor is not signed in -> the button signs them in first
// Each says something different, because a customer who is told the wrong
// reason goes away for good.
import { el } from './util.js';
import { api, currentUser } from './api.js';
import { openLoginModal } from './login-modal.js';
import { PREMIUM_FEATURES } from './config.js';
import { registerSW } from './pwa.js';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (s) => String(s).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** Rial in, "۶٬۰۰۰٬۰۰۰" out — the site quotes toman, the API speaks rial. */
function toman(rial) {
  return toFa(Math.round(rial / 10).toLocaleString('en-US').replace(/,/g, '٬'));
}

const TERM = { 1: 'یک ماهه', 3: 'سه ماهه', 6: 'شش ماهه', 12: 'دوازده ماهه' };
const termName = (m) => TERM[m] || `${toFa(m)} ماهه`;

/**
 * Which plan is highlighted: the longest one still buyable.
 *
 * Not a hardcoded "6", because the month's ceiling can take the six-month plan
 * away — and when it does, the highlight has to move rather than sit on a card
 * nobody can press. There is no discount to advertise (every month costs the
 * same), so the label says what the longer plan actually buys: not thinking
 * about it again for a while.
 */
function pickFeatured(plans) {
  const buyable = plans.filter((p) => p.available);
  return buyable.length ? Math.max(...buyable.map((p) => p.months)) : null;
}

function planCard(plan, { featured, onPick, selected }) {
  const price = el('span', { class: 'dcp-plan-price' }, [
    toman(plan.amount_rial),
    el('span', { class: 'dcp-plan-unit' }, 'تومان'),
  ]);

  const term = el('span', { class: 'dcp-plan-term' }, [
    termName(plan.months),
    featured
      ? el('span', { class: 'dcp-plan-why' }, 'یک بار پرداخت، خیالتان راحت')
      : null,
    !plan.available
      ? el('span', { class: 'dcp-plan-blocked' },
        plan.blocked_by === 'count'
          ? 'ظرفیت این ماه تکمیل شده است'
          : 'در ظرفیت این ماه جا نمی‌شود')
      : null,
  ].filter(Boolean));

  const card = el('button', {
    type: 'button',
    class: 'dcp-plan'
      + (featured ? ' is-featured' : '')
      + (selected ? ' is-selected' : '')
      + (plan.available ? '' : ' is-blocked'),
    'aria-pressed': selected ? 'true' : 'false',
    disabled: plan.available ? null : 'disabled',
  }, [
    featured ? el('span', { class: 'dcp-plan-tag' }, 'پیشنهاد ما') : null,
    term,
    price,
  ].filter(Boolean));

  if (plan.available) card.addEventListener('click', () => onPick(plan.months));
  return card;
}

/**
 * WHAT PREMIUM ADDS.
 *
 * The NAMES come from PREMIUM_FEATURES — the list the dashboard and the
 * league-prize banner already read, kept in step with the API's copy by a test.
 * That is the thing which must never drift: a price list quietly naming a
 * feature the product no longer calls that is worse than no list. (The first
 * draft of this page hand-wrote its own and led with «میز کار», which every
 * account has had all along.)
 *
 * The SENTENCES are written here rather than reused, because those hints are
 * in-product tooltips and speak the dashboard's casual voice — «بریز», «بخون».
 * That voice is right beside a button someone already paid for and wrong on the
 * page asking them for a million toman. Same features, register to match the
 * moment.
 *
 * Keyed by title with a fallback to the shared hint, so a feature added to the
 * canonical list still appears here — described in its own words rather than
 * silently dropped from the thing people are paying against.
 */
const PITCH = {
  'برای مرور امروز': 'هر هایلایت درست وقتی برمی‌گردد که در آستانه‌ی فراموش‌شدن است — نه زودتر، نه دیرتر.',
  'مسیر یادگیری': 'مسیرهای آماده، از پیش‌نیاز تا پیشرفته و به ترتیب درست؛ لازم نیست خودتان ترتیب را کشف کنید.',
  'کالکشن‌ها': 'هایلایت‌ها و مقاله‌ها را در پوشه‌های خودتان دسته‌بندی کنید — مستقل از موضوع‌بندی سایت.',
  'قطب‌نمای مطالعه': 'نشان می‌دهد در هر حوزه کجا ایستاده‌اید و کدام بخش هنوز از دیدتان دور مانده است.',
  'دستیار هوشمند': 'شرح کیس را می‌نویسید و با چند پرسش کوتاه به مرتبط‌ترین مطالب همین‌جا می‌رسید.',
  'دفترچه‌ی هایلایت‌ها': 'همه‌ی هایلایت‌هایتان یکجا، با یادداشت‌ها و جستجو — نه فقط داخل تک‌تک مقاله‌ها.',
};

/**
 * Two real perks with no dashboard section of their own, so they are not in the
 * canonical array: ads (spot.js renders nothing at all for a premium visitor)
 * and the timing of new-article notifications. The ARTICLE is public to
 * everyone the moment it goes up and is never gated — what premium buys is
 * hearing about it at publish instead of in the next evening's digest.
 */
const EXTRA_PERKS = [
  { title: 'بدون تبلیغ', hint: 'هیچ تبلیغی، در هیچ صفحه‌ای.' },
  { title: 'خبرِ مطلب تازه، همان لحظه', hint: 'به‌جای خلاصه‌ی شبانه‌ی روز بعد. خودِ مطلب برای همه از لحظه‌ی انتشار باز است.' },
];

function whatYouGet() {
  const items = [
    ...PREMIUM_FEATURES.map((f) => ({ title: f.title, hint: PITCH[f.title] || f.hint })),
    ...EXTRA_PERKS,
  ];
  return el('div', {}, [
    el('ul', { class: 'dcp-price-list' }, items.map((f) => el('li', {}, [
      el('strong', {}, f.title), el('span', {}, f.hint),
    ]))),
    // The boundary, said plainly. Premium does not sell access to your own
    // work — highlighting, notes and the in-article workbench are on every
    // account and stay there. What it sells is the tools that work ACROSS all
    // of it. Saying so is also the honest answer to "what am I paying for".
    el('p', { class: 'dcp-price-note' },
      'هایلایت، یادداشت و میز کارِ داخل مقاله روی همه‌ی حساب‌ها فعال است و فعال می‌ماند. '
      + 'پریمیوم دسترسی به کارِ خودتان را نمی‌فروشد؛ ابزارهایی را اضافه می‌کند که روی همه‌ی آن با هم کار می‌کنند.'),
  ]);
}

function notice(kind, title, body) {
  return el('div', { class: `dcp-price-notice is-${kind}` }, [
    el('b', {}, title),
    body ? el('p', {}, body) : null,
  ].filter(Boolean));
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  // Which gate sent them here — so we can learn what people actually pay for.
  const from = new URLSearchParams(location.search).get('from') || '';

  root.replaceChildren(el('p', { class: 'dcp-muted' }, 'در حال بارگذاری…'));

  // The price list and the visitor load together; neither waits on the other.
  const [info, user] = await Promise.all([
    api.payPlans().catch(() => null),
    currentUser().catch(() => null),
  ]);

  if (!info) {
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'فهرست اشتراک‌ها در دسترس نیست.'),
      el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button',
        onclick: () => location.reload() }, 'تلاش دوباره'),
    ]));
    return;
  }

  // A founder has nothing to buy here; say so and send them back rather than
  // showing a price list that means nothing to them.
  if (user && user.subscription && user.subscription.is_founder) {
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'اشتراک شما مادام‌العمر است.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
    ]));
    return;
  }

  const featured = pickFeatured(info.plans);
  let selected = featured;

  const msg = el('p', { class: 'dcp-price-msg' });
  const action = el('div', { class: 'dcp-price-action' });
  const grid = el('div', { class: 'dcp-plans' });

  const drawPlans = () => {
    grid.replaceChildren(...info.plans.map((p) => planCard(p, {
      featured: p.months === featured,
      selected: p.months === selected,
      onPick: (m) => { selected = m; drawPlans(); },
    })));
  };

  const buy = async () => {
    msg.textContent = '';
    // Sign-in is asked for HERE, not at the door: they have now chosen a plan,
    // so the interruption is one they understand the reason for.
    let who = user;
    if (!who) {
      const res = await openLoginModal({ returnTo: location.pathname + location.search });
      if (!res || !res.user) return;
      location.reload();
      return;
    }
    const btn = action.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'در حال اتصال به درگاه…'; }
    try {
      const res = await api.payStart(selected);
      // Leave for the bank. No success message here — nothing has happened yet.
      location.href = res.redirect_url;
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'پرداخت و فعال‌سازی'; }
      msg.textContent = (err && err.message) || 'ارتباط با درگاه برقرار نشد.';
    }
  };

  const drawAction = () => {
    if (!info.enabled) {
      action.replaceChildren(
        el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', disabled: 'disabled' },
          'هنوز فعال نیست'),
        el('p', { class: 'dcp-price-fine' },
          'زمان فعال شدن، از کانال تلگرام دنت‌کست اعلام می‌شود.'),
      );
      return;
    }
    if (!info.any_plan_available) {
      action.replaceChildren(el('p', { class: 'dcp-price-fine' },
        'باز شدن ظرفیت از کانال تلگرام دنت‌کست اعلام می‌شود.'));
      return;
    }
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary dc-plus-cta', type: 'button' },
      user ? 'پرداخت و فعال‌سازی' : 'ورود و پرداخت');
    btn.addEventListener('click', buy);
    action.replaceChildren(btn, msg, el('p', { class: 'dcp-price-fine' },
      'پرداخت امن از طریق درگاه زیبال'));
  };

  const head = [
    el('h1', { class: 'dcp-price-title' }, 'اشتراک پریمیوم'),
    el('p', { class: 'dcp-price-sub' },
      `هر ماه ${toman(info.monthly_rial)} تومان — مدتش را خودتان انتخاب کنید.`),
    el('p', { class: 'dcp-price-sub' },
      'شش ابزار برای اینکه آنچه می‌خوانید بماند و به کارتان بیاید، و سایتی بدون تبلیغ.'),
  ];

  const notices = [];
  if (!info.enabled) {
    notices.push(notice('off', 'درگاه پرداخت هنوز فعال نیست'));
  } else if (!info.any_plan_available) {
    notices.push(notice('warn', 'ظرفیت فروش این ماه تکمیل شده است',
      'از اول ماه آینده دوباره باز می‌شود. اشتراک فعلی شما تحت تأثیر نیست.'));
  } else if (info.plans.some((p) => !p.available)) {
    notices.push(notice('warn', 'ظرفیت این ماه رو به پایان است',
      'طرح‌های بلندتر در سقف این ماه جا نمی‌شوند؛ طرح‌های کوتاه‌تر در دسترس‌اند.'));
  }

  // An existing subscriber is buying MORE time, not a first subscription — and
  // it must be clear that the days they already hold are added to, not replaced.
  if (user && user.subscription && user.subscription.expires_on) {
    notices.push(notice('ok', 'شما اشتراک فعال دارید',
      'مدت تازه به انتهای اشتراک فعلی اضافه می‌شود؛ روزهای باقی‌مانده از بین نمی‌رود.'));
  }

  drawPlans();
  drawAction();

  root.replaceChildren(el('div', { class: 'dcp-pricing' }, [
    ...head, ...notices, grid, action,
    el('h2', { class: 'dcp-price-h2' }, 'با پریمیوم چه چیزی اضافه می‌شود'),
    whatYouGet(),
  ]));

  if (from && window.gtag) window.gtag('event', 'pricing_view', { from });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
