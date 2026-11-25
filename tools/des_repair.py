#!/usr/bin/env python3
"""DES is scored once: repair a model's SOURCE answer instead of running it again.

Founder decision 2026-11-25 (module 08, «Scored once»). A DES answer is run again in
exactly two cases: it is about another paper, or it is not a usable JSON object.
Everything else the model got wrong around its own ratings is repaired here,
deterministically, and reported:

    python3 tools/des_repair.py ANSWER.json --texts texts.json [--doi DOI] [-o des.json]

  ANSWER.json  the model's reply (one SOURCE/COMMENTARY object; a ```json fence or
               prose around it is tolerated)
  texts.json   {"<doi>": {"source_text": "...", "text_basis": "..."}}, as Part 1 made it

What is repaired (the ratings themselves are never touched):
  - keys the stored records of the same track do not carry are dropped;
  - each penalty's `points` is recomputed from `base_points` and S_design (a 0 stays 0);
  - `des_score` is recomputed from the model's own S_design, multiplier and penalties
    (COMMENTARY: 5 + checklist points) and `band` from the score;
  - `provisional` follows `text_basis`;
  - an `evidence_quote` that is not verbatim in the text is replaced by the passage of
    the text it was taken from (ignoring hyphenation and spacing), or by the single
    closest sentence when it is plainly that sentence (similarity >= 0.85); otherwise a
    quote that carries no rating (S_design, a 0-point penalty) is emptied, and a quote a
    rating rests on is left as it is and listed as UNVERIFIED for the publish report.

Exit 0: usable (repaired or already clean); the object is written to -o (default:
ANSWER.repaired.json) with the list of repairs on stdout.
Exit 3: WRONG_PAPER or NOT_JSON or NOT_SCORABLE — the only cases that call for a new run.
"""
import argparse
import difflib
import json
import re
import sys
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import verify_publish as vp  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SNAP = 0.85


def one_object(text):
    dec = json.JSONDecoder()
    i = text.find("{")
    while i >= 0:
        try:
            obj, _ = dec.raw_decode(text, i)
            if isinstance(obj, dict):
                return obj
        except ValueError:
            pass
        i = text.find("{", i + 1)
    return None


def doi_of(s):
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", (s or "").strip().lower())


def band_of(score):
    for b, (lo, hi) in vp.DES_BANDS.items():
        if lo <= score <= hi:
            return b
    return None


def known_keys():
    """Key sets the stored records use, per track and per nested object: the spec's
    shape as it actually ships. Read from plus/des-scores.json, never hard-coded."""
    top = {"RESEARCH": set(), "COMMENTARY": set()}
    pen, dom, chk, sd, qm = set(), set(), set(), set(), set()
    p = ROOT / "plus" / "des-scores.json"
    if not p.exists():
        return None
    for rec in json.loads(p.read_text(encoding="utf-8")).values():
        for s in rec.get("sources") or []:
            if not isinstance(s, dict) or s.get("content_type") not in top:
                continue
            top[s["content_type"]] |= set(s)
            for x in s.get("penalties") or []:
                pen |= set(x)
            for x in (s.get("q_method") or {}).get("domains") or []:
                dom |= set(x)
            for x in s.get("commentary_checklist") or []:
                chk |= set(x)
            sd |= set(s.get("s_design") or {})
            qm |= set(s.get("q_method") or {})
    return {"top": top, "penalties": pen, "domains": dom, "checklist": chk, "s_design": sd, "q_method": qm}


def strip_keys(obj, allowed, where, log):
    if not allowed:
        return
    for k in [k for k in obj if k not in allowed]:
        del obj[k]
        log.append(f"dropped extra key «{k}» in {where}")


def squeeze(s):
    """Text with everything a PDF extraction can disturb removed, plus an index back."""
    out, idx = [], []
    for i, ch in enumerate(s):
        if ch.isspace() or ch in "-­‐‑–—":
            continue
        out.append(ch.lower())
        idx.append(i)
    return "".join(out), idx


