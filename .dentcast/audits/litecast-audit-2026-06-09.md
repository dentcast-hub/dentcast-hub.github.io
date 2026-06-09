# LiteCast Content Audit — 2026-06-09

**Scope:** Read-only analysis of the LiteCast section of DentCast. No patient-facing
content was modified, created, or deleted; the only file written is this report.

**How LiteCast was discovered (per CLAUDE.md + `.dentcast/workflows/README.md` §0):**
- Content lives in `/litecast/` at the repo root.
- The **source of truth is `litecast/lite-glossary.json`** (top-level key `LightGlossary`),
  **not** `dentcast-brain.json`. LiteCast is an isolated track: `.ir`-only, no hreflang/en
  mirror, no specialist cross-linking, no brain entry.
- Each entry's `page_url` is `litecast/lite-CAST{N}.html` (note: filename has **no** dash —
  `lite-CAST12.html`, despite the workflow doc's `lite-CAST-N.html` shorthand).
- Hub page: `litecast/index.html` (canonical `https://dentcast.ir/litecast/`).
- `LightGlossary` holds **28 entries** (`litecast-1` … `litecast-28`); disk holds **28**
  matching pages (`lite-CAST1.html` … `lite-CAST28.html`). Counts reconcile exactly — no
  missing or stray pages.

> Note on array order: entries in `lite-glossary.json` are stored out of numeric sequence
> (12–19, then 1–11, then 20–28). The newest item (`litecast-28`) is correctly **last**, so
> the homepage "latest content" widget still reads the right tail — but the mid-list ordering
> is untidy and worth a future cleanup pass.

---

## 1. Inventory Table

All 28 pages carry a `<link rel="canonical">` pointing to **`https://dentcast.ir/…`** (✓ patient-facing
`.ir` canonical, consistent with the `.org`/`.ir` mirror setup). All 28 declare **FAQPage** JSON-LD.
"Sec. (H2)" = in-body section headings (excludes the "Lite-CAST" eyebrow and the "کاوش بیشتر" label);
"FAQ Q" = number of `Question` entities in the FAQPage schema.

