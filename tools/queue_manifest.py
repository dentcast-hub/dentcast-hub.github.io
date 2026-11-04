#!/usr/bin/env python3
"""Read a publish-queue item into one machine-readable manifest, or refuse.

publish-queue.md: a queue item marked «آماده» is frozen (SHA256SUMS) and
publish day only assembles it. This module is the single reader of an item:

  * `load_item`   — precheck: SHA256SUMS, status «آماده», no foreign lock;
  * `draft`       — the manifest (schema dentcast-queue-manifest/1) built from
                    `12-انتشار.json` when the item has one, otherwise from the
                    exact, known patterns of the frozen files; every value
                    carries its `file:line` origin and every value the
                    patterns cannot read stays `null` (never inferred);
  * `merge_supplement` — the publishing agent may fill a `null` field only,
                    each value with its origin. A value claimed to come from a
                    frozen file must appear verbatim on that line; a value
                    from outside the item is a recorded manual step;
  * `missing`     — every field still `null`, named exactly.

Nothing here writes to the repository or the queue branch.

CLI:
  python3 tools/queue_manifest.py draft <item>            # prints the draft
  python3 tools/queue_manifest.py check <item> [--supplement f.json]
"""
import argparse
import copy
import hashlib
import html
import json
import re
import sys
from pathlib import Path

SCHEMA = "dentcast-queue-manifest/1"
CATEGORIES = ("sharehub", "notecast", "insight", "chairside", "metanote")
MANIFEST_FILE = "12-انتشار.json"
STATUS_FILE = "00-وضعیت.md"


class QueueRefusal(Exception):
    """A precondition failed; nothing may be written."""

    def __init__(self, code, message, **detail):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.detail = {"code": code, "message": message, **detail}


# --------------------------------------------------------------------------- item

