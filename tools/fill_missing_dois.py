# -*- coding: utf-8 -*-
"""
Fill missing DOIs in dentcast_cabinet_full_catalog.json.

Confidence-gated: only ADDS a `doi` to entries that lack one. Never modifies,
overwrites, or re-validates existing DOIs. Never touches any other field.

Sources, in order, per entry:
  1. embedded   - DOI already present in title/display_title/file_name fields
  2. crossref   - https://api.crossref.org/works?query.bibliographic=...
  3. openalex   - https://api.openalex.org/works?search=...  (fallback)

Gate (all must hold for a candidate to be accepted):
  - normalized token-sorted title similarity >= 0.92
  - >=1 author surname matches (WAIVED: file has no author data)
  - year within +/-1 (WAIVED: file has no usable year for missing entries)
  - exactly ONE candidate clears the bar (2+ => ambiguous => skip)

Outputs:
  - rewrites the catalog (validated: parses + count==2194 before/after)
  - doi_fill_audit.md   audit log (filled + skipped, with scores)
  - doi_fill_results.jsonl   raw per-entry decisions (checkpoint)
  - doi_fill_summary.txt   final summary counts
"""
import json, re, time, sys, urllib.request, urllib.parse, difflib

CATALOG = "dentcast_cabinet_full_catalog.json"
AUDIT   = "doi_fill_audit.md"
JSONL   = "doi_fill_results.jsonl"
SUMMARY = "doi_fill_summary.txt"
EXPECTED_COUNT = 2194
SIM_THRESHOLD = 0.92
UA = "DentCastCatalog/1.0 (https://dentcast.org; mailto:foad.shahabian@gmail.com)"

DOI_RX = re.compile(r"10\.\d{4,9}/[^\s\"]+", re.I)


def norm_title(s):
    s = (s or "").lower()
    s = re.sub(r"[^\w\s]", " ", s, flags=re.UNICODE)   # strip punctuation
    s = re.sub(r"\s+", " ", s).strip()                   # collapse whitespace
    return s


def token_sort(s):
    return " ".join(sorted(norm_title(s).split()))


def sim(a, b):
    """token-sorted similarity ratio in [0,1]."""
    return difflib.SequenceMatcher(None, token_sort(a), token_sort(b)).ratio()


def normalize_doi(d):
    if not d:
        return None
    d = d.strip()
    d = re.sub(r"^https?://(dx\.)?doi\.org/", "", d, flags=re.I)
    d = re.sub(r"^doi:\s*", "", d, flags=re.I)
    return d.strip().lower()


def http_json(url, tries=4):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8")), None
        except urllib.error.HTTPError as e:
            last = "HTTP %s" % e.code
            if e.code == 429:
                time.sleep(5 * (attempt + 1))   # back off on rate limit
                continue
            if e.code in (500, 502, 503, 504):
                time.sleep(2 * (attempt + 1))
                continue
            return None, last      # 403/404/etc -> give up on this source
        except Exception as e:
            last = repr(e)
            time.sleep(2 * (attempt + 1))
    return None, last


def crossref_candidates(title):
    q = urllib.parse.quote(title)
    url = ("https://api.crossref.org/works?query.bibliographic=%s&rows=5"
           "&select=DOI,title,author,issued,container-title" % q)
    data, err = http_json(url)
    if data is None:
        return None, err
    out = []
    for it in data.get("message", {}).get("items", []):
        ct = it.get("title") or []
        out.append({
            "doi": it.get("DOI"),
            "title": ct[0] if ct else "",
        })
    return out, None


def openalex_candidates(title):
    q = urllib.parse.quote(title)
    url = ("https://api.openalex.org/works?search=%s&per_page=5"
           "&select=id,doi,title&mailto=foad.shahabian@gmail.com" % q)
    data, err = http_json(url)
    if data is None:
        return None, err
    out = []
    for it in data.get("results", []):
        out.append({
            "doi": it.get("doi"),     # openalex returns full URL form
            "title": it.get("title") or "",
        })
    return out, None


