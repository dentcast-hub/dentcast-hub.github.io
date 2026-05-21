# Internal-link opportunities — dentcast.org (v2, filtered)
*Generated 2026-05-21. Read-only analysis. No files modified. No links applied.*

This is **v2** of the report at `/reports/internal-link-opportunities-2026-05-21.md`. Same underlying crawl data, five filters applied to cut noise:

- **Filter 1** — drop glossary anchors that landed in keyword blocks, hashtag lists, pipe-separated lists, or short meta-description openers (`بررسی…`, `مرور…`, `جمع‌بندی…`, etc.).
- **Filter 2** — semantic suggestions must share ≥2 *non-stoplist* keywords, OR ≥1 non-stop keyword + ≥1 non-stop hashtag. 37-term Persian stoplist (generic filler: `قسمت`, `بخش`, `اول`, `بررسی`, `دندان`, `درمان`, `ایمپلنت`…).
- **Filter 3** — per source page: max **3 glossary + 3 (normal) semantic** suggestions, sorted high → medium then by non-stop overlap count.
- **Filter 4** — structural pairs (episode ↔ notecast, same episode number) bypass everything; all 32 retained in full.
- **Filter 5** — `missing reciprocal` suggestions bypass the per-page cap; kept in full.

---

## Summary — before vs after

| Bucket | Before (v1) | After (v2) | Δ |
|---|---:|---:|---:|
| Pass A glossary suggestions (total) | 292 | **193** | -33.9% |
|  · high | 194 | 139 | -28.4% |
|  · medium | 98 | 54 | -44.9% |
| Pass B semantic suggestions (total) | 1390 | **739** | -46.8% |
|  · high | 164 | 144 | -12.2% |
|  · medium | 1226 | 595 | -51.5% |
| Structural pairs (episode ↔ notecast) | 32 | **32** | unchanged |
| Missing-reciprocal flags | 12 | **9** | -25.0% |
| Pages with at least one opportunity | 412 | **377** | -8.5% |

> **Note on reciprocals (12 → 9):** Filter 5 exempts missing reciprocals from the per-page cap (Filter 3) but *not* from the stoplist test (Filter 2). 3 reciprocal suggestions were dropped because the source and target only shared keywords from the stoplist — meaning the underlying topical overlap was too generic to call this a real reciprocal-link opportunity. If you'd rather preserve all 12 unconditionally, say the word and I'll regenerate.

---

## Structural pairs (32) — exempt from all filters

These are the highest-value output. Each `/notecast/episode-N.html` is the written summary of `/episodes/episode-N.html` — they should always cross-link.

| Source | → Target |
|---|---|
| `/notecast/episode-10.html` | [نقش سایلان در آماده‌سازی سرامیک‌ها](/episodes/episode-10.html) |
| `/notecast/episode-11.html` | [آماده‌سازی سطح زیرکونیا](/episodes/episode-11.html) |
| `/notecast/episode-12.html` | [تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی](/episodes/episode-12.html) |
| `/notecast/episode-13.html` | [Esthetic Width و Umbrella Effect](/episodes/episode-13.html) |
| `/notecast/episode-14.html` | [افزایش Vertical Dimension](/episodes/episode-14.html) |
| `/notecast/episode-15.html` | [طول عمر آنله‌های سرامیکی](/episodes/episode-15.html) |
| `/notecast/episode-16.html` | [لزوم استفاده از باندینگ روی پرسلن اچ‌شده](/episodes/episode-16.html) |
| `/notecast/episode-17.html` | [زیرکونیاهای شفاف – بخش اول](/episodes/episode-17.html) |
| `/notecast/episode-18.html` | [زیرکونیاهای شفاف – بخش دوم](/episodes/episode-18.html) |
| `/notecast/episode-19.html` | [ثبات رنگ لمینیت‌های سرامیکی](/episodes/episode-19.html) |
| `/notecast/episode-2.html` | [انواع سمان و اصول سمان‌کردن](/episodes/episode-2.html) |
| `/notecast/episode-20.html` | [قالب‌گیری دو مرحله‌ای](/episodes/episode-20.html) |
| `/notecast/episode-21.html` | [ادامهٔ قالب‌گیری دو مرحله‌ای](/episodes/episode-21.html) |
| `/notecast/episode-22.html` | [سه تداخل دارویی مهم در دندان‌پزشکی](/episodes/episode-22.html) |
| `/notecast/episode-23.html` | [اثر اورلود اکلوزالی بر تحلیل استخوان ایمپلنت](/episodes/episode-23.html) |
| `/notecast/episode-24.html` | [تأثیر نسبت تاج به ایمپلنت](/episodes/episode-24.html) |
| `/notecast/episode-25.html` | [ایمپلنت کوتاه یا سینوس‌لیفت؟](/episodes/episode-25.html) |
| `/notecast/episode-26.html` | [زمان بارگذاری و تحلیل استخوان ایمپلنت](/episodes/episode-26.html) |
| `/notecast/episode-27.html` | [مقایسهٔ اتچمنت‌ها در اوردنچر](/episodes/episode-27.html) |
| `/notecast/episode-28.html` | [طراحی لبخند و قوانین مک‌لارن](/episodes/episode-28.html) |
| `/notecast/episode-29.html` | [طبقه‌بندی جدید سرامیک‌ها](/episodes/episode-29.html) |
| `/notecast/episode-3.html` | [ادامهٔ مباحث سمان‌ها](/episodes/episode-3.html) |
| `/notecast/episode-30.html` | [سرامیک‌های پلی‌کریستالین و ماتریکس رزینی](/episodes/episode-30.html) |
| `/notecast/episode-31.html` | [رستوریشن‌های ایمپلنتی اسکرو–سمنتد](/episodes/episode-31.html) |
| `/notecast/episode-32.html` | [اپلاینس‌های اسنپ‌آن اسمایل](/episodes/episode-32.html) |
| `/notecast/episode-33.html` | [ادامهٔ بحث اسنپ‌آن اسمایل](/episodes/episode-33.html) |
| `/notecast/episode-4.html` | [نسل‌های مختلف باندینگ](/episodes/episode-4.html) |
| `/notecast/episode-5.html` | [باندینگ‌های یونیورسال](/episodes/episode-5.html) |
| `/notecast/episode-6.html` | [Immediate Dentin Sealing (IDS)](/episodes/episode-6.html) |
| `/notecast/episode-7.html` | [Deep Margin Elevation (DME)](/episodes/episode-7.html) |
| `/notecast/episode-8.html` | [طبقه‌بندی سرامیک‌های دندانی](/episodes/episode-8.html) |
| `/notecast/episode-9.html` | [آماده‌سازی سطح سرامیک‌ها – بخش اول](/episodes/episode-9.html) |

---

## Missing reciprocal links (9) — exempt from per-page cap

Target page already links here, but this page doesn't link back where the semantics call for it.

| Source | → Target | Shared signal |
|---|---|---|
| `/episodes/episode-109.html` | [دنتوپدیا — مصاحبه: مسیر یادگیری هوش مصنوعی](/episodes/episode-109-2.html) | shared keywords: مصنوعی; shared hashtags: #هوش_مصنوعی; ⇆ target already links here — missing reciprocal |
| `/episodes/episode-131.html` | [اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی ](/chairside/chairside-15.html) | shared keywords: اکلوژن, رایز, کانین, گروپ; shared hashtags: #اکلوژن; ⇆ target already links here — missing reciprocal |
| `/episodes/episode-132.html` | [اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی ](/chairside/chairside-15.html) | shared keywords: اکلوژن, رایز, کانین, گروپ; shared hashtags: #اکلوژن, #کانین_رایز, #گروپ_فانکشن; ⇆ target already links here — missing reciprocal |
| `/episodes/episode-47.html` | [بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو](/insight/insight-4.html) | shared keywords: ferrule effect; shared hashtags: #فرول; ⇆ target already links here — missing reciprocal |
| `/glossary/crown-to-implant-ratio.html` | [نسبت تاج به ایمپلنت (Crown-to-Implant Ratio) و تحلیل استخوان](/notecast/episode-24.html) | shared keywords: crown, implant, ratio; ⇆ target already links here — missing reciprocal |
| `/glossary/emergence-profile.html` | [Zero Bone Loss — پروفایل ظهور (Emergence Profile)](/episodes/episode-130.html) | shared keywords: emergence, profile; ⇆ target already links here — missing reciprocal |
| `/glossary/vertical-dimension-of-occlusion.html` | [Vertical Dimension of Occlusion – Myth 1](/episodes/episode-154.html) | shared keywords: dimension, occlusion, vertical; ⇆ target already links here — missing reciprocal |
| `/glossary/vertical-dimension-of-occlusion.html` | [Vertical Dimension of Occlusion – Myths & Evidence (Part 2)](/episodes/episode-155.html) | shared keywords: dimension, occlusion, vertical; ⇆ target already links here — missing reciprocal |
| `/glossary/vertical-dimension-of-occlusion.html` | [افزایش بعد عمودی (Vertical Dimension): دیدگاه‌های داوسون، شو](/notecast/episode-14.html) | shared keywords: dimension, occlusion, vertical; ⇆ target already links here — missing reciprocal |

---

## Top 10 highest-value opportunities (new scoring)

Scoring: **structural=12, missing_reciprocal=10, glossary_high=8, semantic_high=6, glossary_medium=4, semantic_medium=2**. Same source/target counted once. Diversity cap of 4 per kind.

| # | Score | Kind | Source | → Target | Why |
|---|---:|---|---|---|---|
| 1 | 12 | structural | `/notecast/episode-10.html` _(notecast)_ | [نقش سایلان در آماده‌سازی سرامیک‌ها](/episodes/episode-10.html) | structural pair: episode ↔ notecast (same episode number) · high · Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. |
| 2 | 12 | structural | `/notecast/episode-11.html` _(notecast)_ | [آماده‌سازی سطح زیرکونیا](/episodes/episode-11.html) | structural pair: episode ↔ notecast (same episode number) · high · Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. |
| 3 | 12 | structural | `/notecast/episode-12.html` _(notecast)_ | [تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی](/episodes/episode-12.html) | structural pair: episode ↔ notecast (same episode number) · high · Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. |
| 4 | 12 | structural | `/notecast/episode-13.html` _(notecast)_ | [Esthetic Width و Umbrella Effect](/episodes/episode-13.html) | structural pair: episode ↔ notecast (same episode number) · high · Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. |
| 5 | 10 | reciprocal | `/episodes/episode-109.html` _(episode)_ | [دنتوپدیا — مصاحبه: مسیر یادگیری هوش مصنوعی](/episodes/episode-109-2.html) | episode → episode · medium · shared keywords: مصنوعی; shared hashtags: #هوش_مصنوعی; ⇆ target already links here — missing reciprocal |
| 6 | 10 | reciprocal | `/episodes/episode-131.html` _(episode)_ | [اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی ](/chairside/chairside-15.html) | episode → chairside · high · shared keywords: اکلوژن, رایز, کانین, گروپ; shared hashtags: #اکلوژن; ⇆ target already links here — missing reciprocal |
| 7 | 10 | reciprocal | `/episodes/episode-132.html` _(episode)_ | [اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی ](/chairside/chairside-15.html) | episode → chairside · high · shared keywords: اکلوژن, رایز, کانین, گروپ; shared hashtags: #اکلوژن, #کانین_رایز, #گروپ_فانکشن; ⇆ target already links  |
| 8 | 10 | reciprocal | `/episodes/episode-47.html` _(episode)_ | [بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو](/insight/insight-4.html) | episode → insight · medium · shared keywords: ferrule effect; shared hashtags: #فرول; ⇆ target already links here — missing reciprocal |
| 9 | 8 | glossary | `/chairside/chairside-16.html` _(chairside)_ | [Crown Lengthening](/glossary/crown-lengthening.html) | anchor **`جراحی افزایش طول تاج`** · high · _ctx:_ … کردن روکش‌ها، به علت باقی ماندن التهاب، برای حفظ دندان‌ها جراحی افزایش طول تاج انجام شده |
| 10 | 8 | glossary | `/dentai/dentai-13.html` _(dentai)_ | [Resistance](/glossary/resistance.html) | anchor **`مقاومت`** · high · _ctx:_ … نشان داده‌اند که عرض ایستموس در حد ۲ میلی‌متر می‌تواند مقاومت دندان در برابر شکستگی را ت |

---

## Per-page opportunities (filtered)

Sorted by page type then URL. Max **3 glossary + 3 semantic** per page (structural pairs and missing reciprocals exempt). **High-confidence** items are bolded.

### `/glossary/activator.html`

- **Page type:** `glossary`
- **Title:** Activator چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام اتصال` | [Bond Strength](/glossary/bond-strength.html) | … یا سمان نیست و استفاده از آن به‌تنهایی باعث افزایش استحکام اتصال نمی‌شود. این تصور که اکتیویتور همیشه و در همهٔ شرایط … | medium |
| `سیستم‌های باندینگ` | [pH of Adhesive Systems](/glossary/ph-of-adhesive-systems.html) | … شرایط لازم است، یک سوءبرداشت رایج است؛ زیرا برخی سیستم‌های باندینگ به‌طور ذاتی با مواد دوال‌کیور یا سلف‌کیور سازگارند. از سوی دیگر، … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Dual-Cure Resin Cement | [/glossary/dual-cure-resin-cement.html](/glossary/dual-cure-resin-cement.html) | glossary → glossary | shared keywords: cure, dual | medium |
| Self-Cure Resin Cement (Chemical-Cure Resin Cement) | [/glossary/self-cure-resin-cement.html](/glossary/self-cure-resin-cement.html) | glossary → glossary | shared keywords: cure, self | medium |


### `/glossary/adhesive-resin-cements.html`

- **Page type:** `glossary`
- **Title:** Adhesive Resin Cement چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | … این سمان‌ها متکی به پروتکل‌های باندینگ و استفاده از سایلان هستند و اساس کاربرد آن‌ها در رستوریشن‌هایی است که گیر و ریتنشن … | **high** |
| `پروتکل باندینگ` | [Bonding / Bonding Protocol](/glossary/bonding-protocol.html) | سمان‌های ادهزیو رزین زمانی انتخاب می‌شوند که ماهیت رستوریشن فاقد گیر ذاتی … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Self-Adhesive Resin Cements | [/glossary/self-adhesive-cements.html](/glossary/self-adhesive-cements.html) | glossary → glossary | shared keywords: adhesive, cements, resin | **high** |
| Resin Cements | [/glossary/resin-cements.html](/glossary/resin-cements.html) | glossary → glossary | shared keywords: cements, resin | **high** |
| Esthetic Resin Cements | [/glossary/esthetic-resin-cements.html](/glossary/esthetic-resin-cements.html) | glossary → glossary | shared keywords: cements, resin | medium |


### `/glossary/biological-width.html`

- **Page type:** `glossary`
- **Title:** Biological Width چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `Crown lengthening` | [Crown Lengthening](/glossary/crown-lengthening.html) | … تعیین‌کننده در تصمیم‌گیری درباره موقعیت مارژین رستوریشن، نیاز به Crown lengthening و امکان استفاده از تکنیک دیپ مارژین الوِیشن است. قرار دادن … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Biological Width – مقایسه DME و CL – بخش دوم | [/episodes/episode-76.html](/episodes/episode-76.html) | glossary → episode | shared keywords: biological, width | **high** |


### `/glossary/bond-strength.html`

- **Page type:** `glossary`
- **Title:** Bond Strength چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `گیر مکانیکی` | [Retention](/glossary/retention.html) | استحکام باند زمانی اهمیت بالینی پیدا می‌کند که اتصال، نقش فعال و … | medium |


### `/glossary/bonding-generations.html`

- **Page type:** `glossary`
- **Title:** Bonding Generations چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `روش باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … کیفیت یا برتری بالینی یک روش باندینگ نیست. نسل‌های باندینگ خودِ استراتژی درمانی محسوب نمی‌شوند، بلکه توصیفی از ساختار اجرایی سیستم‌های باندینگ … | medium |
| `سیستم‌های باندینگ` | [pH of Adhesive Systems](/glossary/ph-of-adhesive-systems.html) | … راهنمای مستقیم ندارند، اما به درک تفاوت‌های ساختاری میان سیستم‌های باندینگ کمک می‌کنند. انتخاب رویکرد باندینگ باید ابتدا بر اساس شرایط بافتی، … | medium |


### `/glossary/bonding-protocol.html`

- **Page type:** `glossary`
- **Title:** Bonding Protocol چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | … اتصال پایدار در همهٔ شرایط بالینی نیست و بدون ایزولاسیون مناسب، آماده‌سازی صحیح سطح و هماهنگی با نوع رستوریشن، نتیجهٔ قابل پیش‌بینی … | **high** |
| `گیر مکانیکی` | [Retention](/glossary/retention.html) | پروتکل باندینگ زمانی در تصمیم‌گیری درمانی اهمیت پیدا می‌کند که اتصال، نقش … | medium |


### `/glossary/collagen-collapse.html`

- **Page type:** `glossary`
- **Title:** Collagen Collapse چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … درمانی، ریسک کلاپس کلاژن یکی از عوامل کلیدی در انتخاب استراتژی باندینگ محسوب می‌شود. در شرایطی که باندینگ عمدتاً روی عاج انجام … | **high** |
| `کنترل رطوبت` | [Isolation](/glossary/isolation.html) | … که باندینگ عمدتاً روی عاج انجام می‌شود یا کنترل رطوبت دشوار است، انتخاب رویکردهایی که احتمال کلاپس کلاژن را کاهش می‌دهند اهمیت … | medium |


### `/glossary/collagen-fibers.html`

- **Page type:** `glossary`
- **Title:** Collagen Fibers چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … درمانی، وضعیت فیبرهای کلاژن یکی از عوامل کلیدی در انتخاب استراتژی باندینگ محسوب می‌شود. حفظ ساختار فضایی این فیبرها و پیشگیری از … | **high** |


### `/glossary/crown-lengthening.html`

- **Page type:** `glossary`
- **Title:** Crown Lengthening چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | … ترمیمی در تعارض با بافت بیولوژیک باشد یا امکان ایزولاسیون و اجرای دقیق ترمیم به‌صورت محافظه‌کارانه وجود نداشته باشد. تصمیم به انجام … | **high** |
| `عرض بیولوژیک` | [Biological Width](/glossary/biological-width.html) | … مرحله طراحی درمان و پس از ارزیابی وضعیت پریودنتال، عرض بیولوژیک و نسبت تاج به ریشه مطرح می‌شود. این مداخله زمانی انتخاب … | **high** |


### `/glossary/crown-to-implant-ratio.html`

- **Page type:** `glossary`
- **Title:** Crown-to-Implant Ratio چیست؟ | دانشنامه دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نسبت تاج به ایمپلنت (Crown-to-Implant Ratio) و تحلیل استخوان ⇆reciprocal | [/notecast/episode-24.html](/notecast/episode-24.html) | glossary → notecast | shared keywords: crown, implant, ratio; ⇆ target already links here — missing reciprocal | **high** |


### `/glossary/crystalline-phase.html`

- **Page type:** `glossary`
- **Title:** Crystalline Phase چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … سرامیک‌های دندانی گفته می‌شود که مسئول اصلی استحکام مکانیکی، مقاومت خمشی و چقرمگی شکست ماده است. میزان، نوع و آرایش فاز کریستالی … | **high** |
| `فاز گلاس` | [Glass Phase](/glossary/glass-phase.html) | … کریستالی معمولاً با کاهش فاز گلاس و تغییر رفتار نوری ماده همراه است. | **high** |
| `گلس‌سرامیک‌ها` | [Glass Ceramics](/glossary/glass-ceramics.html) | … است، در حالی‌که در گلس‌سرامیک‌ها تعادلی میان فاز شیشه‌ای و کریستالی برقرار است. تصور اینکه هرچه کریستالی‌تر، همیشه بهتر، یک ساده‌سازی نادرست … | **high** |


### `/glossary/deep-margin-elevation.html`

- **Page type:** `glossary`
- **Title:** Deep Margin Elevation (DME) چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مارژین ساب‌جینجیوال` | [Subgingival Margin](/glossary/subgingival-margin.html) | … و موقعیت بیولوژیک مارژین است. این تصور که هر مارژین ساب‌جینجیوال را می‌توان صرفاً با افزودن یک لایه کامپوزیت اصلاح کرد، ساده‌سازی … | **high** |
| `افزایش طول تاج` | [Crown Lengthening](/glossary/crown-lengthening.html) | … بدون آن‌که نیاز به مداخلهٔ جراحی مانند افزایش طول تاج باشد. در DME، کامپوزیت نقش یک بستر ترمیمی واسط را ایفا می‌کند … | medium |
| `کنترل رطوبت` | [Isolation](/glossary/isolation.html) | … انتخاب میان این دو وابسته به ارزیابی وضعیت پریودنتال، امکان کنترل رطوبت و موقعیت بیولوژیک مارژین است. این تصور که هر مارژین … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Deep Margin Elevation (DME) | [/episodes/episode-7.html](/episodes/episode-7.html) | glossary → episode | shared keywords: deep, elevation, margin | **high** |


### `/glossary/dental-ceramics.html`

- **Page type:** `glossary`
- **Title:** Dental Ceramics چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … فلدسپاتیک و گلس‌سرامیک‌ها)، سرامیک‌های پلی‌کریستالین (مانند زیرکونیا) و سرامیک‌های هیبرید یا رزین-ماتریکس (Resin-Matrix Ceramics) که ترکیبی از فاز سرامیکی و شبکه پلیمری … | **high** |
| `فلدسپاتیک` | [Feldspathic Porcelain](/glossary/feldspathic-porcelain.html) | … چند دسته اصلی تقسیم می‌شوند: سرامیک‌های سیلیکایی (مانند فلدسپاتیک و گلس‌سرامیک‌ها)، سرامیک‌های پلی‌کریستالین (مانند زیرکونیا) و سرامیک‌های هیبرید یا رزین-ماتریکس (Resin-Matrix Ceramics) … | **high** |
| `گلس‌سرامیک‌ها` | [Glass Ceramics](/glossary/glass-ceramics.html) | … دسته اصلی تقسیم می‌شوند: سرامیک‌های سیلیکایی (مانند فلدسپاتیک و گلس‌سرامیک‌ها)، سرامیک‌های پلی‌کریستالین (مانند زیرکونیا) و سرامیک‌های هیبرید یا رزین-ماتریکس (Resin-Matrix Ceramics) که … | **high** |


### `/glossary/dentin-sealing.html`

- **Page type:** `glossary`
- **Title:** Dentin Sealing چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `کنترل رطوبت` | [Isolation](/glossary/isolation.html) | … سیل به عواملی مانند وضعیت دنتین، نوع سیستم ادهزیو، کنترل رطوبت و زمان انجام آن وابسته است. همچنین نباید Dentin Sealing را … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Immediate Dentin Sealing (IDS) | [/episodes/episode-6.html](/episodes/episode-6.html) | glossary → episode | shared keywords: dentin, sealing | **high** |
| Immediate Dentin Sealing | [/glossary/immediate-dentin-sealing.html](/glossary/immediate-dentin-sealing.html) | glossary → glossary | shared keywords: dentin, sealing | **high** |


### `/glossary/dentinal-tubules.html`

- **Page type:** `glossary`
- **Title:** Dentinal Tubules چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … درمانی، وضعیت توبول‌های عاجی یکی از عوامل مؤثر در انتخاب استراتژی باندینگ و مدیریت حساسیت است. میزان بازبودن توبول‌ها بر نفوذ رزین، … | **high** |


### `/glossary/dual-cure-resin-cement.html`

- **Page type:** `glossary`
- **Title:** Dual-Cure Resin Cement چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `tertiary amines` | [Tertiary Amines](/glossary/tertiary-amines.html) | … در مسیر Chemical-cure از tertiary amines استفاده می‌شود، oxidation این amines می‌تواند در بلندمدت باعث زردشدگی یا تیرگی سمان شود. به همین … | **high** |
| `سمان‌های رزینی` | [Resin Cements](/glossary/resin-cements.html) | سمان‌های رزینی دوال‌کیور زمانی انتخاب منطقی محسوب می‌شوند که دسترسی نوری به … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Light-Cure Resin Cement | [/glossary/light-cure-resin-cement.html](/glossary/light-cure-resin-cement.html) | glossary → glossary | shared keywords: cement, cure, resin | **high** |
| Self-Cure Resin Cement (Chemical-Cure Resin Cement) | [/glossary/self-cure-resin-cement.html](/glossary/self-cure-resin-cement.html) | glossary → glossary | shared keywords: cement, cure, resin | medium |
| Activator (Dual- / Self-Cure Activator) | [/glossary/activator.html](/glossary/activator.html) | glossary → glossary | shared keywords: cure, dual | medium |


### `/glossary/emergence-profile.html`

- **Page type:** `glossary`
- **Title:** Emergence Profile چیست؟ | دانشنامه دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss — پروفایل ظهور (Emergence Profile) ⇆reciprocal | [/episodes/episode-130.html](/episodes/episode-130.html) | glossary → episode | shared keywords: emergence, profile; ⇆ target already links here — missing reciprocal | **high** |


### `/glossary/esthetic-resin-cements.html`

- **Page type:** `glossary`
- **Title:** Esthetic Resin Cement چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `شفافیت` | [Translucency](/glossary/translucency.html) | … بر ایجاد اتصال ادهزیو، با هدف کنترل رنگ، شفافیت و نتیجهٔ اپتیکی نهایی رستوریشن طراحی شده‌اند. این سمان‌ها معمولاً در رستوریشن‌های نازک … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Resin Cements | [/glossary/resin-cements.html](/glossary/resin-cements.html) | glossary → glossary | shared keywords: cements, resin | **high** |
| Adhesive Resin Cements | [/glossary/adhesive-resin-cements.html](/glossary/adhesive-resin-cements.html) | glossary → glossary | shared keywords: cements, resin | medium |
| Self-Adhesive Resin Cements | [/glossary/self-adhesive-cements.html](/glossary/self-adhesive-cements.html) | glossary → glossary | shared keywords: cements, resin | medium |


### `/glossary/etch-and-rinse.html`

- **Page type:** `glossary`
- **Title:** Etch and Rinse چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … محسوب نمی‌شود، بلکه یکی از روش‌های اجرای استراتژی باندینگ در شرایط مشخص بالینی است. | **high** |


### `/glossary/feldspathic-porcelain.html`

- **Page type:** `glossary`
- **Title:** Feldspathic Porcelain چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `فاز گلاس` | [Glass Phase](/glossary/glass-phase.html) | … سیلیکایی است که بخش عمده‌ای از ساختار آن را فاز گلاس تشکیل می‌دهد. این ترکیب باعث ایجاد رفتار نوری طبیعی، ترنسلوسنسی بالا … | **high** |
| `استحکام خمشی` | [Flexural Strength](/glossary/flexural-strength.html) | … مناسب می‌شود. با وجود زیبایی ممتاز، استحکام خمشی این ماده نسبت به سایر سرامیک‌های تقویت‌شده کمتر است و بیشتر در کاربردهای لایه‌گذاری … | **high** |
| `لیتیوم دی‌سیلیکات` | [Lithium Disilicate](/glossary/lithium-disilicate.html) | … شفاف را فلدسپاتیک بدانیم، در حالی‌که گلس‌سرامیک‌های تقویت‌شده مانند لیتیوم دی‌سیلیکات ساختار کریستالی بیشتری دارند و رفتار مکانیکی متفاوتی نشان می‌دهند. . | **high** |


### `/glossary/ferrule-effect.html`

- **Page type:** `glossary`
- **Title:** Ferrule Effect چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام باند` | [Bond Strength](/glossary/bond-strength.html) | اثر فرول با طول پست یا استحکام باند سمان یکی نیست. وجود پست بلند یا سمان قوی نمی‌تواند … | **high** |
| `crown lengthening` | [Crown Lengthening](/glossary/crown-lengthening.html) | درک این مفهوم به دندان‌پزشک کمک می‌کند تصمیم‌هایی مثل crown lengthening، orthodontic extrusion یا حتی کشیدن دندان را نه بر اساس … | **high** |


### `/glossary/flexural-strength.html`

- **Page type:** `glossary`
- **Title:** Flexural Strength چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | Flexural Strength با استحکام کششی یا استحکام فشاری یکی نیست، چون در … | **high** |


### `/glossary/flowable-resin.html`

- **Page type:** `glossary`
- **Title:** Flowable Resin چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `Unfilled Resin` | [Unfilled Resin](/glossary/unfilled-resin.html) | Flowable Resin با Unfilled Resin یکسان نیست. یکی از سوءبرداشت‌های رایج این است که به … | **high** |
| `Dentin Sealing` | [Dentin Sealing](/glossary/dentin-sealing.html) | … ترمیم باشد. در تکنیک‌هایی مانند Immediate Dentin Sealing (IDS)، رزین فلو ممکن است پس از اجرای ادهزیو و به‌صورت یک لایهٔ نازک … | **high** |
| `Immediate Dentin Sealing` | [Immediate Dentin Sealing (IDS)](/glossary/immediate-dentin-sealing.html) | … یکنواخت‌سازی بستر ترمیم باشد. در تکنیک‌هایی مانند Immediate Dentin Sealing (IDS)، رزین فلو ممکن است پس از اجرای ادهزیو و به‌صورت یک … | **high** |


### `/glossary/freshly-cut-dentin.html`

- **Page type:** `glossary`
- **Title:** Freshly Cut Dentin چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `لایه هیبرید` | [Hybrid Layer](/glossary/hybrid-layer.html) | … اما ساختار کلاژنی سالم است و امکان تشکیل لایه هیبرید پایدارتر را فراهم می‌کند. Freshly Cut Dentin یک وضعیت زمانی است، نه … | **high** |
| `سیل دنتین` | [Dentin Sealing](/glossary/dentin-sealing.html) | … چندمرحله‌ای مطرح باشد. در درمان‌هایی که باندینگ یا سیل دنتین بلافاصله پس از تراش انجام می‌شود، استفاده از این بستر می‌تواند به … | **high** |


### `/glossary/glass-ceramics.html`

- **Page type:** `glossary`
- **Title:** Glass Ceramics چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … مواد نسبت به پرسلن‌های فلدسپاتیک استحکام و مقاومت شکست بالاتری داشته باشند، در حالی‌که همچنان شفافیت قابل‌قبول و قابلیت اچ اسیدی و … | **high** |
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | Glass Ceramics گروهی از سرامیک‌های سیلیکایی هستند که از ترکیب یک ماتریس … | **high** |
| `فلدسپاتیک` | [Feldspathic Porcelain](/glossary/feldspathic-porcelain.html) | … دو فاز باعث می‌شود این مواد نسبت به پرسلن‌های فلدسپاتیک استحکام و مقاومت شکست بالاتری داشته باشند، در حالی‌که همچنان شفافیت قابل‌قبول … | **high** |


### `/glossary/glass-phase.html`

- **Page type:** `glossary`
- **Title:** Glass Phase چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | … اسید هیدروفلوئوریک و اتصال شیمیایی با سایلان را فراهم می‌کند. میزان و ترکیب فاز گلاس مستقیماً بر تعادل میان زیبایی، استحکام و … | **high** |
| `شفافیت` | [Translucency](/glossary/translucency.html) | … برخی سرامیک‌های دندانی گفته می‌شود که مسئول رفتار نوری، شفافیت و قابلیت اچ اسیدی آن‌هاست. وجود این فاز امکان ایجاد میکروریتنشن از … | **high** |
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … را کاهش می‌دهد. سرامیک‌های پلی‌کریستالین مانند زیرکونیا فاقد فاز گلاس هستند و به همین دلیل با پروتکل‌های اچ و سایلان قابل باند … | **high** |


### `/glossary/hybrid-ceramics.html`

- **Page type:** `glossary`
- **Title:** Hybrid Ceramics چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … آن‌ها را از نظر استحکام یا مقاومت سایش دقیقاً معادل سرامیک‌های خالص دانست، یک ساده‌سازی نادرست است. | **high** |


### `/glossary/hybrid-layer.html`

- **Page type:** `glossary`
- **Title:** Hybrid Layer چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `کنترل رطوبت` | [Isolation](/glossary/isolation.html) | … داشته باشد. انتخاب سیستم ادهزیو، رویکرد اچ و نحوهٔ کنترل رطوبت همگی بر کیفیت این لایه اثر مستقیم دارند. در درمان‌هایی که … | medium |


### `/glossary/immediate-dentin-sealing.html`

- **Page type:** `glossary`
- **Title:** Immediate Dentin Sealing (IDS) چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … انتخاب این رویکرد وابسته به نوع رستوریشن، استراتژی باندینگ و برنامه درمانی است. | **high** |
| `استحکام اتصال` | [Bond Strength](/glossary/bond-strength.html) | … آلودگی دنتین، حساسیت پس از درمان و افت استحکام اتصال جلوگیری شود. در این روش، باندینگ در شرایط کنترل‌شده و پیش از … | medium |
| `پروتکل باندینگ` | [Bonding / Bonding Protocol](/glossary/bonding-protocol.html) | … صرفاً «سیل کردن دنتین» نیست، بلکه یک استراتژی زمان‌بندی‌شده در پروتکل باندینگ است. انجام باندینگ در جلسه تحویل رستوریشن با IDS تفاوت … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Immediate Dentin Sealing (IDS) | [/episodes/episode-6.html](/episodes/episode-6.html) | glossary → episode | shared keywords: dentin, immediate, sealing | **high** |
| Dentin Sealing | [/glossary/dentin-sealing.html](/glossary/dentin-sealing.html) | glossary → glossary | shared keywords: dentin, sealing | **high** |


### `/glossary/isolation.html`

- **Page type:** `glossary`
- **Title:** Isolation چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `رابردم` | [Rubber Dam](/glossary/rubber-dam.html) | ایزولاسیون صرفاً به‌معنای استفاده از رابردم یا یک تکنیک خاص نیست. یکی از سوءبرداشت‌های رایج این است … | **high** |


