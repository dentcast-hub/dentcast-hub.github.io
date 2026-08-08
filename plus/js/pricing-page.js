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
import {
  paymentsNeedIrHost, paymentsIrUrl, PLAN_MONTHS, PLAN_PRICES_RIAL, FROM_MONTHLY_RIAL,
  GIFT_CARD,
} from './config.js';
import { premiumBenefits } from './premium-benefits.js';
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
 * nobody can press.
 */
function pickFeatured(plans) {
  const buyable = plans.filter((p) => p.available);
  return buyable.length ? Math.max(...buyable.map((p) => p.months)) : null;
}

/** What one month costs inside a given plan, in rial. */
const monthlyRate = (plan) => plan.amount_rial / plan.months;

/**
 * The reference a discount is measured against: the per-month rate of the
 * SHORTEST term on offer. It is read off the list rather than fixed at "the
 * one-month plan" so the page keeps telling the truth if that plan is ever the
 * one the ceiling takes away.
 */
const baseRate = (plans) => (plans.length
  ? monthlyRate(plans.reduce((a, b) => (a.months <= b.months ? a : b)))
  : 0);

/** How much cheaper per month this plan is than the shortest, in whole percent. */
function savingPercent(plan, base) {
  if (!base) return 0;
  const off = Math.round((1 - monthlyRate(plan) / base) * 100);
  return off > 0 ? off : 0;
}

