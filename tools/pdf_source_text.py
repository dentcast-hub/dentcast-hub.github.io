#!/usr/bin/env python3
"""A paper PDF → `source_text`, read in column order, page furniture dropped.

Module 08 Part 1/2b: the FIDELITY call reads the same `source_text` the SOURCE
call scored, and Part 3 checks every quote as a verbatim substring of it — so a
two-column paper read straight across both columns (pdftotext without
-layout, a copy-paste) breaks quotes and sentences. This tool:

  * reads each page's words with their positions (pdfplumber when installed,
    else poppler's `pdftotext -bbox`; no network, no new dependency);
  * drops rotated text (the publisher's vertical side banner) and the
    download/licence footer lines («Downloaded from … Wiley Online Library …
    Terms and Conditions … Creative Commons License»), bare page numbers and
    lines repeated on most pages (running heads);
  * finds a two-column gutter per page and emits the left column, then the
    right, while full-width lines (title, a spanning abstract, a wide table
    caption) keep their place;
  * keeps one PDF line per text line (a line-break hyphen stays as printed;
    Part 3's quote check folds it) and writes `texts.json` in the shape
    tools/des_fidelity_units.py reads: {"<doi lower>": {"source_text",
    "text_basis"}}.

    python3 tools/pdf_source_text.py PAPER.pdf --doi 10.1111/clr.13849 \\
        --basis FULL_TEXT -o texts.json [--append] [--text-out paper.txt]

The PDF and its text are private (publish-queue.md principle 7): write them
outside the repository and outside the queue branch.
"""
import argparse
import json
import re
import shutil
import statistics
import subprocess
import sys
from collections import Counter
from pathlib import Path

FURNITURE = re.compile(r"(?i)downloaded from\b|wiley online library|wileyonlinelibrary\.com|terms and conditions|"
                       r"creative commons|rules of use|oa articles are governed|this is an open access article|"
                       r"provided the original work is properly cited|^\s*©|^\s*\|?\s*$|"
                       r"^\s*(?:page\s*)?\d{1,4}\s*(?:of\s*\d+)?\s*$")
BASES = ("FULL_TEXT", "ABSTRACT_ONLY", "SECONDARY_REPORT", "EXCERPT")


# ------------------------------------------------------------------ word boxes

def words_pdfplumber(path):
    import pdfplumber  # noqa: PLC0415  (optional)
    pages = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            ws = page.extract_words(keep_blank_chars=False, use_text_flow=False, extra_attrs=["upright"])
            pages.append({"width": float(page.width),
                          "words": [{"x0": float(w["x0"]), "x1": float(w["x1"]), "top": float(w["top"]),
                                     "bottom": float(w["bottom"]), "text": w["text"], "upright": bool(w.get("upright", True))}
                                    for w in ws]})
    return pages


def words_pdftotext(path):
    out = subprocess.run(["pdftotext", "-bbox", str(path), "-"], capture_output=True, text=True, check=True).stdout
    pages = []
    for pm in re.finditer(r'<page width="([\d.]+)" height="[\d.]+">(.*?)</page>', out, re.S):
        ws = []
        for wm in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>',
                              pm.group(2), re.S):
            x0, y0, x1, y1 = map(float, wm.group(1, 2, 3, 4))
            import html  # noqa: PLC0415
            # a rotated word's box is taller than wide (poppler gives no direction)
            ws.append({"x0": x0, "x1": x1, "top": y0, "bottom": y1, "text": html.unescape(wm.group(5)),
                       "upright": not (y1 - y0 > 2.5 * (x1 - x0) and len(wm.group(5)) > 2)})
        pages.append({"width": float(pm.group(1)), "words": ws})
    return pages


def read_words(path):
    try:
        return words_pdfplumber(path)
    except ImportError:
        if not shutil.which("pdftotext"):
            sys.exit("neither pdfplumber nor pdftotext is available")
        return words_pdftotext(path)


# ------------------------------------------------------------------ layout