### `/glossary/light-cure-resin-cement.html`

- **Page type:** `glossary`
- **Title:** Light-Cure Resin Cement چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سمان رزینی` | [Resin Cements](/glossary/resin-cements.html) | سمان رزینی لایت‌کیور به این معنا نیست که با رسیدن نور به … | medium |
| `ترنسلوسنسی` | [Translucency](/glossary/translucency.html) | … و شدت تابش نور، همگی در کیفیت کیور نقش تعیین‌کننده دارند. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Dual-Cure Resin Cement | [/glossary/dual-cure-resin-cement.html](/glossary/dual-cure-resin-cement.html) | glossary → glossary | shared keywords: cement, cure, resin | **high** |
| Self-Cure Resin Cement (Chemical-Cure Resin Cement) | [/glossary/self-cure-resin-cement.html](/glossary/self-cure-resin-cement.html) | glossary → glossary | shared keywords: cement, cure, resin | medium |


### `/glossary/lithium-disilicate.html`

- **Page type:** `glossary`
- **Title:** Lithium Disilicate چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | Lithium Disilicate یک گلس‌سرامیک تقویت‌شده با فاز کریستالی غالب است که به … | **high** |
| `فلدسپاتیک` | [Feldspathic Porcelain](/glossary/feldspathic-porcelain.html) | … غالب است که به دلیل استحکام خمشی بالاتر نسبت به فلدسپاتیک و شفافیت مناسب، در رستوریشن‌های غیرمستقیم زیبایی‌محور و فانکشنال استفاده می‌شود. … | **high** |
| `استحکام خمشی` | [Flexural Strength](/glossary/flexural-strength.html) | … تقویت‌شده با فاز کریستالی غالب است که به دلیل استحکام خمشی بالاتر نسبت به فلدسپاتیک و شفافیت مناسب، در رستوریشن‌های غیرمستقیم زیبایی‌محور … | **high** |


### `/glossary/matrix-in-matrix.html`

- **Page type:** `glossary`
- **Title:** Matrix-in-Matrix Technique چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | … تکنیک فراهم‌کردن ایزولاسیون مؤثر و امکان بازسازی مارژین در شرایط دشوار کلینیکی است. | **high** |
| `Deep Margin Elevation` | [Deep Margin Elevation (DME)](/glossary/deep-margin-elevation.html) | … وجود دارد. این تکنیک می‌تواند پیش‌نیاز اجرای Deep Margin Elevation یا ترمیم‌های عمیق مستقیم باشد. | **high** |


### `/glossary/mdp.html`

- **Page type:** `glossary`
- **Title:** MDP چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … پیوند شیمیایی پایدار با اکسیدهای فلزی (به‌ویژه زیرکونیا) و همچنین برهم‌کنش با هیدروکسی‌آپاتیت دندان را دارد. ساختار دو سرِ MDP امکان اتصال … | **high** |
| `گیر مکانیکی` | [Retention](/glossary/retention.html) | … داشته باشد، مانند باند به زیرکونیا یا سطوحی با گیر مکانیکی محدود. | medium |


### `/glossary/ph-of-adhesive-systems.html`

- **Page type:** `glossary`
- **Title:** pH of Adhesive Systems چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … نه نقطهٔ شروع آن. توجه به pH در انتخاب استراتژی باندینگ و سمان کردن، به‌ویژه در موارد استفاده از مواد دوال‌کیور یا … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Two-Bottle Adhesive Systems | [/glossary/two-bottle-adhesive-systems.html](/glossary/two-bottle-adhesive-systems.html) | glossary → glossary | shared keywords: adhesive, systems | **high** |


### `/glossary/phosphoric-acid-contamination.html`

- **Page type:** `glossary`
- **Title:** Phosphoric Acid Contamination چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … تا از تماس نادرست اسید فسفریک با سطوحی مانند زیرکونیا جلوگیری کند و پروتکل آماده‌سازی سطح را آگاهانه و متناسب با جنس … | **high** |
| `MDP` | [MDP (10-MDP Monomer)](/glossary/mdp.html) | … می‌توانند با مونومرهای فسفاته مانند MDP رقابت کرده و باند شیمیایی مؤثر را تضعیف کنند. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Phosphoric Acid | [/glossary/phosphoric-acid.html](/glossary/phosphoric-acid.html) | glossary → glossary | shared keywords: acid, phosphoric | **high** |


### `/glossary/phosphoric-acid.html`

- **Page type:** `glossary`
- **Title:** Phosphoric Acid چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … زمانی در تصمیم‌گیری درمانی معنا پیدا می‌کند که انتخاب استراتژی باندینگ مانند Etch and Rinse، Selective Etch یا Immediate Dentin Sealing مطرح … | **high** |
| `Etch and Rinse` | [Etch and Rinse](/glossary/etch-and-rinse.html) | … معنا پیدا می‌کند که انتخاب استراتژی باندینگ مانند Etch and Rinse، Selective Etch یا Immediate Dentin Sealing مطرح باشد. در درمان‌هایی که … | **high** |
| `Selective Etch` | [Selective Etch](/glossary/selective-etch.html) | … می‌کند که انتخاب استراتژی باندینگ مانند Etch and Rinse، Selective Etch یا Immediate Dentin Sealing مطرح باشد. در درمان‌هایی که باند به … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Phosphoric Acid Contamination | [/glossary/phosphoric-acid-contamination.html](/glossary/phosphoric-acid-contamination.html) | glossary → glossary | shared keywords: acid, phosphoric | **high** |


### `/glossary/platform-switch.html`

- **Page type:** `glossary`
- **Title:** Platform Switch چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `عرض بیولوژیک` | [Biological Width](/glossary/biological-width.html) | … شکل‌گیری مجدد عرض بیولوژیک در موقعیت مناسب‌تری نسبت به کرست استخوان. | **high** |
| `تای‌بیس` | [Ti-Base](/glossary/ti-base.html) | این مفهوم را نباید با تصویری ساده‌انگارانه از «هر تای‌بیس کوچک‌تر = پلتفرم سوئیچ» یکی دانست. اثر واقعی به میزان mismatch، … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Platform Switch – بخش اول | [/episodes/episode-82.html](/episodes/episode-82.html) | glossary → episode | shared keywords: platform, switch | **high** |
| Platform Switch – پایان | [/episodes/episode-83.html](/episodes/episode-83.html) | glossary → episode | shared keywords: platform, switch | **high** |


### `/glossary/polycrystalline-ceramics.html`

- **Page type:** `glossary`
- **Title:** Polycrystalline Ceramics چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … نظر استحکام مکانیکی و مقاومت به شکست در سطح بالاتری نسبت به سرامیک‌های سیلیکایی قرار بگیرند. زیرکونیا شاخص‌ترین نماینده این گروه در … | **high** |
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … سرامیک‌های سیلیکایی قرار بگیرند. زیرکونیا شاخص‌ترین نماینده این گروه در دندان‌پزشکی است. | **high** |
| `فاز گلاس` | [Glass Phase](/glossary/glass-phase.html) | … فشرده و پیوسته تشکیل شده و فاقد فاز گلاس هستند. نبود فاز شیشه‌ای باعث می‌شود این مواد از نظر استحکام مکانیکی و … | **high** |


### `/glossary/resin-cements.html`

- **Page type:** `glossary`
- **Title:** Resin Cement چیست؟ | دانشنامه دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Adhesive Resin Cements | [/glossary/adhesive-resin-cements.html](/glossary/adhesive-resin-cements.html) | glossary → glossary | shared keywords: cements, resin | **high** |
| Esthetic Resin Cements | [/glossary/esthetic-resin-cements.html](/glossary/esthetic-resin-cements.html) | glossary → glossary | shared keywords: cements, resin | **high** |
| Self-Adhesive Resin Cements | [/glossary/self-adhesive-cements.html](/glossary/self-adhesive-cements.html) | glossary → glossary | shared keywords: cements, resin | medium |


### `/glossary/retention.html`

- **Page type:** `glossary`
- **Title:** Retention (گیر) چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | گیر با مقاومت (Resistance) یکی نیست. یک سوءبرداشت رایج این است که Retention به … | **high** |
| `سمان‌های تردیشنال` | [Traditional Cements](/glossary/traditional-cements.html) | … گیر کافی تعیین می‌کند که آیا رستوریشن می‌تواند با سمان‌های تردیشنال تثبیت شود، نیاز به سمان‌های رزینی دارد، یا اساساً طراحی تراش … | **high** |
| `سمان‌های رزینی` | [Resin Cements](/glossary/resin-cements.html) | … سمان‌های تردیشنال تثبیت شود، نیاز به سمان‌های رزینی دارد، یا اساساً طراحی تراش یا نوع رستوریشن باید بازنگری شود. در درمان‌هایی که … | **high** |


### `/glossary/rubber-dam.html`

- **Page type:** `glossary`
- **Title:** Rubber Dam چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | رابردم معادل کامل مفهوم «ایزولاسیون» نیست، بلکه یکی از روش‌های تحقق آن است. تصور اینکه می‌توان … | **high** |
| `استحکام اتصال` | [Bond Strength](/glossary/bond-strength.html) | … باند شونده و پروتزی، کیفیت ایزولاسیون تعیین‌کننده استحکام اتصال و پیش‌بینی‌پذیری نتیجه است. | medium |


### `/glossary/sandblasting.html`

- **Page type:** `glossary`
- **Title:** Sandblasting چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `گیر مکانیکی` | [Retention](/glossary/retention.html) | … می‌شود. هدف از سندبلاست افزایش انرژی سطحی و ایجاد گیر مکانیکی برای بهبود کیفیت سمان کردن است. سندبلاست به‌خودیِ‌خود درمان محسوب نمی‌شود، … | medium |


### `/glossary/scan-body.html`

- **Page type:** `glossary`
- **Title:** Scan Body چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `Ti-Base` | [Ti-Base](/glossary/ti-base.html) | اسکن بادی را نباید با هیلینگ اباتمنت یا Ti-Base اشتباه گرفت. هیلینگ اباتمنت برای شکل‌دهی بافت نرم در طول دوره … | **high** |


### `/glossary/selective-etch.html`

- **Page type:** `glossary`
- **Title:** Selective Etch چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | اچ انتخابی رویکردی در باندینگ است که در آن اچ با اسید … | **high** |
| `سلف اچ` | [Self-Etch](/glossary/self-etch.html) | … و عاج بدون اچ جداگانه، با سیستم‌های سلف اچ یا یونیورسال آماده‌سازی می‌گردد. هدف این رویکرد ایجاد باند قوی و قابل‌اعتماد به … | **high** |
| `استحکام باند` | [Bond Strength](/glossary/bond-strength.html) | اچ انتخابی زمانی وارد تصمیم‌گیری درمانی می‌شود که استحکام باند به مینا اهمیت بالایی داشته باشد، اما حفظ سلامت عاج نیز … | **high** |


### `/glossary/self-adhesive-cements.html`

- **Page type:** `glossary`
- **Title:** Self Adhesive Cement چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سمان‌های تردیشنال` | [Traditional Cements](/glossary/traditional-cements.html) | … کوتاه‌تر می‌کنند و از نظر عملکرد، بیشتر به منطق سمان‌های تردیشنال نزدیک‌اند تا سمان‌های ادهزیو رزین. | **high** |
| `سمان‌های ادهزیو رزین` | [Adhesive Resin Cements](/glossary/adhesive-resin-cements.html) | … نظر عملکرد، بیشتر به منطق سمان‌های تردیشنال نزدیک‌اند تا سمان‌های ادهزیو رزین. | **high** |
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | … هم‌خوانی ندارد. حذف مراحل باند و سایلان به معنای افزایش کیفیت اتصال نیست، بلکه به معنای کاهش مداخله و پیچیدگی درمان است. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Adhesive Resin Cements | [/glossary/adhesive-resin-cements.html](/glossary/adhesive-resin-cements.html) | glossary → glossary | shared keywords: adhesive, cements, resin | **high** |
| Resin Cements | [/glossary/resin-cements.html](/glossary/resin-cements.html) | glossary → glossary | shared keywords: cements, resin | medium |
| Esthetic Resin Cements | [/glossary/esthetic-resin-cements.html](/glossary/esthetic-resin-cements.html) | glossary → glossary | shared keywords: cements, resin | medium |


### `/glossary/self-cure-resin-cement.html`

- **Page type:** `glossary`
- **Title:** Self-Cure Resin Cement چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `tertiary amines` | [Tertiary Amines](/glossary/tertiary-amines.html) | … گزارش شده که در برخی سیستم‌های Chemical-cure که از tertiary amines در مسیر آغاز پلیمریزاسیون استفاده می‌کنند، oxidation این amines می‌تواند در … | **high** |
| `سمان‌های رزینی` | [Resin Cements](/glossary/resin-cements.html) | سمان‌های رزینی سلف‌کیور زمانی انتخاب منطقی محسوب می‌شوند که دسترسی نوری به … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Dual-Cure Resin Cement | [/glossary/dual-cure-resin-cement.html](/glossary/dual-cure-resin-cement.html) | glossary → glossary | shared keywords: cement, cure, resin | medium |
| Light-Cure Resin Cement | [/glossary/light-cure-resin-cement.html](/glossary/light-cure-resin-cement.html) | glossary → glossary | shared keywords: cement, cure, resin | medium |
| Activator (Dual- / Self-Cure Activator) | [/glossary/activator.html](/glossary/activator.html) | glossary → glossary | shared keywords: cure, self | medium |


### `/glossary/silane.html`

- **Page type:** `glossary`
- **Title:** Silane چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | سایلان مختص سرامیک‌های سیلیکایی است و بر روی زیرکونیا یا فلزات اکسیدی اثر باندینگ مؤثری ندارد. وجود سایلان در برخی … | **high** |
| `پروتکل باندینگ` | [Bonding / Bonding Protocol](/glossary/bonding-protocol.html) | سایلان یک جزء کلیدی در پروتکل باندینگ رستوریشن‌های سیلیکایی است، اما به‌تنهایی تعیین‌کنندهٔ موفقیت درمان نیست. استفاده … | medium |


### `/glossary/silica-based-ceramics.html`

- **Page type:** `glossary`
- **Title:** Silica-Based Ceramics چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | … وجود فاز شیشه‌ای در این سرامیک‌ها امکان واکنش شیمیایی با سایلان را فراهم می‌کند و به همین دلیل، منطق سمان کردن آن‌ها … | **high** |
| `فلدسپاتیک` | [Feldspathic Porcelain](/glossary/feldspathic-porcelain.html) | … سمان کردن آن‌ها با سرامیک‌های غیرسیلیکایی متفاوت است. فلدسپاتیک و لیتیوم دی‌سیلیکات از شناخته‌شده‌ترین اعضای این گروه محسوب می‌شوند. | **high** |
| `لیتیوم دی‌سیلیکات` | [Lithium Disilicate](/glossary/lithium-disilicate.html) | … آن‌ها با سرامیک‌های غیرسیلیکایی متفاوت است. فلدسپاتیک و لیتیوم دی‌سیلیکات از شناخته‌شده‌ترین اعضای این گروه محسوب می‌شوند. | **high** |


### `/glossary/smear-layer.html`

- **Page type:** `glossary`
- **Title:** Smear Layer چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `توبول‌های عاجی` | [Dentinal Tubules](/glossary/dentinal-tubules.html) | … دبری‌های حاصل از تراش است و می‌تواند دهانهٔ توبول‌های عاجی را به‌طور نسبی یا کامل مسدود کند. لایهٔ اسمیر به‌خودیِ‌خود درمان محسوب … | **high** |
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … لایه وابسته به نحوهٔ مدیریت آن در چارچوب استراتژی باندینگ است، نه صرفاً وجود یا عدم وجود آن. | **high** |


### `/glossary/subgingival-margin.html`

- **Page type:** `glossary`
- **Title:** Subgingival Margin چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | … با بافت نرم پریودنتال، عرض بیولوژیک و امکان ایزولاسیون در ارتباط است و بر کیفیت اجرای درمان‌های باند شونده و غیرمستقیم تأثیر … | **high** |
| `عرض بیولوژیک` | [Biological Width](/glossary/biological-width.html) | … ناحیه ساب‌جینجیوال مستقیماً با بافت نرم پریودنتال، عرض بیولوژیک و امکان ایزولاسیون در ارتباط است و بر کیفیت اجرای درمان‌های باند شونده … | **high** |
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | … در نظر گرفتن سلامت پریودنتال، امکان ایزولاسیون قابل‌اعتماد و استراتژی باندینگ اتخاذ شود، زیرا پایداری بلندمدت ترمیم وابسته به هماهنگی میان مارژین … | **high** |


### `/glossary/temporary-cement-contamination.html`

- **Page type:** `glossary`
- **Title:** Temporary Cement Contamination چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `توبول‌های عاجی` | [Dentinal Tubules](/glossary/dentinal-tubules.html) | … ناشی از نفوذ اجزای سمان موقت به توبول‌های عاجی یا باقی‌ماندن لایه‌هایی باشد که مانع تعامل مؤثر دنتین با سیستم‌های ادهزیو می‌شوند. … | **high** |


### `/glossary/tertiary-amines.html`

- **Page type:** `glossary`
- **Title:** Tertiary Amines چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام اتصال` | [Bond Strength](/glossary/bond-strength.html) | آمین‌های نوع سوم عامل باندینگ یا افزایش مستقیم استحکام اتصال نیستند و نقش آن‌ها به فرآیند کیور شدن مواد رزینی … | medium |
| `سیستم‌های باندینگ` | [pH of Adhesive Systems](/glossary/ph-of-adhesive-systems.html) | … شدن مواد رزینی محدود می‌شود. این تصور که همهٔ سیستم‌های باندینگ با مواد دوال‌کیور یا سلف‌کیور سازگارند، یک سوءبرداشت رایج است. برخی … | medium |


### `/glossary/three-step-adhesive-system.html`

- **Page type:** `glossary`
- **Title:** Three-Step Adhesive System چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `لایه هیبرید` | [Hybrid Layer](/glossary/hybrid-layer.html) | … بهتری بر اچ، نفوذ رزین و تشکیل لایه هیبرید ایجاد کند. این سیستم‌ها را نباید صرفاً بر اساس تعداد مراحل قضاوت کرد، … | **high** |
| `کنترل رطوبت` | [Isolation](/glossary/isolation.html) | … غیرمستقیم یا شرایطی که دنتین حساس و کنترل رطوبت حیاتی است، استفاده از این سیستم می‌تواند پیش‌بینی‌پذیری اتصال را افزایش دهد. انتخاب … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Two-Step Adhesive System | [/glossary/two-step-adhesive-system.html](/glossary/two-step-adhesive-system.html) | glossary → glossary | shared keywords: adhesive, step, system | **high** |


### `/glossary/ti-base.html`

- **Page type:** `glossary`
- **Title:** Ti-Base چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `اسکن بادی` | [Scan Body](/glossary/scan-body.html) | Ti-Base را نباید با اسکن بادی اشتباه گرفت. اسکن بادی صرفاً یک ابزار ثبت اطلاعات موقعیتی … | **high** |
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … دیجیتال ایمپلنت است، به‌ویژه زمانی که رستوریشن از جنس زیرکونیا طراحی می‌شود و نیاز به حفظ کانکشن تیتانیومی با ایمپلنت وجود دارد. … | **high** |


### `/glossary/two-bottle-adhesive-systems.html`

- **Page type:** `glossary`
- **Title:** Two-Bottle Adhesive Systems چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | دو بطری بودن یک سیستم باندینگ الزاماً به معنای قدرت باند بالاتر یا برتری مطلق آن نیست. این تصور که سیستم‌های … | medium |
| `سیستم‌های باندینگ` | [pH of Adhesive Systems](/glossary/ph-of-adhesive-systems.html) | سیستم‌های باندینگ دو بطری یک متغیر وابسته در تصمیم‌گیری درمانی هستند، نه … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| pH of Adhesive Systems | [/glossary/ph-of-adhesive-systems.html](/glossary/ph-of-adhesive-systems.html) | glossary → glossary | shared keywords: adhesive, systems | **high** |


### `/glossary/two-step-adhesive-system.html`

- **Page type:** `glossary`
- **Title:** Two-Step Adhesive System چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | سیستم ادهزیو دو‌مرحله‌ای به گروهی از سیستم‌های باندینگ گفته می‌شود که فرآیند … | **high** |
| `Self-Etch` | [Self-Etch](/glossary/self-etch.html) | … بدون اچ مجزا با اسید فسفوریک (Two-Step Self-Etch). هدف از این طراحی، ساده‌سازی پروتکل بالینی در عین حفظ منطق ادهزیو است. سیستم … | **high** |
| `اسید فسفوریک` | [Phosphoric Acid](/glossary/phosphoric-acid.html) | … انجام می‌دهند. این سیستم‌ها یا شامل اچ جداگانه با اسید فسفوریک و سپس یک مادهٔ ترکیبی پرایمر–باند هستند (Two-Step Etch-and-Rinse)، یا شامل … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Three-Step Adhesive System | [/glossary/three-step-adhesive-system.html](/glossary/three-step-adhesive-system.html) | glossary → glossary | shared keywords: adhesive, step, system | **high** |


### `/glossary/undercut.html`

- **Page type:** `glossary`
- **Title:** Undercut چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `گیر مکانیکی` | [Retention](/glossary/retention.html) | … و اندازه‌گیری می‌شود و نقش کلیدی در ایجاد گیر مکانیکی کلاسپ‌ها دارد. بنابراین آندرکات بسته به نوع درمان می‌تواند یک مانع طراحی … | medium |


### `/glossary/unfilled-resin.html`

- **Page type:** `glossary`
- **Title:** Unfilled Resin چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `Flowable Resin` | [Flowable Resin](/glossary/flowable-resin.html) | … نباید با Flowable Resin اشتباه گرفت، زیرا هدف و عملکرد بالینی این دو کاملاً متفاوت است. | **high** |
| `دنتین تازه تراش‌خورده` | [Freshly Cut Dentin](/glossary/freshly-cut-dentin.html) | … باعث نفوذ مؤثر رزین به دنتین تازه تراش‌خورده و تشکیل لایهٔ هیبرید نازک اما یکنواخت می‌شود. این رزین یک مرحلهٔ زیرساختی در … | **high** |
| `Dentin Sealing` | [Dentin Sealing](/glossary/dentin-sealing.html) | … تثبیت بستر اتصال باشد. در تکنیک‌هایی مانند Immediate Dentin Sealing (IDS)، استفادهٔ صحیح از Unfilled Resin باعث نفوذ مؤثر رزین به دنتین … | **high** |


### `/glossary/universal-adhesive.html`

- **Page type:** `glossary`
- **Title:** Universal Adhesive چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سلف اچ` | [Self-Etch](/glossary/self-etch.html) | … نیاز به تصمیم‌گیری دربارهٔ انتخاب توتال اچ، سلف اچ یا اچ انتخابی را از بین می‌برد. در حالی‌که این باندینگ‌ها صرفاً امکان … | **high** |
| `استحکام اتصال` | [Bond Strength](/glossary/bond-strength.html) | باندینگ یونیورسال به گروهی از سیستم‌های باندینگ گفته می‌شود که برای استفاده … | medium |
| `پروتکل باندینگ` | [Bonding / Bonding Protocol](/glossary/bonding-protocol.html) | … آن‌ها افزایش انعطاف‌پذیری بالینی و ساده‌سازی پروتکل باندینگ است، نه الزاماً دستیابی به بیشترین استحکام اتصال در همه شرایط. | medium |


### `/glossary/vertical-dimension-of-occlusion.html`

- **Page type:** `glossary`
- **Title:** Vertical Dimension of Occlusion (VDO) چیست؟ | دانشنامه دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Vertical Dimension of Occlusion – Myth 1 ⇆reciprocal | [/episodes/episode-154.html](/episodes/episode-154.html) | glossary → episode | shared keywords: dimension, occlusion, vertical; ⇆ target already links here — missing reciprocal | **high** |
| Vertical Dimension of Occlusion – Myths & Evidence (Part 2) ⇆reciprocal | [/episodes/episode-155.html](/episodes/episode-155.html) | glossary → episode | shared keywords: dimension, occlusion, vertical; ⇆ target already links here — missing reciprocal | **high** |
| افزایش بعد عمودی (Vertical Dimension): دیدگاه‌های داوسون، شو ⇆reciprocal | [/notecast/episode-14.html](/notecast/episode-14.html) | glossary → notecast | shared keywords: dimension, occlusion, vertical; ⇆ target already links here — missing reciprocal | **high** |
| افزایش Vertical Dimension | [/episodes/episode-14.html](/episodes/episode-14.html) | glossary → episode | shared keywords: dimension, vertical | **high** |


### `/glossary/zero-bone-loss.html`

- **Page type:** `glossary`
- **Title:** Zero Bone Loss (ZBL) چیست؟ | دانشنامه دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss — بخش پروتزی (قسمت دوم) | [/episodes/episode-111.html](/episodes/episode-111.html) | glossary → episode | shared keywords: bone, loss, zero | **high** |
| Zero Bone Loss — بخش پروتزی (قسمت سوم) | [/episodes/episode-112.html](/episodes/episode-112.html) | glossary → episode | shared keywords: bone, loss, zero | **high** |
| Zero Bone Loss — شروع بخش پروتزی (قسمت اول) | [/episodes/episode-110.html](/episodes/episode-110.html) | glossary → episode | shared keywords: bone, loss, zero | **high** |


### `/glossary/zirconia-primer.html`

- **Page type:** `glossary`
- **Title:** Zirconia Primer چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | … از سوءبرداشت‌های رایج این است که پرایمر زیرکونیا می‌تواند نقش سایلان را ایفا کند، درحالی‌که سایلان در زیرکونیا کاربردی ندارد. همچنین تمیز … | **high** |
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | پرایمر زیرکونیا جایگزین آماده‌سازی مکانیکی سطح نیست و بدون سندبلاست، باند قابل‌اعتماد ایجاد … | **high** |
| `پروتکل باندینگ` | [Bonding / Bonding Protocol](/glossary/bonding-protocol.html) | … پرایمر زیرکونیا به‌تنهایی درمان محسوب نمی‌شود، بلکه بخشی از پروتکل باندینگ در رستوریشن‌های زیرکونیایی است. | medium |


### `/glossary/zirconia.html`

- **Page type:** `glossary`
- **Title:** Zirconia چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | … نیستند. این تصور که می‌توان با اچ اسیدی یا سایلان به زیرکونیا اتصال مؤثر ایجاد کرد، یکی از سوءبرداشت‌های رایج است. همچنین … | **high** |
| `سرامیک‌های شیشه‌ای` | [Silica-Based Ceramics](/glossary/silica-based-ceramics.html) | … سرامیک سیلیکایی محسوب نمی‌شود و پروتکل‌های باندینگ و سمان کردن سرامیک‌های شیشه‌ای برای آن قابل تعمیم نیستند. این تصور که می‌توان با … | medium |
| `سرامیک‌های شیشه‌ای` | [Glass Ceramics](/glossary/glass-ceramics.html) | … سرامیک سیلیکایی محسوب نمی‌شود و پروتکل‌های باندینگ و سمان کردن سرامیک‌های شیشه‌ای برای آن قابل تعمیم نیستند. این تصور که می‌توان با … | medium |


### `/glossary/zls.html`

- **Page type:** `glossary`
- **Title:** ZLS چیست؟ | دانشنامه دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … تقویت شده است. این ترکیب باعث افزایش مقاومت خمشی و بهبود رفتار مکانیکی نسبت به برخی گلس‌سرامیک‌های کلاسیک می‌شود، در حالی‌که ماده … | **high** |
| `سایلان` | [Silane (Silane Coupling Agent)](/glossary/silane.html) | Zirconia-Reinforced Lithium Silicate یا ZLS یکی از زیرگروه‌های گلس‌سرامیک‌هاست که در آن … | **high** |
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … که در آن ساختار لیتیوم سیلیکات با درصد کمی از زیرکونیا تقویت شده است. این ترکیب باعث افزایش مقاومت خمشی و بهبود … | **high** |


### `/episodes/episode-10.html`

- **Page type:** `episode`
- **Title:** نقش سایلان در آماده‌سازی سرامیک‌ها | اپیزود 10 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طبقه‌بندی سرامیک‌های دندانی | [/episodes/episode-8.html](/episodes/episode-8.html) | episode → episode | shared keywords: سرامیک; shared hashtags: #روکش | medium |


### `/episodes/episode-101.html`

- **Page type:** `episode`
- **Title:** باندینگ به دنتین ریشه — پروتکل‌های موثر | اپیزود 101 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| باندینگ‌های یونیورسال | [/episodes/episode-5.html](/episodes/episode-5.html) | episode → episode | shared keywords: باندینگ; shared hashtags: #ادهزیو, #باندینگ | medium |
| نسل‌های مختلف باندینگ | [/episodes/episode-4.html](/episodes/episode-4.html) | episode → episode | shared keywords: باندینگ; shared hashtags: #ادهزیو, #باندینگ | medium |
| DentAI – اثر محلول تشخیص پوسیدگی روی باند | [/dentai/dentai-4.html](/dentai/dentai-4.html) | episode → dentai | shared keywords: استحکام باند; shared hashtags: #باندینگ | medium |


### `/episodes/episode-102.html`

- **Page type:** `episode`
- **Title:** انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) | اپیزود 102 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | episode → litecast | shared keywords: implant abutment, اباتمنت; shared hashtags: #اباتمنت | medium |
| Zero Bone Loss — انتخاب اباتمنت (قسمت چهارم) | [/episodes/episode-115.html](/episodes/episode-115.html) | episode → episode | shared keywords: اباتمنت, انتخاب اباتمنت; shared hashtags: #اباتمنت | medium |
| Insight 35 — کوتاه دیده شدن اباتمنت در دهان؛ تمایز خطای جهت  | [/insight/insight-35.html](/insight/insight-35.html) | episode → insight | shared keywords: اباتمنت; shared hashtags: #اباتمنت, #پروتز_ایمپلنت | medium |


### `/episodes/episode-103.html`

- **Page type:** `episode`
- **Title:** انتخاب اباتمنت ایمپلنت — ادامه مباحث (قسمت دوم) | اپیزود 103 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss — انتخاب اباتمنت (قسمت چهارم) | [/episodes/episode-115.html](/episodes/episode-115.html) | episode → episode | shared keywords: اباتمنت; shared hashtags: #اباتمنت | medium |
| Insight 35 — کوتاه دیده شدن اباتمنت در دهان؛ تمایز خطای جهت  | [/insight/insight-35.html](/insight/insight-35.html) | episode → insight | shared keywords: اباتمنت; shared hashtags: #اباتمنت | medium |
| کانکشن‌های ایمپلنت – معرفی انواع اتصالات | [/episodes/episode-80.html](/episodes/episode-80.html) | episode → episode | shared keywords: اباتمنت; shared hashtags: #اباتمنت | medium |


### `/episodes/episode-104.html`

- **Page type:** `episode`
- **Title:** Ti-Base Abutments — کاربردها و نکات (قسمت اول) | اپیزود 104 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Ti-Base Abutments — جمع‌بندی (قسمت سوم) | [/episodes/episode-106.html](/episodes/episode-106.html) | episode → episode | shared keywords: abutments, base; shared hashtags: #tibase | medium |
| PEEK CAD-CAM — اصول و کاربردها (قسمت اول) | [/episodes/episode-96.html](/episodes/episode-96.html) | episode → episode | shared keywords: کاربردها; shared hashtags: #cadcam | medium |
| Insight 31 — آیا اسکن‌بادی و Ti‑Base باید از یک برند باشند؟ | [/insight/insight-31.html](/insight/insight-31.html) | episode → insight | shared keywords: base; shared hashtags: #tibase | medium |


### `/episodes/episode-105.html`

- **Page type:** `episode`
- **Title:** Ti-Base Abutments — ادامه بررسی (قسمت دوم) | اپیزود 105 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 31 — آیا اسکن‌بادی و Ti‑Base باید از یک برند باشند؟ | [/insight/insight-31.html](/insight/insight-31.html) | episode → insight | shared keywords: base; shared hashtags: #tibase, #پروتز_ایمپلنت | medium |


