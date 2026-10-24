#!/usr/bin/env python3
"""Run the deterministic post-Push-2 publication work without committing.

This runner is intended for a future GitHub Actions job. It never commits or
pushes. On failure it writes a bounded recovery bundle outside the checkout;
an agent/operator must inspect the failure before resuming.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import tarfile
import time


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_publish_handoff as handoff  # noqa: E402
import dentcast_publish_lifecycle as lifecycle  # noqa: E402


SCHEMA = "dentcast-post-cut2-recovery-v1"
HANDOFF = ".dentcast/PUBLISH-HANDOFF.md"


class RunnerError(RuntimeError):
    pass


def git(root: Path, *args: str, check: bool = True) -> str:
    p = subprocess.run(["git", *args], cwd=root, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RunnerError(f"git {' '.join(args)} failed ({p.returncode}): {p.stderr.strip()}")
    return p.stdout.strip()


def publication(root: Path):
    state, digest = handoff.load_state(root)
    return state["publication"], digest


def record_step(root: Path, step_id: str, status: str,
                evidence=(), reason: str | None = None) -> str:
    _, digest = publication(root)
    cmd = [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
           "--repo", str(root), "step", "--expected-sha256", digest,
           "--id", step_id, "--status", status]
    for item in evidence:
        cmd += ["--evidence", item]
    if reason:
        cmd += ["--reason", reason]
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
    if pub["category"] == "episodes":
        cmds.append(["python3", "tools/build_episodes.py"])
    if rows["C.4.11"]["status"] == "completed":
        cmds.append(["node", "tools/build_flashcards_index.mjs"])
    if rows["C.4.12"]["status"] == "completed":
        cmds.append(["node", "tools/build_quiz_index.mjs"])
    if rows["C.4.14"]["status"] == "completed":
        cmds.append(["node", "tools/build_challenge_index.mjs"])
    cmds.append(["python3", ".github/scripts/inject_img_attrs.py"])
    if pub["category"] != "paper-only":
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
        "pillar/structure.json", "plus/content-index.json",
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
    if step not in ("C.8", "C.7", "D", "E", "F"):
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
    if not args.expect_title and not args.expect_caption:
        raise RunnerError("APPROVED_EXPECTED_TEXT_REQUIRED_FOR_PHASE_F")

    logs: list[dict] = []
    current = lifecycle.next_step(pub)
    try:
        if current == "C.8":
            record_step(root, "C.8", "started", ["GitHub Actions post-Push-2 mechanical runner started"])
            for i, command in enumerate(command_plan(root, pub), 1):
                run_command(root, artifact_dir, f"C8-builder-{i}", command, logs)
            verify_scope(root, pub)
            record_step(root, "C.8", "completed", [
                "All applicable canonical C.8 builders passed; logs are in the recovery artifact."])
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "C.7":
            record_step(root, "C.7", "started", ["C.8 builder outputs are complete"])
            run_command(root, artifact_dir, "C7-stamp-version",
                        ["python3", "tools/stamp-version.py"], logs)
            verify_scope(root, pub)
            record_step(root, "C.7", "completed", ["tools/stamp-version.py passed after C.8"])
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "D":
            challenge = next(s for s in pub["steps"] if s["id"] == "C.4.14")
            if pub["category"] == "litecast" or challenge["status"] == "completed":
                reason = "Canonical Phase D exemption: LiteCast" if pub["category"] == "litecast" else "Canonical Phase D exemption: Challenge"
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
                record_step(root, "D", "completed", ["Technical English, noindex, hreflang, sitemap, and final version checks passed; logs are in the recovery artifact."])
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "E":
            if pub["category"] in ("litecast", "glossary"):
                record_step(root, "E", "skipped", reason=f"Canonical Phase E exemption: {pub['category']}")
            else:
                record_step(root, "E", "started", ["Ensure the single canonical dc-notify publish marker"])
                page = root / (pub["content_id"] + ".html")
                if not page.is_file():
                    raise RunnerError("PUBLISH_PAGE_MISSING_FOR_PHASE_E")
                html = page.read_text(encoding="utf-8")
                marker = '<meta name="dc-notify" content="true">'
                if html.count(marker) > 1:
                    raise RunnerError("DUPLICATE_DC_NOTIFY_MARKER")
                if marker not in html:
                    head_end = html.lower().find("</head>")
                    if head_end < 0:
                        raise RunnerError("PAGE_HEAD_MISSING_FOR_PHASE_E")
                    html = html[:head_end] + "  " + marker + "\n" + html[head_end:]
                    page.write_text(html, encoding="utf-8", newline="")
                verify_scope(root, pub)
                record_step(root, "E", "completed", ["Canonical dc-notify marker present exactly once"])
            pub, _ = publication(root)
            current = handoff.next_step(pub)
        if current == "F":
            if not args.expect_title and not args.expect_caption:
                raise RunnerError("APPROVED_EXPECTED_TEXT_REQUIRED_FOR_PHASE_F")
            _, digest = publication(root)
            cmd = [sys.executable, str(root / "tools/dentcast_publish_handoff.py"),
                   "--repo", str(root), "verify", "--expected-sha256", digest]
            if args.expect_title:
                cmd.extend(["--expect-title", args.expect_title])
            if args.expect_caption:
                cmd.extend(["--expect-caption", args.expect_caption])
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


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=".")
    ap.add_argument("--expected-head", required=True)
    ap.add_argument("--expected-branch", required=True)
    ap.add_argument("--artifact-dir", required=True)
    ap.add_argument("--expect-title")
    ap.add_argument("--expect-caption")
    ap.add_argument("--resume-artifact", help="Restore and reconcile a prior recovery bundle after agent review")
    ap.add_argument("--reconcile-note", help="Required agent/operator note when restoring a failed attempt")
    args = ap.parse_args(argv)
    root = Path(args.repo).resolve()
    artifact_dir = Path(args.artifact_dir).resolve()
    try:
        if args.resume_artifact:
            restored = restore_recovery(root, Path(args.resume_artifact),
                                        args.expected_head, args.expected_branch,
                                        args.reconcile_note or "")
            print(restored)
        ensure_layout(root, artifact_dir)
        result = run_phase(root, artifact_dir, args)
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
