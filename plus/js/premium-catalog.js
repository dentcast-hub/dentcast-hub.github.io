// EVERYTHING premium buys — the full catalog, grouped, for the «پریمیوم» tab.
//
// WHY A SECOND LIST EXISTS. `PREMIUM_FEATURES` (config.js) is the canonical
// NINE: addressed by index from dashboard.js and league.js, mirrored in the
// API's `PREMIUM_FEATURE_TITLES` and held there by a test, read whole by the
// prize banner, the price page and the first-visit popup. Growing it to twenty
// would lengthen every one of those surfaces at once — the price page's list,
// the popup's card, the banner's sentence — which nobody asked for. But the
// site gates far more than nine things behind `requirePremium`, and until the
// tab existed eleven of them were named on no pitch anywhere: not «بدون
// تبلیغ», not the cabinet, not the wayfinder, not «بالاترین». This file is the
// one place that lists ALL of it.
//
// THE NINE ARE NOT RE-TYPED. Every entry that has a canonical row references it
// (`feature: F[i]`) and takes its title from there, so a rename in config.js
// reaches this tab on the same commit. The extra entries carry their own title.
// `premium-panel.dom.test.ts` asserts every canonical title appears in this
// catalog, so a tenth entry appended to `PREMIUM_FEATURES` fails the day it is
// added rather than quietly missing from the one page that claims to be complete.
//
// The SENTENCES are written here rather than reused from the canonical hints,
// for the reason premium-benefits.js and home-features.js give: those hints are
// in-product tooltips in the dashboard's casual voice, and this page is read by
// people who do not have the feature yet.
//
// GROUPS ARE INFORMATION, not decoration: they answer «what kind of thing is
// this» for a reader who has never used any of it. Order inside a group is the
// order a new subscriber meets them, the everyday ones first.
import { PREMIUM_FEATURES } from './config.js?v=113';

const F = PREMIUM_FEATURES;

// Crafted inline icons, one per entry (same reasoning as home-features.js: emoji
// sits at a different weight than the site's own stroke icons). The nine reuse
// the rail's paths so the same feature wears the same face on both surfaces.
const IC = {
  cards: '<rect x="3" y="6" width="13" height="13" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/>',
  library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  concepts: '<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/>',
  clip: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  collections: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  pathway: '<path d="M4 18h5l3-6 3 9 2-3h3"/><circle cx="4" cy="18" r="1.2"/>',
  certificate: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5 8 21l4-2 4 2-1-7.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5z"/>',
  report: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 15h3M12 15h5"/>',
  pillar: '<path d="M3 5h18M3 12h18M3 19h18"/><path d="M7 5v14M15 5v14"/>',
  heart: '<path d="M12 21s-7-4.6-9.3-9A5.2 5.2 0 0 1 12 6.4a5.2 5.2 0 0 1 9.3 5.6C19 16.4 12 21 12 21z"/>',
  desboard: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  assistant: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/><circle cx="12" cy="12" r="3"/>',
  wayfinder: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  cabinet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M12 9v12"/>',
  flask: '<path d="M9.5 3v5.2L4.8 17.4A2.4 2.4 0 0 0 6.9 21h10.2a2.4 2.4 0 0 0 2.1-3.6L14.5 8.2V3"/><path d="M8.2 3h7.6"/><path d="M7.4 14.2h9.2"/>',
  threads: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
  challenge: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>',
  noads: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  sms: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10 18h4"/><path d="M9.5 8h5M9.5 11h3"/>',
};

/**
 * One entry: `key` (stable, used by tests and by the live-state painter),
 * `title` (from the canonical row where one exists), `sub` (one line for a
 * reader who has never used it), `href` (where a subscriber goes — null for a
 * benefit that has no page, like the absence of ads), `ico`, and `feature` —
 * the canonical row, so the tab and the rail can never disagree on a name.
 */
function entry(key, ico, href, sub, opts = {}) {
  const feature = opts.feature || null;
  return { key, ico, href, sub, feature, title: feature ? feature.title : opts.title };
}

