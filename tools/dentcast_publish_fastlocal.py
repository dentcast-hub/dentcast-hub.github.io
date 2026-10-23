#!/usr/bin/env python3
"""Opt-in, fsynced pre-first-cut DentCast event journal (no scientific work)."""
import argparse, copy, hashlib, json, os, sys
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc

NAME = "dentcast-fastlocal.wal"
VERSION = "fastlocal-v1"
ZERO = "0"*64
MAX_BYTES = 2*1024*1024

def encode(value):
    return json.dumps(value, sort_keys=True, separators=(",",":"), ensure_ascii=True,
                      allow_nan=False).encode()
def digest(value): return hashlib.sha256(value).hexdigest()
def timestamp(): return datetime.now(timezone.utc).isoformat(timespec="seconds")
def location(root, name=NAME):
    v=h.text_git(root, "rev-parse", "--git-path", name)
    p=Path(v) if Path(v).is_absolute() else root/v
    h.require(not p.is_symlink(), "WAL_UNSAFE_SYMLINK")
    return p
def active(root): return location(root).is_file()

@contextmanager
def lock(root):
    p=location(root,"dentcast-fastlocal.lock")
    fd=os.open(p,os.O_CREAT|os.O_RDWR|getattr(os,"O_NOFOLLOW",0),0o600)
    try:
        if os.name=="nt":
            import msvcrt
            if not os.fstat(fd).st_size: os.write(fd,b"0")
            os.lseek(fd,0,os.SEEK_SET)
            try: msvcrt.locking(fd,msvcrt.LK_NBLCK,1)
            except OSError: raise h.Blocked("WAL_BUSY") from None
        else:
            import fcntl
            try: fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
            except OSError: raise h.Blocked("WAL_BUSY") from None
        yield
    finally:
        if os.name=="nt":
            import msvcrt
            os.lseek(fd,0,os.SEEK_SET)
            msvcrt.locking(fd,msvcrt.LK_UNLCK,1)
        else:
            import fcntl
            fcntl.flock(fd,fcntl.LOCK_UN)
        os.close(fd)

def sync_parent(p):
    if os.name!="nt":
        fd=os.open(p.parent,os.O_RDONLY)
        try: os.fsync(fd)
        finally: os.close(fd)

def append(root, data, first=False):
    data=dict(data)
    data["digest"]=digest(encode(data))
    line=encode(data)+b"\n"
    p=location(root)
    flags=(os.O_CREAT|os.O_EXCL if first else os.O_WRONLY|os.O_APPEND)
    fd=os.open(p,flags|getattr(os,"O_NOFOLLOW",0),0o600)
    try:
        h.require(os.fstat(fd).st_size+len(line)<=MAX_BYTES,"WAL_LIMIT_FLUSH_FIRST")
        h.require(os.write(fd,line)==len(line),"WAL_PARTIAL_WRITE")
        os.fsync(fd)
    finally: os.close(fd)
    if first: sync_parent(p)
    return data["digest"]

def apply(p, sid, status, evidence, reason):
    h.require(sid==h.next_step(p),"NOT_NEXT_CANONICAL_STEP")
    h.require(not lc.delivery_boundary(p),"FIRST_PUSH_REQUIRED_BEFORE_NEXT_STEP")
    h.require(status in ("started","completed","skipped","blocked","failed"),
              "INVALID_STEP_STATUS")
    h.require(sid!="F" and sid!="G","REAL_GATE_REQUIRED")
    row=next(s for s in p["steps"] if s["id"]==sid)
    h.require(isinstance(evidence,list) and all(h.nonempty(x) for x in evidence),
              "INVALID_EVIDENCE_REFERENCES")
    if status=="started":
        h.require(row["status"]=="pending" and not evidence and reason is None,
                  "START_REQUIRES_PENDING")
    if status=="completed":
        h.require(row["status"]=="started" and evidence and reason is None,
                  "COMPLETION_REQUIRES_STARTED_AND_EVIDENCE")
    if status=="skipped":
        h.require(row["status"]=="pending" and sid not in ("rules","0") and
                  h.nonempty(reason),"CANONICAL_SKIP_REASON_REQUIRED")
    if status in ("blocked","failed"):
        h.require(row["status"] in ("started","pending") and h.nonempty(reason),
                  "BLOCK_REASON_REQUIRED")
    h.require(not any(a["status"] in ("started","outcome_unknown")
                      for a in p["external_actions"]),"EXTERNAL_OUTCOME_UNKNOWN")
    new=copy.deepcopy(p)
    next(s for s in new["steps"] if s["id"]==sid).update(
        status=status,evidence=evidence,reason=reason)
    new["status"]="blocked" if status in ("blocked","failed") else "in_progress"
    new["blocker"]=f"{sid}: {reason}" if new["status"]=="blocked" else None
    lc.require_plan(new)
    lc.guard_step_transition({"publication":p},new)
    return new

