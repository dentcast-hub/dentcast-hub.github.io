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

## 4. Benchmark Gap List

**Benchmark source:** `litecastpatientquerybenchmark.fa.json` (id `litecast-patient-implant-queries`,
lang `fa`, generated 2026-06-09, scope "dental implants and implant crowns, patient-facing") —
supplied by the user. **53 real-world Persian patient queries** across 13 categories, each tagged
with a `commonness` of high / medium / low.

**Coverage verdicts** (judged against the actual rendered body text of the 28 pages, not just titles):
- **Covered** — a page directly and substantially answers the query (H1/body section).
- **Partial** — answered only as a brief FAQ line, indirectly, or via an adjacent-topic page.
- **Uncovered** — nothing in LiteCast addresses it.

### 4a. Coverage summary

| Verdict | Count | Share |
|---|:---:|:---:|
| ✅ Covered | 11 | 21% |
| 🟡 Partial | 13 | 25% |
| ❌ Uncovered | 29 | 55% |
| **Total** | **53** | 100% |

**Coverage by category** (covered / partial / uncovered):

| Category | ✅ | 🟡 | ❌ | Read |
|---|:--:|:--:|:--:|---|
| procedure_steps_timeline | 5 | 0 | 0 | **Fully covered** — strongest area |
| immediate_implant | 2 | 0 | 0 | **Fully covered** |
| crown_prosthetic | 2 | 3 | 1 | Good |
| alternatives | 1 | 1 | 1 | Moderate |
| candidacy_contraindications | 1 | 0 | 6 | **Weak** — one FAQ, six gaps |
| materials_brand | 0 | 1 | 2 | Weak |
| aftercare_maintenance | 0 | 3 | 0 | All thin/partial |
| eating_function | 0 | 1 | 1 | Thin |
| longevity_success | 0 | 2 | 3 | **Weak** |
| pain_recovery | 0 | 1 | 4 | **Weak** |
| risks_complications | 0 | 1 | 3 | **Weak** |
| cost | 0 | 0 | 5 | **Absent — total blank** |
| bone_graft_sinus | 0 | 0 | 3 | **Absent — total blank** |

### 4b. Full per-query mapping

