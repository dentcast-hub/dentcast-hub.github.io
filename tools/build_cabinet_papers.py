#!/usr/bin/env python3
"""Build plus/cabinet-papers.json: the library papers the case assistant may
suggest next to a site hashtag.

Inputs
  plus/cabinet-bridge.json          site hashtag key -> library tags (authored, reviewed)
  dentcast_cabinet_full_catalog.json  the paper library (titles, tags, links)
  plus/content-index.json           the site's live hashtags (keys are checked against it)

Output
  plus/cabinet-papers.json
    papers: {id: {t, y, ty, j, kf, v, d}}  only papers some tag points at
    byTag:  {site tag key: [paper id, ...]}  best first, at most PER_TAG

A paper ranks higher when it carries more of the bridged tags (the first one
counts most: it is the closest equivalent), when its design is stronger
(reviews and trials before narrative pieces) and when it is newer. Library tag
aliases are applied, so a library tag renamed later keeps its bridge.

A paper a site page was written from (its catalog `linked_episodes` names that
page) belongs to every hashtag the page carries and leads that tag's list,
whatever its library tags say: the reader of the page's topic should meet the
page's own source first. share-40 (veneer-retained bridge) was built on
Alikhasi 2025, yet under #جایگزینی_دندان and #بریج the library offered
unrelated papers and, under #RBFDP, ranked it sixth behind «بیشتر».

Usage: python3 tools/build_cabinet_papers.py [--check]
  --check  verify the output is up to date and the bridge names only real tags
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRIDGE = os.path.join(ROOT, 'plus', 'cabinet-bridge.json')
CATALOG = os.path.join(ROOT, 'dentcast_cabinet_full_catalog.json')
INDEX = os.path.join(ROOT, 'plus', 'content-index.json')
OUT = os.path.join(ROOT, 'plus', 'cabinet-papers.json')

PER_TAG = 12
KF_MAX = 320
TAG_WEIGHT = [1.0, 0.7, 0.5, 0.4]
# A page's own source paper outranks anything matched by tags alone.
SOURCE_BONUS = 10.0
DESIGN = {
    'umbrella review': 0.7, 'network meta-analysis': 0.7, 'systematic review + meta-analysis': 0.7,
    'systematic review': 0.6, 'scoping review': 0.4, 'consensus / guideline': 0.6,
    'randomized controlled trial': 0.5, 'prospective cohort study': 0.3, 'non-randomized controlled study': 0.3,
    'retrospective study': 0.2, 'case-control study': 0.2, 'cross-sectional study': 0.2,
    'in vitro study': 0.15, 'finite element analysis': 0.1, 'animal study': 0.1,
    'narrative review': 0.15, 'case series': 0.1, 'case report': 0.05, 'technique report': 0.05,
    'other primary research': 0.2, 'thesis': 0.1, 'editorial / commentary': 0.05,
}
# The library leans heavily on implants: generic tags such as crown, cementation,
# impression, splinting or provisional-restoration are mostly implant papers.
# For a site tag about natural teeth those papers drop below the tooth ones
# (still listed when nothing else exists). A site tag is about implants when a
# word of its label says so, or when most of its candidate papers are implant
# papers (then the few tooth papers must not jump above them).
IMPLANT_WORDS = {'ایمپلنت', 'اباتمنت', 'implant', 'implants', 'abutment', 'اوردنچر', 'overdenture',
                 'زایگوماتیک', 'سینوس', 'ساکت', 'ریج', 'استئواینتگریشن', 'آرچ', 'all-on-4'}
IMPLANT_LIB = re.compile(r'implant|abutment|overdenture|all-on|zygomatic|pterygoid|osseointegration|ti-base|sinus-(?:lift|augmentation|floor)')
IMPLANT_PENALTY = 1.5
IMPLANT_POOL_SHARE = 0.5

# Library tags titles spell out instead (cbct -> cone beam), for the title bonus.
ACRONYM = {
    'cbct': 'cone beam', 'tmd': 'temporomandibular', 'tmj': 'temporomandibular', 'dme': 'deep margin',
    'ids': 'immediate dentin sealing', 'ios': 'intraoral scan', 'prf': 'platelet-rich fibrin',
    'prp': 'platelet-rich plasma', 'gbr': 'guided bone', 'ctg': 'connective tissue', 'fgg': 'free gingival',
    'mronj': 'osteonecrosis', 'vdo': 'vertical dimension', 'rbfdp': 'resin-bonded', 'fdp': 'fixed dental prosthes',
    'ltd': 'low-temperature degradation', 'emd': 'enamel matrix', 'picn': 'polymer-infiltrated',
}


def title_pattern(lib):
    """A library tag as a phrase to find in a title: its words in order, each a
    word start (so 'post' is not 'posterior', 'all-on-4' is not 'overall'),
    digits kept, the last word allowed an ending (crown -> crowns)."""
    lib = ACRONYM.get(lib, lib)
    words = [w for w in re.split(r'[-_\s]+', lib) if w]
    if not words or (len(words) == 1 and len(words[0]) < 4):
        return None
    parts = [re.escape(w[:7]) if i == len(words) - 1 and len(w) > 7 else re.escape(w) for i, w in enumerate(words)]
    return re.compile(r'\b' + r'[-\s]?'.join(parts[:-1] + [parts[-1] + r'\w*']) + r'\b' if len(parts) > 1
                      else r'\b' + parts[0] + r'\w*')

# Not papers a dentist's case should be pointed to — unless the record has a
# DOI, which a brochure or a whole issue does not (a journal article typed
# "other document", a published book chapter).
SKIP_TYPES = {'journal issue', 'manufacturer document', 'other document', 'book / chapter'}


def skipped(p):
    return p.get('type') in SKIP_TYPES and not (p.get('doi') and p.get('type') != 'journal issue'
                                                 and p.get('type') != 'manufacturer document')


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def build():
    raw = load(BRIDGE)
    bridge = raw['map']
    # Papers a reviewer has ruled out for one site tag (a tag that is only a
    # minor tag on them): {site key: [paper id, ...]}.
    exclude = {k: set(v) for k, v in raw.get('exclude', {}).items()}
    # Site tags about natural teeth whatever the library pool looks like
    # (impressions, cements, crowns): implant papers always rank below.
    tooth_topics = set(raw.get('tooth_topics', []))
    cat = load(CATALOG)
    index_tags = load(INDEX)['tags']
    site_keys = {t['key'] for t in index_tags}
    pages_of = {t['key']: set(t['contentIds']) for t in index_tags}
    aliases = cat.get('tag_aliases', {})
    all_ids = {p['id'] for p in cat['papers']}
    canon = lambda t: aliases.get(t, t)

    by_lib = {}
    for p in cat['papers']:
        if skipped(p) or not (p.get('drive_view') or p.get('drive_download')):
            continue
        for t in set(canon(x) for x in p.get('tags', [])):
            by_lib.setdefault(t, []).append(p)

    # site tag key -> papers a page carrying that tag was written from
    sources = {}
    for p in cat['papers']:
        linked = set(p.get('linked_episodes') or [])
        if not linked or skipped(p) or not (p.get('drive_view') or p.get('drive_download')):
            continue
        for key, pages in pages_of.items():
            if linked & pages:
                sources.setdefault(key, []).append(p)

    problems = []
    by_tag, used = {}, {}
    for key in sorted(tooth_topics - set(bridge)):
        problems.append(f'tooth_topics names a site tag with no bridge: {key}')
    for key, ids in sorted(exclude.items()):
        if key not in bridge:
            problems.append(f'exclude names a site tag with no bridge: {key}')
        for pid in ids:
            if pid not in all_ids:
                problems.append(f'exclude names an unknown paper for {key}: {pid}')
    for key in sorted(set(bridge) | set(sources)):
        if key in bridge and key not in site_keys:
            problems.append(f'site tag not in content-index: {key}')
            continue
        libs = [canon(x) for x in bridge.get(key, [])]
        for x in libs:
            if x not in by_lib:
                problems.append(f'{key}: library tag has no papers: {x}')
        score = {}
        for i, lib in enumerate(libs[:len(TAG_WEIGHT)]):
            for p in by_lib.get(lib, []):
                score[p['id']] = score.get(p['id'], 0) + TAG_WEIGHT[i]
        own = {p['id'] for p in sources.get(key, [])}
        for pid in own:
            score[pid] = score.get(pid, 0) + SOURCE_BONUS
        if not score:
            continue
        for pid in exclude.get(key, ()):
            score.pop(pid, None)
        if not score:
            continue
        papers = {p['id']: p for lib in libs for p in by_lib.get(lib, [])}
        papers.update({p['id']: p for p in sources.get(key, [])})
        def implant_paper(p):
            return any(IMPLANT_LIB.search(t) for t in p.get('tags', []) if not t.startswith('topic:'))

        share = sum(1 for pid in score if implant_paper(papers[pid])) / len(score)
        implant_topic = key not in tooth_topics and (
            bool(IMPLANT_WORDS & set(re.split(r'[\s_]+', key))) or share >= IMPLANT_POOL_SHARE)

        # A paper whose TITLE names the topic is about it; one that only carries
        # the tag may mention it in passing (an endocrown review tagged ferrule).
        patterns = [x for x in (title_pattern(lib) for lib in libs) if x]

        def in_title(p):
            t = (p.get('display_title') or p.get('title') or '').lower()
            return any(rx.search(t) for rx in patterns)

        def rank(pid):
            p = papers[pid]
            year = int(p.get('crossref_year') or 0)
            off_topic = 0 if implant_topic or not implant_paper(p) else IMPLANT_PENALTY
            total = (score[pid] + (0.8 if in_title(p) else 0) + DESIGN.get(p.get('type'), 0)
                     + (0.1 if p.get('key_finding') else 0) + (0.15 if year >= 2018 else 0) - off_topic)
            # rounded, so float noise (2.1999… vs 2.2) never outranks the year
            return (-round(total, 6), -year, pid)

        ids = sorted(score, key=rank)[:PER_TAG]
        by_tag[key] = ids
        for pid in ids:
            used[pid] = papers[pid]

    out_papers = {}
    for pid in sorted(used):
        p = used[pid]
        kf = re.sub(r'\s+', ' ', p.get('key_finding') or '').strip()
        if len(kf) > KF_MAX:
            kf = kf[:KF_MAX].rsplit(' ', 1)[0] + ' …'
        out_papers[pid] = {k: v for k, v in {
            't': re.sub(r'\s+', ' ', p.get('display_title') or p.get('real_title') or p.get('title') or '').strip(),
            'y': p.get('crossref_year') or None,
            'ty': p.get('type') or '',
            'j': p.get('journal') or '',
            'kf': kf,
            'v': p.get('drive_view') or '',
            'd': p.get('drive_download') or '',
        }.items() if v}
    return {
        'version': 1,
        'generatedFrom': 'plus/cabinet-bridge.json + dentcast_cabinet_full_catalog.json',
        'tagCount': len(by_tag),
        'paperCount': len(out_papers),
        'byTag': by_tag,
        'papers': out_papers,
    }, problems


def main():
    out, problems = build()
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n'
    for p in problems:
        print('WARN', p, file=sys.stderr)
    if '--check' in sys.argv:
        current = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if current != text:
            print('plus/cabinet-papers.json is stale: run python3 tools/build_cabinet_papers.py', file=sys.stderr)
            sys.exit(1)
        # Every problem fails the check: a renamed site tag, a bridge row that
        # yields nothing, a stale exclusion. The build itself only warns, so the
        # post-merge regeneration on main never stops over one of them.
        if problems:
            sys.exit(1)
        print('OK - cabinet-papers.json matches the bridge and the library.')
        return
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Wrote plus/cabinet-papers.json: {out['tagCount']} site tags -> {out['paperCount']} papers.")


if __name__ == '__main__':
    main()
