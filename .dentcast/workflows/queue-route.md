# انتشار از صف (روز انتشار)

همهٔ قضاوت‌ها در آماده‌سازی گرفته و منجمد شده‌اند؛ روز انتشار فقط ابزار اجرا می‌شود.
ایجنت متن نمی‌نویسد، جز پرسش مستندِ گام ۱ (handoff محلی) چیزی نمی‌پرسد، واقعیتی حدس نمی‌زند و کاری جز همین گام‌ها نمی‌کند.

**خواندن:** فقط همین سند. اگر اجرای `post-cut2-mechanical.yml` شکست خورد، از بخش بازیابی
`publish-after-push2.md` فقط بند «Transient» (dispatch دوبارهٔ همان کامیت) به مسیر صف می‌خورد: مسیر صف
`invalidate` و هر کامیت تازه از سندباکس را رد می‌کند (`QUEUE_LANE_NO_INVALIDATION`،
`ONLY_TWO_QUEUE_DELIVERIES_ALLOWED`)، پس هر علت دیگری فقط با لینک اجرا و خروجی `status` به بنیان‌گذار
گزارش می‌شود. `publish-queue.md` (آماده‌سازی و وضعیت صف)، `queue-maintainer.md` (قرارداد ابزارها) و
ماژول‌های 01 تا 12 روز انتشار صف خوانده نمی‌شوند.

**روز انتشار تماماً روی GitHub Actions است.** ایجنت (یا بنیان‌گذار از تب Actions، حتی با گوشی) فقط
`.github/workflows/queue-publish.yml` را اجرا و پایش می‌کند؛ برداشتن، قفل، برنچ، `run`، Push 2، تحویل سوم و PR
همه آنجا ساخته می‌شوند، و پاک‌کردن صف بعد از مرج با `.github/workflows/queue-publish-done.yml`.

> **قاعدهٔ سخت.** ایجنت هیچ فایلی را از راه API یا blob به گیت‌هاب نمی‌برد و هیچ Push 2 را از سندباکس خودش
> نمی‌فرستد. اگر به هر دلیلی مجبور به اجرای محلی شد و push شکست، `PUSH_FAILED` را عیناً گزارش می‌کند و
> می‌ایستد؛ بازسازی فایل‌ها از راه API ممنوع است.

> **ادامه در جلسهٔ تازه.** هر جلسهٔ تازه (هر ایجنتی) اول `python3 tools/queue_publish.py status` را اجرا می‌کند
> و همان `next_step` خروجی را دنبال می‌کند؛ هرگز از تاریخچهٔ گفت‌وگو حدس نمی‌زند. پیش از آن main محلی را
> `git pull --ff-only origin main` می‌کند تا `status` با منطق همان main اجرا شود. `status` فقط می‌خواند
> (برنچ `queue`، اجرای زندهٔ `queue-publish.yml`، برنچ `queue-publish/NN-*`، handoff روی سرِ آن، آخرین اجرای
> post-cut2، PR) و جز refهای remote-tracking و آبجکت‌های fetch چیزی نمی‌نویسد.

## گام‌ها

1. **پیش‌شرط.** `python3 tools/queue_publish.py status`. `IDLE` یعنی هیچ مطلبی «در حال انتشار» نیست: گام ۲.
   هر حالت دیگر یعنی انتشاری نیمه‌کاره هست: انتشار تازه شروع نمی‌شود؛ `next_step` همان مطلب دنبال یا به
   بنیان‌گذار گزارش می‌شود (جدول حالت‌ها، پایین). اگر در checkout محلی `.dentcast/PUBLISH-HANDOFF.md` هست: دست
   نزن، بپرس آیا منظور ادامهٔ همان انتشار است.