### `/episodes/episode-106-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — پدیده Suck-Back در توربین‌ها | اپیزود 106.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — کدگذاری رنگی هندپیس‌ها | [/episodes/episode-107-1.html](/episodes/episode-107-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #تجهیزات_دندانپزشکی, #دنتوپدیا | medium |
| دنتوپدیا — رادیوگرافی‌های پرتابل (Portable X-ray) | [/episodes/episode-110-1.html](/episodes/episode-110-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #تجهیزات_دندانپزشکی, #دنتوپدیا | medium |


### `/episodes/episode-106-2.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — فرمت فایل‌های اسکنر (STL, OBJ, PLY) | اپیزود 106.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت دیجیتال یعنی چی؟ | [/litecast/lite-CAST9.html](/litecast/lite-CAST9.html) | episode → litecast | shared keywords: intraoral scanner; shared hashtags: #دندانپزشکی_دیجیتال | medium |


### `/episodes/episode-106.html`

- **Page type:** `episode`
- **Title:** Ti-Base Abutments — جمع‌بندی (قسمت سوم) | اپیزود 106 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Ti-Base Abutments — کاربردها و نکات (قسمت اول) | [/episodes/episode-104.html](/episodes/episode-104.html) | episode → episode | shared keywords: abutments, base; shared hashtags: #tibase | medium |
| Insight 31 — آیا اسکن‌بادی و Ti‑Base باید از یک برند باشند؟ | [/insight/insight-31.html](/insight/insight-31.html) | episode → insight | shared keywords: base; shared hashtags: #tibase | medium |


### `/episodes/episode-107-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — کدگذاری رنگی هندپیس‌ها | اپیزود 107.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — رادیوگرافی‌های پرتابل (Portable X-ray) | [/episodes/episode-110-1.html](/episodes/episode-110-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #تجهیزات_دندانپزشکی, #دنتوپدیا | medium |
| دنتوپدیا — پدیده Suck-Back در توربین‌ها | [/episodes/episode-106-1.html](/episodes/episode-106-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #تجهیزات_دندانپزشکی, #دنتوپدیا | medium |


### `/episodes/episode-107.html`

- **Page type:** `episode`
- **Title:** زیرکونیاهای گرادینت مولتی‌لیر — تحولی در زیبایی | اپیزود 107 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زیرکونیاهای شفاف – بخش اول | [/episodes/episode-17.html](/episodes/episode-17.html) | episode → episode | shared keywords: زیرکونیاهای; shared hashtags: #زیرکونیا | medium |
| زیرکونیاهای شفاف – بخش دوم | [/episodes/episode-18.html](/episodes/episode-18.html) | episode → episode | shared keywords: زیرکونیاهای; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-109-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — اصطلاحات لوپ‌های دندانپزشکی | اپیزود 109.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — برندینگ در دندانپزشکی (Practice Branding) | [/episodes/episode-143-1.html](/episodes/episode-143-1.html) | episode → episode | shared keywords: دنتوپدیا, دندانپزشکی; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — دندانپزشکی دیجیتال: نگاهی عمیق | [/episodes/episode-149-2.html](/episodes/episode-149-2.html) | episode → episode | shared keywords: دنتوپدیا, دندانپزشکی; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — کانسپت All-on-4 | [/episodes/episode-144-1.html](/episodes/episode-144-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-109.html`

- **Page type:** `episode`
- **Title:** هوش مصنوعی در دندانپزشکی — مفاهیم پایه | اپیزود 109 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — مصاحبه: مسیر یادگیری هوش مصنوعی ⇆reciprocal | [/episodes/episode-109-2.html](/episodes/episode-109-2.html) | episode → episode | shared keywords: مصنوعی; shared hashtags: #هوش_مصنوعی; ⇆ target already links here — missing reciprocal | medium |
| اسلایدکست — مبانی هوش مصنوعی برای دندانپزشکان | [/episodes/episode-149-1.html](/episodes/episode-149-1.html) | episode → episode | shared keywords: آینده دندانپزشکی, مصنوعی, یادگیری ماشین; shared hashtags: #ai, #دندانپزشکی_هوشمند, #هوش_مصنوعی | medium |


### `/episodes/episode-11.html`

- **Page type:** `episode`
- **Title:** آماده‌سازی سطح زیرکونیا | اپیزود 11 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سمان‌های رزینی` | [Resin Cements](/glossary/resin-cements.html) | … برای باند کردن زیرکونیا و افزایش انرژی سطحی آن برای سمان‌های رزینی. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مرور علمی زیرکونیا – بخش اول | [/episodes/episode-87.html](/episodes/episode-87.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-110-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — رادیوگرافی‌های پرتابل (Portable X-ray) | اپیزود 110.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — کدگذاری رنگی هندپیس‌ها | [/episodes/episode-107-1.html](/episodes/episode-107-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #تجهیزات_دندانپزشکی, #دنتوپدیا | medium |
| دنتوپدیا — پدیده Suck-Back در توربین‌ها | [/episodes/episode-106-1.html](/episodes/episode-106-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #تجهیزات_دندانپزشکی, #دنتوپدیا | medium |


### `/episodes/episode-110.html`

- **Page type:** `episode`
- **Title:** Zero Bone Loss — شروع بخش پروتزی (قسمت اول) | اپیزود 110 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss — بخش پروتزی (قسمت دوم) | [/episodes/episode-111.html](/episodes/episode-111.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس, پروتزی; shared hashtags: #zeroboneloss, #تحلیل_استخوان, #پروتز_ایمپلنت | **high** |
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| Zero Bone Loss — بخش پروتزی (قسمت سوم) | [/episodes/episode-112.html](/episodes/episode-112.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس, پروتزی; shared hashtags: #zeroboneloss | medium |


### `/episodes/episode-111.html`

- **Page type:** `episode`
- **Title:** Zero Bone Loss — بخش پروتزی (قسمت دوم) | اپیزود 111 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss — شروع بخش پروتزی (قسمت اول) | [/episodes/episode-110.html](/episodes/episode-110.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس, پروتزی; shared hashtags: #zeroboneloss, #تحلیل_استخوان, #پروتز_ایمپلنت | **high** |
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| Zero Bone Loss — بخش پروتزی (قسمت سوم) | [/episodes/episode-112.html](/episodes/episode-112.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس, پروتزی; shared hashtags: #zeroboneloss | medium |


### `/episodes/episode-112.html`

- **Page type:** `episode`
- **Title:** Zero Bone Loss — بخش پروتزی (قسمت سوم) | اپیزود 112 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | [/episodes/episode-139.html](/episodes/episode-139.html) | episode → episode | shared keywords: bone, loss, zero, تحلیل استخوان, پروتزی; shared hashtags: #zeroboneloss | medium |
| Zero Bone Loss — بخش پروتزی (قسمت دوم) | [/episodes/episode-111.html](/episodes/episode-111.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس, پروتزی; shared hashtags: #zeroboneloss | medium |


### `/episodes/episode-113.html`

- **Page type:** `episode`
- **Title:** اصول تراش دندان Goodacre — (قسمت اول) | اپیزود 113 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نکات شخصی که کیفیت تراش را واقعاً بهتر می‌کنند | [/dentcast-plus/video-1.html](/dentcast-plus/video-1.html) | episode → dentcast_plus | shared keywords: تراش; shared hashtags: #تراش_دندان, #روکش_دندان | medium |
| BOPT — اصول تراش و آماده‌سازی | [/episodes/episode-95.html](/episodes/episode-95.html) | episode → episode | shared keywords: تراش; shared hashtags: #تراش_دندان, #پروتز_ثابت | medium |
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | episode → dentai | shared keywords: تراش; shared hashtags: #تراش_دندان | medium |


### `/episodes/episode-115.html`

- **Page type:** `episode`
- **Title:** Zero Bone Loss — انتخاب اباتمنت (قسمت چهارم) | اپیزود 115 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | [/episodes/episode-139.html](/episodes/episode-139.html) | episode → episode | shared keywords: biocompatibility, bone, loss, zero; shared hashtags: #zeroboneloss, #متریال_پروتزی | medium |
| Zero Bone Loss — بخش پروتزی (قسمت سوم) | [/episodes/episode-112.html](/episodes/episode-112.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس; shared hashtags: #zeroboneloss | medium |


### `/episodes/episode-116.html`

- **Page type:** `episode`
- **Title:** Global Diagnosis — شروع کتاب (قسمت اول) | اپیزود 116 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Global Diagnosis — پنج سوال تشخیص (قسمت چهارم) | [/episodes/episode-119.html](/episodes/episode-119.html) | episode → episode | shared keywords: diagnosis, global, j. william robbins, طرح درمان زیبایی; shared hashtags: #globaldiagnosis, #زیبایی, #کتاب_رابینز | **high** |
| Global Diagnosis — جمع‌بندی ۵ سوال (قسمت پنجم) | [/episodes/episode-120.html](/episodes/episode-120.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #globaldiagnosis, #طرح_درمان | medium |
| Global Diagnosis — آنالیز لبخند (قسمت سوم) | [/episodes/episode-118.html](/episodes/episode-118.html) | episode → episode | shared keywords: diagnosis, global | medium |


### `/episodes/episode-117.html`

- **Page type:** `episode`
- **Title:** Global Diagnosis — معاینه و فرم GAD (قسمت دوم) | اپیزود 117 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Global Diagnosis — پنج سوال تشخیص (قسمت چهارم) | [/episodes/episode-119.html](/episodes/episode-119.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #globaldiagnosis | medium |
| Global Diagnosis — جمع‌بندی ۵ سوال (قسمت پنجم) | [/episodes/episode-120.html](/episodes/episode-120.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #globaldiagnosis | medium |


### `/episodes/episode-118-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — دنچرهای بدون فلنج (Flangeless Denture) | اپیزود 118.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — سیستم BPS در دنچر کامل | [/episodes/episode-147-1.html](/episodes/episode-147-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دنچر, #پروتز_متحرک | medium |
| دنتوپدیا — تزریق بدون درد (Computer-Controlled Anesthesia) | [/episodes/episode-122-4.html](/episodes/episode-122-4.html) | episode → episode | shared keywords: بدون, دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — ملاحظات لبه انسیزال (Incisal Edge) | [/episodes/episode-120-1.html](/episodes/episode-120-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-118.html`

- **Page type:** `episode`
- **Title:** Global Diagnosis — آنالیز لبخند (قسمت سوم) | اپیزود 118 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اصول آنالیز و طراحی لبخند؛ قوانین McLaren | [/notecast/episode-28.html](/notecast/episode-28.html) | episode → notecast | shared keywords: آنالیز, تناسبات دندانی, طراحی لبخند; shared hashtags: #smiledesign, #آنالیز_لبخند, #زیبایی_دندان | **high** |
| Global Diagnosis — جمع‌بندی ۵ سوال (قسمت پنجم) | [/episodes/episode-120.html](/episodes/episode-120.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #پروتز_زیبایی | medium |
| Global Diagnosis — شروع کتاب (قسمت اول) | [/episodes/episode-116.html](/episodes/episode-116.html) | episode → episode | shared keywords: diagnosis, global | medium |


### `/episodes/episode-119-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — بریج یا ایمپلنت؟ (Bridge vs Implant) | اپیزود 119.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — حفظ دندان یا ایمپلنت؟ (یک مناظره) | [/episodes/episode-150-2.html](/episodes/episode-150-2.html) | episode → episode | shared keywords: ایمپلنت؟, دنتوپدیا; shared hashtags: #طرح_درمان | medium |
| دنتوپدیا — مدیریت کانتکت‌های بین دندانی | [/episodes/episode-121-1.html](/episodes/episode-121-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-119.html`

- **Page type:** `episode`
- **Title:** Global Diagnosis — پنج سوال تشخیص (قسمت چهارم) | اپیزود 119 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Global Diagnosis — شروع کتاب (قسمت اول) | [/episodes/episode-116.html](/episodes/episode-116.html) | episode → episode | shared keywords: diagnosis, global, j. william robbins, طرح درمان زیبایی; shared hashtags: #globaldiagnosis, #زیبایی, #کتاب_رابینز | **high** |
| Global Diagnosis — جمع‌بندی ۵ سوال (قسمت پنجم) | [/episodes/episode-120.html](/episodes/episode-120.html) | episode → episode | shared keywords: diagnosis, global, سوال; shared hashtags: #globaldiagnosis | medium |
| Global Diagnosis — معاینه و فرم GAD (قسمت دوم) | [/episodes/episode-117.html](/episodes/episode-117.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #globaldiagnosis | medium |


### `/episodes/episode-12.html`

- **Page type:** `episode`
- **Title:** تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی | اپیزود 12 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | [/insight/insight-5.html](/insight/insight-5.html) | episode → insight | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |
| طول عمر آنله‌های سرامیکی | [/episodes/episode-15.html](/episodes/episode-15.html) | episode → episode | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |
| ثبات رنگ لمینیت‌های سرامیکی | [/episodes/episode-19.html](/episodes/episode-19.html) | episode → episode | shared keywords: سرامیکی; shared hashtags: #لمینیت | medium |


### `/episodes/episode-120-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — ملاحظات لبه انسیزال (Incisal Edge) | اپیزود 120.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — فرمیتوس (Fremitus) چیست؟ | [/episodes/episode-123-2.html](/episodes/episode-123-2.html) | episode → episode | shared keywords: دنتوپدیا, پروتز قدامی; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — دنچرهای بدون فلنج (Flangeless Denture) | [/episodes/episode-118-1.html](/episodes/episode-118-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — کانسپت All-on-4 | [/episodes/episode-144-1.html](/episodes/episode-144-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-120.html`

- **Page type:** `episode`
- **Title:** Global Diagnosis — جمع‌بندی ۵ سوال (قسمت پنجم) | اپیزود 120 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Global Diagnosis — شروع کتاب (قسمت اول) | [/episodes/episode-116.html](/episodes/episode-116.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #globaldiagnosis, #طرح_درمان | medium |
| Global Diagnosis — پنج سوال تشخیص (قسمت چهارم) | [/episodes/episode-119.html](/episodes/episode-119.html) | episode → episode | shared keywords: diagnosis, global, سوال; shared hashtags: #globaldiagnosis | medium |
| Global Diagnosis — معاینه و فرم GAD (قسمت دوم) | [/episodes/episode-117.html](/episodes/episode-117.html) | episode → episode | shared keywords: diagnosis, global; shared hashtags: #globaldiagnosis | medium |


### `/episodes/episode-121-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — مدیریت کانتکت‌های بین دندانی | اپیزود 121.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| یه نکته ی مهم در مورد باز شدن کانتکت بین ۶ و ۷ | [/metanotes/meta-12.html](/metanotes/meta-12.html) | episode → metanote | shared keywords: food impaction, کانتکت | medium |
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | episode → insight | shared keywords: مدیریت, کانتکت | medium |
| دنتوپدیا — بریج یا ایمپلنت؟ (Bridge vs Implant) | [/episodes/episode-119-1.html](/episodes/episode-119-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-121.html`

- **Page type:** `episode`
- **Title:** گایدلاین ترمیم‌های خلفی — (قسمت اول) | اپیزود 121 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| گایدلاین ترمیم‌های خلفی — جمع‌بندی (قسمت چهارم) | [/episodes/episode-124.html](/episodes/episode-124.html) | episode → episode | shared keywords: بیومیمتیک, خلفی, گایدلاین; shared hashtags: #ترمیم_خلفی, #پروتز_ثابت, #گایدلاین | **high** |
| گایدلاین ترمیم‌های خلفی — (قسمت سوم) | [/episodes/episode-123.html](/episodes/episode-123.html) | episode → episode | shared keywords: خلفی, گایدلاین; shared hashtags: #ترمیم_خلفی, #پروتز_ثابت, #گایدلاین | **high** |
| گایدلاین ترمیم‌های خلفی — (قسمت دوم) | [/episodes/episode-122.html](/episodes/episode-122.html) | episode → episode | shared keywords: خلفی, گایدلاین | medium |


### `/episodes/episode-122-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — اسکرو یا سمان و بیماری‌های پری‌ایمپلنت | اپیزود 122.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — سمیت سمان‌ها برای بافت نرم ایمپلنت | [/episodes/episode-122-6.html](/episodes/episode-122-6.html) | episode → episode | shared keywords: التهاب لثه ایمپلنت, اینسایت, سمان; shared hashtags: #اینسایت | medium |
| اینسایت — زیرکونیا یا PFM در ایمپلنت خلفی؟ | [/episodes/episode-125-1.html](/episodes/episode-125-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — ایمپلنت‌های خواب (Sleeping Implants) | [/episodes/episode-123-5.html](/episodes/episode-123-5.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-122-2.html`

- **Page type:** `episode`
- **Title:** اینسایت — تاثیر سرعت اسکن بر دقت (Scanning Duration) | اپیزود 122.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — دقت اسکنرهای داخل دهانی (Trueness & Precision) | [/episodes/episode-128-1.html](/episodes/episode-128-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اسکنر_داخل_دهانی, #اینسایت, #دقت_اسکن | medium |
| اینسایت — تطابق لبه‌ای: دیجیتال یا معمولی؟ | [/episodes/episode-123-1.html](/episodes/episode-123-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت, #دندانپزشکی_دیجیتال | medium |
| افزایش دقت اسکن در ایمپلنت (Scan Bodies) | [/episodes/episode-133.html](/episodes/episode-133.html) | episode → episode | shared keywords: اسکن, دیجیتال ایمپلنت; shared hashtags: #دقت_اسکن | medium |


### `/episodes/episode-122-3.html`

- **Page type:** `episode`
- **Title:** اینسایت — ونیر سرامیکی روی دندان‌های اندو شده | اپیزود 122.3 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — دی‌باندینگ لیزری ونیرها (Laser Debonding) | [/episodes/episode-124-1.html](/episodes/episode-124-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت, #ونیر_سرامیکی | medium |
| اینسایت — فول‌ماوس زیرکونیا: ونیر شده یا مونولیتیک؟ | [/episodes/episode-123-4.html](/episodes/episode-123-4.html) | episode → episode | shared keywords: اینسایت, ونیر; shared hashtags: #اینسایت | medium |
| تفاوت لمینت سرامیکی و کامپوزیت دندان چیست؟ (و کدام بهتر است؟ | [/litecast/lite-CAST7.html](/litecast/lite-CAST7.html) | episode → litecast | shared keywords: سرامیکی; shared hashtags: #ونیر_سرامیکی | medium |


### `/episodes/episode-122-4.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — تزریق بدون درد (Computer-Controlled Anesthesia) | اپیزود 122.4 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — دنچرهای بدون فلنج (Flangeless Denture) | [/episodes/episode-118-1.html](/episodes/episode-118-1.html) | episode → episode | shared keywords: بدون, دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-122-5.html`

- **Page type:** `episode`
- **Title:** اینسایت — کارایی فرزهای الماسه روی زیرکونیا | اپیزود 122.5 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — فول‌ماوس زیرکونیا: ونیر شده یا مونولیتیک؟ | [/episodes/episode-123-4.html](/episodes/episode-123-4.html) | episode → episode | shared keywords: اینسایت, زیرکونیا; shared hashtags: #اینسایت, #زیرکونیا | medium |
| اینسایت — زیرکونیا یا PFM در ایمپلنت خلفی؟ | [/episodes/episode-125-1.html](/episodes/episode-125-1.html) | episode → episode | shared keywords: اینسایت, زیرکونیا; shared hashtags: #اینسایت | medium |
| مرور علمی زیرکونیا – بخش اول | [/episodes/episode-87.html](/episodes/episode-87.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-122-6.html`

- **Page type:** `episode`
- **Title:** اینسایت — سمیت سمان‌ها برای بافت نرم ایمپلنت | اپیزود 122.6 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — اسکرو یا سمان و بیماری‌های پری‌ایمپلنت | [/episodes/episode-122-1.html](/episodes/episode-122-1.html) | episode → episode | shared keywords: التهاب لثه ایمپلنت, اینسایت, سمان; shared hashtags: #اینسایت | medium |
| راهنمای جامع انتخاب سمان مناسب برای رستوریشن‌های دندانی | [/notecast/episode-2.html](/notecast/episode-2.html) | episode → notecast | shared keywords: سمان, سمان رزینی | medium |


### `/episodes/episode-122.html`

- **Page type:** `episode`
- **Title:** گایدلاین ترمیم‌های خلفی — (قسمت دوم) | اپیزود 122 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| گایدلاین ترمیم‌های خلفی — (قسمت اول) | [/episodes/episode-121.html](/episodes/episode-121.html) | episode → episode | shared keywords: خلفی, گایدلاین | medium |
| گایدلاین ترمیم‌های خلفی — (قسمت سوم) | [/episodes/episode-123.html](/episodes/episode-123.html) | episode → episode | shared keywords: خلفی, گایدلاین | medium |
| ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت اول | [/episodes/episode-137.html](/episodes/episode-137.html) | episode → episode | shared keywords: خلفی; shared hashtags: #ترمیم_غیرمستقیم | medium |


### `/episodes/episode-123-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — تطابق لبه‌ای: دیجیتال یا معمولی؟ | اپیزود 123.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — تاثیر سرعت اسکن بر دقت (Scanning Duration) | [/episodes/episode-122-2.html](/episodes/episode-122-2.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت, #دندانپزشکی_دیجیتال | medium |
| ایمپلنت دیجیتال یعنی چی؟ | [/litecast/lite-CAST9.html](/litecast/lite-CAST9.html) | episode → litecast | shared keywords: دیجیتال; shared hashtags: #دندانپزشکی_دیجیتال | medium |
| ایمپلنت دیجیتال چیست؟ | [/litecast/lite-CAST14.html](/litecast/lite-CAST14.html) | episode → litecast | shared keywords: دیجیتال; shared hashtags: #دندانپزشکی_دیجیتال | medium |


### `/episodes/episode-123-2.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — فرمیتوس (Fremitus) چیست؟ | اپیزود 123.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آخرین مرحله قبل از خداحافظی با بیمار | [/dentcast-plus/video-2.html](/dentcast-plus/video-2.html) | episode → dentcast_plus | shared keywords: فرمیتوس; shared hashtags: #اکلوژن, #فرمیتوس | medium |
| دنتوپدیا — ملاحظات لبه انسیزال (Incisal Edge) | [/episodes/episode-120-1.html](/episodes/episode-120-1.html) | episode → episode | shared keywords: دنتوپدیا, پروتز قدامی; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-123-3.html`

- **Page type:** `episode`
- **Title:** اینسایت — آنله مستقیم یا غیرمستقیم؟ | اپیزود 123.3 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — طراحی تراش و مقاومت به شکست (کامپوزیت) | [/episodes/episode-128-2.html](/episodes/episode-128-2.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت, #ترمیم_مستقیم, #کامپوزیت | medium |


### `/episodes/episode-123-4.html`

- **Page type:** `episode`
- **Title:** اینسایت — فول‌ماوس زیرکونیا: ونیر شده یا مونولیتیک؟ | اپیزود 123.4 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — کارایی فرزهای الماسه روی زیرکونیا | [/episodes/episode-122-5.html](/episodes/episode-122-5.html) | episode → episode | shared keywords: اینسایت, زیرکونیا; shared hashtags: #اینسایت, #زیرکونیا | medium |
| اینسایت — زیرکونیا یا PFM در ایمپلنت خلفی؟ | [/episodes/episode-125-1.html](/episodes/episode-125-1.html) | episode → episode | shared keywords: monolithic zirconia, اینسایت, زیرکونیا; shared hashtags: #اینسایت | medium |
| اینسایت — ونیر سرامیکی روی دندان‌های اندو شده | [/episodes/episode-122-3.html](/episodes/episode-122-3.html) | episode → episode | shared keywords: اینسایت, ونیر; shared hashtags: #اینسایت | medium |


### `/episodes/episode-123-5.html`

- **Page type:** `episode`
- **Title:** اینسایت — ایمپلنت‌های خواب (Sleeping Implants) | اپیزود 123.5 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — سیگار و پریودنتیت: ریسک فاکتورهای ایمپلنت | [/episodes/episode-147-2.html](/episodes/episode-147-2.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — درمان انتهای آزاد (Free-End): ایمپلنت یا پارسیل؟ | [/episodes/episode-126-1.html](/episodes/episode-126-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-123-6.html`

- **Page type:** `episode`
- **Title:** اینسایت — شل شدن پیچ اباتمنت‌های کاستوم (Screw Loosening) | اپیزود 123.6 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Abutment Screw – نکات کاربردی | [/episodes/episode-84.html](/episodes/episode-84.html) | episode → episode | shared keywords: screw, گشتاور پیچ | medium |
| اینسایت — سیگار و پریودنتیت: ریسک فاکتورهای ایمپلنت | [/episodes/episode-147-2.html](/episodes/episode-147-2.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — درمان انتهای آزاد (Free-End): ایمپلنت یا پارسیل؟ | [/episodes/episode-126-1.html](/episodes/episode-126-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-123.html`

- **Page type:** `episode`
- **Title:** گایدلاین ترمیم‌های خلفی — (قسمت سوم) | اپیزود 123 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| گایدلاین ترمیم‌های خلفی — (قسمت اول) | [/episodes/episode-121.html](/episodes/episode-121.html) | episode → episode | shared keywords: خلفی, گایدلاین; shared hashtags: #ترمیم_خلفی, #پروتز_ثابت, #گایدلاین | **high** |
| گایدلاین ترمیم‌های خلفی — جمع‌بندی (قسمت چهارم) | [/episodes/episode-124.html](/episodes/episode-124.html) | episode → episode | shared keywords: خلفی, گایدلاین; shared hashtags: #ترمیم_خلفی, #پروتز_ثابت, #گایدلاین | medium |
| گایدلاین ترمیم‌های خلفی — (قسمت دوم) | [/episodes/episode-122.html](/episodes/episode-122.html) | episode → episode | shared keywords: خلفی, گایدلاین | medium |


### `/episodes/episode-124-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — دی‌باندینگ لیزری ونیرها (Laser Debonding) | اپیزود 124.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — ونیر سرامیکی روی دندان‌های اندو شده | [/episodes/episode-122-3.html](/episodes/episode-122-3.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت, #ونیر_سرامیکی | medium |


### `/episodes/episode-124.html`

- **Page type:** `episode`
- **Title:** گایدلاین ترمیم‌های خلفی — جمع‌بندی (قسمت چهارم) | اپیزود 124 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| گایدلاین ترمیم‌های خلفی — (قسمت اول) | [/episodes/episode-121.html](/episodes/episode-121.html) | episode → episode | shared keywords: بیومیمتیک, خلفی, گایدلاین; shared hashtags: #ترمیم_خلفی, #پروتز_ثابت, #گایدلاین | **high** |
| گایدلاین ترمیم‌های خلفی — (قسمت سوم) | [/episodes/episode-123.html](/episodes/episode-123.html) | episode → episode | shared keywords: خلفی, گایدلاین; shared hashtags: #ترمیم_خلفی, #پروتز_ثابت, #گایدلاین | medium |
| گایدلاین ترمیم‌های خلفی — (قسمت دوم) | [/episodes/episode-122.html](/episodes/episode-122.html) | episode → episode | shared keywords: خلفی, گایدلاین | medium |


### `/episodes/episode-125-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — زیرکونیا یا PFM در ایمپلنت خلفی؟ | اپیزود 125.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — فول‌ماوس زیرکونیا: ونیر شده یا مونولیتیک؟ | [/episodes/episode-123-4.html](/episodes/episode-123-4.html) | episode → episode | shared keywords: monolithic zirconia, اینسایت, زیرکونیا; shared hashtags: #اینسایت | medium |
| اینسایت — اسکرو یا سمان و بیماری‌های پری‌ایمپلنت | [/episodes/episode-122-1.html](/episodes/episode-122-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-125-2.html`

- **Page type:** `episode`
- **Title:** اینسایت — روکش موقت فوری و بافت نرم (Esthetic Zone) | اپیزود 125.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت فوری در ناحیه زیبایی (ITI Consensus 2023) | [/episodes/episode-150.html](/episodes/episode-150.html) | episode → episode | shared keywords: فوری; shared hashtags: #ایمپلنت_فوری, #ناحیه_زیبایی | medium |
| اینسایت — سمیت سمان‌ها برای بافت نرم ایمپلنت | [/episodes/episode-122-6.html](/episodes/episode-122-6.html) | episode → episode | shared keywords: اینسایت, بافت; shared hashtags: #اینسایت | medium |
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | episode → dentai | shared keywords: esthetic, zone | medium |


### `/episodes/episode-125-3.html`

- **Page type:** `episode`
- **Title:** اینسایت — توزیع استرس: پست فایبر یا فلزی؟ | اپیزود 125.3 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| راهنمای جامع فایبر پست‌ها — (قسمت دوم) | [/episodes/episode-129.html](/episodes/episode-129.html) | episode → episode | shared keywords: فایبر; shared hashtags: #فایبر_پست, #پست_و_کور | medium |
| راهنمای جامع فایبر پست‌ها — (قسمت اول) | [/episodes/episode-128.html](/episodes/episode-128.html) | episode → episode | shared keywords: فایبر; shared hashtags: #بیومکانیک, #فایبر_پست | medium |
| فایبر پست؛ درمانی که بیش از حد جدی گرفته شد | [/metanotes/meta-7.html](/metanotes/meta-7.html) | episode → metanote | shared keywords: فایبر; shared hashtags: #فایبر_پست | medium |


### `/episodes/episode-125.html`

- **Page type:** `episode`
- **Title:** ضایعات سرویکال (NCCL) — شناخت و اتیولوژی (قسمت اول) | اپیزود 125 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ضایعات سرویکال (NCCL) — گایدلاین درمانی (قسمت سوم) | [/episodes/episode-127.html](/episodes/episode-127.html) | episode → episode | shared keywords: nccl, سرویکال, ضایعات; shared hashtags: #nccl | medium |
| ضایعات سرویکال (NCCL) — تشخیص و مدیریت (قسمت دوم) | [/episodes/episode-126.html](/episodes/episode-126.html) | episode → episode | shared keywords: nccl, سرویکال, ضایعات; shared hashtags: #nccl | medium |


### `/episodes/episode-126-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — درمان انتهای آزاد (Free-End): ایمپلنت یا پارسیل؟ | اپیزود 126.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — ایمپلنت‌های خواب (Sleeping Implants) | [/episodes/episode-123-5.html](/episodes/episode-123-5.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — سیگار و پریودنتیت: ریسک فاکتورهای ایمپلنت | [/episodes/episode-147-2.html](/episodes/episode-147-2.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-126.html`

- **Page type:** `episode`
- **Title:** ضایعات سرویکال (NCCL) — تشخیص و مدیریت (قسمت دوم) | اپیزود 126 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ضایعات سرویکال (NCCL) — گایدلاین درمانی (قسمت سوم) | [/episodes/episode-127.html](/episodes/episode-127.html) | episode → episode | shared keywords: nccl, سرویکال, ضایعات; shared hashtags: #nccl | medium |
| ضایعات سرویکال (NCCL) — شناخت و اتیولوژی (قسمت اول) | [/episodes/episode-125.html](/episodes/episode-125.html) | episode → episode | shared keywords: nccl, سرویکال, ضایعات; shared hashtags: #nccl | medium |
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | episode → insight | shared keywords: مدیریت; shared hashtags: #پروتز_ثابت | medium |


### `/episodes/episode-127.html`

- **Page type:** `episode`
- **Title:** ضایعات سرویکال (NCCL) — گایدلاین درمانی (قسمت سوم) | اپیزود 127 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ضایعات سرویکال (NCCL) — شناخت و اتیولوژی (قسمت اول) | [/episodes/episode-125.html](/episodes/episode-125.html) | episode → episode | shared keywords: nccl, سرویکال, ضایعات; shared hashtags: #nccl | medium |
| ضایعات سرویکال (NCCL) — تشخیص و مدیریت (قسمت دوم) | [/episodes/episode-126.html](/episodes/episode-126.html) | episode → episode | shared keywords: nccl, سرویکال, ضایعات; shared hashtags: #nccl | medium |
| گایدلاین‌های درمان پوسیدگی (MID) — قسمت اول | [/episodes/episode-134.html](/episodes/episode-134.html) | episode → episode | shared keywords: گایدلاین; shared hashtags: #گایدلاین | medium |


### `/episodes/episode-128-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — دقت اسکنرهای داخل دهانی (Trueness & Precision) | اپیزود 128.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — تاثیر سرعت اسکن بر دقت (Scanning Duration) | [/episodes/episode-122-2.html](/episodes/episode-122-2.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اسکنر_داخل_دهانی, #اینسایت, #دقت_اسکن | medium |
| Share Hub — اصول کلیدی برای بهینه‌سازی دقت اسکن داخل دهانی د | [/sharehub/share-2.html](/sharehub/share-2.html) | episode → sharehub | shared keywords: داخل, دهانی; shared hashtags: #اسکنر_داخل_دهانی, #دقت_اسکن | medium |


### `/episodes/episode-128-2.html`

- **Page type:** `episode`
- **Title:** اینسایت — طراحی تراش و مقاومت به شکست (کامپوزیت) | اپیزود 128.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — آنله مستقیم یا غیرمستقیم؟ | [/episodes/episode-123-3.html](/episodes/episode-123-3.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت, #ترمیم_مستقیم, #کامپوزیت | medium |
| اینسایت — شکست زودهنگام ایمپلنت (Early Failure) | [/episodes/episode-130-1.html](/episodes/episode-130-1.html) | episode → episode | shared keywords: اینسایت, شکست; shared hashtags: #اینسایت | medium |
| DentAI – طبقه‌بندی کامپوزیت‌ها بر اساس اندازه ذرات | [/dentai/dentai-6.html](/dentai/dentai-6.html) | episode → dentai | shared keywords: کامپوزیت; shared hashtags: #کامپوزیت | medium |


### `/episodes/episode-128.html`

- **Page type:** `episode`
- **Title:** راهنمای جامع فایبر پست‌ها — (قسمت اول) | اپیزود 128 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| فایبر پست؛ درمانی که بیش از حد جدی گرفته شد | [/metanotes/meta-7.html](/metanotes/meta-7.html) | episode → metanote | shared keywords: fiber post, فایبر; shared hashtags: #فایبر_پست | medium |
| اینسایت — توزیع استرس: پست فایبر یا فلزی؟ | [/episodes/episode-125-3.html](/episodes/episode-125-3.html) | episode → episode | shared keywords: فایبر; shared hashtags: #بیومکانیک, #فایبر_پست | medium |
| راهنمای جامع فایبر پست‌ها — (قسمت دوم) | [/episodes/episode-129.html](/episodes/episode-129.html) | episode → episode | shared keywords: فایبر; shared hashtags: #فایبر_پست | medium |


### `/episodes/episode-129.html`

- **Page type:** `episode`
- **Title:** راهنمای جامع فایبر پست‌ها — (قسمت دوم) | اپیزود 129 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — توزیع استرس: پست فایبر یا فلزی؟ | [/episodes/episode-125-3.html](/episodes/episode-125-3.html) | episode → episode | shared keywords: فایبر; shared hashtags: #فایبر_پست, #پست_و_کور | medium |
| راهنمای جامع فایبر پست‌ها — (قسمت اول) | [/episodes/episode-128.html](/episodes/episode-128.html) | episode → episode | shared keywords: فایبر; shared hashtags: #فایبر_پست | medium |
| فایبر پست؛ درمانی که بیش از حد جدی گرفته شد | [/metanotes/meta-7.html](/metanotes/meta-7.html) | episode → metanote | shared keywords: فایبر; shared hashtags: #فایبر_پست | medium |


### `/episodes/episode-130-1.html`

- **Page type:** `episode`
- **Title:** اینسایت — شکست زودهنگام ایمپلنت (Early Failure) | اپیزود 130.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — زیرکونیا یا PFM در ایمپلنت خلفی؟ | [/episodes/episode-125-1.html](/episodes/episode-125-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — اسکرو یا سمان و بیماری‌های پری‌ایمپلنت | [/episodes/episode-122-1.html](/episodes/episode-122-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — ایمپلنت‌های خواب (Sleeping Implants) | [/episodes/episode-123-5.html](/episodes/episode-123-5.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-130.html`

- **Page type:** `episode`
- **Title:** Zero Bone Loss — پروفایل ظهور (Emergence Profile) | اپیزود 130 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| Zero Bone Loss — بخش پروتزی (قسمت سوم) | [/episodes/episode-112.html](/episodes/episode-112.html) | episode → episode | shared keywords: bone, emergence profile, loss, zero, زیرو بون لاس; shared hashtags: #zeroboneloss | medium |
| Zero Bone Loss — بخش پروتزی (قسمت دوم) | [/episodes/episode-111.html](/episodes/episode-111.html) | episode → episode | shared keywords: bone, loss, zero, زیرو بون لاس; shared hashtags: #zeroboneloss, #تحلیل_استخوان | medium |


### `/episodes/episode-131.html`

- **Page type:** `episode`
- **Title:** اکلوژن در بازسازی‌ها: کانین رایز یا گروپ فانکشن؟ (قسمت اول) | اپیزود 131 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی  ⇆reciprocal | [/chairside/chairside-15.html](/chairside/chairside-15.html) | episode → chairside | shared keywords: اکلوژن, رایز, کانین, گروپ; shared hashtags: #اکلوژن; ⇆ target already links here — missing reciprocal | **high** |
| در بازسازی اکلوژن گروپ فانکشن حواستون به تداخل سمت کارگر باش | [/dentcast-plus/video-6.html](/dentcast-plus/video-6.html) | episode → dentcast_plus | shared keywords: group function, اکلوژن, بازسازی, گروپ; shared hashtags: #اکلوژن | medium |
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | episode → insight | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |
| کراس‌مانت (Cross-Mounting) در پروتزهای وسیع: چرا باید موقتی‌ | [/insight/insight-2.html](/insight/insight-2.html) | episode → insight | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |


### `/episodes/episode-132.html`

- **Page type:** `episode`
- **Title:** اکلوژن در بازسازی‌ها: کانین رایز یا گروپ فانکشن؟ (قسمت دوم) | اپیزود 132 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی  ⇆reciprocal | [/chairside/chairside-15.html](/chairside/chairside-15.html) | episode → chairside | shared keywords: اکلوژن, رایز, کانین, گروپ; shared hashtags: #اکلوژن, #کانین_رایز, #گروپ_فانکشن; ⇆ target already links here — missing reciprocal | **high** |
| در بازسازی اکلوژن گروپ فانکشن حواستون به تداخل سمت کارگر باش | [/dentcast-plus/video-6.html](/dentcast-plus/video-6.html) | episode → dentcast_plus | shared keywords: اکلوژن, بازسازی, گروپ; shared hashtags: #اکلوژن | medium |
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | episode → insight | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |
| کراس‌مانت (Cross-Mounting) در پروتزهای وسیع: چرا باید موقتی‌ | [/insight/insight-2.html](/insight/insight-2.html) | episode → insight | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |


### `/episodes/episode-133.html`

- **Page type:** `episode`
- **Title:** افزایش دقت اسکن در ایمپلنت (Scan Bodies) | اپیزود 133 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Share Hub — اصول کلیدی برای بهینه‌سازی دقت اسکن داخل دهانی د | [/sharehub/share-2.html](/sharehub/share-2.html) | episode → sharehub | shared keywords: اسکن; shared hashtags: #ایمپلنت_دیجیتال, #دقت_اسکن | medium |
| اینسایت — تاثیر سرعت اسکن بر دقت (Scanning Duration) | [/episodes/episode-122-2.html](/episodes/episode-122-2.html) | episode → episode | shared keywords: اسکن, دیجیتال ایمپلنت; shared hashtags: #دقت_اسکن | medium |


### `/episodes/episode-134.html`

- **Page type:** `episode`
- **Title:** گایدلاین‌های درمان پوسیدگی (MID) — قسمت اول | اپیزود 134 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | [/episodes/episode-65.html](/episodes/episode-65.html) | episode → episode | shared keywords: برداشت پوسیدگی, پوسیدگی; shared hashtags: #پوسیدگی | medium |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: پوسیدگی; shared hashtags: #پوسیدگی | medium |
| ضایعات سرویکال (NCCL) — گایدلاین درمانی (قسمت سوم) | [/episodes/episode-127.html](/episodes/episode-127.html) | episode → episode | shared keywords: گایدلاین; shared hashtags: #گایدلاین | medium |


### `/episodes/episode-135.html`

- **Page type:** `episode`
- **Title:** گایدلاین‌های درمان پوسیدگی (MID) — قسمت دوم | اپیزود 135 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: پوسیدگی; shared hashtags: #پوسیدگی | medium |
| ضایعات سرویکال (NCCL) — گایدلاین درمانی (قسمت سوم) | [/episodes/episode-127.html](/episodes/episode-127.html) | episode → episode | shared keywords: گایدلاین; shared hashtags: #گایدلاین | medium |
| گایدلاین ترمیم‌های خلفی — (قسمت اول) | [/episodes/episode-121.html](/episodes/episode-121.html) | episode → episode | shared keywords: گایدلاین; shared hashtags: #گایدلاین | medium |


### `/episodes/episode-136.html`

- **Page type:** `episode`
- **Title:** آماده‌سازی سطح سرامیک‌ها (Surface Treatment) | اپیزود 136 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آماده‌سازی سطحی سرامیک (قسمت اول) | [/notecast/episode-9.html](/notecast/episode-9.html) | episode → notecast | shared keywords: سرامیک; shared hashtags: #باندینگ_سرامیک | **high** |
| آماده‌سازی سطح سرامیک‌ها – بخش اول | [/episodes/episode-9.html](/episodes/episode-9.html) | episode → episode | shared keywords: surface treatment, سرامیک | medium |


### `/episodes/episode-137.html`

- **Page type:** `episode`
- **Title:** ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت اول | اپیزود 137 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| گایدلاین ترمیم‌های خلفی — (قسمت دوم) | [/episodes/episode-122.html](/episodes/episode-122.html) | episode → episode | shared keywords: خلفی; shared hashtags: #ترمیم_غیرمستقیم | medium |
| گایدلاین ترمیم‌های خلفی — (قسمت سوم) | [/episodes/episode-123.html](/episodes/episode-123.html) | episode → episode | shared keywords: خلفی; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-139.html`

- **Page type:** `episode`
- **Title:** متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | اپیزود 139 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| زمان لود ایمپلنت و Marginal Bone Loss | [/notecast/episode-26.html](/notecast/episode-26.html) | episode → notecast | shared keywords: bone, loss | **high** |
| Zero Bone Loss — انتخاب اباتمنت (قسمت چهارم) | [/episodes/episode-115.html](/episodes/episode-115.html) | episode → episode | shared keywords: biocompatibility, bone, loss, zero; shared hashtags: #zeroboneloss, #متریال_پروتزی | medium |


### `/episodes/episode-14.html`

- **Page type:** `episode`
- **Title:** افزایش Vertical Dimension | اپیزود 14 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Vertical Dimension of Occlusion | [/glossary/vertical-dimension-of-occlusion.html](/glossary/vertical-dimension-of-occlusion.html) | episode → glossary | shared keywords: dimension, vertical | **high** |
| Vertical Dimension of Occlusion – Myth 1 | [/episodes/episode-154.html](/episodes/episode-154.html) | episode → episode | shared keywords: dimension, vertical; shared hashtags: #اکلوژن | medium |
| Vertical Dimension of Occlusion – Myths & Evidence (Part 2) | [/episodes/episode-155.html](/episodes/episode-155.html) | episode → episode | shared keywords: dimension, vertical; shared hashtags: #اکلوژن | medium |


### `/episodes/episode-140.html`

- **Page type:** `episode`
- **Title:** متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت دوم | اپیزود 140 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| زمان لود ایمپلنت و Marginal Bone Loss | [/notecast/episode-26.html](/notecast/episode-26.html) | episode → notecast | shared keywords: bone, loss | **high** |
| Zero Bone Loss — بخش پروتزی (قسمت دوم) | [/episodes/episode-111.html](/episodes/episode-111.html) | episode → episode | shared keywords: bone, loss, zero, پروتزی; shared hashtags: #zeroboneloss, #پروتز_ایمپلنت | medium |


### `/episodes/episode-141.html`

- **Page type:** `episode`
- **Title:** متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت سوم | اپیزود 141 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| زمان لود ایمپلنت و Marginal Bone Loss | [/notecast/episode-26.html](/notecast/episode-26.html) | episode → notecast | shared keywords: bone, loss | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | [/episodes/episode-139.html](/episodes/episode-139.html) | episode → episode | shared keywords: bone, loss, zero, روکش, متریال | medium |


### `/episodes/episode-142.html`

- **Page type:** `episode`
- **Title:** داستان TMD: از داوسون تا اوکیسون — قسمت اول | اپیزود 142 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| داستان TMD: از داوسون تا اوکیسون — قسمت سوم | [/episodes/episode-144.html](/episodes/episode-144.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون, فلسفه اکلوژن; shared hashtags: #tmd, #اوکیسون, #اکلوژن | **high** |
| داستان TMD: از داوسون تا اوکیسون — قسمت چهارم | [/episodes/episode-145.html](/episodes/episode-145.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |


### `/episodes/episode-143-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — برندینگ در دندانپزشکی (Practice Branding) | اپیزود 143.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — اصطلاحات لوپ‌های دندانپزشکی | [/episodes/episode-109-1.html](/episodes/episode-109-1.html) | episode → episode | shared keywords: دنتوپدیا, دندانپزشکی; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — دندانپزشکی دیجیتال: نگاهی عمیق | [/episodes/episode-149-2.html](/episodes/episode-149-2.html) | episode → episode | shared keywords: دنتوپدیا, دندانپزشکی; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-143.html`

- **Page type:** `episode`
- **Title:** داستان TMD: از داوسون تا اوکیسون — قسمت دوم | اپیزود 143 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| داستان TMD: از داوسون تا اوکیسون — قسمت سوم | [/episodes/episode-144.html](/episodes/episode-144.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |
| داستان TMD: از داوسون تا اوکیسون — قسمت چهارم | [/episodes/episode-145.html](/episodes/episode-145.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |


### `/episodes/episode-144-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — کانسپت All-on-4 | اپیزود 144.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — صفر تا صد اوردنچرها | [/episodes/episode-147-6.html](/episodes/episode-147-6.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #اوردنچر, #دنتوپدیا | medium |
| دنتوپدیا — ایمپلنت‌های زایگوماتیک و طبقه‌بندی ZAGA | [/episodes/episode-147-8.html](/episodes/episode-147-8.html) | episode → episode | shared keywords: بازسازی فک, دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — کانسپت شهابیان (Smart Vent Crown) | [/episodes/episode-148-2.html](/episodes/episode-148-2.html) | episode → episode | shared keywords: دنتوپدیا, کانسپت; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-144-2.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — فوتوگرامتری در اسکن فول آرچ | اپیزود 144.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — ایمپلنت‌های ساب‌-پریوستئال مدرن | [/episodes/episode-147-9.html](/episodes/episode-147-9.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — دندانپزشکی دیجیتال: نگاهی عمیق | [/episodes/episode-149-2.html](/episodes/episode-149-2.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دندانپزشکی_دیجیتال | medium |
| Insight 40 — مدیریت خونریزی پیش از اسکن: پیش‌نیاز ثبت دقیق م | [/insight/insight-40.html](/insight/insight-40.html) | episode → insight | shared keywords: اسکن; shared hashtags: #دندانپزشکی_دیجیتال | medium |


### `/episodes/episode-144.html`

- **Page type:** `episode`
- **Title:** داستان TMD: از داوسون تا اوکیسون — قسمت سوم | اپیزود 144 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| داستان TMD: از داوسون تا اوکیسون — قسمت اول | [/episodes/episode-142.html](/episodes/episode-142.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون, فلسفه اکلوژن; shared hashtags: #tmd, #اوکیسون, #اکلوژن | **high** |
| داستان TMD: از داوسون تا اوکیسون — قسمت دوم | [/episodes/episode-143.html](/episodes/episode-143.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |
| داستان TMD: از داوسون تا اوکیسون — قسمت چهارم | [/episodes/episode-145.html](/episodes/episode-145.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |


### `/episodes/episode-145.html`

- **Page type:** `episode`
- **Title:** داستان TMD: از داوسون تا اوکیسون — قسمت چهارم | اپیزود 145 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| داستان TMD: از داوسون تا اوکیسون — قسمت دوم | [/episodes/episode-143.html](/episodes/episode-143.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |
| داستان TMD: از داوسون تا اوکیسون — قسمت اول | [/episodes/episode-142.html](/episodes/episode-142.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |
| داستان TMD: از داوسون تا اوکیسون — قسمت سوم | [/episodes/episode-144.html](/episodes/episode-144.html) | episode → episode | shared keywords: اوکیسون, داستان, داوسون; shared hashtags: #tmd, #اکلوژن | medium |


### `/episodes/episode-146.html`

- **Page type:** `episode`
- **Title:** زیرکونیا بدون زیرکونیا (Zero Bone Loss) — قسمت اول | اپیزود 146 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | [/episodes/episode-139.html](/episodes/episode-139.html) | episode → episode | shared keywords: bone, loss, zero; shared hashtags: #zeroboneloss, #زیرکونیا | medium |
| Zero Bone Loss — بخش پروتزی (قسمت سوم) | [/episodes/episode-112.html](/episodes/episode-112.html) | episode → episode | shared keywords: bone, loss, zero; shared hashtags: #zeroboneloss | medium |


### `/episodes/episode-147-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — سیستم BPS در دنچر کامل | اپیزود 147.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — دنچرهای بدون فلنج (Flangeless Denture) | [/episodes/episode-118-1.html](/episodes/episode-118-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دنچر, #پروتز_متحرک | medium |
| نمای بیش‌ازحد ریج در بیمار متقاضی دنچر | [/chairside/chairside-8.html](/chairside/chairside-8.html) | episode → chairside | shared keywords: دنچر; shared hashtags: #دنچر, #پروتز_متحرک | medium |
| چرا دنچر پایین(دندان مصنوعی ) لق می‌شود؟ | [/litecast/lite-CAST2.html](/litecast/lite-CAST2.html) | episode → litecast | shared keywords: دنچر; shared hashtags: #دنچر | medium |


### `/episodes/episode-147-2.html`

- **Page type:** `episode`
- **Title:** اینسایت — سیگار و پریودنتیت: ریسک فاکتورهای ایمپلنت | اپیزود 147.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — ایمپلنت‌های خواب (Sleeping Implants) | [/episodes/episode-123-5.html](/episodes/episode-123-5.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — درمان انتهای آزاد (Free-End): ایمپلنت یا پارسیل؟ | [/episodes/episode-126-1.html](/episodes/episode-126-1.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |
| اینسایت — شل شدن پیچ اباتمنت‌های کاستوم (Screw Loosening) | [/episodes/episode-123-6.html](/episodes/episode-123-6.html) | episode → episode | shared keywords: اینسایت; shared hashtags: #اینسایت | medium |


### `/episodes/episode-147-5.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — اسپلینت کردن ایمپلنت به دندان | اپیزود 147.5 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — از بیومکانیک به بیولوژی در ایمپلنت | [/episodes/episode-148-1.html](/episodes/episode-148-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #بیومکانیک, #دنتوپدیا | medium |


### `/episodes/episode-147-6.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — صفر تا صد اوردنچرها | اپیزود 147.6 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — کانسپت All-on-4 | [/episodes/episode-144-1.html](/episodes/episode-144-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #اوردنچر, #دنتوپدیا | medium |
| دنتوپدیا — دنچرهای بدون فلنج (Flangeless Denture) | [/episodes/episode-118-1.html](/episodes/episode-118-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — ملاحظات لبه انسیزال (Incisal Edge) | [/episodes/episode-120-1.html](/episodes/episode-120-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-147-7.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — پست در دندان‌های قدامی (۲۰۱۵-۲۰۲۵) | اپیزود 147.7 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو | [/insight/insight-4.html](/insight/insight-4.html) | episode → insight | shared keywords: قدامی; shared hashtags: #دندان_قدامی | medium |
| دنتوپدیا — اسپلینت کردن ایمپلنت به دندان | [/episodes/episode-147-5.html](/episodes/episode-147-5.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-147-8.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — ایمپلنت‌های زایگوماتیک و طبقه‌بندی ZAGA | اپیزود 147.8 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — کانسپت All-on-4 | [/episodes/episode-144-1.html](/episodes/episode-144-1.html) | episode → episode | shared keywords: بازسازی فک, دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — از بیومکانیک به بیولوژی در ایمپلنت | [/episodes/episode-148-1.html](/episodes/episode-148-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — اسپلینت کردن ایمپلنت به دندان | [/episodes/episode-147-5.html](/episodes/episode-147-5.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-147-9.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — ایمپلنت‌های ساب‌-پریوستئال مدرن | اپیزود 147.9 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — فوتوگرامتری در اسکن فول آرچ | [/episodes/episode-144-2.html](/episodes/episode-144-2.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — دندانپزشکی دیجیتال: نگاهی عمیق | [/episodes/episode-149-2.html](/episodes/episode-149-2.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — از بیومکانیک به بیولوژی در ایمپلنت | [/episodes/episode-148-1.html](/episodes/episode-148-1.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-147.html`

- **Page type:** `episode`
- **Title:** بهترین متریال سوپراجینجیوال (Zero Bone Loss) — قسمت دوم | اپیزود 147 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | episode → glossary | shared keywords: bone, loss, zero | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت سوم | [/episodes/episode-141.html](/episodes/episode-141.html) | episode → episode | shared keywords: bone, loss, zero, متریال; shared hashtags: #زیبایی, #زیرو_بون_لاس | medium |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | [/episodes/episode-139.html](/episodes/episode-139.html) | episode → episode | shared keywords: bone, loss, zero, متریال | medium |


### `/episodes/episode-148-1.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — از بیومکانیک به بیولوژی در ایمپلنت | اپیزود 148.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — اسپلینت کردن ایمپلنت به دندان | [/episodes/episode-147-5.html](/episodes/episode-147-5.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #بیومکانیک, #دنتوپدیا | medium |
| دنتوپدیا — ایمپلنت‌های ساب‌-پریوستئال مدرن | [/episodes/episode-147-9.html](/episodes/episode-147-9.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |
| دنتوپدیا — ایمپلنت‌های زایگوماتیک و طبقه‌بندی ZAGA | [/episodes/episode-147-8.html](/episodes/episode-147-8.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-148-2.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — کانسپت شهابیان (Smart Vent Crown) | اپیزود 148.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Smart Vent Crown (SVC) — تعادل میان زیبایی، ایمنی بیولوژیک و | [/metanotes/meta-10.html](/metanotes/meta-10.html) | episode → metanote | shared keywords: crown, smart, vent; shared hashtags: #smartventcrown, #روکش_ایمپلنت | medium |
| دنتوپدیا — کانسپت All-on-4 | [/episodes/episode-144-1.html](/episodes/episode-144-1.html) | episode → episode | shared keywords: دنتوپدیا, کانسپت; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-148.html`

- **Page type:** `episode`
- **Title:** انتخاب سمان رزینی (لمینیت و اینله) — قسمت اول | اپیزود 148 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| انتخاب سمان رزینی (لمینیت و اینله) — قسمت دوم | [/episodes/episode-149.html](/episodes/episode-149.html) | episode → episode | shared keywords: اینله, رزینی, سمان, لمینیت | medium |
| سمان‌های رزینی: انواع، ویژگی‌ها، مزایا و معایب | [/notecast/episode-3.html](/notecast/episode-3.html) | episode → notecast | shared keywords: resin cement, رزینی, سمان; shared hashtags: #سمان_رزینی | medium |
| ثبات رنگ لمینیت‌های سرامیکی | [/episodes/episode-19.html](/episodes/episode-19.html) | episode → episode | shared keywords: ثبات رنگ, لمینیت; shared hashtags: #لمینیت | medium |


### `/episodes/episode-149-1.html`

- **Page type:** `episode`
- **Title:** اسلایدکست — مبانی هوش مصنوعی برای دندانپزشکان | اپیزود 149.1 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| هوش مصنوعی در دندانپزشکی — مفاهیم پایه | [/episodes/episode-109.html](/episodes/episode-109.html) | episode → episode | shared keywords: آینده دندانپزشکی, مصنوعی, یادگیری ماشین; shared hashtags: #ai, #دندانپزشکی_هوشمند, #هوش_مصنوعی | medium |


### `/episodes/episode-149-2.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — دندانپزشکی دیجیتال: نگاهی عمیق | اپیزود 149.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — فوتوگرامتری در اسکن فول آرچ | [/episodes/episode-144-2.html](/episodes/episode-144-2.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — ایمپلنت‌های ساب‌-پریوستئال مدرن | [/episodes/episode-147-9.html](/episodes/episode-147-9.html) | episode → episode | shared keywords: دنتوپدیا; shared hashtags: #دنتوپدیا, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — اصطلاحات لوپ‌های دندانپزشکی | [/episodes/episode-109-1.html](/episodes/episode-109-1.html) | episode → episode | shared keywords: دنتوپدیا, دندانپزشکی; shared hashtags: #دنتوپدیا | medium |


### `/episodes/episode-149.html`

- **Page type:** `episode`
- **Title:** انتخاب سمان رزینی (لمینیت و اینله) — قسمت دوم | اپیزود 149 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| انتخاب سمان رزینی (لمینیت و اینله) — قسمت اول | [/episodes/episode-148.html](/episodes/episode-148.html) | episode → episode | shared keywords: اینله, رزینی, سمان, لمینیت | medium |
| سمان‌های رزینی: انواع، ویژگی‌ها، مزایا و معایب | [/notecast/episode-3.html](/notecast/episode-3.html) | episode → notecast | shared keywords: رزینی, سمان | medium |


### `/episodes/episode-15.html`

- **Page type:** `episode`
- **Title:** طول عمر آنله‌های سرامیکی | اپیزود 15 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | [/insight/insight-5.html](/insight/insight-5.html) | episode → insight | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |
| ادامه آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش دوم | [/episodes/episode-56.html](/episodes/episode-56.html) | episode → episode | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |
| تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی | [/episodes/episode-12.html](/episodes/episode-12.html) | episode → episode | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |


### `/episodes/episode-150-2.html`

- **Page type:** `episode`
- **Title:** دنتوپدیا — حفظ دندان یا ایمپلنت؟ (یک مناظره) | اپیزود 150.2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — بریج یا ایمپلنت؟ (Bridge vs Implant) | [/episodes/episode-119-1.html](/episodes/episode-119-1.html) | episode → episode | shared keywords: ایمپلنت؟, دنتوپدیا; shared hashtags: #طرح_درمان | medium |


### `/episodes/episode-150.html`

- **Page type:** `episode`
- **Title:** ایمپلنت فوری در ناحیه زیبایی (ITI Consensus 2023) | اپیزود 150 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت فوری چیست؟ | [/litecast/lite-CAST15.html](/litecast/lite-CAST15.html) | episode → litecast | shared keywords: immediate implant, فوری; shared hashtags: #ایمپلنت_فوری | medium |
| اینسایت — روکش موقت فوری و بافت نرم (Esthetic Zone) | [/episodes/episode-125-2.html](/episodes/episode-125-2.html) | episode → episode | shared keywords: فوری; shared hashtags: #ایمپلنت_فوری, #ناحیه_زیبایی | medium |


### `/episodes/episode-151.html`

- **Page type:** `episode`
- **Title:** تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت اول) | اپیزود 151 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت سوم) | [/episodes/episode-153.html](/episodes/episode-153.html) | episode → episode | shared keywords: extraction vs preservation, تصمیم, نگهداری؟, کشیدن; shared hashtags: #نگهداری_دندان, #کشیدن_دندان | **high** |


### `/episodes/episode-153.html`

- **Page type:** `episode`
- **Title:** تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت سوم) | اپیزود 153 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت اول) | [/episodes/episode-151.html](/episodes/episode-151.html) | episode → episode | shared keywords: extraction vs preservation, تصمیم, نگهداری؟, کشیدن; shared hashtags: #نگهداری_دندان, #کشیدن_دندان | **high** |


### `/episodes/episode-154.html`

- **Page type:** `episode`
- **Title:** Vertical Dimension of Occlusion – Myth 1 | اپیزود 154 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| افزایش بعد عمودی (Vertical Dimension): دیدگاه‌های داوسون، شو | [/notecast/episode-14.html](/notecast/episode-14.html) | episode → notecast | shared keywords: dimension, occlusion, vertical; shared hashtags: #اکلوژن | medium |
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | episode → insight | shared keywords: occlusion, اکلوژن; shared hashtags: #اکلوژن | medium |
| کراس‌مانت (Cross-Mounting) در پروتزهای وسیع: چرا باید موقتی‌ | [/insight/insight-2.html](/insight/insight-2.html) | episode → insight | shared keywords: اکلوژن, پروتز ثابت; shared hashtags: #اکلوژن | medium |


### `/episodes/episode-155.html`

- **Page type:** `episode`
- **Title:** Vertical Dimension of Occlusion – Myths & Evidence (Part 2) | اپیزود 155 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| افزایش بعد عمودی (Vertical Dimension): دیدگاه‌های داوسون، شو | [/notecast/episode-14.html](/notecast/episode-14.html) | episode → notecast | shared keywords: dimension, occlusion, vertical; shared hashtags: #vd, #اکلوژن | medium |
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | episode → insight | shared keywords: occlusion, اکلوژن; shared hashtags: #اکلوژن | medium |
| کراس‌مانت (Cross-Mounting) در پروتزهای وسیع: چرا باید موقتی‌ | [/insight/insight-2.html](/insight/insight-2.html) | episode → insight | shared keywords: اکلوژن, پروتز ثابت; shared hashtags: #اکلوژن | medium |


### `/episodes/episode-157.html`

- **Page type:** `episode`
- **Title:** Bio‑Restorative Concept in Implant Dentistry :part2 | اپیزود 157 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نظم در بستن مجدد هیلینگ‌ها: تفاوت کوچک، راحتی بزرگ | [/insight/insight-3.html](/insight/insight-3.html) | episode → insight | shared keywords: healing abutment, هیلینگ اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |
| ایمپلنت فوری چیست؟ | [/litecast/lite-CAST15.html](/litecast/lite-CAST15.html) | episode → litecast | shared keywords: immediate implant; shared hashtags: #ایمپلنت_فوری | medium |


### `/episodes/episode-16.html`

- **Page type:** `episode`
- **Title:** لزوم استفاده از باندینگ روی پرسلن اچ‌شده | اپیزود 16 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام باند` | [Bond Strength](/glossary/bond-strength.html) | … لزوم باندینگ پس از اچ و سایلانیزاسیون پرسلن برای افزایش استحکام باند. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| پل ارتباطی سایلان‌ها در باندینگ سرامیک | [/notecast/episode-10.html](/notecast/episode-10.html) | episode → notecast | shared keywords: باندینگ, سایلان | **high** |
| DentAI – مقایسه ۱۴ ساله باندینگ‌های سلف‌اچ و اچ‌اند‌رینس | [/dentai/dentai-5.html](/dentai/dentai-5.html) | episode → dentai | shared keywords: باندینگ; shared hashtags: #باندینگ | medium |
| DentAI – مقایسه کیور کردن یا نکردن باندینگ پیش از قرار دادن  | [/dentai/dentai-8.html](/dentai/dentai-8.html) | episode → dentai | shared keywords: باندینگ; shared hashtags: #باندینگ | medium |


### `/episodes/episode-17.html`

- **Page type:** `episode`
- **Title:** زیرکونیاهای شفاف – بخش اول | اپیزود 17 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زیرکونیاهای گرادینت مولتی‌لیر — تحولی در زیبایی | [/episodes/episode-107.html](/episodes/episode-107.html) | episode → episode | shared keywords: زیرکونیاهای; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-18.html`

- **Page type:** `episode`
- **Title:** زیرکونیاهای شفاف – بخش دوم | اپیزود 18 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مرور علمی زیرکونیا – بخش اول | [/episodes/episode-87.html](/episodes/episode-87.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |
| آماده‌سازی سطح زیرکونیا | [/episodes/episode-11.html](/episodes/episode-11.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |
| طبقه‌بندی سرامیک‌های دندانی | [/episodes/episode-8.html](/episodes/episode-8.html) | episode → episode | shared keywords: مواد سرامیکی; shared hashtags: #سرامیک | medium |


### `/episodes/episode-19.html`

- **Page type:** `episode`
- **Title:** ثبات رنگ لمینیت‌های سرامیکی | اپیزود 19 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| انتخاب سمان رزینی (لمینیت و اینله) — قسمت اول | [/episodes/episode-148.html](/episodes/episode-148.html) | episode → episode | shared keywords: ثبات رنگ, لمینیت; shared hashtags: #لمینیت | medium |
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | episode → dentai | shared keywords: سرامیکی, لمینیت | medium |
| تراش لمینیت بر اساس ماک‌آپ | [/episodes/episode-38.html](/episodes/episode-38.html) | episode → episode | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |


### `/episodes/episode-2.html`

- **Page type:** `episode`
- **Title:** انواع سمان و اصول سمان‌کردن | اپیزود 2 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | [/insight/insight-5.html](/insight/insight-5.html) | episode → insight | shared keywords: سمان; shared hashtags: #سمان | medium |


### `/episodes/episode-21.html`

- **Page type:** `episode`
- **Title:** ادامهٔ قالب‌گیری دو مرحله‌ای | اپیزود 21 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نکات قالب‌گیری در پروتز ثابت | [/notecast/episode-20.html](/notecast/episode-20.html) | episode → notecast | shared keywords: قالب; shared hashtags: #قالبگیری | **high** |


### `/episodes/episode-23.html`

- **Page type:** `episode`
- **Title:** اثر اورلود اکلوزالی بر تحلیل استخوان ایمپلنت | اپیزود 23 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زمان بارگذاری و تحلیل استخوان ایمپلنت | [/episodes/episode-26.html](/episodes/episode-26.html) | episode → episode | shared keywords: استخوان, تحلیل استخوان; shared hashtags: #استخوان | **high** |


### `/episodes/episode-26.html`

- **Page type:** `episode`
- **Title:** زمان بارگذاری و تحلیل استخوان ایمپلنت | اپیزود 26 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اثر اورلود اکلوزالی بر تحلیل استخوان ایمپلنت | [/episodes/episode-23.html](/episodes/episode-23.html) | episode → episode | shared keywords: استخوان, تحلیل استخوان; shared hashtags: #استخوان | **high** |


### `/episodes/episode-27.html`

- **Page type:** `episode`
- **Title:** مقایسهٔ اتچمنت‌ها در اوردنچر | اپیزود 27 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| شروع Learning Pathway – انتخاب اتچمنت در اوردنچر | [/episodes/episode-50.html](/episodes/episode-50.html) | episode → episode | shared keywords: اتچمنت, اوردنچر; shared hashtags: #اتچمنت, #اوردنچر | **high** |
| ادامه مسیر انتخاب اتچمنت برای اوردنچر | [/episodes/episode-51.html](/episodes/episode-51.html) | episode → episode | shared keywords: اتچمنت, اوردنچر; shared hashtags: #اتچمنت, #اوردنچر | **high** |
| نبود اکلوژن خلفی؛ مانعی پنهان برای اوردنچر فک بالا | [/chairside/chairside-11.html](/chairside/chairside-11.html) | episode → chairside | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |


### `/episodes/episode-28.html`

- **Page type:** `episode`
- **Title:** طراحی لبخند و قوانین مک‌لارن | اپیزود 28 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| کانسپت Facial Flow در طراحی لبخند | [/episodes/episode-46.html](/episodes/episode-46.html) | episode → episode | shared keywords: طراحی, طراحی لبخند, لبخند; shared hashtags: #زیبایی, #طراحی_لبخند | **high** |
| Global Diagnosis — آنالیز لبخند (قسمت سوم) | [/episodes/episode-118.html](/episodes/episode-118.html) | episode → episode | shared keywords: طراحی لبخند, لبخند | medium |


### `/episodes/episode-29.html`

- **Page type:** `episode`
- **Title:** طبقه‌بندی جدید سرامیک‌ها | اپیزود 29 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طبقه‌بندی سرامیک‌های دندانی | [/episodes/episode-8.html](/episodes/episode-8.html) | episode → episode | shared keywords: سرامیک, طبقه; shared hashtags: #سرامیک | medium |


### `/episodes/episode-3.html`

- **Page type:** `episode`
- **Title:** ادامهٔ مباحث سمان‌ها | اپیزود 3 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | [/insight/insight-5.html](/insight/insight-5.html) | episode → insight | shared keywords: سمان, سمان رزینی; shared hashtags: #سمان | medium |
| اینسایت — سمیت سمان‌ها برای بافت نرم ایمپلنت | [/episodes/episode-122-6.html](/episodes/episode-122-6.html) | episode → episode | shared keywords: سمان, سمان رزینی | medium |


### `/episodes/episode-30.html`

- **Page type:** `episode`
- **Title:** سرامیک‌های پلی‌کریستالین و ماتریکس رزینی | اپیزود 30 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سرامیک‌های پلی‌کریستالین` | [Polycrystalline Ceramics](/glossary/polycrystalline-ceramics.html) | ادامهٔ بحث سرامیک‌ها با تمرکز بر ساختار، کاربرد و انتخاب سرامیک‌های پلی‌کریستالین و رزینی. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طبقه‌بندی سرامیک‌های دندانی | [/episodes/episode-8.html](/episodes/episode-8.html) | episode → episode | shared keywords: سرامیک; shared hashtags: #سرامیک | medium |


### `/episodes/episode-33.html`

- **Page type:** `episode`
- **Title:** ادامهٔ بحث اسنپ‌آن اسمایل | اپیزود 33 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اسنپ آن اسمایل یا  snap on smile  قسمت اول | [/notecast/episode-32.html](/notecast/episode-32.html) | episode → notecast | shared keywords: اسمایل, اسنپ; shared hashtags: #زیبایی | **high** |


### `/episodes/episode-36.html`

- **Page type:** `episode`
- **Title:** چالش‌های باند به عاج ریشه | اپیزود 36 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | … کردن پست به عاج ریشه و عوامل مؤثر بر کاهش قدرت باند. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 20 — وقتی به درمان ریشه مطمئن نیستیم، طراحی کور و پس | [/insight/insight-20.html](/insight/insight-20.html) | episode → insight | shared keywords: ریشه; shared hashtags: #پست_و_کور | medium |
| باند به کامپوزیت قدیمی | [/episodes/episode-44.html](/episodes/episode-44.html) | episode → episode | shared keywords: باند; shared hashtags: #باندینگ | medium |
| آماده‌سازی سطحی فایبرپست و استحکام باند | [/episodes/episode-42.html](/episodes/episode-42.html) | episode → episode | shared keywords: باند; shared hashtags: #باندینگ | medium |


### `/episodes/episode-37.html`

- **Page type:** `episode`
- **Title:** اندیکاسیون‌های باز کردن کانتکت در تراش لمینیت | اپیزود 37 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | episode → dentai | shared keywords: تراش, لمینیت | medium |
| ثبات رنگ لمینیت‌های سرامیکی | [/episodes/episode-19.html](/episodes/episode-19.html) | episode → episode | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |
| Insight 37 — پریدگی دیستال لمینیت لترال: تداخل فانکشنال پنها | [/insight/insight-37.html](/insight/insight-37.html) | episode → insight | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |


### `/episodes/episode-38.html`

- **Page type:** `episode`
- **Title:** تراش لمینیت بر اساس ماک‌آپ | اپیزود 38 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | episode → dentai | shared keywords: تراش, لمینیت | medium |
| ثبات رنگ لمینیت‌های سرامیکی | [/episodes/episode-19.html](/episodes/episode-19.html) | episode → episode | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |
| Insight 37 — پریدگی دیستال لمینیت لترال: تداخل فانکشنال پنها | [/insight/insight-37.html](/insight/insight-37.html) | episode → insight | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |


### `/episodes/episode-39.html`

- **Page type:** `episode`
- **Title:** Black Triangle و اصلاح زیبایی آن | اپیزود 39 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| تصمیم‌گیری زیبایی در حضور دیاستم | [/chairside/chairside-1.html](/chairside/chairside-1.html) | episode → chairside | shared keywords: زیبایی; shared hashtags: #لمینیت | medium |
| چرا پیش‌آگهی‌های ذکر شده در مقالات برای دندانهای درمان پریو  | [/metanotes/meta-1.html](/metanotes/meta-1.html) | episode → metanote | shared keywords: زیبایی; shared hashtags: #لمینیت | medium |
| عوامل مؤثر بر رنگ نهایی در درمان‌های زیبایی | [/episodes/episode-68.html](/episodes/episode-68.html) | episode → episode | shared keywords: زیبایی; shared hashtags: #زیبایی | medium |


### `/episodes/episode-4.html`

- **Page type:** `episode`
- **Title:** نسل‌های مختلف باندینگ | اپیزود 4 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه ۱۴ ساله باندینگ‌های سلف‌اچ و اچ‌اند‌رینس | [/dentai/dentai-5.html](/dentai/dentai-5.html) | episode → dentai | shared keywords: باندینگ; shared hashtags: #باندینگ, #بیومیمتیک | medium |
| باندینگ به دنتین ریشه — پروتکل‌های موثر | [/episodes/episode-101.html](/episodes/episode-101.html) | episode → episode | shared keywords: باندینگ; shared hashtags: #ادهزیو, #باندینگ | medium |
| DentAI – مقایسه کیور کردن یا نکردن باندینگ پیش از قرار دادن  | [/dentai/dentai-8.html](/dentai/dentai-8.html) | episode → dentai | shared keywords: باندینگ; shared hashtags: #باندینگ | medium |


### `/episodes/episode-42.html`

- **Page type:** `episode`
- **Title:** آماده‌سازی سطحی فایبرپست و استحکام باند | اپیزود 42 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام باند` | [Bond Strength](/glossary/bond-strength.html) | توضیح روش‌های مختلف آماده‌سازی سطح فایبرپست و تأثیر آن بر استحکام باند با کامپوزیت رزینی. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چالش‌های باند به عاج ریشه | [/episodes/episode-36.html](/episodes/episode-36.html) | episode → episode | shared keywords: باند; shared hashtags: #باندینگ | medium |


### `/episodes/episode-43.html`

- **Page type:** `episode`
- **Title:** مقایسهٔ آماده‌سازی فایبرپست برای سمان‌های سلف‌ادهزیو | اپیزود 43 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سمان‌های سلف‌ادهزیو` | [Self-Adhesive Cements](/glossary/self-adhesive-cements.html) | مقایسهٔ انواع آماده‌سازی سطحی فایبرپست جهت سمان‌کردن با سمان‌های سلف‌ادهزیو و نتایج حاصل. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آماده‌سازی سطح زیرکونیا قبل از سمان کردن | [/notecast/episode-11.html](/notecast/episode-11.html) | episode → notecast | shared keywords: سمان; shared hashtags: #سمان_رزینی | **high** |


### `/episodes/episode-44.html`

- **Page type:** `episode`
- **Title:** باند به کامپوزیت قدیمی | اپیزود 44 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه کیور کردن یا نکردن باندینگ پیش از قرار دادن  | [/dentai/dentai-8.html](/dentai/dentai-8.html) | episode → dentai | shared keywords: کامپوزیت; shared hashtags: #باندینگ, #کامپوزیت | medium |
| چالش‌های باند به عاج ریشه | [/episodes/episode-36.html](/episodes/episode-36.html) | episode → episode | shared keywords: باند; shared hashtags: #باندینگ | medium |
| تفاوت لمینت سرامیکی و کامپوزیت دندان چیست؟ (و کدام بهتر است؟ | [/litecast/lite-CAST7.html](/litecast/lite-CAST7.html) | episode → litecast | shared keywords: کامپوزیت; shared hashtags: #کامپوزیت | medium |


### `/episodes/episode-46.html`

- **Page type:** `episode`
- **Title:** کانسپت Facial Flow در طراحی لبخند | اپیزود 46 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طراحی لبخند و قوانین مک‌لارن | [/episodes/episode-28.html](/episodes/episode-28.html) | episode → episode | shared keywords: طراحی, طراحی لبخند, لبخند; shared hashtags: #زیبایی, #طراحی_لبخند | **high** |
| اصول آنالیز و طراحی لبخند؛ قوانین McLaren | [/notecast/episode-28.html](/notecast/episode-28.html) | episode → notecast | shared keywords: طراحی, طراحی لبخند; shared hashtags: #طراحی_لبخند | medium |


### `/episodes/episode-47.html`

- **Page type:** `episode`
- **Title:** مقدمه‌ای بر Ferrule – بخش اول | اپیزود 47 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو ⇆reciprocal | [/insight/insight-4.html](/insight/insight-4.html) | episode → insight | shared keywords: ferrule effect; shared hashtags: #فرول; ⇆ target already links here — missing reciprocal | medium |
| پایان بحث Ferrule – بخش سوم | [/episodes/episode-49.html](/episodes/episode-49.html) | episode → episode | shared keywords: ferrule; shared hashtags: #فرول, #پست_و_کور | **high** |
| پست خم شد؛ همان جایی که فرول وجود ندارد | [/chairside/chairside-5.html](/chairside/chairside-5.html) | episode → chairside | shared keywords: ferrule effect; shared hashtags: #فرول, #پست_و_کور | medium |
| فرول؛ یکی از مهم‌ترین پایه‌های یک درمان موفق | [/chairside/chairside-6.html](/chairside/chairside-6.html) | episode → chairside | shared keywords: ferrule effect; shared hashtags: #فرول | medium |


### `/episodes/episode-48.html`

- **Page type:** `episode`
- **Title:** بررسی Ferrule – بخش دوم | اپیزود 48 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو | [/insight/insight-4.html](/insight/insight-4.html) | episode → insight | shared keywords: فرول; shared hashtags: #فرول | medium |
| پست خم شد؛ همان جایی که فرول وجود ندارد | [/chairside/chairside-5.html](/chairside/chairside-5.html) | episode → chairside | shared keywords: فرول; shared hashtags: #فرول | medium |


### `/episodes/episode-49.html`

- **Page type:** `episode`
- **Title:** پایان بحث Ferrule – بخش سوم | اپیزود 49 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقدمه‌ای بر Ferrule – بخش اول | [/episodes/episode-47.html](/episodes/episode-47.html) | episode → episode | shared keywords: ferrule; shared hashtags: #فرول, #پست_و_کور | **high** |


### `/episodes/episode-5.html`

- **Page type:** `episode`
- **Title:** باندینگ‌های یونیورسال | اپیزود 5 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه ۱۴ ساله باندینگ‌های سلف‌اچ و اچ‌اند‌رینس | [/dentai/dentai-5.html](/dentai/dentai-5.html) | episode → dentai | shared keywords: باندینگ; shared hashtags: #باندینگ, #بیومیمتیک | medium |
| باندینگ به دنتین ریشه — پروتکل‌های موثر | [/episodes/episode-101.html](/episodes/episode-101.html) | episode → episode | shared keywords: باندینگ; shared hashtags: #ادهزیو, #باندینگ | medium |
| DentAI – مقایسه کیور کردن یا نکردن باندینگ پیش از قرار دادن  | [/dentai/dentai-8.html](/dentai/dentai-8.html) | episode → dentai | shared keywords: باندینگ; shared hashtags: #باندینگ | medium |


### `/episodes/episode-50.html`

- **Page type:** `episode`
- **Title:** شروع Learning Pathway – انتخاب اتچمنت در اوردنچر | اپیزود 50 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقایسهٔ اتچمنت‌ها در اوردنچر | [/episodes/episode-27.html](/episodes/episode-27.html) | episode → episode | shared keywords: اتچمنت, اوردنچر; shared hashtags: #اتچمنت, #اوردنچر | **high** |
| نبود اکلوژن خلفی؛ مانعی پنهان برای اوردنچر فک بالا | [/chairside/chairside-11.html](/chairside/chairside-11.html) | episode → chairside | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |
| پروتکل لودینگ ایمپلنت در اوردنچر | [/episodes/episode-52.html](/episodes/episode-52.html) | episode → episode | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |


### `/episodes/episode-51.html`

- **Page type:** `episode`
- **Title:** ادامه مسیر انتخاب اتچمنت برای اوردنچر | اپیزود 51 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقایسهٔ اتچمنت‌ها در اوردنچر | [/episodes/episode-27.html](/episodes/episode-27.html) | episode → episode | shared keywords: اتچمنت, اوردنچر; shared hashtags: #اتچمنت, #اوردنچر | **high** |
| نبود اکلوژن خلفی؛ مانعی پنهان برای اوردنچر فک بالا | [/chairside/chairside-11.html](/chairside/chairside-11.html) | episode → chairside | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |


### `/episodes/episode-53.html`

- **Page type:** `episode`
- **Title:** آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | اپیزود 53 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: بیومیمتیک, دندانپزشکی; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | episode → episode | shared keywords: اصول بیومیمتیک, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک — مرور فصل یک (قسمت سوم) | [/episodes/episode-92.html](/episodes/episode-92.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-54.html`

- **Page type:** `episode`
- **Title:** ادامه مبحث بیومیمتیک – بخش دوم | اپیزود 54 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک — مرور فصل یک (قسمت سوم) | [/episodes/episode-92.html](/episodes/episode-92.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | **high** |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| DentAI -انواع ترک مینایی تشخیص و درمان ترمیمی | [/dentai/dentai-1.html](/dentai/dentai-1.html) | episode → dentai | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-55.html`

- **Page type:** `episode`
- **Title:** آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش اول | اپیزود 55 | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `رستوریشن‌های سرامیکی` | [Dental Ceramics](/glossary/dental-ceramics.html) | … اورلی باندشونده و یک پروتکل ساده برای افزایش طول عمر رستوریشن‌های سرامیکی. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| پروتکل‌های عملی در آماده‌سازی اورلی‌های سرامیکی | [/episodes/episode-57.html](/episodes/episode-57.html) | episode → episode | shared keywords: اورلی, سرامیکی; shared hashtags: #اورلی, #بیومیمتیک, #سرامیک | **high** |
| پایان مبحث اورلی – نکات عملی نهایی | [/episodes/episode-58.html](/episodes/episode-58.html) | episode → episode | shared keywords: اورلی; shared hashtags: #اورلی, #سرامیک | medium |


### `/episodes/episode-56.html`

- **Page type:** `episode`
- **Title:** ادامه آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش دوم | اپیزود 56 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| پایان مبحث اورلی – نکات عملی نهایی | [/episodes/episode-58.html](/episodes/episode-58.html) | episode → episode | shared keywords: اورلی; shared hashtags: #اورلی, #سرامیک | medium |
| چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | [/insight/insight-5.html](/insight/insight-5.html) | episode → insight | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |


### `/episodes/episode-57.html`

- **Page type:** `episode`
- **Title:** پروتکل‌های عملی در آماده‌سازی اورلی‌های سرامیکی | اپیزود 57 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش اول | [/episodes/episode-55.html](/episodes/episode-55.html) | episode → episode | shared keywords: اورلی, سرامیکی; shared hashtags: #اورلی, #بیومیمتیک, #سرامیک | **high** |
| پروتکل پاکسازی آلودگی‌ها از سطح رستوریشن‌های گلاس سرامیکی | [/notecast/episode-12.html](/notecast/episode-12.html) | episode → notecast | shared keywords: سرامیکی, پروتکل; shared hashtags: #بیومیمتیک, #سرامیک | medium |
| چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | [/insight/insight-5.html](/insight/insight-5.html) | episode → insight | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |


### `/episodes/episode-58.html`

- **Page type:** `episode`
- **Title:** پایان مبحث اورلی – نکات عملی نهایی | اپیزود 58 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامه آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش دوم | [/episodes/episode-56.html](/episodes/episode-56.html) | episode → episode | shared keywords: اورلی; shared hashtags: #اورلی, #سرامیک | medium |
| آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش اول | [/episodes/episode-55.html](/episodes/episode-55.html) | episode → episode | shared keywords: اورلی; shared hashtags: #اورلی, #سرامیک | medium |


### `/episodes/episode-59.html`

- **Page type:** `episode`
- **Title:** عوامل مؤثر بر تحلیل استخوان مارژینال اطراف ایمپلنت | اپیزود 59 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اورلود اکلوزالی و تحلیل استخوان اطراف ایمپلنت‌ها؛ واقعیت چیس | [/notecast/episode-23.html](/notecast/episode-23.html) | episode → notecast | shared keywords: استخوان; shared hashtags: #تحلیل_استخوان | **high** |


### `/episodes/episode-6.html`

- **Page type:** `episode`
- **Title:** Immediate Dentin Sealing (IDS) | اپیزود 6 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Immediate Dentin Sealing | [/glossary/immediate-dentin-sealing.html](/glossary/immediate-dentin-sealing.html) | episode → glossary | shared keywords: dentin, immediate, sealing | **high** |
| Dentin Sealing | [/glossary/dentin-sealing.html](/glossary/dentin-sealing.html) | episode → glossary | shared keywords: dentin, sealing | **high** |


### `/episodes/episode-60.html`

- **Page type:** `episode`
- **Title:** اکلوژن در درمان‌های ایمپلنت – با حضور دکتر الله‌بخشی | اپیزود 60 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | episode → insight | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |


### `/episodes/episode-61.html`

- **Page type:** `episode`
- **Title:** بلیچینگ و اینترنال بلیچینگ – با دکتر دریاکناری | اپیزود 61 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آفیس بلیچ و هوم بلیچ – با دکتر دریاکناری | [/episodes/episode-70.html](/episodes/episode-70.html) | episode → episode | shared keywords: دریاکناری, دکتر; shared hashtags: #بلیچینگ, #زیبایی | medium |
| عوامل مؤثر بر رنگ نهایی در درمان‌های زیبایی | [/episodes/episode-68.html](/episodes/episode-68.html) | episode → episode | shared keywords: درمان‌های زیبایی; shared hashtags: #زیبایی | medium |
| فایبر پست – نکات کلینیکی با دکتر دریاکناری | [/episodes/episode-79.html](/episodes/episode-79.html) | episode → episode | shared keywords: دریاکناری, دکتر | medium |


### `/episodes/episode-62.html`

- **Page type:** `episode`
- **Title:** اثر رشد فکین بر نتایج بلندمدت ایمپلنت – بخش اول | اپیزود 62 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اثر رشد فکین بر ایمپلنت – بخش پایانی | [/episodes/episode-64.html](/episodes/episode-64.html) | episode → episode | shared keywords: تغییرات فکی, فکین; shared hashtags: #رشد_فک | **high** |


### `/episodes/episode-64.html`

- **Page type:** `episode`
- **Title:** اثر رشد فکین بر ایمپلنت – بخش پایانی | اپیزود 64 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اثر رشد فکین بر نتایج بلندمدت ایمپلنت – بخش اول | [/episodes/episode-62.html](/episodes/episode-62.html) | episode → episode | shared keywords: تغییرات فکی, فکین; shared hashtags: #رشد_فک | **high** |


### `/episodes/episode-65.html`

- **Page type:** `episode`
- **Title:** Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | اپیزود 65 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – برداشت پوسیدگی از Peripheral Seal Zone (PSZ) و CRE | [/dentai/dentai-11.html](/dentai/dentai-11.html) | episode → dentai | shared keywords: peripheral, peripheral seal zone, seal, zone, برداشت; shared hashtags: #بیومیمتیک | **high** |
| Peripheral Seal Zone – پایان مقاله | [/episodes/episode-67.html](/episodes/episode-67.html) | episode → episode | shared keywords: peripheral, seal, zone; shared hashtags: #بیومیمتیک, #پوسیدگی | **high** |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: پوسیدگی; shared hashtags: #بیومیمتیک, #پوسیدگی | **high** |


### `/episodes/episode-66.html`

- **Page type:** `episode`
- **Title:** Peripheral Seal Zone – ادامه بحث | اپیزود 66 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – برداشت پوسیدگی از Peripheral Seal Zone (PSZ) و CRE | [/dentai/dentai-11.html](/dentai/dentai-11.html) | episode → dentai | shared keywords: peripheral, seal, zone, برداشت پوسیدگی عمیق; shared hashtags: #بیومیمتیک | medium |
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | episode → episode | shared keywords: بیومیمتیک دنتیستری; shared hashtags: #بیومیمتیک | medium |
| Decoupling With Time – بخش دوم | [/episodes/episode-73.html](/episodes/episode-73.html) | episode → episode | shared keywords: بیومیمتیک دنتیستری; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-67.html`

- **Page type:** `episode`
- **Title:** Peripheral Seal Zone – پایان مقاله | اپیزود 67 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | [/episodes/episode-65.html](/episodes/episode-65.html) | episode → episode | shared keywords: peripheral, seal, zone; shared hashtags: #بیومیمتیک, #پوسیدگی | **high** |
| DentAI – برداشت پوسیدگی از Peripheral Seal Zone (PSZ) و CRE | [/dentai/dentai-11.html](/dentai/dentai-11.html) | episode → dentai | shared keywords: peripheral, seal, zone; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-68.html`

- **Page type:** `episode`
- **Title:** عوامل مؤثر بر رنگ نهایی در درمان‌های زیبایی | اپیزود 68 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Black Triangle و اصلاح زیبایی آن | [/episodes/episode-39.html](/episodes/episode-39.html) | episode → episode | shared keywords: زیبایی; shared hashtags: #زیبایی | medium |
| بلیچینگ و اینترنال بلیچینگ – با دکتر دریاکناری | [/episodes/episode-61.html](/episodes/episode-61.html) | episode → episode | shared keywords: درمان‌های زیبایی; shared hashtags: #زیبایی | medium |


### `/episodes/episode-7.html`

- **Page type:** `episode`
- **Title:** Deep Margin Elevation (DME) | اپیزود 7 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Deep Margin Elevation | [/glossary/deep-margin-elevation.html](/glossary/deep-margin-elevation.html) | episode → glossary | shared keywords: deep, elevation, margin | **high** |
| Biological Width، مقایسه DME و CL – بخش اول | [/episodes/episode-75.html](/episodes/episode-75.html) | episode → episode | shared keywords: dme; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-70.html`

- **Page type:** `episode`
- **Title:** آفیس بلیچ و هوم بلیچ – با دکتر دریاکناری | اپیزود 70 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بلیچینگ و اینترنال بلیچینگ – با دکتر دریاکناری | [/episodes/episode-61.html](/episodes/episode-61.html) | episode → episode | shared keywords: دریاکناری, دکتر; shared hashtags: #بلیچینگ, #زیبایی | medium |
| فایبر پست – نکات کلینیکی با دکتر دریاکناری | [/episodes/episode-79.html](/episodes/episode-79.html) | episode → episode | shared keywords: دریاکناری, دکتر | medium |


### `/episodes/episode-72.html`

- **Page type:** `episode`
- **Title:** Decoupling With Time – بخش اول | اپیزود 72 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Decoupling With Time – بخش پایانی | [/episodes/episode-74.html](/episodes/episode-74.html) | episode → episode | shared keywords: decoupling, time, with, بیومیمتیک; shared hashtags: #بیومیمتیک | **high** |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-73.html`

- **Page type:** `episode`
- **Title:** Decoupling With Time – بخش دوم | اپیزود 73 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | episode → episode | shared keywords: بیومیمتیک دنتیستری; shared hashtags: #بیومیمتیک | medium |
| Peripheral Seal Zone – ادامه بحث | [/episodes/episode-66.html](/episodes/episode-66.html) | episode → episode | shared keywords: بیومیمتیک دنتیستری; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-74.html`

- **Page type:** `episode`
- **Title:** Decoupling With Time – بخش پایانی | اپیزود 74 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Decoupling With Time – بخش اول | [/episodes/episode-72.html](/episodes/episode-72.html) | episode → episode | shared keywords: decoupling, time, with, بیومیمتیک; shared hashtags: #بیومیمتیک | **high** |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-75.html`

- **Page type:** `episode`
- **Title:** Biological Width، مقایسه DME و CL – بخش اول | اپیزود 75 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه ۱۴ ساله باندینگ‌های سلف‌اچ و اچ‌اند‌رینس | [/dentai/dentai-5.html](/dentai/dentai-5.html) | episode → dentai | shared keywords: مقایسه; shared hashtags: #بیومیمتیک | medium |
| Deep Margin Elevation (DME) | [/episodes/episode-7.html](/episodes/episode-7.html) | episode → episode | shared keywords: dme; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-76.html`

- **Page type:** `episode`
- **Title:** Biological Width – مقایسه DME و CL – بخش دوم | اپیزود 76 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Biological Width | [/glossary/biological-width.html](/glossary/biological-width.html) | episode → glossary | shared keywords: biological, width | **high** |


### `/episodes/episode-77.html`

- **Page type:** `episode`
- **Title:** طبقه‌بندی رستوریشن‌های خلفی با گسترش ژنژیوالی – بخش اول | اپیزود 77 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| گایدلاین ترمیم‌های خلفی — (قسمت سوم) | [/episodes/episode-123.html](/episodes/episode-123.html) | episode → episode | shared keywords: خلفی; shared hashtags: #بیومیمتیک | medium |
| ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت اول | [/episodes/episode-137.html](/episodes/episode-137.html) | episode → episode | shared keywords: خلفی; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-79.html`

- **Page type:** `episode`
- **Title:** فایبر پست – نکات کلینیکی با دکتر دریاکناری | اپیزود 79 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| فایبر پست؛ درمانی که بیش از حد جدی گرفته شد | [/metanotes/meta-7.html](/metanotes/meta-7.html) | episode → metanote | shared keywords: fiber post, فایبر | medium |
| بلیچینگ و اینترنال بلیچینگ – با دکتر دریاکناری | [/episodes/episode-61.html](/episodes/episode-61.html) | episode → episode | shared keywords: دریاکناری, دکتر | medium |
| آفیس بلیچ و هوم بلیچ – با دکتر دریاکناری | [/episodes/episode-70.html](/episodes/episode-70.html) | episode → episode | shared keywords: دریاکناری, دکتر | medium |


### `/episodes/episode-8.html`

- **Page type:** `episode`
- **Title:** طبقه‌بندی سرامیک‌های دندانی | اپیزود 8 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طبقه‌بندی جدید سرامیک‌ها | [/episodes/episode-29.html](/episodes/episode-29.html) | episode → episode | shared keywords: سرامیک, طبقه; shared hashtags: #سرامیک | medium |
| سرامیک‌های پلی‌کریستالین و ماتریکس رزینی | [/episodes/episode-30.html](/episodes/episode-30.html) | episode → episode | shared keywords: سرامیک; shared hashtags: #سرامیک | medium |
| زیرکونیاهای شفاف – بخش دوم | [/episodes/episode-18.html](/episodes/episode-18.html) | episode → episode | shared keywords: مواد سرامیکی; shared hashtags: #سرامیک | medium |


### `/episodes/episode-80.html`

- **Page type:** `episode`
- **Title:** کانکشن‌های ایمپلنت – معرفی انواع اتصالات | اپیزود 80 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | episode → litecast | shared keywords: اباتمنت; shared hashtags: #اباتمنت | medium |
| انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) | [/episodes/episode-102.html](/episodes/episode-102.html) | episode → episode | shared keywords: اباتمنت; shared hashtags: #اباتمنت | medium |


### `/episodes/episode-81.html`

- **Page type:** `episode`
- **Title:** پایان بحث کانکشن‌های ایمپلنت | اپیزود 81 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) | [/episodes/episode-102.html](/episodes/episode-102.html) | episode → episode | shared keywords: پروتز ایمپلنت; shared hashtags: #اباتمنت | medium |


### `/episodes/episode-82.html`

- **Page type:** `episode`
- **Title:** Platform Switch – بخش اول | اپیزود 82 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Platform Switch | [/glossary/platform-switch.html](/glossary/platform-switch.html) | episode → glossary | shared keywords: platform, switch | **high** |


### `/episodes/episode-83.html`

- **Page type:** `episode`
- **Title:** Platform Switch – پایان | اپیزود 83 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Platform Switch | [/glossary/platform-switch.html](/glossary/platform-switch.html) | episode → glossary | shared keywords: platform, switch | **high** |
| Insight 22 — خارج کردن پیچ شکستهٔ اباتمنت در شکست‌های ثانویه | [/insight/insight-22.html](/insight/insight-22.html) | episode → insight | shared keywords: اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |
| Insight 30 — بررسی محل اسپرو در اباتمنت‌های Premill هنگام عد | [/insight/insight-30.html](/insight/insight-30.html) | episode → insight | shared keywords: اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |


### `/episodes/episode-84.html`

- **Page type:** `episode`
- **Title:** Abutment Screw – نکات کاربردی | اپیزود 84 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — شل شدن پیچ اباتمنت‌های کاستوم (Screw Loosening) | [/episodes/episode-123-6.html](/episodes/episode-123-6.html) | episode → episode | shared keywords: screw, گشتاور پیچ | medium |


### `/episodes/episode-87.html`

- **Page type:** `episode`
- **Title:** مرور علمی زیرکونیا – بخش اول | اپیزود 87 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مرور علمی زیرکونیا – پایان | [/episodes/episode-89.html](/episodes/episode-89.html) | episode → episode | shared keywords: زیرکونیا, علمی; shared hashtags: #زیرکونیا | medium |
| زیرکونیاهای شفاف – بخش دوم | [/episodes/episode-18.html](/episodes/episode-18.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |
| آماده‌سازی سطح زیرکونیا | [/episodes/episode-11.html](/episodes/episode-11.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-88.html`

- **Page type:** `episode`
- **Title:** مرور علمی زیرکونیا – بخش دوم | اپیزود 88 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زیرکونیاهای شفاف – بخش دوم | [/episodes/episode-18.html](/episodes/episode-18.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |
| آماده‌سازی سطح زیرکونیا | [/episodes/episode-11.html](/episodes/episode-11.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |
| اینسایت — کارایی فرزهای الماسه روی زیرکونیا | [/episodes/episode-122-5.html](/episodes/episode-122-5.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-89.html`

- **Page type:** `episode`
- **Title:** مرور علمی زیرکونیا – پایان | اپیزود 89 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مرور علمی زیرکونیا – بخش اول | [/episodes/episode-87.html](/episodes/episode-87.html) | episode → episode | shared keywords: زیرکونیا, علمی; shared hashtags: #زیرکونیا | medium |
| زیرکونیاهای شفاف – بخش دوم | [/episodes/episode-18.html](/episodes/episode-18.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |
| آماده‌سازی سطح زیرکونیا | [/episodes/episode-11.html](/episodes/episode-11.html) | episode → episode | shared keywords: زیرکونیا; shared hashtags: #زیرکونیا | medium |


### `/episodes/episode-9.html`

- **Page type:** `episode`
- **Title:** آماده‌سازی سطح سرامیک‌ها – بخش اول | اپیزود 9 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آماده‌سازی سطح سرامیک‌ها (Surface Treatment) | [/episodes/episode-136.html](/episodes/episode-136.html) | episode → episode | shared keywords: surface treatment, سرامیک | medium |


### `/episodes/episode-90.html`

- **Page type:** `episode`
- **Title:** شروع کتاب Biomimetic Restorative Dentistry – فصل ۱ | اپیزود 90 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | episode → episode | shared keywords: اصول بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| DentAI –    تشریح ترکها و نقاط پایانی حذف ترک | [/dentai/dentai-15.html](/dentai/dentai-15.html) | episode → dentai | shared keywords: biomimetic dentistry; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو | [/insight/insight-4.html](/insight/insight-4.html) | episode → insight | shared keywords: biomimetic dentistry; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-91.html`

- **Page type:** `episode`
- **Title:** بیومیمتیک — مرور فصل یک (قسمت دوم) | اپیزود 91 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| DentAI –    تشخیص آسیبهای ساختاری دندان | [/dentai/dentai-14.html](/dentai/dentai-14.html) | episode → dentai | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| DentAI -انواع ترک مینایی تشخیص و درمان ترمیمی | [/dentai/dentai-1.html](/dentai/dentai-1.html) | episode → dentai | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-92.html`

- **Page type:** `episode`
- **Title:** بیومیمتیک — مرور فصل یک (قسمت سوم) | اپیزود 92 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | **high** |
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک — پایان فصل یک (قسمت پنجم) | [/episodes/episode-94.html](/episodes/episode-94.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-93.html`

- **Page type:** `episode`
- **Title:** بیومیمتیک — مرور فصل یک (قسمت چهارم) | اپیزود 93 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-94.html`

- **Page type:** `episode`
- **Title:** بیومیمتیک — پایان فصل یک (قسمت پنجم) | اپیزود 94 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک — مرور فصل یک (قسمت سوم) | [/episodes/episode-92.html](/episodes/episode-92.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | episode → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | episode → dentai | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/episodes/episode-95.html`

- **Page type:** `episode`
- **Title:** BOPT — اصول تراش و آماده‌سازی | اپیزود 95 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اصول تراش دندان Goodacre — (قسمت اول) | [/episodes/episode-113.html](/episodes/episode-113.html) | episode → episode | shared keywords: تراش; shared hashtags: #تراش_دندان, #پروتز_ثابت | medium |
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | episode → dentai | shared keywords: تراش; shared hashtags: #تراش_دندان | medium |


### `/episodes/episode-96.html`

- **Page type:** `episode`
- **Title:** PEEK CAD-CAM — اصول و کاربردها (قسمت اول) | اپیزود 96 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| PEEK CAD-CAM — پایان مباحث (قسمت سوم) | [/episodes/episode-98.html](/episodes/episode-98.html) | episode → episode | shared keywords: peek; shared hashtags: #peek | medium |
| Ti-Base Abutments — کاربردها و نکات (قسمت اول) | [/episodes/episode-104.html](/episodes/episode-104.html) | episode → episode | shared keywords: کاربردها; shared hashtags: #cadcam | medium |


### `/episodes/episode-98.html`

- **Page type:** `episode`
- **Title:** PEEK CAD-CAM — پایان مباحث (قسمت سوم) | اپیزود 98 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| PEEK CAD-CAM — اصول و کاربردها (قسمت اول) | [/episodes/episode-96.html](/episodes/episode-96.html) | episode → episode | shared keywords: peek; shared hashtags: #peek | medium |


### `/episodes/episode-99.html`

- **Page type:** `episode`
- **Title:** رزین اینفیلتریشن — درمان ضایعات سفید | اپیزود 99 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –  درمان لکه های سفید روی دندانها و رزین اینفیلتریشن | [/dentai/dentai-2.html](/dentai/dentai-2.html) | episode → dentai | shared keywords: اینفیلتریشن, رزین, سفید | medium |


### `/notecast/episode-10.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست دهم – سایلان‌ها و کاربرد در آماده‌سازی سطح سرامیک | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | … با وزن مولکولی بالا تشکیل بدن که این باعث کاهش قدرت باند به پرسلن می‌شه. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نقش سایلان در آماده‌سازی سرامیک‌ها 🔗structural | [/episodes/episode-10.html](/episodes/episode-10.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| لزوم استفاده از باندینگ روی پرسلن اچ‌شده | [/episodes/episode-16.html](/episodes/episode-16.html) | notecast → episode | shared keywords: باندینگ, سایلان | **high** |


### `/notecast/episode-11.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست یازدهم – آماده‌سازی سطح زیرکونیا قبل از سمان کردن | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `فلدسپاتیک` | [Feldspathic Porcelain](/glossary/feldspathic-porcelain.html) | برای پرسلن‌های فلدسپاتیک نیازی به سیلیکا کوتینگ نیست، چون خودشون به اندازه کافی گروه‌های … | **high** |
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | … فسفات هست. این مونومرها مستقیماً به زیرکونیا باند می‌شن و قدرت باند رو افزایش می‌دن. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آماده‌سازی سطح زیرکونیا 🔗structural | [/episodes/episode-11.html](/episodes/episode-11.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| مقایسهٔ آماده‌سازی فایبرپست برای سمان‌های سلف‌ادهزیو | [/episodes/episode-43.html](/episodes/episode-43.html) | notecast → episode | shared keywords: سمان; shared hashtags: #سمان_رزینی | **high** |


### `/notecast/episode-12.html`

- **Page type:** `notecast`
- **Title:** پروتکل پاکسازی رستوریشن‌های گلاس سرامیکی: مدیریت آلودگی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … مختلف نیازمند پروتکل‌های پاکسازی متفاوتی هستند. به عنوان مثال، سرامیک‌های زیرکونیا نباید با اسید فسفریک تمیز شوند. **نوع آلودگی**: روش پاکسازی بسته … | **high** |
| `سمان‌های رزینی` | [Resin Cements](/glossary/resin-cements.html) | … پاکسازی با اسید فسفریک (در موارد آلودگی بزاق/خون) **قدرت باند سمان‌های رزینی را افزایش می‌دهد.** اگر اسید هیدروفلوئوریک برای اچینگ مجدد (در … | **high** |
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | … پس از پاکسازی با اسید فسفریک (در موارد آلودگی بزاق/خون) **قدرت باند سمان‌های رزینی را افزایش می‌دهد.** اگر اسید هیدروفلوئوریک برای اچینگ … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی 🔗structural | [/episodes/episode-12.html](/episodes/episode-12.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| پروتکل‌های عملی در آماده‌سازی اورلی‌های سرامیکی | [/episodes/episode-57.html](/episodes/episode-57.html) | notecast → episode | shared keywords: سرامیکی, پروتکل; shared hashtags: #بیومیمتیک, #سرامیک | medium |


### `/notecast/episode-13.html`

- **Page type:** `notecast`
- **Title:** مدیریت تیرگی لثه با روکش زیرکونیا: راه حل اثر چتر (Umbrella Effect) | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Esthetic Width و Umbrella Effect 🔗structural | [/episodes/episode-13.html](/episodes/episode-13.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-14.html`

- **Page type:** `notecast`
- **Title:** افزایش بعد عمودی (Vertical Dimension): دیدگاه‌های داوسون، شواهد جدید و پروتکل درمانی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … مانع این طول شوند، عضلات به مرور زمان بر این مقاومت غلبه کرده و به طول اصلی خود باز می‌گردند. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| افزایش Vertical Dimension 🔗structural | [/episodes/episode-14.html](/episodes/episode-14.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| Vertical Dimension of Occlusion – Myths & Evidence (Part 2) | [/episodes/episode-155.html](/episodes/episode-155.html) | notecast → episode | shared keywords: dimension, occlusion, vertical; shared hashtags: #vd, #اکلوژن | medium |
| Vertical Dimension of Occlusion – Myth 1 | [/episodes/episode-154.html](/episodes/episode-154.html) | notecast → episode | shared keywords: dimension, occlusion, vertical; shared hashtags: #اکلوژن | medium |


### `/notecast/episode-15.html`

- **Page type:** `notecast`
- **Title:** آنلِی‌های سرامیکی: مرور نظام‌مند طول عمر و عوامل موفقیت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طول عمر آنله‌های سرامیکی 🔗structural | [/episodes/episode-15.html](/episodes/episode-15.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-16.html`

- **Page type:** `notecast`
- **Title:** آیا باندینگ روی پرسلن فلدسپاتیک اچ و سایلن‌زده ضروری است؟ | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | … به استفاده از باندینگ روی سطح آن، برای افزایش قدرت باند به سمان رزینی، وجود ندارد. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| لزوم استفاده از باندینگ روی پرسلن اچ‌شده 🔗structural | [/episodes/episode-16.html](/episodes/episode-16.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-17.html`

- **Page type:** `notecast`
- **Title:** فازهای زیرکونیا و تکامل آن قسمت اول| دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `شفافیت` | [Translucency](/glossary/translucency.html) | این کار شفافیت را کمی بهتر کرد، اما برای رستوریشن قدامی کافی نبود. | **high** |
| `میلینگ` | [Milling](/glossary/milling.html) | … و روند کار را ساده کند (اسکن → طراحی → میلینگ). | **high** |
| `فاز بلوری` | [Crystalline Phase](/glossary/crystalline-phase.html) | این ماده سه فاز بلوری دارد: تتراگونال، مونوکلینیک و کیوبیک . | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زیرکونیاهای شفاف – بخش اول 🔗structural | [/episodes/episode-17.html](/episodes/episode-17.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-18.html`

- **Page type:** `notecast`
- **Title:** فازهای زیرکونیا و تکامل آن دوم | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | وضعیت اولیه: قبل از ورود به کوره، زیرکونیا در حالت خام است؛ حالتی مشابه یک بلوک گچی سفت که … | **high** |
| `شفافیت` | [Translucency](/glossary/translucency.html) | … در حین سینتر بسیار حساس است؛ نوسان ۳۰ درجه می‌تواند شفافیت نهایی را تغییر دهد. استفاده از کوره استاندارد ضروری است. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زیرکونیاهای شفاف – بخش دوم 🔗structural | [/episodes/episode-18.html](/episodes/episode-18.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-19.html`

- **Page type:** `notecast`
- **Title:** پایداری رنگ ونیرهای سرامیکی؛ نکات کلیدی JPD 2018 | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ثبات رنگ لمینیت‌های سرامیکی 🔗structural | [/episodes/episode-19.html](/episodes/episode-19.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-2.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲ – راهنمای جامع انتخاب سمان مناسب برای رستوریشن‌های دندانی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | استحکام سرامیک رستوریشن: سرامیک‌های با استحکام بالا مانند زیرکونیا نیاز به سمان‌های تقویت‌کننده ندارند. | **high** |
| `رستوریشن سرامیکی` | [Dental Ceramics](/glossary/dental-ceramics.html) | سمان‌های تردیشنال و سلف‌ادهزیو، استحکام رستوریشن سرامیکی را افزایش نمی‌دهند. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| انواع سمان و اصول سمان‌کردن 🔗structural | [/episodes/episode-2.html](/episodes/episode-2.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-20.html`

- **Page type:** `notecast`
- **Title:** نکات طلایی قالب‌گیری در پروتز ثابت؛ نوت‌کست ۲۰ | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `کنترل رطوبت` | [Isolation](/glossary/isolation.html) | … فقط به ماده و روش نیست؛ به مدیریت بافت نرم، کنترل رطوبت و دقت در جزئیات بستگی دارد. هر گام دقیق، به … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| قالب‌گیری دو مرحله‌ای 🔗structural | [/episodes/episode-20.html](/episodes/episode-20.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| ادامهٔ قالب‌گیری دو مرحله‌ای | [/episodes/episode-21.html](/episodes/episode-21.html) | notecast → episode | shared keywords: قالب; shared hashtags: #قالبگیری | **high** |
| Insight 34 — کنترل جریان ماده قالب‌گیری با Posterior Damming | [/insight/insight-34.html](/insight/insight-34.html) | notecast → insight | shared keywords: قالب; shared hashtags: #dentalimpression, #تری_قالبگیری | medium |


### `/notecast/episode-21.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۱ – ادامه‌ی قالب‌گیری دو مرحله‌ای | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامهٔ قالب‌گیری دو مرحله‌ای 🔗structural | [/episodes/episode-21.html](/episodes/episode-21.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| خلاصه‌ی نوشتاری دنت‌کست چهار — استراتژی‌های اصلی باندینگ و ن | [/notecast/episode-4.html](/notecast/episode-4.html) | notecast → notecast | shared keywords: خلاصه, نوشتاری | medium |


### `/notecast/episode-22.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۲ – سه تداخل دارویی حیاتی در دندان‌پزشکی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| سه تداخل دارویی مهم در دندان‌پزشکی 🔗structural | [/episodes/episode-22.html](/episodes/episode-22.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-23.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۳ – اورلود اکلوزالی و تحلیل استخوان ایمپلنت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اثر اورلود اکلوزالی بر تحلیل استخوان ایمپلنت 🔗structural | [/episodes/episode-23.html](/episodes/episode-23.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| عوامل مؤثر بر تحلیل استخوان مارژینال اطراف ایمپلنت | [/episodes/episode-59.html](/episodes/episode-59.html) | notecast → episode | shared keywords: استخوان; shared hashtags: #تحلیل_استخوان | **high** |


### `/notecast/episode-24.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۴ – نسبت تاج به ایمپلنت (C/I Ratio) و تحلیل استخوان | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| تأثیر نسبت تاج به ایمپلنت 🔗structural | [/episodes/episode-24.html](/episodes/episode-24.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-25.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۵ – ایمپلنت کوتاه یا سینوس لیفت؟ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت کوتاه یا سینوس‌لیفت؟ 🔗structural | [/episodes/episode-25.html](/episodes/episode-25.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-26.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۶ – زمان لود ایمپلنت و Marginal Bone Loss | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| زمان بارگذاری و تحلیل استخوان ایمپلنت 🔗structural | [/episodes/episode-26.html](/episodes/episode-26.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| Zero Bone Loss | [/glossary/zero-bone-loss.html](/glossary/zero-bone-loss.html) | notecast → glossary | shared keywords: bone, loss | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | [/episodes/episode-139.html](/episodes/episode-139.html) | notecast → episode | shared keywords: bone, loss | **high** |
| متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت دوم | [/episodes/episode-140.html](/episodes/episode-140.html) | notecast → episode | shared keywords: bone, loss | **high** |


### `/notecast/episode-27.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۷ – بار–کلیپ یا بال–اورینگ؟ کدوم بهتره؟ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقایسهٔ اتچمنت‌ها در اوردنچر 🔗structural | [/episodes/episode-27.html](/episodes/episode-27.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-28.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۲۸ – اصول آنالیز و طراحی لبخند؛ قوانین McLaren | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طراحی لبخند و قوانین مک‌لارن 🔗structural | [/episodes/episode-28.html](/episodes/episode-28.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| Global Diagnosis — آنالیز لبخند (قسمت سوم) | [/episodes/episode-118.html](/episodes/episode-118.html) | notecast → episode | shared keywords: آنالیز, تناسبات دندانی, طراحی لبخند; shared hashtags: #smiledesign, #آنالیز_لبخند, #زیبایی_دندان | **high** |
| کانسپت Facial Flow در طراحی لبخند | [/episodes/episode-46.html](/episodes/episode-46.html) | notecast → episode | shared keywords: طراحی, طراحی لبخند; shared hashtags: #طراحی_لبخند | medium |


### `/notecast/episode-29.html`

- **Page type:** `notecast`
- **Title:** نوت کست بیست و نهم: طبقه بندی سرامیکها قسمت یک

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `فاز کریستالی` | [Crystalline Phase](/glossary/crystalline-phase.html) | سرامیکهای سنتتیک در اینها نسبت به گروه قبل فاز کریستالی بزرگ‌تری داریم و همین احتمال ایجاد ترک را کم میکند … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طبقه‌بندی جدید سرامیک‌ها 🔗structural | [/episodes/episode-29.html](/episodes/episode-29.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-3.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۳ – سمان‌های رزینی: انواع، ویژگی‌ها، مزایا و معایب | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | … Cement (کوراری) — دوال‌کیور، آزادکننده فلوراید، قدرت باند بالا به زیرکونیا و لیتیوم دی‌سیلیکات (بیش از ۵۰ مگاپاسکال) و به عاج اچ‌نشده … | **high** |
| `لیتیوم دی‌سیلیکات` | [Lithium Disilicate](/glossary/lithium-disilicate.html) | … دوال‌کیور، آزادکننده فلوراید، قدرت باند بالا به زیرکونیا و لیتیوم دی‌سیلیکات (بیش از ۵۰ مگاپاسکال) و به عاج اچ‌نشده حدود ۲۶ مگاپاسکال. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامهٔ مباحث سمان‌ها 🔗structural | [/episodes/episode-3.html](/episodes/episode-3.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| انتخاب سمان رزینی (لمینیت و اینله) — قسمت اول | [/episodes/episode-148.html](/episodes/episode-148.html) | notecast → episode | shared keywords: resin cement, رزینی, سمان; shared hashtags: #سمان_رزینی | medium |
| انتخاب سمان رزینی (لمینیت و اینله) — قسمت دوم | [/episodes/episode-149.html](/episodes/episode-149.html) | notecast → episode | shared keywords: رزینی, سمان | medium |


### `/notecast/episode-30.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۳۰ – سرامیک‌های پلی‌کریستالاین و هیبرید (رزین‌ماتریکس) | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … مواد قابل اچ با اسید هیدروفلوئوریک نباشند اما در عوض، مقاومت بالایی در برابر گسترش ترک از خود نشان میدهند و تافنس … | **high** |
| `مواد سرامیکی` | [Dental Ceramics](/glossary/dental-ceramics.html) | این نوت‌کست به بررسی دو گروه مهم از مواد سرامیکی در دندان‌پزشکی ترمیمی می‌پردازد: سرامیک‌های پلی‌کریستالاین و سرامیک‌های هیبرید (Resin-Matrix) … | medium |
| `سرامیک‌های کاملاً کریستالی` | [Polycrystalline Ceramics](/glossary/polycrystalline-ceramics.html) | درک ساختار مواد، مسیر انتخاب بالینی را مشخص می‌کند. از سرامیک‌های کاملاً کریستالی با استحکام بالا تا مواد هیبریدی با رفتار نزدیک‌تر … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| سرامیک‌های پلی‌کریستالین و ماتریکس رزینی 🔗structural | [/episodes/episode-30.html](/episodes/episode-30.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-31.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۳۱ – رستوریشن‌های ایمپلنت‌ساپورت و روش‌های اتصال روکش | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| رستوریشن‌های ایمپلنتی اسکرو–سمنتد 🔗structural | [/episodes/episode-31.html](/episodes/episode-31.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-32.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۳۲ – اسنپ آن اسمایل قسمت اول | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اپلاینس‌های اسنپ‌آن اسمایل 🔗structural | [/episodes/episode-32.html](/episodes/episode-32.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| ادامهٔ بحث اسنپ‌آن اسمایل | [/episodes/episode-33.html](/episodes/episode-33.html) | notecast → episode | shared keywords: اسمایل, اسنپ; shared hashtags: #زیبایی | **high** |
| کاربردهای پیشرفته Snap-On Smile | [/notecast/episode-33.html](/notecast/episode-33.html) | notecast → notecast | shared keywords: smile, snap | medium |


### `/notecast/episode-33.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۳۳ – کاربردهای پیشرفته Snap-On Smile | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامهٔ بحث اسنپ‌آن اسمایل 🔗structural | [/episodes/episode-33.html](/episodes/episode-33.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| اسنپ آن اسمایل یا  snap on smile  قسمت اول | [/notecast/episode-32.html](/notecast/episode-32.html) | notecast → notecast | shared keywords: smile, snap | medium |


### `/notecast/episode-4.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۴ – باندینگ و نسل‌های ادهزیو | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام باند` | [Bond Strength](/glossary/bond-strength.html) | … مؤثر اچ نکند، که می‌تواند استحکام باند به مینا را به خطر اندازد. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نسل‌های مختلف باندینگ 🔗structural | [/episodes/episode-4.html](/episodes/episode-4.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| خلاصه‌ی نوشتاری دنت‌کست بیست و یکم | [/notecast/episode-21.html](/notecast/episode-21.html) | notecast → notecast | shared keywords: خلاصه, نوشتاری | medium |


### `/notecast/episode-5.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۵ – باندینگ‌های یونیورسال: نکات کلیدی و کاربردی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `لیتیوم دی‌سیلیکات` | [Lithium Disilicate](/glossary/lithium-disilicate.html) | سرامیک‌های سیلیکایی (مثل فلدسپاتیک، لیتیوم دی‌سیلیکات): مکانیسم اصلی باند، سایلان است. تمیز کردن با اسید فسفریک … | **high** |
| `باند یونیورسال` | [Universal Adhesive](/glossary/universal-adhesive.html) | زیرکونیا: باند یونیورسال (با MDP) به‌خاطر باند شیمیایی، قابل استفاده است. (مطالعات طولانی‌مدت … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| باندینگ‌های یونیورسال 🔗structural | [/episodes/episode-5.html](/episodes/episode-5.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-6.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۶ – سیل کردن فوری دنتین (IDS) | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `لایه هیبرید` | [Hybrid Layer](/glossary/hybrid-layer.html) | رزین ان‌فیلد (Unfilled) : لایه هیبرید نازک‌تری می‌دهد. اگر برای IDS استفاده شد، موقع سمان کردن … | **high** |
| `آندرکات‌ها` | [Undercut](/glossary/undercut.html) | پس از IDS در تراش انله، آندرکات‌ها بلافاصله با کامپوزیت یا فلو مسدود می‌شوند. | **high** |
| `IDS` | [Immediate Dentin Sealing (IDS)](/glossary/immediate-dentin-sealing.html) | … مهم: دنتین تازه تراش‌خورده بهترین سطح برای باندینگ است و IDS از آلودگی آن در مرحله تمپوراری (با سمان موقت، بزاق و...) … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Immediate Dentin Sealing (IDS) 🔗structural | [/episodes/episode-6.html](/episodes/episode-6.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-7.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست ۷ – تکنیک DME (Deep Margin Elevation) | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Deep Margin Elevation (DME) 🔗structural | [/episodes/episode-7.html](/episodes/episode-7.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-8.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست هشتم – سرامیک‌های دندانی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| طبقه‌بندی سرامیک‌های دندانی 🔗structural | [/episodes/episode-8.html](/episodes/episode-8.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |


### `/notecast/episode-9.html`

- **Page type:** `notecast`
- **Title:** نوت‌کست نهم – آماده‌سازی سطحی سرامیک (قسمت اول) | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | ️ نکات ایمنی: ایزولاسیون کامل، ساکشن قوی، محافظ چشم، ماسک و دستکش الزامی است. | **high** |
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | هشدار: اور-اچینگ باعث تضعیف پرسلن و کاهش قدرت باند می‌شود. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آماده‌سازی سطح سرامیک‌ها – بخش اول 🔗structural | [/episodes/episode-9.html](/episodes/episode-9.html) | structural pair: episode ↔ notecast (same episode number) | Same episode number — the notecast is the written summary of the audio episode (or reverse). Should always cross-link. | **high** |
| آماده‌سازی سطح سرامیک‌ها (Surface Treatment) | [/episodes/episode-136.html](/episodes/episode-136.html) | notecast → episode | shared keywords: سرامیک; shared hashtags: #باندینگ_سرامیک | **high** |


### `/insight/insight-1.html`

- **Page type:** `insight`
- **Title:** ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | دنت‌کست کلینیکال

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Vertical Dimension of Occlusion – Myth 1 | [/episodes/episode-154.html](/episodes/episode-154.html) | insight → episode | shared keywords: occlusion, اکلوژن; shared hashtags: #اکلوژن | medium |
| Vertical Dimension of Occlusion – Myths & Evidence (Part 2) | [/episodes/episode-155.html](/episodes/episode-155.html) | insight → episode | shared keywords: occlusion, اکلوژن; shared hashtags: #اکلوژن | medium |
| فوتوکست ۲ – قانون BULL در تنظیم اکلوزال | [/photocast/episode-2.html](/photocast/episode-2.html) | insight → photocast | shared keywords: premature contacts, اکلوژن; shared hashtags: #اکلوژن | medium |


### `/insight/insight-10.html`

- **Page type:** `insight`
- **Title:** مدیریت فضا در ایمپلنت سانترال بیمار Deep Bite | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | این انتخاب هم مقاومت بیشتری فراهم می‌کند و هم فضای بیشتری در اختیار ما می‌گذارد. | **high** |


### `/insight/insight-12.html`

- **Page type:** `insight`
- **Title:** بازگرداندن ارتفاع عمودی و ساپورت خلفی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 21 — تامین موقت ساپورت خلفی در باز سازی های وسیع | [/insight/insight-21.html](/insight/insight-21.html) | insight → insight | shared keywords: anterior overload, full mouth rehabilitation, insight; shared hashtags: #استاپ_خلفی, #اکلوژن, #پست_و_کور | medium |
| تهیهٔ فضا در بیمار فاقد استاپ خلفی — تحلیل تا تصمیم‌گیری | [/insight/insight-6.html](/insight/insight-6.html) | insight → insight | shared keywords: full mouth rehabilitation, loss of posterior support; shared hashtags: #vdo, #استاپ_خلفی, #اکلوژن | medium |


### `/insight/insight-13.html`

- **Page type:** `insight`
- **Title:** طرح درمان باید آینده را هم ببیند | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight — وقتی دندان کنار ایمپلنت مثل یک «پونتیک زنده» رفتار | [/insight/insight-24.html](/insight/insight-24.html) | insight → insight | shared keywords: insight; shared hashtags: #اکلوژن, #بیومکانیک | medium |


### `/insight/insight-14.html`

- **Page type:** `insight`
- **Title:** ارزیابی واقعی دندان فقط بعد از برداشتن روکش | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نقش رفتار بیمار در درمان پریو و ایمپلنت | [/metanotes/meta-2.html](/metanotes/meta-2.html) | insight → metanote | shared keywords: periodontal prognosis; shared hashtags: #پریودنتال | medium |


### `/insight/insight-15.html`

- **Page type:** `insight`
- **Title:** گیر کردن پست‌وکور بعد از ساخت؛ ترفند خارج‌سازی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `گیر مکانیکی` | [Retention](/glossary/retention.html) | فرز داخل کور گیر مکانیکی پیدا می‌کند و عملاً تبدیل می‌شود به یک «دسته‌ی کمکی» … | medium |


### `/insight/insight-18.html`

- **Page type:** `insight`
- **Title:** فینیش‌لاین عمودی؛ Finish Zone Concept وقتی «خط» وجود ندارد | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| فاصله فینیش‌لاین از مارجین روکش؛ خطایی که دیر دیده می‌شود | [/chairside/chairside-12.html](/chairside/chairside-12.html) | insight → chairside | shared keywords: فینیش, لاین; shared hashtags: #فینیش_لاین | medium |
| پست خم شد؛ همان جایی که فرول وجود ندارد | [/chairside/chairside-5.html](/chairside/chairside-5.html) | insight → chairside | shared keywords: ندارد, وجود | medium |


### `/insight/insight-19.html`

- **Page type:** `insight`
- **Title:** ارزیابی فضای بازسازی در درمان ارتودنسی–پروتزی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| فضای بیش‌ازحد در ناحیه پرمولر؛ تصمیم پروتزی در محدودیت ارتود | [/chairside/chairside-2.html](/chairside/chairside-2.html) | insight → chairside | shared keywords: ارتودنسی, فضای, پروتزی | medium |


### `/insight/insight-2.html`

- **Page type:** `insight`
- **Title:** کراس‌مانت (Cross-Mounting) در پروتزهای وسیع | راهی برای حفظ VDO و اکلوژن

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Vertical Dimension of Occlusion – Myth 1 | [/episodes/episode-154.html](/episodes/episode-154.html) | insight → episode | shared keywords: اکلوژن, پروتز ثابت; shared hashtags: #اکلوژن | medium |
| Vertical Dimension of Occlusion – Myths & Evidence (Part 2) | [/episodes/episode-155.html](/episodes/episode-155.html) | insight → episode | shared keywords: اکلوژن, پروتز ثابت; shared hashtags: #اکلوژن | medium |
| اکلوژن در درمان‌های ایمپلنت – با حضور دکتر الله‌بخشی | [/episodes/episode-60.html](/episodes/episode-60.html) | insight → episode | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |


### `/insight/insight-20.html`

- **Page type:** `insight`
- **Title:** وقتی به درمان ریشه مطمئن نیستیم؛ طراحی کور و پست به‌عنوان تصمیم درمانی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چرا تحویل همزمان پست‌و‌کور و روکش، تصمیم دقیقی نیست | [/metanotes/meta-9.html](/metanotes/meta-9.html) | insight → metanote | shared keywords: تصمیم; shared hashtags: #تصمیم_درمانی, #پست_و_کور | medium |
| Insight 23 — وقتی رادیولوسنسی زیر ترمیم، پوسیدگی نیست | [/insight/insight-23.html](/insight/insight-23.html) | insight → insight | shared keywords: clinical decision making, insight; shared hashtags: #تصمیم_درمانی | medium |
| چالش‌های باند به عاج ریشه | [/episodes/episode-36.html](/episodes/episode-36.html) | insight → episode | shared keywords: ریشه; shared hashtags: #پست_و_کور | medium |


### `/insight/insight-21.html`

- **Page type:** `insight`
- **Title:** تامین موقت ساپورت خلفی در باز سازی های وسیع

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight — بازگرداندن ارتفاع عمودی صحیح | [/insight/insight-12.html](/insight/insight-12.html) | insight → insight | shared keywords: anterior overload, full mouth rehabilitation, insight; shared hashtags: #استاپ_خلفی, #اکلوژن, #پست_و_کور | medium |
| تهیهٔ فضا در بیمار فاقد استاپ خلفی — تحلیل تا تصمیم‌گیری | [/insight/insight-6.html](/insight/insight-6.html) | insight → insight | shared keywords: full mouth rehabilitation, خلفی; shared hashtags: #استاپ_خلفی, #اکلوژن | medium |
| Insight 17 — یک عدد کاربردی در آماده سازی کانال دندان | [/insight/insight-17.html](/insight/insight-17.html) | insight → insight | shared keywords: insight, post and core; shared hashtags: #پست_و_کور | medium |


### `/insight/insight-22.html`

- **Page type:** `insight`
- **Title:** خارج کردن پیچ شکستهٔ اباتمنت در شکست‌های ثانویه | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| یک روش حداقلی برای خارج کردن پیچ شکسته ایمپلنت | [/metanotes/meta-8.html](/metanotes/meta-8.html) | insight → metanote | shared keywords: abutment screw fracture, implant prosthodontics, خارج; shared hashtags: #پروتز_ایمپلنت | medium |
| Platform Switch – پایان | [/episodes/episode-83.html](/episodes/episode-83.html) | insight → episode | shared keywords: اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |
| انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) | [/episodes/episode-102.html](/episodes/episode-102.html) | insight → episode | shared keywords: اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |


### `/insight/insight-23.html`

- **Page type:** `insight`
- **Title:** وقتی رادیولوسنسی زیر ترمیم، پوسیدگی نیست | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 25 — وقتی دندان مجاور نیست، روکش بزرگ‌تر به نظر می‌ر | [/insight/insight-25.html](/insight/insight-25.html) | insight → insight | shared keywords: clinical decision making, insight; shared hashtags: #تشخیص_افتراقی, #تصمیم_درمانی | medium |
| Insight — وقتی دندان کنار ایمپلنت مثل یک «پونتیک زنده» رفتار | [/insight/insight-24.html](/insight/insight-24.html) | insight → insight | shared keywords: clinical decision making, insight; shared hashtags: #تصمیم_درمانی | medium |
| Insight 20 — وقتی به درمان ریشه مطمئن نیستیم، طراحی کور و پس | [/insight/insight-20.html](/insight/insight-20.html) | insight → insight | shared keywords: clinical decision making, insight; shared hashtags: #تصمیم_درمانی | medium |


### `/insight/insight-24.html`

- **Page type:** `insight`
- **Title:** وقتی دندان کنار ایمپلنت، «Living Pontic» می‌شود | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نقش رفتار بیمار در درمان پریو و ایمپلنت | [/metanotes/meta-2.html](/metanotes/meta-2.html) | insight → metanote | shared keywords: رفتار; shared hashtags: #تصمیم_درمانی | medium |


### `/insight/insight-25.html`

- **Page type:** `insight`
- **Title:** وقتی دندان مجاور نیست، روکش بزرگ‌تر به نظر می‌رسد | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight — وقتی دندان کنار ایمپلنت مثل یک «پونتیک زنده» رفتار | [/insight/insight-24.html](/insight/insight-24.html) | insight → insight | shared keywords: clinical decision making, insight; shared hashtags: #تصمیم_درمانی, #پروتز_ثابت | medium |


### `/insight/insight-26.html`

- **Page type:** `insight`
- **Title:** انتقال صحیح اطلاعات Scan Body و نقش آن در موفقیت پروتز ایمپلنتی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بهترین دکتر، بهترین متخصص پروتز یا بهترین کلینیک در اهواز یا | [/litecast/lite-CAST11.html](/litecast/lite-CAST11.html) | insight → litecast | shared keywords: درست, پروتز; shared hashtags: #تصمیم_درمانی | medium |
| Self-defensive design و راه درست مقایسه ایمپلنت | [/metanotes/meta-5.html](/metanotes/meta-5.html) | insight → metanote | shared keywords: درست; shared hashtags: #تصمیم_درمانی | medium |
| قرارگیری عمیق ایمپلنت در فرش ساکت؛ مسئله‌ای که در مرحلهٔ پرو | [/chairside/chairside-10.html](/chairside/chairside-10.html) | insight → chairside | shared keywords: پروتز; shared hashtags: #پروتز_ایمپلنت | medium |


### `/insight/insight-27.html`

- **Page type:** `insight`
- **Title:** Low Temperature Degradation در زیرکونیا؛ آنچه باید بدانیم | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 28 — راه حل ته رنگ خاکستری روکش سرامیکی قدامی | [/insight/insight-28.html](/insight/insight-28.html) | insight → insight | shared keywords: clinical considerations zirconia restorations, insight; shared hashtags: #تصمیم_درمانی, #زیرکونیا, #پروتز_ثابت | medium |
| Insight — وقتی دندان کنار ایمپلنت مثل یک «پونتیک زنده» رفتار | [/insight/insight-24.html](/insight/insight-24.html) | insight → insight | shared keywords: insight; shared hashtags: #اکلوژن, #تصمیم_درمانی, #پروتز_ثابت | medium |
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | insight → insight | shared keywords: insight; shared hashtags: #تصمیم_درمانی, #زیرکونیا, #پروتز_ثابت | medium |


### `/insight/insight-28.html`

- **Page type:** `insight`
- **Title:** راهکار مقابله با ته رنگ خاکستری روکش | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | insight → insight | shared keywords: ceramic crown, insight, zirconia; shared hashtags: #تصمیم_درمانی, #روکش_سرامیکی, #زیرکونیا | medium |
| Insight 32 — کانتور مقعر در روکش سرامیکی | [/insight/insight-32.html](/insight/insight-32.html) | insight → insight | shared keywords: ceramic crown, insight, روکش, سرامیکی; shared hashtags: #روکش_سرامیکی, #پروتز_ثابت | medium |
| مرور علمی زیرکونیا – بخش اول | [/episodes/episode-87.html](/episodes/episode-87.html) | insight → episode | shared keywords: zirconia; shared hashtags: #زیرکونیا | medium |


### `/insight/insight-29.html`

- **Page type:** `insight`
- **Title:** راهکار مدیریت کانتکت بین روکشهای شش و هفت

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 28 — راه حل ته رنگ خاکستری روکش سرامیکی قدامی | [/insight/insight-28.html](/insight/insight-28.html) | insight → insight | shared keywords: ceramic crown, insight, zirconia; shared hashtags: #تصمیم_درمانی, #روکش_سرامیکی, #زیرکونیا | medium |
| یه نکته ی مهم در مورد باز شدن کانتکت بین ۶ و ۷ | [/metanotes/meta-12.html](/metanotes/meta-12.html) | insight → metanote | shared keywords: open contact, proximal contact, کانتکت; shared hashtags: #کانتکت | medium |
| مرور علمی زیرکونیا – بخش اول | [/episodes/episode-87.html](/episodes/episode-87.html) | insight → episode | shared keywords: zirconia; shared hashtags: #زیرکونیا | medium |


### `/insight/insight-3.html`

- **Page type:** `insight`
- **Title:** نظم در بستن مجدد هیلینگ‌ها؛ جزئیاتی برای راحتی بیمار در درمان‌های ایمپلنت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Bio‑Restorative Concept in Implant Dentistry :part2 | [/episodes/episode-157.html](/episodes/episode-157.html) | insight → episode | shared keywords: healing abutment, هیلینگ اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |
| Smart Vent Crown (SVC) — تعادل میان زیبایی، ایمنی بیولوژیک و | [/metanotes/meta-10.html](/metanotes/meta-10.html) | insight → metanote | shared keywords: implant prosthodontics; shared hashtags: #پروتز_ایمپلنت | medium |
| یک روش حداقلی برای خارج کردن پیچ شکسته ایمپلنت | [/metanotes/meta-8.html](/metanotes/meta-8.html) | insight → metanote | shared keywords: implant prosthodontics; shared hashtags: #پروتز_ایمپلنت | medium |


### `/insight/insight-30.html`

- **Page type:** `insight`
- **Title:** بررسی محل اسپرو در اباتمنت‌های Premill هنگام  عدم نشست روکش ایمپلنتی

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `میلینگ` | [Milling](/glossary/milling.html) | در اباتمنت‌های Premill که با سیستم‌های CAD/CAM ساخته می‌شوند، برای میلینگ قطعه معمولاً دو روش اتصال به دستگاه وجود دارد. روش اول … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Smart Vent Crown (SVC) — تعادل میان زیبایی، ایمنی بیولوژیک و | [/metanotes/meta-10.html](/metanotes/meta-10.html) | insight → metanote | shared keywords: implant prosthodontics; shared hashtags: #روکش_ایمپلنت, #پروتز_ایمپلنت | medium |
| روکش ایمپلنت چیست؟ | [/litecast/lite-CAST16.html](/litecast/lite-CAST16.html) | insight → litecast | shared keywords: implant crown, روکش; shared hashtags: #روکش_ایمپلنت | medium |
| Platform Switch – پایان | [/episodes/episode-83.html](/episodes/episode-83.html) | insight → episode | shared keywords: اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |


### `/insight/insight-31.html`

- **Page type:** `insight`
- **Title:** آیا اسکن‌بادی و Ti‑Base باید از یک برند باشند؟ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 30 — بررسی محل اسپرو در اباتمنت‌های Premill هنگام عد | [/insight/insight-30.html](/insight/insight-30.html) | insight → insight | shared keywords: implant prosthodontics, insight; shared hashtags: #cad_cam, #پروتز_ایمپلنت | medium |
| Ti-Base Abutments — ادامه بررسی (قسمت دوم) | [/episodes/episode-105.html](/episodes/episode-105.html) | insight → episode | shared keywords: base; shared hashtags: #tibase, #پروتز_ایمپلنت | medium |
| Ti-Base Abutments — جمع‌بندی (قسمت سوم) | [/episodes/episode-106.html](/episodes/episode-106.html) | insight → episode | shared keywords: base; shared hashtags: #tibase | medium |


### `/insight/insight-32.html`

- **Page type:** `insight`
- **Title:** کانتور مقعر در روکش سرامیکی

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 28 — راه حل ته رنگ خاکستری روکش سرامیکی قدامی | [/insight/insight-28.html](/insight/insight-28.html) | insight → insight | shared keywords: ceramic crown, insight, روکش, سرامیکی; shared hashtags: #روکش_سرامیکی, #پروتز_ثابت | medium |
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | insight → insight | shared keywords: ceramic crown, insight; shared hashtags: #روکش_سرامیکی, #پروتز_ثابت | medium |


### `/insight/insight-33.html`

- **Page type:** `insight`
- **Title:** گسترش هدفمند اسکن برای طراحی بهتر تاج ایمپلنت

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 40 — مدیریت خونریزی پیش از اسکن: پیش‌نیاز ثبت دقیق م | [/insight/insight-40.html](/insight/insight-40.html) | insight → insight | shared keywords: digital dentistry, digital impression accuracy, insight, intraoral scanning, اسکن; shared hashtags: #اسکن_داخل_دهانی, #دندانپزشکی_دیجیتال | medium |
| ایمپلنت دیجیتال چیست؟ | [/litecast/lite-CAST14.html](/litecast/lite-CAST14.html) | insight → litecast | shared keywords: digital dentistry; shared hashtags: #اسکن_دیجیتال, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — فوتوگرامتری در اسکن فول آرچ | [/episodes/episode-144-2.html](/episodes/episode-144-2.html) | insight → episode | shared keywords: اسکن; shared hashtags: #دندانپزشکی_دیجیتال | medium |


### `/insight/insight-34.html`

- **Page type:** `insight`
- **Title:** کنترل جریان ماده قالب‌گیری با Posterior Damming | افزایش دقت ثبت دندان‌های خلفی

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نکات قالب‌گیری در پروتز ثابت | [/notecast/episode-20.html](/notecast/episode-20.html) | insight → notecast | shared keywords: قالب; shared hashtags: #dentalimpression, #تری_قالبگیری | medium |


### `/insight/insight-35.html`

- **Page type:** `insight`
- **Title:** کوتاه دیده شدن اباتمنت در دهان | تشخیص خطا بین اسکن و ساخت اباتمنت

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `میلینگ` | [Milling](/glossary/milling.html) | … محتمل: ۱. خطای ساخت (Lab Processing Error) — در مرحله میلینگ یا فینیشینگ، مثلاً هنگام جدا کردن sprue، بخشی از ارتفاع اباتمنت … | **high** |
| `بعد عمودی` | [Vertical Dimension of Occlusion](/glossary/vertical-dimension-of-occlusion.html) | … می‌شود و بیشتر باید به مشکل در انتقال یا ساخت بعد عمودی فکر کرد. دو سناریوی محتمل: ۱. خطای ساخت (Lab Processing … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) | [/episodes/episode-102.html](/episodes/episode-102.html) | insight → episode | shared keywords: اباتمنت; shared hashtags: #اباتمنت, #پروتز_ایمپلنت | medium |
| یک روش حداقلی برای خارج کردن پیچ شکسته ایمپلنت | [/metanotes/meta-8.html](/metanotes/meta-8.html) | insight → metanote | shared keywords: implant prosthodontics; shared hashtags: #اباتمنت, #پروتز_ایمپلنت | medium |
| Platform Switch – پایان | [/episodes/episode-83.html](/episodes/episode-83.html) | insight → episode | shared keywords: اباتمنت; shared hashtags: #پروتز_ایمپلنت | medium |


### `/insight/insight-36.html`

- **Page type:** `insight`
- **Title:** ایزولاسیون با نوار تفلون در باندینگ لمینیت | کنترل توالی باند

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 37 — پریدگی دیستال لمینیت لترال: تداخل فانکشنال پنها | [/insight/insight-37.html](/insight/insight-37.html) | insight → insight | shared keywords: insight, prosthodontics; shared hashtags: #dentaltips, #laminateveneer, #prosthodontics | medium |


### `/insight/insight-37.html`

- **Page type:** `insight`
- **Title:** پریدگی دیستال لمینیت لترال | تداخل فانکشنال در حرکات پروتروزیو

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 36 — ایزولاسیون مرحله‌ای با نوار تفلون؛ کنترل توالی  | [/insight/insight-36.html](/insight/insight-36.html) | insight → insight | shared keywords: insight, prosthodontics; shared hashtags: #dentaltips, #laminateveneer, #prosthodontics | medium |
| ثبات رنگ لمینیت‌های سرامیکی | [/episodes/episode-19.html](/episodes/episode-19.html) | insight → episode | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |
| تراش لمینیت بر اساس ماک‌آپ | [/episodes/episode-38.html](/episodes/episode-38.html) | insight → episode | shared keywords: لمینیت; shared hashtags: #لمینیت | medium |


### `/insight/insight-39.html`

- **Page type:** `insight`
- **Title:** خروج از تونل کانال در دندان‌های C-Shape | وقتی پست‌و‌کور تنها مسیر نیست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … در دندان‌های مولر، مخصوصاً با پالپ‌چمبر قابل استفاده، گیر و مقاومت می‌تواند از طراحی کرونال، چسبندگی، پوشش مناسب کاسپ‌ها و فرم رستوریشن … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 17 — یک عدد کاربردی در آماده سازی کانال دندان | [/insight/insight-17.html](/insight/insight-17.html) | insight → insight | shared keywords: insight, کانال; shared hashtags: #اندودانتیکس, #پست_و_کور | medium |
| Insight 41 — ترتیب تراش در پست و کور: وقتی دسترسی، مسیر را ت | [/insight/insight-41.html](/insight/insight-41.html) | insight → insight | shared keywords: insight, prosthodontics, مسیر; shared hashtags: #پست_و_کور | medium |
| وقتی تحلیل سرویکال به معنای پایان دندان نیست | [/chairside/chairside-4.html](/chairside/chairside-4.html) | insight → chairside | shared keywords: prosthetic decision making, نیست | medium |


### `/insight/insight-4.html`

- **Page type:** `insight`
- **Title:** بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `قدرت باند` | [Bond Strength](/glossary/bond-strength.html) | در این کیس، با تکیه بر همان فلسفهٔ بیومیمتیک و قدرت باند بالای آن و با توجه به محدود بودن نازکی دیواره … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | insight → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | insight → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک — مرور فصل یک (قسمت سوم) | [/episodes/episode-92.html](/episodes/episode-92.html) | insight → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/insight/insight-40.html`

- **Page type:** `insight`
- **Title:** مدیریت خونریزی پیش از اسکن | پیش‌نیاز ثبت دقیق مارجین

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 33 — گسترش هدفمند اسکن برای رسیدن به فرم بهتر | [/insight/insight-33.html](/insight/insight-33.html) | insight → insight | shared keywords: digital dentistry, digital impression accuracy, insight, intraoral scanning, اسکن; shared hashtags: #اسکن_داخل_دهانی, #دندانپزشکی_دیجیتال | medium |
| دنتوپدیا — فوتوگرامتری در اسکن فول آرچ | [/episodes/episode-144-2.html](/episodes/episode-144-2.html) | insight → episode | shared keywords: اسکن; shared hashtags: #دندانپزشکی_دیجیتال | medium |
| اینسایت — تاثیر سرعت اسکن بر دقت (Scanning Duration) | [/episodes/episode-122-2.html](/episodes/episode-122-2.html) | insight → episode | shared keywords: اسکن; shared hashtags: #دندانپزشکی_دیجیتال | medium |


### `/insight/insight-41.html`

- **Page type:** `insight`
- **Title:** ترتیب تراش در پست و کور | وقتی دسترسی مسیر را تعیین می‌کند

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 39 — خروج از تونل کانال در دندان‌های C-Shape: وقتی پ | [/insight/insight-39.html](/insight/insight-39.html) | insight → insight | shared keywords: insight, prosthodontics, مسیر; shared hashtags: #پست_و_کور | medium |
| پیچ ایمپلنت چیست؟ | [/litecast/lite-CAST17.html](/litecast/lite-CAST17.html) | insight → litecast | shared keywords: prosthodontics; shared hashtags: #پروتز_دندانی | medium |
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | insight → litecast | shared keywords: prosthodontics; shared hashtags: #پروتز_دندانی | medium |


### `/insight/insight-5.html`

- **Page type:** `insight`
- **Title:** چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `شفافیت` | [Translucency](/glossary/translucency.html) | … (به‌ویژه زیرکونیا ) با سمان موقت، از نظر رنگ و شفافیت نتیجه‌ی نهایی بسیار مطلوب به‌نظر می‌رسد و بیمار هم از ظاهر … | **high** |
| `سمان زینک‌فسفات` | [Traditional Cements](/glossary/traditional-cements.html) | در این حالت، سمان زینک‌فسفات گزینه‌ای مناسب است؛ زیرا از نظر رنگ و شفافیت، شباهت … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامهٔ مباحث سمان‌ها | [/episodes/episode-3.html](/episodes/episode-3.html) | insight → episode | shared keywords: سمان, سمان رزینی; shared hashtags: #سمان | medium |
| طول عمر آنله‌های سرامیکی | [/episodes/episode-15.html](/episodes/episode-15.html) | insight → episode | shared keywords: سرامیکی; shared hashtags: #سرامیک | medium |
| انواع سمان و اصول سمان‌کردن | [/episodes/episode-2.html](/episodes/episode-2.html) | insight → episode | shared keywords: سمان; shared hashtags: #سمان | medium |


### `/insight/insight-6.html`

- **Page type:** `insight`
- **Title:** تحلیل تهیهٔ فضا در بیمار فاقد استاپ خلفی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight — بازگرداندن ارتفاع عمودی صحیح | [/insight/insight-12.html](/insight/insight-12.html) | insight → insight | shared keywords: full mouth rehabilitation, loss of posterior support; shared hashtags: #vdo, #استاپ_خلفی, #اکلوژن | medium |


### `/insight/insight-7.html`

- **Page type:** `insight`
- **Title:** چرا این دندان امکان بازسازی دائمی ندارد؟ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقدمه‌ای بر Ferrule – بخش اول | [/episodes/episode-47.html](/episodes/episode-47.html) | insight → episode | shared keywords: ferrule effect; shared hashtags: #فرول | medium |
| فرول؛ یکی از مهم‌ترین پایه‌های یک درمان موفق | [/chairside/chairside-6.html](/chairside/chairside-6.html) | insight → chairside | shared keywords: ferrule effect; shared hashtags: #فرول | medium |


### `/dentai/dentai-1.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۱: تمایز بین خطوط ترک سنتی و داخلی در مینای دندان | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | dentai → dentai | shared keywords: dentai, restorative dentistry, بیومیمتیک, ترمیمی; shared hashtags: #dentai, #بیومیمتیک | medium |
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | dentai → episode | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | dentai → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-10.html`

- **Page type:** `dentai`
- **Title:** DentAI – تراش Elbow zone   در تراش لمینیت های سرامیکی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ثبات رنگ لمینیت‌های سرامیکی | [/episodes/episode-19.html](/episodes/episode-19.html) | dentai → episode | shared keywords: سرامیکی, لمینیت | medium |
| تراش لمینیت بر اساس ماک‌آپ | [/episodes/episode-38.html](/episodes/episode-38.html) | dentai → episode | shared keywords: تراش, لمینیت | medium |
| BOPT — اصول تراش و آماده‌سازی | [/episodes/episode-95.html](/episodes/episode-95.html) | dentai → episode | shared keywords: تراش; shared hashtags: #تراش_دندان | medium |


### `/dentai/dentai-11.html`

- **Page type:** `dentai`
- **Title:** DentAI – Peripheral Seal Zone (PSZ) و CRE در برداشت پوسیدگی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | [/episodes/episode-65.html](/episodes/episode-65.html) | dentai → episode | shared keywords: peripheral, peripheral seal zone, seal, zone, برداشت; shared hashtags: #بیومیمتیک | **high** |
| DentAI –    تشریح ترکها و نقاط پایانی حذف ترک | [/dentai/dentai-15.html](/dentai/dentai-15.html) | dentai → dentai | shared keywords: central stop zone, dentai, peripheral seal zone, ترمیم بیومیمتیک; shared hashtags: #psz, #بیومیمتیک | medium |
| Peripheral Seal Zone – ادامه بحث | [/episodes/episode-66.html](/episodes/episode-66.html) | dentai → episode | shared keywords: peripheral, seal, zone, برداشت پوسیدگی عمیق; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-12.html`

- **Page type:** `dentai`
- **Title:** DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | [/episodes/episode-65.html](/episodes/episode-65.html) | dentai → episode | shared keywords: پوسیدگی; shared hashtags: #بیومیمتیک, #پوسیدگی | **high** |
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | dentai → episode | shared keywords: بیومیمتیک, دندانپزشکی; shared hashtags: #بیومیمتیک | medium |
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | dentai → episode | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-13.html`

- **Page type:** `dentai`
- **Title:** DentAI –   تشخیص آسیبهای ساختاری دندان

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … نشان داده‌اند که عرض ایستموس در حد ۲ میلی‌متر می‌تواند مقاومت دندان در برابر شکستگی را تا ۶۰٪ کاهش دهد. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –    تشخیص آسیبهای ساختاری دندان | [/dentai/dentai-14.html](/dentai/dentai-14.html) | dentai → dentai | shared keywords: biorim, dentai, enamel crack, peripheral rim fracture, prf; shared hashtags: #peripheral rim fracture, #prf, #بیومیمتیک | **high** |
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | dentai → episode | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | dentai → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-14.html`

- **Page type:** `dentai`
- **Title:** DentAI –   انواع ترک دندان و نحوه ی تشخیص

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –    تشخیص آسیبهای ساختاری دندان | [/dentai/dentai-13.html](/dentai/dentai-13.html) | dentai → dentai | shared keywords: biorim, dentai, enamel crack, peripheral rim fracture, prf; shared hashtags: #peripheral rim fracture, #prf, #بیومیمتیک | **high** |
| بیومیمتیک — مرور فصل یک (قسمت دوم) | [/episodes/episode-91.html](/episodes/episode-91.html) | dentai → episode | shared keywords: restorative dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | dentai → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-15.html`

- **Page type:** `dentai`
- **Title:** DentAI – تشریح ترک دندان و نقاط پایانی حذف ترک (CrRE)

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – برداشت پوسیدگی از Peripheral Seal Zone (PSZ) و CRE | [/dentai/dentai-11.html](/dentai/dentai-11.html) | dentai → dentai | shared keywords: central stop zone, dentai, peripheral seal zone, ترمیم بیومیمتیک; shared hashtags: #psz, #بیومیمتیک | medium |
| Decoupling With Time – بخش پایانی | [/episodes/episode-74.html](/episodes/episode-74.html) | dentai → episode | shared keywords: پایانی; shared hashtags: #بیومیمتیک | medium |
| Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | [/episodes/episode-65.html](/episodes/episode-65.html) | dentai → episode | shared keywords: peripheral seal zone; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-16.html`

- **Page type:** `dentai`
- **Title:** DentAI – سلسله‌مراتب قابلیت باند (HOB) و تفاوت قدرت باند در مینا و عاج

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استراتژی باندینگ` | [Bonding Strategy](/glossary/bonding-strategy.html) | انتخاب استراتژی باندینگ: HOB بر انتخاب سیستم ادهزیو و تکنیک اچینگ (توتال اچ، … | **high** |
| `سلف اچ` | [Self-Etch](/glossary/self-etch.html) | … HOB بر انتخاب سیستم ادهزیو و تکنیک اچینگ (توتال اچ، سلف اچ) تاثیر می‌گذارد. برای مثال، در عاج عفونی، استفاده از سیستم‌های … | **high** |
| `Dentin Sealing` | [Dentin Sealing](/glossary/dentin-sealing.html) | … درک مکانیسم و مزایای تکنیک‌هایی مانند "عایق‌بندی فوری عاج" (Immediate Dentin Sealing - IDS) و "پوشش رزین" (Resin Coating - RC) کمک … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – اثر محلول تشخیص پوسیدگی روی باند | [/dentai/dentai-4.html](/dentai/dentai-4.html) | dentai → dentai | shared keywords: biomimetic dentistry, dentai, باند; shared hashtags: #باندینگ, #بیومیمتیک, #قدرت_باند | medium |
| چالش‌های باند به عاج ریشه | [/episodes/episode-36.html](/episodes/episode-36.html) | dentai → episode | shared keywords: باند; shared hashtags: #باندینگ | medium |
| باند به کامپوزیت قدیمی | [/episodes/episode-44.html](/episodes/episode-44.html) | dentai → episode | shared keywords: باند; shared hashtags: #باندینگ | medium |


### `/dentai/dentai-2.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۲: رزین اینفیلتریشن برای درمان لکه‌های سفید دندانی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | ایزولاسیون دندان با استفاده از رابردم یا اپتراگیت | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI -انواع ترک مینایی تشخیص و درمان ترمیمی | [/dentai/dentai-1.html](/dentai/dentai-1.html) | dentai → dentai | shared keywords: dentai, ترمیمی; shared hashtags: #dentai, #مینای_دندان | medium |
| رزین اینفیلتریشن — درمان ضایعات سفید | [/episodes/episode-99.html](/episodes/episode-99.html) | dentai → episode | shared keywords: اینفیلتریشن, رزین, سفید | medium |


### `/dentai/dentai-3.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۳: اجماع جهانی در اصطلاحات مدیریت ضایعات پوسیدگی (ICCC) | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `شفافیت` | [Translucency](/glossary/translucency.html) | **شفافیت و دقت در تحقیقات:** استفاده از اصطلاحات دقیق و استاندارد، باعث … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI –   در مورد استفاده از  CDD  در دندانپزشکی بیومیمتیک | [/dentai/dentai-12.html](/dentai/dentai-12.html) | dentai → dentai | shared keywords: dentai, ترمیمی, پوسیدگی; shared hashtags: #dentai | medium |
| Peripheral Seal Zone و برداشت پوسیدگی – بخش اول | [/episodes/episode-65.html](/episodes/episode-65.html) | dentai → episode | shared keywords: برداشت پوسیدگی, پوسیدگی | medium |
| گایدلاین‌های درمان پوسیدگی (MID) — قسمت اول | [/episodes/episode-134.html](/episodes/episode-134.html) | dentai → episode | shared keywords: برداشت پوسیدگی, پوسیدگی | medium |


### `/dentai/dentai-4.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۴: اثر Caries Detector بر استحکام باند | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `سیستم‌های باندینگ` | [pH of Adhesive Systems](/glossary/ph-of-adhesive-systems.html) | … استفاده به طور کامل با آب شسته شد، هیچکدام از سیستم‌های باندینگ مورد بررسی، کاهش معنی‌داری در استحکام باند نشان ندادند. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو | [/insight/insight-4.html](/insight/insight-4.html) | dentai → insight | shared keywords: biomimetic bonding, biomimetic dentistry, بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| ادامه مبحث بیومیمتیک – بخش دوم | [/episodes/episode-54.html](/episodes/episode-54.html) | dentai → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |
| آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول | [/episodes/episode-53.html](/episodes/episode-53.html) | dentai → episode | shared keywords: بیومیمتیک; shared hashtags: #بیومیمتیک | medium |


### `/dentai/dentai-5.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۵: بررسی ۱۴ ساله باندینگ سلف‌اچ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه کیور کردن یا نکردن باندینگ پیش از قرار دادن  | [/dentai/dentai-8.html](/dentai/dentai-8.html) | dentai → dentai | shared keywords: adhesive dentistry, dentai, باندینگ, مقایسه; shared hashtags: #dentai, #باندینگ | medium |
| باندینگ‌های یونیورسال | [/episodes/episode-5.html](/episodes/episode-5.html) | dentai → episode | shared keywords: باندینگ; shared hashtags: #باندینگ, #بیومیمتیک | medium |
| نسل‌های مختلف باندینگ | [/episodes/episode-4.html](/episodes/episode-4.html) | dentai → episode | shared keywords: باندینگ; shared hashtags: #باندینگ, #بیومیمتیک | medium |


### `/dentai/dentai-6.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۶: طبقه‌بندی کامپوزیت‌ها بر اساس ذرات | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | معایب: استحکام پایین و مقاومت کم در برابر سایش. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| باند به کامپوزیت قدیمی | [/episodes/episode-44.html](/episodes/episode-44.html) | dentai → episode | shared keywords: کامپوزیت; shared hashtags: #کامپوزیت | medium |
| اینسایت — طراحی تراش و مقاومت به شکست (کامپوزیت) | [/episodes/episode-128-2.html](/episodes/episode-128-2.html) | dentai → episode | shared keywords: کامپوزیت; shared hashtags: #کامپوزیت | medium |


### `/dentai/dentai-7.html`

- **Page type:** `dentai`
- **Title:** DentAI – مقالهٔ ۷: عملکرد بالینی RBFDPها و طراحی فریم‌ورک | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `استحکام باند` | [Bond Strength](/glossary/bond-strength.html) | روش‌های آماده‌سازی سطح می‌توانند بر استحکام باند و بقای RBFDPها تأثیرگذار باشند. | **high** |
| `زیرکونیا` | [Zirconia (Zirconium Oxide)](/glossary/zirconia.html) | سرامیک In-Ceram Zirconia که حدود ۲۶٪ زیرکونیا دارد، در یک مطالعه ۱۰ ساله میزان بقای ۹۴.۴٪ را نشان … | **high** |
| `سمان‌های رزینی` | [Resin Cements](/glossary/resin-cements.html) | رست لینگوال برای قرارگیری دقیق: اگرچه در اتصال با سمان‌های رزینی الزام به فرم نگهدارنده وجود ندارد، اما استفاده از رست … | **high** |


### `/dentai/dentai-8.html`

- **Page type:** `dentai`
- **Title:** DentAI – کیور کردن یا نکردن باندینگ قبل از کامپوزیت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه ۱۴ ساله باندینگ‌های سلف‌اچ و اچ‌اند‌رینس | [/dentai/dentai-5.html](/dentai/dentai-5.html) | dentai → dentai | shared keywords: adhesive dentistry, dentai, باندینگ, مقایسه; shared hashtags: #dentai, #باندینگ | medium |
| باند به کامپوزیت قدیمی | [/episodes/episode-44.html](/episodes/episode-44.html) | dentai → episode | shared keywords: کامپوزیت; shared hashtags: #باندینگ, #کامپوزیت | medium |
| باندینگ‌های یونیورسال | [/episodes/episode-5.html](/episodes/episode-5.html) | dentai → episode | shared keywords: باندینگ; shared hashtags: #باندینگ | medium |


### `/dentai/dentai-9.html`

- **Page type:** `dentai`
- **Title:** DentAI – تکنیک Snow Plow در ترمیم‌های کامپوزیتی | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مراحل باندینگ` | [Bonding / Bonding Protocol](/glossary/bonding-protocol.html) | … این شامل برداشت پوسیدگی، تمیز کردن و شکل‌دهی حفره و مراحل باندینگ است. | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – مقایسه کیور کردن یا نکردن باندینگ پیش از قرار دادن  | [/dentai/dentai-8.html](/dentai/dentai-8.html) | dentai → dentai | shared keywords: dentai, باندینگ دندانی; shared hashtags: #dentai, #باندینگ, #کامپوزیت | medium |


### `/chairside/chairside-1.html`

- **Page type:** `chairside`
- **Title:** Chairside 01 — تصمیم زیبایی در حضور دیاستم | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چرا پیش‌آگهی‌های ذکر شده در مقالات برای دندانهای درمان پریو  | [/metanotes/meta-1.html](/metanotes/meta-1.html) | chairside → metanote | shared keywords: تصمیم, زیبایی; shared hashtags: #تصمیم_درمانی, #لمینیت | medium |
| Black Triangle و اصلاح زیبایی آن | [/episodes/episode-39.html](/episodes/episode-39.html) | chairside → episode | shared keywords: زیبایی; shared hashtags: #لمینیت | medium |


### `/chairside/chairside-11.html`

- **Page type:** `chairside`
- **Title:** Chairside 11 — نبود اکلوژن خلفی؛ مانعی پنهان برای اوردنچر فک بالا | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ادامه مسیر انتخاب اتچمنت برای اوردنچر | [/episodes/episode-51.html](/episodes/episode-51.html) | chairside → episode | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |
| مقایسهٔ اتچمنت‌ها در اوردنچر | [/episodes/episode-27.html](/episodes/episode-27.html) | chairside → episode | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |
| شروع Learning Pathway – انتخاب اتچمنت در اوردنچر | [/episodes/episode-50.html](/episodes/episode-50.html) | chairside → episode | shared keywords: اوردنچر; shared hashtags: #اوردنچر | medium |


### `/chairside/chairside-12.html`

- **Page type:** `chairside`
- **Title:** Chairside 12 — فاصله فینیش‌لاین از مارجین روکش؛ خطایی که دیر دیده می‌شود | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 18 — فینیش‌لاین عمودی؛ وقتی «خط» وجود ندارد | [/insight/insight-18.html](/insight/insight-18.html) | chairside → insight | shared keywords: فینیش, لاین; shared hashtags: #فینیش_لاین | medium |


### `/chairside/chairside-15.html`

- **Page type:** `chairside`
- **Title:** Chairside 15 — اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی ناهماهنگی الگوی طرفی، علامت‌دار می‌شود | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| در بازسازی اکلوژن گروپ فانکشن حواستون به تداخل سمت کارگر باش | [/dentcast-plus/video-6.html](/dentcast-plus/video-6.html) | chairside → dentcast_plus | shared keywords: اکلوژن, فانکشن, گروپ; shared hashtags: #اکلوژن, #روکش | medium |
| اکلوژن در درمان‌های ایمپلنت – با حضور دکتر الله‌بخشی | [/episodes/episode-60.html](/episodes/episode-60.html) | chairside → episode | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |
| Vertical Dimension of Occlusion – Myth 1 | [/episodes/episode-154.html](/episodes/episode-154.html) | chairside → episode | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |


### `/chairside/chairside-16.html`

- **Page type:** `chairside`
- **Title:** Chairside 16 — وقتی حفظ دندان، به قیمت از دست رفتن استخوان تمام می‌شود | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `جراحی افزایش طول تاج` | [Crown Lengthening](/glossary/crown-lengthening.html) | … کردن روکش‌ها، به علت باقی ماندن التهاب، برای حفظ دندان‌ها جراحی افزایش طول تاج انجام شده بود. بیمار تعریف می‌کرد که قبل … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Share Hub — چرا گاهی اصلاح فضا به قیمت از دست رفتن رابطه کان | [/sharehub/share-5.html](/sharehub/share-5.html) | chairside → sharehub | shared keywords: رفتن, قیمت | medium |


### `/chairside/chairside-2.html`

- **Page type:** `chairside`
- **Title:** Chairside 02 — فضای بیش‌ازحد در ناحیه پرمولر | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 19 — ارزیابی فضای بازسازی در درمان ارتودنسی–پروتزی | [/insight/insight-19.html](/insight/insight-19.html) | chairside → insight | shared keywords: ارتودنسی, فضای, پروتزی | medium |


### `/chairside/chairside-4.html`

- **Page type:** `chairside`
- **Title:** Chairside 04 — تحلیل سرویکال دندان قدامی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 39 — خروج از تونل کانال در دندان‌های C-Shape: وقتی پ | [/insight/insight-39.html](/insight/insight-39.html) | chairside → insight | shared keywords: prosthetic decision making, نیست | medium |
| Insight 23 — وقتی رادیولوسنسی زیر ترمیم، پوسیدگی نیست | [/insight/insight-23.html](/insight/insight-23.html) | chairside → insight | shared keywords: نیست; shared hashtags: #تصمیم_درمانی | medium |


### `/chairside/chairside-5.html`

- **Page type:** `chairside`
- **Title:** Chairside 05 — خم شدن پست دندانی و نبود فرول | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقدمه‌ای بر Ferrule – بخش اول | [/episodes/episode-47.html](/episodes/episode-47.html) | chairside → episode | shared keywords: ferrule effect; shared hashtags: #فرول, #پست_و_کور | medium |
| بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو | [/insight/insight-4.html](/insight/insight-4.html) | chairside → insight | shared keywords: ferrule effect, فرول; shared hashtags: #فرول | medium |
| بررسی Ferrule – بخش دوم | [/episodes/episode-48.html](/episodes/episode-48.html) | chairside → episode | shared keywords: فرول; shared hashtags: #فرول | medium |


### `/chairside/chairside-6.html`

- **Page type:** `chairside`
- **Title:** Chairside 06 — نبود فرول در دندان ۶ پایین و تحلیل طرح درمان | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| مقدمه‌ای بر Ferrule – بخش اول | [/episodes/episode-47.html](/episodes/episode-47.html) | chairside → episode | shared keywords: ferrule effect; shared hashtags: #فرول | medium |
| چرا این دندان امکان بازسازی دائمی ندارد؟ | [/insight/insight-7.html](/insight/insight-7.html) | chairside → insight | shared keywords: ferrule effect; shared hashtags: #فرول | medium |


### `/chairside/chairside-7.html`

- **Page type:** `chairside`
- **Title:** Chairside 07 — درد مبهم در ناحیه مزیال دندان ۶ بالا | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نقش رفتار بیمار در درمان پریو و ایمپلنت | [/metanotes/meta-2.html](/metanotes/meta-2.html) | chairside → metanote | shared keywords: بیمار; shared hashtags: #پریودنتال | medium |


### `/chairside/chairside-8.html`

- **Page type:** `chairside`
- **Title:** Chairside 08 — نمای بیش‌ازحد ریج در بیمار متقاضی دنچر | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — سیستم BPS در دنچر کامل | [/episodes/episode-147-1.html](/episodes/episode-147-1.html) | chairside → episode | shared keywords: دنچر; shared hashtags: #دنچر, #پروتز_متحرک | medium |
| چرا دنچر پایین(دندان مصنوعی ) لق می‌شود؟ | [/litecast/lite-CAST2.html](/litecast/lite-CAST2.html) | chairside → litecast | shared keywords: دنچر; shared hashtags: #اوردنچر, #دنچر | medium |


### `/metanotes/en/meta-3.html`

- **Page type:** `metanote`
- **Title:** MetaNote 03 — Success vs. Survival in Periodontally Compromised Teeth and Implants | DentCast

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Should Implants Be Judged Like Natural Teeth? (The Rasperini | [/metanotes/en/meta-4.html](/metanotes/en/meta-4.html) | metanote → metanote | shared keywords: implants, teeth | medium |


### `/metanotes/en/meta-4.html`

- **Page type:** `metanote`
- **Title:** MetaNote 04 — Should Implants Be Judged Like Natural Teeth? | DentCast

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| The Success vs. Survival Game in Periodontally Compromised T | [/metanotes/en/meta-3.html](/metanotes/en/meta-3.html) | metanote → metanote | shared keywords: implants, teeth | medium |


### `/metanotes/meta-1.html`

- **Page type:** `metanote`
- **Title:** MetaNote 01 — پیش‌آگهی درمان پریو و زیبایی | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| نقش رفتار بیمار در درمان پریو و ایمپلنت | [/metanotes/meta-2.html](/metanotes/meta-2.html) | metanote → metanote | shared keywords: periodontal prognosis, پریو; shared hashtags: #تصمیم_درمانی, #متانوت, #پریودنتال | medium |
| تصمیم‌گیری زیبایی در حضور دیاستم | [/chairside/chairside-1.html](/chairside/chairside-1.html) | metanote → chairside | shared keywords: تصمیم, زیبایی; shared hashtags: #تصمیم_درمانی, #لمینیت | medium |
| Insight 20 — وقتی به درمان ریشه مطمئن نیستیم، طراحی کور و پس | [/insight/insight-20.html](/insight/insight-20.html) | metanote → insight | shared keywords: تصمیم; shared hashtags: #تصمیم_درمانی | medium |


### `/metanotes/meta-10.html`

- **Page type:** `metanote`
- **Title:** MetaNote 10 — Smart Vent Crown (SVC) و Shahabian Concept | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — کانسپت شهابیان (Smart Vent Crown) | [/episodes/episode-148-2.html](/episodes/episode-148-2.html) | metanote → episode | shared keywords: crown, smart, vent; shared hashtags: #smartventcrown, #روکش_ایمپلنت | medium |
| Insight 30 — بررسی محل اسپرو در اباتمنت‌های Premill هنگام عد | [/insight/insight-30.html](/insight/insight-30.html) | metanote → insight | shared keywords: implant prosthodontics; shared hashtags: #روکش_ایمپلنت, #پروتز_ایمپلنت | medium |
| نظم در بستن مجدد هیلینگ‌ها: تفاوت کوچک، راحتی بزرگ | [/insight/insight-3.html](/insight/insight-3.html) | metanote → insight | shared keywords: implant prosthodontics; shared hashtags: #پروتز_ایمپلنت | medium |


### `/metanotes/meta-12.html`

- **Page type:** `metanote`
- **Title:** MetaNote 12 — یه نکته ی مهم در مدیریت کانتکت بین ۶ و ۷ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | metanote → insight | shared keywords: open contact, proximal contact, کانتکت; shared hashtags: #کانتکت | medium |
| دنتوپدیا — مدیریت کانتکت‌های بین دندانی | [/episodes/episode-121-1.html](/episodes/episode-121-1.html) | metanote → episode | shared keywords: food impaction, کانتکت | medium |
| وقتی روکش راک دارد؛ ترتیب بررسی مهم است | [/dentcast-plus/video-3.html](/dentcast-plus/video-3.html) | metanote → dentcast_plus | shared keywords: proximal contact; shared hashtags: #کانتکت | medium |


### `/metanotes/meta-2.html`

- **Page type:** `metanote`
- **Title:** MetaNote 02 — نقش رفتار بیمار در درمان پریو و ایمپلنت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چرا پیش‌آگهی‌های ذکر شده در مقالات برای دندانهای درمان پریو  | [/metanotes/meta-1.html](/metanotes/meta-1.html) | metanote → metanote | shared keywords: periodontal prognosis, پریو; shared hashtags: #تصمیم_درمانی, #متانوت, #پریودنتال | medium |
| Insight — وقتی دندان کنار ایمپلنت مثل یک «پونتیک زنده» رفتار | [/insight/insight-24.html](/insight/insight-24.html) | metanote → insight | shared keywords: رفتار; shared hashtags: #تصمیم_درمانی | medium |


### `/metanotes/meta-3.html`

- **Page type:** `metanote`
- **Title:** MetaNote 03 — بازی Success و Survival در دندان پریویی و ایمپلنت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آیا ایمپلنت را باید مثل دندان قضاوت کرد؟ (مطالعه Rasperini) | [/metanotes/meta-4.html](/metanotes/meta-4.html) | metanote → metanote | shared keywords: periodontal maintenance; shared hashtags: #تصمیم_درمانی, #متانوت, #پریودنتال | medium |


### `/metanotes/meta-4.html`

- **Page type:** `metanote`
- **Title:** MetaNote 04 — آیا ایمپلنت را باید مثل دندان قضاوت کرد؟ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| بازی Success و Survival در دندان پریویی و ایمپلنت | [/metanotes/meta-3.html](/metanotes/meta-3.html) | metanote → metanote | shared keywords: periodontal maintenance; shared hashtags: #تصمیم_درمانی, #متانوت, #پریودنتال | medium |
| Self-defensive design و راه درست مقایسه ایمپلنت | [/metanotes/meta-5.html](/metanotes/meta-5.html) | metanote → metanote | shared keywords: implant biology; shared hashtags: #تحلیل_مطالعه, #تصمیم_درمانی, #متانوت | medium |


### `/metanotes/meta-5.html`

- **Page type:** `metanote`
- **Title:** MetaNote 05 — Self-defensive design و راه درست مقایسه ایمپلنت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آیا ایمپلنت را باید مثل دندان قضاوت کرد؟ (مطالعه Rasperini) | [/metanotes/meta-4.html](/metanotes/meta-4.html) | metanote → metanote | shared keywords: implant biology; shared hashtags: #تحلیل_مطالعه, #تصمیم_درمانی, #متانوت | medium |


### `/metanotes/meta-6.html`

- **Page type:** `metanote`
- **Title:** MetaNote 06 — Meta Decision Method؛ چطور تصمیم بگیریم؟ | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| تصمیم‌گیری زیبایی در حضور دیاستم | [/chairside/chairside-1.html](/chairside/chairside-1.html) | metanote → chairside | shared keywords: تصمیم; shared hashtags: #تصمیم_درمانی | medium |


### `/metanotes/meta-7.html`

- **Page type:** `metanote`
- **Title:** MetaNote 07 — فایبر پست؛ مسئله‌ای که بیش از حد جدی گرفته شد | دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `ایزولاسیون` | [Isolation](/glossary/isolation.html) | ایزولاسیون دشوار دارد | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| راهنمای جامع فایبر پست‌ها — (قسمت اول) | [/episodes/episode-128.html](/episodes/episode-128.html) | metanote → episode | shared keywords: fiber post, فایبر; shared hashtags: #فایبر_پست | medium |
| فایبر پست – نکات کلینیکی با دکتر دریاکناری | [/episodes/episode-79.html](/episodes/episode-79.html) | metanote → episode | shared keywords: fiber post, فایبر | medium |
| راهنمای جامع فایبر پست‌ها — (قسمت دوم) | [/episodes/episode-129.html](/episodes/episode-129.html) | metanote → episode | shared keywords: فایبر; shared hashtags: #فایبر_پست | medium |


### `/metanotes/meta-8.html`

- **Page type:** `metanote`
- **Title:** MetaNote 08 — یک روش حداقلی برای خارج کردن پیچ شکسته ایمپلنت | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 22 — خارج کردن پیچ شکستهٔ اباتمنت در شکست‌های ثانویه | [/insight/insight-22.html](/insight/insight-22.html) | metanote → insight | shared keywords: abutment screw fracture, implant prosthodontics, خارج; shared hashtags: #پروتز_ایمپلنت | medium |
| Insight 35 — کوتاه دیده شدن اباتمنت در دهان؛ تمایز خطای جهت  | [/insight/insight-35.html](/insight/insight-35.html) | metanote → insight | shared keywords: implant prosthodontics; shared hashtags: #اباتمنت, #پروتز_ایمپلنت | medium |


### `/metanotes/meta-9.html`

- **Page type:** `metanote`
- **Title:** MetaNote 09 — چرا تحویل همزمان پست‌و‌کور و روکش، تصمیم دقیقی نیست | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 20 — وقتی به درمان ریشه مطمئن نیستیم، طراحی کور و پس | [/insight/insight-20.html](/insight/insight-20.html) | metanote → insight | shared keywords: تصمیم; shared hashtags: #تصمیم_درمانی, #پست_و_کور | medium |
| تصمیم‌گیری زیبایی در حضور دیاستم | [/chairside/chairside-1.html](/chairside/chairside-1.html) | metanote → chairside | shared keywords: تصمیم; shared hashtags: #تصمیم_درمانی | medium |
| Insight 23 — وقتی رادیولوسنسی زیر ترمیم، پوسیدگی نیست | [/insight/insight-23.html](/insight/insight-23.html) | metanote → insight | shared keywords: نیست; shared hashtags: #تصمیم_درمانی | medium |


### `/litecast/lite-CAST10.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | چرا روکش بعضی از ایمپلنت‌ها شل می‌شود؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| وقتی که باید روکش ایمپلنت را تکرار زد | [/dentcast-plus/video-5.html](/dentcast-plus/video-5.html) | litecast → dentcast_plus | shared keywords: روکش; shared hashtags: #اباتمنت, #روکش_ایمپلنت | medium |


### `/litecast/lite-CAST11.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | بهترین دکتر، بهترین متخصص پروتز یا بهترین کلینیک؟

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `شفافیت` | [Translucency](/glossary/translucency.html) | … عنوان «بهترین»، به معیارهای پشت انتخاب توجه شود: تجربهٔ مرتبط، شفافیت در توضیح درمان، توانایی تحلیل شرایط فردی بیمار، و مسئولیت‌پذیری در … | medium |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 26 — انتقال درست اطلاعات Scan Body؛ یکی از ارکان موف | [/insight/insight-26.html](/insight/insight-26.html) | litecast → insight | shared keywords: درست, پروتز; shared hashtags: #تصمیم_درمانی | medium |
| Self-defensive design و راه درست مقایسه ایمپلنت | [/metanotes/meta-5.html](/metanotes/meta-5.html) | litecast → metanote | shared keywords: درست; shared hashtags: #تصمیم_درمانی | medium |


### `/litecast/lite-CAST12.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | ایمپلنت چیست؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت فوری چیست؟ | [/litecast/lite-CAST15.html](/litecast/lite-CAST15.html) | litecast → litecast | shared keywords: dental implant, implant treatment, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |
| روکش ایمپلنت چیست؟ | [/litecast/lite-CAST16.html](/litecast/lite-CAST16.html) | litecast → litecast | shared keywords: implant treatment, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت, #روکش_ایمپلنت | medium |
| پیچ ایمپلنت چیست؟ | [/litecast/lite-CAST17.html](/litecast/lite-CAST17.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |


### `/litecast/lite-CAST14.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | ایمپلنت دیجیتال چیست؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت دیجیتال یعنی چی؟ | [/litecast/lite-CAST9.html](/litecast/lite-CAST9.html) | litecast → litecast | shared keywords: digital dental implant, دیجیتال; shared hashtags: #ایمپلنت_دیجیتال, #دندانپزشکی_دیجیتال | medium |
| پیچ ایمپلنت چیست؟ | [/litecast/lite-CAST17.html](/litecast/lite-CAST17.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |
| ایمپلنت فوری چیست؟ | [/litecast/lite-CAST15.html](/litecast/lite-CAST15.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |


### `/litecast/lite-CAST15.html`

- **Page type:** `litecast`
- **Title:** ایمپلنت فوری چیست؟ | Lite-CAST

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت چیست؟ | [/litecast/lite-CAST12.html](/litecast/lite-CAST12.html) | litecast → litecast | shared keywords: dental implant, implant treatment, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |
| روکش ایمپلنت چیست؟ | [/litecast/lite-CAST16.html](/litecast/lite-CAST16.html) | litecast → litecast | shared keywords: implant treatment, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |
| ایمپلنت فوری در ناحیه زیبایی (ITI Consensus 2023) | [/episodes/episode-150.html](/episodes/episode-150.html) | litecast → episode | shared keywords: immediate implant, فوری; shared hashtags: #ایمپلنت_فوری | medium |


### `/litecast/lite-CAST16.html`

- **Page type:** `litecast`
- **Title:** روکش ایمپلنت چیست؟ | Lite-CAST

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| پیچ ایمپلنت چیست؟ | [/litecast/lite-CAST17.html](/litecast/lite-CAST17.html) | litecast → litecast | shared keywords: implant prosthesis, implant restoration, prosthodontics, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت, #پروتز_دندانی | medium |
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | litecast → litecast | shared keywords: implant restoration, prosthodontics, چیست؟; shared hashtags: #آگاهی_درمانی, #روکش_ایمپلنت, #پروتز_دندانی | medium |
| ایمپلنت چیست؟ | [/litecast/lite-CAST12.html](/litecast/lite-CAST12.html) | litecast → litecast | shared keywords: implant treatment, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت, #روکش_ایمپلنت | medium |


### `/litecast/lite-CAST17.html`

- **Page type:** `litecast`
- **Title:** پیچ ایمپلنت چیست؟ | Lite-CAST

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | litecast → litecast | shared keywords: dental implant treatment, implant components, implant restoration, prosthodontics, چیست؟; shared hashtags: #آگاهی_درمانی, #اجزای_ایمپلنت, #پروتز_دندانی | **high** |
| روکش ایمپلنت چیست؟ | [/litecast/lite-CAST16.html](/litecast/lite-CAST16.html) | litecast → litecast | shared keywords: implant prosthesis, implant restoration, prosthodontics, چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت, #پروتز_دندانی | medium |
| ایمپلنت فوری چیست؟ | [/litecast/lite-CAST15.html](/litecast/lite-CAST15.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |


### `/litecast/lite-CAST18.html`

- **Page type:** `litecast`
- **Title:** اباتمنت چیست؟ | Lite-CAST

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| پیچ ایمپلنت چیست؟ | [/litecast/lite-CAST17.html](/litecast/lite-CAST17.html) | litecast → litecast | shared keywords: dental implant treatment, implant components, implant restoration, prosthodontics, چیست؟; shared hashtags: #آگاهی_درمانی, #اجزای_ایمپلنت, #پروتز_دندانی | **high** |
| یک تست ساده قبل از سمان؛ جلوی افتادن‌های بعدی را می‌گیرد | [/dentcast-plus/video-4.html](/dentcast-plus/video-4.html) | litecast → dentcast_plus | shared keywords: implant abutment, prosthodontics; shared hashtags: #اباتمنت, #روکش_ایمپلنت | medium |
| وقتی که باید روکش ایمپلنت را تکرار زد | [/dentcast-plus/video-5.html](/dentcast-plus/video-5.html) | litecast → dentcast_plus | shared keywords: implant abutment, prosthodontics; shared hashtags: #اباتمنت, #روکش_ایمپلنت | medium |


### `/litecast/lite-CAST19.html`

- **Page type:** `litecast`
- **Title:** فالوآپ ایمپلنت چیست؟ | Lite-CAST

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| پیچ ایمپلنت چیست؟ | [/litecast/lite-CAST17.html](/litecast/lite-CAST17.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |
| ایمپلنت فوری چیست؟ | [/litecast/lite-CAST15.html](/litecast/lite-CAST15.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |
| ایمپلنت چیست؟ | [/litecast/lite-CAST12.html](/litecast/lite-CAST12.html) | litecast → litecast | shared keywords: چیست؟; shared hashtags: #آگاهی_درمانی, #درمان_ایمپلنت | medium |


### `/litecast/lite-CAST2.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | چرا دنچر(دندان مصنوعی) پایین لق می‌شود؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آیا ایمپلنت برای کسانی که دندان مصنوعی کامل دارند، مزیتی دار | [/litecast/lite-CAST4.html](/litecast/lite-CAST4.html) | litecast → litecast | shared keywords: overdenture, مصنوعی; shared hashtags: #اوردنچر, #دندان_مصنوعی | medium |
| نمای بیش‌ازحد ریج در بیمار متقاضی دنچر | [/chairside/chairside-8.html](/chairside/chairside-8.html) | litecast → chairside | shared keywords: دنچر; shared hashtags: #اوردنچر, #دنچر | medium |
| دنتوپدیا — سیستم BPS در دنچر کامل | [/episodes/episode-147-1.html](/episodes/episode-147-1.html) | litecast → episode | shared keywords: دنچر; shared hashtags: #دنچر | medium |


### `/litecast/lite-CAST20.html`

- **Page type:** `litecast`
- **Title:** چرا عکس پانورامیک برای تشخیص پوسیدگی مناسب نیست؟ | Lite-CAST

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| DentAI – اثر محلول تشخیص پوسیدگی روی باند | [/dentai/dentai-4.html](/dentai/dentai-4.html) | litecast → dentai | shared keywords: تشخیص, پوسیدگی | medium |


### `/litecast/lite-CAST22.html`

- **Page type:** `litecast`
- **Title:** آیا دندان عصب‌کشی شده ضعیف می‌شود؟ | Lite-CAST

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … از عصب‌کشی «خشک» نمی‌شود، اما ممکن است نسبت به قبل مقاومت کمتری داشته باشد. این موضوع به میزان بافت از دست‌رفته دندان … | **high** |


### `/litecast/lite-CAST4.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | آیا ایمپلنت برای کسانی که دندان مصنوعی کامل دارند، مزیتی دارد؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| چرا دنچر پایین(دندان مصنوعی ) لق می‌شود؟ | [/litecast/lite-CAST2.html](/litecast/lite-CAST2.html) | litecast → litecast | shared keywords: overdenture, مصنوعی; shared hashtags: #اوردنچر, #دندان_مصنوعی | medium |


### `/litecast/lite-CAST7.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | تفاوت لمینت سرامیکی و کامپوزیت دندان چیست؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اینسایت — ونیر سرامیکی روی دندان‌های اندو شده | [/episodes/episode-122-3.html](/episodes/episode-122-3.html) | litecast → episode | shared keywords: سرامیکی; shared hashtags: #ونیر_سرامیکی | medium |
| باند به کامپوزیت قدیمی | [/episodes/episode-44.html](/episodes/episode-44.html) | litecast → episode | shared keywords: کامپوزیت; shared hashtags: #کامپوزیت | medium |
| اینسایت — طراحی تراش و مقاومت به شکست (کامپوزیت) | [/episodes/episode-128-2.html](/episodes/episode-128-2.html) | litecast → episode | shared keywords: کامپوزیت; shared hashtags: #کامپوزیت | medium |


### `/litecast/lite-CAST9.html`

- **Page type:** `litecast`
- **Title:** Lite-CAST | ایمپلنت دیجیتال یعنی چی؟

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ایمپلنت دیجیتال چیست؟ | [/litecast/lite-CAST14.html](/litecast/lite-CAST14.html) | litecast → litecast | shared keywords: digital dental implant, دیجیتال; shared hashtags: #ایمپلنت_دیجیتال, #دندانپزشکی_دیجیتال | medium |


### `/dentcast-plus/index.html`

- **Page type:** `dentcast_plus`
- **Title:** DentCast+ | آموزش‌های ویدیویی دندان‌پزشکی

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| کیس‌های  دندانپزشکی تصویری کوتاه با توضیح بالینی | [/photocast/index.html](/photocast/index.html) | dentcast_plus → photocast | shared keywords: دندانپزشکی, کوتاه | medium |


### `/dentcast-plus/video-1.html`

- **Page type:** `dentcast_plus`
- **Title:** DentCast+ – نکات شخصی برای کیفیت تراش بهتر

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اصول تراش دندان Goodacre — (قسمت اول) | [/episodes/episode-113.html](/episodes/episode-113.html) | dentcast_plus → episode | shared keywords: تراش; shared hashtags: #تراش_دندان, #روکش_دندان | medium |
| BOPT — اصول تراش و آماده‌سازی | [/episodes/episode-95.html](/episodes/episode-95.html) | dentcast_plus → episode | shared keywords: تراش; shared hashtags: #تراش_دندان | medium |
| DentAI – Elbow zone   در تراش لمینیت های سرامیکی | [/dentai/dentai-10.html](/dentai/dentai-10.html) | dentcast_plus → dentai | shared keywords: تراش; shared hashtags: #تراش_دندان | medium |


### `/dentcast-plus/video-2.html`

- **Page type:** `dentcast_plus`
- **Title:** DentCast+ – آخرین مرحله قبل از خداحافظی با بیمار

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| دنتوپدیا — فرمیتوس (Fremitus) چیست؟ | [/episodes/episode-123-2.html](/episodes/episode-123-2.html) | dentcast_plus → episode | shared keywords: فرمیتوس; shared hashtags: #اکلوژن, #فرمیتوس | medium |


### `/dentcast-plus/video-3.html`

- **Page type:** `dentcast_plus`
- **Title:** وقتی روکش راک دارد؛ ترتیب بررسی مهم است | DentCast+

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Vertical Dimension of Occlusion – Myth 1 | [/episodes/episode-154.html](/episodes/episode-154.html) | dentcast_plus → episode | shared keywords: occlusion; shared hashtags: #اکلوژن | medium |
| یه نکته ی مهم در مورد باز شدن کانتکت بین ۶ و ۷ | [/metanotes/meta-12.html](/metanotes/meta-12.html) | dentcast_plus → metanote | shared keywords: proximal contact; shared hashtags: #کانتکت | medium |
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | dentcast_plus → insight | shared keywords: occlusion; shared hashtags: #اکلوژن | medium |


### `/dentcast-plus/video-4.html`

- **Page type:** `dentcast_plus`
- **Title:** یک تست ساده قبل از سمان؛ جلوی افتادن‌های بعدی را می‌گیرد | DentCast+

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| وقتی که باید روکش ایمپلنت را تکرار زد | [/dentcast-plus/video-5.html](/dentcast-plus/video-5.html) | dentcast_plus → dentcast_plus | shared keywords: anti-rotation, cement-retained crown, debonding, implant abutment, implant crown stability; shared hashtags: #اباتمنت, #دنتکست_پلاس, #روکش_ایمپلنت | **high** |
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | dentcast_plus → litecast | shared keywords: implant abutment, prosthodontics; shared hashtags: #اباتمنت, #روکش_ایمپلنت | medium |
| انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) | [/episodes/episode-102.html](/episodes/episode-102.html) | dentcast_plus → episode | shared keywords: implant abutment; shared hashtags: #اباتمنت | medium |


### `/dentcast-plus/video-5.html`

- **Page type:** `dentcast_plus`
- **Title:** وقتی مشکل نه از لثه است نه از کانتکت؛ ثبات روکش را جدی بگیرید | DentCast+

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `مقاومت` | [Resistance](/glossary/resistance.html) | … حرکت جانبی یا چرخشی وجود داشته باشد، یعنی سیستم فاقد مقاومت مکانیکی کافی است. | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| یک تست ساده قبل از سمان؛ جلوی افتادن‌های بعدی را می‌گیرد | [/dentcast-plus/video-4.html](/dentcast-plus/video-4.html) | dentcast_plus → dentcast_plus | shared keywords: anti-rotation, cement-retained crown, debonding, implant abutment, implant crown stability; shared hashtags: #اباتمنت, #دنتکست_پلاس, #روکش_ایمپلنت | **high** |
| اباتمنت چیست؟ | [/litecast/lite-CAST18.html](/litecast/lite-CAST18.html) | dentcast_plus → litecast | shared keywords: implant abutment, prosthodontics; shared hashtags: #اباتمنت, #روکش_ایمپلنت | medium |
| چرا روکش بعضی از ایمپلنت‌ها شل می‌شود؟ | [/litecast/lite-CAST10.html](/litecast/lite-CAST10.html) | dentcast_plus → litecast | shared keywords: روکش; shared hashtags: #اباتمنت, #روکش_ایمپلنت | medium |


### `/dentcast-plus/video-6.html`

- **Page type:** `dentcast_plus`
- **Title:** تداخل سمت کارگر در گروپ فانکشن| DentCast+

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| اکلوژن در بازسازی‌ها: کانین رایز یا گروپ فانکشن؟ (قسمت اول) | [/episodes/episode-131.html](/episodes/episode-131.html) | dentcast_plus → episode | shared keywords: group function, اکلوژن, بازسازی, گروپ; shared hashtags: #اکلوژن | medium |
| اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی  | [/chairside/chairside-15.html](/chairside/chairside-15.html) | dentcast_plus → chairside | shared keywords: اکلوژن, فانکشن, گروپ; shared hashtags: #اکلوژن, #روکش | medium |
| اکلوژن در بازسازی‌ها: کانین رایز یا گروپ فانکشن؟ (قسمت دوم) | [/episodes/episode-132.html](/episodes/episode-132.html) | dentcast_plus → episode | shared keywords: اکلوژن, بازسازی, گروپ; shared hashtags: #اکلوژن | medium |


### `/sharehub/share-1.html`

- **Page type:** `sharehub`
- **Title:** پیچ هرز شده در پروتزهای متکی بر ایمپلنت | Share Hub – دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Share Hub — ایمپلنت در بی دندانی قدامی فک بالا: جای دندانهای | [/sharehub/share-3.html](/sharehub/share-3.html) | sharehub → sharehub | shared keywords: share; shared hashtags: #curated_content, #share_hub | medium |
| Share Hub — اصول کلیدی برای بهینه‌سازی دقت اسکن داخل دهانی د | [/sharehub/share-2.html](/sharehub/share-2.html) | sharehub → sharehub | shared keywords: share; shared hashtags: #curated_content, #share_hub | medium |


### `/sharehub/share-2.html`

- **Page type:** `sharehub`
- **Title:** بهینه‌سازی دقت اسکن داخل دهانی ایمپلنت | Share Hub – دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `اسکن‌بادی‌های` | [Scan Body](/glossary/scan-body.html) | طبق نتایج مقاله، اسکن‌بادی‌های فلزی پایداری ابعادی بیشتری دارند و دقت بالاتری ارائه می‌دهند . … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| افزایش دقت اسکن در ایمپلنت (Scan Bodies) | [/episodes/episode-133.html](/episodes/episode-133.html) | sharehub → episode | shared keywords: اسکن; shared hashtags: #ایمپلنت_دیجیتال, #دقت_اسکن | medium |


### `/sharehub/share-3.html`

- **Page type:** `sharehub`
- **Title:** ایمپلنت در ناحیه قدام: جای دندان ۱ یا ۲؟ | Share Hub – دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Share Hub — پیچ هرز شده در پروتزهای متکی بر ایمپلنت | [/sharehub/share-1.html](/sharehub/share-1.html) | sharehub → sharehub | shared keywords: share; shared hashtags: #curated_content, #share_hub | medium |
| Share Hub — اصول کلیدی برای بهینه‌سازی دقت اسکن داخل دهانی د | [/sharehub/share-2.html](/sharehub/share-2.html) | sharehub → sharehub | shared keywords: share; shared hashtags: #curated_content, #share_hub | medium |


### `/sharehub/share-4.html`

- **Page type:** `sharehub`
- **Title:** راهها و تکنیکهای جلوگیری از باقی ماندن بقایای سمان در روکشهای سمان شونده | Share Hub – دنت‌کست

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `رابردم` | [Rubber Dam](/glossary/rubber-dam.html) | در صورت امکان استفاده از رابردم می‌باشد تا هنگام سمان کردن رستوریشن ، مجموعه اباتمنت و روکش … | **high** |

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| Insight 29 —راهکار سمان کردن برای مدیریت کانتکت بین روکشهای  | [/insight/insight-29.html](/insight/insight-29.html) | sharehub → insight | shared keywords: روکشهای, سمان | medium |


### `/sharehub/share-5.html`

- **Page type:** `sharehub`
- **Title:** چرا گاهی اصلاح فضا به قیمت از دست رفتن رابطه کانینی کلاس I انجام نمی‌شود؟| Share Hub – دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| وقتی حفظ دندان، به قیمت از دست رفتن استخوان تمام می‌شود | [/chairside/chairside-16.html](/chairside/chairside-16.html) | sharehub → chairside | shared keywords: رفتن, قیمت | medium |


### `/sharehub/share-6.html`

- **Page type:** `sharehub`
- **Title:** نحوه تنظیم اکلوژن در لامینیت‌های سرامیکی | Share Hub – دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| فوتوکست ۲ – قانون BULL در تنظیم اکلوزال | [/photocast/episode-2.html](/photocast/episode-2.html) | sharehub → photocast | shared keywords: اکلوژن, تنظیم; shared hashtags: #اکلوژن | medium |


### `/photocast/episode-2.html`

- **Page type:** `photocast`
- **Title:** فوتوکست ۲ – قانون BULL در تنظیم اکلوزال | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی | [/insight/insight-1.html](/insight/insight-1.html) | photocast → insight | shared keywords: premature contacts, اکلوژن; shared hashtags: #اکلوژن | medium |
| Share Hub — نحوه تنظیم اکلوژن در لامینیت‌های سرامیکی | [/sharehub/share-6.html](/sharehub/share-6.html) | photocast → sharehub | shared keywords: اکلوژن, تنظیم; shared hashtags: #اکلوژن | medium |
| اکلوژن در درمان‌های ایمپلنت – با حضور دکتر الله‌بخشی | [/episodes/episode-60.html](/episodes/episode-60.html) | photocast → episode | shared keywords: اکلوژن; shared hashtags: #اکلوژن | medium |


### `/photocast/index.html`

- **Page type:** `photocast`
- **Title:** فوتوکست‌ها | کیس‌های تصویری و بالینی پروتز | دنت‌کست

**Semantic link suggestions** (≤3 normal, plus all structural & reciprocal)

| Suggested anchor | Target URL | Relation | Reasoning | Confidence |
|---|---|---|---|---|
| آموزش‌های ویدیویی کوتاه و تخصصی دندانپزشکی | [/dentcast-plus/index.html](/dentcast-plus/index.html) | photocast → dentcast_plus | shared keywords: دندانپزشکی, کوتاه | medium |


### `/episodes.html`

- **Page type:** `episode_index`
- **Title:** همهٔ اپیزودهای دنت‌کست | DentCast Episodes

**Glossary link suggestions** (first occurrence, body text only, no headings, ≤3)

| Anchor text | Target | Paragraph context (~20 words around the match) | Confidence |
|---|---|---|---|
| `Ti-base` | [Ti-Base](/glossary/ti-base.html) | … Zero Bone Loss، پروتکل‌های ایمپلنت فوری (Immediate Load)، انتخاب اباتمنت‌های Ti-base و Multi-unit و مدیریت تحلیل استخوان. | **high** |
| `Zero Bone Loss` | [Zero Bone Loss](/glossary/zero-bone-loss.html) | ایمپلنتولوژی پیشرفته: شامل مرور کانسپت‌هایی چون Zero Bone Loss، پروتکل‌های ایمپلنت فوری (Immediate Load)، انتخاب اباتمنت‌های Ti-base و … | **high** |


---

## Appendix — filter validation

### Drops by filter

| Filter | Reason | Dropped |
|---|---|---:|
| Filter 1 | context contained `#` → hashtag block | 4 |
| Filter 1 | context = noun phrases with ≤1 connector word | 44 |
| Filter 1 | context started with بررسی / مرور / جمع‌بندی etc. | 21 |
| Filter 2 | every shared keyword in stoplist | 296 |
| Filter 2 | only 1 non-stop keyword, no non-stop hashtag | 154 |
| Filter 3 | glossary suggestion beyond rank 3 | 30 |
| Filter 3 | semantic suggestion beyond rank 3 (excl. structural / reciprocal) | 201 |

### Exemptions (kept thanks to filters 4 & 5)

| Filter | Items kept that would otherwise have been dropped/capped |
|---|---:|
| Filter 4 — structural pairs | 32 |
| Filter 5 — missing reciprocals | 9 |

### Filter 1 — sample drops

- `/dentai/index.html` · anchor **`استحکام باند`** · reason: `keyword-soup` · ctx: _مقالهٔ چهارم – اثر Caries Detector بر استحکام باند_
- `/dentai/index.html` · anchor **`سلف‌اچ`** · reason: `keyword-soup` · ctx: _مقالهٔ پنجم – مقایسه دو باندینگ: استاندارد طلایی و سلف‌اچ_
- `/dentai/index.html` · anchor **`کنترل رطوبت`** · reason: `meta-description` · ctx: _… تحلیلی تأثیر کیور باندینگ بر استحکام اتصال، لایه مهارکننده اکسیژن، کنترل رطوبت و پیامدهای بالینی د_
- `/episodes.html` · anchor **`IDS`** · reason: `keyword-soup` · ctx: _… کردن رزینی، آماده‌سازی سطح انواع سرامیک (زیرکونیا، لمینیت)، اصول DME، IDS و درمان‌های ادهزیو غیرمس_
- `/episodes/episode-10.html` · anchor **`سایلان`** · reason: `meta-description` · ctx: _بررسی نقش سایلان در افزایش کیفیت باند سرامیک و پروتکل صحیح آماده سازی سطحی._
- `/episodes/episode-101.html` · anchor **`استحکام باند`** · reason: `meta-description` · ctx: _بررسی روش‌ها و پروتکل‌های موثر برای افزایش استحکام باند به دنتین ریشه در درمان‌های ادهزیو._
- `/episodes/episode-101.html` · anchor **`پروتکل باندینگ`** · reason: `keyword-soup` · ctx: _باندینگ ریشه استحکام باند Root Dentin Bonding درمان ادهزیو پروتکل باندینگ_
- `/episodes/episode-104.html` · anchor **`تیتانیوم بیس`** · reason: `meta-description` · ctx: _بررسی تخصصی اباتمنت‌های تیتانیوم بیس (Ti-Base)؛ مزایا، اندیکاسیون‌ها و نکات کلینیکی در دندانپزشکی دی_
- `/episodes/episode-105.html` · anchor **`Ti-Base`** · reason: `meta-description` · ctx: _ادامه‌ی مبحث اباتمنت‌های Ti-Base و بررسی پروتکل‌های لابراتواری و کلینیکی برای دستیابی به بهترین نتیج_
- `/episodes/episode-105.html` · anchor **`زیرکونیا`** · reason: `keyword-soup` · ctx: _Ti-Base Abutment پروتکل تای بیس طراحی دیجیتال اتصال اباتمنت روکش زیرکونیا ایمپلنت_

### Filter 2 — sample drops

- `/` → `/notecast/episode-24.html` · reason: `all-stop-kw` · shared kw: _ایمپلنت, شواهد_; tags: _—_
- `/` → `/chairside/chairside-10.html` · reason: `single-kw-no-tag` · shared kw: _پروتز, ایمپلنت_; tags: _—_
- `/chairside/chairside-1.html` → `/episodes/episode-151.html` · reason: `single-kw-no-tag` · shared kw: _تصمیم, گیری_; tags: _—_
- `/chairside/chairside-1.html` → `/episodes/episode-152.html` · reason: `single-kw-no-tag` · shared kw: _تصمیم, گیری_; tags: _—_
- `/chairside/chairside-1.html` → `/episodes/episode-153.html` · reason: `single-kw-no-tag` · shared kw: _تصمیم, گیری_; tags: _—_
- `/chairside/chairside-10.html` → `/episodes/episode-123-5.html` · reason: `all-stop-kw` · shared kw: _ایمپلنت_; tags: _پروتز_ایمپلنت, ایمپلنت_
- `/chairside/chairside-10.html` → `/episodes/episode-102.html` · reason: `all-stop-kw` · shared kw: _ایمپلنت_; tags: _پروتز_ایمپلنت, ایمپلنت_
- `/chairside/chairside-10.html` → `/episodes/episode-24.html` · reason: `all-stop-kw` · shared kw: _ایمپلنت_; tags: _ایمپلنت_
- `/chairside/chairside-10.html` → `/episodes/episode-82.html` · reason: `all-stop-kw` · shared kw: _ایمپلنت_; tags: _ایمپلنت_
- `/chairside/chairside-10.html` → `/episodes/episode-25.html` · reason: `all-stop-kw` · shared kw: _ایمپلنت_; tags: _ایمپلنت_
