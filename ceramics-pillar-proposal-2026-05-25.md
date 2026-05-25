# Ceramics Pillar — Classification Proposal (Semantic)

**Date:** 2026-05-25
**Sources read (read-only):** `dentcast-brain.json` (358 entries) and `glossary/glossary.json` (79 entries).
**Output:** this proposal only. No JSON file was modified.

---

## Methodology note

Classification is based on each entry's **conceptual subject** as read from full available content (title, caption/synonyms, keywords, hashtags), not on lexical matching of titles. Title and keyword tokens were used as **signals only**; the actual decision came from reading what the entry is centrally about.

For each entry the question asked was: *"If a reader were studying only Ceramics, would this entry be essential for their understanding?"* — yes ⇒ ceramics; no ⇒ stays elsewhere, regardless of incidental keywords.

Entries flagged "ambiguous" sit on a true border between two pillars and need a human decision. Entries flagged "rejected" matched ceramics keywords but had their conceptual center somewhere else.

---

## Summary

| Metric | Count |
|---|---:|
| Total entries reviewed (brain + glossary) | **437** (358 + 79) |
| Conceptually about ceramics (proposed total) | **60** |
| — Already assigned `primary: ceramics` (no change) | 43 |
| — Proposed new assignments to ceramics | 17 |
| — Of which **reassignments** from another pillar | 17 (no entry was "primary: null" with ceramic content) |
| Ambiguous cases needing user decision | **10** |
| Considered but rejected (mention ceramics but conceptually elsewhere) | 13 (listed below) |

Audit estimate was ~42 ceramics entries. The proposed total of 60 is materially higher — driven primarily by reassignments from Bonding (HF, silane, MDP, sandblasting, zirconia surface prep, ceramic decontamination) and from Fixed-Pros (the ceramic-overlay tooth-prep series, EP 55–58). This pattern is itself a finding: surface preparation of ceramic substrates was previously filed under Bonding even though the work happens on the ceramic, not on the tooth. See the "Pattern observations" section.

---

## Distribution by subtopic (proposed)

| Subtopic | High | Medium | Low | Total |
|---|---:|---:|---:|---:|
| basics | 5 | 2 | 0 | **7** |
| types | 16 | 5 | 0 | **21** |
| surface-prep | 13 | 2 | 0 | **15** |
| indications | 9 | 5 | 1 | **15** |
| failures | 2 | 1 | 0 | **3** ⚠ |
| **Total** | 45 | 15 | 1 | **60** |

⚠ **failures** sits at exactly the 3-entry minimum. Whether to keep the subtopic or fold it into indications is a structural call (see "Subtopics with thin counts" below).

---

## A. Already assigned `primary: ceramics` — proposed subtopic only

These 43 entries are already in ceramics. The proposal here is the **subtopic** for each.

### From `dentcast-brain.json` (29 entries)

