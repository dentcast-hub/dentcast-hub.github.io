# DentCast Spot — Ad Reporting Router

Sibling to `ads.md` (which *publishes* ads). This one *reports* on them: how
many times ads were seen, split by viewer type, by campaign, and by placement,
over a day / week / month.

**Trigger (registered in `CLAUDE.md`):** the user asks for ad numbers —
«گزارش تبلیغ بده», «آمار تبلیغات», «تبلیغ‌ها چقدر دیده شدن؟», «ماه گذشته چند
تا ایمپرشن داشتیم؟», «کلیک اسپانسر X چقدر بوده؟». No config is edited in this
workflow — it is read-only reporting.

---

## What the data is

`spot/spot.js` sends two GA4 events (property `G-GMM0WC8X3M`), each with three
parameters:

| رویداد | معنی |
|---|---|
| `ad_impression` | یک کارت تبلیغ روی صفحه رندر شد |
| `ad_click` | کاربر روی کارت کلیک کرد |

| پارامتر | مقادیر |
|---|---|
| `ad_slot` | `article`, `home`, `player`, `episodes`, `dashboard`, `profile`, `search`, `archive` |
| `ad_creative` | `premium`, `brand-invite`, و id هر اسپانسر |
| `viewer` | `anon` (لاگین‌نکرده) — `plus` (لاگین‌کردهٔ رایگان) |

---

## Hard rules for every report

1. **واحد = تعداد بارِ نمایش، نه تعداد آدم.** Always read the GA4 metric
   **Event count**. NEVER report "Total users" as the headline number: the
   user has stated explicitly that one person seeing an ad 20 times while
   browsing counts as 20. Users may be quoted as a secondary line («این ۲۰
   هزار نمایش از حدود ۳٬۱۰۰ مرورگر آمده») but never as the main figure.
2. **پریمیوم همیشه صفر است — و این داده نیست، تعریف است.** Premium users see
   no ads, so they emit no events. Say «پریمیوم: تبلیغ نمی‌بیند (طبق طراحی)»,
   never «پریمیوم: ۰ نمایش» as if it were measured.
3. **همیشه بگو عدد کفِ واقعیت است.** Adblockers block `googletagmanager.com`
   (not the cards themselves — Spot's naming is blocker-neutral), so every
   number is an undercount. Impressions and clicks are lost together for the
   same visitor, so **CTR stays roughly honest while absolute counts do not**.
   Put this line in every sponsor-facing report.
4. **ایمپرشن یعنی «رندر شد»، نه «دیده شد».** Only the `archive` slot verifies
   viewport visibility (IntersectionObserver). Everything else — including the
   in-article card — counts at insertion, even if the visitor never scrolls to
   it. State this whenever CTR is quoted.
5. **تاریخ شروع دادهٔ تفکیکی: ۱۴۰۵/۰۵/۰۴ (2026-07-26).** The `viewer`
   parameter shipped that day, and GA4 custom dimensions are **not
   retroactive**. Any request covering earlier dates gets totals only, with a
   plain sentence saying the anon/plus split does not exist for that period.
   Never back-fill, estimate, or interpolate the missing split.
6. **هیچ عددی حدس زده نمی‌شود.** If the data is not in hand (see next
   section), say so and hand over the recipe — an invented or "typical"
   number in a sponsor report is worse than no report.

---

## Where the numbers come from (in order)

1. **A Google Analytics connector/API, if one is ever available in the
   session.** Check first; there is none by default.
2. **An export the user provides.** Ask them to run the exploration below and
   export CSV → then read it (a file drop, or Google Drive, which IS
   available). This is the practical path today.
3. **Neither → hand over the recipe** in the next section so they can read it
   themselves in two minutes, and offer path 2 for next time.

**Say which path was used at the top of the report.** A report built from an
export the user supplied is evidence; a recipe is not a report.

---

## One-time GA4 setup (do this before any real reporting)

Event parameters do not appear in GA4 reports until they are registered as
custom dimensions, and registration is not retroactive — so this must happen
BEFORE a sponsor contract starts, not at the end of it.

`Admin → Data display → Custom definitions → Create custom dimension`, three
times, scope **Event**:

| Dimension name | Event parameter |
|---|---|
| Ad slot | `ad_slot` |
| Ad creative | `ad_creative` |
| Viewer | `viewer` |

Also recommended once: `Admin → Data retention → 14 months` (the 2-month
default silently truncates Explorations, which is where these reports live).

Verification without waiting: `Reports → Realtime` or `DebugView` shows the
parameters live even before registration.

---

## The exploration (month / week / day)

`Explore → Free form`:

- **Dimensions:** `Ad creative`, `Ad slot`, `Viewer`, plus a date dimension —
  `Date` (روزانه), `Week`, or `Month` (or `Nth month` for «ماه گذشته»).
- **Metric:** `Event count`.
- **Filter:** `Event name` exactly matches `ad_impression` (نمایش‌ها) or
  `ad_click` (کلیک‌ها).
- **Date range:** Last 7 days / Last 28 days / Last month, per the ask.

Rows come out as `creative × slot × viewer × period`, which is exactly the
breakdown the user asked for; sum or pivot as needed.

---

## Report shape (Persian, this order)

```
بازهٔ ‹…› — منبع: ‹اکسپورت کاربر / …›

کل نمایش: ‹N›   کل کلیک: ‹M›   CTR: ‹M/N›

به تفکیک بیننده:
  مهمان (لاگین‌نکرده): ‹…› نمایش، ‹…› کلیک
  پلاس رایگان:        ‹…› نمایش، ‹…› کلیک
  پریمیوم:            تبلیغ نمی‌بیند (طبق طراحی)

به تفکیک تبلیغ:  ‹creative›: ‹…›  …
به تفکیک جایگاه: صفحهٔ اصلی ‹…› / مقاله ‹…› / جستجو ‹…› / …

هشدارها: کفِ واقعیت (ادبلاک) — ایمپرشن = رندر نه لزوماً دیده‌شدن
```

Translate slot ids to Persian names for the user («صفحهٔ اصلی» = `home`,
«مقاله» = `article`, «جستجوی سراسری» = `search`, «تب آرشیو» = `archive`,
«پلیر» = `player`, «آرشیو اپیزودها» = `episodes`, «پیشخوان» = `dashboard`,
«پروفایل» = `profile`).

Two comparisons worth adding unprompted when the data allows:
- **سهم هر تبلیغ در برابر سهم زمان‌هایش** — with `advance: "session"`, a
  campaign holding 2 of 4 زمان‌ها should land near half the impressions. A big
  gap means an `audience`/`slots` gate is quietly falling back (`ads.md`
  rule 9's silent surprise).
- **دو دامنه یک property‌اند** — `.org` and `.ir` share the tag, so split by
  the `Hostname` dimension when the user asks «کدام دامنه؟».
