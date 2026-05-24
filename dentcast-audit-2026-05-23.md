# DentCast (dentcast.ir) — Structural & Content Audit
*Read-only audit. Source: local backup at `E:\DentCast_GitBackup\dentcast-hub.github.io`. Snapshot date: 2026-05-23. No modifications to the site were made.*

## 1. Overview
- **Total HTML pages audited**: 467
- **Distinct content formats**: 11 primary (Podcast Episode, NoteCast, Glossary, Clinical Insight, MetaNote, LiteCast, Chairside, DentAI, +DentCast, Share Hub, PhotoCast) + site infrastructure
- **Distinct dominant topics identified**: 23
- **Orphan pages** (zero inbound internal links): 11 — 404.html, episodes.html, glossary/bonding-generations.html, glossary/platform-switch.html, glossary/temporary-cement-contamination.html, glossary/universal-adhesive.html, google53b100d9b9181a71.html, join.html, metanotes/en/meta-1.html, player.html, search.html
- **Top inbound non-infra page**: `glossary/zirconia.html` (23 inbound)
- **Top inbound page overall**: `index.html` (460) and `about.html` (449) — confirming the site relies on global rather than topical hubs.

### 1.1 Format counts
| Format / Content Type | Count |
|---|---:|
| Podcast episode | 205 |
| Glossary entry | 79 |
| Clinical Insight | 41 |
| NoteCast | 32 |
| LiteCast | 25 |
| Chairside (patient-facing) | 17 |
| DentAI | 16 |
| MetaNote | 12 |
| +DentCast video | 6 |
| Share Hub item | 6 |
| MetaNote (EN) | 5 |
| PhotoCast | 3 |
| 404 page | 1 |
| About page | 1 |
| Episodes hub (top-level) | 1 |
| Google verification | 1 |
| Site homepage | 1 |
| Join/Subscribe page | 1 |
| Audio player page | 1 |
| Search page | 1 |
| Chairside index | 1 |
| DentAI index | 1 |
| +DentCast index | 1 |
| Episodes index | 1 |
| Glossary index | 1 |
| Clinical Insight index | 1 |
| LiteCast index | 1 |
| MetaNote index | 1 |
| MetaNote (EN) about | 1 |
| NoteCast index | 1 |
| PhotoCast index | 1 |
| Share Hub index | 1 |

## 2. Per-topic table
| Topic | Page Count | Format Breakdown | Existing Pillar Candidate | Existing Clusters (high-inbound) | Orphan Pages | Identified Gaps |
|-------|-----------:|------------------|---------------------------|---------------------------------|--------------|-----------------|
| Adhesive Dentistry / Bonding | 85 | Glossary entry: 35, Podcast episode: 34, NoteCast: 9, DentAI: 6, Clinical Insight: 1 | None topical. Format-level: `glossary/index.html`. De-facto small hubs: `glossary/bonding-strategy.html` (13 inb), `glossary/silane.html` (15 inb), `glossary/resistance.html` (15 inb). | Glossary inter-linking forms 3 implicit micro-clusters: bonding-strategy / etch-and-rinse / self-etch / selective-etch; smear-layer / hybrid-layer / dentinal-tubules; silane / phosphoric-acid / phosphoric-acid-contamination. NoteCast → Glossary linking (~4.75 links/page) reinforces these. | `glossary/bonding-generations.html`, `glossary/universal-adhesive.html` | Strongest topical mass but only a format-level hub (Glossary index); no dedicated bonding pillar. ~35 of 85 pages are Glossary; only 1 Clinical Insight despite the topic's centrality. NoteCast support is shallow (9 entries). |
| Implantology | 72 | Podcast episode: 35, LiteCast: 10, Clinical Insight: 6, MetaNote: 4, NoteCast: 4, Glossary entry: 3, Chairside (patient-facing): 2, MetaNote (EN): 2, About page: 1, Episodes hub (top-level): 1, Site homepage: 1, Audio player page: 1, +DentCast index: 1, Share Hub item: 1 | None topical. Site-level: `index.html` (460 inb), `about.html` (449 inb) but neither is topic-specific. No implant hub page exists. | Episode-level cluster around Zero Bone Loss (episodes 112, 147, 147.x) and Bio-Restorative (155–157); peri-implantitis glossary node; thin written follow-through. | `episodes.html`, `player.html` | Heavy episode coverage (35 episodes) but only 3 Glossary entries classified here as dominant topic, and 4 NoteCasts. No implant-specific pillar; top inbound pages are sitewide (homepage/about). The dedicated Episodes hub `/episodes.html` is itself orphaned. |
| Fixed Prosthodontics | 51 | Podcast episode: 18, Clinical Insight: 13, Chairside (patient-facing): 5, Glossary entry: 4, MetaNote: 4, LiteCast: 2, DentAI: 1, +DentCast video: 1, MetaNote (EN) about: 1, NoteCast: 1, PhotoCast: 1 | None topical. Small de-facto hubs: `glossary/ferrule-effect.html` (8 inb), `glossary/crown-lengthening.html` (8 inb). | Crown-prep guideline cluster (episodes 113–114, 122–123); ferrule + crown-lengthening glossary cluster; Pascal Magne / biomimetic cluster overlaps with Adhesive Dentistry. | None | Distributed across many formats (18 episodes, 13 Insights, 5 Chairside, 4 MetaNotes) but no single Pillar page; relies on individual Glossary entries (ferrule-effect, crown-lengthening) acting as de-facto small hubs. |
| Dental Ceramics & Materials | 42 | Podcast episode: 18, Glossary entry: 13, NoteCast: 9, Clinical Insight: 2 | None topical. Strongest single hub: `glossary/zirconia.html` (23 inb) — highest-inbound content page on the site. | Zirconia mini-cluster (zirconia, zirconia-primer, sandblasting, zls, polycrystalline-ceramics); glass-ceramics cluster (lithium-disilicate, feldspathic, glass-phase, crystalline-phase, silica-based-ceramics, translucency). | None | `glossary/zirconia.html` functions as an accidental quasi-pillar (23 inbound — highest of any content page). No NoteCast/Insight ceramics hub; coverage is split between episodes and 13 Glossary entries. |
| Esthetic Dentistry / Smile Design | 28 | Podcast episode: 22, DentAI: 2, NoteCast: 2, Chairside (patient-facing): 1, LiteCast: 1 | None. Episode 147 (10 inb) is the strongest single page in the topic but it is a single episode, not a hub. | Global Diagnosis episode arc (116–120); McLaren / Dentopedia smile-analysis arc; veneer / laminate scattered. | None | 22 episodes, but zero Glossary entries mapped here as dominant and only 2 NoteCasts; no smile-design pillar; semantic clustering is loose. |
| Implant Prosthodontics | 28 | Podcast episode: 12, Clinical Insight: 5, Glossary entry: 4, LiteCast: 3, +DentCast video: 2, Chairside (patient-facing): 1, NoteCast: 1 | None. Small de-facto hubs: `glossary/scan-body.html` (7 inb), `glossary/emergence-profile.html` (6 inb). | Ti-Base arc (episodes 105, 106, 106.x + glossary/ti-base); Scan Body / digital workflow arc; emergence profile and platform switch glossary anchors. | `glossary/platform-switch.html` | Strong glossary support (Ti-Base, Scan Body, Emergence Profile, Platform Switch) but no implant-prosth-specific pillar; `glossary/platform-switch.html` is orphaned. |
| Occlusion / TMD | 28 | Podcast episode: 14, Clinical Insight: 6, +DentCast video: 2, NoteCast: 2, Chairside (patient-facing): 1, Glossary entry: 1, PhotoCast: 1, Share Hub item: 1 | None. `glossary/vertical-dimension-of-occlusion.html` (7 inb) is the only topical anchor. | VDO arc (episode 14, 131, 132); TMD arc (episodes 142+); articulating-paper Clinical Insight (insight-1, 8+ secondary). | None | 14 episodes + 6 Clinical Insights but only 1 Glossary entry (VDO). No occlusion pillar; cluster forms organically around episodes 131–132 and 142. |
| Operative / Restorative Dentistry | 27 | Podcast episode: 11, DentAI: 7, Glossary entry: 5, Clinical Insight: 2, +DentCast video: 1, LiteCast: 1 | None topical. `glossary/isolation.html` (11 inb) and `glossary/rubber-dam.html` (5 inb) function as fragment-hubs. | NCCL arc (episode 125), Goodacre prep principles (113–114), DentAI restorative articles, isolation + rubber-dam glossary micro-cluster. | None | Mid-size mass (27 pages), but 7 of them are DentAI articles — the longest-form content. Only 1 episode (125) is classified here as dominant; Glossary support is thin (5 entries) and chairside/insight integration sparse. |
| Resin Cements / Luting | 20 | Glossary entry: 9, Podcast episode: 7, NoteCast: 2, Clinical Insight: 1, Share Hub item: 1 | None topical. `glossary/resin-cements.html` (13 inb) acts as quasi-pillar. | Cement-selection arc (episodes 148+) plus tightly cross-linked Glossary cluster (resin-cements, dental-cement, traditional-cements, light-cure / dual-cure / self-adhesive cements). | `glossary/temporary-cement-contamination.html` | Largely a Glossary-driven cluster (9 entries). `resin-cements.html` and `dental-cement.html` act as semi-pillars. `temporary-cement-contamination.html` is orphaned. |
| Digital Dentistry / CAD-CAM | 14 | Podcast episode: 9, Clinical Insight: 2, DentAI index: 1, Glossary entry: 1, Share Hub item: 1 | None. `dentai/index.html` exists as a format hub but covers AI/digital articles, not strictly the topic. | Scan-accuracy mini-cluster (episodes 109, 122-2, 133, scan-body glossary); STL/OBJ/PLY (episode 106-2); minimal cohesion. | None | 14 pages spread thinly across episodes and DentAI index; only 1 dedicated Glossary entry (milling). No digital-dentistry hub. |
| Removable Prosthodontics | 12 | Podcast episode: 7, Chairside (patient-facing): 2, LiteCast: 2, NoteCast: 1 | None. No hub. | Overdenture attachment arc (episodes 27, 50, 147.1, 147.6, 118-1). | None | 12 pages, mostly episodes; no Glossary support at all; no hub. |
| Meta / Frameworks | 11 | Podcast episode: 10, MetaNote index: 1 | `metanotes/index.html` exists as format hub. | Dentopedia format running across episodes (106.1, 107.1, 109.1, 121.1, 122.4 etc.) — a parallel meta-content stream. | None | 11 pages but 10 are 'Dentopedia' podcast episodes plus the MetaNote index; very little cross-format integration. |
| Periodontics | 10 | MetaNote: 3, MetaNote (EN): 3, Chairside (patient-facing): 2, Glossary entry: 2 | None topical. `glossary/biological-width.html` (6 inb) is the only anchor. | MetaNote series (meta-1, 2, 3) on periodontal prognosis + biological-width glossary anchor. | `metanotes/en/meta-1.html` | Only 10 pages and 2 are Glossary entries; biological-width and subgingival-margin function as small hubs; no perio pillar; one orphaned MetaNote (EN). |
| Site infrastructure / Index | 8 | 404 page: 1, Google verification: 1, Join/Subscribe page: 1, Search page: 1, Episodes index: 1, Glossary index: 1, Clinical Insight index: 1, NoteCast index: 1 | Various format hubs. | — | `404.html`, `google53b100d9b9181a71.html`, `join.html`, `search.html` | Site-level hubs and utility pages; not a clinical topic. |
| Endodontics | 8 | Podcast episode: 3, LiteCast: 2, Chairside (patient-facing): 1, Clinical Insight: 1, MetaNote: 1 | None. | Endocrown arc (episodes 40, 41) + insight on veneers over endo-treated teeth (122-3). | None | Thin coverage (8 pages); no dedicated Glossary; no pillar. |
| Treatment Planning / Decision-making | 5 | Podcast episode: 2, Chairside (patient-facing): 1, Clinical Insight: 1, LiteCast: 1 | None. | Global Diagnosis / GAD arc (episodes 116–124) — heavy treatment-planning material but classified under Esthetic or Fixed Pros as dominant. | None | Cross-cutting topic appears as dominant on only 5 pages but as secondary on 13 more; no pillar despite being a recurring framework on the site. |
| Curated External Content | 5 | Glossary entry: 2, Share Hub item: 2, Share Hub index: 1 | `sharehub/index.html`. | Share Hub set (6 items). | None | Share Hub format (6 items + index) is small and isolated; classified here only because of explicit 'curated' tagging. |
| Patient Education / General | 3 | Chairside index: 1, LiteCast index: 1, LiteCast: 1 | `litecast/index.html`, `chairside/index.html` (format hubs, not topic). | LiteCast format (25 items) — patient-facing but topically scattered. | None | Only 3 pages dominant-tagged; LiteCast (25 pages total) is mostly distributed across clinical topics rather than functioning as a coherent patient-education cluster. |
| Oral Medicine / Pharmacology | 3 | Podcast episode: 1, LiteCast: 1, NoteCast: 1 | None. | Drug-interaction trio: episode 22 + NoteCast 22 + lite-CAST6. | None | 3 pages total (episode 22, its NoteCast, and one LiteCast on cold sores). Very thin coverage. |
| Orthodontics | 2 | Chairside (patient-facing): 1, Clinical Insight: 1 | None. | None coherent. | None | Effectively absent as a primary topic — only 2 pages reference ortho-prosth interface. |
| Oral Radiology / Imaging | 2 | Podcast episode: 1, LiteCast: 1 | None. | None coherent. | None | Almost absent (2 pages). |
| Pediatric Dentistry | 2 | Podcast episode: 1, PhotoCast: 1 | None. | None coherent. | None | Almost absent (2 pages — episode 111.1 fissure sealant + photocast 3). |
| Clinical Photography | 1 | PhotoCast index: 1 | `photocast/index.html` (format hub). | PhotoCast format (3 episodes + index). | None | Only the PhotoCast index ended up here; PhotoCast episodes were classified into Occlusion / Fixed Pros / Pediatric based on their case content. The PhotoCast format itself has only 3 episodes. |

## 3. Internal linking analysis
### 3.1 Top inbound pages

| Inbound | Page | Type |
|---:|---|---|
| 460 | `index.html` | Site homepage |
| 449 | `about.html` | About page |
| 205 | `episodes/index.html` | Episodes index |
| 80 | `glossary/index.html` | Glossary index |
| 23 | `glossary/zirconia.html` | Glossary entry |
| 15 | `glossary/silane.html` | Glossary entry |
| 15 | `glossary/resistance.html` | Glossary entry |
| 13 | `glossary/resin-cements.html` | Glossary entry |
| 13 | `glossary/bonding-strategy.html` | Glossary entry |
| 11 | `glossary/isolation.html` | Glossary entry |
| 10 | `glossary/feldspathic-porcelain.html` | Glossary entry |
| 10 | `episodes/episode-147.html` | Podcast episode |
| 10 | `glossary/bond-strength.html` | Glossary entry |
| 8 | `glossary/translucency.html` | Glossary entry |
| 8 | `glossary/crown-lengthening.html` | Glossary entry |
| 8 | `glossary/ferrule-effect.html` | Glossary entry |
| 7 | `glossary/self-etch.html` | Glossary entry |
| 7 | `glossary/lithium-disilicate.html` | Glossary entry |
| 7 | `glossary/vertical-dimension-of-occlusion.html` | Glossary entry |
| 7 | `glossary/scan-body.html` | Glossary entry |
| 7 | `episodes/episode-123.html` | Podcast episode |
| 7 | `episodes/episode-122.html` | Podcast episode |
| 6 | `glossary/biological-width.html` | Glossary entry |
| 6 | `glossary/sandblasting.html` | Glossary entry |
| 6 | `glossary/dental-cement.html` | Glossary entry |

### 3.2 Orphan pages (zero inbound internal links)

- `404.html` [404 page] — expected for this page type.
- `episodes.html` [Episodes hub (top-level)] — the canonical Episodes hub; orphaned because internal links use the directory form `/episodes/` which redirects here.
- `glossary/bonding-generations.html` [Glossary entry] — Glossary entry not referenced from any other page.
- `glossary/platform-switch.html` [Glossary entry] — Glossary entry not referenced from any other page.
- `glossary/temporary-cement-contamination.html` [Glossary entry] — Glossary entry not referenced from any other page.
- `glossary/universal-adhesive.html` [Glossary entry] — Glossary entry not referenced from any other page.
- `google53b100d9b9181a71.html` [Google verification] — expected for this page type.
- `join.html` [Join/Subscribe page] — reachable only via global navigation (rendered from JS) which is not parsed by static link analysis; functionally not orphan.
- `metanotes/en/meta-1.html` [MetaNote (EN)] — English MetaNote 1 is not linked from any other page (other EN metanotes 2–5 are linked from EN about.html).
- `player.html` [Audio player page] — reachable via JS audio player, not via HTML link.
- `search.html` [Search page] — reachable only via global navigation (rendered from JS) which is not parsed by static link analysis; functionally not orphan.

### 3.3 Cross-format linking patterns (observed)