| Episode | Title (short) | Proposed subtopic | Conf | Note |
|---|---|---|---|---|
| 8 | طبقه‌بندی سرامیک‌های دندانی | types | H | classification of ceramic families |
| 9 | آماده‌سازی سطح سرامیک‌ها – بخش اول | surface-prep | H | |
| 10 | نقش سایلان در آماده‌سازی سرامیک‌ها | surface-prep | H | |
| 11 | آماده‌سازی سطح زیرکونیا | surface-prep | H | |
| 12 | تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی | surface-prep | H | decontamination = pre-bond ceramic surface step |
| 15 | طول عمر آنله‌های سرامیکی | indications | M | longevity straddles indications↔failures; clinical use frame chosen |
| 17 | زیرکونیاهای شفاف – بخش اول | types | H | translucent-zirconia subfamily |
| 18 | زیرکونیاهای شفاف – بخش دوم | types | H | |
| 29 | طبقه‌بندی جدید سرامیک‌ها | types | H | |
| 30 | سرامیک‌های پلی‌کریستالین و ماتریکس رزینی | types | H | |
| 87 | مرور علمی زیرکونیا – بخش اول | types | H | zirconia families + clinical use |
| 88 | مرور علمی زیرکونیا – بخش دوم | basics | M | structural properties + mech behaviour; alternative: types |
| 89 | مرور علمی زیرکونیا – پایان | indications | H | clinical selection + longevity |
| 107 | زیرکونیاهای گرادینت مولتی‌لیر | types | H | multilayer zirconia generation |
| 122.5 | کارایی فرزهای الماسه روی زیرکونیا | indications | M | chairside adjustment workflow on zirconia; alternative: basics |
| 123.4 | فول‌ماوس زیرکونیا: ونیر شده یا مونولیتیک؟ | indications | M | framing is veneered-vs-monolithic decision; chipping is secondary; alternative: failures |
| 125.1 | زیرکونیا یا PFM در ایمپلنت خلفی؟ | indications | H | material choice for posterior implant crowns |
| 146 | زیرکونیا بدون زیرکونیا (Zero Bone Loss) | indications | H | when *not* to choose zirconia |
| — | سرامیک‌های دندانی — دسته‌بندی و کاربرد *(notecast EP 8)* | types | H | |
| — | آماده‌سازی سطحی سرامیک — بخش اول *(notecast EP 9)* | surface-prep | H | |
| — | مدیریت تیرگی لثه با روکش زیرکونیا *(notecast EP 13)* | indications | H | umbrella effect = anterior-zirconia clinical issue |
| — | آنلِی‌های سرامیکی — طول عمر *(notecast EP 15)* | indications | M | same longevity↔failures tension as EP 15 |
| — | فازهای زیرکونیا و تکامل آن *(notecast EP 17)* | basics | M | phases + transformation toughening; alternative: types (generations are covered too) |
| — | زیرکونیای مکعبی *(notecast EP 18)* | types | H | cubic zirconia |
| — | پایداری رنگ ونیرهای سرامیکی — JPD 2018 *(notecast EP 19)* | failures | M | color stability over time = aging failure mode; alternative: indications/resin-cements |
| — | دسته‌بندی سرامیک‌های دندانی بر اساس فاز *(notecast)* | types | H | |
| — | سرامیک‌های پلی‌کریستالاین و هیبرید *(notecast)* | types | H | |
| — | Low Temperature Degradation در زیرکونیا | failures | H | LTD is THE defining zirconia failure mode |
| — | راهکار سمان کردن برای مدیریت کانتکت بین روکش‌های ۶ و ۷ | **(ambiguous)** | L | conceptual center is cementation technique, not ceramics — listed in §D |

### From `glossary/glossary.json` (14 entries)

| Slug | Title | Proposed subtopic | Conf | Note |
|---|---|---|---|---|
| `zirconia-primer` | Zirconia Primer | surface-prep | H | priming step specific to zirconia |
| `zirconia` | Zirconia (Zirconium Oxide) | types | H | material family |
| `silica-based-ceramics` | Silica-Based Ceramics | types | H | |
| `dental-ceramics` | Dental Ceramics | types | M | umbrella term; alternative: basics |
| `glass-phase` | Glass Phase | basics | H | structural concept |
| `crystalline-phase` | Crystalline Phase | basics | H | structural concept |
| `feldspathic-porcelain` | Feldspathic Porcelain | types | H | |
| `glass-ceramics` | Glass Ceramics | types | H | |
| `lithium-disilicate` | Lithium Disilicate | types | H | |
| `zls` | Zirconia-Reinforced Lithium Silicate | types | H | |
| `hybrid-ceramics` | Hybrid Ceramics (Resin-Matrix) | types | H | PICN / resin-matrix |
| `polycrystalline-ceramics` | Polycrystalline Ceramics | types | H | |
| `translucency` | Translucency | basics | H | optical-property fundamental of ceramics |
| `sintering` | Sintering (Firing) | basics | M | processing science; alternative: types (process step) |

---

## B. Proposed new assignments to Ceramics (17 entries — all are reassignments)

No entry currently has `primary: null` *and* conceptually ceramic content. Every proposed addition is a reassignment from another pillar. See §C for the details of where each one is coming from. Listed here grouped by proposed subtopic, with one-sentence semantic reading and rationale.

### → ceramics / surface-prep (10)

**Brain (EP 16) — لزوم استفاده از باندینگ روی پرسلن اچ‌شده**
*Semantic reading:* asks whether an adhesive layer is needed after HF-etch + silane on porcelain — a decision rule about the **ceramic-surface bond preparation pipeline**.
*Currently:* bonding / clinical. *Why move:* the subject *is* the ceramic-surface treatment sequence; the cement/adhesive is downstream of the decision. **Confidence: high.**

