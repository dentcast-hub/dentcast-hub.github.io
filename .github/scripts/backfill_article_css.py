#!/usr/bin/env python3
"""Backfill the shared article layer (/dc-article.css) onto older clones.

The latest page of each category (the clone template) was migrated by hand;
this script brings every OLDER same-category page onto the same architecture:

  1. inserts `<link rel="stylesheet" href="/dc-article.css">` before the
     page's first inline <style> (skipped if already present), and
  2. strips from the inline <style> exactly the rule blocks that were removed
     from that category's template — a per-category kill list, so rules a
     category deliberately keeps (dentai's bullet/caption set, photocast's
     figures, sharehub's player…) are never touched. @media blocks are
     processed recursively and dropped only when they end up empty.

English mirrors (any path containing /en/) are excluded: they are LTR pages
with their own chrome and must not inherit the RTL article layer. LiteCast
is excluded by design (distinct .ir look). Index/listing pages are excluded.

Idempotent: pages already linking dc-article.css are skipped entirely.

Usage:
  python3 .github/scripts/backfill_article_css.py            # apply
  python3 .github/scripts/backfill_article_css.py --check    # report only
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

LINK_TAG = ('  <!-- Shared article layer (body/headings/lists/boxes/byline)'
            ' — page-specific rules below -->\n'
            '  <link rel="stylesheet" href="/dc-article.css">\n')

AUTHOR = ['.author-note', '.author-note .author-link',
          '.author-note .author-link:hover', '.author-note .author-role']

# Per-category kill lists — mirror of the hand-migrated templates.
CATEGORIES = {
    'notecast/episode-*.html':
        ['body', 'h1', 'h2', '.glass-box', '.glass-box h4', 'ul', 'li',
         'footer'] + AUTHOR,
    'insight/insight-*.html':
        ['html,body', 'body', 'h1', 'h3', '.glass-box', '.glass-box img',
         '.text-divider', 'footer'] + AUTHOR,
    'metanotes/meta-*.html':
        ['html,body', 'body', 'h1', 'h2', 'ul', 'li', '.text-box',
         'footer'] + AUTHOR,
    'chairside/chairside-*.html':
        ['html,body', 'body', 'h1', 'h2', 'h3', '.text-box', '.text-box h4',
         'ul', 'li', 'footer'] + AUTHOR,
    'dentai/dentai-*.html':
        ['html,body', 'body', 'h1', 'h2', 'footer'] + AUTHOR,
    'photocast/episode-*.html':
        ['body', 'h1', 'h2', '.text-box', 'footer'] + AUTHOR,
    'sharehub/share-*.html':
        ['html,body', 'body', 'h1', 'h3', '.glass-box', '.glass-box img',
         '.text-divider', 'footer'] + AUTHOR,
}


def norm(sel):
    """Normalize a selector for exact matching."""
    return re.sub(r'\s*,\s*', ',', re.sub(r'\s+', ' ', sel)).strip()


def split_rules(css):
    """Yield (selector, full_block_text) for top-level rules, brace-aware."""
    i, n = 0, len(css)
    while i < n:
        brace = css.find('{', i)
        if brace == -1:
            yield None, css[i:]
            return
        sel = css[i:brace]
        depth, j = 1, brace + 1
        while j < n and depth:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
            j += 1
        yield sel, css[i:j]
        i = j


def strip_rules(css, kills):
    """Remove top-level rules whose selector is in `kills`; recurse @media."""
    out = []
    for sel, block in split_rules(css):
        if sel is None:
            out.append(block)
            continue
        s = norm(sel)
        if s.startswith('@media'):
            inner = block[block.find('{') + 1:block.rfind('}')]
            new_inner = strip_rules(inner, kills)
            if new_inner.strip():
                out.append(block[:block.find('{') + 1] + new_inner + '}')
            continue
        if s in kills:
            continue
        out.append(block)
    return ''.join(out)


def process(path, kills):
    html = path.read_text(encoding='utf-8')
    if 'dc-article.css' in html:
        return None
    if '<style>' not in html:
        return None

    def repl(m):
        return strip_rules(m.group(1), kills)

    new_html = re.sub(r'(?<=<style>)(.*?)(?=</style>)', repl, html, flags=re.S)
    new_html = new_html.replace('<style>', LINK_TAG + '  <style>', 1)
    return new_html if new_html != html else None


def main():
    check = '--check' in sys.argv
    changed = 0
    for pattern, kills in CATEGORIES.items():
        kills = set(kills)
        for page in sorted(ROOT.glob(pattern)):
            if '/en/' in str(page):
                continue
            new_html = process(page, kills)
            if new_html is None:
                continue
            changed += 1
            print(f"  {page.relative_to(ROOT)}")
            if not check:
                page.write_text(new_html, encoding='utf-8')
    print(f"{'needs' if check else 'applied'}: {changed} page(s)")


if __name__ == '__main__':
    main()
