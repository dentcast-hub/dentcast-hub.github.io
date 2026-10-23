# Fast Local → First Push: connected delivery (infrastructure only)

The canonical source of truth remains publish-checkpoints.md, the active 12
modules and the unchanged DES/Fidelity engine. This transport adapter never
marks a scientific step completed, grants consent or supplies model receipts.

## Mode and boundary

1. Preflight exactly once: identify the scoped page publication and its feature
   branch/immutable head, conflicting active handoff, applicable full modules,
   available GitHub read/write/blob/tree/commit/ref tools, actual asset bytes
   and approvals. Do not start heavy authoring in BLOCKED mode.
2. Run all canonical actions 0 through C.4.9 in LOCAL_CLI/Work without
   repeat-loading unchanged sources; persist started/result evidence after each
   action with the **existing** local helper. Do not add a discretionary push.
   Revalidate changed rules, inputs or branch, not unchanged snapshots by habit.
3. At cut 1, the **existing** helper must have produced a valid
   .dentcast/PUBLISH-HANDOFF.md (schema publish-handoff-v3) with the entire
   canonical plan; its structural validation is not evidence that semantic
   actions were executed. Keep later steps pending.
4. Assemble an exact changed-file inventory of UTF-8 page, required WebP
   bytes, links/navigation files and the handoff. Use a single GitHub
   Git-Data operation sequence: GET branch HEAD/tree → POST all missing
   blobs → POST tree → POST one commit with the saved head as its only
   parent → fresh GET HEAD → PATCH ref with force=false and an expected
   head lease where supported → GET HEAD/tree and blob bytes again.
   On changed ref, ambiguous HTTP outcome or byte mismatch, STOP and
   reconcile; no blind retry, no force push, no Contents API per-file commits.
5. Continue at C.4.10.1 (or the first applicable remaining canonical step)
   only when the remote read-back confirms the actual delivery. Run DES/
   Fidelity, final builders, Phase F, third cut under the unchanged contracts.

The Python adapter tools/dentcast_connected_first_push.py executes the Git
data protocol from a byte manifest when a Python runtime and GH_TOKEN exist.
It validates a **previously generated** canonical handoff, so it is not a
portable handoff compiler for a shell-less ChatGPT connector. In a connector
session the same GitHub blob/tree/commit/update_ref tools exist, but a full
GitHub-only authoring + canonical-state implementation is NOT YET validated.
Never declare the end-to-end GitHub-only acceptance test passed on the strength
of a transport-unit fixture. This stage deliberately does not activate a new
mode or weaken any live publishing guard.

CLI (feature branch only, from a checkout with the canonical handoff already
generated, using absolute paths to staged byte files in a private manifest):

    GH_TOKEN=... python3 tools/dentcast_connected_first_push.py \
      --branch content/my-new-page --expected-head <40-hex-SHA> \
      --manifest /private/path/first-cut.json --max-blob-bytes <actual-tool-limit>

The manifest is a JSON object mapping *repository paths* (including the
handoff) to *local absolute paths* containing the exact finished bytes.
Keep private staging paths and credentials out of public Git. Its validator
accepts only paths in the canonical target_paths plus the handoff.

## Tests and unresolved engineering stages

- tests/test_dentcast_connected_first_push.py tests binary payloads,
  canonical cut state, one commit, moved-ref, active-handoff and negative gates
  against a fake Git backend. These are deterministic transport tests, NOT
  independent scientific reviewers or a genuine GitHub remote run.
- Next: measured before/after baseline, durable fast-local WAL or equivalent
  per-step persistence with valid recovery, portable canonical-state compiler,
  a **real connector-only** test branch delivery and cold-agent resume.
- Never bump or edit DES/Fidelity spec as part of this optimization. If those
  files have an independent inconsistency, fix it separately with its own
  scientific version decision and tests.
