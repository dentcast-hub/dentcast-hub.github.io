#!/usr/bin/env python3
"""Queue-lane ledger records, generated — never hand-written.

A publish-queue item carries every approval frozen in `00-وضعیت.md` and
`SHA256SUMS`. The queue lane therefore records ONE approval reference (both
hashes plus the queue_apply receipt digest) and derives from it the records the
unchanged cut gates require: the lead-provenance declaration, the ten-scope
editorial lock and the exact title/caption Phase F verifies. Nothing here
grants an approval that the item does not already hold; the hashes bind each
record to the frozen bytes it rests on.

  python3 tools/queue_ledger.py init-input <section>/<slug> --out <publication.json>
  python3 tools/queue_ledger.py cut-records <receipt.json> --item <folder> --out <records.json>
  python3 tools/queue_ledger.py record <receipt.json> --item <folder>

`init-input` writes a publication for `dentcast_publish_handoff.py init`
(queue plan, queue_lane_v1 marker); the content_id is `<section>/<slug>`
(sharehub/share-45), never a bare number. `cut-records` returns {decisions,
approvals, target_paths}. `record` merges exactly those into the handoff's
recorded publication and records it (the one `record` of the lane, right after
C.2: queue_apply changed the work tree, so the reconcile note is written here).
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_publish_lifecycle as lc  # noqa: E402
import queue_manifest as qm  # noqa: E402

KIND = "queue_approvals_v1"


def digest_json(data):
    return hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def approvals_ref(receipt, item):
    sums = qm.sha256_file(Path(item) / "SHA256SUMS")
    status = qm.sha256_file(Path(item) / qm.STATUS_FILE)
    if sums != receipt["sums"]["sha256sums"]:
        raise qm.QueueRefusal("SHA256SUMS_CHANGED", "SHA256SUMS differs from the one queue_apply assembled from")
    return {"kind": KIND, "queue_ref": receipt["queue_item"], "sha256sums": sums,
            "status_sha256": status, "receipt_sha256": digest_json(receipt),
            "evidence": [f"{receipt['queue_item']}/00-وضعیت.md (founder approvals table, sha256 {status})",
                         f"{receipt['queue_item']}/SHA256SUMS (frozen files, sha256 {sums})"]}


def title_caption(item):
    d = qm.draft(Path(item))
    t, c = d["title_fa"]["value"], d["caption_fa"]["value"]
    if not t or not c:
        raise qm.QueueRefusal("TITLE_CAPTION_MISSING", "02-عنوان-کپشن.md lacks the exact title or caption")
    return t, c


def cut_records(receipt, item):
    ref = approvals_ref(receipt, item)
    q = receipt["queue_item"]
    ev = ref["evidence"]
    cid = receipt["content_id"]
    section, slug = cid.rsplit("/", 1)
    english = section + "/en/" + slug + ".html"
    t, c = title_caption(item)
    defaults = [json.dumps(x, ensure_ascii=False) for x in receipt.get("mechanical_defaults") or []]
    manual = [json.dumps(x, ensure_ascii=False) for x in receipt.get("manual_steps") or []]
    scope_ev = {
        "scientific": [f"{q}/05-DES-Fidelity installed by queue_install_des.py (record {receipt.get('des', {}).get('record_sha256')})"],
        "taxonomy": [f"{q}/07-ورودی‌ها.md pillar/subtopic (brain entry written by queue_apply)"],
        "links": [f"{q}/11-لینک‌های-گلاسری.md; applied {receipt['report'].get('links_48')}; "
                  f"4.7 {receipt['report'].get('backlinks_47')}; 4.9 {receipt['report'].get('explore_49')}"],
        "hashtags": [f"{q}/07-ورودی‌ها.md list; hashtag_ref.py --sync/--check passed"],
        "content_record": [f"{q}/09-کلیدواژه‌ها.md; brain entry {receipt.get('brain_entry', {}).get('url')}"],
        "pathways": [f"pathway_place.py mechanical rule: {receipt.get('pathways')}"],
        "pulse": [f"{q}/07-ورودی‌ها.md Q5; seven-line rotation {receipt['report'].get('pulse')}"],
        "english": [f"{q}/06-انگلیسی.md verbatim -> {english}"],
        "author_approvals": ev + (["publish-day manual steps: " + "; ".join(manual)] if manual else [])
                            + (["mechanical defaults: " + "; ".join(defaults)] if defaults else []),
    }
    scopes = [{"scope": s, "status": "resolved", "evidence": scope_ev[s]} for s in sorted(scope_ev)]
    scopes.append({"scope": "challenge", "status": "not_applicable",
                   "evidence": [f"{q}/07-ورودی‌ها.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"]})
    decisions = [
        ref,
        {"kind": "first_cut_lead_provenance_v1", "origin": "author_original",
         "source_ref": f"{q}/01-متن.md (frozen; its opening paragraph was approved in preparation)",
         "evidence": ev},
        {"kind": "second_cut_editorial_lock_v1", "scopes": scopes,
         "english": {"status": "ready", "path": english, "evidence": [f"{q}/06-انگلیسی.md (frozen)"]},
         "evidence": [f"generated by tools/queue_ledger.py from the frozen item (receipt {ref['receipt_sha256']})"]},
    ]
    approvals = [
        {"scope": "title", "status": "confirmed", "decision": t, "evidence": [f"{q}/02-عنوان-کپشن.md"] + ev},
        {"scope": "caption", "status": "confirmed", "decision": c, "evidence": [f"{q}/02-عنوان-کپشن.md"] + ev},
    ]
    return {"decisions": decisions, "approvals": approvals,
            "target_paths": sorted({f["path"] for f in receipt["files"]} | {english})}


CONTENT_ID = re.compile(r"[a-z][a-z0-9-]*/[A-Za-z0-9][A-Za-z0-9._-]*")


def init_input(cid):
    if not CONTENT_ID.fullmatch(cid or "") or cid.endswith(".html"):
        raise qm.QueueRefusal("CONTENT_ID_INVALID", f"«{cid}»: the content_id is <section>/<slug> without .html "
                              "(sharehub/share-45, insight/insight-102, notecast/episode-44), never a bare number")
    paths = ["dentcast-brain.json"]  # watched from the start; the receipt's files join at cut-records
    return {"content_id": cid, "category": cid.split("/", 1)[0], "target_paths": paths,
            "status": "in_progress", "blocker": None,
            "context": {"inputs": [], "decisions": [{"kind": lc.QUEUE_LANE}], "approvals": [],
                        "pending_questions": [], "validation": [], "delivery": [], "unrelated_changes": []},
            "steps": lc.plan(queue=True), "external_actions": []}


def handoff(*args):
    r = subprocess.run([sys.executable, str(ROOT / "tools/dentcast_publish_handoff.py"), "--repo", str(ROOT), *args],
                       capture_output=True, text=True)
    try:
        out = json.loads(r.stdout)
    except ValueError:
        out = {"status": "error", "stdout": r.stdout[-800:], "stderr": r.stderr[-800:]}
    return r.returncode, out


def merge_records(pub, rec):
    """The recorded publication plus the cut records: decisions by kind (a kind
    already recorded is replaced by the generated one), approvals by scope,
    target_paths as a union. Nothing else moves."""
    pub = json.loads(json.dumps(pub))
    ctx = pub.setdefault("context", {})
    kinds = {d["kind"] for d in rec["decisions"]}
    ctx["decisions"] = [d for d in ctx.get("decisions", []) if d.get("kind") not in kinds] + rec["decisions"]
    scopes = {x["scope"] for x in rec["approvals"]}
    ctx["approvals"] = [x for x in ctx.get("approvals", []) if x.get("scope") not in scopes] + rec["approvals"]
    pub["target_paths"] = sorted(set(pub.get("target_paths") or []) | set(rec["target_paths"]))
    return pub


def record(receipt, item):
    rec = cut_records(receipt, item)
    code, ins = handoff("inspect")
    if "recorded_state" not in ins:
        raise qm.QueueRefusal("HANDOFF_INSPECT_FAILED", "dentcast_publish_handoff.py inspect gave no recorded state",
                              output=ins)
    pub = ins["recorded_state"]["publication"]
    if pub.get("content_id") != receipt["content_id"]:
        raise qm.QueueRefusal("HANDOFF_OTHER_PUBLICATION", f"the active handoff is {pub.get('content_id')}, "
                              f"the receipt is {receipt['content_id']}")
    merged = merge_records(pub, rec)
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False)
    note = (f"queue lane C.2: queue_apply.py assembled {receipt['content_id']} from {receipt['queue_item']} "
            f"(receipt {digest_json(receipt)}); the work tree holds exactly the receipt's files")
    code, out = handoff("record", "--input", f.name, "--expected-sha256", ins["sha256"], "--reconcile-note", note)
    Path(f.name).unlink()
    if code != 0:
        raise qm.QueueRefusal("HANDOFF_RECORD_FAILED", "dentcast_publish_handoff.py record refused", output=out)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=("init-input", "cut-records", "record"))
    ap.add_argument("source", help="init-input: content_id; cut-records/record: queue_apply receipt JSON")
    ap.add_argument("--item")
    ap.add_argument("--out")
    a = ap.parse_args()
    try:
        if a.cmd != "record" and not a.out:
            raise qm.QueueRefusal("OUT_REQUIRED", f"{a.cmd} needs --out <file>")
        if a.cmd == "record":
            if not a.item:
                raise qm.QueueRefusal("ITEM_REQUIRED", "record needs --item <queue item folder>")
            out = record(json.loads(Path(a.source).read_text(encoding="utf-8")), a.item)
            print(json.dumps(out, ensure_ascii=False))
            return 0
        if a.cmd == "init-input":
            out = init_input(a.source)
        else:
            if not a.item:
                raise qm.QueueRefusal("ITEM_REQUIRED", "cut-records needs --item <queue item folder>")
            out = cut_records(json.loads(Path(a.source).read_text(encoding="utf-8")), a.item)
    except qm.QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False))
        return 2
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({"status": "written", "out": a.out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
