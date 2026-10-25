# DentCast Agent-Parity Contract

**LIVE_MODULAR_PUBLISHING_ENABLED.** Legacy files are backup only; do not read them for execution or use them as authority.

Before content changes, read `.dentcast/workflows/global/README.md`, the complete active sections selected by that router for the current edit scope, and `.dentcast/workflows/agent-parity.md`. All clients use these same rules.

New publication → `.dentcast/workflows/README.md`. Read complete `modules/01-hard-rules.md` and `02-routing-intake.md`, then read every applicable canonical rule in order: full modules by default, or verified verbatim pinned readpack ranges after locked Phase B under publish-checkpoints.md. Preserve all approvals, category exceptions, builders, English and final Phase F. At step 4.13, independently validate and reuse founder-supplied complete DES score JSON and Fidelity JSON for this exact publication, without rerunning accepted tracks. If only valid DES JSON was supplied, run only any still-owed Fidelity; block on supplied incomplete/stale results rather than silently rescoring. If neither is supplied, perform the canonical source-dependent procedure; Phase F remains mandatory. Stage-only planning tools and synthetic receipts do not perform or authorize live publication.

## Interrupted publication

The permanent execution guide is `publish-checkpoints.md`; the temporary current-run state is `.dentcast/PUBLISH-HANDOFF.md`; `publish-handoff.md` and `publish-discovery.md` describe explicit recovery. These are different roles. In a continuing active session, «کجایی؟», «چی شد؟», «ادامه بده» and «ادامه انتشار» are status/continuation requests: answer directly and continue from the current ledger and last valid tool digest. Missing receipts, stale checkpoints and module cross-references do not authorize recovery or branch scans. Read each required complete source once per unchanged revision in the continuous run; follow the execution/delivery discipline in `publish-checkpoints.md`. Infrastructure-only work does not initialize a publication.

For «انتشار ناقص داشتم» or an explicit request to resume a publication the user identifies as incomplete/interrupted, read `.dentcast/PUBLISH-HANDOFF.md` exactly once, then `.dentcast/workflows/publish-handoff.md`. A generic «ادامه بده» or «ادامه انتشار» alone does not trigger recovery. During the active run, keep state in the current session and do not reread the handoff before each step; use the latest helper digest. Before a new publication, check only whether the file exists. If it does, make no changes and ask whether the user means to resume; read it only after explicit confirmation. Never overwrite unfinished work. Update the handoff after every canonical step and before handing off; delete it only after verified completion. A missing file or unavailable work must be reported, not invented. Local commits and dirty files are not automatically available in another checkout.

## Rule 0 — فایل فعال را کامل بخوان

1. پیش از انتشار یا ویرایش محتوا، `.dentcast/workflows/global/README.md` و تمام بخش‌های فعالی را که روتر برای محدودهٔ کار انتخاب می‌کند کامل بخوان؛ پیش از تغییر فایل‌های جدید، انتخاب را با مسیرهای جدید به‌روز کن. اگر محدوده ناشناخته یا ابزار انتخاب نامعتبر بود، هر سه فایل کانونی را کامل بخوان؛ این منبع مشترک Cursor، Codex و Claude است. قواعد سراسری دیگر در فایل‌های بزرگِ ورودی یا بک‌آپ خوانده نمی‌شوند.
2. برای انتشار جدید، روتر `.dentcast/workflows/README.md`، دو ماژول 01 و 02 و سپس تمام قواعد لازمِ ماژول‌های مربوط را به ترتیب کانونی بخوان. مسیر پیش‌فرض خواندن فایل کامل است؛ فقط پس از قفل‌شدن پاسخ‌های Phase B می‌توان از خروجیِ بایت‌به‌بایت، هش‌دار و تأییدشدهٔ `tools/dentcast_publish_readpack.py` طبق `publish-checkpoints.md` استفاده کرد. بخش‌های حذف‌شده باید واقعاً خارج از مسیر باشند؛ خلاصهٔ مدل، حافظهٔ جلسه یا انتخاب سلیقه‌ایِ پاراگراف‌ها هرگز جای متن منبع را نمی‌گیرد. در ابهام یا تغییر نسخه، فایل کامل خوانده می‌شود.
3. برای مسیرهای تخصصی، فایل کانونی همان مسیر کامل خوانده می‌شود؛ `routing-details.md` تریگرها و شرایط مسیرها را نگه می‌دارد.
4. اگر ابزار فایل را تکه‌تکه می‌خواند، همهٔ تکه‌های فایل فعالِ لازم را بخوان. legacy فقط بک‌آپ است و در اجرا خوانده نمی‌شود.
5. نسخهٔ گیت‌هاب را از برنچ کاری و revision تأییدشده بخوان؛ برای ادامهٔ انتشار، نبود فایل روی main دلیل نبود آن روی برنچ کاری نیست.
6. اولویت: ورکفلوی کانونی و ماژول‌های فعال > قواعد سراسری فعال > این فایل > خلاصه‌های کلاینت. دستور کاربر مقدم است؛ تعارض واقعی را گزارش کن، به بک‌آپ برنگرد.

