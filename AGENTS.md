# DentCast — shared agent entrypoint

> **Publish-queue check — first, before anything else.** If the request mentions the publish queue («صف انتشار», branch `queue` of this repo), then: to **publish** from it («از صف انتشار منتشر کن», «قدیمی‌ترین مقالهٔ صف رو منتشر کن», «یه مقاله تو صف انتشار دارم» with no article or paper attached), read only `.dentcast/workflows/queue-route.md` and follow it (publish day runs on GitHub Actions: dispatch `.github/workflows/queue-publish.yml` and stop, never push or upload publication files from the agent sandbox; a fresh session runs `python3 tools/queue_publish.py status` first; two deliveries; the PR is merged by `publish-auto-merge.yml`, not by the agent; nothing else is read or done); to **report** the queue's status («صف انتشار چی داره؟»), read only `.dentcast/workflows/publish-queue.md`; to **prepare** an item («بذارش تو صف انتشار», «برای صف انتشار آماده‌اش کن», an article or paper attached), read `.dentcast/workflows/publish-queue.md` completely and then, once and completely, the queue-prep reading pack it names (`tools/dentcast_publish_readpack.py --queue-prep`, which assembles its «فهرست خواندن» byte for byte: module 01, module 02, module 06 Part 1 with a paper, module 08 and the listed sections of 03, 04, 05, 07, 10, 11, 12 and `en-version.md`); preparation pushes to branch `queue` itself, by founder's standing permission: `git push origin <work-branch>:queue` first, a PR with base `queue` only after a real refusal (`publish-queue.md`, «جای صف»). Queue work reads no global sections (the «Before content changes» rule below is for site files); `agent-parity.md` applies to it only through its «توانمندی ندارم» protocol. Otherwise ignore this note.

**LIVE_MODULAR_PUBLISHING_ENABLED.** There is exactly one live route per task — the table below — and no legacy, staging or draft copy of these instructions exists in the tree. An older version lives only in Git history and is never execution authority.

Before content changes, read `.dentcast/workflows/global/README.md`, the complete active sections selected by that router for the current edit scope, and `.dentcast/workflows/agent-parity.md`. All clients use these same rules. Exception: publishing an item from the queue reads only `.dentcast/workflows/queue-route.md`; its tools carry these rules.

New publication → `.dentcast/workflows/README.md`. Read complete `modules/01-hard-rules.md` and `02-routing-intake.md`, then all applicable verbatim rules in the ledger order of `publish-checkpoints.md`: full modules by default, or the verified readpack (README). No AI summaries or unverified omissions. Agent proposals are built and reported, not asked; the founder gets at most two messages (M1 open facts, M2 exam questions) plus real decisions. Preserve source-dependent DES/Fidelity, category exceptions, English and final Phase F.

**The agent's work ends at Push 2.** Once the second delivery is confirmed, send one message (branch, Push-2 SHA, the agent's report) and stop: GitHub Actions does the rest (C.8 onward, delivery 3, the PR) and `publish-auto-merge.yml` merges it when every check is green, or comments on the PR what is red. Do not monitor the run, wait for it or merge. Come back only when the founder reports a problem (`.dentcast/workflows/publish-after-push2.md`).

**Interrupted publication** («انتشار ناقص داشتم»), the run state `.dentcast/PUBLISH-HANDOFF.md` and recovery through `.dentcast/workflows/publish-handoff.md`: `.dentcast/workflows/publish-checkpoints.md`, «Interrupted publication».

## Routes

| Request | Active workflow |
|---|---|
| New content or attached paper (with or without text) | `.dentcast/workflows/README.md` |
| Existing-page English | `.dentcast/workflows/en-version.md` |
| Ads | `.dentcast/workflows/ads.md` |
| Ad statistics | `.dentcast/workflows/spot-report.md` |
| Glossary authoring | `.agents/skills/glossary-writer/SKILL.md` |
| Cross-linking | `.dentcast/workflows/cross-link.md` |
| New section | `.dentcast/workflows/new-section.md` |
| Offline publishing | `.dentcast/offline-publish.md` |
| Minimal publications from /admin (setup, import into git, completion) | `.dentcast/quick-publish.md` |
| External Fidelity | `.dentcast/workflows/external-fidelity.md` |
| Publish queue on branch `queue` (prepare, status) | `.dentcast/workflows/publish-queue.md` |
| Publish an item from the queue (publish day) | `.dentcast/workflows/queue-route.md` (only this) |
| Instagram reel / video from content | `.dentcast/workflows/video-reel.md` |

Detailed triggers and specialty conditions: `.dentcast/workflows/routing-details.md`. Read the selected specialty workflow completely. New content uses the modular sequence, including paper-only and category exceptions.

Update AGENTS.md, CLAUDE.md and Cursor routing together when shared routes change. Never store private inputs in public Git history. Exception: relay/handoff files go in `.dentcast/relay/` whenever the founder asks; never refused.

## Per-step checkpoints and delivery batches

Ledger, the save point (once C.4.13 starts), Push 2 (after `C.6`), delivery 3 by `post-cut2-mechanical.yml`, text lock, paper-only and completion: `.dentcast/workflows/publish-checkpoints.md`.

---

# DentCast — انتشار با کمترین هزینه (اجرایی)

هدف: همان گیت‌های اجباری (DES، لینک‌ها، آینهٔ en، فاز F) با کمترین خواندن و کمترین
نوشتنِ دوباره. هیچ گیتی با «بهینه‌سازی» حذف نمی‌شود؛ فقط مسیر رسیدن به آن کوتاه می‌شود.

