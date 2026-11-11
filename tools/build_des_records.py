#!/usr/bin/env python3
"""Split plus/des-scores.json into one small file per content_id.

plus/des-scores.json is the DES store (workflow step 4.13): one object keyed by
content_id, about 3 MB. Every article page used to download all of it to draw
one record (plus/js/des.js); this builder writes each record on its own to

    plus/des/<content_id>.json      e.g. plus/des/insight/insight-106.json

so a page fetches only its own (a few KB). A content_id with no record has no
file, and des.js reads the 404 as "nothing to draw" — the absence rule, as data.

plus/des-scores.json stays the ONLY file the agent writes (step 4.13,
tools/des_fidelity_units.py --install, the queue's installer) and the source
of every other reader (the DES board, the library, Phase F). This builder is
the only writer under plus/des/: each output is the source's record, byte for
byte as json.dumps renders it (no derived field, no reordering), and a file
whose content_id has left the source is deleted. Never hand-edit plus/des/.

Runs in the post-Push-2 runner's C.8 (module 11, step 8) and in the post-merge
net (.github/workflows/sitemap_only.yml). Idempotent: an unchanged source
writes nothing.

    python3 tools/build_des_records.py          # write / prune
    python3 tools/build_des_records.py --check  # exit 1 if plus/des/ is stale
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "plus/des-scores.json"
OUT_DIR = "plus/des"

# A content_id is a page path without the leading "/" and ".html". Anything
# else would be a path this builder must not write (traversal, absolute paths).
CONTENT_ID = re.compile(r"[a-z0-9][a-z0-9_-]*(?:/[A-Za-z0-9][A-Za-z0-9_.-]*)*")


def render(record) -> str:
    return json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n"


def plan(root: Path) -> tuple[dict[str, str], list[str]]:
    """Return ({relative path: content} to write, [relative paths] to delete)."""
    data = json.loads((root / SOURCE).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit(f"{SOURCE}: expected an object keyed by content_id")
    want: dict[str, str] = {}
    for cid, record in data.items():
        if not CONTENT_ID.fullmatch(cid) or ".." in cid:
            raise SystemExit(f"{SOURCE}: refusing content_id {cid!r} (not a page path)")
        want[f"{OUT_DIR}/{cid}.json"] = render(record)
    out = root / OUT_DIR
    have = sorted(p.relative_to(root).as_posix() for p in out.rglob("*.json")) if out.is_dir() else []
    stale = [p for p in have if p not in want]
    write = {p: c for p, c in want.items()
             if not (root / p).is_file() or (root / p).read_text(encoding="utf-8") != c}
    return write, stale


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="report drift, write nothing")
    ap.add_argument("--root", type=Path, default=ROOT)
    args = ap.parse_args(argv)
    root = args.root.resolve()
    write, stale = plan(root)
    if args.check:
        for p in sorted(write):
            print(f"STALE {p}")
        for p in stale:
            print(f"ORPHAN {p}")
        if write or stale:
            print(f"plus/des/ is out of date with {SOURCE}: run python3 tools/build_des_records.py",
                  file=sys.stderr)
            return 1
        print(f"plus/des/ matches {SOURCE}")
        return 0
    for p, content in write.items():
        dest = root / p
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
    for p in stale:
        (root / p).unlink()
    # Directories a pruned record leaves empty go with it.
    out = root / OUT_DIR
    if out.is_dir():
        for d in sorted((x for x in out.rglob("*") if x.is_dir()), key=lambda x: len(x.parts), reverse=True):
            if not any(d.iterdir()):
                d.rmdir()
    print(f"plus/des/: {len(write)} written, {len(stale)} removed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
