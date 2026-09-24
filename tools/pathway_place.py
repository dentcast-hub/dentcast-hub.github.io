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
  python3 tools/pathway_place.py --insert CONTENT_ID --pathway PID --at-start
  python3 tools/pathway_place.py --coverage          audit 0 / 1 / many membership
  python3 tools/pathway_place.py --freeze-core       re-freeze the curated core after a founder pass

Read-only in proposal mode; --insert is the ONLY writer here and edits just
plus/pathways.json (never the brain). It refuses to place LiteCast content
(patient-facing, excluded from professional pathways) and refuses duplicates.

Three guards, added after the 2026-09-14 audit (founder re-curation). Between
the 2026-07-22 curation and that audit, the 64 items published in between had
averaged 2.64 pathways each against 1.38 for the curated set, `fixed-pros` had
re-grown the post-and-core block it was deliberately split from, and eight
series had a stranger sitting between part 1 and part 2 — all three from the
same loop: this tool scored an item against the pathway's CURRENT list, so
every placement made the next similar item score higher, and its anchor was
the nearest neighbour, which in a series is part N, not the end.

  * STRONG is measured against the pathway's frozen CORE
    (.dentcast/pathway-core.json — the steps as the founder last curated
    them), never its live list. The live list still ranks and still supplies
    the anchor; it just cannot promote. A pathway with no frozen core is never
    STRONG. `--freeze-core` re-freezes every full pathway from the live file;
    run it only after a founder curation pass, never after a publish.
  * A THIRD pathway is always a question. An item already in two full
    pathways gets ASK for every further candidate, and `--insert` refuses to
    make it a member of a third without `--confirmed` — the flag is the record
    that the founder said yes to that specific placement.
  * The anchor never splits a series. A run of consecutively-numbered steps
    from one folder (episodes + their NoteCasts count as one series), or of
    consecutive «قسمت/بخش N» titles sharing a stem, is one unit: the suggested
    anchor moves to the run's last step, and `--insert --after` a step that is
    inside a run (not its last) is refused without `--confirmed`.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
BRAIN = os.path.join(ROOT, 'dentcast-brain.json')
HREF = os.path.join(ROOT, 'dentcast-hashtag-reference.json')
PW = os.path.join(ROOT, 'plus', 'pathways.json')
CORE = os.path.join(ROOT, '.dentcast', 'pathway-core.json')
# An item may be auto-placed into at most this many full pathways; from the
# next one on, every placement is a founder decision (see the docstring).
AUTO_MAX_PATHWAYS = 2
# STRONG needs this many core steps sharing >= 2 concepts with the item, and a
# closest core step sharing this many. Calibrated 2026-09-14: at 3/3 a
# diabetes-and-implants note was STRONG for fixed-pros and occlusion on the
# strength of the word «ایمپلنت»; at 4/4 a scanner-accuracy article is still
# STRONG for the impression block of fixed-pros and for implant scan bodies.
STRONG_RELATED, STRONG_BEST = 4, 4
PART_RE = re.compile(
    r'(قسمت|بخش)\s*(اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم|دهم|پایانی|آخر|\d+|[۰-۹]+)'
    r'|\bpart\s*[\d۰-۹]|:\s*part\s*[\d۰-۹]|\bmyths?\s*[\d۰-۹]', re.I)

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

def load_core():
    return json.load(open(CORE)) if os.path.exists(CORE) else {}

def full_pathways(pw):
    return [p for p in pw if p.get('kind') != 'bundle']

def memberships(cid, pw):
    """Full pathways (never bundles — those have their own gate, 5.6-ب) the
    item already sits in."""
    return [p['id'] for p in full_pathways(pw)
            if any(s['content_id'] == cid for s in p['steps'])]

def unit_key(cid):
    """(series, number-tuple) for the series guard. episodes/ and notecast/
    share one series because an episode and its NoteCast are one unit."""
    parts = cid.split('/')
    folder, name = parts[0], parts[-1]
    series = 'ep' if folder in ('episodes', 'notecast') else folder
    m = re.search(r'(\d+(?:-\d+)*)$', name)
    nums = tuple(int(x) for x in m.group(1).split('-')) if m else ()
    return series, nums

