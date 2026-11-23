#!/usr/bin/env python3
"""Prove that a change to a page or a queue text touched only the presentation layer.

Module 03 «Structure, chips and callout boxes»: numbered section headings, bold
sub-labels, status chips and callout-box labels are a presentation layer. On a
page each such element carries `data-dc-presentation`; in a queue text
(`01-متن.md`, `06-انگلیسی.md`) it is a `[[+]]` line or a `[[label]]` chip.
`tools/des_fidelity_units.py`, Phase F and the queue's text check never read it
(module 08 Part 2b), so a page can be restructured later without a new DES or
FIDELITY run — provided nothing else moved. This tool is that proviso, checked:

    # a published page: the working-tree file against a git revision (or a file)
    python3 tools/presentation_diff.py --page sharehub/share-10.html --old-ref HEAD
    python3 tools/presentation_diff.py --page NEW.html --old OLD.html [--content-id sharehub/share-10]

    # a queue text, rendered as its category's page
    python3 tools/presentation_diff.py --md NEW.md --old OLD.md --category sharehub [--lang en]

    # a frozen queue item («آماده»): check it, then re-stamp it without a new preparation
    python3 tools/presentation_diff.py --queue-item <queue/NN-…> --old-ref <revision of the frozen item> [--restamp]

    # the text DES/Fidelity read (a COMMENTARY source_text is this, module 08 Part 1)
    python3 tools/presentation_diff.py --text-of-record <page.html | 01-متن.md>

    # backward compatibility: units of every page with a DES record, and of every
    # queue item, under this checkout's tools against a git revision's tools
    python3 tools/presentation_diff.py --corpus-check --old-ref <revision> [--queue-dir <queue/>]

What «presentation-only» means (exit 0), old version against new version:
  1. the units are the same list — id, text, heading/caption/toggle flag — under
     today's cut and under the cut before `sentences()` (so whichever cut a
     stored record keeps, no id and no claim_quote moves);
  2. the text of record (title, body, references; presentation stripped,
     whitespace runs folded) is identical codepoint for codepoint, in order —
     read block by block, and read the way Phase F searches a quote in it;
  3. links, images and list items of the body are the same, in order;
  4. on a page: everything outside the body (head, JSON-LD, title, related,
     scripts) is identical, `?v=` cache stamps aside;
  5. on a page or item with two or more cited sources the paragraphs are the
     same too: a sentence takes its source from its paragraph (spec appendix
     rule 10), so a box may wrap whole paragraphs there, never cut one; where
     the plan can be recomputed (a published page) it must come out identical.
What may therefore change: marked elements added, edited or removed; an
in-place run of sentences wrapped in a callout box (on a one-source or
COMMENTARY page also a run cut out of its paragraph); markup that carries no
words. What is refused, with the first differing sentence named: a word
changed, a sentence moved, split, joined, added or dropped, an unmarked heading
or label added or removed, a marker put on the author's own text.

Exit 0 presentation-only (or re-stamped / corpus identical), 3 refused, 2 usage.
Standard library only.
"""
import argparse
import difflib
import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import des_fidelity_units as U  # noqa: E402
import dentcast_text_io as tio  # noqa: E402
import queue_manifest as qm  # noqa: E402
import verify_publish as vp  # noqa: E402

STAMP = re.compile(r"\?v=\d+")
RETROFIT_FILES = ("01-متن.md", "06-انگلیسی.md", qm.MANIFEST_FILE)
BLOCKISH = re.compile(r"(?i)</?(p|div|li|ul|ol|br|section|blockquote|tr|td|th|table|figcaption|figure|h[1-6]|hr)\b[^>]*>")


class Refusal(Exception):
    def __init__(self, code, message, **detail):
        super().__init__(f"{code}: {message}")
        self.detail = {"code": code, "message": message, **detail}


def fold(t):
    return re.sub(r"\s+", " ", t or "").strip()


def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8")).hexdigest()


def cited(sources):
    return [s for s in sources or [] if isinstance(s, dict) and not s.get("error")]


# ------------------------------------------------------------------ one page

def text_of_record(doc):
    """Title and body as DES/Fidelity read them: presentation stripped, one
    block per line, whitespace folded."""
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    reg = BLOCKISH.sub("\n", vp.article_region(doc))
    lines = [fold(vp.text_of(h1.group(1)))] if h1 else []
    lines += [fold(x) for x in html.unescape(re.sub(r"<[^>]+>", "", reg)).split("\n")]
    return [x for x in lines if x]


