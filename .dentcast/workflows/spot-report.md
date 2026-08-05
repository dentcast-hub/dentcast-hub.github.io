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

**نبضِ خرابی:** if a report POST to our API fails (non-2xx or network), the client
emits **`spot_report_failed`** to GA with the HTTP status, once per page view.
The two channels fail independently — an adblocker takes GA, an outage/CORS/rate
limit takes ours — so both silent at once is itself the signal. **Before treating
a low number as low demand, check this event in GA**: a wall of `429` or
`network` means the pipeline is dropping events, not that nobody saw an ad.

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
4. **ایمپرشن یعنی «دیده شد»، نه «رندر شد».** A card counts only after it has
   been at least **۵۰٪ روی صفحه، یک ثانیهٔ پیوسته، در تبِ فعال** (the IAB
   display rule; thresholds live in `spot-config.json` → `seen`). So a card the
   visitor never scrolled to, a background/prerendered tab, and a fast scroll
   past the card all count **nothing** — the number you report is delivered
   inventory, and it is defensible to a sponsor's own measurement. It is
   therefore **lower** than the number of pages that carried an ad; never
   present the two as the same thing.
5. **دو دستهٔ بیننده، و پریمیوم هرگز.** Only `anon` (signed-out) and `plus`
   (signed-in, free) can generate ad events at all. `premium` never renders an
   ad, so it never appears in `by_viewer` — see rule 2. That split is therefore
   the complete picture of ad inventory, not a partial one.

   **ولی «پریمیوم» یک طبقه نیست — یک جایزهٔ سه‌روزهٔ لیگ است.** Nobody holds
   premium as a plan: in the database every real account is `tier = 'free'`,
   which is exactly what «پلاس» means. `premium` is only ever the prize granted
   to the top of each valid league group for `prize_days` (3), after which
   `expirePremiumPrizes` puts them back to `free`. At any moment the premium
   population is that week's winners (≈1 per group) plus the founder's own two
   accounts.

   Two consequences a report must respect:
   - The `page_views.premium` column in this endpoint is those prize holders and
     the founder — never describe it as a paying tier.
   - **Never read a tier-split metric as a plan comparison.** `/admin/kpis`
     groups `d7_survival_by_tier` by `profiles.tier`, i.e. the CURRENT label —
     so its `premium` row is this week's winners, who were selected *for being
     the most active member of their group*. On 2026-08-04 that row read 50٪
     against 6.1٪ for `free`, and hours later — when 12 winners reverted — the
     same twelve people lifted the `free` row to 8.9٪. Same humans, opposite
     conclusion. It is selection, not an effect; do not report it as one.
6. **تاریخ شروع: ۱۴۰۵/۰۵/۰۴ (2026-07-26)** — the day the client emitter
   shipped. There is **no** ad data of any kind before it. For GA's `viewer`
   split the same date applies (custom dimensions are not retroactive). Any
   request covering earlier dates gets a plain sentence saying so. Never
   back-fill, estimate, or interpolate.
   **یک ناپیوستگی در همان روز اول:** the first few hours of 2026-07-26 counted
   ads at render (the viewability rule shipped later the same day), so a handful
   of impressions on that single day are "rendered", not "seen". Mention it only
   if a report is specifically about that day.
7. **سقف نرخ: ۶۰۰ رویداد در ساعت** per IP (guests) or per user (signed-in),
   `SPOT_EVENT_MAX_PER_IP_PER_HOUR`. Iranian mobile readers share NAT
   addresses, so a very busy hour on one carrier IP can shed events. If a
   report shows a suspiciously flat ceiling on a peak day, say so rather than
   presenting it as demand.
8. **نمایش را هرگز بدون مخرجش گزارش نکن.** «۲۱ نمایش مهمان» به‌تنهایی نه خوب
   است نه بد؛ کنارِ «از چند بازدید صفحه» معنا پیدا می‌کند. هر دو عدد در همان
   پاسخ هستند (`page_views` و `impressions_per_view`) — پس بهانه‌ای برای
   گزارشِ بی‌مخرج نیست. نسبتِ مهمان در برابر نسبتِ پلاس هم مقایسه‌ای است که
   خودش را باید در گزارش نشان دهد: اگر نسبتِ یک کلاس چند برابر دیگری باشد،
   قبل از هر تفسیری باید علتش پیدا شود.
9. **هیچ عددی حدس زده نمی‌شود.** If the data is not in hand, say so and hand
   over the command — an invented or "typical" number in a sponsor report is
   worse than no report.
