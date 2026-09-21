#!/usr/bin/env python3
"""Extract the پرامپتولوژیست parts into one structured JSON for the book build.

Reads /dentai/promptologist/*.html in the landing page's own reading order and
emits a block list per part. Text is COPIED, never re-typed: zero-width
non-joiners, spacing and punctuation come through byte-for-byte (Hard Rule 16).
Web-only furniture (nav, language toggle, keyword chips, hashtags, related
capsules, site chrome) is dropped; the prose, its bold runs, its line breaks
and its figures are kept.
"""
import html
import json
import os
import re
import sys

SRC = os.path.join(os.path.dirname(__file__), '..', 'dentai', 'promptologist')
SRC = os.path.normpath(SRC)


def reading_order(index_html):
    """Part filenames in the order the landing page lists them."""
    seen = []
    for m in re.finditer(r'href="(prompt[^"]+\.html)"', index_html):
        if m.group(1) not in seen:
            seen.append(m.group(1))
    return seen


def chapter_map(index_html):
    """{filename: chapter heading} from the landing page's فصل labels."""
    # Each chapter label is followed by the part links that belong to it.
    chapters = {}
    current = None
    for m in re.finditer(r'(فصل\s*[۰-۹\d]+\s*—\s*[^<]{1,40})|href="(prompt[^"]+\.html)"',
                         index_html):
        if m.group(1):
            current = m.group(1).strip()
        elif m.group(2) and m.group(2) not in chapters:
            chapters[m.group(2)] = current
    return chapters


def text_of(fragment):
    """Rendered text of an HTML fragment, entities resolved, tags removed."""
    return html.unescape(re.sub(r'<[^>]+>', '', fragment))


def runs_of(fragment):
    """Split a paragraph's inner HTML into [{text, bold, break_before}] runs.

    <strong> becomes a bold run, <br> a line break, <a> keeps only its text
    (a book has no hyperlinks; the cross-references are reported separately).
    """
    out = []
    pending_break = False
    # Normalise anchors away first so only strong/br survive as structure.
    frag = re.sub(r'<a\b[^>]*>(.*?)</a>', r'\1', fragment, flags=re.S)
    for piece in re.split(r'(<br\s*/?>|<strong>.*?</strong>)', frag, flags=re.S):
        if not piece:
            continue
        if re.fullmatch(r'<br\s*/?>', piece):
            pending_break = True
            continue
        bold = piece.startswith('<strong>')
        t = text_of(piece)
        if not t:
            continue
        out.append({'text': t, 'bold': bold, 'break_before': pending_break})
        pending_break = False
    return out


def blocks_of(caption_html):
    """Ordered content blocks of one part's body."""
    blocks = []
    # Figures and bare content images are pulled out in document order.
    token = re.compile(
        r'(?s)(<figure.*?</figure>)|(<img\b[^>]*class="ep-fig"[^>]*>)|(<p>.*?</p>)')
    for m in token.finditer(caption_html):
        fig, img, para = m.group(1), m.group(2), m.group(3)
        if fig:
            src = re.search(r'src="([^"]+)"', fig)
            cap = re.search(r'(?s)<figcaption[^>]*>(.*?)</figcaption>', fig)
            blocks.append({'type': 'figure',
                           'src': src.group(1) if src else None,
                           'caption': text_of(cap.group(1)).strip() if cap else ''})
        elif img:
            src = re.search(r'src="([^"]+)"', img)
            alt = re.search(r'alt="([^"]*)"', img)
            blocks.append({'type': 'figure',
                           'src': src.group(1) if src else None,
                           'caption': html.unescape(alt.group(1)) if alt else ''})
        elif para:
            inner = re.match(r'(?s)<p>(.*)</p>', para).group(1)
            # A figure may sit INSIDE a paragraph (the appendix's numbered
            # steps do exactly that); split the paragraph around it so the
            # image keeps its place in the reading order.
            for chunk in re.split(r'(<img\b[^>]*class="ep-fig"[^>]*>)', inner):
                if not chunk:
                    continue
                if 'ep-fig' in chunk and chunk.startswith('<img'):
                    src = re.search(r'src="([^"]+)"', chunk)
                    alt = re.search(r'alt="([^"]*)"', chunk)
                    blocks.append({'type': 'figure',
                                   'src': src.group(1) if src else None,
                                   'caption': html.unescape(alt.group(1)) if alt else ''})
                    continue
                runs = runs_of(chunk)
                if runs:
                    blocks.append({'type': 'p', 'runs': runs})
    return blocks


def cross_links(caption_html):
    """Internal links in the prose — a book cannot keep them; list them."""
    return [{'href': h, 'text': text_of(t).strip()}
            for h, t in re.findall(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
                                   caption_html, re.S)]


def main():
    index_html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
    order = reading_order(index_html)
    chapters = chapter_map(index_html)

    parts = []
    for fname in order:
        raw = open(os.path.join(SRC, fname), encoding='utf-8').read()
        body = re.search(r'(?s)<main.*?</main>', raw).group(0)
        body = re.sub(r'(?s)<script.*?</script>', '', body)

        badge = re.search(r'(?s)<div class="ep-badge">(.*?)</div>', body)
        title = re.search(r'(?s)<h1 class="ep-title">(.*?)</h1>', body)
        caption = re.search(r'(?s)<div class="ep-caption">(.*?)</div>\s*</div>', body)
        if not caption:
            caption = re.search(r'(?s)<div class="ep-caption">(.*)</div>', body)
        cap_html = caption.group(1)

        parts.append({
            'file': fname,
            'chapter': chapters.get(fname),
            'badge': text_of(badge.group(1)).strip() if badge else '',
            'title': text_of(title.group(1)).strip() if title else '',
            'blocks': blocks_of(cap_html),
            'links': cross_links(cap_html),
        })

    out = {'parts': parts}
    dest = sys.argv[1] if len(sys.argv) > 1 else 'book.json'
    with open(dest, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    words = sum(len(r['text'].split())
                for p in parts for b in p['blocks'] if b['type'] == 'p'
                for r in b['runs'])
    figs = sum(1 for p in parts for b in p['blocks'] if b['type'] == 'figure')
    links = sum(len(p['links']) for p in parts)
    print(f'{len(parts)} parts · {words} words · {figs} figures · '
          f'{links} in-prose links dropped → {dest}')


if __name__ == '__main__':
    main()
