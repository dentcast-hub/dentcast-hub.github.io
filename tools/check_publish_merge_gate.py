#!/usr/bin/env python3
"""Fail content PRs with unfinished handoffs or stale homepage counters."""
import json
import os
from pathlib import Path, PurePosixPath
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
    ".dentcast/des-exemptions.json",
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


def publication_ids(paths):
    """New leaf pages, excluding English mirrors and generated landing pages."""
    return {str(PurePosixPath(p).with_suffix("")) for p in paths
            if len(PurePosixPath(p).parts) == 2
            and PurePosixPath(p).parts[0] in CONTENT_ROOTS
            and p.endswith(".html")
            and PurePosixPath(p).stem not in {"index", "archive"}}


def validate_completion(root, raw):
    """Check a real completed ledger against the current tree and rerun Phase F."""
    import dentcast_publish_handoff as h
    import dentcast_publish_lifecycle as lifecycle
    state, digest = h.parse_state(raw)
    if state["schema"] == h.SCHEMA:
        state = h.hydrate_v3(root, state, digest)
    publication = state["publication"]
    lifecycle.require_plan(publication)
    h.require(h.next_step(publication) is None and not publication["blocker"]
              and not publication["context"]["pending_questions"]
              and all(a["status"] in ("confirmed", "not_required")
                      for a in publication["context"]["approvals"])
              and all(a["status"] not in ("started", "outcome_unknown", "failed")
                      for a in publication["external_actions"]), "INCOMPLETE_PUBLICATION_RECEIPT")
    h.require(bool(publication["context"]["delivery"]) and all(
        isinstance(d, dict) and h.nonempty(d.get("scope")) and d.get("evidence")
        for d in publication["context"]["delivery"]), "DELIVERY_EVIDENCE_REQUIRED")
    local_only = h.local_only_inputs(root, publication)
    for name, info in state["snapshot"]["files"].items():
        actual = h.delivered_file_info(root, name, local_only)
        h.require(all(actual[k] == info[k] for k in actual), "PUBLICATION_CHANGED_AFTER_COMPLETION:" + name)
    receipts = [r for r in publication["context"]["validation"]
                if isinstance(r, dict) and r.get("kind") in ("phase_f", "paper_catalog_gate")]
    h.require(bool(receipts) and receipts[-1].get("exit_code") == 0, "COMPLETION_RECEIPT_REQUIRED")
    last = receipts[-1]
    result = lifecycle.gate(root, publication, last.get("expected_title"),
                            last.get("expected_caption"), last.get("catalog_id"))
    h.require(result["exit_code"] == 0, "CURRENT_PUBLICATION_VERIFICATION_FAILED")
    print(result["summary"])
    return publication["content_id"]


def own_paths_after(root, commit, main_ref=None):
    """Paths the PR itself changed after a delivery commit (not main-side changes).

    main_ref is the destination tip; on a synthetic PR merge checkout it
    defaults to HEAD's first parent. Without one, every later commit counts.
    """
    import dentcast_publish_handoff as h
    if main_ref is None and h.text_git(root, "rev-parse", "--verify", "--quiet", "HEAD^2", optional=True):
        main_ref = "HEAD^1"
    exclude = ["^" + main_ref] if main_ref else []
    commits = h.text_git(root, "rev-list", "--no-merges", commit + "..HEAD", *exclude).splitlines()
    paths = set()
    for item in commits:
        paths.update(h.text_git(root, "diff-tree", "--no-commit-id", "--name-only", "-r", item).splitlines())
    return paths


