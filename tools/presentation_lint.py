#!/usr/bin/env python3
"""Mechanical lint for the presentation layer of a page (module 03 «Structure,
chips and callout boxes»). `presentation_diff.py` proves a change touched only
the layer; this checks the layer itself is well formed:

    python3 tools/presentation_lint.py sharehub/share-10.html [more pages…]
    python3 tools/presentation_lint.py --all            # every page that carries the layer

What it reports (one finding per line: page, code, detail):
  CHIP_UNKNOWN            a chip label outside the closed list, or in the wrong colour class
  BOX_COUNT               more than two callout boxes
  BOX_IN_LIST             a box is a direct child of <ul>/<ol> (it goes around the list or inside one <li>)
  BOX_EMPTY               a box that wraps none of the author's words
  LABEL_ECHOES_HEADING    a «نتیجه» / "Bottom line" label right under a heading that already says conclusion
  LABEL_DUPLICATES_AUTHOR a labelled box whose first paragraph opens with the author's own label
  LABEL_MISSING           a box with no label whose words carry no label of the author's either
  NUMBER_LONE             only one heading carries a section number
  NUMBER_ORDER            section numbers are not 1, 2, 3… in reading order
  NUMBER_LEVELS           section numbers sit on more than one heading level
  KEY_COUNT / KEY_PLACE   more than three key-sentence frames, or one inside a box or a heading
  MIRROR_PARITY           the page and its English mirror carry different counts of marked elements, boxes or frames
  MARKER_MALFORMED        verify_publish.presentation_problems()

Exit 0 clean, 3 findings, 2 usage. Standard library only."""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import queue_manifest as qm  # noqa: E402
import verify_publish as vp  # noqa: E402

ATTR = vp.PRESENTATION_ATTR
CONCLUSION = re.compile(r"جمع[‌ ]?بندی|نتیجه|خلاصه|حرف آخر|conclusion|summary|bottom line|take[- ]?(home|away)|in short", re.I)
BOTTOM_LABELS = {"نتیجه", "Bottom line"}
AUTHOR_LABEL = re.compile(r"^\W{0,3}([^.؟?!:：\n]{2,60})[:：]")
LABEL_WORD = re.compile(r"نکته|نتیجه|خلاصه|جمع[\u200c ]?بندی|پیام|هشدار|توصیه|راه[\u200c ]?حل|tip|note|takeaway|summary|message|"
                        r"warning|point|conclusion|solution|bottom line|in short|مرز|محدودیت|احتیاط|خوانش|درس|حرف آخر|limit|caveat|caution|reading|lesson|take[- ]?home|final word", re.I)


def author_label(body):
    """The author's own label at the head of a paragraph («Clinical Tip:», «نکتهٔ کلینیکی:»), or None."""
    m = AUTHOR_LABEL.match(body)
    return m.group(1).strip() if m and len(m.group(1).split()) <= 10 and LABEL_WORD.search(m.group(1)) else None
DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")
VOID = {"br", "img", "hr", "input", "meta", "link", "source", "wbr", "col", "area", "base", "embed", "track", "param"}
HEADINGS = {"h2", "h3", "h4", "h5", "h6"}


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, dict(attrs), parent, []

    def has(self, cls):
        return cls in (self.attrs.get("class") or "").split()

    @property
    def marked(self):
        return ATTR in self.attrs

    def text(self, skip_marked=False):
        out = []
        for k in self.kids:
            if isinstance(k, str):
                out.append(k)
            elif not (skip_marked and k.marked):
                out.append(k.text(skip_marked))
        return "".join(out)

    def walk(self):
        for k in self.kids:
            if isinstance(k, Node):
                yield k
                yield from k.walk()

    def elements(self):
        return [k for k in self.kids if isinstance(k, Node)]


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node("#root", [], None)

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.kids.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.kids.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not None and n.tag != tag:
            n = n.parent
        if n is not None and n.parent is not None:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.kids.append(data)


def squash(s):
    return re.sub(r"\s+", " ", s).strip()


def is_box(n):
    return n.tag == "div" and n.attrs.get("role") == "note" and (
        n.has("dc-box") or any(k.marked for k in n.elements()))


def facts(doc):
    """What the lint reads off one page: the parsed article region and its counts."""
    t = Tree()
    t.feed(vp.article_region(doc, presentation=True))
    nodes = list(t.root.walk())
    return {"tree": t.root, "nodes": nodes, "boxes": [n for n in nodes if is_box(n)],
            "keys": [n for n in nodes if n.tag == "span" and n.has("dc-key")],
            "marked": [n for n in nodes if n.marked]}


def prev_block(n):
    """The element just before `n` in reading order, skipping whitespace."""
    while n.parent is not None:
        sibs = n.parent.elements()
        i = sibs.index(n)
        if i:
            return sibs[i - 1]
        n = n.parent
    return None


