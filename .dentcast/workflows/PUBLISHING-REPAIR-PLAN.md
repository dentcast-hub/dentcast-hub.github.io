# Publishing workflow repair — staged delivery

Owner decision (2026-10-17): legacy is backup only and is not read for execution. Use a single temporary `.dentcast/PUBLISH-HANDOFF.md`, update it at every publication step, discover it when asked to resume, and remove it after verified completion.

Working branch: `fix/publishing-resume-contract`.
Each stage is reviewed and verified, then committed and pushed before the next stage. Do not claim all stages are delivered when only a contract exists.

| Stage | Deliverable | Acceptance | Status |
|---|---|---|---|
| 1 | Permanent handoff contract, fixed temporary path, resume discovery in agent entrypoints | Same path and trigger in AGENTS, CLAUDE, Cursor, publishing README and shared parity; lifecycle and transfer limits documented | Contract and routing delivered in this stage |
| 2 | Active global rules, modular-only authority, corrected live/staging documentation | Required global invariants survive; no runtime instruction requires loading backup files; specialty routes preserved | Pending |
| 3 | Minimal handoff writer, validator and recovery inspection | Dirty/staged/untracked work, local commits and remote availability distinguished; safe updates; no invented completion | Pending |
| 4 | Per-step workflow integration, hooks and CI | Every step updates state; nested module edits covered; working-branch CI tests actual active rules; completion cleanup guarded | Pending |
| 5 | End-to-end recovery scenarios | Same-checkout dirty work; unpushed commit; remote transfer; missing/corrupt/stale state; ambiguous external outcome; verified cleanup | Pending |

Stage 2 must migrate the still-present legacy references rather than losing required global rules. Stage 1's explicit backup-only instruction overrides those older references in the meantime.
No real content publication is in progress as part of this repair, so no temporary publication handoff should be created merely for this refactor.
