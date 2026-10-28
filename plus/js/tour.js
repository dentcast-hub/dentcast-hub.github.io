// DentCast site tour (guided walkthrough) — mobile homepage, phase 1.
// A spotlight overlay walks the user through the homepage: everything dims
// except the current element (four dim strips leave it a bright "hole"), with an
// explanation card placed above/below it (whichever side has room, so the card
// and the highlighted element overlap as little as possible). It covers three
// of the four bottom-nav panels — خانه, آرشیو, پریمیوم — switching between them
// via the real bottom-nav items; بیماران is named on the bottom-nav stop.
// Whatever a subscription buys is marked on its card, and the پریمیوم stops show
// the tab as a subscriber sees it (a labelled sample for everyone else).
//
// Triggers:
//  1. AUTO — first login ever, account-scoped: /me `settings.tour_seen` is
//     0/absent -> offer the tour once, and PATCH it to 1 the moment the offer
//     appears, so it never auto-shows again on ANY device (the flag lives in
//     the account, not localStorage).
//  2. MANUAL — «راهنمای سایت» in the header person menu (logged-in), any time.
//     On a non-home page it navigates to /?tour=1 and starts there.
import { el, faNum, tehranDay } from './util.js?v=213';
import { api, currentUser } from './api.js?v=213';
import { pricingHref } from './premium-cta.js?v=213';
import { maybeShowNotifPrompt } from './notif-prompt.js?v=213';

const SS_PENDING = 'dcp:tour:pending'; // set before navigating home to start there

// ---------------------------------------------------------------- guards ----
function isHomePage() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  return p === '/' || p === '/index' || p === '/index.html';
}
// Phase 1 is the mobile shell only; the desktop 3-column app has different
// anchors and gets its own stop map later.
function isMobileUi() {
  return !document.body.classList.contains('dc-desktop-ui');
}
export function tourMenuAvailable() {
  return isMobileUi();
}

function visible(elm) {
  return !!elm && elm.getClientRects().length > 0;
}
// The homepage ships duplicate chrome (mobile + desktop topbars); pick the
// rendered one.
function visibleOne(selector) {
  return Array.from(document.querySelectorAll(selector)).find(visible) || null;
}
function byId(id) { return document.getElementById(id); }
function track(name, params) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (_) { /* ignore */ }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------- stops ----
// `targets` returns the element(s) to spotlight (multiple -> union rect).
// A stop whose anchors are missing/invisible is skipped silently (some are
// injected async by Plus itself, some only exist for one kind of reader). `panel`
// is the mobile panel that must be active first; `enter` runs before the panel
// switch; `skip(ctx)` drops a stop that cannot apply to this reader, so the
// «N از M» counter never jumps. The final stop has no target: full dim +
// centered card.
//
// Stops follow the DOM order of each panel, top to bottom, so the tour only
// ever scrolls forward. `text` may be a function of the reader context
// (`ctx.live` = premium subscriber, `ctx.guest` = not signed in). `premium`
// marks what a subscription buys: 'all' (the whole stop) or 'part' (the text
// names which part) — the card then carries an amber badge, the site's one
// colour for «this is what premium buys».
const q = (sel) => document.querySelector(sel);

