#!/usr/bin/env python3
"""Mark every English mirror page (`{type}/en/{file}.html`) noindex.

The en mirrors are AI-generated translations that ship without editorial
review. At ~170 pages that is exactly the "scaled, unreviewed content"
pattern Google's 2026 spam updates target, so per the 2026-08-11 SEO audit
they are removed from search entirely: `noindex, follow` robots meta here,
no hreflang cluster membership (.github/scripts/inject_hreflang.py), and
gen_sitemap.py drops noindexed pages on its own. The fa↔en toggle is a
reader feature and is untouched — the pages stay live for humans.

Idempotent: a page already carrying noindex is left alone. `--check` exits
non-zero if any en page is missing it (for CI / verify passes).

Run from the repo root:  python3 tools/noindex_en_mirrors.py [--check]
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {"node_modules", "plus-api"}

NOINDEX_CONTENT = "noindex, follow"
ROBOTS_RE = re.compile(r'<meta\s+name="robots"\s+content="([^"]*)"\s*/?>')


def iter_en_pages():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if "en" in rel.parts[:-1]:
            yield path, rel.as_posix()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="verify only; exit 1 if any en page is indexable")
    args = ap.parse_args()

    modified, ok, missing = [], 0, []
    for path, rel in iter_en_pages():
        html = path.read_text(encoding="utf-8")
        m = ROBOTS_RE.search(html)
        if m and "noindex" in m.group(1):
            ok += 1
            continue
        if args.check:
            missing.append(rel)
            continue
        if m:
            new_html = html[: m.start()] + f'<meta name="robots" content="{NOINDEX_CONTENT}">' + html[m.end() :]
        else:
            canonical = re.search(r'<link\s+rel="canonical"[^>]*>', html)
            if not canonical:
                print(f"WARN: {rel} has neither robots meta nor canonical — left untouched")
                continue
            new_html = (
                html[: canonical.end()]
                + f'\n<meta name="robots" content="{NOINDEX_CONTENT}">'
                + html[canonical.end() :]
            )
        path.write_text(new_html, encoding="utf-8")
        modified.append(rel)

    if args.check:
        print(f"{ok} en page(s) noindexed, {len(missing)} missing it.")
        for rel in missing:
            print(f"  FAIL: {rel}")
        sys.exit(1 if missing else 0)

    print(f"{len(modified)} page(s) marked noindex, {ok} already were.")


if __name__ == "__main__":
    main()