def lines_of(words, tol=3.0):
    """Group upright words into lines by their top edge; each line's words left→right."""
    rows = []
    for w in sorted((w for w in words if w.get("upright", True) and w["text"].strip()), key=lambda w: (w["top"], w["x0"])):
        if rows and abs(rows[-1]["top"] - w["top"]) <= tol:
            rows[-1]["words"].append(w)
        else:
            rows.append({"top": w["top"], "words": [w]})
    for r in rows:
        r["words"].sort(key=lambda w: w["x0"])
        r["x0"], r["x1"] = r["words"][0]["x0"], max(w["x1"] for w in r["words"])
    return rows


def split_at(line, g, thr):
    """(left words, right words) when the line has a gap of at least `thr`
    containing x = g, else None."""
    ws = line["words"]
    for a, b in zip(ws, ws[1:]):
        if a["x1"] <= g <= b["x0"] and b["x0"] - a["x1"] >= thr:
            return ws[:ws.index(b)], ws[ws.index(b):]
    return None


def find_gutter(lines, width, min_lines=6):
    """The x of a two-column gutter, or None. Every candidate between 20 % and
    80 % of the page width is scored by the lines it leaves whole (a wide gap
    at x, or the line wholly on one side) minus twice the lines whose words it
    cuts; a gutter needs text on both sides. The middle of the best plateau
    wins (an asymmetric layout — a narrow affiliation column — is found too)."""
    gaps = [b["x0"] - a["x1"] for ln in lines for a, b in zip(ln["words"], ln["words"][1:]) if b["x0"] > a["x1"]]
    if len(lines) < min_lines or not gaps:
        return None, 0
    need = min(3, len(lines))
    thr = max(6.0, 2.5 * statistics.median(gaps))
    scored = []
    for g10 in range(int(width * 2), int(width * 8) + 1, 5):
        g = g10 / 10
        split = sum(1 for ln in lines if split_at(ln, g, thr))
        cross = sum(1 for ln in lines if any(w["x0"] < g < w["x1"] for w in ln["words"]))
        left = sum(1 for ln in lines if ln["x1"] <= g)
        right = sum(1 for ln in lines if ln["x0"] >= g)
        if split + left >= need and split + right >= need:
            scored.append((split + left + right - 2 * cross, g))
    if not scored:
        return None, thr
    top = max(s for s, _ in scored)
    if top < max(need, 0.5 * len(lines)):
        return None, thr
    plateau = [g for s, g in scored if s == top]
    return plateau[len(plateau) // 2], thr


def text_of(ln):
    return " ".join(w["text"] for w in ln["words"])


def ordered(lines, width, depth=0):
    """Lines in reading order: left column, then right, around full-width
    lines; a run of full-width lines (another layout further down the page —
    the body under a first page's abstract) is laid out again on its own."""
    g, thr = find_gutter(lines, width, 2) if depth < 3 else (None, 0)
    if g is None:
        return [text_of(ln) for ln in lines]
    out, left, right, wide = [], [], [], []

    def flush_cols():
        out.extend(left)
        out.extend(right)
        left.clear()
        right.clear()

    def flush_wide():
        if wide:
            out.extend(ordered(list(wide), width, depth + 1) if len(wide) >= 2 else [text_of(ln) for ln in wide])
            wide.clear()

    for ln in lines:
        parts = split_at(ln, g, thr)
        side = ("both" if parts else "left" if ln["x1"] <= g else "right" if ln["x0"] >= g else None)
        if side is None:
            flush_cols()
            wide.append(ln)
            continue
        flush_wide()
        if parts:
            left.append(" ".join(w["text"] for w in parts[0]))
            right.append(" ".join(w["text"] for w in parts[1]))
        else:
            (left if side == "left" else right).append(text_of(ln))
    flush_cols()
    flush_wide()
    return out


def bands(lines):
    """Split a page at its wide vertical gaps (more than twice the usual line
    pitch): a first page's title/abstract block and the two-column body below
    it are separate layouts."""
    if len(lines) < 3:
        return [lines]
    pitch = statistics.median(b["top"] - a["top"] for a, b in zip(lines, lines[1:]))
    out = [[lines[0]]]
    for a, b in zip(lines, lines[1:]):
        if b["top"] - a["top"] > 2 * max(pitch, 1.0):
            out.append([])
        out[-1].append(b)
    return out


def page_lines(page):
    """The page's text lines in reading order, band by band."""
    lines = [ln for ln in lines_of(page["words"]) if not FURNITURE.search(text_of(ln))]
    return [t for band in bands(lines) for t in ordered(band, page["width"])]


def drop_furniture(pages_lines):
    """Remove footer/licence lines, bare page numbers and running heads: a
    short line among the first or last two of its page that recurs (digits
    aside) on at least a third of the pages, when there are three or more."""
    norm = lambda t: re.sub(r"\d+", "#", t.strip().lower())
    edge = lambda pl: {norm(t) for t in pl[:2] + pl[-2:] if len(t.strip()) <= 80}
    seen = Counter(n for pl in pages_lines for n in edge(pl))
    rep = {n for n, k in seen.items() if len(pages_lines) >= 3 and k >= max(2, len(pages_lines) / 3) and n}
    out = []
    for pl in pages_lines:
        ends = set(range(min(2, len(pl)))) | set(range(max(0, len(pl) - 2), len(pl)))
        out.append([t for i, t in enumerate(pl) if t.strip() and not FURNITURE.search(t)
                    and not (i in ends and norm(t) in rep)])
    return out


# Section headings a publisher letter-spaces («ACKNO WLE DGE MENTS»): rejoined so
# the back-matter cut of des_fidelity_units.conclusion_of() sees them.
HEADINGS = ("ACKNOWLEDGEMENTS", "ACKNOWLEDGMENTS", "AUTHOR CONTRIBUTIONS", "CONFLICT OF INTEREST STATEMENT",
            "CONFLICT OF INTEREST", "DATA AVAILABILITY STATEMENT", "FUNDING INFORMATION", "FUNDING",
            "ORCID", "REFERENCES", "CONCLUSIONS", "CONCLUSION")


def heading_fix(line):
    t = line.strip()
    if not re.fullmatch(r"[A-Z0-9 |.]+", t) or " " not in t:
        return line
    flat = t.replace(" ", "")
    for h in HEADINGS:
        if flat.endswith(h.replace(" ", "")):
            head = flat[:len(flat) - len(h.replace(" ", ""))]
            return (head.replace("|", " | ").strip() + " " + h).strip()
    return line


def join_text(pages_lines):
    """One string, one PDF line per text line. A line-break hyphen stays as
    printed: the quote check (verify_publish.des_norm) folds «-» + line break
    on both sides, so nothing is re-spelled here."""
    return "\n".join(heading_fix(re.sub(r"[ \t]+", " ", t).strip()) for pl in pages_lines for t in pl if t.strip())


def source_text(pages):
    return join_text(drop_furniture([page_lines(p) for p in pages]))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("pdf")
    ap.add_argument("--doi", help="texts.json key (lower-cased); a DOI-less source uses its tag S<n>")
    ap.add_argument("--basis", choices=BASES, default="FULL_TEXT", help="text_basis the SOURCE call scored")
    ap.add_argument("-o", "--out", help="texts.json to write")
    ap.add_argument("--append", action="store_true", help="add this source to an existing texts.json")
    ap.add_argument("--text-out", help="also write the plain text here")
    a = ap.parse_args(argv)
    text = source_text(read_words(Path(a.pdf)))
    if not text:
        sys.exit("no text extracted (a scanned PDF needs OCR first)")
    if a.text_out:
        Path(a.text_out).write_text(text + "\n", encoding="utf-8")
    if a.out:
        if not a.doi:
            sys.exit("-o needs --doi (or S<n>) as the texts.json key")
        out = Path(a.out)
        data = json.loads(out.read_text(encoding="utf-8")) if a.append and out.exists() else {}
        data[a.doi.strip().lower()] = {"source_text": text, "text_basis": a.basis}
        out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({"chars": len(text), "words": len(text.split()), "key": (a.doi or "").lower() or None,
                      "text_basis": a.basis, "out": a.out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
