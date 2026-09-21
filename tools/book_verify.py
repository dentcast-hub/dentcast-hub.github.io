#!/usr/bin/env python3
"""Prove the built manuscript is bidirectionally sound, before anyone opens it.

Direction in a .docx is explicit markup, not something a renderer guesses, so it
can be checked mechanically: every paragraph that holds text must carry w:bidi,
every run holding Persian must carry w:rtl, and the text itself must still be
the text that was extracted — same characters, same zero-width non-joiners, no
direction-mark characters smuggled in to make a line "look right".

Usage: python3 tools/book_verify.py <out.docx> <book.json>
"""
import json
import re
import sys
import zipfile

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
ARABIC = re.compile(r'[؀-ۿﭐ-﷿ﹰ-﻿]')
BIDI_MARKS = re.compile(r'[‎‏‪-‮⁦-⁩]')



def on(parent, tag):
    """A Word toggle is on when the element is present and not val="false"."""
    if parent is None:
        return False
    el = parent.find(W + tag)
    if el is None:
        return False
    v = el.get(W + 'val')
    return v not in ('false', '0', 'off')


def main():
    docx_path, json_path = sys.argv[1], sys.argv[2]
    import xml.etree.ElementTree as ET

    with zipfile.ZipFile(docx_path) as z:
        xml = z.read('word/document.xml')
        names = z.namelist()
    root = ET.fromstring(xml)

    paras = root.iter(W + 'p')
    total_p = text_p = bidi_p = 0
    total_r = fa_r = rtl_r = bad_r = 0
    doc_text = []
    bad_paras = []

    for p in paras:
        total_p += 1
        ppr = p.find(W + 'pPr')
        has_bidi = on(ppr, 'bidi')
        ptext = ''
        for r in p.iter(W + 'r'):
            total_r += 1
            rpr = r.find(W + 'rPr')
            has_rtl = on(rpr, 'rtl')
            t = ''.join(n.text or '' for n in r.iter(W + 't'))
            ptext += t
            if ARABIC.search(t):
                fa_r += 1
                if has_rtl:
                    rtl_r += 1
                else:
                    bad_r += 1
        if ptext.strip():
            text_p += 1
            if has_bidi:
                bidi_p += 1
            else:
                bad_paras.append(ptext[:40])
        doc_text.append(ptext)

    joined = '\n'.join(doc_text)

    book = json.load(open(json_path, encoding='utf-8'))

    # Reconstruct every string the builder was asked to put in the document,
    # in order: front matter, then chapter heading / part heading / prose /
    # figure caption. If the document holds exactly this and nothing else, no
    # character was dropped, duplicated or silently "corrected".
    expected = ['پرامپتولوژیست', 'کار با هوش مصنوعی در دندان\u200cپزشکی',
                'دکتر فواد شهابیان', 'فهرست']
    chapter = None
    for part in book['parts']:
        if part['chapter'] and part['chapter'] != chapter:
            chapter = part['chapter']
            expected.append(chapter)
        expected.append(f"{part['badge']} — {part['title']}" if part['badge']
                        else part['title'])
        for b in part['blocks']:
            if b['type'] == 'p':
                expected.append(''.join(r['text'] for r in b['runs']))
            elif b['type'] == 'figure' and b['caption']:
                expected.append(b['caption'])

    def only(s):
        return re.sub(r'\s+', '', s)

    src_text = ''.join(expected)
    src_c, doc_c = only(src_text), only(joined)
    missing = [p for p in expected if only(p) and only(p) not in doc_c]

    marks = BIDI_MARKS.findall(joined)
    zwnj_src = src_text.count('\u200c')
    zwnj_doc = joined.count('\u200c')
    extra = len(doc_c) - len(src_c)

    fails = []
    if bad_r:
        fails.append(f'{bad_r} Persian runs without w:rtl')
    if bad_paras:
        fails.append(f'{len(bad_paras)} text paragraphs without w:bidi: {bad_paras[:3]}')
    if marks:
        fails.append(f'{len(marks)} bidi control characters found in the text')
    if missing:
        fails.append(f'{len(missing)} source paragraphs missing from the document')
    if zwnj_src != zwnj_doc:
        fails.append(f'ZWNJ count changed: {zwnj_src} expected, {zwnj_doc} in document')
    if extra:
        fails.append(f'document holds {extra} characters more/less than expected')

    print(f'paragraphs          {total_p} ({text_p} with text)')
    print(f'  w:bidi            {bidi_p}/{text_p}')
    print(f'runs                {total_r} ({fa_r} containing Persian)')
    print(f'  w:rtl             {rtl_r}/{fa_r}')
    print(f'bidi control chars  {len(marks)} (must be 0)')
    print(f'ZWNJ (U+200C)       {zwnj_doc} in document / {zwnj_src} in source')
    print(f'expected strings    {len(expected)} — {len(expected) - len(missing)} found verbatim')
    print(f'character count     {len(doc_c)} in document / {len(src_c)} expected')
    print(f'images embedded     {sum(1 for n in names if n.startswith("word/media/") and not n.endswith("/"))}')
    print()
    if fails:
        print('FAIL')
        for f in fails:
            print('  -', f)
        sys.exit(1)
    print('PASS — every paragraph is RTL-based, every Persian run is marked '
          'right-to-left, and the text is unchanged.')


if __name__ == '__main__':
    main()
