#!/usr/bin/env python3
"""Independent Stage-7 CONTENT parity gate for disposable publication fixtures.

Inspects actual files, not agent-supplied claims or staging receipt fields.
Conservatively tests canonical invariants that can be mechanically evidenced.
It does not interpret clinical science or certify full behavioral equivalence.
No network, Git writes, deploy or real publication.
"""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / ".dentcast/workflows/README.md"

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_attrs = {}
        self.meta = []
        self.links = []
        self.anchors = []
        self.related_sections = []
        self.stack = []
        self.current_related = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.html_attrs = a
        if tag == "meta":
            self.meta.append(a)
        if tag == "link":
            self.links.append(a)
        if tag == "a":
            self.anchors.append(a)
        # Keep a stack for section-level global link budgeting across all link types.
        if tag in {"div", "section"}:
            is_related = "dc-related-section" in a.get("class", "").split()
            if is_related:
                self.related_sections.append(0)
                self.current_related.append((len(self.stack), len(self.related_sections)-1))
        if tag == "a":
            for _, index in self.current_related:
                self.related_sections[index] += 1
        if tag not in {"meta", "link", "img", "br", "hr", "input", "source",
                       "wbr", "area", "base", "embed", "track", "col", "param"}:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if not self.stack:
            return
        if tag == self.stack[-1]:
            self.stack.pop()
            self.current_related = [(d, i) for d, i in self.current_related
                                    if d < len(self.stack)]
        # Invalid nesting is not silently fixed. Other HTML quality gates cover it.


def parse_page(path):
    page = PageParser()
    page.feed(Path(path).read_text(encoding="utf-8"))
    return page


def _has_meta(page, key, value, content):
    return sum(1 for x in page.meta if x.get(key) == value and
               x.get("content") == content)


def _canonical(page):
    return [x["href"] for x in page.links
            if x.get("rel") == "canonical" and "href" in x]


def _lang_links(page):
    return [x.get("href") for x in page.anchors
            if "lang-btn" in x.get("class", "").split()]


def _require(ok, code, problems):
    if not ok:
        problems.append(code)


def inspect_route(plan):
    """Independent oracle distilled from canonical source, not module receipts."""
    problems = []
    canonical = CANONICAL.read_text(encoding="utf-8")
    for required in (
        "Version stamper — always run LAST.",
        "Hard cap of 5 links",
        "LiteCast is an isolated track.",
        "Two exceptions, and no others.",
        "## Phase E — Mark the page",
        "## Phase F —",
    ):
        _require(required in canonical, "CANONICAL_REFERENCE_CHANGED:" + required, problems)
    _require(isinstance(plan, dict) and
             plan.get("execution_authorized") is False and
             plan.get("side_effects_permitted") == [],
             "UNSAFE_STAGING_PLAN", problems)
    steps = [x.get("step_id") for x in plan.get("ordered_steps", [])
             if isinstance(x, dict)]
    _require(len(steps) == len(plan.get("ordered_steps", [])) and
             len(steps) == len(set(steps)), "DUPLICATE_OR_MALFORMED_STEP", problems)
    def at(s):
        return steps.index(s) if s in steps else -1
    def required(s):
        _require(s in steps, "MISSING_REQUIRED_STEP:" + s, problems)
    def absent(s):
        _require(s not in steps, "FORBIDDEN_STEP:" + s, problems)
    def earlier(a, z):
        _require(at(a) >= 0 and at(z) >= 0 and at(a) < at(z),
                 "CANONICAL_ORDER:" + a + "->" + z, problems)

    route = plan.get("route", "")
    paper_only = route == "paper-only"
    litecast = route.startswith("litecast")
    challenge = route.startswith("challenge")
    attached = route.endswith("+paper")
    required("intake:route")
    if paper_only:
        for s in ("paper-cabinet:drive", "paper-cabinet:catalog", "verify:paper-only"):
            required(s)
        for s in ("page:draft", "paper-cabinet:credit", "brain:append",
                  "build:rebuild", "english:mirror", "notification:push-marker",
                  "verify:phase-f", "build:version-final"):
            absent(s)
        earlier("paper-cabinet:drive", "paper-cabinet:catalog")
        earlier("paper-cabinet:catalog", "verify:paper-only")
    else:
        for s in ("page:draft", "notification:pulse", "build:rebuild",
                  "build:version-final", "verify:phase-f"):
            required(s)
        earlier("notification:pulse", "build:rebuild")
        earlier("build:rebuild", "build:version-final")
        earlier("build:version-final", "verify:phase-f")
        _require(len(steps) >= 2 and steps[-2:] ==
                 ["build:version-final", "verify:phase-f"],
                 "STAMP_NOT_LAST_BEFORE_PHASE_F", problems)
        if litecast:
            required("semantic-links:litecast")
            required("page:litecast-register")
            earlier("semantic-links:litecast", "page:litecast-register")
            earlier("page:litecast-register", "notification:pulse")
            for s in ("brain:append", "taxonomy:lock", "navigation:publish",
                      "semantic-links:specialist", "english:mirror",
                      "notification:push-marker"):
                absent(s)
        else:
            for s in ("taxonomy:lock", "navigation:publish",
                      "semantic-links:specialist", "brain:append"):
                required(s)
            earlier("page:draft", "taxonomy:lock")
            earlier("taxonomy:lock", "navigation:publish")
            if challenge:
                required("challenge:public")
                absent("english:mirror")
            else:
                required("english:mirror")
                earlier("build:rebuild", "english:mirror")
                earlier("english:mirror", "build:version-final")
            required("notification:push-marker")
            earlier("notification:push-marker", "build:version-final")
        if attached:
            for s in ("paper-cabinet:drive", "paper-cabinet:catalog",
                      "paper-cabinet:credit"):
                required(s)
            earlier("paper-cabinet:drive", "paper-cabinet:catalog")
            earlier("paper-cabinet:catalog", "paper-cabinet:credit")
        else:
            absent("paper-cabinet:credit")
    return problems


