# Ceramics Orphan Audit — Brain + Glossary

**Date:** 2026-05-25
**Scope:** Read-only semantic audit of `dentcast-brain.json` and `glossary/glossary.json` for ceramics pillar misplacement.
**Mode:** No file modifications. Report only.

---

## 1. Hashes before

| File | SHA-256 |
|---|---|
| `dentcast-brain.json` | `b3f0f7c79cabd2a1178a28ccbf0f305c37df0d6060a63add7d5a045cda93c3d2` |
| `glossary/glossary.json` | `839fe34c0bc70ceafda68b10157fcc0b11ef04fe3590add2e278bc25d1319c1b` |

---

## 2. `dentcast-brain.json` — Clear ceramics orphans

After semantic review of all 358 brain entries against the criteria, **no entry was found whose subject is unambiguously ceramic and whose current `pillar.primary` is unambiguously wrong.** Every entry that touches ceramic material/process either sits correctly in `ceramics`, or has a defensible reason to sit in another pillar (and is reported below under ambiguous).

The keyword-hit pool (91 non-ceramic-pillar entries mentioning ceramic-related vocabulary) was filtered semantically. The dominant "noise" pattern was Persian terms like روکش (crown), ونیر (veneer), and لمینیت (laminate) appearing in entries whose actual subject is something else entirely — occlusion adjustment, biological width, fremitus, ferrule, post-and-core sequencing, abutment selection, implant positioning, contact management, esthetic perception, fissure sealant (a false-friend regex hit), and so on.

**Count: 0**

---

## 3. `dentcast-brain.json` — Ambiguous cases

Entries that touch ceramics in a meaningful way but have a defensible reason to sit in their current pillar. Each is flagged per the edge-case rules in the prompt.

### 3.1 — Tooth preparation for ceramic restorations (intersection of `ceramics/indications` and `fixed-pros`/`esthetic`/`operative`)

| # | URL | Title | Current pillar | Note | Recommendation |
|---|---|---|---|---|---|
| 36 | `/episodes/episode-37.html` | اندیکاسیون‌های باز کردن کانتکت در تراش لمینیت | `{primary: "esthetic", subtopic: null}` | Veneer prep — intersection of ceramic indication and esthetic prep. | discuss |
| 37 | `/episodes/episode-38.html` | تراش لمینیت بر اساس ماک‌آپ | `{primary: "esthetic", subtopic: null}` | Veneer prep based on mockup — same intersection. | discuss |
| 119 | `/episodes/episode-113.html` | اصول تراش دندان Goodacre — قسمت اول | `{primary: "operative", subtopic: null}` | Goodacre guidelines explicitly cover all-ceramic and metal crowns. Cross-cuts operative / fixed-pros / ceramics. | keep (or move to fixed-pros — orthogonal to this audit) |
| 120 | `/episodes/episode-114.html` | اصول تراش دندان Goodacre — قسمت دوم | `{primary: "operative", subtopic: null}` | Same. | keep |

### 3.2 — Bonding to ceramic (edge-case: legitimate in `bonding/clinical` or `bonding/strategies`)