def bound(a_cid, b_cid, a_title, b_title):
    """True when two ADJACENT steps belong to the same series: same folder and
    consecutive numbers (or the same number — episode + its NoteCast), or both
    titled «… قسمت/بخش N» with the same opening word."""
    (sa, na), (sb, nb) = unit_key(a_cid), unit_key(b_cid)
    # Consecutive numbers mean a series only where numbering IS the series:
    # podcast episodes (and their NoteCasts), and chapter-style ids such as
    # promptologist prompt6-1 → prompt6-4. Two chairside cases published one
    # after the other are not parts of anything.
    if sa == sb and na and nb and len(na) == len(nb) and (sa == 'ep' or len(na) > 1):
        if na == nb or (na[:-1] == nb[:-1] and nb[-1] - na[-1] == 1):
            return True
    if PART_RE.search(a_title or '') and PART_RE.search(b_title or ''):
        wa = [w for w in norm(a_title).split() if len(w) > 2]
        wb = [w for w in norm(b_title).split() if len(w) > 2]
        return bool(wa and wb and wa[0] == wb[0])
    return False

def runs(steps, by_id):
    """Split a pathway's step ids into maximal series runs (lists of ids)."""
    out, cur = [], []
    title = lambda c: (by_id.get(c) or {}).get('title', '')
    for c in steps:
        if cur and bound(cur[-1], c, title(cur[-1]), title(c)):
            cur.append(c)
        else:
            if cur:
                out.append(cur)
            cur = [c]
    if cur:
        out.append(cur)
    return out

def run_end(steps, by_id, anchor):
    """The last step of the series run `anchor` sits in (anchor itself when it
    is not inside one, or already its last step)."""
    for r in runs(steps, by_id):
        if anchor in r:
            return r[-1]
    return anchor

# Title words that name nothing: a scorer that counts «درباره» or «چطور» as a
# shared concept finds every article related to every other.
STOP = set("""درباره همهچیز چیست چطور چگونه برای وقتی چرا این که های یک دو سه است نیست
باید نباید بین روی توی از با در به را تا هم یا اما ولی اگر آیا کدام چند نکته نکات
مورد مهم واقعا واقعاً بحث بحثی قسمت بخش پایان ادامه مقدمه مقدمهای اول دوم سوم
the and for with what how why part""".split())

_BRAND = None
def brand_tags():
    """Hashtags whose domain is brand/web — a series name, a guest, a
    section. They mark WHERE a page was published, not what it is about, and
    they are the reason every ShareHub item used to score as a neighbour of
    every other ShareHub item (2026-09-14). Same rule highlight-concepts.ts
    applies: a brand tag is not a concept."""
    global _BRAND
    if _BRAND is None:
        _BRAND = set()
        try:
            ref = json.load(open(HREF))
            for c in ref.get('concepts') or []:
                if c.get('domain') in ('brand', 'web'):
                    _BRAND.add(norm(c.get('tag', '')).lstrip('#'))
        except (OSError, ValueError):
            pass
    return _BRAND

def tokens(e):
    """Normalized concept tokens for an entry: title + keywords + hashtags,
    minus brand tags and stop words."""
    ts = set()
    for kw in (e.get('keywords') or []):
        ts.add(norm(kw))
    for h in (e.get('hashtags') or []):
        ts.add(norm(h).lstrip('#'))
    for w in norm(e.get('title')).split():
        if len(w) > 2:
            ts.add(w)
    brand = brand_tags()
    return {t for t in ts if t and t not in STOP and t not in brand}

def pillar_of(e):
    p = e.get('pillar') or {}
    return p.get('primary'), p.get('subtopic')

# A token this common across the brain names the site, not a subject.
GENERIC_SHARE = 0.10
_GENERIC = None
def generic_tokens(entries):
    """Tokens (and title words) present in more than GENERIC_SHARE of all
    entries — «دندان», «بیمار», «درمان», «روکش»… Until 2026-09-14 the
    scorer's substring rule let the title word «دندان» hit the keyword
    «اسپارتینا و دندانپزشکی», which made a tirzepatide article a STRONG
    neighbour of Goodacre's prep principles. Measured, not hand-listed, so
    the list moves with the corpus."""
    global _GENERIC
    if _GENERIC is None:
        from collections import Counter
        df = Counter()
        n = 0
        for e in entries:
            n += 1
            seen = set()
            for t in tokens(e):
                seen.add(t)
                seen.update(w for w in _words(t) if len(w) > 2)
            df.update(seen)
        _GENERIC = {t for t, c in df.items() if n and c / n > GENERIC_SHARE}
    return _GENERIC

