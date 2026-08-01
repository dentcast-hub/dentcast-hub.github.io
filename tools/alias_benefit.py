#!/usr/bin/env python3
"""
What the alias table buys, and what it costs.

tools/rank_experiment.py only ever phrases its queries with a tag's OWN words,
so it measures the alias layer's COST (folding vocabulary together loses a
little discrimination) and can never see its BENEFIT. This measures the other
half: phrase every query with an ALTERNATIVE spelling and ask whether the
article is still reachable at all.

Run both before deciding anything about the alias table.
"""
import collections
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hashtag_ref as H  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
brain = json.load(open(os.path.join(ROOT, 'dentcast-brain.json'), encoding='utf-8'))
ref = json.load(open(os.path.join(ROOT, 'dentcast-hashtag-reference.json'), encoding='utf-8'))

alias_of = {}
for c in ref['concepts']:
    for a in c.get('aliases') or []:
        alias_of.setdefault(c['tag'], []).append(a)


def corpus():
    tags = collections.defaultdict(list)
    for e in brain:
        cid = H.content_id(e)
        if not cid:
            continue
        for t in e.get('hashtags') or []:
            if cid not in tags[t]:
                tags[t].append(cid)
    df = collections.Counter()
    for t in tags:
        for w in set(H.words(t)):
            df[w] += 1
    n = len(tags)
    idf = {w: math.log((n + 1) / (c + 1)) + 1 for w, c in df.items()}
    return tags, {t: sum(idf.get(w, 1) for w in H.words(t)) for t in tags}


def pool(qw, tags, spec):
    scored = []
    for t, cids in tags.items():
        tw = H.words(t)
        if not tw:
            continue
        s = sum(w in qw for w in tw) / len(tw)
        if s >= 0.5:
            scored.append((s, spec[t], len(cids), t))
    scored.sort(key=lambda x: (-x[0], -x[1], x[2]))
    covered, picked = set(), 0
    for _s, _sp, _n, t in scored:
        if picked >= 10:
            break
        if not any(c not in covered for c in tags[t]):
            continue
        covered.update(tags[t])
        picked += 1
    return covered


queries = []
for e in brain:
    cid = H.content_id(e)
    if not cid:
        continue
    alts = [a for t in (e.get('hashtags') or []) for a in alias_of.get(t, [])]
    if alts:
        queries.append((' '.join(alts), cid))

for on in (False, True):
    H._alias_cache = None if on else []   # noqa: SLF001 - deliberate switch
    tags, spec = corpus()
    H._alias_cache = None if on else []
    hits = sum(1 for q, tgt in queries if tgt in pool(set(H.words(q)), tags, spec))
    label = 'ON ' if on else 'OFF'
    print(f'alias layer {label}: {hits}/{len(queries)} articles reachable when the '
          f'query uses an alternative spelling ({100 * hits / len(queries):.1f}%)')
