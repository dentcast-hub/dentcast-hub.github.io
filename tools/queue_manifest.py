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
            if len(m.group(1)) == level and m.group(2).strip() == heading:
                inside = True
                continue
        if inside:
            out.append((n, line))
    return out if inside else None


def single_value(sec):
    """The one non-empty line of a section, or None when absent / several."""
    if sec is None:
        return None
    vals = [(n, t.strip()) for n, t in sec if t.strip()]
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


def draft(item):
    """The manifest from the frozen files. Fields are {"value","from"}; a field
    whose exact pattern is absent has value None."""
    item = Path(item)
    mf = item / MANIFEST_FILE
    if mf.exists():
        data = json.loads(mf.read_text(encoding="utf-8"))
        if data.get("schema") != SCHEMA:
            raise QueueRefusal("MANIFEST_SCHEMA", f"{MANIFEST_FILE}: schema must be {SCHEMA}")
        return {k: (v if isinstance(v, dict) and "value" in v else V(v, MANIFEST_FILE))
                for k, v in data.items() if k != "schema"} | {"_source": V("manifest", MANIFEST_FILE)}
    d = {"_source": V("legacy", "patterns")}
    folder_cat = re.fullmatch(r"\d\d-([a-z]+)-.+", item.name).group(1)
    d["category"] = V(folder_cat if folder_cat in CATEGORIES else None, "folder name")

    # 02 — title and caption
    l02 = lines_of(item, "02-عنوان-کپشن.md") or []
    for key, head in (("title_fa", "عنوان"), ("caption_fa", "کپشن")):
        sv = single_value(section(l02, head))
        d[key] = V(sv[1] if sv else None, f"02-عنوان-کپشن.md:{sv[0]}" if sv else "02-عنوان-کپشن.md")

    # 06 — English
    l06 = lines_of(item, "06-انگلیسی.md")
    if l06 is None:
        for k in ("title_en", "caption_en", "body_en"):
            d[k] = V(None, "06-انگلیسی.md missing")
    else:
        for key, head in (("title_en", "Title"), ("caption_en", "Caption")):
            sv = single_value(section(l06, head))
            d[key] = V(sv[1] if sv else None, f"06-انگلیسی.md:{sv[0]}" if sv else "06-انگلیسی.md")
        starts = [n for n, l in enumerate(l06) if l.strip() == "## Body"]
        ends = [n for n, l in enumerate(l06) if l.strip() == "## Figure captions"]
        if len(starts) == 1:
            end = ends[0] if ends and ends[0] > starts[0] else len(l06)
            d["body_en"] = V("\n".join(l06[starts[0] + 1:end]).strip("\n"), f"06-انگلیسی.md:{starts[0] + 2}-{end}")
        else:
            d["body_en"] = V(None, "06-انگلیسی.md: no single `## Body`")
        figs = {}
        for n, l in (section(l06, "Figure captions") or []):
            m = re.match(r"^\s*-\s*(\d\d):\s*(.+?)\s*$", l)
            if m:
                figs[m.group(1)] = (n, m.group(2))
        d["_figcaps_en"] = V(figs, "06-انگلیسی.md")

    # 03 — images
    d["images"] = draft_images(item, d.get("_figcaps_en", V({}, ""))["value"])

    # 04 — on-page credit
    d["credit"] = draft_credit(item)
    d["catalog"] = V(None, "04-منبع/منابع.md (catalog fields are not in the legacy contract)")

    # 07 — hashtags, pillar, pulse
    l07 = lines_of(item, "07-ورودی‌ها.md") or []
    tags, pillar, sub, pulse = None, None, None, None
    for n, l in enumerate(l07, 1):
        t = l.strip()
        m = re.match(r"^-\s*فهرست:\s*(#.+)$", t)
        if m and tags is None:
            tags = V(m.group(1).split(), f"07-ورودی‌ها.md:{n}")
        m = re.match(r"^-\s*پیلار:\s*`?([a-z][a-z0-9-]*)`?", t)
        if m and pillar is None:
            pillar = (n, m.group(1))
        m = re.match(r"^-\s*ساب‌تاپیک:\s*`?([a-z][a-z0-9-]*)`?", t)
        if m and sub is None:
            sub = (n, m.group(1))
        m = re.match(r"^-\s*متن دقیق:\s*«(.+)»\s*با لینک به صفحهٔ تازه", t)
        if m and pulse is None:
            pulse = (n, m.group(1))
    d["hashtags"] = tags or V(None, "07-ورودی‌ها.md: no «- فهرست: #…» line")
    d["mint"] = V([], "07-ورودی‌ها.md (legacy items mint nothing unless a supplement orders it)")
    d["pillar"] = V({"primary": pillar[1], "subtopic": sub[1] if sub else None, "secondary": []},
                    f"07-ورودی‌ها.md:{pillar[0]}") if pillar else V(None, "07-ورودی‌ها.md: no «- پیلار:» line")
    title = d["title_fa"]["value"]
    if pulse and title and pulse[1] == title:
        d["pulse"] = V({"text": None, "link_phrase": title}, f"07-ورودی‌ها.md:{pulse[0]}")
    else:
        d["pulse"] = V(None, "07-ورودی‌ها.md: pulse text is not the plain title pattern")

    # 09 — keywords
    l09 = lines_of(item, "09-کلیدواژه‌ها.md")
    d["keywords"] = V(keyword_lines(l09), "09-کلیدواژه‌ها.md")

    # 11 — the in-body link table (prose decisions are NOT read: see legacy_review)
    d["links_48"] = draft_links(item)
    for k in ("explore_49", "backlinks_47"):
        d[k] = V(None, "11-لینک‌های-گلاسری.md (prose; legacy review)")
    d["pathway"] = V(None, "default: mechanical pathway rule")
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
    rows = [l.strip() for l in lines if l.strip()]
    if any(r.startswith("#") for r in rows):
        items = [r[2:].strip() for r in rows if r.startswith("- ")]
        return items or None
    if any(r.startswith("- ") for r in rows):
        return None
    return rows