---

## 1. پروتکل گفت‌وگو (همان چیزی که کاربر از Claude Code می‌گیرد)

- **زبان گفت‌وگو فارسی است.** گزارش‌ها، سوال‌ها، و خلاصهٔ نهایی فارسی‌اند.
  اصطلاح فنی/مسیر فایل/نام تابع انگلیسی می‌ماند.
- **سؤال‌های مستقلِ آماده در یک پیام شماره‌دار، با گزینه‌های مشخص و پاسخ جدا برای هر مورد.** طبق Hard Rule 14 ورکفلوی انتشار:
  تصمیمِ روشن را مستقیم اعمال کن و **اعلام** کن؛ تصمیمِ واقعاً مبهم را با
  گزینه‌های نام‌برده بپرس، نه سوال باز.
- **گزارشِ در جریان، کوتاه و به‌موقع.** ابتدای کار بگو اکنون روی کدام بخش هستی؛
  بعد از هر مرحلهٔ معنادار، نتیجه و قدم بعد را در یک پیام کوتاه اعلام کن. اگر
  عملیاتی بیش از ۶۰ ثانیه طول می‌کشد، هنگام شروع بگو و تا پایان هر ۶۰ ثانیه یک
  وضعیت کوتاه بده. برای هر دستور، فایل‌خوانی یا چکِ ریز پیام جدا نفرست. خطا،
  وابستگیِ بیرونی یا گیتِ تأیید را همان لحظه با علت و اثرش گزارش کن؛ اگر تصمیمی
  از بنیان‌گذار لازم است، همان‌جا سؤال دقیق را بپرس و کارهای مستقلی را که به آن
  تصمیم وابسته نیستند ادامه بده. گزارشِ پایان هر مرحله باید بگوید چه انجام شد،
  چه اسکیپ/متوقف ماند و قدم بعد چیست. سکوت تا آخرِ کار مجاز نیست.
- **هیچ‌وقت حدس نزن (Hard Rule 13).** اگر واقعیتی نه از کاربر آمده، نه از فایلی
  در ریپو قابل خواندن است، نه از تاکسونومی زندهٔ runtime، و نه از یک منبع واقعی
  fetch شده — **آن را نمی‌دانی**. بپرس.

### گیت‌هایی که هرگز خودکار نمی‌شوند (حتی اگر کاربر گفته باشد «خودت انجام بده»)

تأییدهای مستقلِ آماده را در یک پیام شماره‌دار بپرس؛ برای هر مورد پاسخ و محدودهٔ جدا ثبت کن. یک «بله» مبهم را به همهٔ موارد تعمیم نده. سؤال وابسته را پس از روشن‌شدن پیش‌نیازش بپرس. هیچ تأییدی را به گزارش آخر موکول نکن یا با اعتمادبه‌نفس بالا حذف نکن. پروتکل بستهٔ تصمیم‌گیری علمی DES/Fidelity عیناً پابرجاست:

1. **پاراگراف افتتاحیهٔ بدنه** (README فاز C گام ۲) — متنی است که خودت نوشته‌ای و
   زیر نامِ کاربر منتشر می‌شود. هر متن را مشخص نشان بده و برای همان متن تأیید بگیر؛ موارد مستقل می‌توانند در یک پیام باشند. (fa و معادل en.)
2. **هر عدد/واقعیتِ غیرقابل‌استخراج** — مدت زمان فایل صوتی، حجم، تاریخ، شمارش،
   DOI، نویسندهٔ اول، عنوان/هشتگ/کلیدواژه‌ای که کاربر نداده.
3. **پیلار/ساب‌تاپیک وقتی بیش از یکی محتمل است**، و **همیشه** وقتی ساب‌تاپیک
   جدید لازم است.
4. **کاندیدای مرزیِ لینک‌دهی** در گام‌های ۴.۷/۴.۸/۴.۹ (و معادل‌های LiteCast:
   ۰.۵/۰.۶).
5. **زمان‌های چرخشِ تبلیغ** (`ads.md` قاعدهٔ ۶) — هر بار که تبلیغی اضافه می‌شود،
   بدون استثنا پرسیده می‌شود.
6. **پوشهٔ مقصدِ Drive، تگ‌ها، DOI و نویسندهٔ اولِ پیپر** (`README.md` گام ۴.۱۰) —
   قاعدهٔ صریح کاربر: «اگر جایی شک داشتی سوال کن عمل نکن».
7. **هر عملیات غیرقابل‌بازگشت یا بیرونی** — push، آپلود در Drive، صدا زدن
   endpointهای ادمین، حذف فایل.
8. **ورود به باندل وقتی حتی یک گیت مبهم است** (README گام 5.6-ب) — ورود خودکار
   فقط با پنج گیتِ قاطعِ «بله» مجاز است؛ جایگزینیِ یک قدم، عبور از سقف ۸ قدم،
   یا جایگاهِ انتهای لیست همیشه پرسیدنی‌اند.