2. **اجرا.** `queue-publish.yml` را dispatch کن، با `nn` خالی (قدیمی‌ترین «آماده»، مثل `pick`) یا NNی که
   بنیان‌گذار نام برده، و `requested_by` = نام ایجنت (نام قفل). یکی از این سه راه:
   - تب Actions ← «Queue publish (publish day)» ← «Run workflow»؛
   - `gh workflow run queue-publish.yml -f nn=NN -f requested_by="<نام>"`؛ dispatch شمارهٔ اجرا را برنمی‌گرداند:
     `gh run list --workflow queue-publish.yml --event workflow_dispatch -L1 --json databaseId,url,displayTitle`
     (نام اجرا «Queue publish <NN|oldest ready> (<نام>)»)؛
   - MCP گیت‌هاب: `actions_run_trigger` با `method: "run_workflow"`, `owner: "dentcast-hub"`,
     `repo: "dentcast-hub.github.io"`, `workflow_id: "queue-publish.yml"`, `ref: "main"`,
     `inputs: {"nn": "NN", "requested_by": "<نام>"}`؛ اجرا با `actions_list` (`method: "list_workflow_runs"`,
     `resource_id: "queue-publish.yml"`, فیلتر `event: workflow_dispatch`) و همان نام اجرا پیدا می‌شود؛
   - REST: `POST repos/dentcast-hub/dentcast-hub.github.io/actions/workflows/queue-publish.yml/dispatches`
     با `{"ref": "main", "inputs": {"nn": "NN", "requested_by": "<نام>"}}` و سرآیند `Authorization: Bearer <توکن>`
     (توکنی با Actions: write؛ `QUEUE_PUBLISH_TOKEN` secret مخزن است و در دست ایجنت نیست).

   `nn` را برای «قدیمی‌ترین آماده» **خالی بگذار یا اصلاً نده** (`gh workflow run queue-publish.yml
   -f requested_by="<نام>"`). `requested_by` همان نامی است که قفل را می‌سازد و `unlock` با آن مقایسه
   می‌کند، پس نامِ ثابتِ کلاینت است (`claude-code`، `cursor`، `codex`)، نه رشته‌ای تازه در هر اجرا.
   **هیچ‌کدام در دسترس نیست** (نه `gh` احرازشده، نه MCP، نه توکن): کار **به بنیان‌گذار سپرده می‌شود**: همین
   ورودی‌ها («Run workflow» در تب Actions، `nn` خالی، `requested_by`) در یک خط گزارش می‌شود تا خودش
   «Run workflow» را بزند، و با لینک اجرایی که او می‌دهد از گام ۳ ادامه می‌یابد؛ هیچ راهِ جایگزینی (API با
   curl، push از سندباکس، بازسازی فایل‌ها) اجرا نمی‌شود.
   workflow به ترتیب: `pick` ← `lock` و push برنچ `queue` ← برنچ `queue-publish/<نام پوشهٔ مطلب>` تازه از
   `origin/main` (برنچی با همین NN روی origin باشد: `BRANCH_EXISTS`، چیزی قفل نمی‌شود) ← `run`: بررسی manifest
   و اجرای آزمایشی (رد ← هیچ چیزی نوشته نمی‌شود)، ledger صف، `queue_apply.py`، رکوردهای ledger، گام‌ها تا
   `C.6`، یک کامیت و یک push (Push 2). `content_id` شمارهٔ آزاد بعدی همان دسته است و تاریخ، امروزِ تهران؛
   هیچ‌کدام انتخاب ایجنت نیست. هر شکستی بعد از قفل و پیش از رسیدن Push 2 به origin، مطلب را با
   `queue_publish.py unlock` به «آماده» برمی‌گرداند (شکست یا لغو اجرا)؛ مطلب هیچ‌وقت در قفل یک اجرای مرده
   نمی‌ماند. وقتی ابزار مطلب را رد می‌کند (جدول پایین) هم همین unlock اجرا می‌شود: مطلب «آماده» می‌ماند و
   بازگرداندنش به «در حال آماده‌سازی» کار آماده‌ساز است، نه workflow.