def outside_body(doc):
    """The document without its body (the span article_region reads), cache
    stamps normalised."""
    start = doc.find("</h1>")
    if start == -1:
        return STAMP.sub("?v=", doc)
    end = len(doc)
    for marker in ('<div class="author-note"', '<div class="dc-related-section"', "</main>"):
        i = doc.find(marker, start)
        if i != -1:
            end = min(end, i)
    return STAMP.sub("?v=", doc[:start] + "\x00BODY\x00" + doc[end:])


def lf(doc):
    """Line endings as the units tool reads a page (universal newlines)."""
    return doc.replace("\r\n", "\n").replace("\r", "\n")


def read(path):
    """A file's text with its own line endings (a page keeps CRLF or LF as it is)."""
    return Path(path).read_bytes().decode("utf-8")


FRAME = re.compile(r'(?is)<a\b[^>]*\bclass="[^"]*\blang-btn\b[^"]*"[^>]*>.*?</a>|'
                   r'<div\b[^>]*\bclass="[^"]*\bdc-trustline\b[^"]*"[^>]*>.*?</div>')


def facts(doc, sources):
    doc = lf(doc)
    bad = vp.presentation_problems(doc)
    if bad:
        raise Refusal("MARKER_MALFORMED", "; ".join(bad))
    raw = vp.article_region(doc, presentation=True)
    return {
        "cuts": {legacy: U.split_html(doc, sources, legacy) for legacy in (False, True)},
        # the same cuts with no citation stop: a COMMENTARY page's record cites the page itself, so
        # its own units end at the title; every sentence is still compared as a unit here
        "all": {legacy: U.split_html(doc, [], legacy) for legacy in (False, True)},
        "text": " ".join(text_of_record(doc)),
        # the haystack Phase F and the queue's text check search quotes in (tags dropped with no space)
        "hay": vp.des_norm(vp.text_of(vp.article_region(doc))),
        "links": [(h, fold(vp.text_of(t))) for h, t in re.findall(r'(?is)<a\b[^>]*\bhref="([^"]*)"[^>]*>(.*?)</a>', raw)],
        "images": re.findall(r'(?is)<img\b[^>]*\bsrc="([^"]*)"', raw),
        "items": len(re.findall(r"(?i)<li[\s>]", raw)),
        "marked": len(vp.presentation_spans(raw)),
    }


def key(u):
    return (u["id"], u["text"], bool(u.get("heading")), bool(u.get("caption")), bool(u.get("chrome")))


def first_unit_diff(a, b):
    for k in range(max(len(a), len(b))):
        x = a[k] if k < len(a) else None
        y = b[k] if k < len(b) else None
        if x is None or y is None or key(x) != key(y):
            return {"position": k + 1, "old": None if x is None else {"id": x["id"], "text": x["text"]},
                    "new": None if y is None else {"id": y["id"], "text": y["text"]}}
    return None


def paragraphs(units):
    out, cur = [], None
    for u in units:
        if u["para"] != cur:
            out.append([])
            cur = u["para"]
        out[-1].append(u["id"])
    return out


