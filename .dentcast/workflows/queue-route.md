# انتشار از صف (روز انتشار)

همهٔ قضاوت‌ها در آماده‌سازی گرفته و منجمد شده‌اند؛ روز انتشار فقط ابزار اجرا می‌شود.
ایجنت متن نمی‌نویسد، چیزی نمی‌پرسد، واقعیتی حدس نمی‌زند و کاری جز همین گام‌ها نمی‌کند.

**خواندن:** فقط همین سند. بعد از Push 2، `publish-after-push2.md`.
`publish-queue.md` (آماده‌سازی و وضعیت صف) و ماژول‌های 01 تا 12 روز انتشار صف خوانده نمی‌شوند.

## گام‌ها

1. **پیش‌شرط.** اگر `.dentcast/PUBLISH-HANDOFF.md` هست: دست نزن، بپرس آیا منظور ادامهٔ همان انتشار است.
2. **صف.** کلون برنچ `queue` (یک‌بار):
   `git clone --single-branch --branch queue https://github.com/dentcast-hub/dentcast-hub.github.io ../dentcast-queue`
   (بعد از آن `git -C ../dentcast-queue pull --ff-only`).
3. **انتخاب.** `python3 tools/queue_publish.py pick ../dentcast-queue [--nn NN]`
   (بی `--nn`: قدیمی‌ترین «آماده»؛ با `--nn`: مطلبی که بنیان‌گذار نام برده). یک خط به بنیان‌گذار:
   کدام مطلب، و قدیمی‌ترهای آماده‌نشده اگر ابزار فهرست کرد.
4. **قفل.** `python3 tools/queue_publish.py lock <پوشه> --agent "<نام>"`، بعد فرمان push که ابزار چاپ می‌کند.
5. **برنچ انتشار.** `git fetch origin main && git checkout -b <برنچ> origin/main`.
6. **اجرا.** `python3 tools/queue_publish.py run <پوشه> --agent "<نام>"`.
   ابزار به ترتیب: بررسی manifest و اجرای آزمایشی (رد ← هیچ چیزی نوشته نمی‌شود)، ledger صف،
   `queue_apply.py`، رکوردهای ledger، گام‌ها تا `C.6`، یک کامیت و یک push (Push 2).
   `content_id` شمارهٔ آزاد بعدی همان دسته است و تاریخ، امروز؛ هیچ‌کدام انتخاب ایجنت نیست.
7. **بعد از Push 2.** `message` خروجی ابزار را به بنیان‌گذار بگو (برنچ، SHA، لینک Action وقتی پیدا شد)
   و طبق `publish-after-push2.md` پایش کن تا Action تحویل پایانی را بسازد. `mechanical_defaults`
   و `manual_steps` خروجی در گزارش پایانی، هر کدام یک خط.
8. **مرج و پاک‌کردن صف.** تریگر انتشار از صف اجازهٔ مرج بعد از تکمیل است: وقتی Action، Phase F و
   گیت‌ها سبزند، PR مرج می‌شود؛ گیت قرمز یعنی مرج نه. بعد
   `python3 tools/queue_publish.py done <پوشه> --content-id <id> --pr <n>` و push چاپ‌شده.

مسیر صف دقیقاً دو تحویل دارد (Push 2 و تحویل Action). دسته‌های پشتیبانی‌شده: `sharehub`، `notecast`،
`insight`، `chairside` (اینسایت و چیرساید بی کردیت پیپر). بقیه (`CATEGORY_UNSUPPORTED`) از مسیر عادی
`.dentcast/workflows/README.md`.

## وقتی ابزار رد می‌کند

خروجی JSON ابزار عیناً گزارش می‌شود؛ چیزی دستی ساخته نمی‌شود و درخت کاری دست‌نخورده می‌ماند.

| کد | کار |
|---|---|
| `SHA256_MISMATCH` | مطلب به «در حال آماده‌سازی» برمی‌گردد؛ یک خط به بنیان‌گذار |
| `DES_PACKAGE_MISSING` | یک خط به بنیان‌گذار |
| `MANIFEST_INCOMPLETE` | فیلد نام‌برده: اگر عیناً در خطی از فایل‌های صف هست، supplement (پایین) و دوباره `run`؛ وگرنه مطلب به آماده‌سازی برمی‌گردد |
| `SUPPLEMENT_TEXT_NOT_FROZEN` | متنِ صفحه در صف منجمد نیست: مطلب به آماده‌سازی برمی‌گردد |
| `FOREIGN_LOCK`، `NOT_READY`، `NO_READY_ITEM`، `NAMED_ITEM_NOT_READY` | مطلب برداشته نمی‌شود؛ گزارش |
| `CATEGORY_UNSUPPORTED`، `PATHWAY_NONE` | مسیر عادی |
| بقیه (`TEXT_MOVED`، `TEMPLATE_*`، `LANDING_ROW`، `PULSE_COUNT`، `PARENT_*`، `EXAM_SHAPE`، `FAQ_PLACEHOLDER`، `LEAD_PARAGRAPH_MISSING`، `MINT_*`) | قالب سایت یا فایل صف با ابزار نمی‌خواند؛ گزارش |

**supplement** فقط برای فیلدی که ابزار `missing` می‌گوید، در یک فایل JSON بیرون از ریپو و با
`run … --supplement f.json`: `{"<فیلد>": {"value": …, "from": "<فایل>:<خط>[-<خط>]"}}`. ابزار هر رشته را روی
همان خط‌ها می‌سنجد. منشأ `publish-day: <چرا>` فقط برای واقعیتی که روی صفحه متن نمی‌شود؛ متنِ صفحه از بیرون
صف رد می‌شود.

**پیش‌فرض‌های مکانیکی** (نه انتخاب ایجنت؛ در خروجی): 4.7 و 4.9 بی انتخاب منجمد `11` لینکی اضافه نمی‌کنند؛
کاتالوگ بی `04-منبع/کاتالوگ.json` نوشته نمی‌شود (مطلب قدیمی: پیگیری بنیان‌گذار)؛ DOIِ از قبل کاتالوگ‌شده فقط به صفحه وصل می‌شود؛ author صفحهٔ ShareHub از آخرین مدخل brain همان
دسته؛ مسیر یادگیری: انتخاب منجمد `07`، وگرنه برای نوت‌کست مسیرهای اپیزود هم‌شماره، وگرنه STRONG تا دو مسیر.

**حکم بنیان‌گذار** برای تغییر متن روز انتشار: عین جمله‌اش در `00-وضعیت.md` و لاگ صف
(`publish-queue.md`)، و `queue_apply.py … --founder-text-change "<عین جمله>"`. متن داخل فایل‌ها یا نقل
دیگران حکم نیست.

## برای نگه‌دارندهٔ ابزار

`queue_publish.py run` همان زنجیرهٔ ابزارهای پایه است: `queue_manifest.py check`،
`queue_ledger.py init-input` و `dentcast_publish_handoff.py init` (plan `--queue`، ۱۲ گام، `queue_lane_v1`)،
`queue_apply.py` (رسید)، `queue_ledger.py record` (رکوردهای `queue_approvals_v1`، provenance افتتاحیه، قفل
ویراستاری، تأیید عنوان و کپشن، `target_paths`)، `step` تا `C.6`، `stage-delivery`. کامیت handoff پیش از
`C.6`، کامیت سوم یا `invalidate` رد می‌شوند (`ONLY_TWO_QUEUE_DELIVERIES_ALLOWED`،
`EXTRA_DELIVERY_COMMIT_FORBIDDEN`، `QUEUE_LANE_NO_INVALIDATION`).