9. **سبدِ سومِ DES — مطلبی که پژوهش‌محور است ولی مقالهٔ مشخصی ندارد**
   (README سوال ۴.۸): مثلاً اپیزودی که فقط کپشن و فایل صوتی دارد و بلاکِ «منابع»
   ندارد. اینجا **همیشه** با دو گزینهٔ نام‌برده پرسیده می‌شود — «DOI می‌دم» یا
   «بدون DES منتشر بشه» — و **گزینهٔ سوم وجود ندارد**: نه دنبالِ «احتمالاً این
   مقاله» بگرد، نه کپشن را به‌عنوان COMMENTARY امتیاز بده تا چیزی داشته باشی، نه
   سوال را به گزارشِ آخر موکول کن. همچنین DOI‌ای که کاربر نداده و تو verify
   نکرده‌ای، **واقعیت نیست** (Hard Rule 13).
10. **مسیرِ یادگیریِ سوم برای یک مطلب، و هر جای‌گذاری وسطِ یک سری** (README گام
    5.6) — مطلبی که در دو مسیرِ کامل هست، برای هر مسیرِ بعدی پرسیده می‌شود؛
    `pathway_place.py --insert` هر دو را بدون `--confirmed` رد می‌کند و آن فلگ
    فقط بعد از «بله»ی بنیان‌گذار زده می‌شود، نه برای عبور از سوال. STRONG هم
    فقط از هسته‌ی منجمدِ مسیر (`.dentcast/pathway-core.json`) می‌آید، و
    `--freeze-core` فقط بعد از یک بازچینیِ بنیان‌گذار اجرا می‌شود، هرگز بعد از
    انتشار.
11. **هر جملهٔ «یک درجه جلوتر» یا «برعکس» در FIDELITY** (README گام ۴.۱۳
    بخش 3b): پیش از ذخیرهٔ رکورد، برای **هر** جمله جدا — جملهٔ خودِ صفحه
    (عیناً)، فرقش، جملهٔ منبع، یک بازنویسیِ پیشنهادی با کمترین تغییر — و سه
    جوابِ نام‌برده: «اصلاح کن» / «خودم می‌نویسم» / «همین بماند». هیچ جمله‌ای
    بی «بله»ی خودش عوض نمی‌شود، جمله‌های «در منبع نیامده» پیشنهاد داده
    نمی‌شوند، و بعد از هر اصلاح فقط جمله‌های اصلاح‌شده دوباره سنجیده و درجه قبل → بعد
    گزارش می‌شود.

---

## 2. نقشهٔ توانمندی‌ها (وقتی ابزارِ Claude را نداری)

| کاری که ورکفلو می‌خواهد | Claude Code | Cursor | Codex/GPT و بقیه |
|---|---|---|---|
| خواندن/نوشتن فایل | Read/Edit/Write | ابزار فایل ایجنت | ابزار فایل |
| اجرای دستور | Bash | ترمینال داخلی | shell |
| جست‌وجوی کد | Grep/Glob | codebase search + `rg` | `rg` |
| هش SHA-256 | Bash | ترمینال | shell |
| جست‌وجوی وب (DOI، نویسندهٔ اول) | WebSearch / PubMed MCP | `@Web` | web tool (اگر روشن است) |
| resolve کردن `source_text` برای DES (گام ۴.۱۳) | اول کابینتِ محلی، بعد PubMed MCP، بعد WebFetch | کابینتِ محلی + `@Web` | کابینتِ محلی + web tool؛ نبود ⇒ abstract را از کاربر بخواه |
| آپلود در Google Drive | Google Drive MCP | معمولاً ندارد | معمولاً ندارد |
| probe فایل صوتی | curl/ffprobe | همان | همان |

**FIDELITY و انتخاب مدل:** نقش‌های بررسی‌کنندهٔ سبک‌تر و بازبین/داور قوی‌تر مستقل از شرکت سازنده‌اند؛ مثال‌های Claude، OpenAI و Grok و قواعد استقلال اجراها، ثابت‌بودن مدل رأی‌دهنده و ثبت مدل واقعی در گام ۴.۱۳ بخش 2c فایل کانونی انتشار آمده‌اند. اگر محیط ابزار واگذاری به ایجنت جدا و انتخاب مدل را دارد، دو بررسی کامل را با ورودی یکسان و زمینه‌های جداگانه هم‌زمان اجرا کن؛ برای داوری از نقش قوی‌تر استفاده کن. قیمت دقیق اگر در دسترس نیست «UNVERIFIED» ثبت می‌شود و مانع اجرا نیست؛ نبودِ خودِ ایجنت جدا، انتخاب مدل، یا مدل سبکِ توانمند باید با ذکر دقیقِ قابلیتِ موجودنبود و مرحلهٔ متأثر گزارش شود، نه با اجرای شبیه‌سازی‌شده.

### پروتکل «توانمندی ندارم» — تنها مسیر مجاز

وقتی مرحله‌ای به ابزاری نیاز دارد که نداری (مثلاً Drive یا وب):

1. **بایست.** مرحله را نه حدس بزن، نه شبیه‌سازی کن، نه «فعلاً placeholder
   می‌گذارم».