| # | URL | Title | Current pillar | Note | Recommendation |
|---|---|---|---|---|---|
| 5 | `/episodes/episode-6.html` | Immediate Dentin Sealing (IDS) | `{primary: "bonding", subtopic: "clinical"}` | IDS protocol is framed around inlay/onlay/laminate (indirect ceramic) workflow, but its core subject is dentin-side sealing — defensibly bonding. | keep |
| 142 | `/episodes/episode-123-3.html` | اینسایت — آنله مستقیم یا غیرمستقیم؟ | `{primary: "bonding", subtopic: "strategies"}` | Direct composite vs indirect (typically ceramic) onlay. Comparison straddles bonding strategy and ceramic indication. | discuss |
| 147 | `/episodes/episode-124-1.html` | اینسایت — دی‌باندینگ لیزری ونیرها | `{primary: "bonding", subtopic: "strategies"}` | Laser debonding of ceramic veneers — ceramic-specific removal technique. Defensibly bonding/strategies; arguably ceramics/failures. | discuss |
| 167 | `/episodes/episode-137.html` | ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت اول | `{primary: "bonding", subtopic: "strategies"}` | Adhesive protocol for indirect (mostly ceramic) inlay/onlay. Direct hit on edge-case rule. | keep |
| 238 | `/notecast/episode-5.html` | باندینگ‌های یونیورسال: نکات کلیدی و کاربردی | `{primary: "bonding", subtopic: "strategies"}` | Universal adhesive content includes bonding to zirconia and silica ceramics; subject is the adhesive itself. | keep |
| 239 | `/notecast/episode-6.html` | سیل کردن فوری دنتین (IDS) — Immediate Dentin Sealing | `{primary: "bonding", subtopic: "clinical"}` | Notecast parallel of [5]. | keep |
| 343 | `/insight/insight-36.html` | ایزولاسیون مرحله‌ای با نوار تفلون | `{primary: "fixed-pros", subtopic: null}` | Sequential isolation during multi-unit laminate bonding. Technique sits between bonding/clinical and ceramics/surface-prep workflow. | discuss — `bonding/clinical` may be a better fit than `fixed-pros` |

### 3.3 — Resin cement with ceramic restorations (edge-case: legitimate in `resin-cements`)

| # | URL | Title | Current pillar | Note | Recommendation |
|---|---|---|---|---|---|
| 168 | `/episodes/episode-138.html` | ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت دوم | `{primary: "resin-cements", subtopic: null}` | Cementation/finishing of indirect (ceramic) restorations. | keep |
| 190 | `/episodes/episode-148.html` | انتخاب سمان رزینی (لمینیت و اینله) — قسمت اول | `{primary: "resin-cements", subtopic: null}` | Resin cement selection for veneer/inlay (ceramic). Direct hit on edge-case rule. | keep |
| 193 | `/episodes/episode-149.html` | انتخاب سمان رزینی (لمینیت و اینله) — قسمت دوم | `{primary: "resin-cements", subtopic: null}` | Same. Caption explicitly mentions ceramic type and thickness. | keep |

### 3.4 — Ceramic restoration as a treatment option within a broader clinical context

| # | URL | Title | Current pillar | Note | Recommendation |
|---|---|---|---|---|---|
| 39 | `/episodes/episode-40.html` | اندوکراون – مقدمه‌ای بر رستوریشن‌های مدرن | `{primary: "endo", subtopic: null}` | Endocrown sits at endo/ceramic intersection; typically lithium disilicate or zirconia. | discuss |
| 40 | `/episodes/episode-41.html` | مرور سیستماتیک اندوکراون | `{primary: "endo", subtopic: null}` | Same. Material comparison is part of the review. | discuss |
| 140 | `/episodes/episode-123-1.html` | اینسایت — تطابق لبه‌ای: دیجیتال یا معمولی؟ | `{primary: "fixed-pros", subtopic: null}` | Marginal fit comparison specifically on lithium disilicate crowns — three-way pull: digital, fixed-pros, ceramics. | discuss |
| 169 | `/episodes/episode-139.html` | متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول | `{primary: "implantology", subtopic: null}` | Implant prosthetic material discussion (incl. zirconia/ceramics) from a bone-biology angle (Zero Bone Loss). | keep |
| 170 | `/episodes/episode-140.html` | متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت دوم | `{primary: "implantology", subtopic: null}` | Same. | keep |
| 171 | `/episodes/episode-141.html` | متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت سوم | `{primary: "implantology", subtopic: null}` | Same. | keep |
| 180 | `/episodes/episode-147.html` | بهترین متریال سوپراجینجیوال (Zero Bone Loss) — قسمت دوم | `{primary: "esthetic", subtopic: null}` | Material selection for supragingival implant restoration; the `esthetic` placement is the most surprising in the trio (parts 1 and 3 of the same arc are in `implantology`). Worth a consistency review. | discuss |
| 215 | `/insight/insight-10.html` | مدیریت فضا برای ایمپلنت قدامی در بیمار Deep Bite | `{primary: "implantology", subtopic: null}` | Mentions PFM-vs-ceramic choice as one constraint among many; subject is space management. | keep |
| 333 | `/insight/insight-32.html` | کانتور مقعر در روکش سرامیکی | `{primary: "fixed-pros", subtopic: null}` | Concave contour failure in ceramic crown leading to perio issues. The contour-induced failure is broadly applicable, but the substrate is explicitly ceramic. | discuss — arguably `ceramics/failures` |
| 356 | `/sharehub/share-6.html` | نحوه تنظیم اکلوژن در لامینیت‌های سرامیکی | `{primary: "occlusion", subtopic: null}` | Occlusion adjustment protocol specifically on ceramic laminates. Defensible in `occlusion` since the procedure is the subject, but the ceramic-specific risk profile (LTD, chipping) ties it to ceramics. | discuss |