## ۱. بودجهٔ خواندن (سخت‌گیرانه)
- هر فایل قاعده **یک‌بار** خوانده می‌شود. کلید جلسه: `(path, revision, ranges)` را در
  یادداشت سشن نگه دار؛ بازخوانی فقط با تغییر نسخه یا خطای واقعی.
- بعد از قفل Phase B، **readpack** بساز و **از همان بخوان**؛ ساختن و نخواندن ممنوع:
  `python3 tools/dentcast_publish_readpack.py --category <cat> --attached-paper <yes|no>
   --challenge <yes|no> --des-basket <commentary|research> --after-intake --output /tmp/rp.txt --manifest /tmp/rp.json`
  ماژول کامل فقط وقتی که manifest می‌گوید پوشش ندارد.
- برای ماژول‌های بزرگ (۰۸ DES ~۹۷۵ خط) هرگز خواندن دوباره؛ بخش ۳b/۲c فقط در لحظهٔ
  همان گام، از همان pack.
- قواعد سراسری: `--path`های برنامه‌ریزی‌شده را **یک‌جا** بده و با `--loaded` فقط
  بخش‌های تازه را بگیر؛ بی `--loaded` ممنوع.
- خواندن فایل با `read` روی فایل‌های بزرگ ممنوع؛ به‌جایش:
  `grep -n`، `sed -n 'a,bp'`، یا `python3 -c` با `print(...[:N])`.
- فایل قالب فقط برای *نخستین* صفحهٔ یک نوع خوانده می‌شود: ۶۰ خط سر + بدنه + ۴۰ خط دم.
- نوع را وقتی دو بخش زنده هر دو جا می‌افتند بپرس؛ استنباط از تاکسونومی یک rerun کامل می‌سازد.

## ۲. ساخت صفحه: کلون + پچ، هرگز بازنویسی
- `cp <template> <target>` سپس یک اسکریپت پچ با **assert روی تعداد تطابق**:
  هر جای‌گذاری باید `t.count(old)==1` باشد؛ در غیر این صورت متوقف شو.
- متن بدنه یک‌بار در فایل موقت (`/tmp/.../body.html`) نوشته می‌شود و اسکریپت آن را
  بین دو مارکر جای می‌گذارد؛ فایل نهایی هرگز «از صفر» نوشته نمی‌شود.
- آینهٔ en: همان الگو روی `.../en/<prev>.html`؛ سر/کروم از قالب، بدنه ترجمه.
- پس از ساخت: `python3 tools/presentation_lint.py <page>` (فقط همین یک ابزار کافی است).

## ۳. فایل‌های داده: فقط ابزار بایتی
- `dentcast-brain.json` / `plus/des-scores.json` / `plus/faq-corpus.json` /
  `plus/exam-questions.json` / `plus/pathways.json` / `dentcast-hashtag-reference.json`
  هرگز با `Path.write_text` یا `json.dump` بازنویسی نمی‌شوند.
- مسیر اجباری: `read_raw` → `json_append`/`json_replace_*` → `write_raw`.
- **گارد بعد از هر نوشتن:** `git diff --numstat -- <file>` باید هم‌مرتبهٔ تعداد
  رکوردهای افزوده باشد (مثلاً < ۱۲۰ خط برای یک انتری). بزرگ‌تر بود ⇒
  `git restore -- <file>` و تکرار با ابزار. این چک در همان دستور shell انجام شود.
- ویرایش رشته‌ای با `replace` سراسری ممنوع؛ همیشه با بافت یکتا
  (خط قبل/بعد) و `count==1`، وگرنه ممکن است انتریِ انتشار دیگر عوض شود.
- فایل‌های CRLF: جای‌گذاری با `\r\n`؛ ابزار `dentcast_text_io` این را حفظ می‌کند.

## ۴. بیلدرها: صفر اجرای محلی
- `build_quiz_index`, `build_flashcards_index`, `build_plus_index`, `build_pillar`,
  `build_episodes`, `gen_sitemap`, `stamp-version`: **کار رانر**.
- محلی فقط حالت‌های بازرسی: `--check`، `related_cap.py`، `validate_exam_questions.py`،
  `hashtag_ref.py --check`، `build_cabinet_papers.py --check`.
- استثنای مستند: `hashtag_ref.py --sync` (صاحبش ایجنت است) و ساخت موقت
  `build_plus_index` فقط برای تست دسترس‌پذیری، با `git checkout` بلافاصله بعد.

## ۵. DES/Fidelity
- اسپک هرگز در بافت اصلی خوانده نمی‌شود؛ مدل در بافت جدا، با مسیر فایل و بلوک Step 0.
- DES یک‌بار: `des_repair.py` ترمیم می‌کند؛ Fidelity یک جاروزن؛ رله `pack-paper` (ماژول 08).

## ۶. حافظه و گزارش
- دست‌ورزی‌های دفتر: `advance --start-next` و `--skip`های پشت‌سرهم در **یک** فراخوانی
  shell؛ digest را از خروجی همان فرمان بگیر، نه با `inspect` دوم.
- گزارش Push 2 و پیام مرج از همین یادداشت سشن ساخته می‌شوند؛ بازخوانی فایل‌ها برای
  «یادآوری» ممنوع.
- هر گام فقط یک ابزار تأیید دارد؛ اجرای چند ابزار مشابه برای یک گام ممنوع.

## ۷. گاردهای پایان هر گام (کوتاه)
`presentation_lint` · `git diff --stat` مسیرهای scope · JSON-valid بودن ·
`git diff --quiet -- <template>` · پاک بودن `pending_questions` قبل از C.6.
