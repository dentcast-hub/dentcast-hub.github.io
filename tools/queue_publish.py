#!/usr/bin/env python3
"""Publish day of the queue lane — the agent's whole part, one command each.

    python3 tools/queue_publish.py pick <queue-dir> [--nn NN]
    python3 tools/queue_publish.py lock <item> --agent NAME
    python3 tools/queue_publish.py run  <item> --agent NAME [--supplement f.json]
    python3 tools/queue_publish.py done <item> --content-id ID --pr N

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

Every refusal prints the tool's JSON verbatim and exits non-zero. Nothing here
writes text, asks, or chooses: the content_id is the next free number of the
category, the date is today, every decision comes from the frozen item.
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
import time
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


def lock(item, agent):
    item = Path(item).resolve()
    qm.load_item(item, agent=agent)  # SHA256SUMS, status, no foreign lock
    p = item / qm.STATUS_FILE
    text = p.read_text(encoding="utf-8")
    today = datetime.date.today().isoformat()
    done = {"وضعیت": False, "قفل": False}
    out = []
    for line in text.split("\n"):
        m = re.match(r"^(\s*(?:[-*]\s*)?\**\s*)(وضعیت|قفل)(\s*\**\s*:\s*)(.*)$", line)
        if m and not done[m.group(2)]:
            done[m.group(2)] = True
            value = "در حال انتشار" if m.group(2) == "وضعیت" else f"{agent}، {today}"
            line = m.group(1) + m.group(2) + m.group(3) + value
        out.append(line)
    if not all(done.values()):
        raise Stop("STATUS_LINES", f"{qm.STATUS_FILE} lacks a «وضعیت:» or «قفل:» line")
    p.write_text("\n".join(out), encoding="utf-8")
    repo = Path(git("rev-parse", "--show-toplevel", cwd=item))
    git("add", str(p), cwd=repo)
    git("commit", "-q", "-m", f"queue: {item.name[:2]} lock for publishing", cwd=repo)
    return {"status": "locked", "item": item.name, "commit": git("rev-parse", "HEAD", cwd=repo),
            "push": f"git -C {repo} push origin queue"}


def done_item(item, cid, pr):
    item = Path(item).resolve()
    repo = Path(git("rev-parse", "--show-toplevel", cwd=item))
    git("rm", "-r", "-q", str(item), cwd=repo)
    git("commit", "-q", "-m", f"queue: {item.name[:2]} published as {cid} (PR #{pr})", cwd=repo)
    return {"status": "removed", "item": item.name, "commit": git("rev-parse", "HEAD", cwd=repo),
            "push": f"git -C {repo} push origin queue"}


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
    ap.add_argument("cmd", choices=("pick", "lock", "run", "done"))
    ap.add_argument("path", help="pick: queue checkout; others: the item folder")
    ap.add_argument("--nn")
    ap.add_argument("--agent")
    ap.add_argument("--supplement")
    ap.add_argument("--content-id")
    ap.add_argument("--pr")
    a = ap.parse_args()
    try:
        if a.cmd in ("lock", "run") and not a.agent:
            raise Stop("AGENT_REQUIRED", f"{a.cmd} needs --agent <lock name>")
        if a.cmd == "pick":
            out = pick(a.path, a.nn)
        elif a.cmd == "lock":
            out = lock(a.path, a.agent)
        elif a.cmd == "run":
            out = run(a.path, a.agent, a.supplement)
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