const STOPS = [
  // ── خانه ─────────────────────────────────────────────────────────────────
  {
    key: 'header', panel: 'panel-studio', title: 'هدر دنت‌کست',
    text: 'این نوار همیشه بالای صفحه است: لوگو شما را به خانه برمی‌گرداند و ذره‌بین، جستجوی سراسری در همه‌ی بخش‌های دنت‌کست است. دکمه‌ی ☰ جعبه‌ابزار را باز می‌کند: نصب اپلیکیشن، مشاوره، اشتراک، درباره، رادار، جستجو، تغییر تم، موسیقی و کتابخانه.',
    targets: () => [visibleOne('.dc-topbar')],
  },
  {
    key: 'account', panel: 'panel-studio', title: 'حساب شما',
    text: (ctx) => (ctx.guest
      ? 'آدمک، درِ ورود است. با یک حساب رایگان، همین‌جا «پیشخوان» (خلاصه‌ی یادگیری‌تان)، «پروفایل» (با «افتخارات» و دیوار «گواهی‌نامه‌ها») و «اطلاعیه‌ها» باز می‌شود — هر انتشار تازه همان لحظه آن‌جا می‌نشیند — و کنار آدمک شعله‌ی استریک یادگیری‌تان روشن می‌شود.'
      : 'آدمک، حسابِ شماست: «پیشخوان» (خلاصه‌ی یادگیری‌تان)، «پروفایل» (با «افتخارات» و دیوار «گواهی‌نامه‌ها»)، «اطلاعیه‌ها» — هر انتشار و خبر تازه همان لحظه آن‌جا می‌نشیند و نقطه‌ی روی آدمک خبرش را می‌دهد — و «راهنمای سایت» که همین تور را دوباره اجرا می‌کند. شعله‌ی کنارش استریک یادگیری شماست؛ هر روزی که بخوانید یا مرور کنید روشن می‌ماند.'),
    targets: () => [visibleOne('.dcp-flame-btn'), visibleOne('.dcp-person-btn')],
  },
  {
    key: 'search', panel: 'panel-studio', title: 'جستجو و کارنامه',
    text: 'این جعبه در همه‌ی بخش‌ها می‌گردد — مقاله، اپیزود، واژه‌ی دانشنامه — و زیرش پرجستجوترین موضوع‌ها یک لمس فاصله دارند. نوار آمار هم کارنامه‌ی دنت‌کست است: سال‌های فعالیت، ساعت‌های محتوای صوتی و تعداد مطلب‌ها و مدخل‌های آموزشی.',
    targets: () => [q('#panel-studio .dc-exa-search'), q('#panel-studio .dc-exa-pop'), q('#panel-studio .hero-stats')],
  },
  {
    key: 'des', panel: 'panel-studio', premium: 'part', title: 'امتیاز شواهد (DES)',
    text: (ctx) => (ctx.live
      ? 'هر مطلب علمی دنت‌کست یک کارت «ارزیابی خودکار شواهد» دارد: منابعش روی پنج سطح از E تا A می‌نشینند — بر اساس نوع مطالعه و کیفیت روشش — و جدا از آن سنجیده می‌شود متنِ دنت‌کست چقدر با خودِ منابع مطابق است. جعبه‌ی اول همین را توضیح می‌دهد. جعبه‌ی دوم هم با اشتراک شما باز است: متن یا چکیده‌ی مقاله‌ی خودتان را بگذارید و با همان معیار امتیاز بگیرید.'
      : 'هر مطلب علمی دنت‌کست یک کارت «ارزیابی خودکار شواهد» دارد: منابعش روی پنج سطح از E تا A می‌نشینند — بر اساس نوع مطالعه و کیفیت روشش — و جدا از آن سنجیده می‌شود متنِ دنت‌کست چقدر با خودِ منابع مطابق است. جعبه‌ی اول همین را توضیح می‌دهد. جعبه‌ی دوم ابزار پریمیوم است: متن یا چکیده‌ی مقاله‌ی خودتان را بگذارید و با همان معیار امتیاز بگیرید.'),
    targets: () => [q('#panel-studio .dc-des-legend-wrap'), q('#panel-studio .dc-destool-wrap')],
  },
  {
    key: 'plus_card', panel: 'panel-studio', title: 'میز کار شخصی',
    text: (ctx) => (ctx.guest
      ? 'با ورودِ رایگان، دنت‌کست یادگیری‌تان را نگه می‌دارد: استریک روزانه، امتیاز و نوتیف مطلب جدید — و این کارت می‌شود خلاصه‌ی یادگیری شما. روی هر مقاله هم با «میز کار» هایلایت می‌زنید و یادداشت می‌گذارید؛ همه به حسابتان سنجاق می‌شود و روی هر دستگاهی همراهتان است.'
      : 'خلاصه‌ی یادگیری شما: استریک، برگشتن به آخرین مطلبی که می‌خواندید و دسترسی به هایلایت‌ها و یادداشت‌هایتان. روی هر مقاله با «میز کار» هایلایت بزنید و یادداشت بگذارید — همه به حسابتان سنجاق می‌شود و روی هر دستگاهی همراهتان است.'),
    targets: () => [byId('dcPlusHomeCard')],
  },
  {
    key: 'episode_hero', panel: 'panel-studio', title: 'تازه‌ترین اپیزود',
    text: 'تازه‌ترین قسمت پادکست دنت‌کست همیشه این‌جاست؛ با دکمه‌ی پخش همین‌جا بشنوید، یا با لمس کارت به صفحه‌ی همان قسمت بروید؛ همه‌ی اپیزودها هم در تب آرشیو است. اگر وسط شنیدن صفحه را عوض کنید، نوار «ادامه‌ی شنیدن» از همان ثانیه ادامه می‌دهد.',
    targets: () => [byId('card-episodes')],
  },
  {
    // Drawn for a guest or free reader only (a subscriber has every pathway).
    key: 'pathways', panel: 'panel-studio', premium: 'part', skip: (ctx) => ctx.live, title: 'مسیرهای یادگیری',
    text: '«مسیرهای یادگیری» یک موضوع را از پیش‌نیاز تا پیشرفته، قدم‌به‌قدم و به ترتیب درست می‌چینند. مسیرِ «باز برای همه» را هر کسی می‌تواند شروع کند؛ بقیه با اشتراک پریمیوم باز می‌شوند و بعضی در پایان گواهی‌نامه دارند.',
    targets: () => [byId('dcPathwayShowcase')],
  },
  {
    key: 'wayfinder', panel: 'panel-studio', premium: 'part', title: 'مسیریاب یادگیری',
    text: (ctx) => (ctx.live
      ? '«مسیریاب» می‌پرسد چه‌کاره‌اید و از محتوای دنت‌کست یک مسیر شخصی برایتان می‌چیند. مسیرهای یادگیری — هر موضوع از پیش‌نیاز تا پیشرفته، به ترتیب درست — و گواهی‌نامه‌ی پایانشان در تب پریمیوم منتظر شماست.'
      : '«مسیریاب» می‌پرسد چه‌کاره‌اید و یک مسیر شخصی از محتوای دنت‌کست برایتان می‌سازد. قدم اولش برای همه است و بقیه با اشتراک پریمیوم.'),
    targets: () => [byId('dcWayfinderHome')],
  },
  {
    key: 'categories', panel: 'panel-studio', title: 'دسته‌های محتوا',
    text: 'هر خانه دری است به یک بخش — اپیزودها، اینسایت، نوت‌کست، چیرساید، متانوت، لایت‌کست، ShareHub، دنت‌کست پلاس و سری‌های ویژه — با تعداد مطلب‌هایش.',
    targets: () => [q('#panel-studio .dc-exa-cats')],
  },
  {
    key: 'bundles', panel: 'panel-studio', premium: 'all', title: 'از کجا شروع کنم؟',
    text: '«باندل‌های شروع»، هسته‌ی هر موضوع در پنج تا هشت قدمِ مرتب‌اند — از پایه تا نکته‌ی کلیدی، بدون حاشیه — مثلاً لمینیت، پست و کور یا انتخاب سرامیک. کارت هر باندل را لمس کنید و قدم‌به‌قدم جلو بروید.',
    targets: () => [byId('dcHomeBundles')],
  },
  {
    key: 'pulse', panel: 'panel-studio', title: 'پالس · آخرین اخبار',
    text: 'نبض سایت: هر مطلبی که در دنت‌کست منتشر می‌شود، همین‌جا با لینک مستقیم اعلام می‌شود. برای این‌که هیچ انتشار تازه‌ای را از دست ندهید، هر بار سری به پالس بزنید.',
    targets: () => [byId('dcPulseCard')],
  },
  {
    key: 'bottom_nav', panel: 'panel-studio', title: 'ناوبری اصلی',
    text: '«خانه» همین صفحه است، «آرشیو» درگاه همه‌ی بخش‌ها و مرجع‌های دنت‌کست، «پریمیوم» همه‌ی چیزهایی که اشتراک اضافه می‌کند — و برای مشترک‌ها، خانه‌ی ابزارهایشان — و «بیماران» صفحه‌ی ویژه‌ی مراجعان و غیردندانپزشکان (معرفی کلینیک و مطالب آموزشی ساده). حالا برویم سراغ آرشیو.',
    targets: () => [byId('dcBottomNav')],
  },

  // ── آرشیو ────────────────────────────────────────────────────────────────
  {
    key: 'upboard', panel: 'panel-sharehub', premium: 'part', title: 'up-board',
    text: (ctx) => (ctx.live
      ? 'همه‌ی مطالب سایت در دو چیدمان: «تازه‌ترین» به ترتیب انتشار، برای همه؛ و «بالاترین» به انتخاب خواننده‌ها — با قلب‌هایی که هر عضوی زیر مطالب می‌زند — که با اشتراک شما باز است.'
      : 'همه‌ی مطالب سایت در دو چیدمان: «تازه‌ترین» به ترتیب انتشار، برای همه؛ و «بالاترین» به انتخاب خواننده‌ها — با قلب‌هایی که هر عضوی زیر مطالب می‌زند — ویژه‌ی پریمیوم.'),
    targets: () => [q('#panel-sharehub .dc-home-sec-upboard'), q('#panel-sharehub .dc-monitor-secondary')],
  },
  {
    key: 'desboard', panel: 'panel-sharehub', premium: 'part', title: 'قفسه‌ی شواهد (DES)',
    text: (ctx) => (ctx.live
      ? 'مطالب دنت‌کست، این بار روی قفسه‌های DES: هر مطلب بر اساس سطح شواهد منابعش در قفسه‌ی خودش. صفحه و توضیحش برای همه باز است و خودِ چیدمان با اشتراک شما.'
      : 'مطالب دنت‌کست، این بار روی قفسه‌های DES: هر مطلب بر اساس سطح شواهد منابعش در قفسه‌ی خودش. صفحه و توضیحش برای همه باز است و خودِ چیدمان ویژه‌ی پریمیوم.'),
    targets: () => [q('#panel-sharehub .dc-ub-door')],
  },
  {
    key: 'originals', panel: 'panel-sharehub', title: 'تولید اختصاصی دنت‌کست',
    text: 'محتوای اورجینال دنت‌کست: Clinical Insight (بینش‌های کلینیکی)، Chairside (نکته‌هایی از ویزیت‌های روزانه)، Meta Note (ایده‌ها و مدل‌های تحلیلی) و DentCast+ (آموزش ویدیویی، برای همه).',
    targets: () => [
      q('#panel-sharehub .dc-list-card--insight'),
      q('#panel-sharehub .dc-list-card--chairside'),
      q('#panel-sharehub .dc-list-card--meta'),
      q('#panel-sharehub .dc-list-card--plus'),
    ],
  },
  {
    key: 'sources', panel: 'panel-sharehub', title: 'مرور منابع علمی',
    text: 'بخش‌های مبتنی بر مقالات علمی: NoteCast خلاصه‌نویسی اپیزودها از مقالات است و Share Hub خوانش دنت‌کست از ادبیات علمی — یک مقاله یا چند مقاله، همیشه با منبع.',
    targets: () => [
      q('#panel-sharehub .dc-list-card[onclick*="notecast"]'),
      // Share Hub is a list card since DentAI closed (1405/07/15); the 2×2
      // .dc-grid it used to share with DentAI no longer exists.
      q('#panel-sharehub .dc-list-card[onclick*="sharehub"]'),
    ],
  },
  {
    key: 'special_series', panel: 'panel-sharehub', title: 'سری‌های ویژه',
    text: 'سری‌های محدودی که شروع و پایان دارند: «پرامپتولوژیست» کار با مدل‌های زبانی را از صفر یاد می‌دهد، «پلاک صفر» ساختن سایتِ خودتان را، و «تراز شواهد» این را که یک مقاله‌ی دندانپزشکی واقعاً چقدر می‌ارزد.',
    targets: () => [
      q('#panel-sharehub .dc-list-card--prompt'),
      q('#panel-sharehub .dc-list-card--plak'),
      q('#panel-sharehub .dc-list-card--taraz'),
    ],
  },
  {
    key: 'references', panel: 'panel-sharehub', premium: 'part', title: 'مرجع‌های دنت‌کست',
    text: (ctx) => (ctx.live
      ? '«فهرست موضوعی» نقشه‌ی همه‌ی محتواست، هر حوزه در یک صفحه — و برای شما، با اشتراک پریمیوم، با زیرموضوع‌ها و ترتیب خواندن. «دانشنامه» مفاهیم تصمیم‌سازِ دندانپزشکی را کوتاه و دقیق توضیح می‌دهد.'
      : '«فهرست موضوعی» نقشه‌ی همه‌ی محتواست، هر حوزه در یک صفحه — و برای مشترک پریمیوم با زیرموضوع‌ها و ترتیب خواندن. «دانشنامه» مفاهیم تصمیم‌سازِ دندانپزشکی را کوتاه و دقیق توضیح می‌دهد.'),
    targets: () => [byId('card-pillar'), byId('card-glossary')],
  },
  {
    key: 'search_engines', panel: 'panel-sharehub', premium: 'part', title: 'موتورهای جستجوی دندانپزشکی',
    text: (ctx) => (ctx.live
      ? '«رادار» جایگزین تخصصی گوگل برای سایت‌های دندانپزشکی است، از جمله سایت شرکت‌های تجهیزات دندانپزشکی. «کتابخانه‌ی دنت‌کست» در آرشیو مقاله‌های علمیِ خودِ دنت‌کست می‌گردد — دسته‌بندی‌شده و قابل جستجو — و با اشتراک شما باز است.'
      : '«رادار» جایگزین تخصصی گوگل برای سایت‌های دندانپزشکی است، از جمله سایت شرکت‌های تجهیزات دندانپزشکی. «کتابخانه‌ی دنت‌کست» در آرشیو مقاله‌های علمیِ خودِ دنت‌کست می‌گردد — دسته‌بندی‌شده و قابل جستجو — و ویژه‌ی اعضای پریمیوم است.'),
    targets: () => [byId('btnOpenRadarMob'), byId('card-library')],
  },

  // ── پریمیوم ──────────────────────────────────────────────────────────────
  // A subscriber is shown their own live tab. Everyone else is shown the
  // SAME live layout, drawn by premium-panel.js itself from a sample reader
  // (mountPremiumPreview) and labelled as a sample — the locked catalog says
  // what each tool is, the live home shows what owning them looks like.
  {
    key: 'premium_home', panel: 'panel-premium', premium: 'all', enter: mountPremiumPreview, title: 'تب پریمیوم',
    text: (ctx) => (ctx.live
      ? 'این خانه‌ی اشتراک شماست. «ادامه بده» همان جایی است که رها کرده‌اید — قدم بعدیِ مسیر، یا کارت‌های امروز — و زیرش سه عددِ امروزِ خودتان، که هر کدام دری به همان ابزار است.'
      : 'این‌جا خانه‌ی یک مشترک پریمیوم است؛ آنچه می‌بینید نمونه است، نه حساب شما. «ادامه بده» همان جایی است که رها کرده: قدم بعدیِ مسیر یادگیری، با نوار پیشرفت. زیرش سه عددِ امروز — کارت‌هایی که امروز نوبت مرورشان است، استریک و تعداد هایلایت‌ها — که هر کدام دری به همان ابزار است.'),
    targets: () => premiumTargets('.dcp-pp-status', '.dcp-pp-hero', '.dcp-pp-today'),
  },
  {
    key: 'premium_quick', panel: 'panel-premium', premium: 'all', enter: mountPremiumPreview, title: 'میان‌برها و باندل‌ها',
    text: (ctx) => (ctx.live
      ? 'چهار ابزاری که بیش از همه باز می‌کنید — دفترچه، مسیرها، دستیار کیس و کالکشن‌ها — یک لمس فاصله دارند، و زیرشان باندل‌های شروع با پیشرفت خودتان.'
      : 'چهار ابزاری که مشترک‌ها بیش از همه باز می‌کنند — دفترچه‌ی هایلایت‌ها، مسیرها، دستیار کیس و کالکشن‌ها — یک لمس فاصله دارند، و زیرشان باندل‌های شروع که برای مشترک همه باز است.'),
    targets: () => premiumTargets('.dcp-pp-quick', '.dcp-pp-bundles'),
  },
  {
    key: 'premium_groups', panel: 'panel-premium', premium: 'all', enter: mountPremiumPreview, title: 'همه‌ی ابزارها، در چهار گروه',
    text: (ctx) => (ctx.live
      ? 'بقیه‌ی ابزارهای شما در چهار گروه، هر ردیف با وضعیت خودش: «خواندن و مرور»، «مسیر و گواهی»، «ابزار» و «گفت‌وگو و همراهی». «پیشخوان ›» بالای همین تب هم خلاصه‌ی مطالب خودتان است.'
      : 'بقیه‌ی ابزارها در چهار گروه، هر ردیف با وضعیت خودش: «خواندن و مرور» (دفترچه، نمای موضوعی هایلایت‌ها، نشانِ خوانده و نخوانده کنار هر مطلب)، «مسیر و گواهی»، «ابزار» (مسیریاب، کتابخانه، دستیار کیس، امتیاز DES برای مقاله‌ی خودتان) و «گفت‌وگو و همراهی» (پاسخ به چالش‌ها، بدون تبلیغ در مقالات، یادآوری استریک با پیامک).'),
    cta: true,
    targets: () => premiumTargets('.dcp-pp-group'),
  },

  {
    key: 'finale', panel: 'panel-studio', title: 'تمام شد!',
    text: (ctx) => (ctx.guest
      ? 'حالا نقشه‌ی دنت‌کست دستتان است. با ورودِ رایگان از آدمکِ هدر، این تور هم همیشه در منوی همان آدمک، زیر «راهنمای سایت»، در دسترس است. یادگیری خوبی داشته باشید 🦷'
      : 'حالا نقشه‌ی دنت‌کست دستتان است. هر وقت خواستید این تور را دوباره ببینید، روی آدمکِ هدر بزنید و «راهنمای سایت» را انتخاب کنید. یادگیری خوبی داشته باشید 🦷'),
    targets: null,
  },
];

