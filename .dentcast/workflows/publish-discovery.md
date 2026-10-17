# Find an interrupted publication on GitHub

Use this active shared procedure for «انتشار ناقص داشتم», "resume publishing"
and equivalent requests when work must be recovered from GitHub or the local
fixed handoff is missing. First read any local `.dentcast/PUBLISH-HANDOFF.md`
and preserve dirty/local-only work. Discovery does not transfer that work.
Do not choose the newest-named, newest-created or most recently committed branch.
The active fixed handoff and its recorded run identity determine candidates.

## CLI

From a checkout with these tools:

```bash
python3 tools/dentcast_publish_handoff.py discover
```

Or name the repository explicitly; this does not require a Git checkout:

```bash
python3 tools/dentcast_publish_handoff.py discover --repository dentcast-hub/dentcast-hub.github.io
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

Run `inspect --check-remote` in that checkout. Verify file/workflow fingerprints,
required inputs, completed evidence, approvals and external outcomes. An
ambiguous upload/notification must be reconciled before retry. Read the active
modular workflow and continue the first unfinished canonical step only when
its prerequisites hold. The mandatory per-step commit/push barrier still
applies. Discovery never switches branches, fetches, writes a handoff, publishes,
performs external actions, or certifies semantic completion.

All agents use this shared procedure through `publish-handoff.md` and
`publish-checkpoints.md`. Native hook execution remains client-dependent;
the explicit discovery/inspection protocol is required regardless of hooks.