def compare(old_doc, new_doc, sources=None, content_id=None, page=True):
    """Raises Refusal unless `new_doc` differs from `old_doc` only in the
    presentation layer. Returns the receipt."""
    sources = sources or []
    old, new = facts(old_doc, sources), facts(new_doc, sources)
    for group, legacy in (("cuts", False), ("cuts", True), ("all", False), ("all", True)):
        d = first_unit_diff(old[group][legacy], new[group][legacy])
        if d:
            a, b = d["old"], d["new"]
            what = ("the text of record ends early: a sentence is gone" if b is None else
                    "text was added after the last sentence, outside the presentation layer" if a is None else
                    "the text of record differs from here (a word changed, or a sentence, heading or label was "
                    "added, dropped, split, joined or moved)")
            raise Refusal("TEXT_CHANGED", f"unit {d['position']}: {what} — old «{(a or {}).get('text')}» / new "
                          f"«{(b or {}).get('text')}». A presentation-only change leaves every unit as it was; a word "
                          "the agent adds carries the marker, the author's own words never do", **d)
    if old["text"] != new["text"]:
        k = next((i for i, (x, y) in enumerate(zip(old["text"], new["text"])) if x != y),
                 min(len(old["text"]), len(new["text"])))
        raise Refusal("TEXT_CHANGED", "the text of record differs outside the units (a reference line, a table cell, "
                      f"spacing inside a word): old «…{old['text'][max(0, k - 40):k + 40]}…» / new "
                      f"«…{new['text'][max(0, k - 40):k + 40]}…»", at=k)
    if old["hay"] != new["hay"]:
        k = next((i for i, (x, y) in enumerate(zip(old["hay"], new["hay"])) if x != y),
                 min(len(old["hay"]), len(new["hay"])))
        raise Refusal("TEXT_CHANGED", "the page text as Phase F reads it (tags dropped, whitespace folded) differs: a "
                      "quote that runs across this point would no longer be found. Keep the whitespace between two "
                      f"blocks when one is cut or wrapped: old «…{old['hay'][max(0, k - 40):k + 40]}…» / new "
                      f"«…{new['hay'][max(0, k - 40):k + 40]}…»", at=k)
    for name, label in (("links", "links"), ("images", "images"), ("items", "list items")):
        if old[name] != new[name]:
            raise Refusal("STRUCTURE_CHANGED", f"the body's {label} differ: a presentation-only change adds no link, "
                          "image or list item and removes none", old=old[name], new=new[name])
    if page and outside_body(old_doc) != outside_body(new_doc):
        a, b = outside_body(old_doc).split("\n"), outside_body(new_doc).split("\n")
        k = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
        raise Refusal("OUTSIDE_BODY_CHANGED", "the page differs outside its body (head, JSON-LD, title, related block): "
                      f"old «{(a[k] if k < len(a) else '')[:120]}» / new «{(b[k] if k < len(b) else '')[:120]}»")
    multi = len(cited(sources)) >= 2
    if multi:
        for legacy in (False, True):
            po, pn = paragraphs(old["cuts"][legacy]), paragraphs(new["cuts"][legacy])
            if po != pn:
                k = next((i for i, (x, y) in enumerate(zip(po, pn)) if x != y), min(len(po), len(pn)))
                raise Refusal("PARAGRAPH_CHANGED", "this page cites several sources and a sentence takes its source "
                              "from its paragraph (spec appendix rule 10): a box may wrap whole paragraphs here, never "
                              f"cut one. Paragraph {k + 1} was {po[k] if k < len(po) else None}, is now "
                              f"{pn[k] if k < len(pn) else None}", paragraph=k + 1)
            if content_id:
                ao, an = U.assign(old["cuts"][legacy], sources, content_id), U.assign(new["cuts"][legacy], sources, content_id)
                if ao != an:
                    raise Refusal("ATTRIBUTION_CHANGED", "the units reach other sources than before "
                                  "(des_fidelity_units.assign)", old=str(ao)[:400], new=str(an)[:400])
    return {"status": "presentation_only", "units": len(new["cuts"][False]), "sentences": len(new["all"][False]),
            "marked_elements": {"old": old["marked"], "new": new["marked"]},
            "text_of_record_sha256": sha(new["text"]), "sources_cited": len(cited(sources)),
            "paragraphs_checked": multi}


# ------------------------------------------------------------------ queue text

def render_md(md, category, lang="fa"):
    """A queue text as its category's page body (queue_apply's own renderer),
    in a minimal page: what publish day will build, without the template."""
    import queue_apply as qa  # noqa: PLC0415
    md = lf(md)
    bad = qm.presentation_md_problems(md)
    if bad:
        raise Refusal("MARKER_MALFORMED", "; ".join(bad))
    body_md = qa.split_tail(md)[0]
    nums = sorted(set(re.findall(r"\[\[(?:تصویر|Image):(\d\d)\]\]", body_md)))
    imgs = {n: {"alt_fa": "", "alt_en": "", "caption_fa": f"تصویر {n}", "caption_en": f"Figure {n}", "w": 1, "h": 1}
            for n in nums}
    url = lambda k: f"/x/{k}.webp"
    try:
        if category == "notecast":
            body = qa.render_body(body_md, {}, None, None, lang, "indented", "glossary-link")
        elif category == "insight":
            body = qa.render_insight(body_md, imgs, url, None, lang)
        elif category == "chairside":
            body = qa.render_chairside(body_md, imgs, url, None, lang)
        elif category == "metanote":
            body = qa.render_metanote(body_md, imgs, url, None, lang)
        elif category == "sharehub":
            body = qa.render_body(body_md, imgs, url, None, lang)
        else:
            raise Refusal("CATEGORY", f"no queue renderer for category «{category}» ({', '.join(qm.CATEGORIES)})")
    except qm.QueueRefusal as e:
        raise Refusal("RENDER_REFUSED", str(e))
    return f"<main>\n<h1>-</h1>\n{body}\n</main>\n"