// ------------------------------------------------------- premium preview ----
// For a reader without a subscription the tab draws the locked catalog. The
// tour instead shows what the tab looks like to its owner: premium-panel.js's
// own live renderer (livePreview), fed a SAMPLE reader, mounted beside the real
// slot (which is hidden meanwhile and never touched — a /me refresh can repaint
// it mid-tour without disturbing the sample) and removed when the tour leaves
// the tab. Loaded on demand: every page imports this module, only the
// homepage's tour needs the panel's module graph (already loaded there).
const DEMO_PATHWAY = 'ceramics';
let preview = null;

async function samplePathway() {
  try {
    const r = await fetch('/plus/pathways.json', { credentials: 'omit', cache: 'no-cache' });
    const d = await r.json();
    const list = Array.isArray(d) ? d : (d && d.pathways) || [];
    const p = list.find((x) => x && x.id === DEMO_PATHWAY);
    if (!p || !Array.isArray(p.steps) || !p.steps.length) return null;
    const total = p.steps.length;
    return { id: p.id, title_fa: p.title_fa, total_steps: total, completed_steps: Math.max(1, Math.round(total * 0.4)), is_complete: false };
  } catch (_) {
    return null; // the sample falls back to the «today's cards» hero
  }
}

async function mountPremiumPreview(ctx) {
  if (ctx.live) return;
  if (preview && preview.isConnected) return;
  const host = byId('panel-premium');
  if (!host) return;
  const [mod, pathway] = await Promise.all([import('./premium-panel.js?v=213'), samplePathway()]);
  if (!state || typeof mod.livePreview !== 'function') return;
  const node = mod.livePreview({
    tier: 'premium',
    active_pathway: pathway,
    due_card_count: 12,
    current_streak: 9,
    last_active_day: tehranDay(),
    settings: { notify_channels: { sms: { streak: true } } },
  });
  const hl = node.querySelector('[data-dcp-mine="highlights"] .num');
  if (hl) hl.textContent = faNum(184);
  if (preview) preview.remove();
  preview = el('div', { class: 'dcp-tour-preview', 'aria-hidden': 'true' }, [
    el('p', { class: 'dcp-tour-sample' }, 'نمونه · نمای تب برای یک مشترک پریمیوم'),
    node,
  ]);
  host.insertBefore(preview, byId('dcPremiumPanel'));
  host.classList.add('dcp-tour-previewing');
}

