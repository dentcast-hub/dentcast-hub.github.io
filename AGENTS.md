# DentCast — shared agent entrypoint

**LIVE_MODULAR_PUBLISHING_ENABLED.** Legacy files are backup only; do not read them for execution or use them as authority.

Before content changes, read `.dentcast/workflows/global/README.md`, its three complete active global rule files, and `.dentcast/workflows/agent-parity.md`. All clients use these same rules.

New publication → `.dentcast/workflows/README.md`. Read complete `modules/01-hard-rules.md` and `02-routing-intake.md`, then each applicable full module in canonical order. Preserve all approvals, source-dependent DES/Fidelity, category exceptions, builders, English and final Phase F. Stage-only planning tools and synthetic receipts do not perform or authorize live publication.

## Interrupted publication

For «انتشار ناقص داشتم», «ادامه انتشار», "resume publishing", or equivalent, first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`. Check the same fixed path before a new publication. Never overwrite unfinished work. Update it after every canonical step and before handing off; delete it only after verified completion. A missing file or unavailable work must be reported, not invented. Local commits and dirty files are not automatically available in another checkout.

## Routes

| Request | Active workflow |
|---|---|
| New content or attached paper (with or without text) | `.dentcast/workflows/README.md` |
| Existing-page English | `.dentcast/workflows/en-version.md` |
| Ads | `.dentcast/workflows/ads.md` |
| Ad statistics | `.dentcast/workflows/spot-report.md` |
| Glossary authoring | `.claude/skills/glossary-writer/SKILL.md` |
| Cross-linking | `.dentcast/workflows/cross-link.md` |
| New section | `.dentcast/workflows/new-section.md` |
| Offline publishing | `.dentcast/offline-publish.md` |
| External Fidelity | `.dentcast/workflows/external-fidelity.md` |

Detailed triggers and specialty conditions: `.dentcast/workflows/routing-details.md`. Read the selected specialty workflow completely. New content uses the modular sequence, including paper-only and category exceptions.

Update AGENTS.md, CLAUDE.md and Cursor routing together when shared routes change. Never store private inputs in public Git history.
