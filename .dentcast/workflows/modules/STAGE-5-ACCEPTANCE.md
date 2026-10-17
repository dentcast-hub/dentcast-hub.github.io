# Historical modularization development record — not live instructions

This document records staging development at its original revision. Its former branch directions, activation status, backup-reading requirements and proposed workflow routes are historical, not current execution instructions.
For live work read `.dentcast/workflows/README.md`, `.dentcast/workflows/global/README.md` and `.dentcast/workflows/agent-parity.md`.
For «انتشار ناقص داشتم», first read `.dentcast/PUBLISH-HANDOFF.md`, then `.dentcast/workflows/publish-handoff.md`.
Staging utilities remain restricted to staging. Do not follow the historical steps below to resume a real publication or assume their test results describe the current branch.
Current repair branch and status: `.dentcast/workflows/PUBLISHING-REPAIR-PLAN.md`.

---

## Historical record (non-operative)

# Stage 5 acceptance — DES/Fidelity nested cross-agent resume

**Stage 5 staging checkpoint/resume implementation: complete. Scientific appraisal engine: unchanged. Production activation: NOT authorized.**

## Actual implementation

`tools/dentcast_fidelity_resume.py` uses the Stage 4 GitHub-backed event store and the **existing** `tools/des_fidelity_units.py` voting engine and `tools/verify_publish.py` F4 arithmetic. It does not change prompts, verdict rules, evidence scores, thresholds, model rankings, citation rules, founder approvals, or `plus/des-scores.json`.

- **Per-source identity:** store the EXACT original `input-src<k>.json` (or `input-pooled-S<n>.json`) and its SHA-256, original ordered unit IDs and text, source-text basis, DES 3.4 engine version and actual `.dentcast/des-v3.4-knowledge.md` prompt SHA-256. Source text is never inferred and original author/user strings are never regenerated from memory.
- **Real cross-agent recovery:** every scientific checker result is persisted as one immutable, content-addressed JSON object containing its **complete F5 claims array**, verdict, kind, source quote, note, counts, score, model/version/settings and separate session provenance. The GitHub event commits the output object, an input-bound receipt and a state transition in **one non-force CAS Git commit**. Resume replays and checks every reference before choosing the next unfinished substep.
- **Blind independent checkers:** `checker1` and `checker2` receive the same input block with the same pinned model/reasoning settings but **different session IDs**. The `checker2` task contains **none** of checker1's verdicts or output. The runtime must additionally enforce isolated contexts (a public Git artifact cannot itself enforce that the agent did not look at history).
- **Third run:** the existing `engine.vote_source` identifies ONLY disagreement units; the third checker gets only those units, the original source context and a new independent session.
- **Adjudication/review:** three distinct answers go to stronger-model adjudication; every final ALTERED/REVERSED unit requires stronger-model review, even after a majority vote. The stronger-model task includes the **original source, target units and their neighbors, all checker verdicts and quoted evidence, and the provisional vote**; the founder task carries the full flagged claims and dissent notes. A review dissent is preserved and cannot silently flip the verdict.
- **Founder gate:** corrected/flagged units remain `awaiting_explicit_founder_decision`. The module **never** manufactures human approvals or considers a green numeric score a substitute for the founder's decision. Page edits and scientific rechecks still follow canonical Part 3b separately.
- **POOLED:** every source is its own one-call `SOURCE` input. The framework does NOT impose the two-checker source vote on POOLED. It returns `awaiting_existing_engine_merge`, using the existing `--merge` operation.
- **Return to the ORIGINAL engine:** `restore_engine_files(...)` reconstructs `input-src<k>.json`, `out-src<k>-1.json`, `-2.json`, optional `-3.json`, plus per-source `adjudicate.json`/`review.json` under the original file naming convention; the caller can then run the canonical `des_fidelity_units.py --vote DIR` or `--merge DIR`. No re-scoring merely because a different agent resumes.
- **Changed input/spec:** an altered source/unit set/prompt cannot silently reuse earlier results. `invalidate_source` records a scoped invalidation; other sources in the same publication are preserved. A new versioned source run must be explicitly created for changed inputs.

## Verification

The feature-branch GitHub Actions suite runs `tests/test_dentcast_fidelity_resume.py` and `tests/test_dentcast_github_memory.py` alongside all previous tests and the canonical-slice/contract auditor. Cases include 72/72 complete units across Claude -> Cursor, no first-output leak, 71/72 rejection, source quote/fingerprint tampering, repeat-session/model mismatch, disagreement-only third run, all-three-different adjudication, stronger reviewer dissent, explicit founder gate, POOLED exception, crash/resume and reconstruction into the unchanged engine's exact filenames, and scoped invalidation. **163 tests passed** on commit `834eac11fa0c3cd8e7c9bbb3ced45b56778ab1b8`, including new reviewer-context and run-discovery assertions: https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/38802171848. Canonical source contract audit reported zero issues.

## Privacy and remaining gates

**This repository is public.** Full source text, paper material, patient cases, clinical notes and raw scientific outputs can be committed to Git history and cannot be erased by deleting files. The Stage 5 GitHub writer REQUIRES a nonempty externally reviewed public-release approval digest before storing any full input block or F5 result. **A supplied digest is only an attestation and is NOT cryptographic proof of founder consent.** Do not upload any real content until its release status is independently verified. For anything non-public or licensed, STOP: use an appropriate approved private storage mechanism, not this public Git mechanism. Staging tests use fictional public-safe data only.

This is **checkpoint/recovery infrastructure**, not proof the models actually ran, interpreted articles correctly, preserved blindness outside the dispatched task, or that the full site publishes equivalently. Real three-agent runtime execution, incident/concurrency recovery on the actual provider environment, external founder-approval verification, comprehensive semantic parity and final publication safeguards remain Stages 6–8.

**Stage 4 and 5 completed and committed on `refactor/publishing-modular-workflow` only. No merge, publication, deployment, DES/Fidelity scientific engine edit or router activation.**
