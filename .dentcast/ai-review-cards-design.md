# کارت‌های «نکته هوش مصنوعی» در مرور روزانه — سند طراحی (فاز ۱: طراحی)

> وضعیت: طراحی، پیش از اجرا. زمینه‌ی تصمیم‌ها: `CLAUDE.md` + بخش ۵
> `.dentcast/bundles-handoff.md` (تأیید بنیان‌گذار: کارت AI فقط با نشان و
> حاشیه‌ی متمایز؛ کوییز مستقل رد شده). backfill صفحات قدیمی فاز جداست و
> این‌جا نیست — طراحی باید با پوشش ناقص (الان ۲۵/۱۴۵ صفحه، ۱۱۴ کارت) درست
> کار کند.

## ۱. تصویر کلی

«مرور امروز» (`/plus/cards.html` → `plus/js/review.js`) علاوه بر
هایلایت‌های خود کاربر، کارت‌های مفهومی استخراج‌شده از JSON-LD
`DefinedTermSet` صفحات (`plus/flashcards-index.json`، گام 4.11 ورک‌فلو) را
هم در همان صف می‌آورد — فقط از مقاله‌هایی که کاربر واقعاً مصرف کرده. یک
جلسه‌ی ترکیبی، یک زمان‌بندی (همان لایتنر)، یک گیت (همان `requirePremium`)،
یک بودجه‌ی XP و rate-limit (همان سقف‌های فعلی، مشترک — نه جداگانه).

دو نوع کارت، دو رفتار، هرگز قاطی نمی‌شوند:

| | کارت هایلایت (موجود) | کارت AI (جدید) |
|---|---|---|
| منبع | `highlights` خود کاربر | `flashcards-index.json` |
| نمایش | کامل، مثل الان — هرگز cloze/مخفی نمی‌شود | front → لمس «نمایش پاسخ» → back |
| نشان | «هایلایت شما» + رنگ هایلایت | «نکته هوش مصنوعی» + توکن کهربایی `--dcp-gold` |
| state | `card_state` (`highlight_id NOT NULL` — دست نمی‌خورد) | جدول موازی `ai_card_state` |
| نمره‌دهی | `POST /review/answer` (بدون تغییر) | `POST /review/answer-ai` (جدید) |

## ۲. اسکیمای DB — migration `0035_ai_card_state.cjs`

کامنت `routes/review.ts` صریح است: `card_state.highlight_id` عمداً
`NOT NULL` می‌ماند. پس مسیر موازی، نه ستون nullable:

```sql
create table ai_card_state (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  content_id     text not null,
  card_id        text not null,   -- id کارت داخل ایندکس، مثل 'flashcards-c1'
  box            int  not null default 1,
  next_review_at timestamptz not null,
  last_result    text,
  reviewed_count int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, content_id, card_id)
);
create index on ai_card_state (user_id, next_review_at);
```

تصمیم‌های کلیدی:

- **متن کارت هرگز در DB ذخیره نمی‌شود.** ایندکس منبع حقیقت متن است (مثل
  taxonomy که «هرگز در DB زندگی نمی‌کند»)؛ DB فقط state زمان‌بندی هر
  (کاربر، کارت) را دارد و با کلید `(content_id, card_id)` به ایندکس وصل
  می‌شود. بازتولید ایندکس متن را عوض کند، state سر جایش می‌ماند.
- **کارتی که از ایندکس حذف شود، رها می‌شود نه پاک** — در join حافظه‌ای با
  ایندکس دیگر بالا نمی‌آید؛ نه cascade لازم است نه پاک‌سازی. اگر برگردد،
  state قبلی‌اش هم برمی‌گردد (رفتار درست برای rebuild ایندکس).
- **`next_review_at` این‌جا `NOT NULL` است** (برخلاف `card_state`): درس
  migration 0034 — «null یعنی الان due» همان دری بود که مزرعه از آن آمد.
  ردیف فقط موقع اولین پاسخ ساخته می‌شود و همان لحظه زمان‌بندی می‌شود، پس
  حالت null اصلاً وجود ندارد.

### seeding تنبل، نه fan-out

برخلاف هایلایت (که ردیف card_state موقع ساخت هایلایت درست می‌شود)، برای
کارت AI **هیچ ردیفی از پیش ساخته نمی‌شود**:

- کارتِ بدون ردیف = «نو». نو بودن یعنی هنوز پاسخ داده نشده؛ due بودنش
  محاسبه‌ای است (بخش ۴).
- اولین `POST /review/answer-ai` ردیف را upsert می‌کند
  (`on conflict (user_id, content_id, card_id) do update`).
