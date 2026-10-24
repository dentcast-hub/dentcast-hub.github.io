#!/usr/bin/env python3
"""Reject text files whose UTF-8 was damaged by a write or sync layer.

A tool that splits a file into byte chunks can cut a Persian character in half;
the halves become invalid UTF-8 or U+FFFD replacement characters (rendered as
black diamond question marks on the live site). NUL checks do not see this.

    python3 tools/check_text_encoding.py            # every tracked text file (CI)
    python3 tools/check_text_encoding.py --staged   # staged blobs only (pre-commit)

Exit 0 = clean, 1 = damaged file(s) listed. Repair from the file's generator
(e.g. tools/build_episodes.py for episodes.html) or from Git history, never by
deleting the replacement characters.
"""
import subprocess
import sys

TEXT = (".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".json", ".md", ".txt",
        ".svg", ".xml", ".webmanifest", ".yml", ".yaml", ".py")


def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout


def problem(data):
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        return f"invalid UTF-8 at byte {exc.start}"
    count = text.count("\ufffd")
    return f"{count} U+FFFD replacement character(s)" if count else None


def main(argv):
    staged = "--staged" in argv
    names = git(*(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"] if staged
                  else ["ls-files", "-z"])).split(b"\0")
    bad = []
    for raw in names:
        name = raw.decode("utf-8", "surrogateescape")
        if not name.lower().endswith(TEXT):
            continue
        data = git("show", ":" + name) if staged else open(name, "rb").read()
        issue = problem(data)
        if issue:
            bad.append(f"{name}: {issue}")
    for line in bad:
        print(line)
    if bad:
        print("Damaged text encoding; regenerate or restore the file instead of committing it.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
