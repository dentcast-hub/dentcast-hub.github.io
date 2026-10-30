#!/usr/bin/env python3
"""Run the deterministic post-Push-2 work and prepare the canonical third delivery.

On failure it writes bounded recovery data outside the checkout so an
agent/operator can inspect the cause and continue without repeating completed
or external work.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import sys
import tarfile
import time
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_publish_handoff as handoff  # noqa: E402
import dentcast_publish_lifecycle as lifecycle  # noqa: E402


SCHEMA = "dentcast-post-cut2-recovery-v1"
HANDOFF = ".dentcast/PUBLISH-HANDOFF.md"


class RunnerError(RuntimeError):
    pass


def git(root: Path, *args: str, check: bool = True) -> str:
    p = subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=root, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RunnerError(f"git {' '.join(args)} failed ({p.returncode}): {p.stderr.strip()}")
    return p.stdout.strip()


def publication(root: Path):
    state, digest = handoff.load_state(root)
    return state["publication"], digest


def phase_f_expectations(pub: dict, args) -> tuple[str | None, str | None]:
    """Resolve Phase F strings from both frozen title/caption decisions."""
    approvals = {item["scope"]: item for item in pub.get("context", {}).get("approvals", [])}
    resolved = []
    for scope, arg_name in (("title", "expect_title"), ("caption", "expect_caption")):
        supplied = getattr(args, arg_name, None)
        approval = approvals.get(scope)
        if approval is None:
            raise RunnerError("APPROVED_EXPECTED_TEXT_SCOPE_REQUIRED:" + scope)
        status = approval["status"]
        if status == "confirmed":
            approved = approval["decision"]
            if supplied is not None and supplied != approved:
                raise RunnerError("APPROVED_EXPECTED_TEXT_MISMATCH:" + scope)
            resolved.append(approved)
        elif status == "not_required":
            if supplied is not None:
                raise RunnerError("EXPECTED_TEXT_MARKED_NOT_REQUIRED:" + scope)
            resolved.append(None)
        else:
            raise RunnerError("APPROVED_EXPECTED_TEXT_UNRESOLVED:" + scope)
    title, caption = resolved
    if not title and not caption:
        raise RunnerError("APPROVED_EXPECTED_TEXT_REQUIRED_FOR_PHASE_F")
    return title, caption


def preflight(root: Path, expected_head: str, expected_branch: str) -> dict:
    """Read-only trigger gate; Push 1 and post-cleanup pushes are clean skips."""
    actual = git(root, "rev-parse", "HEAD").lower()
    if actual != expected_head.lower():
        raise RunnerError("EXPECTED_EVENT_SHA_MISMATCH")
    branch = git(root, "branch", "--show-current")
    if branch != expected_branch:
        raise RunnerError("EXPECTED_BRANCH_MISMATCH")
    remote = git(root, "ls-remote", "origin", f"refs/heads/{branch}").split()
    if not remote:
        raise RunnerError("REMOTE_BRANCH_MOVED_OR_UNOBSERVABLE")
    decision = classify(root)
    if remote[0].lower() == expected_head.lower():
        return decision
    # A quick later push (Push 2 after Push 1, paper-only deletion after its
    # handoff) supersedes this event: the skip classification of this SHA
    # stands. A real Push-2 run skips only when a descendant push that touches
    # the handoff exists, i.e. its own run is queued for the newer head.
    if not decision["continue"]:
        return {**decision, "superseded_by": remote[0].lower()}
    if superseded_by_handoff_push(root, expected_head, remote[0]):
        return {"continue": False, "reason": "SUPERSEDED_BY_NEWER_HANDOFF_PUSH",
                "superseded_by": remote[0].lower(), "boundary": decision["boundary"]}
    raise RunnerError("REMOTE_BRANCH_MOVED_OR_UNOBSERVABLE")


def classify(root: Path) -> dict:
    if not (root / HANDOFF).is_file():
        return {"continue": False, "reason": "NO_ACTIVE_HANDOFF"}
    pub, _ = publication(root)
    if not lifecycle.editorial_cut_v2(pub):
        return {"continue": False, "reason": "V2_REQUIRED_FOR_AUTOMATIC_CONTINUATION"}
    boundary = lifecycle.delivery_boundary(pub)
    if boundary != 2:
        return {"continue": False, "reason": "NOT_AT_V2_SECOND_DELIVERY", "boundary": boundary}
    return {"continue": True, "reason": "V2_SECOND_DELIVERY", "boundary": boundary}


def superseded_by_handoff_push(root: Path, expected_head: str, remote_head: str) -> bool:
    """Fast-forward descendant whose range changes the handoff (the path filter)."""
    try:
        git(root, "merge-base", "--is-ancestor", expected_head, remote_head)
        changed = git(root, "diff", "--name-only", expected_head, remote_head, "--", HANDOFF)
    except RunnerError:
        return False  # not a descendant, or the newer commit is not observable
    return changed == HANDOFF


def record_step(root: Path, step_id: str, status: str,
                evidence=(), reason: str | None = None,
                note: str | None = None) -> str:
    _, digest = publication(root)
    cmd = [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
           "--repo", str(root), "step", "--expected-sha256", digest,
           "--id", step_id, "--status", status]
    for item in evidence:
        cmd += ["--evidence", item]
    if reason:
        cmd += ["--reason", reason]
    if note:
        cmd += ["--reconcile-note", note]
    p = subprocess.run(cmd, cwd=root, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if p.returncode:
        raise RunnerError(f"handoff step {step_id}/{status} failed: {p.stdout.strip()}")
    _, next_digest = publication(root)
    return next_digest


def command_plan(root: Path, pub: dict):
    """Return the canonical ordered builder commands for C.8."""
    rows = {x["id"]: x for x in pub["steps"]}
    cmds = [
        ["python3", "tools/update-homepage-counters.py"],
        ["python3", "tools/build_pillar.py", "all"],
    ]
    # Module 11 step 3: mandatory whenever the publish touched dentcast.json.
    # Category names are free-form (episode/episodes/dentcast), so the
    # enrolled target is the reliable trigger.
    if "dentcast.json" in pub["target_paths"] or handoff.publication_category(pub) in ("episode", "episodes", "dentcast"):
        cmds.append(["python3", "tools/build_episodes.py"])
    if rows["C.4.11"]["status"] == "completed":
        cmds.append(["node", "tools/build_flashcards_index.mjs"])
    if rows["C.4.12"]["status"] == "completed":
        cmds.append(["node", "tools/build_quiz_index.mjs"])
    if rows["C.4.14"]["status"] == "completed":
        cmds.append(["node", "tools/build_challenge_index.mjs"])
        # A چالش page belongs in sitemap.xml (Phase F checks it), but its
        # Phase D, which otherwise regenerates the sitemap, is skipped.
        cmds.append(["python3", ".github/scripts/gen_sitemap.py"])
    cmds.append(["python3", ".github/scripts/inject_img_attrs.py"])
    if handoff.publication_category(pub) != "paper-only":
        cmds.extend([
            ["node", "tools/build_plus_index.mjs"],
            ["python3", "tools/build_upboard_index.py"],
        ])
    return cmds


def allowed_paths(pub: dict) -> set[str]:
    return set(pub["target_paths"]) | {
        HANDOFF,
        "index.html", "player.html", "service-worker.js", "episodes.html",
        "glossary/index.html", "glossary/structure.json", "pillar/index.html",
        "pillar/structure.json", "plus/content-index.json", "plus/assistant-tags.json",
        "plus/flashcards-index.json", "plus/quiz-index.json",
        "plus/challenges.json", "up-board/index.json", "sitemap.xml",
        "sitemap-ir.xml",
    }


def changed_paths(root: Path) -> set[str]:
    tracked = git(root, "diff", "--name-only", "-z", "HEAD").split("\0")
    untracked = git(root, "ls-files", "--others", "--exclude-standard", "-z").split("\0")
    return {p for p in tracked + untracked if p}


def verify_scope(root: Path, pub: dict):
    changed = changed_paths(root)
    allowed = allowed_paths(pub)
    for name in changed:
        if name in allowed:
            continue
        if name.startswith("pillar/") and name.endswith(("/index.html", "/structure.json")):
            continue
        raise RunnerError("POST_CUT2_OUT_OF_SCOPE_CHANGE:" + name)


def ensure_layout(root: Path, path: Path):
    path = path.resolve()
    if path == root or root in path.parents:
        raise RunnerError("ARTIFACT_DIR_MUST_BE_OUTSIDE_CHECKOUT")
    path.mkdir(parents=True, exist_ok=True)
    return path


def safe_repo_path(name: str) -> bool:
    p = PurePosixPath(name)
    return bool(name) and not p.is_absolute() and ".." not in p.parts and "\\" not in name


def write_recovery(root: Path, artifact_dir: Path, pub: dict, expected_head: str,
                   status: str, step: str | None, logs: list[dict], error: str | None):
    artifact_dir = ensure_layout(root, artifact_dir)
    allowed = allowed_paths(pub)
    changed = sorted(changed_paths(root))
    included = [p for p in changed if p in allowed or
                (p.startswith("pillar/") and p.endswith(("/index.html", "/structure.json")))]
    deleted = [p for p in changed if p in allowed and not (root / p).exists()]
    manifest = {
        "schema": SCHEMA, "status": status, "content_id": pub["content_id"],
        "category": pub["category"], "branch": git(root, "branch", "--show-current"),
        "expected_push2_sha": expected_head, "head_sha": git(root, "rev-parse", "HEAD"),
        "handoff_sha256": handoff.digest((root / HANDOFF).read_bytes()),
        "next_step": step, "changed_paths": changed,
        "recovery_paths": included, "deleted_paths": deleted,
        "commands": logs, "error": error,
        "created_unix": int(time.time()),
    }
    (artifact_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    archive_path = artifact_dir / "worktree-changes.tar.gz"
    with tarfile.open(archive_path, "w:gz") as archive:
        for name in included:
            if not safe_repo_path(name):
                raise RunnerError("UNSAFE_RECOVERY_PATH:" + name)
            path = root / name
            if path.exists() and path.is_file():
                archive.add(path, arcname=name, recursive=False)
    return manifest


def restore_recovery(root: Path, artifact_dir: Path, expected_head: str,
                     expected_branch: str, reconcile_note: str) -> str:
    artifact_dir = ensure_layout(root, artifact_dir)
    manifest_path = artifact_dir / "manifest.json"
    archive_path = artifact_dir / "worktree-changes.tar.gz"
    if not manifest_path.is_file() or not archive_path.is_file():
        raise RunnerError("RECOVERY_ARTIFACT_INCOMPLETE")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schema") != SCHEMA or manifest.get("expected_push2_sha", "").lower() != expected_head.lower():
        raise RunnerError("RECOVERY_ARTIFACT_IDENTITY_MISMATCH")
    if git(root, "rev-parse", "HEAD").lower() != expected_head.lower():
        raise RunnerError("RECOVERY_BASE_SHA_MOVED")
    if git(root, "branch", "--show-current") != expected_branch:
        raise RunnerError("RECOVERY_BRANCH_MISMATCH")
    if changed_paths(root):
        raise RunnerError("RECOVERY_CHECKOUT_MUST_BE_CLEAN")
    allowed = set(manifest.get("recovery_paths", []))
    if not allowed or not allowed <= set(manifest.get("changed_paths", [])):
        raise RunnerError("RECOVERY_PATH_MANIFEST_INVALID")
    with tarfile.open(archive_path, "r:gz") as archive:
        members = archive.getmembers()
        names = set()
        for member in members:
            name = member.name
            if not safe_repo_path(name) or name not in allowed or not member.isfile():
                raise RunnerError("UNSAFE_RECOVERY_ARCHIVE_MEMBER:" + name)
            names.add(name)
        if names != allowed:
            raise RunnerError("RECOVERY_ARCHIVE_CONTENT_MISMATCH")
        for member in members:
            destination = root / member.name
            destination.parent.mkdir(parents=True, exist_ok=True)
            source = archive.extractfile(member)
            if source is None:
                raise RunnerError("RECOVERY_ARCHIVE_READ_FAILED:" + member.name)
            destination.write_bytes(source.read())
    if handoff.digest((root / HANDOFF).read_bytes()) != manifest.get("handoff_sha256"):
        raise RunnerError("RECOVERY_HANDOFF_DIGEST_MISMATCH")
    step = manifest.get("next_step")
    if step not in ("C.8", "C.7", "D", "E", "F", "G"):
        raise RunnerError("RECOVERY_STEP_NOT_RESUMABLE")
    error = manifest.get("error")
    if not error or not reconcile_note.strip():
        raise RunnerError("RECOVERY_CAUSE_MISSING")
    deleted = manifest.get("deleted_paths", [])
    if any(path not in allowed for path in deleted):
        raise RunnerError("RECOVERY_DELETED_PATH_INVALID")
    for name in deleted:
        path = root / name
        if path.exists():
            path.unlink()
    _, digest = publication(root)
    current_pub = publication(root)[0]
    g_state = next((row["status"] for row in current_pub.get("steps", [])
                    if row["id"] == "G"), None)
    if step == "G" and g_state == "pending" and handoff.next_step(current_pub) == "G":
        # G is a mechanical report checkpoint. If it was still pending in the
        # failed attempt, there is no prior G evidence to invalidate.
        return "G remains pending after reviewed recovery; continue from G."
    cmd = [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
           "--repo", str(root), "invalidate", "--expected-sha256", digest,
           "--from-step", step,
           "--reconcile-note", reconcile_note.strip() + "; prior attempt: " + error]
    p = subprocess.run(cmd, cwd=root, text=True, stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT)
    if p.returncode:
        raise RunnerError("RECOVERY_INVALIDATION_FAILED:" + p.stdout.strip())
    return p.stdout


def run_command(root: Path, artifact_dir: Path, label: str, argv: list[str], logs: list[dict]):
    idx = len(logs) + 1
    out = artifact_dir / "logs" / f"{idx:02d}-{label}.stdout.log"
    err = artifact_dir / "logs" / f"{idx:02d}-{label}.stderr.log"
    out.parent.mkdir(parents=True, exist_ok=True)
    p = subprocess.run(argv, cwd=root, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out.write_text(p.stdout, encoding="utf-8")
    err.write_text(p.stderr, encoding="utf-8")
    logs.append({"label": label, "argv": argv, "exit_code": p.returncode,
                 "stdout": str(out.relative_to(artifact_dir)),
                 "stderr": str(err.relative_to(artifact_dir))})
    if p.returncode:
        raise RunnerError(f"{label} exited {p.returncode}; see {out.name} and {err.name}")


def run_phase(root: Path, artifact_dir: Path, args):
    expected = args.expected_head.lower()
    actual = git(root, "rev-parse", "HEAD").lower()
    if actual != expected:
        raise RunnerError("EXPECTED_PUSH2_SHA_MISMATCH")
    branch = git(root, "branch", "--show-current")
    if branch != args.expected_branch:
        raise RunnerError("EXPECTED_BRANCH_MISMATCH")
    remote_head = git(root, "ls-remote", "origin", f"refs/heads/{branch}").split()[0:1]
    if not remote_head or remote_head[0].lower() != expected:
        raise RunnerError("REMOTE_BRANCH_MOVED_OR_UNOBSERVABLE")

    pub, _ = publication(root)
    if not lifecycle.editorial_cut_v2(pub):
        raise RunnerError("V2_REQUIRED")
    if lifecycle.delivery_boundary(pub) != 2:
        raise RunnerError("NOT_AT_V2_SECOND_DELIVERY")
    lifecycle.require_fixed_cut_readiness(pub, root)
    if any(a["status"] in ("started", "outcome_unknown") for a in pub["external_actions"]):
        raise RunnerError("EXTERNAL_ACTION_OUTCOME_UNKNOWN")
    expect_title, expect_caption = phase_f_expectations(pub, args)

    logs: list[dict] = []
    current = handoff.next_step(pub)
    try:
        if current == "C.8":
            record_step(root, "C.8", "started", ["GitHub Actions post-Push-2 mechanical runner started"])
            for i, command in enumerate(command_plan(root, pub), 1):
                run_command(root, artifact_dir, f"C8-builder-{i}", command, logs)
            verify_scope(root, pub)
            record_step(root, "C.8", "completed", [
                "All applicable canonical C.8 builders passed; logs are in the recovery artifact."
            ], note=(
                "Reviewed C.8 worktree after all builders and verify_scope: generated files are within "
                "the canonical publication allowlist, and tests/fixtures were left untouched."
            ))
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "C.7":
            record_step(root, "C.7", "started", ["C.8 builder outputs are complete"])
            run_command(root, artifact_dir, "C7-stamp-version",
                        ["python3", "tools/stamp-version.py"], logs)
            verify_scope(root, pub)
            record_step(root, "C.7", "completed", ["tools/stamp-version.py passed after C.8"], note=(
                "Reviewed C.7 version-stamp worktree after verify_scope; all changed files are "
                "canonical generated publication outputs."
            ))
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "D":
            challenge = next(s for s in pub["steps"] if s["id"] == "C.4.14")
            litecast = handoff.publication_category(pub) == "litecast"
            if litecast or challenge["status"] == "completed":
                reason = "Canonical Phase D exemption: LiteCast" if litecast else "Canonical Phase D exemption: Challenge"
                record_step(root, "D", "skipped", reason=reason)
            else:
                record_step(root, "D", "started", ["English mirror and reciprocal toggles were editorially closed before C.6; technical verification only"])
                run_command(root, artifact_dir, "D-inject-hreflang",
                            ["python3", ".github/scripts/inject_hreflang.py"], logs)
                run_command(root, artifact_dir, "D-noindex-en-mirrors",
                            ["python3", "tools/noindex_en_mirrors.py", "--check"], logs)
                run_command(root, artifact_dir, "D-generate-sitemap",
                            ["python3", ".github/scripts/gen_sitemap.py"], logs)
                run_command(root, artifact_dir, "D-restamp-version",
                            ["python3", "tools/stamp-version.py"], logs)
                pub, _ = publication(root)
                verify_scope(root, pub)
                record_step(root, "D", "completed", [
                    "Technical English, noindex, hreflang, sitemap, and final version checks passed; logs are in the recovery artifact."
                ], note=(
                    "Reviewed Phase D technical outputs after verify_scope: hreflang, sitemap and version-stamp "
                    "changes are canonical generated publication outputs."
                ))
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "E":
            category = handoff.publication_category(pub)
            if category in ("litecast", "glossary"):
                record_step(root, "E", "skipped", reason=f"Canonical Phase E exemption: {category}")
            else:
                record_step(root, "E", "started", ["Ensure the single canonical dc-notify publish marker"])
                page = root / (pub["content_id"] + ".html")
                if not page.is_file():
                    raise RunnerError("PUBLISH_PAGE_MISSING_FOR_PHASE_E")
                # Bytes, not read_text: universal newlines would rewrite a
                # CRLF page (most cloned templates) to LF and revoke approval.
                html = page.read_bytes().decode("utf-8")
                marker = '<meta name="dc-notify" content="true">'
                if html.count(marker) > 1:
                    raise RunnerError("DUPLICATE_DC_NOTIFY_MARKER")
                if marker not in html:
                    head_end = html.lower().find("</head>")
                    if head_end < 0:
                        raise RunnerError("PAGE_HEAD_MISSING_FOR_PHASE_E")
                    # No added whitespace: the approved-page text digest stays
                    # unchanged (else the E checkpoint needs an invalidation),
                    # and removing the marker restores the Push-2 bytes that a
                    # page-bound DES exemption was hashed on.
                    html = html[:head_end] + marker + html[head_end:]
                    page.write_text(html, encoding="utf-8", newline="")
                verify_scope(root, pub)
                record_step(root, "E", "completed", ["Canonical dc-notify marker present exactly once"], note=(
                    "Reviewed Phase E after verify_scope: the only possible change is the single canonical "
                    "dc-notify marker in the publication page head."
                ))
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "F":
            _, digest = publication(root)
            cmd = [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
                   "--repo", str(root), "verify", "--expected-sha256", digest]
            if expect_title:
                cmd.extend(["--expect-title", expect_title])
            if expect_caption:
                cmd.extend(["--expect-caption", expect_caption])
            run_command(root, artifact_dir, "F-verify-publish", cmd, logs)
            verify_scope(root, publication(root)[0])
            current = handoff.next_step(publication(root)[0])
        if current not in ("G", None):
            raise RunnerError("UNEXPECTED_POST_CUT2_STEP:" + str(current))
        return {"status": "mechanical_steps_complete", "next_step": current,
                "publication_completed": False, "third_delivery_created": False,
                "artifact_dir": str(artifact_dir), "commands": logs}
    except Exception as exc:
        try:
            pub, _ = publication(root)
            write_recovery(root, artifact_dir, pub, expected, "blocked", current, logs, str(exc))
        except Exception as recovery_exc:
            raise RunnerError(f"{exc}; recovery bundle failed: {recovery_exc}") from exc
        raise


def record_publication(root: Path, artifact_dir: Path, pub: dict, digest: str):
    """Persist one canonical publication-context update through the handoff CLI."""
    path = artifact_dir / "post-cut2-record-input.json"
    path.write_text(json.dumps(pub, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    cmd = [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
           "--repo", str(root), "record", "--expected-sha256", digest, "--input", str(path)]
    p = subprocess.run(cmd, cwd=root, text=True, stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT)
    path.unlink(missing_ok=True)
    if p.returncode:
        raise RunnerError("POST_CUT2_RECORD_FAILED:" + p.stdout.strip())
    _, next_digest = publication(root)
    return next_digest


def write_delivery_recovery(root: Path, artifact_dir: Path, base_sha: str,
                            branch: str, error: str):
    """Preserve a prepared third delivery if its remote outcome needs an agent."""
    artifact_dir.mkdir(parents=True, exist_ok=True)
    head = git(root, "rev-parse", "HEAD")
    metadata = lifecycle.metadata_path(root)
    if metadata.is_file():
        (artifact_dir / "cleanup-record.json").write_bytes(metadata.read_bytes())
    bundle = artifact_dir / "final-delivery.bundle"
    if head != base_sha:
        p = subprocess.run(["git", "bundle", "create", str(bundle), "HEAD", "^" + base_sha],
                           cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if p.returncode:
            error += "; bundle creation failed: " + p.stdout.strip()
    remote = git(root, "ls-remote", "origin", f"refs/heads/{branch}", check=False).split()
    manifest = {
        "schema": "dentcast-post-cut2-final-delivery-recovery-v1",
        "base_sha": base_sha,
        "attempted_head": head,
        "remote_head_observed": remote[0] if remote else None,
        "branch": branch,
        "error": error,
        "next_action": "Inspect remote_head_observed. If it equals attempted_head, restore cleanup-record.json and run confirm-cleanup. If it equals base_sha, import and push the exact final-delivery.bundle commit, then run confirm-cleanup. Do not create another commit.",
    }
    (artifact_dir / "final-delivery-recovery.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def finalize_and_push(root: Path, artifact_dir: Path, expected_head: str,
                      expected_branch: str, run_url: str):
    """Record G, prepare delivery 3 canonically, push once, then confirm cleanup."""
    artifact_dir = ensure_layout(root, artifact_dir)
    parsed_run_url = urlparse(run_url)
    if parsed_run_url.scheme != "https" or not parsed_run_url.netloc \
            or "/actions/runs/" not in parsed_run_url.path:
        raise RunnerError("GITHUB_ACTIONS_RUN_URL_REQUIRED")
    pub, digest = publication(root)
    if handoff.next_step(pub) != "G":
        raise RunnerError("FINAL_REPORT_NOT_AT_G")
    content_id = pub["content_id"]

    report = [
        "## Automated post-Push-2 publication report", "",
        f"- Second-delivery SHA: `{expected_head}`",
        f"- Branch: `{expected_branch}`",
        f"- Mechanical workflow run: {run_url}",
        "- C.8 builders, C.7 stamping, applicable technical D, E, and real Phase F completed.",
        "- The canonical completion receipt will be included in delivery 3.",
    ]
    for item in sorted((artifact_dir / "logs").glob("*.stdout.log")):
        report.append(f"- `{item.name}`: output captured in this run's recovery artifact.")
    report_path = artifact_dir / "final-report.md"
    report_path.write_text("\n".join(report) + "\n", encoding="utf-8")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report_path.read_text(encoding="utf-8") + "\n")

    try:
        digest = record_step(root, "G", "started", [run_url])
        pub, digest = publication(root)
        pub["context"]["delivery"].append({
            "scope": "GitHub Actions post-Push-2 mechanical continuation",
            "evidence": [run_url],
        })
        digest = record_publication(root, artifact_dir, pub, digest)
        record_step(root, "G", "completed", [run_url])
        digest = publication(root)[1]

        finish = subprocess.run(
            [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
             "--repo", str(root), "finish", "--expected-sha256", digest],
            cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if finish.returncode:
            raise RunnerError("FINALIZE_FAILED:" + finish.stdout.strip())

        # Delivery 3 may contain only generated scope, the canonical receipt,
        # the public technical report and deletion of the active handoff.
        completion = lifecycle.completion_path({"content_id": content_id})
        report = lifecycle.technical_report_path(pub)  # written by finish
        allowed = allowed_paths(pub) | {completion, report}
        changed = changed_paths(root)
        if changed - allowed:
            raise RunnerError("POST_CUT2_FINAL_OUT_OF_SCOPE:" + ",".join(sorted(changed - allowed)))
        git(root, "add", "--all")
        guard = subprocess.run(
            [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
             "--repo", str(root), "guard", "--phase", "pre-commit"],
            cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if guard.returncode:
            raise RunnerError("FINAL_DELIVERY_GUARD_FAILED:" + guard.stdout.strip())
        git(root, "config", "user.name", "github-actions[bot]")
        git(root, "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
        git(root, "commit", "-m", f"Complete publication {expected_branch} delivery 3")
        third_sha = git(root, "rev-parse", "HEAD")
        if git(root, "rev-parse", "HEAD^") != expected_head:
            raise RunnerError("FINAL_DELIVERY_PARENT_MISMATCH")
        pushed = subprocess.run(["git", "push", "origin", f"HEAD:refs/heads/{expected_branch}"],
                                cwd=root, text=True, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT)
        remote = git(root, "ls-remote", "origin", f"refs/heads/{expected_branch}", check=False).split()
        if not remote or remote[0] != third_sha:
            detail = pushed.stdout.strip() or "remote branch did not advance to the final commit"
            raise RunnerError("FINAL_DELIVERY_PUSH_UNCONFIRMED:" + detail)
        confirmed = subprocess.run(
            [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
             "--repo", str(root), "confirm-cleanup"],
            cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if confirmed.returncode:
            raise RunnerError("FINAL_CLEANUP_CONFIRM_FAILED:" + confirmed.stdout.strip())
        if pushed.returncode:
            # A nonzero response can still mean the remote accepted the commit;
            # exact ls-remote confirmation above is authoritative.
            pass
        return {"status": "publication_completed", "third_delivery_sha": third_sha,
                "publication_completed": True, "run_url": run_url}
    except Exception as exc:
        if lifecycle.pending(root):
            head = git(root, "rev-parse", "HEAD")
            if head == expected_head:
                restore = subprocess.run(
                    [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
                     "--repo", str(root), "restore-cleanup"],
                    cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
                if restore.returncode == 0 and (root / HANDOFF).is_file():
                    pub, _ = publication(root)
                    write_recovery(root, artifact_dir, pub, expected_head,
                                   "blocked", "G", [], str(exc))
                else:
                    write_delivery_recovery(root, artifact_dir, expected_head,
                                            expected_branch, str(exc) + "; " + restore.stdout.strip())
            else:
                write_delivery_recovery(root, artifact_dir, expected_head,
                                        expected_branch, str(exc))
        elif (root / HANDOFF).is_file():
            pub, _ = publication(root)
            write_recovery(root, artifact_dir, pub, expected_head, "blocked", "G", [], str(exc))
        raise


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=".")
    ap.add_argument("--expected-head", required=True)
    ap.add_argument("--expected-branch", required=True)
    ap.add_argument("--artifact-dir", required=True)
    ap.add_argument("--expect-title")
    ap.add_argument("--expect-caption")
    ap.add_argument("--deliver-third", action="store_true",
                     help="Complete G and create/push the canonical third delivery")
    ap.add_argument("--run-url", help="GitHub Actions run URL used as G/report evidence")
    ap.add_argument("--preflight-only", action="store_true",
                     help="Print a read-only trigger decision without running builders")
    ap.add_argument("--resume-artifact", help="Restore and reconcile a prior recovery bundle after agent review")
    ap.add_argument("--reconcile-note", help="Required agent/operator note when restoring a failed attempt")
    args = ap.parse_args(argv)
    root = Path(args.repo).resolve()
    artifact_dir = Path(args.artifact_dir).resolve()
    try:
        if args.preflight_only:
            result = preflight(root, args.expected_head, args.expected_branch)
            print(json.dumps(result, ensure_ascii=False))
            output = os.environ.get("GITHUB_OUTPUT")
            if output:
                with open(output, "a", encoding="utf-8") as f:
                    f.write(f"continue={str(result['continue']).lower()}\n")
                    f.write(f"reason={result['reason']}\n")
            return 0
        if args.resume_artifact:
            restored = restore_recovery(root, Path(args.resume_artifact),
                                        args.expected_head, args.expected_branch,
                                        args.reconcile_note or "")
            print(restored)
        ensure_layout(root, artifact_dir)
        result = run_phase(root, artifact_dir, args)
        if args.deliver_third:
            delivery = finalize_and_push(
                root, artifact_dir, args.expected_head, args.expected_branch,
                args.run_url or "")
            result["delivery"] = delivery
            result.update(status=delivery["status"],
                          publication_completed=delivery["publication_completed"],
                          third_delivery_created=True, next_step=None)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(json.dumps({"status": "blocked", "error": str(exc),
                          "publication_completed": False,
                          "third_delivery_created": False,
                          "artifact_dir": str(artifact_dir)},
                         ensure_ascii=False, indent=2))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