| # | File | Canonical → dentcast.ir | Primary question (H1) | Sec. (H2) | FAQ Q |
|---|------|:---:|----------------------|:---:|:---:|
| 1 | lite-CAST1.html | ✓ | قانون ۲-۲-۲ در دندان‌پزشکی (نحوه‌ی مسواک زدن و رعایت بهداشت) | 0 | 3 |
| 2 | lite-CAST2.html | ✓ | چرا دنچر پایین (دندان مصنوعی) لق می‌شود؟ | 0 | 4 |
| 3 | lite-CAST3.html | ✓ | اگر دندان از دست رفته را جایگزین نکنیم چه می‌شود؟ | 0 | 3 |
| 4 | lite-CAST4.html | ✓ | آیا ایمپلنت برای کسانی که دندان مصنوعی کامل دارند، مزیتی دارد؟ | 0 | 3 |
| 5 | lite-CAST5.html | ✓ | دندان مصنوعی متحرک یا ایمپلنت ثابت؟ بهترین انتخاب کدام است؟ | 0 | 2 |
| 6 | lite-CAST6.html | ✓ | تبخال و دندانپزشکی؛ آیا با تبخال فعال می‌توانم به دندانپزشکی بروم؟ | 0 | 3 |
| 7 | lite-CAST7.html | ✓ | تفاوت لمینت سرامیکی و کامپوزیت دندان چیست؟ (و کدام بهتر است؟) | 0 | 2 |
| 8 | lite-CAST8.html | ✓ | مراحل ایمپلنت دندان چقدر طول می‌کشد؟ (از جراحی تا روکش دیجیتال) | 0 | 4 |
| 9 | lite-CAST9.html | ✓ | ایمپلنت دیجیتال یعنی چی؟ | 0 | 2 |
| 10 | lite-CAST10.html | ✓ | چرا روکش بعضی از ایمپلنت‌ها شل می‌شود؟ | 0 | 4 |
| 11 | lite-CAST11.html | ✓ | بهترین دکتر، بهترین متخصص پروتز یا بهترین کلینیک؟ معیار درست انتخاب چیست؟ | 0 | 5 |
| 12 | lite-CAST12.html | ✓ | ایمپلنت چیست؟ | 5 | 6 |
| 13 | lite-CAST13.html | ✓ | مراحل ایمپلنت | 6 | 5 |
| 14 | lite-CAST14.html | ✓ | ایمپلنت دیجیتال چیست؟ | 6 | 5 |
| 15 | lite-CAST15.html | ✓ | ایمپلنت فوری چیست؟ | 5 | 5 |
| 16 | lite-CAST16.html | ✓ | روکش ایمپلنت چیست؟ | 4 | 5 |
| 17 | lite-CAST17.html | ✓ | پیچ ایمپلنت چیست؟ | 3 | 4 |
| 18 | lite-CAST18.html | ✓ | اباتمنت چیست؟ | 3 | 4 |
| 19 | lite-CAST19.html | ✓ | فالوآپ ایمپلنت چیست؟ | 4 | 4 |
| 20 | lite-CAST20.html | ✓ | چرا عکس پانورامیک برای تشخیص پوسیدگی مناسب نیست؟ | 4 | 4 |
| 21 | lite-CAST21.html | ✓ | آیا عصب‌کشی دندان درد دارد؟ | 6 | 4 |
| 22 | lite-CAST22.html | ✓ | آیا دندان عصب‌کشی شده ضعیف می‌شود؟ | 4 | 4 |
| 23 | lite-CAST23.html | ✓ | چه زمانی دندان عصب‌کشی شده نیاز به روکش دارد؟ | 5 | 4 |
| 24 | lite-CAST24.html | ✓ | اگر روی دندان عصب‌کشی شده روکش نگذاریم چه می‌شود؟ | 4 | 4 |
| 25 | lite-CAST25.html | ✓ | اگر دندان عصب‌کشی شده بشکند چه می‌شود؟ | 6 | 4 |
| 26 | lite-CAST26.html | ✓ | دیابت و دندان‌ها؛ چرا باید بیشتر مراقب باشید | 5 | 4 |
| 27 | lite-CAST27.html | ✓ | واترجت دندان چیست و آیا جای نخ دندان را می‌گیرد؟ | 4 | 4 |
| 28 | lite-CAST28.html | ✓ | بعد از عصب‌کشی چقدر وقت داریم تا دندان را ترمیم کنیم؟ | 4 | 5 |

**Totals:** 28 pages · 28 canonical to `dentcast.ir` (100%) · 28 with FAQPage (100%) ·
**113 FAQ Question entities** total (range 2–6 per page, mean ≈ 4.0).

**Structural observation — two body templates coexist:**
- **Pages 1–11** (the older batch) carry **no in-body `<h2>` sub-sections**; their secondary
  questions live **only** inside the FAQPage schema (machine-readable but not rendered as
  on-page headings).
- **Pages 12–28** (the newer batch) carry **3–6 rendered `<h2>` sub-sections** in the body
  **plus** a parallel FAQ block — these are richer and more scannable for both readers and
  search engines.

This is the single most consistent quality split in the section: the early pages are
thinner and rely on schema-only Q&A.

### Secondary questions (verbatim), by page

