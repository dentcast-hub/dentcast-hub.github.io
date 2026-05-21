#!/usr/bin/env python3
"""
Prepend "https://dentcast.ir/" to every JSON-LD Organization/Person
node's sameAs array site-wide. Surgical: only the targeted sameAs
arrays are touched; surrounding JSON-LD whitespace and ordering is
preserved by using the first existing array item as a text anchor.

Idempotent: if "https://dentcast.ir/" (or any URL containing
"dentcast.ir") is already present in a sameAs array, that array is
left alone.
"""

import os
import re
import json
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

NEW_URL = "https://dentcast.ir/"

JSON_LD_RE = re.compile(
    r'(<script\s+type="application/ld\+json"[^>]*>)(.*?)(</script>)',
    re.S | re.I,
)


def find_target_arrays(obj, out):
    """
    Walk the parsed JSON-LD object recursively. For each dict node
    whose @type is (or includes) 'Organization' or 'Person', if it
    has a list-valued 'sameAs', append that list to `out`.
    """
    if isinstance(obj, dict):
        t = obj.get("@type")
        types = t if isinstance(t, list) else ([t] if t else [])
        if any(tt in ("Organization", "Person") for tt in types):
            sa = obj.get("sameAs")
            if isinstance(sa, list):
                out.append(sa)
        for v in obj.values():
            find_target_arrays(v, out)
    elif isinstance(obj, list):
        for x in obj:
            find_target_arrays(x, out)


def already_has_ir(sa_list):
    return any(isinstance(x, str) and "dentcast.ir" in x for x in sa_list)


def transform_block(block_text, file_state):
    """
    Take the inner text of one <script type="application/ld+json">…</script>
    block. Return modified text (or original if no change).
    """
    try:
        obj = json.loads(block_text)
    except json.JSONDecodeError as e:
        file_state["parse_errors"].append(str(e))
        return block_text

    targets = []
    find_target_arrays(obj, targets)
    if targets:
        file_state["has_orgperson"] = True

    new_text = block_text
    for sa in targets:
        if not sa:
            continue
        if already_has_ir(sa):
            continue
        first = sa[0]
        if not isinstance(first, str):
            continue
        # Anchor: find  "sameAs" : [ <whitespace> "<first>"
        # Captures: (1) the "sameAs": [ part, (2) whitespace+indent
        # before the first item, (3) the first item literal.
        pat = re.compile(
            r'("sameAs"\s*:\s*\[)(\s*)("' + re.escape(first) + r'")'
        )
        m = pat.search(new_text)
        if not m:
            file_state["anchor_misses"].append(first)
            continue
        # Insert dentcast.ir entry using the same whitespace/indent.
        insertion = m.group(2) + '"' + NEW_URL + '",'
        new_text = (
            new_text[: m.start()]
            + m.group(1)
            + insertion
            + m.group(2)
            + m.group(3)
            + new_text[m.end():]
        )
        file_state["modified_arrays"] += 1

    # Validate post-edit JSON parses (safety belt).
    if new_text != block_text:
        try:
            json.loads(new_text)
        except json.JSONDecodeError as e:
            file_state["post_edit_invalid"].append(str(e))
            # revert
            return block_text

    return new_text


def process_file(path):
    state = {
        "has_orgperson": False,
        "parse_errors": [],
        "anchor_misses": [],
        "post_edit_invalid": [],
        "modified_arrays": 0,
    }
    with open(path, "rb") as f:
        raw = f.read()
    text = raw.decode("utf-8")

    def repl(m):
        pre, body, post = m.group(1), m.group(2), m.group(3)
        new_body = transform_block(body, state)
        return pre + new_body + post

    new_text = JSON_LD_RE.sub(repl, text)

    changed = new_text != text
    if changed:
        with open(path, "wb") as f:
            f.write(new_text.encode("utf-8"))
    return state, changed


def main():
    summary = {
        "scanned": 0,
        "with_orgperson": 0,
        "modified": 0,
        "errors": 0,
        "details": [],
    }
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for f in files:
            if not f.endswith(".html"):
                continue
            full = os.path.join(root, f)
            rel = os.path.relpath(full, REPO_ROOT).replace("\\", "/")
            summary["scanned"] += 1
            try:
                st, changed = process_file(full)
            except Exception as e:
                summary["errors"] += 1
                summary["details"].append((rel, f"exception: {e}"))
                continue
            if st["has_orgperson"]:
                summary["with_orgperson"] += 1
            if st["parse_errors"]:
                summary["errors"] += 1
                summary["details"].append((rel, f"parse_errors: {st['parse_errors']}"))
                continue
            if st["anchor_misses"]:
                summary["details"].append((rel, f"anchor_miss: {st['anchor_misses']}"))
            if st["post_edit_invalid"]:
                summary["errors"] += 1
                summary["details"].append((rel, f"post_edit_invalid: {st['post_edit_invalid']}"))
                continue
            if changed:
                summary["modified"] += 1
                summary["details"].append((rel, f"+{st['modified_arrays']} sameAs"))

    print("=== sameAs (dentcast.ir) injector ===")
    print(f"Files scanned:                 {summary['scanned']}")
    print(f"Files with Org/Person schema:  {summary['with_orgperson']}")
    print(f"Files modified:                {summary['modified']}")
    print(f"Files with errors:             {summary['errors']}")
    if summary["details"]:
        print("\nDetail:")
        for r, d in summary["details"]:
            print(f"  {r}: {d}")


if __name__ == "__main__":
    main()