3. **پایش.** اجرای `queue-publish.yml` را تا پایان دنبال کن (`gh run watch <id> --exit-status`؛ MCP:
   `actions_get` / `actions_list` (`list_workflow_jobs`) و `get_job_logs`؛ REST:
   `GET repos/…/actions/runs/<id>` و `…/runs/<id>/jobs`؛ هیچ‌کدام: لینک اجرا را بنیان‌گذار می‌دهد). job دوم،
   `await-delivery-3`، خودش اجرای `post-cut2-mechanical.yml` روی همان برنچ و همان SHA Push 2 را تا ۶۰ دقیقه
   پایش می‌کند، تحویل سوم را وارسی می‌کند (job `mechanical-continuation` سبز، سرِ برنچ جلوتر از Push 2،
   handoff پاک) و PR به main را باز می‌کند.
4. **گزارش به بنیان‌گذار.** `content_id`، برنچ، SHA Push 2، لینک اجرای post-cut2، لینک PR، و
   `mechanical_defaults` و `manual_steps`، هر کدام یک خط. منبع: خلاصهٔ اجرا (job summary) در UI؛ همان JSON در
   لاگ گام «Run the item» (خط `result=`) و لینک PR در لاگ گام «Open the PR» (خط `PR:`) و بدنهٔ خود PR هست،
   چون API و `gh` خلاصهٔ اجرا را برنمی‌گردانند. شکست یا timeout: لینک اجرا و خروجی JSON ابزار عیناً، بعد
   `status` و `next_step` آن.
5. **مرج.** مرج تصمیم بنیان‌گذار است، همان‌جا که `queue-publish.yml` و `publish-after-push2.md` می‌گویند:
   وقتی تحویل سوم، Phase F و گیت‌های PR سبزند (`gh pr checks <n>`، MCP `pull_request_read` با `get_status`، یا
   REST `GET repos/…/commits/<sha>/check-runs`)، آمادگی گزارش می‌شود و PR **فقط با اجازهٔ بنیان‌گذار** مرج
   می‌شود — یک «بعد از تکمیل مرج کن» صریح در همین درخواست یا پیش از آن کافی است و تا سبزشدن همهٔ گیت‌ها
   معتبر می‌ماند (`gh pr merge <n> --merge`، MCP `merge_pull_request`، یا REST `PUT repos/…/pulls/<n>/merge`؛
   `queue-publish-done.yml` کامیت‌های PR را از API می‌خواند، پس روش مرج آزاد است). گیت قرمز یعنی مرج نه.
   ابزار مرج در دسترس نیست: لینک PR و وضعیت گیت‌ها گزارش می‌شود و بنیان‌گذار Merge را می‌زند.
6. **پاک‌کردن صف.** خودکار: `queue-publish-done.yml` بعد از مرج پوشهٔ مطلب را با کامیت
   `queue: NN published as <content_id> (PR #n)` از `queue` برمی‌دارد. فقط اگر آن workflow شکست خورد:
   `python3 tools/queue_publish.py done <پوشه> --content-id <id> --pr <n>` در یک checkout برنچ `queue` و push چاپ‌شده.

**checkout برنچ `queue`** (گام ۶ و `unlock`): `git fetch origin queue && git worktree add -B queue ../dentcast-queue origin/queue`
(worktree‌ای که برنچ محلی‌اش `queue` نام دارد، تا `git -C … push origin queue` چاپ‌شده کار کند). نام ایجنت در
`unlock --agent` همان مقدار `lock` است که `status` چاپ می‌کند.

مسیر صف دقیقاً دو تحویل دارد (Push 2 و تحویل Action؛ نام‌ها همان مسیر عادی‌اند، پس تحویل Action همان «تحویل
سوم» و job `await-delivery-3` است). دسته‌های پشتیبانی‌شده: `sharehub`، `notecast`،
`insight`، `chairside`، `metanote` (اینسایت، چیرساید و متانوت بی کردیت پیپر؛ متانوت حداکثر یک تصویر). بقیه
(`CATEGORY_UNSUPPORTED`) از مسیر عادی `.dentcast/workflows/README.md`.

