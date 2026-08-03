#!/usr/bin/env python3
"""Mechanically verify one publish against the publishing workflow's invariants.

This is the workflow's FINAL GATE (`.dentcast/workflows/README.md` Phase F).
Every rule it checks is already written in prose in that document; the point of
this script is that prose is not enforceable and a long checklist is not
something an agent reliably completes. Here the checklist executes, names the
file and the exact mismatch, and exits non-zero until the publish is actually
correct.

    python3 tools/verify_publish.py chairside/chairside-28
    python3 tools/verify_publish.py --last      # the newest brain entry
    python3 tools/verify_publish.py --all       # regression sweep, site-wide

`content_id` is the page path without a leading slash and without ".html" —
the same identifier `plus/content-index.json`, the quiz index and the
flashcards index use.

Exit codes: 0 = every check passed (publish is complete), 1 = at least one
FAIL (publish is incomplete — fix what is listed, then re-run).

Standard library only, same as the other tools in this directory.
"""

import argparse
import hashlib
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GA_ID = "G-GMM0WC8X3M"
ZWNJ = "‌"

# Types that stay outside the specialist ecosystem (Hard Rules 10 / 12,
# steps 4.11, 4.12, 5.6, Phases D & E).
LITECAST = "litecast"
NO_NOTIFY_TYPES = {"litecast", "glossary"}

# Forbidden in a FAQ question `name` — step 4.12(a): the question must be
# answerable by someone who does not have this page in front of them.
DEIXIS = [
    "این کیس", "این بیمار", "این مطالعه", "این متن", "این ویدیو", "این مقاله",
    "این تکنیک", "این روش", "این وضعیت", "این تصمیم", "این خطا", "این صفحه",
]

# Mirrors tools/build_quiz_index.mjs so this gate and the builder agree on
# which questions are scored. Keep the two in sync.
WH_WORD = re.compile(r"(^|\s)(چرا|چگونه|چطور|کدام|چند|چقدر|کِی|کی |کجا|چه )")
YESNO_TAIL = re.compile(
    r"(درست است؟|درسته؟|صحت دارد؟|واقعیت دارد؟|امکان دارد؟|لازم است؟|حتمی است؟|"
    r"کافی است؟|یکسان است؟|مهم است؟|خطرناک است؟|ضروری است؟|بهتر است؟|وجود دارد؟|"
    r"صدق می‌کند؟|می‌شود؟|می‌کند؟)\s*[»\"']?\s*$"
)
VERSION_INPUTS = [
    "dentcast-brain.json", "glossary/glossary.json", "litecast/lite-glossary.json",
    "dentcast-music.json", "dc-theme.css", "dc-article.css", "dc-nav.css",
    "dc-nav.js", "global-search.css", "global-search.js", "global-search-ui.js",
    "episodes-drawer.js",
]


# --------------------------------------------------------------------------
# result collection
# --------------------------------------------------------------------------

class Report:
    def __init__(self, content_id):
        self.content_id = content_id
        self.rows = []

    def ok(self, step, msg):
        self.rows.append(("PASS", step, msg, None))

    def fail(self, step, msg, fix=None):
        self.rows.append(("FAIL", step, msg, fix))

    def skip(self, step, msg):
        self.rows.append(("SKIP", step, msg, None))

    def warn(self, step, msg, fix=None):
        """Something to look at that is not a hard violation — used where the
        site measurably has no single convention, so failing would be a lie."""
        self.rows.append(("WARN", step, msg, fix))

    def check(self, cond, step, ok_msg, fail_msg, fix=None):
        self.ok(step, ok_msg) if cond else self.fail(step, fail_msg, fix)
        return cond

    @property
    def failures(self):
        return [r for r in self.rows if r[0] == "FAIL"]

    def render(self):
        width = max((len(r[1]) for r in self.rows), default=4)
        out = [f"\n── verify_publish: {self.content_id} " + "─" * 30]
        for status, step, msg, fix in self.rows:
            mark = {"PASS": "  ok ", "FAIL": "FAIL ", "SKIP": " -- ", "WARN": "warn "}[status]
            out.append(f"{mark} {step.ljust(width)}  {msg}")
            if fix:
                out.append(f"{' ' * (width + 6)}   ↳ fix: {fix}")
        n_fail = len(self.failures)
        n_pass = sum(1 for r in self.rows if r[0] == "PASS")
        n_warn = sum(1 for r in self.rows if r[0] == "WARN")
        out.append("─" * 52)
        out.append(
            f"{n_pass} passed, {n_warn} warned, {n_fail} failed"
            + ("  — publish is COMPLETE" if not n_fail else "  — publish is INCOMPLETE")
        )
        return "\n".join(out)