| # | Query (verbatim) | Common. | Verdict | Supporting page(s) / note |
|---|---|:---:|:---:|---|
| | **pain_recovery** | | | |
| 1 | ایمپلنت دندان درد دارد؟ | high | ❌ | page 21 is *root-canal* pain, not implant |
| 2 | بعد از ایمپلنت دندان چقدر درد دارد و چند روز طول می‌کشد؟ | high | ❌ | no post-op implant page |
| 3 | تورم و کبودی بعد از جراحی ایمپلنت طبیعی است؟ | medium | ❌ | — |
| 4 | بعد از ایمپلنت چه چیزهایی نباید بخورم؟ | medium | ❌ | — |
| 5 | ایمپلنت بدون درد امکان دارد؟ | medium | 🟡 | 9/14/15 mention patient comfort, not pain itself |
| | **cost** | | | |
| 6 | قیمت ایمپلنت دندان چقدر است؟ | high | ❌ | — |
| 7 | هزینه ایمپلنت دندان با روکش | high | ❌ | — |
| 8 | چرا ایمپلنت دندان اینقدر گران است؟ | medium | ❌ | — |
| 9 | تفاوت قیمت برندهای ایمپلنت در چیست؟ | medium | ❌ | — |
| 10 | ایمپلنت ارزان خوب است یا خطرناک؟ | low | ❌ | — |
| | **longevity_success** | | | |
| 11 | عمر ایمپلنت دندان چقدر است؟ | high | 🟡 | 12 says only «با مراقبت، عمر طولانی دارد» — no duration |
| 12 | ایمپلنت مادام‌العمر است یا تعویض می‌شود؟ | high | ❌ | — |
| 13 | میزان موفقیت ایمپلنت دندان چند درصد است؟ | medium | ❌ | success mentioned qualitatively, no figure |
| 14 | چه عواملی باعث کم شدن عمر ایمپلنت می‌شود؟ | medium | 🟡 | 19 (follow-up), 10, 12 imply factors |
| 15 | روکش ایمپلنت بعد از چند سال باید عوض شود؟ | medium | ❌ | 16 describes crown but not its lifespan |
| | **candidacy_contraindications** | | | |
| 16 | آیا ایمپلنت برای همه مناسب است؟ | high | ✅ | 12 body «نکته», also 14/15 FAQ — answered (briefly) |
| 17 | سن مناسب برای ایمپلنت دندان چند سال است؟ | high | ❌ | — |
| 18 | بیمار دیابتی می‌تواند ایمپلنت بزند؟ | high | ❌ | 26 is diabetes↔caries, not implant candidacy |
| 19 | سیگار روی ایمپلنت دندان تاثیر دارد؟ | medium | ❌ | — |
| 20 | اگر استخوان فک کم باشد می‌شود ایمپلنت زد؟ | high | ❌ | ties to bone graft (also absent) |
| 21 | آیا با پوکی استخوان می‌توان ایمپلنت کاشت؟ | medium | ❌ | — |
| 22 | بیماری لثه مانع ایمپلنت می‌شود؟ | medium | ❌ | 12 lists gum disease as a cause of loss, not as a contraindication |
| | **bone_graft_sinus** | | | |
| 23 | پیوند استخوان برای ایمپلنت چیست و چرا لازم است؟ | high | ❌ | — |
| 24 | سینوس لیفت برای ایمپلنت یعنی چه؟ | medium | ❌ | — |
| 25 | پیوند استخوان درد دارد و چقدر طول می‌کشد؟ | medium | ❌ | — |
| | **procedure_steps_timeline** | | | |
| 26 | مراحل ایمپلنت دندان به ترتیب چیست؟ | high | ✅ | 13 (5 stages); also 8 |
| 27 | ایمپلنت دندان چند جلسه و چند ماه طول می‌کشد؟ | high | ✅ | 8 (timeline) |
| 28 | بعد از کاشت ایمپلنت چقدر باید صبر کنم تا روکش بگذارند؟ | high | ✅ | 8 («حدود ۳ ماه»); 13 loading stage |
| 29 | جوش خوردن ایمپلنت با استخوان (اسئواینتگریشن) چقدر طول می‌کشد؟ | medium | ✅ | 8 («۳ ماه … اُسئواینتگریشن») |
| 30 | اباتمنت ایمپلنت چیست؟ | medium | ✅ | 18 (دedicated page) |
| | **materials_brand** | | | |
| 31 | ایمپلنت از چه جنسی است؟ تیتانیوم بهتر است یا زیرکونیا؟ | medium | 🟡 | 12 covers titanium; no zirconia comparison |
| 32 | بهترین برند ایمپلنت دندان کدام است؟ | high | ❌ | 11 («بهترین» is contextual) is only adjacent framing |
| 33 | آیا به فلز تیتانیوم ایمپلنت حساسیت پیدا می‌شود؟ | medium | ❌ | — |
| | **crown_prosthetic** | | | |
| 34 | چرا روکش ایمپلنت را اول موقت می‌چسبانند؟ | medium | 🟡 | 8 mentions temp/provisional crown, not the rationale |
| 35 | روکش موقت ایمپلنت تا کی روی دندان می‌ماند؟ | medium | 🟡 | 8 implies ~3 months to final |
| 36 | روکش ایمپلنت لق شده، خطرناک است؟ | high | ✅ | 10 (dedicated) |
| 37 | روکش ایمپلنت افتاد، چه کار کنم؟ | high | ✅ | 10 («سمان رها شده» + مراجعهٔ زود) |
| 38 | تفاوت روکش پیچی و روکش چسبی ایمپلنت چیست؟ | low | 🟡 | 10 explains cement-over-screw & loosening types, not a design comparison |
| 39 | روکش ایمپلنت بو می‌دهد یا غذا زیرش می‌رود، چرا؟ | medium | ❌ | — |
| | **aftercare_maintenance** | | | |
| 40 | بعد از ایمپلنت چطور باید از دندان مراقبت کنم؟ | high | 🟡 | 19 is *clinical* follow-up, not a home-care routine |
| 41 | نخ دندان و مسواک برای ایمپلنت چطور باید استفاده شود؟ | medium | 🟡 | 1/27 are general hygiene, not implant-specific technique |
| 42 | ایمپلنت هم جرم‌گیری لازم دارد؟ | medium | 🟡 | 19 monitors plaque/cleanliness, no scaling answer |
| | **alternatives** | | | |
| 43 | ایمپلنت بهتر است یا بریج؟ | high | 🟡 | 5 = implant-bridge vs removable partial, not implant vs conventional bridge |
| 44 | ایمپلنت بهتر است یا دندان مصنوعی متحرک؟ | medium | ✅ | 5 (direct); reinforced by 2, 4 |
| 45 | آل آن فور (All-on-4) چیست و برای چه کسانی است؟ | medium | ❌ | — |
| | **immediate_implant** | | | |
| 46 | ایمپلنت فوری یعنی چه و آیا قابل اعتماد است؟ | medium | ✅ | 15 (meaning + suitability caveats) |
| 47 | می‌شود همان روز کشیدن دندان ایمپلنت کاشت؟ | medium | ✅ | 15 (immediate after extraction) |
| | **eating_function** | | | |
| 48 | با ایمپلنت می‌توانم مثل دندان طبیعی غذا بخورم؟ | medium | 🟡 | 4 (قدرت جویدن), 16, 5 («مثل دندان طبیعی ثابت») |
| 49 | ایمپلنت روی حرف زدن و تلفظ تاثیر دارد؟ | low | ❌ | 16 mentions «راحتی هنگام صحبت» only in passing |
| | **risks_complications** | | | |
| 50 | عوارض ایمپلنت دندان چیست؟ | high | 🟡 | 10 covers one *mechanical* complication; no overview |
| 51 | علائم رد شدن یا عفونت ایمپلنت چیست؟ | high | ❌ | 19 monitors but never lists rejection/infection signs |
| 52 | پری‌ایمپلنتایتیس چیست و چرا ایمپلنت لق می‌شود؟ | medium | ❌ | 10 is crown looseness, not fixture/peri-implantitis |
| 53 | ایمپلنت ممکن است به عصب آسیب بزند؟ | low | ❌ | — |

