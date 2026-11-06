#!/usr/bin/env python3
"""Assemble a publish-queue item into a publication, mechanically, or refuse.

    python3 tools/queue_apply.py <queue-item-folder> <content_id>
        [--supplement f.json] [--date YYYY-MM-DD] [--agent NAME] [--dry-run]
        [--receipt out.json]

queue-maintainer.md «روز انتشار صف»: everything that needs judgment was decided
and approved in preparation and frozen in the item. This tool only assembles:
it never calls a model, never asks, never infers a missing fact. Every refusal
exits non-zero with nothing written and names the missing field.

Steps (all or nothing — the writes happen only after every input is checked):
  1. precheck: SHA256SUMS, status «آماده», no foreign lock, no active handoff,
     content_id = next free id of the category on this checkout, DES package;
  2. manifest: tools/queue_manifest.py (12-انتشار.json, or the legacy patterns
     plus a supplement whose every value carries its origin);
  3. page: clone of the latest same-category page, regions replaced, body =
     01-متن.md rendered deterministically, approved 4.8 links, credit; a
     clone-residue check; then `queue_install_des.py --check-text`;
  4. English mirror from 06, landing-page row, brain entry, FAQ/flashcards,
     exam rows, catalog, Pulse, 4.7 back-links within the cap, pathway,
     frozen DES/Fidelity (queue_install_des.py), hashtag sync/check;
  5. a JSON receipt: every file written (sha256 before/after), every mechanical
     default, every skipped link with its reason, every supplemented field.

Builders (C.8), stamp (C.7), Phase F stay with post-cut2-mechanical.yml.

Preparation draft (never a publish):

    python3 <throwaway>/tools/queue_apply.py <item> <content_id> --draft --throwaway

builds only the Persian page (and its images) and the item's DES record
(05-DES-Fidelity/des.json sources, no Fidelity; its markers/plan when present)
in a THROWAWAY checkout, so tools/des_fidelity_units.py can split the page that
publish day will build. Status «آماده», SHA256SUMS and the next free
content_id are not required (a temporary id of the category's pattern is). It
refuses unless the tool itself runs from a throwaway copy: `--throwaway`
given, a `.dentcast-throwaway` marker at the copy's root, no `.git` there (a
copy that cannot commit or push) and no publication handoff. queue_fidelity_prep.py
makes such a copy.
"""
import argparse
import contextlib
import datetime
import hashlib
import html
import io
import json
import re
import shutil
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import dentcast_text_io as tio  # noqa: E402
import queue_manifest as qm  # noqa: E402
from queue_manifest import QueueRefusal  # noqa: E402

HANDOFF = ".dentcast/PUBLISH-HANDOFF.md"
SITE = "https://dentcast.org"
EXPLORE_CAP = 5
PULSE_LINES = 7

# Per-category facts. Only categories with a verified golden replay are enabled.
CATEGORIES = {
    "sharehub": {
        "dir": "sharehub", "stem": "share-", "brain_type": "sharehub", "brain_id": "{n}",
        "title_suffix": " | Share Hub – دنت‌کست", "title_suffix_en": " | Share Hub – DentCast",
        "image": "share{n}-fig{k}.webp", "body_open": '<div class="sh-dialogue">',
        "landing": "sharehub/index.html", "landing_mode": "top", "style": "compact",
    },
    "insight": {
        "dir": "insight", "stem": "insight-", "brain_type": "clinical", "brain_id": "clinical-{n}",
        "image": "insight{n}-{k}.webp", "body_open": None,
        "landing": "insight/index.html", "landing_mode": "top", "style": "insight",
    },
    "chairside": {
        "dir": "chairside", "stem": "chairside-", "brain_type": "chairside", "brain_id": "chairside-{n}",
        "image": "cs{n}-{k}.webp", "body_open": None,
        "landing": "chairside/index.html", "landing_mode": "top", "style": "chairside",
    },
    "notecast": {
        "dir": "notecast", "stem": "episode-", "brain_type": "notecast", "brain_id": "{n}",
        "image": "notecast{n}-{k}.webp", "body_open": None,
        "landing": "notecast/index.html", "landing_mode": "bottom-ordinal", "style": "indented",
        "label_fa": "نوت‌کست", "label_en": "NoteCast", "parent": "episodes/episode-{n}",
    },
    "metanote": {
        "dir": "metanotes", "stem": "meta-", "brain_type": "meta", "brain_id": "meta-{n}",
        "image": "meta-{n}.webp", "body_open": None,
        "landing": "metanotes/index.html", "landing_mode": "bottom-cardinal", "style": "metanote",
        "label_fa": "متانوت", "label_en": "MetaNote",
    },
}

FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
UNITS = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"]
TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"]
TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"]


def fa_digits(n):
    return str(n).translate(FA_DIGITS)


def fa_ordinal(n):
    """Persian ordinal as the landing rows write it (چهل‌وچهارم, سی‌ام, چهلم)."""
    if not 1 <= n <= 99:
        refuse("ORDINAL_RANGE", f"no ordinal rule for {n}")
    special = {1: "یکم", 2: "دوم", 3: "سوم", 30: "سی‌ام"}
    if n in special:
        return special[n]
    if n < 10:
        return UNITS[n] + "م"
    if n < 20:
        return TEENS[n - 10] + "م"
    t, u = divmod(n, 10)
    if u == 0:
        return TENS[t] + "م"
    unit = {1: "یکم", 2: "دوم", 3: "سوم"}.get(u, UNITS[u] + "م")
    return TENS[t] + "\u200cو" + unit


def fa_cardinal(n):
    """Persian cardinal as the MetaNote landing rows write it (نوزده, بیست, بیست‌ودو)."""
    if not 1 <= n <= 99:
        refuse("CARDINAL_RANGE", f"no cardinal rule for {n}")
    if n < 10:
        return UNITS[n]
    if n < 20:
        return TEENS[n - 10]
    t, u = divmod(n, 10)
    return TENS[t] + ("\u200cو" + UNITS[u] if u else "")


def refuse(code, message, **detail):
    raise QueueRefusal(code, message, **detail)


def sha(text_or_bytes):
    b = text_or_bytes.encode("utf-8") if isinstance(text_or_bytes, str) else text_or_bytes
    return hashlib.sha256(b).hexdigest()


def esc(t):
    return html.escape(t, quote=False)


def attr(t):
    return html.escape(t, quote=True)


# ------------------------------------------------------------------ the writes

class Writes:
    """All output is staged in memory, checked, then written at once."""

    def __init__(self):
        self.files = {}   # rel -> new bytes
        self.notes = []

    def text(self, rel):
        if rel in self.files:
            return self.files[rel].decode("utf-8")
        p = ROOT / rel
        return p.read_bytes().decode("utf-8") if p.exists() else None

    def put(self, rel, data):
        self.files[rel] = data.encode("utf-8") if isinstance(data, str) else data

    def receipt(self):
        out = []
        for rel, data in sorted(self.files.items()):
            p = ROOT / rel
            old = p.read_bytes() if p.exists() else None
            out.append({"path": rel, "before": sha(old) if old is not None else None, "after": sha(data),
                        "only_additions": additions_only(old, data)})
        return out

    def commit(self):
        self.backup = {rel: ((ROOT / rel).read_bytes() if (ROOT / rel).exists() else None) for rel in self.files}
        for rel, data in self.files.items():
            p = ROOT / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)


def rollback(backup, extra=()):
    """Undo every write of this run: staged files and the repository tools'
    outputs (`extra`: paths whose pre-run bytes were captured)."""
    for rel, data in list(backup.items()):
        p = ROOT / rel
        if data is None:
            if p.exists():
                p.unlink()
        else:
            p.write_bytes(data)


TOOL_OUTPUTS = ("plus/des-scores.json", "dentcast-brain.json", ".dentcast/queue-frozen-des.json", ".dentcast/des-source-markers.json",
                "plus/pathways.json", "dentcast-hashtag-reference.json", "plus/assistant-tags.json",
                "plus/content-index.json", "plus/cabinet-papers.json")


def additions_only(old, new):
    if old is None:
        return True
    a, b = old.decode("utf-8", "replace").splitlines(True), new.decode("utf-8", "replace").splitlines(True)
    import difflib
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    return all(tag in ("equal", "insert") for tag, *_ in sm.get_opcodes())


# ------------------------------------------------------------------ precheck

def next_number(cat):
    c = CATEGORIES[cat]
    nums = [int(m.group(1)) for p in (ROOT / c["dir"]).glob(c["stem"] + "*.html")
            if (m := re.fullmatch(re.escape(c["stem"]) + r"(\d+)\.html", p.name))]
    return max(nums) + 1, max(nums)


def precheck(args):
    if (ROOT / HANDOFF).exists() and not args.allow_handoff:
        # Only this run's own queue-lane ledger may be active (init precedes step 0).
        import dentcast_publish_handoff as h
        import dentcast_publish_lifecycle as lc
        try:
            pub = h.load_state(ROOT)[0]["publication"]
        except Exception:
            pub = None
        if not (pub and lc.queue_lane(pub) and pub["content_id"] == args.content_id):
            refuse("ACTIVE_HANDOFF", f"{HANDOFF} exists and is not this content_id's queue-lane ledger — another "
                   "publication may be in flight; nothing is written")
    info = qm.load_item(args.item, agent=args.agent)
    d = qm.draft(info["path"])
    if args.supplement:
        d = qm.merge_supplement(info["path"], d, json.loads(Path(args.supplement).read_text(encoding="utf-8")))
    miss = qm.missing(d)
    if miss:
        refuse("MANIFEST_INCOMPLETE", "the item lacks: " + ", ".join(miss) +
               " — supply each (origin required) with --supplement; nothing is inferred", missing=miss)
    m = qm.plain(d)
    cat = m["category"]
    if cat not in CATEGORIES:
        refuse("CATEGORY_UNSUPPORTED", f"category «{cat}» has no verified queue template yet; publish it on the "
               "interactive route")
    c = CATEGORIES[cat]
    n, prev = next_number(cat)
    want = f"{c['dir']}/{c['stem']}{n}"
    if c.get("parent"):
        # the same-number episode (queue-maintainer.md «DES و Fidelity صف»): fixed by the number, never chosen
        m["parent_episode"] = c["parent"].format(n=n)
        if not (ROOT / f"{m['parent_episode']}.html").exists():
            refuse("PARENT_MISSING", f"{m['parent_episode']}.html does not exist")
    if args.content_id != want:
        refuse("CONTENT_ID_NOT_NEXT", f"next free {cat} id on this checkout is {want}, not {args.content_id}")
    body0 = blocks(split_tail((info["path"] / "01-متن.md").read_text(encoding="utf-8"))[0])
    kinds = [b[0] for b in body0]
    if "ul" in kinds and ("p" not in kinds or kinds.index("p") > kinds.index("ul")):
        refuse("LEAD_PARAGRAPH_MISSING", "01-متن.md opens with a list before any paragraph: the opening paragraph "
               "(module 03 «Opening paragraph before any list») belongs to preparation; the item goes back to "
               "«در حال آماده‌سازی» (Phase F would fail this page)")
    if not (info["path"] / "05-DES-Fidelity" / "des.json").exists():
        refuse("DES_PACKAGE_MISSING", "05-DES-Fidelity/des.json is missing (queue-maintainer.md «روز انتشار صف»: one of the three stops)")
    return info, d, m, n, prev


# ------------------------------------------------------------------ body render

INLINE_BOLD = re.compile(r"\*\*(.+?)\*\*")
INLINE_ITAL = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)")
MD_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


split_tail = qm.split_sources_tail


TABLE_SEP = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")
IMAGE_MARKER = re.compile(r"\s*\[\[(?:تصویر|Image):(\d\d)\]\]\s*")
ITALIC_LINE = re.compile(r"\s*\*(?!\*)(.+?)(?<!\*)\*\s*")


def table_cells(line):
    t = line.strip()
    t = t[1:] if t.startswith("|") else t
    t = t[:-1] if t.endswith("|") else t
    return [c.strip() for c in t.split("|")]