# --------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------

def read(path):
    p = ROOT / path if not str(path).startswith("/") else Path(path)
    return p.read_text(encoding="utf-8")


def exists(path):
    return (ROOT / path).exists()


def strip_code(doc):
    """Remove <script>/<style> so text checks never match inside them."""
    doc = re.sub(r"<script.*?</script>", "", doc, flags=re.S)
    return re.sub(r"<style.*?</style>", "", doc, flags=re.S)


def text_of(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def meta(doc, name=None, prop=None):
    if name:
        m = re.search(r'<meta\s+name="%s"\s+content="([^"]*)"' % re.escape(name), doc)
    else:
        m = re.search(r'<meta\s+property="%s"\s+content="([^"]*)"' % re.escape(prop), doc)
    return html.unescape(m.group(1)) if m else None


def jsonld_blocks(doc):
    out = []
    for raw in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', doc, re.S):
        try:
            out.append(json.loads(raw))
        except json.JSONDecodeError:
            out.append(None)
    return out


def jsonld_nodes(doc, wanted):
    """Every node of @type `wanted`, including inside @graph / arrays."""
    found, stack = [], [b for b in jsonld_blocks(doc) if b is not None]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if node.get("@type") == wanted:
                found.append(node)
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def related_section(doc):
    return re.search(r'<div class="dc-related-section">.*?</div>\s*</div>', doc, re.S)


def article_region(doc):
    """The authored body: between the <h1> and the related/author blocks."""
    body = strip_code(doc)
    start = body.find("</h1>")
    if start == -1:
        return ""
    end = len(body)
    for marker in ('<div class="author-note"', '<div class="dc-related-section"', "</main>"):
        i = body.find(marker, start)
        if i != -1:
            end = min(end, i)
    return body[start:end]


def content_version():
    h = hashlib.sha256()
    for rel in VERSION_INPUTS:
        p = ROOT / rel
        if p.exists():
            h.update(p.read_bytes())
    return h.hexdigest()[:10]


def live_pillars():
    sys.path.insert(0, str(ROOT / "tools"))
    from build_pillar import PILLARS  # noqa: E402
    return PILLARS


def is_yesno(question):
    if WH_WORD.search(question):
        return False
    return bool(re.match(r'^\s*[«"\']?(آیا|مگر)(\s|$)', question) or YESNO_TAIL.search(question))


def verdict_of(answer):
    clause = re.sub(r'^[\s«"\']+', "", answer).split("؛")[0].split(".")[0].split(":")[0][:80]
    if "مقایسه" in clause:
        return None
    yes = re.search(r"(^|[\s،؛«])بله([\s،؛.!»]|$)", clause)
    no = re.search(r"(^|[\s،؛«])(خیر|نه)([\s،؛.!»]|$)", clause)
    if yes and not no:
        return True
    if no and not yes:
        return False
    return None


def describe_diff(want, got):
    """Name the first divergence in terms a reader can act on — invisible
    characters (ZWNJ, NBSP) are spelled out, not shown as a blank."""
    names = {0x200C: "ZWNJ U+200C", 0x200F: "RLM U+200F", 0x200E: "LRM U+200E",
             0x00A0: "NBSP U+00A0", 0x0020: "SPACE", 0x064A: "ARABIC YEH U+064A",
             0x06CC: "PERSIAN YEH U+06CC", 0x0643: "ARABIC KAF U+0643",
             0x06A9: "PERSIAN KAF U+06A9"}
    show = lambda ch: names.get(ord(ch), repr(ch))  # noqa: E731
    for i, (a, b) in enumerate(zip(want, got)):
        if a != b:
            return f"first difference at index {i}: user has {show(a)}, file has {show(b)}"
    if len(want) != len(got):
        longer, tail = ("user", want[len(got):]) if len(want) > len(got) else ("file", got[len(want):])
        return f"{longer} text is {abs(len(want) - len(got))} characters longer: …{tail!r}"
    return "strings differ"


def normalize(s):
    """Whitespace-only normalization. Deliberately does NOT fold ZWNJ into a
    space — losing a ZWNJ is exactly the class of silent corruption this gate
    exists to catch (see Hard Rule 16)."""
    return re.sub(r"[ \t\r\n]+", " ", s or "").strip()


# --------------------------------------------------------------------------
# entry lookup
# --------------------------------------------------------------------------

def entry_url(e):
    """The brain has TWO legitimate url keys: most types carry `page_url`,
    while sharehub and most notecast entries carry `url`. Hard Rule 6 locks
    each type to its own predecessor's shape, so the gate must read both
    rather than expect one."""
    return e.get("page_url") or e.get("url")


def load_entry(content_id):
    """Return (entry, kind, brain) for a content_id, from whichever source of
    truth owns that type."""
    brain = json.loads(read("dentcast-brain.json"))
    url = "/" + content_id + ".html"
    for i, e in enumerate(brain):
        if entry_url(e) == url:
            return e, ("brain", i, len(brain)), brain
    lite = json.loads(read("litecast/lite-glossary.json"))["LightGlossary"]
    for i, e in enumerate(lite):
        if (e.get("page_url") or "").lstrip("/") == content_id + ".html":
            return e, ("litecast", i, len(lite)), brain
    return None, (None, None, None), brain


# --------------------------------------------------------------------------
# the checks
# --------------------------------------------------------------------------

def verify(content_id, rep, expect_title=None, expect_caption=None, sweep=False):
    """`sweep` = this is a site-wide regression pass over already-published
    pages, not the gate on a publish in flight. Checks that are only meaningful
    for the newest entry (tail position in the brain, the Pulse line) are
    skipped there: an older entry legitimately is not last and has legitimately
    rolled off Pulse. In single-target mode they stay strict, because that is
    exactly what a fresh publish must satisfy."""
    entry, (kind, idx, total), brain = load_entry(content_id)
    if entry is None:
        rep.fail("5 brain", f"no entry whose page_url/url is /{content_id}.html",
                 "step 5 — append the entry at the END of the flat array")
        return rep

    etype = entry.get("type") or ("episode" if kind == "brain" else LITECAST)
    is_lite = etype == LITECAST
    page_rel = content_id + ".html"

    # ---------------- brain ----------------
    if sweep and idx != total - 1:
        rep.skip("5 brain", f"position {idx + 1}/{total} — {total - 1 - idx} entries published since")
    else:
        rep.check(idx == total - 1, "5 brain",
                  f"entry is the last element ({idx + 1}/{total})",
                  f"entry sits at {idx + 1}/{total}, not at the END of the array",
                  "Hard Rule 3 — the latest-content widget reads the tail; move it to the end")

    same = [e for e in (brain if kind == "brain" else [])
            if (e.get("type") or "episode") == etype and e is not entry]
    if same:
        prev = same[-1]
        rep.check(list(entry.keys()) == list(prev.keys()), "5 brain",
                  f"key set + order identical to {prev.get('id', '?')}",
                  f"key set differs from {prev.get('id', '?')}: "
                  f"extra={sorted(set(entry) - set(prev))} missing={sorted(set(prev) - set(entry))}",
                  "Hard Rule 5 — no invented, no dropped fields")

    # `id` is unique PER TYPE, not site-wide: notecast and sharehub both number
    # their entries "1", "2", "3"… so a global count collides on every one of
    # them. The real defect this catches is two entries of the SAME type
    # claiming the same id.
    ids = [e.get("id") for e in brain
           if e.get("id") and (e.get("type") or "episode") == etype]
    rep.check(ids.count(entry.get("id")) <= 1, "5 brain",
              f"id {entry.get('id')} is unique within {etype}",
              f"id {entry.get('id')} appears twice within {etype}")

    # ---------------- pillar ----------------
    pillar = entry.get("pillar") or {}
    if is_lite:
        rep.skip("2.4 pillar", "LiteCast lives outside the specialist taxonomy")
    elif kind == "brain":
        PILLARS = live_pillars()
        primary, sub = pillar.get("primary"), pillar.get("subtopic")
        rep.check("subtopic" in pillar, "2.4 pillar", "subtopic key present",
                  "pillar object has no `subtopic` key", "step 5 — the key is always present, even when null")
        if primary is None:
            rep.ok("2.4 pillar", "no pillar assigned (primary=null)")
        elif primary in PILLARS:
            slugs = [s["slug"] for s in PILLARS[primary]["subtopics"]]
            rep.check(sub in slugs, "2.4 pillar",
                      f"{primary} / {sub} — both live in PILLARS",
                      f"subtopic {sub!r} is not a subtopic of {primary} (live: {slugs})",
                      "step 5.5 — use the slug exactly as stored in build_pillar.py")
        else:
            rep.check(sub is None, "2.4 pillar",
                      f"{primary} is unstructured, subtopic null",
                      f"{primary} is not a structured pillar but subtopic is {sub!r}")

    # ---------------- page on disk ----------------
    if not exists(page_rel):
        rep.fail("2 page", f"{page_rel} does not exist")
        return rep
    doc = read(page_rel)
    rep.ok("2 page", f"{page_rel} ({len(doc):,} bytes)")

    rep.check(doc.count(GA_ID) == 2, "GA4",
              "deferred GA4 snippet present exactly once",
              f"GA4 id appears {doc.count(GA_ID)}x (expected 2: config + src)",
              "python3 .github/scripts/inject_ga.py")

    domain = "https://dentcast.ir" if is_lite else "https://dentcast.org"
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', doc)
    rep.check(canon and canon.group(1) == f"{domain}/{page_rel}", "2 identity",
              f"canonical = {domain}/{page_rel}",
              f"canonical is {canon.group(1) if canon else 'MISSING'}, expected {domain}/{page_rel}",
              "step 2 identity invariant — the clone swaps the PATH, never the domain")

    # ---------------- title / caption fidelity (Hard Rule 16) ----------------
    title, caption = entry.get("title", ""), entry.get("caption", "")

    # The site can only be checked against itself; it cannot know what the user
    # actually wrote. --expect-title/--expect-caption close that gap: paste the
    # user's own string and this compares it codepoint-for-codepoint, so a lost
    # ZWNJ or a helpfully-widened caption fails here instead of shipping.
    for label, want, got in (("title", expect_title, title),
                             ("caption", expect_caption, caption)):
        if want is None:
            continue
        if want == got:
            rep.ok("16 verbatim", f"brain {label} is codepoint-identical to the user's text")
        else:
            rep.fail("16 verbatim",
                     f"brain {label} differs from the user's text:\n"
                     f"{' ' * 22}user : {want!r}\n"
                     f"{' ' * 22}brain: {got!r}\n"
                     f"{' ' * 22}{describe_diff(want, got)}",
                     "Hard Rule 16 — a title/caption the user supplied is copied, never re-typed")
    # h1 vs brain title: 69% of the site has them identical and another 16%
    # differ only by a chrome prefix/suffix («Insight 60 — …», «… | دنت‌کست»),
    # so containment is a warning, not a violation. Anything beyond containment
    # is real drift — that is the ZWNJ/rewording class this gate exists for.
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
    h1_text = normalize(text_of(h1.group(1))) if h1 else None
    if h1_text == normalize(title):
        rep.ok("16 title", "<h1> is codepoint-identical to the brain title")
    elif h1_text and (h1_text in normalize(title) or normalize(title) in h1_text):
        rep.warn("16 title", f"<h1> differs from the brain title only by chrome: {h1_text!r}")
    else:
        rep.fail("16 title",
                 f"<h1> {h1_text!r} diverges from the brain title {normalize(title)!r}\n"
                 f"{' ' * 22}{describe_diff(normalize(title), h1_text or '')}",
                 "Hard Rule 16 — one title string, copied verbatim everywhere (watch ZWNJ U+200C)")

    for label, value in [("<title>", re.search(r"<title>(.*?)</title>", doc, re.S)),
                         ("og:title", meta(doc, prop="og:title")),
                         ("twitter:title", meta(doc, name="twitter:title"))]:
        got = html.unescape(text_of(value.group(1))) if hasattr(value, "group") else value
        if got is None:
            rep.fail("16 title", f"{label} is missing")
        elif title in got:
            rep.ok("16 title", f"{label} carries the exact title")
        else:
            rep.fail("16 title",
                     f"{label} does not contain the brain title verbatim: {got!r}",
                     "Hard Rule 16 — a corrected title must be swept through every surface")

    for node_type, field in (("TechArticle", "headline"), ("Article", "headline"),
                             ("BlogPosting", "headline")):
        for node in jsonld_nodes(doc, node_type):
            rep.check(node.get(field) == title, "16 title",
                      f"JSON-LD {node_type}.{field} matches",
                      f"JSON-LD {node_type}.{field} = {node.get(field)!r}, brain title = {title!r}",
                      "Hard Rule 16")

    # 57% of the site keeps meta description == caption; the rest deliberately
    # writes a tighter search snippet. Not a universal convention, so a
    # divergence is surfaced rather than failed — but it is surfaced, because a
    # description left describing an older framing of the title is exactly the
    # drift a title correction leaves behind (Hard Rule 17).
    desc = meta(doc, name="description")
    if normalize(desc) == normalize(caption):
        rep.ok("16 caption", "meta description is codepoint-identical to the brain caption")
    else:
        rep.warn("16 caption",
                 "meta description differs from the brain caption — confirm it is a deliberate "
                 "snippet, not leftover wording from a previous title\n"
                 f"{' ' * 22}page : {normalize(desc)!r}\n"
                 f"{' ' * 22}brain: {normalize(caption)!r}")

    for label, value in [("og:description", meta(doc, prop="og:description")),
                         ("twitter:description", meta(doc, name="twitter:description"))]:
        rep.check(bool(value), "16 caption", f"{label} present", f"{label} missing")

    # A social description is allowed to differ from the caption, but it must
    # not be left describing an older framing of the title.
    og = meta(doc, prop="og:description") or ""
    tw = meta(doc, name="twitter:description") or ""
    rep.check(normalize(og) == normalize(tw), "16 caption",
              "og and twitter descriptions agree",
              "og:description and twitter:description differ from each other",
              "Hard Rule 17 — correct every surface, not the first one you find")

    # ---------------- dates ----------------
    pub = re.findall(r'"datePublished":\s*"([^"]+)"', doc)
    mod = re.findall(r'"dateModified":\s*"([^"]+)"', doc)
    rep.check(pub and mod and set(pub) == set(mod), "3 dates",
              f"datePublished == dateModified ({pub[0] if pub else '?'})",
              f"datePublished {pub} != dateModified {mod}", "step 3")

    # ---------------- body structure ----------------
    region = article_region(doc)
    first_p = re.search(r"<p[\s>]", region)
    first_list = re.search(r"<(ul|ol)[\s>]", region)
    rep.check(first_p and (not first_list or first_p.start() < first_list.start()),
              "2 body",
              "prose paragraph precedes the first list (Spot card has an interior boundary)",
              "body opens with a list — the in-article Spot card has nowhere to land",
              "step 2 — write a real 2-4 sentence lead before the first <ul>")

    # ---------------- کاوش بیشتر ----------------
    n_sections = doc.count('<div class="dc-related-section">')
    if is_lite or etype == "episode":
        rep.skip("2.5 related", f"{etype} uses its own related-links convention")
    else:
        rep.check(n_sections == 1, "2.5 related",
                  "exactly one «کاوش بیشتر» section",
                  f"found {n_sections} dc-related-section blocks (expected 1)")
        sec = related_section(doc)
        if sec:
            links = re.findall(r'href="([^"]+)"', sec.group(0))
            rep.check(len(links) <= 5, "9 cap",
                      f"{len(links)}/5 links in «کاوش بیشتر»",
                      f"{len(links)} links — over the hard cap of 5", "Hard Rule 9")
            rep.check("ep-related-link" not in sec.group(0), "2.5 related",
                      "uses dc-related-* classes only",
                      "ep-* classes leaked into a dc-related-section")
            want = f"/pillar/{pillar.get('primary')}/" if pillar.get("primary") else "/pillar/"
            rep.check(want in links, "2.5 related",
                      f"فهرست موضوعی → {want}",
                      f"pillar capsule does not point at {want} (found {links})",
                      "step 2.5 — canonical format: trailing slash, no index.html")
            rep.check(f"/{page_rel}" not in links, "4.9 related",
                      "no self-link", "the section links to the page itself")

    # ---------------- FAQ + flashcards ----------------
    faqs = jsonld_nodes(doc, "FAQPage")
    questions = [q for f in faqs for q in f.get("mainEntity", [])]
    if is_lite:
        rep.skip("4.12 quiz", "LiteCast is outside the quiz ecosystem")
        rep.skip("4.11 cards", "LiteCast is outside the flashcard ecosystem")
    else:
        rep.check(bool(questions), "4.12 quiz", f"{len(questions)} FAQ questions",
                  "no FAQPage on the page", "step 4.12")
        for i, q in enumerate(questions):
            name = q.get("name", "")
            hit = [d for d in DEIXIS if d in name]
            rep.check(not hit, "4.12 quiz",
                      f"q{i} is self-contained",
                      f"q{i} contains article deixis {hit}: {name[:70]}…",
                      "step 4.12(a) — rewrite it standalone or drop it")
            answer = (q.get("acceptedAnswer") or {}).get("text", "")
            if is_yesno(name):
                rep.check(verdict_of(answer) is not None, "4.12 quiz",
                          f"q{i} binary, opens with an explicit verdict",
                          f"q{i} is yes/no-shaped but its answer does not open with بله/خیر — "
                          f"it will be silently dropped from the scored bank",
                          "step 4.12(b) — reopen the answer with «بله،»/«خیر؛»")

        sets = jsonld_nodes(doc, "DefinedTermSet")
        rep.check(len(sets) == 1, "4.11 cards",
                  "one DefinedTermSet block", f"found {len(sets)} DefinedTermSet blocks", "step 4.11")
        terms = [t for s in sets for t in s.get("hasDefinedTerm", [])]
        rep.check(bool(terms), "4.11 cards", f"{len(terms)} flashcards",
                  "DefinedTermSet has no terms")
        ids = [t.get("@id") for t in terms]
        rep.check(len(set(ids)) == len(ids), "4.11 cards", "flashcard @ids are unique",
                  "duplicate flashcard @id")
        for n, t in enumerate(terms, 1):
            want = f"#flashcards-c{n}"
            rep.check((t.get("@id") or "").endswith(want), "4.11 cards",
                      f"card {n} @id ends {want}",
                      f"card {n} @id is {t.get('@id')}, expected …{want}",
                      "step 4.11 — 1-indexed and stable once published")

        answers = [normalize((q.get("acceptedAnswer") or {}).get("text", "")) for q in questions]
        stripped = [normalize(re.sub(r"^(بله|خیر|نه)[؛,،]\s*", "", a)) for a in answers]
        qnames = [normalize(q.get("name", "")) for q in questions]
        for n, t in enumerate(terms, 1):
            d = normalize(t.get("description", ""))
            nm = normalize(t.get("name", ""))
            rep.check(d not in answers and d not in stripped, "4.11 cards",
                      f"card {n} description is authored, not a FAQ copy",
                      f"card {n} description is the FAQ answer verbatim "
                      f"(stripping «بله/خیر» is not a rewrite)",
                      "step 4.11 — a card defines a concept; rewrite it, don't re-paste")
            rep.check(nm not in qnames, "4.11 cards",
                      f"card {n} name is a recall prompt",
                      f"card {n} name is the FAQ question verbatim",
                      "step 4.11")

    # ---------------- Phase D / E ----------------
    en_rel = f"{Path(content_id).parent}/en/{Path(content_id).name}.html"
    if is_lite:
        rep.skip("D en-mirror", "LiteCast is .ir-only — no hreflang, no en mirror (Hard Rule 10)")
        rep.skip("E notify", "LiteCast is outside the Plus push ecosystem")
        rep.check("hreflang" not in doc, "D en-mirror", "no hreflang on a .ir page",
                  "a LiteCast page carries hreflang tags", "Hard Rule 10")
    else:
        if rep.check(exists(en_rel), "D en-mirror", f"{en_rel} exists",
                     f"{en_rel} missing — the fa page's toggle would be a phantom pair",
                     "Hard Rule 12 / Phase D — run .dentcast/workflows/en-version.md"):
            en = read(en_rel)
            rep.check('<html lang="en" dir="ltr" data-dc-no-header>' in en, "D en-mirror",
                      "en page has the English chrome attributes",
                      "en page is missing lang=en / dir=ltr / data-dc-no-header")
            rep.check(en.count(GA_ID) == 2, "D en-mirror", "en page carries GA4 once",
                      f"en page GA4 id appears {en.count(GA_ID)}x")
            rep.check(f'<link rel="canonical" href="https://dentcast.org/{en_rel}"' in en,
                      "D en-mirror", "en page is self-canonical",
                      "en page canonical does not point at itself")
            rep.check(meta(en, prop="og:locale") == "en_US", "D en-mirror",
                      "og:locale = en_US", f"en og:locale is {meta(en, prop='og:locale')}")
            rep.check('"inLanguage": "en"' in en, "D en-mirror", "inLanguage = en",
                      "en page inLanguage is not 'en'")
            rep.check("dc-related-section" not in en, "D en-mirror",
                      "en page carries no specialist capsules",
                      "en page has a «کاوش بیشتر» section (en pages stay out of the brain ecosystem)")
            rep.check("dc-notify" not in en, "E notify", "en mirror carries no notify marker",
                      "en mirror has dc-notify — only the fa page announces")
            fa_btn = re.search(r'<a class="lang-btn"[^>]*href="([^"]+)"', doc)
            en_btn = re.search(r'<a class="lang-btn"[^>]*href="([^"]+)"', en)
            name = Path(content_id).name + ".html"
            rep.check(fa_btn and fa_btn.group(1) == f"en/{name}", "D toggle",
                      f"fa toggle → en/{name}",
                      f"fa toggle is {fa_btn.group(1) if fa_btn else 'MISSING'}, expected en/{name}",
                      "Hard Rule 12 — the two targets are exact inverses")
            rep.check(en_btn and en_btn.group(1) == f"../{name}", "D toggle",
                      f"en toggle → ../{name}",
                      f"en toggle is {en_btn.group(1) if en_btn else 'MISSING'}, expected ../{name}")
            fa_li = len(re.findall(r"<li[\s>]", article_region(doc)))
            en_li = len(re.findall(r"<li[\s>]", article_region(en)))
            rep.check(fa_li == en_li, "D en-mirror",
                      f"structure-faithful translation ({fa_li} list items on both sides)",
                      f"fa has {fa_li} list items, en has {en_li} — translation dropped or added structure",
                      "Phase D — same headings, same number of <li>, nothing added or dropped")

        alts = re.findall(r'<link rel="alternate" hreflang="([^"]+)"', doc)
        rep.check(sorted(alts) == ["en", "fa", "fa-IR", "x-default"], "D hreflang",
                  "4-line hreflang mirror present",
                  f"hreflang set is {sorted(alts)}, expected en/fa/fa-IR/x-default",
                  "python3 .github/scripts/inject_hreflang.py")

        if etype in NO_NOTIFY_TYPES:
            rep.skip("E notify", f"{etype} is not an article type")
        else:
            n_marker = doc.count('<meta name="dc-notify" content="true">')
            rep.check(n_marker == 1, "E notify",
                      "publish marker present exactly once",
                      f"dc-notify marker appears {n_marker}x (expected 1)",
                      "Phase E — the notify Action keys off this marker")

    # ---------------- surfaces (Hard Rule 17) ----------------
    landing = f"{Path(content_id).parent}/index.html"
    if exists(landing):
        land = read(landing)
        n = len(re.findall(re.escape(Path(content_id).name + ".html"), land))
        rep.check(n >= 1, "2.6 landing", f"{landing} links to the page",
                  f"{landing} has no link to the new entry", "step 2.6")
        if n >= 1:
            li = re.search(r"<li>(?:(?!</li>).)*?" + re.escape(Path(content_id).name + ".html")
                           + r".*?</li>", land, re.S)
            if li:
                rep.check(title in html.unescape(li.group(0)), "17 sweep",
                          "landing-page label carries the exact title",
                          f"landing-page label does not match the brain title: "
                          f"{normalize(text_of(li.group(0)))!r}",
                          "Hard Rule 17 — a title change is swept through every surface")

    home = read("index.html")
    url = "/" + page_rel
    pulse = re.search(r'<ul class="dc-pulse-list">(.*?)</ul>', home, re.S)
    n_pulse = pulse.group(1).count(url) if pulse else 0
    if is_lite:
        pass
    elif sweep and n_pulse == 0:
        rep.skip("6 pulse", "Pulse holds only the newest lines — this one has rolled off")
    else:
        rep.check(n_pulse == 1, "6 pulse",
                  "exactly one Pulse line links to the page",
                  f"Pulse links to the page {n_pulse}x (expected 1)", "step 6")

    rail = re.search(r'<a class="dc-rail-card"[^>]*href="%s">(.*?)</a>' % re.escape(url), home, re.S)
    if rail:
        rt = re.search(r'<p class="dc-rail-title">(.*?)</p>', rail.group(1), re.S)
        rep.check(rt and normalize(text_of(rt.group(1))) == normalize(title), "17 sweep",
                  "homepage rail card title matches the brain title",
                  f"rail card says {normalize(text_of(rt.group(1))) if rt else '?'!r}, "
                  f"brain says {normalize(title)!r}",
                  "python3 tools/update-homepage-counters.py")

    sm = read("sitemap.xml")
    if is_lite:
        # The sitemap carries no dentcast.ir URLs at all, by design.
        rep.skip("8 sitemap", "LiteCast is .ir-only and stays out of the .org sitemap")
    else:
        rep.check(f"{domain}/{page_rel}" in sm, "8 sitemap", "page is in sitemap.xml",
                  "page missing from sitemap.xml", "python3 .github/scripts/gen_sitemap.py")
        if exists(en_rel):
            rep.check(f"https://dentcast.org/{en_rel}" in sm, "8 sitemap",
                      "en mirror is in sitemap.xml", "en mirror missing from sitemap.xml",
                      "python3 .github/scripts/gen_sitemap.py")

    if pillar.get("primary"):
        pp = f"pillar/{pillar['primary']}/index.html"
        if exists(pp):
            rep.check(url in read(pp), "8 pillar", f"listed on /{pp}",
                      f"not listed on /{pp}", "python3 tools/build_pillar.py all")

    # ---------------- generated indexes ----------------
    ci = read("plus/content-index.json")
    if is_lite:
        rep.skip("8 plus-index", "LiteCast items are not individually indexed for میز کار")
    else:
        rep.check(f'"{content_id}"' in ci, "8 plus-index", "in plus/content-index.json",
                  "missing from plus/content-index.json — the میز کار tree will not show it",
                  "node tools/build_plus_index.mjs")
    if not is_lite:
        rep.check(content_id in read("plus/flashcards-index.json"), "8 flashcards",
                  "in plus/flashcards-index.json", "missing from plus/flashcards-index.json",
                  "node tools/build_flashcards_index.mjs")
        if any(is_yesno(q.get("name", "")) for q in questions):
            rep.check(content_id in read("plus/quiz-index.json"), "8 quiz",
                      "in plus/quiz-index.json", "has binary questions but is missing from the quiz bank",
                      "node tools/build_quiz_index.mjs")
        paths = read("plus/pathways.json")
        rep.check(f'"{content_id}"' in paths, "5.6 pathway",
                  "placed in at least one learning pathway",
                  "in no learning pathway — place it, or state the deliberate exclusion",
                  f"python3 tools/pathway_place.py {content_id}")

    # ---------------- version stamp (step 7, always last) ----------------
    want = content_version()
    sw = re.search(r"dentcast-assets-([a-z0-9]+)", read("service-worker.js"))
    rep.check(sw and sw.group(1) == want, "7 version",
              f"content version {want} matches the stamp",
              f"stamped version is {sw.group(1) if sw else 'MISSING'} but the content hashes to {want} "
              f"— the stamper did not run last",
              "python tools/stamp-version.py  (ALWAYS the final builder)")
    for f in ("index.html", "player.html"):
        vs = set(re.findall(r"dentcast-brain\.json\?v=([a-z0-9]+)", read(f)))
        if vs:
            rep.check(vs == {want}, "7 version", f"{f} ?v= is current",
                      f"{f} carries ?v={vs}, expected {want}", "python tools/stamp-version.py")

    return rep


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("content_id", nargs="?", help="e.g. chairside/chairside-28")
    ap.add_argument("--last", action="store_true", help="verify the newest brain entry")
    ap.add_argument("--all", action="store_true", help="verify every brain entry that has a page")
    ap.add_argument("--quiet", action="store_true", help="print only failures")
    ap.add_argument("--expect-title", metavar="STR",
                    help="the title EXACTLY as the user wrote it — compared codepoint-for-codepoint")
    ap.add_argument("--expect-caption", metavar="STR",
                    help="the caption EXACTLY as the user wrote it — compared codepoint-for-codepoint")
    args = ap.parse_args()

    if (args.expect_title or args.expect_caption) and (args.all or not args.content_id):
        ap.error("--expect-title/--expect-caption apply to a single content_id")

    targets = []
    if args.all:
        for e in json.loads(read("dentcast-brain.json")):
            u = entry_url(e)
            if u and exists(u.lstrip("/")):
                targets.append(u.lstrip("/")[:-5])
    elif args.last:
        brain = json.loads(read("dentcast-brain.json"))
        targets = [entry_url(brain[-1]).lstrip("/")[:-5]]
    elif args.content_id:
        targets = [args.content_id.strip("/").removesuffix(".html")]
    else:
        ap.error("pass a content_id, or --last, or --all")

    if args.all:
        print("sweep mode — these are already-published pages. FAIL rows here are the site's\n"
              "BACKLOG (flashcards, quiz, en mirrors and the notify marker were all rolled out\n"
              "prospectively), not a blocked publish, so this mode exits 0. Per Hard Rule 11 a\n"
              "gap on an old page is something to fix on its own, never a pattern to copy.\n")

    bad = 0
    for cid in targets:
        rep = verify(cid, Report(cid), args.expect_title, args.expect_caption, sweep=args.all)
        if rep.failures:
            bad += 1
            print(rep.render())
        elif not args.quiet:
            print(rep.render())
    if len(targets) > 1:
        print(f"\n{len(targets) - bad}/{len(targets)} pages fully clean.")
    # A publish gate must block; a backlog report must not.
    return 0 if args.all else (1 if bad else 0)


if __name__ == "__main__":
    sys.exit(main())