- **Podcast Episodes** (205 pages, ~1,101 internal outbound): heavy episode-to-episode chaining (435), and each episode links to homepage + about + episodes-index. Only **32 links to NoteCast** (one per paired NoteCast) and **19 links to Glossary** — i.e. episodes barely surface the glossary network from the main listening pages (~0.09 glossary links per episode).
- **NoteCast** (32 pages, ~316 raw outbound link instances; 218 unique edges): **187 raw links → Glossary entries, across 152 unique NoteCast→Glossary edges** (~5.8 glossary references / NoteCast, ~4.75 distinct glossary targets / NoteCast). This is the strongest cross-format semantic pattern on the site.
- **Clinical Insight** (41 pages, ~127 outbound): 32 links to Glossary, 13 links to Podcast Episodes — moderate cross-linking.
- **DentAI** (16 pages, ~62 outbound): 30 links to Glossary — strong glossary integration (~1.9 / page).
- **Glossary entries** (79 pages, ~329 outbound): **92 cross-glossary links** — Glossary terms cross-reference each other, especially within bonding, ceramics, and resin-cement clusters.
- **Chairside** (17 articles, ~69 outbound): 18 chairside-to-chairside chaining, **13 to Glossary**, only **3 to Podcast Episodes**. Cluster forms internally but does not surface the deeper knowledge graph.
- **LiteCast** (25 pages, ~51 outbound): essentially only links to homepage + about. **Only 1 Glossary link in 25 LiteCasts** — effectively siloed from the clinical knowledge network.
- **MetaNote** (12 + 5 EN, ~30 outbound): mostly self-referential or to about.html. Almost no integration with episodes or glossary.
- **Share Hub** (6 items + index, small graph): isolated curated cluster.

### 3.4 Natural topical clusters already forming through linking

- **Bonding glossary micro-clusters**: `bonding-strategy ↔ etch-and-rinse ↔ self-etch ↔ selective-etch` and `smear-layer ↔ hybrid-layer ↔ dentinal-tubules ↔ collagen-fibers` — coherent clusters held together by glossary-internal cross-links plus heavy NoteCast → Glossary traffic.
- **Zirconia / glass-ceramic cluster**: `zirconia (23 inb) ↔ zirconia-primer ↔ sandblasting ↔ zls ↔ polycrystalline-ceramics` and `lithium-disilicate ↔ feldspathic-porcelain ↔ glass-phase ↔ crystalline-phase ↔ silica-based-ceramics ↔ translucency`.
- **Resin cement cluster**: `resin-cements (13 inb) ↔ dental-cement ↔ traditional-cements ↔ self-adhesive-cements ↔ dual-cure / light-cure / self-cure resin-cement`.
- **Ti-Base / scan body implant arc**: episodes 105, 106, 106.x + `glossary/ti-base` + `glossary/scan-body` + `glossary/emergence-profile`.
- **Zero Bone Loss episode arc**: episodes 112, 147 + 147-series + episode 157 (Bio-Restorative). Forms a coherent implant restorative sequence but lacks a written summary hub.
- **Global Diagnosis / GAD arc**: episodes 116–120 + 124. Heavy treatment-planning material that splits across Esthetic and Fixed Pros classifications.
- **TMD / VDO arc**: VDO glossary (7 inb) + episodes 14, 131, 132, 142+.
- **Crown-prep guideline arc (Goodacre)**: episodes 113–114, 122–123 + ferrule and crown-lengthening glossary anchors.

## 4. Gaps observed (no recommendations — observations only)

### 4.1 Pillar gaps (scattered topical mass, no central hub)
- **Adhesive Dentistry / Bonding** (85 pages) — no bonding pillar; only the Glossary format hub.
- **Implantology** (72 pages) — no implant pillar; top inbound pages are sitewide infra.
- **Fixed Prosthodontics** (51 pages) — no pillar; the topic only has small Glossary anchors.
- **Dental Ceramics & Materials** (42 pages) — no pillar; `zirconia.html` carries the weight by accident.
- **Esthetic Dentistry / Smile Design** (28 pages) — no pillar; Episode 147 is the only high-inbound anchor.
- **Implant Prosthodontics** (28 pages) — no pillar.
- **Occlusion / TMD** (28 pages) — no pillar; only VDO glossary as anchor.
- **Operative / Restorative Dentistry** (27 pages) — no pillar.
- **Resin Cements / Luting** (20 pages) — no pillar; `resin-cements.html` glossary entry acts as quasi-pillar.
- **Digital Dentistry / CAD-CAM** (14 pages) — no pillar.

### 4.2 Topics with thin or absent coverage relative to apparent scope
- **Endodontics** (8) — limited to endocrown arc and a few cross-topic mentions.
- **Periodontics** (10 dominant; 17 secondary) — almost entirely carried by MetaNotes 1–3 and 2 glossary entries.
- **Removable Prosthodontics** (12) — no Glossary entries at all; episode-only.
- **Treatment Planning / Decision-making** (5 dominant; 13 secondary) — recurring as a framework but never centralised.
- **Oral Medicine / Pharmacology** (3) — single drug-interaction trio.
- **Orthodontics** (2), **Oral Radiology / Imaging** (2), **Pediatric Dentistry** (2), **Clinical Photography** (1 if you exclude the PhotoCast format itself) — effectively absent.

### 4.3 Format imbalances within topics
- **Implantology**: 35 episodes vs. 3 Glossary entries (dominant) and 4 NoteCasts — audio-heavy, written-thin.
- **Esthetic Dentistry / Smile Design**: 22 episodes, 2 NoteCasts, 0 Glossary entries with this as dominant — no written/reference layer.
- **Operative / Restorative Dentistry**: 11 episodes vs. 7 DentAI articles (DentAI is the longest-form content, ~1,300 words avg) — DentAI carries disproportionate weight relative to native podcast content.
- **Removable Prosthodontics**: 7 episodes, 0 Glossary, 1 NoteCast — episode-only.
- **Periodontics**: 0 episodes classified as dominant Perio (perio appears as secondary in many), 2 Glossary, 3 MetaNotes — written-heavy, audio-thin.
- **LiteCast (25)** and **Chairside (17)**: large standalone formats that almost never link out to the clinical knowledge graph (Glossary or Episodes).

## 5. Narrative summary

The site is large for a single-author project — 467 HTML pages across eleven content formats. The center of mass is unambiguously prosthodontic-restorative: Implantology (72), Implant Prosthodontics (28), Fixed Prosthodontics (51), Resin Cements (20), and Dental Ceramics (42) together cover ~46% of pages. Adhesive Dentistry / Bonding is the single largest topic cluster at 85 pages, driven mostly by Glossary depth (35 entries) plus 34 podcast episodes; it functions as the site's deepest knowledge layer even though no dedicated bonding pillar exists. The Esthetic Dentistry / Smile Design (28), Occlusion / TMD (28), and Operative / Restorative (27) topics form mid-tier mass, each anchored by episode arcs rather than written hubs. Beyond these, every other dental specialty thins rapidly: Periodontics (10), Endodontics (8), Treatment Planning (5), Oral Medicine (3), Orthodontics (2), Oral Radiology (2), Pediatric (2) — clearly secondary to the prosthodontic core.

Structurally, the site has format-level pillars (Episodes, Glossary, NoteCast, Insight, MetaNote, LiteCast, Chairside, DentAI, PhotoCast, +DentCast, Share Hub) but no topic-level pillars. The Glossary index and `glossary/zirconia.html` (23 inbound) act as accidental hubs; most other inbound mass collapses onto homepage and about.html (460 / 449 inbound respectively). NoteCast → Glossary linking is the only strong cross-format semantic pattern (~4.75 glossary references per NoteCast); LiteCast, MetaNote, and Chairside are largely siloed from the clinical knowledge graph. Eleven pages are orphaned, including four Glossary entries and — notably — the top-level `episodes.html` hub itself. Coverage is layered where the site cares (bonding, ceramics, implants, occlusion) and surface-level or absent elsewhere; the topical landscape is dense but unevenly anchored, with most clusters held together by episode sequences rather than by pillar pages.

## 6. Methodology & limitations

- Topic classification uses keyword/hashtag patterns from `dentcast-brain.json` plus title/description fallback for items absent from the brain (most Glossary entries, static pages). Pages with ambiguous metadata were classified by their dominant keyword signal; secondary topics are reported when scoring is close.
- Four podcast/LiteCast pages were Unclassified by the rule set and were hand-patched after manual inspection (`episodes/episode-117` → Treatment Planning; `episodes/episode-125` → Operative; `lite-CAST1` → Patient Education; `lite-CAST6` → Oral Medicine). Documented in `classified.json` with `classification_source: manual-patch`.
- "Inbound" counts unique source pages; outbound links resolved via static HTML parsing. JavaScript-driven links (e.g., audio player, search overlay) are not captured, so `player.html` is reported orphan even though it is reachable through scripted navigation.
- Word counts are whitespace-token counts on stripped HTML. Persian script and zero-width non-joiners can shift counts ±5%; treat them as relative, not absolute.
- "Format Breakdown" counts the index pages of each format inside their format bucket; "DentAI: 16 + DentAI index: 1" is reported separately rather than collapsed.
- The "Site infrastructure / Index" topic is a catch-all bucket for utility pages (404, search, join, format hubs) — not a clinical category.
- No live-site verification was performed; this audit is read-only and reflects the local backup state.

## 7. Full page inventory

*Sorted by content type, then path. `Inbound` = unique internal source pages linking to this page.*