Pages 1–11 — secondary questions come from FAQ schema only:
- **1:** «آیا رعایت قانون ۲-۲-۲ واقعاً از پوسیدگی دندان جلوگیری می‌کند؟» · «اگر مسواک بزنیم، باز هم لازم است سالی دو بار به دندان‌پزشک مراجعه کنیم؟»
- **2:** «بهترین راه‌حل برای لق شدن دنچر پایین چیست؟» · «اوردنچر چیست و چه تفاوتی با دندان مصنوعی معمولی دارد؟» · «آیا یک ایمپلنت برای دنچر پایین کافی است؟»
- **3:** «آیا همیشه جای خالی دندان باعث مشکل می‌شود؟» · «تحلیل استخوان بعد از کشیدن دندان حتمی است؟»
- **4:** «آیا ایمپلنت می‌تواند از تحلیل استخوان فک جلوگیری کند؟» · «آیا همه‌ی افرادی که دست‌دندان کامل دارند، کاندید ایمپلنت هستند؟»
- **5:** «تفاوت اصلی دندان مصنوعی متحرک با ایمپلنت ثابت چیست؟» · «آیا ایمپلنت همیشه بهترین انتخاب برای جایگزینی دندان است؟»
- **6:** «چه زمانی بعد از تبخال مراجعه به دندانپزشکی ایمن است؟» · «اگر با وجود تبخال دچار دندان‌درد شدید شدم چه کار کنم؟»
- **7:** «آیا برای لمینت سرامیکی همیشه دندان تراش داده می‌شود؟»
- **8:** «آیا می‌توان همان روز جراحی روکش موقت دریافت کرد؟» · «بعد از چه مدت می‌توان روکش نهایی ایمپلنت را دریافت کرد؟» · «آیا مدت زمان ایمپلنت برای همه بیماران یکسان است؟»
- **9:** «آیا ایمپلنت دیجیتال با ایمپلنت معمولی فرق دارد؟»
- **10:** «آیا شل شدن روکش ایمپلنت خطرناک است؟» · «آیا می‌توان با روکش ایمپلنت شل غذا خورد؟» · «شل شدن پیچ ایمپلنت یعنی ایمپلنت خراب شده است؟»
- **11:** «آیا نتایج گوگل برای بهترین دندانپزشک قابل اعتماد هستند؟» · «چگونه می‌توان انتخاب آگاهانه‌تری برای دندانپزشک داشت؟» · «سؤال درست هنگام انتخاب دندانپزشک چیست؟»

Pages 12–28 — secondary questions appear as both rendered `<h2>` and FAQ (representative H2s):
- **12:** ایمپلنت از چه جنسی ساخته می‌شود؟ · ایمپلنت چه زمانی استفاده می‌شود؟ · ایمپلنت چه مزیتی دارد؟ · آیا ایمپلنت فقط یک قطعه است؟
- **13:** مرحله اول…پنجم (بررسی اولیه → آماده‌سازی → قرار دادن پایه → دوره ترمیم و جوش خوردن → بارگذاری)
- **14:** ایمپلنت دیجیتال چگونه انجام می‌شود؟ · نقش دیجیتال در جراحی · نقش دیجیتال در ساخت روکش · مزایا برای بیمار · آیا برای همه مناسب است؟
- **15:** ایمپلنت فوری چگونه انجام می‌شود؟ · تفاوت با روش معمول · مزایا برای بیمار · آیا برای همه مناسب است؟
- **16:** روکش ایمپلنت چگونه ساخته و استفاده می‌شود؟ · چه نقشی در درمان دارد؟ · جنس روکش چگونه انتخاب می‌شود؟
- **17:** پیچ ایمپلنت چگونه استفاده می‌شود؟ · چه نقشی دارد؟ · آیا ممکن است شل شود؟
- **18:** اباتمنت چگونه استفاده می‌شود؟ · چه نقشی دارد؟ · آیا همه اباتمنت‌ها یکسان هستند؟
- **19:** در فالوآپ چه چیزهایی بررسی می‌شود؟ · چرا اهمیت دارد؟ · هر چند وقت یک‌بار باید انجام شود؟
- **20:** عکس پانورامیک چه اطلاعاتی می‌دهد؟ · چرا عکس‌های کوچک دقیق‌ترند؟ · نمونه مقایسه در این بیمار
- **21:** چرا دندان نیاز به عصب‌کشی پیدا می‌کند؟ · آیا هنگام درمان دردی احساس می‌شود؟ · بعد از عصب‌کشی چه احساسی طبیعی است؟ · چه زمانی باید مراجعه کرد؟ · اگر عصب‌کشی انجام نشود چه می‌شود؟
- **22:** چه عواملی استحکام دندان را کاهش می‌دهند؟ · آیا همه دندان‌های عصب‌کشی شده در معرض شکستگی‌اند؟ · چگونه از شکستن جلوگیری کنیم؟
- **23:** در چه شرایطی روکش بیشتر توصیه می‌شود؟ · چه زمانی روکش لازم نیست؟ · روکش چه کمکی می‌کند؟ · آیا روش‌های دیگری غیر از روکش وجود دارد؟
- **24:** در صورت محافظت نکردن چه اتفاقی می‌افتد؟ · آیا نوع نیروهای واردشده اهمیت دارد؟ · اگر بعداً تصمیم به محافظت بگیریم چه می‌شود؟
- **25:** چرا ممکن است این دندان‌ها بشکنند؟ · اگر فقط قسمت بالایی بشکند؟ · آیا تکه شکسته‌شده اهمیت دارد؟ · چه زمانی شکستگی جدی‌تر است؟ · آیا می‌توان جلوگیری کرد؟
- **26:** چرا دیابت برای دندان‌ها خطرناک‌تر است؟ · خشکی دهان چه نشانه‌ای است؟ · آیا می‌توان کنترل کرد؟ · چه کارهایی کمک می‌کند؟
- **27:** واترجت چطور کار می‌کند؟ · نخ دندان چطور؟ · پس واترجت چه فایده‌ای دارد؟
- **28:** چرا ترمیم نهایی این‌قدر مهم است؟ · اگر روکش/پرکردگی دائمی نگذاریم چه می‌شود؟ · پرکردگی موقت شکست یا افتاد، چه کنم؟ · آیا باید عصب‌کشی را دوباره تکرار کنم؟

