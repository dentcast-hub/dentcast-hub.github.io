# هندآف اجرای «کارت‌های نکته هوش مصنوعی» — دستور کار مجری

> **نقش این سند:** تمام تصمیم‌های طراحی گرفته شده و این‌جا قفل است. مجری
> (هر ایجنتی که این را اجرا می‌کند) **هیچ تصمیم طراحی جدیدی نمی‌گیرد**؛ اگر
> جایی از این سند با واقعیت کد نخواند یا دو راه ممکن دید، می‌ایستد و از
> بنیان‌گذار می‌پرسد — حدس ممنوع. مبنای استدلال هر تصمیم:
> `.dentcast/ai-review-cards-design.md` (سند طراحی، کامیت‌شده). این سند
> نسخه‌ی اجراییِ همان است، به‌روزشده با وضعیت فعلی repo.
>
> **تاریخ لنگرگیری: 2026-08-10.** همه‌ی شماره‌خط‌ها و شکل‌ها از کد زنده در
> همین تاریخ برداشته شده. اگر فایل از آن موقع عوض شده بود، الگو را دنبال کن
> نه شماره‌خط را.

## ۰. قواعد git و محدوده

- برنچ کار: `claude/ai-review-cards-kbr2zw`. چون محتوای قبلی این برنچ به
  `main` مرج شده، اول برنچ را از سرِ main بازراه‌اندازی کن:
  ```bash
  git fetch origin main
  git checkout -B claude/ai-review-cards-kbr2zw origin/main
  ```
- بعد از هر فاز (بخش ۸) commit + `git push -u origin claude/ai-review-cards-kbr2zw`.
- **بدون دستور صریح بنیان‌گذار به main مرج نکن.**
- پیام‌های کامیت انگلیسی، به سبک کامیت‌های موجود؛ بدون ذکر شناسه‌ی مدل.

### فهرست «دست نزن» (هر تغییری این‌جا = خطای اجرا)

| چی | چرا |
|---|---|
| `card_state` (اسکیمای جدول، `highlight_id NOT NULL`) | کامنت `routes/review.ts:12-15` عمدی است |
| `POST /review/answer` (schema و منطق) | مسیر هایلایت عیناً می‌ماند |
| کلید `due` در پاسخ `GET /review/due` | سازگاری با کلاینت قدیمی — بایت‌به‌بایت مثل قبل |
| `GET /me` / `due_card_count` | تصمیم آگاهانه‌ی نسخه ۱ (design §۴) |
| `services/review-notify.ts` | همان تصمیم |
| `league.ts` / `score.ts` / `streak.ts` | XP از مسیر اکشن مشترک می‌آید، بدون یک خط تغییر |
| مسیر رایگان `card_reviewed_manual` در `POST /activity` | سطح free دست نمی‌خورد |
| `plus/js/cards-page.js` (گیت صفحه) | free همان «coming soon» را می‌بیند |
| رفتار کارت هایلایت در `review.js` | همیشه کامل، هرگز مخفی/cloze |
| `tools/build_flashcards_index.mjs` و خود ایندکس | تولیدی است؛ backfill تمام شده (۳۱۱ صفحه / ۱۰۷۶ کارت) |

## ۱. شکل واقعی ایندکس (منبع حقیقت متن کارت)

`plus/flashcards-index.json` — تولیدشده، الان موجود و کامل:

```jsonc
{
  "version": 1,
  "generatedFrom": "...",
  "contentCount": 311,
  "cardCount": 1076,
  "byContent": {
    "chairside/chairside-1": {
      "cards": [
        { "id": "flashcards-c1", "front": "…", "back": "…",
          "source": "faq", "source_faq_index": 0 }
      ]
    }
  }
}
```

نکته برای مجری: سند طراحی قدیمی‌تر جایی `card_id` را جدا از شکل کارت فرض
کرده بود؛ **شکل بالا مرجع است** — شناسه‌ی کارت `cards[].id` است (مثل
`flashcards-c1`) و در API با نام فیلد `card_id` رد و بدل می‌شود.