**توکن.** هر سه کار نوشتنی با secret مخزن `QUEUE_PUBLISH_TOKEN` انجام می‌شوند (Settings ← Secrets and
variables ← Actions ← New repository secret): یک fine-grained personal access token فقط برای همین مخزن با
Contents: read and write، Pull requests: read and write، Actions: read و Metadata: read. `GITHUB_TOKEN` کافی
نیست: push و PRی که با آن ساخته شود workflow دیگری را راه نمی‌اندازد، و Push 2 باید `post-cut2-mechanical.yml`
و PR باید گیت‌هایش را راه بیندازد. بی این secret هر دو workflow در گام اول با پیام روشن می‌ایستند و چیزی
برداشته یا قفل نمی‌شود.

## حالت‌های `status`

| `state` | کار |
|---|---|
| `IDLE` | هیچ مطلبی «در حال انتشار» نیست؛ انتشار تازه (گام ۲) |
| `QUEUE_PUBLISH_RUN_IN_PROGRESS` | یک اجرای `queue-publish.yml` در صف یا در حال اجراست (بین قفل و Push 2، یا بین Push 2 و PR): فقط صبر و پایش همان اجرا؛ هیچ unlock و هیچ dispatch |
| `LOCKED_NO_BRANCH` | Push 2 هرگز نرسید و هیچ اجرای `queue-publish.yml` زنده نیست (API نبود: اول تب Actions): `unlock` (قفل خود اجرا؛ قفل ایجنت دیگر فقط با `--force` بنیان‌گذار) و push، بعد dispatch دوباره. ابزار unlock در دسترس نیست: گزارش به بنیان‌گذار |
| `AMBIGUOUS_BRANCHES` | چند برنچ `queue-publish/NN-*`: گزارش؛ بنیان‌گذار تصمیم می‌گیرد |
| `PUSH2_NO_RUN`، `PUSH2_RUN_FAILED` | dispatch `post-cut2-mechanical.yml` با دقیقاً `target_branch` / `expected_head` و `--ref` که خروجی چاپ می‌کند (شکست: اول لاگ و بستهٔ بازیابی، بعد dispatch) |
| `PUSH2_RECONCILIATION_REQUIRED` | سرِ برنچ از کامیت checkpoint handoff جلوتر است؛ post-cut2 با `RECONCILIATION_REQUIRED` رد می‌کند. مسیر صف کامیت تازه از سندباکس ندارد: فقط گزارش با `commits_after_handoff` به بنیان‌گذار؛ او تصمیم می‌گیرد |
| `PUSH2_RUN_IN_PROGRESS` | صبر و پایش همان اجرا |
| `DELIVERY3_NO_PR` | PR به main با عنوان `<content_id>: publish queue item NN` و بدنهٔ Push-2 SHA + `mechanical_defaults` + `manual_steps` از خط `result=` لاگ (`gh pr create --base main --head <برنچ> --title … --body …`، MCP `create_pull_request`، یا REST `POST repos/…/pulls`؛ هیچ‌کدام: گزارش به بنیان‌گذار) |
| `PR_OPEN` | مرج وقتی گیت‌ها سبزند (گام ۵) |
| `PR_MERGED_ITEM_IN_QUEUE` | `done` (گام ۶) |
| `MULTIPLE` | چند مطلب «در حال انتشار»: هیچ انتشار تازه‌ای شروع نمی‌شود؛ `items[].next_step` هر کدام به ترتیب از قدیمی‌ترین دنبال یا گزارش می‌شود |
| `PR_CLOSED_UNMERGED`، `BRANCH_WITHOUT_HANDOFF`، `UNKNOWN`، `*_UNKNOWN` | گزارش با شواهد خروجی؛ API در دسترس نیست یعنی تب Actions و PRهای همان برنچ |
| رد با `QUEUE_UNAVAILABLE` (خروج ۲) | `origin/queue` نه fetch شد و نه کپی محلی دارد: شبکه، بعد دوباره `status`؛ نشد، شبکه/دسترسی گزارش می‌شود و انتشار شروع نمی‌شود |

## وقتی ابزار رد می‌کند

خروجی JSON ابزار در خلاصهٔ اجرای `queue-publish.yml` (بخش «output (verbatim)» هر گام) عیناً گزارش می‌شود؛
چیزی دستی ساخته نمی‌شود، روی main و برنچ انتشار چیزی نمی‌ماند و مطلب قفل‌شده دوباره «آماده» می‌شود.