---

## 2. Taxonomy (with counts)

Categories are derived bottom-up from the 28 primary questions plus their secondary/FAQ
questions — not forced onto a fixed list. The section is heavily weighted toward **dental
implants** (14 of 28 pages, 50%) and **endodontics/root-canal restoration** (6 pages, 21%).

| Category (patient intent) | Pages | Count | Density |
|---|---|:---:|---|
| **Implant — fundamentals & components** ("X چیست؟": implant, crown, screw, abutment, digital) | 12, 16, 17, 18, 9, 14 | **6** | Dense |
| **Implant — procedure steps & treatment timing/visits** | 13, 8, 15 | **3** | Moderate |
| **Implant — aftercare, maintenance & mechanical complications** | 19, 10 | **2** | Thin |
| **Tooth-replacement decision / dentures vs implants / consequences of tooth loss** | 2, 3, 4, 5 | **4** | Moderate |
| **Endodontics — pain, durability, restoration & fracture of RCT teeth** | 21, 22, 23, 24, 25, 28 | **6** | Dense |
| **Prevention & oral-hygiene routine/tools** | 1, 27 | **2** | Thin |
| **Diagnosis & radiography** | 20 | **1** | Sparse |
| **Systemic health ↔ oral health** | 26 | **1** | Sparse |
| **Aesthetic dentistry (veneers/composite)** | 7 | **1** | Sparse |
| **Infection / treatment contraindication & timing** | 6 | **1** | Sparse |
| **Choosing a provider / decision-making** | 11 | **1** | Sparse |

### Cross-cut by the standard patient-intent axes (implant-focused)

Because the brief and the section both center on **implants and implant crowns**, here is the
same content re-projected onto the canonical implant decision axes — this is where thin vs.
dense becomes actionable:

| Intent axis | Covered? | Pages |
|---|---|---|
| Procedure steps | ✅ Dense | 13, 8, 15, 14, 9 |
| Materials (implant/crown) | ⚠️ Partial | 12 (جنس ایمپلنت), 16 (جنس روکش) — no dedicated materials page |
| Components | ✅ Dense | 17 (screw), 18 (abutment), 16 (crown) |
| Timing / number of visits | ✅ Moderate | 8, 15, 13 |
| Aftercare / follow-up | ⚠️ Thin | 19 (follow-up only); no eating/cleaning/home-care page |
| Risks & complications | ⚠️ Thin | 10 (loose crown), 3 (bone loss if not replaced) |
| **Cost / price** | ❌ **Absent** | — none |
| **Pain & recovery after implant surgery** | ❌ **Absent** | — (21 is root-canal pain, not implant) |
| **Longevity / lifespan / success rate** | ❌ **Absent** | — (19 implies it but no "عمر ایمپلنت" page) |
| **Candidacy / contraindications** (diabetes, smoking, bone, age) | ❌ Absent as a page | only an FAQ line «آیا برای همه مناسب است؟» in 4, 12, 14, 15 |
| **Bone graft / sinus lift** (پیوند استخوان/سینوس لیفت) | ❌ Absent | — |
| **Implant vs fixed bridge** | ⚠️ Partial | 5 covers removable-vs-fixed, not implant-vs-bridge specifically |

---

## 3. Duplicate & Orphan Notes

### 3a. Duplicates / heavy overlap (same question answered on >1 page)

- **Digital implant — near-duplicate pair (strongest case):**
  **9** «ایمپلنت دیجیتال یعنی چی؟» and **14** «ایمپلنت دیجیتال چیست؟» answer essentially the
  same primary question. 9 is the older thin (FAQ-only, 2 Qs) version; 14 is the newer rich
  (6×H2) version. These two should be **consolidated or explicitly differentiated** (e.g.
  redirect/merge 9 into 14, or recast 9 as a narrower angle).
- **Implant steps vs. implant timeline — overlapping pair:**
  **13** «مراحل ایمپلنت» (the *steps*) and **8** «مراحل ایمپلنت دندان چقدر طول می‌کشد؟» (the
  *duration* of those steps). Substantial conceptual overlap; defensible as a step-list vs.
  a timeline, but they tread the same ground and cross-reference each other.
- **Screw loosening — repeated sub-question:**
  The question «شل شدن پیچ ایمپلنت یعنی ایمپلنت خراب شده است؟» appears as an FAQ on **both 10
  and 17** (and screw-loosening is also a theme in 16/18). Acceptable as a shared sub-topic,
  but the answer is duplicated.
- **"Is it suitable for everyone?" — recurring FAQ across the implant cluster:**
  «آیا … برای همه (افراد) مناسب است؟» recurs in **4, 12, 14, 15** (candidacy). This signals
  unmet demand for a **dedicated candidacy/contraindications page** rather than scattering the
  answer across four FAQs.
- **Endo-restoration trio — complementary but overlapping:**
  **23** (when a crown is needed), **24** (what happens with no crown), **28** (how long you
  have to restore) all orbit "why and when to restore an endodontically treated tooth." They
  are intentionally mirror-angles and cross-link cleanly, but a reader gets near-identical
  fracture-risk explanations on all three.

### 3b. Orphans

Two senses of "orphan" apply here:

1. **Hub linkage — no orphans.** `litecast/index.html` links to **all 28** pages exactly once
   each. Every page is reachable from the LiteCast hub. ✓

2. **Sibling cross-link graph — 5 internal orphans.** Building the inbound graph from each
   page's «کاوش بیشتر» capsules + inline body links, these pages receive **zero inbound links
   from any sibling LiteCast page** (reachable only via the hub):
   - **6** (تبخال / herpes contraindication) — topically isolated; links out to 26 but nothing links back.
   - **7** (لمینت سرامیکی vs کامپوزیت / veneers) — only aesthetic page; links out to 23 & 16, no inbound.
   - **11** (بهترین دکتر/کلینیک / choosing a provider) — links out to 5 & 12, no inbound.
   - **27** (واترجت / water flosser) — newest hygiene page; links out to 1, no inbound.
   - **28** (timing of restoration after RCT) — newest page overall; links out to 22 & 23, no inbound (nothing newer exists to point back).
   Weakly-linked (only 1 inbound): **9, 14, 19, 21**.