def compare_md(old_md, new_md, category, lang="fa", sources=None):
    return compare(render_md(old_md, category, lang), render_md(new_md, category, lang), sources, page=False)


# ------------------------------------------------------------------ frozen queue item

def git_show(cwd, ref, rel):
    r = subprocess.run(["git", "-C", str(cwd), "show", f"{ref}:./{rel}"], capture_output=True)
    return r.stdout if r.returncode == 0 else None


def english_body(item_name, text01, text06):
    """{value, from} of the English body of a 06 text, by queue_manifest's own
    rule (the body ends where 01's `## ` sections end)."""
    with tempfile.TemporaryDirectory() as t:
        d = Path(t) / item_name
        d.mkdir()
        if text01 is not None:
            (d / "01-متن.md").write_text(text01, encoding="utf-8")
        (d / "06-انگلیسی.md").write_text(text06, encoding="utf-8")
        return qm.draft(d)["body_en"]


def relocate(origin, rel, old_lines, new_lines):
    """`<rel>:<a>[-<b>]` of the old file as the same lines' place in the new one."""
    m = re.fullmatch(re.escape(rel) + r":(\d+)(?:-(\d+))?", origin or "")
    if not m:
        return origin
    a, b = int(m.group(1)), int(m.group(2) or m.group(1))
    where = {}
    for i, j, n in difflib.SequenceMatcher(None, old_lines, new_lines, autojunk=False).get_matching_blocks():
        where.update({i + k: j + k for k in range(n)})
    got = [where.get(k) for k in range(a - 1, b)]
    if None in got or got != list(range(got[0], got[0] + len(got))):
        raise Refusal("ORIGIN_NOT_RELOCATED", f"12-انتشار.json cites {origin}; those lines are not unchanged and "
                      f"together in the new {rel} — a presentation-only change leaves every cited line as it was")
    return f"{rel}:{got[0] + 1}" + (f"-{got[-1] + 1}" if m.group(2) else "")


def origins(node, path=()):
    """[(path, from)] of every {"value","from"} in a manifest."""
    out = []
    if isinstance(node, dict):
        if isinstance(node.get("from"), str):
            out.append((path + ("from",), node["from"]))
        for k, v in node.items():
            out += origins(v, path + (k,))
    elif isinstance(node, list):
        for k, v in enumerate(node):
            out += origins(v, path + (k,))
    return out


