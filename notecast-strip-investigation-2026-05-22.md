# NoteCast Topbar/Player Strip — Forensic Investigation

**Date:** 2026-05-22
**Scope:** Git-history forensic on the 29 NoteCast leaves flagged as missing `dc-topbar` and player.
**Outcome:** Single commit identified as the strip event. Blast radius extends beyond NoteCast. Verbatim restoration is structurally safe.

---

## TL;DR

- **Strip commit:** `8080fd2` *"theme"* — Thu May 21 2026 20:07:17 +0330
- **Last complete state (pre-strip):** `728b45b` *"color"* — Thu May 21 2026 14:02:08 +0330 (~6 hours earlier)
- **Original topbar add commit:** `8c6cbb3` *"mass production"* — Thu May 8 2026 22:30:55 +0330 (touched 240 files, +14,139 lines)
- **Files in stable state for:** ~13 days (May 8 → May 21) before being demolished.
- **Subsequent `e344292` "revert"** (May 21 23:57) only touched `index.html` — **did not restore any NoteCast file.**
- **Historical NoteCast topbar markup is byte-identical to the current site-wide canonical topbar** (MD5 `e9a446c5b15…`). Verbatim restoration produces a topbar that matches today's site exactly — no need to "modernise" the markup.

## Blast radius of `8080fd2`

Total: 47 files touched, 2,690 insertions, 6,245 deletions.

**Catastrophically stripped (30 files — main damage):**

```
dentcast-plus/video-6.html      499 → 416 lines (-115 +31, net -84)
notecast/episode-3.html         scope deleted (-380+ lines)
notecast/episode-4.html         scope deleted (-575+ lines, worst)
notecast/episode-5.html         scope deleted (-500+ lines)
notecast/episode-8.html         scope deleted (-470+ lines)
notecast/episode-9.html         scope deleted (-310+ lines)
notecast/episode-10.html        373 → 283 lines, dc-topbar:8→0, audio:2→0
notecast/episode-11.html
notecast/episode-12.html
notecast/episode-13.html
notecast/episode-14.html
notecast/episode-15.html        378 → 291 lines, dc-topbar:8→0, audio:2→0
notecast/episode-16.html
notecast/episode-17.html
notecast/episode-18.html
notecast/episode-19.html
notecast/episode-20.html
notecast/episode-21.html        383 → 100 lines (most damaged — 74% deleted)
                                Removed: dc-topbar:8→0, audio:1→0,
                                JSON-LD:2→0, canonical:1→0, hreflang:3→0,
                                all og:*, twitter:*
notecast/episode-22.html        (largest absolute diff — 596 lines changed)
notecast/episode-23.html
notecast/episode-24.html
notecast/episode-25.html
notecast/episode-26.html
notecast/episode-27.html
notecast/episode-28.html
notecast/episode-29.html
notecast/episode-30.html
notecast/episode-31.html
notecast/episode-32.html
notecast/episode-33.html
```

**Cosmetically touched (17 files — small theme tweaks, ~18-22 lines each, not the structural damage):**

```
index.html (-6 +0 net),
chairside/index.html, dentai/index.html, dentcast-plus/index.html,
episodes.html, glossary/index.html, insight/index.html,
litecast/index.html, metanotes/index.html, notecast/index.html,
sharehub/index.html
metanotes/en/meta-1.html … meta-5.html (3-line additions each)
dc-nav.js (+45 lines)
```

So the same commit that legitimately changed theme tokens in section indexes also rewrote 30 leaf pages and threw away their structural scaffolding. That mixed-scope behaviour is the signature of a model that was asked to "fix the theme" and decided to "fix" the page templates while it was there.

## What was actually removed from each NoteCast leaf (verified on episode-21)

Lines deleted by `8080fd2` from `notecast/episode-21.html` include:

```
- <link rel="canonical" href="https://dentcast.org/notecast/episode-21.html">
- <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/...">
- <link rel="alternate" hreflang="fa" ...>
- <link rel="alternate" hreflang="x-default" ...>
- <script type="application/ld+json"> ... </script>   (×2 blocks)
- <meta property="og:type" content="article">
- <meta property="og:locale" content="fa_IR">
- <meta property="og:site_name" content="DentCast">
- <meta property="og:title" ...>
- <meta property="og:description" ...>
- <meta property="og:url" ...>
- <meta property="og:image" ...>
- <meta property="og:image:width" content="1200">
- <meta property="og:image:height" content="630">
- twitter:* meta block
- <header class="dc-topbar"> … entire block
- <div id="dcToolbarDrawer"> … entire block
- <div id="dcRadarOverlay"> … entire block
- <audio controls preload="none"> … the player
- AudioObject JSON-LD subnode with contentUrl + duration
```

Every signal that tells search engines or users where they are, what the content is, or how to get back to the rest of the site was removed in a single commit.

## The 3 surviving NoteCast leaves

`notecast/episode-2.html`, `episode-6.html`, `episode-7.html` (and `notecast/index.html`) still have `dc-topbar`. Their topbar markup is **functionally identical** to the canonical site-wide topbar — the only diff is a single trailing blank line:

```
MD5 of canonical topbar (glossary/bond-strength.html, lines 213-242):  e9a446c5b15…
MD5 of historical pre-strip topbar (notecast/episode-10.html @ 728b45b): e9a446c5b15…  ← byte-identical
MD5 of surviving notecast/episode-2.html topbar:                        97b5d4f31d…  ← differs by 1 blank line
```

So the 3 survivors are *older* than the strip; they were skipped by the strip commit but were never updated to match the current canonical. Their topbar is structurally fine, just slightly out-of-sync.

## Does the historical NoteCast topbar match today's canonical?

**Yes, byte-identical.** The dc-topbar block in `notecast/episode-10.html` at commit `728b45b` is bit-for-bit the same as the current dc-topbar block in `glossary/bond-strength.html`. This means:

- Restoring from `728b45b` does not introduce drift against the rest of the site.
- No need to splice in a modern topbar — the historical one *is* the modern one.

## Was the schema type correct historically?

Historical schema types on `notecast/episode-10.html @ 728b45b`:

```
PodcastEpisode, AudioObject, PodcastSeries, BreadcrumbList, ListItem
```

This is the **same** schema type the file had before and the same as today's `/episodes/episode-N.html`. **The historical NoteCast schema was always `PodcastEpisode`, never `Article`.** So restoring from history will *not* fix the schema-type-vs-intent issue raised in the previous SEO audit (§2.2 — "NoteCast should be `Article` with `isBasedOn → /episodes/episode-N.html`"). That remains a separate decision after restoration.

## Other sections — was the same pattern applied elsewhere?

Spot-checked git history of representative leaves:

```
metanotes/meta-1.html       — no 8080fd2 in topbar history. Untouched.
litecast/lite-CAST1.html    — no 8080fd2 in topbar history. Untouched.
chairside/chairside-1.html  — no 8080fd2 in topbar history. Untouched.
```

Currently-missing `dc-topbar` sites in the entire repo:

```
episodes/index.html            ← intentional (meta-refresh redirect stub, noindex)
dentcast-plus/video-6.html     ← same 8080fd2 strip event, single casualty in this section
notecast/episode-3,4,5,8,9     ← the strip
notecast/episode-10..33        ← the strip
```

So the strip is confined to `notecast/` + one leaf in `dentcast-plus/`. No silent damage detected in metanotes, litecast, chairside, glossary, episodes, insight, photocast, dentai, sharehub leaves.

## Why the `e344292 "revert"` did not help

Commit `e344292` ("revert") landed at 2026-05-21 23:57 — about 4 hours after the strip — but its `--stat` shows only:

```
 index.html | 9 +++------
 1 file changed, 3 insertions(+), 6 deletions(-)
```

It reverted something in `index.html` only. No NoteCast or `dentcast-plus/video-6` file was touched. The naming suggests intent to undo, but the scope was narrow.

## Recommendation

**Restore verbatim from `728b45b` (the parent of `8080fd2`).** Rationale:

1. The historical topbar markup is byte-identical to the current site-wide canonical. There is nothing to "modernise" — restoring the old version *is* the modern version.
2. The historical files contain not just the topbar but also: canonical, hreflang, JSON-LD, og:*, twitter:*, audio player, drawer markup, radar overlay markup. Restoring at the file level (vs. splicing only the topbar) brings all of these back as a unit.
3. The schema type stays `PodcastEpisode`. If you want `Article` with `isBasedOn` (the change recommended in the prior SEO audit), that's a deliberate follow-up — not something to bundle into the restoration step.
4. The 3 surviving NoteCast leaves (`episode-2/6/7.html`) have a slightly older topbar variant (one extra blank line) — also worth normalising in the same operation so the whole NoteCast floor matches.

**Concrete operation when you decide to proceed:**

```bash
# from repo root, dry-run first
for n in 3 4 5 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33; do
  git show 728b45b:notecast/episode-$n.html > /tmp/restore_$n.html
done
# review /tmp/restore_*.html, diff against current, then move into place
# dentcast-plus/video-6.html follows the same pattern from the same parent commit
```

**Do not** include any commits between `728b45b` and `HEAD` in the restoration step except `8080fd2` itself (which is what we're undoing). The intermediate "revert" affected only `index.html`, so it doesn't interact.

**Open decisions before restoring** (not blockers, but worth deciding once):

- (a) Restore `728b45b` verbatim, accepting the `PodcastEpisode` schema duplication with the canonical `/episodes/` page → fastest, restores everything that was lost.
- (b) Restore `728b45b` verbatim **then** in a follow-up commit switch each NoteCast `@type: PodcastEpisode` to `Article` + `isBasedOn → /episodes/episode-N.html` → fixes the schema-vs-intent issue from the prior audit at the same time. This is the cleaner end-state but separates concerns into two commits.

(a) is the "stop the bleeding" move; (b) is the "leave the floor better than you found it" move. Pick based on appetite.