function unmountPremiumPreview() {
  if (preview) { preview.remove(); preview = null; }
  const host = byId('panel-premium');
  if (host) host.classList.remove('dcp-tour-previewing');
}

/** The live layout the premium stops point into: the sample, else the real tab. */
function premiumTargets(...selectors) {
  const root = (preview && preview.isConnected && preview)
    || q('#dcPremiumPanel .dcp-pp[data-dcp-state="live"]');
  if (!root) return [];
  const els = selectors.map((s) => root.querySelector(s));
  if (root === preview && selectors[0] === '.dcp-pp-status') els.unshift(root.querySelector('.dcp-tour-sample'));
  return els;
}

// ---------------------------------------------------------------- engine ----
let state = null; // { seq, idx, ctx, els, lastRect, layer, dims, ring, card, watch, onKey, onResize }

function unionRect(els) {
  let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity;
  els.forEach((e) => {
    const x = e.getBoundingClientRect();
    t = Math.min(t, x.top); l = Math.min(l, x.left);
    r = Math.max(r, x.right); b = Math.max(b, x.bottom);
  });
  return { top: t, left: l, right: r, bottom: b, width: r - l, height: b - t };
}

// Scroll #mobile-body so the (in-flow) targets sit in the free band between
// the sticky header and the fixed bottom nav. Fixed/sticky targets (header,
// bottom nav) never need this. Returns the scrolled container (or null).
function scrollTargets(els) {
  const mb = byId('mobile-body');
  if (!mb) return null;
  const inBody = els.filter((e) => mb.contains(e));
  if (!inBody.length) return null;
  const u = unionRect(inBody);
  const bandTop = 82, bandBottom = window.innerHeight - 88;
  if (u.top >= bandTop && u.bottom <= bandBottom) return null;
  const slack = Math.max(0, (bandBottom - bandTop - u.height) / 3);
  const top = Math.max(0, mb.scrollTop + (u.top - bandTop - slack));
  mb.scrollTo({ top, behavior: 'smooth' });
  return mb;
}