## ۲. فاز ۱ — Migration + لودر + config + refresh

### ۲.۱ `plus-api/migrations/0035_ai_card_state.cjs`

آخرین migration موجود `0034` است. سبک فایل را از migrationهای موجود بگیر
(کامنت بلند بالای فایل که «چرا» را می‌گوید — الگوی 0034؛ سینتکس
`pgm.createTable`/`pgm.sql` — الگوی 0001). محتوا دقیقاً:

```sql
create table ai_card_state (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  content_id     text not null,
  card_id        text not null,
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

در کامنت بالای migration این سه را حتماً بنویس (میراث تصمیم‌ها):
- متن کارت هرگز این‌جا نیست؛ ایندکس منبع حقیقت است، این جدول فقط state
  زمان‌بندی هر (کاربر، کارت) است.
- `next_review_at NOT NULL` برخلاف `card_state` — درس migration 0034:
  «null یعنی الان due» همان درِ مزرعه بود. ردیف فقط موقع اولین پاسخ ساخته
  و همان لحظه زمان‌بندی می‌شود؛ حالت null اصلاً وجود ندارد.
- کارت حذف‌شده از ایندکس رها می‌شود نه پاک (در join حافظه‌ای دیگر بالا
  نمی‌آید؛ اگر برگردد state قبلی‌اش هم برمی‌گردد).

`exports.down`: drop جدول.

### ۲.۲ `plus-api/src/flashcards.ts` — عضو چهارم خانواده‌ی لودرها

کپیِ ساختاری `plus-api/src/pathways.ts` / `content-index.ts` (همان
mtime-reload، همان remote-wins، همان last-good). صادرات:

```ts
export interface FlashCard { id: string; front: string; back: string;
  source?: string; source_faq_index?: number; }
interface FlashcardsFile { version: number; byContent: Record<string, { cards: FlashCard[] }>; }

