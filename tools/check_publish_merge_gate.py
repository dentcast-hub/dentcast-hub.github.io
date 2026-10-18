#!/usr/bin/env python3
"""Fail content PRs with unfinished handoffs or stale homepage counters."""
import json
import os
from pathlib import PurePosixPath
import re
import subprocess
import sys

STATE_PATH = ".dentcast/PUBLISH-HANDOFF.md"
CONTENT_ROOTS = {
    "chairside", "dentcast-plus", "episodes", "glossary", "insight", "litecast",
    "metanotes", "notecast", "plak-sefr", "promptologist", "sharehub", "taraz",
}
CONTENT_FILES = {
    "dentcast-brain.json", "dentcast.json", "dentcast-music.json",
    "dentcast-hashtag-reference.json", "glossary/glossary.json",
    "litecast/lite-glossary.json", "plus/des-scores.json",
}
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


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


def marker_values(index_html, name):
    pattern = re.compile(
        r"<!-- COUNTER:" + re.escape(name) + r":START -->(.*?)"
        r"<!-- COUNTER:" + re.escape(name) + r":END -->",
        re.DOTALL,
    )
    return [value.strip() for value in pattern.findall(index_html)]


def verify_homepage_counters(index_html, brain_text, glossary_text, lite_text):
    try:
        brain = json.loads(brain_text)
        glossary = json.loads(glossary_text)["glossary"]
        lite = json.loads(lite_text)["LightGlossary"]
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        return False, f"COUNTER_SOURCE_INVALID: {exc}"
    if not isinstance(brain, list) or not isinstance(glossary, list) or not isinstance(lite, list):
        return False, "COUNTER_SOURCE_INVALID: expected arrays"
    total = len(brain) + len(glossary) + len(lite)
    share_count = sum(
        1 for entry in brain
        if isinstance(entry, dict) and entry.get("type") in ("sharehub", "dentai", "photocast")
    )
    expected = {
        "CONTENT": str(total).translate(FA_DIGITS),
        "CAT_SHAREHUB": str(share_count).translate(FA_DIGITS),
    }
    for name, value in expected.items():
        actual = marker_values(index_html, name)
        if not actual:
            return False, f"COUNTER_MARKER_MISSING: {name}"
        if any(item != value for item in actual):
            return False, f"STALE_HOMEPAGE_COUNTER: {name} expected {value}, found {actual}"
    return True, f"homepage counters verified: CONTENT={expected['CONTENT']}, CAT_SHAREHUB={expected['CAT_SHAREHUB']}"


def check_merge(changed_paths, handoff_text, counter_sources=None):
    if not any(is_publication_path(path) for path in changed_paths):
        return True, "no publication content changed"
    try:
        publication = parse_handoff(handoff_text)
    except (ValueError, json.JSONDecodeError) as exc:
        return False, str(exc)
    if publication is not None:
        return False, (
            "UNFINISHED_PUBLICATION_HANDOFF: "
            f"{publication.get('content_id')} is still {publication.get('status')}; "
            "the handoff must be completed and cleaned up before merge"
        )
    if not counter_sources:
        return False, "COUNTER_INPUT_REQUIRED"
    return verify_homepage_counters(**counter_sources)


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


def read_optional(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None


def main():
    base_ref = os.environ.get("BASE_REF")
    if not base_ref:
        print("BASE_REF is required on pull requests", file=sys.stderr)
        return 2
    try:
        paths = changed_paths(base_ref)
        handoff_text = read_optional(STATE_PATH)
        counter_sources = {
            "index_html": read_optional("index.html"),
            "brain_text": read_optional("dentcast-brain.json"),
            "glossary_text": read_optional("glossary/glossary.json"),
            "lite_text": read_optional("litecast/lite-glossary.json"),
        }
        if any(value is None for value in counter_sources.values()):
            counter_sources = None
        ok, reason = check_merge(paths, handoff_text, counter_sources)
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
