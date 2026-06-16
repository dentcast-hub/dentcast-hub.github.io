#!/usr/bin/env python3
"""Resumable metadata fetcher for the paper cabinet.

For every paper in dentcast_cabinet_full_catalog.json that has a non-empty DOI,
look the work up on OpenAlex (by DOI, an exact identifier) and record the
scholarly metadata we want to backfill: abstract, journal, publication year,
ordered author list, and topical concepts (score >= 0.3). Crossref is used as a
fallback for the abstract only.

This script ONLY fetches and checkpoints. It never edits the catalog; the
companion enrich_metadata_apply.py reads the checkpoint and performs the
fill-only write. Progress is appended to a JSONL checkpoint after every paper,
so the run is fully resumable: on restart, DOIs already in the checkpoint are
skipped.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "dentcast_cabinet_full_catalog.json")
CHECKPOINT = os.path.join(ROOT, "enrich_metadata_checkpoint.jsonl")

MAILTO = "foad.shahabian@gmail.com"
UA = f"DentCast-cabinet-enrich/1.0 (https://dentcast-hub.github.io; mailto:{MAILTO})"
DELAY = 0.15          # polite delay between requests (seconds)
MAX_RETRIES = 5       # for 429 / transient errors


def http_get_json(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    backoff = 2
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8")), None
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, "404"
            if e.code == 429 or 500 <= e.code < 600:
                if attempt < MAX_RETRIES - 1:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
            return None, f"http_{e.code}"
        except Exception as e:  # noqa: BLE001 - network is best-effort
            if attempt < MAX_RETRIES - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            return None, f"err_{type(e).__name__}"
    return None, "exhausted"


def reconstruct_abstract(inv):
    """Rebuild plain-text abstract from OpenAlex abstract_inverted_index."""
    if not inv:
        return ""
    positions = []
    for word, idxs in inv.items():
        for i in idxs:
            positions.append((i, word))
    if not positions:
        return ""
    positions.sort()
    return " ".join(w for _, w in positions).strip()


def strip_jats(text):
    """Crude JATS/XML tag stripper for Crossref abstracts."""
    if not text:
        return ""
    import re
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fetch_openalex(doi):
    url = "https://api.openalex.org/works/https://doi.org/" + urllib.parse.quote(doi, safe="")
    url += "?mailto=" + urllib.parse.quote(MAILTO)
    data, err = http_get_json(url)
    if data is None:
        return None, err
    out = {}
    out["abstract"] = reconstruct_abstract(data.get("abstract_inverted_index"))
    loc = data.get("primary_location") or {}
    src = (loc.get("source") or {}) if isinstance(loc, dict) else {}
    out["journal"] = (src.get("display_name") or "") if isinstance(src, dict) else ""
    out["year"] = data.get("publication_year")
    out["authors"] = [
        a["author"]["display_name"]
        for a in (data.get("authorships") or [])
        if a.get("author") and a["author"].get("display_name")
    ]
    out["concepts"] = [
        {"name": c.get("display_name"), "score": round(c.get("score", 0), 4)}
        for c in (data.get("concepts") or [])
        if c.get("score", 0) >= 0.3 and c.get("display_name")
    ]
    out["openalex_id"] = data.get("id")
    return out, None


def fetch_crossref_abstract(doi):
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="/")
    url += "?mailto=" + urllib.parse.quote(MAILTO)
    data, err = http_get_json(url)
    if data is None:
        return ""
    msg = data.get("message") or {}
    return strip_jats(msg.get("abstract", ""))


def load_done():
    done = set()
    if os.path.exists(CHECKPOINT):
        with open(CHECKPOINT, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    done.add(rec["doi"])
                except Exception:  # noqa: BLE001
                    pass
    return done


def main():
    data = json.load(open(CATALOG, encoding="utf-8"))
    papers = data["papers"]
    todo = [p for p in papers if (p.get("doi") or "").strip()]
    done = load_done()
    remaining = [p for p in todo if p["doi"] not in done]
    print(f"doi papers: {len(todo)} | already done: {len(done)} | remaining: {len(remaining)}", flush=True)

    ck = open(CHECKPOINT, "a", encoding="utf-8")
    for n, p in enumerate(remaining, 1):
        doi = p["doi"]
        rec = {"id": p.get("id"), "doi": doi, "source": None, "found": False}
        oa, err = fetch_openalex(doi)
        if oa is not None:
            rec.update(oa)
            rec["source"] = "openalex"
            rec["found"] = True
            if not oa.get("abstract"):
                cr = fetch_crossref_abstract(doi)
                if cr:
                    rec["abstract"] = cr
                    rec["abstract_source"] = "crossref"
                time.sleep(DELAY)
        else:
            rec["error"] = err
        ck.write(json.dumps(rec, ensure_ascii=False) + "\n")
        ck.flush()
        if n % 25 == 0:
            print(f"  {n}/{len(remaining)} (last doi={doi} found={rec['found']})", flush=True)
        time.sleep(DELAY)
    ck.close()
    print("fetch complete", flush=True)


if __name__ == "__main__":
    main()