def queue_item(item, old_ref=None, old_dir=None, restamp=False):
    item = Path(item).resolve()
    fm = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name)
    if not item.is_dir() or not fm:
        raise Refusal("ITEM_NOT_FOUND", f"{item} is not a queue item folder (NN-<category>-<slug>)")
    category = fm.group(1)

    def old(rel):
        if old_dir:
            p = Path(old_dir) / rel
            return p.read_bytes() if p.is_file() else None
        return git_show(item, old_ref, rel)
    sums_old = old("SHA256SUMS")
    if sums_old is None:
        raise Refusal("NOT_FROZEN", "the old version has no SHA256SUMS: only a frozen item («آماده») is re-stamped; an "
                      "item in preparation is checked with --md and frozen by queue_stamp.py as always")
    rows = {}
    for line in sums_old.decode("utf-8").splitlines():
        m = re.fullmatch(r"([0-9a-f]{64}) [ *](.+)", line.strip())
        if m:
            rows[m.group(2)[2:] if m.group(2).startswith("./") else m.group(2)] = m.group(1)
    present = {p.relative_to(item).as_posix() for p in item.rglob("*")
               if p.is_file() and not any(part.startswith(".") for part in p.relative_to(item).parts)}
    extra = sorted(present - set(rows) - {qm.STATUS_FILE, "SHA256SUMS"})
    gone = sorted(r for r in rows if r not in present and r != qm.STATUS_FILE)
    if extra or gone:
        raise Refusal("OTHER_FILE_CHANGED", f"files were added {extra} or removed {gone}: not a presentation-only change")
    changed = sorted(r for r, d in rows.items() if r != qm.STATUS_FILE and sha((item / r).read_bytes()) != d)
    other = [r for r in changed if r not in RETROFIT_FILES]
    if other:
        raise Refusal("OTHER_FILE_CHANGED", f"{other} differ from the frozen SHA256SUMS: a presentation-only change "
                      f"touches only {', '.join(RETROFIT_FILES[:2])} (and the English body copy in {qm.MANIFEST_FILE})")
    frozen = {}
    for rel in RETROFIT_FILES:
        if rel in rows:
            data = old(rel)
            if data is None or sha(data) != rows[rel]:
                raise Refusal("OLD_NOT_FROZEN", f"{rel} of the old version is not the file its SHA256SUMS froze")
            frozen[rel] = data.decode("utf-8")
    if not changed:
        return {"status": "unchanged", "queue_item": item.name}
    des = item / "05-DES-Fidelity" / "des.json"
    sources = []
    if des.exists():
        d = json.loads(des.read_text(encoding="utf-8"))
        sources = d["sources"] if isinstance(d, dict) and "sources" in d else (d if isinstance(d, list) else [d])
    now = {rel: read(item / rel) for rel in frozen}
    report = {}
    if "01-متن.md" in changed:
        report["01-متن.md"] = compare_md(frozen["01-متن.md"], now["01-متن.md"], category, "fa", sources)
    mf = qm.MANIFEST_FILE
    manifest_new = frozen.get(mf)  # what 12 must be after this change
    if "06-انگلیسی.md" in changed:
        b_old = english_body(item.name, frozen.get("01-متن.md"), frozen["06-انگلیسی.md"])
        b_new = english_body(item.name, now.get("01-متن.md"), now["06-انگلیسی.md"])
        if b_old["value"] is None or b_new["value"] is None:
            raise Refusal("ENGLISH_BODY", "06-انگلیسی.md has no single `## Body` section (queue_manifest.draft)")
        report["06-انگلیسی.md"] = compare_md(b_old["value"], b_new["value"], category, "en", sources)
        lo, ln = frozen["06-انگلیسی.md"].splitlines(), now["06-انگلیسی.md"].splitlines()

        def rest(lines, origin):
            x, y = (int(v) for v in re.fullmatch(r".+:(\d+)-(\d+)", origin).groups())
            return lines[:x - 1] + ["\x00BODY\x00"] + lines[y:]
        if rest(lo, b_old["from"]) != rest(ln, b_new["from"]):
            raise Refusal("OTHER_TEXT_CHANGED", "06-انگلیسی.md differs outside its body (title, caption, figure "
                          "captions): not a presentation-only change")
        if mf in frozen:
            m_old = json.loads(frozen[mf])
            eff_old = m_old["body_en"]["value"]
            if eff_old == b_old["value"]:
                eff_new = b_new["value"]
            else:
                # 12's English body was already not the 06 body (edited in preparation): the agent
                # edits 12's copy by hand and it is checked here against the frozen copy
                eff_new = json.loads(now[mf])["body_en"]["value"]
                report[mf + ":body_en"] = compare_md(eff_old, eff_new, category, "en", sources)
            text = tio.json_replace_scalar(frozen[mf], ["body_en", "value"], eff_new)
            for path, origin in origins(m_old):
                new_origin = b_new["from"] if list(path) == ["body_en", "from"] else relocate(origin, "06-انگلیسی.md", lo, ln)
                if new_origin != origin:
                    text = tio.json_replace_scalar(text, list(path), new_origin)
            manifest_new = text
    if "01-متن.md" in changed and mf in frozen:
        lo, ln = frozen["01-متن.md"].splitlines(), now["01-متن.md"].splitlines()
        for path, origin in origins(json.loads(manifest_new)):
            new_origin = relocate(origin, "01-متن.md", lo, ln)
            if new_origin != origin:
                manifest_new = tio.json_replace_scalar(manifest_new, list(path), new_origin)
    if mf in frozen and now[mf] not in (frozen[mf], manifest_new):
        raise Refusal("MANIFEST_CHANGED", f"{mf} differs from the frozen one by more than the English body and the "
                      "line references into the changed files")
    pending = mf in frozen and now[mf] != manifest_new
    out = {"status": "presentation_only", "queue_item": item.name, "files": report,
           "changed": changed, "manifest_update": "written" if (pending and restamp) else "pending" if pending else None}
    if not restamp:
        out["next"] = "rerun with --restamp to rewrite the SHA256SUMS rows of these files" + \
            (f" and {mf}'s English body" if pending else "")
        return out
    st = qm.status_fields(item)
    if not (st["status"] or "").startswith("آماده"):
        raise Refusal("NOT_READY", f"status is «{st['status']}»: only an item marked «آماده» is re-stamped")
    if pending:
        tio.write_raw(item / mf, manifest_new)
    touched = sorted(set(changed) | ({mf} if pending else set()))
    new_rows = {r: (sha((item / r).read_bytes()) if r in touched else d) for r, d in rows.items()}
    lines = []
    for line in sums_old.decode("utf-8").splitlines(keepends=True):
        m = re.fullmatch(r"([0-9a-f]{64})( [ *])(.+?)(\r?\n?)", line)
        rel = m and (m.group(3)[2:] if m.group(3).startswith("./") else m.group(3))
        lines.append(new_rows[rel] + m.group(2) + m.group(3) + m.group(4) if m and rel in touched else line)
    (item / "SHA256SUMS").write_bytes("".join(lines).encode("utf-8"))
    qm.check_sums(item)
    out["status"] = "restamped"
    out["sha256"] = {r: {"frozen": rows[r], "now": new_rows[r]} for r in touched}
    out["history_line"] = ("بازمهر لایهٔ نمایش (tools/presentation_diff.py --restamp): فقط عنصرهای لایهٔ نمایش در "
                           + "، ".join(touched) + " عوض شد؛ متن ثبت‌شده، واحدها، DES، Fidelity، انگلیسی و FAQ همان‌اند؛ وضعیت «آماده» می‌ماند. "
                           + "؛ ".join(f"{r}: {rows[r][:12]} → {new_rows[r][:12]}" for r in touched))
    out["next"] = "add history_line to the «تاریخچه» of 00-وضعیت.md, then commit and push the item"
    return out