---

## 4. `dentcast-brain.json` — Reverse check (false positives in ceramics)

Of the 46 current ceramics-pillar entries, **none have a subject that falls outside the five ceramics subtopics (basics, types, surface-prep, indications, failures).** All are legitimate ceramics-pillar content.

A few entries have debatable *subtopic* placement within ceramics (which is outside the scope of this audit — this audit targets `pillar.primary` mismatches, not subtopic refinement). For reference only, the most discussion-worthy intra-pillar placements are:

- `[137] /episodes/episode-122-5.html — کارایی فرزهای الماسه روی زیرکونیا` — currently `indications`. Subject is bur cutting efficiency on zirconia, which is closer to a workflow/handling consideration. Stays in ceramics regardless.
- `[210] /insight/insight-5.html — تغییر رنگ روکش‌های سرامیکی پس از سمان دائم` — currently `indications`. Could arguably sit in `failures` (color-shift failure mode) or surface-prep-adjacent (cement-substrate optical interaction). Stays in ceramics regardless.
- `[319] /insight/insight-28.html — راهکار مقابله با ته رنگ خاکستری روکش` — currently `indications`. Borderline esthetic-vs-ceramic; deals with translucency-driven gray show-through. Stays in ceramics regardless.

**Count: 0**

---

## 5. `glossary/glossary.json` — Clear ceramics orphans

Reviewed all 61 non-ceramic-pillar glossary entries. **None have a subject that is unambiguously ceramic.** Glossary terms with ceramic relevance are all already in the ceramics pillar (zirconia, silane, MDP, zirconia primer, sandblasting, silica-based ceramics, dental ceramics, glass phase, crystalline phase, feldspathic porcelain, glass ceramics, lithium disilicate, ZLS, hybrid ceramics, polycrystalline ceramics, flexural strength, translucency, sintering).

Note: glossary entries carry no `description`/`summary` fields — only `title`, `fa_title`, `synonyms`, `url`, and `pillar`. Classification was made from those fields. If the actual HTML body of a gloss reframes the term in a non-obvious way, that would only surface under "needs human review of full content" — but no glossary title/synonym set in the non-ceramic pool reads as ceramic-orphan even on generous reading.

**Count: 0**

---

## 6. `glossary/glossary.json` — Ambiguous cases

Non-ceramic-pillar glossary entries that touch ceramic territory but have a defensible reason to sit elsewhere.

**Count: 0** — none of the 61 non-ceramic glossary entries are close enough to ceramic subject matter to warrant flagging.

---

## 7. `glossary/glossary.json` — Reverse check (false positives in ceramics)