def _words(t):
    return [w for w in re.split(r'[\s_\-/,:;()]+', t) if w]

def _contains_word(short, long):
    """`short` occurs in `long` as a whole word (space/underscore/dash
    bounded), never as a fragment: «اچ» is not inside «اچینگ»."""
    return short in _words(long)

def similarity(a_tokens, e, generic=frozenset()):
    """Token overlap of entry `e` against a token set. Exact matches, or a
    whole-word containment where the shorter side is at least 4 chars and
    neither side is a generic token."""
    et = tokens(e)
    if not et or not a_tokens:
        return 0
    hits = 0
    for t in a_tokens:
        if t in generic:
            continue
        for u in et:
            if u in generic:
                continue
            if t == u:
                hits += 1
                break
            s, l = (t, u) if len(t) <= len(u) else (u, t)
            if len(s) >= 4 and _contains_word(s, l):
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
    generic = generic_tokens(d)
    et = tokens(entry) - generic
    core = load_core()
    # NOTE: pillar is intentionally NOT used for placement — pathways are
    # independent of pillars. Shown only as FYI, never as a scoring signal.
    prim, sub = pillar_of(entry)
    print(f'PLACE  {cid}  {entry.get("title","")[:64]}')
    print(f'(pillar {prim}/{sub} — FYI only, not used for placement)')
    print(f'tokens: {", ".join(sorted(et))}')
    have = memberships(cid, pw)
    capped = len(have) >= AUTO_MAX_PATHWAYS
    print(f'already in {len(have)} full pathway(s): {", ".join(have) or "—"}'
          + ('   → cap reached: every further placement is ASK '
             '(--insert needs --confirmed)' if capped else '') + '\n')
    if not core:
        print('NOTE: no frozen core (.dentcast/pathway-core.json) — nothing can be '
              'STRONG until `--freeze-core` is run after a founder curation pass.\n')

    ranked = []
    for p in pw:
        steps = [s['content_id'] for s in p['steps']]
        step_entries = [by_id[s] for s in steps if s in by_id]
        if cid in steps:
            continue  # already a member
        core_ids = set(core.get(p['id'], []))
        # Purely CONCEPTUAL fit against this pathway's own content: how strongly
        # do the item's concepts overlap the concepts of the pathway's steps,
        # and which single step is the closest neighbour (the anchor). The
        # LIVE list ranks and anchors; only the frozen CORE can make a
        # pathway STRONG — otherwise every placement raises the score of the
        # next similar item and the pathway drifts toward whatever it was
        # last fed (how `evidence-literacy` came to rank a post-and-core
        # article first, 2026-09-14).
        best_anchor, best_sim, total, related = None, 0, 0, 0
        core_related, core_best = 0, 0
        for se in step_entries:
            sim = similarity(et, se, generic)
            total += sim
            if sim >= 2:
                related += 1
            if sim > best_sim:
                best_sim, best_anchor = sim, content_id(se)
            if content_id(se) in core_ids:
                if sim >= 2:
                    core_related += 1
                core_best = max(core_best, sim)
        if total <= 0:
            continue
        score = total + best_sim * 2 + related
        # STRONG only when a real conceptual CLUSTER exists in the pathway's
        # CORE (several related core steps AND a close core neighbour), the
        # item is under the membership cap, and the core exists at all.
        strong = (bool(core_ids) and core_related >= STRONG_RELATED
                  and core_best >= STRONG_BEST and not capped)
        # The anchor never splits a series: land after the run's last step.
        anchor = run_end(steps, by_id, best_anchor) if best_anchor else None
        moved = anchor != best_anchor
        ranked.append((score, p['id'], anchor, strong, related, best_sim,
                       core_related, core_best, moved, best_anchor))

    ranked.sort(key=lambda x: -x[0])
    if not ranked:
        print('No candidate pathway — genuinely orphan, or a new theme. ASK the user.')
        return
    print('candidate pathways (score | conf | pathway | suggested anchor):')
    for (score, pid, anchor, strong, related, bsim,
         crel, cbest, moved, raw_anchor) in ranked[:8]:
        conf = 'STRONG ' if strong else 'ASK    '
        note = f'({related} related steps, closest {bsim}; core {crel}/{cbest})'
        if moved:
            note += f'  series: nearest was {raw_anchor}, moved to end of run'
        print(f'  {score:3d} | {conf} | {pid:24s} | after {anchor or "(end)"}   {note}')
    print('\nSTRONG = a real conceptual cluster in that pathway\'s frozen CORE '
          '(auto-place, report it). ASK = thinner/borderline, or the item is '
          f'already in {AUTO_MAX_PATHWAYS} pathways (present options, confirm '
          'first).\nPlacement is conceptual only — the item\'s pillar is '
          'irrelevant here.')