| کد | کار |
|---|---|
| `SHA256_MISMATCH`، `SHA256SUMS_MISSING`، `SHA256SUMS_MALFORMED`، `CATALOG_NOT_FROZEN`، `STATUS_MISSING` | انجماد مطلب سالم نیست: باید به «در حال آماده‌سازی» برگردد و دوباره منجمد شود؛ workflow فقط unlock می‌کند، پس مطلب «آماده» می‌ماند: کد یک خط به بنیان‌گذار، و تا آماده‌ساز وضعیتش را عوض نکند، dispatch بعدی `nn` را صریح می‌دهد (با `nn` خالی همین مطلب دوباره برداشته می‌شود) |
| `MANIFEST_INCOMPLETE`، `SUPPLEMENT_TEXT_NOT_FROZEN` | فیلد یا متنِ نام‌برده باید در خود مطلب منجمد شود؛ workflow ورودی supplement ندارد و فقط unlock می‌کند: همان رفتار ردیف بالا (کد و فیلد نام‌برده یک خط به بنیان‌گذار؛ مطلب «آماده» می‌ماند تا آماده‌ساز به «در حال آماده‌سازی» برگرداند؛ `nn` صریح) |
| `DES_PACKAGE_MISSING` | یک خط به بنیان‌گذار؛ همان رفتار ردیف بالا |
| `FOREIGN_LOCK`، `NOT_READY`، `NO_READY_ITEM`، `NAMED_ITEM_NOT_READY` | مطلب برداشته نمی‌شود؛ گزارش |
| `BRANCH_EXISTS` | برنچ انتشار همین NN از قبل هست: چیزی قفل نشد؛ `status` و `next_step` آن. اگر `status` `IDLE` است برنچ بازماندهٔ اجرایی پیشین است: نام برنچ به بنیان‌گذار گزارش می‌شود و فقط با حکم او حذف می‌شود |
| `PUSH_FAILED`، `PUSH2_ON_ORIGIN` | Push 2 نرسید (قفل باز شد) / رسید (قفل می‌ماند): `status` و `next_step` آن؛ هرگز بازسازی فایل‌ها |
| `CATEGORY_UNSUPPORTED`، `PATHWAY_NONE` | مسیر عادی |
| `TEXT_MOVED`، `TEMPLATE_*`، `LANDING_ROW`، `PULSE_COUNT`، `PARENT_*`، `EXAM_SHAPE`، `FAQ_PLACEHOLDER`، `LEAD_PARAGRAPH_MISSING`، `MINT_*`، `METANOTE_*`، `CONTENT_ID_NOT_NEXT` | قالب سایت یا فایل صف با ابزار نمی‌خواند (یا انتشار دیگری میان راه مرج شد)؛ گزارش |
| هر کد دیگر (`ACTIVE_HANDOFF`، `DIRTY_TREE`، `SHA256SUMS_*`، `LEDGER_*`، `STAGE_DELIVERY`، `COMMAND_FAILED`، …) | JSON عیناً گزارش می‌شود؛ مطلب با unlock «آماده» است؛ چیزی دستی ساخته نمی‌شود |

**supplement** (فقط اجرای محلی ابزار به دستور بنیان‌گذار، نه workflow) فقط برای فیلدی که ابزار `missing`
می‌گوید، در یک فایل JSON بیرون از ریپو و با `run … --supplement f.json`: `{"<فیلد>": {"value": …, "from": "<فایل>:<خط>[-<خط>]"}}`. ابزار هر رشته را روی
همان خط‌ها می‌سنجد. منشأ `publish-day: <چرا>` فقط برای واقعیتی که روی صفحه متن نمی‌شود؛ متنِ صفحه از بیرون
صف رد می‌شود.