def gate(file_title, candidates):
    """Return (decision, payload).
    decision in {accept, ambiguous, lowconf, empty}.
    For accept: payload = (doi, matched_title, score).
    For ambiguous/lowconf: payload = best (matched_title, score) for the log.
    """
    if candidates is None:
        return "error", None
    scored = []
    for c in candidates:
        if not c.get("doi") or not c.get("title"):
            continue
        scored.append((sim(file_title, c["title"]), c))
    if not scored:
        return "empty", None
    scored.sort(key=lambda x: x[0], reverse=True)
    clears = [c for c in scored if c[0] >= SIM_THRESHOLD]
    if len(clears) == 1:
        sc, c = clears[0]
        return "accept", (normalize_doi(c["doi"]), c["title"], round(sc, 4))
    if len(clears) >= 2:
        sc, c = clears[0]
        return "ambiguous", (c["title"], round(sc, 4), len(clears))
    sc, c = scored[0]
    return "lowconf", (c["title"], round(sc, 4))


def main():
    with open(CATALOG, encoding="utf-8") as f:
        raw = f.read()
    data = json.loads(raw)
    papers = data["papers"]
    assert len(papers) == EXPECTED_COUNT, "unexpected count %d" % len(papers)

    missing = [p for p in papers if "doi" not in p]
    total_missing = len(missing)

    stats = {"embedded": 0, "crossref": 0, "openalex": 0,
             "lowconf": 0, "ambiguous": 0, "notfound": 0, "error": 0}
    filled = []   # (id, source, file_title, matched_title, doi, score)
    skipped = []  # (id, reason, file_title, best_title, best_score)

    jf = open(JSONL, "w", encoding="utf-8")

    for i, p in enumerate(missing):
        pid = p["id"]
        ftitle = p.get("real_title") or p.get("title") or p.get("display_title") or ""
        rec = {"id": pid, "file_title": ftitle}

        # 1. embedded
        blob = " ".join(str(p.get(k, "")) for k in
                        ("title", "display_title", "file_name", "real_title"))
        m = DOI_RX.search(blob)
        if m:
            doi = normalize_doi(m.group(0))
            p["doi"] = doi
            stats["embedded"] += 1
            filled.append((pid, "embedded", ftitle, ftitle, doi, 1.0))
            rec.update(source="embedded", doi=doi, score=1.0)
            jf.write(json.dumps(rec, ensure_ascii=False) + "\n"); jf.flush()
            continue

        # 2. crossref
        cands, err = crossref_candidates(ftitle)
        time.sleep(0.2)
        decision, payload = gate(ftitle, cands)

        if decision == "accept":
            doi, mt, sc = payload
            p["doi"] = doi
            stats["crossref"] += 1
            filled.append((pid, "crossref", ftitle, mt, doi, sc))
            rec.update(source="crossref", doi=doi, matched=mt, score=sc)
            jf.write(json.dumps(rec, ensure_ascii=False) + "\n"); jf.flush()
            continue

        if decision == "ambiguous":
            mt, sc, n = payload
            stats["ambiguous"] += 1
            skipped.append((pid, "ambiguous(crossref,%d clear)" % n, ftitle, mt, sc))
            rec.update(decision="ambiguous", source="crossref", best=mt, score=sc, n=n)
            jf.write(json.dumps(rec, ensure_ascii=False) + "\n"); jf.flush()
            continue

        # decision in {lowconf, empty, error} -> fall back to OpenAlex
        cands2, err2 = openalex_candidates(ftitle)
        time.sleep(0.15)
        d2, pl2 = gate(ftitle, cands2)

        if d2 == "accept":
            doi, mt, sc = pl2
            p["doi"] = doi
            stats["openalex"] += 1
            filled.append((pid, "openalex", ftitle, mt, doi, sc))
            rec.update(source="openalex", doi=doi, matched=mt, score=sc)
            jf.write(json.dumps(rec, ensure_ascii=False) + "\n"); jf.flush()
            continue

        if d2 == "ambiguous":
            mt, sc, n = pl2
            stats["ambiguous"] += 1
            skipped.append((pid, "ambiguous(openalex,%d clear)" % n, ftitle, mt, sc))
            rec.update(decision="ambiguous", source="openalex", best=mt, score=sc, n=n)
            jf.write(json.dumps(rec, ensure_ascii=False) + "\n"); jf.flush()
            continue

        # classify final skip reason, prefer the more informative of the two passes
        best_title, best_score, reason = "", 0.0, "notfound"
        for dec, pl, src in ((decision, payload, "crossref"), (d2, pl2, "openalex")):
            if dec == "lowconf" and pl:
                if pl[1] > best_score:
                    best_title, best_score = pl[0], pl[1]
                reason = "lowconf"
        if decision == "error" and d2 == "error":
            reason = "error"
        if reason == "lowconf":
            stats["lowconf"] += 1
        elif reason == "error":
            stats["error"] += 1
        else:
            stats["notfound"] += 1
        skipped.append((pid, reason, ftitle, best_title, best_score))
        rec.update(decision=reason, best=best_title, score=best_score,
                   cr_err=err, oa_err=err2)
        jf.write(json.dumps(rec, ensure_ascii=False) + "\n"); jf.flush()

        if (i + 1) % 25 == 0:
            print("...processed %d/%d  filled=%d" %
                  (i + 1, total_missing,
                   stats["embedded"] + stats["crossref"] + stats["openalex"]),
                  flush=True)

    jf.close()

    # ---- validate & write catalog ----
    assert len(data["papers"]) == EXPECTED_COUNT, "count changed!"
    out = json.dumps(data, ensure_ascii=False, indent=1)
    json.loads(out)  # parse-check
    with open(CATALOG, "w", encoding="utf-8") as f:
        f.write(out)   # no trailing newline

    # ---- audit log ----
    with open(AUDIT, "w", encoding="utf-8") as a:
        a.write("# DOI fill audit\n\n")
        a.write("Total missing at start: %d\n\n" % total_missing)
        a.write("Filled embedded: %d  |  Crossref: %d  |  OpenAlex: %d\n" %
                (stats["embedded"], stats["crossref"], stats["openalex"]))
        a.write("Skipped low-confidence: %d  |  ambiguous: %d  |  not found: %d  |  errors: %d\n\n" %
                (stats["lowconf"], stats["ambiguous"], stats["notfound"], stats["error"]))
        a.write("## Filled (%d)\n\n" % len(filled))
        a.write("| id | source | score | doi | file title | matched title |\n")
        a.write("|----|--------|-------|-----|-----------|---------------|\n")
        for pid, src, ft, mt, doi, sc in filled:
            a.write("| %s | %s | %s | %s | %s | %s |\n" %
                    (pid, src, sc, doi, ft.replace("|", "/"), (mt or "").replace("|", "/")))
        a.write("\n## Skipped (%d)\n\n" % len(skipped))
        a.write("| id | reason | best score | file title | best candidate title |\n")
        a.write("|----|--------|-----------|-----------|----------------------|\n")
        for pid, reason, ft, bt, bs in skipped:
            a.write("| %s | %s | %s | %s | %s |\n" %
                    (pid, reason, bs, ft.replace("|", "/"), (bt or "").replace("|", "/")))

    # ---- summary ----
    lines = [
        "DOI fill summary",
        "================",
        "Total missing at start : %d" % total_missing,
        "Filled via embedded    : %d" % stats["embedded"],
        "Filled via Crossref    : %d" % stats["crossref"],
        "Filled via OpenAlex    : %d" % stats["openalex"],
        "Skipped low-confidence : %d" % stats["lowconf"],
        "Skipped ambiguous      : %d" % stats["ambiguous"],
        "Not found              : %d" % stats["notfound"],
        "Lookup errors          : %d" % stats["error"],
        "Total filled           : %d" % (stats["embedded"] + stats["crossref"] + stats["openalex"]),
        "Final entries          : %d" % len(data["papers"]),
        "Remaining missing      : %d" % len([p for p in data["papers"] if "doi" not in p]),
    ]
    txt = "\n".join(lines)
    with open(SUMMARY, "w", encoding="utf-8") as s:
        s.write(txt + "\n")
    print(txt, flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