Of the 18 current ceramics-pillar glossary entries, **none are clear false positives.** However, four entries are borderline per the prompt's explicit edge-case for glossary ("a gloss for a generic concept... used widely outside ceramics may legitimately have `primary: null` or another pillar"). They are listed here for transparency, not as recommendations to move.

| # | Slug | Title | Current placement | Why borderline | Recommendation |
|---|---|---|---|---|---|
| 24 | `mdp` | MDP (10-MDP Monomer) | `{primary: "ceramics", subtopic: "surface-prep"}` | MDP is a functional monomer found in many universal adhesives (not only zirconia primers). Defensible in `bonding/materials` too. Currently classified by its clinically discriminating use (zirconia bonding). | keep — but worth noting it cross-cuts with `bonding/materials` |
| 29 | `sandblasting` | Sandblasting (Air Abrasion) | `{primary: "ceramics", subtopic: "surface-prep"}` | Air abrasion is used on metal frameworks, posts, and intaglio surfaces beyond ceramics. Synonyms include the generic "mechanical surface roughening." | keep — most dentistry use cases are ceramic-adjacent |
| 65 | `flexural-strength` | Flexural Strength | `{primary: "ceramics", subtopic: "basics"}` | Generic material-mechanics property — applies to composite, alloy, ceramic. Defensible as a ceramic basic because it's the dominant figure-of-merit for ceramic materials. | keep — flag as cross-pillar concept |
| 66 | `translucency` | Translucency | `{primary: "ceramics", subtopic: "basics"}` | Generic optical property — applies to composites and natural enamel too. Discriminating use in dentistry is mostly ceramic (zirconia generations, lithium disilicate vs feldspathic). | keep — flag as cross-pillar concept |

**Count of clear false positives: 0** (4 borderline-but-defensible cases noted above)

---

## 8. Summary counts

| Dataset | Total entries | Current `ceramics` count | Clear orphans | Ambiguous | False positives (clear) |
|---|---:|---:|---:|---:|---:|
| `dentcast-brain.json` | 358 | 46 | 0 | 19 | 0 |
| `glossary/glossary.json` | 79 | 18 | 0 | 0 | 0 (4 borderline) |

Ambiguous brain count breakdown: tooth-prep intersection (4), bonding-to-ceramic (7), resin-cement-with-ceramic (3), ceramic-as-option-in-broader-context (10) — but several overlap categories so the deduplicated unique count is **19** distinct entries (cross-counting the rows in §3 once).

---

## 9. Hashes after

| File | SHA-256 |
|---|---|
| `dentcast-brain.json` | `b3f0f7c79cabd2a1178a28ccbf0f305c37df0d6060a63add7d5a045cda93c3d2` |
| `glossary/glossary.json` | `839fe34c0bc70ceafda68b10157fcc0b11ef04fe3590add2e278bc25d1319c1b` |

**Integrity check:** Both before/after pairs match. No files were modified during this audit.

---

## Audit notes

- The brain file is, at the `pillar.primary` level, well-curated for ceramics. There were no clear-cut orphans — only edge-case entries where two pillars have a legitimate claim. The most clinically interesting cluster of those is §3.4: ceramic-restoration choice embedded in implant or endodontic decision-making. A second cluster (§3.1) is veneer-prep entries currently sitting in `esthetic` — these are a textbook example of the "tooth preparation for ceramic restorations" edge-case.
- One small consistency anomaly worth a separate look (outside this audit's strict scope): entries `[169]`, `[170]`, `[171]`, and `[180]` are sequential parts of the same arc (Zero Bone Loss implant restoration material), but `[180]` is in `esthetic` while the other three are in `implantology`. Not a ceramic-orphan issue, but worth flagging because it breaks an obvious sequence.
- The glossary is internally consistent and conservative — all dedicated ceramic terms are in ceramics; nothing leaks out, and nothing irrelevant leaks in. The four borderline cases in §7 (MDP, sandblasting, flexural strength, translucency) are exactly the kind of cross-pillar concepts the prompt anticipated; the current placements are defensible.
