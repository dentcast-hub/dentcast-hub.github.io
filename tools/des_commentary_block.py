#!/usr/bin/env python3
"""Build the DES Step 0 block of a page scored on its own text (COMMENTARY basket).

    python3 tools/des_commentary_block.py <content_id> [-o block.json]

A page with no cited source is scored on its own body (module 08 Part 1). The block is
built here, never by hand, so it always carries what the spec needs to place the page:
the text of record (without the presentation layer), the page's URL and its section
folder. The section matters: for `chairside/`, `metanotes/` and `insight/` checklist
item 4 can be earned from the section's own published declaration, which the spec
quotes in a closed table, and a block that does not say which section the page is in
silently loses those points (chairside-56 was scored 12 instead of 15 that way).
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import presentation_diff as pd  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def build(content_id):
    page = ROOT / (content_id + ".html")
    if not page.is_file():
        sys.exit(f"no page at {page.relative_to(ROOT)}")
    doc = page.read_text(encoding="utf-8")
    text = "\n".join(pd.text_of_record(doc))  # title line, then one block per line
    if not text.strip():
        sys.exit("the page has no text of record")
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    year = re.search(r'"datePublished":\s*"(\d{4})', doc)
    section = content_id.split("/")[0] + "/"
    return {"doi": "", "source_text": text, "text_basis": "FULL_TEXT",
            "metadata": {"title": re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else "",
                         "authors": "دکتر فواد شهابیان", "year": int(year.group(1)) if year else None,
                         "journal": "", "url": f"https://dentcast.org/{content_id}.html",
                         "section": section,
                         "section_landing_page": section + "index.html"}}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("content_id")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    block = json.dumps(build(a.content_id), ensure_ascii=False, indent=1)
    if a.out:
        Path(a.out).write_text(block, encoding="utf-8")
        print(json.dumps({"status": "built", "block": a.out, "section": a.content_id.split("/")[0] + "/"}))
    else:
        print(block)
    return 0


if __name__ == "__main__":
    sys.exit(main())
