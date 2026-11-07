#!/usr/bin/env python3
"""Count a page's «کاوش بیشتر» links against Hard Rule 9 (cap of 5).

Hard Rule 9 (module 01) counts EVERY link inside the section — the nav capsules
(«فهرست موضوعی» → /pillar/…, «دانشنامه» → /glossary/) included — and nothing
outside it: the «about» line, the footer's «بازگشت…» button and the body's own
links are not in the section. This tool counts exactly what Phase F's «9 cap»
row counts (tools/verify_publish.py: related_section() and its href list), so
the number written in 11-لینک‌های-گلاسری.md (4.7 on each glossary page, 4.9 on
the new page) is the number the gate will see. A core episode has no such
section; its «محتوای مرتبط» block is counted by its `ep-related-link` anchors.

    python3 tools/related_cap.py glossary/intraoral-scanner.html glossary/scan-body.html
    python3 tools/related_cap.py <throwaway>/sharehub/share-47.html     # the draft page of a queue item
    python3 tools/related_cap.py --json glossary/scan-body.html

Per page: the links (nav capsules marked), the count, the free slots
(max(0, 5 − count)) and «at_cap» / «over_cap». Exit 0; 2 when a page is missing.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import verify_publish as vp  # noqa: E402

CAP = 5
NAV = (("/glossary/", "دانشنامه"), ("/pillar/", "فهرست موضوعی"))


def count(path):
    doc = Path(path).read_text(encoding="utf-8")
    sec = vp.related_section(doc)
    kind = "dc-related-section"
    if sec:
        block = sec.group(0)
        anchors = re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
        hrefs = re.findall(r'href="([^"]+)"', block)  # what the gate counts
    else:
        kind = "ep-related-link" if "ep-related-link" in doc else None
        anchors = re.findall(r'<a\b[^>]*class="[^"]*ep-related-link[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>|'
                             r'<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*ep-related-link[^"]*"[^>]*>(.*?)</a>', doc, re.S)
        anchors = [(a or c, b or d) for a, b, c, d in anchors]
        hrefs = [h for h, _ in anchors]
    links = []
    for href, label in anchors:
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", label)).strip()
        nav = next((name for pre, name in NAV if href == pre or href.startswith(pre) and pre == "/pillar/"), None)
        links.append({"href": href, "label": text, "nav_capsule": nav})
    n = len(hrefs)
    return {"page": str(path), "section": kind, "count": n, "cap": CAP, "free": max(0, CAP - n),
            "status": None if kind is None else ("over_cap" if n > CAP else "at_cap" if n == CAP else "room"),
            "links": links}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("pages", nargs="+", help="page files (relative to the repository root or absolute)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    out, rc = [], 0
    for p in a.pages:
        path = Path(p) if Path(p).is_absolute() or Path(p).exists() else ROOT / p
        if not path.is_file():
            out.append({"page": p, "error": "not found"})
            rc = 2
            continue
        out.append(count(path))
    if a.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return rc
    for r in out:
        if "error" in r:
            print(f"{r['page']}: {r['error']}")
            continue
        if r["section"] is None:
            print(f"{r['page']}: no «کاوش بیشتر» section (Hard Rule 9 has nothing to count; 4.7 skips such a page)")
            continue
        nav = sum(1 for x in r["links"] if x["nav_capsule"])
        print(f"{r['page']}: {r['count']}/{CAP} ({nav} nav capsule(s) + {r['count'] - nav} content link(s)) — "
              f"free {r['free']} — {r['status']}")
        for x in r["links"]:
            print(f"   {'[nav] ' if x['nav_capsule'] else ''}{x['href']}  «{x['label']}»")
    return rc


if __name__ == "__main__":
    sys.exit(main())