def sha256_file(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def check_sums(item):
    """`sha256sum -c SHA256SUMS`. A row for 00-وضعیت.md is tolerated (it moves
    when the item is locked) and reported."""
    sums = item / "SHA256SUMS"
    if not sums.exists():
        raise QueueRefusal("SHA256SUMS_MISSING", f"{item.name}: SHA256SUMS is missing — the item was never frozen")
    rows, tolerated = [], []
    for n, line in enumerate(sums.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        m = re.fullmatch(r"([0-9a-f]{64}) [ *](.+)", line.strip())
        if not m:
            raise QueueRefusal("SHA256SUMS_MALFORMED", f"SHA256SUMS line {n} is not `<sha256>  <path>`")
        digest, rel = m.group(1), m.group(2)
        rel = rel[2:] if rel.startswith("./") else rel
        p = item / rel
        actual = sha256_file(p) if p.exists() else None
        if rel == STATUS_FILE:
            tolerated.append({"file": rel, "matches": actual == digest})
            continue
        if actual != digest:
            raise QueueRefusal("SHA256_MISMATCH", f"{rel} does not match SHA256SUMS — the item goes back to "
                               "«در حال آماده‌سازی» and nothing is rebuilt (publish-queue.md, step 4)",
                               file=rel, expected=digest, actual=actual)
        rows.append(rel)
    return {"checked": rows, "tolerated": tolerated, "sha256sums": sha256_file(sums)}


def status_fields(item):
    p = item / STATUS_FILE
    if not p.exists():
        raise QueueRefusal("STATUS_MISSING", f"{item.name}: {STATUS_FILE} is missing")
    text = p.read_text(encoding="utf-8")
    status = lock = None
    for line in text.splitlines():
        t = re.sub(r"^[\s>*-]+", "", line).replace("*", "").strip()
        if status is None and t.startswith("وضعیت:"):
            status = t.split(":", 1)[1].strip()
        if lock is None and t.startswith("قفل:"):
            lock = t.split(":", 1)[1].strip()
    if lock in (None, "", "-", "—", "ندارد"):
        lock = None
    return {"status": status, "lock": lock, "status_sha256": sha256_file(p)}


def load_item(path, agent=None):
    """Precheck a queue item. `agent` is the lock holder name allowed to own it
    (the publishing agent's own lock); any other lock refuses."""
    item = Path(path).resolve()
    if not item.is_dir():
        raise QueueRefusal("ITEM_NOT_FOUND", f"{path} is not a queue item folder")
    m = re.fullmatch(r"(\d\d)-([a-z]+)-(.+)", item.name)
    if not m:
        raise QueueRefusal("ITEM_NAME", f"{item.name}: expected NN-<category>-<slug>")
    st = status_fields(item)
    s = st["status"] or ""
    if not (s.startswith("آماده") or s.startswith("در حال انتشار")):
        raise QueueRefusal("NOT_READY", f"{item.name}: status is «{s}», not «آماده»")
    if st["lock"] and not (agent and agent in st["lock"]):
        raise QueueRefusal("FOREIGN_LOCK", f"{item.name} is locked by «{st['lock']}» — another agent's item is never taken")
    sums = check_sums(item)
    return {"path": item, "nn": m.group(1), "folder_category": m.group(2), "slug": m.group(3), **st, "sums": sums}


# ------------------------------------------------------------------- md parsing

def lines_of(item, rel):
    p = item / rel
    return p.read_text(encoding="utf-8").splitlines() if p.exists() else None


def section(lines, heading, level=2):
    """Lines under `## heading` (exact heading text) up to the next heading of
    the same or higher level. Returns [(lineno, text)]."""
    out, inside = [], False
    pat = re.compile(r"^(#{1,%d})\s+(.*?)\s*$" % level)
    for n, line in enumerate(lines, 1):
        m = pat.match(line)
        if m:
            if inside and len(m.group(1)) <= level:
                break
            h_ = m.group(2).strip()
            if len(m.group(1)) == level and (h_ == heading or h_.startswith((heading + " (", heading + " —"))):
                inside = True
                continue
        if inside:
            out.append((n, line))
    return out if inside else None


def section_any(lines, heading):
    """`## heading`, else `# heading` (older items title their parts with `#`)."""
    sec = section(lines, heading, 2)
    return sec if sec is not None else section(lines, heading, 1)


PROVENANCE_LINE = re.compile(r"^\s*(?:[-*]\s*)?(?:منشأ|Origin)\s*:")


def single_value(sec):
    """The one non-empty line of a section, or None when absent / several. A
    provenance line («منشأ: …») under the value is a note, not a value."""
    if sec is None:
        return None
    vals = [(n, t.strip()) for n, t in sec if t.strip() and not PROVENANCE_LINE.match(t)]
    return vals[0] if len(vals) == 1 else None


def md_table(lines, start=0):
    """First markdown table at/after line index `start`: (header, rows) where
    rows are [(lineno, cells)]."""
    i = start
    while i < len(lines) and not lines[i].lstrip().startswith("|"):
        i += 1
    if i + 1 >= len(lines) or not re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
        return None, []
    cells = lambda s: [c.strip() for c in s.strip().strip("|").split("|")]
    header = [re.sub(r"\*", "", c) for c in cells(lines[i])]
    rows, j = [], i + 2
    while j < len(lines) and lines[j].lstrip().startswith("|"):
        rows.append((j + 1, cells(lines[j])))
        j += 1
    return header, rows


def col(header, *needles):
    for k, h in enumerate(header or []):
        if any(nd in h for nd in needles):
            return k
    return None


EMPTY = ("", "-", "—", "ندارد")


def cell(row, k):
    if k is None or k >= len(row):
        return None
    v = row[k].strip()
    return v


# ------------------------------------------------------------------- the draft

def V(value, origin):
    return {"value": value, "from": origin}


INPUTS_FILE = "07-ورودی‌ها.md"


def draft(item):
    """The manifest from the frozen files. Fields are {"value","from"}; a field
    whose exact pattern is absent has value None. The legacy path (no
    12-انتشار.json) reads its decisions from 07-ورودی‌ها.md; without that file
    it does not fail: every 07 field stays null, says so in its origin and is
    named by `missing` (a preparation draft may not have written 07 yet)."""
    item = Path(item)
    mf = item / MANIFEST_FILE
    if mf.exists():
        try:
            data = json.loads(mf.read_text(encoding="utf-8"))
        except ValueError as e:
            raise QueueRefusal("MANIFEST_JSON", f"{MANIFEST_FILE} is not valid JSON: {e}")
        if not isinstance(data, dict) or data.get("schema") != SCHEMA:
            raise QueueRefusal("MANIFEST_SCHEMA", f"{MANIFEST_FILE}: schema must be {SCHEMA}")
        return {k: (v if isinstance(v, dict) and "value" in v else V(v, MANIFEST_FILE))
                for k, v in data.items() if k != "schema"} | {"_source": V("manifest", MANIFEST_FILE)}
    d = {"_source": V("legacy", "patterns")}
    fm = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name)
    if not fm:
        raise QueueRefusal("ITEM_NAME", f"{item.name}: expected NN-<category>-<slug>")
    folder_cat = fm.group(1)
    d["category"] = V(folder_cat if folder_cat in CATEGORIES else None, "folder name")
    if not (item / INPUTS_FILE).is_file():
        d["_inputs"] = V(None, f"{INPUTS_FILE} missing: hashtags, pillar, pulse, pathway and the one-paper credit "
                               "stay null (never inferred)")

    # 02 — title and caption
    l02 = lines_of(item, "02-عنوان-کپشن.md") or []
    for key, head in (("title_fa", "عنوان"), ("caption_fa", "کپشن")):
        sv = single_value(section_any(l02, head))
        d[key] = V(sv[1] if sv else None, f"02-عنوان-کپشن.md:{sv[0]}" if sv else "02-عنوان-کپشن.md")

    # 06 — English
    l06 = lines_of(item, "06-انگلیسی.md")
    if l06 is None:
        for k in ("title_en", "caption_en", "body_en"):
            d[k] = V(None, "06-انگلیسی.md missing")
    else:
        for key, head in (("title_en", "Title"), ("caption_en", "Caption")):
            sv = single_value(section_any(l06, head))
            d[key] = V(sv[1] if sv else None, f"06-انگلیسی.md:{sv[0]}" if sv else "06-انگلیسی.md")
        if d["title_en"]["value"] is None:
            # `# <the title>` as the file's first line (no `Title` section)
            first = next(((n, l) for n, l in enumerate(l06, 1) if l.strip()), None)
            if first and re.match(r"^#\s+\S", first[1]) and not re.match(r"^#\s+English\b", first[1], re.I):
                d["title_en"] = V(first[1][1:].strip(), f"06-انگلیسی.md:{first[0]}")
        if d["caption_en"]["value"] is None:
            caps = [(n, m.group(1)) for n, l in enumerate(l06, 1) if (m := re.match(r"^Caption:\s*(.+?)\s*$", l))]
            if len(caps) == 1:
                d["caption_en"] = V(caps[0][1], f"06-انگلیسی.md:{caps[0][0]}")
        body_head = re.compile(r"^#{1,2}\s+(Body|Article)(\s*\(.*\))?\s*$")
        starts = [n for n, l in enumerate(l06) if body_head.match(l.strip())]
        ends = [n for n, l in enumerate(l06) if re.match(r"^#{1,2}\s+(Figure captions|Image captions|Image metadata)\b", l.strip())]
        if len(starts) == 1:
            end = next((e for e in ends if e > starts[0]), len(l06))
            # a final `---` followed only by Persian notes closes the English body
            rules = [n for n in range(starts[0] + 1, end) if re.fullmatch(r"\s*-{3,}\s*", l06[n])]
            if rules:
                after = [l for l in l06[rules[-1] + 1:end] if l.strip()]
                if after and all(re.search(r"[\u0600-\u06FF]", l) for l in after):
                    end = rules[-1]
            # The English body has as many `## ` sections as 01-متن.md; a later
            # `## ` (translator notes and the like) is not page text.
            fa = lines_of(item, "01-متن.md") or []
            k_fa = sum(1 for l in fa if re.match(r"^##\s", l))
            heads = [n for n in range(starts[0] + 1, end) if re.match(r"^##\s", l06[n])]
            if len(heads) > k_fa:
                end = heads[k_fa]
            d["body_en"] = V("\n".join(l06[starts[0] + 1:end]).strip("\n"), f"06-انگلیسی.md:{starts[0] + 2}-{end}")
        else:
            d["body_en"] = V(None, "06-انگلیسی.md: no single `## Body` / `# Article`")
        figs, img_meta = {}, {}
        cap_head = next((l.lstrip("#").strip() for l in l06 if re.match(r"^#{1,2}\s+(Figure captions|Image captions)\b", l)), None)
        for n, l in (section_any(l06, cap_head) if cap_head else []) or []:
            m = re.match(r"^\s*-\s*(?:Image\s+)?(\d\d):\s*(.+?)\s*$", l)
            if m:
                figs[m.group(1)] = (n, m.group(2))
        # `## Image metadata`: «- Alt[ NN]: …» / «- Caption[ NN]: …»
        for n, l in section_any(l06, "Image metadata") or []:
            m = re.match(r"^\s*-\s*(Alt|Caption)(?:\s+(\d\d))?\s*:\s*(.+?)\s*$", l)
            if m:
                img_meta.setdefault(m.group(2) or "*", {})[m.group(1).lower()] = (n, m.group(3))
        d["_figcaps_en"] = V(figs, "06-انگلیسی.md")
        d["_image_meta_en"] = V(img_meta, "06-انگلیسی.md")

    # 03 — images
    d["images"] = draft_images(item, d.get("_figcaps_en", V({}, ""))["value"],
                               d.get("_image_meta_en", V({}, ""))["value"])

    # 04 — on-page credit
    d["credit"] = draft_credit(item, lines_of(item, "07-ورودی‌ها.md") or [])
    cat_rel = "04-منبع/کاتالوگ.json"
    if (item / cat_rel).exists():
        sums_txt = (item / "SHA256SUMS").read_text(encoding="utf-8") if (item / "SHA256SUMS").exists() else ""
        if not re.search(r"\s(?:\./)?%s\s*$" % re.escape(cat_rel), sums_txt, re.M):
            raise QueueRefusal("CATALOG_NOT_FROZEN", f"{cat_rel} is not in SHA256SUMS")
        entries = json.loads((item / cat_rel).read_text(encoding="utf-8"))
        if not isinstance(entries, list) or not all(isinstance(e, dict) for e in entries):
            raise QueueRefusal("CATALOG_SHAPE", f"{cat_rel} must be a list of catalog entries")
        d["catalog"] = V(entries, cat_rel)
    else:
        d["catalog"] = None
    d["catalog"] = d["catalog"] or (V([], "04-منبع/منابع.md: no paper") if (d["credit"]["value"] or {}).get("mode") == "none"
                    else V([{"skip": "catalog Part 2 fields are not frozen in the item; nothing is written to the "
                                      "catalog (a follow-up for the founder, never a publish-day guess)"}],
                           "default: 04-منبع/منابع.md holds no frozen catalog entry"))

    # 07 — hashtags, pillar, pulse (each a known one-line pattern; the line is the origin)
    l07 = lines_of(item, "07-ورودی‌ها.md") or []
    title = d["title_fa"]["value"]
    tags, pillar, sub, pulse = None, None, None, None
    in_pulse = in_pillar = False
    numbered = None  # a numbered hashtag list under «فهرست پیشنهادی/نهایی …»
    for n, l in enumerate(l07, 1):
        t = l.strip()
        if t.startswith("#"):
            in_pulse = bool(re.search(r"Pulse|پالس", t))
            in_pillar = "پیلار" in t
        if re.match(r"^فهرست (?:پیشنهادی|نهایی)", t) and tags is None:
            numbered = (n, [])
            continue
        if numbered is not None and tags is None:
            m = re.match(r"^\d+\.\s*`(#[^`\s]+)`", t)
            if m:
                numbered[1].append(m.group(1))
                continue
            if numbered[1]:
                tags = V(numbered[1], f"07-ورودی‌ها.md:{numbered[0] + 1}-{n - 1}")
            numbered = None
        m = re.match(r"^-\s*پیشنهاد:\s*`([a-z][a-z0-9-]*)`\s*/\s*`([a-z][a-z0-9-]*)`", t)
        if m and in_pillar and pillar is None:
            pillar, sub = (n, m.group(1)), (n, m.group(2))
        m = re.match(r"^`(.*«<a href=\"/[a-z]+/[a-z]+-\d+\.html\">(.+?)</a>».*منتشر شد)`$", t)
        if m and in_pulse and pulse is None and title and m.group(2) == title:
            pulse = (n, "html", re.sub(r'href="/[a-z]+/[a-z]+-\d+\.html"', 'href="{url}"', m.group(1)))
        m = re.match(r"^-\s*فهرست:\s*(#.+)$", t)
        if m and tags is None:
            tags = V(m.group(1).split(), f"07-ورودی‌ها.md:{n}")
        m = re.match(r"^-\s*(?:فهرست نهایی تأییدشده|هشتگ‌های تأییدشده[^:]*)\s*:\s*(.+)$", t)
        if m and tags is None:
            # the list runs to the first sentence end; later sentences are notes
            head = re.split(r"\.(?:\s|$)", m.group(1))[0]
            found = re.findall(r"#[^\s`()،,.·«»]+", head)
            if found:
                tags = V(found, f"07-ورودی‌ها.md:{n}")
        if tags is None and re.fullmatch(r"\[\s*\"#.*\]", t):
            try:
                arr = json.loads(t)
                if all(isinstance(x, str) and x.startswith("#") for x in arr):
                    tags = V(arr, f"07-ورودی‌ها.md:{n}")
            except ValueError:
                pass
        m = re.match(r"^-\s*(?:پیلار|pillar\.primary)\s*:\s*`?([a-z][a-z0-9-]*)`?", t)
        if m and pillar is None:
            pillar = (n, m.group(1))
        m = re.match(r"^-\s*(?:ساب‌تاپیک|pillar\.subtopic)\s*:\s*`?([a-z][a-z0-9-]*)`?", t)
        if m and sub is None:
            sub = (n, m.group(1))
        m = re.search(r"`pillar\.primary:\s*([a-z][a-z0-9-]*)`.*`pillar\.subtopic:\s*([a-z][a-z0-9-]*)`", t)
        if m and pillar is None:
            pillar, sub = (n, m.group(1)), (n, m.group(2))
        m = re.match(r"^-\s*پیلار/ساب‌تاپیک\s*:\s*([a-z][a-z0-9-]*)\s*/\s*([a-z][a-z0-9-]*)", t)
        if m and pillar is None:
            pillar, sub = (n, m.group(1)), (n, m.group(2))
        m = re.match(r"^-\s*متن دقیق:\s*«(.+)»\s*با لینک به صفحهٔ تازه", t)
        if m and pulse is None:
            pulse = (n, m.group(1))
        m = re.match(r"^-\s*متن دقیق \(لینک روی کل عنوان\):\s*(.+?)\s*$", t)
        if m and pulse is None:
            pulse = (n, None, m.group(1))
        m = re.match(r"^-\s*پالس:\s*همان عنوان\s*«(.+?)»\s*با لینک روی کل عنوان", t)
        if m and pulse is None:
            pulse = (n, m.group(1))
        m = re.match(r"^-\s*جمله:\s*«(.+)»\s*$", t)
        if m and pulse is None and in_pulse:
            pulse = (n, None, m.group(1))
        m = re.search(r"«<a href=\"(/[a-z]+/[a-z]+-)\{N\}\.html\">\{عنوان تأییدشده\}</a>»", t)
        if m and pulse is None and re.search(r"Pulse|پالس", t):
            tpl = re.search(r":\s*([^:]*«<a href=.*?</a>»[^—]*?)\s*(?:—|$)", t)
            if tpl:
                pulse = (n, "html", tpl.group(1).strip())
    d["hashtags"] = tags or V(None, "07-ورودی‌ها.md: no hashtag list line")
    d["mint"] = V([], "07-ورودی‌ها.md (legacy items mint nothing unless a supplement orders it)")
    # a frozen hashtag batch (in SHA256SUMS, with «concepts») orders the mint of
    # the approved tags it defines; its cabinet bridge is the «- bridge: کلید «…»
    # به library tags موجود a و b» line of 07
    sums = (item / "SHA256SUMS").read_text(encoding="utf-8") if (item / "SHA256SUMS").exists() else ""
    for rel in re.findall(r"^[0-9a-f]{64} [ *](?:\./)?(\S+\.json)\s*$", sums, re.M):
        try:
            batch = json.loads((item / rel).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        defined = [c.get("tag") for c in batch.get("concepts") or [] if isinstance(c, dict)] if isinstance(batch, dict) else []
        ordered = [t for t in (tags["value"] if tags else []) if t in defined]
        if ordered:
            d["mint"] = V(ordered, f"{rel} (frozen batch; tags in the approved list)")
            d["mint_batch"] = V(rel, "SHA256SUMS")
            break
    for n, l in enumerate(l07, 1):
        m = re.match(r"^-\s*bridge:\s*کلید\s*«([^»]+)»\s*به library tags موجود\s*([^؛.]+)", l.strip())
        if m:
            lib = re.findall(r"[a-z][a-z0-9-]+", m.group(2))
            if lib:
                d["bridge"] = V({"map": {m.group(1): lib}}, f"07-ورودی‌ها.md:{n}")
            break
    d["pillar"] = V({"primary": pillar[1], "subtopic": sub[1] if sub else None, "secondary": []},
                    f"07-ورودی‌ها.md:{pillar[0]}") if pillar else V(None, "07-ورودی‌ها.md: no pillar line")
    if pulse and len(pulse) == 3 and pulse[1] == "html" and title:
        html_ = re.sub(r'href="(/[a-z]+/[a-z]+-)\{N\}\.html"', 'href="{url}"', pulse[2]).replace("{عنوان تأییدشده}", html.escape(title, quote=False))
        if f">{html.escape(title, quote=False)}</a>" not in html_:
            html_ = ""
        html_ = html_.strip()
        if html_.endswith("منتشر شد") or html_.endswith("منتشر شد."):
            d["pulse"] = V({"html": html_, "link_phrase": title}, f"07-ورودی‌ها.md:{pulse[0]}")
        else:
            d["pulse"] = V(None, "07-ورودی‌ها.md: pulse template not closed by «منتشر شد»")
    elif pulse and len(pulse) == 3 and title and f"«{title}»" in pulse[2] and "<" not in pulse[2]:
        d["pulse"] = V({"text": pulse[2], "link_phrase": title}, f"07-ورودی‌ها.md:{pulse[0]}")
    elif pulse and len(pulse) == 2 and title and pulse[1] == title:
        d["pulse"] = V({"text": None, "link_phrase": title}, f"07-ورودی‌ها.md:{pulse[0]}")
    else:
        d["pulse"] = V(None, "07-ورودی‌ها.md: pulse text is not the plain title pattern")

    # 09 — keywords
    l09 = lines_of(item, "09-کلیدواژه‌ها.md")
    d["keywords"] = V(keyword_lines(l09), "09-کلیدواژه‌ها.md")

    # 11 — the in-body link table (prose decisions are NOT read: see legacy_review)
    d["links_48"] = draft_links(item)
    d["backlinks_47"] = draft_backlinks(item)
    d["explore_49"] = draft_explore(item)
    d["pathway"] = draft_pathway(l07)
    d["author"] = V(None, "not in the legacy contract")
    d["legacy_review"] = V(None, "11-لینک‌های-گلاسری.md and 00-وضعیت.md hold prose decisions")
    return d


def split_sources_tail(md):
    """A final `---` followed only by bare source-link lines (a DOI link, a
    `doi:` line) is the sources tail of an older item: on the page the sources
    show through the credit (linked first-author name / «منابع» list), never as
    a bare DOI line. Returns (body, tail_lines)."""
    lines = md.rstrip("\n").split("\n")
    idx = [i for i, l in enumerate(lines) if re.fullmatch(r"\s*(-{3,}|\*{3,}|_{3,})\s*", l)]
    if idx:
        tail = [l for l in lines[idx[-1] + 1:] if l.strip()]
        if tail and all(re.fullmatch(r"\s*(-\s*)?\[[^\]]+\]\(https?://[^)]+\)\s*", l) or
                        re.fullmatch(r"\s*doi:\S+\s*", l) for l in tail):
            return "\n".join(lines[:idx[-1]]).rstrip("\n"), tail
    return md, []


def keyword_lines(lines):
    """09: one keyword per line. A file with a heading/prose carries its
    keywords as the one `- ` list; anything else is not read."""
    if not lines:
        return None
    rows = [l.strip() for l in lines if l.strip() and not PROVENANCE_LINE.match(l)]
    if any(r.startswith("- ") for r in rows):
        if any(r.startswith("#") for r in rows):
            items = [r[2:].strip() for r in rows if r.startswith("- ")]
            return items or None
        return None
    heads = [r for r in rows if r.startswith("#")]
    if heads and not all("کلیدواژه" in h for h in heads):
        return None  # prose under another heading is not a keyword list
    rows = [r for r in rows if not r.startswith("#")]
    return rows or None


PROVENANCE_PAREN = re.compile(r"\s*\((?=[^()]*(?:عیناً|تأیید|منشأ|نام روز انتشار|from the|approved))[^()]*\)\s*$")


def clean_value(v):
    """A bullet value as written, minus code ticks and a trailing provenance
    note in parentheses («(عیناً از alt داک)», «(تأیید …)»): a note says where
    the value came from, it is not part of the value."""
    v = (v or "").strip().strip("`").strip()
    return PROVENANCE_PAREN.sub("", v).strip()


def image_bullets(lines):
    """The bullet form of 03: `## تصویر NN` then «- فایل:», «- Alt فارسی:»,
    «- Alt انگلیسی:», «- زیرنویس:». Returns {NN: {key: (lineno, value)}}."""
    out, cur = {}, None
    for n, l in enumerate(lines, 1):
        m = re.match(r"^#{2,3}\s*تصویر\s*([0-9۰-۹]{2})\b", l.strip())
        if m:
            cur = m.group(1).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
            out[cur] = {}
            continue
        if re.match(r"^#", l):
            cur = None
            continue
        m = re.match(r"^\s*-\s*([^:：]+?)\s*:\s*(.*?)\s*$", l)
        if cur and m:
            key = m.group(1).strip().lower()
            k = {"فایل": "file", "alt فارسی": "alt_fa", "alt انگلیسی": "alt_en", "زیرنویس": "caption_fa"}.get(key)
            if k and k not in out[cur]:
                out[cur][k] = (n, m.group(2))
    return out


def draft_images(item, figcaps_en, meta_en=None):
    rel = "03-تصاویر/تصاویر.md"
    lines = lines_of(item, rel)
    files = sorted(p for p in (item / "03-تصاویر").glob("*") if p.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg")) \
        if (item / "03-تصاویر").exists() else []
    if not files:
        return V([], "03-تصاویر: no image files")
    if lines is None:
        return V(None, f"{rel} missing")
    meta_en = meta_en or {}
    header, rows = md_table(lines)
    kn = col(header, "شماره")
    kalt, kcap, kalten = col(header, "alt فارسی"), col(header, "زیرنویس"), col(header, "alt انگلیسی")
    found = {}
    for n, row in rows:
        num = cell(row, kn)
        if not num or not re.fullmatch(r"\d\d", num):
            continue
        match = [p for p in files if p.name.startswith(num + "-")]
        found[num] = {"n": num,
                      "file": V(f"03-تصاویر/{match[0].name}" if len(match) == 1 else None, f"{rel}:{n}"),
                      "alt_fa": V(cell(row, kalt) if kalt is not None and cell(row, kalt) not in EMPTY else None, f"{rel}:{n}"),
                      "caption_fa": V(None if kcap is None else (cell(row, kcap) if cell(row, kcap) not in EMPTY else ""), f"{rel}:{n}"),
                      "alt_en": V(cell(row, kalten) if kalten is not None and cell(row, kalten) not in EMPTY else None, f"{rel}:{n}")}
    if not found:
        for num, kv in image_bullets(lines).items():
            img = {"n": num}
            fn = kv.get("file")
            name = re.search(r"[\w.-]+\.(?:webp|png|jpe?g)", fn[1], re.I) if fn else None
            match = [p for p in files if name and p.name == name.group(0)]
            img["file"] = V(f"03-تصاویر/{match[0].name}" if len(match) == 1 else None,
                            f"{rel}:{fn[0]}" if fn else rel)
            for k in ("alt_fa", "alt_en"):
                v = clean_value(kv[k][1]) if k in kv else ""
                img[k] = V(v or None, f"{rel}:{kv[k][0]}" if k in kv else rel)
            if "caption_fa" in kv:
                v = clean_value(kv["caption_fa"][1])
                img["caption_fa"] = V("" if v in EMPTY or v.startswith("ندارد") else v, f"{rel}:{kv['caption_fa'][0]}")
            else:
                img["caption_fa"] = V(None, rel)
            found[num] = img
    # captions written once for all images under the table:
    # «زیرنویس: … ۰۱ «…»؛ ۰۲ «…»» or «- زیرنویس نمایان (تازه) ندارد»
    fa2en = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")
    for n, l in enumerate(lines, 1):
        t = l.strip()
        if re.match(r"^-?\s*زیرنویس نمایان(?: تازه)? ندارد", t):
            for img in found.values():
                if img["caption_fa"]["value"] is None:
                    img["caption_fa"] = V("", f"{rel}:{n}")
        elif t.startswith("زیرنویس:"):
            for num, cap in re.findall(r"([0-9۰-۹]{2})\s*«([^»]+)»", t):
                img = found.get(num.translate(fa2en))
                if img and img["caption_fa"]["value"] is None:
                    img["caption_fa"] = V(cap, f"{rel}:{n}")
    out = []
    for p in files:
        num = p.name[:2]
        img = found.get(num) or {"n": num, "file": V(f"03-تصاویر/{p.name}", f"03-تصاویر/{p.name}"),
                                 "alt_fa": V(None, rel), "caption_fa": V(None, rel), "alt_en": V(None, rel)}
        one = meta_en.get(num) or (meta_en.get("*") if len(files) == 1 else None) or {}
        if img["alt_en"]["value"] is None and "alt" in one:
            img["alt_en"] = V(one["alt"][1], f"06-انگلیسی.md:{one['alt'][0]}")
        cap_en = figcaps_en.get(num) or one.get("caption")
        if img["caption_fa"]["value"] == "":
            img["caption_en"] = V("", f"{img['caption_fa']['from']} (no caption)")
        else:
            img["caption_en"] = V(cap_en[1] if cap_en else None, f"06-انگلیسی.md:{cap_en[0]}" if cap_en else "06-انگلیسی.md")
        out.append(img)
    # every image file has an entry (fields the item does not give stay null and
    # are named by `missing`, so a supplement can fill them — never a dead end)
    return V(out, rel)


def draft_credit(item, l07=()):
    rel = "04-منبع/منابع.md"
    lines = lines_of(item, rel)
    if lines is None:
        return V(None, f"{rel} missing")
    sec_start = next((i for i, l in enumerate(lines) if l.strip() == "## نمایش منابع روی صفحه (C.2)"), None)
    if sec_start is not None:
        header, rows = md_table(lines, sec_start)
        kfa, ken, kh = col(header, "متن لینک فارسی"), col(header, "متن لینک انگلیسی"), col(header, "لینک")
        if kh == kfa or kh == ken:
            kh = next((k for k, h in enumerate(header) if h.strip() == "لینک"), None)
        items = [{"label_fa": cell(r, kfa), "label_en": cell(r, ken), "href": cell(r, kh), "from": f"{rel}:{n}"}
                 for n, r in rows]
        if items and all(i["label_fa"] and i["label_en"] and (i["href"] or "").startswith("http") for i in items):
            return V({"mode": "references", "items": items}, f"{rel}:{sec_start + 1}")
        return V(None, f"{rel}: «نمایش منابع روی صفحه» table incomplete")
    first = next((l.strip() for l in lines if l.strip() and not l.startswith("#")), "")
    no_paper = (first.startswith("ندارد:") or first.startswith("پیپر ندارد")
                or any(re.match(r"^\|\s*—\s*\|(\s*—\s*\|)+\s*$", l) for l in lines))
    if no_paper:
        n = next(i for i, l in enumerate(lines, 1) if l.strip() and not l.startswith("#"))
        return V({"mode": "none"}, f"{rel}:{n}")
    # one paper: «… نویسندهٔ اول «<name>» (…) با لینک https://doi.org/…» in 07 (module 06 Part 3)
    for n, l in enumerate(l07, 1):
        m = re.search(r"نویسندهٔ اول\s*«([^»]+)»[^«]*?با لینک\s*(https://doi\.org/\S+?)\.?\s*$", l.strip())
        if m:
            return V({"mode": "author-doi", "label_fa": m.group(1), "label_en": m.group(1), "href": m.group(2)},
                     f"07-ورودی‌ها.md:{n}")
    return V(None, f"{rel}: the on-page credit label (first author's display name) is not in the legacy contract")


def draft_pathway(l07):
    """5.6 frozen choices in 07: under a `## …مسیر…` heading, bullets naming a
    pathway id in code ticks and «درج/افزودن پس از `<content_id>`». A bullet
    that says the pathway is not proposed («پیشنهاد نمی‌شود») is not a choice."""
    out, inside = [], False
    for n, l in enumerate(l07 or [], 1):
        t = l.strip()
        if t.startswith("#"):
            inside = t.startswith("##") and "مسیر" in t and "آزمون" not in t
            continue
        if not inside or not t.startswith("-") or "پیشنهاد نمی‌شود" in t:
            continue
        m = re.match(r"^-\s*(?:[^`]*?:\s*)?`([a-z][a-z0-9-]*)`[^`]*?(?:درج|افزودن)\s+پس از\s+`([a-z]+/[A-Za-z0-9-]+)`", t)
        if m:
            out.append({"id": m.group(1), "after": m.group(2), "from": f"07-ورودی‌ها.md:{n}"})
    if out:
        return V(out, out[0]["from"])
    return V(None, "default: mechanical pathway rule")


def heading_block(lines, prefix):
    """(start index, end index) of the `## <prefix>…` section."""
    start = next((i for i, l in enumerate(lines) if re.match(r"^##\s*" + re.escape(prefix), l)), None)
    if start is None:
        return None, None
    end = next((j for j in range(start + 1, len(lines)) if re.match(r"^#{1,2}\s", lines[j])), len(lines))
    return start, end


def draft_links(item):
    """4.8: the decision table («عبارت عیناً» / «عبارت عین متن», «هدف»,
    «تصمیم…»), or the bullet forms «- **عبارت:** «…»» + «- **مقصد:**» +
    «- **تصمیم:** لینک…», or «- لینک N (…): نخستین «…» … ← /path.html»."""
    rel = "11-لینک‌های-گلاسری.md"
    lines = lines_of(item, rel)
    if lines is None:
        return V([], f"{rel} missing: no in-body links")
    start, end = heading_block(lines, "4.8")
    if start is None:
        return V(None, f"{rel}: no `## 4.8` section")
    header, rows = md_table(lines[:end], start)
    out = []
    if header:
        kp, kt, kd = col(header, "عبارت عین"), col(header, "هدف"), col(header, "تصمیم")
        if None in (kp, kt, kd):
            return V(None, f"{rel}: 4.8 table columns not recognised")
        for n, r in rows:
            if not (cell(r, kd) or "").startswith("لینک"):
                continue
            href = re.search(r"(/[A-Za-z0-9_./-]+\.html|queue:\d\d)", cell(r, kt) or "")
            if not href:
                return V(None, f"{rel}:{n}: no target path")
            out.append({"phrase": cell(r, kp), "href": href.group(1), "from": f"{rel}:{n}"})
        return V(out, f"{rel}:{start + 1}")
    cur = {}
    for k in range(start + 1, end):
        t, n = lines[k].strip(), k + 1
        m = re.match(r"^-\s*\*\*عبارت:\*\*\s*«([^»]+)»", t)
        if m:
            cur = {"phrase": m.group(1), "from": f"{rel}:{n}"}
            continue
        m = re.match(r"^-\s*\*\*مقصد:\*\*\s*`?(/[A-Za-z0-9_./-]+\.html|queue:\d\d)`?", t)
        if m and cur:
            cur["href"] = m.group(1)
            continue
        m = re.match(r"^-\s*\*\*تصمیم:\*\*\s*(.*)$", t)
        if m and cur.get("href"):
            if m.group(1).startswith("لینک"):
                out.append(cur)
            cur = {}
            continue
        m = re.match(r"^-\s*لینک\s*\S+\s*\([^)]*\)\s*:\s*نخستین\s*«([^»]+)».*?←\s*(/[A-Za-z0-9_./-]+\.html)", t)
        if m:
            out.append({"phrase": m.group(1), "href": m.group(2), "from": f"{rel}:{n}"})
    if not out:
        return V(None, f"{rel}: 4.8 decisions not in a known form")
    return V(out, f"{rel}:{start + 1}")


def draft_backlinks(item):
    """4.7 decisions with their frozen link text: a table row («اصطلاح»,
    «هدف…» = /glossary/<term>.html, «متن لینک», «تصمیم» starting «لینک»), or
    «- **`term` — `/glossary/term.html`: لینک.** … متن لینک در «کاوش بیشتر»: «…»».
    Anything else is not a frozen back-link: nothing is added."""
    rel = "11-لینک‌های-گلاسری.md"
    lines = lines_of(item, rel) or []
    start, end = heading_block(lines, "4.7")
    if start is None:
        return V([], f"default: {rel} has no 4.7 section — no back-link is added")
    out = []
    header, rows = md_table(lines[:end], start)
    kt, ka, kd = col(header, "هدف"), col(header, "متن لینک"), col(header, "تصمیم")
    if header and None not in (kt, ka, kd):
        for n, r in rows:
            term = re.search(r"/glossary/([a-z0-9-]+)\.html", cell(r, kt) or "")
            if term and (cell(r, kd) or "").startswith("لینک") and cell(r, ka):
                out.append({"term": term.group(1), "anchor": cell(r, ka), "from": f"{rel}:{n}"})
    for k in range(start + 1, end):
        t = lines[k].strip()
        m = re.match(r"^-\s*\*\*`([a-z0-9-]+)`\s*—\s*`/glossary/\1\.html`:\s*لینک\.?\*\*", t)
        a = re.search(r"متن لینک در «کاوش بیشتر»:\s*«([^»]+)»", t)
        if m and a:
            out.append({"term": m.group(1), "anchor": a.group(1), "from": f"{rel}:{k + 1}"})
    return V(out, f"{rel}:{start + 1}" if out else f"default: {rel} 4.7 has no frozen back-link with its link text — none is added")


def draft_explore(item):
    """4.9: only a frozen selection («N. `/path.html` — «label» … تصمیم ثبت‌شده: لینک.»).
    4.9 is otherwise live on publish day and the queue lane adds nothing."""
    rel = "11-لینک‌های-گلاسری.md"
    lines = lines_of(item, rel) or []
    start, end = heading_block(lines, "4.9")
    out = []
    if start is not None:
        for k in range(start + 1, end):
            t = lines[k].strip()
            m = re.match(r"^\d+\.\s*`(/[A-Za-z0-9_./-]+\.html|queue:\d\d)`\s*—\s*«([^»]+)»", t)
            if m and "تصمیم ثبت‌شده: لینک" in t:
                out.append({"href": m.group(1), "label": m.group(2), "from": f"{rel}:{k + 1}"})
    return V(out, f"{rel}:{start + 1}" if out else "default: no frozen 4.9 selection — nothing is added (queue-route: 4.9 only a frozen choice)")


# ------------------------------------------------------------ supplement / check

REQUIRED = ("category", "title_fa", "caption_fa", "title_en", "caption_en", "body_en", "images", "credit",
            "catalog", "hashtags", "pillar", "pulse", "keywords", "links_48", "explore_49", "backlinks_47",
            )


# A category whose page carries more frozen words than the common set.
# MetaNote (metanotes/meta-<n>): the JSON-LD alternativeHeadline, the
# articleSection, the Persian page keywords (fa) and the English page keywords
# (en); brain «keywords» stay the 09 list.
REQUIRED_BY_CATEGORY = {
    "metanote": ("alt_headline_fa", "alt_headline_en", "article_section", "keywords_fa", "keywords_en"),
}


# Fields whose words appear on the page: their values come from the frozen item
# or not at all. A publish-day origin for a non-empty text here is refused —
# the agent writes no text on publish day (queue-route.md).
PAGE_TEXT = {"title_fa", "caption_fa", "title_en", "caption_en", "body_en", "pulse", "keywords", "hashtags",
             "credit", "explore_49", "backlinks_47", "links_48", "alt_fa", "alt_en", "caption_fa", "caption_en",
             "alt_headline_fa", "alt_headline_en", "article_section", "keywords_fa", "keywords_en"}
# Structural keys: a fixed vocabulary of the manifest, never words on a line.
STRUCTURAL = {"from", "mode", "n"}


def origin_lines(item, origin):
    """The text of `<file>:<line>` or `<file>:<a>-<b>` inside the item, else None."""
    m = re.fullmatch(r"(.+?):(\d+)(?:-(\d+))?", origin or "")
    if not m or not (Path(item) / m.group(1)).is_file():
        return None
    rows = (Path(item) / m.group(1)).read_text(encoding="utf-8").splitlines()
    a, b = int(m.group(2)), int(m.group(3) or m.group(2))
    if not 1 <= a <= b <= len(rows):
        raise QueueRefusal("SUPPLEMENT_ORIGIN_RANGE", f"{origin}: no such line(s) in the item", origin=origin)
    return "\n".join(rows[a - 1:b])


def texts_of(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [t for x in value for t in texts_of(x)]
    if isinstance(value, dict):
        return [t for k, v in value.items() if k not in STRUCTURAL for t in texts_of(v)]
    return []


def verify_origin(item, value, origin):
    """A supplemented value that claims a frozen file must appear on that line
    (or line range): every string in it, structural keys aside. Returns None
    when the origin is outside the item (a recorded manual step)."""
    text = origin_lines(item, origin)
    if text is None:
        return None
    for t in texts_of(value):
        if t and t not in text and not t.startswith(("/", "http")):
            raise QueueRefusal("SUPPLEMENT_NOT_VERBATIM", f"«{t[:60]}» is not on {origin}", origin=origin)
    return True


def guard_text(field, value, origin_ok):
    if origin_ok is None and field.split(".")[-1] in PAGE_TEXT and any(t.strip() for t in texts_of(value)):
        raise QueueRefusal("SUPPLEMENT_TEXT_NOT_FROZEN",
                           f"{field}: page text from outside the frozen item — the agent writes no text on publish "
                           "day; the item goes back to «در حال آماده‌سازی» to freeze it", field=field)


def is_default(entry):
    return str((entry or {}).get("from", "")).startswith("default:")


def merge_supplement(item, d, supplement):
    """Fill null fields only (or replace a mechanical default with a value read
    from the item). Each supplied field: {"value": …, "from": "<file:line[-line]>"
    | "publish-day: <why>"}. Images take per-image keys:
    {"images": {"01": {"alt_en": {...}}}}."""
    d = copy.deepcopy(d)
    manual = []
    for key, spec in (supplement or {}).items():
        if key == "images":
            imgs = d["images"]["value"] or []
            for num, fields in spec.items():
                img = next((i for i in imgs if i["n"] == num), None)
                if img is None:
                    raise QueueRefusal("SUPPLEMENT_IMAGE", f"no image {num} in the item (03-تصاویر has "
                                       f"{[i['n'] for i in imgs]})")
                for f, s_ in fields.items():
                    if img.get(f, {}).get("value") is not None:
                        raise QueueRefusal("SUPPLEMENT_OVERRIDES_FROZEN", f"image {num}.{f} is already read from the item")
                    ok = verify_origin(item, s_["value"], s_.get("from"))
                    guard_text(f"images.{num}.{f}", s_["value"], ok)
                    if ok is None:
                        manual.append({"field": f"images.{num}.{f}", "from": s_.get("from")})
                    img[f] = {"value": s_["value"], "from": s_.get("from")}
            continue
        if not isinstance(spec, dict) or "value" not in spec or not spec.get("from"):
            raise QueueRefusal("SUPPLEMENT_SHAPE", f"supplement {key}: needs {{\"value\", \"from\"}}")
        cur_entry = d.get(key, {})
        cur = cur_entry.get("value")
        if key == "links_48" and cur is not None:
            # additions only: rows the 4.8 table already holds stay as read
            have = {(x["phrase"], x["href"]) for x in cur}
            add = [x for x in spec["value"] if (x["phrase"], x["href"]) not in have]
            spec = {"value": cur + add, "from": spec["from"]}
        elif cur is not None and key not in ("legacy_review", "mint"):
            if not is_default(cur_entry):
                raise QueueRefusal("SUPPLEMENT_OVERRIDES_FROZEN", f"{key} is already read from the item ({cur_entry['from']})")
            if origin_lines(item, spec["from"]) is None and not all(
                    isinstance(x, dict) and origin_lines(item, x.get("from")) is not None for x in spec["value"] or [None]):
                raise QueueRefusal("SUPPLEMENT_OVERRIDES_DEFAULT",
                                   f"{key}: a mechanical default ({cur_entry['from']}) is replaced only by a value "
                                   "read from the item (file:line), never by a publish-day choice")
        if isinstance(spec["value"], list) and any(isinstance(x, dict) and x.get("from") for x in spec["value"]):
            for x in spec["value"]:
                if isinstance(x, dict) and x.get("from"):
                    ok = verify_origin(item, x, x["from"])
                    guard_text(key, x, ok)
                    if ok is None:
                        manual.append({"field": key, "from": x["from"]})
        else:
            ok = verify_origin(item, spec["value"], spec["from"])
            guard_text(key, spec["value"], ok)
            if ok is None:
                manual.append({"field": key, "from": spec["from"]})
        d[key] = {"value": spec["value"], "from": spec["from"]}
    d["_manual"] = {"value": manual, "from": "supplement"}
    return d


def defaults_of(d):
    """Every field the item left to a mechanical default (receipt: mechanical_defaults)."""
    return [{"field": k, "rule": v["from"][len("default:"):].strip(), "value": v["value"]}
            for k, v in d.items() if isinstance(v, dict) and is_default(v)]


def missing(d):
    cat = (d.get("category") or {}).get("value")
    out = [k for k in REQUIRED + REQUIRED_BY_CATEGORY.get(cat, ()) if (d.get(k) or {}).get("value") is None]
    for img in d.get("images", {}).get("value") or []:
        out += [f"images.{img['n']}.{f}" for f in ("file", "alt_fa", "alt_en", "caption_fa", "caption_en")
                if img.get(f, {}).get("value") is None]
    return out


def plain(d):
    """Strip origins: the manifest the assembler consumes."""
    out = {}
    for k, v in d.items():
        if k == "images" and isinstance(v.get("value"), list):
            out[k] = [{kk: (vv["value"] if isinstance(vv, dict) and "value" in vv else vv) for kk, vv in i.items()}
                      for i in v["value"]]
        else:
            out[k] = v["value"] if isinstance(v, dict) and "value" in v else v
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=("draft", "check"))
    ap.add_argument("item")
    ap.add_argument("--supplement")
    ap.add_argument("--agent", help="the publishing agent's own lock name")
    a = ap.parse_args()
    try:
        info = load_item(a.item, agent=a.agent) if a.cmd == "check" else {"path": Path(a.item)}
        d = draft(info["path"])
        if a.supplement:
            d = merge_supplement(info["path"], d, json.loads(Path(a.supplement).read_text(encoding="utf-8")))
    except QueueRefusal as e:
        print(json.dumps({"status": "refused", **e.detail}, ensure_ascii=False, indent=1))
        return 2
    miss = missing(d)
    print(json.dumps({"status": "complete" if not miss else "incomplete", "missing": miss, "draft": d},
                     ensure_ascii=False, indent=1))
    return 0 if not miss else 4


if __name__ == "__main__":
    sys.exit(main())