def verify_publication_history(root, base, added_paths, main_ref=None):
    """Use the whole PR range, not HEAD^ (which is main on PR merge checkouts)."""
    import dentcast_publish_handoff as h
    needed = publication_ids(added_paths)
    # A new brain entry must have completion evidence even if its page was staged earlier.
    old_raw = h.git(root, "show", base + ":dentcast-brain.json")
    old = json.loads(old_raw)
    new = json.loads((root / "dentcast-brain.json").read_text())
    old_urls = {(e.get("page_url") or e.get("url")) for e in old}
    for entry in new:
        url = entry.get("page_url") or entry.get("url")
        if url and url not in old_urls:
            from urllib.parse import urlparse
            needed.update(publication_ids([urlparse(url).path.lstrip("/")]))
    # PR merge checkouts are TREESAME to main for the deleted handoff path.
    # Default path simplification prunes the feature branch and its receipt.
    deletions = h.text_git(root, "log", "--full-history", "--format=%H", "--diff-filter=D",
                           base + "..HEAD", "--", STATE_PATH).splitlines()
    verified = set()
    for commit in deletions:
        raw = h.git(root, "show", commit + "^:" + STATE_PATH)
        publication = parse_handoff(raw.decode("utf-8")) if h.BEGIN.encode() in raw else None
        import dentcast_publish_lifecycle as lifecycle
        if publication and lifecycle.fixed_delivery(publication):
            # The receipt and its delivered facts are read from the delivery
            # commit; only the PR's own later changes are checked in the tree.
            receipt = h.git(root, "show", commit + ":" + lifecycle.completion_path(publication), optional=True)
            h.require(receipt is not None, "FINAL_RECEIPT_NOT_IN_DELIVERY_COMMIT")
            final = h.decode_json(receipt.decode("utf-8"))
            verified.add(lifecycle.validate_final_receipt(
                root, final, commit, own_paths_after(root, commit, main_ref)))
        elif reconcile_share35(root, raw):
            verified.add("sharehub/share-35")
        else:
            verified.add(validate_completion(root, raw))
    h.require(needed <= verified, "PUBLICATION_COMPLETION_RECEIPT_MISSING:" + ",".join(sorted(needed - verified)) + "; finish and deliver the current run ledger, real Phase F and cleanup history on this PR; do not search branches or invent a completed receipt. Recovery requires an explicit user request")
    return verified



def reconcile_share35(root, raw):
    """One-time founder-authorized cleanup of the exact legacy Share 35 state.

    Authorized 2026-10-18 after publication, independently verified 118/0/0.
    Never converts its stale pending steps into completed steps.
    """
    import hashlib
    import dentcast_publish_handoff as h
    import dentcast_publish_lifecycle as lifecycle
    if hashlib.sha256(raw).hexdigest() != 'a5f39e12507ac810c24a5f316322ae42c59011487f3eb0c842e3666c8e034c43':
        return False
    baseline = "463feff77d40e28633635e9ea654bf3c056bb188"
    # Freeze every publication asset/data file to the confirmed main revision.
    allowed = {STATE_PATH, "tools/check_publish_merge_gate.py",
               "tools/dentcast_publish_lifecycle.py", "tests/test_publish_merge_gate.py", "tests/test_dentcast_publish_handoff.py",
               "tests/test_dentcast_agent_entrypoint_migration.py",
               ".github/workflows/publishing-live-contract-tests.yml"}
    changed = set(h.text_git(root, "diff", "--name-only", baseline, "HEAD").splitlines())
    h.require(changed <= allowed, "LEGACY_CLEANUP_PUBLICATION_CHANGED")
    result = lifecycle.gate(root, {"category": "sharehub", "content_id": "sharehub/share-35",
                                  "target_paths": ["sharehub/share-35.html"]})
    h.require(result["exit_code"] == 0, "LEGACY_CLEANUP_VERIFICATION_FAILED")
    print(result["summary"])
    return True


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
        if ok:
            root = Path.cwd()
            base = subprocess.check_output(["git", "merge-base", "FETCH_HEAD", "HEAD"], text=True).strip()
            added = subprocess.check_output(["git", "diff", "--name-only", "--diff-filter=A", base + "...HEAD"], text=True).splitlines()
            verify_publication_history(root, base, added, "FETCH_HEAD")
    except (OSError, subprocess.CalledProcessError, ValueError, RuntimeError) as exc:
        reason = str(exc) or "PUBLISH_MERGE_GATE_FAILED"
        ok = False
    if not ok:
        print(reason, file=sys.stderr)
        return 1
    print(reason)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