2. به کاربر **دقیقاً** بگو چه چیزی لازم است و چرا.
3. **دستور/گام دستی را آماده به او بده** (لینک پوشهٔ Drive، خط `curl`، عبارت
   جست‌وجو) تا خودش انجام دهد و مقدار واقعی را برگرداند.
4. با مقدارِ واقعی ادامه بده و در گزارش بنویس این مقدار **از کاربر** گرفته شد.
5. اگر کاربر نداد، آن مرحله «انجام‌نشده» گزارش می‌شود — نه «اسکیپ‌شده»، نه
   «تقریبی».

مثال‌های واقعی:

```bash
# مدت زمان فایل صوتی (اگر ffprobe/شبکه نداری → از کاربر بپرس، تخمین نزن)
ffprobe -v error -show_entries format=duration -of csv=p=0 <audio-url>

# DOI: اگر وب نداری، از کاربر بخواه DOI و نویسندهٔ اول را بدهد
# Drive: اگر MCP نداری، از کاربر بخواه فایل را در زیرپوشهٔ درست آپلود کند و
#        drive_id را بدهد؛ سپس drive_view/drive_download را از روی آن بساز.
```

---

## 3. دستورهای قطعی (روی همهٔ ایجنت‌ها یکسان)

همه از ریشهٔ ریپو اجرا می‌شوند. `python` و `python3` هر دو موجودند.

```bash
# هش قبل/بعدِ هر ویرایشِ صفحه (الزام ورکفلو در گام‌های ۱، ۴، ۴.۵، ۴.۶، ۴.۷–۴.۹، ۴.۱۰)
sha256sum <file>

# تاکسونومی زندهٔ پیلارها (هرگز از حافظه/هاردکد)
python -c "import sys; sys.path.insert(0,'tools'); from build_pillar import PILLARS; import json; print(json.dumps({k:[s['slug'] for s in v['subtopics']] for k,v in PILLARS.items()}, ensure_ascii=False))"

# اعتبارسنجی JSON قبل از commit
python3 -m json.tool dentcast-brain.json > /dev/null
python3 -m json.tool spot/spot-config.json > /dev/null
python3 -m json.tool litecast/lite-glossary.json > /dev/null

# بیلدرها — به همین ترتیب (README فاز C گام ۸)
python tools/update-homepage-counters.py
python tools/build_pillar.py all          # صفحهٔ هر پیلار + structure.json کنارش؛ هر دو commit می‌شوند
python tools/build_episodes.py            # فقط اگر dentcast.json تغییر کرده
node tools/build_flashcards_index.mjs     # مگر اینکه ۴.۱۱ اسکیپ شده باشد (LiteCast)
node tools/build_quiz_index.mjs           # مگر اینکه ۴.۱۲ اسکیپ شده باشد (LiteCast)
python3 .github/scripts/inject_img_attrs.py
node tools/build_plus_index.mjs           # هر publish که brain را تغییر داده (تگ‌ها + جدول الیاس هشتگ را هم آینه می‌کند)
                                          # زیرموضوع‌ها را از structure.json می‌خواند → حتماً بعد از build_pillar.py
python3 tools/hashtag_ref.py --check      # هر تگِ brain باید conceptِ کانونیکالِ کتابخانه باشد (Hard Rule 15 / گام ۵.۰) — باید سبز بماند
python tools/stamp-version.py             # همیشه آخر

# فاز D (نسخهٔ انگلیسی)
python3 .github/scripts/inject_hreflang.py
python3 .github/scripts/gen_sitemap.py
python tools/stamp-version.py             # دوباره، آخر

# صحت GA4 روی همهٔ صفحه‌ها
python3 .github/scripts/inject_ga.py --check

# فاز F — گیت مکانیکیِ publish. تا خروجی صفر نشده، کار تمام نیست.
python3 tools/verify_publish.py <content_id> \
  --expect-title "<عنوان دقیقاً همان‌طور که کاربر نوشته>" \
  --expect-caption "<کپشن دقیقاً همان‌طور که کاربر نوشته>"
```

**دربارهٔ `stamp-version.py`:** «آخر» یعنی آخر به ترتیبِ **زمان**، نه آخرِ فهرست.
هشِ نسخه از خودِ محتوا گرفته می‌شود، پس هر نوشتنی روی `dentcast-brain.json`،
گلاسری‌ها یا اَسِت‌های مشترک **بعد از** stamper آن را بی‌اعتبار می‌کند — بی‌آنکه
جایی خطا بدهد (نسخه عوض شده، فقط دیگر از محتوا مشتق نیست). مظنون‌های همیشگی:
`hashtag_ref.py --apply` (تگ‌ها را در brain می‌نویسد) و اصلاح‌های دیرهنگامِ
عنوان/کپشن. اگر چنین شد، stamper را دوباره بدو؛ فاز F همین را چک می‌کند.

