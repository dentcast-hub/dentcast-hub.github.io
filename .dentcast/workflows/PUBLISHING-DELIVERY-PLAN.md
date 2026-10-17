# Per-step delivery follow-up

Owner instruction: each publication step must commit/push its work together
with the fixed handoff, and another agent must recover from GitHub.
This follow-up is separate from the five delivered repair stages.

| Stage | Scope | Status |
|---|---|---|
| 1 | Mandatory per-step commit/push and confirmed-delivery barrier | Implemented; tests and CI verified in the stage commit report |
| 2 | Simplify handoff around semantic progress, decisions, external outcomes and next action; derive Git facts from Git | Implemented in v2; compact verification evidence retained; validation below |
| 3 | Discover active handoffs on GitHub branches; handle missing/multiple candidates without newest-branch guessing | Pending |
| 4 | Full delivery/discovery/recovery acceptance and report | Pending |

Stage 1 changes the shared live protocol used by all client entrypoints. The
writer blocks advancement until the current checkpoint/work is on the freshly
observed origin branch. It rejects batching step boundaries through `record`.
Failed pushes and remote outages keep work local and block progression; they
do not prevent recording a blocker. The helper never commits or pushes itself.
First-step initialization, same-step progress/evidence updates and invalidation
remain possible; end-of-step delivery is required by the protocol and checked
before the subsequent step. This does not claim every arbitrary client obeys
instructions or every direct filesystem write is intercepted.

Validation includes ten new tests using real local Git/bare remotes, covering
unpushed/uncommitted checkpoints, exact delivered handoffs, genuinely unavailable
remotes despite cached upstream, stale delivered versions, bulk-record bypasses,
combined finish/start, blocker recording, dirty work and the Stop delivery guard. Existing verifier tests
now deliver their boundary checkpoints before invoking the gate. No scientific
engine, legacy snapshot, actual publication content or main merge is changed.

Local validation: 75 checkpoint/lifecycle/delivery/recovery tests, 8 active
entrypoint/migration checks and 6 Node advisory checks passed (89 total).
GitHub Actions for the stage commit separately verifies the same groups and
the committed-state guard; its result is reported after the push.

## Stage 2

The v2 handoff omits current HEAD, porcelain status, index entries and remote
observations. Publication decisions, approvals, full ordered step evidence,
external outcomes and blockers survive unchanged. Repository/branch identity,
workflow source reference and expected file/workflow fingerprints remain to
check identity and invalidate stale evidence; these are not a saved latest-SHA
or synchronization claim. Git supplies current facts at inspection and delivery.

Before a checkpoint is committed, same-checkout comparisons use a private
Git-observation cache containing no semantic publication state. New checkouts
reconstruct facts from the exact delivered checkpoint in Git without that cache.
Unknown/missing work still blocks and stage 1's fresh delivery barrier remains.
Structured v1 files are read unchanged; explicit records upgrade to v2 under
normal reconciliation rules. Inspection remains read-only. Confirmed cleanup
also removes the observation cache. Active handoff discovery across GitHub
branches is stage 3, not supplied by this change.

Stage 2 local validation: 84 Python checkpoint/lifecycle/delivery/compact/recovery
tests, 8 active-entrypoint/migration checks and 6 Node checks passed (98 total).
Nine compact-format tests cover omitted Git facts, semantic/unknown-outcome
preservation, reconstruction without a cache, dirty-work detection after cache
loss, later work commits after the checkpoint, cache baseline binding, v1 read
and explicit upgrade, canonical smaller encoding and ignored required inputs.
Cleanup acceptance also verifies removal of the local observation cache.
