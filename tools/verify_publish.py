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
    python3 tools/verify_publish.py --des-text des.json   # step 4.13 Part 3(6)

`content_id` is the page path without a leading slash and without ".html" —
the same identifier `plus/content-index.json`, the quiz index and the
flashcards index use.

Exit codes (single content_id or --last): 0 = every check passed (publish is
complete), 1 = at least one FAIL (publish is incomplete — fix what is listed,
then re-run). --all is a backlog report, not a gate: it prints every FAIL but
always exits 0.

Standard library only, same as the other tools in this directory.
"""

import argparse
import hashlib
import html
import json
import posixpath
import re
import sys
import subprocess
import unicodedata
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GA_ID = "G-GMM0WC8X3M"
ZWNJ = "‌"

# Types that stay outside the specialist ecosystem (Hard Rules 10 / 12,
# steps 4.11, 4.12, 5.6, Phases D & E).
LITECAST = "litecast"
NO_NOTIFY_TYPES = {"litecast", "glossary"}

# DentCast+ videos: flashcards/quiz are optional, not mandatory (steps 4.11 /
# 4.12) — the founder's own tips-video series carries its content in the
# video itself, not in re-typable prose, so there is often no grounded text
# to author a card/question from without fabricating a clinical claim.
# Decided 2026-08-22 on dentcast-plus/video-10.
FLASHCARD_OPTIONAL_TYPES = {"litecast", "dentcast_plus"}

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


_FAQ_CORPUS = None


def faq_corpus():
    """plus/faq-corpus.json's byContent map, cached for the life of the
    process. FAQ/flashcards content lives here, not on the page, since the
    hidden-schema SEO fix (.dentcast/faq-schema-removal-handoff.md) — pages
    carry no FAQPage/DefinedTermSet of their own any more."""
    global _FAQ_CORPUS
    if _FAQ_CORPUS is None:
        try:
            _FAQ_CORPUS = json.loads(read("plus/faq-corpus.json")).get("byContent", {})
        except (OSError, ValueError):
            _FAQ_CORPUS = {}
    return _FAQ_CORPUS


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


# A numbered series may label its own landing rows «قسمت N — <title>»: the
# series name that the brain title carries as a prefix is dropped, because the
# landing page IS that series and repeating it on every row costs the reader
# the one thing they came for — where the series begins and ends (founder
# decision, 2026-09-18; workflow step 2.6). Accepted only in that exact shape:
# a «قسمت N» marker AND the brain title's own tail, verbatim, after it.
SERIES_PART = re.compile(r"قسمت\s*[۰-۹0-9]+")


def numbered_series_label(brain_title, label):
    head, sep, tail = brain_title.partition(" — ")
    if not sep or not tail:
        return False
    return bool(SERIES_PART.search(label)) and tail in label


def episode_landing_title(content_id):
    """The title episodes.html actually renders for this episode, or None.

    Read through build_episodes.py's own clean_title() rather than
    re-implementing the "1- " prefix strip here: the point of the check is
    "does the page match its source", so it has to ask the builder what it
    would render, not a second opinion about it."""
    sys.path.insert(0, str(ROOT / "tools"))
    from build_episodes import clean_title  # noqa: E402
    # Sub-episodes live at episode-159-1.html but dentcast.json numbers them
    # "159.1", so the file's "-" separator maps back to ".".
    num = Path(content_id).name.replace("episode-", "").replace("-", ".")
    try:
        eps = json.loads((ROOT / "dentcast.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    for ep in eps:
        if str(ep.get("episode", "")).strip() == num:
            return clean_title(ep.get("title", "")) or None
    return None


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
# DES (step 4.13)
# --------------------------------------------------------------------------

DES_BANDS = {"A": (80, 100), "B": (60, 79), "C": (40, 59), "D": (20, 39), "E": (0, 19)}


def des_ge_2(version):
    """True when a record was written under spec v2.0 or later.

    Compared as (major, minor) integers, never as strings: "1.10" sorts BEFORE
    "1.9" lexically, which would silently exempt exactly the newest records from
    the newest checks. Unparseable or missing stamps read as pre-2.0, so an old
    record is never failed by a rule that postdates it."""
    try:
        major, _, minor = (version or "").partition(".")
        return (int(major), int(minor or 0)) >= (2, 0)
    except ValueError:
        return False


def des_scaled_penalty(base_points, s_design):
    """Spec v2.0 Step 4a: max(1, round_half_up(base × S_design ÷ 100)).

    Exact decimals and round-half-up for the same reason Step 5 gives, and the
    floor at 1 because a firing penalty that rounded to 0 would be indistinguishable
    in the record from one that was considered and dismissed."""
    base = Decimal(str(base_points or 0))
    if base == 0:
        return 0
    scaled = (base * Decimal(str(s_design or 0)) / Decimal("100")).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP)
    return max(1, int(scaled))


DES_FID_VERDICTS = ("MATCHES", "ALTERED", "REVERSED", "NOT_IN_SOURCE",
                    "NOT_ASSESSABLE", "AUTHOR_VIEW", "NOT_A_CLAIM")
DES_FID_KINDS = ("HEDGE_REMOVED", "HEDGE_ADDED", "MAGNITUDE_CHANGED",
                 "POPULATION_OR_CONDITION_CHANGED", "GROUP_OR_COMPARATOR_CHANGED")


def des_fidelity_recompute(counts, version=None):
    """Spec F4: score and level from the verdict tally, exact integer
    arithmetic and round-half-up (Step 5's rule). Returns (assessable, score, level).
    Version-gated: from v2.8 the denominator is the claims the source ADDRESSES
    (NOT_IN_SOURCE is counted and shown, never scored); a record stamped 2.5–2.7
    still checks against the formula it was written under."""
    m, a, r, n = (int(counts.get(k, 0)) for k in ("matches", "altered", "reversed", "not_in_source"))
    assessable = m + a + r + (0 if des_ge(version, (2, 8)) else n)
    if assessable < (1 if des_ge(version, (3, 4)) else 3):
        return assessable, None, "INSUFFICIENT_CLAIMS"
    score = int((Decimal(m * 100 + a * 50) / Decimal(assessable)).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP))
    one_notch = des_ge(version, (2, 8)) and a == 1 and not r   # v2.8 F4: one ALTERED alone is HIGH
    if score < 60:
        level = "LOW"
    elif r or (score <= 84 and not one_notch):
        level = "MEDIUM"
    else:
        level = "HIGH"
    return assessable, score, level


DES_NA_KINDS_31 = ("book", "glossary", "standard")   # spec v3.1 Step 1, closed
DES_NA_KINDS_34 = DES_NA_KINDS_31 + ("consensus",)   # spec v3.4
DES_NA_BASES_31 = ("FULL_TEXT", "EXCERPT", "CITATION_ONLY")   # a NOT_APPRAISABLE object's own list
DES_NA_ONLY_BASES = ("EXCERPT", "CITATION_ONLY")   # legal on no other content type


def des_check_fidelity(rep, ftag, f, scope, basis_expected, page_hay, source_hay):
    """Spec v2.5/2.6 appendix rule 8 on one FIDELITY object."""
    claims = f.get("claims") or []
    rep.check(f.get("text_basis") != "EXCERPT" or des_ge(f.get("des_version"), (3, 1)), "4.13 DES",
              f"{ftag} basis EXCERPT is on a 3.1+ object",
              f"{ftag} is EXCERPT but stamped {f.get('des_version')!r} — that basis exists from v3.1",
              "spec v3.1 F0 — re-run under the current spec")
    rep.check(f.get("mode") == "FIDELITY" and f.get("des_version"), "4.13 DES",
              f"{ftag} is a FIDELITY object with a version stamp",
              f"{ftag} lacks mode: FIDELITY or des_version", "spec F5")
    v26 = des_ge(f.get("des_version"), (2, 6))
    if v26:
        rep.check(f.get("scope", "SOURCE") == scope, "4.13 DES", f"{ftag} scope is {scope}",
                  f"{ftag} scope is {f.get('scope')!r} where the record shape says {scope}", "spec v2.6 F5")
    basis = f.get("text_basis")
    rep.check(basis == basis_expected, "4.13 DES", f"{ftag} text_basis matches its source(s) ({basis})",
              f"{ftag} text_basis {basis!r} differs from the expected {basis_expected!r} — the two calls "
              f"scored the same text (POOLED: the weakest of them)",
              "step 4.13 Part 2b — pass the SOURCE call's text_basis unchanged")
    nums = [int(c["id"][1:]) for c in claims if re.fullmatch(r"u\d+", str(c.get("id")))]
    rep.check(claims and len(nums) == len(claims) and nums == sorted(set(nums)), "4.13 DES",
              f"{ftag} claim ids are page unit ids in order",
              f"{ftag} claim ids are {[c.get('id') for c in claims][:6]}… — one object per unit, ids copied "
              f"from the tool's split, strictly increasing", "spec F0/F5")
    bad_v = [c.get("id") for c in claims if c.get("verdict") not in DES_FID_VERDICTS]
    rep.check(not bad_v, "4.13 DES", f"{ftag} every verdict is from the closed list",
              f"{ftag} has verdicts outside the list on {bad_v}", "spec F2")
    # v3.3: a SECONDARY_REPORT (a consensus statement or guideline, read whole)
    # is a complete text for the FIDELITY question — its silence is
    # NOT_IN_SOURCE and the result is not provisional. Below 3.3 it was judged
    # like an abstract, and those records stay valid under their own stamp.
    complete = basis == "FULL_TEXT" or (basis == "SECONDARY_REPORT" and des_ge(f.get("des_version"), (3, 3)))
    wrong_basis = [c.get("id") for c in claims
                   if (c.get("verdict") == "NOT_IN_SOURCE" and not complete)
                   or (c.get("verdict") == "NOT_ASSESSABLE" and complete)]
    rep.check(not wrong_basis, "4.13 DES", f"{ftag} silence verdicts match the text basis",
              f"{ftag} uses NOT_IN_SOURCE/NOT_ASSESSABLE from the wrong row for {basis} on {wrong_basis}",
              "spec F2 — an abstract's silence is NOT_ASSESSABLE, a full text's (and, from v3.3, a secondary report's) is NOT_IN_SOURCE")
    bad_k = [c.get("id") for c in claims
             if (c.get("verdict") == "ALTERED") != (c.get("change_kind") is not None)
             or (c.get("verdict") == "ALTERED" and c.get("change_kind") not in DES_FID_KINDS)]
    rep.check(not bad_k, "4.13 DES", f"{ftag} change_kind is on every ALTERED and nowhere else",
              f"{ftag} change_kind is wrong on {bad_k}", "spec F2-i — five kinds, no OTHER")
    no_q = [c.get("id") for c in claims
            if c.get("verdict") in ("MATCHES", "ALTERED", "REVERSED") and not c.get("source_quote")]
    rep.check(not no_q, "4.13 DES", f"{ftag} every MATCHES/ALTERED/REVERSED quotes the source",
              f"{ftag} has an empty source_quote on {no_q}", "spec F2")
    if v26:
        if scope == "POOLED":
            bad_r = [c.get("id") for c in claims if c.get("source_quote")
                     and not re.fullmatch(r"S\d+", str(c.get("source_ref")))]
        else:
            bad_r = [c.get("id") for c in claims if c.get("source_ref") is not None]
        rep.check(not bad_r, "4.13 DES", f"{ftag} source_ref follows the scope",
                  f"{ftag} source_ref is wrong on {bad_r} — an «S<n>» tag on every quoted claim under "
                  f"POOLED, null under SOURCE", "spec v2.6 F5/F6")
    # A punctuation-only separator may be emitted as a NOT_A_CLAIM unit by
    # the official splitter, while text_of() intentionally drops it from the
    # page text. The unit remains auditable in the Fidelity record; it is not
    # a prose claim that needs a normalized text match.
    bad_c = [c.get("id") for c in claims
             if not (c.get("verdict") == "NOT_A_CLAIM"
                     and not re.search(r"\w", c.get("claim_quote") or ""))
             and des_norm(c.get("claim_quote") or "") not in page_hay]
    rep.check(not bad_c, "4.13 DES", f"{ftag} every claim_quote is verbatim from this page",
              f"{ftag} claim_quote is not on the page for {bad_c} — units are the page's own sentences, "
              f"copied whole", "spec F0 — claim_quote is the unit's text, verbatim")
    sqs = [c.get("source_quote") for c in claims if c.get("source_quote")]
    if source_hay is None:
        rep.skip("4.13 DES", f"{ftag} source quotes not checkable (source text not in the repo)")
    else:
        bad_s = [q for q in sqs if des_norm(q) not in source_hay]
        rep.check(not bad_s, "4.13 DES", f"{ftag} all {len(sqs)} source quotes are verbatim",
                  f"{ftag} has {len(bad_s)} source_quote(s) not in the source text, e.g. "
                  f"{repr((bad_s[0] or '')[:60]) if bad_s else ''}", "spec Core Rule 2")
    vs = [c.get("verdict") for c in claims]
    tally = {"matches": vs.count("MATCHES"), "altered": vs.count("ALTERED"),
             "reversed": vs.count("REVERSED"), "not_in_source": vs.count("NOT_IN_SOURCE"),
             "not_assessable": vs.count("NOT_ASSESSABLE"), "author_view": vs.count("AUTHOR_VIEW"),
             "not_a_claim": vs.count("NOT_A_CLAIM")}
    rep.check(f.get("counts") == tally, "4.13 DES", f"{ftag} counts equal the verdict tally",
              f"{ftag} counts {f.get('counts')} but the claims tally to {tally}",
              "spec F5 — counts are derived, re-run never hand-patch")
    assessable, score, level = des_fidelity_recompute(tally, f.get("des_version"))
    rep.check(f.get("assessable") == assessable and f.get("fidelity_score") == score
              and f.get("level") == level, "4.13 DES",
              f"{ftag} fidelity arithmetic checks out ({score} · {level})",
              f"{ftag} says {f.get('assessable')}/{f.get('fidelity_score')}/{f.get('level')} "
              f"but recomputes to {assessable}/{score}/{level}", "spec F4")
    rep.check(f.get("provisional") is (not complete), "4.13 DES",
              f"{ftag} provisional follows text_basis",
              f"{ftag} provisional is {f.get('provisional')} under {basis}",
              "spec F0 — provisional iff not a complete text (FULL_TEXT; SECONDARY_REPORT from v3.3)")


DES_EXEMPTIONS = ".dentcast/des-exemptions.json"


def des_absence_allowed(content_id, doc, etype):
    """An explicit, content-bound decision; never infer approval from no record."""
    if not exists(DES_EXEMPTIONS):
        return False, "no recorded DES exemption"
    try:
        records = json.loads(read(DES_EXEMPTIONS))
        if not isinstance(records, dict):
            raise ValueError("exemption registry must be an object")
        exemption = records.get(content_id)
        if not isinstance(exemption, dict):
            raise ValueError("no exemption for this content_id")
        if set(exemption) != {"content_id", "page_sha256", "reason", "approval"}:
            raise ValueError("invalid exemption fields")
        if exemption["content_id"] != content_id:
            raise ValueError("exemption belongs to another publication")
        # A v2 run binds the exemption before Push 2; the post-Push-2 Phase E
        # then adds only the publish marker. Accept the page without that one
        # marker as well as the final bytes.
        marker = '<meta name="dc-notify" content="true">'
        hashes = {hashlib.sha256(doc.encode("utf-8")).hexdigest()}
        if doc.count(marker) == 1:
            hashes.add(hashlib.sha256(doc.replace(marker, "", 1).encode("utf-8")).hexdigest())
        if exemption["page_sha256"] not in hashes:
            raise ValueError("exemption is stale: page changed")
        reason = exemption["reason"]
        if reason not in {"founder_without_des", "unsourced_audio_caption"}:
            raise ValueError("unknown DES exemption")
        if reason == "unsourced_audio_caption" and etype not in {"episode", "dentcast"}:
            raise ValueError("audio-caption exemption is only for episodes")
        approval = exemption["approval"]
        if not isinstance(approval, dict) or set(approval) != {"status", "decision", "evidence"}:
            raise ValueError("invalid exemption approval")
        evidence = approval["evidence"]
        if (approval["status"] != "confirmed" or not isinstance(approval["decision"], str)
                or not approval["decision"].strip() or not isinstance(evidence, list)
                or not evidence or not all(isinstance(e, str) and e.strip() for e in evidence)):
            raise ValueError("explicit confirmed approval and evidence are required")
        return True, reason
    except (ValueError, TypeError, KeyError) as exc:
        return False, str(exc)


def fidelity_absence_allowed(content_id, sources, index, assignment=None):
    """Apply canonical exemptions or recompute the existing tool's unit plan.

    assignment is a per-verification cache, not a stored claim of zero units.
    """
    import des_fidelity_units as units_tool
    if units_tool.is_audio_episode(content_id):
        return True, "audio episode: DES only, no Fidelity (founder, 1405/08/04)"
    source = sources[index]
    if source.get("error") or source.get("content_type") == "COMMENTARY":
        return True, "source error or COMMENTARY: no Fidelity call"
    if source.get("content_type") == "NOT_APPRAISABLE":
        if not des_ge(source.get("des_version"), (3, 1)):
            return True, "pre-3.1 NOT_APPRAISABLE source"
        if source.get("text_basis") == "CITATION_ONLY":
            return False, "CITATION_ONLY requires its INSUFFICIENT_TEXT Fidelity object"
    try:
        if assignment is None:
            assignment = {}
        if "result" not in assignment:
            import des_fidelity_units as units_tool
            units = units_tool.split_page(content_id, sources)
            mode, plan = units_tool.assign(units, sources, content_id)
            assignment["result"] = (units, mode, plan)
        units, mode, plan = assignment["result"]
        if not units:
            return False, "no units could be extracted; cannot prove an exemption"
        if mode == "SOURCE" and not plan.get(index):
            return True, "canonical unit assignment gives this source zero units"
        return False, "canonical unit assignment requires a Fidelity result"
    except (OSError, ValueError, KeyError, TypeError, SystemExit) as exc:
        return False, "unit assignment could not be verified: " + str(exc)


def des_fidelity_owed(s):
    """A source the FIDELITY call runs against (README step 4.13 Part 2b): any
    scored source, and from spec v3.1 a NOT_APPRAISABLE source whose SOURCE
    call read a text (FULL_TEXT or EXCERPT) — the gate is the text, not the score."""
    if s.get("error"):
        return False
    if s.get("content_type") == "NOT_APPRAISABLE":
        if s.get("source_kind") == "consensus" and des_ge(s.get("des_version"), (3, 4)):
            return s.get("text_basis") in ("FULL_TEXT", "EXCERPT", "SECONDARY_REPORT")
        return des_ge(s.get("des_version"), (3, 1)) and s.get("text_basis") in ("FULL_TEXT", "EXCERPT")
    return True


def des_ge(version, target):
    try:
        major, _, minor = (version or "").partition(".")
        return (int(major), int(minor or 0)) >= target
    except ValueError:
        return False


# Founder vocabulary for the Persian text a DES record shows on the page
# (founder, 1405/08/07): research literature is «منابع علمی», never «ادبیات».
# Checked on records stamped v3.5 or later; older records keep their text.
DES_FA_AVOID = (("ادبیات", "منابع علمی"),)


def des_fa_wording(rec):
    """Every `*_fa` string in a v3.5+ DES object (one source object or a whole
    record) that uses a word on DES_FA_AVOID: [(path, word, use_instead)]."""
    out = []

    def walk(o, path, ver):
        if isinstance(o, dict):
            ver = o.get("des_version", ver)
            for k, v in o.items():
                p = f"{path}.{k}" if path else k
                if isinstance(v, str) and k.endswith("_fa"):
                    if des_ge(ver, (3, 5)):
                        out.extend((p, bad, good) for bad, good in DES_FA_AVOID if bad in v)
                else:
                    walk(v, p, ver)
        elif isinstance(o, list):
            for i, x in enumerate(o):
                walk(x, f"{path}[{i}]", ver)

    walk(rec, "", None)
    return out


def des_fa_sentences(rec):
    """The interpretation_fa sentences of a DES object, for the Part 3(6)
    claim check: [(path, [sentence, ...])]."""
    out = []

    def walk(o, path):
        if isinstance(o, dict):
            for k, v in o.items():
                p = f"{path}.{k}" if path else k
                if k == "interpretation_fa" and isinstance(v, str) and v.strip():
                    out.append((p, [x.strip() for x in re.split(r"(?<=[.!؟])\s+", v.strip()) if x.strip()]))
                else:
                    walk(v, p)
        elif isinstance(o, list):
            for i, x in enumerate(o):
                walk(x, f"{path}[{i}]")

    walk(rec, "")
    return out


def des_text_report(path):
    """`--des-text FILE`: the Part 3(6) check on a DES JSON before it is
    stored. Exit 1 when a word on DES_FA_AVOID is used."""
    rec = json.loads(Path(path).read_text(encoding="utf-8"))
    bad = des_fa_wording(rec)
    for p, word, good in bad:
        print(f"FAIL  {p}: «{word}» → «{good}» (founder vocabulary; offer the founder the rewrite)")
    if not bad:
        print("ok    no word from the founder's avoid list (v3.5+ *_fa fields)")
    print("\nPart 3(6): each sentence below must say only what the scored text or the record itself says.")
    for p, sents in des_fa_sentences(rec):
        print(f"\n{p}")
        for i, x in enumerate(sents, 1):
            print(f"  {i}. {x}")
    return 1 if bad else 0


def des_norm(s):
    """The appendix's quote-comparison normalization: NFKC, collapse whitespace
    runs, strip soft hyphens and line-break hyphenation, straighten curly
    quotes, nbsp to space. Unlike normalize() above this DOES fold typographic
    variants, because here the two sides came from different extractions of the
    same text rather than from an author's keystrokes."""
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("­", "").replace(" ", " ")
    s = s.replace("‐", "-").replace("‑", "-").replace("–", "-").replace("—", "-")
    s = s.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"-\s*\n\s*", "", s)
    return re.sub(r"\s+", " ", s).strip()