**دربارهٔ فاز F:** جای هیچ گامی را نمی‌گیرد و کیفیتِ تحلیلِ معناییِ ۴.۷/۴.۸/۴.۹
را نمی‌سنجد — فقط چیزی را می‌گیرد که *فراموش* شده. هر ردیفِ `FAIL` دستورِ رفعش را
خودش چاپ می‌کند؛ ردیف‌های `warn` شکست نیستند ولی باید خوانده و تأیید شوند.
`--all` همین چک‌ها را روی کلِ سایت می‌گیرد، ولی خروجی‌اش **بک‌لاگ** است نه
publishِ بلوکه‌شده، پس عمداً صفر برمی‌گرداند.

**قاعدهٔ `main` (Hard Rule 8):** بیلدرها و `PILLARS` را فقط از حالتی اجرا کن که
`main` را بازتاب می‌دهد (از `main` اجرا کن، یا اول `main` را در برنچ کاری merge
کن). اسکریپت‌های یک برنچ فیچر ممکن است کهنه باشند.

---

## 4. چک‌لیست همسانیِ خروجی — انتشار محتوا

هیچ ردیفی حذف نمی‌شود؛ ردیفی که اجرا نمی‌شود **با دلیل** گزارش می‌شود. جزئیات هر
ردیف در `.dentcast/workflows/README.md` است — این فقط ضامنِ جانیفتادن است.

