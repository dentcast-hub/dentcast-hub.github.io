#!/usr/bin/env python3
"""Apply fetched metadata to the catalog (fill-only) and write an audit report.

Reads enrich_metadata_checkpoint.jsonl (produced by enrich_metadata_fetch.py)
and backfills dentcast_cabinet_full_catalog.json with the fill-only rules:

  * abstract / journal / crossref_year : set ONLY if currently empty/missing.
  * authors  : add ONLY if absent.
  * concepts : add ONLY if absent. (Field read by the later tagging pass.)
  * tags are never touched. Papers without a DOI are never touched.

Existing keys keep their position and value; any newly added key is appended at
the end of that entry. Output is byte-for-byte compatible with the source
formatting: 1-space indent, ensure_ascii=False, NO trailing newline.

Pass --write to actually overwrite the catalog; default is a dry run that only
writes the audit report and prints the summary.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "dentcast_cabinet_full_catalog.json")
CHECKPOINT = os.path.join(ROOT, "enrich_metadata_checkpoint.jsonl")
REPORT = os.path.join(ROOT, "enrich_metadata_report.json")

YEAR_FIELD = "crossref_year"  # the catalog's existing publication-year field


def is_empty(v):
    return v is None or v == "" or v == []


def load_checkpoint():
    recs = {}
    with open(CHECKPOINT, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            recs[r["doi"]] = r  # last write wins
    return recs


def main():
    write = "--write" in sys.argv
    raw = open(CATALOG, encoding="utf-8").read()
    data = json.loads(raw)
    papers = data["papers"]
    recs = load_checkpoint()

    counts = {"abstract": 0, "journal": 0, YEAR_FIELD: 0, "authors": 0, "concepts": 0}
    no_match = []
    audit = []

    for p in papers:
        doi = (p.get("doi") or "").strip()
        if not doi:
            continue
        rec = recs.get(doi)
        if not rec or not rec.get("found"):
            no_match.append({"id": p.get("id"), "doi": doi,
                             "error": (rec or {}).get("error", "not_fetched")})
            continue

        filled = {}

        # abstract
        if is_empty(p.get("abstract")) and rec.get("abstract"):
            p["abstract"] = rec["abstract"]
            counts["abstract"] += 1
            filled["abstract"] = rec.get("abstract_source", rec["source"])
        # journal
        if is_empty(p.get("journal")) and rec.get("journal"):
            p["journal"] = rec["journal"]
            counts["journal"] += 1
            filled["journal"] = rec["source"]
        # year
        if is_empty(p.get(YEAR_FIELD)) and rec.get("year") is not None:
            p[YEAR_FIELD] = rec["year"]
            counts[YEAR_FIELD] += 1
            filled[YEAR_FIELD] = rec["source"]
        # authors (add only if absent)
        if "authors" not in p and rec.get("authors"):
            p["authors"] = rec["authors"]
            counts["authors"] += 1
            filled["authors"] = rec["source"]
        # concepts (add only if absent)
        if "concepts" not in p and rec.get("concepts"):
            p["concepts"] = rec["concepts"]
            counts["concepts"] += 1
            filled["concepts"] = rec["source"]

        if filled:
            audit.append({"id": p.get("id"), "doi": doi, "filled": filled})

    summary = {
        "papers_total": len(papers),
        "papers_with_doi": sum(1 for p in papers if (p.get("doi") or "").strip()),
        "fetched_found": sum(1 for r in recs.values() if r.get("found")),
        "no_match": len(no_match),
        "fill_counts": counts,
        "papers_enriched": len(audit),
    }
    json.dump({"summary": summary, "no_match": no_match, "audit": audit},
              open(REPORT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    out = json.dumps(data, ensure_ascii=False, indent=1)
    assert json.loads(out) == data, "roundtrip mismatch"
    assert len(json.loads(out)["papers"]) == 2194, "paper count changed"

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if write:
        with open(CATALOG, "w", encoding="utf-8") as f:
            f.write(out)  # no trailing newline
        print("WROTE catalog")
    else:
        print("dry run (no --write); report written to", REPORT)


if __name__ == "__main__":
    main()
