#!/usr/bin/env python3
"""
DentCast hreflang injector.

Walks the repo, computes the appropriate hreflang block per page,
and injects it into <head> immediately after <link rel="canonical">
(or just before </head> if no canonical exists).

Idempotent: re-running the script after a successful run produces
no changes.

Source of truth for {PATH}: the page's canonical URL.

Rules (see SEO audit / task brief):
  - Skip: 404.html, player.html, search.html, join.html,
    google53b100d9b9181a71.html, episodes/index.html
  - Homepage (index.html): fa-IR/.ir/, fa/.org/, x-default/.org/
  - Section hubs (<section>/index.html): trailing-slash form,
    3-line block (fa-IR, fa, x-default)
  - About pages (about.html, metanotes/en/about.html): 4-line block
    with en pointing to metanotes/en/about.html
  - MetaNotes Persian meta-1..meta-6 (paired): 4-line block with en
    pointing to metanotes/en/meta-N.html
  - MetaNotes English meta-1..meta-6 (paired): same 4-line block as
    the Persian counterpart (mirror)
  - Default (everything else): 3-line block (fa-IR, fa, x-default)
    using the canonical path verbatim
"""

import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SKIP_FILES = {
    "404.html",
    "player.html",
    "search.html",
    "join.html",
    "google53b100d9b9181a71.html",
    "episodes/index.html",
}

# Persian metanotes meta-1..meta-6 are paired with English counterparts
# per the task brief. (Note: metanotes/en/meta-6.html may not exist on
# disk yet; the spec is the source of truth.)
METANOTES_PAIRED_NS = {"1", "2", "3", "4", "5", "6"}


def make_block(indent: str, items: list) -> list:
    """Return list of formatted <link> lines for the given (hreflang,url) pairs."""
    return [
        f'{indent}<link rel="alternate" hreflang="{h}" href="{u}">'
        for h, u in items
    ]


def desired_block(rel_path: str, canonical_path: str, indent: str) -> list:
    """
    Compute the desired hreflang block for `rel_path`.
    `canonical_path` is the path portion of the page's canonical URL
    (e.g., '/episodes/episode-1.html', '/glossary/', '/').
    """
    p = rel_path

    # Homepage
    if p == "index.html":
        return make_block(indent, [
            ("fa-IR", "https://dentcast.ir/"),
            ("fa", "https://dentcast.org/"),
            ("x-default", "https://dentcast.org/"),
        ])

    # About pages — both fa and en serve the same 4-line block
    if p == "about.html" or p == "metanotes/en/about.html":
        return make_block(indent, [
            ("fa-IR", "https://dentcast.ir/about.html"),
            ("fa", "https://dentcast.org/about.html"),
            ("en", "https://dentcast.org/metanotes/en/about.html"),
            ("x-default", "https://dentcast.org/about.html"),
        ])

    # MetaNotes Persian paired meta-1..meta-6
    m = re.match(r"^metanotes/meta-(\d+)\.html$", p)
    if m and m.group(1) in METANOTES_PAIRED_NS:
        N = m.group(1)
        return make_block(indent, [
            ("fa-IR", f"https://dentcast.ir/metanotes/meta-{N}.html"),
            ("fa", f"https://dentcast.org/metanotes/meta-{N}.html"),
            ("en", f"https://dentcast.org/metanotes/en/meta-{N}.html"),
            ("x-default", f"https://dentcast.org/metanotes/meta-{N}.html"),
        ])

    # MetaNotes English meta-1..meta-6 (mirror block)
    m = re.match(r"^metanotes/en/meta-(\d+)\.html$", p)
    if m and m.group(1) in METANOTES_PAIRED_NS:
        N = m.group(1)
        return make_block(indent, [
            ("fa-IR", f"https://dentcast.ir/metanotes/meta-{N}.html"),
            ("fa", f"https://dentcast.org/metanotes/meta-{N}.html"),
            ("en", f"https://dentcast.org/metanotes/en/meta-{N}.html"),
            ("x-default", f"https://dentcast.org/metanotes/meta-{N}.html"),
        ])

    # Section hubs (path ends in /index.html, canonical uses trailing-slash)
    if p.endswith("/index.html"):
        section_path = "/" + p[: -len("index.html")]  # '/glossary/'
        return make_block(indent, [
            ("fa-IR", f"https://dentcast.ir{section_path}"),
            ("fa", f"https://dentcast.org{section_path}"),
            ("x-default", f"https://dentcast.org{section_path}"),
        ])

    # Default: use canonical's path verbatim
    path = canonical_path if canonical_path else "/" + p
    return make_block(indent, [
        ("fa-IR", f"https://dentcast.ir{path}"),
        ("fa", f"https://dentcast.org{path}"),
        ("x-default", f"https://dentcast.org{path}"),
    ])


