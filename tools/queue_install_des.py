#!/usr/bin/env python3
"""Install a publish-queue item's frozen DES/Fidelity record in one command.

queue-maintainer.md «DES و Fidelity صف»: a queue item marked «آماده» carries its
DES and Fidelity as decided. On publish day they are installed as they are —
never re-scored, never re-checked against the paper, never a reason to stop.

What this tool does, deterministically (no model call, no source text):

  1. reads 05-DES-Fidelity/{des,fidelity,plan,markers}.json of the queue item;
  2. checks the page body against 01-متن.md (queue-maintainer.md «روز انتشار صف»:
     the text does not move — only the date may differ). A missing, reworded or
     inserted body line (a new subtitle) stops the tool with exit 3
     and nothing written; the fix is rebuilding the body from the queue files,
     never a question. --check-text runs only this check (use it after C.2);
     --founder-text-change "<his words>" records a founder-ordered change;
  2b. splits the REAL page into units with tools/des_fidelity_units.py and
     aligns them to the stored claims: unchanged units kept verbatim (ids
     renumbered if the template shifted them); a date line takes the page's
     date with its verdict kept; units new in the page frame are NOT_A_CLAIM
     or silent, never changing the score; counts, score and the Persian lines
     are recomputed only when something changed;
  3. writes plus/des-scores.json[content_id] (and the sibling audio episode's
     DES-only mirror for a NoteCast) byte-preservingly, the recorded plan and
     source markers under the real content_id;
  4. registers the installed record in .dentcast/queue-frozen-des.json with its
     sha256, so Phase F reports page-text drift on it as warnings, never FAILs
     (integrity — same bytes as installed — stays a hard check).

Usage:
  python3 tools/queue_install_des.py ../dentcast-queue/queue/NN-... notecast/episode-44
      [--date YYYY-MM-DD] [--mirror episodes/episode-44 | --no-mirror] [--dry-run]

Prints one JSON receipt (what was synced, added, dropped; before/after counts).
"""
import argparse
import datetime
import difflib
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import des_fidelity_units as U  # noqa: E402
import verify_publish as vp  # noqa: E402
from queue_manifest import split_sources_tail  # noqa: E402

DES_SCORES = ROOT / "plus/des-scores.json"
REGISTRY = ROOT / ".dentcast/queue-frozen-des.json"
MARKERS = ROOT / ".dentcast/des-source-markers.json"
DECISION = ("DES و Fidelity مطلب «آماده»ی صف همان‌طور که بنیان‌گذار تأیید کرده ثبت می‌شود "
            "و مانع انتشار نیست (queue-maintainer.md «DES و Fidelity صف»)")


