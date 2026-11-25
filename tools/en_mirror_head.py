#!/usr/bin/env python3
"""Start an English mirror from the previous one, with every head value already swapped.

    python3 tools/en_mirror_head.py <content_id> --title "English title" --description "English description"
    python3 tools/en_mirror_head.py <content_id> --check

The mirror is cloned from the newest other English page of the same section (or
--template). The tool swaps, everywhere in the file, what a hand clone forgets: the
slug (canonical, og:url, JSON-LD ids, the «فارسی» toggle), the title (<title>, og, twitter,
JSON-LD name/headline, breadcrumb, <h1>), the description (meta, og, twitter, JSON-LD) and
the dates (taken from the Persian page). The body is still the template's: translate the
Persian page's body over it (same structure, nothing added or dropped).

--check fails while anything of the template is left: its slug, its title, its
description, or a body paragraph copied from it. Run it before C.6.
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_text_io as tio  # noqa: E402


def natural(p):
    return [int(x) if x.isdigit() else x for x in re.split(r"(\d+)", p.stem)]


def pick_template(en_dir, slug):
    others = sorted((p for p in en_dir.glob("*.html") if p.stem != slug and p.stem != "index"), key=natural)
    if not others:
        sys.exit(f"no other English page in {en_dir.relative_to(ROOT)} to clone; pass --template")
    family = re.sub(r"\d+$", "", slug)
    same = [p for p in others if re.sub(r"\d+$", "", p.stem) == family]
    return (same or others)[-1]


def facts(doc):
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', doc)
    return (html.unescape(re.sub(r"<[^>]+>", "", h1.group(1)).strip()) if h1 else "",
            html.unescape(desc.group(1)) if desc else "")


def paragraphs(doc):
    body = doc[doc.find("</h1>"):]
    return {re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m)).strip()
            for m in re.findall(r"<p\b[^>]*>(.*?)</p>", body, re.S)} - {""}


def swap(doc, old, new, what, minimum=1):
    variants = {old, html.escape(old, quote=True), html.escape(old, quote=False), json.dumps(old, ensure_ascii=False)[1:-1]}
    n = 0
    for v in sorted(variants, key=len, reverse=True):
        if not v or v not in doc:
            continue
        rep = (json.dumps(new, ensure_ascii=False)[1:-1] if v == json.dumps(old, ensure_ascii=False)[1:-1] and v != old
               else html.escape(new, quote=True) if v != old else new)
        n += doc.count(v)
        doc = doc.replace(v, rep)
    if n < minimum:
        sys.exit(f"the template's {what} was found {n} time(s); expected at least {minimum} — clone by hand and report this template")
    return doc


def numbers(tpl_stem, slug):
    a, b = re.search(r"(\d+)$", tpl_stem), re.search(r"(\d+)$", slug)
    return (a.group(1), b.group(1)) if a and b and a.group(1) != b.group(1) else (None, None)


LABEL = r"(\b[A-Z][A-Za-z]*\s#?)"


def template_marks(doc, tpl_stem, slug, section):
    """What a clone carries beside slug, title and description: the visible «Section N»
    label of the template and its own images."""
    old, _ = numbers(tpl_stem, slug)
    marks = []
    if old:
        labels = sorted(set(m.group(0) for m in re.finditer(LABEL + old + r"(?!\d)(?![-/.]\d)", doc)))
        if labels:
            marks.append("the template's number label (" + ", ".join(labels[:3]) + ")")
        imgs = sorted(set(re.findall(r'src="(/' + re.escape(section) + r'/[^"]*?' + old + r'[^"/]*\.(?:webp|jpg|png))"', doc)))
        if imgs:
            marks.append("the template's image(s) " + ", ".join(imgs[:3]))
    return marks


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("content_id")
    ap.add_argument("--title")
    ap.add_argument("--description")
    ap.add_argument("--template", help="an English page to clone instead of the newest sibling")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    section, slug = a.content_id.rsplit("/", 1)
    fa = ROOT / (a.content_id + ".html")
    en = ROOT / section / "en" / (slug + ".html")
    if not fa.is_file():
        sys.exit(f"no Persian page {a.content_id}.html")
    tpl = Path(a.template) if a.template else pick_template(en.parent, slug)
    tpl = tpl if tpl.is_absolute() else ROOT / tpl
    t_doc = tio.read_raw(str(tpl))
    t_title, t_desc = facts(t_doc)
    if a.check:
        if not en.is_file():
            sys.exit(f"FAIL  {en.relative_to(ROOT)} does not exist")
        doc = tio.read_raw(str(en))
        left = []
        if re.search(r"(?<![\w-])" + re.escape(tpl.stem) + r"(?!\d)", doc):
            left.append(f"the template's slug «{tpl.stem}»")
        if t_title and t_title in html.unescape(doc):
            left.append("the template's title")
        if t_desc and t_desc in html.unescape(doc):
            left.append("the template's description")
        left += template_marks(doc, tpl.stem, slug, section)
        same = paragraphs(doc) & {p for p in paragraphs(t_doc) if len(p) > 80}
        if same:
            left.append(f"{len(same)} body paragraph(s) of the template, e.g. «{sorted(same)[0][:60]}…»")
        fa_ps = len(re.findall(r"<p\b", fa.read_text(encoding="utf-8").split("</h1>", 1)[-1].split('class="dc-related-section"')[0]))
        if left:
            print("FAIL  " + en.relative_to(ROOT).as_posix() + " still carries " + "; ".join(left))
            return 1
        print(f"ok    {en.relative_to(ROOT)} carries nothing of its template ({tpl.name}); Persian page has {fa_ps} <p>, "
              f"mirror has {len(re.findall(r'<p' + chr(92) + 'b', doc.split('</h1>', 1)[-1]))}")
        return 0
    if not a.title or not a.description:
        sys.exit("--title and --description are required (the English title and description of THIS page)")
    if en.exists():
        sys.exit(f"{en.relative_to(ROOT)} already exists; a finished translation is never overwritten")
    doc = swap(t_doc, t_title, a.title, "title", 3)
    doc = swap(doc, t_desc, a.description, "description", 1)
    n = len(re.findall(r"(?<![\w-])" + re.escape(tpl.stem) + r"(?!\d)", doc))
    doc = re.sub(r"(?<![\w-])" + re.escape(tpl.stem) + r"(?!\d)", slug, doc)
    old_n, new_n = numbers(tpl.stem, slug)
    if old_n:
        # the visible «Chairside 55» / «Insight 120» label, wherever the template wrote it
        doc = re.sub(LABEL + old_n + r"(?!\d)(?![-/.]\d)", lambda m: m.group(1) + new_n, doc)
    fa_doc = fa.read_text(encoding="utf-8")
    for key in ("datePublished", "dateModified"):
        new = re.search(r'"' + key + r'":\s*"([^"]+)"', fa_doc)
        if new:
            doc = re.sub(r'("' + key + r'":\s*")[^"]+(")', lambda m: m.group(1) + new.group(1) + m.group(2), doc)
    pub = re.search(r'"datePublished":\s*"(\d{4}-\d{2}-\d{2})', fa_doc)
    if pub:
        doc = re.sub(r'(<time datetime=")\d{4}-\d{2}-\d{2}(">)\d{4}-\d{2}-\d{2}', lambda m: m.group(1) + pub.group(1) + m.group(2) + pub.group(1), doc)
    tio.write_raw(str(en), doc)
    start = doc[:doc.find("</h1>")].count("\n") + 1
    print(json.dumps({"status": "head_ready", "mirror": en.relative_to(ROOT).as_posix(), "cloned_from": tpl.relative_to(ROOT).as_posix(),
                      "slug_swaps": n, "body_starts_after_line": start,
                      "next": "replace the template's body (everything after the <h1>, up to the footer) with the translation of "
                              "the Persian body, keep the «فارسی» toggle, then run this tool with --check"},
                     ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