// Real phones take an unpredictable time to finish a smooth scroll (a fixed
// delay measured mid-scroll and left the spotlight offset from its target).
// Resolve once scrollTop has been still for ~8 frames, capped at 1.5s.
function waitScrollSettle(container, timeout = 1500) {
  return new Promise((resolve) => {
    let last = container.scrollTop, still = 0;
    const t0 = (window.performance || Date).now();
    (function tick() {
      requestAnimationFrame(() => {
        const now = container.scrollTop;
        if (now === last) still += 1; else { still = 0; last = now; }
        if (still >= 8 || (window.performance || Date).now() - t0 > timeout) resolve();
        else tick();
      });
    })();
  });
}

// Dim everything EXCEPT the hole with FOUR opaque strips (top/bottom/left/
// right) plus a transparent ring for the highlight border. The previous
// single-element trick (box-shadow with a 200vmax spread) silently failed to
// paint on some real phones (mobile GPUs drop huge shadow rasters), leaving
// the page undimmed — plain positioned divs cannot fail that way.
function positionMask(st, rect) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const [dTop, dBottom, dLeft, dRight] = st.dims;
  const box = (d, top, left, width, height) => {
    d.style.top = top + 'px';
    d.style.left = left + 'px';
    d.style.width = Math.max(0, width) + 'px';
    d.style.height = Math.max(0, height) + 'px';
  };
  if (!rect) { // finale: full dim, no ring
    st.ring.style.display = 'none';
    box(dTop, 0, 0, vw, vh);
    box(dBottom, vh, 0, vw, 0);
    box(dLeft, 0, 0, 0, 0);
    box(dRight, 0, vw, 0, 0);
    return;
  }
  const pad = 6;
  const top = Math.max(4, rect.top - pad);
  const left = Math.max(4, rect.left - pad);
  const right = Math.min(vw - 4, rect.right + pad);
  const bottom = Math.min(vh - 4, rect.bottom + pad);
  st.ring.style.display = '';
  st.ring.style.top = top + 'px';
  st.ring.style.left = left + 'px';
  st.ring.style.width = Math.max(0, right - left) + 'px';
  st.ring.style.height = Math.max(0, bottom - top) + 'px';
  box(dTop, 0, 0, vw, top);
  box(dBottom, bottom, 0, vw, vh - bottom);
  box(dLeft, top, 0, left, bottom - top);
  box(dRight, top, right, vw - right, bottom - top);
}

