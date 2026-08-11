#!/usr/bin/env python3
"""Strip hidden FAQPage / #flashcards DefinedTermSet JSON-LD out of page
markup. The content was already extracted verbatim into
plus/faq-corpus.json by tools/faq_corpus_extract.py — this script only
deletes it from the page. Nothing else in the file changes: every other
JSON-LD node and every byte of visible HTML is left untouched.

See .dentcast/faq-schema-removal-handoff.md Phase 5.

Usage:
    python3 tools/strip_faq_schema.py <path> [<path> ...]
    python3 tools/strip_faq_schema.py --all
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {"node_modules", "plus-api"}
EXCLUDE_FILES = {"mockup-home.html"}

LDJSON_RE = re.compile(
    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)


def iter_html_files():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if rel.name in EXCLUDE_FILES:
            continue
        yield path


def is_target_node(node) -> bool:
    """Same predicate as faq_corpus_extract.py's extraction filter, so the
    set of nodes stripped here is exactly the set already archived there."""
    if not isinstance(node, dict):
        return False
    t = node.get("@type")
    if t == "FAQPage" and isinstance(node.get("mainEntity"), list):
        return True
    if (
        t == "DefinedTermSet"
        and isinstance(node.get("hasDefinedTerm"), list)
        and "#flashcards" in str(node.get("@id", ""))
    ):
        return True
    return False


def strip_html(html: str, path_for_warnings: str):
    """Return (new_html, changed). Never touches text outside the exact
    <script type="application/ld+json"> spans being deleted or rewritten."""
    # (start, end, replacement) — end is exclusive; replacement '' deletes.
    edits = []
    changed = False

    for m in LDJSON_RE.finditer(html):
        raw = m.group(1)
        try:
            parsed = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            print(f"WARN: unparseable ld+json in {path_for_warnings}, leaving block untouched")
            continue

        if isinstance(parsed, dict) and isinstance(parsed.get("@graph"), list):
            graph = parsed["@graph"]
            new_graph = [n for n in graph if not is_target_node(n)]
            if len(new_graph) == len(graph):
                continue  # nothing to remove in this block
            changed = True
            if not new_graph:
                # Never observed in the current corpus (every @graph mixing a
                # FAQ/flashcards node also carries other nodes), but handled
                # safely: delete the whole script element rather than leave
                # an empty "@graph": [].
                edits.append((m.start(), _end_with_newline(html, m.end()), ""))
            else:
                new_parsed = dict(parsed)
                new_parsed["@graph"] = new_graph
                new_json = json.dumps(new_parsed, ensure_ascii=False, indent=2)
                edits.append((m.start(1), m.end(1), f"\n{new_json}\n"))
        elif isinstance(parsed, dict):
            if is_target_node(parsed):
                changed = True
                edits.append((m.start(), _end_with_newline(html, m.end()), ""))
        elif isinstance(parsed, list):
            new_list = [n for n in parsed if not is_target_node(n)]
            if len(new_list) == len(parsed):
                continue
            changed = True
            if not new_list:
                edits.append((m.start(), _end_with_newline(html, m.end()), ""))
            else:
                new_json = json.dumps(new_list, ensure_ascii=False, indent=2)
                edits.append((m.start(1), m.end(1), f"\n{new_json}\n"))
        # else: not a shape this script (or the extractor) understands — leave it.

    if not changed:
        return html, False

    new_html = html
    for start, end, replacement in sorted(edits, key=lambda e: e[0], reverse=True):
        new_html = new_html[:start] + replacement + new_html[end:]
    return new_html, True


def _end_with_newline(html: str, end: int) -> int:
    """Extend a whole-script deletion span to consume one trailing newline,
    so removing a block doesn't leave a blank line behind."""
    if html[end : end + 2] == "\r\n":
        return end + 2
    if html[end : end + 1] == "\n":
        return end + 1
    return end


def process(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    new_html, changed = strip_html(html, str(path.relative_to(ROOT)))
    if changed:
        path.write_text(new_html, encoding="utf-8")
    return changed


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", help="one or more page paths")
    ap.add_argument("--all", action="store_true", help="sweep every page site-wide")
    args = ap.parse_args()

    if not args.all and not args.paths:
        ap.error("pass one or more paths, or --all")

    targets = list(iter_html_files()) if args.all else [Path(p).resolve() for p in args.paths]

    touched = 0
    for path in targets:
        if process(path):
            touched += 1
            print(f"stripped: {path.relative_to(ROOT)}")

    print(f"{touched}/{len(targets)} file(s) modified.")


if __name__ == "__main__":
    main()
