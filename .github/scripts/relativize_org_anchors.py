#!/usr/bin/env python3
"""
Convert <a href="https://dentcast.org/..."> body links to relative paths.

Rules:
  - Only <a href> attributes are touched (canonical/og/jsonld/etc untouched).
  - Path with extension (.html etc) or trailing slash → strip the domain,
    keep the path verbatim.
  - Extensionless path (e.g. /about) → append .html (/about.html).
  - Bare domain "https://dentcast.org" (no path) → "/".

Exception (do NOT touch):
  - In about.html only: the deliberate bare "https://dentcast.org" link
    inside the "خارج از ایران" row. Detected as the bare-domain href in
    about.html (any other absolute .org link in about.html would still
    be converted, but none currently exist).

Idempotent: re-running produces no changes.
"""

import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Match an <a> tag's href attribute (any other attrs, any whitespace,
# multi-line tag bodies). Group 1 = quote char, Group 2 = href value.
A_HREF_RE = re.compile(
    r'(<a\b[^>]*?\bhref\s*=\s*)(["\'])(https://dentcast\.org[^"\']*)\2',
    re.IGNORECASE | re.S,
)


def transform_path(rest: str) -> str:
    """rest = whatever comes after 'https://dentcast.org' (incl. leading /)."""
    if rest == "":
        return "/"
    # Split off ?query / #fragment for safety
    qpos = rest.find("?")
    fpos = rest.find("#")
    cuts = [c for c in (qpos, fpos) if c >= 0]
    if cuts:
        cut = min(cuts)
        path, suffix = rest[:cut], rest[cut:]
    else:
        path, suffix = rest, ""
    if not path.endswith(".html") and not path.endswith("/"):
        last_seg = path.rsplit("/", 1)[-1]
        if "." not in last_seg and last_seg != "":
            path += ".html"
    return path + suffix


def process_file(file_path: str, rel_path: str):
    with open(file_path, "rb") as f:
        raw = f.read()
    text = raw.decode("utf-8")

    changes = []  # (old_href, new_href, line_no)
    is_about_root = rel_path == "about.html"

    def repl(m):
        attr_prefix = m.group(1)  # '<a href='  plus whitespace
        q = m.group(2)
        href = m.group(3)
        rest = href[len("https://dentcast.org"):]  # may be ''

        # about.html exception: the bare domain link
        if is_about_root and rest == "":
            return m.group(0)

        new_path = transform_path(rest)
        new_attr = attr_prefix + q + new_path + q
        line_no = text[: m.start()].count("\n") + 1
        changes.append((href, new_path, line_no))
        return new_attr

    new_text = A_HREF_RE.sub(repl, text)

    if new_text == text:
        return ("unchanged", [])
    with open(file_path, "wb") as f:
        f.write(new_text.encode("utf-8"))
    return ("modified", changes)


def main():
    total = 0
    summary = {"modified": 0, "unchanged": 0, "skipped_no_html": 0}
    all_changes = []  # (file, old, new, line)
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if not f.endswith(".html"):
                summary["skipped_no_html"] += 1
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, REPO_ROOT).replace("\\", "/")
            status, changes = process_file(full, rel)
            total += 1
            summary[status] += 1
            for old, new, ln in changes:
                all_changes.append((rel, ln, old, new))

    print("=== Relativize <a href=\"https://dentcast.org/...\"> ===")
    print(f"HTML files scanned: {total}")
    print(f"  modified:  {summary['modified']}")
    print(f"  unchanged: {summary['unchanged']}")
    print(f"\nLink changes ({len(all_changes)}):")
    for rel, ln, old, new in all_changes:
        print(f"  {rel}:{ln}  {old}  ->  {new}")


if __name__ == "__main__":
    main()
