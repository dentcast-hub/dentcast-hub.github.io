# DentCast Spot — Ad Reporting Router

Sibling to `ads.md` (which *publishes* ads). This one *reports* on them: how
many times ads were seen, split by viewer type, by campaign, and by placement,
over a day / week / month.

**Trigger (registered in `CLAUDE.md`):** the user asks for ad numbers —
«گزارش تبلیغ بده», «آمار تبلیغات», «تبلیغ‌ها چقدر دیده شدن؟», «ماه گذشته چند
تا نمایش داشتیم؟», «کلیک اسپانسر X چقدر بوده؟». No config is edited in this
workflow — it is read-only reporting.

---

## Two recorders, one of them authoritative

Every render and click is reported twice by `spot/spot.js`:

| | مقصد | رویدادها | نقش |
|---|---|---|---|
| **۱** | **API خودمان** (`api.dentcast.ir` / `.org`) | `spot_impression` / `spot_click` | **منبع اصلی** |
| ۲ | GA4 (`G-GMM0WC8X3M`) | `ad_impression` / `ad_click` | کنترل متقابل |

**Our own API is the source of truth, and that is not a preference — it is a
data-quality fact.** Adblock filter lists block `googletagmanager.com` but not
a same-site subdomain, so GA structurally undercounts while the first-party
counters do not. Quote GA numbers only as a cross-check, and never mix the two
in one total.

Client → server mapping (`spot/spot.js`, function `report()`):

- مهمان → `POST /anon/event` با `{ event, content_id }`
- لاگین‌کرده → `POST /activity` با `{ action, content_id }`
- `content_id` = `"<slot>:<creative>"` (مثل `home:sponsor-x`)
- `viewer` را **سرور** از روی کوکی سشن پر می‌کند، نه کلاینت — پس برچسب
  مهمان/پلاس قابل جعل یا اشتباه‌شدن از سمت مرورگر نیست.

Server side stores aggregate counters keyed `(day, slot, creative, viewer,
kind)` — a few hundred rows a month, no per-user attribution for ad views by
design. Days are **Asia/Tehran** calendar days (same boundary as the streak
engine); week buckets start **Saturday**.

---

## Hard rules for every report

1. **واحد = تعداد بارِ نمایش، نه تعداد آدم.** The counters literally count
   events, and there is deliberately no per-user attribution — so "چند نفر"
   is not answerable from this data and must not be implied. The user has
   stated explicitly that one person seeing an ad 20 times while browsing
   counts as 20.
2. **پریمیوم همیشه صفر است — و این داده نیست، تعریف است.** Premium users see
   no ads, so they emit no events. Say «پریمیوم: تبلیغ نمی‌بیند (طبق طراحی)»,
   never «پریمیوم: ۰ نمایش» as if it were measured.
3. **عدد سرور تقریباً کامل است؛ عدد GA کفِ واقعیت.** Only three things still
   cost the first-party counters an event: a visitor who blocks *all*
   third-party-ish XHR, a request lost in flight, and the rate limit below.
   Never carry GA's heavy-undercount disclaimer over to server numbers — that
   would understate real inventory in a sponsor report.
4. **ایمپرشن یعنی «رندر شد»، نه «دیده شد».** Only the `archive` slot verifies
   viewport visibility (IntersectionObserver). Everything else — including the
   in-article card — counts at insertion, even if the visitor never scrolls to
   it. State this whenever CTR is quoted.
5. **تاریخ شروع: ۱۴۰۵/۰۵/۰۴ (2026-07-26)** — the day the client emitter
   shipped. There is **no** ad data of any kind before it. For GA's `viewer`
   split the same date applies (custom dimensions are not retroactive). Any
   request covering earlier dates gets a plain sentence saying so. Never
   back-fill, estimate, or interpolate.
6. **سقف نرخ: ۶۰۰ رویداد در ساعت** per IP (guests) or per user (signed-in),
   `SPOT_EVENT_MAX_PER_IP_PER_HOUR`. Iranian mobile readers share NAT
   addresses, so a very busy hour on one carrier IP can shed events. If a
   report shows a suspiciously flat ceiling on a peak day, say so rather than
   presenting it as demand.