- چرا نه seeding روی `article_completed`؟ چون doctrine ثبت‌شده (کامنت
  0032) می‌گوید `POST /activity` فقط log می‌نویسد و به card-state دست
  نمی‌زند؛ و چون fan-out نوشتن N ردیف در مسیر پرتردد، برای داده‌ای که
  به‌صورت تنبل هم دقیقاً همان رفتار را می‌دهد، خرج بی‌دلیل است. با پوشش
  ناقص و backfill آینده هم tolerant است: صفحه‌ای که بعداً کارت‌دار شود،
  خودبه‌خود برای مصرف‌کننده‌های قبلی‌اش ظاهر می‌شود.

## ۳. لود ایندکس سمت سرور — `plus-api/src/flashcards.ts`

دقیقاً الگوی سه‌قلوی موجود (`content-index.ts` / `pathways.ts` /
`badges.ts`)، عضو چهارم خانواده:

- خواندن از دیسک با reload-on-change روی mtime؛ مسیر پیش‌فرض
  `../../plus/flashcards-index.json`، قابل‌جابه‌جایی با
  `FLASHCARDS_PATH` (config: `flashcardsPath`).
- `applyRemoteFlashcards(raw)`: اعتبارسنجی شکل — object بودن، `byContent`
  غیرآرایه و **غیرخالی** (همان «چک خالی‌نبودن» که مهم‌ترین چک
  content-index است)، هر کارت `front`/`back` رشته‌ی غیرخالی. رد شود، کپی
  فعلی می‌ماند (upgrade-only, last-good).
- `flashcardsSource()` برای لاگ boot/refresh، `resetRemoteFlashcards()`
  برای تست‌ها — قرینه‌ی بقیه.
- `content-refresh.ts`: بلوک چهارم با `config.content.flashcardsUrls`
  (`FLASHCARDS_URL`، لیست دو mirror مثل بقیه) — ویرایش/backfill ایندکس
  commit به سایت است، نه deploy مجدد API.
- APIهای داخلی ماژول: `getCardsFor(contentId)`،
  `getCard(contentId, cardId)`، `contentIdsWithCards()`.

## ۴. شکل API

هر دو route زیر همان `preHandler`های فعلی `reviewRoutes` می‌روند
(`requireAuth` + `requirePremium`). مسیر رایگان `card_reviewed_manual`
(POST /activity) دست نمی‌خورد.

### `GET /review/due` — توسعه‌ی سازگار با عقب

پاسخ فعلی `{ due: [...] }` عیناً می‌ماند (کلاینت قدیمی نمی‌شکند)؛ یک
آرایه‌ی دوم اضافه می‌شود:

```jsonc
{
  "due": [ /* بدون هیچ تغییری — ردیف‌های هایلایت مثل امروز */ ],
  "ai_due": [
    {
      "content_id": "chairside/chairside-26",
      "card_id": "flashcards-c1",
      "front": "…", "back": "…",
      "box": 1, "next_review_at": null, "reviewed_count": 0
    }
  ]
}
```

محاسبه‌ی `ai_due` (این‌جا قلب فیچر است):

1. **گیت مصرف:** `getConsumedContentIds` تعیین می‌کند از کدام صفحه‌ها
   اصلاً کارت بیاید — از مطلب نخوانده سؤال نمی‌پرسیم. برای گام ۲ یک
   helper خواهر در `consumption.ts` اضافه می‌شود:
   `getConsumedContentTimes(userId)` → `Map<content_id, first_consumed_at>`
   (همان union فعلی با `min(created_at)`؛ تابع موجود و امضایش دست
   نمی‌خورد).
2. **بلوغ یک‌روزه برای کارت نو:** کارتِ بدون ردیفِ state وقتی due است که
   `first_consumed_at + intervalDaysForBox(1)` گذشته باشد. این همان قانون
   «کارت زمان‌بندی می‌شود، due به دنیا نمی‌آید» (migration 0034) است،
   این‌بار بدون نیاز به ردیف: خواندن مقاله و پاسخ‌دادن در همان لحظه، مرور
   نیست و XP هم نمی‌سازد.
3. **کارت‌های state‌دار:** `ai_card_state` با `next_review_at <= now()`.
4. **فیلتر `topic`:** همان معنای فعلی — `folder:` با prefix روی
   `content_id`، وگرنه `resolveTopic`؛ روی مجموعه‌ی مرحله‌ی ۱ اعمال
   می‌شود تا مرورِ داخل آرشیو یک موضوع، ترکیبی بماند.
5. **سهمیه (سیاست ترکیب):** `ai_due` حداکثر
   `AI_SHARE = ceil(limit / 3)` کارت برمی‌گرداند (پیش‌فرض limit=20 →
   حداکثر ۷). صف هایلایت‌ها مثل امروز تا `limit` پر می‌شود و دست نمی‌خورد.
   جلسه هایلایت‌محور می‌ماند (مواد خود کاربر اولویت است)، ولی کاربری که
   هایلایت due ندارد هم جلسه‌ی خالی نمی‌بیند — حداکثر ۷ کارت AI می‌گیرد.
   ترتیب داخل سهمیه: اول state‌دارها به ترتیب `next_review_at`، بعد
   نوها به ترتیب قدمت مصرف (قدیمی‌ترین مصرف اول).

