#!/usr/bin/env python3
"""Extract every page's hidden FAQPage / flashcards DefinedTermSet JSON-LD
node into plus/faq-corpus.json, verbatim, keyed by content id.

This is a ONE-TIME migration script (kept in the repo, idempotent) written as
part of removing hidden FAQ/flashcard schema from page markup (see
.dentcast/faq-schema-removal-handoff.md). Nodes are extracted exactly as
parsed from each page's own JSON-LD — never retyped, never reworded — so the
corpus is a lossless archive of what strip_faq_schema.py later deletes from
the pages. tools/build_quiz_index.mjs and tools/build_flashcards_index.mjs
read this file instead of walking page HTML.

Run from the repo root:  python3 tools/faq_corpus_extract.py
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {"node_modules", "plus-api"}
EXCLUDE_FILES = {"mockup-home.html"}

LDJSON_RE = re.compile(
    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',
    re.IGNORECASE,
)


def iter_html_files():
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if rel.name in EXCLUDE_FILES:
            continue
        yield path


def to_content_id(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return re.sub(r"\.html$", "", rel, flags=re.IGNORECASE)


def extract_nodes(html: str):
    """Mirror extractFaqPages()/extractDefinedTermSets() in the two JS
    builders: pull every ld+json block, look at each top-level object (or
    each item of a top-level array), and inspect either that object itself
    or the members of its @graph array."""
    faq_pages = []
    defined_term_sets = []
    for m in LDJSON_RE.finditer(html):
        try:
            parsed = json.loads(m.group(1))
        except (json.JSONDecodeError, ValueError):
            continue
        tops = parsed if isinstance(parsed, list) else [parsed]
        for t in tops:
            if not isinstance(t, dict):
                continue
            graph = t.get("@graph")
            nodes = graph if isinstance(graph, list) else [t]
            for n in nodes:
                if not isinstance(n, dict):
                    continue
                if n.get("@type") == "FAQPage" and isinstance(n.get("mainEntity"), list):
                    faq_pages.append(n)
                elif (
                    n.get("@type") == "DefinedTermSet"
                    and isinstance(n.get("hasDefinedTerm"), list)
                    and "#flashcards" in str(n.get("@id", ""))
                ):
                    defined_term_sets.append(n)
    return faq_pages, defined_term_sets


def main():
    by_content = {}
    total_faq_pages = total_questions = 0
    total_dts = total_cards = 0
    pages_with_faq = pages_with_dts = 0

    for path in iter_html_files():
        html = path.read_text(encoding="utf-8", errors="ignore")
        faq_pages, defined_term_sets = extract_nodes(html)
        if not faq_pages and not defined_term_sets:
            continue

        content_id = to_content_id(path)
        entry = {"faqPages": faq_pages, "definedTermSets": defined_term_sets}
        by_content[content_id] = entry

        if faq_pages:
            pages_with_faq += 1
            total_faq_pages += len(faq_pages)
            total_questions += sum(len(p.get("mainEntity", [])) for p in faq_pages)
        if defined_term_sets:
            pages_with_dts += 1
            total_dts += len(defined_term_sets)
            total_cards += sum(len(s.get("hasDefinedTerm", [])) for s in defined_term_sets)

    out = {
        "version": 1,
        "extracted_at": date.today().isoformat(),
        "note": (
            "FAQ + flashcard corpus removed from page JSON-LD on 2026-08-11 "
            "(hidden-schema SEO fix); feeds plus/quiz-index.json and "
            "plus/flashcards-index.json via tools/build_quiz_index.mjs and "
            "tools/build_flashcards_index.mjs. Never served as page markup again."
        ),
        "byContent": dict(sorted(by_content.items())),
    }

    out_path = ROOT / "plus" / "faq-corpus.json"
    out_path.write_text(
        json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(
        f"Wrote plus/faq-corpus.json: {len(by_content)} pages "
        f"({pages_with_faq} with FAQPage, {pages_with_dts} with flashcards)."
    )
    print(
        f"  FAQPage nodes: {total_faq_pages}, questions: {total_questions}"
    )
    print(
        f"  DefinedTermSet nodes: {total_dts}, cards: {total_cards}"
    )


if __name__ == "__main__":
    main()