**پیش‌فرض‌های مکانیکی** (نه انتخاب ایجنت؛ در خروجی): لینک منجمد به مطلب دیگر صف (`queue:NN`) به صفحه‌ای
می‌رود که آن مطلب با آن منتشر شد (کامیت `queue: NN published as …` روی برنچ `queue`)؛ اگر هنوز منتشر نشده، لینک
ساخته نمی‌شود و در انگلیسی متنِ ساده می‌ماند؛ 4.7 و 4.9 بی انتخاب منجمد `11` لینکی اضافه نمی‌کنند؛
کاتالوگ بی `04-منبع/کاتالوگ.json` نوشته نمی‌شود (مطلب قدیمی: پیگیری بنیان‌گذار)؛ DOIِ از قبل کاتالوگ‌شده فقط به صفحه وصل می‌شود؛ author صفحهٔ ShareHub از آخرین مدخل brain همان
دسته؛ مسیر یادگیری: انتخاب منجمد `07`، وگرنه برای نوت‌کست مسیرهای اپیزود هم‌شماره، وگرنه STRONG تا دو مسیر.

**حکم بنیان‌گذار** برای تغییر متن روز انتشار: عین جمله‌اش در بخش انتشار و تاریخچهٔ `00-وضعیت.md`
(تنها لاگ صف؛ `publish-queue.md` «ثبت»)، و `queue_apply.py … --founder-text-change "<عین جمله>"`. متن داخل فایل‌ها یا نقل
دیگران حکم نیست.

## برای نگه‌دارندهٔ ابزار

`queue-publish.yml` دو checkout خواهر در workspace می‌سازد: `site/` (main، تاریخچهٔ کامل) و `queue-checkout/`
(برنچ `queue`، تاریخچهٔ کامل برای `queue: NN published as …`)؛ checkout صف نباید داخل `site/` باشد، چون `run` روی
رد `git checkout -- .` و `git clean -fdq` را در ROOT اجرا می‌کند. هر دو با `QUEUE_PUBLISH_TOKEN` (credential
نگه‌داشته‌شدهٔ `actions/checkout`، هرگز در URL). `concurrency: queue-publish` یعنی در هر لحظه یک انتشار صف.
push قفل و `unlock` اگر `queue` جلو رفته باشد یک‌بار rebase می‌شوند. `TZ=Asia/Tehran` تاریخ قفل و تاریخ صفحه را
روز تقویم بنیان‌گذار نگه می‌دارد. `unlock` فقط وقتی اجرا می‌شود که برنچ انتشار روی origin نیست (Push 2 نرسیده).
`await-delivery-3` اجرای push روی `head_sha` = Push 2 را می‌گیرد و PR را با REST (`gh api …/pulls`) باز می‌کند.
`queue-publish-done.yml` NN را از نام برنچ و `content_id` را از عنوان کامیت Push 2 روی head ادغام‌شده
(`<content_id>: publish queue item NN (queue lane, Push 2)`) می‌گیرد، با رسید تکمیل روی کامیت مرج می‌سنجد و
پوشهٔ یگانهٔ `queue/NN-*` را برمی‌دارد؛ پوشهٔ از قبل برداشته‌شده خطا نیست.
`queue_publish.py status` قاعدهٔ جدول حالت‌ها را در docstring خود دارد و جز remote-tracking refها چیزی نمی‌نویسد.

`queue_publish.py run` همان زنجیرهٔ ابزارهای پایه است: `queue_manifest.py check`،
`queue_ledger.py init-input` و `dentcast_publish_handoff.py init` (plan `--queue`، ۱۲ گام، `queue_lane_v1`)،
`queue_apply.py` (رسید)، `queue_ledger.py record` (رکوردهای `queue_approvals_v1`، provenance افتتاحیه، قفل
ویراستاری، تأیید عنوان و کپشن، `target_paths`)، `step` تا `C.6`، `stage-delivery`. کامیت handoff پیش از
`C.6`، کامیت سوم یا `invalidate` رد می‌شوند (`ONLY_TWO_QUEUE_DELIVERIES_ALLOWED`،
`EXTRA_DELIVERY_COMMIT_FORBIDDEN`، `QUEUE_LANE_NO_INVALIDATION`).