// Below the hole when there is room (or more room than above), else above;
// centered horizontally and clamped to the viewport -> minimal overlap with
// the highlighted element.
function placeCard(card, rect) {
  const vw = window.innerWidth, vh = window.innerHeight;
  card.style.visibility = 'hidden';
  card.style.top = '0px';
  card.style.left = '0px';
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let top;
  if (!rect) {
    top = Math.max(12, (vh - ch) / 2);
  } else {
    const below = vh - rect.bottom - 16;
    const above = rect.top - 16;
    if (below >= ch + 8 || below >= above) top = Math.min(vh - ch - 12, rect.bottom + 14);
    else top = Math.max(12, rect.top - ch - 14);
  }
  const left = Math.min(Math.max(10, (vw - cw) / 2), Math.max(10, vw - cw - 10));
  card.style.top = top + 'px';
  card.style.left = left + 'px';
  card.style.visibility = '';
}

// Recompute the union rect and (re)place hole + card. Content is untouched, so
// this is safe to call repeatedly (resize, drift watcher).
function positionStop() {
  const st = state; if (!st) return;
  // Async widgets (e.g. the Plus home card) can re-render and replace a
  // spotlighted node after we grabbed it — refetch from the stop definition.
  if (st.els.some((e) => !e.isConnected)) {
    const stop = STOPS[st.idx];
    st.els = stop.targets ? stop.targets().filter(visible) : [];
  }
  const rect = st.els.length ? unionRect(st.els) : null;
  positionMask(st, rect);
  placeCard(st.card, rect);
  st.lastRect = rect;
}

// Late layout shifts (async-injected cards, web fonts, viewport chrome) move
// the page under a displayed stop. Watch for drift and follow the target.
function driftCheck() {
  const st = state; if (!st || !st.els.length) return;
  if (st.els.some((e) => !e.isConnected)) { positionStop(); return; }
  const r = unionRect(st.els), o = st.lastRect;
  if (!o || Math.abs(r.top - o.top) > 2 || Math.abs(r.left - o.left) > 2
    || Math.abs(r.height - o.height) > 2 || Math.abs(r.width - o.width) > 2) {
    positionStop();
  }
}