def insert(cid, pid, after=None, at_end=False, milestone=False, confirmed=False, at_start=False):
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
    have = memberships(cid, pw)
    if target.get('kind') != 'bundle' and len(have) >= AUTO_MAX_PATHWAYS and not confirmed:
        sys.exit(f'refuse: {cid} is already in {len(have)} full pathways '
                 f'({", ".join(have)}); another one is a founder decision — ask, '
                 f'then re-run with --confirmed.')
    new = {'content_id': cid, 'milestone': bool(milestone)}
    if at_end:
        target['steps'].append(new)
        pos = 'end'
    elif at_start:
        # The new first step of a pathway: a foundation the rest builds on
        # (تراز شواهد قسمت ۱ opening evidence-literacy, 1405/07/02). Never
        # --after, which can only ever place something behind step one.
        target['steps'].insert(0, new)
        pos = 'start (index 0)'
    else:
        if after not in ids:
            sys.exit(f'refuse: anchor {after} not in {pid}')
        end = run_end(ids, by_id, after)
        if end != after and not confirmed:
            sys.exit(f'refuse: {after} is inside a series whose last step is '
                     f'{end}; --after {end} keeps the series whole (or --confirmed '
                     f'if the founder wants it between parts).')
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
    # Full pathways only: the drift KPI. The 2026-07-22 curation averaged
    # 1.38 pathways per placed item; anything creeping toward 2+ means
    # step 5.6 is placing by resemblance again.
    full = Counter()
    for p in full_pathways(pw):
        for s in p['steps']:
            full[s['content_id']] += 1
    if full:
        mean = sum(full.values()) / len(full)
        crowded = [c for c, n in full.most_common() if n >= 4]
        print(f'full pathways: {sum(full.values())} memberships over {len(full)} items '
              f'= {mean:.2f} per item (curated baseline 1.38) | in >=4: {len(crowded)}')
        for c in crowded:
            print(f'  CROWDED    {full[c]}x {c:26s} {title.get(c, "")[:48]}')
    for c in uncovered:
        print(f'  UNCOVERED  {c:26s} {title.get(c, "")[:52]}')

def freeze_core():
    """Snapshot every full pathway's steps as its curated core. Run after a
    founder curation pass ONLY — running it after ordinary publishes would
    re-admit the drift the core exists to measure against."""
    d, by_id, pw = load()
    core = {p['id']: [s['content_id'] for s in p['steps']] for p in full_pathways(pw)}
    os.makedirs(os.path.dirname(CORE), exist_ok=True)
    json.dump(core, open(CORE, 'w'), ensure_ascii=False, indent=1)
    open(CORE, 'a').write('\n')
    print(f'froze core for {len(core)} pathways → {os.path.relpath(CORE, ROOT)} '
          f'({sum(len(v) for v in core.values())} steps)')

def main(argv):
    if '--coverage' in argv:
        coverage(); return
    if '--freeze-core' in argv:
        freeze_core(); return
    if '--insert' in argv:
        def opt(name):
            return argv[argv.index(name) + 1] if name in argv else None
        cid = opt('--insert')
        insert(cid, opt('--pathway'), after=opt('--after'),
               at_end='--at-end' in argv, milestone='--milestone' in argv,
               confirmed='--confirmed' in argv, at_start='--at-start' in argv)
        return
    args = [a for a in argv if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    propose(args[0])

if __name__ == '__main__':
    main(sys.argv[1:])
