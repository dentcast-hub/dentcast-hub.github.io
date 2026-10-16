#!/usr/bin/env python3
"""Stage 7 paired artifact byte comparator; NOT a behavioral-parity certificate.

Operate exclusively on marked disposable workspaces. Both runs must be performed
independently by authorized operators before this comparison means anything.
No network, writes, publication, approval inference, or scientific inference.
"""
import argparse
import hashlib
import json
import os
import stat
from pathlib import Path

MARKER = ".dentcast-stage3-disposable-workspace.json"


def sandbox(path):
    root = Path(path)
    if root.is_symlink():
        raise ValueError("SYMLINK_WORKSPACE")
    root = root.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("NOT_A_DIRECTORY")
    source = Path(__file__).resolve().parents[1]
    if root == source or root.is_relative_to(source) or source.is_relative_to(root):
        raise ValueError("LIVE_REPO_NOT_DISPOSABLE")
    marker = root / MARKER
    if not marker.is_file() or marker.is_symlink():
        raise ValueError("UNMARKED_WORKSPACE")
    flags = json.loads(marker.read_text(encoding="utf-8"))
    if flags != {"purpose": "dentcast-stage3-disposable-test",
                 "allow_real_publication": False, "allow_remote_mutation": False}:
        raise ValueError("UNSAFE_WORKSPACE")
    return root


def inventory(root):
    """Inventory *all* output files: unexpected side effects cannot be hidden."""
    listing = {}
    for folder, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            path = Path(folder) / name
            if path.is_symlink():
                raise ValueError("SYMLINK_IN_COMPARISON:" + str(path.relative_to(root)))
        for name in files:
            path = Path(folder) / name
            rel = path.relative_to(root).as_posix()
            if rel == MARKER:
                continue
            mode = path.stat().st_mode
            if not stat.S_ISREG(mode):
                raise ValueError("NON_REGULAR_COMPARISON_INPUT:" + rel)
            h = hashlib.sha256()
            with path.open("rb") as fd:
                for block in iter(lambda: fd.read(1024 * 1024), b""):
                    h.update(block)
            listing[rel] = {"sha256": h.hexdigest(), "bytes": path.stat().st_size}
    return listing


def compare(legacy, modular, required=()):
    old_root, new_root = sandbox(legacy), sandbox(modular)
    if old_root == new_root or old_root.is_relative_to(new_root) or new_root.is_relative_to(old_root):
        raise ValueError("NOT_INDEPENDENT_WORKSPACES")
    a, b = inventory(old_root), inventory(new_root)
    required = list(required)
    if len(required) != len(set(required)) or not required:
        raise ValueError("EXPLICIT_REQUIRED_ARTIFACTS_MANDATORY")
    for p in required:
        path = Path(p)
        if (not isinstance(p, str) or not p or path.is_absolute()
                or any(part in ("..", ".") for part in path.parts)
                or path.as_posix() == MARKER):
            raise ValueError("INVALID_REQUIRED_ARTIFACT")
    missing_old = sorted(p for p in required if p not in a)
    missing_new = sorted(p for p in required if p not in b)
    only_old = sorted(set(a) - set(b))
    only_new = sorted(set(b) - set(a))
    altered = sorted(k for k in set(a) & set(b) if a[k] != b[k])
    issues = {"required_missing_legacy": missing_old,
              "required_missing_modular": missing_new,
              "only_legacy": only_old, "only_modular": only_new,
              "different_bytes": altered}
    equal = all(not values for values in issues.values())
    return {"status": "PAIRED_BYTES_EQUAL" if equal else "PAIRED_BYTES_DIFFER",
            "legacy_manifest": a, "modular_manifest": b,
            "issues": issues,
            "full_behavioral_parity_proven": False,
            "scientific_or_founder_approval_verified": False,
            "published": False}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--legacy-root", required=True)
    ap.add_argument("--modular-root", required=True)
    ap.add_argument("--required", nargs="+", required=True)
    args = ap.parse_args()
    try:
        result = compare(args.legacy_root, args.modular_root, args.required)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"] == "PAIRED_BYTES_EQUAL" else 2
    except (ValueError, OSError, TypeError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "BLOCKED", "error": str(exc),
                          "full_behavioral_parity_proven": False}), flush=True)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
