#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Propose glossary back-links into ALREADY-PUBLISHED bodies. READ-ONLY.

The publishing workflow only ever links FORWARD: step 4.8 runs on the page in
flight and points it OUT at terms that already exist. Nothing points an existing
article's body at a term published later, so a term's inbound link count is a
function of how much content was published after it — and a foundational term
born today starts at zero and stays there.

This script produces the candidate list for `.dentcast/workflows/cross-link.md`.
It writes NOTHING to any page; the workflow's Phase D applies what a human
approved. Two flags:

    python3 tools/cross_link_candidates.py                 # markdown report
    python3 tools/cross_link_candidates.py --json out.json # machine-readable

Everything here is deliberately mechanical. The judgment (is this really the
concept, at this spot?) belongs to the agent reading the report, not here.
"""

import argparse
import collections
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Folders whose pages are OUT of scope, and why:
#   episodes/  — the body is the «درباره این اپیزود» caption, median 13 words;
#                one link there is ~77 per 1000 words. Founder decision, 1405/06/10.
#   litecast/  — isolated track, never cross-linked with specialist content
#                (publishing-workflow Hard Rule 10).
#   glossary/  — a term's own page; 4.8's no-self-link rule and the fact that
#                glossary→glossary is already dense.
OUT_OF_SCOPE = ("episodes/", "litecast/", "glossary/")

# The body is these boxes and nothing else. Getting this wrong is not a small
# error: a whole-document scan matches the <title>, the hashtag chip row and the
# JSON-LD, which produced 74 false positives on the first run of this analysis.
BOX = re.compile(
    r'<(div|section|p)[^>]*class="[^"]*\b(ep-caption|glass-box|text-box|content-box)\b[^"]*"[^>]*>.*?</\1>',
    re.S,
)
REL = re.compile(r'<div class="dc-related-section">.*?\n</div>', re.S)

# A letter for word-boundary purposes. Persian punctuation (، ؛ « » …) and
# whitespace are boundaries; a Persian SUFFIX is not — «ایمپلنتی» is one word and
# wrapping «ایمپلنت» inside it cuts a word in half. ZWNJ counts as a LETTER here
# and that is deliberate: «ایمپلنت‌محور» is a single compound, so an anchor that
# stops at the ZWNJ renders as a link glued to a dangling «‌محور».
LETTER = re.compile(r'[0-9A-Za-zء-غف-ي٠-٩ٮ-ۓ۰-۹‌]')

# Site-measured ceiling. The median article body carries 3.3 in-body content
# links per 1000 words and the 90th percentile is 12. A page whose post-sweep
# density would clear the p90 does not get an automatic link — it goes to ASK.
DENSITY_P90 = 12.0

CONTENT_HREF = re.compile(
    r'href="(/(?:glossary|episodes|notecast|insight|chairside|metanotes|dentai|sharehub|photocast|dentcast-plus)/[^"]+)"'
)


def read(rel):
    with io.open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace") as fh:
        return fh.read()


def fold(s):
    """Search-only folding: ZWNJ→space, Arabic ی/ک→Persian, drop harakat.

    NEVER applied to stored text — same discipline as plus/js/hl-view.js's
    foldFa. It exists so «اسئواینتگریشن» matches «اسئو‌اینتگریشن».
    """
    return fold_map(s)[0]


def fold_map(s):
    """fold(s), plus a map from every folded position back to the original.

    The map is the whole point. Folding changes the string's LENGTH (a harakat
    disappears, a whitespace run collapses), so an index found in the folded
    text is not a valid index into the original. Slicing the original with it
    silently returns a window shifted by a few characters — which is how the
    first draft of this script printed «…【ایمپلنت】ت مراجعه…», duplicating a
    letter, and would have handed the applying agent the wrong occurrence.
    """
    chars, origin = [], []
    for i, ch in enumerate(s):
        if re.match(r"[ً-ْ]", ch):          # harakat: dropped entirely
            continue
        if ch == "‌":                        # ZWNJ folds to a space for matching
            ch = " "
        elif ch == "ي":
            ch = "ی"
        elif ch == "ك":
            ch = "ک"
        if ch.isspace():
            if chars and chars[-1] == " ":   # collapse a run, keep the first
                continue
            ch = " "
        chars.append(ch.lower())
        origin.append(i)
    start = 1 if chars and chars[0] == " " else 0
    end = len(chars) - 1 if chars and chars[-1] == " " else len(chars)
    return "".join(chars[start:end]), origin[start:end]


def body_of(path):
    """The visible body boxes of a page, or None if it has none."""
    if not os.path.exists(os.path.join(ROOT, path)):
        return None
    doc = REL.sub("", read(path))
    boxes = [m.group(0) for m in BOX.finditer(doc)]
    return "\n".join(boxes) if boxes else None


def visible(body):
    """Body text with existing links and headings masked out.

    Both are no-go zones for a new anchor: 4.8 forbids a link inside a link and
    inside a heading, so a match landing in either is not a match at all.
    """
    t = re.sub(r"<a\b.*?</a>", " ⟪A⟫ ", body, flags=re.S)
    t = re.sub(r"<h[1-6]\b.*?</h[1-6]>", " ⟪H⟫ ", t, flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))


def content_id(entry):
    url = entry.get("page_url") or entry.get("url") or ""
    return url.lstrip("/")[:-5] if url.endswith(".html") else None


def build_signal_index():
    """content_id → {glossary slug → [(signal kind, raw signal)]}.

    The signal is the brain entry's OWN metadata, never a string scan of the
    site: a hashtag (resolved through the reference library's alias layer, so a
    concept filed under any spelling is found) or a `keywords` entry. That is
    what keeps this a precision pass — the tag is the author saying "this page
    is about X", and only then do we look for X in the prose.
    """
    glossary = json.loads(read("glossary/glossary.json"))["glossary"]
    ref = json.loads(read("dentcast-hashtag-reference.json"))
    brain = json.loads(read("dentcast-brain.json"))

    # longest surface form first: prefer «ایمپلنت دندانی» over «ایمپلنت»
    forms = {
        e["slug"]: sorted(
            {f for f in [e["fa_title"], e["title"]] + e.get("synonyms", []) if f.strip()},
            key=len,
            reverse=True,
        )
        for e in glossary
    }
    folded = {slug: {fold(f) for f in v} for slug, v in forms.items()}

    tag_names = {}
    for c in ref["concepts"]:
        tag_names[c["tag"]] = (
            {fold(c["tag"].lstrip("#").replace("_", " ")), fold(c["key"].replace("_", " "))}
            | {fold(a) for a in c.get("aliases", [])}
        )

    index = collections.defaultdict(lambda: collections.defaultdict(list))
    for entry in brain:
        cid = content_id(entry)
        if not cid:
            continue
        signals = set()
        for tag in entry.get("hashtags") or []:
            names = tag_names.get(tag, {fold(tag.lstrip("#").replace("_", " "))})
            signals |= {("hashtag", tag, n) for n in names}
        for kw in entry.get("keywords") or []:
            signals.add(("keyword", kw, fold(kw)))
        for kind, raw, name in signals:
            for slug in forms:
                if name in folded[slug]:
                    index[cid][slug].append((kind, raw))
    return index, forms


def scan(only=None):
    """`only` = restrict to these glossary slugs (step 4.7-ب scopes to the term
    just published). It is applied BEFORE the per-page density is computed, so a
    scoped run is judged on the links it would actually add — filtering the
    output afterwards would flag a page for a density it never reaches.
    """
    index, forms = build_signal_index()
    proposals, skipped = [], collections.Counter()

    for cid in sorted(index):
        if cid.startswith(OUT_OF_SCOPE) or "/en/" in cid:
            skipped["out_of_scope"] += len(index[cid])
            continue
        body = body_of(cid + ".html")
        if body is None:
            skipped["no_body_box"] += len(index[cid])
            continue

        text = visible(body)
        ftext, origin = fold_map(text)
        words = len([w for w in text.split() if len(w) > 1])
        existing = len(CONTENT_HREF.findall(body))

        page_rows = []
        for slug in sorted(index[cid]):
            if only is not None and slug not in only:
                continue
            if "/glossary/%s.html" % slug in body:
                skipped["already_linked"] += 1
                continue

            hit = None
            for form in forms[slug]:
                ffm = fold(form)
                k = ftext.find(ffm)
                if k >= 0:
                    hit = (form, k, len(ffm))
                    break
            if hit is None:
                skipped["term_not_in_body"] += 1
                continue

            form, k, flen = hit
            # back to real positions in the untouched text
            start, end = origin[k], origin[k + flen - 1] + 1
            surface = text[start:end]

            left = text[start - 1] if start > 0 else " "
            right = text[end] if end < len(text) else " "
            glued = bool(LETTER.match(left) or LETTER.match(right))

            before, after = text[max(0, start - 80):start], text[end:end + 80]
            quoted = before.count("«") > before.count("»")

            reasons = []
            if glued:
                stuck = right if LETTER.match(right) else left
                reasons.append(
                    "glued: the match is part of a longer word (%r is attached to it) — wrapping it "
                    "would cut a word in half" % stuck
                )
            if quoted:
                reasons.append("inside a quotation — prefer a later occurrence in the author's own prose")

            page_rows.append({
                "content_id": cid,
                "slug": slug,
                "form": form,
                # what actually stands in the page, which may differ from the
                # glossary's spelling by a ZWNJ — the anchor wraps THIS.
                "surface": surface,
                "signals": sorted({"%s %s" % (k2, r) for k2, r in index[cid][slug]}),
                "context": re.sub(r"\s+", " ", (before + "【" + surface + "】" + after)).strip(),
                "glued": glued,
                "quoted": quoted,
                "ask_reasons": reasons,
            })

        if not page_rows:
            continue

        after_density = (existing + len(page_rows)) / (words / 1000.0) if words else 999.0
        for row in page_rows:
            row["page_words"] = words
            row["page_links_before"] = existing
            row["page_links_after"] = existing + len(page_rows)
            row["page_density_after"] = round(after_density, 1)
            if after_density > DENSITY_P90:
                row["ask_reasons"] = row["ask_reasons"] + [
                    "density: the page would reach %.1f links per 1000 words, past the site p90 of %.0f"
                    % (after_density, DENSITY_P90)
                ]
            row["verdict"] = "ASK" if row["ask_reasons"] else "AUTO"
        proposals.extend(page_rows)

    return proposals, skipped


def markdown(proposals, skipped):
    auto = [p for p in proposals if p["verdict"] == "AUTO"]
    ask = [p for p in proposals if p["verdict"] == "ASK"]
    pages = {p["content_id"] for p in proposals}
    out = []
    w = out.append
    w("# Glossary back-link candidates")
    w("")
    w("Read-only. Generated by `tools/cross_link_candidates.py`; applied only through")
    w("Phase D of `.dentcast/workflows/cross-link.md`.")
    w("")
    w("| | count |")
    w("|---|---:|")
    w("| pages with at least one candidate | %d |" % len(pages))
    w("| **AUTO** — unambiguous, apply directly | **%d** |" % len(auto))
    w("| **ASK** — needs a human verdict | **%d** |" % len(ask))
    for key, label in (
        ("out_of_scope", "skipped: episodes / litecast / en / glossary"),
        ("no_body_box", "skipped: no recognised body box"),
        ("already_linked", "skipped: the page already links that term"),
        ("term_not_in_body", "skipped: tagged for the topic, but the term is not in the body"),
    ):
        w("| %s | %d |" % (label, skipped[key]))
    w("")

    for title, rows in (("AUTO", auto), ("ASK", ask)):
        if not rows:
            continue
        w("## %s (%d)" % (title, len(rows)))
        w("")
        by_page = collections.defaultdict(list)
        for r in rows:
            by_page[r["content_id"]].append(r)
        for cid in sorted(by_page):
            group = by_page[cid]
            w("### `%s`  — %d link%s · %d words · %d → %d links (%.1f per 1k)"
              % (cid, len(group), "" if len(group) == 1 else "s", group[0]["page_words"],
                 group[0]["page_links_before"], group[0]["page_links_after"],
                 group[0]["page_density_after"]))
            for r in group:
                w("")
                same = r["surface"] == r["form"]
                w("- **`%s`** ← wrap «%s»%s"
                  % (r["slug"], r["surface"],
                     "" if same else "  *(glossary spells it «%s» — wrap what the PAGE has)*" % r["form"]))
                w("  - signal: %s" % "، ".join(r["signals"]))
                w("  - context: …%s…" % r["context"])
                for reason in r["ask_reasons"]:
                    w("  - ⚠ %s" % reason)
            w("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", metavar="PATH", help="also write the machine-readable candidate list")
    ap.add_argument(
        "--slug", action="append", metavar="SLUG", default=None,
        help="restrict to these glossary slugs (repeatable). This is what the publishing "
             "workflow's step 4.7-ب passes: a glossary publish cross-links the term it just "
             "published and nothing else. Omit it for the full backlog sweep.",
    )
    args = ap.parse_args()

    only = set(args.slug) if args.slug else None
    proposals, skipped = scan(only)
    for s in sorted((only or set()) - {p["slug"] for p in proposals}):
        sys.stderr.write(
            "note: %s has no candidate — every tagged page either already links it, "
            "or does not say the term in its body\n" % s
        )
    if args.json:
        with io.open(args.json, "w", encoding="utf-8") as fh:
            json.dump(proposals, fh, ensure_ascii=False, indent=1)
        sys.stderr.write("wrote %s (%d candidates)\n" % (args.json, len(proposals)))
    print(markdown(proposals, skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