def replay(raw, allow_torn=False):
    h.require(0<len(raw)<=MAX_BYTES,"WAL_EMPTY_OR_TOO_LARGE")
    prev=ZERO; init=None; pub=None; seq=0; valid=0
    for line in raw.splitlines(keepends=True):
        if not line.endswith(b"\n"):
            if allow_torn and valid: return init,pub,prev,seq,valid
            raise h.Blocked("WAL_TORN_TAIL")
        try: record=h.decode_json(line.decode("utf-8"))
        except (ValueError,UnicodeError):
            raise h.Blocked("WAL_CORRUPT_COMPLETE_RECORD") from None
        h.require(isinstance(record,dict) and record.get("version")==VERSION
                  and record.get("prev")==prev and record.get("seq")==seq and
                  record.get("digest")==digest(encode({
                      k:v for k,v in record.items() if k!="digest"})),
                  "WAL_HASH_CHAIN_INVALID")
        if seq==0:
            h.require(record.get("kind")=="begin" and
                      h.valid_hash(record.get("base_sha256")) and
                      h.valid_hash(record.get("input_fingerprint")),
                      "WAL_BEGIN_INVALID")
            init=record;pub=copy.deepcopy(record["publication"]);lc.require_plan(pub)
            h.require(record.get("wal_engine_sha256")==digest(Path(__file__).read_bytes()),
                      "WAL_ENGINE_CHANGED_INVALIDATE_AND_RECONCILE")
        elif record.get("kind")=="step":
            h.require(record.get("input_fingerprint")==init["input_fingerprint"],
                      "WAL_INPUT_FINGERPRINT_CHANGED")
            pub=apply(pub,record["step_id"],record["status"],
                      record["evidence"],record["reason"])
        elif record.get("kind")!="torn_tail_repaired":
            raise h.Blocked("WAL_UNKNOWN_EVENT")
        prev=record["digest"]; seq+=1; valid+=len(line)
    return init,pub,prev,seq,valid

def read(root, allow_torn=False):
    p=location(root)
    h.require(p.is_file(),"WAL_NOT_ACTIVE")
    return replay(p.read_bytes(),allow_torn)

def begin(root, expected):
    with lock(root):
        h.require(not active(root),"WAL_ALREADY_ACTIVE")
        state,sha=h.load_state(root)
        h.require(sha==expected,"STALE_HANDOFF_WRITE")
        pub=state["publication"];lc.require_plan(pub)
        h.require(lc.fixed_delivery(pub) and pub["category"]!="paper-only"
                  and pub["content_id"]!="unassigned" and pub["category"]!="pending",
                  "FIRST_CUT_BOUND_PAGE_REQUIRED")
        h.require(not lc.delivery_boundary(pub) and
                  next(x for x in pub["steps"] if x["id"]=="C.4.9")["status"]=="pending",
                  "FIRST_CUT_ALREADY_PASSED")
        h.require(not pub["blocker"] and not lc.pending(root),"WAL_START_BLOCKED")
        h.require(not any(a["status"] in ("started","outcome_unknown")
                      for a in pub["external_actions"]),"EXTERNAL_OUTCOME_UNKNOWN")
        event={"version":VERSION,"kind":"begin","seq":0,"prev":ZERO,
               "timestamp":timestamp(),"base_sha256":sha,
               "base_head":state["snapshot"]["head"],
               "base_branch":state["snapshot"]["branch"],
               "workflow_fingerprint":digest(encode(state["snapshot"]["workflow"])),
               "input_fingerprint":digest(encode(pub["context"]["inputs"])),
               "wal_engine_sha256":digest(Path(__file__).read_bytes()),
               "publication":pub}
        out=append(root,event,True)
        return {"status":"fastlocal_active","digest":out,
                "next_step":h.next_step(pub),"publication_completed":False}

def step(root, expected, sid, status, evidence=None, reason=None):
    with lock(root):
        init,pub,old,n,_=read(root)
        h.require(old==expected,"STALE_WAL_WRITE")
        after=apply(pub,sid,status,evidence or [],reason)
        d=append(root,{"version":VERSION,"kind":"step","seq":n,
                 "prev":old,"timestamp":timestamp(),
                 "input_fingerprint":init["input_fingerprint"],
                 "step_id":sid,"status":status,
                 "evidence":evidence or [],"reason":reason})
        return {"status":"first_delivery_ready" if lc.delivery_boundary(after)==1
                else "fastlocal_active","digest":d,"next_step":h.next_step(after),
                "publication_completed":False}

def validate_projection(root, pub, expected):
    init,new,_,_,_=read(root)
    h.require(init["base_sha256"]==expected and new==pub,
              "WAL_PROJECTION_INVALID")