export const PREMIUM_GROUPS = [
  {
    key: 'reading',
    title: 'خواندن و مرور',
    sub: 'هایلایت‌هایت تبدیل به چیزی می‌شوند که برمی‌گردد',
    entries: [
      entry('cards', IC.cards, '/plus/cards.html', 'هایلایت‌ها درست پیش از فراموش‌شدن برمی‌گردند', { feature: F[0] }),
      entry('highlights', IC.library, '/plus/highlights.html', 'همه‌ی هایلایت‌هایتان یکجا، با یادداشت و جستجو', { feature: F[5] }),
      entry('concepts', IC.concepts, '/plus/highlights.html', 'همه‌ی یادداشت‌هایت دربارهٔ یک مفهوم، از هر مقاله‌ای که بوده', { title: 'نمای موضوعی هایلایت‌ها' }),
      entry('clips', IC.clip, '/plus/highlights.html?kind=clip', 'مثل هایلایت متن، روی پادکست: تکه را نگه دارید و دوباره بشنوید', { feature: F[7] }),
      entry('collections', IC.collections, '/plus/collections.html', 'پوشه‌های خودتان، با پینِ متن و رفرنس، و خروجی Word و PowerPoint', { feature: F[2] }),
    ],
  },
  {
    key: 'path',
    title: 'مسیر و گواهی',
    sub: 'از «چی بخونم» تا گواهی به نام خودت',
    entries: [
      entry('pathways', IC.pathway, '/plus/pathways.html', 'از پیش‌نیاز تا پیشرفته، به ترتیبِ درست', { feature: F[1] }),
      entry('certificate', IC.certificate, '/plus/profile.html#certificates', 'مسیر را تمام کنید، آزمونش را بدهید، گواهی با کد یکتا و صفحهٔ تأیید', { feature: F[8] }),
      entry('compass', IC.compass, '/plus/reading-compass.html', 'چقدر از هر پیلار را خوانده‌اید، کجا جا مانده', { feature: F[3] }),
      entry('report', IC.report, '/plus/report.html', 'هر ماه، آنچه خواندید و کجا ایستادید', { feature: F[6] }),
      entry('pillar', IC.pillar, '/pillar/', 'هر سری با زیرموضوع و زنجیرهٔ خواندن، نه فقط فهرستِ تاریخی', { title: 'چیدمان موضوعی سری‌ها' }),
      entry('upboard', IC.heart, '/up-board/?sort=top', 'همه‌ی مطلب‌ها، به ترتیبی که خواننده‌ها ساخته‌اند', { title: '«بالاترین» در up-board' }),
      entry('desboard', IC.desboard, '/des-board/', 'مطلب‌ها روی قفسه‌ی شواهد: کدام مقاله روی کدام سطح ایستاده', { title: 'قفسه‌ی شواهد (DES)' }),
    ],
  },
  {
    key: 'tools',
    title: 'ابزار',
    sub: 'چیزهایی که به‌جای شما می‌گردند',
    entries: [
      entry('assistant', IC.assistant, '/plus/assistant.html', 'شرح کیس را بنویسید، به مرتبط‌ترین مطلب برسید', { feature: F[4] }),
      entry('wayfinder', IC.wayfinder, '/plus/wayfinder.html', 'بگویید چه‌کاره‌اید، نقشهٔ خواندنِ خودتان را می‌سازد', { title: 'مسیریاب' }),
      entry('cabinet', IC.cabinet, '/dentcast_cabinet_search.html', 'بیش از ۲۲۰۰ مقاله‌ی علمی، دسته‌بندی‌شده و قابل جستجو', { title: 'کتابخانهٔ دنت‌کست' }),
      // The scorer lives on the home panel of this same page. A hash link to
      // another panel's element is switched to by premium-panel.js (it clicks
      // the right bottom-nav item first), so this is a real destination.
      entry('des-scorer', IC.flask, '/#dcDesToolTab', 'چکیده را بفرست، با همان DentCast Evidence Score ارزیابی می‌شود', { title: 'امتیاز DES برای مقاله‌ی خودت' }),
    ],
  },
  {
    key: 'together',
    title: 'گفت‌وگو و همراهی',
    sub: 'چیزهایی که بی‌سروصدا فرق می‌کنند',
    entries: [
      entry('threads', IC.threads, '/plus/support.html', 'زیر هر مقاله سؤالتان را بنویسید؛ جواب می‌گیرید، به اسم خودتان', { title: 'گفت‌وگوی زیر مطلب' }),
      entry('challenge', IC.challenge, null, 'به کیس‌های سؤال‌شکل جواب بدهید و نکته‌های کلیدی را ببینید', { title: 'پاسخ به چالش‌ها' }),
      // «در مقالات», deliberately narrow (founder, 1405/06/30): the homepage may
      // one day carry a hand-placed gold-sponsor card that premium sees too, so
      // the promise covers the reading surfaces and nothing wider.
      entry('no-ads', IC.noads, null, 'هیچ کارت اسپانسری لای مقاله‌ها و اپیزودها', { title: 'بدون تبلیغ در مقالات' }),
      entry('sms', IC.sms, '/plus/profile.html#reminders', 'فقط روزی که استریک در خطر است، فقط اگر خودتان بخواهید', { title: 'یادآوری استریک با پیامک' }),
    ],
  },
];

/** Every entry, flat, in display order. */
export const PREMIUM_ENTRIES = PREMIUM_GROUPS.flatMap((g) => g.entries);

/** The entry for a canonical feature title, or undefined. */
export function entryForFeature(title) {
  return PREMIUM_ENTRIES.find((e) => e.feature && e.feature.title === title);
}