def inspect_page_pair(root, category, filename, *,
                      challenge=False, expect_english=True):
    """Read real sandbox HTML and assert observable canonical page properties."""
    problems = []
    root = Path(root)
    # Use a fixed category and basename allow-list; never read outside workspace.
    import re
    if (not re.fullmatch(r"[a-z][a-z0-9-]{1,40}", category)
            or not re.fullmatch(r"[A-Za-z0-9_-]{1,70}[.]html", filename)):
        return ["INVALID_PUBLIC_PAGE_IDENTITY"]
    source = root / category / filename
    if not source.is_file() or source.is_symlink():
        return ["MISSING_FA_PAGE"]
    fa = parse_page(source)
    domain = "dentcast.ir" if category == "litecast" else "dentcast.org"
    expected_fa = "https://" + domain + "/" + category + "/" + filename
    _require(_canonical(fa) == [expected_fa], "FA_CANONICAL_IDENTITY", problems)
    _require(fa.html_attrs.get("lang") == "fa", "FA_LANG_IDENTITY", problems)
    _require(any(x.get("property") == "og:url" and x.get("content") == expected_fa
                 for x in fa.meta), "FA_OG_IDENTITY", problems)
    for value in fa.related_sections:
        _require(value <= 5, "RELATED_LINKS_EXCEED_5", problems)
    if category == "litecast":
        _require(not any("hreflang" in x for x in fa.links),
                 "LITECAST_HREFLANG_FORBIDDEN", problems)
        _require(not any(x.startswith(("https://dentcast.org", "/glossary/",
                                      "/pillar/", "/episodes/", "/sharehub/"))
                         for x in (a.get("href", "") for a in fa.anchors)),
                 "LITECAST_SPECIALIST_LINK_FORBIDDEN", problems)
    want_en = expect_english and category != "litecast" and not challenge
    en_path = root / category / "en" / filename
    if want_en:
        _require(en_path.is_file() and not en_path.is_symlink(),
                 "EN_MIRROR_MISSING", problems)
        _require(_lang_links(fa) == ["en/" + filename],
                 "FA_TOGGLE_MISSING_OR_WRONG", problems)
        if en_path.is_file() and not en_path.is_symlink():
            en = parse_page(en_path)
            target = "https://dentcast.org/" + category + "/en/" + filename
            _require(_canonical(en) == [target], "EN_CANONICAL_WRONG", problems)
            _require(en.html_attrs.get("lang") == "en" and
                     en.html_attrs.get("dir") == "ltr", "EN_LANGUAGE_LAYOUT", problems)
            _require(_lang_links(en) == ["../" + filename], "EN_TOGGLE_WRONG", problems)
            _require(_has_meta(en, "name", "robots", "noindex, follow") == 1,
                     "EN_NOINDEX_MISSING", problems)
            _require(not any("hreflang" in x for x in en.links),
                     "EN_HREFLANG_FORBIDDEN", problems)
    else:
        _require(not en_path.exists(), "FORBIDDEN_EN_MIRROR", problems)
        _require(not _lang_links(fa), "FORBIDDEN_FA_LANGUAGE_TOGGLE", problems)
    wants_push = category not in {"litecast", "glossary"}
    _require(_has_meta(fa, "name", "dc-notify", "true") ==
             (1 if wants_push else 0), "PUSH_MARKER_INCORRECT", problems)
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--plan", required=True)
    ap.add_argument("--sandbox")
    ap.add_argument("--category")
    ap.add_argument("--filename")
    ap.add_argument("--challenge", action="store_true")
    args = ap.parse_args()
    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    issues = inspect_route(plan)
    if args.sandbox:
        if not args.category or not args.filename:
            ap.error("--category and --filename required with --sandbox")
        issues += inspect_page_pair(args.sandbox, args.category, args.filename,
                                    challenge=args.challenge)
    print(json.dumps({"status": "PASS" if not issues else "FAIL",
                      "scope": "independent-mechanical-staging-only",
                      "full_behavioral_parity_proven": False,
                      "real_publication_tested": False,
                      "issues": issues}, ensure_ascii=False, indent=2))
    return 0 if not issues else 2


if __name__ == "__main__":
    raise SystemExit(main())
