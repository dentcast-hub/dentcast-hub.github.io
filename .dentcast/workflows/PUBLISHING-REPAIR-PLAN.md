# Publishing workflow repair — staged delivery

Owner decision (2026-10-17): legacy is backup only and is not read for execution. Use a single temporary `.dentcast/PUBLISH-HANDOFF.md`, update it at every publication step, discover it when asked to resume, and remove it after verified completion.

Working branch: `fix/publishing-resume-contract`.
Each stage is reviewed and verified, then committed and pushed before the next stage. Do not claim all stages are delivered when only a contract exists.

| Stage | Deliverable | Acceptance | Status |
|---|---|---|---|
| 1 | Permanent handoff contract, fixed temporary path, resume discovery in agent entrypoints | Same path and trigger in AGENTS, CLAUDE, Cursor, publishing README and shared parity; lifecycle and transfer limits documented | Contract and routing delivered in this stage |
| 2 | Active global rules, modular-only authority, corrected live/staging documentation | Required global invariants survive; no runtime instruction requires loading backup files; specialty routes preserved | Delivered in stage 2; active global rules and historical record boundaries |
| 3 | Minimal handoff writer, validator and recovery inspection | Dirty/staged/untracked work, local commits and remote availability distinguished; safe updates; no invented completion | Pending |
| 4 | Per-step workflow integration, hooks and CI | Every step updates state; nested module edits covered; working-branch CI tests actual active rules; completion cleanup guarded | Pending |
| 5 | End-to-end recovery scenarios | Same-checkout dirty work; unpushed commit; remote transfer; missing/corrupt/stale state; ambiguous external outcome; verified cleanup | Pending |

Stage 2 migrated complete global §§6–8 into active shared files, preserved detailed specialty triggers, replaced legacy runtime authority, redirected obsolete section references, and marked development documents historical. Automatic live handoff tools and client runtime recovery tests remain pending in stages 3–5.
No real content publication is in progress as part of this repair, so no temporary publication handoff should be created merely for this refactor.

## Stage 2 validation

`python3 -m unittest discover -s tests -p test_dentcast_agent_entrypoint_migration.py -v` — 8 tests passed. Full global text migration and all twelve module bodies were checked against source fixtures, allowing only documented active-reference repairs. Backup fixtures are read by audit tests only; no live instruction requires them. No backup snapshot, scientific prompt, model algorithm or staging executable was changed. Real client runtime parity and automatic handoff recovery remain untested until later stages.

