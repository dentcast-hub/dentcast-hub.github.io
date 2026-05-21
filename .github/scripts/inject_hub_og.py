#!/usr/bin/env python3
"""
Inject Open Graph + Twitter Card meta into the 10 section-hub landing
pages that currently have no OG. Per-hub title/description are read
from the page's existing <title> and <meta name="description">; the
og:url is read from the canonical tag verbatim.

Format mirrors the existing site convention (as seen in
episodes/episode-N.html and glossary/<term>.html): a 13-tag block in
the established order, 2-space indent, og:type="website" (these are
landing pages, not articles).

Idempotent: if any og:* tag already exists in the file, the script
skips that file with a notice.
"""

import os
import re
import sys
import html

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

HUBS = [
    "chairside/index.html",
    "dentai/index.html",
    "dentcast-plus/index.html",
    "glossary/index.html",
    "insight/index.html",
    "litecast/index.html",
    "metanotes/index.html",
    "notecast/index.html",
    "photocast/index.html",
    "sharehub/index.html",
]

OG_IMAGE = "https://dentcast.org/dentcast-cover.webp"

CANONICAL_RE = re.compile(
    r'<link[^>]*\brel\s*=\s*["\']?canonical["\']?[^>]*\bhref\s*=\s*"([^"]+)"',
    re.IGNORECASE,
)
TITLE_RE = re.compile(r"<title>([^<]*)</title>", re.IGNORECASE | re.S)
DESC_RE = re.compile(
    r'<meta[^>]*\bname\s*=\s*["\']?description["\']?[^>]*\bcontent\s*=\s*"([^"]*)"',
    re.IGNORECASE,
)

# Anchor: the last hreflang link in <head>. OG block is inserted
# immediately after it (matching how content pages place OG after the
# canonical/hreflang region).
HREFLANG_LINE_RE = re.compile(
    r'^[ \t]*<link[^>]*\brel\s*=\s*"alternate"[^>]*\bhreflang\s*=\s*"[^"]+"[^>]*>\s*$',
    re.MULTILINE,
)


def build_og_block(indent: str, title: str, desc: str, og_url: str) -> str:
    # We embed title and description verbatim (they already exist in
    # the page's <title> and meta description). HTML special chars in
    # attribute context are escaped to be safe.
    def esc(s):
        return html.escape(s, quote=True)
    t = esc(title.strip())
    d = esc(desc.strip())
    u = esc(og_url.strip())
    i = esc(OG_IMAGE)
    lines = [
        f'<meta property="og:type" content="website">',
        f'<meta property="og:locale" content="fa_IR">',
        f'<meta property="og:site_name" content="DentCast">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:url" content="{u}">',
        f'<meta property="og:image" content="{i}">',
        f'<meta property="og:image:width" content="1200">',
        f'<meta property="og:image:height" content="630">',
        f'<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{t}">',
        f'<meta name="twitter:description" content="{d}">',
        f'<meta name="twitter:image" content="{i}">',
    ]
    return "\n".join(indent + ln for ln in lines)


def process_hub(file_path, rel_path):
    with open(file_path, "rb") as f:
        raw = f.read()
    text = raw.decode("utf-8")

    # Detect line ending
    if "\r\n" in text:
        nl = "\r\n"
    elif "\r" in text and "\n" not in text:
        nl = "\r"
    else:
        nl = "\n"

    # Idempotency: skip if any og:* already present in <head>
    head_end = text.lower().find("</head>")
    head_text = text if head_end == -1 else text[:head_end]
    if re.search(r'\bproperty\s*=\s*"og:', head_text, re.IGNORECASE):
        return ("skipped", "og:* already present in <head>")

    canon_m = CANONICAL_RE.search(head_text)
    if not canon_m:
        return ("error", "no canonical tag")
    canon_url = canon_m.group(1)

    title_m = TITLE_RE.search(head_text)
    desc_m = DESC_RE.search(head_text)
    if not title_m or not desc_m:
        return ("error", "missing title or description")
    title = title_m.group(1)
    desc = desc_m.group(1)

    # Find the last hreflang line in <head>; insert OG block after it.
    hreflang_iter = list(HREFLANG_LINE_RE.finditer(text, 0, head_end if head_end != -1 else len(text)))
    if not hreflang_iter:
        return ("error", "no hreflang anchor found")
    last_hreflang = hreflang_iter[-1]
    # Determine indent from that line
    line_start = text.rfind("\n", 0, last_hreflang.start()) + 1
    line_text = text[line_start: last_hreflang.end()]
    indent_m = re.match(r"^([ \t]*)", line_text)
    indent = indent_m.group(1) if indent_m else "  "

    og_block = build_og_block(indent, title, desc, canon_url)

    # Insert after the last hreflang line + its trailing newline.
    insert_pos = last_hreflang.end()
    # If the next char is a newline, insert AFTER it; else we add nl.
    if text[insert_pos: insert_pos + len(nl)] == nl:
        insert_pos += len(nl)
        prefix_nl = ""
    else:
        prefix_nl = nl
    new_text = (
        text[:insert_pos]
        + prefix_nl
        + og_block
        + nl
        + text[insert_pos:]
    )

    with open(file_path, "wb") as f:
        f.write(new_text.encode("utf-8"))
    return ("modified", f"og:url={canon_url}")


def main():
    counts = {"modified": 0, "skipped": 0, "error": 0}
    rows = []
    for rel in HUBS:
        full = os.path.join(REPO_ROOT, rel)
        if not os.path.isfile(full):
            counts["error"] += 1
            rows.append((rel, "error", "file not found"))
            continue
        status, detail = process_hub(full, rel)
        counts[status] += 1
        rows.append((rel, status, detail))

    print("=== Hub OG injector ===")
    for r, s, d in rows:
        print(f"  [{s}] {r}: {d}")
    print()
    for k in ("modified", "skipped", "error"):
        print(f"  {k}: {counts[k]}")


if __name__ == "__main__":
    main()
