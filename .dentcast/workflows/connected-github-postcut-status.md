# Connected GitHub publication after the first cut — capability boundary

At `C.4.9`, the connected-only Python `update_step()` and import-free JS
`updateStep()` deliberately stop; both have only first-cut step transition
contracts. They do **not** implement or replace the canonical steps from
`C.4.10.1` through DES/Fidelity, publisher approvals, Phase F or cleanup.

This is a **capability limit**, not a mandatory stop or a mandatory agent
switch: the SAME Work/Claude/other agent may continue without interruption if
it has the fully functional canonical checkout/CLI, source access and genuine
scientific/author approvals, after verified first remote Push. A GitHub-only
agent without these capabilities must report **BLOCKED** for subsequent steps
rather than fabricate receipts, bypass independent reviewers or remove the
`C.4.9` guard. Handing the work to an enabled agent is a user choice, not
a new fourth Push or a routine workflow obligation.

Supporting verified, connector-only Push 2/3 end-to-end would require
authoritative post-cut lifecycle transitions, immutable GitHub read-back,
real DES/Fidelity invocation and review evidence, builder/Phase F execution
on actual final bytes, final receipt and correct handoff cleanup. This
substantial extension is **not delivered or accepted here**. Do not claim
connector-only end-to-end availability on the strength of first-cut metadata
and fake transport tests.

## Acceptance evidence limits

- Real connected GitHub test-branch delivery + fresh-agent recovery: NOT RUN.
  It needs separate explicit user approval for a safe test branch.
- Canonical vs Fast Local measurement: run
  `python3 -m unittest discover -s tests -p test_dentcast_publish_matched_probe.py -v`.
  Both paths use an identical isolated local Git fixture and record actual
  elapsed time, local Git calls, file-info invocations and snapshot calls.
  The unit probe is not a full publication, does not measure tokens and is
  not reliable evidence of real-world publishing speed improvement.

DES/Fidelity, the three fixed delivery boundaries and all human approval
requirements remain exactly as specified in the live workflow.