### 4c. Gap list (uncovered + partial), ranked by commonness

**HIGH commonness — fix first (15 gaps):**
- ❌ «ایمپلنت دندان درد دارد؟» (pain)
- ❌ «بعد از ایمپلنت دندان چقدر درد دارد و چند روز طول می‌کشد؟» (pain)
- ❌ «قیمت ایمپلنت دندان چقدر است؟» (cost)
- ❌ «هزینه ایمپلنت دندان با روکش» (cost)
- ❌ «ایمپلنت دندان مادام‌العمر است یا تعویض می‌شود؟» (longevity)
- ❌ «سن مناسب برای ایمپلنت دندان چند سال است؟» (candidacy)
- ❌ «بیمار دیابتی می‌تواند ایمپلنت بزند؟» (candidacy)
- ❌ «اگر استخوان فک کم باشد می‌شود ایمپلنت زد؟» (candidacy/bone)
- ❌ «پیوند استخوان برای ایمپلنت چیست و چرا لازم است؟» (bone graft)
- ❌ «بهترین برند ایمپلنت دندان کدام است؟» (materials/brand)
- ❌ «علائم رد شدن یا عفونت ایمپلنت چیست؟» (risks)
- 🟡 «عمر ایمپلنت دندان چقدر است؟» (longevity — only a one-line «عمر طولانی»)
- 🟡 «بعد از ایمپلنت چطور باید از دندان مراقبت کنم؟» (aftercare — clinical only, no home care)
- 🟡 «ایمپلنت بهتر است یا بریج؟» (alternatives — implant-vs-conventional-bridge missing)
- 🟡 «عوارض ایمپلنت دندان چیست؟» (risks — no complications overview)

**MEDIUM commonness (23 gaps):**
- ❌ تورم و کبودی بعد از جراحی · ❌ بعد از ایمپلنت چه نخورم · ❌ چرا ایمپلنت گران است ·
  ❌ تفاوت قیمت برندها · ❌ موفقیت چند درصد است · ❌ روکش بعد از چند سال تعویض ·
  ❌ سیگار روی ایمپلنت · ❌ پوکی استخوان و ایمپلنت · ❌ بیماری لثه مانع ایمپلنت ·
  ❌ سینوس لیفت یعنی چه · ❌ پیوند استخوان درد دارد/چقدر · ❌ حساسیت به تیتانیوم ·
  ❌ روکش بو می‌دهد/غذا زیرش می‌رود · ❌ آل‌آن‌فور (All-on-4) · ❌ پری‌ایمپلنتایتیس چیست
