#!/usr/bin/env python3
"""DES v2.7 FIDELITY — the caller's half: split a page into units and say
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
a mismatch — spec v2.7 appendix rule 11). Resolving it (cabinet, PubMed, WebFetch)
is step 4.13 Part 1's job, not this tool's.

Three modes, decided here and nowhere else:
  * ONE scored source          → every unit goes to it (scope SOURCE).
  * several, some named inline → each unit goes to the source(s) it names, or
    to the one named last earlier in its paragraph (scope SOURCE, one call per
    source that received at least one unit).
  * several, none named inline → one call against all of them (scope POOLED).
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
                         r"Funding|FUNDING|Declarations|Data availability|DATA AVAILABILITY|Authors?[’'] contributions|"
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
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    by_id = {u["id"]: u for u in units}
    pub = lambda ids: [{k: v for k, v in by_id[i].items() if k != "para"} for i in ids]
    url = f"https://dentcast.org/{content_id}.html"
    made = []
    for key, ids in plan.items():
        if key == "pooled":
            blocks, bases, concl = [], [], []
            for n, s in enumerate(sources, 1):
                if not scorable(s):
                    continue
                t = text_for(s, texts)
                blocks.append(f"[S{n}] {t['source_text']}")
                bases.append(t["text_basis"])
                concl.append(f"[S{n}] {conclusion_of(t['source_text'], t['text_basis'])}")
            blk = {"mode": "FIDELITY", "scope": "POOLED", "source_text": "\n\n".join(blocks),
                   "text_basis": max(bases, key=BASIS_ORDER.index), "units": pub(ids),
                   "derivative_url": url, "source_conclusion": "\n".join(concl)}
            name = "pooled"
        else:
            s = sources[key]
            t = text_for(s, texts)
            blk = {"mode": "FIDELITY", "scope": "SOURCE", "source_text": t["source_text"],
                   "text_basis": t["text_basis"], "units": pub(ids), "derivative_url": url,
                   "source_conclusion": conclusion_of(t["source_text"], t["text_basis"])}
            name = f"src{key}"
        p = outdir / f"input-{name}.json"
        p.write_text(json.dumps(blk, ensure_ascii=False, indent=1), encoding="utf-8")
        made.append(str(p))
    return made


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("content_id")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--texts")
    ap.add_argument("--build")
    a = ap.parse_args()
    rec = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8")).get(a.content_id)
    if not rec:
        sys.exit(f"no DES record for {a.content_id}")
    sources = rec["sources"]
    units = split_page(a.content_id, sources)
    mode, plan = assign(units, sources)
    if a.build:
        if not a.texts:
            sys.exit("--build needs --texts")
        texts = {k.lower(): v for k, v in json.loads(Path(a.texts).read_text(encoding="utf-8")).items()}
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
