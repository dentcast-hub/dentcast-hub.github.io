# Sitemap `lastmod` — Diagnosis Handoff

**Status: RESOLVED 2026-08-13.** The founder picked **option (A)** from §6
(content-date semantics) and it is implemented — see **§8** for exactly what
shipped and what was measured. §§1–7 below are kept verbatim as the record of
the diagnosis and of the option that was rejected; read §8 for current
behavior.

**History of this document.** It was written after a candidate fix (option B,
the one-line repair) was tried on 2026-08-13, produced a worse sitemap (§4),
and was reverted at the founder's own instruction — the work was stopped
because the reasoning behind it had not been explained, not because it had
gone wrong. `main` carried zero changes from that attempt; everything in §8
was written fresh against the diagnosis below.

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

---

## 8. What shipped (option A, 2026-08-13)

`lastmod` now comes from **the page's own JSON-LD** — `dateModified`, falling
back to `datePublished` — and from git **only** for a page that carries
neither. Four changes in `.github/scripts/gen_sitemap.py`, nothing else
touched:

1. `read_canonical_and_robots()` → **`read_page_meta()`**, which returns the
   content date alongside the canonical and the robots value. It costs no
   extra I/O: the function was already reading each page's `<head>`, and every
   JSON-LD date in the tree lives inside it (checked across all 789 pages —
   516 in `<head>`, **zero** in the body).
2. `get_date(path, content_date)` prefers the content date; the git map and the
   `_dirty` = TODAY fallback are now reachable **only** when there is none.
   That is the §7 constraint: a dirty content page already holds, in the
   working tree, the exact date CI will read after the commit, so guessing
   TODAY on top of it could only disagree with it.
3. The §2 key-mismatch is repaired (`"/" + line not in dates`) so the fallback
   genuinely means latest-commit. Option (B) was rejected as a *semantic*, not
   as a repair — the 32 pages that use it are the hubs, which a site-wide
   sweep legitimately does change.
4. The run now prints the JSON-LD/git split and lists every git-dated page, so
   the fallback set can never grow silently.

**Measured on the regenerated sitemaps:**

- **32** pages fall back to git — the exact 32 §5 predicted, no more.
- **559** take their own content date.
- The URL set is byte-identical before/after (556 `.org` + 35 `.ir`); **every
  single changed line is a `<lastmod>`** — 387 dates moved on `.org`, 26 on
  `.ir`.
- **290 distinct dates** across 556 URLs — the §4 failure (555 of 556 sharing
  one day) does not recur. Largest single day is 80 pages, a genuine batch
  publish.
- Spot checks: `/` → `2026-08-13` (git; the homepage really did change today),
  `/chairside/chairside-32.html` → `2026-08-13` (its publish date),
  `/chairside/chairside-1.html` → `2026-02-10` (its own date, no longer reset
  by today's chrome sweep).

**The §3.2 corrective CI commit stops for content pages** by construction: the
JSON-LD date is committed content, so the sitemap generated locally before the
publish commit and the one CI regenerates after it read the same value. The 32
git-dated pages converge too — dirty → TODAY locally, latest-commit → today in
CI.

`tools/verify_publish.py chairside/chairside-32` is green (80 passed, 0 failed)
and both sitemaps are LF.

**Known, pre-existing, deliberately NOT touched here:**
`python3 tools/asset_version.py --check` fails on `main` with
`/pillar/premium-index.js: manifest says v=21, pages stamp v=16`. It predates
this work (verified against a clean tree) and fixing it rewrites every page —
out of scope for a sitemap change. It needs its own commit.