def snap(quote, text):
    """The passage of `text` this quote is, or None. `text` is des_norm'd."""
    q = vp.des_norm(quote)
    if q in text:
        return q
    sq, _ = squeeze(q)
    st, idx = squeeze(text)
    if len(sq) >= 20:
        at = st.find(sq)
        if at >= 0:
            return text[idx[at]: idx[at + len(sq) - 1] + 1].strip()
    best, score = None, 0.0
    for sent in re.split(r"(?<=[.!?])\s+", text):
        if abs(len(sent) - len(q)) > max(40, len(q) // 2):
            continue
        r = difflib.SequenceMatcher(None, q.lower(), sent.lower(), autojunk=False).ratio()
        if r > score:
            best, score = sent, r
    return best.strip() if best and score >= SNAP else None


def repair(obj, text, basis, want_doi, log, unverified):
    if obj.get("error"):
        return obj
    got = doi_of((obj.get("citation") or {}).get("doi"))
    if want_doi and got and got != doi_of(want_doi):
        sys.stderr.write(f"WRONG_PAPER: the answer is about {got}, the call was for {doi_of(want_doi)} — "
                         "this is the case that is run again (a fresh chat, this paper's file)\n")
        sys.exit(3)
    ctype = obj.get("content_type")
    if ctype not in ("RESEARCH", "COMMENTARY"):
        return obj  # NOT_APPRAISABLE and the like: no score to repair
    keys = known_keys()
    if keys:
        strip_keys(obj, keys["top"][ctype], "the record", log)
        for i, x in enumerate(obj.get("penalties") or []):
            strip_keys(x, keys["penalties"], f"penalties[{i}]", log)
        for i, x in enumerate((obj.get("q_method") or {}).get("domains") or []):
            strip_keys(x, keys["domains"], f"q_method.domains[{i}]", log)
        for i, x in enumerate(obj.get("commentary_checklist") or []):
            strip_keys(x, keys["checklist"], f"commentary_checklist[{i}]", log)
    if basis and obj.get("text_basis") != basis:
        log.append(f"text_basis {obj.get('text_basis')!r} -> {basis!r} (the basis the call was given)")
        obj["text_basis"] = basis

    hay = vp.des_norm(text) if text else None

    def fix_quote(holder, where, carries_rating):
        q = holder.get("evidence_quote")
        if not q or hay is None or vp.des_norm(q) in hay:
            return
        found = snap(q, hay)
        if found:
            holder["evidence_quote"] = found
            log.append(f"{where}: evidence_quote replaced by the text's own passage")
        elif carries_rating:
            unverified.append(where)
        else:
            holder["evidence_quote"] = ""
            log.append(f"{where}: evidence_quote not found in the text, emptied (it carries no rating)")

    if ctype == "COMMENTARY":
        for i, c in enumerate(obj.get("commentary_checklist") or []):
            if not c.get("note"):
                fix_quote(c, f"commentary_checklist[{i}]", True)
        calc = 5 + sum(int(c.get("points", 0)) for c in (obj.get("commentary_checklist") or []))
    else:
        sd = obj.get("s_design") or {}
        qm = obj.get("q_method") or {}
        if not isinstance(sd.get("value"), (int, float)) or not isinstance(qm.get("multiplier"), (int, float)):
            sys.stderr.write("NOT_SCORABLE: the answer has no S_design value or no multiplier — run it again\n")
            sys.exit(3)
        fix_quote(sd, "s_design", False)
        for i, d in enumerate(qm.get("domains") or []):
            fix_quote(d, f"q_method.domains[{i}] ({d.get('domain', '?')})", d.get("rating") in ("low", "some_concerns"))
        pen = 0
        for i, p in enumerate(obj.get("penalties") or []):
            pts = int(p.get("points", 0) or 0)
            if pts and "base_points" in p:
                want = vp.des_scaled_penalty(p["base_points"], sd["value"])
                if pts != want:
                    log.append(f"penalties[{i}] points {pts} -> {want} (base_points x S_design / 100)")
                    p["points"] = pts = want
            fix_quote(p, f"penalties[{i}]", pts > 0)
            pen += pts
        prod = (Decimal(str(sd["value"])) * Decimal(str(qm["multiplier"]))).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        calc = max(0, int(prod) - pen)
        prov = obj.get("text_basis") != "FULL_TEXT"
        if "provisional" in obj and obj["provisional"] != prov:
            log.append(f"provisional {obj['provisional']} -> {prov} (follows text_basis)")
            obj["provisional"] = prov
    if obj.get("des_score") != calc:
        log.append(f"des_score {obj.get('des_score')} -> {calc} (recomputed from the model's own ratings)")
        obj["des_score"] = calc
    band = "E" if ctype == "COMMENTARY" else band_of(calc)
    if obj.get("band") != band:
        log.append(f"band {obj.get('band')} -> {band} (the band of {calc})")
        obj["band"] = band
    return obj


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("answer")
    ap.add_argument("--texts", help="texts.json (Part 1); without it quotes are not checked")
    ap.add_argument("--doi", help="the DOI the call was made for (default: the only key of texts.json)")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    obj = one_object(Path(a.answer).read_text(encoding="utf-8"))
    if obj is None:
        sys.stderr.write("NOT_JSON: the reply holds no JSON object — run it again\n")
        return 3
    texts = json.loads(Path(a.texts).read_text(encoding="utf-8")) if a.texts else {}
    want = a.doi or (next(iter(texts)) if len(texts) == 1 else None)
    t = next((v for k, v in texts.items() if doi_of(k) == doi_of(want)), None) if want else None
    log, unverified = [], []
    obj = repair(obj, (t or {}).get("source_text"), (t or {}).get("text_basis"), want, log, unverified)
    out = Path(a.out) if a.out else Path(a.answer).with_suffix(".repaired.json")
    out.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"status": "usable", "written": str(out), "repairs": log,
                      "unverified_quotes": unverified,
                      "note": ("an UNVERIFIED quote stays as the model wrote it and is listed in the publish "
                               "report; it is not a reason to run the call again") if unverified else None},
                     ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
