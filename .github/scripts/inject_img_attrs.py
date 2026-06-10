#!/usr/bin/env python3
"""Backfill <img> attributes across the site (idempotent).

For every *.html page:
  1. width/height  — added (from the actual file on disk, via Pillow) when BOTH
     are missing and the src resolves to a local image. Gives the browser the
     intrinsic aspect-ratio up front so the layout doesn't shift when the
     image arrives (CLS). The zero-specificity img guard in dc-theme.css
     (`:where(...) img { max-width:100%; height:auto }`) keeps these attrs
     from ever distorting a responsive image.
  2. alt           — added as alt="" (decorative) when missing entirely, so
     screen readers don't announce raw filenames. Content images that deserve
     a real description still need one written by hand.
  3. loading/decoding — loading="lazy" decoding="async" added when `loading`
     is missing, EXCEPT for images inside a <header>…</header> region or the
     site logo (/logo-v2.png): those sit above the fold and must stay eager.

Pages without <img> are untouched. Already-attributed images are untouched,
so the script is safe to re-run (e.g. after publishing new pages).

Usage:
  python3 .github/scripts/inject_img_attrs.py            # apply
  python3 .github/scripts/inject_img_attrs.py --check    # exit 1 if work remains
"""

import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # width/height step degrades gracefully without Pillow
    Image = None

ROOT = Path(__file__).resolve().parent.parent.parent

IMG_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
HEADER_REGION = re.compile(r"<header\b.*?</header>", re.IGNORECASE | re.DOTALL)

# Above-the-fold images that must never be lazy-loaded.
EAGER_SRC = ("/logo-v2.png",)


def attr_present(tag, name):
    return re.search(r"\b" + name + r"\s*=", tag, re.IGNORECASE) is not None


def get_src(tag):
    m = re.search(r"""\bsrc\s*=\s*("([^"]*)"|'([^']*)')""", tag, re.IGNORECASE)
    return (m.group(2) or m.group(3)) if m else None


def local_image_size(src, page_dir):
    """Resolve src to a file under ROOT and return (w, h), or None."""
    if Image is None or not src or src.startswith(("http:", "https:", "data:", "//")):
        return None
    path = src.split("?")[0].split("#")[0]
    candidate = (ROOT / path.lstrip("/")) if path.startswith("/") else (page_dir / path)
    try:
        candidate = candidate.resolve()
        candidate.relative_to(ROOT)
        with Image.open(candidate) as im:
            return im.size
    except Exception:
        return None


def process(html, page_dir, stats):
    header_spans = [m.span() for m in HEADER_REGION.finditer(html)]

    def in_header(pos):
        return any(a <= pos < b for a, b in header_spans)

    out, last = [], 0
    for m in IMG_TAG.finditer(html):
        tag = m.group(0)
        new = tag
        src = get_src(new)

        if not attr_present(new, "width") and not attr_present(new, "height"):
            size = local_image_size(src, page_dir)
            if size:
                new = new[:-1] + f' width="{size[0]}" height="{size[1]}">'
                stats["dims"] += 1

        if not attr_present(new, "alt"):
            new = new[:-1] + ' alt="">'
            stats["alt"] += 1

        if (not attr_present(new, "loading")
                and not in_header(m.start())
                and not (src and any(s in src for s in EAGER_SRC))):
            add = ' loading="lazy"'
            if not attr_present(new, "decoding"):
                add += ' decoding="async"'
            new = new[:-1] + add + ">"
            stats["lazy"] += 1

        out.append(html[last:m.start()])
        out.append(new)
        last = m.end()
    out.append(html[last:])
    return "".join(out)


def main():
    check = "--check" in sys.argv
    stats = {"dims": 0, "alt": 0, "lazy": 0}
    changed_files = []

    for page in sorted(ROOT.rglob("*.html")):
        if "/.git/" in str(page):
            continue
        text = page.read_text(encoding="utf-8")
        before = dict(stats)
        new_text = process(text, page.parent, stats)
        if new_text != text:
            changed_files.append((page.relative_to(ROOT), {
                k: stats[k] - before[k] for k in stats if stats[k] != before[k]
            }))
            if not check:
                page.write_text(new_text, encoding="utf-8")

    for path, delta in changed_files:
        print(f"  {path} {delta}")
    print(f"{'needs' if check else 'applied'}: "
          f"{stats['dims']} width/height, {stats['alt']} alt, "
          f"{stats['lazy']} loading=lazy — in {len(changed_files)} file(s)")
    if check and changed_files:
        sys.exit(1)


if __name__ == "__main__":
    main()