# ------------------------------------------------------------------ corpus check

def load_old_tools(ref, tmp):
    """tools/ of `ref`, importable as separate modules whose ROOT is this checkout."""
    import importlib.util  # noqa: PLC0415
    names = ("verify_publish", "des_fidelity_units", "queue_manifest", "queue_apply", "queue_install_des",
             "dentcast_text_io", "des_record_guard")
    for n in names:
        r = subprocess.run(["git", "-C", str(ROOT), "show", f"{ref}:tools/{n}.py"], capture_output=True)
        if r.returncode != 0:
            raise Refusal("OLD_REF", f"cannot read tools/{n}.py at {ref}: {r.stderr.decode('utf-8', 'replace').strip()[:200]}")
        (Path(tmp) / f"old_{n}.py").write_bytes(
            re.sub(rb"(?m)^(\s*)(import|from) (%s)\b" % "|".join(names).encode(),
                   lambda m: m.group(1) + m.group(2) + b" old_" + m.group(3), r.stdout))
    sys.path.insert(0, str(tmp))
    mods = {}
    fake = Path(tmp).resolve().parent  # what the copies computed as their ROOT
    for n in ("verify_publish", "des_fidelity_units", "queue_manifest", "queue_apply", "queue_install_des"):
        mods[n] = importlib.import_module(f"old_{n}")
        for k, v in list(vars(mods[n]).items()):
            if isinstance(v, Path) and (v == fake or fake in v.parents):
                setattr(mods[n], k, ROOT / v.relative_to(fake))
    return mods