def draft_images(item, figcaps_en):
    rel = "03-تصاویر/تصاویر.md"
    lines = lines_of(item, rel)
    files = sorted(p for p in (item / "03-تصاویر").glob("*") if p.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg")) \
        if (item / "03-تصاویر").exists() else []
    if not files:
        return V([], "03-تصاویر: no image files")
    if lines is None:
        return V(None, f"{rel} missing")
    header, rows = md_table(lines)
    kn = col(header, "شماره")
    kalt, kcap, kalten = col(header, "alt فارسی"), col(header, "زیرنویس"), col(header, "alt انگلیسی")
    out = []
    for n, row in rows:
        num = cell(row, kn)
        if not num or not re.fullmatch(r"\d\d", num):
            continue
        match = [p for p in files if p.name.startswith(num + "-")]
        img = {"n": num,
               "file": V(f"03-تصاویر/{match[0].name}" if len(match) == 1 else None, f"{rel}:{n}"),
               "alt_fa": V(cell(row, kalt) if kalt is not None and cell(row, kalt) not in EMPTY else None, f"{rel}:{n}"),
               "caption_fa": V(None if kcap is None else (cell(row, kcap) if cell(row, kcap) not in EMPTY else ""), f"{rel}:{n}"),
               "alt_en": V(cell(row, kalten) if kalten is not None and cell(row, kalten) not in EMPTY else None, f"{rel}:{n}")}
        cap_en = figcaps_en.get(num)
        if img["caption_fa"]["value"] == "":
            img["caption_en"] = V("", f"{rel}:{n} (no caption)")
        else:
            img["caption_en"] = V(cap_en[1] if cap_en else None, f"06-انگلیسی.md:{cap_en[0]}" if cap_en else "06-انگلیسی.md")
        out.append(img)
    if len(out) != len(files):
        return V(None, f"{rel}: {len(out)} table rows for {len(files)} image files")
    return V(out, rel)


def draft_credit(item):
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
    return V(None, f"{rel}: the on-page credit label (first author's display name) is not in the legacy contract")


def draft_links(item):
    rel = "11-لینک‌های-گلاسری.md"
    lines = lines_of(item, rel)
    if lines is None:
        return V([], f"{rel} missing: no in-body links")
    start = next((i for i, l in enumerate(lines) if l.startswith("## 4.8")), None)
    if start is None:
        return V(None, f"{rel}: no `## 4.8` section")
    header, rows = md_table(lines, start)
    kp, kt, kd = col(header, "عبارت عیناً"), col(header, "هدف"), col(header, "تصمیم")
    if None in (kp, kt, kd):
        return V(None, f"{rel}: 4.8 table columns not recognised")
    out = []
    for n, r in rows:
        if cell(r, kd) != "لینک":
            continue
        href = re.search(r"(/[A-Za-z0-9_./-]+\.html)", cell(r, kt) or "")
        if not href:
            return V(None, f"{rel}:{n}: no target path")
        out.append({"phrase": cell(r, kp), "href": href.group(1), "from": f"{rel}:{n}"})
    return V(out, f"{rel}:{start + 1}")


# ------------------------------------------------------------ supplement / check

REQUIRED = ("category", "title_fa", "caption_fa", "title_en", "caption_en", "body_en", "images", "credit",
            "catalog", "hashtags", "pillar", "pulse", "keywords", "links_48", "explore_49", "backlinks_47",
            )


def verify_origin(item, value, origin):
    """A supplemented value that claims a frozen file must appear on that line."""
    m = re.fullmatch(r"(.+?):(\d+)", origin or "")
    if not m or not (Path(item) / m.group(1)).exists():
        return None  # outside the item: a recorded manual step
    line = (Path(item) / m.group(1)).read_text(encoding="utf-8").splitlines()[int(m.group(2)) - 1]
    if isinstance(value, str):
        texts = [value]
    elif isinstance(value, dict):
        texts = [v for k, v in value.items() if isinstance(v, str) and k != "from"]
    else:
        texts = []
    for t in texts:
        if t and t not in line and not t.startswith(("/", "http")):
            raise QueueRefusal("SUPPLEMENT_NOT_VERBATIM", f"«{t[:60]}» is not on {origin}", origin=origin)
    return True


def merge_supplement(item, d, supplement):
    """Fill null fields only. Each supplied field: {"value": …, "from": "<file:line>" | "publish-day: <why>"}.
    Images take per-image keys: {"images": {"01": {"alt_en": {...}}}}."""
    d = copy.deepcopy(d)
    manual = []
    for key, spec in (supplement or {}).items():
        if key == "images":
            imgs = d["images"]["value"] or []
            for num, fields in spec.items():
                img = next((i for i in imgs if i["n"] == num), None)
                if img is None:
                    raise QueueRefusal("SUPPLEMENT_IMAGE", f"no image {num} in the item")
                for f, s in fields.items():
                    if img.get(f, {}).get("value") is not None:
                        raise QueueRefusal("SUPPLEMENT_OVERRIDES_FROZEN", f"image {num}.{f} is already read from the item")
                    if verify_origin(item, s["value"], s.get("from")) is None:
                        manual.append({"field": f"images.{num}.{f}", "from": s.get("from")})
                    img[f] = {"value": s["value"], "from": s.get("from")}
            continue
        if not isinstance(spec, dict) or "value" not in spec or not spec.get("from"):
            raise QueueRefusal("SUPPLEMENT_SHAPE", f"supplement {key}: needs {{\"value\", \"from\"}}")
        cur = d.get(key, {}).get("value")
        if cur is not None and key not in ("links_48", "legacy_review", "mint"):
            raise QueueRefusal("SUPPLEMENT_OVERRIDES_FROZEN", f"{key} is already read from the item ({d[key]['from']})")
        if key == "links_48" and cur is not None:
            # additions only: rows the 4.8 table already holds stay as read
            have = {(x["phrase"], x["href"]) for x in cur}
            add = [x for x in spec["value"] if (x["phrase"], x["href"]) not in have]
            spec = {"value": cur + add, "from": spec["from"]}
        if isinstance(spec["value"], list) and not any(isinstance(x, dict) and x.get("from") for x in spec["value"]):
            if verify_origin(item, None, spec["from"]) is None:
                manual.append({"field": key, "from": spec["from"]})
        elif isinstance(spec["value"], list):
            for x in spec["value"]:
                if isinstance(x, dict) and x.get("from"):
                    if verify_origin(item, x, x["from"]) is None:
                        manual.append({"field": key, "from": x["from"]})
        elif verify_origin(item, spec["value"], spec["from"]) is None:
            manual.append({"field": key, "from": spec["from"]})
        d[key] = {"value": spec["value"], "from": spec["from"]}
    d["_manual"] = {"value": manual, "from": "supplement"}
    return d


def missing(d):
    out = [k for k in REQUIRED if d.get(k, {}).get("value") is None]
    for img in d.get("images", {}).get("value") or []:
        out += [f"images.{img['n']}.{f}" for f in ("file", "alt_fa", "alt_en", "caption_fa", "caption_en")
                if img.get(f, {}).get("value") is None]
    if d.get("category", {}).get("value") == "sharehub" and d.get("author", {}).get("value") is None:
        out.append("author")
    if d.get("_source", {}).get("value") == "legacy" and d.get("legacy_review", {}).get("value") is None:
        out.append("legacy_review")
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
    a = ap.parse_args()
    try:
        info = load_item(a.item, agent="*") if a.cmd == "check" else {"path": Path(a.item)}
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