10. **مخرجِ درست، بازدید صفحه است — نه «کاربر» از یک سیستم دیگر.** Comparing our
   impression count against a user count from GA or the ArvanCloud panel mixes
   three different definitions (an event, a JS-executing visitor, a CDN log
   entry that may be a bot). Bots never run JS, so they never produce a page
   view *or* an impression in our data — which makes a CDN "users" figure
   structurally larger and not a valid denominator. Use `page_views` from the
   same response. This exact confusion triggered a full investigation on
   2026-07-27 that found nothing wrong with the pipeline.
11. **تفکیک دامنه از ۱۴۰۵/۰۵/۰۵ (2026-07-27) به بعد در دسترس است** — `by_host`
   plus `?host=dentcast.ir|dentcast.org|unknown`. The host is derived
   server-side from Origin/Referer, never from the request body. Rows written
   before that day carry `host: "unknown"` — that is "not recorded", never
   "neither mirror", and it must not be split, estimated or attributed.

---

## Where the numbers come from

**Primary — the admin endpoint** (founder-only, HTTP Basic):

```
GET /admin/spot/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=day|week|month
```

Inclusive Tehran days; default window = last 30 days. Returns `totals`,
`by_period`, `by_slot`, `by_creative`, `by_viewer`, `by_host` (each with `impressions`,
`clicks`, `ctr_pct`) plus raw `period × slot × creative × viewer` rows — i.e.
every split this workflow needs, already aggregated.

**The same response carries the denominator** — `page_views` (`totals` per
viewer class, `by_period`, and `since` = the first day that has any data) and
`impressions_per_view` per viewer class. Use it: a bare impression count cannot
be judged, and the guest ratio is the only thing that separates a quiet day from
a hole in the pipeline. It is counted server-side from `GET /me`, which every
page view calls exactly once — so it is adblock-proof and crawler-free (bots run
no JS), and premium views are held out of it because those visitors are shown no
ad. `impressions_per_view` is **null, never 0**, when the window has no
page-view data; report it as «داده‌ای نیست», not as a zero. Nothing exists
before **2026-07-26**.

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
  مهمان (لاگین‌نکرده): ‹…› نمایش از ‹…› بازدید صفحه — ‹…› نمایش به ازای هر بازدید
  پلاس رایگان:        ‹…› نمایش از ‹…› بازدید صفحه — ‹…› نمایش به ازای هر بازدید
  پریمیوم:            تبلیغ نمی‌بیند (طبق طراحی) · ‹…› بازدید صفحه

به تفکیک تبلیغ:  ‹creative›: ‹…›  …
به تفکیک جایگاه: صفحهٔ اصلی ‹…› / مقاله ‹…› / جستجو ‹…› / …
روند: ‹by_period، روز/هفته/ماه بسته به درخواست›

هشدارها: ‹فقط آن‌هایی که واقعاً به این بازه مربوط‌اند›
```

Translate slot ids to Persian for the user («صفحهٔ اصلی» = `home`, «مقاله» =
`article`, «ستون موضوعی» = `pillar`, «جستجوی سراسری» = `search`, «تب آرشیو» =
`archive`, «پلیر» = `player`, «صفحهٔ اپیزود» = `episode`, «آرشیو اپیزودها» =
`episodes`, «پیشخوان» = `dashboard`, «پروفایل» = `profile`).

**`episode` و `episodes` را هرگز در یک سطر ادغام نکن** — اولی صفحهٔ تکِ اپیزود
است و دومی صفحهٔ آرشیو `episodes.html`. اسمشان یک حرف فرق دارد و معنایشان کاملاً
جداست.

Two slots shipped on **2026-07-28** and have no data before that day:

- `pillar` — the first slot on a signed-out-heavy surface, so its `anon` share is
  expected to run far above every other slot's. That is the point of it, not an
  anomaly.
- `episode` — **and it carries a reporting discontinuity.** Before this date the
  212 single-episode pages were measured under `article`; from this date they are
  measured under `episode`. So a sudden drop in `article` across that boundary is
  a **relabel, not a decline** — say so explicitly in any report whose window
  spans 2026-07-28, and never compare `article` before/after without the caveat.

Two comparisons worth adding unprompted when the data allows:

- **سهم هر تبلیغ در برابر سهم زمان‌هایش** — with `advance: "view"` (از
  ۱۴۰۵/۰۵/۱۲؛ پیش از آن `"session"` بود), a campaign holding 2 of 4 زمان‌ها
  should land near half the impressions. A big
  gap means an `audience`/`slots` gate is quietly falling back (`ads.md`
  rule 9's silent surprise).
- **مهمان در برابر پلاس** — the split is a real audience fact (not a sampling
  artifact), so it is safe to reason about: it says which visitor class the
  inventory actually reaches, and therefore which `audience` targeting is
  worth selling.
