# Per-step delivery follow-up

Owner instruction: each publication step must commit/push its work together
with the fixed handoff, and another agent must recover from GitHub.
This follow-up is separate from the five delivered repair stages.

| Stage | Scope | Status |
|---|---|---|
| 1 | Mandatory per-step commit/push and confirmed-delivery barrier | Implemented; tests and CI verified in the stage commit report |
| 2 | Simplify handoff around semantic progress, decisions, external outcomes and next action; derive Git facts from Git | Pending |
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
