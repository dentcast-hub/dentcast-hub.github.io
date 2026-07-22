# Pathways draft + pillar backfill — 2026-07-22

Groundwork for DentCast Plus Phase 3 (learning pathways, premium). Two changes:

## 1. `plus/pathways.json` (NEW — DRAFT, founder curation required)

Schema exactly per spec §5 (`dentcast-plus-technical-spec-final.md`):
`[{id, title_fa, description_fa, premium, steps:[{content_id, milestone}], reserved}]`.
`content_id` = page path without leading `/` and `.html` — the same format the
Plus client already uses for highlights/activity (`plus/plus.js`). All 189 step
ids verified to resolve to real files on disk; no duplicates.

| id | steps | milestones | source |
|---|---|---|---|
| `implantology-core` | 94 | 4 | pillar `implantology`, litecast excluded |
| `fixed-pros-core` | 86 | 6 | pillar `fixed-pros` |
| `promptologist` | 9 | 2 | explicit series order (prompt1-1 … prompt4-1) |

Ordering rules used for the two pillar pathways (a *draft* for the founder to
reorder, not a final pedagogy):

- Subtopic blocks in learning order — implantology: fundamentals →
  surgical-planning → prosthetic-components → restoration-design →
  peri-implant-health; fixed-pros: preparation → impression → cementation →
  crowns-onlays → post-and-core → failures.
- Inside a block: podcast episodes by episode number (the backbone); a
  notecast that mirrors an episode (`notecast/episode-N`) is placed
  immediately after that episode; remaining types follow in brain order.
- The last step of each subtopic block is the `milestone`.
- **Litecast excluded** from professional pathways (patient-facing, `.ir`-only).

Generator script (one-off, reproducible): kept out of the repo; ordering is
now owned by this JSON file — edit the JSON directly when curating.

## 2. `dentcast-brain.json` — pillar backfill (14 of 25 null-pillar entries)

Only clear cases, only **existing** vocabulary values (no new subtopics
invented — `digital/ai` already existed with 3 entries):

- `episodes/episode-22`, `notecast/episode-22` (تداخل دارویی) → `oral-medicine` / –
- `litecast/lite-CAST2`, `lite-CAST4` (دنچر پایین / اوردنچر) → `removable-pros` / `implant-overdentures`
- `episodes/episode-111-1` (فیشور سیلانت) → `operative` / `caries-management`
- 9× `dentai/promptologist/*` → `digital` / `ai`

### Left null on purpose (meta / non-clinical)

`episodes/episode-1` (intro), `episode-100` (special), `episode-143-1`
(branding), `litecast/lite-CAST11` (choosing a dentist).

### Needs a founder decision (no fitting pillar in current taxonomy)

- `sharehub/share-7` (دیابت و پوسیدگی) — `oral-medicine` vs
  `operative/caries-management`; proposal: `oral-medicine`.
- Dentopedia equipment items: `episode-106-1` (suck-back), `episode-107-1`
  (handpiece colors), `episode-109-1` (loupes), `episode-110-1` (portable
  x-ray), `episode-122-4` (computer-controlled anesthesia),
  `litecast/lite-CAST1` (2-2-2) — the taxonomy has no equipment/prevention
  pillar; either add one deliberately or leave these outside pathways.

## Next steps (Phase 3 delta)

1. Founder curates the three draft pathways (reorder / trim steps).
2. `plus-api`: pathway endpoints behind `requirePremium` (`GET /pathways`,
   enroll, advance `current_step` — table `user_pathways` exists since
   migration 0001) + pathway summary in `GET /me`.
3. Frontend: pathway page + "ادامه بده" (continue) widget. Rule-based next-item:
   enrolled → next incomplete step; else newest unread in the last-read
   item's pillar/subtopic (from `user_activity`; `article_completed` is
   already emitted by `plus/js/reading.js`). Audio-completion signal for
   episodes is still missing — add a player-progress event before
   recommending "بشنو".
4. AI recommendations stay Phase 5 (server-side proxy), after the rule-based
   loop proves itself.