### `POST /review/answer-ai` — جدید

```jsonc
// body
{ "content_id": "chairside/chairside-26", "card_id": "flashcards-c1", "result": "remembered" | "forgot" }
```

route جدید به‌جای گشادکردن `POST /review/answer` (که schema و کامنت
`highlight_id`اش سر جایش می‌ماند). منطق، آینه‌ی answer فعلی:

1. **همان شمارنده‌ی rate-limit، نه شمارنده‌ی تازه:**
   `consume('review:user:' + userId, config.review.maxPerUserPerHour)` —
   کلید مشترک با answer فعلی، پس ۲۰۰ در ساعت سقفِ **مجموع** دو نوع کارت
   است. لِین جدیدی برای farming باز نمی‌شود.
2. **اعتبار کارت:** `(content_id, card_id)` باید در ایندکس موجود باشد
   **و** `content_id` در مصرف‌شده‌های کاربر — وگرنه 404. (بدون این، endpoint
   راه ساخت ردیف دلخواه و پاسخ به نخوانده‌ها می‌شد.)
3. **تراکنش:** upsert ردیف `ai_card_state` با `for update`؛
   `nextBox`/`intervalDaysForBox` از همان `services/leitner.ts` (هیچ جای
   دیگری انتقال box حساب نمی‌شود — قانون خود فایل).
4. **بود-due-یا-نه (پادفارم):** قرینه‌ی `was_due` — برای ردیف موجود یعنی
   `next_review_at <= now()`؛ برای کارت نو یعنی گذشتنِ بلوغ یک‌روزه‌ی
   بند ۴.۲. کارت در هر حال جابه‌جا می‌شود (مرور زودهنگام آزاد است)، ولی
   فقط اگر due بود `recordActivity(userId, 'review_finished', content_id,
   { card_id, result })` نوشته می‌شود.
5. **XP:** چون همان اکشن `review_finished` است، سقف هفتگی مشترک
   (`xp_review_weekly_cap = 60`، `weekActionCountAny` در league.ts) و
   streak و score و نشان «مرورگر» بدون یک خط تغییر شامل حالش می‌شوند.
   **هیچ تغییری در league.ts / score.ts / streak.ts لازم نیست و نمی‌کنیم.**
6. `scheduleAchievementSync(userId)` مثل answer فعلی.

### آن‌چه عمداً در نسخه‌ی ۱ دست نمی‌خورد

- **`GET /me`ِ `due_card_count`:** فقط شمارش هایلایت‌ها می‌ماند. کامنت خود
  route صریح است که «هیچ چیز گرانی به /me اضافه نشود» (کارت اسپانسر پشت
  همین صبر می‌کند) و شمارش due کارت‌های AI محاسبه‌ی حافظه‌ای روی ایندکس ×
  مصرف می‌خواهد، نه یک count ایندکس‌دار. کم‌شماری جزئیِ نشانگر، به گران‌شدن
  /me می‌ارزد. (اگر بعداً لازم شد: شمارش فقط ردیف‌های state‌دار due یک
  count ارزان است — تصمیم آگاهانه برای بعد.)
- **`review-notify.ts` (یادآور ۹ صبح):** بر همان مبنای هایلایت می‌ماند؛
  همان مصالحه‌ی بالا.
- **`GET /export/highlights` و هر سطح رایگان:** بی‌ربط، بدون تغییر.

## ۵. فرانت — `plus/js/review.js` + `plus/plus.css`

کامنت رزروِ بالای `review.js` («Hiding stays reserved for a later,
separate card source…») دقیقاً همین فاز است؛ اجرا که شد، همان کامنت
به‌روز می‌شود.

- **ادغام صف (کلاینت):** الگوی قطعی ۲:۱ — بعد از هر ۲ کارت هایلایت، ۱
  کارت AI؛ باقی‌مانده‌ی هر طرف تهِ صف. کاربر بدون هایلایت due فقط
  کارت‌های AI را می‌بیند (حداکثر ۷). شمارنده‌ی «N کارت» جمع هر دو.
