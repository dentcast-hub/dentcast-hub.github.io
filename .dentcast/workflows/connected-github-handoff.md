# Connected GitHub handoff compiler — Phase 2

This is a no-checkout *metadata-only* compiler and validator. It does not
perform science, approve content, execute a publication action, upload Drive,
commit files, publish a site or create synthetic evidence. The first Push is
a required durability checkpoint, NOT an agent-switch or forced stop.

## Portable implementations

1. tools/dentcast_connected_state.py runs in a Python code execution context
   with the canonical dentcast_publish_handoff and
   dentcast_publish_lifecycle source modules loaded; it never calls Git,
   scans a checkout, opens a file or uses a network/credential.
   It imports the **original** 52-step plan, transition contract,
   publication validator and exact v3 renderer.
2. tools/dentcast_connected_wire.mjs is import-free pure ECMAScript without
   Node dependencies, filesystem, Git or network APIs. It contains a
   mechanically mirrored envelope plan and outputs exactly the canonical
   v3 UTF-8 handoff. The live contracts CI compares every plan row and
   the complete wire bytes against the authoritative Python renderer.
   A connected agent must load the library source into an execution
   runtime; merely connecting GitHub does not execute JavaScript.

## Safe execution sequence

1. Read the actual feature branch HEAD, any PR state, all required active
   workflow sources and approval/asset prerequisites. Hold immutable source
   hashes, branch name and expected HEAD in the *private* run context.
   Detect existing active handoff before creating a new one.
2. Start a new full 52-step pending ledger (not a two-step example) via
   Python start() or JS newPublication(). Record real steps only through
   update_step() / updateStep(): started BEFORE action, completed AFTER
   actual evidence, skipped only with documented canonical reason.
   Neither module performs the action or supplies approvals.
3. Bind every external action and its outcome, required founder approval
   and source reference to the real context. The Python library enforces
   preservation of approval decisions, validated external outcomes and
   unchanged input references in update_context(). JS-only clients must
   perform the same reconciliation when modifying context; do not rewrite
   an approved decision or silently change source inputs.
4. At C.4.9 materialize the exact v3 Markdown+JSON by compile_cut1()
   after checking source hashes, expected HEAD, byte inventory and
   pending decisions. JS renderCut1() handles the wire codec, but the
   **calling agent** must also check remote source revision and every
   actual target byte. The compiler cannot prove that supplied evidence
   references represent genuine completed work.
5. Transfer real page/image/links/handoff bytes using GitHub Git-Data
   blobs, one tree, one commit with a single expected parent and a
   non-force ref update. Freshly verify remote HEAD/tree/path SHA/blob
   bytes. Only then proceed to C.4.10.1. Continuing in the same agent
   is normal; handoff to Work/Cursor is optional.
6. On a new agent, read and parse the actual committed handoff, check
   source identity and real file bytes, honor pending approvals, and
   resume the next unfinished canonical step. A found handoff is not
   proof of completed clinical work.

## Boundaries

- Only page-creating first-cut publications are supported here;
  paper-only/legacy use their existing rules.
- The exact v3 handoff schema remains unchanged; DES/Fidelity and
  scientific validators are not altered.
- This phase establishes a no-shell compiler and parity tests; it is
  NOT an end-to-end connector-only first Push, clinical workflow test,
  or tested cold-agent recovery. Those are the next phase.
- The runtime must have the portable adapter source available; if it
  cannot execute code or transfer actual WebP bytes, report BLOCKED.
- No secret, private document body or full transcript belongs in a
  public handoff. Only reviewed public-safe references and decisions.

## CI

Run:
python3 -m unittest discover -s tests -p test_dentcast_publish_connected_state.py -v
python3 -m unittest discover -s tests -p test_dentcast_publish_connected_wire.py -v

The JS parity test is a strict byte comparison including Persian Unicode
and emoji. Canonical plan drift is a test failure, not an opportunity to
relax or silently duplicate the publication logic.