function premiumBadge(kind, ctx) {
  if (ctx.live) return kind === 'all' ? 'بخشی از اشتراک پریمیوم شما' : 'بخش‌های پریمیومش برای شما باز است';
  return kind === 'all' ? 'ویژه‌ی اشتراک پریمیوم' : 'بخشی از آن ویژه‌ی اشتراک پریمیوم';
}

function renderStop(stop, idx) {
  const st = state; if (!st) return;
  const last = idx === STOPS.length - 1;

  st.card.textContent = '';
  st.card.appendChild(el('p', { class: 'dcp-tour-kicker' }, 'راهنمای دنت‌کست'));
  st.card.appendChild(el('h3', { class: 'dcp-tour-title' }, stop.title));
  if (stop.premium) st.card.appendChild(el('p', { class: 'dcp-tour-badge' }, premiumBadge(stop.premium, st.ctx)));
  st.card.appendChild(el('p', { class: 'dcp-tour-text' }, typeof stop.text === 'function' ? stop.text(st.ctx) : stop.text));
  // One way from «I want this» to the price, on the tour's last premium stop and
  // only for a reader who does not have it. Leaving ends the tour as finished.
  if (stop.cta && !st.ctx.live) {
    st.card.appendChild(el('a', {
      class: 'dcp-tour-cta', href: pricingHref('tour'),
      onclick: () => endTour(true, { silent: true }),
    }, 'دیدن پلن‌های اشتراک پریمیوم ›'));
  }
  const next = el('button', { class: 'dcp-btn dcp-btn-primary dcp-tour-next', type: 'button' }, last ? 'تمام' : 'بعدی');
  next.addEventListener('click', () => showStop(idx + 1));
  const foot = [next];
  if (!last) {
    const quit = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'تمام');
    quit.addEventListener('click', () => endTour(false));
    foot.push(quit);
  }
  const applies = STOPS.filter((s) => !(s.skip && s.skip(st.ctx)));
  foot.push(el('span', { class: 'dcp-tour-progress' }, faNum(applies.indexOf(stop) + 1) + ' از ' + faNum(applies.length)));
  st.card.appendChild(el('div', { class: 'dcp-tour-foot' }, foot));
  positionStop();
}

async function showStop(idx) {
  const st = state; if (!st) return;
  if (idx >= STOPS.length) { endTour(true); return; }
  const seq = ++st.seq;
  const stop = STOPS[idx];
  st.idx = idx;
  if (stop.skip && stop.skip(st.ctx)) { showStop(idx + 1); return; }

  // The premium sample lives only while the tour is on the پریمیوم tab; it is
  // built before the switch so the panel slides in already showing it.
  if (stop.panel !== 'panel-premium') unmountPremiumPreview();
  if (stop.enter) {
    try { await stop.enter(st.ctx); } catch (_) { /* its stops skip themselves */ }
    if (!state || state.seq !== seq) return;
  }

  // Bring the right panel up via the real bottom-nav item (keeps nav state and
  // animation consistent), then wait out the panel transition.
  const active = document.querySelector('.dc-panel.active');
  if (stop.panel && (!active || active.id !== stop.panel)) {
    const bn = document.querySelector('.dc-bn-item[data-panel="' + stop.panel + '"]');
    if (bn) bn.click();
    await wait(430);
    if (!state || state.seq !== seq) return;
  }

  const els = stop.targets ? stop.targets().filter(visible) : [];
  if (stop.targets && !els.length) { showStop(idx + 1); return; } // anchor missing -> skip
  const scrolled = els.length ? scrollTargets(els) : null;
  if (scrolled) {
    await waitScrollSettle(scrolled);
    if (!state || state.seq !== seq) return;
  }
  st.els = els;
  renderStop(stop, idx);
  track('tour_step', { step: idx + 1, key: stop.key });
}

function endTour(completed, opts = {}) {
  const st = state; if (!st) return;
  state = null;
  clearInterval(st.watch);
  document.removeEventListener('keydown', st.onKey);
  window.removeEventListener('resize', st.onResize);
  document.documentElement.classList.remove('dcp-touring');
  st.layer.remove();
  unmountPremiumPreview();
  track(completed ? 'tour_finish' : 'tour_skip', { step: st.idx + 1 });
  // Land the user back on the home panel.
  const active = document.querySelector('.dc-panel.active');
  if (active && active.id !== 'panel-studio') {
    const bn = document.querySelector('.dc-bn-item[data-panel="panel-studio"]');
    if (bn) bn.click();
  }
  // The tour just closed for REAL (not a restart): nudge the user to turn on
  // notifications, tour-styled + account-capped. Small delay so the panel
  // transition settles first.
  if (!opts.silent) {
    setTimeout(() => {
      currentUser().then((u) => { if (u) maybeShowNotifPrompt(u); }).catch(() => { /* ignore */ });
    }, 500);
  }
}