7. **هیچ عددی حدس زده نمی‌شود.** If the data is not in hand, say so and hand
   over the command — an invented or "typical" number in a sponsor report is
   worse than no report.

---

## Where the numbers come from

**Primary — the admin endpoint** (founder-only, HTTP Basic):

```
GET /admin/spot/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=day|week|month
```

Inclusive Tehran days; default window = last 30 days. Returns `totals`,
`by_period`, `by_slot`, `by_creative`, `by_viewer` (each with `impressions`,
`clicks`, `ctr_pct`) plus raw `period × slot × creative × viewer` rows — i.e.
every split this workflow needs, already aggregated.

**The credentials are the founder's and are NOT in this repo — never ask for
them, never store them anywhere in the repo.** So in practice:

1. Ask the user to run the request and paste/drop the JSON (Google Drive works
   too). Hand them the exact line, filled in with real dates:
   ```
   curl -u '<user>:<pass>' 'https://api.dentcast.ir/admin/spot/stats?from=2026-07-01&to=2026-07-31&group_by=week'
   ```
2. Then render it in the report shape below. The JSON already carries every
   split, so this is formatting, not computation — recompute nothing except
   percentages you show.
3. If they'd rather not run it, fall back to GA (recipe below) and label the
   report «از GA — کفِ واقعیت» in its first line.

**Say which source was used at the top of every report.** A report built from
the admin endpoint is evidence; a recipe is not a report.

---

## GA cross-check (secondary)

GA only shows the ad parameters once they are registered as custom dimensions
(`Admin → Data display → Custom definitions`, scope **Event**): `ad_slot`,
`ad_creative`, `viewer`. Not retroactive. Then `Explore → Free form` with
those dimensions + `Date`/`Week`/`Month`, metric **Event count**, filtered to
`Event name` = `ad_impression` or `ad_click`.

Useful for one thing above all: comparing GA's total against the server's
total estimates **what share of the audience runs an adblocker** — a genuinely
interesting number for the business, and worth surfacing when both are in hand.

---

## Report shape (Persian, this order)

```
بازهٔ ‹…› — منبع: ‹API خودمان / GA›

کل نمایش: ‹N›   کل کلیک: ‹M›   CTR: ‹…٪›

به تفکیک بیننده:
  مهمان (لاگین‌نکرده): ‹…› نمایش، ‹…› کلیک
  پلاس رایگان:        ‹…› نمایش، ‹…› کلیک
  پریمیوم:            تبلیغ نمی‌بیند (طبق طراحی)

به تفکیک تبلیغ:  ‹creative›: ‹…›  …
به تفکیک جایگاه: صفحهٔ اصلی ‹…› / مقاله ‹…› / جستجو ‹…› / …
روند: ‹by_period، روز/هفته/ماه بسته به درخواست›

هشدارها: ‹فقط آن‌هایی که واقعاً به این بازه مربوط‌اند›
```

Translate slot ids to Persian for the user («صفحهٔ اصلی» = `home`, «مقاله» =
`article`, «جستجوی سراسری» = `search`, «تب آرشیو» = `archive`, «پلیر» =
`player`, «آرشیو اپیزودها» = `episodes`, «پیشخوان» = `dashboard`, «پروفایل» =
`profile`).

Two comparisons worth adding unprompted when the data allows:

- **سهم هر تبلیغ در برابر سهم زمان‌هایش** — with `advance: "session"`, a
  campaign holding 2 of 4 زمان‌ها should land near half the impressions. A big
  gap means an `audience`/`slots` gate is quietly falling back (`ads.md`
  rule 9's silent surprise).
- **مهمان در برابر پلاس** — the split is a real audience fact (not a sampling
  artifact), so it is safe to reason about: it says which visitor class the
  inventory actually reaches, and therefore which `audience` targeting is
  worth selling.