_cabinet_by_doi = None


def des_source_text(source, doc, page_title=None):
    """The text a source's evidence_quotes must be substrings of, or None when
    the gate cannot see it.

    COMMENTARY normally means DentCast's (or a guest's) own authored piece,
    scored on the page's own body, which is right here — every prior COMMENTARY
    record's citation.title IS the page's own brain title (chairside-1,
    sharehub/share-1…). But basket 2's "one record per cited source" can also
    land a source on the COMMENTARY track when the CITED article itself is a
    narrative/opinion piece rather than a systematic study (episodes/episode-9's
    Gary Alex source is the first: AEGIS Dental Network, no DOI, explicitly
    "in this author's opinion" throughout — AMSTAR-2 has nothing to appraise in
    it). That article's text is not in this repo, so — like an uncached
    RESEARCH abstract below — it is unverifiable here, not wrong; the
    citation.title vs. brain-title mismatch is what tells the two cases apart.
    RESEARCH was scored on a paper's abstract, which lives in the repo only if
    that paper is in the local cabinet — the same lookup step 4.13 Part 1 does,
    including its case-insensitive DOI compare (the catalog stores DOIs as
    found, so episode-161's `10.1111/CLR.13672` is filed as `…/clr.13672`).
    Composed as the spec defines source_text: title, then abstract.
    """
    global _cabinet_by_doi
    # A NOT_APPRAISABLE source's text (a book chapter, a glossary entry — spec
    # v3.1) is never in this repo: the cabinet holds a paper's abstract, and
    # that would be the wrong haystack even when the DOI matches (the GPT has one).
    if source.get("content_type") == "NOT_APPRAISABLE":
        return None
    if source.get("content_type") == "COMMENTARY":
        cite_title = des_norm((source.get("citation") or {}).get("title") or "")
        if page_title is not None and cite_title and cite_title != des_norm(page_title):
            return None
        return des_norm(text_of(article_region(doc)))
    # A FULL_TEXT research score was read off the paper's PDF, which is not in
    # this repo and must not be — those are copyrighted articles, and the
    # cabinet deliberately stores only metadata plus the publisher's abstract.
    # So the abstract is the wrong haystack here: a quote pulled from the
    # Methods section is correctly absent from it, and checking against it
    # would fail every honest full-text score. Skip instead, and say why.
    # SECONDARY_REPORT is the same situation: the whole consensus/guideline
    # document was read, so its quotes can come from anywhere in it, and the
    # cabinet holds only the abstract.
    if source.get("text_basis") in ("FULL_TEXT", "SECONDARY_REPORT"):
        return None
    doi = ((source.get("citation") or {}).get("doi") or "").strip().lower()
    if not doi:
        return None
    if _cabinet_by_doi is None:
        _cabinet_by_doi = {}
        if exists("dentcast_cabinet_full_catalog.json"):
            for p in json.loads(read("dentcast_cabinet_full_catalog.json")).get("papers", []):
                d = (p.get("doi") or "").strip().lower()
                if d:
                    _cabinet_by_doi[d] = p
    paper = _cabinet_by_doi.get(doi)
    if not paper or not paper.get("abstract"):
        return None
    title = paper.get("real_title") or paper.get("display_title") or paper.get("title") or ""
    return des_norm(title + "\n\n" + paper["abstract"])