export function applyRemoteFlashcards(raw: unknown): boolean;
export function flashcardsSource(): string;      // 'published (version N)' | 'image/disk'
export function resetRemoteFlashcards(): void;   // تست‌ها
export function getCardsFor(contentId: string): FlashCard[];        // [] اگر نبود
export function getCard(contentId: string, cardId: string): FlashCard | null;
export function contentIdsWithCards(): string[]; // کلیدهای byContent
```

- مسیر پیش‌فرض: `resolve(here, '..', '..', 'plus', 'flashcards-index.json')`؛
  قابل‌جابه‌جایی با `config.flashcardsPath`.
- `applyRemoteFlashcards` رد می‌کند اگر: object نباشد؛ `byContent` object
  غیرآرایه نباشد؛ `byContent` **خالی** باشد (مهم‌ترین چک — همان دلیل
  content-index)؛ هر entry که `cards` آرایه نباشد؛ هر کارت که
  `id`/`front`/`back` رشته‌ی غیرخالی نباشد. (پیمایش کامل؛ ~۱۰۰۰ کارت،
  ارزان است.)
- فایل غایب/خراب روی دیسک → کپی خالی `{version:0, byContent:{}}` + warn،
  مثل content-index.

### ۲.۳ `plus-api/src/config.ts`

دو اضافه، کنار قرینه‌هایشان:

- کنار `badgesPath` (حدود خط ۵۵۱):
  `flashcardsPath: process.env.FLASHCARDS_PATH || '',`
- داخل بلوک `content:` (حدود خط ۵۵۷):
  `flashcardsUrls: list('FLASHCARDS_URL', []),`

کامنت‌ها به سبک همسایه‌ها.

### ۲.۴ `plus-api/src/content-refresh.ts` — بلوک چهارم

عیناً قرینه‌ی بلوک badges: import از `flashcards.js`، متغیر
`lastFlashcardsSource`، بلوک fetch با `config.content.flashcardsUrls` و
برچسب `'flashcards'`، و شرط `startContentRefresh` که `flashcardsUrls` را هم
در «هیچ‌کدام config نشده» حساب کند.

### ۲.۵ تست فاز ۱

- `plus-api/test/content-refresh.test.ts` را گسترش بده (الگوی
  `applyRemotePathways` همان فایل): payload سالم پذیرفته می‌شود؛
  `byContent` خالی/HTML/بدون `byContent`/کارت بدون `front` رد می‌شود و کپی
  قبلی می‌ماند؛ `flashcardsSource()` جابه‌جایی را گزارش می‌کند؛
  `resetRemoteFlashcards` در `beforeEach`/`afterEach` کنار بقیه.
- تست‌های getter (در همان فایل یا `review-ai.test.ts`): `getCardsFor` برای
  content ناموجود `[]`؛ `getCard` برای card ناموجود `null`.

## ۳. فاز ۲ — Backend API

### ۳.۱ `plus-api/src/services/consumption.ts` — helper خواهر

تابع موجود (`getConsumedContentIds`) و امضایش **دست نمی‌خورد**. اضافه کن:

```ts
export async function getConsumedContentTimes(
  userId: string,
  runner: Pick<pg.Pool, 'query'> | pg.PoolClient = pool,
): Promise<Map<string, Date>> // content_id -> اولین مصرف
```

همان union تابع فعلی، با `min(created_at)`:

```sql
select content_id, min(created_at) as first_at from (
  select content_id, created_at from highlights where user_id = $1
  union all
  select content_id, created_at from user_activity
   where user_id = $1 and action in ('article_completed','episode_listened')
     and content_id is not null
) t group by content_id
```

### ۳.۲ `GET /review/due` — گسترش (در `plus-api/src/routes/review.ts`)

کوئری و پاسخ فعلی هایلایت‌ها **عیناً می‌ماند**. بعد از ساختن `res.rows`
(خط ~۷۵)، قبل از `reply.send`، `ai_due` را بساز و پاسخ بشود
`{ due: res.rows, ai_due }`.

الگوریتم `ai_due` (این ترتیب، بدون خلاقیت):

1. `const consumed = await getConsumedContentTimes(userId)`.
2. **فیلتر topic** روی کلیدهای `consumed`، با همان معنی فعلی:
   `folder:` → prefix `key + '/'` روی content_id (همان regex-گارد فعلی)؛
   وگرنه `resolveTopic` → عضویت در `contentIds`. (topic نامعتبر قبلاً 404
   داده — کد فعلی این را پیش از کوئری هایلایت هندل می‌کند؛ منطق AI بعد از
   همان گارد اجرا می‌شود و گارد جدیدی لازم ندارد.)
3. یک کوئری state:
   `select content_id, card_id, box, next_review_at, reviewed_count from
   ai_card_state where user_id = $1` → `Map` با کلید
   `content_id + ' ' + card_id`.
4. دو لیست بساز، فقط از contentهای مصرف‌شده‌ی topic-پاس:
   - **state‌دار due:** ردیف state دارد و `next_review_at <= now`. مرتب بر
     `next_review_at` صعودی.
   - **نو و بالغ:** ردیف state ندارد و
     `first_consumed_at + intervalDaysForBox(1) روز <= now` (بلوغ
     یک‌روزه — خواندن مقاله و پاسخ همان لحظه، مرور نیست). مرتب بر
     `first_consumed_at` صعودی (قدیمی‌ترین مصرف اول).
5. `AI_SHARE = Math.ceil(limit / 3)` (limit همان پارامتر فعلی، پیش‌فرض ۲۰
   → حداکثر ۷). خروجی: اول state‌دارها، بعد نوها، بریده به `AI_SHARE`.
6. شکل هر ردیف خروجی:
   ```jsonc
   { "content_id": "...", "card_id": "flashcards-c1",
     "front": "...", "back": "...",
     "box": 1, "next_review_at": null, "reviewed_count": 0 }
   ```
   (برای state‌دار: مقادیر واقعی ردیف؛ برای نو: `box:1`,
   `next_review_at:null`, `reviewed_count:0`. `front`/`back` از
   `getCard`.)
7. صفحه‌ی مصرف‌شده‌ای که در ایندکس نیست: بی‌صدا صفر کارت (پوشش ناقص
  tolerant می‌ماند).

### ۳.۳ `POST /review/answer-ai` — route جدید (همان فایل)

پشت همان دو `preHandler` موجود (`requireAuth` + `requirePremium`). schema:

```jsonc
{ "content_id": "string, required", "card_id": "string, required",
  "result": "enum: remembered | forgot, required" }