def corpus_check(ref, queue_dir=None, queue_ref="origin/queue"):
    import queue_apply as qa  # noqa: PLC0415
    import queue_install_des as qi  # noqa: PLC0415
    out = {"old_ref": ref, "pages": 0, "pages_with_fidelity": 0, "units": 0, "page_differences": [],
           "queue_items": 0, "queue_texts": 0, "queue_units": 0, "queue_differences": [], "marked_pages": 0}
    with tempfile.TemporaryDirectory() as tmp:
        old = load_old_tools(ref, tmp)
        oU = old["des_fidelity_units"]
        store = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8"))
        for cid, rec in store.items():
            if not (ROOT / f"{cid}.html").exists() or not isinstance(rec.get("sources"), list):
                continue
            out["pages"] += 1
            out["pages_with_fidelity"] += bool(rec.get("fidelity"))
            if vp.PRESENTATION_ATTR in (ROOT / f"{cid}.html").read_text(encoding="utf-8"):
                out["marked_pages"] += 1  # carries the layer: differs from the old cut by design, not compared
                continue
            for legacy in (None, False, True):
                a = json.dumps(oU.split_page(cid, rec["sources"], legacy=legacy), ensure_ascii=False, sort_keys=True)
                b = json.dumps(U.split_page(cid, rec["sources"], legacy=legacy), ensure_ascii=False, sort_keys=True)
                if a != b:
                    out["page_differences"].append({"content_id": cid, "cut": legacy})
                elif legacy is None:
                    out["units"] += a.count('"id"')
        # the queue: every item's texts through the old and the new renderer, cut by the old and the new tool
        qtmp = None
        if queue_dir is None:
            r = subprocess.run(["git", "-C", str(ROOT), "archive", queue_ref, "queue"], capture_output=True)
            if r.returncode != 0:
                out["queue"] = f"skipped: {queue_ref} is not available ({r.stderr.decode('utf-8', 'replace').strip()[:120]})"
                return out
            qtmp = Path(tmp) / "queue-snap"
            qtmp.mkdir()
            subprocess.run(["tar", "-x", "-C", str(qtmp)], input=r.stdout, check=True)
            queue_dir = qtmp / "queue"
        oqa, oqi = old["queue_apply"], old["queue_install_des"]
        scratch = Path(tmp) / "pages"
        (scratch / "q").mkdir(parents=True)
        for item in sorted(Path(queue_dir).iterdir()):
            fm = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name)
            if not fm or fm.group(1) not in qm.CATEGORIES or not (item / "01-متن.md").exists():
                continue
            out["queue_items"] += 1
            cat = fm.group(1)
            des = item / "05-DES-Fidelity" / "des.json"
            sources = []
            if des.exists():
                d = json.loads(des.read_text(encoding="utf-8"))
                sources = d["sources"] if isinstance(d, dict) and "sources" in d else (d if isinstance(d, list) else [d])
            texts = [("fa", (item / "01-متن.md").read_text(encoding="utf-8"))]
            try:
                en = qm.plain(qm.draft(item)).get("body_en")
            except qm.QueueRefusal:
                en = None
            if en:
                texts.append(("en", en))
            if qm.strip_presentation_md(texts[0][1]) == texts[0][1] and oqi.body_lines(item) != qi.body_lines(item):
                out["queue_differences"].append({"item": item.name, "what": "body_lines"})
            for lang, md in texts:
                if qm.strip_presentation_md(md) != md:
                    out["queue_marked_texts"] = out.get("queue_marked_texts", 0) + 1  # same: by design
                    continue
                out["queue_texts"] += 1
                if oqa.blocks(md) != qa.blocks(md):
                    out["queue_differences"].append({"item": item.name, "lang": lang, "what": "blocks"})
                    continue
                try:
                    old_doc = _render_with(oqa, md, cat, lang)
                except Exception as e:  # noqa: BLE001 — a block this category's renderer refused before
                    old_doc = f"REFUSED {type(e).__name__}"
                try:
                    new_doc = _render_with(qa, md, cat, lang)
                except Exception as e:  # noqa: BLE001
                    new_doc = f"REFUSED {type(e).__name__}"
                if old_doc.startswith("REFUSED") and new_doc.startswith("REFUSED"):
                    out["queue_refused_before_and_now"] = out.get("queue_refused_before_and_now", 0) + 1
                    continue
                if old_doc != new_doc:
                    out["queue_differences"].append({"item": item.name, "lang": lang, "what": "rendered html"})
                    continue
                (scratch / "q" / "page.html").write_text(old_doc, encoding="utf-8")
                oU.ROOT = scratch
                try:
                    for legacy in (False, True):
                        a = json.dumps(oU.split_page("q/page", sources, legacy=legacy), ensure_ascii=False, sort_keys=True)
                        b = json.dumps(U.split_html(new_doc, sources, legacy), ensure_ascii=False, sort_keys=True)
                        if a != b:
                            out["queue_differences"].append({"item": item.name, "lang": lang, "what": f"units cut={legacy}"})
                        elif not legacy:
                            out["queue_units"] += a.count('"id"')
                finally:
                    oU.ROOT = ROOT
    out["status"] = "identical" if not (out["page_differences"] or out["queue_differences"]) else "DIFFERENT"
    return out


def _render_with(qa_mod, md, category, lang):
    """render_md with another queue_apply module (the old tools)."""
    body_md = qa_mod.split_tail(md)[0]
    nums = sorted(set(re.findall(r"\[\[(?:تصویر|Image):(\d\d)\]\]", body_md)))
    imgs = {n: {"alt_fa": "", "alt_en": "", "caption_fa": f"تصویر {n}", "caption_en": f"Figure {n}", "w": 1, "h": 1}
            for n in nums}
    url = lambda k: f"/x/{k}.webp"
    if category == "notecast":
        body = qa_mod.render_body(body_md, {}, None, None, lang, "indented", "glossary-link")
    elif category == "insight":
        body = qa_mod.render_insight(body_md, imgs, url, None, lang)
    elif category == "chairside":
        body = qa_mod.render_chairside(body_md, imgs, url, None, lang)
    elif category == "metanote":
        body = qa_mod.render_metanote(body_md, imgs, url, None, lang)
    else:
        body = qa_mod.render_body(body_md, imgs, url, None, lang)
    return f"<main>\n<h1>-</h1>\n{body}\n</main>\n"


