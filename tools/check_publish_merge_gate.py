#!/usr/bin/env python3
"""Fail pull requests that change published content while a live handoff remains."""
import json
import os
from pathlib import PurePosixPath
import re
import subprocess
import sys

STATE_PATH = ".dentcast/PUBLISH-HANDOFF.md"
CONTENT_ROOTS = {
    "chairside", "dentcast-plus", "episodes", "glossary", "insight", "litecast",
    "metanotes", "notecast", "pillar", "plak-sefr", "promptologist", "sharehub",
    "taraz",
}
CONTENT_FILES = {
    "dentcast-brain.json", "dentcast.json", "dentcast-music.json",
    "dentcast-hashtag-reference.json", "glossary/glossary.json",
    "litecast/lite-glossary.json", "plus/des-scores.json",
}


def is_publication_path(path):
    if path in CONTENT_FILES:
        return True
    parts = PurePosixPath(path).parts
    return (len(parts) > 1 and parts[0] in CONTENT_ROOTS
            and PurePosixPath(path).suffix.lower() in {".html", ".json"})


def parse_handoff(text):
    if text is None:
        return None
    fence = chr(96) * 3
    match = re.search(
        r"<!-- dentcast-publish-state-v1 -->\s*" + re.escape(fence) +
        r"json\s*(.*?)\s*" + re.escape(fence) +
        r"\s*<!-- /dentcast-publish-state-v1 -->",
        text,
        re.DOTALL,
    )
    if not match:
        raise ValueError("PUBLISH_HANDOFF_FORMAT_INVALID")
    state = json.loads(match.group(1))
    publication = state.get("publication")
    if not isinstance(publication, dict) or not publication.get("content_id"):
        raise ValueError("PUBLISH_HANDOFF_PUBLICATION_INVALID")
    return publication


def check_merge(changed_paths, handoff_text):
    if not any(is_publication_path(path) for path in changed_paths):
        return True, "no publication content changed"
    try:
        publication = parse_handoff(handoff_text)
    except (ValueError, json.JSONDecodeError) as exc:
        return False, str(exc)
    if publication is not None:
        return False, (
            "UNFINISHED_PUBLICATION_HANDOFF: "
            f"{publication.get('content_id')} is still {publication.get('status')}"
        )
    return True, "no active handoff remains"


def changed_paths(base_ref):
    if not re.fullmatch(r"[A-Za-z0-9._/-]+", base_ref) or ".." in base_ref.split("/"):
        raise ValueError("INVALID_BASE_REF")
    subprocess.run(
        ["git", "fetch", "--no-tags", "origin", f"refs/heads/{base_ref}"],
        check=True, capture_output=True, text=True,
    )
    result = subprocess.run(
        ["git", "diff", "--name-only", "-z", "FETCH_HEAD...HEAD"],
        check=True, capture_output=True,
    )
    return [p.decode("utf-8", "surrogateescape")
            for p in result.stdout.split(b"\0") if p]


def main():
    base_ref = os.environ.get("BASE_REF")
    if not base_ref:
        print("BASE_REF is required on pull requests", file=sys.stderr)
        return 2
    try:
        paths = changed_paths(base_ref)
        try:
            with open(STATE_PATH, encoding="utf-8") as f:
                handoff_text = f.read()
        except FileNotFoundError:
            handoff_text = None
        ok, reason = check_merge(paths, handoff_text)
    except (OSError, subprocess.CalledProcessError, ValueError) as exc:
        reason = str(exc) or "PUBLISH_MERGE_GATE_FAILED"
        ok = False
    if not ok:
        print(reason, file=sys.stderr)
        return 1
    print(reason)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
