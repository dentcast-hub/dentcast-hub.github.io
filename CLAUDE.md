# DentCast — Claude Code entrypoint

**LIVE_MODULAR_PUBLISHING_ENABLED.** Legacy files are backup only; do not read them for execution or use them as authority.

Before content changes, read `.dentcast/workflows/global/README.md`, the complete active sections selected by that router for the current edit scope, and `.dentcast/workflows/agent-parity.md`. All clients use these same rules.

New publication → `.dentcast/workflows/README.md`. Read complete `modules/01-hard-rules.md` and `02-routing-intake.md`, then each applicable full module in canonical order. Preserve all approvals, source-dependent DES/Fidelity, category exceptions, builders, English and final Phase F. Stage-only planning tools and synthetic receipts do not perform or authorize live publication.

## Interrupted publication

The permanent execution guide is `publish-checkpoints.md`; the temporary current-run state is `.dentcast/PUBLISH-HANDOFF.md`; `publish-handoff.md` and `publish-discovery.md` describe explicit recovery. These are different roles. In a continuing active session, «کجایی؟», «چی شد؟», «ادامه بده» and «ادامه انتشار» are status/continuation requests: answer directly and continue from the current ledger and last valid tool digest. Missing receipts, stale checkpoints and module cross-references do not authorize recovery or branch scans. Read each required complete source once per unchanged revision in the continuous run; follow the execution/delivery discipline in `publish-checkpoints.md`. Infrastructure-only work does not initialize a publication.

For «انتشار ناقص داشتم» or an explicit request to resume a publication the user identifies as incomplete/interrupted, read `.dentcast/PUBLISH-HANDOFF.md` exactly once, then `.dentcast/workflows/publish-handoff.md`. A generic «ادامه بده» or «ادامه انتشار» alone does not trigger recovery. During the active run, keep state in the current session and do not reread the handoff before each step; use the latest helper digest. Before a new publication, check only whether the file exists. If it does, make no changes and ask whether the user means to resume; read it only after explicit confirmation. Never overwrite unfinished work. Update the handoff after every canonical step and before handing off; delete it only after verified completion. A missing file or unavailable work must be reported, not invented. Local commits and dirty files are not automatically available in another checkout.

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

## Per-step checkpoints and delivery batches

Read `.dentcast/workflows/publish-checkpoints.md`. Use the full canonical ledger from `tools/dentcast_publish_handoff.py plan`; write `started` before each action and its actual result afterward using `step`/`record`. Prefer `advance` for separate durable transitions in one call. Page publications have **exactly three deliveries**: (1) after page construction and semantic linking (`C.4.9`), (2) after DES/Fidelity and founder-approved corrections (`C.4.13`, including lawful skips), (3) after all remaining work, real Phase F and report G. Deliver work plus the latest handoff at cuts 1 and 2; keep intermediate checkpoints local. At cut 3 run `finish`, then commit/push final work, the completion receipt and handoff deletion together, and run `confirm-cleanup`. Never push a completed final handoff or a fourth cleanup commit. Stops, agent switches, approvals and external actions do not add deliveries. Restore locally with `restore-cleanup` if final delivery fails. Paper-only and pre-existing runs retain their documented compatibility path. Hooks supplement this contract and never certify semantic or scientific results.
