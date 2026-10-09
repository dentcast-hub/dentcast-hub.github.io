#!/usr/bin/env python3
"""DES v2.9 FIDELITY — the caller's half: split a page into units and say
which cited source each unit is judged against.

The spec (appendix rules 7 and 10) takes segmentation and attribution out of
the model's hands, because those two were the largest sources of run-to-run
disagreement in the release tests. This tool IS those two rules, so every
agent produces byte-identical input blocks for the same page.

    python3 tools/des_fidelity_units.py sharehub/share-22            # report
    python3 tools/des_fidelity_units.py sharehub/share-22 --json     # machine-readable

    # build the FIDELITY input blocks, one per call, into DIR:
    python3 tools/des_fidelity_units.py sharehub/share-22 \\
        --texts texts.json --build DIR

`texts.json` maps each source's DOI (lower case) to
{"source_text": "...", "text_basis": "ABSTRACT_ONLY" | "FULL_TEXT" | ...} —
the same text the SOURCE call scored, on the same basis (the tool refuses
a mismatch — spec v2.7+ appendix rule 11). Resolving it (cabinet, PubMed, WebFetch)
is step 4.13 Part 1's job, not this tool's.

Three modes, decided here and nowhere else:
  * ONE scored source          → every unit goes to it (scope SOURCE).
  * several, some named inline → each unit goes to the source(s) it names, or
    to the one named last earlier in its paragraph (scope SOURCE, one call per
    source that received at least one unit).
  * several, none named inline → scope POOLED: one call PER SOURCE (each
    `input-pooled-S<n>.json`, judged as SOURCE), then `--merge DIR` folds the
    answers (`out-S<n>.json`) into the one pooled object by spec F6.
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import verify_publish as vp  # noqa: E402  (article_region, text_of)

HMARK = "\x01"
TERMINATORS = re.compile(r"(?<=[.!?؟۔])\s+")
BLOCK_TAGS = re.compile(r"(?i)</?(p|div|li|ul|ol|br|section|blockquote|tr|td|th|table|figcaption)\b[^>]*>")
INITIALS = re.compile(r"^[A-ZÀ-Ý]{1,4}$")
# Words that open journal titles and name nothing in particular. A journal's
# first word is a marker only when it is NOT one of these — «Cochrane» names one
# review family; «Journal», «Dental» or «BMC» would name half the literature.
JOURNAL_STOP = {
    "journal", "j", "the", "international", "int", "american", "european", "eur",
    "british", "br", "acta", "annals", "archives", "bmc", "clinical", "clin",
    "dental", "dent", "dentistry", "oral", "operative", "materials", "plos",
    "scientific", "frontiers", "applied", "advances", "medicine", "medical", "open",
    # demonyms open national journals and name a country, not a source
    "brazilian", "chinese", "japanese", "korean", "indian", "iranian", "australian",
    "canadian", "german", "italian", "turkish", "saudi", "egyptian", "swiss",
}


def scorable(src):
    """A source the FIDELITY call can run against (README step 4.13 Part 2b)."""
    if src.get("error") or src.get("content_type") == "NOT_APPRAISABLE":
        return False
    return True


def markers_for(src):
    """Latin markers that name this source in prose: the first author's family
    name as cited (and its last word, when that word is distinctive), the DOI,
    and the journal's first word when it is a proper name rather than a generic
    one («مرور Cochrane» names a review by its library, never by Miao)."""
    cit = src.get("citation") or {}
    first = (cit.get("authors") or "").split(",")[0].strip()
    words = first.split()
    while words and INITIALS.match(words[-1]):
        words.pop()
    out = set()
    if words:
        out.add(" ".join(words))
        if len(words[-1]) >= 4:
            out.add(words[-1])
    if cit.get("doi"):
        out.add(cit["doi"])
    jw = (cit.get("journal") or "").split()
    if jw and jw[0].lower().strip(".:,") not in JOURNAL_STOP and len(jw[0]) >= 5 and jw[0][0].isupper():
        out.add(jw[0].strip(".:,"))
    return {m for m in out if m}


def names(unit_text, marks):
    low = unit_text.lower()
    for m in marks:
        if re.search(r"(?<![A-Za-z])" + re.escape(m.lower()) + r"(?![A-Za-z])", low):
            return True
    return False


def stop_line(line, sources):
    letters = re.sub(r"^[^\w]+|[^\w]+$", "", line)
    if letters.lower() in ("منابع", "منبع", "references", "reference"):
        return True
    if line.strip() == "نویسنده:":
        return True
    low = line.lower().replace("“", "").replace("”", "").replace('"', "")
    for s in sources:
        cit = s.get("citation") or {}
        doi = (cit.get("doi") or "").lower()
        title = (cit.get("title") or "").lower().rstrip(".")
        if (doi and doi in low) or (title and len(title) > 12 and title in low):
            return True
    return False


def split_page(content_id, sources):
    doc = (ROOT / f"{content_id}.html").read_text(encoding="utf-8")
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    reg = vp.article_region(doc)
    reg = re.sub(r"(?is)<h[1-6]\b[^>]*>(.*?)</h[1-6]>",
                 lambda m: "\n" + HMARK + re.sub(r"<[^>]+>", "", m.group(1)).replace("\n", " ") + "\n", reg)
    reg = BLOCK_TAGS.sub("\n", reg)
    lines = ([HMARK + vp.text_of(h1.group(1))] if h1 else []) + html.unescape(re.sub(r"<[^>]+>", "", reg)).split("\n")
    units, para = [], 0
    for raw in lines:
        is_h = raw.lstrip().startswith(HMARK)
        line = re.sub(r"[ \t\r]+", " ", raw.replace(HMARK, "")).strip()
        if not line:
            continue
        if stop_line(line, sources):
            break
        para += 1
        for t in (x.strip() for x in TERMINATORS.split(line)):
            if t:
                u = {"id": f"u{len(units) + 1}", "text": t, "para": para}
                if is_h:
                    u["heading"] = True
                units.append(u)
    return units


def assign(units, sources):
    idx = [i for i, s in enumerate(sources) if scorable(s)]
    if len(idx) == 1:
        return "SOURCE", {idx[0]: [u["id"] for u in units]}
    marks = {i: markers_for(sources[i]) for i in idx}
    direct = {u["id"]: [i for i in idx if names(u["text"], marks[i])] for u in units}
    if not any(direct.values()):
        return "POOLED", {"pooled": [u["id"] for u in units]}
    out = {i: [] for i in idx}
    carry, cur_para = [], None
    for u in units:
        if u["para"] != cur_para or u.get("heading"):
            carry, cur_para = [], u["para"]
        hit = direct[u["id"]]
        if hit:
            carry = hit
        if u.get("heading"):
            continue
        for i in (hit or carry):
            out[i].append(u["id"])
    return "SOURCE", {i: ids for i, ids in out.items() if ids}


def last_sentence(text):
    parts = [p.strip() for p in TERMINATORS.split(text.replace("\n", " ")) if p.strip()]
    return parts[-1] if parts else ""


CONCL_HEAD = re.compile(r"(?<![A-Za-z])(?<!In )(?:CONCLUSIONS?|Conclusions?)\b:?\s+(?=[A-Z])")
BACK_MATTER = re.compile(r"(?<![A-Za-z])(?:Abbreviations|Acknowledg(?:e)?ments?|ACKNOWLEDG|Supplementary|"
                         r"Funding|FUNDING|Declarations|Data availab(?:ility|le)|DATA AVAILABILITY|Authors?[’'] contributions|Author Contributions|"
                         r"AUTHOR CONTRIBUTIONS|CONFLICT OF INTEREST|Conflicts? of interest|Competing interests|"
                         r"ORCID|REFERENCES|References)\b")


def conclusion_of(text, basis):
    """source_conclusion (spec appendix rule 7). An abstract ends on its
    conclusion; a full text ends on its back matter (ORCID, declarations), so
    under FULL_TEXT it is the last sentence of the paper's last Conclusion(s)
    section, cut at the first back-matter heading after it."""
    if basis == "FULL_TEXT":
        heads = list(CONCL_HEAD.finditer(text))
        if heads:
            body = text[heads[-1].end():]
            m = BACK_MATTER.search(body)
            return last_sentence(body[:m.start()] if m else body)
    return last_sentence(text)


BASIS_ORDER = ["FULL_TEXT", "SECONDARY_REPORT", "ABSTRACT_ONLY"]


def text_for(s, texts):
    """The FIDELITY call reads what the SOURCE call scored (spec v2.7 F0,
    appendix rule 11): a page written from a full text is never judged
    against its abstract. Refuse a text whose basis differs from the record."""
    doi = (s.get("citation") or {}).get("doi", "").lower()
    if doi not in texts:
        sys.exit(f"no text for {doi} in --texts")
    t = texts[doi]
    want = s.get("text_basis")
    if want and t.get("text_basis") != want:
        sys.exit(f"{doi}: --texts gives {t.get('text_basis')} but the SOURCE record was scored "
                 f"on {want} — pass the same text the SOURCE call scored (spec appendix rule 11)")
    return t


def build(content_id, sources, units, mode, plan, texts, outdir):
    """One input block per CALL. Under POOLED (spec v2.7 F6) that is one
    block PER SOURCE, each judged alone as scope SOURCE and carrying
    `pooled_part` («S2») so the caller can merge the answers afterwards
    (`--merge`) — one model never reads two full papers in one call, which is
    where the v2.7 precision test lost its verdicts."""
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    by_id = {u["id"]: u for u in units}
    pub = lambda ids: [{k: v for k, v in by_id[i].items() if k != "para"} for i in ids]
    url = f"https://dentcast.org/{content_id}.html"
    made = []
    for key, ids in plan.items():
        if key == "pooled":
            for n, s in enumerate(sources, 1):
                if not scorable(s):
                    continue
                t = text_for(s, texts)
                blk = {"mode": "FIDELITY", "scope": "SOURCE", "pooled_part": f"S{n}",
                       "source_text": t["source_text"], "text_basis": t["text_basis"], "units": pub(ids),
                       "derivative_url": url,
                       "source_conclusion": conclusion_of(t["source_text"], t["text_basis"])}
                p = outdir / f"input-pooled-S{n}.json"
                p.write_text(json.dumps(blk, ensure_ascii=False, indent=1), encoding="utf-8")
                made.append(str(p))
        else:
            s = sources[key]
            t = text_for(s, texts)
            blk = {"mode": "FIDELITY", "scope": "SOURCE", "source_text": t["source_text"],
                   "text_basis": t["text_basis"], "units": pub(ids), "derivative_url": url,
                   "source_conclusion": conclusion_of(t["source_text"], t["text_basis"])}
            p = outdir / f"input-src{key}.json"
            p.write_text(json.dumps(blk, ensure_ascii=False, indent=1), encoding="utf-8")
            made.append(str(p))
    return made


SILENT = ("NOT_IN_SOURCE", "NOT_ASSESSABLE")
EXCLUDED = ("NOT_A_CLAIM", "AUTHOR_VIEW")


def compose_fa(claims, counts, assessable, level, version, pooled):
    """fact_fa / interpretation_fa composed from a tally the caller built
    (POOLED merge, majority vote) — never by a model that saw only one run."""
    fa = lambda n: str(n).translate(str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹"))
    src_fa = "منابع" if pooled else "منبع"
    lvl_fa = {"HIGH": "بالا", "MEDIUM": "متوسط", "LOW": "پایین", "INSUFFICIENT_CLAIMS": "ادعای کافی ندارد"}[level]
    if vp.des_ge(version, (2, 8)):
        # v2.8 F4: the score is over the claims the sources ADDRESS; a sentence
        # they are silent about is counted, never called a fault (F5 fact_fa)
        fact = (f"از {fa(assessable)} ادعایی که {src_fa} به آن پرداخته‌اند، {fa(counts['matches'])} مورد مطابق است، "
                f"{fa(counts['altered'])} مورد تغییر یافته و {fa(counts['reversed'])} مورد برعکس؛ سطح انطباق {lvl_fa}"
                + (f"؛ {fa(counts['not_in_source'])} جمله‌ی دیگر در {src_fa} نیامده است." if counts['not_in_source'] else "."))
    else:
        fact = (f"از {fa(assessable)} ادعای قابل‌بررسی، {fa(counts['matches'])} مورد با {src_fa} مطابق است، "
                f"{fa(counts['altered'])} مورد تغییر یافته و {fa(counts['reversed'])} مورد برعکس؛ سطح انطباق {lvl_fa}.")
    flagged = [c for c in claims if c["verdict"] in ("ALTERED", "REVERSED")]
    if not flagged:
        interp = ("هر ادعای قابل‌بررسی با دست‌کم یکی از منابع مطابق است." if pooled
                  else "هر ادعای قابل‌بررسی با منبع مطابق است.")
    else:
        kinds = {"HEDGE_REMOVED": "قاطع‌تر از منبع", "HEDGE_ADDED": "محتاط‌تر از منبع", "MAGNITUDE_CHANGED": "اندازه متفاوت",
                 "POPULATION_OR_CONDITION_CHANGED": "دامنه گسترده‌تر از منبع", "GROUP_OR_COMPARATOR_CHANGED": "گروه مقایسه متفاوت"}
        items = [f"«{c['claim_quote'][:50]}…» ({'برعکس' if c['verdict'] == 'REVERSED' else kinds.get(c['change_kind'], 'تغییریافته')})"
                 for c in flagged[:6]]
        interp = "موارد تغییریافته یا برعکس: " + "؛ ".join(items) + ("." if len(flagged) <= 6 else f"؛ و {fa(len(flagged) - 6)} مورد دیگر.")
    return fact, interp


def merge_pooled(parts, basis):
    """Spec v2.7 F6: fold the per-source answers of a POOLED page into the one
    pooled object, deterministically. Per unit: MATCHES when any source states
    it; else ALTERED when any does (the earliest source's kind and quote);
    else REVERSED when any does; else silence (by the pooled basis); and
    NOT_A_CLAIM / AUTHOR_VIEW only when EVERY source said so (attribution does
    not depend on the source, so one call attributing the unit wins — F1's
    default). `parts` is {"S1": output, "S2": output, …}."""
    tags = sorted(parts, key=lambda s: int(s[1:]))
    n_units = len(parts[tags[0]]["claims"])
    claims = []
    for i in range(n_units):
        rows = [(tag, parts[tag]["claims"][i]) for tag in tags]
        cid = rows[0][1]["id"]
        assert all(c["id"] == cid for _, c in rows), f"part outputs disagree on unit order at {cid}"
        base = {"id": cid, "claim_quote": rows[0][1]["claim_quote"]}
        pick = None
        for want in ("MATCHES", "ALTERED", "REVERSED"):
            hit = [(tag, c) for tag, c in rows if c["verdict"] == want]
            if hit:
                tag, c = hit[0]
                pick = {**base, "verdict": want, "change_kind": c.get("change_kind") if want == "ALTERED" else None,
                        "source_quote": c.get("source_quote", ""), "source_ref": tag}
                others = [f"{t2}: {c2['verdict']}" for t2, c2 in rows if t2 != tag and c2["verdict"] not in SILENT]
                note = (c.get("note") or "").strip()
                if others:
                    note = (note + "; " if note else "") + "other sources: " + ", ".join(others)
                if note:
                    pick["note"] = note
                break
        if pick is None:
            if all(c["verdict"] in EXCLUDED for _, c in rows):
                v = rows[0][1]["verdict"]
                pick = {**base, "verdict": v, "change_kind": None, "source_quote": "", "source_ref": None,
                        "note": rows[0][1].get("note") or v.lower()}
            else:
                v = "NOT_IN_SOURCE" if basis == "FULL_TEXT" else "NOT_ASSESSABLE"
                pick = {**base, "verdict": v, "change_kind": None, "source_quote": "", "source_ref": None,
                        "note": "no source addresses it: " + ", ".join(f"{t2}: {c2['verdict']}" for t2, c2 in rows)}
        claims.append(pick)
    vs = [c["verdict"] for c in claims]
    counts = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"), "reversed": vs.count("REVERSED"),
              "not_in_source": vs.count("NOT_IN_SOURCE"), "not_assessable": vs.count("NOT_ASSESSABLE"),
              "author_view": vs.count("AUTHOR_VIEW"), "not_a_claim": vs.count("NOT_A_CLAIM")}
    version = parts[tags[0]].get("des_version", "2.8")
    assessable, score, level = vp.des_fidelity_recompute(counts, version)
    fact, interp = compose_fa(claims, counts, assessable, level, version, pooled=True)
    concl = "\n".join(f"[{tag}] {parts[tag].get('source_conclusion', '')}" for tag in tags)
    return {"des_version": version, "mode": "FIDELITY", "scope": "POOLED",
            "text_basis": basis, "claims": claims, "counts": counts, "assessable": assessable,
            "fidelity_score": score, "level": level, "provisional": basis != "FULL_TEXT",
            "source_conclusion": concl, "fact_fa": fact, "interpretation_fa": interp}

FLAGGED = ("ALTERED", "REVERSED")


def vote_source(runs, adjudicated=None):
    """Majority vote over repeated SOURCE-scope runs of ONE source (workflow
    step 4.13 Part 2c). `runs` is a list of outputs: runs[0] covers every
    unit; later runs may cover only a subset (the units runs[0] flagged).
    Per unit, the (verdict, change_kind) pair at least two runs agree on
    wins and its quote/note come from the earliest run in that majority;
    a unit only runs[0] judged keeps runs[0]'s answer. A unit with no
    majority is unresolved until `adjudicated[uid]` supplies the claim
    object (the adjudicator's decision, Part 2c). Returns (object, unresolved)."""
    adjudicated = adjudicated or {}
    base = runs[0]
    by_run = [{c["id"]: c for c in r["claims"]} for r in runs]
    claims, unresolved = [], []
    for c0 in base["claims"]:
        uid = c0["id"]
        votes = [(i, br[uid]) for i, br in enumerate(by_run) if uid in br]
        if uid in adjudicated:
            pick = {**c0, **adjudicated[uid]}
        elif len(votes) == 1:
            pick = c0
        else:
            keys = [(c["verdict"], c.get("change_kind")) for _, c in votes]
            top = max(set(keys), key=lambda k: (keys.count(k), -keys.index(k)))
            if keys.count(top) * 2 <= len(keys):
                unresolved.append(uid)
                pick = c0
            else:
                pick = votes[keys.index(top)][1]
        for c in (pick,):
            assert c["claim_quote"] == c0["claim_quote"], f"runs disagree on the text of {uid}"
        claims.append(pick)
    vs = [c["verdict"] for c in claims]
    counts = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"), "reversed": vs.count("REVERSED"),
              "not_in_source": vs.count("NOT_IN_SOURCE"), "not_assessable": vs.count("NOT_ASSESSABLE"),
              "author_view": vs.count("AUTHOR_VIEW"), "not_a_claim": vs.count("NOT_A_CLAIM")}
    version = base.get("des_version")
    assessable, score, level = vp.des_fidelity_recompute(counts, version)
    fact, interp = compose_fa(claims, counts, assessable, level, version, pooled=False)
    out = {**base, "claims": claims, "counts": counts, "assessable": assessable,
           "fidelity_score": score, "level": level, "fact_fa": fact, "interpretation_fa": interp}
    return out, unresolved


def rebase(base, runs, page_units, k):
    """Part 3b re-check: the last full voted object stands for every unit the
    founder did not edit, and the new runs cover the edited ones only. Refuse
    unless the page's units for this source are still the base's units, same
    ids in the same order, each with the same text — except the units the new
    runs judged, whose text must be the page's current text. An edit that
    split or joined a sentence shifts ids, and then only a full run is honest."""
    rechecked = {c["id"] for r in runs for c in r["claims"]}
    base_ids = [c["id"] for c in base["claims"]]
    if base_ids != [u["id"] for u in page_units]:
        sys.exit(f"src{k}: the page's units are no longer the base's (ids shifted) — run the full step again")
    stale = [u["id"] for u, c in zip(page_units, base["claims"])
             if u["text"] != c["claim_quote"] and u["id"] not in rechecked]
    if stale:
        sys.exit(f"src{k}: {stale} changed on the page but were not re-checked")
    for r in runs:
        for c in r["claims"]:
            cur = next(u["text"] for u in page_units if u["id"] == c["id"])
            if c["claim_quote"] != cur:
                sys.exit(f"src{k}: re-check of {c['id']} judged old text")
    if not runs:
        return [base]
    first = {c["id"]: c for c in runs[0]["claims"]}
    run0 = {**base, "claims": [first.get(c["id"], c) for c in base["claims"]]}
    return [run0] + runs[1:]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("content_id")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--texts")
    ap.add_argument("--build")
    ap.add_argument("--merge", metavar="DIR", help="fold DIR/out-S<n>.json (one per source) into DIR/pooled.json")
    ap.add_argument("--only", metavar="IDS", help="with --build: keep only these units (comma list), for the "
                    "confirming runs of step 4.13 Part 2c")
    ap.add_argument("--base", metavar="OLD_DIR", help="with --vote: re-check only. OLD_DIR holds the voted-src<k>.json "
                    "of the last full run; DIR holds runs over the EDITED units alone (Part 3b). Every other unit "
                    "must still be on the page with the same id and text, or the tool refuses")
    ap.add_argument("--vote", metavar="DIR", help="majority-vote DIR/out-src<k>-<run>.json (run 1 full, runs 2-3 "
                    "the flagged units) into DIR/voted-src<k>.json; DIR/adjudicate.json "
                    "{\"src<k>\": {uid: claim fields}} settles a unit with no majority")
    a = ap.parse_args()
    rec = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8")).get(a.content_id)
    if not rec:
        sys.exit(f"no DES record for {a.content_id}")
    sources = rec["sources"]
    units = split_page(a.content_id, sources)
    mode, plan = assign(units, sources)
    if a.merge:
        if mode != "POOLED":
            sys.exit("--merge is for a POOLED page")
        d = Path(a.merge)
        parts = {p.stem[4:]: json.loads(p.read_text(encoding="utf-8")) for p in sorted(d.glob("out-S*.json"))}
        want = {f"S{n}" for n, s in enumerate(sources, 1) if scorable(s)}
        if set(parts) != want:
            sys.exit(f"--merge needs {sorted(want)}, found {sorted(parts)}")
        bases = [s.get("text_basis") for s in sources if scorable(s)]
        merged = merge_pooled(parts, max(bases, key=BASIS_ORDER.index))
        (d / "pooled.json").write_text(json.dumps(merged, ensure_ascii=False, indent=1), encoding="utf-8")
        print(d / "pooled.json", merged["fidelity_score"], merged["level"])
        return
    if a.vote:
        d = Path(a.vote)
        adj_p = d / "adjudicate.json"
        adj = json.loads(adj_p.read_text(encoding="utf-8")) if adj_p.exists() else {}
        open_units = 0
        by_id = {u["id"]: u for u in units}
        for k in sorted(plan, key=str):
            if k == "pooled":
                sys.exit("--vote is per source (scope SOURCE); a POOLED page votes each S<n> part, then --merge")
            runs = [json.loads(p.read_text(encoding="utf-8"))
                    for p in sorted(d.glob(f"out-src{k}-*.json"), key=lambda p: int(p.stem.rsplit("-", 1)[1]))]
            if a.base:
                base_p = Path(a.base) / f"voted-src{k}.json"
                if not base_p.exists():
                    sys.exit(f"--base: no {base_p}")
                base = json.loads(base_p.read_text(encoding="utf-8"))
                runs = rebase(base, runs, [by_id[i] for i in plan[k]], k)
            if not runs:
                continue
            out, unresolved = vote_source(runs, adj.get(f"src{k}"))
            (d / f"voted-src{k}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
            flagged = [c["id"] for c in out["claims"] if c["verdict"] in FLAGGED]
            print(f"src{k}: {len(runs)} run(s) · {out['fidelity_score']} {out['level']} · "
                  f"flagged {flagged or '—'} · no majority {unresolved or '—'}")
            open_units += len(unresolved)
        if open_units:
            sys.exit(f"{open_units} unit(s) have no majority — adjudicate them in {adj_p}")
        return
    if a.build:
        if not a.texts:
            sys.exit("--build needs --texts")
        texts = {k.lower(): v for k, v in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
        if a.only:
            keep = set(a.only.split(","))
            plan = {k: [i for i in ids if i in keep] for k, ids in plan.items()}
            plan = {k: ids for k, ids in plan.items() if ids}
        for p in build(a.content_id, sources, units, mode, plan, texts, a.build):
            print(p)
        return
    if a.json:
        print(json.dumps({"mode": mode, "units": units, "plan": {str(k): v for k, v in plan.items()}},
                         ensure_ascii=False, indent=1))
        return
    print(f"{a.content_id}: {len(units)} units, scope {mode}")
    for k, ids in plan.items():
        label = "pooled" if k == "pooled" else f"src{k} {sorted(markers_for(sources[k]))}"
        print(f"  {label}: {len(ids)} units")


if __name__ == "__main__":
    main()