def lint(doc, mirror_doc=None, source_doc=None):
    """`mirror_doc`: the page's English mirror (parity). `source_doc`: for an English mirror, the
    Persian page it mirrors — a box that takes no label there takes none here, whatever the
    translation did to the author's own label."""
    bare = [next((k for k in b.elements() if k.marked), None) is None for b in facts(source_doc)["boxes"]] if source_doc else []
    out = [("MARKER_MALFORMED", p) for p in vp.presentation_problems(doc)]
    f = facts(doc)
    for n in f["nodes"]:
        if n.tag == "span" and n.has("dc-chip"):
            label, kind = squash(n.text()), qm.chip_kind(squash(n.text()))
            if not n.marked or kind is None or not n.has({"ok": "dc-chip-ok", "caution": "dc-chip-caution", "no": "dc-chip-no"}.get(kind, "-")):
                out.append(("CHIP_UNKNOWN", f"«{label}»"))
    if len(f["boxes"]) > 2:
        out.append(("BOX_COUNT", f"{len(f['boxes'])} boxes; at most two"))
    for i, b in enumerate(f["boxes"]):
        label = next((k for k in b.elements() if k.marked), None)
        body = squash(b.text(skip_marked=True))
        head = f"«{body[:60]}»"
        if b.parent is not None and b.parent.tag in ("ul", "ol"):
            out.append(("BOX_IN_LIST", f"{head}: a box goes around the whole list or inside one <li>"))
        if not body:
            out.append(("BOX_EMPTY", "a box wraps none of the author's words"))
            continue
        above = prev_block(b)
        lead = next((squash(k.text()) for k in b.walk() if k.tag in ("strong", "b") and not k.marked
                     and not (k.parent is not None and k.parent.marked)), "")
        # the author's own label: «Clinical Tip: …», or a bold lead that names it («**نکته‌ی کلینیکی**»)
        owns_label = author_label(body) is not None or bool(
            lead and body.startswith(lead) and len(lead.split()) <= 6 and LABEL_WORD.search(lead))
        if label is not None:
            text = squash(label.text())
            if text in BOTTOM_LABELS and above is not None and above.tag in HEADINGS and CONCLUSION.search(above.text()):
                out.append(("LABEL_ECHOES_HEADING", f"«{text}» under «{squash(above.text())[:50]}»: box the practical point "
                            "instead, or drop the label"))
            if owns_label:
                out.append(("LABEL_DUPLICATES_AUTHOR", f"«{text}» on {head}: the author's own words already label it"))
        elif not owns_label and not (above is not None and above.tag in HEADINGS) and not (i < len(bare) and bare[i]):
            out.append(("LABEL_MISSING", f"{head}: a box takes no label only where the author's words already label it"))
    numbered = []
    for n in f["nodes"]:
        if n.tag in HEADINGS:
            if n.marked:
                m = re.match(r"\W*([0-9۰-۹]+)\s*[.)]", squash(n.text()))
            else:
                spans = [k for k in n.walk() if k.tag == "span" and k.marked]
                m = re.match(r"\s*([0-9۰-۹]+)\s*[.)]", spans[0].text()) if spans else None
            if m:
                numbered.append((n.tag, int(m.group(1).translate(DIGITS))))
    if len(numbered) == 1:
        out.append(("NUMBER_LONE", "one numbered heading: a single section takes no number"))
    elif numbered:
        if [x for _, x in numbered] != list(range(1, len(numbered) + 1)):
            out.append(("NUMBER_ORDER", f"section numbers read {[x for _, x in numbered]}"))
        marked_levels = {t for t, _ in numbered}
        if len(marked_levels) > 1:
            out.append(("NUMBER_LEVELS", f"numbers on {sorted(marked_levels)}: only the section level is numbered"))
    if len(f["keys"]) > 3:
        out.append(("KEY_COUNT", f"{len(f['keys'])} key-sentence frames; at most three"))
    for k in f["keys"]:
        p, where = k.parent, None
        while p is not None:
            if p.tag in HEADINGS:
                where = "a heading"
            elif is_box(p):
                where = "a box"
            p = p.parent
        if where or k.marked:
            out.append(("KEY_PLACE", f"«{squash(k.text())[:50]}» sits in {where or 'a marked element'}"))
    if mirror_doc is not None:
        g = facts(mirror_doc)
        a = (len(f["marked"]), len(f["boxes"]), len(f["keys"]))
        b = (len(g["marked"]), len(g["boxes"]), len(g["keys"]))
        if a != b:
            out.append(("MIRROR_PARITY", f"marked/boxes/frames here {a}, in the English mirror {b}"))
    return out


def mirror_of(path):
    p = Path(path)
    if p.parent.name == "en":
        return None
    m = p.parent / "en" / p.name
    return m if m.exists() else None


def layered_pages():
    out = []
    for p in sorted(ROOT.glob("*/*.html")) + sorted(ROOT.glob("*/en/*.html")):
        try:
            doc = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if "article-content-wrap" in doc and (ATTR in doc or 'class="dc-key"' in doc or 'class="dc-box' in doc):
            out.append(p)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("pages", nargs="*")
    ap.add_argument("--all", action="store_true", help="every page that carries the layer")
    a = ap.parse_args(argv)
    pages = layered_pages() if a.all else [Path(p) for p in a.pages]
    if not pages:
        ap.error("name a page or pass --all")
    findings = []
    for p in pages:
        p = p if p.is_absolute() else ROOT / p
        m = mirror_of(p)
        src = p.parent.parent / p.name if p.parent.name == "en" else None
        for code, detail in lint(p.read_text(encoding="utf-8"), m.read_text(encoding="utf-8") if m else None,
                                 src.read_text(encoding="utf-8") if src is not None and src.exists() else None):
            findings.append({"page": str(p.relative_to(ROOT)), "code": code, "detail": detail})
    print(json.dumps({"status": "clean" if not findings else "findings", "pages": len(pages),
                      "count": len(findings), "findings": findings}, ensure_ascii=False, indent=1))
    return 0 if not findings else 3


if __name__ == "__main__":
    sys.exit(main())