def flush(root, expected):
    with lock(root):
        init,pub,d,_,_=read(root)
        h.require(d==expected,"STALE_WAL_WRITE")
        state,sha=h.load_state(root)
        if sha==init["base_sha256"]:
            h.require(h.text_git(root,"rev-parse","HEAD")==init["base_head"]
                      and h.branch(root)==init["base_branch"],
                      "WAL_CHECKOUT_HEAD_OR_BRANCH_CHANGED")
            h.require(state["snapshot"]["head"]==init["base_head"]
                      and state["snapshot"]["branch"]==init["base_branch"]
                      and digest(encode(state["snapshot"]["workflow"]))==
                      init["workflow_fingerprint"]
                      and digest(encode(state["publication"]["context"]["inputs"]))==
                      init["input_fingerprint"],"WAL_BASE_CHANGED")
            result=h.save(root,pub,expected=sha,
                          note="Validated Fast Local event journal against canonical base",
                          wal_materialize=True)
            sha=result["sha256"]
        else:
            # Interrupted after canonical write, before WAL deletion: idempotent.
            h.require(state["publication"]==pub and
                      state["snapshot"]["branch"]==init["base_branch"],
                      "WAL_BASE_CHANGED_RECONCILE")
        path=location(root);path.unlink();sync_parent(path)
        return {"status":"checkpoint_materialized","sha256":sha,
                "first_delivery_cut":lc.delivery_boundary(pub)==1,
                "next_step":h.next_step(pub),
                "next_action":"At cut: deliver/verify Push 1, then continue in SAME agent unless user chooses a handoff",
                "publication_completed":False}

def repair(root, expected):
    with lock(root):
        p=location(root);raw=p.read_bytes()
        init,pub,d,n,end=replay(raw,True)
        h.require(end<len(raw) and b"\n" not in raw[end:] and
                  d==expected,"WAL_TAIL_NOT_SAFELY_REPAIRABLE")
        tail=raw[end:]
        backup=location(root,NAME+".torn-"+digest(raw)[:12])
        fd=os.open(backup,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        try:
            h.require(os.write(fd,tail)==len(tail),"WAL_BACKUP_WRITE_FAILED")
            os.fsync(fd)
        finally:os.close(fd)
        with p.open("r+b") as f:
            f.truncate(end);f.flush();os.fsync(f.fileno())
        new=append(root,{"kind":"torn_tail_repaired","version":VERSION,
                        "seq":n,"prev":d,"timestamp":timestamp(),
                        "tail_sha256":digest(tail)})
        return {"status":"wal_tail_repaired","digest":new,
                "next_step":h.next_step(pub),
                "warning":"Last torn action outcome must be reconciled; never assume completion"}

def inspect(root):
    with lock(root):
        init,pub,d,n,_=read(root)
        return {"status":"fastlocal_active","digest":d,"events":n,
                "next_step":h.next_step(pub),
                "first_delivery_cut":lc.delivery_boundary(pub)==1,
                "publication_completed":False}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo",default=".")
    sub=ap.add_subparsers(dest="action",required=True)
    b=sub.add_parser("begin");b.add_argument("--expected-sha256",required=True)
    s=sub.add_parser("step")
    s.add_argument("--expected-digest",required=True)
    s.add_argument("--id",required=True)
    s.add_argument("--status",required=True,
                   choices=("started","completed","skipped","blocked","failed"))
    s.add_argument("--evidence",action="append",default=[])
    s.add_argument("--reason")
    f=sub.add_parser("flush");f.add_argument("--expected-digest",required=True)
    sub.add_parser("inspect")
    r=sub.add_parser("repair-torn-tail");r.add_argument("--expected-good-digest",required=True)
    args=ap.parse_args()
    try:
        root=Path(h.text_git(Path(args.repo).resolve(),"rev-parse","--show-toplevel")).resolve()
        if args.action=="begin": out=begin(root,args.expected_sha256)
        elif args.action=="step":
            out=step(root,args.expected_digest,args.id,args.status,args.evidence,args.reason)
        elif args.action=="flush":out=flush(root,args.expected_digest)
        elif args.action=="inspect":out=inspect(root)
        else:out=repair(root,args.expected_good_digest)
        print(json.dumps(out,ensure_ascii=True,indent=2))
        return 0
    except (ValueError,OSError,KeyError,TypeError,AttributeError):
        exc=sys.exc_info()[1]
        code=str(exc) if isinstance(exc,h.Blocked) else "INVALID_INPUT_OR_WAL"
        print(json.dumps({"status":"blocked","error":code,
                          "publication_completed":False}),file=sys.stderr)
        return 2

if __name__=="__main__":raise SystemExit(main())