def record_sha256(rec):
    """The hash Phase F compares (verify_publish.queue_frozen_sha256 uses the same form)."""
    return hashlib.sha256(json.dumps(rec, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def norm(t):
    return re.sub(r"\s+", " ", (t or "")).strip()


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8")) if Path(p).exists() else None


def num(uid):
    return int(str(uid)[1:])


def append_entries(path, entries):
    """Append top-level keys to a JSON object file, keeping every existing byte
    and the newline/indent style of the file's tail."""
    raw = path.read_text(encoding="utf-8", newline="") if path.exists() else "{\n}\n"
    data = json.loads(raw)
    for k, _ in entries:
        if k in data:
            sys.exit(f"{path.relative_to(ROOT)} already has {k!r} — refusing to overwrite an existing record")
    m = re.search(r"\}(\s*)\Z", raw)
    body = raw[:m.start()].rstrip()
    trail = m.group(1)
    nl = "\r\n" if raw[:m.start()].rstrip(" \t").endswith("\r\n") or "\r\n" in raw[-200:] else "\n"
    blocks = []
    for k, v in entries:
        t = json.dumps(v, ensure_ascii=False, indent=2)
        blocks.append("  " + json.dumps(k, ensure_ascii=False) + ": " + t.replace("\n", nl + "  "))
    sep = "," if body.rstrip().endswith(("}", "]", '"')) or re.search(r"[\d\w]\Z", body) else ""
    if body.endswith("{"):
        sep = ""
    new = body + sep + nl + ("," + nl).join(blocks) + nl + "}" + (trail or nl)
    merged = json.loads(new)
    for k, v in entries:
        assert merged[k] == v
    return new


def silence(basis, version):
    complete = basis == "FULL_TEXT" or (basis == "SECONDARY_REPORT" and vp.des_ge(version, (3, 3)))
    return "NOT_IN_SOURCE" if complete else "NOT_ASSESSABLE"


def recompute(f, pooled):
    vs = [c["verdict"] for c in f["claims"]]
    counts = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"), "reversed": vs.count("REVERSED"),
              "not_in_source": vs.count("NOT_IN_SOURCE"), "not_assessable": vs.count("NOT_ASSESSABLE"),
              "author_view": vs.count("AUTHOR_VIEW"), "not_a_claim": vs.count("NOT_A_CLAIM")}
    ver = f.get("des_version")
    assessable, score, level = vp.des_fidelity_recompute(counts, ver)
    fact, interp = U.compose_fa(f["claims"], counts, assessable, level, ver, pooled=pooled)
    return {**f, "counts": counts, "assessable": assessable, "fidelity_score": score,
            "level": level, "fact_fa": fact, "interpretation_fa": interp}


DATE_RE = re.compile(r"20\d\d-\d\d-\d\d")


def body_lines(item):
    """The frozen text of record (01-متن.md) as plain lines: markdown bold,
    whole-line italics and list dashes stripped, image markers [[تصویر:NN]]
    dropped, a table row split into its cells (the page shows each cell on its
    own; a `|---|` row shows nothing). A sources tail (final `---` + bare DOI
    lines) is the credit, not body text."""
    p = item / "01-متن.md"
    if not p.exists():
        return []
    out = []
    body, _tail = split_sources_tail(p.read_text(encoding="utf-8"))
    raw = body.splitlines()
    piped = lambda i: 0 <= i < len(raw) and "|" in raw[i] and raw[i].strip() and not raw[i].strip().startswith("[[")
    for k, line in enumerate(raw):
        if piped(k) and (piped(k - 1) or piped(k + 1)):
            t = line.strip().strip("|")
            if re.fullmatch(r"[\s:|-]*", t):
                continue  # the `|---|` row
            out += [norm(c) for c in (re.sub(r"\*\*", "", c).strip() for c in t.split("|")) if c]
            continue
        t = re.sub(r"\[\[[^\]]*\]\]", "", line).strip()
        if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", t):
            continue  # markdown horizontal rule: no text on the page
        t = re.sub(r"^#{1,6}\s+", "", t)  # markdown heading marker
        t = re.sub(r"^>\s?", "", t)  # blockquote marker (note box)
        t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)  # markdown link -> its text
        t = re.sub(r"^\s*[-*]\s+", "", t)
        t = re.sub(r"^\*\*(.*)\*\*$", r"\1", t).replace("**", "")
        t = re.sub(r"^\*(?!\*)(.+?)(?<!\*)\*$", r"\1", t)  # a whole-line italic (a figure caption)
        t = re.sub(r"(?<![*\w])\*(?!\*)([^*]+?)(?<!\*)\*(?![*\w])", r"\1", t)  # inline italics
        if t.strip():
            out.append(norm(t))
    return out


