#!/usr/bin/env python3
"""
Offline A/B harness for case-assistant.ts's candidate ranking.

Kept in the repo so any future change to that ranking is measured against the
whole site rather than the one query that motivated it - and so the campaign
can be re-measured when it finishes and the tag corpus has settled.

Does swapping the last two tie-breakers in case-assistant.ts's ranking help or
hurt, across the whole site rather than on the one query that motivated it?

  A (current): score  ->  specificity DESC  ->  contentCount ASC
  B (proposed):score  ->  contentCount ASC  ->  specificity DESC

Both are run through the same threshold + coverage-dedup + pool cap as the real
engine, so the only variable is the sort.
"""
import json, math, sys, collections
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from hashtag_ref import words, content_id

ROOT = __import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__))) + '/'
POOL = 10
THRESHOLD = 0.5

brain = json.load(open(ROOT + 'dentcast-brain.json', encoding='utf-8'))
titles, tags = {}, collections.defaultdict(list)
for e in brain:
    cid = content_id(e)
    if not cid:
        continue
    titles[cid] = e.get('title', '')
    for t in e.get('hashtags') or []:
        if cid not in tags[t]:
            tags[t].append(cid)

df = collections.Counter()
for t in tags:
    for w in set(words(t)):
        df[w] += 1
N = len(tags)
IDF = {w: math.log((N + 1) / (c + 1)) + 1 for w, c in df.items()}
spec  = {t: sum(IDF.get(w, 1) for w in words(t)) for t in tags}
specC = {t: sum(IDF.get(w, 1) for w in words(t))/max(1,len(words(t))) for t in tags}


def pool(query_words, variant):
    scored = []
    for t, cids in tags.items():
        tw = words(t)
        if not tw:
            continue
        s = sum(w in query_words for w in tw) / len(tw)
        if s < THRESHOLD:
            continue
        scored.append((s, specC[t] if variant=='C' else spec[t], len(cids), t))
    if variant in ('A','C'):
        scored.sort(key=lambda x: (-x[0], -x[1], x[2]))
    else:
        scored.sort(key=lambda x: (-x[0], x[2], -x[1]))
    covered, picked = set(), []
    for s, sp, n, t in scored:
        if len(picked) >= POOL:
            break
        if not any(c not in covered for c in tags[t]):
            continue
        covered.update(tags[t])
        picked.append(t)
    return picked, covered


def evaluate(variant, queries):
    """For each (query_words, target_cid): is the target reachable, and how
    many articles does the whole pool cover (how much choice the user gets)?"""
    hits = 0
    ranks = []
    breadth = []
    options = []
    for qw, target in queries:
        picked, covered = pool(qw, variant)
        breadth.append(len(covered))
        options.append(len(picked))
        if target in covered:
            hits += 1
            for i, t in enumerate(picked):
                if target in tags[t]:
                    ranks.append(i + 1)
                    break
    return hits, ranks, breadth, options


# One query per article: the words of its own tags, i.e. the best case where
# the model extracted exactly the right phrases. Same input for both variants,
# so the comparison is fair even though the construction is generous.
queries = []
for e in brain:
    cid = content_id(e)
    hs = e.get('hashtags') or []
    if not cid or not hs:
        continue
    qw = set()
    for t in hs:
        qw.update(words(t))
    queries.append((qw, cid))

print(f'{len(queries)} queries (one per tagged article)\n')
for v, label in (('A','A current  '), ('B','B coverage '), ('C','C mean-IDF ')):
    hits, ranks, breadth, options = evaluate(v, queries)
    print(f'{label}: reachable {hits}/{len(queries)} ({100*hits/len(queries):.1f}%) | '
          f'mean rank {sum(ranks)/len(ranks):.2f} | rank-1 {100*sum(r==1 for r in ranks)/len(ranks):.1f}% | '
          f'mean articles offered {sum(breadth)/len(breadth):.1f} | mean options {sum(options)/len(options):.1f}')

# Where do they actually differ?
print()
for q in ['توهم هوش مصنوعی رفرنس جعلی','روکش ایمپلنت افتاد','کیفیت تراش اصول تراش']:
    qw=set(words(q))
    for v in ('A','C'):
        p,_=pool(qw,v)
        print(f'  [{v}] {q!r:42s} -> {p[:3]}')
print()
print('Articles reachable under one variant but not the other:')
onlyA = onlyB = 0
for qw, target in queries:
    a = target in pool(qw, 'A')[1]
    b = target in pool(qw, 'B')[1]
    if a and not b:
        onlyA += 1
        print(f'  A only: {target}  {titles.get(target,"")[:50]}')
    elif b and not a:
        onlyB += 1
        print(f'  B only: {target}  {titles.get(target,"")[:50]}')
print(f'  -> A-only {onlyA}, B-only {onlyB}')