export function startTour({ manual = false } = {}) {
  if (state) endTour(false, { silent: true }); // restart cleanly (no notif nudge)
  if (!isHomePage()) {
    // The anchors only exist on the homepage: jump there and auto-start.
    try { sessionStorage.setItem(SS_PENDING, '1'); } catch (_) { /* ignore */ }
    location.href = '/?tour=1';
    return;
  }
  if (!isMobileUi()) return; // phase 1: mobile shell only

  // The guest welcome box and the tour must never stack (the welcome overlay
  // would sit dimmed in front of the spotlighted element).
  document.querySelectorAll('.dcp-welcome-overlay').forEach((n) => n.remove());
  document.querySelectorAll('.dcp-person-attention').forEach((n) => n.classList.remove('dcp-person-attention'));

  const dims = [0, 1, 2, 3].map(() => el('div', { class: 'dcp-tour-dim' }));
  const ring = el('div', { class: 'dcp-tour-ring' });
  const card = el('div', { class: 'dcp-tour-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'راهنمای دنت‌کست' });
  const layer = el('div', { class: 'dcp-tour-layer' }, [...dims, ring, card]);
  const onKey = (e) => { if (e.key === 'Escape') endTour(false); };
  let resizeT = null;
  const onResize = () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(positionStop, 150);
  };
  state = { seq: 0, idx: 0, ctx: { live: false, guest: true }, els: [], lastRect: null, layer, dims, ring, card, onKey, onResize };
  state.watch = setInterval(driftCheck, 250);
  document.body.appendChild(layer);
  document.documentElement.classList.add('dcp-touring');
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  track('tour_start', { manual: manual ? 1 : 0 });
  // Several cards read differently for a subscriber; /me is cached by the time
  // anyone can open the tour, so this costs no visible wait. Unanswered means
  // «not a subscriber», which only changes wording.
  const st = state;
  currentUser().catch(() => null).then((u) => {
    if (state !== st) return;
    st.ctx.live = !!(u && u.tier === 'premium');
    st.ctx.guest = !u;
    showStop(0);
  });
}

// ----------------------------------------------------- first-login offer ----
// Account-scoped once-ever: `settings.tour_seen` 0/absent -> show the invite
// and flip it to 1 IMMEDIATELY (whether they take the tour or tap «بعداً»),
// so it never auto-shows again on any device. The manual menu entry stays.
export function maybeOfferTour(user) {
  if (!isHomePage() || !isMobileUi()) return;
  const settings = (user && user.settings) || {};
  if (settings.tour_seen) return;
  api.updateMe({ settings: { tour_seen: 1 } }).catch(() => { /* retry next visit */ });

  let overlay = null;
  const cleanup = () => {
    if (overlay) { overlay.remove(); overlay = null; }
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };

  const go = el('button', { class: 'dcp-btn dcp-btn-primary dcp-welcome-cta', type: 'button' }, 'شروع تور');
  go.addEventListener('click', () => { cleanup(); startTour({ manual: false }); });
  const later = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-welcome-close', type: 'button' }, 'بعداً');
  later.addEventListener('click', cleanup);

  const box = el('div', {
    class: 'dcp-welcome-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'راهنمای دنت‌کست',
  }, [
    el('div', { class: 'dcp-welcome-ico', 'aria-hidden': 'true' }, '🧭'),
    el('h2', { class: 'dcp-welcome-title' }, 'با دنت‌کست آشنا شو'),
    el('p', { class: 'dcp-welcome-lead' },
      'خوش آمدید! یک تور کوتاه، قدم‌به‌قدم نشانتان می‌دهد هر بخش سایت کجاست و به چه دردی می‌خورد — از پالس و اپیزودها تا آرشیو و میز کار شخصی‌تان.'),
    el('p', { class: 'dcp-tour-offer-hint' },
      'هر وقت هم که بخواهید، از منوی آدمکِ هدر گزینه‌ی «راهنمای سایت» همین تور را دوباره اجرا می‌کند.'),
    go,
  ]);
  overlay = el('div', {
    class: 'dcp-welcome-overlay dcp-tour-offer',
    onclick: (e) => { if (e.target === overlay) cleanup(); },
  }, [el('div', { class: 'dcp-welcome-wrap' }, [box, later])]);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onKey);
  track('tour_offer', {});
}

// ------------------------------------------------------------- autostart ----
// Handles the /?tour=1 handoff (manual start requested from a non-home page)
// on homepage load. Small delay so the Plus header/home card have a chance to
// render before the tour measures them. Idempotent (guarded by a module flag)
// because it is invoked from BOTH plus.js boot and initHeader — the header
// path guarantees the handoff works even when a cached plus.js entry predates
// this feature (its module graph still pulls the fresh header.js + tour.js).
let autostartDone = false;
export function initTourAutostart() {
  if (autostartDone) return;
  autostartDone = true;
  let pending = false;
  try {
    pending = sessionStorage.getItem(SS_PENDING) === '1';
    if (pending) sessionStorage.removeItem(SS_PENDING);
  } catch (_) { /* ignore */ }
  if (!pending) pending = /[?&]tour=1(&|$)/.test(location.search);
  if (!pending || !isHomePage() || !isMobileUi()) return;
  try { if (history.replaceState) history.replaceState(null, '', location.pathname); } catch (_) { /* ignore */ }
  setTimeout(() => startTour({ manual: true }), 700);
}