def body_guard(item, cid, units, synced, added):
    """queue-maintainer.md «روز انتشار صف»: the text does not move. Every line of
    01-متن.md must sit verbatim on the page and nothing may be inserted among
    them (no new subtitle). A stored claim whose text differs from the page is a
    problem only when the page's text is not the approved 01-متن.md text: when
    the page follows 01-متن.md, the record is synced to it (the text was changed
    and approved in preparation) and only the date-free difference is reported."""
    lines = body_lines(item)
    if not lines:
        return []
    doc = (ROOT / f"{cid}.html").read_text(encoding="utf-8")
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    page = norm(vp.text_of(h1.group(1)) + " " + vp.text_of(vp.article_region(doc))) if h1 else norm(vp.text_of(vp.article_region(doc)))
    body = " \n ".join(lines)
    problems = [f"line of 01-متن.md not on the page: «{l[:70]}»" for l in lines if l not in page]
    in_body = [i for i, u in enumerate(units) if norm(u["text"]) and norm(u["text"]) in body]
    if in_body:
        lo, hi = in_body[0], in_body[-1]
        for uid in added:
            k = next(i for i, u in enumerate(units) if u["id"] == uid)
            if lo < k < hi and norm(units[k]["text"]) not in body:
                problems.append(f"text inserted into the body that is not in 01-متن.md: «{units[k]['text'][:70]}» ({uid})")
    for x in synced:
        if (DATE_RE.sub("D", x["before"]) != DATE_RE.sub("D", x["after"])
                and norm(x["before"]) in body and norm(x["after"]) not in body):
            problems.append(f"body sentence changed: «{x['before'][:50]}» -> «{x['after'][:50]}»")
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("item", help="queue item folder (…/queue/NN-<category>-<slug>)")
    ap.add_argument("content_id")
    ap.add_argument("--date", default=datetime.date.today().isoformat(), help="scored_at (default today)")
    ap.add_argument("--mirror", help="sibling page that shares the DES record (DES only, no Fidelity)")
    ap.add_argument("--no-mirror", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--show-date", action="store_true",
                    help="print the date the frozen Fidelity was scored on (the preparation date, for the report); "
                         "the page carries the publish day and --date syncs the record's date lines")
    ap.add_argument("--check-text", action="store_true",
                    help="only check that the built page carries 01-متن.md unchanged (run right after C.2)")
    ap.add_argument("--founder-text-change", metavar="WORDS",
                    help="the founder's own words ordering a text change on publish day (recorded, then allowed)")
    a = ap.parse_args()

    item = Path(a.item).resolve()
    d = item / "05-DES-Fidelity"
    cid = a.content_id
    if a.show_date:
        fr = load_json(item / "05-DES-Fidelity" / "fidelity.json")
        objs0 = [] if fr is None else ([fr] if isinstance(fr, dict) else [f for f in fr if isinstance(f, dict)])
        dates = sorted({m for f in objs0 for c in f.get("claims", [])[:8] if c.get("verdict") == "NOT_A_CLAIM"
                        for m in re.findall(r"20\d\d-\d\d-\d\d", c.get("claim_quote") or "")})
        print(json.dumps({"prep_date": dates[0] if len(dates) == 1 else None, "found": dates,
                          "note": "no Fidelity / no date unit: use today's date" if not dates else
                          "use this date for datePublished, dateModified, lastReviewed and the visible dates"},
                         ensure_ascii=False))
        return 0
    if not (ROOT / f"{cid}.html").exists():
        sys.exit(f"{cid}.html does not exist — build the page first (step C.2)")
    des = load_json(d / "des.json")
    if des is None:
        sys.exit(f"{d}/des.json missing — nothing to install")
    sources = des["sources"] if isinstance(des, dict) and "sources" in des else (des if isinstance(des, list) else [des])
    fid_raw = load_json(d / "fidelity.json")
    pooled = isinstance(fid_raw, dict) and fid_raw.get("scope") == "POOLED"
    fid = None if fid_raw is None else (fid_raw if pooled else (fid_raw if isinstance(fid_raw, list) else [fid_raw]))
    audio = U.is_audio_episode(cid)
    if audio:
        fid = None

    # markers first: the unit assignment of a several-source page reads them
    markers = load_json(d / "markers.json")
    marker_entry = None
    if markers:
        vals = list(markers.values()) if all(isinstance(v, dict) and any(str(k).startswith("S") for k in v) for v in markers.values()) else [markers]
        marker_entry = vals[0]

    units = U.split_page(cid, sources)
    new_txt = [u["text"] for u in units]
    objs = [] if fid is None else ([fid] if pooled else [f for f in fid if isinstance(f, dict) and not f.get("error")])
    old = {}
    for f in objs:
        for c in f.get("claims", []):
            old.setdefault(c["id"], c["claim_quote"])
    old_ids = sorted(old, key=num)
    mapping, synced, added, dropped = {}, [], [], []
    sm = difflib.SequenceMatcher(None, [norm(old[i]) for i in old_ids], [norm(t) for t in new_txt], autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                mapping[old_ids[i1 + k]] = units[j1 + k]["id"]
        elif tag == "replace":
            # pair an old claim with a page unit only when it is the same
            # sentence (a date-only change, or clearly similar text); anything
            # else is an old unit gone and a new unit added, never a verdict
            # moved onto a different sentence
            jj = j1
            for i in range(i1, i2):
                o = old[old_ids[i]]
                hit = None
                for j in range(jj, j2):
                    t = units[j]["text"]
                    if (DATE_RE.sub("D", norm(o)) == DATE_RE.sub("D", norm(t))
                            or difflib.SequenceMatcher(None, norm(o), norm(t), autojunk=False).ratio() >= 0.6):
                        hit = j
                        break
                if hit is None:
                    dropped.append({"old": old_ids[i], "text": o})
                    continue
                added += [units[j]["id"] for j in range(jj, hit)]
                mapping[old_ids[i]] = units[hit]["id"]
                synced.append({"old": old_ids[i], "new": units[hit]["id"], "before": o, "after": units[hit]["text"]})
                jj = hit + 1
            added += [units[j]["id"] for j in range(jj, j2)]
        elif tag == "delete":
            dropped += [{"old": old_ids[i], "text": old[old_ids[i]]} for i in range(i1, i2)]
        elif tag == "insert":
            added += [units[j]["id"] for j in range(j1, j2)]
    by_id = {u["id"]: u for u in units}
    # On a several-source page the title and headings belong to no source and are
    # in no stored object, so the stored ids have gaps; a unit new on the page
    # then joins no object either (it stays unassigned, as those units were).
    covered_all = bool(old_ids) and [num(i) for i in old_ids] == list(range(1, len(old_ids) + 1))
    unassigned = [] if covered_all else list(added)
    joining = list(added) if covered_all else []
    problems = body_guard(item, cid, units, synced, added)
    if a.check_text or (problems and not a.founder_text_change):
        print(json.dumps({"status": "text_ok" if not problems else "text_moved", "content_id": cid,
                          "problems": problems,
                          "fix": None if not problems else
                          "the page body must be 01-متن.md verbatim (queue-maintainer.md «روز انتشار صف»): rebuild the body "
                          "mechanically from the queue files — no new subtitle, no rewrite, no question to the founder"},
                         ensure_ascii=False, indent=1))
        return 0 if not problems else 3
    renumbered = [o for o, n in mapping.items() if o != n]
    changed = bool(synced or joining or dropped or renumbered)

    def owner(uid):
        """The fidelity object a unit new on the page joins: the one holding the
        nearest preceding unit, else the first."""
        prev = [n for n in mapping.values() if num(n) < num(uid)]
        if prev:
            p = max(prev, key=num)
            for k, f in enumerate(objs):
                if any(mapping.get(c["id"]) == p for c in f["claims"]):
                    return k
        return 0

    before = [dict(f.get("counts") or {}) for f in objs]
    out_objs = []
    for k, f in enumerate(objs):
        claims = []
        for c in f["claims"]:
            nid = mapping.get(c["id"])
            if nid is None:
                continue
            claims.append({**c, "id": nid, "claim_quote": by_id[nid]["text"]})
        tmpl = next((c for c in f["claims"] if c["verdict"] == "NOT_A_CLAIM"), None)
        for uid in joining:
            if owner(uid) != k:
                continue
            u = by_id[uid]
            verdict = "NOT_A_CLAIM" if u.get("heading") else silence(f.get("text_basis"), f.get("des_version"))
            c = {"id": uid, "claim_quote": u["text"], "verdict": verdict, "change_kind": None,
                 "source_quote": "" if tmpl is None else type(tmpl.get("source_quote"))() if tmpl.get("source_quote") is not None else None,
                 "source_ref": None, "note": "added on publish day; not judged (frozen queue record)"}
            if tmpl is not None:
                c = {key: c.get(key) for key in tmpl}
            claims.append(c)
        claims.sort(key=lambda c: num(c["id"]))
        nf = {**f, "claims": claims}
        out_objs.append(recompute(nf, pooled) if changed else nf)

    if fid is None:
        rec_fid = None
        if not audio and all(s.get("content_type") == "COMMENTARY" or s.get("error") for s in sources):
            rec_fid = [None] * len(sources)
    elif pooled:
        rec_fid = out_objs[0]
    else:
        it = iter(out_objs)
        rec_fid = [next(it) if isinstance(f, dict) and not f.get("error") else f for f in fid]
    rec = {"scored_at": a.date, "sources": sources}
    if rec_fid is not None:
        rec["fidelity"] = rec_fid

    entries = [(cid, rec)]
    mirror = None
    if not a.no_mirror:
        mirror = a.mirror
        m = re.fullmatch(r"notecast/episode-(\d+)", cid)
        if mirror is None and m and (ROOT / f"episodes/episode-{m.group(1)}.html").exists():
            mirror = f"episodes/episode-{m.group(1)}"
        if mirror:
            existing = json.loads(DES_SCORES.read_text(encoding="utf-8")).get(mirror)
            if existing is None:
                entries.append((mirror, {"scored_at": a.date, "sources": sources}))
            else:
                mirror = mirror + " (already has a record — left unchanged)"

    plan_out = None
    plan = load_json(d / "plan.json")
    if plan and not audio:
        new_plan = {}
        for key, ids in (plan.get("plan") or {}).items():
            new_plan[key] = sorted({mapping[i] for i in ids if i in mapping}, key=num)
        for uid in joining:
            if True:
                k = str(owner(uid)) if not pooled else next(iter(new_plan), "0")
                new_plan.setdefault(k, [])
                if uid not in new_plan[k]:
                    new_plan[k] = sorted(new_plan[k] + [uid], key=num)
        sweep = []
        for s in plan.get("sweep") or []:
            s = dict(s)
            if isinstance(s.get("found"), dict):
                s["found"] = {kk: [mapping.get(i, i) for i in v] for kk, v in s["found"].items()}
            if isinstance(s.get("absent"), list):
                s["absent"] = [mapping.get(i, i) for i in s["absent"]]
            sweep.append(s)
        plan_out = {**plan, "content_id": cid, "plan": new_plan}
        if "sweep" in plan:
            plan_out["sweep"] = sweep

    reg = json.loads(REGISTRY.read_text(encoding="utf-8")) if REGISTRY.exists() else {}
    for k, v in entries:
        reg[k] = {"queue_ref": f"queue/{item.name}", "record_sha256": record_sha256(v), "installed_at": a.date,
                  "approval": {"status": "confirmed", "decision": DECISION,
                               "evidence": ["queue-maintainer.md «DES و Fidelity صف»"]},
                  "sync": {"text_synced": [s["new"] for s in synced] if k == cid else [],
                           "added": joining if k == cid else [], "unassigned": unassigned if k == cid else [], "dropped": [x["old"] for x in dropped] if k == cid else []},
                  **({"founder_text_change": a.founder_text_change, "text_changes": problems} if a.founder_text_change and k == cid else {})}

    receipt = {"status": "dry_run" if a.dry_run else "installed", "content_id": cid, "mirror": mirror,
               "units_on_page": len(units), "renumbered": len(renumbered), "text_synced": synced,
               "added": joining, "unassigned": unassigned, "dropped": dropped,
               "counts_before": before, "counts_after": [f.get("counts") for f in out_objs],
               "levels_after": [(f.get("fidelity_score"), f.get("level")) for f in out_objs],
               "des": [(s.get("des_score"), s.get("band")) for s in sources],
               "record_sha256": record_sha256(rec),
               "founder_text_change": a.founder_text_change, "text_problems_overridden": problems}
    if a.dry_run:
        print(json.dumps(receipt, ensure_ascii=False, indent=1))
        return 0

    DES_SCORES.write_text(append_entries(DES_SCORES, entries), encoding="utf-8", newline="")
    if plan_out is not None:
        p = U.plan_path(cid)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(plan_out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="")
        receipt["plan"] = str(p.relative_to(ROOT))
    if marker_entry:
        mk = json.loads(MARKERS.read_text(encoding="utf-8")) if MARKERS.exists() else {}
        if cid not in mk:
            mk[cid] = marker_entry
            MARKERS.write_text(json.dumps(mk, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
            receipt["markers"] = str(MARKERS.relative_to(ROOT))
    REGISTRY.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    receipt["registry"] = str(REGISTRY.relative_to(ROOT))
    print(json.dumps(receipt, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