3. **Cross-section orphaning is BY DESIGN, not a defect.** Per
   `.dentcast/workflows/README.md` §0.2–0.3, LiteCast is a deliberately **isolated track**:
   the rest of the site (glossary/insight/episodes/brain) must **not** link *to* LiteCast, and
   LiteCast must **not** link *out* to specialist content — the isolation is symmetric. So the
   brief's "orphans = LiteCast pages not linked from glossary/insight/episode" criterion is
   **moot by design**: *every* LiteCast page is an orphan from the specialist ecosystem on
   purpose. The only actionable orphan signal is the **intra-LiteCast** graph in (2) above.

> **Recommendation (linking only — no content change):** add the 5 zero-inbound pages into
> the «کاوش بیشتر» capsules of their nearest topical siblings (e.g. 6→from 26/21; 7→from 16/23;
> 11→from 5/12; 27→from 1/20/26; 28→from 21/22/23/24/25), so they're discoverable without the hub.

---

## 4. Benchmark Gap List — ⏸ DEFERRED

**Status: not run this pass (user-directed "Skip Phase 3 for now").**

Phase 3 requires reading a benchmark question set from a file path that arrived as the literal
unsubstituted placeholder **`[BENCHMARK_FILE_PATH]`**. No benchmark/query file exists anywhere
in the repository (searched: `*benchmark*`, `*queries*`, `*query*`, `*gap*` — no matches). The
benchmark-vs-coverage mapping (covered well / partial / not covered, ranked by query frequency)
is therefore **pending** until a real benchmark file is supplied.

**To complete Phase 3 later:** provide the benchmark file path (or paste the Persian query set),
and this section will be filled with the per-query coverage mapping and a frequency-ranked gap
list. The taxonomy in §2 already pre-stages the likely gaps (cost, post-surgery pain/recovery,
longevity, candidacy, bone graft) so the mapping will be fast once the query set exists.

---

## Prioritized list of missing / underserved topics

> Derived from the **internal taxonomy gaps in §2–§3** (thin/absent axes + duplicate-signal
> demand), **not** from an external benchmark — that ranking is deferred with Phase 3. No
> content drafted; topics only.

**Tier 1 — clear absences with obvious high patient demand (implant focus):**
1. **هزینه / قیمت ایمپلنت** — implant cost & what drives it. **Zero coverage**; consistently a
   top patient query and currently unanswered anywhere in LiteCast.
2. **عمر ایمپلنت چقدر است؟ / موفقیت بلندمدت** — implant lifespan & success rate (longevity axis,
   absent; only implied by 19's follow-up page).
3. **درد و تورم و دوره نقاهت بعد از جراحی ایمپلنت** — pain, swelling & recovery *after implant
   surgery* (the pain/recovery axis exists only for root canal, page 21, not for implants).
4. **آیا من کاندید ایمپلنت هستم؟ (دیابت، سیگار، پوکی استخوان، سن)** — a dedicated candidacy /
   contraindications page; demand is proven by the «آیا برای همه مناسب است؟» FAQ recurring on 4/12/14/15.

**Tier 2 — underserved (thin or partial):**
5. **پیوند استخوان / سینوس لیفت** — bone graft & sinus lift (absent; common pre-implant step).
6. **ایمپلنت یا بریج ثابت؟** — implant vs fixed bridge specifically (5 covers removable-vs-fixed only).
7. **مراقبت و بهداشت روزانهٔ ایمپلنت** — daily home care/cleaning around an implant & what to eat
   (aftercare axis is thin — 19 is clinical follow-up, not home care).
8. **Consolidate the digital-implant duplicate (9 vs 14)** and the steps/timeline overlap
   (13 vs 8) — dedupe rather than add.

**Tier 3 — single-page topics that could anchor small clusters if expanded:**
9. Radiography/diagnosis (only page 20), aesthetics/veneers (only page 7), and provider-choice
   (only page 11) are each a lone page — fine as-is, but candidates if those intents prove popular.

---

*Audit generated 2026-06-09 · read-only pass · LiteCast = `litecast/` (28 pages) · source of
truth `litecast/lite-glossary.json` → `LightGlossary` · isolated `.ir`-only track (no en mirror,
no specialist cross-link, no `dentcast-brain.json` entry).*
