#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Apply approved glossary back-links. The ONLY writer in the cross-link pass.

Reads the JSON that `cross_link_candidates.py --json` produced and wraps each
approved occurrence in an `<a>`. It never edits text: the anchor goes around a
run of characters that is already on the page, and every file is verified —
strip all tags, compare the rendered string to what it was before — BEFORE it is
written. A file that would fail is not written at all.

    python3 tools/cross_link_apply.py cand.json --dry-run       # show, write nothing
    python3 tools/cross_link_apply.py cand.json                 # apply the AUTO rows
    python3 tools/cross_link_apply.py cand.json \
        --approve insight/insight-9:dental-implant              # + a founder-approved ASK
    python3 tools/cross_link_apply.py cand.json --slug abutment # one term at a time

Why this exists rather than an agent editing 37 files by hand: the anchor has to
land on one exact occurrence — not the first one, not a suffixed one, not one
inside an existing link or a heading — and every one of those mistakes renders
as plausible HTML that a diff review waves through.
"""

import argparse
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))

from cross_link_candidates import BOX, REL, fold_map  # noqa: E402


def rendered(html):
    """What a reader sees. Must be byte-identical before and after."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


def locate(doc, surface, occurrence):
    """Byte range of the Nth anchorable occurrence of `surface` in doc's body.

    Anchorable = inside a body box, outside every existing <a>, outside every
    heading. Masked regions are blanked to \\x00 rather than removed so that
    every offset stays valid in the real document — the same reason
    cross_link_candidates.fold_map carries an index map.
    """
    body_only = REL.sub(lambda m: "\x00" * len(m.group(0)), doc)
    want = fold_map(surface)[0]
    seen = 0
    for box in BOX.finditer(body_only):
        seg = doc[box.start():box.end()]
        masked = re.sub(r"<a\b.*?</a>", lambda m: "\x00" * len(m.group(0)), seg, flags=re.S)
        masked = re.sub(r"<h[1-6]\b.*?</h[1-6]>", lambda m: "\x00" * len(m.group(0)), masked, flags=re.S)
        masked = re.sub(r"<[^>]+>", lambda m: "\x00" * len(m.group(0)), masked)
        folded, origin = fold_map(masked)
        k = folded.find(want)
        while k >= 0:
            start = box.start() + origin[k]
            end = box.start() + origin[k + len(want) - 1] + 1
            if "\x00" not in doc[start:end]:
                seen += 1
                if seen == occurrence:
                    return start, end
            k = folded.find(want, k + 1)
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("candidates", help="the JSON from cross_link_candidates.py --json")
    ap.add_argument("--dry-run", action="store_true", help="report what would change; write nothing")
    ap.add_argument("--slug", action="append", help="restrict to these glossary slugs (repeatable)")
    ap.add_argument("--approve", action="append", default=[], metavar="CID:SLUG",
                    help="also apply this ASK row, which the founder approved (repeatable)")
    args = ap.parse_args()

    rows = json.load(io.open(args.candidates, encoding="utf-8"))
    approved = set(args.approve)
    if args.slug:
        rows = [r for r in rows if r["slug"] in set(args.slug)]

    todo, held = [], []
    for r in rows:
        key = "%s:%s" % (r["content_id"], r["slug"])
        (todo if r["verdict"] == "AUTO" or key in approved else held).append(r)

    unknown = approved - {"%s:%s" % (r["content_id"], r["slug"]) for r in rows}
    for k in sorted(unknown):
        sys.stderr.write("warning: --approve %s matches no candidate\n" % k)

    # group per file so a page with two links is written once and verified once
    by_file = {}
    for r in todo:
        by_file.setdefault(r["content_id"] + ".html", []).append(r)

    changed, failed = 0, 0
    for path, group in sorted(by_file.items()):
        full = os.path.join(ROOT, path)
        doc = io.open(full, encoding="utf-8").read()
        before = rendered(doc)
        edits = []
        for r in group:
            span = locate(doc, r["surface"], r["occurrence"])
            if span is None:
                sys.stderr.write("FAIL %s: occurrence %d of «%s» not found — re-run the "
                                 "candidate generator, the page has moved on\n"
                                 % (path, r["occurrence"], r["surface"]))
                failed += 1
                edits = None
                break
            if doc[span[0]:span[1]] != r["surface"]:
                sys.stderr.write("FAIL %s: expected «%s», found «%s»\n"
                                 % (path, r["surface"], doc[span[0]:span[1]]))
                failed += 1
                edits = None
                break
            edits.append((span, r["slug"], doc[span[0]:span[1]]))
        if not edits:
            continue

        for (start, end), slug, _ in sorted(edits, reverse=True):   # right to left
            doc = (doc[:start] + '<a href="/glossary/%s.html">' % slug
                   + doc[start:end] + "</a>" + doc[end:])

        if rendered(doc) != before:
            sys.stderr.write("FAIL %s: rendered text changed — NOT written\n" % path)
            failed += 1
            continue

        # print the captured surface: the spans are stale once inserted
        for _span, slug, surface in edits:
            print("%-34s → %-28s «%s»" % (path, slug, surface))
        if not args.dry_run:
            io.open(full, "w", encoding="utf-8").write(doc)
        changed += 1

    print("\n%s %d file(s), %d anchor(s)%s"
          % ("would change" if args.dry_run else "changed", changed, len(todo),
             "" if not failed else "  — %d FAILED, see stderr" % failed))
    if held:
        print("%d candidate(s) held for a founder verdict (ASK, not approved here)" % len(held))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