| # | گام | «انجام‌شده» یعنی |
|---|---|---|
| 0 | Routing (فاز ۰) | مشخص شد متن هست/نیست و فایل پیپر هست/نیست؛ مسیر جدول فاز ۰ انتخاب شد؛ فایل مقاله بدون متن ولی با درخواستِ صفحه/DES/Fidelity/کردیت DOI ⇒ پرسیده شد متن کجاست یا paper-only بماند، نه paper-only بی‌صدا |
| A | Discover | brain کامل خوانده شد؛ دسته‌ها، آخرین انتریِ هم‌دسته، و `PILLARS` زنده استخراج شد |
| B | Intake | سوال‌های ۱، ۲، ۳، ۳.۵ (de-AI)، ۴، ۴.۷، **۴.۸ (سبدِ DES)**، ۵ همه پرسیده/اعلام شدند |
| C.0 | شاخهٔ LiteCast | یا فعال شد (و ۰.۱–۰.۶ اجرا شد) یا صراحتاً «غیرفعال» گزارش شد |
| C.1 | قفل تمپلیت + هش | هشِ صفحهٔ قبلیِ هم‌دسته ثبت شد |
| C.2 | ساخت صفحه | کلونِ ساختاری؛ دامنه حفظ شد؛ GA4 یک‌بار؛ **دو `preconnect` با `crossorigin` بالای `<head>`** (هر هاست یک‌بار — `inject_preconnect.py` اگر از کلون جا ماند)؛ **هیچ مهرِ نمادی روی صفحهٔ محتوا نیامده**؛ پاراگراف افتتاحیه **تأییدشده** |
| C.2.4 | پیلار/ساب‌تاپیک | یک‌بار، همین‌جا، تصمیم گرفته و اعلام/تأیید شد |
| C.2.5 | کپسول «کاوش بیشتر» | شاخهٔ درست (۲ کپسول / ۱ / `ep-related-link` / LiteCast) اجرا شد |
| C.2.6 | صفحهٔ فهرست نوع | یا دستی لینک اضافه شد یا بیلدرش نام برده شد |
| C.3 | ممیزی تاریخ/متا | جدول قبل/بعد چاپ شد، همهٔ ردیف‌ها OK |
| C.4 | Integrity | هشِ تمپلیت با گام ۱ برابر است |
| C.4.5 | اپیزود والد (فقط NoteCast) | اجرا یا صراحتاً اسکیپ |
| C.4.6 | prev/next (فقط Promptologist) | هر دو صفحه سیم‌کشی شد |
| C.4.7 | بک‌لینک دانشنامه | تحلیل معنایی **تازه** اجرا شد؛ نتیجه (حتی صفر) گزارش شد |
| C.4.8 | لینک‌های درون‌متنی | همان — «چون تمپلیت نداشت» دلیلِ ممنوع است |
| C.4.9 | «کاوش بیشتر» صفحهٔ جدید | همان + محاسبهٔ سقف ۵ لینک |
| C.4.10 | شاخهٔ پیپر | سه بخش، یا «اسکیپ — پیپری پیوست نشده»؛ فایلی که بنیان‌گذار در ریشهٔ کابینت گذاشته پیدا، به عنوان مقاله تغییرنام و به زیرپوشه منتقل می‌شود (بدون کپی) و `drive_id` از همان فایل؛ اجرای زودترِ درخواستی به‌صورت `external_action` با شناسهٔ `C.4.10.1:<نام>` ثبت و C.4.10.1 به همان رسید ارجاع می‌دهد |
| C.4.11 | فلش‌کارت (`DefinedTermSet`) | بلاک JSON-LD اضافه شد + بیلدر اجرا شد (مگر LiteCast)؛ هیچ `description` بازنویسیِ نشدهٔ جوابِ FAQ نیست — برداشتنِ «بله؛» بازنویسی نیست |
| C.4.12 | کوییز (FAQ باینری) | سوال‌ها standalone شدند و پاسخ‌های بله/خیر با حکم شروع می‌شوند |
| C.4.13 | DES (امتیاز شواهد) | `source_text` **قبل از** اجرای پرامپت واقعاً resolve شد (مدل هرگز fetch نمی‌کند)؛ `.dentcast/dentcast-evidence-score-v3.4.md` بدون appendix به‌عنوان system prompt اجرا شد — یک بلاک ورودی **به ازای هر منبع**، بدون ادغام؛ برای هر منبعی که متنش در دست بود — امتیازگرفته یا `NOT_APPRAISABLE` (v3.1) — فراخوانیِ **FIDELITY** هم اجرا شد، و منبعِ بی‌متن `CITATION_ONLY` + جایگاهِ `INSUFFICIENT_TEXT` گرفت، نه `null`ِ خاموش (بخش 2b: واحدها و ورودی‌ها فقط از `tools/des_fidelity_units.py`، همان `source_text` و همان `text_basis` که SOURCE امتیاز داد؛ در حالت `POOLED` یک فراخوانی به ازای هر منبع و بعد `--merge`)؛ **بخش 3b پیش از ذخیره اجرا شد**: هر جملهٔ `ALTERED`/`REVERSED` جدا با جملهٔ عینِ صفحه، فرقش، جملهٔ منبع و یک بازنویسیِ کم‌تغییر به بنیان‌گذار نشان داده شد و جوابش («اصلاح کن» / «خودم می‌نویسم» / «همین بماند») ثبت شد؛ اگر اصلاحی پذیرفته شد، به بدنه و نسخهٔ en (و هر سطحِ دیگری که همان ادعا را دارد) رفت و **کلِ** FIDELITY دوباره اجرا و درجه قبل → بعد گزارش شد؛ هر چهار چکِ Part 3 (نقلِ‌قولِ verbatim، بازمحاسبهٔ حساب، تطابقِ باند، اسکیما) سبز؛ رکورد **عیناً** در `plus/des-scores.json` زیر `content_id` نوشته شد، بدون فیلدِ مشتق‌شدنی و بدون هیچ تغییری در brain (Hard Rule 5) و بدون هیچ مارک‌آپ/CSS داخلِ صفحه؛ منبعِ بدون abstract → `INSUFFICIENT_TEXT`، نه امتیازِ ساخته‌شده از متنِ دنت‌کست؛ یا اسکیپ صریح با دلیلِ معتبر (LiteCast / چالشِ تأییدشده در سؤال ۴.۹ و مارک‌آپ مرحلهٔ ۴.۱۴ / «بدون DES» با مجوز مخصوص همان مطلب / استثنای احرازشدهٔ اپیزودِ صرفاً کپشن). چالش هیچ رکورد DES ندارد و اجرای DES/Fidelity برای آن انجام نمی‌شود؛ فاز F باید مارک‌آپ چالش را تشخیص دهد. در ترکِ COMMENTARY، استثنای بسته: آیتم چهارم را فقط برای `chairside/`، `metanotes/` و `insight/` می‌شود از اعلانِ صفحهٔ فهرستِ همان بخش گرفت — `evidence_quote` عیناً از آن صفحه و `note` اجباری با نامِ فایل؛ راهِ اضافه‌شدنِ بخشِ تازه فقط «اول اعلان روی صفحهٔ فهرست، بعد بامپِ اسپک» است، نه شباهت.  **فاز F این چهار چک را مکانیکی تکرار می‌کند** (ردیف‌های `4.13 DES`): رکوردِ موجود سخت اعتبارسنجی می‌شود، و رکوردِ نبوده بدون استثنای معتبرِ همان مطلب `FAIL` است؛ قواعد ثبت استثنا در `publish-checkpoints.md` آمده‌اند |
| C.4.14 | چالش | فقط وقتی سؤال ۴.۹ «چالش» بود `completed` با مارک‌آپ واقعیِ `data-dc-challenge-question` روی صفحه؛ پستِ غیرچالش ⇒ فقط `skipped` (ابزار `completed` بی‌مارک‌آپ را رد می‌کند) |
| C.5.0 | استانداردسازیِ هشتگ | هر تگ در برابرِ `dentcast-hashtag-reference.json` با `--simulate` resolve شد؛ موجود همان کانونیکال دوباره استفاده، نو با تعریف+`use_when`+الیاس ساخته و `--apply` شد (برای مطلبِ تازه batch با `"articles": {}`؛ تگ‌های کانونیکال در گام ۵ با انتریِ brain می‌نشینند و `--sync`، `build_plus_index.mjs` و `--check` بعد از آن اجرا می‌شوند)؛ فقط تگِ کانونیکال در brain و چیپ‌ها؛ `--check` سبز (Hard Rule 15) |
| C.5 | انتریِ brain | آخرین عنصرِ آرایه، کلیدها دقیقاً مثل انتریِ هم‌دسته |
| C.5.5 | تأیید پیلار | مقدار ثبت‌شده = مقدار گام ۲.۴ |
| C.5.6 | مسیر یادگیری | `plus/pathways.json` به‌روز شد (مگر LiteCast) |
| C.5.6-ب | گیتِ باندل | هر باندلِ کاندید دقیقاً یک حکم گرفت — «وارد شد (بعد از کدام قدم)» / «رد شد (گیت N)» / «سوال شد» — یا «بدون کاندید»؛ ورودِ خودکار فقط با پنجِ «بله»ی قاطع، درج فقط وسطِ لیست (نه `--at-end`)، و جاروی شمارهٔ قدمِ `plus/js/home-bundles.js` + `asset_version.py --bump` در همان کامیت |
| C.6 | پالس؛ در v2 گیت قطعی‌شدن همهٔ تصمیم‌های تحریریه و نسخهٔ انگلیسی پیش از Push دوم | خط جدید بالاترین، خط پایینی حذف شد؛ خط فقط **اعلام** می‌کند — متنِ لینک عنوان است و تصمیم/مکانیسم/یافتهٔ مطلب لو نمی‌رود |
| C.7+8 | بیلدها | همهٔ بیلدرهای بخش ۳ به ترتیب، `stamp-version.py` آخرِ **زمانی** |
| — | وفاداریِ رشته (Hard Rule 16) | عنوان/کپشنِ کاربر codepoint-به-codepoint کپی شد، نه بازتایپ (نیم‌فاصله!) |
| — | جاروبِ اصلاح (Hard Rule 17) | اگر متنی بعد از نوشتنِ اول عوض شد، **همهٔ** سطوحش در همان کامیت عوض شدند |
| D | نسخهٔ انگلیسی + تاگل (در v2 تألیف و تأیید قبل از C.6؛ پس از Push دوم فقط کنترل فنی) | صفحهٔ en ساخته شد و تاگل دوطرفه کار می‌کند (مگر LiteCast) |
| E | مارکر نوتیف | `<meta name="dc-notify" content="true">` دقیقاً یک‌بار (مگر paper-only/LiteCast/glossary) |
| F | گیت مکانیکی | `python3 tools/verify_publish.py <content_id> --expect-title … --expect-caption …` با خروجی **صفر** |
| G | گزارش نهایی | گزارش کوتاه برای کاربر + ارجاع به شواهد فنی کامل — با خطِ خلاصهٔ فاز F |

