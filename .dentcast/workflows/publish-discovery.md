# Find an interrupted publication on GitHub

Use this active shared procedure only after the user explicitly says a publication is incomplete/interrupted or asks to resume one while explicitly identifying it as incomplete/interrupted. A generic «ادامه بده» alone does not trigger recovery. At recovery, read an existing local `.dentcast/PUBLISH-HANDOFF.md` once and preserve dirty/local-only work; during that recovery do not reread it. If the handoff is missing, follow the discovery steps below. Discovery does not transfer local-only work.
Do not choose the newest-named, newest-created or most recently committed branch.
The active fixed handoff and its recorded run identity determine candidates.

## CLI

From a checkout with these tools:

```bash
python3 tools/dentcast_publish_handoff.py discover --recover-incomplete
```

Or name the repository explicitly; this does not require a Git checkout:

```bash
python3 tools/dentcast_publish_handoff.py discover --recover-incomplete --repository dentcast-hub/dentcast-hub.github.io
```

The standalone tools still need to be available locally to execute Python.
The default transport uses GitHub REST with a 15-second per-request timeout.
For an already configured GitHub token, add `--token-env GH_TOKEN` (or the
actual configured variable name). Do not put a token on the command line or
in the handoff. Unauthenticated API limits are often insufficient: this repo
had 600 branches at stage 3 validation. Authentication/rate/network failure
means incomplete discovery, not absence. Connected GitHub-only agents can use
the equivalent reads below through their existing connection instead.

## Complete, stable selection

1. Read every page of `GET /repos/{owner}/{repo}/branches?per_page=100&page=N`
   until a page has fewer than 100 rows. Keep the observed branch-name/head-SHA
   map during discovery, not in the handoff. The helper bounds the scan at
   1,000 branches; exceeding that bound blocks rather than truncating results.
2. At each observed **immutable head SHA**, read
   `GET /repos/{owner}/{repo}/contents/.dentcast/PUBLISH-HANDOFF.md?ref={sha}`.
   A confirmed 404 for this Contents read means no file at that observed head.
   A listing failure, permission/rate-limit error or unknown response does not.
   For a file whose Contents encoding is `none`, read its immutable
   `GET /repos/{owner}/{repo}/git/blobs/{blob_sha}` and check identity/size. Do
   not follow arbitrary download URLs. The handoff size limit is 2 MiB.
   Before treating missing-path 404s as absence, the helper verifies repository
   content-read access using an observed `GET /repos/{owner}/{repo}/git/commits/{sha}`.
   Metadata-only access or an unverified content permission blocks discovery.
3. Validate the canonical v1/v2 file and full step plan. Its recorded repository
   and branch must match the containing repository/branch. A malformed file or
   handoff inherited on a different branch is reported and blocks selection;
   do not silently ignore, rebind, overwrite or delete it.
4. Read the complete branch list again and compare names **and** head SHAs.
   Added/deleted/advanced branches or incomplete pagination require a fresh
   discovery. This is an observation, not a lock against future pushes.
5. Only a complete stable scan with exactly one valid candidate and no errors
   returns `handoff_found` with `selected`. It includes the observed latest
   `head_sha`, immutable handoff URL/digest, semantic publication state and next
   step. Multiple candidates return blocked with no selection; use the user's
   publication context to resolve which run they mean instead of guessing.
6. A complete stable scan with no files returns `not_found`. This proves only
   absence at the observed remote branch heads; local-only/unpushed work,
   another repository, deleted branches or unavailable inputs may still exist.
   Do not invent a checkpoint or claim the publication finished.

`discovery_complete` and `selected` must be checked. Partial candidates in a
blocked/incomplete result are not authorization to resume. CLI exit 2 means
blocked; exit 0 can mean `not_found` and never means publication success.

## Retrieve and verify before continuing

Read the selected immutable handoff, not a copy from main or an old checkout.
Preserve existing local work. Retrieve the selected branch into an appropriate
fresh checkout (or another isolated checkout using the normal Git workflow),
then verify its actual HEAD equals the observed `head_sha`. If it differs,
refresh discovery/reconcile the new state rather than force-resetting work.
Use the matching named branch so the recorded branch identity remains intact.
In a single-branch clone (the usual cloud session) run
`git remote set-branches --add origin <branch>`, `git fetch origin <branch>` and
`git switch --track origin/<branch>`, then deepen a shallow clone. Continue and
push on that branch, not on the session's own new `ccr-*` branch. Copying the
work to a new branch leaves the original active handoff behind as a second run.
If the session may push only its own branch, stop and report that instead.

Run `inspect --check-remote` in that checkout. Verify file/workflow fingerprints,
required inputs, completed evidence, approvals and external outcomes. An
ambiguous upload/notification must be reconciled before retry. Read the active
modular workflow and continue the first unfinished canonical step only when
its prerequisites hold. Preserve the recorded delivery policy. New page runs
deliver exactly after `C.4.9`, then after `C.6` for new v2 editorial-locked publications (or `C.4.13` for a v1-only in-flight publication with its original order), and after
final work, Phase F and G. Cuts 1/2 include work and latest handoff; cut 3 combines
final work, completion receipt and handoff deletion. Intermediate progress,
stops and external-action receipts stay local; do not add another push.
Pre-policy interrupted runs and paper-only retain their compatibility path. Discovery never switches branches, fetches, writes a
handoff, publishes, performs external actions, or certifies semantic completion.

All agents use this shared procedure through `publish-handoff.md` and
`publish-checkpoints.md`. Native hook execution remains client-dependent;
the explicit discovery/inspection protocol is required regardless of hooks.