```

ترتیب منطق (آینه‌ی answer فعلی — کامنت‌های آن route را بخوان و روح همان را
نگه دار):

1. **rate-limit با همان کلید مشترک، قبل از هر کار دیگر:**
   `consume(\`review:user:${userId}\`, config.review.maxPerUserPerHour, HOUR_MS)`
   — کلید **عمداً** همان کلید `POST /review/answer` است تا ۲۰۰/ساعت سقفِ
   مجموع دو نوع کارت باشد. رد → همان پاسخ 429 با `retry-after`.
2. **اعتبارسنجی، هر دو شرط، وگرنه 404 `{ error: 'not_found' }`:**
   - `getCard(content_id, card_id)` غیر-null (کارت واقعی در ایندکس)؛
   - `content_id` در `getConsumedContentTimes(userId)` (به نتیجه‌اش برای
     گام ۴ نیاز داری؛ همین را صدا بزن نه `getConsumedContentIds`).
   بدون این دو، endpoint راه ساخت ردیف دلخواه/پاسخ به نخوانده‌ها می‌شد.
3. **تراکنش (`withTransaction`):**
   ```
   select box, next_review_at from ai_card_state
    where user_id=$1 and content_id=$2 and card_id=$3 for update
   ```
   - ردیف هست → `currentBox = row.box`؛ `wasDue = row.next_review_at <= now`.
   - ردیف نیست → `currentBox = 1`؛
     `wasDue = first_consumed_at + intervalDaysForBox(1) روز <= now`
     (همان بلوغ بند ۳.۲‑۴).
   - `box = nextBox(currentBox, result)`؛ `days = intervalDaysForBox(box)`
     — **انتقال box فقط در `services/leitner.ts` حساب می‌شود؛ هیچ CASEِ
     SQL برای box ننویس** (قانون خود فایل leitner).
   - ردیف هست → `update ... returning box, next_review_at, reviewed_count`
     (قرینه‌ی update فعلی: `last_result`, `reviewed_count+1`,
     `updated_at=now()`).
   - ردیف نیست → insert با `reviewed_count = 1` و
     `on conflict (user_id, content_id, card_id) do update set box=excluded.box,
     next_review_at=excluded.next_review_at, last_result=excluded.last_result,
     reviewed_count=ai_card_state.reviewed_count+1, updated_at=now()`
     (کمربند مسابقه‌ی دو پاسخ اول همزمان) + همان `returning`.
   - **فقط اگر `wasDue`:**
     `recordActivity(userId, 'review_finished', content_id, { card_id, result }, client)`
     — کارت در هر حال جابه‌جا می‌شود (مرور زودهنگام آزاد است) ولی فقط
     due-بودن می‌پردازد؛ عیناً doctrine کامنت answer فعلی.
4. بعد از تراکنش: `scheduleAchievementSync(userId)`؛ پاسخ
   `{ card_state: updated }` (همان شکل answer فعلی).

**هیچ تغییری در league/score/streak نمی‌دهی** — چون اکشن همان
`review_finished` است، سقف هفتگی (`xp_review_weekly_cap`)، streak، score و
نشان «مرورگر» خودکار شامل می‌شوند.

کامنت بالای فایل (`routes/review.ts:12-15` — «card_state.highlight_id stays
not null … until that phase lands») را به‌روز کن: آن فاز حالا با جدول موازی
`ai_card_state` land شده و `highlight_id` همچنان NOT NULL می‌ماند.

### ۳.۴ تست فاز ۲ — `plus-api/test/review-ai.test.ts`

بوت/هلپرها را از `test/review.test.ts` کپی کن (`makeApp`, `resetDb`,
`loginAs`, `makePremium`). فیکسچر ایندکس: **فایل موقت نساز** —
`applyRemoteFlashcards(FIXTURE)` در `beforeEach` و
`resetRemoteFlashcards()` در `afterEach` (remote بر دیسک مقدم است، تست
هرمتیک می‌ماند). فیکسچر با ۲ content و ۲–۳ کارت کافی است.

مصرف را با insert مستقیم بساز (تا صف هایلایت آلوده نشود):

```sql
insert into user_activity (user_id, action, content_id, created_at)
values ($1, 'article_completed', $2, now() - interval '2 days')
```

(برای کیس «زیر ۲۴ ساعت» از `now() - interval '1 hour'`.)

موارد اجباری:

- **گیت:** free → 403؛ لاگین‌نشده → 401.
- **due:** مقاله‌ی مصرف‌نشده کارت نمی‌دهد؛ مصرف زیر ۲۴ ساعت هنوز نمی‌دهد؛
  بعد از بلوغ می‌دهد (شکل ردیف = بند ۳.۲‑۶)؛ سهمیه‌ی `ceil(limit/3)` با
  `?limit=3` → حداکثر ۱ کارت AI؛ کلید `due` وقتی هایلایت due هست
  بایت‌به‌بایت مثل قبل (همان assertهای review.test.ts)؛ فیلتر
  `topic=folder:...` کارت‌های AI خارج پوشه را حذف می‌کند؛ مقاله‌ی مصرف‌شده‌ی
  بی‌کارت بی‌صدا صفر.
- **answer-ai:** پاسخ اول ردیف می‌سازد (`box:2` برای remembered،
  `reviewed_count:1`)؛ `forgot` → `box:1`؛ پاسخ دوم روی همان ردیف پیش
  می‌رود؛ کارت ناموجود در ایندکس → 404؛ مقاله‌ی مصرف‌نشده → 404؛ پاسخ به
  کارت غیر-due (مصرف ۱ ساعت پیش) state می‌سازد **ولی** ردیف
  `review_finished` در `user_activity` نمی‌نویسد؛ پاسخ به کارت due
  می‌نویسد؛ **rate-limit مشترک:** پر کردن شمارنده از مسیر
  `/review/answer` (یا مستقیم `consume` با همان کلید) باعث 429 در
  `/review/answer-ai` می‌شود و برعکس.
- **XP:** بعد از یک answer-ai due، ردیف `user_activity` با
  `action='review_finished'` و metadata حاوی `card_id` موجود است (سقف
  هفتگی خودش از همین جدول می‌شمارد؛ همین کافی است).

اجرای تست: داخل `plus-api/`، `npx vitest run test/review-ai.test.ts` و در
پایان فاز، کل suite: `npm test`.

## ۴. فاز ۳ — فرانت

### ۴.۱ `plus/js/api.js`

زیر خط ~۱۹۴ (`reviewAnswer`):

```js
reviewAnswerAi: (content_id, card_id, result) =>
  request('/review/answer-ai', { method: 'POST', body: { content_id, card_id, result } }),
```

### ۴.۲ `plus/js/review.js`

- **کامنت رزرو بالای فایل** («Hiding stays reserved for a later, separate
  card source…») را به‌روز کن: آن منبع جدا حالا همین کارت‌های AI است؛ قانونِ
  «هایلایت هرگز مخفی نمی‌شود» سر جایش می‌ماند.
- در `renderReview`: `const aiDue = data.ai_due || [];`
  - حالت خالی فقط وقتی `!due.length && !aiDue.length`.
  - شمارنده: `faNum(due.length + aiDue.length) + ' کارت'`.
  - **ادغام ۲:۱ قطعی (بدون تصادف):** بعد از هر ۲ کارت هایلایت ۱ کارت AI؛
    ته‌مانده‌ی هر طرف پشت سر هم آخر صف. کاربر بدون هایلایت due فقط
    AIها را می‌بیند.
    ```js
    function interleave(hl, ai) {
      const out = []; let i = 0, j = 0;
      while (i < hl.length || j < ai.length) {
        if (i < hl.length) out.push(hl[i++]);
        if (i < hl.length) out.push(hl[i++]);
        if (j < ai.length) out.push(ai[j++]);
      }
      return out;
    }
    ```
    (عنصر صف را با یک تگ نوع بساز — مثلاً `{kind:'hl'|'ai', item}` — و در
    map نهایی به `renderCard` یا `renderAiCard` بفرست.)
- **`renderAiCard(c, model)`** — ساختار قرینه‌ی `renderCard` با این فرق‌ها:
  - `article.dcp-rv-card.dcp-rv-card-ai`.
  - head: نشان `span.dcp-rv-badge.dcp-rv-badge-ai` با متن دقیق
    **«نکته هوش مصنوعی»** (تصمیم بنیان‌گذار: هیچ چیزِ AI-ساخته بدون برچسب
    نمایش داده نمی‌شود).
  - بدنه: `front` نمایان (مثلاً `p.dcp-rv-text.dcp-rv-ai-front`)؛ `back`
    در DOM **نیست** تا لمس؛ دکمه‌ی `button.dcp-rv-reveal` «نمایش پاسخ» که
    روی کلیک، back (`div.dcp-rv-ai-back`) و **تازه آن موقع** دکمه‌های
    نمره را اضافه می‌کند — نمره‌دادن به پاسخ ندیده بی‌معنی است، پس
    دکمه‌های نمره قبل از reveal اصلاً render نمی‌شوند.
  - خط منبع: «منبع: عنوان مقاله» از `contentInfo(model, c.content_id)`؛
    href ساده به `info.url` (بدون `?dcphl` — هایلایتی در کار نیست).
  - نمره: همان چرخه‌ی `grade` موجود ولی با
    `api.reviewAnswerAi(c.content_id, c.card_id, result)` +
    `signalStreakActivity()` + همان `is-graded`.
- متن حالت خالی فعلی می‌ماند (هنوز هایلایت‌محور است — اشکال ندارد؛ کاربری
  که مصرفی ندارد همان توصیه‌ی هایلایت را می‌گیرد).

### ۴.۳ `plus/plus.css`

با **توکن‌های موجود** `--dcp-gold` / `--dcp-gold-bg` (خط‌های ~۲۶–۳۱، در هر
دو تم تعریف‌شده‌اند). **هیچ literal رنگی ممنوع.** کنار بلوک `.dcp-rv-*`
(~خط ۶۸۶):

```css
.dcp-rv-card-ai {
  border-color: color-mix(in srgb, var(--dcp-gold) 45%, var(--dcp-line));
  background: linear-gradient(150deg, var(--dcp-gold-bg), var(--dcp-surface) 55%);
}
.dcp-rv-badge-ai { color: var(--dcp-gold); }
.dcp-rv-reveal { /* دکمه‌ی تمام‌عرض ساده، از الگوی .dcp-rv-btn با لهجه‌ی gold */ }
.dcp-rv-ai-back { border-top: 1px dashed color-mix(in srgb, var(--dcp-gold) 35%, transparent); }
```

(جزئیات بصری ریز آزاد است تا جایی که: تمایز کهربایی واضح، توکن-فقط، هر دو
تم چک‌شده.)

### ۴.۴ نسخه‌ها — در همان کامیت فاز ۳

- `python3 tools/asset_version.py --bump` (چون `review.js`/`api.js`/
  `plus.css` عوض شده‌اند) و بعد `--check` سبز.
- `dc-nav.js` خط ~۲۳۰۸: `var V = '68'` → `'69'` (گراف ماژول‌های plus عوض
  شده؛ V الان ۶۸ است، نه ۶۷ی که سند طراحی می‌گفت).

### ۴.۵ تست DOM — گسترش `plus-api/test/review.dom.test.ts`

فایل موجود همین ماژول را با mock `api` می‌راند؛ mock را گسترش بده
(`reviewAnswerAi` + پاسخ `ai_due`). موارد:

- کارت AI کلاس `dcp-rv-card-ai` و متن نشان «نکته هوش مصنوعی» را دارد.
- قبل از کلیکِ «نمایش پاسخ»: متن back در DOM غایب است و هیچ دکمه‌ی
  نمره‌ای داخل کارت AI نیست؛ بعد از کلیک: back هست و دو دکمه آمده‌اند.
- کلیک «بلد بودم» → `reviewAnswerAi` با `(content_id, card_id,
  'remembered')` صدا می‌خورَد.
- ادغام: با ۴ هایلایت و ۲ AI ترتیب DOM = hl,hl,ai,hl,hl,ai.
- کارت هایلایت: بدون تغییر، کامل render می‌شود (assertهای فعلی فایل باید
  سبز بمانند)؛ شمارنده جمع دو صف را نشان می‌دهد.
- `due` خالی + `ai_due` ناخالی → حالت خالی نه، کارت‌های AI بله.

## ۵. فاز ۴ — تأیید مرورگر واقعی و گزارش

1. استک dev را مثل بقیه‌ی فازهای premium بالا بیاور (API محلی + DB؛ لاگین
   OTP از لاگ dev؛ tier کاربر تست را در DB `premium` کن).
2. داده‌ی صحنه: برای کاربر تست چند `article_completed` backdated روی
   صفحات کارت‌دار + یکی دو هایلایت due.
3. با Chromium پیش‌نصب (Playwright، `executablePath:
   '/opt/pw-browsers/chromium'` در صورت نیاز) صفحه‌ی `/plus/cards.html`:
   - اسکرین‌شات تم روشن + تم تاریک (هر دو حالت: قبل و بعد از reveal).
   - چک: نشان کهربایی خوانا در هر دو تم؛ کارت هایلایت دست‌نخورده؛ نمره
     دادن کارت AI؛ رفرش → کارت نمره‌خورده دیگر due نیست.
4. گزارش پایانی: چه شد، اسکرین‌شات‌ها، خروجی سبز تست‌ها، و صریح بگو چه
   چیزهایی عمداً دست نخورد (فهرست بخش ۰).

## ۶. ترتیب کامیت‌ها (۴ کامیت، هر کدام سبز و مستقل)

| # | محتوا | گیت سبز شدن |
|---|---|---|
| ۱ | migration 0035 + `flashcards.ts` + config + بلوک چهارم refresh + تست‌های loader | `npx vitest run test/content-refresh.test.ts` |
| ۲ | `getConsumedContentTimes` + due گسترش‌یافته + `answer-ai` + `review-ai.test.ts` | `npx vitest run test/review-ai.test.ts test/review.test.ts` |
| ۳ | فرانت + CSS + api.js + bump نسخه‌ها + تست DOM | `npx vitest run test/review.dom.test.ts` + `python3 tools/asset_version.py --check` |
| ۴ | فاز ۴ فقط اگر چیزی را عوض کرد (fix)؛ وگرنه کامیتی ندارد | کل suite: `npm test` در `plus-api/` |

بعد از کامیت آخر: push و توقف. **مرج نه.**

## ۷. خارج از محدوده (نکن، حتی اگر وسوسه شد)

- افزودن AI به `due_card_count`ِ `/me` یا یادآور ۹ صبح.
- هر شکل کوییز مستقل (رد شده).
- seeding ردیف‌های `ai_card_state` روی `article_completed` (doctrine
  کامنت 0032: `POST /activity` فقط log می‌نویسد).
- دست‌زدن به ایندکس یا builder آن.
- کش‌کردن نتیجه‌ی `getConsumedContentTimes` بین درخواست‌ها.