**قاعدهٔ گزارش نهایی:** تمام بندهای فنی و دلایل اسکیپِ «Final output summary»
در گزارش فنیِ قابل‌بازیابی ثبت می‌شوند؛ نتیجهٔ تکراری را با ارجاع به مدرک موجود
ثبت کن، نه بازنویسیِ کامل آن. پاسخ نهایی به کاربر کوتاه است: وضعیت واقعی، لینک،
خلاصهٔ فاز F، موارد مهمِ باقی‌مانده و لینک گزارش فنی. شکست و تأییدِ حل‌نشده هرگز
پنهان نمی‌شود. جزئیات بیشتر را به درخواست کاربر نشان بده.

---

## 5. چک‌لیست همسانی — چهار مسیر دیگر

- **نسخهٔ انگلیسی** (`en-version.md`): دو فایل تغییر می‌کند و نه بیشتر (صفحهٔ en
  جدید + صفحهٔ fa منبع). `metanotes/en/meta-1.html` باید **دست‌نخورده** بماند
  (هش برابر). هیچ انتریِ brain، هیچ خط پالس، هیچ لینک تخصصی برای صفحهٔ en.
- **تبلیغ** (`ads.md`): فقط `spot/spot-config.json` (و `spot/img/`) تغییر می‌کند.
  هیچ صفحه، brain، پالس، پیلار، یا نسخهٔ en. نقشهٔ زمان‌ها قبل و بعد نوشته
  می‌شود و به **بازدیدِ صفحه** ترجمه می‌شود (نه «سشن» و نه «نمایش» —
  `rotation.advance` روی `"view"` است؛ `ads.md` قاعدهٔ ۶ و `dentcast-ads.mdc`). `python3 -m json.tool` قبل از commit.
- **گزارش تبلیغ** (`spot-report.md`): فقط خواندن. هیچ فایلی تغییر نمی‌کند. اگر
  داده در دست نیست، دستور `curl` تحویل داده می‌شود — عدد ساخته نمی‌شود.
- **کراس‌لینک** (`cross-link.md`): فقط صفحاتِ محتوا تغییر می‌کنند و **فقط با
  افزودنِ `<a>`** — نه brain، نه بیلدر، نه stamp نسخه، نه بخش «کاوش بیشتر».
  کاندیدها از `tools/cross_link_candidates.py` می‌آیند و از روی نثر بازسازی
  نمی‌شوند. گیتِ پیش از commit **مکانیکی** است: تگ‌های هر فایلِ لمس‌شده کنده
  می‌شود و رشتهٔ رندرشده باید بایت‌به‌بایت با `HEAD` یکی باشد؛ قرمز یعنی همان فایل
  کامل revert شود. هر ASK حکمِ نوشته‌شده دارد (glued / نقل‌قول / چگالی) — ASKِ
  بی‌حکم یعنی اجرا ناتمام است. `stamp-version.py` باید *unchanged* بدهد.
  **دو ورودی:** انتشارِ دانشنامه نسخهٔ اسکوپ‌شده را در گام ۴.۷-ب اجرا می‌کند
  (`--slug <اسلاگِ تازه>`)؛ سویپِ بدونِ اسکوپ هرگز داخل یک publish اجرا نمی‌شود.