# DES v1.6: COMMENTARY checklist item 4 may be earned from a section's own
# published declaration instead of a sentence inside the page. Only these
# sections carry such a declaration, and the spec's table is closed — the one
# way in is that the section's landing page gets an explicit declaration first
# and the spec version bumps after, never resemblance to a section already
# listed. `insight/` is the precedent: it did NOT qualify under v1.6, when its
# landing page said the series covers clinical experience AND scientific
# findings and so could not tell a reader which one a given page was; v1.7
# added it after that page was rewritten.
DES_TYPE_LABEL_SECTIONS = ("chairside", "metanotes", "insight")
# The spec's own checklist table names item 4 in English; stored records use
# either that label or the Persian one, so both identify the same item.
DES_TYPE_LABEL_ITEM = "صریحاً تجربه/دیدگاه نامیده شده، نه شواهد"
DES_TYPE_LABEL_ITEMS = (DES_TYPE_LABEL_ITEM, "explicitly labeled as experience/opinion, not evidence")


def des_section_declaration(content_id):
    """The landing-page text a section-level item-4 quote must come from, or
    None when this content_id's section has no such declaration."""
    section = content_id.split("/")[0]
    if section not in DES_TYPE_LABEL_SECTIONS:
        return None
    path = f"{section}/index.html"
    if not exists(path):
        return None
    return des_norm(text_of(read(path)))


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
    # Glossary terms live in glossary/glossary.json, not the brain (README
    # step 5 note: "sourced from glossary/glossary.json, not from the brain").
    # Its schema has no `type`/`caption` keys and its Persian display name is
    # `fa_title` (its own `title` is the English term name) — normalize onto
    # the shape the checks below already expect so a glossary content_id runs
    # the same generic checks as everything else, rather than hard-failing at
    # "no entry" (which a glossary content_id can structurally never satisfy).
    gloss = json.loads(read("glossary/glossary.json"))["glossary"]
    for i, e in enumerate(gloss):
        if (e.get("url") or "").lstrip("/") == content_id + ".html":
            normalized = dict(e)
            normalized["title"] = e.get("fa_title", e.get("title", ""))
            return normalized, ("glossary", i, len(gloss)), brain
    return None, (None, None, None), brain


# --------------------------------------------------------------------------
# the checks
# --------------------------------------------------------------------------

def pulse_items(home):
    block = re.search(r'<ul\b[^>]*class=["\'][^"\']*\bdc-pulse-list\b[^"\']*["\'][^>]*>(.*?)</ul>', home, re.S)
    return re.findall(r'<li\b[^>]*>.*?</li>', block.group(1), re.S) if block else []


def _git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT,
                                   stderr=subprocess.DEVNULL, timeout=10).decode('utf-8')


def pulse_baseline(rep):
    """The homepage this branch was cut from: `git merge-base HEAD origin/main`.
    Comparing against the current origin/main would falsely fail whenever
    another publication reached main after this branch was cut. Falls back to
    origin/main (and says so) when no merge base is available, e.g. a shallow
    clone. Returns None after recording a FAIL if neither is readable."""
    try:
        base = _git('merge-base', 'HEAD', 'origin/main').strip()
    except (OSError, subprocess.SubprocessError, UnicodeError):
        base = ''
    if base:
        try:
            home = _git('show', f'{base}:index.html')
            rep.ok('6 pulse', f'Pulse baseline: merge-base {base[:10]} of HEAD and origin/main')
            return home
        except (OSError, subprocess.SubprocessError, UnicodeError):
            pass
    try:
        home = _git('show', 'origin/main:index.html')
    except (OSError, subprocess.SubprocessError, UnicodeError):
        rep.fail('6 pulse', 'cannot verify previous Pulse: local origin/main:index.html unavailable',
                 'fetch the main baseline before final verification: '
                 'git fetch origin +refs/heads/main:refs/remotes/origin/main')
        return None
    rep.warn('6 pulse', 'Pulse baseline: no merge-base of HEAD and origin/main (shallow '
                        'clone?); fell back to the current origin/main, which is only correct '
                        'if main has not advanced since this branch was cut',
             'git fetch --unshallow origin')
    return home


_EXAM_VALIDATOR = []
_BANK_CACHE = {}


def exam_validator():
    """tools/validate_exam_questions.py as a module (its git baseline and
    append-only comparison), or None where it is not present (synthetic
    roots in tests copy only this file)."""
    if not _EXAM_VALIDATOR:
        mod = None
        path = ROOT / "tools" / "validate_exam_questions.py"
        if path.exists():
            import importlib.util
            spec = importlib.util.spec_from_file_location("_dc_validate_exam_questions", path)
            mod = importlib.util.module_from_spec(spec)
            try:
                spec.loader.exec_module(mod)
            except Exception:  # noqa: BLE001 — a broken helper must not crash the gate
                mod = None
        _EXAM_VALIDATOR.append(mod)
    return _EXAM_VALIDATOR[0]


def _cid_of(key):
    return str(key or "").strip().lstrip("/").removesuffix(".html")


def _by_key(field, key):
    def extract(data):
        rows = data.get(field) if field and isinstance(data, dict) else data
        if not isinstance(rows, list):
            raise ValueError(f'expected a list{" under " + field if field else ""}')
        return {_cid_of(key(e)): e for e in rows if isinstance(e, dict) and key(e)}
    return extract


def _top_dict(field=None):
    def extract(data):
        d = data.get(field) if field else data
        if not isinstance(d, dict):
            raise ValueError(f'expected an object{" under " + field if field else ""}')
        return d
    return extract


def _pathway_steps(data):
    if not isinstance(data, list):
        raise ValueError("expected a list of pathways")
    return {p.get("id"): [s.get("content_id") for s in p.get("steps", []) if isinstance(s, dict)]
            for p in data if isinstance(p, dict) and p.get("id")}


# Bank-like files a publication appends to. (path, step, extractor, removal
# is a FAIL?) — removing another publication's entry FAILs; changing one
# WARNs (a founder-asked backfill or a cross-link pass is legitimate, but it
# should be seen). plus/challenges.json is regenerated from the pages and
# plus/pathways.json is re-curated by the founder, so a disappearance there
# WARNs. plus/exam-questions.json has its own row-level rules
# (tools/validate_exam_questions.py) and is checked through it.
BANK_FILES = [
    ("dentcast-brain.json", "F brain kept", _by_key(None, entry_url), True),
    ("dentcast.json", "F catalogue kept", _by_key(None, lambda e: e.get("page_url")), True),
    ("glossary/glossary.json", "F glossary kept", _by_key("glossary", lambda e: e.get("url") or e.get("slug")), True),
    ("litecast/lite-glossary.json", "F litecast kept", _by_key("LightGlossary", lambda e: e.get("page_url") or e.get("id")), True),
    ("plus/faq-corpus.json", "F faq-corpus kept", _top_dict("byContent"), True),
    ("plus/des-scores.json", "F des-scores kept", _top_dict(), True),
    (".dentcast/des-exemptions.json", "F des-exemptions kept", _top_dict(), True),
    ("plus/challenges.json", "F challenges kept", _top_dict("byContent"), False),
]


def _bank_pair(rel):
    """(baseline text or None, label, warning, current text or None), cached
    for the life of the process (a --all sweep compares each file once)."""
    if rel not in _BANK_CACHE:
        v = exam_validator()
        old, label, warning = v.git_baseline(rel, ROOT) if v else (None, "none", None)
        _BANK_CACHE[rel] = (old, label, warning, read(rel) if exists(rel) else None)
    return _BANK_CACHE[rel]


def _list_keys(keys, n=4):
    keys = sorted(map(str, keys))
    return ", ".join(keys[:n]) + (f" (+{len(keys) - n} more)" if len(keys) > n else "")


def check_bank_preservation(rep, content_id):
    """Phase F: a publication only ADDS to the shared data files — nothing it
    commits may delete or rewrite another publication's entry. Compared on
    parsed JSON keyed by content id against the branch's merge-base with
    origin/main, so a re-indent is not a change and the page's own entry may
    change freely."""
    v = exam_validator()
    if v is None:
        rep.skip("F data kept", "tools/validate_exam_questions.py not present — prior-data check not run")
        return
    # plus/exam-questions.json: row-level append-only rules.
    old, label, warning, cur = _bank_pair(v.REL)
    if warning:
        rep.warn("4.12-ب bank", f"exam bank: {warning}", "git fetch origin +refs/heads/main:refs/remotes/origin/main")
    if old is not None:
        if cur is None:
            rep.fail("4.12-ب bank", f"plus/exam-questions.json deleted (it existed at {label})",
                     "restore it: git checkout origin/main -- plus/exam-questions.json")
        else:
            try:
                errors, warns = v.compare_banks(json.loads(old), json.loads(cur), content_id)
            except ValueError as exc:
                errors, warns = [f"not valid JSON: {exc}"], []
            for w in warns:
                rep.warn("4.12-ب bank", w)
            rep.check(not errors, "4.12-ب bank",
                      f"existing exam questions unchanged since {label} (append-only)",
                      "plus/exam-questions.json lost or changed existing questions: "
                      + "; ".join(errors[:4]) + (f" (+{len(errors) - 4} more)" if len(errors) > 4 else ""),
                      f"restore the existing rows from {label}; only append new ones "
                      "(python3 tools/validate_exam_questions.py)")
    for rel, step, extract, removal_fails in BANK_FILES:
        old, label, warning, cur = _bank_pair(rel)
        if warning:
            rep.warn(step, f"{rel}: {warning}", "git fetch origin +refs/heads/main:refs/remotes/origin/main")
        if old is None:
            continue
        try:
            before = extract(json.loads(old))
        except ValueError:
            continue  # the baseline itself was not this shape: nothing to protect
        if cur is None:
            rep.fail(step, f"{rel} deleted (it existed at {label})", f"restore it from {label}")
            continue
        try:
            after = extract(json.loads(cur))
        except ValueError as exc:
            rep.fail(step, f"{rel} structure damaged: {exc}", f"restore its structure from {label}")
            continue
        removed = [k for k in before if k not in after]
        changed = [k for k in before if k in after and k != content_id and after[k] != before[k]]
        if removed:
            msg = (f"{rel}: {len(removed)} existing entr{'y' if len(removed) == 1 else 'ies'} "
                   f"removed since {label}: {_list_keys(removed)}")
            fix = f"restore them from {label} — a publication only adds its own entry"
            rep.fail(step, msg, fix) if removal_fails else rep.warn(step, msg, fix)
        if changed:
            rep.warn(step, f"{rel}: {len(changed)} other publication(s)' entries changed since "
                           f"{label}: {_list_keys(changed)} — confirm each was asked for")
        if not removed and not changed:
            rep.ok(step, f"{rel}: every entry from {label} kept")
    old, label, warning, cur = _bank_pair("plus/pathways.json")
    if old is not None and cur is not None:
        try:
            before, after = _pathway_steps(json.loads(old)), _pathway_steps(json.loads(cur))
        except ValueError as exc:
            rep.fail("F pathways kept", f"plus/pathways.json structure damaged: {exc}",
                     f"restore it from {label}")
            return
        gone = [p for p in before if p not in after]
        dropped = [f"{p}:{c}" for p, steps in before.items() if p in after
                   for c in steps if c not in after[p]]
        if gone or dropped:
            rep.warn("F pathways kept", f"plus/pathways.json since {label}: "
                     + (f"pathway(s) removed {_list_keys(gone)}; " if gone else "")
                     + (f"step(s) removed {_list_keys(dropped)}" if dropped else "")
                     + " — a publication only inserts its own step; confirm a founder curation pass")
        else:
            rep.ok("F pathways kept", f"plus/pathways.json: every pathway and step from {label} kept")
    elif old is not None and cur is None:
        rep.fail("F pathways kept", f"plus/pathways.json deleted (it existed at {label})",
                 f"restore it from {label}")


