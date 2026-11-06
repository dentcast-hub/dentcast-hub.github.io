#!/usr/bin/env python3
"""Publish day of the queue lane. It runs on GitHub Actions, never in an agent sandbox.

    python3 tools/queue_publish.py pick   <queue-dir> [--nn NN]
    python3 tools/queue_publish.py lock   <item> --agent NAME
    python3 tools/queue_publish.py run    <item> --agent NAME [--supplement f.json]
    python3 tools/queue_publish.py done   <item> --content-id ID --pr N
    python3 tools/queue_publish.py unlock <item> --agent NAME [--force]
    python3 tools/queue_publish.py status [<queue-dir>]

The publish-day route is `.github/workflows/queue-publish.yml` (pick, lock,
branch `queue-publish/<item folder>`, run, unlock on failure, then the PR after
post-cut2-mechanical.yml's delivery 3) and `.github/workflows/queue-publish-done.yml`
(done after the merge). An agent only dispatches and monitors them; it never
moves file bytes to GitHub (queue-route.md).

pick   the oldest «آماده» item not locked by another agent (or the named NN);
       older items that are not ready are listed, nothing is changed.
lock   status «در حال انتشار» + the lock line in 00-وضعیت.md, one commit
       `queue: NN lock for publishing` in the queue checkout (push: printed).
run    on the publication branch (fresh from origin/main): manifest check and
       a dry run first — a refusal leaves the checkout untouched — then the
       ledger, queue_apply, the ledger records, steps to C.6, one commit, one
       push (Push 2). Prints the Push-2 line for the founder. C.8 onward is
       post-cut2-mechanical.yml.
done   after the merge: the item folder is removed from `queue` in one commit
       `queue: NN published as <content_id> (PR #n)` (push: printed).
unlock the inverse of lock, for a publish run that died before Push 2: status
       back to «آماده», «قفل: ندارد», one commit `queue: NN unlock (publish run
       aborted)` (push: printed). Refuses a lock held by another name unless
       --force (the founder clearing a dead agent's lock) and refuses an item
       whose status is not «در حال انتشار».
status read-only: where the queue publication stands, from GitHub facts only
       (origin/queue after a fetch, or the given queue checkout; the remote
       `queue-publish/NN-*` branch; the handoff on its head; the latest
       post-cut2-mechanical.yml run; the PR). It updates remote-tracking refs and
       nothing else. GitHub API: `gh api`, else urllib with GH_TOKEN/GITHUB_TOKEN,
       else "unknown" (never a failure). One `state` and `next_step` per locked item:

         IDLE                          no item is «در حال انتشار»: nothing to resume
         LOCKED_NO_BRANCH              Push 2 never landed: unlock, re-dispatch queue-publish.yml
         AMBIGUOUS_BRANCHES            several queue-publish/NN-* branches: founder decides
         PUSH2_NO_RUN                  dispatch post-cut2-mechanical.yml (target_branch, expected_head printed)
         PUSH2_RUN_IN_PROGRESS         wait for that run
         PUSH2_RUN_FAILED              inspect the run, then re-dispatch post-cut2 (inputs printed)
         PUSH2_RECONCILIATION_REQUIRED head is past the handoff's checkpoint commit: a reconciliation
                                       commit (handoff re-saved with --reconcile-note) comes first
         PUSH2_RUN_UNKNOWN             the API is unavailable: open the Actions tab for the branch
         BRANCH_WITHOUT_HANDOFF        no handoff and no completion receipt on the head: inspect
         DELIVERY3_NO_PR               delivery 3 is on the branch: open the PR to main
         PR_OPEN                       merge when every gate is green (founder's decision)
         PR_CLOSED_UNMERGED            founder decides (unlock, or reopen)
         PR_MERGED_ITEM_IN_QUEUE       run done (queue-publish-done.yml normally does it)
         PR_UNKNOWN                    the API is unavailable: look up the PR for the branch

Every refusal prints the tool's JSON verbatim and exits non-zero. Nothing here
writes text, asks, or chooses: the content_id is the next free number of the
category, the date is today, every decision comes from the frozen item.
"""
import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import queue_manifest as qm  # noqa: E402

HANDOFF = ".dentcast/PUBLISH-HANDOFF.md"


class Stop(Exception):
    def __init__(self, code, message, **detail):
        super().__init__(message)
        self.detail = {"status": "refused", "code": code, "message": message, **detail}