function planCard(plan, { featured, onPick, selected, base }) {
  const saving = savingPercent(plan, base);

  // The per-month rate, under the total. It is the number that makes the ladder
  // legible: three prices in isolation only say "bigger", and the reason to take
  // six months is that each of its months is the cheapest one we sell. Shown
  // only where it differs from the total, since «۱٬۲۰۰٬۰۰۰ / ماهی ۱٬۲۰۰٬۰۰۰» on
  // the one-month card is noise.
  const price = el('span', { class: 'dcp-plan-price' }, [
    // The «ستون» strikethrough: when the API personalised this plan,
    // list_amount_rial is the price everyone else pays and amount_rial the one
    // this reader will actually be charged. Both shown — a discount nobody can
    // see the size of is indistinguishable from no discount.
    plan.list_amount_rial && plan.list_amount_rial !== plan.amount_rial
      ? el('s', { class: 'dcp-plan-list' }, toman(plan.list_amount_rial))
      : null,
    el('span', {}, [
      toman(plan.amount_rial),
      el('span', { class: 'dcp-plan-unit' }, 'تومان'),
    ]),
    plan.months > 1
      ? el('span', { class: 'dcp-plan-rate' }, `ماهی ${toman(monthlyRate(plan))} تومان`)
      : null,
  ].filter(Boolean));

  const term = el('span', { class: 'dcp-plan-term' }, [
    el('span', { class: 'dcp-plan-head' }, [
      termName(plan.months),
      // ٪ before the number, as everywhere else on the site (dashboard.js,
      // reading-compass.js) — «٪۱۷», never «۱۷٪».
      saving ? el('span', { class: 'dcp-plan-save' }, `٪${toFa(saving)} ارزان‌تر`) : null,
    ].filter(Boolean)),
    featured
      ? el('span', { class: 'dcp-plan-why' }, saving
        ? 'کم‌ترین هزینه‌ی ماهانه، یک بار پرداخت'
        : 'یک بار پرداخت، خیالتان راحت')
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
 * The list itself now lives in premium-benefits.js, because the first-visit
 * popup makes the same pitch and two hand-kept copies of nine sentences drift.
 * (The first draft of this page hand-wrote its own and led with «میز کار»,
 * which every account has had all along.)
 */
function whatYouGet() {
  return el('ul', { class: 'dcp-price-list' }, premiumBenefits().map((f) => el('li', {}, [
    el('strong', {}, f.title), el('span', {}, f.hint),
  ])));
}

/**
 * The out-of-country route: a US Apple gift card, presented AS A PLAN.
 *
 * It used to sit as prose at the bottom of the page, and that was wrong twice
 * over. A reader comparing terms saw three plans and no fourth; and the one
 * thing they most need to know — that a hundred dollars buys ten months — was a
 * sentence rather than a price on a card. So it wears the same card as the rial
 * plans: term on one side, price on the other, read the same way.
 *
 * It is NOT mixed into that list, though. The list is in toman and every card in
 * it is bought with one button; this is a different currency and a different
 * process, and a $100 row sitting between ۳ ماهه and ۶ ماهه would read as a
 * fourth thing to press rather than a different way to pay.
 */
function giftPlanCard(gift) {
  return el('div', { class: 'dcp-plan is-gift' }, [
    el('span', { class: 'dcp-plan-term' }, [
      `${toFa(gift.months)} ماهه`,
      el('span', { class: 'dcp-plan-why' }, 'با گیفت‌کارت اپلِ امریکا'),
    ]),
    el('span', { class: 'dcp-plan-price' }, [
      toFa(gift.amount_usd),
      el('span', { class: 'dcp-plan-unit' }, 'دلار'),
    ]),
  ]);
}

/**
 * The step before the card, and the reason the whole thing hangs together: a
 * button that says the one thing a person abroad already knows about themselves.
 *
 * Someone in Toronto looking at three toman prices and a payment gateway they
 * cannot reach has no way to guess that a route exists for them. They do not
 * search a pricing page for "gift card" — they conclude the product is not sold
 * where they live and close the tab. «خارج از ایران هستم» is findable because it
 * describes the reader, not the mechanism.
 */
function giftToggle(gift, onOpen) {
  const btn = el('button', { class: 'dcp-gift-toggle', type: 'button' }, [
    el('span', { class: 'dcp-gift-toggle-main' }, 'خارج از ایران هستم'),
    el('span', { class: 'dcp-gift-toggle-sub' },
      `${toFa(gift.months)} ماه اشتراک با ${toFa(gift.amount_usd)} دلار گیفت‌کارت`),
  ]);
  btn.addEventListener('click', () => onOpen(btn));
  return btn;
}

function giftIntro(gift, user, onStart, offline) {
  const start = offline
    ? el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', disabled: 'disabled' },
      'در دسترس نیست')
    : el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' },
      user ? 'دریافت کد پیگیری' : 'ورود و دریافت کد پیگیری');
  if (!offline) start.addEventListener('click', () => onStart(start));

  return el('div', { class: 'dcp-gift' }, [
    el('h2', { class: 'dcp-price-h2' }, 'پرداخت از خارج از ایران'),
    giftPlanCard(gift),
    el('p', { class: 'dcp-gift-warn' },
      'حتماً گیفت‌کارت «امریکا» باشد. گیفت‌کارت اپل فقط در اپل‌آیدی همان کشور قابل استفاده است و کارت کشور دیگر به کار نمی‌آید.'),
    start,
    el('p', { class: 'dcp-price-fine' }, offline
      ? 'ارتباط با سرویس برقرار نشد. کمی بعد دوباره امتحان کنید.'
      : 'کد گیفت‌کارت را هیچ‌جای این سایت وارد نمی‌کنید.'),
  ]);
}

/** Once they have a tag: exactly what to do, in order. */
function giftSteps(gift, reference) {
  const steps = [
    [`یک گیفت‌کارت اپلِ امریکا به مبلغ ${toFa(gift.amount_usd)} دلار بخرید`,
      `از آمازون یا هر فروشگاه معتبر دیگری. حتماً نسخه‌ی امریکا. برابر ${toFa(gift.months)} ماه اشتراک است.`],
    ['گیرنده را این ایمیل بگذارید', gift.recipient_email],
    ['کد پیگیری بالا را در «پیام هدیه» بنویسید',
      'همین یک خط است که مشخص می‌کند کارت از طرف شماست.'],
    ['تمام — تا ۲۴ ساعت بررسی و فعال می‌شود',
      'نتیجه همین‌جا و در پیشخوان شما دیده می‌شود.'],
  ];
  return el('div', { class: 'dcp-gift' }, [
    el('h2', { class: 'dcp-price-h2' }, 'مراحل'),
    giftPlanCard(gift),
    el('div', { class: 'dcp-gift-ref' }, [
      el('span', { class: 'dcp-gift-ref-label' }, 'کد پیگیری'),
      el('code', { class: 'dcp-gift-ref-code' }, reference),
    ]),
    el('ol', { class: 'dcp-gift-steps' }, steps.map(([t, d]) => el('li', {}, [
      el('strong', {}, t), d ? el('span', {}, d) : null,
    ].filter(Boolean)))),
    el('p', { class: 'dcp-gift-warn' },
      'بدون نوشتن کد پیگیری در پیام هدیه، کارت به حساب شما وصل نمی‌شود.'),
  ]);
}

/** After the founder has answered. */
function giftStatus(r) {
  if (r.status === 'approved') {
    return el('div', { class: 'dcp-price-notice is-ok' }, [
      el('b', {}, 'گیفت‌کارت شما تأیید شد'), el('p', {}, 'اشتراک شما فعال است.')]);
  }
  if (r.status === 'rejected') {
    return el('div', { class: 'dcp-price-notice is-warn' }, [
      el('b', {}, 'گیفت‌کارت تأیید نشد'),
      el('p', {}, r.note || 'برای پیگیری با ما تماس بگیرید.')]);
  }
  return null;
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
  const params = new URLSearchParams(location.search);
  const from = params.get('from') || '';
  // A plan chosen on the OTHER host. The rial gateway lives on .ir, so a visitor
  // who picked «شش ماهه» on .org has to cross domains to pay — and arriving to
  // find the choice reset to the default is how a two-host purchase starts
  // feeling like two purchases.
  const asked = Number(params.get('plan'));

  // What we can say without asking anyone. The API refines this below; it does
  // not gate it. A page whose entire content sits behind a network call shows an
  // error instead of a price every time that call is slow, blocked, or — as on
  // the day this shipped — simply not deployed yet.
  const fallback = {
    enabled: false,
    from_monthly_rial: FROM_MONTHLY_RIAL,
    any_plan_available: true,
    plans: PLAN_MONTHS.map((months) => ({
      months, amount_rial: PLAN_PRICES_RIAL[months], available: true, blocked_by: null,
    })),
    // Present in the fallback, not only in the live answer. Leaving it out is
    // what made the whole out-of-country section vanish whenever the API was
    // unreachable — for the one group of people who have no other way to pay.
    gift_card: GIFT_CARD,
    offline: true,
  };

  const [live, user] = await Promise.all([
    api.payPlans().catch(() => null),
    currentUser().catch(() => null),
  ]);
  // The server's answer wins wherever it exists; where it does not, the page is
  // still the page.
  const info = live ? { ...live, offline: false } : fallback;

  // A founder has nothing to buy here; say so and send them back rather than
  // showing a price list that means nothing to them.
  if (user && user.subscription && user.subscription.is_founder) {
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'اشتراک شما مادام‌العمر است.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/' }, 'رفتن به پیشخوان'),
    ]));
    return;
  }

  const needIr = paymentsNeedIrHost();
  const featured = pickFeatured(info.plans);
  let selected = info.plans.some((p) => p.months === asked && p.available) ? asked : featured;

  const msg = el('p', { class: 'dcp-price-msg' });
  const action = el('div', { class: 'dcp-price-action' });
  const grid = el('div', { class: 'dcp-plans' });

  const base = baseRate(info.plans);

  const drawPlans = () => {
    grid.replaceChildren(...info.plans.map((p) => planCard(p, {
      featured: p.months === featured,
      selected: p.months === selected,
      base,
      onPick: (m) => { selected = m; drawPlans(); drawAction(); },
    })));
  };

  /** The same page on .ir, carrying the plan they just picked and where from. */
  const irPricingUrl = () => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (selected) qs.set('plan', String(selected));
    const tail = qs.toString();
    return paymentsIrUrl('/plus/pricing.html' + (tail ? `?${tail}` : ''));
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
    // The rial gateway is registered to dentcast.ir and cannot complete a
    // payment anywhere else. Said here rather than by bouncing the whole page,
    // because the gift-card route below works perfectly well on this host and
    // bouncing would take it away from exactly the people it is for.
    if (needIr) {
      action.replaceChildren(
        el('a', { class: 'dcp-btn dcp-btn-primary', href: irPricingUrl() },
          'پرداخت ریالی در dentcast.ir'),
        el('p', { class: 'dcp-price-fine' },
          'درگاه ریالی به دامنه‌ی dentcast.ir ثبت شده است. همان طرح و همان قیمت آنجا '
          + 'باز می‌شود؛ چون دامنه فرق دارد، یک بار همان‌جا وارد می‌شوید و پرداخت را '
          + 'تمام می‌کنید. اشتراک روی همان حساب فعال می‌شود و در هر دو سایت کار می‌کند.'),
      );
      return;
    }
    if (info.offline) {
      // Prices shown, purchase not attemptable: saying "buy" and then failing
      // is worse than saying we cannot reach the payment service right now.
      action.replaceChildren(
        el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', disabled: 'disabled' },
          'در دسترس نیست'),
        el('p', { class: 'dcp-price-fine' },
          'ارتباط با سرویس پرداخت برقرار نشد. کمی بعد دوباره امتحان کنید.'),
      );
      return;
    }
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
    // «از ماهی …», not «هر ماه …»: the terms no longer cost the same per month,
    // so a single monthly figure would be true of one card and wrong about the
    // other two. `monthly_rial` is the old name of the same number, still read
    // here for an API that has not been redeployed yet.
    el('p', { class: 'dcp-price-sub' },
      `از ماهی ${toman(info.from_monthly_rial || info.monthly_rial)} تومان — `
      + 'هرچه مدت بلندتر، ماه ارزان‌تر.'),
    el('p', { class: 'dcp-price-sub' },
      'شش ابزار برای اینکه آنچه می‌خوانید بماند و به کارتان بیاید، و سایتی بدون تبلیغ.'),
  ];

  const notices = [];
  if (info.offline) {
    // Deliberately silent here: "the gateway is not active yet" would be a
    // claim, and when we could not reach the server we do not have one. The
    // action area says the true thing — that we could not ask.
  } else if (!info.enabled) {
    notices.push(notice('off', 'درگاه پرداخت هنوز فعال نیست'));
  } else if (!info.any_plan_available) {
    notices.push(notice('warn', 'ظرفیت فروش این ماه تکمیل شده است',
      'از اول ماه آینده دوباره باز می‌شود. اشتراک فعلی شما تحت تأثیر نیست.'));
  } else if (info.plans.some((p) => !p.available)) {
    notices.push(notice('warn', 'ظرفیت این ماه رو به پایان است',
      'طرح‌های بلندتر در سقف این ماه جا نمی‌شوند؛ طرح‌های کوتاه‌تر در دسترس‌اند.'));
  }

  // A «ستون» seat-holder's prices are already 20% down, silently — and a
  // discount that does not say why it is there reads as a pricing mistake.
  // ٪ before the number, as everywhere else on the site.
  if (info.pillar_discount) {
    notices.push(notice('ok', 'تخفیف دائمی «ستون» فعال است',
      `به‌عنوان یکی از پنجاه خریدار اول، همه‌ی قیمت‌های این صفحه برای شما `
      + `٪${toFa(info.pillar_discount.percent)} ارزان‌تر محاسبه شده‌اند — همیشه و در هر قیمتی.`));
  }

  // An existing subscriber is buying MORE time, not a first subscription — and
  // it must be clear that the days they already hold are added to, not replaced.
  if (user && user.subscription && user.subscription.expires_on) {
    notices.push(notice('ok', 'شما اشتراک فعال دارید',
      'مدت تازه به انتهای اشتراک فعلی اضافه می‌شود؛ روزهای باقی‌مانده از بین نمی‌رود.'));
  }

  drawPlans();
  drawAction();

  // --- the out-of-country rail ----------------------------------------------
  // Independent of everything above: no Zibal, no monthly ceiling, no .ir. It
  // sits directly under the rial plans rather than at the foot of the page,
  // because it is an ALTERNATIVE to them and belongs where the choice is made.
  const giftWrap = el('div', {});
  const gift = info.gift_card;

  const drawGift = (claim, opened) => {
    if (!gift) { giftWrap.replaceChildren(); return; }

    if (claim && claim.status === 'pending') {
      giftWrap.replaceChildren(giftSteps(gift, claim.reference));
      return;
    }
    const done = claim ? giftStatus(claim) : null;

    // Collapsed behind one button on .ir, where almost every visitor pays in
    // rial and this would be noise — and open from the start where the rial
    // gateway cannot serve them anyway, because there it is the only route.
    if (!opened && !needIr) {
      giftWrap.replaceChildren(...[done, giftToggle(gift, () => drawGift(claim, true))]
        .filter(Boolean));
      return;
    }

    giftWrap.replaceChildren(...[done, giftIntro(gift, user, async (btn) => {
      if (!user) {
        const res = await openLoginModal({ returnTo: location.pathname + location.search });
        if (res && res.user) location.reload();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'در حال ثبت…';
      try {
        const r = await api.giftStart();
        drawGift({ status: 'pending', reference: r.reference }, true);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'دریافت کد پیگیری';
        msg.textContent = (err && err.message) || 'ثبت درخواست انجام نشد.';
      }
    }, info.offline)].filter(Boolean));
  };

  drawGift(null, false);
  // A returning buyer must land on their own tag, not on a button that would
  // mint a second one.
  if (gift && user) {
    api.giftStatus()
      .then((r) => { if (r && r.redemption) drawGift(r.redemption, true); })
      .catch(() => {});
  }

  root.replaceChildren(el('div', { class: 'dcp-pricing' }, [
    ...head, ...notices, grid, action, giftWrap,
    el('h2', { class: 'dcp-price-h2' }, 'با پریمیوم چه چیزی اضافه می‌شود'),
    whatYouGet(),
  ]));

  if (from && window.gtag) window.gtag('event', 'pricing_view', { from });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