**Brain (EP 136) — آماده‌سازی سطح سرامیک‌ها (Surface Treatment)**
*Semantic reading:* episode literally on HF + silane + ceramic-type-specific surface treatment protocols.
*Currently:* bonding / clinical. *Why move:* title and content are unambiguously ceramic surface prep. **Confidence: high.**

**Brain notecast — سایلان: پل باندینگ بین سرامیک و رزین**
*Semantic reading:* what silane is, single- vs two-bottle, heat activation, ceramic bonding errors.
*Currently:* bonding / clinical. *Why move:* silane exists for ceramic surfaces (silica chemistry). **Confidence: high.**

**Brain notecast — آماده‌سازی سطح زیرکونیا: از سندبلاست تا باندینگ**
*Semantic reading:* sandblast, silica coating, MDP primer, pre-cementation errors on zirconia.
*Currently:* bonding / clinical. *Why move:* entire content is zirconia surface preparation. **Confidence: high.**

**Brain notecast — پاکسازی آلودگی از گلاس‌سرامیک**
*Semantic reading:* phosphoric acid + HF + silane reapplication after saliva/blood/silicone contamination of glass-ceramic.
*Currently:* bonding / clinical. *Why move:* decontamination *of the ceramic surface*. **Confidence: high.**

**Brain notecast — ضرورت یا عدم ضرورت باندینگ روی پرسلن فلدسپاتیک اچ و سایلن‌زده**
*Semantic reading:* notecast counterpart of EP 16 — same surface-prep decision rule.
*Currently:* bonding / clinical. *Why move:* same logic as EP 16. **Confidence: high.**

**Glossary `silane` — Silane (Silane Coupling Agent)**
*Semantic reading:* organofunctional coupling agent that bonds resin to silica-containing ceramic surfaces.
*Currently:* bonding / materials. *Why move:* silane's identity is ceramic-surface chemistry; in the prompt itself this is cited as the canonical reassignment example. **Confidence: high.**

**Glossary `mdp` — MDP (10-MDP Monomer)**
*Semantic reading:* phosphate monomer whose clinical importance is bonding to zirconia (no silica → silane fails).
*Currently:* bonding / materials. *Why move:* MDP exists because of the zirconia bonding problem. **Confidence: medium-high** (caveat: MDP also chelates calcium in dentin, so it has a secondary identity in universal adhesives — flagged for awareness but the primary association is zirconia surface prep).

**Glossary `sandblasting` — Sandblasting / Air Abrasion**
*Semantic reading:* mechanical roughening — most commonly applied to ceramic/zirconia intaglio surfaces and to metal substrates.
*Currently:* bonding / clinical. *Why move:* in modern practice the dominant application is ceramic/zirconia surface prep; rarely used on tooth structure. **Confidence: medium** (it does have non-ceramic uses; see §D for the alternative reading).

---

### → ceramics / indications (6)

**Brain EP 55 — آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش اول**
**Brain EP 56 — ادامه آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش دوم**
**Brain EP 57 — پروتکل‌های عملی در آماده‌سازی اورلی‌های سرامیکی**
**Brain EP 58 — پایان مبحث اورلی – نکات عملی نهایی**
*Semantic reading:* a four-part series on tooth preparation principles **specific to bonded ceramic overlays** — reduction, design, finish-line decisions geared to ceramic substrate behaviour.
*Currently:* fixed-pros / null. *Why move:* the preparation rules taught here exist because the restoration is ceramic (thickness for translucency, no sharp internal line angles for fracture mechanics, etc.). A reader on Ceramics would consider these essential; a reader on generic Fixed-Pros could skip them. **Confidence: high (all four).**

**Brain notecast — تراش Elbow Zone در لمینیت‌های سرامیکی** *(DentAI)*
*Semantic reading:* prep error specific to ceramic laminate veneers (elbow zone fracture risk).
*Currently:* esthetic / null. *Why move:* failure mode is ceramic-fracture-driven, so the prep rule belongs to ceramic indications. **Confidence: medium-high.**

**Brain notecast — تفاوت لمینت سرامیکی و کامپوزیت دندان**
*Semantic reading:* compares ceramic veneer vs direct composite — *when do you choose ceramic*.
*Currently:* esthetic / null. *Why move:* the entry is a ceramic-vs-composite indication framework. **Confidence: medium** (could legitimately stay in esthetic as a patient-education piece).

---

