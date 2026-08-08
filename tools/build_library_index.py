#!/usr/bin/env python3
"""Build plus/library-index.json — the paper cabinet's PUBLIC index.

Two jobs, and the second is the reason this file exists.

1. SIZE. The cabinet page used to fetch `dentcast_cabinet_full_catalog.json`
   whole: 6 MB, 2200 papers, thirty fields each — abstracts, author lists,
   resolution metadata, local filesystem paths — in order to render seven of
   them (title, journal, type, topic, tags, and two links). Every visitor paid
   for all of it before the first card appeared. The index below carries only
   what the page actually draws and lands around 350 KB.

2. THE LINKS. The full catalogue carries `drive_view` / `drive_download` /
   `drive_id` for all 2181 matched papers, so publishing it to the browser
   published every paper's Drive URL to every visitor, subscriber or not. There
   was no gate anywhere in that path — the page is static and the JSON is
   public, so "premium" could never have meant anything here.

   The index therefore carries NO `drive_*` field at all. A link is resolved one
   at a time, on demand, by `GET /library/paper/:id` in plus-api, which is where
   the subscription check and the free allowance live. `id` is the only handle
   the browser gets, and an id is useless without the API.

WHAT THIS DOES NOT FIX, and must not be described as fixing: the master
catalogue is still a file in a PUBLIC repository, and git history keeps every
version of it forever. Anyone who goes looking on GitHub still finds the URLs,
and a Drive file shared by link stays reachable to anyone holding that link.
This builder closes the site-side hole (the page stops broadcasting 2181 URLs to
every visitor) and makes access measurable and revocable going forward; it
cannot un-publish what is already public. The only durable fix is on the Drive
side — stop sharing the folder by link and have the API mint short-lived URLs
with a service account. See the note in `.dentcast/workflows/README.md` step 4.10.

The master catalogue at the repo root stays exactly as it is: it is the
publishing workflow's source of truth (step 4.10 appends to it) and the API's
own copy of the link map. Only what the BROWSER receives changes.

Usage:
    python3 tools/build_library_index.py            # write plus/library-index.json
    python3 tools/build_library_index.py --check    # exit 1 if it is stale
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "dentcast_cabinet_full_catalog.json"
OUT = ROOT / "plus" / "library-index.json"

# Exactly the fields dentcast_cabinet_search.html renders, under the short keys
# it already uses internally. Anything not listed is deliberately withheld —
# adding a field here publishes it to every visitor, so the default is "no".
#
# `id` is new to the browser and is the whole point: it is the handle the page
# hands back to GET /library/paper/:id, and it reveals nothing on its own.


def paper_row(p: dict) -> dict | None:
    pid = (p.get("id") or "").strip()
    if not pid:
        return None
    title = (p.get("display_title") or p.get("real_title") or p.get("title") or "").strip()
    if not title:
        return None
    row = {
        "id": pid,
        "t": title,
        "tp": (p.get("topic") or "").strip(),
        "ty": (p.get("type") or "").strip(),
        "j": (p.get("journal") or "").strip(),
        "tg": [t for t in (p.get("tags") or []) if isinstance(t, str)],
    }
    # Whether a paper HAS a file is public (the button has to be drawable);
    # WHERE that file is, is not.
    row["f"] = 1 if (p.get("drive_id") or p.get("drive_download") or p.get("drive_view")) else 0
    return row


def build() -> dict:
    raw = json.loads(CATALOG.read_text(encoding="utf-8"))
    papers = raw.get("papers") if isinstance(raw, dict) else raw
    rows = [r for r in (paper_row(p) for p in papers) if r]
    seen: set[str] = set()
    unique = []
    for r in rows:
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        unique.append(r)
    # Sorted by id so the output is byte-stable: an unchanged catalogue must
    # produce an unchanged file, or --check flaps and every build churns the
    # cache-buster stamp for nothing.
    unique.sort(key=lambda r: r["id"])
    return {"schema_version": 1, "count": len(unique), "papers": unique}


def dump(doc: dict) -> str:
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail if the index is stale")
    args = ap.parse_args()

    if not CATALOG.exists():
        print(f"[library-index] missing {CATALOG}", file=sys.stderr)
        return 1

    doc = build()
    text = dump(doc)

    # A leak here would be silent and permanent, so it is asserted rather than
    # trusted: no output row may carry anything that looks like a Drive handle.
    blob = json.dumps(doc, ensure_ascii=False)
    for needle in ("drive.google.com", "drive_id", "drive_view", "drive_download", "local_path"):
        if needle in blob:
            print(f"[library-index] REFUSING: output contains {needle!r}", file=sys.stderr)
            return 1

    if args.check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != text:
            print("[library-index] STALE - run: python3 tools/build_library_index.py", file=sys.stderr)
            return 1
        print(f"OK - plus/library-index.json is current ({doc['count']} papers).")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    kb = len(text.encode("utf-8")) / 1024
    print(f"[library-index] wrote {OUT.relative_to(ROOT)} - {doc['count']} papers, {kb:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
