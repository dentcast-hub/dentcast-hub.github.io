# LiteCast 40 — گزارش فنی انتشار

این گزارش وضعیت شاخهٔ PR #973 را ثبت می‌کند. انتشار نهاییِ شاخه هنوز با تحویل سوم در جریان است؛ این گزارش ادعای merge، انتشار زنده یا Ready for Review بودن PR ندارد.

## محتوا و صفحه

- دستهٔ قفل‌شده: LiteCast؛ شناسه: `litecast/lite-CAST40`.
- عنوان تأییدشده: «لمینت میکرومورف چیست؟ واقعیت پشت یک نام تبلیغاتی».
- کپشن و هشت فیلد کلیدواژه با ورودی LiteGlossary شمارهٔ ۳۹ هم‌ساختارند. مدخل ۴۰ فقط به انتهای فایل افزوده شد؛ مدخل‌های ۱ تا ۳۹ از نظر بایت با `origin/main` برابرند (`22` خط افزوده، `0` حذف).
- صفحهٔ فارسی: `litecast/lite-CAST40.html`. صفحهٔ مقاله بلوک چیپ هشتگ ندارد؛ برچسب‌ها از LiteGlossary در feed صفحهٔ اصلی می‌آیند.
- صفحهٔ فرودِ دست‌نگهداری‌شدهٔ `litecast/index.html` دقیقاً یک پیوند تازه به مدخل ۴۰ در ابتدای فهرست تازه‌ترین‌ها دارد.
- مسیر معنایی مرتبط موجود: `/litecast/lite-CAST7.html`. صفحه به ستون موضوعی یا brain تخصصی افزوده نشد؛ LiteCast خارج از brain تخصصی است.
- C.4.14: رد شد، چون این LiteCast یک Challenge نیست. C.4.7b، C.5.5، C.5.6 و C.5.6-b: رد شدند چون برای نوع LiteCast کاربرد ندارند.

## واژگان و برچسب‌ها

برچسب‌های نهایی، به‌ترتیب نمایش در feed:

1. `#میکرومورف` — مفهوم تازه با تأیید کاربر. تعریف ثبت‌شده: «نام تبلیغاتیِ به‌کاررفته دربارهٔ لمینیت دندان؛ به‌خودی‌خود روش علمی مستقل، نوع تازهٔ لمینیت یا نظام پذیرفته‌شدهٔ رتبه‌بندی کیفیت نیست.» موارد کاربرد: بررسی مستقیم معنای نام میکرومورف یا ادعاهای همراه آن دربارهٔ لمینیت دندان. نام‌های هم‌ارز: `micromorph`، `micromorph veneer` و `micromorph dental veneer`.
2. `#لمینیت_سرامیکی` — مفهوم canonical موجود؛ پیشنهاد `#لمینت_سرامیکی` از راه alias به آن resolve شد.
3. `#آگاهی_درمانی` — مفهوم canonical موجود؛ پیشنهاد `#آگاهی_بیمار` از راه alias به آن resolve شد.

`#لمینت_دندان` و `#لمینت_بدون_تراش` اضافه نشدند. batch canonical در `.dentcast/hashtag-batches/A93-litecast-40.json` اعمال شد؛ همگام‌سازی و `hashtag_ref.py --check` موفق بودند. مفهوم تازه به‌عنوان برچسب canonical ثبت شده، نه aliasِ برچسب دیگری.

`hashtag_ref.py --simulate` نگاشت محتوا را از `dentcast-brain.json` می‌سازد؛ چون LiteCast 40 عمداً در آن منبع نیست، شبیه‌سازی مقاله را پیدا نمی‌کند و فقط برچسب‌های مرتبط موجود را رتبه‌بندی می‌کند. بنابراین هیچ ادعایی دربارهٔ reachability یا رتبهٔ دستیار پرونده مطرح نمی‌شود. feed عمومی LiteCast برچسب‌ها را مستقیماً از LiteGlossary می‌خواند.

## سازنده‌ها و نسخه

