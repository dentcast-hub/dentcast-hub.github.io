#!/usr/bin/env python3
"""
build_upboard_index.py — the catalog behind /up-board/
======================================================
Writes `up-board/index.json`: one small record per publishable item, in the
order they were published.

Run from the project root (no arguments):
    python3 tools/build_upboard_index.py

Sources read (never modified):
    dentcast-brain.json          — the item list, its titles and its ORDER
    <each item's own page>       — for "datePublished" in the page's JSON-LD

Output:
    up-board/index.json

WHY THIS FILE EXISTS AT ALL
---------------------------
/up-board/ shows one list of everything, in two arrangements. The "بالاترین"
arrangement comes from the API (GET /votes/board returns ids and numbers, never
a catalog — that is what lets a title change without an API deploy). This file
is the other half: the id → title/type/url/date the page needs to draw a row,
plus the recency order the "تازه‌ترین" arrangement is.

Two things it deliberately does NOT do:

  · It does not carry hearts. Those live in the API and change by the minute; a
    number baked into a static file would be wrong within the hour and would
    make every publish look like a vote count changed.
  · It does not decide any ordering except recency. Ranking is the API's job.

WHERE THE RECENCY ORDER COMES FROM
----------------------------------
The brain array itself. Every publish appends its entry at the END (CLAUDE.md
rule 4 — the homepage "latest content" widget depends on it), and because the
array is a single flat list with the types interleaved, its index IS the global
publication order across every type. That is the only place on the site that
knows how a NoteCast and a Chairside sort against each other; a per-type list
cannot answer it, and neither can the pillar sidecars.

Dates are read from each page's own JSON-LD `datePublished`, which is the only
place a date exists (same as build_pillar.py, whose helpers this reuses rather
than re-implementing — one regex for both builders, so they can never disagree
about what a date is). The date is for DISPLAY only: an item whose page carries
no date still keeps its exact position in the order above, and simply renders
without a date chip. Sorting by the date instead would quietly drop those items
to one end of the list.

The Persian label is baked in at build time, exactly as the pillar pages do it
and for the same reason: it is a static file, and converting a calendar in the
browser is work every reader would repeat for all 443 rows.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

# The date reader and the Jalali formatter are build_pillar.py's. Importing them
# keeps ONE definition of "what a publication date is" in the repo: if that regex
# ever has to change (a template change, a second JSON-LD block), both builders
# change with it and neither is left quietly reading something else.
from build_pillar import page_date, jalali_label  # noqa: E402

OUT = ROOT / "up-board" / "index.json"

# The brain has grown two schemas, and a row must not care which one an entry
# happens to use:
#
#   · the page link is `page_url` on most entries and `url` on the NoteCast and
#     ShareHub ones (36 + 13 items — every one of which would silently vanish
#     from the board if only the first key were read);
#   · `type` is missing entirely on the 202 oldest podcast entries, which carry
#     an `episode` key instead, while the 8 newest ones in the SAME folder do
#     carry `type: "dentcast"`.
#
# So the type is derived from the URL's FOLDER rather than read off the entry.
# The folder is the one thing every entry has, it has never changed schema, and
# it is what the reader actually sees — which also means the two podcast
# vintages land in one group without either of them being edited.
FOLDER_TYPE = {
    "episodes": "dentcast",
    "insight": "clinical",
    "metanotes": "meta",
    "dentai/promptologist": "promptologist",
    "dentcast-plus": "dentcast_plus",
    # Everything else names its own type: notecast, chairside, dentai, litecast,
    # sharehub, photocast.
}


def folder_of(url: str) -> str:
    """The grouping folder for a root-relative page URL. Two segments only where
    the second is itself a section (`/dentai/promptologist/`), never deeper."""
    parts = url.lstrip("/").split("/")
    if len(parts) > 2 and parts[0] == "dentai" and parts[1] == "promptologist":
        return "dentai/promptologist"
    return parts[0]


# What each type is called on a row. Names are the site's own — the type chips on
# the homepage and in the archive use exactly these — so a reader never meets a
# label here that appears nowhere else.
TYPE_FA = {
    "notecast": "NoteCast",
    "clinical": "Clinical Insight",
    "chairside": "چیرساید",
    "dentai": "DentAI",
    "meta": "MetaNote",
    "litecast": "لایت‌کست",
    "sharehub": "ShareHub",
    "promptologist": "پرامپتولوژیست",
    "photocast": "PhotoCast",
    "dentcast": "اپیزود",
    "dentcast_plus": "دنت‌کست پلاس",
}


def content_id(page_url: str) -> str:
    """
    The id the API and the client agree on: the page's own path, minus the
    leading slash and the `.html`. Must stay identical to detectContentId() in
    plus/js/config.js — a heart cast on the article page and a row on the board
    are the same item only because these two produce the same string.
    """
    return page_url.lstrip("/").removesuffix(".html")


def main() -> int:
    brain = json.loads((ROOT / "dentcast-brain.json").read_text(encoding="utf-8"))

    items = []
    undated = 0
    for entry in brain:
        url = entry.get("page_url") or entry.get("url")
        title = entry.get("title")
        # An entry with no page is not a row: the board links to something.
        if not url or not title or not url.startswith("/"):
            continue
        etype = FOLDER_TYPE.get(folder_of(url), folder_of(url))
        iso = page_date(url)
        if not iso:
            undated += 1
        items.append({
            "id": content_id(url),
            "u": url,
            "t": etype,
            "tf": TYPE_FA.get(etype, etype),
            "ti": title,
            # Display only — the ORDER is this list's own order (see the module
            # docstring). Empty string, never a guessed date.
            "d": jalali_label(iso),
        })

    # Newest first, which is the order the page shows and therefore the order it
    # should not have to reverse on every load. The brain appends, so this is one
    # reversal of the source rather than a sort — nothing is compared, so items
    # that share a day keep the sequence they were published in.
    items.reverse()

    types = sorted({i["t"] for i in items})
    payload = {
        "version": 1,
        "count": len(items),
        # The filter chips are built from this rather than from a hardcoded list,
        # so a new content type appears on the board the day it first publishes.
        "types": [{"key": t, "fa": TYPE_FA.get(t, t)} for t in types],
        "items": items,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    size_kb = OUT.stat().st_size / 1024
    print(f"up-board/index.json: {len(items)} items, {len(types)} types, {size_kb:.0f} KB")
    if undated:
        print(f"  {undated} without a datePublished (position kept, no date chip)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
