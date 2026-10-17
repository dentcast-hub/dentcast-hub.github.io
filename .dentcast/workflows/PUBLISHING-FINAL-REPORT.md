# Modular publication and recovery — implementation acceptance

All five original repair stages and all four delivery follow-up stages are
implemented on `fix/publishing-resume-contract`. They have not been merged into
main. Clients using an older main checkout continue to see its older rules.
No content publication was performed by this repair.

## Resulting behavior

- AGENTS, CLAUDE and Cursor route through the same active shared rules and full
  applicable modules. Legacy snapshots are backups, not execution authority.
- `.dentcast/PUBLISH-HANDOFF.md` is the sole public temporary publication state.
  Its name is fixed. It records semantic progress, decisions, approvals, input
  references, validation evidence, external outcomes, blockers and next action.
  Current Git facts come from Git; compact identity/fingerprints remain evidence.
- After every canonical step, scoped work and the current handoff are committed
  together and pushed. The next step requires a fresh origin observation proving
  the latest exact handoff/work was delivered. Failed/unknown delivery blocks
  advancement. The helper observes delivery; the agent performs commit/push.
- For remote recovery, `discover` scans all GitHub branch pages at immutable
  head SHAs, validates handoff identity/plan and rechecks the full head map.
  A unique valid candidate supplies its observed latest SHA and handoff URL.
  Multiple/invalid files, incomplete scans or changed heads block selection.
  Branch recency is never a selection rule. The receiving checkout must still
  match that SHA and pass inspection before continuation.
- Completion requires resolved applicable work/approvals, real mechanical gate,
  delivery evidence and a delivered checkpoint. `finish` prepares recoverable
  cleanup; only after the deletion is committed/pushed and `confirm-cleanup`
  succeeds is completion reported. Interrupted cleanup restores the same file.

Read [the live contract](publish-handoff.md), [per-step protocol](publish-checkpoints.md)
and [discovery/retrieval procedure](publish-discovery.md) for execution.

## Integrated acceptance

`tests/test_dentcast_publish_integration.py` uses separate production CLI
processes, two actual Git checkouts and a local bare remote. Git reports a
GitHub run identity while a per-checkout URL rewrite sends all Git traffic to
that local remote. The discovery transport reads API-shaped responses from
actual bare-repository objects; the production selector is unchanged. These
are local integration tests, not live GitHub positive-publication tests.

| Integrated scenario | Verified boundary |
|---|---|
| Complete synthetic paper-only lifecycle | Every canonical step runs through started/completed CLI updates and scoped commit/push; discovery finds the actual branch/head; another clone matches SHA/digest and resumes the next unfinished step; actual catalog gate, report and confirmed cleanup succeed; final fresh-clone CI guard passes |
| Real push rejected by local pre-receive hook | Local checkpoint preserved; next step blocked; remote discovery finds no unpushed run; after delivery succeeds a receiving clone recovers it |
| Unknown external outcome transferred | Discovery and receiving inspection retain the unknown receipt; explicit retry and raw-record bypass both blocked until outcome reconciliation |
| Cleanup interrupted before delivery | Completion remains false; restore recreates the same fixed handoff with cleanup_pending and preserves existing external receipts |

These tests seed no completed scientific ledger. They use the actual CLI to
advance the five paper-only checkpoints, with explicitly synthetic metadata
and operator receipts. No Drive upload occurred. The real catalog gate checks
identity/link structure and the recorded receipt, not the truth of an upload.
Other tests exercise the unchanged page verifier rejecting incomplete content.
No positive full-page publication, scientific review, live deployment or real
notification was performed.

Integration exposed and fixed two issues:

1. Starting/restarting a step with a started/unknown external outcome is now
   rejected, including attempted transitions through raw `record` input.
   Recording a blocker or reconciling a verified outcome remains possible.
2. Once the exact handoff is committed, its Git commit supersedes the old local
   pre-commit index observation. The loader still compares expected fingerprints
   and uses the commit that wrote the checkpoint, so later work commits/dirty
   edits remain visible. A successful work+handoff commit no longer requires a
   redundant metadata rewrite just to refresh its own Git observation.

## Verification evidence

125 local checks passed: 111 Python checkpoint/lifecycle/discovery/compact/
integration/recovery tests, 8 active-entrypoint/source-migration checks and
6 Node advisory checks. GitHub Actions for the stage commit runs those groups
and the committed-state guard; its actual result is reported after the push.
Local Node uses `--experimental-test-isolation=none` because this environment
restricts Node child-process creation; GitHub uses the normal Node 22 runner.

The stage 3 live connected-GitHub scan observed 600 branch heads, checked the
fixed path at all 600 immutable heads, verified content-read access and compared
the complete head map again. No active handoff was found at those observed
heads. The recorded responses also passed through the production selector.
The standalone Python HTTP transport has controlled-response tests; no live
configured-token run or positive handoff was fabricated on GitHub.

No legacy backup, scientific model algorithm or production verifier was changed.
Changes are publication instructions, recovery helpers, hooks/CI and tests.

## Operational limits

The explicit shared protocol is mandatory for all agents following repository
instructions. No file can force every arbitrary client to load those rules.
Actual Cursor/Claude/Codex native sessions were not launched here; hook JSON is
not runtime proof. Direct native adapter processes and installed-hook tests
are covered. Each checkout needs `git config core.hooksPath .githooks` for the
Git hook; GitHub API commits bypass local hooks and retain the same contract.

Agents must verify scientific meaning, private inputs, approvals and actual
external outcomes. Hashes and fixture receipts cannot do that. Unpushed work
cannot be recovered by a GitHub-only agent. GitHub API access/rate limits and
the 1,000-branch scan bound block incomplete discovery. Windows locking is
implemented but not runtime-tested. A real authorized full publication and
native-client observation remain operational evidence to collect later.

Main integration is a separate action. Until it is authorized and completed,
use the repair branch to inspect these instructions and implementations.