def sh(cmd, cwd=ROOT, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise Stop("COMMAND_FAILED", " ".join(map(str, cmd)), stdout=r.stdout[-2000:], stderr=r.stderr[-1000:])
    return r


def py(*args, check=False):
    return sh([sys.executable, *map(str, args)], check=check)


def as_json(r):
    try:
        return json.loads(r.stdout)
    except ValueError:
        return {"stdout": r.stdout[-2000:], "stderr": r.stderr[-1000:]}


def git(*args, cwd=ROOT, check=True):
    return sh(["git", *args], cwd=cwd, check=check).stdout.strip()


# ------------------------------------------------------------------ pick / lock / done

def pick(queue_dir, nn=None):
    base = Path(queue_dir)
    base = base / "queue" if (base / "queue").is_dir() else base
    if not base.is_dir():
        raise Stop("QUEUE_DIR_NOT_FOUND", f"{queue_dir} is not a queue checkout")
    items = sorted(p for p in base.iterdir() if p.is_dir() and re.fullmatch(r"\d\d-[a-z]+-.+", p.name))
    skipped = []
    for p in items:
        if nn and not p.name.startswith(nn + "-"):
            continue
        st = qm.status_fields(p)
        ready = (st["status"] or "").startswith("آماده") and not st["lock"]
        if ready:
            return {"status": "picked", "item": str(p), "nn": p.name[:2], "older_not_ready": skipped}
        skipped.append({"item": p.name, "status": st["status"], "lock": st["lock"]})
    if nn:
        raise Stop("NAMED_ITEM_NOT_READY", f"queue item {nn} is not «آماده» or is locked", items=skipped)
    raise Stop("NO_READY_ITEM", "no «آماده» item in the queue", items=skipped)


def _set_status_lines(p, values):
    """Rewrite the first «وضعیت:» and «قفل:» lines of 00-وضعیت.md, keeping their prefix bytes."""
    text = p.read_text(encoding="utf-8")
    done = {"وضعیت": False, "قفل": False}
    out = []
    for line in text.split("\n"):
        m = re.match(r"^(\s*(?:[-*]\s*)?\**\s*)(وضعیت|قفل)(\s*\**\s*:\s*)(.*)$", line)
        if m and not done[m.group(2)]:
            done[m.group(2)] = True
            line = m.group(1) + m.group(2) + m.group(3) + values[m.group(2)]
        out.append(line)
    if not all(done.values()):
        raise Stop("STATUS_LINES", f"{qm.STATUS_FILE} lacks a «وضعیت:» or «قفل:» line")
    p.write_text("\n".join(out), encoding="utf-8")


def _commit_status(item, p, message, **extra):
    repo = Path(git("rev-parse", "--show-toplevel", cwd=item))
    git("add", str(p), cwd=repo)
    git("commit", "-q", "-m", message, cwd=repo)
    return {"item": item.name, "commit": git("rev-parse", "HEAD", cwd=repo),
            "push": f"git -C {repo} push origin queue", **extra}


def lock(item, agent):
    item = Path(item).resolve()
    qm.load_item(item, agent=agent)  # SHA256SUMS, status, no foreign lock
    p = item / qm.STATUS_FILE
    today = datetime.date.today().isoformat()
    _set_status_lines(p, {"وضعیت": "در حال انتشار", "قفل": f"{agent}، {today}"})
    return {"status": "locked", **_commit_status(item, p, f"queue: {item.name[:2]} lock for publishing")}


READY, UNLOCKED = "آماده", "ندارد"  # publish-queue.md: «آماده», and «با «آماده» قفل پاک می‌شود»


def unlock(item, agent, force=False):
    item = Path(item).resolve()
    if not item.is_dir():
        raise Stop("ITEM_NOT_FOUND", f"{item} is not a queue item folder")
    st = qm.status_fields(item)
    if not (st["status"] or "").startswith("در حال انتشار"):
        raise Stop("NOT_PUBLISHING", f"{item.name}: status is «{st['status']}», not «در حال انتشار» — nothing to unlock")
    if st["lock"] and agent not in st["lock"] and not force:
        raise Stop("FOREIGN_LOCK", f"{item.name} is locked by «{st['lock']}», not «{agent}»; only the founder "
                   "clears another agent's lock (--force)", lock=st["lock"])
    p = item / qm.STATUS_FILE
    _set_status_lines(p, {"وضعیت": READY, "قفل": UNLOCKED})
    return {"status": "unlocked", "previous_lock": st["lock"], "forced": bool(force and st["lock"]
                                                                              and agent not in st["lock"]),
            **_commit_status(item, p, f"queue: {item.name[:2]} unlock (publish run aborted)")}


def done_item(item, cid, pr):
    item = Path(item).resolve()
    repo = Path(git("rev-parse", "--show-toplevel", cwd=item))
    git("rm", "-r", "-q", str(item), cwd=repo)
    git("commit", "-q", "-m", f"queue: {item.name[:2]} published as {cid} (PR #{pr})", cwd=repo)
    return {"status": "removed", "item": item.name, "commit": git("rev-parse", "HEAD", cwd=repo),
            "push": f"git -C {repo} push origin queue"}


# ------------------------------------------------------------------ status (read-only)

BRANCH_PREFIX = "queue-publish/"
POST_CUT2 = "post-cut2-mechanical.yml"
QUEUE_PUBLISH = "queue-publish.yml"
PUSH2_SUBJECT = r"^(?P<cid>[a-z]+/[A-Za-z0-9-]+): publish queue item {nn} \(queue lane, Push 2\)$"


def repo_slug(repo):
    """owner/name of origin (GITHUB_REPOSITORY wins on Actions); None when it is not GitHub."""
    if os.environ.get("GITHUB_REPOSITORY"):
        return os.environ["GITHUB_REPOSITORY"]
    url = git("remote", "get-url", "origin", cwd=repo, check=False)
    m = re.search(r"github\.com[:/]+([^/]+/[^/]+?)(?:\.git)?/?$", url or "")
    return m.group(1) if m else None


def github_api(path):
    """GET a GitHub REST path. `gh api` first, then urllib with GH_TOKEN/GITHUB_TOKEN; None when
    neither answers (the caller reports "unknown", never fails)."""
    if shutil.which("gh"):
        r = subprocess.run(["gh", "api", path], capture_output=True, text=True)
        if r.returncode == 0:
            try:
                return json.loads(r.stdout)
            except ValueError:
                pass
    req = urllib.request.Request("https://api.github.com/" + path.lstrip("/"),
                                 headers={"Accept": "application/vnd.github+json", "User-Agent": "dentcast-queue"})
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as f:
            return json.loads(f.read().decode("utf-8"))
    except Exception:  # noqa: BLE001 — any API failure is "unknown", never a stop
        return None


def queue_items(repo, queue_dir=None):
    """[(folder name, «وضعیت», «قفل»)] of the queue: a checkout folder, or origin/queue after a fetch."""
    if queue_dir:
        base = Path(queue_dir)
        base = base / "queue" if (base / "queue").is_dir() else base
        out = []
        for p in sorted(base.iterdir()):
            if p.is_dir() and re.fullmatch(r"\d\d-[a-z]+-.+", p.name) and (p / qm.STATUS_FILE).exists():
                st = qm.status_from_text((p / qm.STATUS_FILE).read_text(encoding="utf-8"))
                out.append((p.name, st["status"], st["lock"]))
        return out, {"source": str(base.resolve())}
    fetched = sh(["git", "fetch", "-q", "--no-tags", "origin", "+refs/heads/queue:refs/remotes/origin/queue"],
                 cwd=repo, check=False).returncode == 0
    ref = "refs/remotes/origin/queue"
    sha = git("rev-parse", "--verify", "-q", ref, cwd=repo, check=False)
    if not sha:
        raise Stop("QUEUE_UNAVAILABLE", "origin/queue could not be fetched and no local copy exists")
    names = git("ls-tree", "-d", "--name-only", f"{ref}:queue", cwd=repo).splitlines()
    out = []
    for name in sorted(names):
        if not re.fullmatch(r"\d\d-[a-z]+-.+", name):
            continue
        r = sh(["git", "show", f"{ref}:queue/{name}/{qm.STATUS_FILE}"], cwd=repo, check=False)
        if r.returncode == 0:
            st = qm.status_from_text(r.stdout)
            out.append((name, st["status"], st["lock"]))
    return out, {"source": "origin/queue", "sha": sha, "fetched": fetched}


def _run_view(run):
    return None if not run else {k: run.get(k) for k in
                                 ("id", "event", "head_sha", "status", "conclusion", "html_url", "created_at")}


def post_cut2_dispatch(slug, branch, head):
    inputs = {"target_branch": branch, "expected_head": head}
    return {"workflow": POST_CUT2, "ref": branch, "inputs": inputs,
            "gh": f"gh workflow run {POST_CUT2} --ref {branch} -f target_branch={branch} -f expected_head={head}",
            "api": f"POST repos/{slug or '<owner>/<repo>'}/actions/workflows/{POST_CUT2}/dispatches "
                   + json.dumps({"ref": branch, "inputs": inputs})}


def item_status(repo, slug, name, st, lock, api, remote_heads):
    nn = name[:2]
    out = {"item": name, "nn": nn, "queue_status": st, "lock": lock}
    if remote_heads is None:
        return {**out, "state": "UNKNOWN", "next_step": "git ls-remote origin failed: retry `status` with network"}
    branches = sorted(b for b in remote_heads if b.startswith(f"{BRANCH_PREFIX}{nn}-"))
    out["branches"] = {b: remote_heads[b] for b in branches}
    if not branches:
        return {**out, "state": "LOCKED_NO_BRANCH",
                "next_step": (f"Push 2 never landed. `python3 tools/queue_publish.py unlock queue/{name} --agent "
                              f"\"<the lock's name>\"` on the queue checkout and push (the founder: --force), then "
                              f"dispatch {QUEUE_PUBLISH} with nn={nn}")}
    exact = BRANCH_PREFIX + name
    if len(branches) > 1 and exact not in branches:
        return {**out, "state": "AMBIGUOUS_BRANCHES", "next_step": "several publication branches for this NN: "
                "report them to the founder; nothing is dispatched"}
    branch = exact if exact in branches else branches[0]
    head = remote_heads[branch]
    out.update(branch=branch, head=head)
    tracking = f"refs/remotes/origin/{branch}"
    sh(["git", "fetch", "-q", "--no-tags", "origin", f"+refs/heads/{branch}:{tracking}"], cwd=repo, check=False)
    have = sh(["git", "cat-file", "-e", f"{head}^{{commit}}"], cwd=repo, check=False).returncode == 0
    handoff_on_head = handoff_commit = cid = push2 = None
    if have:
        handoff_on_head = sh(["git", "cat-file", "-e", f"{head}:{HANDOFF}"], cwd=repo, check=False).returncode == 0
        handoff_commit = git("log", "-1", "--format=%H", head, "--", HANDOFF, cwd=repo, check=False) or None
        rx = re.compile(PUSH2_SUBJECT.format(nn=re.escape(nn)))
        for line in git("log", "-n", "300", "--format=%H%x09%s", head, cwd=repo, check=False).splitlines():
            sha_, _, subj = line.partition("\t")
            m = rx.match(subj)
            if m:
                push2, cid = sha_, m.group("cid")
                break
    out.update(handoff_on_head=handoff_on_head, handoff_commit=handoff_commit, push2_sha=push2, content_id=cid)
    receipt = None
    if have and cid:
        section, slug_ = cid.split("/")
        receipt = sh(["git", "cat-file", "-e", f"{head}:.dentcast/publication-reports/{section}/{slug_}.completion.json"],
                     cwd=repo, check=False).returncode == 0
    out["completion_receipt_on_head"] = receipt
    q = urllib.parse.quote
    runs = api(f"repos/{slug}/actions/workflows/{POST_CUT2}/runs?branch={q(branch, safe='')}&per_page=30") \
        if slug else None
    run_list = (runs or {}).get("workflow_runs") if isinstance(runs, dict) else None
    run_head = next((r for r in run_list or [] if r.get("head_sha") == head), None)
    out["post_cut2"] = "unknown" if run_list is None else {"latest": _run_view((run_list or [None])[0]),
                                                            "for_head": _run_view(run_head),
                                                            "actions": f"https://github.com/{slug}/actions/workflows/"
                                                                       f"{POST_CUT2}?query=branch%3A{q(branch, safe='')}"}
    owner = slug.split("/")[0] if slug else ""
    prs = api(f"repos/{slug}/pulls?state=all&head={q(owner + ':' + branch, safe='')}&per_page=5") if slug else None
    pr = prs[0] if isinstance(prs, list) and prs else None
    out["pr"] = "unknown" if not isinstance(prs, list) else (pr and {
        "number": pr.get("number"), "state": pr.get("state"), "merged": bool(pr.get("merged_at")),
        "html_url": pr.get("html_url"), "head_sha": (pr.get("head") or {}).get("sha")})
    if pr:
        if pr.get("merged_at"):
            return {**out, "state": "PR_MERGED_ITEM_IN_QUEUE", "next_step": (
                f"queue-publish-done.yml normally removes the item; if it failed: `python3 tools/queue_publish.py "
                f"done queue/{name} --content-id {cid or '<content_id>'} --pr {pr['number']}` on the queue "
                "checkout and push")}
        if pr.get("state") == "open":
            return {**out, "state": "PR_OPEN", "next_step": f"merge PR #{pr['number']} when every gate is green "
                    "(founder's decision); a red gate means no merge"}
        return {**out, "state": "PR_CLOSED_UNMERGED", "next_step": f"PR #{pr['number']} was closed without merge: "
                "report it; the founder decides (reopen, or unlock and re-dispatch)"}
    if handoff_on_head is None:
        return {**out, "state": "UNKNOWN", "next_step": f"could not fetch {branch}: retry `status` with network"}
    if not handoff_on_head:
        if not receipt:
            return {**out, "state": "BRANCH_WITHOUT_HANDOFF", "next_step": "the head has neither the handoff nor a "
                    "completion receipt: report the evidence to the founder; nothing is dispatched"}
        if not isinstance(prs, list):
            return {**out, "state": "PR_UNKNOWN", "next_step": f"delivery 3 is on {branch}: look up its PR in the "
                    "GitHub UI (the API is unavailable here); none: open one to main"}
        return {**out, "state": "DELIVERY3_NO_PR", "next_step": (
            f"open the PR {branch} → main, title «{cid}: publish queue item {nn}» (the await-delivery-3 job of "
            f"{QUEUE_PUBLISH} normally does it)")}
    if handoff_commit != head:
        after = git("rev-list", f"{handoff_commit}..{head}", cwd=repo, check=False).split() if handoff_commit else []
        return {**out, "state": "PUSH2_RECONCILIATION_REQUIRED", "commits_after_handoff": after,
                "next_step": ("the branch head is past the handoff's checkpoint commit: post-cut2 would refuse with "
                              "RECONCILIATION_REQUIRED. A reconciliation commit (the handoff re-saved with "
                              "--reconcile-note) is required before any re-dispatch; report it to the founder"),
                "after_reconciliation": "dispatch post-cut2 with expected_head = the reconciliation commit"}
    if run_list is None:
        return {**out, "state": "PUSH2_RUN_UNKNOWN", "dispatch": post_cut2_dispatch(slug, branch, head),
                "next_step": f"the API is unavailable: open the Actions tab of {POST_CUT2} for {branch}"}
    if not run_head:
        return {**out, "state": "PUSH2_NO_RUN", "dispatch": post_cut2_dispatch(slug, branch, head),
                "next_step": f"dispatch {POST_CUT2} with exactly the inputs in `dispatch`"}
    if run_head.get("status") != "completed":
        return {**out, "state": "PUSH2_RUN_IN_PROGRESS", "next_step": f"wait for {run_head.get('html_url')}"}
    note = "" if run_head.get("conclusion") != "success" else \
        " (the run succeeded but delivery 3 is not on the branch: its preflight skipped this head)"
    return {**out, "state": "PUSH2_RUN_FAILED", "dispatch": post_cut2_dispatch(slug, branch, head),
            "next_step": (f"inspect {run_head.get('html_url')} (logs, recovery bundle){note}; after the cause is "
                          f"fixed, dispatch {POST_CUT2} with exactly the inputs in `dispatch`")}


def status(queue_dir=None, repo=ROOT, slug=None, api=github_api):
    repo = Path(repo)
    slug = slug or repo_slug(repo)
    items, source = queue_items(repo, queue_dir)
    # only a publish lock counts; a preparation lock («در حال آماده‌سازی») is publish-queue.md's business
    locked = [(n, s_, l_) for n, s_, l_ in items if (s_ or "").startswith("در حال انتشار")]
    out = {"status": "status", "queue": source, "repository": slug, "locked": len(locked),
           "other_locks": [{"item": n, "queue_status": s_, "lock": l_} for n, s_, l_ in items
                           if l_ and not (s_ or "").startswith("در حال انتشار")]}
    if not locked:
        return {**out, "state": "IDLE", "next_step": "no item is «در حال انتشار»: nothing to resume", "items": []}
    r = sh(["git", "ls-remote", "--heads", "origin", f"refs/heads/{BRANCH_PREFIX}*"], cwd=repo, check=False)
    heads = None
    if r.returncode == 0:
        heads = {}
        for line in r.stdout.splitlines():
            sha_, _, ref = line.partition("\t")
            if ref.startswith("refs/heads/"):
                heads[ref[len("refs/heads/"):]] = sha_
    rows = [item_status(repo, slug, n, s_, l_, api, heads) for n, s_, l_ in locked]
    if len(rows) == 1:
        out.update(state=rows[0]["state"], next_step=rows[0]["next_step"])
    else:
        out.update(state="MULTIPLE", next_step="several items are locked: follow each item's next_step, oldest first")
    return {**out, "items": rows}


# ------------------------------------------------------------------ run

def handoff(*args):
    return as_json(py("tools/dentcast_publish_handoff.py", "--repo", ROOT, *args))


def digest():
    return handoff("inspect")["sha256"]


def step(sid, status, evidence=None):
    args = ["step", "--expected-sha256", digest(), "--id", sid, "--status", status]
    if evidence:
        args += ["--evidence", evidence]
    out = handoff(*args)
    if out.get("status") in ("blocked", "error", "refused") or "error" in out:
        raise Stop("LEDGER_STEP", f"{sid} {status}", output=out)


def run(item, agent, supplement=None):
    import queue_apply as qa
    item = Path(item).resolve()
    if (ROOT / HANDOFF).exists():
        raise Stop("ACTIVE_HANDOFF", f"{HANDOFF} exists: another publication may be in flight — ask whether to resume it")
    branch = git("branch", "--show-current")
    if branch in ("main", "queue", ""):
        raise Stop("BRANCH", "run on a publication branch made fresh from origin/main, not on main/queue")
    if git("status", "--porcelain"):
        raise Stop("DIRTY_TREE", "the checkout has uncommitted changes")
    cat = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name).group(1)
    if cat not in qa.CATEGORIES:
        raise Stop("CATEGORY_UNSUPPORTED", f"category «{cat}»: publish it on the normal route (.dentcast/workflows/README.md)")
    c = qa.CATEGORIES[cat]
    n, _ = qa.next_number(cat)
    cid = f"{c['dir']}/{c['stem']}{n}"
    sup = ["--supplement", supplement] if supplement else []
    # 1. everything that can refuse, before anything is written
    chk = as_json(py("tools/queue_manifest.py", "check", item, "--agent", agent, *sup))
    if chk.get("status") != "complete":
        raise Stop(chk.get("code") or "MANIFEST_INCOMPLETE", chk.get("message") or "fields missing",
                   missing=chk.get("missing"))
    dry = as_json(py("tools/queue_apply.py", item, cid, "--agent", agent, "--dry-run", *sup))
    if dry.get("status") != "dry_run":
        raise Stop(dry.get("code", "APPLY_REFUSED"), dry.get("message", ""), output=dry)
    # 2. the ledger and the assembly
    work = ROOT / ".git" / "queue-publish"
    work.mkdir(exist_ok=True)
    pub, receipt = work / "pub.json", work / "receipt.json"
    try:
        out = as_json(py("tools/queue_ledger.py", "init-input", cid, "--out", pub))
        if out.get("status") != "written":
            raise Stop(out.get("code", "LEDGER_INPUT"), out.get("message", ""), output=out)
        out = handoff("init", "--input", pub)
        if not (ROOT / HANDOFF).exists():
            raise Stop("LEDGER_INIT", "dentcast_publish_handoff.py init failed", output=out)
        step("rules", "started")
        step("rules", "completed", "queue-route.md read; tools/queue_publish.py run")
        step("0", "started")
        step("0", "completed", f"queue_manifest check complete; dry run clean ({item.name})")
        step("C.2", "started")
        r = py("tools/queue_apply.py", item, cid, "--agent", agent, "--receipt", receipt, *sup)
        if r.returncode != 0:
            raise Stop(as_json(r).get("code", "APPLY_REFUSED"), "queue_apply.py refused (every byte restored)",
                       output=as_json(r))
        out = as_json(py("tools/queue_ledger.py", "record", receipt, "--item", item))
        if out.get("status") == "refused":
            raise Stop(out.get("code", "LEDGER_RECORD"), out.get("message", ""), output=out)
        rec = json.loads(receipt.read_text(encoding="utf-8"))
        step("C.2", "completed", f"queue_apply receipt sha256 {qa.sha(receipt.read_bytes())}")
        step("C.4.9", "started")
        step("C.4.9", "completed", f"4.8 {rec['report']['links_48']}; 4.7 {rec['report']['backlinks_47']}; "
                                   f"4.9 {rec['report']['explore_49']}")
        step("C.5.6", "started")
        step("C.5.6", "completed", f"pathways {rec.get('pathways')}")
        step("C.6", "started")
        step("C.6", "completed", "single delivery before the Action")
    except Stop:
        # nothing was committed and the tree was clean at the start: put it back
        if (ROOT / HANDOFF).exists():
            (ROOT / HANDOFF).unlink()
        sh(["git", "checkout", "--", "."], check=False)
        sh(["git", "clean", "-fdq"], check=False)
        raise
    # 3. the one delivery before the Action
    section, slug = cid.split("/")
    paths = sorted({f["path"] for f in rec["files"]} | {f"{section}/en/{slug}.html"})
    out = handoff("stage-delivery", "--expected-sha256", digest(), *sum((["--path", p] for p in paths), []))
    if out.get("status") in ("blocked", "error", "refused"):
        raise Stop("STAGE_DELIVERY", "stage-delivery refused", output=out)
    git("commit", "-q", "-m", f"{cid}: publish queue item {item.name[:2]} (queue lane, Push 2)")
    for wait in (0, 2, 4, 8, 16):
        time.sleep(wait)
        if sh(["git", "push", "-u", "origin", branch], check=False).returncode == 0:
            break
    else:
        raise Stop("PUSH_FAILED", f"git push -u origin {branch} failed after retries; the commit is local")
    head = git("rev-parse", "HEAD")
    return {"status": "push2_delivered", "content_id": cid, "branch": branch, "push2_sha": head,
            "pathways": rec.get("pathways"), "manual_steps": rec.get("manual_steps"),
            "mechanical_defaults": rec.get("mechanical_defaults"),
            "message": (f"کار ایجنت به Push 2 رسید: {cid} روی برنچ {branch} (SHA {head}). GitHub Actions "
                        "(post-cut2-mechanical.yml) تحویل پایانی را می‌سازد و ایجنت آن را پایش می‌کند.")}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=("pick", "lock", "run", "done", "unlock", "status"))
    ap.add_argument("path", nargs="?",
                    help="pick: queue checkout; status: optional queue checkout (default origin/queue); "
                         "others: the item folder")
    ap.add_argument("--nn")
    ap.add_argument("--agent")
    ap.add_argument("--supplement")
    ap.add_argument("--content-id")
    ap.add_argument("--pr")
    ap.add_argument("--force", action="store_true", help="unlock: clear a lock held by another name (founder)")
    a = ap.parse_args()
    try:
        if a.cmd in ("lock", "run", "unlock") and not a.agent:
            raise Stop("AGENT_REQUIRED", f"{a.cmd} needs --agent <lock name>")
        if a.cmd != "status" and not a.path:
            raise Stop("PATH_REQUIRED", f"{a.cmd} needs " + ("the queue checkout" if a.cmd == "pick" else "the item folder"))
        if a.cmd == "pick":
            out = pick(a.path, a.nn)
        elif a.cmd == "lock":
            out = lock(a.path, a.agent)
        elif a.cmd == "run":
            out = run(a.path, a.agent, a.supplement)
        elif a.cmd == "unlock":
            out = unlock(a.path, a.agent, a.force)
        elif a.cmd == "status":
            out = status(a.path)
        else:
            if not (a.content_id and a.pr):
                raise Stop("DONE_ARGS", "done needs --content-id and --pr")
            out = done_item(a.path, a.content_id, a.pr)
    except qm.QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 2
    except Stop as e:
        print(json.dumps(e.detail, ensure_ascii=False, indent=1))
        return 2
    print(json.dumps(out, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