---

## Publication service and wait discipline

Follow `publish-checkpoints.md` sections “Publication services and remote checks”
and “Waiting and refreshing remote state”. Vercel is unrelated to DentCast
publication: never wait for or use its status as a gate or completion criterion.
Report a real wait with its step, pending result and blocking effect; refresh
only the relevant result when it can change. Preserve fresh delivery/merge
preflights, actual repository checks, Phase F and the three fixed deliveries.

## 6. پروتکل گیت

- روی برنچی که کاربر مشخص کرده کار کن؛ اگر نبود، برنچ فیچر بساز. مستقیم روی
  `main` کامیت نکن مگر کاربر صریحاً بگوید.
- کامیتِ توصیفی (فارسی یا انگلیسی، هم‌سبک با تاریخچهٔ ریپو).
- `git push -u origin <branch>`؛ در خطای شبکه تا ۴ بار با backoff نمایی
  (۲s/۴s/۸s/۱۶s).
- **Pull request فقط وقتی کاربر خواسته باشد.**
- قبل از commit: JSONها valid، بیلدرها اجرا شده، و `git diff -G'\?v='  pillar/`
  بررسی شده که نسخهٔ اسِت‌ها عقب نرفته باشد (README گام ۸ بند ۲).
- کاری که ایجنت انجام نداده را «انجام شد» گزارش نکن. تست/بیلدِ شکست‌خورده با
  خروجی خامش گزارش می‌شود.

---

## 7. نگهداری — این لایه با کدام فایل‌ها باید هم‌گام بماند

اگر یکی از این‌ها را عوض کردی، بقیه را هم در همان کامیت عوض کن:

| تغییر در | باید به‌روز شود |
|---|---|
| `CLAUDE.md` (تریگر/قاعده/بخش جدید) | `AGENTS.md` + `.cursor/rules/dentcast-router.mdc` |
| اضافه‌شدن یک ورکفلوی جدید در `.dentcast/workflows/` | جدول روتر در هر سه فایل بالا + یک `.mdc` اختصاصی |
| **اضافه/حذف/تغییرِ یک گامِ ورکفلوی انتشار** (`README.md`) | **زنجیرهٔ گام‌ها در `.cursor/rules/dentcast-publishing.mdc` + ردیفِ همان گام در بخش ۴ همین فایل** |
| **قاعدهٔ رفتاریِ تازه‌ای که فقط داخلِ متنِ یک گام نوشته شده** (نه Hard Rule جدید) | بندِ متناظر در «پرتکرارترین خطاها»ی `.mdc` مربوطه + ستونِ «انجام‌شده یعنی» در بخش ۴ |
| **گامی که آرتیفکتِ Plus/Premium می‌نویسد** | جدولِ `.cursor/rules/dentcast-plus-premium.mdc` |
| تغییر در فهرست بیلدرها یا ترتیبشان | بخش ۳ همین فایل |
| تغییر در گیت‌های تأیید یا Hard Ruleها | بخش ۱ و ۴ همین فایل |
| ثابتِ سراسریِ تازه در `global/site-invariants.md` که یک صفحهٔ تازه می‌تواند خرابش کند | گام ۲ `README.md` (بررسیِ بقای کلون) + ردیفِ `C.2` بخش ۴ |

قاعده: **منطق در فایل کانونی، مسیر در روترها، رفتار در همین فایل.** هیچ‌کدام
محتوای دیگری را کپی نمی‌کند.

## Per-step checkpoints and delivery batches

Read `.dentcast/workflows/publish-checkpoints.md`. Use the full canonical ledger from `tools/dentcast_publish_handoff.py plan`; write `started` before each action and its actual result afterward using `step`/`record`. Prefer `advance` for separate durable transitions in one call. Page publications have **exactly three deliveries**: (1) after page construction and semantic linking (`C.4.9`), (2) after `C.6`, once DES/Fidelity, Challenge, hashtags, content record, pathways, Pulse, the authored English mirror and every founder approval are closed (v1-only handoffs started earlier keep `C.4.13`), (3) after C.8 builders, C.7 stamp, technical D, E, real Phase F and report G. Deliver work plus the latest handoff at cuts 1 and 2; keep intermediate checkpoints local. For v2 runs the `post-cut2-mechanical.yml` GitHub workflow produces delivery 3 from the exact Push-2 commit: do not run C.8 onward locally; monitor that run and use its guarded recovery only if it fails. Otherwise, at cut 3 run `finish`, then commit/push final work, the completion receipt and handoff deletion together, and run `confirm-cleanup`. Never push a completed final handoff or a fourth cleanup commit. Stops, agent switches, approvals and external actions do not add deliveries. Restore locally with `restore-cleanup` if final delivery fails. Paper-only and pre-existing runs retain their documented compatibility path. Hooks supplement this contract and never certify semantic or scientific results.
