#!/usr/bin/env python3
"""Mirror the homepage's critical Plus-card CSS from plus/plus.css into index.html.

WHY THIS EXISTS
The homepage's signed-out invitation card (#dcPlusHomeCard) ships as STATIC
markup in index.html so it is painted on the first frame — by the browser's
own parser, with no JavaScript involved. That is what a crawler sees, and it
is what removes the ~288px layout shift the card used to cause when
plus/js/home-card.js injected it after plus.js had downloaded (2026-08-12 CLS
review: that single insertion was the largest contributor to the homepage's
CLS of ~0.20, against Google's 0.1 "good" threshold).

Static markup alone is not enough, though: the rules that size that card live
in plus/plus.css, which dc-nav.js injects asynchronously. Markup without its
CSS paints unstyled and then re-lays-out when the stylesheet lands — trading
one shift for another. So the handful of rules the card actually needs are
inlined into index.html's <head> as critical CSS.

Two copies of a stylesheet is a maintenance hazard, and these particular rules
are actively redesigned. So the copy is GENERATED, never written by hand:
plus/plus.css stays the single source of truth, the regions the homepage needs
are fenced there with `/* @home-critical */ … /* @end-home-critical */`, and
this script copies them verbatim into index.html between its own markers.
`--check` makes drift a CI failure instead of a silent visual bug.

The `--dcp-*` tokens are part of the mirrored region, but their VALUES resolve
through the site-wide tokens (--ac, --txt, --card-bg, …) that index.html
already defines for both themes — so dark mode needs no special handling here.

Usage:
    python3 tools/build_home_critical_css.py            # regenerate
    python3 tools/build_home_critical_css.py --check    # CI gate
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "plus" / "plus.css"
TARGET = ROOT / "index.html"

REGION_RE = re.compile(
    r"/\* @home-critical \*/\n(.*?)\n?/\* @end-home-critical \*/", re.S
)
BEGIN = "/* @generated from plus/plus.css — do not edit; see tools/build_home_critical_css.py */"
END = "/* @end-generated */"
# `(.*?)` may be empty — that is the state of a freshly-added block.
BLOCK_RE = re.compile(
    re.escape(BEGIN) + r"\n(.*?)\s*" + re.escape(END), re.S
)


def extract() -> str:
    css = SOURCE.read_text(encoding="utf-8")
    regions = REGION_RE.findall(css)
    if not regions:
        sys.exit("no @home-critical regions found in plus/plus.css — nothing to mirror")
    return "\n\n".join(r.strip() for r in regions)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="verify only; exit 1 when out of sync")
    args = ap.parse_args()

    wanted = extract()
    html = TARGET.read_text(encoding="utf-8")

    m = BLOCK_RE.search(html)
    if not m:
        sys.exit(
            "index.html carries no generated block. Add:\n"
            f"  <style id=\"dcHomeCriticalCss\">\n{BEGIN}\n{END}\n  </style>"
        )

    current = m.group(1).strip()
    if current == wanted.strip():
        print(f"OK - index.html mirrors {len(REGION_RE.findall(SOURCE.read_text(encoding='utf-8')))} "
              f"@home-critical region(s) from plus/plus.css.")
        return

    if args.check:
        print("index.html's critical CSS is STALE — plus/plus.css changed under a "
              "@home-critical marker but the mirror was not regenerated.")
        print("Fix with:  python3 tools/build_home_critical_css.py")
        sys.exit(1)

    html = html[: m.start(1)] + wanted + html[m.end(1) :]
    TARGET.write_text(html, encoding="utf-8")
    print(f"Wrote {len(wanted.splitlines())} lines of critical CSS into index.html.")


if __name__ == "__main__":
    main()