def is_table_run(lines, k):
    """Line k is a table row: it holds a «|» and so does a neighbouring line
    (a frozen text writes its tables with or without outer pipes and with or
    without a `|---|` row)."""
    has = lambda i: 0 <= i < len(lines) and "|" in lines[i] and lines[i].strip() and not IMAGE_MARKER.fullmatch(lines[i])
    return has(k) and (has(k - 1) or has(k + 1))


def blocks(md):
    """Markdown subset → blocks: ('h', level, text) ('p', text) ('ul', [items])
    ('note', [paras]) ('img', NN, caption|None) ('table', [rows]) ('hr',).
    An italic-only line right after an image marker is that image's caption as
    the text writes it (it replaces the 03 caption on the page)."""
    out, para, items, note, rows = [], [], [], [], []

    def flush():
        nonlocal para, items, note, rows
        if para:
            out.append(("p", " ".join(x.strip() for x in para)))
        if items:
            out.append(("ul", items))
        if note:
            out.append(("note", note))
        if rows:
            out.append(("table", rows))
        para, items, note, rows = [], [], [], []

    lines = md.split("\n")
    skip = set()
    for k, line in enumerate(lines):
        if k in skip:
            continue
        s = line.rstrip()
        if not s.strip():
            flush()
            continue
        if m := IMAGE_MARKER.fullmatch(s):
            flush()
            cap = None
            j = k + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and (c := ITALIC_LINE.fullmatch(lines[j])):
                cap = c.group(1).strip()
                skip.add(j)
            out.append(("img", m.group(1), cap))
        elif is_table_run(lines, k):
            if para or items or note:
                flush()
            if not TABLE_SEP.fullmatch(s):
                rows.append(table_cells(s))
        elif (m := re.fullmatch(r"\*\*([^*]+)\*\*", s.strip())) and nxt_is_text(lines, k):
            flush()
            out.append(("h", 4, m.group(1).strip()))
        elif m := re.fullmatch(r"(#{2,4})\s+(.+)", s):
            flush()
            out.append(("h", len(m.group(1)), m.group(2).strip()))
        elif re.fullmatch(r"\s*(-{3,}|\*{3,}|_{3,})\s*", s):
            flush()
            out.append(("hr",))
        elif m := re.fullmatch(r"\s*[-*]\s+(.+)", s):
            if para or note or rows:
                flush()
            items.append(m.group(1).strip())
        elif m := re.fullmatch(r"\s*>\s?(.*)", s):
            if para or items or rows:
                flush()
            note.append(m.group(1).strip())
        else:
            if items or note or rows:
                flush()
            para.append(s)
    flush()
    return out


def render_table(rows):
    """The site's table markup (sharehub/share-32): first row is the header."""
    head = "".join(f"<th>{inline(c)}</th>" for c in rows[0])
    body = "\n".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows[1:])
    return f"<table>\n<thead><tr>{head}</tr></thead>\n<tbody>\n{body}\n</tbody>\n</table>"


def figure_caption(b, img, lang):
    """The caption shown under a figure: the text's own italic line when it has
    one, else the frozen 03/06 caption."""
    if len(b) > 2 and b[2] is not None:
        return b[2]
    return img["caption_fa" if lang == "fa" else "caption_en"]


def nxt_is_text(lines, k):
    """A whole-line **bold** is a heading only when text follows on the very
    next line (05-style «**بخش**» + paragraph); standing alone it is a bold
    paragraph."""
    return k + 1 < len(lines) and lines[k + 1].strip() != "" and not lines[k + 1].lstrip().startswith(("[[", "#"))


class Linker:
    """Approved 4.8 links: the exact phrase, its first occurrence in reading
    order, never in a heading or a caption, each phrase once."""

    def __init__(self, links):
        self.pending = list(links)
        self.done, self.skipped = [], []

    def apply(self, raw_text):
        """raw_text is markdown inline text; returns html."""
        segs = []  # (start, end, href)
        for ln in list(self.pending):
            k = raw_text.find(ln["phrase"])
            if k < 0:
                continue
            e = k + len(ln["phrase"])
            if any(not (e <= s or k >= t) for s, t, _ in segs) or inside_markup(raw_text, k, e):
                continue
            segs.append((k, e, ln["href"]))
            self.pending.remove(ln)
            self.done.append(ln)
        segs.sort()
        out, pos = [], 0
        for s, e, href in segs:
            out.append(inline(raw_text[pos:s]))
            out.append(f'<a href="{attr(href)}">{inline(raw_text[s:e])}</a>')
            pos = e
        out.append(inline(raw_text[pos:]))
        return "".join(out)


def inside_markup(t, k, e):
    for m in MD_LINK.finditer(t):
        if m.start() < e and k < m.end():
            return True
    for m in INLINE_BOLD.finditer(t):
        if (m.start() < k < m.start() + 2) or (m.end() - 2 < e < m.end()):
            return True
    return False


def inline(t):
    t = esc(t)
    t = MD_LINK.sub(lambda m: f'<a href="{m.group(2)}" target="_blank" rel="noopener noreferrer">{m.group(1)}</a>'
                    if m.group(2).startswith("http") else f'<a href="{m.group(2)}">{m.group(1)}</a>', t)
    t = INLINE_BOLD.sub(r"<strong>\1</strong>", t)
    t = INLINE_ITAL.sub(r"<em>\1</em>", t)
    return t


NOTE_OPEN = ('<div role="note" style="background:var(--chip-bg);border:1px solid var(--chip-bd);'
             'border-right:4px solid var(--chip-bd);border-radius:var(--r-lg,1.125rem);padding:1rem 1.25rem;'
             'margin:1.25rem 0;">')