### → ceramics / failures (1)

**Brain notecast — پریدگی دیستال لمینیت لترال: تداخل فانکشنال پنهان**
*Semantic reading:* chipping of a ceramic veneer caused by hidden protrusive interference.
*Currently:* fixed-pros / null. *Why move:* chipping is a ceramic failure mode; the entry analyses why the ceramic chipped. **Confidence: high.**

---

### → ceramics / types (1)

**Brain EP 69 — انواع ایمکس اینگات**
*Semantic reading:* differences between e.max (lithium disilicate) ingot variants and how to choose.
*Currently:* esthetic / null. *Why move:* the entry is literally a typology of a single ceramic material family. **Confidence: high.**

---

## C. Proposed reassignments — summary index

| ID | Current → Proposed | Confidence |
|---|---|---|
| Brain EP 16 | bonding / clinical → ceramics / surface-prep | H |
| Brain EP 55 | fixed-pros / null → ceramics / indications | H |
| Brain EP 56 | fixed-pros / null → ceramics / indications | H |
| Brain EP 57 | fixed-pros / null → ceramics / indications | H |
| Brain EP 58 | fixed-pros / null → ceramics / indications | H |
| Brain EP 69 | esthetic / null → ceramics / types | H |
| Brain EP 136 | bonding / clinical → ceramics / surface-prep | H |
| Notecast "سایلان — پل باندینگ" | bonding / clinical → ceramics / surface-prep | H |
| Notecast "آماده‌سازی سطح زیرکونیا — سندبلاست" | bonding / clinical → ceramics / surface-prep | H |
| Notecast "پاکسازی آلودگی از گلاس‌سرامیک" | bonding / clinical → ceramics / surface-prep | H |
| Notecast "ضرورت یا عدم ضرورت باندینگ روی پرسلن فلدسپاتیک" | bonding / clinical → ceramics / surface-prep | H |
| Notecast "پریدگی دیستال لمینیت لترال" | fixed-pros / null → ceramics / failures | H |
| Notecast "تراش Elbow Zone در لمینیت‌های سرامیکی" | esthetic / null → ceramics / indications | M-H |
| Notecast "تفاوت لمینت سرامیکی و کامپوزیت" | esthetic / null → ceramics / indications | M |
| Glossary `silane` | bonding / materials → ceramics / surface-prep | H |
| Glossary `mdp` | bonding / materials → ceramics / surface-prep | M-H |
| Glossary `sandblasting` | bonding / clinical → ceramics / surface-prep | M |

---

## D. Ambiguous cases — need user decision

These 10 entries sit on a true border. The argument for each side is laid out so a decision can be made without re-reading the content.

### D1. Brain — راهکار سمان کردن برای مدیریت کانتکت بین روکش‌های ۶ و ۷
*Currently:* ceramics / null.
**(a) Stay ceramics / indications:** the restorations are ceramic crowns and the technique addresses a clinical issue specific to crown work.
**(b) Move to resin-cements:** the conceptual center is a cementation workaround, not anything about ceramic material behaviour. The restoration could just as easily be metal.
*Why ambiguous:* the substrate is ceramic but the technique isn't ceramic-specific.

### D2. Brain EP 124.1 — اینسایت — دی‌باندینگ لیزری ونیرها (Laser Debonding)
*Currently:* bonding / strategies.
**(a) Stay bonding / strategies:** about a debonding technique (workflow on the bond).
**(b) Move to ceramics / failures:** about removing failed/aged ceramic veneers — the *removal* of ceramic restorations.
*Why ambiguous:* "debonding" reads as a bonding topic, but the *thing being debonded* is ceramic and the use-case is replacement/failure management.

### D3. Brain EP 19 — ثبات رنگ لمینیت‌های سرامیکی
*Currently:* resin-cements / null.
**(a) Stay resin-cements:** the variable studied is **resin-cement chemistry** affecting color over time.
**(b) Move to ceramics / failures:** long-term color shift = aesthetic failure mode of ceramic veneers.
*Why ambiguous:* both the cement and the ceramic contribute to the outcome; the JPD 2018 notecast counterpart was assigned ceramics / failures (see §A) — consistency suggests moving EP 19 too, but the user originally placed it in resin-cements deliberately.

### D4. Brain notecast — چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم
*Currently:* resin-cements / null.
*Same shape as D3.* Two options: stay in resin-cements (cement is the lever) or move to ceramics/indications (shade-matching as part of ceramic clinical workflow).

