#!/usr/bin/env python3
"""Pathway scout — authoring aid for cross-pillar learning pathways.

Pathways are NOT pillar views. A pillar is where a content item lives (one
home); a pathway is a curated journey that may cross pillars freely (e.g. a
"biomimetic" pathway pulls from bonding, ceramics, operative, occlusion...).
This offline tool finds candidate steps for a theme by scanning the whole
brain regardless of pillar, so the founder curates from a ranked shortlist
instead of re-reading 400+ entries.

Usage:
  python3 tools/pathway_scout.py TERM [TERM ...]        ranked candidate table
  python3 tools/pathway_scout.py --steps TERM [...]     steps JSON skeleton to
                                                        paste into plus/pathways.json
  python3 tools/pathway_scout.py --coverage             audit which content is in
                                                        0 / 1 / many pathways

Matching is over title + caption + keywords + hashtags, Persian-normalized
(ي/ی, ك/ک, ZWNJ stripped) and case-insensitive. Purely read-only: it never
writes the brain or pathways.json.
"""
import json, re, sys, os

BRAIN = os.path.join(os.path.dirname(__file__), '..', 'dentcast-brain.json')

def norm(s):
    s = (s or '').lower()
    s = s.replace('ي', 'ی').replace('ك', 'ک')  # ي→ی ك→ک
    return s.replace('‌', '')  # strip ZWNJ so half-space variants match

def content_id(e):
    url = e.get('page_url') or e.get('url') or ''
    return re.sub(r'\.html$', '', url.lstrip('/'))

def score(e, terms):
    fields = [(norm(e.get('title')), 3),
              (norm(' '.join(e.get('keywords') or [])), 2),
              (norm(' '.join(e.get('hashtags') or [])), 2),
              (norm(e.get('caption')), 1)]
    total, hits = 0, set()
    for t in terms:
        for text, w in fields:
            if t in text:
                total += w
                hits.add(t)
    # require the theme to actually appear; breadth of distinct terms breaks ties
    return (total + len(hits) * 2) if hits else 0

PW = os.path.join(os.path.dirname(__file__), '..', 'plus', 'pathways.json')

def coverage():
    """Audit which brain content sits in 0 / 1 / many pathways."""
    from collections import Counter
    d = json.load(open(BRAIN))
    pw = json.load(open(PW))
    seat = Counter()
    for p in pw:
        for s in p['steps']:
            seat[s['content_id']] += 1
    title = {content_id(e): e.get('title', '') for e in d}
    allc = [content_id(e) for e in d if content_id(e)]
    uncovered = [c for c in allc if c not in seat]
    multi = [c for c in allc if seat[c] > 1]
    print(f'pathways: {len(pw)} | content: {len(allc)} | '
          f'in >=1: {len(allc) - len(uncovered)} | in multiple: {len(set(multi))} | '
          f'uncovered: {len(uncovered)}')
    print('\n-- uncovered (excluding litecast, which is patient-facing) --')
    for c in uncovered:
        if not c.startswith('litecast/'):
            print(f'  {c:26s} {title.get(c, "")[:56]}')
    print('\n-- most-shared content (in the most pathways) --')
    for c, n in seat.most_common(12):
        print(f'  {n}x  {c:26s} {title.get(c, "")[:50]}')

def main(argv):
    if '--coverage' in argv:
        coverage(); return
    as_steps = '--steps' in argv
    terms = [norm(a) for a in argv if not a.startswith('--')]
    if not terms:
        sys.exit(__doc__)
    d = json.load(open(BRAIN))
    ranked = sorted(((score(e, terms), e) for e in d), key=lambda x: -x[0])
    ranked = [(s, e) for s, e in ranked if s > 0 and content_id(e)]
    if as_steps:
        steps = [{'content_id': content_id(e), 'milestone': False} for _, e in ranked]
        print(json.dumps(steps, ensure_ascii=False, indent=2))
        return
    print(f'{len(ranked)} candidates (score | pillar/subtopic | content_id | title)')
    for s, e in ranked:
        p = e.get('pillar') or {}
        pil = f"{p.get('primary') or '-'}/{p.get('subtopic') or '-'}"
        print(f'{s:3d} | {pil:35s} | {content_id(e):32s} | {e.get("title","")[:60]}')

if __name__ == '__main__':
    main(sys.argv[1:])