# ------------------------------------------------------------------ CLI

def page_sources(content_id):
    if not content_id:
        return []
    rec = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8")).get(content_id) or {}
    return rec.get("sources") or []


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--page", metavar="NEW.html")
    ap.add_argument("--md", metavar="NEW.md")
    ap.add_argument("--queue-item", metavar="DIR")
    ap.add_argument("--text-of-record", metavar="FILE")
    ap.add_argument("--corpus-check", action="store_true")
    ap.add_argument("--old", metavar="FILE", help="the old version (a file)")
    ap.add_argument("--old-ref", metavar="REV", help="the old version: the same path at this git revision")
    ap.add_argument("--old-dir", metavar="DIR", help="--queue-item: a copy of the frozen item")
    ap.add_argument("--content-id", help="--page: the page's content_id when the path does not give it")
    ap.add_argument("--category", help="--md: the queue category (%s)" % ", ".join(qm.CATEGORIES))
    ap.add_argument("--lang", default="fa", choices=("fa", "en"))
    ap.add_argument("--sources", metavar="des.json", help="--md: the item's DES record (for the several-sources rule)")
    ap.add_argument("--restamp", action="store_true", help="--queue-item: rewrite the SHA256SUMS rows (and the "
                    "manifest's English body) once the change is proved presentation-only")
    ap.add_argument("--queue-dir", metavar="DIR", help="--corpus-check: the queue/ folder (default: origin/queue)")
    a = ap.parse_args(argv)
    try:
        if a.text_of_record:
            p = Path(a.text_of_record)
            text = read(p)
            if p.suffix == ".md":
                bad = qm.presentation_md_problems(text)
                if bad:
                    raise Refusal("MARKER_MALFORMED", "; ".join(bad))
                sys.stdout.write(qm.strip_presentation_md(text))
            else:
                bad = vp.presentation_problems(text)
                if bad:
                    raise Refusal("MARKER_MALFORMED", "; ".join(bad))
                # the body only: the title, the date line and the language toggle are the page's frame
                sys.stdout.write("\n".join(text_of_record(FRAME.sub("", lf(text)))[1:]) + "\n")
            return 0
        if a.corpus_check:
            if not a.old_ref:
                ap.error("--corpus-check needs --old-ref")
            out = corpus_check(a.old_ref, a.queue_dir)
            print(json.dumps(out, ensure_ascii=False, indent=1))
            return 0 if out["status"] == "identical" else 3
        if a.queue_item:
            if not (a.old_ref or a.old_dir):
                ap.error("--queue-item needs --old-ref or --old-dir (the frozen version)")
            out = queue_item(a.queue_item, a.old_ref, a.old_dir, a.restamp)
        elif a.page:
            new = Path(a.page)
            cid = a.content_id
            if cid is None:
                try:
                    cid = new.resolve().relative_to(ROOT).with_suffix("").as_posix()
                except ValueError:
                    cid = None
            if a.old:
                old_doc = read(a.old)
            elif a.old_ref:
                data = git_show(new.resolve().parent, a.old_ref, new.name)
                if data is None:
                    raise Refusal("OLD_REF", f"{a.page} does not exist at {a.old_ref}")
                old_doc = data.decode("utf-8")
            else:
                ap.error("--page needs --old or --old-ref")
            out = compare(old_doc, read(new), page_sources(cid), cid)
            out["content_id"] = cid
            out["record"] = ("the stored DES/Fidelity record stays valid as it is: no model call, no re-key"
                             if page_sources(cid) else "no DES record under this content_id")
        elif a.md:
            if not (a.old and a.category):
                ap.error("--md needs --old and --category")
            sources = []
            if a.sources:
                d = json.loads(Path(a.sources).read_text(encoding="utf-8"))
                sources = d["sources"] if isinstance(d, dict) and "sources" in d else (d if isinstance(d, list) else [d])
            out = compare_md(read(a.old), read(a.md), a.category, a.lang, sources)
        else:
            ap.error("one of --page, --md, --queue-item, --text-of-record, --corpus-check")
    except Refusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 3
    except qm.QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 3
    print(json.dumps(out, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
