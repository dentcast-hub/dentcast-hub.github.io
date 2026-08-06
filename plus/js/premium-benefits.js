// WHAT PREMIUM ADDS — the one list, for every surface that has to sell it.
//
// This copy used to live inside pricing-page.js, which was fine while the price
// page was the only place that made the pitch. It no longer is: the first-visit
// popup (premium-popup.js) makes the same argument to someone who has not asked
// for it yet, and a second hand-written copy of nine sentences is a guarantee
// that one day the two will disagree about what the product does.
//
// The NAMES come from PREMIUM_FEATURES — the list the dashboard and the
// league-prize banner already read, kept in step with the API's copy by a test.
// That is the thing which must never drift: a price list quietly naming a
// feature the product no longer calls that is worse than no list.
//
// The SENTENCES are written here rather than reused from that list, because
// those hints are in-product tooltips and speak the dashboard's casual voice —
// «بریز», «بخون». That voice is right beside a button someone already paid for
// and wrong on the page asking them for a million toman. Same features,
// register to match the moment.
import { PREMIUM_FEATURES } from './config.js';

/**
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
 * and the timing of the new-article notification.
 *
 * The notification line says ONE thing, because one thing is what it is. An
 * earlier draft went on to explain that the article itself is open to everyone
 * at publish — true, and about something nobody reading a price list was
 * wondering. A benefit stated with a caveat attached reads as a benefit being
 * walked back.
 *
 * The score multiplier is here only because the API now actually grants it
 * (score.ts's PREMIUM_SCORE_MULTIPLIER, stamped per earning by migration 0023).
 * It was held out of the first version of this list precisely because it was not
 * implemented yet, and a benefit printed beside a payment button has to be one
 * the buyer receives. Its sentence names the shields rather than the number,
 * because the shields are the only thing the score is ever spent on — a reader
 * has no use for «۱٫۲ برابر» unless they are told what it buys.
 */
const EXTRA_PERKS = [
  { title: 'بدون تبلیغ', hint: 'هیچ تبلیغی، در هیچ صفحه‌ای.' },
  { title: 'اطلاع فوری از مطلب تازه', hint: 'نوتیفیکیشن مطلب تازه بلافاصله پس از انتشار می‌رسد.' },
  {
    title: 'ضریب بالاتر امتیاز',
    hint: 'امتیازی که با اشتراک به دست می‌آورید ۱٫۲ برابر حساب می‌شود، پس سپرهای استریک زودتر می‌رسند.',
  },
];

/** Every premium benefit, in pitch order: `[{ title, hint }, …]`. */
export function premiumBenefits() {
  return [
    ...PREMIUM_FEATURES.map((f) => ({ title: f.title, hint: PITCH[f.title] || f.hint })),
    ...EXTRA_PERKS,
  ];
}
