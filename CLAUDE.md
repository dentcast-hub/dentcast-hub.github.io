# DentCast — Claude Code entrypoint

> **Publish-queue check — first, before anything else.** If the request mentions the publish queue («صف انتشار», branch `queue` of this repo), e.g. «یه مقاله تو صف انتشار دارم»، «از صف انتشار منتشر کن»، «قدیمی‌ترین مقالهٔ صف رو منتشر کن»، «بذارش تو صف انتشار»، «صف انتشار چی داره؟», then: to publish from it, read only `.dentcast/workflows/queue-route.md` and follow it (publish day runs on GitHub Actions: dispatch `.github/workflows/queue-publish.yml` and monitor it, never push or upload publication files from the agent sandbox; a fresh session runs `python3 tools/queue_publish.py status` first; two deliveries; nothing else is read or done); to report the queue's status, read only `.dentcast/workflows/publish-queue.md`; to prepare an item, read `.dentcast/workflows/publish-queue.md` completely and then, once and completely, the queue-prep reading pack it names (`tools/dentcast_publish_readpack.py --queue-prep`, which assembles its «فهرست خواندن» byte for byte: module 01, module 02, module 06 Part 1 with a paper, module 08 and the listed sections of 03, 04, 05, 07, 10, 11, 12 and `en-version.md`). Otherwise ignore this note.

**LIVE_MODULAR_PUBLISHING_ENABLED.** Legacy files are backup only; do not read them for execution or use them as authority.

Before content changes, read `.dentcast/workflows/global/README.md`, the complete active sections selected by that router for the current edit scope, and `.dentcast/workflows/agent-parity.md`. All clients use these same rules. Exception: publishing an item from the queue reads only `.dentcast/workflows/queue-route.md`; its tools carry these rules.

New publication → `.dentcast/workflows/README.md`. Read complete `modules/01-hard-rules.md` and `02-routing-intake.md`, then all applicable verbatim rules in the ledger order of `publish-checkpoints.md`: full modules by default, or the verified readpack (README). No AI summaries or unverified omissions. Agent proposals are built and reported, not asked; the founder gets exactly two messages (M1 at C.4.13, M2 at 4.12-ب) plus real decisions. Preserve source-dependent DES/Fidelity, category exceptions, English and final Phase F. Stage-only planning tools and synthetic receipts do not perform or authorize live publication.

After a new v2 publication's second delivery is confirmed, immediately tell the user that the agent-side work has reached Push 2, GitHub Actions is running the remaining mechanical delivery (C.8 onward, delivery 3 and the PR), and the agent is monitoring it. Include the branch, Push-2 SHA and Actions run link when available. Do not go silent or call the publication complete. Keep checking the run until it succeeds or fails, without periodic status messages: report once at the run's end and once at merge, which needs authorization (`.dentcast/workflows/publish-after-push2.md`).

**Interrupted publication** («انتشار ناقص داشتم»), the run state `.dentcast/PUBLISH-HANDOFF.md` and recovery through `.dentcast/workflows/publish-handoff.md`: `.dentcast/workflows/publish-checkpoints.md`, «Interrupted publication».

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
| Minimal publications from /admin (setup, import into git, completion) | `.dentcast/quick-publish.md` |
| External Fidelity | `.dentcast/workflows/external-fidelity.md` |
| Publish queue on branch `queue` (prepare, status) | `.dentcast/workflows/publish-queue.md` |
| Publish an item from the queue (publish day) | `.dentcast/workflows/queue-route.md` (only this) |

Detailed triggers and specialty conditions: `.dentcast/workflows/routing-details.md`. Read the selected specialty workflow completely. New content uses the modular sequence, including paper-only and category exceptions.

Update AGENTS.md, CLAUDE.md and Cursor routing together when shared routes change. Never store private inputs in public Git history.

## Per-step checkpoints and delivery batches

Ledger, the three fixed deliveries (after `C.4.9`, after `C.6`, delivery 3 by `post-cut2-mechanical.yml`), text lock, paper-only and completion: `.dentcast/workflows/publish-checkpoints.md`.