### D5. Brain EP 123.1 — اینسایت — تطابق لبه‌ای: دیجیتال یا معمولی؟ (Lithium Disilicate)
*Currently:* fixed-pros / null.
**(a) Stay fixed-pros:** the topic is marginal-fit workflow comparison; the ceramic is incidental.
**(b) Move to ceramics / indications:** the study is specifically on lithium disilicate, and marginal fit interacts strongly with ceramic translucency / prep depth.
*Why ambiguous:* generic prosthodontic accuracy question that happens to use e.max.

### D6. Brain notecast — کانتور مقعر در روکش سرامیکی
*Currently:* fixed-pros / null.
**(a) Stay fixed-pros:** concave contour is a prosthodontic principle applicable to any crown material.
**(b) Move to ceramics / indications:** the entry is specifically about a ceramic crown.
*Why ambiguous:* substrate is ceramic but the rule is material-agnostic.

### D7. Brain notecast — راهکار مقابله با ته رنگ خاکستری روکش
*Currently:* fixed-pros / null. Keywords include `ceramic crown`, `zirconia`, `opaquer composite`.
**(a) Stay fixed-pros:** the problem (grey core showing through) and the workaround are prosthodontic management of substructure.
**(b) Move to ceramics / indications:** the entry teaches a fix for ceramic-crown translucency interaction with a discoloured substrate — that *is* ceramic indication knowledge.
*Why ambiguous:* the fix uses opaquer composite, which is neither bond nor ceramic — it's a workaround that crosses pillars.

### D8. Brain notecast — از تصویر تا واقعیت (PFM chipping case)
*Currently:* fixed-pros / null. Keywords include `PFM crown chipping`.
**(a) Stay fixed-pros:** broader theme is retain-vs-extract decision; PFM chipping is a triggering symptom.
**(b) Move to ceramics / failures:** chipping is a ceramic failure mode.
*Why ambiguous:* chipping is mentioned but isn't the conceptual center.

### D9. Brain EP 122.3 (endo) — اینسایت — ونیر سرامیکی روی دندان‌های اندو شده
*Currently:* endo / null.
**(a) Stay endo:** the variable being studied is the endo-treated status of the tooth.
**(b) Move to ceramics / indications:** the restoration choice is the ceramic veneer.
*Why ambiguous:* the entry sits exactly on the endo↔ceramic-indications border. Reasonable case for either.

### D10. Glossary `flexural-strength`
*Currently:* curated.
**(a) Stay curated:** it's a general material property used across many materials.
**(b) Move to ceramics / basics:** flexural strength is *the* defining strength metric for dental ceramics and is taught primarily in the ceramics context.
*Why ambiguous:* the term is generic but its dental teaching context is overwhelmingly ceramic.

---

## E. Considered but rejected

These mention ceramic keywords but conceptually belong elsewhere.

| Entry | Current | Why rejected |
|---|---|---|
| Brain EP 6 — IDS | bonding | mentions "لمینیت" once; subject is dentin sealing technique |
| Brain EP 37, 38, 39 — laminate prep series | esthetic | subject is esthetic veneer preparation logic; substrate happens to be ceramic but the conceptual center is esthetic technique, not ceramic material |
| Brain EP 68 — عوامل مؤثر بر رنگ نهایی | esthetic | generic shade-outcome factors |
| Brain notecast — تصمیم‌گیری زیبایی در حضور دیاستم قدامی | esthetic | diastema-closure decision, not ceramic-specific |
| Brain notecast — DentAI طبقه‌بندی کامپوزیت‌ها (filler size) | bonding | "هیبرید" matched as "نانوهیبرید"; subject is composite filler classification |
| Brain notecast — Hierarchy of Bondability (HOB) | bonding | "هیبرید" matched in "hybrid layer"; subject is dentin bondability tiers |
| Brain EP 113, 114 — اصول تراش دندان Goodacre | operative | generic preparation guidelines covering ceramic *and* metal; not ceramic-centric |
| Brain EP 139, 140, 141 — Zero Bone Loss material chapters | implantology | subject is implant prosthetic material selection (peri-implant tissue response) — ceramics is one of several materials compared |
| Brain EP 105, 115 — Ti-Base / abutment selection | implant-pros | subject is implant abutment selection; zirconia mentioned only as abutment material |
| Brain — نحوه تنظیم اکلوژن در لامینیت‌های سرامیکی | occlusion | subject is occlusal adjustment technique; veneer is the workpiece |
| Brain — آخرین مرحله قبل از خداحافظی (fremitus) | occlusion | "پرسلن" mention is incidental |
| Brain — ایزولاسیون مرحله‌ای با نوار تفلون | fixed-pros | subject is staged-isolation technique; veneer cementation is the context |
| Brain perio entries with veneer keyword | perio | subject is periodontal prognosis; veneer mention is incidental |
| Brain pediatric — دندان ۶ پایین در زیر ۱۸ سال | pediatric | subject is pediatric crown-timing decision; zirconia is one option |
| Brain curated — پیچ هرز شده | curated | "شفاف" matched in "رفرنس شفاف" (clear reference) — false positive |
| Brain — وقتی به درمان ریشه مطمئن نیستیم | fixed-pros | "یتری" matched on a non-ceramic substring; no ceramic content |

