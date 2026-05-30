#!/usr/bin/env python3
"""Strip NUL bytes from text files (remediation for write/sync-layer corruption).

Usage:
    python3 tools/strip_text_nuls.py <file> [<file> ...]
    python3 tools/strip_text_nuls.py --check <file> [...]   # report only, exit 1 if any NULs

Trailing NUL padding is removed losslessly. If NUL bytes are found in the MIDDLE
of a file, they are also removed, but a warning is printed because mid-file NULs
mean real content was overwritten and the removal is NOT lossless — review the
result before committing.
"""
import sys


def analyze(data: bytes):
    total = data.count(0)
    stripped_trailing = data.rstrip(b"\x00")
    interior = stripped_trailing.count(0)
    return total, interior


def main(argv):
    check_only = False
    files = []
    for a in argv:
        if a == "--check":
            check_only = True
        else:
            files.append(a)
    if not files:
        print(__doc__)
        return 2

    found = False
    for path in files:
        with open(path, "rb") as fh:
            data = fh.read()
        total, interior = analyze(data)
        if total == 0:
            print(f"clean: {path}")
            continue
        found = True
        if interior:
            print(f"WARNING: {path}: {total} NUL byte(s), {interior} mid-file "
                  f"(possible DATA LOSS — review before committing)")
        else:
            print(f"{path}: {total} trailing NUL byte(s) (lossless to strip)")
        if not check_only:
            cleaned = data.replace(b"\x00", b"")
            with open(path, "wb") as fh:
                fh.write(cleaned)
            print(f"  -> stripped, {len(data)} -> {len(cleaned)} bytes")

    if check_only and found:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
