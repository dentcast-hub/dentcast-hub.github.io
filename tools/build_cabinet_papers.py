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
DESIGN = {
    'umbrella review': 0.7, 'network meta-analysis': 0.7, 'systematic review + meta-analysis': 0.7,
    'systematic review': 0.6, 'scoping review': 0.4, 'consensus / guideline': 0.6,
    'randomized controlled trial': 0.5, 'prospective cohort study': 0.3, 'non-randomized controlled study': 0.3,
    'retrospective study': 0.2, 'case-control study': 0.2, 'cross-sectional study': 0.2,
    'in vitro study': 0.15, 'finite element analysis': 0.1, 'animal study': 0.1,
    'narrative review': 0.15, 'case series': 0.1, 'case report': 0.05, 'technique report': 0.05,
}
# Not papers a dentist's case should be pointed to.
SKIP_TYPES = {'journal issue', 'manufacturer document', 'other document', 'book / chapter'}


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def build():
    bridge = load(BRIDGE)['map']
    cat = load(CATALOG)
    site_keys = {t['key'] for t in load(INDEX)['tags']}
    aliases = cat.get('tag_aliases', {})
    canon = lambda t: aliases.get(t, t)

    by_lib = {}
    for p in cat['papers']:
        if p.get('type') in SKIP_TYPES or not (p.get('drive_view') or p.get('drive_download')):
            continue
        for t in set(canon(x) for x in p.get('tags', [])):
            by_lib.setdefault(t, []).append(p)

    problems = []
    by_tag, used = {}, {}
    for key, libs in sorted(bridge.items()):
        if key not in site_keys:
            problems.append(f'site tag not in content-index: {key}')
            continue
        libs = [canon(x) for x in libs]
        for x in libs:
            if x not in by_lib:
                problems.append(f'{key}: library tag has no papers: {x}')
        score = {}
        for i, lib in enumerate(libs[:len(TAG_WEIGHT)]):
            for p in by_lib.get(lib, []):
                score[p['id']] = score.get(p['id'], 0) + TAG_WEIGHT[i]
        if not score:
            continue
        papers = {p['id']: p for lib in libs for p in by_lib.get(lib, [])}

        # A paper whose TITLE names the topic is about it; one that only carries
        # the tag may mention it in passing (an endocrown review tagged ferrule).
        stems = [[w[:6] for w in re.split(r'[-_]', lib) if len(w) > 2] for lib in libs]

        def in_title(p):
            t = (p.get('display_title') or p.get('title') or '').lower()
            return any(ws and all(w in t for w in ws) for ws in stems)

        def rank(pid):
            p = papers[pid]
            year = int(p.get('crossref_year') or 0)
            return (-(score[pid] + (0.8 if in_title(p) else 0) + DESIGN.get(p.get('type'), 0)
                      + (0.1 if p.get('key_finding') else 0) + (0.15 if year >= 2018 else 0)), -year, pid)

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
        if any(p.startswith('site tag not in') for p in problems):
            sys.exit(1)
        print('OK - cabinet-papers.json matches the bridge and the library.')
        return
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Wrote plus/cabinet-papers.json: {out['tagCount']} site tags -> {out['paperCount']} papers.")


if __name__ == '__main__':
    main()