def check_pulse(rep, home, url, sweep=False, previous_home=None):
    items = pulse_items(home)
    def links(item):
        return re.findall(r'href=["\']([^"\']+)["\']', item)
    matches = [i for i, item in enumerate(items) if url in links(item)]
    rep.check(len(items) == 7, '6 pulse', 'Pulse has exactly 7 lines',
              f'Pulse has {len(items)} lines (expected 7)', 'step 6 — remove oldest bottom lines')
    if sweep and not matches:
        rep.skip('6 pulse', 'older content has rolled off Pulse')
        return
    rep.check(len(matches) == 1 and sum(links(item).count(url) for item in items) == 1,
              '6 pulse', 'exactly one Pulse line links to the page',
              'Pulse must link to this page exactly once', 'step 6')
    if sweep:
        return  # Older retained items need not be first.
    rep.check(matches == [0], '6 pulse', 'new Pulse item is the first line',
              'new Pulse item is not the first line', 'step 6 — insert at absolute top')
    if previous_home is not None:
        previous = pulse_items(previous_home)
        if any(url in links(item) for item in previous):
            return  # Already published in the baseline; do not insert again.
        rep.check(len(previous) == 7 and items[1:] == previous[:-1], '6 pulse',
                  'previous bottom line removed; other Pulse lines preserved in order',
                  'Pulse must drop only the previous bottom line and preserve the other six', 'step 6')


def site_path(href, page_rel):
    """The repo-relative path an internal href points at, or None if the href
    leaves the site (external host, tel:, mailto:, a bare #fragment)."""
    href = href.split("#")[0].split("?")[0]
    m = re.match(r"https?://(?:www\.)?dentcast\.(?:org|ir)(/.*)?$", href)
    if m:
        href = m.group(1) or "/"
    elif re.match(r"^[a-z][a-z0-9+.-]*:", href, re.I) or href.startswith("//") or not href:
        return None
    if href.startswith("/"):
        return posixpath.normpath(href).lstrip("/")
    return posixpath.normpath(posixpath.join(posixpath.dirname(page_rel), href))


def check_litecast_links(rep, doc, page_rel, brain):
    """Hard Rules 9/10, steps 0.2/0.5/0.6: LiteCast is an isolated track. Its
    «کاوش بیشتر» holds at most 5 links, all to other LiteCast entries (never
    the دانشنامه / فهرست موضوعی capsules, glossary terms or brain entries),
    and its body carries no inline links into specialist content."""
    lite = json.loads(read("litecast/lite-glossary.json"))["LightGlossary"]
    lite_pages = {(e.get("page_url") or "").lstrip("/") for e in lite} - {""}
    # The rules cap and scope the section's links; they do not require one
    # (step 0.3: no fabricated linking where the template has none).
    n_sections = doc.count('<div class="dc-related-section">')
    rep.check(n_sections <= 1, "2.5 related", "at most one «کاوش بیشتر» section",
              f"found {n_sections} dc-related-section blocks (expected at most 1)", "step 0.6")
    sec = related_section(doc)
    if sec:
        links = re.findall(r'href="([^"]+)"', sec.group(0))
        rep.check(len(links) <= 5, "9 cap",
                  f"{len(links)}/5 links in «کاوش بیشتر»",
                  f"{len(links)} links — over the hard cap of 5", "Hard Rule 9")
        foreign = [h for h in links if site_path(h, page_rel) not in lite_pages]
        rep.check(not foreign, "10 lite",
                  "«کاوش بیشتر» links only to other LiteCast entries",
                  f"«کاوش بیشتر» links outside LiteCast: {foreign}",
                  "Hard Rule 10 / step 0.6 — LiteCast-to-LiteCast only")
        rep.check(not any(site_path(h, page_rel) == page_rel for h in links), "4.9 related",
                  "no self-link", "the section links to the page itself")
    # Specialist content = every folder a non-LiteCast brain entry lives in,
    # plus the glossary and pillar hubs and the episodes landing page.
    specialist = {entry_url(e).lstrip("/").split("/")[0] for e in brain
                  if entry_url(e) and e.get("type") != LITECAST} | {"glossary", "pillar"}
    body = [h for h in re.findall(r'href="([^"]+)"', article_region(doc))
            if (p := site_path(h, page_rel)) is not None
            and (p.split("/")[0] in specialist or p == "episodes.html")]
    rep.check(not body, "10 lite", "body has no inline links to specialist content",
              f"body links into the specialist ecosystem: {body}",
              "Hard Rule 10 / step 0.2 — LiteCast in-body links go to other LiteCast items only")


def _gate(rep, sweep, cond, step, ok_msg, fail_msg, fix=None):
    """FAIL for the page being published; WARN in the --all backlog sweep."""
    if cond:
        rep.ok(step, ok_msg)
    else:
        (rep.warn if sweep else rep.fail)(step, fail_msg, fix)
    return cond


RELATED_LABEL = '<h2 class="ep-section-label">محتوای مرتبط</h2>'


def check_notecast_parent(rep, content_id, sweep=False):
    """Step 4.5: the parent episode /episodes/episode-XX.html (same XX) links
    back to /notecast/episode-XX.html in its «محتوای مرتبط» block."""
    slug = content_id.rsplit("/", 1)[-1]
    parent = "episodes/" + slug + ".html"
    fix = "step 4.5 — add the NoteCast link to the parent episode's related-content block"
    if not _gate(rep, sweep, exists(parent), "4.5 parent", f"parent episode {parent} exists",
                 f"parent episode {parent} does not exist", fix):
        return
    pdoc = strip_code(read(parent))
    want = "/" + content_id + ".html"
    links = []
    start = pdoc.find(RELATED_LABEL)
    if start >= 0:
        end = pdoc.find("</div>", start)
        links = re.findall(r'href="([^"#?]+)', pdoc[start:end if end >= 0 else len(pdoc)])
    _gate(rep, sweep, start >= 0 and want in links, "4.5 parent",
          f"{parent} «محتوای مرتبط» links to {want}",
          f"{parent} has no «محتوای مرتبط» link to {want}"
          + ("" if start >= 0 else " (no related-content block)"), fix)


EP_NAV_RE = re.compile(r'<div class="ep-nav">(.*?)</div>', re.S)
EP_SLOT_RE = re.compile(r'<(a|span)\b([^>]*)>(.*?)</\1>', re.S)


def _ep_nav_slots(doc):
    """[(tag, attrs, text)] of the single ep-nav block, or None."""
    blocks = list(EP_NAV_RE.finditer(doc))
    if len(blocks) != 1:
        return None, blocks
    return EP_SLOT_RE.findall(blocks[0].group(1)), blocks


def _slot_href(attrs):
    m = re.search(r'href="([^"]*)"', attrs)
    return m.group(1) if m else None


def _classes(attrs):
    m = re.search(r'class="([^"]*)"', attrs)
    return set(m.group(1).split()) if m else set()