- `python3 tools/update-homepage-counters.py` — موفق؛ CONTENT از 721 به 722 و CAT_LITECAST از 39 به 40 رسید؛ شمارنده‌های دیگر ثابت ماندند.
- `python3 tools/build_pillar.py all` — موفق؛ ۱۱ صفحهٔ pillar و واژه‌نامه ساخته/بررسی شد؛ خروجی تغییری نداشت و LiteCast به pillar تزریق نشد.
- `node tools/build_plus_index.mjs` — در C.5.0 پس از همگام‌سازی واژگان اجرا شد.
- `python3 .github/scripts/inject_img_attrs.py` فقط fixture آزمایشی `tests/fixtures/connected-first-cut/page.html` را تغییر داد؛ آن تغییر بازگردانده شد و fixture در diff نهایی نیست.
- سازنده‌های episode، flashcards، quiz، Challenge و up-board اجرا نشدند: این محتوا episode یا Challenge نیست؛ LiteCast ورودی brain ندارد و استثنای ثبت‌شدهٔ فلش‌کارت/quiz نیز اعمال می‌شود.
- C.6 Pulse: رد شد؛ LiteCast طبق روال در Pulse نمی‌آید و انتخاب مستقلی برای اعلام در Pulse ثبت نشده است.
- C.7 پس از builderهای قابل‌اعمال اجرا شد: `python3 tools/stamp-version.py`. نسخهٔ محتوا `869970c322` است؛ cache سرویس‌ورکر و نسخه‌های `index.html` و `player.html` با آن هم‌خوان‌اند.
- Phase D و E: رد شدند؛ هر دو برای LiteCast استثنای صریح دارند.

## Phase F و بررسی نهایی

فرمان واقعی helper، با عنوان و کپشن تأییدشده:

```text
python3 tools/dentcast_publish_handoff.py verify --expected-sha256 5c9a7422b4708d0741b36b672eb20904c59a7e2540e90ad2665890ade3162029 --expect-title 'لمینت میکرومورف چیست؟ واقعیت پشت یک نام تبلیغاتی' --expect-caption 'لمینت میکرومورف چیست و آیا واقعاً بهتر از لمینت معمولی است؟ بررسی علمی میکرومورف، لمینت‌های چندلایه، نسل جدید و باندینگ آنتی‌باکتریال.'
```

این فرمان verifier واقعی `tools/verify_publish.py` را برای شناسهٔ واحد اجرا و نتیجه را در handoff ثبت کرد:

**24 passed, 0 warned, 0 failed  — publish is COMPLETE**

گزارش خروجی helper، عنوان/کپشن، شناسهٔ محتوا، کد خروج صفر و digest نتیجه را نگه می‌دارد. هشدار حل‌نشده‌ای باقی نماند.

## مرز تحویل

- تحویل ۱: `6a9257dcc39b174e4adc5c570c534d7810cf21a7`؛ تحویل ۲: `f6dfb43febee30cbeb3a2372e93f08912f35567c`.
- تحویل سوم باید گزارش، خروجی نهایی، رسید تکمیل و حذف handoff فعال را در یک commit واحد داشته باشد. پس از push باید `confirm-cleanup` روی همان SHA موفق شود؛ commit یا push پاک‌سازی اضافه‌ای در نظر نیست.
- تا تأیید تحویل سوم، PR باز و Draft است و نتیجهٔ این کار merge یا انتشار زنده محسوب نمی‌شود.

## فایل‌های تغییرکرده نسبت به `main`

- `.dentcast/PUBLISH-HANDOFF.md` (حذف فقط در تحویل سوم)
- `.dentcast/hashtag-batches/A93-litecast-40.json`
- `.dentcast/publication-reports/litecast-40.md`
- `dentcast-hashtag-reference.json`
- `index.html`
- `litecast/index.html`
- `litecast/lite-CAST40.html`
- `litecast/lite-glossary.json`
- `player.html`
- `plus/content-index.json`
- `service-worker.js`