---

## F. Pattern observations

1. **Surface-prep was systemically filed under Bonding.** Every brain entry whose subject is preparing a ceramic surface (HF, silane, sandblast on zirconia, decontamination, MDP primer) sits in `bonding/clinical` today. This is the single largest classification drift in the corpus. The reassignment of EP 16, 136, four notecasts, plus the three glossary terms (silane, mdp, sandblasting) collectively shifts ~10 entries out of Bonding into Ceramics. If accepted, Bonding loses some weight from its `clinical` and `materials` subtopics — worth checking that Bonding's distribution still reads well after the move.

2. **Ceramic-overlay tooth preparation was filed under Fixed-Pros.** EP 55–58 (a coherent 4-part series on tooth prep for bonded ceramic overlays) live in `fixed-pros` with no subtopic. Conceptually they are ceramic-indications.

3. **e.max ingot types** (EP 69) lives in Esthetic because of the dr-Neshati guest and aesthetic context. Conceptually it's purely a ceramic-types entry.

4. **Color stability** is split between resin-cements and ceramics/failures inconsistently. The JPD 2018 notecast lives in ceramics; EP 19 (same topic) lives in resin-cements. See D3.

5. **The failures subtopic is thin (3 entries).** Two of those three (LTD, JPD-2018 color stability) are the only entries that *unambiguously* belong there. The third (chipping notecast) is a strong reassignment. If you don't want a subtopic with only three entries, consider folding failures into indications (calling it "indications & failures" or similar). Counter-argument: LTD, chipping and color-stability are genuinely different failure mechanics and deserve a dedicated home — the audit may produce more failures entries in the next content cycle.

---

## G. Subtopics with thin counts

- **failures**: 3 entries (at the minimum threshold). See pattern observation #5.

All other subtopics (basics 7, types 21, surface-prep 15, indications 15) are well above threshold.

---

## H. Sanity checks

| Check | Result |
|---|---|
| Total ceramics entries proposed | 60 (vs ~42 audit estimate; +18 from reassignments) |
| All five subtopics ≥ 3 entries | ✓ (failures = 3, exact minimum) |
| Any subtopic > 50% of total | types is 21/60 ≈ 35% — within acceptable range |
| Read-only — JSON files unchanged | ✓ (see I.) |

---

## I. SHA-256 — proof no JSON file was modified

```
PRE  (start of session)
e67839a011106509aa0f4c163270e5fc6352149faeb44eb1e49ee13dd869ed10  dentcast-brain.json
cc9883492d9fa0c3eca9ee7faba351459233468fa98f379175594135a356cc59  glossary/glossary.json

POST (end of this proposal)
e67839a011106509aa0f4c163270e5fc6352149faeb44eb1e49ee13dd869ed10  dentcast-brain.json
cc9883492d9fa0c3eca9ee7faba351459233468fa98f379175594135a356cc59  glossary/glossary.json
```

PRE = POST for both files. No JSON was modified during this operation.

---

## Next step (Phase 2 — separate prompt)

This proposal makes no changes. Phase 2 will:
1. take the user's accept/reject decisions on §B reassignments and §D ambiguous cases,
2. apply them to `dentcast-brain.json` and `glossary/glossary.json` in a single atomic operation,
3. verify with SHA-based diffs and report.

No file should be touched until Phase 2 is explicitly approved.