def check_promptologist_nav(rep, content_id, doc, brain, sweep=False):
    """Step 4.6: the part's ep-nav (last element in <main>, after .ep-box) has
    exactly two slots — previous part, next part — each an active
    `<a href="/dentai/promptologist/<id>.html" class="ep-nav-btn">` or an
    empty `<span class="ep-nav-btn ep-nav-empty">`; the previous part's next
    slot links to this part. The series order is the brain order (appendix
    parts sit between numbered parts and season boundaries chain on)."""
    fix = "step 4.6 — wire the Promptologist prev/next ep-nav slots"
    parts = [entry_url(e) for e in brain if e.get("type") == "promptologist" and entry_url(e)]
    url = "/" + content_id + ".html"
    i = parts.index(url)
    prev = parts[i - 1] if i else None
    nxt = parts[i + 1] if i + 1 < len(parts) else None
    body = strip_code(doc)
    slots, blocks = _ep_nav_slots(body)
    if not _gate(rep, sweep, slots is not None and len(slots) == 2, "4.6 nav",
                 "exactly one ep-nav block with exactly two slots",
                 f"{len(blocks)} ep-nav block(s), "
                 f"{len(slots) if slots is not None else '?'} slot(s) (expected one block, two slots)", fix):
        return
    block = blocks[0]
    main_end = body.find("</main>", block.end())
    box = body.rfind('class="ep-box"', 0, block.start())
    _gate(rep, sweep, main_end >= 0 and not body[block.end():main_end].strip() and box >= 0,
          "4.6 nav", "ep-nav is the last element inside <main>, after .ep-box",
          "ep-nav is not the last element inside <main> after the .ep-box", fix)

    def expect(slot, target, label, side):
        tag, attrs, text = slot
        if target:
            return _gate(rep, sweep, tag == "a" and _slot_href(attrs) == target
                         and "ep-nav-btn" in _classes(attrs) and "ep-nav-empty" not in _classes(attrs)
                         and label in text,
                         "4.6 nav", f"{side} slot links to {target}",
                         f"{side} slot should be <a href=\"{target}\" class=\"ep-nav-btn\">…{label}…</a>, "
                         f"found <{tag}> href={_slot_href(attrs)} class={sorted(_classes(attrs))}", fix)
        return _gate(rep, sweep, tag == "span" and {"ep-nav-btn", "ep-nav-empty"} <= _classes(attrs)
                     and _slot_href(attrs) is None,
                     "4.6 nav", f"{side} slot is the empty placeholder (no {side} part)",
                     f"{side} slot should be <span class=\"ep-nav-btn ep-nav-empty\">, "
                     f"found <{tag}> href={_slot_href(attrs)}", fix)

    expect(slots[0], prev, "قسمت قبلی", "previous")
    expect(slots[1], nxt, "قسمت بعدی", "next")
    if prev and not sweep:
        # In the sweep the previous part is checked as its own page.
        prev_rel = prev.lstrip("/")
        pslots, _ = _ep_nav_slots(strip_code(read(prev_rel))) if exists(prev_rel) else (None, [])
        tag, attrs, text = pslots[1] if pslots and len(pslots) == 2 else ("", "", "")
        rep.check(tag == "a" and _slot_href(attrs) == url and "ep-nav-empty" not in _classes(attrs)
                  and "قسمت بعدی" in text, "4.6 nav",
                  f"previous part {prev_rel} next slot links here",
                  f"previous part {prev_rel} next slot does not link to {url} "
                  "(or its ep-nav does not have exactly two slots)", fix)


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

    if kind == "brain":
        etype = entry.get("type") or "episode"
    elif kind == "litecast":
        etype = LITECAST
    else:  # glossary
        etype = "glossary"
    is_lite = etype == LITECAST
    is_gloss = kind == "glossary"
    is_flashcard_optional = etype in FLASHCARD_OPTIONAL_TYPES
    page_rel = content_id + ".html"

    # ---------------- brain ----------------
    if is_gloss:
        # glossary/glossary.json is not dentcast-brain.json — tail position,
        # key-set parity against a "previous same-category entry", and a
        # site-wide `id` field are all brain-specific concepts (Hard Rules
        # 3/5) that glossary.json's own schema (slug/title/fa_title/…) does
        # not carry an equivalent of. README step 5 note: glossary terms are
        # "sourced from glossary/glossary.json, not from the brain".
        rep.skip("5 brain", "glossary term — recorded in glossary/glossary.json, "
                             "not dentcast-brain.json (no brain entry to check)")
    elif sweep and idx != total - 1:
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
    # claiming the same id. Glossary entries carry no `id` field at all
    # (they're keyed by `slug`), so this is meaningless for kind=="glossary".
    if not is_gloss:
        ids = [e.get("id") for e in brain
               if e.get("id") and (e.get("type") or "episode") == etype]
        rep.check(ids.count(entry.get("id")) <= 1, "5 brain",
                  f"id {entry.get('id')} is unique within {etype}",
                  f"id {entry.get('id')} appears twice within {etype}")

    # ---------------- pillar ----------------
    pillar = entry.get("pillar") or {}
    if is_lite:
        rep.skip("2.4 pillar", "LiteCast lives outside the specialist taxonomy")
    elif kind == "brain" or is_gloss:
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
    # چالش (step 4.14): detected from the page's own markup. Computed once,
    # here, so both the Phase D en-mirror exemption (RULE 16) and the
    # generated-index check further down (§11.5) agree on the same signal.
    is_challenge = "data-dc-challenge-question" in strip_code(doc)

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

    if is_gloss:
        # A glossary page's TechArticle.headline is, by deliberate template
        # convention (confirmed on glossary/treatment-plan and every other
        # existing term), a fuller SEO sentence — not the short term name —
        # so it never equals `title` (== fa_title) and checking that would
        # fail every glossary page that has ever shipped. The invariant that
        # DOES hold for a glossary page is the DefinedTerm's own
        # alternateName, which step 2's clone sets to the Persian term.
        for node in jsonld_nodes(doc, "DefinedTerm"):
            rep.check(node.get("alternateName") == title, "16 title",
                      "JSON-LD DefinedTerm.alternateName matches the term",
                      f"JSON-LD DefinedTerm.alternateName = {node.get('alternateName')!r}, "
                      f"fa_title = {title!r}",
                      "Hard Rule 16")
    else:
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

    # ---------------- series / parent navigation (steps 4.5, 4.6) ----------------
    if etype == "notecast":
        check_notecast_parent(rep, content_id, sweep)
    elif etype == "promptologist":
        check_promptologist_nav(rep, content_id, doc, brain, sweep)

    # ---------------- کاوش بیشتر ----------------
    n_sections = doc.count('<div class="dc-related-section">')
    # Core episodes carried no `type` field for their first 202 entries; more
    # recent ones (154+) write "type": "dentcast" instead (same category,
    # schema drift — see Hard Rule 6). Both must hit the episode branch.
    if is_lite:
        check_litecast_links(rep, doc, page_rel, brain)
    elif etype in ("episode", "dentcast"):
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
            primary = pillar.get("primary")
            # A non-structured pillar (live in the brain but absent from
            # PILLARS, e.g. "oral-medicine") has no /pillar/<slug>/ page to
            # link to — step 2.5's own precedent (notecast/episode-22) falls
            # back to the bare hub /pillar/ in that case, matching the 2.4
            # pillar check just above, which already treats "not in PILLARS"
            # as unstructured rather than a defect.
            want = f"/pillar/{primary}/" if primary and primary in live_pillars() else "/pillar/"
            rep.check(want in links, "2.5 related",
                      f"فهرست موضوعی → {want}",
                      f"pillar capsule does not point at {want} (found {links})",
                      "step 2.5 — canonical format: trailing slash, no index.html")
            rep.check(f"/{page_rel}" not in links, "4.9 related",
                      "no self-link", "the section links to the page itself")

    # ---------------- FAQ + flashcards ----------------
    # Content lives in plus/faq-corpus.json, not in the page's own JSON-LD —
    # see .dentcast/faq-schema-removal-handoff.md. The page itself must carry
    # neither a FAQPage node nor a #flashcards-tagged DefinedTermSet; this
    # check runs for every page (including LiteCast) so the hidden schema can
    # never silently come back via a future publish or clone.
    rep.check(
        '"FAQPage"' not in doc and "#flashcards" not in doc,
        "4.12 no-page-schema",
        "page carries no FAQPage/flashcards JSON-LD",
        "page still has hidden FAQPage/DefinedTermSet schema in its own JSON-LD",
        f"python3 tools/strip_faq_schema.py {page_rel}",
    )

    corpus_entry = faq_corpus().get(content_id, {})
    faqs = corpus_entry.get("faqPages", [])
    questions = [q for f in faqs for q in f.get("mainEntity", [])]
    if is_lite:
        rep.skip("4.12 quiz", "LiteCast is outside the quiz ecosystem")
        rep.skip("4.11 cards", "LiteCast is outside the flashcard ecosystem")
    elif is_challenge:
        rep.skip("4.12 quiz", "چالش: no prose to author FAQ from (step 4.14)")
        rep.skip("4.11 cards", "چالش: no prose to define terms from (step 4.14)")
    elif is_flashcard_optional and not questions:
        rep.skip("4.12 quiz", "dentcast_plus: flashcards/quiz are optional — no FAQ authored")
        rep.skip("4.11 cards", "dentcast_plus: flashcards/quiz are optional — no cards authored")
    else:
        rep.check(bool(questions), "4.12 quiz", f"{len(questions)} FAQ questions",
                  "no FAQ entry for this page in plus/faq-corpus.json", "step 4.12")
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

        sets = corpus_entry.get("definedTermSets", [])
        rep.check(len(sets) == 1, "4.11 cards",
                  "one DefinedTermSet block",
                  f"found {len(sets)} DefinedTermSet blocks in plus/faq-corpus.json", "step 4.11")
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

    # ---------------- DES (step 4.13) ----------------
    # Every check here mirrors step 4.13 Part 3, which is the appendix's own
    # pipeline contract. It exists because that contract is arithmetic and
    # arithmetic is exactly what prose cannot enforce: the first three records
    # written by hand shipped two sources at multiplier 0.80 while marked
    # ABSTRACT_ONLY, which the spec caps at 0.75 — a mistake that moved one
    # paper from band C to band D and was invisible to re-reading.
    #
    # Missing results fail closed. Category exceptions stay explicit; other
    # DES exemptions require a current page-bound approval. Null Fidelity is
    # accepted only by the canonical source rules or recomputed unit assignment.
    if is_lite:
        rep.skip("4.13 DES", "LiteCast is outside the DES ecosystem (Hard Rule 10)")
    elif is_challenge:
        rep.skip("4.13 DES", "چالش: a question cites nothing and appraises nothing (step 4.14)")
    else:
        des_all = json.loads(read("plus/des-scores.json")) if exists("plus/des-scores.json") else {}
        rec = des_all.get(content_id)
        if not rec:
            allowed, reason = des_absence_allowed(content_id, doc, etype)
            if allowed:
                rep.skip("4.13 DES", "recorded exemption: " + reason)
            else:
                rep.fail("4.13 DES", "missing DES without a valid exemption: " + reason,
                         "run step 4.13, or record the founder's actual scoped approval in " + DES_EXEMPTIONS)
        else:
            if not isinstance(rec, dict):
                rep.fail("4.13 DES", "DES record must be an object")
                return rep
            # `fidelity` (spec v2.5) is the one other key: an array parallel
            # to `sources`, holding the FIDELITY call's own output objects —
            # data the spec owns, not something derivable from `sources`.
            rep.check(set(rec) in ({"scored_at", "sources"}, {"scored_at", "sources", "fidelity"}),
                      "4.13 DES",
                      "record carries only scored_at + sources (+ fidelity)",
                      f"record has extra wrapper keys "
                      f"{sorted(set(rec) - {'scored_at', 'sources', 'fidelity'})} — "
                      f"band/content_type/question_type live INSIDE each source and a second copy "
                      f"is a second source of truth",
                      "step 4.13 Part 4 — nothing derivable is stored beside the sources")
            _fa_bad = des_fa_wording(rec)
            _gate(rep, sweep, not _fa_bad, "4.13 DES",
                  "Persian DES text uses the founder's vocabulary",
                  "Persian DES text uses a word the founder replaced: "
                  + "; ".join(f"{p} «{w}» → «{g}»" for p, w, g in _fa_bad),
                  "step 4.13 Part 3(6) — offer the founder the rewrite; never change a score with it")
            srcs = rec.get("sources") or []
            valid_sources = isinstance(srcs, list) and bool(srcs) and all(isinstance(s, dict) for s in srcs)
            rep.check(valid_sources, "4.13 DES", "nonempty source records present",
                      "DES sources must be a nonempty array of source objects", "step 4.13")
            if not valid_sources:
                return rep
            assignment = {}
            if valid_sources and "fidelity" not in rec:
                for i in range(len(srcs)):
                    allowed, reason = fidelity_absence_allowed(content_id, srcs, i, assignment)
                    rep.check(allowed, "4.13 DES", f"fid{i}: {reason}",
                              f"fid{i} missing: {reason}", "step 4.13 Part 2b")
            if "fidelity" in rec:
                import des_fidelity_units as units_tool
                rep.check(not units_tool.is_audio_episode(content_id), "4.13 DES",
                          "no Fidelity on an audio episode",
                          "an audio episode carries a fidelity slot — episodes get DES only",
                          "step 4.13 Part 2b — drop the record's fidelity key (founder, 1405/08/04)")
                fid = rec.get("fidelity")
                srcs = rec.get("sources") or []
                # the tool's units start with the page's own <h1>, which
                # article_region() begins AFTER — so the title is added back
                _h1 = re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S)
                page_hay = des_norm((text_of(_h1.group(1)) + " " if _h1 else "") + text_of(article_region(doc)))
                if isinstance(fid, dict):
                    # spec v2.6 F6: a page naming none of its sources inline is
                    # judged ONCE against all of them — one pooled object, not
                    # an array, because no slot belongs to any one source.
                    scored = [s for s in srcs if des_fidelity_owed(s)]
                    rep.check(len(scored) > 1, "4.13 DES", "pooled fidelity sits on a page with several sources",
                              "fidelity is a pooled object on a page with one scored source — POOLED exists "
                              "only for several sources none of which the prose names",
                              "spec v2.6 F6 / tools/des_fidelity_units.py decides the scope")
                    bases = [s.get("text_basis") for s in scored]
                    _order = ("FULL_TEXT", "SECONDARY_REPORT", "ABSTRACT_ONLY", "EXCERPT")
                    weakest = max(bases, key=lambda b: _order.index(b) if b in _order else 2) if bases else None
                    hays = [des_source_text(s, doc, page_title=title) for s in scored]
                    pooled_hay = None if any(h is None for h in hays) else " ".join(hays)
                    des_check_fidelity(rep, "fidPOOLED", fid, "POOLED", weakest, page_hay, pooled_hay)
                elif rep.check(isinstance(fid, list) and len(fid) == len(srcs),
                               "4.13 DES", "fidelity is parallel to sources",
                               f"fidelity has {len(fid) if isinstance(fid, list) else '?'} slots against "
                               f"{len(srcs)} sources — slot i is the FIDELITY object "
                               f"for sources[i], null where no call ran",
                               "step 4.13 Part 4 — one slot per source, same order"):
                    # Missing slots are checked against each source's version
                    # and the current canonical unit assignment.
                    for i, f in enumerate(fid):
                        ftag = f"fid{i}"
                        src_i = srcs[i] or {}
                        is_na = src_i.get("content_type") == "NOT_APPRAISABLE"
                        if f is None:
                            allowed, reason = fidelity_absence_allowed(content_id, srcs, i, assignment)
                            rep.check(allowed, "4.13 DES", f"{ftag}: {reason}",
                                      f"{ftag} is null: {reason}", "step 4.13 Part 2b")
                            continue
                        if isinstance(f, dict) and f.get("error"):
                            # spec v3.1 appendix rule 8: the spec's own error object in
                            # a slot says the text was sought and not found — legal
                            # only on a NOT_APPRAISABLE source recorded CITATION_ONLY
                            rep.check(is_na and src_i.get("text_basis") == "CITATION_ONLY"
                                      and f.get("error") == "INSUFFICIENT_TEXT" and des_ge(f.get("des_version"), (3, 1)),
                                      "4.13 DES", f"{ftag} records INSUFFICIENT_TEXT for a citation-only source",
                                      f"{ftag} is an error object ({f.get('error')!r}, v{f.get('des_version')}) on a source that is "
                                      f"{src_i.get('content_type')}/{src_i.get('text_basis')} — an error slot belongs only to a "
                                      f"NOT_APPRAISABLE source whose text was not in hand (CITATION_ONLY), from v3.1",
                                      "spec v3.1 appendix rule 8 — a scored source with no text is an error in `sources`, "
                                      "and its fidelity slot is null")
                            continue
                        if is_na:
                            # spec v3.1: a book's fidelity is judged on the text its
                            # SOURCE call read, so the record must say which text that was
                            _na_ok = ("FULL_TEXT", "EXCERPT") + (("SECONDARY_REPORT",) if src_i.get("source_kind") == "consensus"
                                                                  and des_ge(src_i.get("des_version"), (3, 4)) else ())
                            if not rep.check(des_ge(f.get("des_version"), (3, 1)) and src_i.get("text_basis") in _na_ok,
                                             "4.13 DES", f"{ftag} fidelity on an unscored source is a 3.1 call over a text in hand",
                                             f"{ftag} is a fidelity object (v{f.get('des_version')}) on a NOT_APPRAISABLE source whose "
                                             f"text_basis is {src_i.get('text_basis')!r} — before v3.1 a book got no call, and a call "
                                             f"needs FULL_TEXT or EXCERPT in hand",
                                             "spec v3.1 appendix rule 8 — re-run the SOURCE call on the text (EXCERPT/FULL_TEXT), then the FIDELITY call"):
                                continue
                        des_check_fidelity(rep, ftag, f, "SOURCE", src_i.get("text_basis"), page_hay,
                                           des_source_text(src_i, doc, page_title=title))
            for i, s in enumerate(rec.get("sources") or []):
                tag = f"src{i}"
                if s.get("error"):
                    rep.ok("4.13 DES", f"{tag} recorded as {s['error']} (correctly not scored)")
                    continue
                rep.check(s.get("des_version"), "4.13 DES", f"{tag} carries des_version",
                          f"{tag} has no des_version — old scores must never be silently compared "
                          f"with new ones", "spec §Versioning")
                # A NOT_APPRAISABLE source (spec v1.9) has no arithmetic, no
                # band and no track — only the claim that it was cited and why
                # it carries no score. Check exactly that and skip the rest;
                # running the band/arithmetic rows on it would fail every one.
                if s.get("content_type") == "NOT_APPRAISABLE":
                    nulls = [k for k in ("des_score", "band", "question_type", "s_design",
                                         "q_method", "penalties", "commentary_checklist")
                             if s.get(k) is not None]
                    rep.check(not nulls, "4.13 DES",
                              f"{tag} not-appraisable source carries no score",
                              f"{tag} is NOT_APPRAISABLE but {nulls} is not null — a source with "
                              f"no method to appraise must carry no number at all",
                              "spec v1.9 — des_score/band/question_type and every track field are null")
                    kinds = (DES_NA_KINDS_34 if des_ge(s.get("des_version"), (3, 4))
                             else DES_NA_KINDS_31 if des_ge(s.get("des_version"), (3, 1)) else ("book",))
                    is_cons = s.get("source_kind") == "consensus" and des_ge(s.get("des_version"), (3, 4))
                    rep.check(s.get("source_kind") in kinds, "4.13 DES",
                              f"{tag} names why it is not appraisable ({s.get('source_kind')})",
                              f"{tag} is NOT_APPRAISABLE with source_kind={s.get('source_kind')!r} — "
                              f"the list is closed: {list(kinds)} under v{s.get('des_version')}",
                              "spec v3.1 Step 1 — book, glossary or standard (v1.9–3.0: book only)")
                    # spec v3.1: a NOT_APPRAISABLE object says what text was in hand
                    # through a list of its own; a pre-3.1 record keeps whatever it wrote
                    if des_ge(s.get("des_version"), (3, 1)):
                        rep.check(s.get("text_basis") in DES_NA_BASES_31
                                  or (is_cons and s.get("text_basis") == "SECONDARY_REPORT"), "4.13 DES",
                                  f"{tag} states the text in hand ({s.get('text_basis')})",
                                  f"{tag} is NOT_APPRAISABLE (v{s.get('des_version')}) with text_basis="
                                  f"{s.get('text_basis')!r} — FULL_TEXT, EXCERPT or CITATION_ONLY, honestly",
                                  "spec v3.1 Step 1 — an abstract a book does not have is not a basis")
                    if is_cons:
                        ev = s.get("evidence_basis")
                        rep.check(bool((s.get("issuing_bodies") or "").strip()) and bool((s.get("issuing_quote") or "").strip()),
                                  "4.13 DES", f"{tag} consensus names its issuing bodies from the document",
                                  f"{tag} is a consensus with no issuing_bodies/issuing_quote — the bodies are copied from "
                                  f"the document, never composed", "spec v3.4 Step 1")
                        rep.check(ev in ("EVIDENCE_REVIEWED", "EXPERT_CONSENSUS")
                                  and bool((s.get("basis_quote") or "").strip()) == (ev == "EVIDENCE_REVIEWED"),
                                  "4.13 DES", f"{tag} consensus basis ({ev}) agrees with its basis_quote",
                                  f"{tag} evidence_basis={ev!r} basis_quote={s.get('basis_quote')!r} — a quote exactly when "
                                  f"the document reports a systematic search", "spec v3.4 Step 1")
                        rep.check(s.get("interpretation_fa") is None, "4.13 DES",
                                  f"{tag} consensus carries no model-written interpretation",
                                  f"{tag} consensus has interpretation_fa — the explanation is fixed display text",
                                  "spec v3.4 Step 1 — interpretation_fa is null")
                    rep.check(((s.get("citation") or {}).get("title") or "").strip(), "4.13 DES",
                              f"{tag} not-appraisable source names the work",
                              f"{tag} is NOT_APPRAISABLE with no citation.title — an unscored source "
                              f"is only honest if the reader can see WHAT was cited",
                              "spec v1.9 — fill citation from the reference line")
                    continue
                is_comm = s.get("content_type") == "COMMENTARY"
                rep.check(s.get("text_basis") not in DES_NA_ONLY_BASES, "4.13 DES",
                          f"{tag} is scored from an abstract or a full text",
                          f"{tag} is {s.get('content_type')} on text_basis {s.get('text_basis')!r} — EXCERPT and "
                          f"CITATION_ONLY exist for a NOT_APPRAISABLE source only; a paper is scored from its abstract "
                          f"or its full text, never a chosen part",
                          "spec v3.1 Step 1 — resolve the abstract or the full text and re-run")

                # 2 — arithmetic recomputation
                if is_comm:
                    calc = 5 + sum(int(c.get("points", 0)) for c in (s.get("commentary_checklist") or []))
                else:
                    pen = sum(int(p.get("points", 0)) for p in (s.get("penalties") or []))
                    sd = (s.get("s_design") or {}).get("value", 0)
                    mult = (s.get("q_method") or {}).get("multiplier", 0)
                    # Spec v1.4 Step 5: exact decimals, round HALF UP, then subtract.
                    # Not Python's round(), which is half-to-even — round(22.5) is 22
                    # while round(27.5) is 28, and JS disagrees with both. On this
                    # scale 65 × 0.30 = 19.5 sits exactly on the E/D boundary, so the
                    # rounding rule alone would decide that paper's band.
                    prod = (Decimal(str(sd)) * Decimal(str(mult))).quantize(
                        Decimal("1"), rounding=ROUND_HALF_UP)
                    calc = max(0, int(prod) - pen)
                rep.check(calc == s.get("des_score"), "4.13 DES",
                          f"{tag} arithmetic checks out ({s.get('des_score')})",
                          f"{tag} des_score is {s.get('des_score')} but recomputes to {calc}",
                          "step 4.13 Part 3(2) — re-run the score, never hand-patch the number")

                # 2b — spec v2.0 Step 4a: a penalty is a SHARE of the design
                # anchor, not a flat deduction. Checked only from v2.0 on, so
                # records stamped 1.x keep validating against the flat table
                # they were written under — the version stamp is what makes an
                # arithmetic change auditable instead of retroactive.
                #
                # `points` stores what was actually subtracted (so the sum above
                # stays the whole story) and `base_points` stores the row's
                # table weight, which is what makes the scaling checkable rather
                # than asserted. Without it the gate could not tell a correctly
                # scaled 1 from a forgotten 8.
                if not is_comm and des_ge_2(s.get("des_version")):
                    for p in (s.get("penalties") or []):
                        if "base_points" not in p:
                            rep.fail("4.13 DES",
                                     f"{tag} penalty «{p.get('item', '?')}» has no base_points",
                                     "spec v2.0 Step 4a — every penalty row carries its table weight")
                            continue
                        want = des_scaled_penalty(p.get("base_points", 0),
                                                  (s.get("s_design") or {}).get("value", 0))
                        got = int(p.get("points", 0))
                        # 0 is always legal: the row was considered and dismissed.
                        if got == 0:
                            continue
                        rep.check(got == want, "4.13 DES",
                                  f"{tag} penalty «{p.get('item', '?')}» is scaled to the anchor ({got})",
                                  f"{tag} penalty «{p.get('item', '?')}» subtracts {got}, but "
                                  f"base_points {p.get('base_points')} at S_design "
                                  f"{(s.get('s_design') or {}).get('value')} scales to {want}",
                                  "spec v2.0 Step 4a — max(1, round_half_up(base × S_design ÷ 100))")

                # 3 — band agreement, and COMMENTARY is always E
                lo, hi = DES_BANDS.get(s.get("band"), (None, None))
                rep.check(lo is not None and lo <= s.get("des_score", -1) <= hi, "4.13 DES",
                          f"{tag} band {s.get('band')} matches its score",
                          f"{tag} score {s.get('des_score')} does not fall in band {s.get('band')}",
                          "step 4.13 Part 3(3)")
                if is_comm:
                    rep.check(s.get("band") == "E" and 5 <= s.get("des_score", -1) <= 19,
                              "4.13 DES", f"{tag} commentary is band E in 5–19",
                              f"{tag} is COMMENTARY but scored {s.get('des_score')}/{s.get('band')} — "
                              f"the model took the wrong track",
                              "COMMENTARY track — fixed band E, score 5–19")

                # 4 — schema: the null-ing is what says which track this is
                if is_comm:
                    bad = [k for k in ("s_design", "q_method", "penalties") if s.get(k) is not None]
                    rep.check(not bad and s.get("question_type") is None, "4.13 DES",
                              f"{tag} commentary nulls are correct",
                              f"{tag} is COMMENTARY but {bad or ['question_type']} is not null",
                              "spec §Output format")
                else:
                    rep.check(s.get("commentary_checklist") is None and s.get("question_type"),
                              "4.13 DES", f"{tag} research shape is correct",
                              f"{tag} is RESEARCH but carries a commentary_checklist or no question_type",
                              "spec §Output format")

                # The capped-basis rule, which is load-bearing and was got wrong
                # once. Two bases share it, for the same reason from opposite
                # directions: ABSTRACT_ONLY condenses the document by LENGTH,
                # SECONDARY_REPORT (spec v2.2 — a consensus statement, a
                # guideline) condenses it by ROLE. In both, a method is missing
                # from the text because of what the text is, not because the
                # study skipped it, so silence rates NR and the multiplier is
                # capped at 0.75.
                basis = s.get("text_basis")
                if basis in ("ABSTRACT_ONLY", "SECONDARY_REPORT"):
                    mult = (s.get("q_method") or {}).get("multiplier")
                    rep.check(mult is None or mult <= 0.75, "4.13 DES",
                              f"{tag} {basis} multiplier is capped ({mult})",
                              f"{tag} is {basis} but its multiplier is {mult} — the spec caps it "
                              f"at 0.75, so this score is inflated",
                              "step 4.13 Part 1 — recompute with 0.75")
                    rep.check(s.get("provisional") is True, "4.13 DES",
                              f"{tag} {basis} is marked provisional",
                              f"{tag} is {basis} but provisional is {s.get('provisional')}",
                              f"spec Step 0 — {basis} forces provisional: true")

                # Absence protocol (spec v1.5 Step 3b-ii). An empty
                # evidence_quote is legal in exactly one place — a domain rated
                # `high` because the safeguard is absent, which by definition has
                # nothing to quote — and there it must carry a note naming what
                # was read. Without that, "absent" is an assertion rather than a
                # finding, and nobody downstream can check it.
                for dom in ((s.get("q_method") or {}).get("domains") or []):
                    if dom.get("evidence_quote"):
                        continue
                    label = dom.get("domain", "?")
                    if dom.get("rating") == "high":
                        rep.check(bool((dom.get("note") or "").strip()), "4.13 DES",
                                  f"{tag} absence-based high on «{label}» is documented",
                                  f"{tag} rates «{label}» high with no quote and no note — "
                                  f"an absence claim has to say what was read",
                                  "spec Step 3b-ii — name the sections searched in `note`")
                    elif dom.get("rating") in ("low", "some_concerns"):
                        rep.fail("4.13 DES",
                                 f"{tag} rates «{label}» {dom['rating']} with an empty quote",
                                 "Core Rule 2 — only an absence-based `high` may omit the quote")

                # 1b — the v1.6 section-level carve-out on checklist item 4.
                # A `note` on that item is what says "this quote is not from the
                # article", so the note is the discriminator, not a guess: with
                # one, the quote is checked against the section's landing page
                # and the section must be on the spec's closed list; without
                # one, it is an ordinary in-page label and falls through to the
                # normal check below.
                section_quotes = []
                for c in (s.get("commentary_checklist") or []):
                    if c.get("item") not in DES_TYPE_LABEL_ITEMS or not c.get("points"):
                        continue
                    note = (c.get("note") or "").strip()
                    if not note:
                        continue
                    decl = des_section_declaration(content_id)
                    if rep.check(decl is not None, "4.13 DES",
                                 f"{tag} item 4 cites a section declaration from a section that has one",
                                 f"{tag} earns checklist item 4 from a section-level declaration, but "
                                 f"«{content_id.split('/')[0]}/» is not on the spec's closed list "
                                 f"{list(DES_TYPE_LABEL_SECTIONS)}",
                                 "spec v1.6 COMMENTARY track — the qualifying list is closed; "
                                 "insight/ is deliberately excluded"):
                        section_quotes.append(c.get("evidence_quote") or "")
                        rep.check(content_id.split("/")[0] in note, "4.13 DES",
                                  f"{tag} item 4's note names the file the declaration came from",
                                  f"{tag} earns item 4 from a section declaration but its note "
                                  f"({note!r}) does not name the section it was read from",
                                  "spec v1.6 — the note is mandatory and names the landing page")
                if section_quotes:
                    decl = des_section_declaration(content_id)
                    bad_s = [q for q in section_quotes if not q or des_norm(q) not in decl]
                    sample_s = repr((bad_s[0] or "")[:60]) if bad_s else ""
                    rep.check(not bad_s, "4.13 DES",
                              f"{tag} item 4's declaration quote is verbatim from "
                              f"{content_id.split('/')[0]}/index.html",
                              f"{tag} item 4 quotes a declaration that is NOT on that section's "
                              f"landing page, e.g. {sample_s}",
                              "spec v1.6 — copy the declaration verbatim, never paraphrase it")

                # 1 — quote verification, wherever the source text is reachable.
                # A COMMENTARY source whose citation IS this page (the ordinary
                # case) has quotes from the page's own body, so they are always
                # checkable. RESEARCH quotes come from an abstract, which the
                # gate can only see when the paper is in the local cabinet — and
                # a COMMENTARY source citing a DIFFERENT, externally-authored
                # article is the same situation: unverifiable here, not wrong.
                quotes = [q for q in (
                    [(s.get("s_design") or {}).get("evidence_quote")]
                    + [d.get("evidence_quote") for d in ((s.get("q_method") or {}).get("domains") or [])]
                    + [c.get("evidence_quote") for c in (s.get("commentary_checklist") or [])]
                    + [p.get("evidence_quote") for p in (s.get("penalties") or [])]
                ) if q and q not in section_quotes]
                haystack = des_source_text(s, doc, page_title=title) if quotes else None
                if haystack is None:
                    rep.skip("4.13 DES", f"{tag} quotes not checkable (source text not in the repo)")
                else:
                    bad = [q for q in quotes if des_norm(q) not in haystack]
                    # rep.check builds both messages eagerly, so the failure text
                    # has to be safe to construct on the passing path too.
                    sample = repr(bad[0][:60]) if bad else ""
                    rep.check(not bad, "4.13 DES",
                              f"{tag} all {len(quotes)} evidence quotes are verbatim",
                              f"{tag} has {len(bad)} evidence_quote(s) that are NOT a substring of the "
                              f"source text, e.g. {sample}",
                              "step 4.13 Part 3(1) — quote the source, never reconstruct it")

    # ---------------- Phase D / E ----------------
    # as_posix(): on Windows Path.parent injects backslashes, which must never
    # enter URL / HTML substring checks (canonical, sitemap).
    en_rel = f"{Path(content_id).parent.as_posix()}/en/{Path(content_id).name}.html"
    if is_lite:
        rep.skip("D en-mirror", "LiteCast is .ir-only — no hreflang, no en mirror (Hard Rule 10)")
        rep.skip("E notify", "LiteCast is outside the Plus push ecosystem")
        rep.check("hreflang" not in doc, "D en-mirror", "no hreflang on a .ir page",
                  "a LiteCast page carries hreflang tags", "Hard Rule 10")
    elif is_challenge:
        rep.skip("D en-mirror", "چالش: no en mirror — RULE 16 of .dentcast/challenge-handoff.md "
                                 "(the mirror would be a different content_id with no row in `challenges`)")
        rep.check('class="lang-btn"' not in doc, "D en-mirror",
                  "no fa↔en toggle on a چالش page",
                  "a چالش page carries a .lang-btn toggle with no reachable en mirror behind it (RULE 16)")
        rep.check("hreflang" not in doc, "D hreflang",
                  "no hreflang on a چالش page (RULE 16 — no en mirror to alternate with)",
                  "a چالش page carries hreflang tags")
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
            en_robots = meta(en, name="robots") or ""
            rep.check("noindex" in en_robots, "D en-noindex",
                      "en mirror is noindexed",
                      f"en robots meta is «{en_robots}» — en mirrors are unreviewed AI "
                      f"translations and must stay out of search",
                      "python3 tools/noindex_en_mirrors.py")
            rep.check("hreflang" not in en, "D en-noindex",
                      "en mirror carries no hreflang",
                      "en mirror still advertises itself in an hreflang cluster",
                      "python3 .github/scripts/inject_hreflang.py")
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
        rep.check(sorted(alts) == ["fa", "fa-IR", "x-default"], "D hreflang",
                  "3-line hreflang block present (no en — mirrors are noindexed)",
                  f"hreflang set is {sorted(alts)}, expected fa/fa-IR/x-default "
                  f"(the en alternate was retired when the unreviewed en mirrors went noindex)",
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
    # A type's landing page is normally <dir>/index.html. Episodes are the one
    # exception: episodes/index.html is a noindex `http-equiv=refresh` stub
    # pointing at /episodes.html, and the workflow says never to hand-edit it
    # (Phase C step 8.3). Deriving the landing page from the directory therefore
    # asked the redirect whether it links to the episode — which it never does,
    # and never should — and failed all 209 episodes on a page that is working
    # exactly as designed. The real landing page is episodes.html, built by
    # tools/build_episodes.py.
    #
    # DentAI and PhotoCast are closed sections: their folders stay on disk but
    # their pages are listed on sharehub/index.html, not on their own landing
    # (.dentcast/workflows/global/repo-conventions.md).
    landing = f"{Path(content_id).parent}/index.html"
    needle = Path(content_id).name + ".html"
    if landing == "episodes/index.html":
        landing = "episodes.html"
    elif landing in ("dentai/index.html", "photocast/index.html"):
        # sharehub/index.html also lists its own pages, so match the full
        # path (photocast/episode-2.html is not episodes/episode-2.html).
        landing, needle = "sharehub/index.html", "/" + page_rel
    if exists(landing):
        land = read(landing)
        n = len(re.findall(re.escape(needle), land))
        rep.check(n >= 1, "2.6 landing", f"{landing} links to the page",
                  f"{landing} has no link to the new entry", "step 2.6")
        if n >= 1:
            li = re.search(r"<li>(?:(?!</li>).)*?" + re.escape(needle)
                           + r".*?</li>", land, re.S)
            if li:
                # An episode carries TWO legitimate titles: the podcast's own
                # English name, which lives in dentcast.json and is what
                # build_episodes.py renders onto episodes.html, and the Persian
                # brain title used everywhere else. They are not a drift to be
                # swept — episode 1 is "Simplified prosthodontics" on the
                # landing page and «آشنایی با روند کار دنتکست» in the brain, and
                # both are correct. So the label is checked against the source
                # that actually renders it.
                want, want_src = title, "the brain title"
                if landing == "episodes.html":
                    ep_title = episode_landing_title(content_id)
                    if ep_title is None:
                        rep.skip("17 sweep", "episode is not in dentcast.json — "
                                             "nothing renders its landing label")
                        want = None
                    else:
                        want, want_src = ep_title, "dentcast.json's title"
                if want is not None:
                    label = html.unescape(li.group(0))
                    if want in label:
                        rep.ok("17 sweep", "landing-page label carries the exact title")
                    elif numbered_series_label(want, label):
                        # A numbered series labels its own landing rows
                        # «قسمت N — <title>» and drops the series name that the
                        # brain title carries as a prefix: a reader on
                        # /plak-sefr/ already knows which series they are in,
                        # and what they cannot see without the number is where
                        # the series starts and ends (founder, 2026-09-18 —
                        # workflow step 2.6). This is the same shape as the
                        # episodes.html case above: a second legitimate label,
                        # not a drift. The check does not weaken — the title's
                        # own words must still appear verbatim after the
                        # number, so a corrected title that missed this surface
                        # still fails.
                        rep.ok("17 sweep", "landing-page label is the numbered-series form "
                                           "(قسمت N + the title without its series prefix)")
                    else:
                        rep.fail("17 sweep",
                                 f"landing-page label does not match {want_src} "
                                 f"({want!r}): {normalize(text_of(label))!r}",
                                 "Hard Rule 17 — a title change is swept through every surface")

    home = read("index.html")
    url = "/" + page_rel
    if is_lite:
        pass
    elif is_gloss:
        rep.skip("6 pulse", "glossary: not customary in Pulse")
    else:
        previous_home = None if sweep else pulse_baseline(rep)
        check_pulse(rep, home, url, sweep, previous_home)

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
            rep.check(f"https://dentcast.org/{en_rel}" not in sm, "8 sitemap",
                      "en mirror stays out of sitemap.xml (noindexed)",
                      "en mirror is in sitemap.xml — it is noindexed and must not be sitemapped",
                      "python3 .github/scripts/gen_sitemap.py  (it drops noindexed pages itself)")

    if pillar.get("primary"):
        pp = f"pillar/{pillar['primary']}/index.html"
        if exists(pp):
            rep.check(url in read(pp), "8 pillar", f"listed on /{pp}",
                      f"not listed on /{pp}", "python3 tools/build_pillar.py all")

        # The pillar page and its premium sidecar are two outputs of one build,
        # and only one of them is visible when you open the page. A publish that
        # rebuilt the page but not the sidecar (an interrupted run, a
        # hand-edited HTML) leaves the article on the page for everyone and
        # missing from the subtopic foldering for every premium subscriber —
        # and from the میز کار tree, which reads its taxonomy from the same
        # file. Nothing else catches that, so it is checked here.
        ps = f"pillar/{pillar['primary']}/structure.json"
        if exists(ps):
            rep.check(url in read(ps), "8 pillar-structure",
                      f"in /{ps} (premium subtopic view)",
                      f"not in /{ps} — the page lists it but the premium view "
                      f"and the میز کار tree do not",
                      "python3 tools/build_pillar.py all")
            sub = pillar.get("subtopic")
            if sub:
                try:
                    subs = [s["slug"] for s in json.loads(read(ps)).get("subtopics", [])]
                except (ValueError, TypeError):
                    subs = []
                rep.check(sub in subs, "8 pillar-structure",
                          f"subtopic {sub!r} exists in /{ps}",
                          f"subtopic {sub!r} is not one of {subs} — the entry "
                          f"would be listed on the page but foldered nowhere",
                          "check step 2.4's subtopic against PILLARS, then "
                          "python3 tools/build_pillar.py all")
        elif pillar["primary"] in live_pillars():
            rep.check(False, "8 pillar-structure", f"/{ps} exists",
                      f"/{ps} is missing — a structured pillar builds one",
                      "python3 tools/build_pillar.py all")

    # ---------------- generated indexes ----------------
    ci = read("plus/content-index.json")
    if is_lite:
        rep.skip("8 plus-index", "LiteCast items are not individually indexed for میز کار")
    else:
        rep.check(f'"{content_id}"' in ci, "8 plus-index", "in plus/content-index.json",
                  "missing from plus/content-index.json — the میز کار tree will not show it",
                  "node tools/build_plus_index.mjs")
    # چالش (step 4.14, handoff §11.5) — a چالش skips flashcards/quiz/pathway
    # entirely (see the table in step 4.14) but still needs its own public
    # index verified. Detected from the page's own markup:
    # `data-dc-challenge-question` is what step 4.14 writes and
    # tools/build_challenge_index.mjs reads. RULE 2 is the one mistake that
    # cannot be walked back once it is in git history, so this gate checks
    # the PUBLIC index carries no answer_fa/key_points, not just that the
    # entry exists.
    if is_challenge:
        try:
            challenges = json.loads(read("plus/challenges.json")).get("byContent", {})
        except (OSError, ValueError):
            challenges = {}
        entry = challenges.get(content_id)
        rep.check(entry is not None, "4.14 challenge",
                  "in plus/challenges.json",
                  "declared a چالش but missing from plus/challenges.json",
                  "node tools/build_challenge_index.mjs")
        if entry is not None:
            rep.check(bool(entry.get("question")), "4.14 challenge",
                      "carries a question", "entry has no question text",
                      "node tools/build_challenge_index.mjs")
            rep.check("answer_fa" not in entry and "key_points" not in entry, "4.14 challenge",
                      "carries no answer_fa/key_points (RULE 2)",
                      "answer_fa/key_points leaked into the PUBLIC index — "
                      "fix tools/build_challenge_index.mjs and regenerate",
                      "node tools/build_challenge_index.mjs")
            image = entry.get("image")
            rep.check(not image or image.startswith("/"), "4.14 challenge",
                      "image path is site-absolute",
                      f'data-dc-challenge-image ("{image}") is a bare filename — it 404s on the '
                      "desktop shell (index.html injects the article IN PLACE, not in an iframe, "
                      "so a relative src resolves against the site root, not the folder)",
                      f'fix the data-dc-challenge-image attribute on {content_id}.html to a '
                      'site-absolute path (e.g. "/insight/insight68.webp"), then '
                      'node tools/build_challenge_index.mjs')
        # RULE (2026-08-30): چالش already owns reader interaction — گفتگوی
        # زیر مطلب (article-threads / the support-ticket-backed comment
        # thread) must never mount underneath it. Fixed in
        # plus/js/article-threads.js's mountArticleThreads() by an early
        # `data-dc-challenge-question` scope check. This is a repo-wide
        # invariant, not a per-page one — verified here so a future refactor
        # of that guard fails a publish loudly instead of silently
        # reintroducing the ticket thread under every چالش page ever built.
        threads_js = read("plus/js/article-threads.js")
        rep.check("data-dc-challenge-question" in threads_js, "4.14 challenge",
                  "plus/js/article-threads.js still skips چالش pages",
                  "mountArticleThreads() no longer checks data-dc-challenge-question — "
                  "گفتگوی زیر مطلب (the support-ticket thread) will mount under every چالش again",
                  "restore the data-dc-challenge-question scope check in mountArticleThreads() "
                  "(plus/js/article-threads.js)")
        rep.skip("8 flashcards", "چالش: 4.11/4.12 are a documented skip — no prose to define terms from")
        rep.skip("5.6 pathway", "چالش: 5.6/5.6-ب are a documented skip — a pathway step is something to read")
    elif is_flashcard_optional and not questions:
        rep.skip("8 flashcards", "dentcast_plus: flashcards/quiz are optional — no cards authored")
    elif not is_lite:
        rep.check(content_id in read("plus/flashcards-index.json"), "8 flashcards",
                  "in plus/flashcards-index.json", "missing from plus/flashcards-index.json",
                  "node tools/build_flashcards_index.mjs")
        if any(is_yesno(q.get("name", "")) for q in questions):
            rep.check(content_id in read("plus/quiz-index.json"), "8 quiz",
                      "in plus/quiz-index.json", "has binary questions but is missing from the quiz bank",
                      "node tools/build_quiz_index.mjs")
        # 4.12-ب — the repo source of pathway-exam questions (founder,
        # 1405/08/03). Only a page that is a step of a FULL pathway feeds an
        # exam, so the row is a documented skip otherwise; where it applies,
        # the page's rows must pass the same shape the API's loader enforces
        # (tools/validate_exam_questions.py). Writing none is allowed — the
        # workflow records the reason — so the check is on shape, not count.
        exam_file = json.loads(read("plus/exam-questions.json")).get("byContent", {}) if exists("plus/exam-questions.json") else {}
        in_full_pathway = any(
            p.get("kind") != "bundle" and any(st.get("content_id") == content_id for st in p.get("steps", []))
            for p in json.loads(read("plus/pathways.json"))
        ) if exists("plus/pathways.json") else False
        if not in_full_pathway:
            rep.skip("4.12-ب exam", "page is not a step of a full pathway — no exam draws from it")
        elif content_id not in exam_file:
            rep.skip("4.12-ب exam", "no exam question written for this page (step 4.12-ب records the reason)")
        else:
            r = subprocess.run([sys.executable, str(ROOT / "tools" / "validate_exam_questions.py"), "--content", content_id],
                               capture_output=True, text=True)
            rows = exam_file[content_id].get("questions", [])
            rep.check(r.returncode == 0, "4.12-ب exam",
                      f"{len(rows)} question(s) in plus/exam-questions.json, shape valid",
                      f"plus/exam-questions.json rows fail validation: {r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr.strip()[:200]}",
                      "python3 tools/validate_exam_questions.py --content " + content_id)
        if is_gloss:
            # Step 5.6 is "MANDATORY on every publish that wrote a specialist
            # brain entry" — a glossary term writes no brain entry (it is a
            # reference type, not a learning-journey step), and no glossary
            # content_id appears anywhere in plus/pathways.json today.
            rep.skip("5.6 pathway", "glossary: reference type, not a specialist brain entry — "
                                     "excluded from learning pathways")
        else:
            paths = read("plus/pathways.json")
            rep.check(f'"{content_id}"' in paths, "5.6 pathway",
                      "placed in at least one learning pathway",
                      "in no learning pathway — place it, or state the deliberate exclusion",
                      f"python3 tools/pathway_place.py {content_id}")
            if content_id.startswith("taraz/"):
                # Founder, 1405/07/03: every تراز شواهد part is a step of
                # evidence-literacy — required, not a scorer's suggestion
                # (it may sit in other pathways too). Parts keep series order.
                data = json.loads(paths)
                data = data.get("pathways", []) if isinstance(data, dict) else data
                ev = next((p for p in data if p.get("id") == "evidence-literacy"), None)
                ids = [s["content_id"] for s in (ev or {}).get("steps", [])]
                parts = [i for i in ids if i.startswith("taraz/")]
                key = lambda i: tuple(int(n) for n in re.findall(r"\d+", i))
                rep.check(content_id in ids and parts == sorted(parts, key=key),
                          "5.6 pathway", "in evidence-literacy, series parts in order",
                          "a تراز شواهد part must be a step of evidence-literacy, "
                          "after the part before it",
                          f"python3 tools/pathway_place.py --insert {content_id} "
                          f"--pathway evidence-literacy --after <previous part>")

    # ---------------- prior data preserved (Phase F) ----------------
    check_bank_preservation(rep, content_id)

    # ---------------- version stamp (step 7, always last) ----------------
    want = content_version()
    sw = re.search(r"dentcast-assets-([a-z0-9]+)", read("service-worker.js"))
    rep.check(sw and sw.group(1) == want, "7 version",
              f"content version {want} matches the stamp",
              f"stamped version is {sw.group(1) if sw else 'MISSING'} but the content hashes to {want} "
              f"— the stamper did not run last",
              "python tools/stamp-version.py  (ALWAYS the final builder)")
    for f in ("index.html", "player.html"):
        # Brain and episode-catalogue (dentcast.json) fetches, as stamped.
        vs = set(re.findall(r"(?:dentcast-brain|(?<![\w-])dentcast)\.json\?v=([a-z0-9]+)", read(f)))
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
    ap.add_argument("--all", action="store_true", help="verify every brain entry that has a page "
                         "(backlog report: always exits 0, even with FAILs)")
    ap.add_argument("--quiet", action="store_true", help="print only failures")
    ap.add_argument("--expect-title", metavar="STR",
                    help="the title EXACTLY as the user wrote it — compared codepoint-for-codepoint")
    ap.add_argument("--expect-caption", metavar="STR",
                    help="the caption EXACTLY as the user wrote it — compared codepoint-for-codepoint")
    ap.add_argument("--des-text", metavar="FILE",
                    help="step 4.13 Part 3(6): check the Persian text of one DES JSON before it is stored")
    args = ap.parse_args()

    if args.des_text:
        return des_text_report(args.des_text)

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