- 🟡 ایمپلنت بدون درد · 🟡 عوامل کم‌شدن عمر · 🟡 تیتانیوم یا زیرکونیا · 🟡 چرا روکش اول موقت ·
  🟡 روکش موقت تا کی می‌ماند · 🟡 نخ/مسواک برای ایمپلنت · 🟡 ایمپلنت جرم‌گیری لازم دارد ·
  🟡 با ایمپلنت مثل دندان طبیعی غذا بخورم

**LOW commonness (4 gaps):**
- ❌ ایمپلنت ارزان خوب/خطرناک · ❌ تاثیر بر حرف زدن/تلفظ · ❌ آسیب به عصب
- 🟡 تفاوت روکش پیچی و چسبی

---

## Prioritized list of missing / underserved topics

> Now **benchmark-confirmed** (Phase 3 complete). Ordering reflects query commonness × coverage
> gap. No content drafted; topics only.

**Tier 1 — high-demand categories that are entirely or near-entirely blank:**
1. **هزینه / قیمت ایمپلنت** (cost) — **0/5 covered**, two of them high-commonness. The single
   biggest blind spot: a top patient query with zero coverage anywhere in LiteCast.
2. **درد و نقاهت بعد از جراحی ایمپلنت** (pain_recovery) — **0/5 covered**; the two highest-frequency
   pain queries are both uncovered (page 21 answers root-canal pain, not implant).
3. **کاندیداتوری و موارد منع ایمپلنت** (candidacy) — **1/7 covered**; high-commonness gaps include
   age, diabetes, and insufficient bone. Demand is double-proven by the recurring «آیا برای همه
   مناسب است؟» FAQ across 4/12/14/15.
4. **عمر و موفقیت بلندمدت ایمپلنت** (longevity_success) — **0/5 fully covered**; "is it lifelong?"
   and "how many years?" are high/medium and unanswered.

**Tier 2 — high-value secondary gaps:**
5. **پیوند استخوان / سینوس لیفت** (bone_graft_sinus) — **0/3 covered**; directly blocks the common
   "اگر استخوان کم باشد" candidacy query.
6. **عوارض و عفونت ایمپلنت / پری‌ایمپلنتایتیس** (risks) — **0/4 covered well**; "rejection/infection
   signs" is high-commonness and only indirectly touched by the follow-up page.
7. **مراقبت و بهداشت روزانهٔ ایمپلنت** (aftercare) — all 3 queries only partial; page 19 is clinical
   follow-up, with no home-care / flossing / scaling guidance.
8. **بهترین برند ایمپلنت / تیتانیوم vs زیرکونیا** (materials_brand) — brand question is high-commonness
   and uncovered.
9. **ایمپلنت در برابر بریج ثابت** (alternatives) — high-commonness, only partial (page 5 compares
   against removable partials, not conventional bridges); also add **All-on-4**.

**Tier 3 — cleanup (no new content; fixes existing):**
10. **Consolidate duplicates** flagged in §3a — the digital-implant pair (9 vs 14) and the
    steps/timeline overlap (13 vs 8) — and **wire in the 5 zero-inbound orphans** (6, 7, 11, 27,
    28) via sibling «کاوش بیشتر» capsules.

**Coverage headline:** of 53 benchmark queries, **55% are uncovered and 25% only partial** — i.e.
**80% of common patient implant questions are not yet well answered** by LiteCast. The covered
fifth is concentrated almost entirely in **procedure/steps/timeline, immediate implant, and crown
mechanics** — LiteCast today explains *how an implant is done* far better than *what it costs, how
much it hurts, how long it lasts, and whether the patient qualifies*.

---

*Audit generated 2026-06-09 · read-only pass · LiteCast = `litecast/` (28 pages) · source of
truth `litecast/lite-glossary.json` → `LightGlossary` · isolated `.ir`-only track (no en mirror,
no specialist cross-link, no `dentcast-brain.json` entry).*