| # | Path | Content Type | Topic | Words | Inbound | Modified | Title |
|---|------|--------------|-------|------:|--------:|----------|-------|
| 1 | `dentcast-plus/index.html` | +DentCast index | Implantology | 163 | 1 | 2026-05-22 | 🎬 DentCast+ / آموزش‌های ویدیویی دندان‌پزشکی |
| 2 | `dentcast-plus/video-1.html` | +DentCast video | Operative / Restorative Dentistry | 124 | 1 | 2026-05-22 | DentCast+ – نکات شخصی برای کیفیت تراش بهتر |
| 3 | `dentcast-plus/video-2.html` | +DentCast video | Occlusion / TMD | 268 | 1 | 2026-05-22 | DentCast+ – آخرین مرحله قبل از خداحافظی با بیمار |
| 4 | `dentcast-plus/video-3.html` | +DentCast video | Fixed Prosthodontics | 199 | 1 | 2026-05-22 | وقتی روکش راک دارد؛ ترتیب بررسی مهم است / DentCast+ |
| 5 | `dentcast-plus/video-4.html` | +DentCast video | Implant Prosthodontics | 286 | 1 | 2026-05-22 | یک تست ساده قبل از سمان؛ جلوی افتادن‌های بعدی را می‌گیرد / DentCast+ |
| 6 | `dentcast-plus/video-5.html` | +DentCast video | Implant Prosthodontics | 320 | 1 | 2026-05-22 | وقتی مشکل نه از لثه است نه از کانتکت؛ ثبات روکش را جدی بگیرید / DentCast+ |
| 7 | `dentcast-plus/video-6.html` | +DentCast video | Occlusion / TMD | 190 | 1 | 2026-05-22 | تداخل سمت کارگر در گروپ فانکشن/ DentCast+ |
| 8 | `404.html` | 404 page | Site infrastructure / Index | 60 | 0 | 2026-05-20 | صفحه پیدا نشد / DentCast |
| 9 | `about.html` | About page | Implantology | 380 | 449 | 2026-05-22 | دربارهٔ دکتر فواد شهابیان مقدم و دنت‌کست / DentCast |
| 10 | `player.html` | Audio player page | Implantology | 58 | 0 | 2026-05-20 | DentCast Player |
| 11 | `chairside/chairside-1.html` | Chairside (patient-facing) | Esthetic Dentistry / Smile Design | 309 | 1 | 2026-05-22 | Chairside 01 — تصمیم زیبایی در حضور دیاستم / دنت‌کست |
| 12 | `chairside/chairside-10.html` | Chairside (patient-facing) | Implantology | 503 | 1 | 2026-05-22 | Chairside 10 — قرارگیری عمیق ایمپلنت در فرش ساکت و پیامدهای پروتزی / دنت‌کست |
| 13 | `chairside/chairside-11.html` | Chairside (patient-facing) | Removable Prosthodontics | 446 | 1 | 2026-05-22 | Chairside 11 — نبود اکلوژن خلفی؛ مانعی پنهان برای اوردنچر فک بالا / دنت‌کست |
| 14 | `chairside/chairside-12.html` | Chairside (patient-facing) | Implant Prosthodontics | 357 | 1 | 2026-05-22 | Chairside 12 — فاصله فینیش‌لاین از مارجین روکش؛ خطایی که دیر دیده می‌شود / دنت‌ک |
| 15 | `chairside/chairside-13.html` | Chairside (patient-facing) | Fixed Prosthodontics | 364 | 1 | 2026-05-22 | Chairside 13 — از تصویر تا واقعیت؛ وقتی زمان، دادهٔ تشخیصی تولید می‌کند / دنت‌کس |
| 16 | `chairside/chairside-14.html` | Chairside (patient-facing) | Periodontics | 389 | 1 | 2026-05-22 | Chairside 14 — درخواست ونیر کامپوزیت در دندان‌های پریودنتالی؛ یک سرنخ تشخیصی، نه |
| 17 | `chairside/chairside-15.html` | Chairside (patient-facing) | Occlusion / TMD | 611 | 1 | 2026-05-22 | Chairside 15 — اکلوژن کانین‌رایز در یک سمت، گروپ‌فانکشن در سمت مقابل؛ وقتی ناهما |
| 18 | `chairside/chairside-16.html` | Chairside (patient-facing) | Fixed Prosthodontics | 334 | 1 | 2026-05-22 | Chairside 16 — وقتی حفظ دندان، به قیمت از دست رفتن استخوان تمام می‌شود / دنت‌کست |
| 19 | `chairside/chairside-17.html` | Chairside (patient-facing) | Implantology | 474 | 2 | 2026-05-22 | Chairside 17 — وقتی قبل از شروع درمان، باید به جراحیِ قبلی شک کرد / دنت‌کست |
| 20 | `chairside/chairside-2.html` | Chairside (patient-facing) | Orthodontics | 317 | 1 | 2026-05-22 | Chairside 02 — فضای بیش‌ازحد در ناحیه پرمولر / دنت‌کست |
| 21 | `chairside/chairside-3.html` | Chairside (patient-facing) | Treatment Planning / Decision-making | 318 | 1 | 2026-05-22 | Chairside 03 — فقدان قدیمی مولر مندیبل / دنت‌کست |
| 22 | `chairside/chairside-4.html` | Chairside (patient-facing) | Endodontics | 315 | 1 | 2026-05-22 | Chairside 04 — تحلیل سرویکال دندان قدامی / دنت‌کست |
| 23 | `chairside/chairside-5.html` | Chairside (patient-facing) | Fixed Prosthodontics | 350 | 1 | 2026-05-22 | Chairside 05 — خم شدن پست دندانی و نبود فرول / دنت‌کست |
| 24 | `chairside/chairside-6.html` | Chairside (patient-facing) | Fixed Prosthodontics | 391 | 1 | 2026-05-22 | Chairside 06 — نبود فرول در دندان ۶ پایین و تحلیل طرح درمان / دنت‌کست |
| 25 | `chairside/chairside-7.html` | Chairside (patient-facing) | Periodontics | 355 | 1 | 2026-05-22 | Chairside 07 — درد مبهم در ناحیه مزیال دندان ۶ بالا / دنت‌کست |
| 26 | `chairside/chairside-8.html` | Chairside (patient-facing) | Removable Prosthodontics | 382 | 1 | 2026-05-22 | Chairside 08 — نمای بیش‌ازحد ریج در بیمار متقاضی دنچر / دنت‌کست |
| 27 | `chairside/chairside-9.html` | Chairside (patient-facing) | Fixed Prosthodontics | 399 | 1 | 2026-05-22 | Chairside 09 — تصمیم‌گیری در دندان با پروگنوز نامشخص پیش از درمان قطعی / دنت‌کست |
| 28 | `chairside/index.html` | Chairside index | Patient Education / General | 310 | 1 | 2026-05-22 | 🪑 Chairside / روایت ویزیت‌های روزانه دنت‌کست |
| 29 | `insight/insight-1.html` | Clinical Insight | Occlusion / TMD | 242 | 1 | 2026-05-22 | ضخامت کاغذ آرتیکولاسیون مهم‌تر از چیزیه که فکر می‌کنی / دنت‌کست کلینیکال |
| 30 | `insight/insight-10.html` | Clinical Insight | Implantology | 422 | 1 | 2026-05-22 | مدیریت فضا در ایمپلنت سانترال بیمار Deep Bite / دنت‌کست |
| 31 | `insight/insight-11.html` | Clinical Insight | Endodontics | 521 | 1 | 2026-05-22 | درد مبهم و مرزهای مسئولیت در درمان (پروتز و اندو) / دنت‌کست |
| 32 | `insight/insight-12.html` | Clinical Insight | Occlusion / TMD | 338 | 1 | 2026-05-22 | بازگرداندن ارتفاع عمودی و ساپورت خلفی / دنت‌کست |
| 33 | `insight/insight-13.html` | Clinical Insight | Treatment Planning / Decision-making | 406 | 1 | 2026-05-22 | طرح درمان باید آینده را هم ببیند / دنت‌کست |
| 34 | `insight/insight-14.html` | Clinical Insight | Fixed Prosthodontics | 250 | 1 | 2026-05-22 | ارزیابی واقعی دندان فقط بعد از برداشتن روکش / دنت‌کست |
| 35 | `insight/insight-15.html` | Clinical Insight | Fixed Prosthodontics | 232 | 1 | 2026-05-22 | گیر کردن پست‌وکور بعد از ساخت؛ ترفند خارج‌سازی / دنت‌کست |
| 36 | `insight/insight-16.html` | Clinical Insight | Implantology | 322 | 1 | 2026-05-22 | مراقبت بیولوژیک در ایمپلنت‌های اسپلینت‌شده؛ تست عبور سوند / دنت‌کست |
| 37 | `insight/insight-17.html` | Clinical Insight | Fixed Prosthodontics | 146 | 1 | 2026-05-22 | یک عدد مهم در دسترسی کانال / دنت‌کست |
| 38 | `insight/insight-18.html` | Clinical Insight | Operative / Restorative Dentistry | 334 | 1 | 2026-05-22 | فینیش‌لاین عمودی؛ Finish Zone Concept وقتی «خط» وجود ندارد / دنت‌کست |
| 39 | `insight/insight-19.html` | Clinical Insight | Orthodontics | 260 | 1 | 2026-05-22 | ارزیابی فضای بازسازی در درمان ارتودنسی–پروتزی / دنت‌کست |
| 40 | `insight/insight-2.html` | Clinical Insight | Occlusion / TMD | 441 | 1 | 2026-05-22 | کراس‌مانت (Cross-Mounting) در پروتزهای وسیع / راهی برای حفظ VDO و اکلوژن |
| 41 | `insight/insight-20.html` | Clinical Insight | Fixed Prosthodontics | 305 | 1 | 2026-05-22 | وقتی به درمان ریشه مطمئن نیستیم؛ طراحی کور و پست به‌عنوان تصمیم درمانی / دنت‌کست |
| 42 | `insight/insight-21.html` | Clinical Insight | Occlusion / TMD | 330 | 1 | 2026-05-22 | تامین موقت ساپورت خلفی در باز سازی های وسیع |
| 43 | `insight/insight-22.html` | Clinical Insight | Implant Prosthodontics | 339 | 1 | 2026-05-22 | خارج کردن پیچ شکستهٔ اباتمنت در شکست‌های ثانویه / دنت‌کست |
| 44 | `insight/insight-23.html` | Clinical Insight | Operative / Restorative Dentistry | 362 | 1 | 2026-05-22 | وقتی رادیولوسنسی زیر ترمیم، پوسیدگی نیست / دنت‌کست |
| 45 | `insight/insight-24.html` | Clinical Insight | Implantology | 286 | 1 | 2026-05-22 | وقتی دندان کنار ایمپلنت، «Living Pontic» می‌شود / دنت‌کست |
| 46 | `insight/insight-25.html` | Clinical Insight | Fixed Prosthodontics | 389 | 1 | 2026-05-22 | وقتی دندان مجاور نیست، روکش بزرگ‌تر به نظر می‌رسد / دنت‌کست |
| 47 | `insight/insight-26.html` | Clinical Insight | Implant Prosthodontics | 405 | 1 | 2026-05-22 | انتقال صحیح اطلاعات Scan Body و نقش آن در موفقیت پروتز ایمپلنتی / دنت‌کست |
| 48 | `insight/insight-27.html` | Clinical Insight | Dental Ceramics & Materials | 301 | 1 | 2026-05-22 | Low Temperature Degradation در زیرکونیا؛ آنچه باید بدانیم / دنت‌کست |
| 49 | `insight/insight-28.html` | Clinical Insight | Fixed Prosthodontics | 227 | 1 | 2026-05-22 | راهکار مقابله با ته رنگ خاکستری روکش / دنت‌کست |
| 50 | `insight/insight-29.html` | Clinical Insight | Dental Ceramics & Materials | 340 | 1 | 2026-05-22 | راهکار مدیریت کانتکت بین روکشهای شش و هفت |
| 51 | `insight/insight-3.html` | Clinical Insight | Implantology | 326 | 1 | 2026-05-22 | نظم در بستن مجدد هیلینگ‌ها؛ جزئیاتی برای راحتی بیمار در درمان‌های ایمپلنت / دنت‌ |
| 52 | `insight/insight-30.html` | Clinical Insight | Implant Prosthodontics | 339 | 1 | 2026-05-22 | بررسی محل اسپرو در اباتمنت‌های Premill هنگام عدم نشست روکش ایمپلنتی |
| 53 | `insight/insight-31.html` | Clinical Insight | Implant Prosthodontics | 451 | 1 | 2026-05-22 | آیا اسکن‌بادی و Ti‑Base باید از یک برند باشند؟ / دنت‌کست |
| 54 | `insight/insight-32.html` | Clinical Insight | Fixed Prosthodontics | 237 | 1 | 2026-05-22 | کانتور مقعر در روکش سرامیکی |
| 55 | `insight/insight-33.html` | Clinical Insight | Digital Dentistry / CAD-CAM | 261 | 1 | 2026-05-22 | گسترش هدفمند اسکن برای طراحی بهتر تاج ایمپلنت |
| 56 | `insight/insight-34.html` | Clinical Insight | Fixed Prosthodontics | 284 | 1 | 2026-05-22 | کنترل جریان ماده قالب‌گیری با Posterior Damming / افزایش دقت ثبت دندان‌های خلفی |
| 57 | `insight/insight-35.html` | Clinical Insight | Implant Prosthodontics | 376 | 1 | 2026-05-22 | کوتاه دیده شدن اباتمنت در دهان / تشخیص خطا بین اسکن و ساخت اباتمنت |
| 58 | `insight/insight-36.html` | Clinical Insight | Fixed Prosthodontics | 309 | 1 | 2026-05-22 | ایزولاسیون با نوار تفلون در باندینگ لمینیت / کنترل توالی باند |
| 59 | `insight/insight-37.html` | Clinical Insight | Fixed Prosthodontics | 338 | 1 | 2026-05-22 | پریدگی دیستال لمینیت لترال / تداخل فانکشنال در حرکات پروتروزیو |
| 60 | `insight/insight-38.html` | Clinical Insight | Implantology | 430 | 1 | 2026-05-22 | حل معادله درمان بین‌رشته‌ای ایمپلنت و ارتودنسی / تعیین مرجع ثابت |
| 61 | `insight/insight-39.html` | Clinical Insight | Fixed Prosthodontics | 395 | 1 | 2026-05-22 | خروج از تونل کانال در دندان‌های C-Shape / وقتی پست‌و‌کور تنها مسیر نیست |
| 62 | `insight/insight-4.html` | Clinical Insight | Adhesive Dentistry / Bonding | 380 | 1 | 2026-05-22 | بیومیمتیک و چالش فرول در دندان‌های قدامی درمان‌شدهٔ اندو / دنت‌کست |
| 63 | `insight/insight-40.html` | Clinical Insight | Digital Dentistry / CAD-CAM | 489 | 1 | 2026-05-22 | مدیریت خونریزی پیش از اسکن / پیش‌نیاز ثبت دقیق مارجین |
| 64 | `insight/insight-41.html` | Clinical Insight | Fixed Prosthodontics | 439 | 1 | 2026-05-22 | ترتیب تراش در پست و کور / وقتی دسترسی مسیر را تعیین می‌کند |
| 65 | `insight/insight-5.html` | Clinical Insight | Resin Cements / Luting | 296 | 1 | 2026-05-22 | چالش تغییر رنگ روکش‌های سرامیکی پس از سمان دائم / دنت‌کست |
| 66 | `insight/insight-6.html` | Clinical Insight | Occlusion / TMD | 685 | 1 | 2026-05-22 | تحلیل تهیهٔ فضا در بیمار فاقد استاپ خلفی / دنت‌کست |
| 67 | `insight/insight-7.html` | Clinical Insight | Fixed Prosthodontics | 444 | 1 | 2026-05-22 | چرا این دندان امکان بازسازی دائمی ندارد؟ / دنت‌کست |
| 68 | `insight/insight-8.html` | Clinical Insight | Occlusion / TMD | 329 | 1 | 2026-05-22 | اگر کار می‌کنه، بذار کار کنه / دنت‌کست |
| 69 | `insight/insight-9.html` | Clinical Insight | Implantology | 336 | 1 | 2026-05-22 | آبسه‌ی ایمپلنت در ناحیه‌ی زیبایی؛ مقصر پنهان: سمان باقیمانده / دنت‌کست |
| 70 | `insight/index.html` | Clinical Insight index | Site infrastructure / Index | 527 | 1 | 2026-05-22 | Clinical Insight – بینش‌ بالینی / دنت‌کست |
| 71 | `dentai/dentai-1.html` | DentAI | Operative / Restorative Dentistry | 1347 | 1 | 2026-05-21 | DentAI – مقالهٔ ۱: تمایز بین خطوط ترک سنتی و داخلی در مینای دندان / دنت‌کست |
| 72 | `dentai/dentai-10.html` | DentAI | Esthetic Dentistry / Smile Design | 393 | 1 | 2026-05-22 | DentAI – تراش Elbow zone در تراش لمینیت های سرامیکی / دنت‌کست |
| 73 | `dentai/dentai-11.html` | DentAI | Operative / Restorative Dentistry | 368 | 1 | 2026-05-22 | DentAI – Peripheral Seal Zone (PSZ) و CRE در برداشت پوسیدگی / دنت‌کست |
| 74 | `dentai/dentai-12.html` | DentAI | Operative / Restorative Dentistry | 424 | 1 | 2026-05-22 | DentAI – در مورد استفاده از CDD در دندانپزشکی بیومیمتیک |
| 75 | `dentai/dentai-13.html` | DentAI | Operative / Restorative Dentistry | 553 | 1 | 2026-05-22 | DentAI – تشخیص آسیبهای ساختاری دندان |
| 76 | `dentai/dentai-14.html` | DentAI | Operative / Restorative Dentistry | 482 | 1 | 2026-05-22 | DentAI – انواع ترک دندان و نحوه ی تشخیص |
| 77 | `dentai/dentai-15.html` | DentAI | Operative / Restorative Dentistry | 538 | 1 | 2026-05-22 | DentAI – تشریح ترک دندان و نقاط پایانی حذف ترک (CrRE) |
| 78 | `dentai/dentai-16.html` | DentAI | Adhesive Dentistry / Bonding | 520 | 1 | 2026-05-22 | DentAI – سلسله‌مراتب قابلیت باند (HOB) و تفاوت قدرت باند در مینا و عاج |
| 79 | `dentai/dentai-2.html` | DentAI | Esthetic Dentistry / Smile Design | 486 | 1 | 2026-05-22 | DentAI – مقالهٔ ۲: رزین اینفیلتریشن برای درمان لکه‌های سفید دندانی / دنت‌کست |
| 80 | `dentai/dentai-3.html` | DentAI | Operative / Restorative Dentistry | 1156 | 1 | 2026-05-22 | DentAI – مقالهٔ ۳: اجماع جهانی در اصطلاحات مدیریت ضایعات پوسیدگی (ICCC) / دنت‌کس |
| 81 | `dentai/dentai-4.html` | DentAI | Adhesive Dentistry / Bonding | 389 | 1 | 2026-05-22 | DentAI – مقالهٔ ۴: اثر Caries Detector بر استحکام باند / دنت‌کست |
| 82 | `dentai/dentai-5.html` | DentAI | Adhesive Dentistry / Bonding | 453 | 1 | 2026-05-22 | DentAI – مقالهٔ ۵: بررسی ۱۴ ساله باندینگ سلف‌اچ / دنت‌کست |
| 83 | `dentai/dentai-6.html` | DentAI | Adhesive Dentistry / Bonding | 373 | 1 | 2026-05-22 | DentAI – مقالهٔ ۶: طبقه‌بندی کامپوزیت‌ها بر اساس ذرات / دنت‌کست |
| 84 | `dentai/dentai-7.html` | DentAI | Fixed Prosthodontics | 524 | 1 | 2026-05-22 | DentAI – مقالهٔ ۷: عملکرد بالینی RBFDPها و طراحی فریم‌ورک / دنت‌کست |
| 85 | `dentai/dentai-8.html` | DentAI | Adhesive Dentistry / Bonding | 467 | 1 | 2026-05-22 | DentAI – کیور کردن یا نکردن باندینگ قبل از کامپوزیت / دنت‌کست |
| 86 | `dentai/dentai-9.html` | DentAI | Adhesive Dentistry / Bonding | 453 | 1 | 2026-05-22 | DentAI – تکنیک Snow Plow در ترمیم‌های کامپوزیتی / دنت‌کست |
| 87 | `dentai/index.html` | DentAI index | Digital Dentistry / CAD-CAM | 555 | 1 | 2026-05-22 | 🤖 DentAI – خواندن مقالات با هوش مصنوعی / دنت‌کست |
| 88 | `episodes.html` | Episodes hub (top-level) | Implantology | 260 | 0 | 2026-05-22 | همهٔ اپیزودهای دنت‌کست / DentCast Episodes |
| 89 | `episodes/index.html` | Episodes index | Site infrastructure / Index | 6 | 205 | 2026-05-19 | اپیزودهای دنت‌کست |
| 90 | `glossary/activator.html` | Glossary entry | Adhesive Dentistry / Bonding | 270 | 1 | 2026-05-22 | Activator چیست؟ / دانشنامه دنت‌کست |
| 91 | `glossary/adhesive-resin-cements.html` | Glossary entry | Adhesive Dentistry / Bonding | 274 | 4 | 2026-05-22 | Adhesive Resin Cement چیست؟ / دانشنامه دنت‌کست |
| 92 | `glossary/biological-width.html` | Glossary entry | Periodontics | 348 | 6 | 2026-05-22 | Biological Width چیست؟ / دانشنامه دنت‌کست |
| 93 | `glossary/bond-strength.html` | Glossary entry | Adhesive Dentistry / Bonding | 323 | 10 | 2026-05-22 | Bond Strength چیست؟ / دانشنامه دنت‌کست |
| 94 | `glossary/bonding-generations.html` | Glossary entry | Adhesive Dentistry / Bonding | 278 | 0 | 2026-05-22 | Bonding Generations چیست؟ / دانشنامه دنت‌کست |
| 95 | `glossary/bonding-protocol.html` | Glossary entry | Adhesive Dentistry / Bonding | 352 | 4 | 2026-05-22 | Bonding Protocol چیست؟ / دانشنامه دنت‌کست |
| 96 | `glossary/bonding-strategy.html` | Glossary entry | Adhesive Dentistry / Bonding | 300 | 13 | 2026-05-22 | Bonding Strategy چیست؟ / دانشنامه دنت‌کست |
| 97 | `glossary/collagen-collapse.html` | Glossary entry | Adhesive Dentistry / Bonding | 277 | 3 | 2026-05-22 | Collagen Collapse چیست؟ / دانشنامه دنت‌کست |
| 98 | `glossary/collagen-fibers.html` | Glossary entry | Adhesive Dentistry / Bonding | 272 | 1 | 2026-05-22 | Collagen Fibers چیست؟ / دانشنامه دنت‌کست |
| 99 | `glossary/crown-lengthening.html` | Glossary entry | Fixed Prosthodontics | 331 | 8 | 2026-05-22 | Crown Lengthening چیست؟ / دانشنامه دنت‌کست |
| 100 | `glossary/crown-to-implant-ratio.html` | Glossary entry | Implantology | 348 | 1 | 2026-05-22 | Crown-to-Implant Ratio چیست؟ / دانشنامه دنت‌کست |
| 101 | `glossary/crystalline-phase.html` | Glossary entry | Dental Ceramics & Materials | 296 | 2 | 2026-05-22 | Crystalline Phase چیست؟ / دانشنامه دنت‌کست |
| 102 | `glossary/cuspal-coverage.html` | Glossary entry | Fixed Prosthodontics | 314 | 2 | 2026-05-22 | Cuspal Coverage چیست؟ / دانشنامه دنت‌کست |
| 103 | `glossary/deep-margin-elevation.html` | Glossary entry | Adhesive Dentistry / Bonding | 331 | 4 | 2026-05-22 | Deep Margin Elevation (DME) چیست؟ / دانشنامه دنت‌کست |
| 104 | `glossary/dental-cement.html` | Glossary entry | Resin Cements / Luting | 245 | 6 | 2026-05-22 | Dental Cement چیست؟ / دانشنامه دنت‌کست |
| 105 | `glossary/dental-ceramics.html` | Glossary entry | Dental Ceramics & Materials | 383 | 1 | 2026-05-22 | Dental Ceramics چیست؟ / دانشنامه دنت‌کست |
| 106 | `glossary/dentin-sealing.html` | Glossary entry | Adhesive Dentistry / Bonding | 334 | 4 | 2026-05-22 | Dentin Sealing چیست؟ / دانشنامه دنت‌کست |
| 107 | `glossary/dentinal-tubules.html` | Glossary entry | Adhesive Dentistry / Bonding | 274 | 4 | 2026-05-22 | Dentinal Tubules چیست؟ / دانشنامه دنت‌کست |
| 108 | `glossary/dual-cure-resin-cement.html` | Glossary entry | Resin Cements / Luting | 380 | 3 | 2026-05-22 | Dual-Cure Resin Cement چیست؟ / دانشنامه دنت‌کست |
| 109 | `glossary/emergence-profile.html` | Glossary entry | Implant Prosthodontics | 294 | 6 | 2026-05-22 | Emergence Profile چیست؟ / دانشنامه دنت‌کست |
| 110 | `glossary/esthetic-resin-cements.html` | Glossary entry | Resin Cements / Luting | 270 | 2 | 2026-05-22 | Esthetic Resin Cement چیست؟ / دانشنامه دنت‌کست |
| 111 | `glossary/etch-and-rinse.html` | Glossary entry | Adhesive Dentistry / Bonding | 295 | 4 | 2026-05-22 | Etch and Rinse چیست؟ / دانشنامه دنت‌کست |
| 112 | `glossary/feldspathic-porcelain.html` | Glossary entry | Dental Ceramics & Materials | 260 | 10 | 2026-05-22 | Feldspathic Porcelain چیست؟ / دانشنامه دنت‌کست |
| 113 | `glossary/ferrule-effect.html` | Glossary entry | Fixed Prosthodontics | 344 | 8 | 2026-05-22 | Ferrule Effect چیست؟ / دانشنامه دنت‌کست |
| 114 | `glossary/fiber-post.html` | Glossary entry | Fixed Prosthodontics | 385 | 4 | 2026-05-22 | Fiber Post چیست؟ / دانشنامه دنت‌کست |
| 115 | `glossary/flexural-strength.html` | Glossary entry | Curated External Content | 292 | 5 | 2026-05-22 | Flexural Strength چیست؟ / دانشنامه دنت‌کست |
| 116 | `glossary/flowable-resin.html` | Glossary entry | Adhesive Dentistry / Bonding | 305 | 5 | 2026-05-22 | Flowable Resin چیست؟ / دانشنامه دنت‌کست |
| 117 | `glossary/freshly-cut-dentin.html` | Glossary entry | Operative / Restorative Dentistry | 369 | 2 | 2026-05-22 | Freshly Cut Dentin چیست؟ / دانشنامه دنت‌کست |
| 118 | `glossary/glass-ceramics.html` | Glossary entry | Dental Ceramics & Materials | 292 | 3 | 2026-05-22 | Glass Ceramics چیست؟ / دانشنامه دنت‌کست |
| 119 | `glossary/glass-phase.html` | Glossary entry | Adhesive Dentistry / Bonding | 277 | 6 | 2026-05-22 | Glass Phase چیست؟ / دانشنامه دنت‌کست |
| 120 | `glossary/hema.html` | Glossary entry | Adhesive Dentistry / Bonding | 360 | 2 | 2026-05-22 | HEMA چیست؟ / دانشنامه دنت‌کست |
| 121 | `glossary/hybrid-ceramics.html` | Glossary entry | Dental Ceramics & Materials | 295 | 1 | 2026-05-22 | Hybrid Ceramics چیست؟ / دانشنامه دنت‌کست |
| 122 | `glossary/hybrid-layer.html` | Glossary entry | Adhesive Dentistry / Bonding | 290 | 4 | 2026-05-22 | Hybrid Layer چیست؟ / دانشنامه دنت‌کست |
| 123 | `glossary/immediate-dentin-sealing.html` | Glossary entry | Adhesive Dentistry / Bonding | 330 | 4 | 2026-05-22 | Immediate Dentin Sealing (IDS) چیست؟ / دانشنامه دنت‌کست |
| 124 | `glossary/isolation.html` | Glossary entry | Operative / Restorative Dentistry | 309 | 11 | 2026-05-22 | Isolation چیست؟ / دانشنامه دنت‌کست |
| 125 | `glossary/light-cure-resin-cement.html` | Glossary entry | Resin Cements / Luting | 372 | 1 | 2026-05-22 | Light-Cure Resin Cement چیست؟ / دانشنامه دنت‌کست |
| 126 | `glossary/lithium-disilicate.html` | Glossary entry | Dental Ceramics & Materials | 277 | 7 | 2026-05-22 | Lithium Disilicate چیست؟ / دانشنامه دنت‌کست |
| 127 | `glossary/matrix-in-matrix.html` | Glossary entry | Operative / Restorative Dentistry | 324 | 1 | 2026-05-22 | Matrix-in-Matrix Technique چیست؟ / دانشنامه دنت‌کست |
| 128 | `glossary/mdp.html` | Glossary entry | Adhesive Dentistry / Bonding | 304 | 4 | 2026-05-22 | MDP چیست؟ / دانشنامه دنت‌کست |
| 129 | `glossary/microleakage.html` | Glossary entry | Operative / Restorative Dentistry | 271 | 2 | 2026-05-22 | Microleakage چیست؟ / دانشنامه دنت‌کست |
| 130 | `glossary/milling.html` | Glossary entry | Digital Dentistry / CAD-CAM | 284 | 5 | 2026-05-22 | Milling چیست؟ / دانشنامه دنت‌کست |
| 131 | `glossary/oxygen-inhibition-layer.html` | Glossary entry | Adhesive Dentistry / Bonding | 290 | 2 | 2026-05-22 | Oxygen Inhibition Layer چیست؟ / دانشنامه دنت‌کست |
| 132 | `glossary/peri-implantitis.html` | Glossary entry | Implantology | 316 | 4 | 2026-05-22 | Peri-implantitis چیست؟ / دانشنامه دنت‌کست |
| 133 | `glossary/ph-of-adhesive-systems.html` | Glossary entry | Adhesive Dentistry / Bonding | 276 | 1 | 2026-05-22 | pH of Adhesive Systems چیست؟ / دانشنامه دنت‌کست |
| 134 | `glossary/phosphoric-acid-contamination.html` | Glossary entry | Adhesive Dentistry / Bonding | 275 | 2 | 2026-05-22 | Phosphoric Acid Contamination چیست؟ / دانشنامه دنت‌کست |
| 135 | `glossary/phosphoric-acid.html` | Glossary entry | Adhesive Dentistry / Bonding | 302 | 4 | 2026-05-22 | Phosphoric Acid چیست؟ / دانشنامه دنت‌کست |
| 136 | `glossary/platform-switch.html` | Glossary entry | Implant Prosthodontics | 325 | 0 | 2026-05-22 | Platform Switch چیست؟ / دانشنامه دنت‌کست |
| 137 | `glossary/polycrystalline-ceramics.html` | Glossary entry | Dental Ceramics & Materials | 282 | 3 | 2026-05-22 | Polycrystalline Ceramics چیست؟ / دانشنامه دنت‌کست |
| 138 | `glossary/resin-cements.html` | Glossary entry | Resin Cements / Luting | 287 | 13 | 2026-05-22 | Resin Cement چیست؟ / دانشنامه دنت‌کست |
| 139 | `glossary/resistance.html` | Glossary entry | Adhesive Dentistry / Bonding | 289 | 15 | 2026-05-22 | Resistance (مقاومت) چیست؟ / دانشنامه دنت‌کست |
| 140 | `glossary/retention.html` | Glossary entry | Resin Cements / Luting | 309 | 6 | 2026-05-22 | Retention (گیر) چیست؟ / دانشنامه دنت‌کست |
| 141 | `glossary/rubber-dam.html` | Glossary entry | Operative / Restorative Dentistry | 340 | 5 | 2026-05-22 | Rubber Dam چیست؟ / دانشنامه دنت‌کست |
| 142 | `glossary/sandblasting.html` | Glossary entry | Adhesive Dentistry / Bonding | 254 | 6 | 2026-05-22 | Sandblasting چیست؟ / دانشنامه دنت‌کست |
| 143 | `glossary/scan-body.html` | Glossary entry | Implant Prosthodontics | 341 | 7 | 2026-05-22 | Scan Body چیست؟ / دانشنامه دنت‌کست |
| 144 | `glossary/selective-etch.html` | Glossary entry | Adhesive Dentistry / Bonding | 290 | 2 | 2026-05-22 | Selective Etch چیست؟ / دانشنامه دنت‌کست |
| 145 | `glossary/self-adhesive-cements.html` | Glossary entry | Adhesive Dentistry / Bonding | 285 | 3 | 2026-05-22 | Self Adhesive Cement چیست؟ / دانشنامه دنت‌کست |
| 146 | `glossary/self-cure-resin-cement.html` | Glossary entry | Resin Cements / Luting | 388 | 1 | 2026-05-22 | Self-Cure Resin Cement چیست؟ / دانشنامه دنت‌کست |
| 147 | `glossary/self-etch.html` | Glossary entry | Adhesive Dentistry / Bonding | 270 | 7 | 2026-05-22 | Self-Etch چیست؟ / دانشنامه دنت‌کست |
| 148 | `glossary/silane.html` | Glossary entry | Adhesive Dentistry / Bonding | 279 | 15 | 2026-05-22 | Silane چیست؟ / دانشنامه دنت‌کست |
| 149 | `glossary/silica-based-ceramics.html` | Glossary entry | Dental Ceramics & Materials | 252 | 2 | 2026-05-22 | Silica-Based Ceramics چیست؟ / دانشنامه دنت‌کست |
| 150 | `glossary/sintering.html` | Glossary entry | Dental Ceramics & Materials | 284 | 3 | 2026-05-22 | Sintering چیست؟ / دانشنامه دنت‌کست |
| 151 | `glossary/smear-layer.html` | Glossary entry | Adhesive Dentistry / Bonding | 282 | 3 | 2026-05-22 | Smear Layer چیست؟ / دانشنامه دنت‌کست |
| 152 | `glossary/subgingival-margin.html` | Glossary entry | Periodontics | 313 | 5 | 2026-05-22 | Subgingival Margin چیست؟ / دانشنامه دنت‌کست |
| 153 | `glossary/temporary-cement-contamination.html` | Glossary entry | Resin Cements / Luting | 324 | 0 | 2026-05-22 | Temporary Cement Contamination چیست؟ / دانشنامه دنت‌کست |
| 154 | `glossary/tertiary-amines.html` | Glossary entry | Adhesive Dentistry / Bonding | 264 | 4 | 2026-05-22 | Tertiary Amines چیست؟ / دانشنامه دنت‌کست |
| 155 | `glossary/three-step-adhesive-system.html` | Glossary entry | Adhesive Dentistry / Bonding | 295 | 1 | 2026-05-22 | Three-Step Adhesive System چیست؟ / دانشنامه دنت‌کست |
| 156 | `glossary/ti-base.html` | Glossary entry | Implant Prosthodontics | 346 | 4 | 2026-05-22 | Ti-Base چیست؟ / دانشنامه دنت‌کست |
| 157 | `glossary/traditional-cements.html` | Glossary entry | Resin Cements / Luting | 278 | 4 | 2026-05-22 | Traditional Cement چیست؟ / دانشنامه دنت‌کست |
| 158 | `glossary/translucency.html` | Glossary entry | Dental Ceramics & Materials | 289 | 8 | 2026-05-22 | Translucency چیست؟ / دانشنامه دنت‌کست |
| 159 | `glossary/two-bottle-adhesive-systems.html` | Glossary entry | Adhesive Dentistry / Bonding | 271 | 1 | 2026-05-22 | Two-Bottle Adhesive Systems چیست؟ / دانشنامه دنت‌کست |
| 160 | `glossary/two-step-adhesive-system.html` | Glossary entry | Adhesive Dentistry / Bonding | 328 | 1 | 2026-05-22 | Two-Step Adhesive System چیست؟ / دانشنامه دنت‌کست |
| 161 | `glossary/undercut.html` | Glossary entry | Curated External Content | 326 | 3 | 2026-05-22 | Undercut چیست؟ / دانشنامه دنت‌کست |
| 162 | `glossary/unfilled-resin.html` | Glossary entry | Adhesive Dentistry / Bonding | 300 | 2 | 2026-05-22 | Unfilled Resin چیست؟ / دانشنامه دنت‌کست |
| 163 | `glossary/universal-adhesive.html` | Glossary entry | Adhesive Dentistry / Bonding | 412 | 0 | 2026-05-22 | Universal Adhesive چیست؟ / دانشنامه دنت‌کست |
| 164 | `glossary/vertical-dimension-of-occlusion.html` | Glossary entry | Occlusion / TMD | 363 | 7 | 2026-05-22 | Vertical Dimension of Occlusion (VDO) چیست؟ / دانشنامه دنت‌کست |
| 165 | `glossary/zero-bone-loss.html` | Glossary entry | Implantology | 356 | 1 | 2026-05-22 | Zero Bone Loss (ZBL) چیست؟ / دانشنامه دنت‌کست |
| 166 | `glossary/zirconia-primer.html` | Glossary entry | Dental Ceramics & Materials | 285 | 2 | 2026-05-22 | Zirconia Primer چیست؟ / دانشنامه دنت‌کست |
| 167 | `glossary/zirconia.html` | Glossary entry | Dental Ceramics & Materials | 263 | 23 | 2026-05-22 | Zirconia چیست؟ / دانشنامه دنت‌کست |
| 168 | `glossary/zls.html` | Glossary entry | Dental Ceramics & Materials | 312 | 1 | 2026-05-22 | ZLS چیست؟ / دانشنامه دنت‌کست |
| 169 | `glossary/index.html` | Glossary index | Site infrastructure / Index | 62 | 80 | 2026-05-22 | دانشنامه / DentCast |
| 170 | `google53b100d9b9181a71.html` | Google verification | Site infrastructure / Index | 2 | 0 | 2026-05-19 |  |
| 171 | `join.html` | Join/Subscribe page | Site infrastructure / Index | 92 | 0 | 2026-05-21 | عضویت در خبرنامه دنت‌کست / دکتر فؤاد شهابیان |
| 172 | `litecast/lite-CAST1.html` | LiteCast | Patient Education / General | 204 | 1 | 2026-05-22 | Lite-CAST / قانون ۲-۲-۲ در دندان‌پزشکی |
| 173 | `litecast/lite-CAST10.html` | LiteCast | Implant Prosthodontics | 412 | 1 | 2026-05-22 | Lite-CAST / چرا روکش بعضی از ایمپلنت‌ها شل می‌شود؟ |
| 174 | `litecast/lite-CAST11.html` | LiteCast | Treatment Planning / Decision-making | 359 | 1 | 2026-05-22 | Lite-CAST / بهترین دکتر، بهترین متخصص پروتز یا بهترین کلینیک؟ |
| 175 | `litecast/lite-CAST12.html` | LiteCast | Implantology | 298 | 1 | 2026-05-22 | Lite-CAST / ایمپلنت چیست؟ |
| 176 | `litecast/lite-CAST13.html` | LiteCast | Implantology | 380 | 1 | 2026-05-22 | Lite-CAST / مراحل ایمپلنت |
| 177 | `litecast/lite-CAST14.html` | LiteCast | Implantology | 378 | 1 | 2026-05-22 | Lite-CAST / ایمپلنت دیجیتال چیست؟ |
| 178 | `litecast/lite-CAST15.html` | LiteCast | Implantology | 355 | 1 | 2026-05-22 | ایمپلنت فوری چیست؟ / Lite-CAST |
| 179 | `litecast/lite-CAST16.html` | LiteCast | Implant Prosthodontics | 349 | 1 | 2026-05-22 | روکش ایمپلنت چیست؟ / Lite-CAST |
| 180 | `litecast/lite-CAST17.html` | LiteCast | Implantology | 327 | 1 | 2026-05-22 | پیچ ایمپلنت چیست؟ / Lite-CAST |
| 181 | `litecast/lite-CAST18.html` | LiteCast | Implant Prosthodontics | 291 | 1 | 2026-05-22 | اباتمنت چیست؟ / Lite-CAST |
| 182 | `litecast/lite-CAST19.html` | LiteCast | Implantology | 321 | 1 | 2026-05-22 | فالوآپ ایمپلنت چیست؟ / Lite-CAST |
| 183 | `litecast/lite-CAST2.html` | LiteCast | Removable Prosthodontics | 279 | 1 | 2026-05-22 | Lite-CAST / چرا دنچر(دندان مصنوعی) پایین لق می‌شود؟ |
| 184 | `litecast/lite-CAST20.html` | LiteCast | Oral Radiology / Imaging | 315 | 1 | 2026-05-22 | چرا عکس پانورامیک برای تشخیص پوسیدگی مناسب نیست؟ / Lite-CAST |
| 185 | `litecast/lite-CAST21.html` | LiteCast | Endodontics | 313 | 1 | 2026-05-22 | آیا عصب‌کشی دندان درد دارد؟ / Lite-CAST |
| 186 | `litecast/lite-CAST22.html` | LiteCast | Endodontics | 342 | 1 | 2026-05-22 | آیا دندان عصب‌کشی شده ضعیف می‌شود؟ / Lite-CAST |
| 187 | `litecast/lite-CAST23.html` | LiteCast | Fixed Prosthodontics | 307 | 1 | 2026-05-22 | چه زمانی دندان عصب‌کشی شده نیاز به روکش دارد؟ / Lite-CAST |
| 188 | `litecast/lite-CAST24.html` | LiteCast | Fixed Prosthodontics | 307 | 1 | 2026-05-22 | اگر روی دندان عصب‌کشی شده روکش نگذاریم چه می‌شود؟ / Lite-CAST |
| 189 | `litecast/lite-CAST25.html` | LiteCast | Operative / Restorative Dentistry | 358 | 1 | 2026-05-22 | اگر دندان عصب‌کشی شده بشکند چه می‌شود؟ / Lite-CAST |
| 190 | `litecast/lite-CAST3.html` | LiteCast | Implantology | 239 | 1 | 2026-05-22 | Lite-CAST / اگر دندان از دست رفته را جایگزین نکنیم چه می‌شود؟ |
| 191 | `litecast/lite-CAST4.html` | LiteCast | Removable Prosthodontics | 234 | 1 | 2026-05-22 | Lite-CAST / آیا ایمپلنت برای کسانی که دندان مصنوعی کامل دارند، مزیتی دارد؟ |
| 192 | `litecast/lite-CAST5.html` | LiteCast | Implantology | 239 | 1 | 2026-05-22 | Lite-CAST / دندان مصنوعی متحرک یا ایمپلنت ثابت؟ کدام بهتر است؟ |
| 193 | `litecast/lite-CAST6.html` | LiteCast | Oral Medicine / Pharmacology | 531 | 1 | 2026-05-22 | Lite-CAST / تبخال و دندانپزشکی: آیا با تبخال می‌توان دندان پر کرد؟ |
| 194 | `litecast/lite-CAST7.html` | LiteCast | Esthetic Dentistry / Smile Design | 425 | 1 | 2026-05-22 | Lite-CAST / تفاوت لمینت سرامیکی و کامپوزیت دندان چیست؟ |
| 195 | `litecast/lite-CAST8.html` | LiteCast | Implantology | 532 | 1 | 2026-05-22 | Lite-CAST / مراحل ایمپلنت دندان چقدر طول می‌کشد؟ |
| 196 | `litecast/lite-CAST9.html` | LiteCast | Implantology | 235 | 1 | 2026-05-22 | Lite-CAST / ایمپلنت دیجیتال یعنی چی؟ |
| 197 | `litecast/index.html` | LiteCast index | Patient Education / General | 317 | 2 | 2026-05-21 | LiteCast – دنت‌کست عمومی / آموزش ساده و علمی سلامت دهان |
| 198 | `metanotes/meta-1.html` | MetaNote | Periodontics | 264 | 2 | 2026-05-22 | MetaNote 01 — پیش‌آگهی درمان پریو و زیبایی / دنت‌کست |
| 199 | `metanotes/meta-10.html` | MetaNote | Fixed Prosthodontics | 323 | 2 | 2026-05-22 | MetaNote 10 — Smart Vent Crown (SVC) و Shahabian Concept / دنت‌کست |
| 200 | `metanotes/meta-11.html` | MetaNote | Endodontics | 235 | 1 | 2026-05-22 | MetaNote 11 — فاصله ی بین گوتاو پست و کور / دنت‌کست |
| 201 | `metanotes/meta-12.html` | MetaNote | Fixed Prosthodontics | 507 | 1 | 2026-05-22 | MetaNote 12 — یه نکته ی مهم در مدیریت کانتکت بین ۶ و ۷ / دنت‌کست |
| 202 | `metanotes/meta-2.html` | MetaNote | Periodontics | 217 | 2 | 2026-05-22 | MetaNote 02 — نقش رفتار بیمار در درمان پریو و ایمپلنت / دنت‌کست |
| 203 | `metanotes/meta-3.html` | MetaNote | Periodontics | 219 | 2 | 2026-05-22 | MetaNote 03 — بازی Success و Survival در دندان پریویی و ایمپلنت / دنت‌کست |
| 204 | `metanotes/meta-4.html` | MetaNote | Implantology | 321 | 2 | 2026-05-22 | MetaNote 04 — آیا ایمپلنت را باید مثل دندان قضاوت کرد؟ / دنت‌کست |
| 205 | `metanotes/meta-5.html` | MetaNote | Implantology | 264 | 2 | 2026-05-22 | MetaNote 05 — Self-defensive design و راه درست مقایسه ایمپلنت / دنت‌کست |
| 206 | `metanotes/meta-6.html` | MetaNote | Implantology | 478 | 1 | 2026-05-22 | MetaNote 06 — Meta Decision Method؛ چطور تصمیم بگیریم؟ / دنت‌کست |
| 207 | `metanotes/meta-7.html` | MetaNote | Fixed Prosthodontics | 474 | 1 | 2026-05-22 | MetaNote 07 — فایبر پست؛ مسئله‌ای که بیش از حد جدی گرفته شد / دنت‌کست |
| 208 | `metanotes/meta-8.html` | MetaNote | Implantology | 269 | 1 | 2026-05-22 | MetaNote 08 — یک روش حداقلی برای خارج کردن پیچ شکسته ایمپلنت / دنت‌کست |
| 209 | `metanotes/meta-9.html` | MetaNote | Fixed Prosthodontics | 317 | 1 | 2026-05-22 | MetaNote 09 — چرا تحویل همزمان پست‌و‌کور و روکش، تصمیم دقیقی نیست / دنت‌کست |
| 210 | `metanotes/en/meta-1.html` | MetaNote (EN) | Periodontics | 234 | 0 | 2026-05-22 | MetaNote 01 — Periodontal Prognosis and Esthetic Decision-Making / DentCast |
| 211 | `metanotes/en/meta-2.html` | MetaNote (EN) | Periodontics | 238 | 2 | 2026-05-22 | MetaNote 02 — Patient Behavior in Periodontal and Implant Therapy / DentCast |
| 212 | `metanotes/en/meta-3.html` | MetaNote (EN) | Periodontics | 241 | 1 | 2026-05-22 | MetaNote 03 — Success vs. Survival in Periodontally Compromised Teeth and Implan |
| 213 | `metanotes/en/meta-4.html` | MetaNote (EN) | Implantology | 343 | 1 | 2026-05-22 | MetaNote 04 — Should Implants Be Judged Like Natural Teeth? / DentCast |
| 214 | `metanotes/en/meta-5.html` | MetaNote (EN) | Implantology | 249 | 1 | 2026-05-22 | MetaNote 05 — Self-Defensive Design and the Proper Way to Compare Implants / Den |
| 215 | `metanotes/en/about.html` | MetaNote (EN) about | Fixed Prosthodontics | 302 | 5 | 2026-05-22 | About — Dr. Foad Shahabian & DentCast |
| 216 | `metanotes/index.html` | MetaNote index | Meta / Frameworks | 222 | 1 | 2026-05-21 | MetaNotes / یادداشت‌های متا و مدل‌های ذهنی دنت‌کست |
| 217 | `notecast/episode-10.html` | NoteCast | Adhesive Dentistry / Bonding | 700 | 2 | 2026-05-22 | نوت‌کست دهم – سایلان‌ها و کاربرد در آماده‌سازی سطح سرامیک / دنت‌کست |
| 218 | `notecast/episode-11.html` | NoteCast | Adhesive Dentistry / Bonding | 466 | 2 | 2026-05-22 | نوت‌کست یازدهم – آماده‌سازی سطح زیرکونیا قبل از سمان کردن / دنت‌کست |
| 219 | `notecast/episode-12.html` | NoteCast | Adhesive Dentistry / Bonding | 548 | 2 | 2026-05-22 | پروتکل پاکسازی رستوریشن‌های گلاس سرامیکی: مدیریت آلودگی / دنت‌کست |
| 220 | `notecast/episode-13.html` | NoteCast | Dental Ceramics & Materials | 411 | 2 | 2026-05-22 | مدیریت تیرگی لثه با روکش زیرکونیا: راه حل اثر چتر (Umbrella Effect) / دنت‌کست |
| 221 | `notecast/episode-14.html` | NoteCast | Occlusion / TMD | 653 | 2 | 2026-05-22 | افزایش بعد عمودی (Vertical Dimension): دیدگاه‌های داوسون، شواهد جدید و پروتکل در |
| 222 | `notecast/episode-15.html` | NoteCast | Dental Ceramics & Materials | 400 | 2 | 2026-05-22 | آنلِی‌های سرامیکی: مرور نظام‌مند طول عمر و عوامل موفقیت / دنت‌کست |
| 223 | `notecast/episode-16.html` | NoteCast | Adhesive Dentistry / Bonding | 418 | 2 | 2026-05-22 | آیا باندینگ روی پرسلن فلدسپاتیک اچ و سایلن‌زده ضروری است؟ / دنت‌کست |
| 224 | `notecast/episode-17.html` | NoteCast | Dental Ceramics & Materials | 367 | 2 | 2026-05-22 | فازهای زیرکونیا و تکامل آن قسمت اول/ دنت‌کست |
| 225 | `notecast/episode-18.html` | NoteCast | Dental Ceramics & Materials | 349 | 2 | 2026-05-22 | فازهای زیرکونیا و تکامل آن دوم / دنت‌کست |
| 226 | `notecast/episode-19.html` | NoteCast | Dental Ceramics & Materials | 297 | 2 | 2026-05-22 | پایداری رنگ ونیرهای سرامیکی؛ نکات کلیدی JPD 2018 / دنت‌کست |
| 227 | `notecast/episode-2.html` | NoteCast | Resin Cements / Luting | 337 | 2 | 2026-05-22 | نوت‌کست ۲ – راهنمای جامع انتخاب سمان مناسب برای رستوریشن‌های دندانی / دنت‌کست |
| 228 | `notecast/episode-20.html` | NoteCast | Fixed Prosthodontics | 407 | 2 | 2026-05-22 | نکات طلایی قالب‌گیری در پروتز ثابت؛ نوت‌کست ۲۰ / دنت‌کست |
| 229 | `notecast/episode-21.html` | NoteCast | Adhesive Dentistry / Bonding | 439 | 2 | 2026-05-22 | نوت‌کست ۲۱ – ادامه‌ی قالب‌گیری دو مرحله‌ای / دنت‌کست |
| 230 | `notecast/episode-22.html` | NoteCast | Oral Medicine / Pharmacology | 594 | 2 | 2026-05-22 | نوت‌کست ۲۲ – سه تداخل دارویی حیاتی در دندان‌پزشکی / دنت‌کست |
| 231 | `notecast/episode-23.html` | NoteCast | Implantology | 385 | 2 | 2026-05-22 | نوت‌کست ۲۳ – اورلود اکلوزالی و تحلیل استخوان ایمپلنت / دنت‌کست |
| 232 | `notecast/episode-24.html` | NoteCast | Implantology | 425 | 2 | 2026-05-22 | نوت‌کست ۲۴ – نسبت تاج به ایمپلنت (C/I Ratio) و تحلیل استخوان / دنت‌کست |
| 233 | `notecast/episode-25.html` | NoteCast | Implantology | 333 | 2 | 2026-05-22 | نوت‌کست ۲۵ – ایمپلنت کوتاه یا سینوس لیفت؟ / دنت‌کست |
| 234 | `notecast/episode-26.html` | NoteCast | Implantology | 321 | 2 | 2026-05-22 | نوت‌کست ۲۶ – زمان لود ایمپلنت و Marginal Bone Loss / دنت‌کست |
| 235 | `notecast/episode-27.html` | NoteCast | Removable Prosthodontics | 417 | 2 | 2026-05-22 | نوت‌کست ۲۷ – بار–کلیپ یا بال–اورینگ؟ کدوم بهتره؟ / دنت‌کست |
| 236 | `notecast/episode-28.html` | NoteCast | Esthetic Dentistry / Smile Design | 407 | 2 | 2026-05-22 | نوت‌کست ۲۸ – اصول آنالیز و طراحی لبخند؛ قوانین McLaren / دنت‌کست |
| 237 | `notecast/episode-29.html` | NoteCast | Dental Ceramics & Materials | 313 | 2 | 2026-05-22 | نوت کست بیست و نهم: طبقه بندی سرامیکها قسمت یک |
| 238 | `notecast/episode-3.html` | NoteCast | Resin Cements / Luting | 431 | 2 | 2026-05-22 | نوت‌کست ۳ – سمان‌های رزینی: انواع، ویژگی‌ها، مزایا و معایب / دنت‌کست |
| 239 | `notecast/episode-30.html` | NoteCast | Dental Ceramics & Materials | 610 | 2 | 2026-05-22 | نوت‌کست ۳۰ – سرامیک‌های پلی‌کریستالاین و هیبرید (رزین‌ماتریکس) / دنت‌کست |
| 240 | `notecast/episode-31.html` | NoteCast | Implant Prosthodontics | 435 | 2 | 2026-05-22 | نوت‌کست ۳۱ – رستوریشن‌های ایمپلنت‌ساپورت و روش‌های اتصال روکش / دنت‌کست |
| 241 | `notecast/episode-32.html` | NoteCast | Esthetic Dentistry / Smile Design | 397 | 2 | 2026-05-22 | نوت‌کست ۳۲ – اسنپ آن اسمایل قسمت اول / دنت‌کست |
| 242 | `notecast/episode-33.html` | NoteCast | Occlusion / TMD | 325 | 2 | 2026-05-22 | نوت‌کست ۳۳ – کاربردهای پیشرفته Snap-On Smile / دنت‌کست |
| 243 | `notecast/episode-4.html` | NoteCast | Adhesive Dentistry / Bonding | 452 | 2 | 2026-05-22 | نوت‌کست ۴ – باندینگ و نسل‌های ادهزیو / دنت‌کست |
| 244 | `notecast/episode-5.html` | NoteCast | Adhesive Dentistry / Bonding | 445 | 2 | 2026-05-22 | نوت‌کست ۵ – باندینگ‌های یونیورسال: نکات کلیدی و کاربردی / دنت‌کست |
| 245 | `notecast/episode-6.html` | NoteCast | Adhesive Dentistry / Bonding | 526 | 2 | 2026-05-22 | نوت‌کست ۶ – سیل کردن فوری دنتین (IDS) / دنت‌کست |
| 246 | `notecast/episode-7.html` | NoteCast | Adhesive Dentistry / Bonding | 745 | 2 | 2026-05-22 | نوت‌کست ۷ – تکنیک DME (Deep Margin Elevation) / دنت‌کست |
| 247 | `notecast/episode-8.html` | NoteCast | Dental Ceramics & Materials | 345 | 2 | 2026-05-22 | نوت‌کست هشتم – سرامیک‌های دندانی / دنت‌کست |
| 248 | `notecast/episode-9.html` | NoteCast | Dental Ceramics & Materials | 421 | 2 | 2026-05-22 | نوت‌کست نهم – آماده‌سازی سطحی سرامیک (قسمت اول) / دنت‌کست |
| 249 | `notecast/index.html` | NoteCast index | Site infrastructure / Index | 454 | 1 | 2026-05-22 | 📝 NoteCast / خلاصه‌های نوشتاری تخصصی پادکست دنت‌کست |
| 250 | `photocast/episode-1.html` | PhotoCast | Fixed Prosthodontics | 229 | 1 | 2026-05-22 | فوتوکست ۱ – بیمار با درد شدید در ناحیه چپ فک پایین / دنت‌کست |
| 251 | `photocast/episode-2.html` | PhotoCast | Occlusion / TMD | 198 | 1 | 2026-05-22 | فوتوکست ۲ – قانون BULL در تنظیم اکلوزال / دنت‌کست |
| 252 | `photocast/episode-3.html` | PhotoCast | Pediatric Dentistry | 281 | 1 | 2026-05-22 | دندان ۶ پایین توی زیرِ ۱۸ سال: چه روکشی و کِی؟ / دنت‌کست |
| 253 | `photocast/index.html` | PhotoCast index | Clinical Photography | 101 | 1 | 2026-05-21 | فوتوکست‌ها / کیس‌های تصویری و بالینی پروتز / دنت‌کست |
| 254 | `episodes/episode-1.html` | Podcast episode | Operative / Restorative Dentistry | 115 | 1 | 2026-05-22 | آشنایی با روند کار دنتکست / اپیزود 1 / دنت‌کست |
| 255 | `episodes/episode-10.html` | Podcast episode | Dental Ceramics & Materials | 123 | 2 | 2026-05-22 | نقش سایلان در آماده‌سازی سرامیک‌ها / اپیزود 10 / دنت‌کست |
| 256 | `episodes/episode-101.html` | Podcast episode | Adhesive Dentistry / Bonding | 128 | 2 | 2026-05-22 | باندینگ به دنتین ریشه — پروتکل‌های موثر / اپیزود 101 / دنت‌کست |
| 257 | `episodes/episode-102.html` | Podcast episode | Implant Prosthodontics | 130 | 2 | 2026-05-22 | انتخاب اباتمنت ایمپلنت — اصول و معیارها (قسمت اول) / اپیزود 102 / دنت‌کست |
| 258 | `episodes/episode-103.html` | Podcast episode | Implant Prosthodontics | 136 | 2 | 2026-05-22 | انتخاب اباتمنت ایمپلنت — ادامه مباحث (قسمت دوم) / اپیزود 103 / دنت‌کست |
| 259 | `episodes/episode-104.html` | Podcast episode | Implant Prosthodontics | 131 | 2 | 2026-05-22 | Ti-Base Abutments — کاربردها و نکات (قسمت اول) / اپیزود 104 / دنت‌کست |
| 260 | `episodes/episode-105.html` | Podcast episode | Implant Prosthodontics | 129 | 2 | 2026-05-22 | Ti-Base Abutments — ادامه بررسی (قسمت دوم) / اپیزود 105 / دنت‌کست |
| 261 | `episodes/episode-106-1.html` | Podcast episode | Meta / Frameworks | 133 | 2 | 2026-05-22 | دنتوپدیا — پدیده Suck-Back در توربین‌ها / اپیزود 106.1 / دنت‌کست |
| 262 | `episodes/episode-106-2.html` | Podcast episode | Digital Dentistry / CAD-CAM | 145 | 2 | 2026-05-22 | دنتوپدیا — فرمت فایل‌های اسکنر (STL, OBJ, PLY) / اپیزود 106.2 / دنت‌کست |
| 263 | `episodes/episode-106.html` | Podcast episode | Implant Prosthodontics | 125 | 3 | 2026-05-22 | Ti-Base Abutments — جمع‌بندی (قسمت سوم) / اپیزود 106 / دنت‌کست |
| 264 | `episodes/episode-107-1.html` | Podcast episode | Meta / Frameworks | 135 | 2 | 2026-05-22 | دنتوپدیا — کدگذاری رنگی هندپیس‌ها / اپیزود 107.1 / دنت‌کست |
| 265 | `episodes/episode-107.html` | Podcast episode | Dental Ceramics & Materials | 127 | 2 | 2026-05-22 | زیرکونیاهای گرادینت مولتی‌لیر — تحولی در زیبایی / اپیزود 107 / دنت‌کست |
| 266 | `episodes/episode-108.html` | Podcast episode | Implantology | 121 | 2 | 2026-05-22 | مولتی‌یونیت اباتمنت‌ها (Multi-Unit Abutments) / اپیزود 108 / دنت‌کست |
| 267 | `episodes/episode-109-1.html` | Podcast episode | Meta / Frameworks | 129 | 2 | 2026-05-22 | دنتوپدیا — اصطلاحات لوپ‌های دندانپزشکی / اپیزود 109.1 / دنت‌کست |
| 268 | `episodes/episode-109-2.html` | Podcast episode | Digital Dentistry / CAD-CAM | 141 | 2 | 2026-05-22 | دنتوپدیا — مصاحبه: مسیر یادگیری هوش مصنوعی / اپیزود 109.2 / دنت‌کست |
| 269 | `episodes/episode-109.html` | Podcast episode | Digital Dentistry / CAD-CAM | 130 | 3 | 2026-05-22 | هوش مصنوعی در دندانپزشکی — مفاهیم پایه / اپیزود 109 / دنت‌کست |
| 270 | `episodes/episode-11.html` | Podcast episode | Dental Ceramics & Materials | 122 | 2 | 2026-05-22 | آماده‌سازی سطح زیرکونیا / اپیزود 11 / دنت‌کست |
| 271 | `episodes/episode-110-1.html` | Podcast episode | Oral Radiology / Imaging | 136 | 2 | 2026-05-22 | دنتوپدیا — رادیوگرافی‌های پرتابل (Portable X-ray) / اپیزود 110.1 / دنت‌کست |
| 272 | `episodes/episode-110.html` | Podcast episode | Implantology | 135 | 2 | 2026-05-22 | Zero Bone Loss — شروع بخش پروتزی (قسمت اول) / اپیزود 110 / دنت‌کست |
| 273 | `episodes/episode-111-1.html` | Podcast episode | Pediatric Dentistry | 133 | 2 | 2026-05-22 | دنتوپدیا — فیشور سیلانت (نکات کلینیکی) / اپیزود 111.1 / دنت‌کست |
| 274 | `episodes/episode-111.html` | Podcast episode | Implantology | 132 | 2 | 2026-05-22 | Zero Bone Loss — بخش پروتزی (قسمت دوم) / اپیزود 111 / دنت‌کست |
| 275 | `episodes/episode-112.html` | Podcast episode | Implantology | 129 | 3 | 2026-05-22 | Zero Bone Loss — بخش پروتزی (قسمت سوم) / اپیزود 112 / دنت‌کست |
| 276 | `episodes/episode-113.html` | Podcast episode | Operative / Restorative Dentistry | 131 | 2 | 2026-05-22 | اصول تراش دندان Goodacre — (قسمت اول) / اپیزود 113 / دنت‌کست |
| 277 | `episodes/episode-114.html` | Podcast episode | Operative / Restorative Dentistry | 127 | 2 | 2026-05-22 | اصول تراش دندان Goodacre — (قسمت دوم) / اپیزود 114 / دنت‌کست |
| 278 | `episodes/episode-115.html` | Podcast episode | Implant Prosthodontics | 134 | 2 | 2026-05-22 | Zero Bone Loss — انتخاب اباتمنت (قسمت چهارم) / اپیزود 115 / دنت‌کست |
| 279 | `episodes/episode-116.html` | Podcast episode | Esthetic Dentistry / Smile Design | 130 | 2 | 2026-05-22 | Global Diagnosis — شروع کتاب (قسمت اول) / اپیزود 116 / دنت‌کست |
| 280 | `episodes/episode-117.html` | Podcast episode | Treatment Planning / Decision-making | 133 | 2 | 2026-05-22 | Global Diagnosis — معاینه و فرم GAD (قسمت دوم) / اپیزود 117 / دنت‌کست |
| 281 | `episodes/episode-118-1.html` | Podcast episode | Removable Prosthodontics | 133 | 2 | 2026-05-22 | دنتوپدیا — دنچرهای بدون فلنج (Flangeless Denture) / اپیزود 118.1 / دنت‌کست |
| 282 | `episodes/episode-118.html` | Podcast episode | Esthetic Dentistry / Smile Design | 128 | 2 | 2026-05-22 | Global Diagnosis — آنالیز لبخند (قسمت سوم) / اپیزود 118 / دنت‌کست |
| 283 | `episodes/episode-119-1.html` | Podcast episode | Implantology | 141 | 2 | 2026-05-22 | دنتوپدیا — بریج یا ایمپلنت؟ (Bridge vs Implant) / اپیزود 119.1 / دنت‌کست |
| 284 | `episodes/episode-119.html` | Podcast episode | Esthetic Dentistry / Smile Design | 133 | 2 | 2026-05-22 | Global Diagnosis — پنج سوال تشخیص (قسمت چهارم) / اپیزود 119 / دنت‌کست |
| 285 | `episodes/episode-12.html` | Podcast episode | Dental Ceramics & Materials | 125 | 2 | 2026-05-22 | تمیز کردن سطح آلودهٔ رستوریشن‌های سرامیکی / اپیزود 12 / دنت‌کست |
| 286 | `episodes/episode-120-1.html` | Podcast episode | Esthetic Dentistry / Smile Design | 141 | 2 | 2026-05-22 | دنتوپدیا — ملاحظات لبه انسیزال (Incisal Edge) / اپیزود 120.1 / دنت‌کست |
| 287 | `episodes/episode-120.html` | Podcast episode | Esthetic Dentistry / Smile Design | 129 | 2 | 2026-05-22 | Global Diagnosis — جمع‌بندی ۵ سوال (قسمت پنجم) / اپیزود 120 / دنت‌کست |
| 288 | `episodes/episode-121-1.html` | Podcast episode | Meta / Frameworks | 136 | 2 | 2026-05-22 | دنتوپدیا — مدیریت کانتکت‌های بین دندانی / اپیزود 121.1 / دنت‌کست |
| 289 | `episodes/episode-121.html` | Podcast episode | Fixed Prosthodontics | 125 | 2 | 2026-05-22 | گایدلاین ترمیم‌های خلفی — (قسمت اول) / اپیزود 121 / دنت‌کست |
| 290 | `episodes/episode-122-1.html` | Podcast episode | Implantology | 140 | 2 | 2026-05-22 | اینسایت — اسکرو یا سمان و بیماری‌های پری‌ایمپلنت / اپیزود 122.1 / دنت‌کست |
| 291 | `episodes/episode-122-2.html` | Podcast episode | Digital Dentistry / CAD-CAM | 141 | 2 | 2026-05-22 | اینسایت — تاثیر سرعت اسکن بر دقت (Scanning Duration) / اپیزود 122.2 / دنت‌کست |
| 292 | `episodes/episode-122-3.html` | Podcast episode | Endodontics | 143 | 2 | 2026-05-22 | اینسایت — ونیر سرامیکی روی دندان‌های اندو شده / اپیزود 122.3 / دنت‌کست |
| 293 | `episodes/episode-122-4.html` | Podcast episode | Meta / Frameworks | 138 | 2 | 2026-05-22 | دنتوپدیا — تزریق بدون درد (Computer-Controlled Anesthesia) / اپیزود 122.4 / دنت‌ |
| 294 | `episodes/episode-122-5.html` | Podcast episode | Dental Ceramics & Materials | 139 | 2 | 2026-05-22 | اینسایت — کارایی فرزهای الماسه روی زیرکونیا / اپیزود 122.5 / دنت‌کست |
| 295 | `episodes/episode-122-6.html` | Podcast episode | Resin Cements / Luting | 139 | 2 | 2026-05-22 | اینسایت — سمیت سمان‌ها برای بافت نرم ایمپلنت / اپیزود 122.6 / دنت‌کست |
| 296 | `episodes/episode-122.html` | Podcast episode | Fixed Prosthodontics | 123 | 7 | 2026-05-22 | گایدلاین ترمیم‌های خلفی — (قسمت دوم) / اپیزود 122 / دنت‌کست |
| 297 | `episodes/episode-123-1.html` | Podcast episode | Fixed Prosthodontics | 138 | 2 | 2026-05-22 | اینسایت — تطابق لبه‌ای: دیجیتال یا معمولی؟ / اپیزود 123.1 / دنت‌کست |
| 298 | `episodes/episode-123-2.html` | Podcast episode | Meta / Frameworks | 133 | 2 | 2026-05-22 | دنتوپدیا — فرمیتوس (Fremitus) چیست؟ / اپیزود 123.2 / دنت‌کست |
| 299 | `episodes/episode-123-3.html` | Podcast episode | Adhesive Dentistry / Bonding | 135 | 2 | 2026-05-22 | اینسایت — آنله مستقیم یا غیرمستقیم؟ / اپیزود 123.3 / دنت‌کست |
| 300 | `episodes/episode-123-4.html` | Podcast episode | Dental Ceramics & Materials | 140 | 2 | 2026-05-22 | اینسایت — فول‌ماوس زیرکونیا: ونیر شده یا مونولیتیک؟ / اپیزود 123.4 / دنت‌کست |
| 301 | `episodes/episode-123-5.html` | Podcast episode | Implantology | 136 | 2 | 2026-05-22 | اینسایت — ایمپلنت‌های خواب (Sleeping Implants) / اپیزود 123.5 / دنت‌کست |
| 302 | `episodes/episode-123-6.html` | Podcast episode | Implant Prosthodontics | 143 | 2 | 2026-05-22 | اینسایت — شل شدن پیچ اباتمنت‌های کاستوم (Screw Loosening) / اپیزود 123.6 / دنت‌ک |
| 303 | `episodes/episode-123.html` | Podcast episode | Fixed Prosthodontics | 127 | 7 | 2026-05-22 | گایدلاین ترمیم‌های خلفی — (قسمت سوم) / اپیزود 123 / دنت‌کست |
| 304 | `episodes/episode-124-1.html` | Podcast episode | Adhesive Dentistry / Bonding | 138 | 2 | 2026-05-22 | اینسایت — دی‌باندینگ لیزری ونیرها (Laser Debonding) / اپیزود 124.1 / دنت‌کست |
| 305 | `episodes/episode-124.html` | Podcast episode | Treatment Planning / Decision-making | 126 | 2 | 2026-05-22 | گایدلاین ترمیم‌های خلفی — جمع‌بندی (قسمت چهارم) / اپیزود 124 / دنت‌کست |
| 306 | `episodes/episode-125-1.html` | Podcast episode | Dental Ceramics & Materials | 136 | 2 | 2026-05-22 | اینسایت — زیرکونیا یا PFM در ایمپلنت خلفی؟ / اپیزود 125.1 / دنت‌کست |
| 307 | `episodes/episode-125-2.html` | Podcast episode | Esthetic Dentistry / Smile Design | 144 | 2 | 2026-05-22 | اینسایت — روکش موقت فوری و بافت نرم (Esthetic Zone) / اپیزود 125.2 / دنت‌کست |
| 308 | `episodes/episode-125-3.html` | Podcast episode | Fixed Prosthodontics | 144 | 2 | 2026-05-22 | اینسایت — توزیع استرس: پست فایبر یا فلزی؟ / اپیزود 125.3 / دنت‌کست |
| 309 | `episodes/episode-125.html` | Podcast episode | Operative / Restorative Dentistry | 131 | 4 | 2026-05-22 | ضایعات سرویکال (NCCL) — شناخت و اتیولوژی (قسمت اول) / اپیزود 125 / دنت‌کست |
| 310 | `episodes/episode-126-1.html` | Podcast episode | Implantology | 145 | 2 | 2026-05-22 | اینسایت — درمان انتهای آزاد (Free-End): ایمپلنت یا پارسیل؟ / اپیزود 126.1 / دنت‌ |
| 311 | `episodes/episode-126.html` | Podcast episode | Occlusion / TMD | 130 | 2 | 2026-05-22 | ضایعات سرویکال (NCCL) — تشخیص و مدیریت (قسمت دوم) / اپیزود 126 / دنت‌کست |
| 312 | `episodes/episode-127.html` | Podcast episode | Adhesive Dentistry / Bonding | 129 | 2 | 2026-05-22 | ضایعات سرویکال (NCCL) — گایدلاین درمانی (قسمت سوم) / اپیزود 127 / دنت‌کست |
| 313 | `episodes/episode-128-1.html` | Podcast episode | Fixed Prosthodontics | 142 | 2 | 2026-05-22 | اینسایت — دقت اسکنرهای داخل دهانی (Trueness & Precision) / اپیزود 128.1 / دنت‌کس |
| 314 | `episodes/episode-128-2.html` | Podcast episode | Operative / Restorative Dentistry | 144 | 2 | 2026-05-22 | اینسایت — طراحی تراش و مقاومت به شکست (کامپوزیت) / اپیزود 128.2 / دنت‌کست |
| 315 | `episodes/episode-128.html` | Podcast episode | Fixed Prosthodontics | 132 | 4 | 2026-05-22 | راهنمای جامع فایبر پست‌ها — (قسمت اول) / اپیزود 128 / دنت‌کست |
| 316 | `episodes/episode-129.html` | Podcast episode | Adhesive Dentistry / Bonding | 129 | 2 | 2026-05-22 | راهنمای جامع فایبر پست‌ها — (قسمت دوم) / اپیزود 129 / دنت‌کست |
| 317 | `episodes/episode-13.html` | Podcast episode | Esthetic Dentistry / Smile Design | 121 | 2 | 2026-05-22 | Esthetic Width و Umbrella Effect / اپیزود 13 / دنت‌کست |
| 318 | `episodes/episode-130-1.html` | Podcast episode | Implantology | 138 | 2 | 2026-05-22 | اینسایت — شکست زودهنگام ایمپلنت (Early Failure) / اپیزود 130.1 / دنت‌کست |
| 319 | `episodes/episode-130.html` | Podcast episode | Implant Prosthodontics | 134 | 2 | 2026-05-22 | Zero Bone Loss — پروفایل ظهور (Emergence Profile) / اپیزود 130 / دنت‌کست |
| 320 | `episodes/episode-131.html` | Podcast episode | Occlusion / TMD | 133 | 3 | 2026-05-22 | اکلوژن در بازسازی‌ها: کانین رایز یا گروپ فانکشن؟ (قسمت اول) / اپیزود 131 / دنت‌ک |
| 321 | `episodes/episode-132.html` | Podcast episode | Occlusion / TMD | 134 | 3 | 2026-05-22 | اکلوژن در بازسازی‌ها: کانین رایز یا گروپ فانکشن؟ (قسمت دوم) / اپیزود 132 / دنت‌ک |
| 322 | `episodes/episode-133.html` | Podcast episode | Implantology | 130 | 3 | 2026-05-22 | افزایش دقت اسکن در ایمپلنت (Scan Bodies) / اپیزود 133 / دنت‌کست |
| 323 | `episodes/episode-134.html` | Podcast episode | Operative / Restorative Dentistry | 126 | 2 | 2026-05-22 | گایدلاین‌های درمان پوسیدگی (MID) — قسمت اول / اپیزود 134 / دنت‌کست |
| 324 | `episodes/episode-135.html` | Podcast episode | Operative / Restorative Dentistry | 125 | 2 | 2026-05-22 | گایدلاین‌های درمان پوسیدگی (MID) — قسمت دوم / اپیزود 135 / دنت‌کست |
| 325 | `episodes/episode-136.html` | Podcast episode | Adhesive Dentistry / Bonding | 125 | 2 | 2026-05-22 | آماده‌سازی سطح سرامیک‌ها (Surface Treatment) / اپیزود 136 / دنت‌کست |
| 326 | `episodes/episode-137.html` | Podcast episode | Adhesive Dentistry / Bonding | 127 | 2 | 2026-05-22 | ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت اول / اپیزود 137 / دنت‌کست |
| 327 | `episodes/episode-138.html` | Podcast episode | Resin Cements / Luting | 125 | 2 | 2026-05-22 | ترمیم‌های غیرمستقیم خلفی (Adhesive) — قسمت دوم / اپیزود 138 / دنت‌کست |
| 328 | `episodes/episode-139.html` | Podcast episode | Implantology | 137 | 2 | 2026-05-22 | متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت اول / اپیزود 139 / دنت‌کست |
| 329 | `episodes/episode-14.html` | Podcast episode | Occlusion / TMD | 119 | 3 | 2026-05-22 | افزایش Vertical Dimension / اپیزود 14 / دنت‌کست |
| 330 | `episodes/episode-140.html` | Podcast episode | Implantology | 135 | 2 | 2026-05-22 | متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت دوم / اپیزود 140 / دنت‌کست |
| 331 | `episodes/episode-141.html` | Podcast episode | Implantology | 133 | 2 | 2026-05-22 | متریال پروتزی روکش ایمپلنت (Zero Bone Loss) — قسمت سوم / اپیزود 141 / دنت‌کست |
| 332 | `episodes/episode-142.html` | Podcast episode | Occlusion / TMD | 133 | 3 | 2026-05-22 | داستان TMD: از داوسون تا اوکیسون — قسمت اول / اپیزود 142 / دنت‌کست |
| 333 | `episodes/episode-143-1.html` | Podcast episode | Meta / Frameworks | 136 | 2 | 2026-05-22 | دنتوپدیا — برندینگ در دندانپزشکی (Practice Branding) / اپیزود 143.1 / دنت‌کست |
| 334 | `episodes/episode-143.html` | Podcast episode | Occlusion / TMD | 131 | 2 | 2026-05-22 | داستان TMD: از داوسون تا اوکیسون — قسمت دوم / اپیزود 143 / دنت‌کست |
| 335 | `episodes/episode-144-1.html` | Podcast episode | Implantology | 130 | 2 | 2026-05-22 | دنتوپدیا — کانسپت All-on-4 / اپیزود 144.1 / دنت‌کست |
| 336 | `episodes/episode-144-2.html` | Podcast episode | Meta / Frameworks | 139 | 2 | 2026-05-22 | دنتوپدیا — فوتوگرامتری در اسکن فول آرچ / اپیزود 144.2 / دنت‌کست |
| 337 | `episodes/episode-144.html` | Podcast episode | Occlusion / TMD | 132 | 3 | 2026-05-22 | داستان TMD: از داوسون تا اوکیسون — قسمت سوم / اپیزود 144 / دنت‌کست |
| 338 | `episodes/episode-145.html` | Podcast episode | Occlusion / TMD | 130 | 2 | 2026-05-22 | داستان TMD: از داوسون تا اوکیسون — قسمت چهارم / اپیزود 145 / دنت‌کست |
| 339 | `episodes/episode-146.html` | Podcast episode | Dental Ceramics & Materials | 133 | 2 | 2026-05-22 | زیرکونیا بدون زیرکونیا (Zero Bone Loss) — قسمت اول / اپیزود 146 / دنت‌کست |
| 340 | `episodes/episode-147-1.html` | Podcast episode | Removable Prosthodontics | 136 | 2 | 2026-05-22 | دنتوپدیا — سیستم BPS در دنچر کامل / اپیزود 147.1 / دنت‌کست |
| 341 | `episodes/episode-147-2.html` | Podcast episode | Implantology | 142 | 2 | 2026-05-22 | اینسایت — سیگار و پریودنتیت: ریسک فاکتورهای ایمپلنت / اپیزود 147.2 / دنت‌کست |
| 342 | `episodes/episode-147-3.html` | Podcast episode | Meta / Frameworks | 139 | 2 | 2026-05-22 | دنتوپدیا — بررسی ماده Stela Automix / اپیزود 147.3 / دنت‌کست |
| 343 | `episodes/episode-147-4.html` | Podcast episode | Adhesive Dentistry / Bonding | 137 | 2 | 2026-05-22 | اسلایدکست — اثر آفتاب‌پرست در کامپوزیت (Chameleon Effect) / اپیزود 147.4 / دنت‌ک |
| 344 | `episodes/episode-147-5.html` | Podcast episode | Implantology | 140 | 3 | 2026-05-22 | دنتوپدیا — اسپلینت کردن ایمپلنت به دندان / اپیزود 147.5 / دنت‌کست |
| 345 | `episodes/episode-147-6.html` | Podcast episode | Removable Prosthodontics | 138 | 2 | 2026-05-22 | دنتوپدیا — صفر تا صد اوردنچرها / اپیزود 147.6 / دنت‌کست |
| 346 | `episodes/episode-147-7.html` | Podcast episode | Fixed Prosthodontics | 135 | 2 | 2026-05-22 | دنتوپدیا — پست در دندان‌های قدامی (۲۰۱۵-۲۰۲۵) / اپیزود 147.7 / دنت‌کست |
| 347 | `episodes/episode-147-8.html` | Podcast episode | Implantology | 135 | 2 | 2026-05-22 | دنتوپدیا — ایمپلنت‌های زایگوماتیک و طبقه‌بندی ZAGA / اپیزود 147.8 / دنت‌کست |
| 348 | `episodes/episode-147-9.html` | Podcast episode | Implantology | 130 | 2 | 2026-05-22 | دنتوپدیا — ایمپلنت‌های ساب‌-پریوستئال مدرن / اپیزود 147.9 / دنت‌کست |
| 349 | `episodes/episode-147.html` | Podcast episode | Esthetic Dentistry / Smile Design | 132 | 10 | 2026-05-22 | بهترین متریال سوپراجینجیوال (Zero Bone Loss) — قسمت دوم / اپیزود 147 / دنت‌کست |
| 350 | `episodes/episode-148-1.html` | Podcast episode | Implantology | 139 | 2 | 2026-05-22 | دنتوپدیا — از بیومکانیک به بیولوژی در ایمپلنت / اپیزود 148.1 / دنت‌کست |
| 351 | `episodes/episode-148-2.html` | Podcast episode | Implant Prosthodontics | 139 | 2 | 2026-05-22 | دنتوپدیا — کانسپت شهابیان (Smart Vent Crown) / اپیزود 148.2 / دنت‌کست |
| 352 | `episodes/episode-148.html` | Podcast episode | Resin Cements / Luting | 133 | 3 | 2026-05-22 | انتخاب سمان رزینی (لمینیت و اینله) — قسمت اول / اپیزود 148 / دنت‌کست |
| 353 | `episodes/episode-149-1.html` | Podcast episode | Digital Dentistry / CAD-CAM | 139 | 2 | 2026-05-22 | اسلایدکست — مبانی هوش مصنوعی برای دندانپزشکان / اپیزود 149.1 / دنت‌کست |
| 354 | `episodes/episode-149-2.html` | Podcast episode | Digital Dentistry / CAD-CAM | 135 | 2 | 2026-05-22 | دنتوپدیا — دندانپزشکی دیجیتال: نگاهی عمیق / اپیزود 149.2 / دنت‌کست |
| 355 | `episodes/episode-149.html` | Podcast episode | Resin Cements / Luting | 134 | 3 | 2026-05-22 | انتخاب سمان رزینی (لمینیت و اینله) — قسمت دوم / اپیزود 149 / دنت‌کست |
| 356 | `episodes/episode-15.html` | Podcast episode | Dental Ceramics & Materials | 121 | 2 | 2026-05-22 | طول عمر آنله‌های سرامیکی / اپیزود 15 / دنت‌کست |
| 357 | `episodes/episode-150-1.html` | Podcast episode | Meta / Frameworks | 137 | 2 | 2026-05-22 | دنتوپدیا — بیمار مجازی (The Virtual Patient) / اپیزود 150.1 / دنت‌کست |
| 358 | `episodes/episode-150-2.html` | Podcast episode | Implantology | 143 | 2 | 2026-05-22 | دنتوپدیا — حفظ دندان یا ایمپلنت؟ (یک مناظره) / اپیزود 150.2 / دنت‌کست |
| 359 | `episodes/episode-150.html` | Podcast episode | Implantology | 132 | 3 | 2026-05-22 | ایمپلنت فوری در ناحیه زیبایی (ITI Consensus 2023) / اپیزود 150 / دنت‌کست |
| 360 | `episodes/episode-151.html` | Podcast episode | Esthetic Dentistry / Smile Design | 132 | 2 | 2026-05-22 | تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت اول) / اپیزود 151 / دنت‌کست |
| 361 | `episodes/episode-152.html` | Podcast episode | Esthetic Dentistry / Smile Design | 146 | 2 | 2026-05-22 | تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت دوم) / اپیزود 152 / دنت‌کست |
| 362 | `episodes/episode-153.html` | Podcast episode | Esthetic Dentistry / Smile Design | 151 | 2 | 2026-05-22 | تصمیم‌گیری: کشیدن یا نگهداری؟ (قسمت سوم) / اپیزود 153 / دنت‌کست |
| 363 | `episodes/episode-154.html` | Podcast episode | Occlusion / TMD | 160 | 2 | 2026-05-22 | Vertical Dimension of Occlusion – Myth 1 / اپیزود 154 / دنت‌کست |
| 364 | `episodes/episode-155.html` | Podcast episode | Occlusion / TMD | 166 | 2 | 2026-05-22 | Vertical Dimension of Occlusion – Myths & Evidence (Part 2) / اپیزود 155 / دنت‌ک |
| 365 | `episodes/episode-156.html` | Podcast episode | Implantology | 175 | 2 | 2026-05-22 | Bio‑Restorative Concept in Implant Dentistry :part1 / اپیزود 156 / دنت‌کست |
| 366 | `episodes/episode-157.html` | Podcast episode | Implantology | 237 | 2 | 2026-05-22 | Bio‑Restorative Concept in Implant Dentistry :part2 / اپیزود 157 / دنت‌کست |
| 367 | `episodes/episode-16.html` | Podcast episode | Adhesive Dentistry / Bonding | 128 | 2 | 2026-05-22 | لزوم استفاده از باندینگ روی پرسلن اچ‌شده / اپیزود 16 / دنت‌کست |
| 368 | `episodes/episode-17.html` | Podcast episode | Dental Ceramics & Materials | 120 | 2 | 2026-05-22 | زیرکونیاهای شفاف – بخش اول / اپیزود 17 / دنت‌کست |
| 369 | `episodes/episode-18.html` | Podcast episode | Dental Ceramics & Materials | 118 | 2 | 2026-05-22 | زیرکونیاهای شفاف – بخش دوم / اپیزود 18 / دنت‌کست |
| 370 | `episodes/episode-19.html` | Podcast episode | Resin Cements / Luting | 121 | 2 | 2026-05-22 | ثبات رنگ لمینیت‌های سرامیکی / اپیزود 19 / دنت‌کست |
| 371 | `episodes/episode-2.html` | Podcast episode | Resin Cements / Luting | 124 | 2 | 2026-05-22 | انواع سمان و اصول سمان‌کردن / اپیزود 2 / دنت‌کست |
| 372 | `episodes/episode-20.html` | Podcast episode | Fixed Prosthodontics | 120 | 2 | 2026-05-22 | قالب‌گیری دو مرحله‌ای / اپیزود 20 / دنت‌کست |
| 373 | `episodes/episode-21.html` | Podcast episode | Fixed Prosthodontics | 126 | 2 | 2026-05-22 | ادامهٔ قالب‌گیری دو مرحله‌ای / اپیزود 21 / دنت‌کست |
| 374 | `episodes/episode-22.html` | Podcast episode | Oral Medicine / Pharmacology | 129 | 2 | 2026-05-22 | سه تداخل دارویی مهم در دندان‌پزشکی / اپیزود 22 / دنت‌کست |
| 375 | `episodes/episode-23.html` | Podcast episode | Implantology | 128 | 2 | 2026-05-22 | اثر اورلود اکلوزالی بر تحلیل استخوان ایمپلنت / اپیزود 23 / دنت‌کست |
| 376 | `episodes/episode-24.html` | Podcast episode | Implantology | 124 | 2 | 2026-05-22 | تأثیر نسبت تاج به ایمپلنت / اپیزود 24 / دنت‌کست |
| 377 | `episodes/episode-25.html` | Podcast episode | Implantology | 125 | 2 | 2026-05-22 | ایمپلنت کوتاه یا سینوس‌لیفت؟ / اپیزود 25 / دنت‌کست |
| 378 | `episodes/episode-26.html` | Podcast episode | Implantology | 124 | 2 | 2026-05-22 | زمان بارگذاری و تحلیل استخوان ایمپلنت / اپیزود 26 / دنت‌کست |
| 379 | `episodes/episode-27.html` | Podcast episode | Removable Prosthodontics | 122 | 2 | 2026-05-22 | مقایسهٔ اتچمنت‌ها در اوردنچر / اپیزود 27 / دنت‌کست |
| 380 | `episodes/episode-28.html` | Podcast episode | Esthetic Dentistry / Smile Design | 125 | 2 | 2026-05-22 | طراحی لبخند و قوانین مک‌لارن / اپیزود 28 / دنت‌کست |
| 381 | `episodes/episode-29.html` | Podcast episode | Dental Ceramics & Materials | 118 | 2 | 2026-05-22 | طبقه‌بندی جدید سرامیک‌ها / اپیزود 29 / دنت‌کست |
| 382 | `episodes/episode-3.html` | Podcast episode | Resin Cements / Luting | 119 | 2 | 2026-05-22 | ادامهٔ مباحث سمان‌ها / اپیزود 3 / دنت‌کست |
| 383 | `episodes/episode-30.html` | Podcast episode | Dental Ceramics & Materials | 123 | 2 | 2026-05-22 | سرامیک‌های پلی‌کریستالین و ماتریکس رزینی / اپیزود 30 / دنت‌کست |
| 384 | `episodes/episode-31.html` | Podcast episode | Implantology | 122 | 3 | 2026-05-22 | رستوریشن‌های ایمپلنتی اسکرو–سمنتد / اپیزود 31 / دنت‌کست |
| 385 | `episodes/episode-32.html` | Podcast episode | Esthetic Dentistry / Smile Design | 123 | 2 | 2026-05-22 | اپلاینس‌های اسنپ‌آن اسمایل / اپیزود 32 / دنت‌کست |
| 386 | `episodes/episode-33.html` | Podcast episode | Esthetic Dentistry / Smile Design | 122 | 2 | 2026-05-22 | ادامهٔ بحث اسنپ‌آن اسمایل / اپیزود 33 / دنت‌کست |
| 387 | `episodes/episode-34.html` | Podcast episode | Operative / Restorative Dentistry | 123 | 2 | 2026-05-22 | Dahl Concept – بخش اول / اپیزود 34 / دنت‌کست |
| 388 | `episodes/episode-35.html` | Podcast episode | Occlusion / TMD | 120 | 2 | 2026-05-22 | Dahl Concept – بخش دوم / اپیزود 35 / دنت‌کست |
| 389 | `episodes/episode-36.html` | Podcast episode | Adhesive Dentistry / Bonding | 121 | 2 | 2026-05-22 | چالش‌های باند به عاج ریشه / اپیزود 36 / دنت‌کست |
| 390 | `episodes/episode-37.html` | Podcast episode | Esthetic Dentistry / Smile Design | 122 | 2 | 2026-05-22 | اندیکاسیون‌های باز کردن کانتکت در تراش لمینیت / اپیزود 37 / دنت‌کست |
| 391 | `episodes/episode-38.html` | Podcast episode | Esthetic Dentistry / Smile Design | 124 | 2 | 2026-05-22 | تراش لمینیت بر اساس ماک‌آپ / اپیزود 38 / دنت‌کست |
| 392 | `episodes/episode-39.html` | Podcast episode | Esthetic Dentistry / Smile Design | 121 | 2 | 2026-05-22 | Black Triangle و اصلاح زیبایی آن / اپیزود 39 / دنت‌کست |
| 393 | `episodes/episode-4.html` | Podcast episode | Adhesive Dentistry / Bonding | 123 | 2 | 2026-05-22 | نسل‌های مختلف باندینگ / اپیزود 4 / دنت‌کست |
| 394 | `episodes/episode-40.html` | Podcast episode | Endodontics | 117 | 2 | 2026-05-22 | اندوکراون – مقدمه‌ای بر رستوریشن‌های مدرن / اپیزود 40 / دنت‌کست |
| 395 | `episodes/episode-41.html` | Podcast episode | Endodontics | 115 | 2 | 2026-05-22 | مرور سیستماتیک اندوکراون / اپیزود 41 / دنت‌کست |
| 396 | `episodes/episode-42.html` | Podcast episode | Adhesive Dentistry / Bonding | 122 | 2 | 2026-05-22 | آماده‌سازی سطحی فایبرپست و استحکام باند / اپیزود 42 / دنت‌کست |
| 397 | `episodes/episode-43.html` | Podcast episode | Adhesive Dentistry / Bonding | 120 | 2 | 2026-05-22 | مقایسهٔ آماده‌سازی فایبرپست برای سمان‌های سلف‌ادهزیو / اپیزود 43 / دنت‌کست |
| 398 | `episodes/episode-44.html` | Podcast episode | Adhesive Dentistry / Bonding | 116 | 2 | 2026-05-22 | باند به کامپوزیت قدیمی / اپیزود 44 / دنت‌کست |
| 399 | `episodes/episode-45.html` | Podcast episode | Implantology | 125 | 2 | 2026-05-22 | Immediate Load و Early Load در ایمپلنت / اپیزود 45 / دنت‌کست |
| 400 | `episodes/episode-46.html` | Podcast episode | Esthetic Dentistry / Smile Design | 124 | 2 | 2026-05-22 | کانسپت Facial Flow در طراحی لبخند / اپیزود 46 / دنت‌کست |
| 401 | `episodes/episode-47.html` | Podcast episode | Fixed Prosthodontics | 121 | 4 | 2026-05-22 | مقدمه‌ای بر Ferrule – بخش اول / اپیزود 47 / دنت‌کست |
| 402 | `episodes/episode-48.html` | Podcast episode | Fixed Prosthodontics | 117 | 2 | 2026-05-22 | بررسی Ferrule – بخش دوم / اپیزود 48 / دنت‌کست |
| 403 | `episodes/episode-49.html` | Podcast episode | Fixed Prosthodontics | 117 | 2 | 2026-05-22 | پایان بحث Ferrule – بخش سوم / اپیزود 49 / دنت‌کست |
| 404 | `episodes/episode-5.html` | Podcast episode | Adhesive Dentistry / Bonding | 115 | 3 | 2026-05-22 | باندینگ‌های یونیورسال / اپیزود 5 / دنت‌کست |
| 405 | `episodes/episode-50.html` | Podcast episode | Removable Prosthodontics | 123 | 2 | 2026-05-22 | شروع Learning Pathway – انتخاب اتچمنت در اوردنچر / اپیزود 50 / دنت‌کست |
| 406 | `episodes/episode-51.html` | Podcast episode | Removable Prosthodontics | 117 | 2 | 2026-05-22 | ادامه مسیر انتخاب اتچمنت برای اوردنچر / اپیزود 51 / دنت‌کست |
| 407 | `episodes/episode-52.html` | Podcast episode | Removable Prosthodontics | 118 | 2 | 2026-05-22 | پروتکل لودینگ ایمپلنت در اوردنچر / اپیزود 52 / دنت‌کست |
| 408 | `episodes/episode-53.html` | Podcast episode | Adhesive Dentistry / Bonding | 119 | 2 | 2026-05-22 | آغاز مبحث دندانپزشکی بیومیمتیک – بخش اول / اپیزود 53 / دنت‌کست |
| 409 | `episodes/episode-54.html` | Podcast episode | Adhesive Dentistry / Bonding | 117 | 2 | 2026-05-22 | ادامه مبحث بیومیمتیک – بخش دوم / اپیزود 54 / دنت‌کست |
| 410 | `episodes/episode-55.html` | Podcast episode | Fixed Prosthodontics | 126 | 2 | 2026-05-22 | آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش اول / اپیزود 55 / دنت‌کست |
| 411 | `episodes/episode-56.html` | Podcast episode | Fixed Prosthodontics | 124 | 2 | 2026-05-22 | ادامه آماده‌سازی دندان برای اورلی‌های سرامیکی – بخش دوم / اپیزود 56 / دنت‌کست |
| 412 | `episodes/episode-57.html` | Podcast episode | Fixed Prosthodontics | 120 | 2 | 2026-05-22 | پروتکل‌های عملی در آماده‌سازی اورلی‌های سرامیکی / اپیزود 57 / دنت‌کست |
| 413 | `episodes/episode-58.html` | Podcast episode | Fixed Prosthodontics | 122 | 2 | 2026-05-22 | پایان مبحث اورلی – نکات عملی نهایی / اپیزود 58 / دنت‌کست |
| 414 | `episodes/episode-59.html` | Podcast episode | Implantology | 125 | 2 | 2026-05-22 | عوامل مؤثر بر تحلیل استخوان مارژینال اطراف ایمپلنت / اپیزود 59 / دنت‌کست |
| 415 | `episodes/episode-6.html` | Podcast episode | Adhesive Dentistry / Bonding | 124 | 2 | 2026-05-22 | Immediate Dentin Sealing (IDS) / اپیزود 6 / دنت‌کست |
| 416 | `episodes/episode-60.html` | Podcast episode | Occlusion / TMD | 124 | 2 | 2026-05-22 | اکلوژن در درمان‌های ایمپلنت – با حضور دکتر الله‌بخشی / اپیزود 60 / دنت‌کست |
| 417 | `episodes/episode-61.html` | Podcast episode | Esthetic Dentistry / Smile Design | 127 | 2 | 2026-05-22 | بلیچینگ و اینترنال بلیچینگ – با دکتر دریاکناری / اپیزود 61 / دنت‌کست |
| 418 | `episodes/episode-62.html` | Podcast episode | Implantology | 129 | 2 | 2026-05-22 | اثر رشد فکین بر نتایج بلندمدت ایمپلنت – بخش اول / اپیزود 62 / دنت‌کست |
| 419 | `episodes/episode-63.html` | Podcast episode | Implantology | 124 | 2 | 2026-05-22 | اثر رشد فکین بر ایمپلنت – بخش دوم / اپیزود 63 / دنت‌کست |
| 420 | `episodes/episode-64.html` | Podcast episode | Implantology | 123 | 2 | 2026-05-22 | اثر رشد فکین بر ایمپلنت – بخش پایانی / اپیزود 64 / دنت‌کست |
| 421 | `episodes/episode-65.html` | Podcast episode | Operative / Restorative Dentistry | 128 | 2 | 2026-05-22 | Peripheral Seal Zone و برداشت پوسیدگی – بخش اول / اپیزود 65 / دنت‌کست |
| 422 | `episodes/episode-66.html` | Podcast episode | Adhesive Dentistry / Bonding | 117 | 2 | 2026-05-22 | Peripheral Seal Zone – ادامه بحث / اپیزود 66 / دنت‌کست |
| 423 | `episodes/episode-67.html` | Podcast episode | Adhesive Dentistry / Bonding | 118 | 2 | 2026-05-22 | Peripheral Seal Zone – پایان مقاله / اپیزود 67 / دنت‌کست |
| 424 | `episodes/episode-68.html` | Podcast episode | Esthetic Dentistry / Smile Design | 127 | 2 | 2026-05-22 | عوامل مؤثر بر رنگ نهایی در درمان‌های زیبایی / اپیزود 68 / دنت‌کست |
| 425 | `episodes/episode-69.html` | Podcast episode | Esthetic Dentistry / Smile Design | 121 | 2 | 2026-05-22 | انواع ایمکس اینگات – با دکتر نشاطی / اپیزود 69 / دنت‌کست |
| 426 | `episodes/episode-7.html` | Podcast episode | Adhesive Dentistry / Bonding | 123 | 2 | 2026-05-22 | Deep Margin Elevation (DME) / اپیزود 7 / دنت‌کست |
| 427 | `episodes/episode-70.html` | Podcast episode | Esthetic Dentistry / Smile Design | 127 | 2 | 2026-05-22 | آفیس بلیچ و هوم بلیچ – با دکتر دریاکناری / اپیزود 70 / دنت‌کست |
| 428 | `episodes/episode-71.html` | Podcast episode | Adhesive Dentistry / Bonding | 125 | 3 | 2026-05-22 | باند به فلز – اصول و نکات کلینیکی / اپیزود 71 / دنت‌کست |
| 429 | `episodes/episode-72.html` | Podcast episode | Adhesive Dentistry / Bonding | 121 | 2 | 2026-05-22 | Decoupling With Time – بخش اول / اپیزود 72 / دنت‌کست |
| 430 | `episodes/episode-73.html` | Podcast episode | Adhesive Dentistry / Bonding | 116 | 2 | 2026-05-22 | Decoupling With Time – بخش دوم / اپیزود 73 / دنت‌کست |
| 431 | `episodes/episode-74.html` | Podcast episode | Adhesive Dentistry / Bonding | 114 | 2 | 2026-05-22 | Decoupling With Time – بخش پایانی / اپیزود 74 / دنت‌کست |
| 432 | `episodes/episode-75.html` | Podcast episode | Adhesive Dentistry / Bonding | 127 | 3 | 2026-05-22 | Biological Width، مقایسه DME و CL – بخش اول / اپیزود 75 / دنت‌کست |
| 433 | `episodes/episode-76.html` | Podcast episode | Adhesive Dentistry / Bonding | 128 | 2 | 2026-05-22 | Biological Width – مقایسه DME و CL – بخش دوم / اپیزود 76 / دنت‌کست |
| 434 | `episodes/episode-77.html` | Podcast episode | Adhesive Dentistry / Bonding | 124 | 2 | 2026-05-22 | طبقه‌بندی رستوریشن‌های خلفی با گسترش ژنژیوالی – بخش اول / اپیزود 77 / دنت‌کست |
| 435 | `episodes/episode-78.html` | Podcast episode | Adhesive Dentistry / Bonding | 116 | 2 | 2026-05-22 | طبقه‌بندی رستوریشن‌های خلفی – بخش دوم / اپیزود 78 / دنت‌کست |
| 436 | `episodes/episode-79.html` | Podcast episode | Fixed Prosthodontics | 124 | 2 | 2026-05-22 | فایبر پست – نکات کلینیکی با دکتر دریاکناری / اپیزود 79 / دنت‌کست |
| 437 | `episodes/episode-8.html` | Podcast episode | Dental Ceramics & Materials | 119 | 2 | 2026-05-22 | طبقه‌بندی سرامیک‌های دندانی / اپیزود 8 / دنت‌کست |
| 438 | `episodes/episode-80.html` | Podcast episode | Implantology | 120 | 2 | 2026-05-22 | کانکشن‌های ایمپلنت – معرفی انواع اتصالات / اپیزود 80 / دنت‌کست |
| 439 | `episodes/episode-81.html` | Podcast episode | Implant Prosthodontics | 114 | 2 | 2026-05-22 | پایان بحث کانکشن‌های ایمپلنت / اپیزود 81 / دنت‌کست |
| 440 | `episodes/episode-82.html` | Podcast episode | Implantology | 116 | 2 | 2026-05-22 | Platform Switch – بخش اول / اپیزود 82 / دنت‌کست |
| 441 | `episodes/episode-83.html` | Podcast episode | Implant Prosthodontics | 112 | 2 | 2026-05-22 | Platform Switch – پایان / اپیزود 83 / دنت‌کست |
| 442 | `episodes/episode-84.html` | Podcast episode | Implant Prosthodontics | 116 | 3 | 2026-05-22 | Abutment Screw – نکات کاربردی / اپیزود 84 / دنت‌کست |
| 443 | `episodes/episode-85.html` | Podcast episode | Occlusion / TMD | 118 | 3 | 2026-05-22 | TMD – اختلالات عضلات ماضغه / اپیزود 85 / دنت‌کست |
| 444 | `episodes/episode-86.html` | Podcast episode | Occlusion / TMD | 119 | 2 | 2026-05-22 | TMD – اختلالات داخل کپسولی / اپیزود 86 / دنت‌کست |
| 445 | `episodes/episode-87.html` | Podcast episode | Dental Ceramics & Materials | 112 | 2 | 2026-05-22 | مرور علمی زیرکونیا – بخش اول / اپیزود 87 / دنت‌کست |
| 446 | `episodes/episode-88.html` | Podcast episode | Dental Ceramics & Materials | 117 | 3 | 2026-05-22 | مرور علمی زیرکونیا – بخش دوم / اپیزود 88 / دنت‌کست |
| 447 | `episodes/episode-89.html` | Podcast episode | Dental Ceramics & Materials | 116 | 2 | 2026-05-22 | مرور علمی زیرکونیا – پایان / اپیزود 89 / دنت‌کست |
| 448 | `episodes/episode-9.html` | Podcast episode | Dental Ceramics & Materials | 127 | 2 | 2026-05-22 | آماده‌سازی سطح سرامیک‌ها – بخش اول / اپیزود 9 / دنت‌کست |
| 449 | `episodes/episode-90.html` | Podcast episode | Adhesive Dentistry / Bonding | 123 | 2 | 2026-05-22 | شروع کتاب Biomimetic Restorative Dentistry – فصل ۱ / اپیزود 90 / دنت‌کست |
| 450 | `episodes/episode-91.html` | Podcast episode | Adhesive Dentistry / Bonding | 125 | 2 | 2026-05-22 | بیومیمتیک — مرور فصل یک (قسمت دوم) / اپیزود 91 / دنت‌کست |
| 451 | `episodes/episode-92.html` | Podcast episode | Adhesive Dentistry / Bonding | 122 | 2 | 2026-05-22 | بیومیمتیک — مرور فصل یک (قسمت سوم) / اپیزود 92 / دنت‌کست |
| 452 | `episodes/episode-93.html` | Podcast episode | Adhesive Dentistry / Bonding | 124 | 2 | 2026-05-22 | بیومیمتیک — مرور فصل یک (قسمت چهارم) / اپیزود 93 / دنت‌کست |
| 453 | `episodes/episode-94.html` | Podcast episode | Adhesive Dentistry / Bonding | 127 | 2 | 2026-05-22 | بیومیمتیک — پایان فصل یک (قسمت پنجم) / اپیزود 94 / دنت‌کست |
| 454 | `episodes/episode-95.html` | Podcast episode | Operative / Restorative Dentistry | 125 | 2 | 2026-05-22 | BOPT — اصول تراش و آماده‌سازی / اپیزود 95 / دنت‌کست |
| 455 | `episodes/episode-96.html` | Podcast episode | Digital Dentistry / CAD-CAM | 129 | 2 | 2026-05-22 | PEEK CAD-CAM — اصول و کاربردها (قسمت اول) / اپیزود 96 / دنت‌کست |
| 456 | `episodes/episode-97.html` | Podcast episode | Digital Dentistry / CAD-CAM | 120 | 2 | 2026-05-22 | PEEK CAD-CAM — ادامه کاربردها (قسمت دوم) / اپیزود 97 / دنت‌کست |
| 457 | `episodes/episode-98.html` | Podcast episode | Digital Dentistry / CAD-CAM | 123 | 2 | 2026-05-22 | PEEK CAD-CAM — پایان مباحث (قسمت سوم) / اپیزود 98 / دنت‌کست |
| 458 | `episodes/episode-99.html` | Podcast episode | Operative / Restorative Dentistry | 120 | 2 | 2026-05-22 | رزین اینفیلتریشن — درمان ضایعات سفید / اپیزود 99 / دنت‌کست |
| 459 | `search.html` | Search page | Site infrastructure / Index | 49 | 0 | 2026-05-20 | جستجوی سراسری / DentCast |
| 460 | `sharehub/index.html` | Share Hub index | Curated External Content | 199 | 1 | 2026-05-21 | Share Hub / محتوای منتخب با ذکر منبع – دنت‌کست |
| 461 | `sharehub/share-1.html` | Share Hub item | Curated External Content | 294 | 1 | 2026-05-22 | پیچ هرز شده در پروتزهای متکی بر ایمپلنت / Share Hub – دنت‌کست |
| 462 | `sharehub/share-2.html` | Share Hub item | Digital Dentistry / CAD-CAM | 576 | 1 | 2026-05-22 | بهینه‌سازی دقت اسکن داخل دهانی ایمپلنت / Share Hub – دنت‌کست |
| 463 | `sharehub/share-3.html` | Share Hub item | Implantology | 459 | 1 | 2026-05-22 | ایمپلنت در ناحیه قدام: جای دندان ۱ یا ۲؟ / Share Hub – دنت‌کست |
| 464 | `sharehub/share-4.html` | Share Hub item | Resin Cements / Luting | 419 | 1 | 2026-05-22 | راهها و تکنیکهای جلوگیری از باقی ماندن بقایای سمان در روکشهای سمان شونده / Share |
| 465 | `sharehub/share-5.html` | Share Hub item | Curated External Content | 383 | 1 | 2026-05-22 | چرا گاهی اصلاح فضا به قیمت از دست رفتن رابطه کانینی کلاس I انجام نمی‌شود؟/ Share |
| 466 | `sharehub/share-6.html` | Share Hub item | Occlusion / TMD | 482 | 2 | 2026-05-22 | نحوه تنظیم اکلوژن در لامینیت‌های سرامیکی / Share Hub – دنت‌کست |
| 467 | `index.html` | Site homepage | Implantology | 317 | 460 | 2026-05-23 | دنت‌کست / پادکست تخصصی پروتز و ایمپلنت — دکتر فواد شهابیان |
