#!/usr/bin/env python3
"""Pathway placement aid — for the publishing workflow (README step 5.6).

Given a content_id that ALREADY exists in dentcast-brain.json, propose which
pathway(s) it belongs to and WHERE inside each (after which existing step),
so the same item can join multiple pathways in the right position.

Pathways are INDEPENDENT of pillars. A pillar is the item's one home in the
taxonomy; a pathway is a learning journey and an item may belong to many. So
placement here is decided purely on CONCEPTUAL relevance to each pathway's own
content — what a learner of that pathway needs — and deliberately ignores the
item's pillar/subtopic. Placement is a semantic judgment the publishing agent
makes; this tool only surfaces ranked candidates + a suggested anchor + a
confidence flag, per Hard Rule 14 (auto-apply the unmistakable, ask with
concrete options for the borderline).

Usage:
  python3 tools/pathway_place.py CONTENT_ID          proposal (which pathways / where)
  python3 tools/pathway_place.py --insert CONTENT_ID --pathway PID --after ANCHOR_ID [--milestone]
  python3 tools/pathway_place.py --insert CONTENT_ID --pathway PID --at-end [--milestone]
  python3 tools/pathway_place.py --coverage          audit 0 / 1 / many membership

Read-only in proposal mode; --insert is the ONLY writer here and edits just
plus/pathways.json (never the brain). It refuses to place LiteCast content
(patient-facing, excluded from professional pathways) and refuses duplicates.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
BRAIN = os.path.join(ROOT, 'dentcast-brain.json')
PW = os.path.join(ROOT, 'plus', 'pathways.json')

def norm(s):
    s = (s or '').lower().replace('ي', 'ی').replace('ك', 'ک')
    return s.replace('‌', '')

def content_id(e):
    u = e.get('page_url') or e.get('url') or ''
    return re.sub(r'\.html$', '', u.lstrip('/'))

def load():
    d = json.load(open(BRAIN))
    by_id = {content_id(e): e for e in d if content_id(e)}
    pw = json.load(open(PW))
    return d, by_id, pw

def tokens(e):
    """Normalized concept tokens for an entry: title + keywords + hashtags."""
    ts = set()
    for kw in (e.get('keywords') or []):
        ts.add(norm(kw))
    for h in (e.get('hashtags') or []):
        ts.add(norm(h).lstrip('#'))
    for w in norm(e.get('title')).split():
        if len(w) > 2:
            ts.add(w)
    return {t for t in ts if t}

def pillar_of(e):
    p = e.get('pillar') or {}
    return p.get('primary'), p.get('subtopic')

def similarity(a_tokens, e):
    """Token overlap of entry `e` against a token set (substring-aware)."""
    et = tokens(e)
    if not et or not a_tokens:
        return 0
    hits = 0
    for t in a_tokens:
        for u in et:
            if t == u or (len(t) > 3 and (t in u or u in t)):
                hits += 1
                break
    return hits

def propose(cid):
    d, by_id, pw = load()
    if cid not in by_id:
        sys.exit(f'content_id not in brain: {cid} (publish it to the brain first)')
    if cid.startswith('litecast/'):
        print('LiteCast content is excluded from professional pathways — skip placement.')
        return
    entry = by_id[cid]
    et = tokens(entry)
    # NOTE: pillar is intentionally NOT used for placement — pathways are
    # independent of pillars. Shown only as FYI, never as a scoring signal.
    prim, sub = pillar_of(entry)
    print(f'PLACE  {cid}  {entry.get("title","")[:64]}')
    print(f'(pillar {prim}/{sub} — FYI only, not used for placement)')
    print(f'tokens: {", ".join(sorted(et))}\n')

    ranked = []
    for p in pw:
        steps = [s['content_id'] for s in p['steps']]
        step_entries = [by_id[s] for s in steps if s in by_id]
        if cid in steps:
            continue  # already a member
        # Purely CONCEPTUAL fit against this pathway's own content: how strongly
        # do the item's concepts overlap the concepts of the pathway's steps,
        # and which single step is the closest neighbour (the anchor).
        best_anchor, best_sim, total, related = None, 0, 0, 0
        for se in step_entries:
            sim = similarity(et, se)
            total += sim
            if sim >= 2:
                related += 1
            if sim > best_sim:
                best_sim, best_anchor = sim, content_id(se)
        if total <= 0:
            continue
        score = total + best_sim * 2 + related
        # STRONG only when a real conceptual CLUSTER exists in this pathway
        # (several related steps AND a close neighbour) — concept-based, never
        # pillar-based. Everything thinner is ASK.
        strong = related >= 3 and best_sim >= 3
        ranked.append((score, p['id'], best_anchor, strong, related, best_sim))

    ranked.sort(key=lambda x: -x[0])
    if not ranked:
        print('No candidate pathway — genuinely orphan, or a new theme. ASK the user.')
        return
    print('candidate pathways (score | conf | pathway | suggested anchor):')
    for score, pid, anchor, strong, related, bsim in ranked[:8]:
        conf = 'STRONG ' if strong else 'ASK    '
        print(f'  {score:3d} | {conf} | {pid:24s} | after {anchor or "(end)"}'
              f'   ({related} related steps, closest {bsim})')
    print('\nSTRONG = a real conceptual cluster in that pathway (auto-place, '
          'report it). ASK = thinner/borderline (present options, confirm first).\n'
          'Placement is conceptual only — the item\'s pillar is irrelevant here.')

def insert(cid, pid, after=None, at_end=False, milestone=False):
    d, by_id, pw = load()
    if cid.startswith('litecast/'):
        sys.exit('refuse: LiteCast is excluded from professional pathways.')
    if cid not in by_id:
        sys.exit(f'refuse: content_id not in brain: {cid}')
    target = next((p for p in pw if p['id'] == pid), None)
    if not target:
        sys.exit(f'refuse: no pathway {pid}')
    ids = [s['content_id'] for s in target['steps']]
    if cid in ids:
        sys.exit(f'refuse: {cid} already in {pid}')
    new = {'content_id': cid, 'milestone': bool(milestone)}
    if at_end:
        target['steps'].append(new)
        pos = 'end'
    else:
        if after not in ids:
            sys.exit(f'refuse: anchor {after} not in {pid}')
        idx = ids.index(after) + 1
        target['steps'].insert(idx, new)
        pos = f'after {after} (index {idx})'
    json.dump(pw, open(PW, 'w'), ensure_ascii=False, indent=2)
    open(PW, 'a').write('\n')
    print(f'inserted {cid} into {pid} at {pos}; milestone={milestone}; '
          f'{pid} now {len(target["steps"])} steps')

def coverage():
    from collections import Counter
    d, by_id, pw = load()
    seat = Counter()
    for p in pw:
        for s in p['steps']:
            seat[s['content_id']] += 1
    title = {content_id(e): e.get('title', '') for e in d}
    allc = [content_id(e) for e in d if content_id(e)]
    uncovered = [c for c in allc if c not in seat and not c.startswith('litecast/')]
    print(f'pathways: {len(pw)} | content: {len(allc)} | '
          f'in >=1: {len(allc) - len([c for c in allc if c not in seat])} | '
          f'multi: {len([c for c in allc if seat[c] > 1])} | '
          f'uncovered non-litecast: {len(uncovered)}')
    for c in uncovered:
        print(f'  UNCOVERED  {c:26s} {title.get(c, "")[:52]}')

def main(argv):
    if '--coverage' in argv:
        coverage(); return
    if '--insert' in argv:
        def opt(name):
            return argv[argv.index(name) + 1] if name in argv else None
        cid = opt('--insert')
        insert(cid, opt('--pathway'), after=opt('--after'),
               at_end='--at-end' in argv, milestone='--milestone' in argv)
        return
    args = [a for a in argv if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    propose(args[0])

if __name__ == '__main__':
    main(sys.argv[1:])
