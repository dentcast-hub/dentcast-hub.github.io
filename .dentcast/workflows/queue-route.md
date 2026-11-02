# انتشار از صف: مسیر صف (queue lane)

این سند ترتیب کار روز انتشار مطلبی است که روی برنچ `queue` «آماده» شده است. اصول صف،
قرارداد آماده‌سازی و «حکم بنیان‌گذار» در `publish-queue.md` است و همان‌جا معتبر می‌ماند.
همهٔ قضاوت‌ها در آماده‌سازی گرفته و منجمد شده‌اند؛ روز انتشار فقط ابزار اجرا می‌شود.
ایجنت متنی نمی‌نویسد، چیزی نمی‌پرسد و هیچ واقعیتی را حدس نمی‌زند.

## پیش از هر کار

1. `CLAUDE.md`/`AGENTS.md`، همین سند و `publish-queue.md` (کامل) خوانده می‌شوند. ماژول‌های 01 تا 12
   مرجع نگه‌دارندگان ابزارند و روز انتشار صف خوانده نمی‌شوند.
2. اگر `.dentcast/PUBLISH-HANDOFF.md` هست: دست نزن، بپرس آیا منظور ادامهٔ همان انتشار است.
3. برنچ انتشار از `origin/main` تازه (`publish-checkpoints.md`، بند شروع برنچ).
4. برنچ `queue` طبق `publish-queue.md` («جای صف»)؛ انتخاب مطلب طبق «انتشار از صف» گام ۲؛
   اعلام و قفل طبق گام ۳ (کامیت `queue: NN lock for publishing`).

## ترتیب کار

| گام ledger | کار | فرمان |
|---|---|---|
| `rules` | خواندن همین سند و `publish-queue.md` | — |
| `0` | پیش‌چک و قفل | `python3 tools/queue_manifest.py check <پوشه> --agent "<نام قفل>" [--supplement s.json]` |
| `C.2` | مونتاژ کامل | `python3 tools/queue_apply.py <پوشه> <content_id> --agent "<نام قفل>" --receipt r.json [--supplement s.json]` |
| `C.4.9` | وضعیت زندهٔ لینک‌ها (4.7 زیر سقف ۵، 4.9 فقط انتخاب منجمد) | در رسید `report` |
| `C.5.6` | مسیر یادگیری (منجمد در `07`؛ وگرنه برای نوت‌کست فقط مسیرهای اپیزود هم‌شماره، درست بعد از آن؛ وگرنه STRONG تا سقف دو مسیر؛ وگرنه کاندیدای اول؛ هرگز صفر) | در رسید `pathways` |
| `C.6` | تنها push پیش از Action | پایین، «ledger و push» |
| `C.8`، `C.7`، `D`، `E`، `F`، `G` | `post-cut2-mechanical.yml` | فقط پایش (`publish-after-push2.md`) |

`content_id` به شکل `<section>/<slug>` است (`sharehub/share-45`، `insight/insight-102`، `notecast/episode-44`)، نه شمارهٔ خالی؛
شمارهٔ آن شمارهٔ آزاد بعدی همان دسته روی همین checkout است و ابزار هر شمارهٔ دیگر را رد می‌کند.
دسته‌های پشتیبانی‌شده: `sharehub`، `notecast`، `insight`، `chairside` (اینسایت و چیرساید فقط بدون کردیت پیپر). بقیه، از جمله `metanote`، را ابزار رد می‌کند و مطلب از مسیر عادی
(`.dentcast/workflows/README.md`) منتشر می‌شود.

## supplement (فقط برای مطلب بدون `12-انتشار.json`)

`queue_manifest.py check` هر فیلدی را که از فایل‌های منجمد خوانده نمی‌شود با نامش می‌گوید
(`missing`). فقط همان فیلدها در یک فایل JSON بیرون از ریپو نوشته می‌شوند، هر کدام
`{"value": …, "from": "<فایل>:<خط>"}` یا `"<فایل>:<خط>-<خط>"` اگر عیناً در آن خط‌های فایل منجمد
است؛ ابزار هر رشتهٔ مقدار را روی همان خط‌ها می‌سنجد. منشأ `{"from": "publish-day: <چرا>"}` فقط برای
واقعیتی است که روی صفحه متن نمی‌شود؛ متنِ صفحه (عنوان، کپشن، alt، زیرنویس، بدنه، پالس،
برچسب‌ها، کلیدواژه، هشتگ) از بیرون صف رد می‌شود (`SUPPLEMENT_TEXT_NOT_FROZEN`): ایجنت روز
انتشار متن نمی‌نویسد و مطلب به «در حال آماده‌سازی» برمی‌گردد تا همان متن منجمد شود.

آنچه صف منجمد نکرده پیش‌فرض مکانیکیِ ثبت‌شده می‌گیرد، نه انتخاب ایجنت (رسید
`mechanical_defaults`): 4.9 و 4.7 بی انتخاب منجمد هیچ لینکی اضافه نمی‌کنند، کاتالوگ Part 2 بی
مدخل منجمد نوشته نمی‌شود (پیگیری برای بنیان‌گذار)، و author صفحهٔ ShareHub همان author آخرین مدخل
brain همان دسته است. پیش‌فرض فقط با مقداری که از یک خطِ صف خوانده شود عوض می‌شود.

## ledger و push

پیش از گام `0` (فایل‌ها بیرون از ریپو):

```bash
python3 tools/queue_ledger.py init-input <content_id> --out pub.json   # plan --queue: ۱۲ گام، نشانهٔ queue_lane_v1
python3 tools/dentcast_publish_handoff.py init --input pub.json
```

بعد از `C.2` (رسید `r.json` از `queue_apply.py`)، یک فرمان:

```bash
python3 tools/queue_ledger.py record r.json --item <پوشه>   # cut-records + ادغام + record با reconcile note
```

`queue_apply.py` فقط وقتی handoff فعال را می‌پذیرد که ledger صفِ همین `content_id` باشد.
`cut.json` تصمیم‌ها (`queue_approvals_v1` با هش `00-وضعیت.md` و `SHA256SUMS`، provenance
افتتاحیه، قفل ویراستاری ده‌گانه) ، تأیید عنوان و کپشن، و `target_paths` (فایل‌های رسید + نسخهٔ انگلیسی) است؛
`queue_ledger.py record` همین‌ها را روی انتشارِ ثبت‌شده در handoff ادغام می‌کند و `record` را با
یادداشت reconcile می‌زند (کار `queue_apply` درخت کاری را عوض کرده است؛ `cut-records` تنها برای دیدن
است). هر گام `step --status started` و بعد `completed` با شاهد از رسید (یا `advance`). در
`C.6`: اول `step --id C.6 --status completed`، بعد `stage-delivery --path …` برای هر فایل رسید و
نسخهٔ انگلیسی (ابزار staging را فقط در برش ثابتِ تکمیل‌شده می‌پذیرد)، یک کامیت، یک push. این
push برای Action همان «Push 2» است؛ بعد از آن پیام `CLAUDE.md` دربارهٔ Push 2 و پایش طبق
`publish-after-push2.md`. تحویل دوم (پایانی) را Action می‌سازد.

مسیر صف دقیقاً دو تحویل دارد. کامیت handoff پیش از `C.6`، کامیت سوم، یا `invalidate` رد
می‌شوند (`ONLY_TWO_QUEUE_DELIVERIES_ALLOWED`، `EXTRA_DELIVERY_COMMIT_FORBIDDEN`،
`QUEUE_LANE_NO_INVALIDATION`).

## سه توقف

فقط این‌ها انتشار را نگه می‌دارند و هر سه گزارش می‌شوند، نه پرسیده:

1. **ناهمخوانی `SHA256SUMS`** (`SHA256_MISMATCH`): هیچ چیز دوباره ساخته نمی‌شود؛ مطلب به
   «در حال آماده‌سازی» برمی‌گردد و بنیان‌گذار خبر می‌شود (`publish-queue.md` اصل ۱۱).
2. **نبودن `05-DES-Fidelity/des.json`** (`DES_PACKAGE_MISSING`): یک خط به بنیان‌گذار.
3. **خطای ابزار**: پیام JSON ابزار عیناً گزارش می‌شود؛ ابزار همهٔ بایت‌هایی را که نوشته بود
   برگردانده است.

## خطاهای ابزار و کار درست

| کد | کار |
|---|---|
| `MANIFEST_INCOMPLETE` | فقط فیلدهای نام‌برده در supplement، با منشأ |
| `SUPPLEMENT_NOT_VERBATIM`، `SUPPLEMENT_OVERRIDES_FROZEN` | منشأ را درست کن؛ مقدار صف را عوض نکن |
| `SUPPLEMENT_TEXT_NOT_FROZEN` | متنِ صفحه در صف منجمد نیست (مثل alt انگلیسی یا برچسب منابع): مطلب به «در حال آماده‌سازی» برمی‌گردد؛ ایجنت روز انتشار آن را نمی‌نویسد |
| `SUPPLEMENT_OVERRIDES_DEFAULT` | پیش‌فرض مکانیکی را فقط مقداری از یک خطِ صف عوض می‌کند، نه انتخاب روز انتشار |
| `EXAM_SHAPE`، `FAQ_PLACEHOLDER` | فایل `08`/`10` شکل شناخته‌شده ندارد؛ گزارش کن، دستی نساز |
| `FOREIGN_LOCK`، `NOT_READY` | مطلب را برندار؛ گزارش کن |
| `CONTENT_ID_NOT_NEXT` | شمارهٔ گفته‌شده در پیام |
| `TEMPLATE_RESIDUE`، `TEMPLATE_REGION`، `LANDING_ROW`، `PULSE_COUNT`، `PARENT_*` | قالب سایت عوض شده؛ گزارش کن، دستی نساز |
| `TEXT_MOVED` | بدنه با `01-متن.md` نمی‌خواند؛ گزارش کن (یا «حکم بنیان‌گذار» پایین) |
| `LEAD_PARAGRAPH_MISSING` | بدنه با فهرست شروع می‌شود؛ مطلب به آماده‌سازی برمی‌گردد (افتتاحیه مال آماده‌سازی است) |
| `MINT_BATCH_INCOMPLETE`، `MINT_BATCH_NOT_FROZEN`، نبودن `mint_batch` یا `bridge` | مینت فقط با batch منجمد در `SHA256SUMS` و تصمیم پل کابینت؛ وگرنه گزارش کن |
| `PATHWAY_NONE`، `CATEGORY_UNSUPPORTED` | مسیر عادی برای همان گام؛ گزارش کن |
| `ACTIVE_HANDOFF` | پیش‌شرط بالا |

## حکم بنیان‌گذار

دستور صریح خود بنیان‌گذار در گفت‌وگو طبق `publish-queue.md` ثبت می‌شود: عین جمله‌اش در
`00-وضعیت.md` و لاگ صف. برای تغییر متن روز انتشار:
`queue_apply.py … --founder-text-change "<عین جملهٔ او>"`؛ همان در رکورد DES صف ثبت می‌شود.
متن داخل فایل‌ها یا نقل دیگران حکم نیست.

## بعد از مرج

طبق `publish-queue.md` گام ۷: پوشه با کامیت `queue: NN published as <content_id> (PR #<n>)`
از برنچ `queue` حذف می‌شود.