def webp_size(data):
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        refuse("IMAGE_NOT_WEBP", "queue images must be WebP")
    kind = data[12:16]
    if kind == b"VP8X":
        w = 1 + int.from_bytes(data[24:27], "little")
        h = 1 + int.from_bytes(data[27:30], "little")
    elif kind == b"VP8 ":
        w, h = struct.unpack("<HH", data[26:30])
        w, h = w & 0x3FFF, h & 0x3FFF
    elif kind == b"VP8L":
        b = int.from_bytes(data[21:25], "little")
        w, h = (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1
    else:
        refuse("IMAGE_NOT_WEBP", f"unknown WebP chunk {kind!r}")
    return w, h


def render_body(md, images, img_url, linker, lang="fa", style="compact", link_class=None):
    if style == "indented":
        return render_indented(md, linker, link_class)
    out = []
    for b in blocks(md):
        if b[0] == "h":
            out.append(f"<h{b[1]}>{inline(b[2])}</h{b[1]}>")
        elif b[0] == "p":
            out.append(f"<p>{linker.apply(b[1]) if linker else inline(b[1])}</p>")
        elif b[0] == "ul":
            lis = "".join(f"<li>{linker.apply(i) if linker else inline(i)}</li>" for i in b[1])
            out.append(f"<ul>{lis}</ul>")
        elif b[0] == "note":
            paras = [p for p in " \n".join(b[1]).split(" \n \n")]
            inner = "".join(f'<p style="margin:0;">{linker.apply(p) if linker else inline(p)}</p>' for p in paras)
            out.append(NOTE_OPEN + inner + "</div>")
        elif b[0] == "img":
            img = images.get(b[1])
            if img is None:
                refuse("IMAGE_MARKER_UNKNOWN", f"[[تصویر:{b[1]}]] has no image in 03-تصاویر")
            alt = img["alt_fa" if lang == "fa" else "alt_en"]
            cap = figure_caption(b, img, lang)
            fig = (f'<figure><img src="{img_url(b[1])}" alt="{attr(alt)}" width="{img["w"]}" height="{img["h"]}" '
                   f'loading="lazy" decoding="async">')
            fig += f"<figcaption>{inline(cap)}</figcaption></figure>" if cap else "</figure>"
            out.append(fig)
        elif b[0] == "hr":
            out.append('<hr class="text-divider">')
        elif b[0] == "table":
            out.append(render_table(b[1]))
    return "\n".join(out)


def render_indented(md, linker, link_class):
    """NoteCast markup: 4-space blocks, <p> text on its own 8-space line,
    blank line between blocks, glossary links carry class="glossary-link"."""
    def txt(t):
        h = linker.apply(t) if linker else inline(t)
        if link_class:
            h = re.sub(r'<a href="(/[^"]+)">', r'<a href="\1" class="%s">' % link_class, h)
        return h
    out = []
    for b in blocks(md):
        if b[0] == "h":
            out.append(f"    <h{b[1]}>{inline(b[2])}</h{b[1]}>")
            continue
        if b[0] == "p":
            block = f"    <p>\n        {txt(b[1])}\n    </p>"
        elif b[0] == "ul":
            block = "    <ul>\n" + "\n".join(f"      <li>{txt(i)}</li>" for i in b[1]) + "\n    </ul>"
        else:
            refuse("NOTECAST_BLOCK", f"block «{b[0]}» has no NoteCast markup precedent")
        if out and out[-1].startswith("    <h"):
            out[-1] += "\n" + block
        else:
            out.append(block)
    return "\n\n".join(out)


# ------------------------------------------------------------------ the page

def template_facts(cat, prev_n):
    c = CATEGORIES[cat]
    cid = f"{c['dir']}/{c['stem']}{prev_n}"
    doc = (ROOT / f"{cid}.html").read_bytes().decode("utf-8")
    brain = json.loads((ROOT / "dentcast-brain.json").read_text(encoding="utf-8"))
    entry = next((e for e in brain if e.get("type") == c["brain_type"] and str(e.get("id")) == c["brain_id"].format(n=prev_n)), None)
    if entry is None:
        refuse("TEMPLATE_NOT_IN_BRAIN", f"template {cid} has no brain entry")
    return cid, doc, entry


def swap_region(doc, start_pat, end_pat, new, what):
    m = re.search(start_pat, doc, re.S)
    if not m:
        refuse("TEMPLATE_REGION", f"template region «{what}» start not found")
    e = re.search(end_pat, doc[m.end():], re.S)
    if not e:
        refuse("TEMPLATE_REGION", f"template region «{what}» end not found")
    return doc[:m.end()] + new + doc[m.end() + e.start():]


def json_ld_keywords(doc, words, nl):
    m = re.search(r'("keywords": \[)(.*?)(\n\s*\])', doc.replace("\r\n", "\n"), re.S)
    if not m:
        refuse("TEMPLATE_REGION", "JSON-LD keywords not found")
    # operate on the original newline style
    pat = re.compile(r'("keywords": \[)(.*?)(' + re.escape(nl) + r'(\s*)\])', re.S)
    mm = pat.search(doc)
    ind = re.search(r'(' + re.escape(nl) + r'\s*)"', mm.group(2)).group(1)
    body = ",".join(ind + json.dumps(w, ensure_ascii=False) for w in words)
    return doc[:mm.start()] + mm.group(1) + body + mm.group(3) + doc[mm.end():]


def build_page(cat, n, prev_n, m, date, item, lang="fa"):
    c = CATEGORIES[cat]
    cid = f"{c['dir']}/{c['stem']}{n}"
    tcid, tdoc, tentry = template_facts(cat, prev_n)
    if lang == "en":
        tdoc = (ROOT / f"{c['dir']}/en/{c['stem']}{prev_n}.html").read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in tdoc else "\n"
    doc = tdoc.replace("\r\n", "\n")
    t_h1 = re.search(r"<h1>(.*?)</h1>", doc, re.S).group(1)
    t_desc = re.search(r'<meta name="description" content="([^"]*)"', doc).group(1)
    title = m["title_fa"] if lang == "fa" else m["title_en"]
    caption = m["caption_fa"] if lang == "fa" else m["caption_en"]
    old_title, old_desc = html.unescape(t_h1), html.unescape(t_desc)
    # 1. identity strings
    old_path = f"{c['dir']}/{'en/' if lang == 'en' else ''}{c['stem']}{prev_n}.html"
    new_path = f"{c['dir']}/{'en/' if lang == 'en' else ''}{c['stem']}{n}.html"
    doc = doc.replace(old_path, new_path)
    doc = doc.replace(f'href="en/{c["stem"]}{prev_n}.html"', f'href="en/{c["stem"]}{n}.html"')
    doc = doc.replace(f'href="../{c["stem"]}{prev_n}.html"', f'href="../{c["stem"]}{n}.html"')
    for old, new in ((old_title, title), (old_desc, caption)):
        doc = doc.replace(attr(old), attr(new)).replace(json.dumps(old, ensure_ascii=False)[1:-1],
                                                      json.dumps(new, ensure_ascii=False)[1:-1])
        doc = doc.replace(old, new)
    # 2. subtitle (queue pages carry none: 02 «زیرعنوان: ندارد»)
    if re.search(r'\n<p class="sh-subtitle">.*?</p>\n', doc):
        doc = re.sub(r'\n<p class="sh-subtitle">.*?</p>\n\n?', "\n", doc, count=1)
        doc = re.sub(r'\n[ \t]*\.sh-subtitle \{[^}]*\}', "", doc, count=1)
    # 3. dates
    doc = re.sub(r'("datePublished": ")\d{4}-\d\d-\d\d(")', r"\g<1>" + date + r"\2", doc)
    doc = re.sub(r'("dateModified": ")\d{4}-\d\d-\d\d(")', r"\g<1>" + date + r"\2", doc)
    # 4. keywords
    kw = m["keywords"] if lang == "fa" else (m.get("keywords_en") or [title])
    doc = json_ld_keywords(doc, kw, "\n")
    # 5. body
    imgs = {}
    for img in m["images"]:
        data = (item / img["file"]).read_bytes()
        w, h = webp_size(data)
        imgs[img["n"]] = {**img, "w": w, "h": h}
    img_url = lambda k: f"/{c['dir']}/" + c["image"].format(n=n, k=int(k))
    src = Path(item / "01-متن.md").read_text(encoding="utf-8") if lang == "fa" else m["body_en"]
    body_md, tail = split_tail(src)
    linker = qm_linker = Linker(m["links_48"]) if lang == "fa" else None
    body = render_body(body_md, imgs, img_url, linker, lang)
    credit = m["credit"]
    if credit["mode"] == "references":
        head = "∆ منابع" if lang == "fa" else "∆ References"
        lis = "\n".join(f'  <li><a href="{attr(i["href"])}" target="_blank" rel="noopener noreferrer">'
                        f'{esc(i["label_fa" if lang == "fa" else "label_en"])}</a></li>' for i in credit["items"])
        body += f'\n<h3>{head}</h3>\n<ul class="sh-refs">\n{lis}\n</ul>'
    # the template's body ends at its paper-credit block, or — when the template
    # page itself credited a «منابع» list and so carries no such block
    # (sharehub/share-42, share-45) — at the founder's author-note
    doc = swap_region(doc, re.escape(c["body_open"]) + r"\n", r"\n</div>\n<div class=\"author(?:-note)?\">", body, "body")
    # 6. credit block
    if credit["mode"] == "author-doi":
        label = credit["label_fa" if lang == "fa" else "label_en"]
        if '<div class="author">' not in doc:
            word = "نویسنده:" if lang == "fa" else "Author:"
            doc, k = re.subn(r'\n<div class="author-note">',
                             lambda mm: f'\n<div class="author">\n{word}\n<a href="#" target="_blank" rel="noopener noreferrer">x</a></div>' + mm.group(0),
                             doc, count=1)
            if not k:
                refuse("TEMPLATE_REGION", "no paper-credit block and no author-note to place it before")
        doc = re.sub(r'(<div class="author">\n[^\n<]*\n)<a href="[^"]*"( target="_blank" rel="noopener noreferrer">)[^<]*(</a></div>)',
                     lambda mm: mm.group(1) + f'<a href="{attr(credit["href"])}"' + mm.group(2) + esc(label) + mm.group(3),
                     doc, count=1)
    else:
        doc = re.sub(r'<div class="author">\n.*?</div>\n', "", doc, count=1, flags=re.S)
    # 7. «کاوش بیشتر» (fa only)
    explore = []
    if lang == "fa" and '<div class="dc-related-capsules">' in doc:
        caps = [("/glossary/", "دانشنامه"), (f"/pillar/{m['pillar']['primary']}/", "فهرست موضوعی")]
        explore = [(x["href"], x["label"]) for x in m["explore_49"] if (ROOT / x["href"].lstrip("/")).is_file()][:EXPLORE_CAP - len(caps)]
        rows = "\n".join(f'<a href="{attr(h)}" class="dc-related-capsule">{esc(t)}</a>' for h, t in caps + explore)
        doc = swap_region(doc, r'<div class="dc-related-capsules">\n', r"\n?</div>\n</div>", rows, "related")
    # 8. residue check
    residue = [x for x in (old_title, old_desc, f"{c['stem']}{prev_n}.html", c["image"].format(n=prev_n, k=1),
                           tentry.get("title"), tentry.get("caption")) if x and x in doc]
    for k in tentry.get("keywords") or []:
        if json.dumps(k, ensure_ascii=False) in doc and k not in kw and lang == "fa":
            residue.append(k)
    if residue:
        refuse("TEMPLATE_RESIDUE", f"clone residue of {tcid} left in the page: {residue[:5]}")
    if lang == "fa" and linker.pending:
        pend = [x["phrase"] for x in linker.pending]
    else:
        pend = []
    out = doc.replace("\n", nl)
    files = {f"{c['dir']}/" + c["image"].format(n=n, k=int(k)): (item / v["file"]).read_bytes() for k, v in imgs.items()}
    return out, files, {"links_done": [x["phrase"] for x in (linker.done if linker else [])],
                        "links_not_found": pend, "explore": explore, "tail_removed": tail}


def parent_audio(n):
    """The NoteCast audio is the same-number episode's audio_url (dentcast.json),
    and the episode page must carry the same URL; anything else refuses."""
    eps = json.loads((ROOT / "dentcast.json").read_text(encoding="utf-8"))
    e = next((x for x in eps if str(x.get("episode")) == str(n)), None)
    url = (e or {}).get("audio_url")
    page = (ROOT / f"episodes/episode-{n}.html")
    if not url or not page.exists() or url not in page.read_bytes().decode("utf-8"):
        refuse("PARENT_AUDIO", f"episodes/episode-{n}: no audio_url in dentcast.json matching the episode page")
    return url


def build_notecast_page(n, prev, m, date, item, lang="fa"):
    c = CATEGORIES["notecast"]
    sub = "en/" if lang == "en" else ""
    tdoc = (ROOT / f"notecast/{sub}episode-{prev}.html").read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in tdoc else "\n"
    doc = tdoc.replace("\r\n", "\n")
    _, _, tentry = template_facts("notecast", prev)
    old_title = html.unescape(re.search(r"<h1>(.*?)</h1>", doc, re.S).group(1))
    old_desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', doc).group(1))
    title = m["title_fa"] if lang == "fa" else m["title_en"]
    caption = m["caption_fa"] if lang == "fa" else m["caption_en"]
    for a_, b_ in ((f"notecast/episode-{prev}.html", f"notecast/episode-{n}.html"),
                   (f"notecast/en/episode-{prev}.html", f"notecast/en/episode-{n}.html"),
                   (f'href="en/episode-{prev}.html"', f'href="en/episode-{n}.html"'),
                   (f'href="../episode-{prev}.html"', f'href="../episode-{n}.html"'),
                   (f"episodes/episode-{prev}.html", f"episodes/episode-{n}.html"),
                   (f"{c['label_fa']} {fa_digits(prev)}", f"{c['label_fa']} {fa_digits(n)}"),
                   (f"{c['label_fa']} {fa_ordinal(prev)}", f"{c['label_fa']} {fa_ordinal(n)}"),
                   (f"{c['label_en']} {prev} ", f"{c['label_en']} {n} ")):
        doc = doc.replace(a_, b_)
    for old, new in ((old_title, title), (old_desc, caption)):
        doc = doc.replace(attr(old), attr(new)).replace(json.dumps(old, ensure_ascii=False)[1:-1],
                                                      json.dumps(new, ensure_ascii=False)[1:-1]).replace(old, new)
    for k in ("datePublished", "dateModified", "lastReviewed"):
        doc = re.sub(r'("%s": ")\d{4}-\d\d-\d\d(")' % k, r"\g<1>" + date + r"\2", doc)
    doc = re.sub(r'<time datetime="\d{4}-\d\d-\d\d">\d{4}-\d\d-\d\d</time>', f'<time datetime="{date}">{date}</time>', doc)
    if re.search(r'"keywords": \[', doc):
        doc = json_ld_keywords(doc, m["keywords"] if lang == "fa" else (m.get("keywords_en") or [title]), "\n")
    audio = parent_audio(n)
    doc, k = re.subn(r'(<source src=")[^"]*(" type="audio/mpeg">)', lambda mm: mm.group(1) + audio + mm.group(2), doc)
    if k != 1:
        refuse("TEMPLATE_REGION", "NoteCast template: exactly one <source> audio expected")
    src = (item / "01-متن.md").read_text(encoding="utf-8") if lang == "fa" else m["body_en"]
    body_md, tail = split_tail(src)
    linker = Linker(m["links_48"]) if lang == "fa" else None
    body = render_body(body_md, {}, None, linker, lang, "indented", "glossary-link")
    doc = swap_region(doc, r'<a class="lang-btn"[^>]*>\n.*?\n  </a>\n\n', r'\n\n(  <!--[^\n]*-->\n)?  <p class="dc-disclaimer">',
                      body, "body")
    credit = m["credit"]
    if credit["mode"] != "author-doi":
        refuse("NOTECAST_CREDIT", "a NoteCast credits one paper (author-doi)")
    label = credit["label_fa" if lang == "fa" else "label_en"]
    doc, k = re.subn(r'(<div class="author">\n[^\n<]*\n  )<a href="[^"]*"( target="_blank" rel="noopener noreferrer">)[^<]*(</a>)',
                     lambda mm: mm.group(1) + f'<a href="{attr(credit["href"])}"' + mm.group(2) + esc(label) + mm.group(3), doc)
    if k != 1:
        refuse("TEMPLATE_REGION", "NoteCast template: credit block not found")
    explore = []
    if lang == "fa":
        audio_cap = re.search(r'<a href="/episodes/episode-%d\.html" class="dc-related-capsule">([^<]*)</a>' % n, doc)
        if not audio_cap:
            refuse("TEMPLATE_REGION", "NoteCast template: audio-version capsule not found")
        caps = [("/glossary/", "دانشنامه"), (f"/pillar/{m['pillar']['primary']}/", "فهرست موضوعی"),
                (f"/episodes/episode-{n}.html", html.unescape(audio_cap.group(1)))]
        explore = [(x["href"], x["label"]) for x in m["explore_49"] if (ROOT / x["href"].lstrip("/")).is_file()][:EXPLORE_CAP - len(caps)]
        rows = "\n".join(f'    <a href="{attr(h)}" class="dc-related-capsule">{esc(t)}</a>' for h, t in caps + explore)
        doc = swap_region(doc, r'<div class="dc-related-capsules">\n', r"\n  </div>\n</div>", rows, "related")
    residue = [x for x in (old_title, old_desc, f"episode-{prev}.html", tentry.get("title"), tentry.get("caption"),
                           f"{c['label_fa']} {fa_ordinal(prev)}", f"{c['label_fa']} {fa_digits(prev)}")
               if x and x in doc]
    residue += re.findall(r"%s %d\b" % (c["label_en"], prev), doc)
    if re.search(r"(?<![\d۰-۹])(%d|%s)(?![\d۰-۹])" % (prev, fa_digits(prev)), re.sub(r"<svg.*?</svg>|<style.*?</style>", "", doc, flags=re.S)):
        stray = sorted(set(re.findall(r".{0,25}(?<![\d۰-۹])(?:%d|%s)(?![\d۰-۹]).{0,10}" % (prev, fa_digits(prev)),
                                      re.sub(r"<svg.*?</svg>|<style.*?</style>", "", doc, flags=re.S))))
        residue += [x for x in stray if "episode" in x or c["label_fa"] in x or c["label_en"] in x]
    if residue:
        refuse("TEMPLATE_RESIDUE", f"clone residue of notecast/episode-{prev} left: {residue[:5]}")
    pend = [x["phrase"] for x in linker.pending] if linker else []
    return doc.replace("\n", nl), {}, {"links_done": [x["phrase"] for x in (linker.done if linker else [])],
                                       "links_not_found": pend, "explore": explore, "tail_removed": tail}


INSIGHT_FIGURE = ('<figure style="margin:1.25rem auto;text-align:center;max-width:768px"><img src="{src}" alt="{alt}" '
                  'width="{w}" height="{h}" loading="lazy" decoding="async" '
                  'style="display:block;width:100%;height:auto;border-radius:14px">{cap}</figure>')
INSIGHT_CAP = '<figcaption style="font-size:.85rem;opacity:.8;margin-top:.5rem">{}</figcaption>'


def render_insight(md, imgs, img_url, linker, lang):
    out = []
    for b in blocks(md):
        txt = (lambda t: linker.apply(t) if linker else inline(t))
        if b[0] == "p":
            out.append(f"<p>{txt(b[1])}</p>")
        elif b[0] == "h":
            out.append(f"<h{max(b[1], 3)}>{inline(b[2])}</h{max(b[1], 3)}>")
        elif b[0] == "ul":
            out.append("<ul>" + "".join(f"<li>{txt(i)}</li>" for i in b[1]) + "</ul>")
        elif b[0] == "note":
            out.append(NOTE_OPEN + "".join(f'<p style="margin:0;">{txt(x)}</p>' for x in b[1]) + "</div>")
        elif b[0] == "img":
            img = imgs.get(b[1])
            if img is None:
                refuse("IMAGE_MARKER_UNKNOWN", f"[[تصویر:{b[1]}]] has no image in 03-تصاویر")
            cap = figure_caption(b, img, lang)
            out.append(INSIGHT_FIGURE.format(src=img_url(b[1]), alt=attr(img["alt_fa" if lang == "fa" else "alt_en"]),
                                             w=img["w"], h=img["h"], cap=INSIGHT_CAP.format(esc(cap)) if cap else ""))
        elif b[0] == "table":
            out.append(render_table(b[1]))
        else:
            refuse("INSIGHT_BLOCK", f"block «{b[0]}» has no Insight markup precedent")
    return "\n\n".join(out)


def article_section(pillar):
    """Insight JSON-LD articleSection: the value most used by existing Insight
    pages of the same pillar (a site fact, not a judgment)."""
    from collections import Counter
    brain = json.loads((ROOT / "dentcast-brain.json").read_text(encoding="utf-8"))
    seen = Counter()
    for e in brain:
        if e.get("type") == "clinical" and (e.get("pillar") or {}).get("primary") == pillar:
            p = ROOT / (e.get("page_url") or "").lstrip("/")
            if p.is_file():
                m_ = re.search(r'"articleSection": "([^"]+)"', p.read_text(encoding="utf-8"))
                if m_:
                    seen[m_.group(1)] += 1
    if not seen:
        refuse("ARTICLE_SECTION", f"no Insight page of pillar {pillar} carries an articleSection to follow")
    return seen.most_common(1)[0][0]


def build_insight_page(n, prev, m, date, item, lang="fa"):
    c = CATEGORIES["insight"]
    sub = "en/" if lang == "en" else ""
    tdoc = (ROOT / f"insight/{sub}insight-{prev}.html").read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in tdoc else "\n"
    doc = tdoc.replace("\r\n", "\n")
    _, _, tentry = template_facts("insight", prev)
    if m["credit"]["mode"] != "none":
        refuse("INSIGHT_CREDIT", "an Insight queue item with a paper credit has no page precedent; use the interactive route")
    old_title = html.unescape(re.search(r'"headline": "([^"]*)"', doc).group(1))
    old_desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', doc).group(1))
    old_topic = re.search(r'"healthCondition": \{[^}]*"name": "([^"]*)"', doc, re.S).group(1)
    old_kw = re.search(r'"keywords": "([^"]*)"', doc).group(1)
    old_sec = re.search(r'"articleSection": "([^"]*)"', doc).group(1)
    title = m["title_fa"] if lang == "fa" else m["title_en"]
    caption = m["caption_fa"] if lang == "fa" else m["caption_en"]
    for a_, b_ in ((f"insight/insight-{prev}.html", f"insight/insight-{n}.html"),
                   (f"insight/en/insight-{prev}.html", f"insight/en/insight-{n}.html"),
                   (f'href="en/insight-{prev}.html"', f'href="en/insight-{n}.html"'),
                   (f'href="../insight-{prev}.html"', f'href="../insight-{n}.html"'),
                   (f"Insight {prev} ", f"Insight {n} ")):
        doc = doc.replace(a_, b_)
    for old, new in ((old_title, title), (old_desc, caption)):
        doc = doc.replace(attr(old), attr(new)).replace(json.dumps(old, ensure_ascii=False)[1:-1],
                                                      json.dumps(new, ensure_ascii=False)[1:-1]).replace(old, new)
    kw = m["keywords"] if lang == "fa" else (m.get("keywords_en") or [title])
    doc = doc.replace(f'"keywords": "{old_kw}"', '"keywords": ' + json.dumps(", ".join(kw), ensure_ascii=False))
    doc = doc.replace(f'"articleSection": "{old_sec}"', '"articleSection": ' + json.dumps(
        m.get("article_section") or article_section(m["pillar"]["primary"]), ensure_ascii=False))
    doc = re.sub(r'("healthCondition": \{[^}]*"name": )"[^"]*"', lambda mm: mm.group(1) + json.dumps(
        m.get("topic_en") or m["title_en"], ensure_ascii=False), doc, flags=re.S)
    for k in ("datePublished", "dateModified", "lastReviewed"):
        doc = re.sub(r'("%s": ")\d{4}-\d\d-\d\d(")' % k, r"\g<1>" + date + r"\2", doc)
    doc = re.sub(r'<time datetime="\d{4}-\d\d-\d\d">\d{4}-\d\d-\d\d</time>', f'<time datetime="{date}">{date}</time>', doc)
    imgs = {}
    for img in m["images"]:
        w_, h_ = webp_size((item / img["file"]).read_bytes())
        imgs[img["n"]] = {**img, "w": w_, "h": h_}
    img_url = lambda k: "/insight/" + c["image"].format(n=n, k=int(k))
    src = (item / "01-متن.md").read_text(encoding="utf-8") if lang == "fa" else m["body_en"]
    body_md, tail = split_tail(src)
    linker = Linker(m["links_48"]) if lang == "fa" else None
    body = render_insight(body_md, imgs, img_url, linker, lang)
    doc = swap_region(doc, r'<a class="lang-btn".*?</a>\n\n', r'\n\n(<!--[^\n]*-->\n\n)?<p class="dc-disclaimer">',
                      body, "body")
    explore = []
    if lang == "fa":
        caps = [("/glossary/", "دانشنامه"), (f"/pillar/{m['pillar']['primary']}/", "فهرست موضوعی")]
        explore = [(x["href"], x["label"]) for x in m["explore_49"] if (ROOT / x["href"].lstrip("/")).is_file()][:EXPLORE_CAP - len(caps)]
        rows = "\n".join(f'    <a href="{attr(h)}" class="dc-related-capsule">{esc(t)}</a>' for h, t in caps + explore)
        doc = swap_region(doc, r'<div class="dc-related-capsules">\n', r"\n  </div>\n</div>", rows, "related")
    residue = [x for x in (old_title, old_desc, old_topic, old_kw, f"insight-{prev}.html", f"insight{prev}-",
                           tentry.get("title"), tentry.get("caption")) if x and x in doc]
    residue += re.findall(r"Insight %d\b|اینسایت %s(?![۰-۹])" % (prev, fa_digits(prev)), doc)
    if residue:
        refuse("TEMPLATE_RESIDUE", f"clone residue of insight/insight-{prev} left: {residue[:5]}")
    files = {"insight/" + c["image"].format(n=n, k=int(k)): (item / v["file"]).read_bytes() for k, v in imgs.items()}
    pend = [x["phrase"] for x in linker.pending] if linker else []
    return doc.replace("\n", nl), files, {"links_done": [x["phrase"] for x in (linker.done if linker else [])],
                                          "links_not_found": pend, "explore": explore, "tail_removed": tail}


CHAIRSIDE_FIGURE = ('<figure>\n  <img loading="lazy" src="{src}" alt="{alt}" style="max-width:100%; border-radius:0.75rem;" '
                    'width="{w}" height="{h}">{cap}\n</figure>')
CHAIRSIDE_CAP = ('\n  <figcaption style="text-align:center; font-size:.85rem; color:var(--muted,#555); '
                 'margin-top:0.5rem;">{}</figcaption>')


def render_chairside(md, imgs, img_url, linker, lang):
    out = []
    txt = (lambda t: linker.apply(t) if linker else inline(t))
    for b in blocks(md):
        if b[0] == "p":
            out.append(f"<p>{txt(b[1])}</p>")
        elif b[0] == "h":
            out.append(f"<h{b[1]}>{inline(b[2])}</h{b[1]}>")
        elif b[0] == "ul":
            out.append("<ul>\n" + "\n".join(f"  <li>{txt(i)}</li>" for i in b[1]) + "\n</ul>")
        elif b[0] == "note":
            out.append(NOTE_OPEN + "".join(f'<p style="margin:0;">{txt(x)}</p>' for x in b[1]) + "</div>")
        elif b[0] == "img":
            img = imgs.get(b[1])
            if img is None:
                refuse("IMAGE_MARKER_UNKNOWN", f"[[تصویر:{b[1]}]] has no image in 03-تصاویر")
            cap = figure_caption(b, img, lang)
            out.append(CHAIRSIDE_FIGURE.format(src=img_url(b[1]), alt=attr(img["alt_fa" if lang == "fa" else "alt_en"]),
                                               w=img["w"], h=img["h"], cap=CHAIRSIDE_CAP.format(esc(cap)) if cap else ""))
        elif b[0] == "table":
            out.append(render_table(b[1]))
        else:
            refuse("CHAIRSIDE_BLOCK", f"block «{b[0]}» has no Chairside markup precedent")
    return "\n\n".join(out)


def build_chairside_page(n, prev, m, date, item, lang="fa"):
    c = CATEGORIES["chairside"]
    sub = "en/" if lang == "en" else ""
    tdoc = (ROOT / f"chairside/{sub}chairside-{prev}.html").read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in tdoc else "\n"
    doc = tdoc.replace("\r\n", "\n")
    _, _, tentry = template_facts("chairside", prev)
    if m["credit"]["mode"] != "none":
        refuse("CHAIRSIDE_CREDIT", "a Chairside queue item with a paper credit has no page precedent; use the interactive route")
    old_title = html.unescape(re.search(r'"headline": "([^"]*)"', doc).group(1))
    old_desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', doc).group(1))
    title = m["title_fa"] if lang == "fa" else m["title_en"]
    caption = m["caption_fa"] if lang == "fa" else m["caption_en"]
    for a_, b_ in ((f"chairside/chairside-{prev}.html", f"chairside/chairside-{n}.html"),
                   (f"chairside/en/chairside-{prev}.html", f"chairside/en/chairside-{n}.html"),
                   (f'href="en/chairside-{prev}.html"', f'href="en/chairside-{n}.html"'),
                   (f'href="../chairside-{prev}.html"', f'href="../chairside-{n}.html"'),
                   (f"Chairside {prev}<", f"Chairside {n}<"), (f"Chairside {prev} ", f"Chairside {n} ")):
        doc = doc.replace(a_, b_)
    for old, new in ((old_title, title), (old_desc, caption)):
        doc = doc.replace(attr(old), attr(new)).replace(json.dumps(old, ensure_ascii=False)[1:-1],
                                                      json.dumps(new, ensure_ascii=False)[1:-1]).replace(old, new)
    kw = ", ".join(m["keywords"] if lang == "fa" else (m.get("keywords_en") or [title]))
    doc = re.sub(r'(<meta name="keywords" content=")[^"]*(")', lambda mm: mm.group(1) + attr(kw) + mm.group(2), doc)
    doc = re.sub(r'("keywords": )"[^"]*"', lambda mm: mm.group(1) + json.dumps(kw, ensure_ascii=False), doc)
    for k in ("datePublished", "dateModified", "lastReviewed"):
        doc = re.sub(r'("%s": ")\d{4}-\d\d-\d\d(")' % k, r"\g<1>" + date + r"\2", doc)
    doc = re.sub(r'<time datetime="\d{4}-\d\d-\d\d">\d{4}-\d\d-\d\d</time>', f'<time datetime="{date}">{date}</time>', doc)
    imgs = {}
    for img in m["images"]:
        w_, h_ = webp_size((item / img["file"]).read_bytes())
        imgs[img["n"]] = {**img, "w": w_, "h": h_}
    img_url = lambda k: "/chairside/" + c["image"].format(n=n, k=int(k))
    # social image: the first figure, else the site cover
    if imgs:
        first = sorted(imgs)[0]
        og, ow, oh = SITE + img_url(first), imgs[first]["w"], imgs[first]["h"]
    else:
        og, ow, oh = SITE + "/dentcast-cover.webp", 1200, 630
    doc = re.sub(r'(<meta property="og:image" content=")[^"]*(")', lambda mm: mm.group(1) + og + mm.group(2), doc)
    doc = re.sub(r'(<meta name="twitter:image" content=")[^"]*(")', lambda mm: mm.group(1) + og + mm.group(2), doc)
    doc = re.sub(r'(<meta property="og:image:width" content=")\d+(")', r"\g<1>%d\2" % ow, doc)
    doc = re.sub(r'(<meta property="og:image:height" content=")\d+(")', r"\g<1>%d\2" % oh, doc)
    doc = re.sub(r'("image": \[\n\s*)"[^"]*"', lambda mm: mm.group(1) + json.dumps(og), doc)
    src = (item / "01-متن.md").read_text(encoding="utf-8") if lang == "fa" else m["body_en"]
    body_md, tail = split_tail(src)
    linker = Linker(m["links_48"]) if lang == "fa" else None
    body = render_chairside(body_md, imgs, img_url, linker, lang)
    doc = swap_region(doc, r'<a class="lang-btn".*?\n  </a>\n\n', r'\n\n  <p class="dc-disclaimer">', body, "body")
    explore = []
    if lang == "fa":
        caps = [("/glossary/", "دانشنامه"), (f"/pillar/{m['pillar']['primary']}/", "فهرست موضوعی")]
        explore = [(x["href"], x["label"]) for x in m["explore_49"] if (ROOT / x["href"].lstrip("/")).is_file()][:EXPLORE_CAP - len(caps)]
        rows = "\n".join(f'    <a href="{attr(h)}" class="dc-related-capsule">{esc(t)}</a>' for h, t in caps + explore)
        doc = swap_region(doc, r'<div class="dc-related-capsules">\n', r"\n  </div>\n</div>", rows, "related")
    residue = [x for x in (old_title, old_desc, f"chairside-{prev}.html", f"chairside{prev}.webp", f"cs{prev}-",
                           tentry.get("title"), tentry.get("caption")) if x and x in doc]
    residue += re.findall(r"Chairside %d\b" % prev, doc)
    if residue:
        refuse("TEMPLATE_RESIDUE", f"clone residue of chairside/chairside-{prev} left: {residue[:5]}")
    files = {"chairside/" + c["image"].format(n=n, k=int(k)): (item / v["file"]).read_bytes() for k, v in imgs.items()}
    pend = [x["phrase"] for x in linker.pending] if linker else []
    return doc.replace("\n", nl), files, {"links_done": [x["phrase"] for x in (linker.done if linker else [])],
                                          "links_not_found": pend, "explore": explore, "tail_removed": tail}


METANOTE_FIGURE = ('<figure>\n  <img loading="lazy" src="{src}" alt="{alt}" style="max-width:100%; border-radius:0.75rem;" '
                   'width="{w}" height="{h}">{cap}\n</figure>')
METANOTE_CAP = ('\n  <figcaption style="text-align:center; font-size:.85rem; color:#555; margin-top:0.5rem;">{}</figcaption>')
METANOTE_SERIES_KW = ("MetaNote", "دکتر فواد شهابیان")


def render_metanote(md, imgs, img_url, linker, lang):
    """MetaNote markup (metanotes/meta-20..22): <p> text on its own line,
    <hr> for a `---` divider, a `>` line is the closing <blockquote>."""
    out = []
    txt = (lambda t: linker.apply(t) if linker else inline(t))
    for b in blocks(md):
        if b[0] == "p":
            out.append(f"<p>\n{txt(b[1])}\n</p>")
        elif b[0] == "h":
            out.append(f"<h{b[1]}>{inline(b[2])}</h{b[1]}>")
        elif b[0] == "hr":
            out.append("<hr>")
        elif b[0] == "note":
            out.append("<blockquote>\n" + "\n".join(txt(x) for x in b[1] if x) + "\n</blockquote>")
        elif b[0] == "ul":
            out.append("<ul>\n" + "\n".join(f"  <li>{txt(i)}</li>" for i in b[1]) + "\n</ul>")
        elif b[0] == "img":
            img = imgs.get(b[1])
            if img is None:
                refuse("IMAGE_MARKER_UNKNOWN", f"[[تصویر:{b[1]}]] has no image in 03-تصاویر")
            cap = figure_caption(b, img, lang)
            out.append(METANOTE_FIGURE.format(src=img_url(b[1]), alt=attr(img["alt_fa" if lang == "fa" else "alt_en"]),
                                              w=img["w"], h=img["h"], cap=METANOTE_CAP.format(esc(cap)) if cap else ""))
        elif b[0] == "table":
            out.append(render_table(b[1]))
        else:
            refuse("METANOTE_BLOCK", f"block «{b[0]}» has no MetaNote markup precedent")
    return "\n\n".join(out)


def build_metanote_page(n, prev, m, date, item, lang="fa"):
    """metanotes/meta-<n>.html (and en/) cloned from meta-<prev>: identity
    strings, headline / alternativeHeadline / description, Persian page
    keywords + the series suffix, dates, articleSection, body, «کاوش بیشتر»."""
    c = CATEGORIES["metanote"]
    sub = "en/" if lang == "en" else ""
    tdoc = (ROOT / f"metanotes/{sub}meta-{prev}.html").read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in tdoc else "\n"
    doc = tdoc.replace("\r\n", "\n")
    _, _, tentry = template_facts("metanote", prev)
    if m["credit"]["mode"] != "none":
        refuse("METANOTE_CREDIT", "a MetaNote queue item with a paper credit has no page precedent; use the interactive route")
    for k in ("alt_headline_fa", "alt_headline_en", "article_section", "keywords_fa", "keywords_en"):
        if not m.get(k):
            refuse("MANIFEST_INCOMPLETE", f"a MetaNote needs the frozen field «{k}»", missing=[k])
    imgs = {}
    for img in m["images"]:
        w_, h_ = webp_size((item / img["file"]).read_bytes())
        imgs[img["n"]] = {**img, "w": w_, "h": h_}
    if len(imgs) > 1:
        refuse("METANOTE_IMAGES", "MetaNote pages carry one figure (metanotes/meta-<n>.webp); more has no precedent")
    old_title = html.unescape(re.search(r'"headline": "([^"]*)"', doc).group(1))
    old_alt = re.search(r'"alternativeHeadline": "([^"]*)"', doc).group(1)
    old_desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', doc).group(1))
    title = m["title_fa"] if lang == "fa" else m["title_en"]
    caption = m["caption_fa"] if lang == "fa" else m["caption_en"]
    alt_head = m["alt_headline_fa"] if lang == "fa" else m["alt_headline_en"]
    for a_, b_ in ((f"metanotes/meta-{prev}.html", f"metanotes/meta-{n}.html"),
                   (f"metanotes/en/meta-{prev}.html", f"metanotes/en/meta-{n}.html"),
                   (f'href="en/meta-{prev}.html"', f'href="en/meta-{n}.html"'),
                   (f'href="../meta-{prev}.html"', f'href="../meta-{n}.html"'),
                   (f"MetaNote {prev} ", f"MetaNote {n} "), (f"MetaNote {prev}<", f"MetaNote {n}<")):
        doc = doc.replace(a_, b_)
    doc = doc.replace(f'"alternativeHeadline": "{old_alt}"', '"alternativeHeadline": ' + json.dumps(alt_head, ensure_ascii=False))
    for old, new in ((old_title, title), (old_desc, caption)):
        doc = doc.replace(attr(old), attr(new)).replace(json.dumps(old, ensure_ascii=False)[1:-1],
                                                      json.dumps(new, ensure_ascii=False)[1:-1]).replace(old, new)
    if lang == "fa":
        old_kw = re.search(r'"keywords": "([^"]*)"', doc).group(1)
        tail = []
        for k in reversed(old_kw.split(", ")):
            if k not in METANOTE_SERIES_KW:
                break
            tail.insert(0, k)
        doc = doc.replace(f'"keywords": "{old_kw}"', '"keywords": ' + json.dumps(", ".join(list(m["keywords_fa"]) + tail),
                                                                                 ensure_ascii=False))
        old_sec = re.search(r'"articleSection": "([^"]*)"', doc).group(1)
        doc = doc.replace(f'"articleSection": "{old_sec}"', '"articleSection": ' + json.dumps(m["article_section"], ensure_ascii=False))
        for k in ("datePublished", "dateModified", "lastReviewed"):
            doc = re.sub(r'("%s": ")\d{4}-\d\d-\d\d(")' % k, r"\g<1>" + date + r"\2", doc)
        doc = re.sub(r'<time datetime="\d{4}-\d\d-\d\d">\d{4}-\d\d-\d\d</time>', f'<time datetime="{date}">{date}</time>', doc)
    else:
        doc = json_ld_keywords(doc, m["keywords_en"], "\n")
        for k in ("datePublished", "dateModified"):
            doc = re.sub(r'("%s": ")\d{4}-\d\d-\d\d(T)' % k, r"\g<1>" + date + r"\2", doc)
    img_url = lambda k: "/metanotes/" + c["image"].format(n=n)
    default_img = SITE + ("/dentcast-cover.webp" if lang == "fa" else "/logo-v2.png")
    doc, k = re.subn(r'("image": )"[^"]*"(,\n\s*"datePublished")',
                     lambda mm: mm.group(1) + json.dumps(SITE + img_url("01") if imgs else default_img) + mm.group(2), doc)
    if k != 1:
        refuse("TEMPLATE_REGION", "MetaNote template: the article «image» before datePublished not found")
    src = (item / "01-متن.md").read_text(encoding="utf-8") if lang == "fa" else m["body_en"]
    body_md, tail_src = split_tail(src)
    linker = Linker(m["links_48"]) if lang == "fa" else None
    body = render_metanote(body_md, imgs, img_url, linker, lang)
    doc = swap_region(doc, r'<a class="lang-btn".*?\n  </a>\n\n', r'\n  <p class="dc-disclaimer">', body, "body")
    explore = []
    if lang == "fa":
        caps = [("/glossary/", "دانشنامه"), (f"/pillar/{m['pillar']['primary']}/", "فهرست موضوعی")]
        explore = [(x["href"], x["label"]) for x in m["explore_49"] if (ROOT / x["href"].lstrip("/")).is_file()][:EXPLORE_CAP - len(caps)]
        rows = "\n".join(f'    <a href="{attr(h)}" class="dc-related-capsule">{esc(t)}</a>' for h, t in caps + explore)
        doc = swap_region(doc, r'<div class="dc-related-capsules">\n', r"\n  </div>\n</div>", rows, "related")
    residue = [x for x in (old_title, old_desc, old_alt, f"meta-{prev}.html", f"meta-{prev}.webp",
                           tentry.get("title"), tentry.get("caption")) if x and x in doc]
    residue += re.findall(r"MetaNote %d\b" % prev, doc)
    if residue:
        refuse("TEMPLATE_RESIDUE", f"clone residue of metanotes/meta-{prev} left: {residue[:5]}")
    files = {"metanotes/" + c["image"].format(n=n): (item / v["file"]).read_bytes() for v in imgs.values()}
    pend = [x["phrase"] for x in linker.pending] if linker else []
    return doc.replace("\n", nl), files, {"links_done": [x["phrase"] for x in (linker.done if linker else [])],
                                          "links_not_found": pend, "explore": explore, "tail_removed": tail_src}


def metanote_itemlist(w, n, prev_n, title):
    """metanotes/index.html also lists every MetaNote in its ItemList JSON-LD:
    one ListItem after the last, cloned from it."""
    c = CATEGORIES["metanote"]
    rel = c["landing"]
    doc = w.text(rel)
    mm = re.search(r'(\{(\r?\n)([ \t]*)"@type": "ListItem",\r?\n[ \t]*"position": %d,\r?\n[ \t]*"name": "[^"]*",\r?\n'
                   r'[ \t]*"url": "https://dentcast\.org/metanotes/meta-%d\.html"\r?\n[ \t]*\})' % (prev_n, prev_n), doc)
    if not mm:
        refuse("LANDING_ROW", f"{rel}: ItemList entry for meta-{prev_n} not found")
    blk = mm.group(1)
    name = json.dumps(f"{c['label_fa']} {fa_cardinal(n)}: {title}", ensure_ascii=False)
    new = re.sub(r'"position": %d,' % prev_n, f'"position": {n},', blk)
    new = re.sub(r'"name": "[^"]*",', lambda _: f'"name": {name},', new)
    new = new.replace(f"meta-{prev_n}.html", f"meta-{n}.html")
    k = mm.end()
    lead = re.search(r"(\r?\n[ \t]*)\{$", doc[:mm.start() + 1])
    indent = lead.group(1) if lead else mm.group(2) + " " * 10
    w.put(rel, doc[:k] + "," + indent + new + doc[k:])


def parent_episode(w, n, m, prev):
    """The same-number episode gets the NoteCast link in «محتوای مرتبط» and the
    paper credit, cloned from the previous NoteCast's parent episode."""
    rel = f"episodes/episode-{n}.html"
    doc = w.text(rel)
    tpl = (ROOT / f"episodes/episode-{prev}.html").read_bytes().decode("utf-8").replace("\r\n", "\n")
    nl = "\r\n" if "\r\n" in doc else "\n"
    d = doc.replace("\r\n", "\n")
    css = re.search(r"\n(\.author\{[^\n]*\})\n", tpl)
    blk = re.search(r"\n(    <div class=\"author\">\n      [^\n]*\n      <a href=\"[^\"]*\"[^>]*>[^<]*</a>\n    </div>\n\n\n)", tpl)
    lnk = re.search(r'\n(      <a href="/notecast/episode-%d\.html" class="ep-related-link">[^<]*</a>)\n' % prev, tpl)
    if not (css and blk and lnk):
        refuse("PARENT_TEMPLATE", f"episodes/episode-{prev}.html lacks the NoteCast credit/link pattern")
    if 'class="author"' in d or f"/notecast/episode-{n}.html" in d:
        refuse("PARENT_ALREADY", f"{rel} already carries a credit or NoteCast link")
    credit = m["credit"]
    block = re.sub(r'<a href="[^"]*"([^>]*)>[^<]*</a>', lambda mm: f'<a href="{attr(credit["href"])}"{mm.group(1)}>{esc(credit["label_fa"])}</a>',
                   blk.group(1))
    i = d.index("@media(max-width:480px)")
    d = d[:i] + css.group(1) + "\n" + d[i:]
    sec = re.search(r'\n    <div class="ep-section">\n      <h2 class="ep-section-label">محتوای مرتبط</h2>\n((?:      <a [^\n]*\n)+)', d)
    if not sec:
        refuse("PARENT_TEMPLATE", f"{rel}: «محتوای مرتبط» section not found")
    link = lnk.group(1).replace(f"/notecast/episode-{prev}.html", f"/notecast/episode-{n}.html")
    d = d[:sec.end()] + link + "\n" + d[sec.end():]
    d = d[:sec.start() + 1] + block + d[sec.start() + 1:]
    w.put(rel, d.replace("\n", nl))


# ------------------------------------------------------------------ other files

def landing_row(w, cat, n, prev_n, title, prev_title):
    c = CATEGORIES[cat]
    rel = c["landing"]
    doc = w.text(rel)
    if c["landing_mode"] == "bottom-ordinal":
        mm = re.search(r'(\r?\n)([ \t]*)<li><a href="%s">%s %s ([—–]) ([^<]*)</a></li>'
                       % (re.escape(f"{c['stem']}{prev_n}.html"), c["label_fa"], fa_ordinal(prev_n)), doc)
        if not mm or html.unescape(mm.group(4)) != prev_title:
            refuse("LANDING_ROW", f"{rel}: last row for {c['stem']}{prev_n} not found in the ordinal form")
        row = f'{mm.group(1)}{mm.group(2)}<li><a href="{c["stem"]}{n}.html">{c["label_fa"]} {fa_ordinal(n)} {mm.group(3)} {esc(title)}</a></li>'
        w.put(rel, doc[:mm.end()] + row + doc[mm.end():])
        return
    if c["landing_mode"] == "bottom-cardinal":
        mm = re.search(r'(\r?\n)([ \t]*)<li><a href="%s">%s %s: ([^<]*)</a></li>'
                       % (re.escape(f"{c['stem']}{prev_n}.html"), c["label_fa"], fa_cardinal(prev_n)), doc)
        if not mm or html.unescape(mm.group(3)) != prev_title:
            refuse("LANDING_ROW", f"{rel}: last row for {c['stem']}{prev_n} not found in the cardinal form")
        row = f'{mm.group(1)}{mm.group(2)}<li><a href="{c["stem"]}{n}.html">{c["label_fa"]} {fa_cardinal(n)}: {esc(title)}</a></li>'
        w.put(rel, doc[:mm.end()] + row + doc[mm.end():])
        metanote_itemlist(w, n, prev_n, title)
        return
    pat = re.compile(r'(\n([ \t]*)<li><a href="' + re.escape(f"{c['stem']}{prev_n}.html") + r'">)([^<]*)(</a></li>)')
    mm = pat.search(doc)
    if not mm or prev_title not in mm.group(3):
        refuse("LANDING_ROW", f"{rel}: top row for {c['stem']}{prev_n} not found with its exact title")
    label = mm.group(3).replace(prev_title, title, 1)
    nl = "\r\n" if doc[mm.start() - 1:mm.start() + 1] == "\r\n" else "\n"
    row = mm.group(1).replace(f"{c['stem']}{prev_n}.html", f"{c['stem']}{n}.html") + label + mm.group(4)
    row = row.replace("\n", nl) if nl == "\r\n" and "\r\n" not in row else row
    new = doc[:mm.start()] + row + doc[mm.start():]
    w.put(rel, new)


def pulse(w, cat, cid, m):
    rel = "index.html"
    doc = w.text(rel)
    url = f"/{cid}.html"
    if m["pulse"].get("html"):
        line = m["pulse"]["html"].replace("{url}", url)
    else:
        phrase = m["pulse"]["link_phrase"]
        text = m["pulse"].get("text") or phrase
        if phrase not in text:
            refuse("PULSE_PHRASE", "pulse link phrase is not in the pulse text")
        line = esc(text).replace(esc(phrase), f'<a href="{attr(url)}">{esc(phrase)}</a>', 1)
    mm = re.search(r'(<ul class="dc-pulse-list">)(\r?\n)(.*?)(</ul>)', doc, re.S)
    if not mm:
        refuse("PULSE_LIST", "index.html: dc-pulse-list not found")
    nl = mm.group(2)
    lis = list(re.finditer(r"[ \t]*<li>.*?</li>" + re.escape(nl), mm.group(3)))
    if len(lis) != PULSE_LINES:
        refuse("PULSE_COUNT", f"index.html pulse has {len(lis)} lines, expected {PULSE_LINES}")
    ind = re.match(r"[ \t]*", lis[0].group(0)).group(0)
    body = mm.group(3)
    last = lis[-1]
    body = body[:last.start()] + body[last.end():]
    body = f"{ind}<li>{line}</li>{nl}" + body
    new = doc[:mm.start(3)] + body + doc[mm.end(3):]
    w.put(rel, new)
    return {"added": line, "dropped": last.group(0).strip()}


def brain_entry(w, cat, n, m, template_entry):
    c = CATEGORIES[cat]
    vals = {"type": c["brain_type"], "id": c["brain_id"].format(n=n), "title": m["title_fa"],
            "caption": m["caption_fa"], "author": (m.get("author") or {}).get("name"),
            "source": (m.get("author") or {}).get("source"), "hashtags": m["hashtags"],
            "keywords": m["keywords"], "url": f"/{c['dir']}/{c['stem']}{n}.html",
            "page_url": f"/{c['dir']}/{c['stem']}{n}.html",
            "pillar": {"primary": m["pillar"]["primary"], "secondary": m["pillar"].get("secondary") or [],
                       "subtopic": m["pillar"].get("subtopic")}}
    entry = {}
    for k in template_entry:
        if k not in vals or vals[k] is None:
            refuse("BRAIN_KEY", f"brain key «{k}» of the latest {cat} entry has no queue value")
        entry[k] = vals[k] if k != "pillar" else {kk: vals["pillar"][kk] for kk in template_entry["pillar"]}
    rel = "dentcast-brain.json"
    w.put(rel, tio.json_append(w.text(rel), [], entry))
    return entry


def faq(w, cid, item, m):
    f10 = item / "10-فلش‌کارت-FAQ.json"
    if f10.exists():
        data = json.loads(f10.read_text(encoding="utf-8"))
    elif m.get("faq"):
        data = m["faq"]
    else:
        refuse("MANIFEST_INCOMPLETE", "the item has no 10-فلش‌کارت-FAQ.json; supply field «faq» (the frozen "
               "faqPages/definedTermSets node or {\"skip\": reason}) with its origin", missing=["faq"])
    if "skip" in data:
        return {"skip": data["skip"]}
    url = f"{SITE}/{cid}.html"
    if "faqPages" not in data and isinstance(data.get("faqPage"), dict):
        data = {**data, "faqPages": [data["faqPage"]]}  # one FAQPage written as an object
    raw = json.dumps({k: data[k] for k in ("faqPages", "definedTermSets") if k in data}, ensure_ascii=False)
    # the page's own URL, written in preparation with a placeholder number:
    # …-NN.html, …-<old number>.html, {content_id}.html, …-{content_id}.html
    sec = re.escape(cid.split("/")[0])
    raw = re.sub(r"https://dentcast\.org/%s/(?:[A-Za-z0-9-]+-(?:NN|\d+|\{content_id\})|\{content_id\})\.html" % sec, url, raw)
    if "{content_id}" in raw or re.search(r"-NN\.html", raw):
        refuse("FAQ_PLACEHOLDER", "10-فلش‌کارت-FAQ.json keeps a placeholder outside the page URL")
    node = json.loads(raw)
    rel = "plus/faq-corpus.json"
    w.put(rel, tio.json_append(w.text(rel), ["byContent"], node, key=cid))
    return {"faq": sum(len(p.get("mainEntity", [])) for p in node.get("faqPages", [])),
            "flashcards": sum(len(s.get("hasDefinedTerm", [])) for s in node.get("definedTermSets", []))}


def exam(w, cid, item):
    p = item / "08-سؤال‌های-آزمون.json"
    if not p.exists():
        return {"skip": "no 08 file"}
    data = json.loads(p.read_text(encoding="utf-8"))
    rel = "plus/exam-questions.json"
    text = w.text(rel)
    out = {}
    for target in [cid] + list(data.get("also_content_ids") or []):
        qs = []
        for k, q in enumerate(data["questions"], 1):
            row = {"id": "r-" + hashlib.sha1(f"{target}|publish-{k}".encode()).hexdigest()[:8]}
            q = dict(q)
            if "kind" not in q:
                # a frozen question with options and a key index is a multiple-choice question
                if isinstance(q.get("options"), list) and len(q["options"]) >= 2 and isinstance(q.get("correct"), int):
                    q["kind"] = "mcq"
                else:
                    refuse("EXAM_SHAPE", f"08-سؤال‌های-آزمون.json question {k} has no kind and is not options + key")
            missing = [kk for kk in ("prompt_fa", "options", "correct") if kk not in q]
            if missing:
                refuse("EXAM_SHAPE", f"08-سؤال‌های-آزمون.json question {k} lacks {missing}")
            row.update({kk: q[kk] for kk in ("kind", "prompt_fa", "options", "correct")})
            row["source"] = "publish"
            qs.append(row)
        cur = json.loads(text)["byContent"].get(target)
        if cur is None:
            text = tio.json_append(text, ["byContent"], {"questions": qs}, key=target)
        else:
            refuse("EXAM_EXISTS", f"plus/exam-questions.json already has {target}")
        out[target] = [q["id"] for q in qs]
    w.put(rel, text)
    return out


def catalog(w, cid, m):
    rel = "dentcast_cabinet_full_catalog.json"
    entries = m["catalog"]
    if not entries:
        return {"skip": "no catalog entries in the item"}
    text = w.text(rel)
    data = json.loads(text)
    ids = [int(p["id"][1:]) for p in data["papers"] if re.fullmatch(r"P\d+", str(p.get("id", "")))]
    nxt = max(ids) + 1
    done = []
    tmpl = data["papers"][-1]
    for e in entries:
        if e.get("skip"):
            done.append({"skip": e["skip"]})
            continue
        doi = (e.get("doi") or "").lower()
        hit = next((k for k, p in enumerate(data["papers"]) if doi and (p.get("doi") or "").lower() == doi), None)
        if hit is not None:
            # the paper is already catalogued (by an earlier page): link this page to it, never a duplicate
            if cid not in (data["papers"][hit].get("linked_episodes") or []):
                text = tio.json_append(text, ["papers", hit, "linked_episodes"], cid)
                data = json.loads(text)
            done.append({"linked": data["papers"][hit]["id"]})
            continue
        if e.get("link_existing"):
            refuse("CATALOG_NOT_FOUND", f"DOI {doi} was frozen as already catalogued but is not in the catalog")
        rec = dict(e)
        rec["id"] = f"P{nxt}"
        rec.setdefault("linked_episodes", [cid])
        if cid not in rec["linked_episodes"]:
            rec["linked_episodes"].append(cid)
        missing = [k for k in tmpl if k not in rec]
        if missing:
            refuse("CATALOG_FIELDS", f"catalog entry lacks {missing} (the latest entry's key set)", missing=missing)
        rec = {k: rec[k] for k in tmpl}
        text = tio.json_append(text, ["papers"], rec)
        for t in rec.get("tags") or []:
            idx = json.loads(text)["tag_index"]
            if t in idx:
                text = tio.json_replace_scalar(text, ["tag_index", t], idx[t] + 1)
            else:
                text = tio.json_append(text, ["tag_index"], 1, key=t)
        text = tio.json_replace_scalar(text, ["total_papers"], json.loads(text)["total_papers"] + 1)
        done.append(rec["id"])
        nxt += 1
        data = json.loads(text)
    w.put(rel, text)
    return {"entries": done}


def explore_backlinks(w, cid, m):
    """4.7: a back-link from an approved glossary term only while that term's
    «کاوش بیشتر» is under the cap; nothing is removed or moved."""
    out = []
    for b in m["backlinks_47"]:
        rel = f"glossary/{b['term']}.html"
        doc = w.text(rel)
        if doc is None:
            out.append({"term": b["term"], "skipped": "glossary page missing"})
            continue
        mm = re.search(r'(<div class="dc-related-capsules">)(.*?)(\r?\n?[ \t]*</div>)', doc, re.S)
        if not mm:
            out.append({"term": b["term"], "skipped": "no «کاوش بیشتر» block"})
            continue
        caps = re.findall(r'<a [^>]*class="dc-related-capsule"', mm.group(2))
        if not b.get("anchor") and len(caps) < EXPLORE_CAP:
            out.append({"term": b["term"], "skipped": "no frozen anchor text (nothing is invented)"})
            continue
        if len(caps) >= EXPLORE_CAP:
            out.append({"term": b["term"], "skipped": f"cap {EXPLORE_CAP} reached (Hard Rule 9)"})
            continue
        last = list(re.finditer(r'\r?\n?([ \t]*)<a [^>]*class="dc-related-capsule"[^>]*>.*?</a>', mm.group(2), re.S))[-1]
        nl = "\r\n" if "\r\n" in doc else "\n"
        new_cap = f'{nl}{last.group(1)}<a href="/{cid}.html" class="dc-related-capsule">{esc(b["anchor"])}</a>'
        k = mm.start(2) + last.end()
        w.put(rel, doc[:k] + new_cap + doc[k:])
        out.append({"term": b["term"], "added": b["anchor"]})
    return out


def mint_batch(item, m):
    """The frozen hashtag batch of the item (module 10 step 4): its file must be
    in SHA256SUMS; it may retag other existing pages, never this new one."""
    rel = m.get("mint_batch")
    if not rel:
        refuse("MANIFEST_INCOMPLETE", "a hashtag mint is ordered but no frozen batch file is named (field «mint_batch»)",
               missing=["mint_batch"])
    sums = (item / "SHA256SUMS").read_text(encoding="utf-8")
    if not re.search(r"\s(\./)?%s\s*$" % re.escape(rel), sums, re.M):
        refuse("MINT_BATCH_NOT_FROZEN", f"{rel} is not in SHA256SUMS")
    return json.loads((item / rel).read_text(encoding="utf-8"))


def bridge(w, spec):
    """Cabinet bridge decision for a minted concept: map rows and/or a sorted
    tooth_topics entry, both frozen in the item."""
    rel = "plus/cabinet-bridge.json"
    text = w.text(rel)
    data = json.loads(text)
    for key, tags in (spec.get("map") or {}).items():
        text = tio.json_append(text, ["map"], tags, key=key)
    for key in spec.get("tooth_topics") or []:
        topics = json.loads(text)["tooth_topics"]
        if key in topics:
            continue
        if topics != sorted(topics):
            text = tio.json_append(text, ["tooth_topics"], key)
        else:
            k = sum(1 for t in topics if t < key)
            text = tio.json_append(text, ["tooth_topics"], key, after=k - 1) if k else _prepend(text, key)
    w.put(rel, text)


def _prepend(text, key):
    refuse("BRIDGE_ORDER", f"tooth_topics entry «{key}» would sort first; no precedent for the insertion")


def run(cmd, check=True):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode != 0:
        refuse("TOOL_FAILED", f"{' '.join(cmd)} failed: {r.stdout[-600:]} {r.stderr[-600:]}")
    return r


def pathway(cid, m, cat):
    """5.6, in this order (never zero, never a third automatic pathway):
    1. the frozen choice(s) of the item;
    2. a NoteCast/sibling page: exactly the pathways of its same-number
       episode, right after it — the pair travels together, and a STRONG
       candidate beside it would be a new editorial choice;
    3. otherwise the STRONG candidates of pathway_place.py, at most two;
    4. otherwise its top candidate."""
    import pathway_place as pp
    pw = json.loads((ROOT / "plus/pathways.json").read_text(encoding="utf-8"))
    if m.get("pathway"):
        choice = m["pathway"] if isinstance(m["pathway"], list) else [m["pathway"]]
        return [(x["id"], x.get("after"), "frozen choice") for x in choice]
    parent = m.get("parent_episode")
    if parent:
        placed = [(p["id"], parent, "same-number episode's pathway") for p in pw
                  if any(s_["content_id"] == parent for s_ in p["steps"])]
        if placed:
            return placed
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        pp.propose(cid)
    rows = re.findall(r"^\s+(\d+) \| (STRONG |ASK    ) \| (\S+)\s+\| after (\S+)", buf.getvalue(), re.M)
    placed = []
    for score, conf, pid, anchor in rows:
        if conf.strip() == "STRONG" and pid not in [x[0] for x in placed]:
            placed.append((pid, None if anchor == "(end)" else anchor, "STRONG"))
    cap = getattr(pp, "AUTO_MAX_PATHWAYS", 2)
    placed = placed[:cap]  # a third pathway is a founder decision: never automatic
    if not placed and rows:
        score, conf, pid, anchor = rows[0]
        placed.append((pid, None if anchor == "(end)" else anchor, "top candidate (mechanical default)"))
    if not placed:
        refuse("PATHWAY_NONE", "pathway_place.py offers no candidate; Phase F fails a page in no pathway")
    return placed


QUEUE_REF = re.compile(r"queue:(\d\d)")


def published_as(item, nn):
    """The content_id a sibling queue item was published as: the queue branch's
    own record, the commit «queue: NN published as <content_id> (PR #n)»
    (queue-maintainer.md «انتشار از صف» step 7). None while it is unpublished."""
    r = subprocess.run(["git", "-C", str(item), "log", "--format=%s", "HEAD"], capture_output=True, text=True)
    for line in r.stdout.splitlines():
        mm = re.match(r"queue: %s published as ([a-z]+/[A-Za-z0-9-]+) \(PR #\d+\)" % nn, line)
        if mm:
            return mm.group(1)
    return None


def resolve_queue_refs(item, m, defaults):
    """A frozen link may name a sibling queue item (`queue:NN`) whose page number
    did not exist in preparation. It becomes that item's live page; while the
    item is unpublished (or its page is not on this checkout) the link is not
    made and the receipt says so (queue-route.md mechanical defaults)."""
    cache = {}

    def target(nn, lang="fa"):
        if nn not in cache:
            cache[nn] = published_as(item, nn)
        cid = cache[nn]
        if not cid:
            return None, f"queue item {nn} is not published yet"
        if lang == "en":
            d_, f_ = cid.split("/", 1)
            cid = f"{d_}/en/{f_}"
        if not (ROOT / f"{cid}.html").is_file():
            return None, f"queue item {nn} → {cid}.html is not on this checkout"
        return f"/{cid}.html", None

    keep = []
    for ln in m.get("links_48") or []:
        mm = QUEUE_REF.fullmatch(ln["href"])
        if not mm:
            keep.append(ln)
            continue
        href, why = target(mm.group(1))
        if href:
            keep.append({**ln, "href": href})
        else:
            defaults.append({"rule": "4.8 link to a sibling queue item not made", "phrase": ln["phrase"], "why": why})
    m["links_48"] = keep
    keep = []
    for x in m.get("explore_49") or []:
        mm = QUEUE_REF.fullmatch(x["href"])
        if not mm:
            keep.append(x)
            continue
        href, why = target(mm.group(1))
        if href:
            keep.append({**x, "href": href})
        else:
            defaults.append({"rule": "4.9 capsule to a sibling queue item not added", "label": x["label"], "why": why})
    m["explore_49"] = keep
    if m.get("body_en"):
        def en_link(mm):
            href, why = target(mm.group(2), "en")
            if href:
                return f"[{mm.group(1)}]({href})"
            defaults.append({"rule": "English link to a sibling queue item left as text", "text": mm.group(1), "why": why})
            return mm.group(1)
        m["body_en"] = re.sub(r"\[([^\]]+)\]\(queue:(\d\d)\)", en_link, m["body_en"])


# ------------------------------------------------------------------ main

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("item")
    ap.add_argument("content_id")
    ap.add_argument("--supplement")
    ap.add_argument("--date")
    ap.add_argument("--agent", help="lock holder name that may own the item (the publishing agent)")
    ap.add_argument("--dry-run", action="store_true", help="check and report; write nothing")
    ap.add_argument("--receipt", help="also write the receipt JSON here")
    ap.add_argument("--allow-handoff", action="store_true", help=argparse.SUPPRESS)
    ap.add_argument("--founder-text-change", metavar="WORDS")
    ap.add_argument("--draft", action="store_true",
                    help="preparation only: build the draft page + DES record for DES/Fidelity prep (needs --throwaway)")
    ap.add_argument("--throwaway", action="store_true",
                    help="with --draft: this checkout is a throwaway copy (marker file, no .git); never a publish")
    a = ap.parse_args(argv)
    try:
        receipt = draft_assemble(a) if a.draft else assemble(a)
    except QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 2
    # the receipt file first: a closed stdout (a pipe into `head`) must never
    # leave written files without their receipt
    if a.receipt:
        Path(a.receipt).write_text(json.dumps(receipt, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    try:
        print(json.dumps(receipt, ensure_ascii=False, indent=1))
    except BrokenPipeError:
        pass
    return 0


THROWAWAY_MARKER = ".dentcast-throwaway"


def throwaway_guard(a):
    """--draft writes into ROOT; ROOT must be a copy that can never publish."""
    if not a.throwaway:
        refuse("DRAFT_NEEDS_THROWAWAY", "--draft runs only with --throwaway, from a throwaway copy of the repository "
               "(tools/queue_fidelity_prep.py makes one); it is never a publish")
    if not (ROOT / THROWAWAY_MARKER).is_file() or (ROOT / ".git").exists():
        refuse("NOT_THROWAWAY", f"{ROOT} is not a throwaway copy (needs {THROWAWAY_MARKER} at its root and no .git) — "
               "--draft never writes into a real checkout")
    if (ROOT / HANDOFF).exists():
        refuse("ACTIVE_HANDOFF", f"{HANDOFF} exists in the throwaway copy — a draft is never built beside a publication")
    if a.supplement or a.founder_text_change or a.dry_run:
        refuse("DRAFT_OPTIONS", "--draft takes no --supplement, --founder-text-change or --dry-run")


def draft_manifest(item, cat):
    """The manifest for a draft page: what the item already holds, and inert
    placeholders for what preparation has not written yet. Only the Persian
    page is built, so English, keywords and links never reach a scored unit;
    the title is a unit (u1) and must be the item's own."""
    d = qm.draft(item)
    m = qm.plain(d)
    if not m.get("title_fa"):
        refuse("MANIFEST_INCOMPLETE", "02-عنوان-کپشن.md: the title is a FIDELITY unit (u1); the draft needs it",
               missing=["title_fa"])
    placeholders = []
    for key, val in (("caption_fa", m["title_fa"]), ("keywords", [m["title_fa"]]), ("links_48", []),
                     ("explore_49", []), ("backlinks_47", []), ("credit", {"mode": "none"}), ("images", []),
                     ("pillar", {"primary": "draft", "subtopic": None, "secondary": []}),
                     ("title_en", m["title_fa"]), ("caption_en", m["title_fa"]), ("body_en", "")):
        if not m.get(key) and m.get(key) != []:
            m[key] = val
            placeholders.append(key)
    for img in m["images"]:
        for f in ("alt_fa", "alt_en", "caption_fa", "caption_en"):
            if img.get(f) is None:
                img[f] = ""
                placeholders.append(f"images.{img['n']}.{f}")
        if not img.get("file"):
            refuse("MANIFEST_INCOMPLETE", f"image {img['n']}: no file", missing=[f"images.{img['n']}.file"])
    m["category"] = cat
    return m, placeholders


def draft_assemble(a):
    throwaway_guard(a)
    item = Path(a.item).resolve()
    if not item.is_dir():
        refuse("ITEM_NOT_FOUND", f"{a.item} is not a queue item folder")
    fm = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name)
    if not fm or fm.group(1) not in CATEGORIES:
        refuse("CATEGORY_UNSUPPORTED", f"{item.name}: no queue template for this folder's category")
    cat = fm.group(1)
    c = CATEGORIES[cat]
    im = re.fullmatch(re.escape(c["dir"]) + "/" + re.escape(c["stem"]) + r"(\d+)", a.content_id)
    if not im:
        refuse("DRAFT_CONTENT_ID", f"a draft content_id has the category's pattern {c['dir']}/{c['stem']}<N>")
    n, prev = int(im.group(1)), next_number(cat)[1]
    if (ROOT / f"{a.content_id}.html").exists():
        refuse("DRAFT_CONTENT_ID", f"{a.content_id}.html already exists in the copy — use the next free number")
    m, placeholders = draft_manifest(item, cat)
    if c.get("parent"):
        m["parent_episode"] = c["parent"].format(n=n)
    date = a.date or datetime.date.today().isoformat()
    w = Writes()
    builder = {"notecast": build_notecast_page, "insight": build_insight_page, "chairside": build_chairside_page,
               "metanote": build_metanote_page}.get(cat) or (lambda *x: build_page(cat, *x))
    page, img_files, _info = builder(n, prev, m, date, item, "fa")
    w.put(f"{a.content_id}.html", page)
    for rel, data in img_files.items():
        w.put(rel, data)
    des_d = item / "05-DES-Fidelity"
    des = json.loads((des_d / "des.json").read_text(encoding="utf-8")) if (des_d / "des.json").exists() else None
    if des is not None:
        sources = des["sources"] if isinstance(des, dict) and "sources" in des else (des if isinstance(des, list) else [des])
        rel = "plus/des-scores.json"
        if a.content_id in json.loads(w.text(rel)):
            refuse("DRAFT_CONTENT_ID", f"{rel} already has {a.content_id}")
        w.put(rel, tio.json_append(w.text(rel), [], {"scored_at": date, "sources": sources}, key=a.content_id))
        if (des_d / "markers.json").exists():
            mk = json.loads((des_d / "markers.json").read_text(encoding="utf-8"))
            vals = list(mk.values()) if all(isinstance(v, dict) and any(str(k).startswith("S") for k in v)
                                            for v in mk.values()) else [mk]
            rel = ".dentcast/des-source-markers.json"
            text = w.text(rel) or "{\n}\n"
            w.put(rel, tio.json_append(text, [], vals[0], key=a.content_id))
        if (des_d / "plan.json").exists():
            plan = json.loads((des_d / "plan.json").read_text(encoding="utf-8"))
            w.put(f".dentcast/des-fidelity-plans/{a.content_id}.json",
                  json.dumps({**plan, "content_id": a.content_id}, ensure_ascii=False, indent=1) + "\n")
    w.commit()
    return {"status": "draft", "not_for_publish": True, "throwaway": str(ROOT), "content_id": a.content_id,
            "queue_item": f"queue/{item.name}", "date": date, "placeholders": placeholders,
            "des_record": des is not None, "files": [{"path": rel, "sha256": sha(data)} for rel, data in sorted(w.files.items())]}


def assemble(a):
    info, d, m, n, prev = precheck(a)
    item = info["path"]
    cat = m["category"]
    c = CATEGORIES[cat]
    cid = a.content_id
    defaults = qm.defaults_of(d)
    # date: the publish day. A frozen Fidelity scored the page with its
    # preparation date; queue_install_des.py --date syncs those date lines to
    # this date (a date-only change, never a text change).
    date = a.date or datetime.date.today().isoformat()
    resolve_queue_refs(item, m, defaults)
    w = Writes()
    builder = {"notecast": build_notecast_page, "insight": build_insight_page, "chairside": build_chairside_page,
               "metanote": build_metanote_page}.get(cat) or (lambda *x: build_page(cat, *x))
    page, img_files, page_info = builder(n, prev, m, date, item, "fa")
    if page_info["links_not_found"]:
        defaults.append({"rule": "4.8 approved link phrase not in body", "skipped": page_info["links_not_found"]})
    if page_info["tail_removed"]:
        defaults.append({"rule": "bare source line(s) after the final --- shown as the credit, not as text",
                         "lines": page_info["tail_removed"]})
    w.put(f"{cid}.html", page)
    for rel, data in img_files.items():
        w.put(rel, data)
    en, _, _ = builder(n, prev, m, date, item, "en")
    w.put(f"{c['dir']}/en/{c['stem']}{n}.html", en)
    _, _, tentry = template_facts(cat, prev)
    landing_row(w, cat, n, prev, m["title_fa"], tentry["title"])
    if cat == "notecast":
        parent_episode(w, n, m, prev)
    if m["hashtags"]:
        ref = json.loads((ROOT / "dentcast-hashtag-reference.json").read_text(encoding="utf-8"))
        known = {x["tag"] for x in ref["concepts"]}
        mint = set(m.get("mint") or [])
        drop = [t for t in m["hashtags"] if t not in known and t not in mint]
        if mint - known:
            batch = mint_batch(item, m)
            minted = {c_["tag"] for c_ in batch.get("concepts") or []}
            if not (mint - known) <= minted:
                refuse("MINT_BATCH_INCOMPLETE", f"ordered mint {sorted(mint - known - minted)} is not in the frozen batch")
            if not m.get("bridge"):
                refuse("MANIFEST_INCOMPLETE", "a minted concept needs its frozen bridge decision (field «bridge»: "
                       "map rows or no library equivalent, tooth_topics yes/no; module 10 step 4)", missing=["bridge"])
        if drop:
            defaults.append({"rule": "hashtag not in the library and not ordered minted: dropped", "tags": drop})
            m["hashtags"] = [t for t in m["hashtags"] if t not in drop]
    if not m.get("author") and ("author" in tentry or "source" in tentry):
        # a site fact, not a judgment: the category's pages carry one author
        m["author"] = {"name": tentry.get("author"), "source": tentry.get("source")}
        defaults.append({"field": "author", "rule": f"the author/source of the latest {cat} brain entry",
                         "value": m["author"]})
    entry = brain_entry(w, cat, n, m, tentry)
    if m.get("bridge"):
        bridge(w, m["bridge"])
    report = {"faq": faq(w, cid, item, m), "exam": exam(w, cid, item), "catalog": catalog(w, cid, m),
              "backlinks_47": explore_backlinks(w, cid, m), "pulse": pulse(w, cat, cid, m),
              "explore_49": page_info["explore"], "links_48": page_info["links_done"]}
    base = {"status": "dry_run" if a.dry_run else "assembled", "content_id": cid, "queue_item": f"queue/{item.name}",
            "date": date, "sums": info["sums"], "status_sha256": info["status_sha256"],
            "manifest_source": d["_source"]["value"], "manual_steps": (d.get("_manual") or {}).get("value") or [],
            "mechanical_defaults": defaults, "report": report}
    if a.dry_run:
        base["files"] = w.receipt()
        return base
    # --- writes start here; every later step is a repository tool. Any
    # failure from here on restores every byte this run touched.
    pre = {rel: ((ROOT / rel).read_bytes() if (ROOT / rel).exists() else None) for rel in TOOL_OUTPUTS}
    plan_rel = f".dentcast/des-fidelity-plans/{cid}.json"
    pre[plan_rel] = (ROOT / plan_rel).read_bytes() if (ROOT / plan_rel).exists() else None
    w.commit()
    try:
        return finish_writes(a, w, base, item, cid, m, cat, date, report, entry, pre)
    except BaseException:
        rollback({**pre, **w.backup})
        raise


def finish_writes(a, w, base, item, cid, m, cat, date, report, entry, pre):
    chk = run([sys.executable, "tools/queue_install_des.py", "--check-text", str(item), cid], check=False)
    if chk.returncode != 0 and not a.founder_text_change:
        refuse("TEXT_MOVED", "page body does not carry 01-متن.md verbatim (every written byte was restored; "
               "rerun with --dry-run to inspect the staged page)",
               output=json.loads(chk.stdout))
    des = [sys.executable, "tools/queue_install_des.py", str(item), cid, "--date", date]
    if a.founder_text_change:
        des += ["--founder-text-change", a.founder_text_change]
    des_r = json.loads(run(des).stdout)
    placed = pathway(cid, m, cat)
    for pid, after, why in placed:
        cmd = [sys.executable, "tools/pathway_place.py", "--insert", cid, "--pathway", pid]
        cmd += ["--after", after] if after else ["--at-end"]
        run(cmd)
    if m.get("mint_batch"):
        run([sys.executable, "tools/hashtag_ref.py", "--apply", str(item / m["mint_batch"])])
    run([sys.executable, "tools/hashtag_ref.py", "--sync"])
    run(["node", "tools/build_plus_index.mjs"])
    run([sys.executable, "tools/hashtag_ref.py", "--check"])
    if (ROOT / "tools/validate_exam_questions.py").exists():
        run([sys.executable, "tools/validate_exam_questions.py"])
    if any(isinstance(x, str) or "linked" in x for x in report["catalog"].get("entries") or []) or m.get("bridge"):
        run([sys.executable, "tools/build_cabinet_papers.py"])
        run([sys.executable, "tools/build_cabinet_papers.py", "--check"])
    base["des"] = {k: des_r.get(k) for k in ("status", "record_sha256", "text_synced", "added", "dropped", "mirror")}
    base["pathways"] = [{"pathway": p, "after": a_, "why": why} for p, a_, why in placed]
    touched = set(w.files) | {rel for rel, old in pre.items()
                              if ((ROOT / rel).read_bytes() if (ROOT / rel).exists() else None) != old}
    base["files"] = [{"path": rel, "sha256": sha((ROOT / rel).read_bytes())} for rel in sorted(touched)]
    base["brain_entry"] = entry
    return base


if __name__ == "__main__":
    sys.exit(main())
