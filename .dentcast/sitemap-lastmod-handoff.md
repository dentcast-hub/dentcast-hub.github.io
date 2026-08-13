# Sitemap `lastmod` — Diagnosis Handoff

**Status:** diagnosed and measured, **NOT decided, NOT fixed.** A candidate fix
was tried on 2026-08-13, produced a worse sitemap (see §4), and was fully
reverted — `main` carries zero changes from this investigation. The founder
stopped the work to review this document first. **No agent may change
`gen_sitemap.py`'s date behavior until the founder picks an option in §6**
(«اگر جایی شک داشتی سوال کن عمل نکن»).

**Where things stand on `main` (verified 2026-08-13):**
`.github/scripts/gen_sitemap.py` and both sitemaps are untouched — the buggy
behavior described below is still live. The only related change that DID land
is unrelated to dates: commit `a9af6791f` ("Keep /up-board/ out of the
hreflang cluster").

---

## 1. The bug (one sentence)

`gen_sitemap.py` intends `lastmod` = the file's **latest** git commit date, but
a key-mismatch in its parser makes it keep the **oldest** commit date instead —
and the "dirty file = today" fallback that sits on top of it then guarantees a
corrective CI commit after every publish.

## 2. Where it is

`.github/scripts/gen_sitemap.py`, the loop that builds the `dates` map from
`git log --format=%cd --date=format:%Y-%m-%d --diff-filter=AM --name-only -- *.html`:

```python
dates = {}
current_date = ""
for line in result.stdout.splitlines():
    line = line.strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", line):
        current_date = line
    elif line.endswith(".html") and line not in dates:   # <-- the bug
        dates["/" + line] = current_date
```

The membership test checks the **bare** path (`line`, e.g. `index.html`) but
the map stores the **"/"-prefixed** key (`/index.html`). So `line not in dates`
is always true, every older commit **overwrites** the newer one as the log
streams newest→oldest, and the final value per file is its **first-ever**
commit date.

## 3. Observable consequences (all verified 2026-08-13)

1. **Wrong dates in the live sitemap.** e.g. `https://dentcast.org/` carries
   `lastmod 2025-11-02` and `/chairside/` carries `2026-02-10`, while both
   files' latest commit was 2026-08-13.
2. **A corrective CI commit races every publish.** `get_date()` returns TODAY
   for files with uncommitted changes (the `_dirty` set). During a publish the
   touched pages are dirty → local sitemap says today; after the commit lands,
   CI regenerates → the bug says "oldest date" → the two disagree → the
   `sitemap_only` workflow pushes `chore: auto-generate sitemap + plus index
   [skip ci]` (e.g. `879854a34` right after the chairside-32 publish
   `7d21ce160`). The comment block above `_dirty` in the script says this
   fallback was added to PREVENT exactly that second racing push — the bug
   defeats it.

## 4. The candidate fix that was tried and WHY it was reverted

The one-line repair (test `"/" + line not in dates`, keep the first = newest
occurrence) works mechanically, but the regenerated sitemap came out with
**555 of 556 URLs stamped `2026-08-13`** — because commit `b070cc8a2` (a
site-wide header-icon sweep, same day) had touched every page. "Latest commit"
is the wrong semantic for this repo: any site-wide chrome/asset sweep resets
every page's `lastmod`, and a sitemap where all URLs share one date is noise
Google learns to distrust. Reverted in full; nothing committed.

## 5. Measured input for the decision (2026-08-13)

Coverage of a content-date alternative was measured across all indexable
`.org` pages (has a `dentcast.org` canonical, not noindexed):

- **557** indexable pages total
- **525** carry a JSON-LD `dateModified`/`datePublished` (every published
  content page — the publish workflow stamps both, equal, on every page)
- **32** carry no JSON-LD date: the hubs/landing pages (`index.html`,
  `about.html`, `episodes.html`, every `{type}/index.html`, every
  `pillar/*/index.html`, `pillar/index.html`, `plus/pricing.html`,
  `tools/episodes_template.html`) and the six `dentcast-plus/video-*.html`
  pages.

## 6. Options for the founder (pick one; none is pre-approved)

- **(A) Content-date semantics** — `lastmod` from the page's own JSON-LD
  `dateModified`, git-latest-commit only as fallback for the 32 dateless
  pages. Dates stay varied and meaningful; chrome sweeps stop resetting them;
  the CI corrective commit disappears for content pages. Cost: a real change
  to `gen_sitemap.py` (the JSON-LD read; `build_pillar.py` already has date
  helpers `build_upboard_index.py` reuses) + a one-time ~500-line `lastmod`
  diff.
- **(B) Latest-commit semantics** — the one-line fix as tried. Honest to git,
  ends the CI race, but every site-wide sweep stamps all pages with one date
  (the §4 result).
- **(C) Leave as is** — oldest-commit dates (semantically wrong but varied)
  plus one auto CI commit after each publish. Zero work, known cost.

## 7. Constraints for whoever executes

- Whatever option is chosen: regenerate BOTH sitemaps, normalize line endings
  to LF (the Windows builders emit CRLF; committed files are LF), re-run
  `python tools/stamp-version.py` last, and run
  `python3 tools/verify_publish.py <last-published-content-id>` to confirm the
  gate stays green before pushing.
- Do not touch the up-board/hreflang guard (`a9af6791f`) — separate, already
  shipped.
- The `_dirty` = TODAY fallback interacts with the chosen semantic: under (A)
  it should only apply to the 32 fallback pages; under (B) keep it as is.
  Think this through in the implementation, but the SEMANTIC choice itself is
  the founder's, not the implementer's.