CANONICAL_RE = re.compile(
    r'(?im)<link[^>]*\brel\s*=\s*"canonical"[^>]*\bhref\s*=\s*"([^"]+)"[^>]*>'
)
HREFLANG_LINE_RE = re.compile(
    r'^[ \t]*<link[^>]*\brel\s*=\s*"alternate"[^>]*\bhreflang\s*=\s*"[^"]+"[^>]*>\s*$'
)


def canonical_path_from_url(url: str):
    """Extract path portion from a canonical URL on either domain."""
    m = re.match(r"https?://(?:www\.)?dentcast\.(?:org|ir)(/.*)?$", url)
    if not m:
        return None
    return m.group(1) or "/"


def process_file(file_path: str, rel_path: str):
    """
    Process one HTML file. Returns (status, detail).
    status ∈ {'modified','unchanged','skipped','error'}
    """
    if rel_path in SKIP_FILES:
        return ("skipped", "in skip list")

    # Read as bytes, then decode, preserving original line endings.
    with open(file_path, "rb") as f:
        raw = f.read()
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        return ("error", f"decode failure: {e}")

    # Detect line ending convention.
    if "\r\n" in content:
        nl = "\r\n"
    elif "\r" in content and "\n" not in content:
        nl = "\r"
    else:
        nl = "\n"

    lines = content.split(nl)

    # Find the canonical line and extract indent + URL.
    canonical_line_idx = None
    canonical_indent = "  "
    canonical_url = None
    for i, ln in enumerate(lines):
        m = CANONICAL_RE.search(ln)
        if m:
            canonical_line_idx = i
            indent_m = re.match(r"^([ \t]*)", ln)
            canonical_indent = indent_m.group(1) if indent_m else "  "
            canonical_url = m.group(1)
            break

    canonical_path = canonical_path_from_url(canonical_url) if canonical_url else None
    if canonical_path is None and rel_path == "index.html":
        canonical_path = "/"

    # Compute desired block (lines, no trailing newline).
    expected_block = desired_block(rel_path, canonical_path, canonical_indent)

    # Find existing hreflang lines (anywhere in the file, by line).
    existing_idxs = [i for i, ln in enumerate(lines) if HREFLANG_LINE_RE.match(ln)]

    # Idempotency: if existing block is contiguous, matches expected,
    # and sits immediately after the canonical line, no change needed.
    if (
        canonical_line_idx is not None
        and existing_idxs
        and existing_idxs == list(range(canonical_line_idx + 1, canonical_line_idx + 1 + len(expected_block)))
        and [lines[i] for i in existing_idxs] == expected_block
    ):
        return ("unchanged", "already matches")

    # Otherwise: remove ALL existing hreflang lines, then re-insert.
    new_lines = [ln for i, ln in enumerate(lines) if i not in set(existing_idxs)]

    # Recompute insertion index in the post-removal list.
    insert_idx = None
    for i, ln in enumerate(new_lines):
        if CANONICAL_RE.search(ln):
            insert_idx = i + 1
            break
    if insert_idx is None:
        # Fall back to inserting just before </head>.
        for i, ln in enumerate(new_lines):
            if re.search(r"</head\s*>", ln, re.I):
                insert_idx = i
                break
    if insert_idx is None:
        return ("error", "no canonical and no </head>")

    new_lines = new_lines[:insert_idx] + expected_block + new_lines[insert_idx:]
    new_content = nl.join(new_lines)

    if new_content == content:
        return ("unchanged", "no diff after rewrite")

    with open(file_path, "wb") as f:
        f.write(new_content.encode("utf-8"))

    before = len(existing_idxs)
    after = len(expected_block)
    return ("modified", f"hreflang lines {before}→{after}")


def main():
    counts = {"modified": 0, "unchanged": 0, "skipped": 0, "error": 0}
    modified = []
    skipped = []
    errors = []

    for root, dirs, files in os.walk(REPO_ROOT):
        # Skip .git and any hidden dirs except .github (we want to NOT walk .github either).
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if not f.endswith(".html"):
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, REPO_ROOT).replace("\\", "/")
            try:
                status, detail = process_file(full, rel)
            except Exception as e:
                status, detail = "error", repr(e)
            counts[status] += 1
            if status == "modified":
                modified.append((rel, detail))
            elif status == "skipped":
                skipped.append((rel, detail))
            elif status == "error":
                errors.append((rel, detail))

    print("=== DentCast hreflang injector ===")
    print(f"Total HTML files seen: {sum(counts.values())}")
    for k in ("modified", "unchanged", "skipped", "error"):
        print(f"  {k}: {counts[k]}")
    if errors:
        print("\nErrors:")
        for r, d in errors:
            print(f"  {r}: {d}")
    if skipped:
        print("\nSkipped (intentional):")
        for r, d in skipped:
            print(f"  {r}: {d}")
    if modified:
        print(f"\nModified ({len(modified)}):")
        for r, d in modified[:60]:
            print(f"  {r}: {d}")
        if len(modified) > 60:
            print(f"  ... and {len(modified) - 60} more")


if __name__ == "__main__":
    main()