- **کارت AI (`renderAiCard`):**
  - نشان «نکته هوش مصنوعی» (کلاس `dcp-rv-badge-ai`) + کل کارت با variant
    `dcp-rv-card-ai`: حاشیه/لهجه‌ی کهربایی از توکن‌های موجود
    `--dcp-gold` / `--dcp-gold-bg` (در هر دو تم تعریف شده‌اند؛ literal
    ممنوع). هیچ چیزِ AI-ساخته بدون برچسب نمایش داده نمی‌شود — تصمیم
    بنیان‌گذار.
  - **front نمایان، back مخفی**: دکمه‌ی «نمایش پاسخ» back را باز می‌کند؛
    دکمه‌های نمره («بلد بودم» / «دوباره مرورش کن») تا پیش از باز شدن پاسخ
    render نمی‌شوند — نمره‌دادن به پاسخِ ندیده بی‌معنی است.
  - خط منبع مثل کارت هایلایت: «منبع: عنوان مقاله» از
    `contentInfo(model, content_id)` (بدون `?dcphl` — هایلایتی در کار
    نیست).
  - نمره → `api.reviewAnswerAi(content_id, card_id, result)` +
    `signalStreakActivity()` — همان چرخه‌ی کارت فعلی.
- **کارت هایلایت: صفر تغییر رفتاری.** همیشه کامل، هرگز cloze.
- `plus/js/api.js`: افزودن
  `reviewAnswerAi: (content_id, card_id, result) => request('/review/answer-ai', …)`.
- **حالت خالی:** «هنوز چیزی برای مرور نداری» فقط وقتی هر دو آرایه خالی‌اند.
- **گیت صفحه (`cards-page.js`): بدون تغییر** — free همان «coming soon»
  فعلی را می‌بیند.
- **نسخه‌ها:** چون `review.js`/`api.js`/`plus.css` عوض می‌شوند:
  `python3 tools/asset_version.py --bump` در همان کامیت، و چون فایل‌های
  گراف لودر plus تغییر می‌کنند شمارنده‌ی `V` در `dc-nav.js` هم ۶۷ → ۶۸.

## ۶. تست‌ها (اجباری، الگوی `test/pathways.test.ts` و تست‌های review)

`plus-api/test/review-ai.test.ts` (+ گسترش `content-refresh` در صورت نیاز):

- **loader:** خواندن از دیسک؛ `applyRemoteFlashcards` payload سالم را
  می‌پذیرد، خالی/HTML/بی‌`byContent` را رد می‌کند و کپی قبلی می‌ماند؛
  `flashcardsSource()` جابه‌جایی را گزارش می‌کند.
- **due:** مقاله‌ی مصرف‌نشده کارت نمی‌دهد؛ مصرف‌شده‌ی زیر ۲۴ ساعت هنوز
  نمی‌دهد؛ بعد از بلوغ می‌دهد؛ سهمیه‌ی `ceil(limit/3)` رعایت می‌شود؛
  `due` هایلایت‌ها بایت‌به‌بایت مثل قبل؛ فیلتر `topic` روی هر دو؛ صفحه‌ی
  بدون کارت در ایندکس (پوشش ناقص) بی‌صدا صفر کارت.
- **answer-ai:** upsert ردیف + پیشروی box با `nextBox`؛ `forgot` → box 1؛
  کارت غیرموجود در ایندکس یا مقاله‌ی مصرف‌نشده → 404؛ پاسخِ کارتِ غیر-due
  state را جابه‌جا می‌کند ولی `review_finished` نمی‌نویسد؛ rate-limit
  مشترک با `/review/answer` (پر کردن یکی، دیگری را 429 می‌کند)؛ گیت
  premium (free → 403).
- **XP:** ثبت `review_finished` از مسیر AI زیر همان سقف هفتگی مشترک
  می‌رود (شمارش ترکیبی دو مسیر از cap عبور نمی‌کند).
- **DOM (الگوی `notices.dom.test.ts`):** کارت AI نشان و کلاس متمایز دارد؛
  back قبل از لمس غایب است و دکمه‌های نمره بعد از reveal می‌آیند؛ کارت
  هایلایت بدون تغییر و بدون مخفی‌سازی render می‌شود.

## ۷. ترتیب اجرا (فازهای بعدی، پس از تأیید این سند)

1. Migration `0035` + `flashcards.ts` + config + بلوک چهارم
   `content-refresh.ts` + تست‌های loader.
2. `consumption.ts` (helper جدید) + `GET /review/due`ِ گسترش‌یافته +
   `POST /review/answer-ai` + تست‌های API.
3. فرانت (`review.js`، `api.js`، `plus.css`) + bump نسخه‌ها + تست DOM.
4. تأیید مرورگر واقعی (Playwright/Chromium محلی، لاگین OTP از لاگ dev،
   ارتقای tier در DB) در هر دو تم + اسکرین‌شات؛ گزارش پایانی.

خارج از محدوده (فازهای جدا، این‌جا انجام نمی‌شود): backfill
DefinedTermSet صفحات قدیمی؛ افزودن AI به `due_card_count`ِ /me و یادآور
مرور؛ هر شکلی از کوییز مستقل (رد شده).
