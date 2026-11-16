#!/usr/bin/env python3
"""Cabinet enrichment: read each paper once, keep only facts about it.

The founder's decision (2026-11-15): the cabinet's PDFs are read by a model to
derive library tags, a document class and structured facts (materials and
brands, sample, follow-up, PICO, main result, funding, limitations), then an
independent stronger model confirms every tag. The paper's text is never kept:
it lives in a work folder outside the repository for the length of one batch
and is deleted with it. What survives is metadata, written to a staging file
that the founder reviews before anything reaches the catalogue.

    prepare  --ids P0001,P0002 --work DIR    PDF from Drive -> text -> sections -> DIR/paper_<id>.json
    prepare  --id NEW --pdf F --entry E --work DIR   the same for a paper not yet in the catalogue
             (E: its catalogue entry, e.g. a queue item's 04-منبع/کاتالوگ.json)
    check    --work DIR                      model proposals -> mechanical gates -> DIR/checked_<id>.json
    merge    --work DIR --judges A[,B] --out results.jsonl   judge verdicts applied, one line per paper
    freeze   --work DIR --merged M --doi D --out F   a not-yet-catalogued paper's row, keyed by DOI
    coverage [--check]                       catalogue ids with no row in results.jsonl

Gates in `check` are mechanical and never relaxed: a tag must exist in the
library vocabulary (after tag_aliases), must not repeat the paper's current
tags, must not be on the low-value list, and its evidence quote must occur in
the paper's text; every fact that carries a quote is checked the same way and
dropped if the quote is not found.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / 'dentcast_cabinet_full_catalog.json'
sys.path.insert(0, str(ROOT / 'tools'))

# Tags that are true of a paper but find nothing. Only what the calibration
# (50 papers, two independent Opus reviewers, 2026-11-15) rejected EVERY time
# it was proposed: a wider list would also drop the cases where the reviewers
# accepted it (single-implant, edentulous, maxilla were each accepted when they
# were the subject). The judges handle the rest.
LOW_VALUE = {'radiographic-analysis', 'mandible', 'posterior-region', 'multicenter-study'}
# A design tag that only repeats the catalogue's own `type` adds nothing.
TYPE_TAGS = {
    'randomized controlled trial': {'randomized-controlled-trial', 'rct'},
    'retrospective study': {'retrospective'}, 'prospective cohort study': {'prospective', 'cohort'},
    'animal study': {'animal-study'}, 'in vitro study': {'in-vitro'}, 'case report': {'case-report'},
    'case series': {'case-series'}, 'systematic review': {'systematic-review'},
    'systematic review + meta-analysis': {'systematic-review', 'meta-analysis'},
    'network meta-analysis': {'systematic-review', 'meta-analysis', 'network-meta-analysis'},
    'narrative review': {'narrative-review'},
}
SECTION_CHARS = 9000
WHOLE_CHARS = 30000
USER_AGENT = 'dentcast-cabinet-enrich/1.0'


def outside_repo(path):
    p = Path(path).resolve()
    if p == ROOT or ROOT in p.parents:
        sys.exit(f'refusing to use {p}: paper text never goes inside the repository')
    return p


def catalog():
    with open(CATALOG, encoding='utf-8') as f:
        return json.load(f)


# ------------------------------------------------------------------ text

def garble_score(text):
    """Share of word characters sitting in run-together tokens (> 24 letters)."""
    toks = re.findall(r'[A-Za-z]+', text)
    total = sum(map(len, toks)) or 1
    return sum(len(t) for t in toks if len(t) > 24) / total


def pdf_text(path):
    """Column-ordered text (pdf_source_text); plain pdftotext when that reads
    better — some PDFs carry no space glyphs and the box reader glues words."""
    import pdf_source_text as pst  # noqa: PLC0415
    pages, _ = pst.read_words(Path(path))
    a = pst.source_text(pages)
    try:
        b = subprocess.run(['pdftotext', '-enc', 'UTF-8', str(path), '-'], capture_output=True,
                           text=True, timeout=180).stdout
    except (OSError, subprocess.TimeoutExpired):
        b = ''
    pick = a
    if b.strip() and (garble_score(a) > 0.08 and garble_score(b) < garble_score(a) / 2):
        pick = b
    return pick, len(pages), round(garble_score(pick), 3)


HEAD = re.compile(r'(?im)^\s*(?:\d+(?:\.\d+)*\.?\s*)?(abstract|summary|introduction|background|materials?\s+and\s+methods?|'
                  r'methods?|methodology|patients?\s+and\s+methods?|study\s+design|results?|findings|discussion|'
                  r'conclusions?|clinical\s+(?:significance|relevance|implications)|funding|conflicts?\s+of\s+interest|'
                  r'disclosure|references|bibliography|acknowledg(?:e)?ments?)\s*:?\s*$')


def sections(text):
    marks = [(m.start(), m.group(1).lower()) for m in HEAD.finditer(text)]
    out = {'front': text[:marks[0][0]] if marks else text[:4000]}
    for i, (pos, name) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        key = ('methods' if 'method' in name or 'design' in name else
               'results' if name.startswith(('result', 'finding')) else
               'conclusion' if name.startswith(('conclusion', 'clinical')) else
               'abstract' if name in ('abstract', 'summary') else
               'funding' if name.startswith(('funding', 'conflict', 'disclosure', 'acknowledg')) else
               'refs' if name.startswith(('reference', 'bibliograph')) else name)
        out[key] = out.get(key, '') + text[pos:end] + '\n'
    return out


def reading_text(text):
    """What the model reads: front page (title, authors, DOI, journal), abstract,
    methods, results, conclusion, funding — not introduction, discussion or
    references, where a paper mentions what it is not about."""
    s = sections(text)
    keys = [k for k in ('abstract', 'methods', 'results', 'conclusion') if k in s]
    if len(keys) >= 2:
        parts = [s['front'][:3000]] + [s[k][:SECTION_CHARS] for k in keys] + [s.get('funding', '')[:1500]]
        return '\n'.join(p for p in parts if p), 'sections'
    cut = re.search(r'(?im)^\s*(references|bibliography)\s*$', text)
    body = text[:cut.start()] if cut else text
    if len(body) > WHOLE_CHARS:   # keep the beginning and the end: abstract and conclusions
        body = body[:WHOLE_CHARS * 2 // 3] + '\n[…]\n' + body[-WHOLE_CHARS // 3:]
    return body, 'whole-minus-refs'


DOI_RE = re.compile(r'\b(10\.\d{4,9}/[^\s"<>]+)', re.I)


def references_dois(text):
    """DOIs cited in the reference list (mechanical; no model)."""
    s = sections(text)
    refs = s.get('refs', '')
    return sorted({d.rstrip('.,;)').lower() for d in DOI_RE.findall(refs)})


def download(url, dest):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read()
    if not data.startswith(b'%PDF'):
        return False
    dest.write_bytes(data)
    return True


def cmd_prepare(a):
    work = outside_repo(a.work)
    work.mkdir(parents=True, exist_ok=True)
    cat = catalog()
    P = {p['id']: p for p in cat['papers']}
    stats = Counter()
    if a.pdf or a.entry:
        # A paper that is not in the catalogue yet: its entry and its PDF come from the caller.
        if not (a.entry and a.id) or a.ids:
            sys.exit('prepare for a new paper needs --id and --entry (and no --ids); --pdf, or the entry\'s drive_download')
        e = json.loads(Path(a.entry).read_text(encoding='utf-8'))
        if isinstance(e, list):
            e = [x for x in e if not x.get('link_existing') and not x.get('skip')]
            if a.doi:
                e = [x for x in e if (x.get('doi') or '').lower() == a.doi.lower()]
            elif a.drive_id:
                e = [x for x in e if x.get('drive_id') == a.drive_id]
            if len(e) != 1:
                sys.exit(f'--entry holds {len(e)} new papers; name one with --doi')
            e = e[0]
        P = {a.id: e}
        ids = [a.id]
        if a.pdf:
            import shutil  # noqa: PLC0415
            shutil.copyfile(Path(a.pdf).resolve(), work / f'{a.id}.pdf')
    elif a.ids:
        ids = a.ids.split(',')
    else:
        sys.exit('prepare needs --ids, or --id/--pdf/--entry for a new paper')
    for pid in ids:
        out = work / f'paper_{pid}.json'
        if out.exists():
            stats['kept'] += 1
            continue
        p = P[pid]
        pdf = work / f'{pid}.pdf'
        rec = {'id': pid, 'title': p.get('display_title') or p.get('title'), 'catalog_type': p.get('type'),
               'journal': p.get('journal'), 'year': p.get('crossref_year'), 'doi': p.get('doi') or '',
               'authors': p.get('authors') or [], 'has_key_finding': bool(p.get('key_finding')),
               'linked_episodes': p.get('linked_episodes') or [],
               'current_tags': [t for t in p.get('tags', []) if not t.startswith('topic:')]}
        try:
            ok = pdf.exists() or (p.get('drive_download') and download(p['drive_download'], pdf))
        except Exception as e:  # network, Drive quota page, …
            ok = False
            rec['error'] = str(e)[:200]
        if not ok:
            rec.update(text_status='no_pdf', text='', text_mode='none')
            stats['no_pdf'] += 1
        else:
            try:
                text, n_pages, g = pdf_text(pdf)
            except Exception as e:
                text, n_pages, g = '', 0, 1.0
                rec['error'] = str(e)[:200]
            body, mode = reading_text(text)
            rec.update(pages=n_pages, garble=g, text_mode=mode, text=body,
                       text_status='no_text' if len(text.strip()) < 300 else 'ok',
                       ref_dois=references_dois(text))
            stats[rec['text_status']] += 1
        if pdf.exists() and not a.keep_pdf:
            pdf.unlink()
        out.write_text(json.dumps(rec, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(stats))


# ------------------------------------------------------------------ gates

def norm(s):
    s = s.replace('­', '').replace('‐', '-').replace('‑', '-')
    s = re.sub(r'-\s*\n\s*', '', s)
    s = re.sub(r'(?<=[a-z])- (?=[a-z])', '', s)   # «envi- ronmental»: a line-break hyphen copied with a space
    return re.sub(r'\s+', ' ', s).strip().lower()


def quoted(evidence, text_n):
    e = norm(re.sub(r'-\s*$', '', evidence or ''))
    return bool(e) and e in text_n


def cmd_check(a):
    work = outside_repo(a.work)
    cat = catalog()
    alias = cat.get('tag_aliases', {})
    vocab = {t for p in cat['papers'] for t in p.get('tags', [])
             if not t.startswith('topic:') and not re.fullmatch(r'(19|20)\d\d', t) and len(t.split('-')) < 6}
    stats = Counter()
    only = set(a.ids.split(',')) if a.ids else None
    for f in sorted(work.glob('proposal_*.json')):
        if only and f.stem.split('_', 1)[1] not in only:
            continue
        r = json.loads(f.read_text(encoding='utf-8'))
        p = json.loads((work / f"paper_{r['id']}.json").read_text(encoding='utf-8'))
        tn = norm(p.get('text', ''))
        cur = {alias.get(t, t) for t in p['current_tags']}
        tags, seen = [], set()
        for t in r.get('ft_tags', []):
            tag = alias.get(t.get('tag', ''), t.get('tag', ''))
            why = ('not_in_vocabulary' if tag not in vocab else 'duplicate' if tag in cur or tag in seen else
                   'low_value' if tag in LOW_VALUE or tag in TYPE_TAGS.get(p.get('catalog_type'), ()) else 'quote_not_found' if not quoted(t.get('evidence'), tn) else None)
            stats[why or 'ok'] += 1
            if not why:
                seen.add(tag)
                tags.append({**t, 'tag': tag})
        r['ft_tags'] = tags[:8]
        r['new_tag_candidates'] = [c for c in r.get('new_tag_candidates', []) if quoted(c.get('evidence'), tn)][:2]
        facts = r.get('facts', {}) or {}
        for k, v in list(facts.items()):  # a fact with a quote stands or falls by it
            if isinstance(v, dict) and 'evidence' in v and v.get('value') not in (None, '', []) \
                    and not quoted(v['evidence'], tn):
                facts[k] = None
                stats['fact_dropped'] += 1
        mb = facts.get('materials_brands')
        if isinstance(mb, list):
            facts['materials_brands'] = [m for m in mb if not isinstance(m, dict) or quoted(m.get('evidence'), tn)]
        # Bibliographic facts are read, never reconstructed: the value itself must be in the text.
        for k, ok in (('doi', lambda v: norm(str(v)) in tn),
                      ('year', lambda v: str(v) in tn),
                      ('authors', lambda v: isinstance(v, list) and v and all(
                          norm(n.split()[-1]) in tn for n in v if isinstance(n, str) and n.split()))):
            v = facts.get(k)
            if isinstance(v, dict) and v.get('value') not in (None, '', []) and not ok(v['value']):
                facts[k] = None
                stats['biblio_dropped'] += 1
        r['facts'] = facts
        (work / f"checked_{r['id']}.json").write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(stats))


def cmd_merge(a):
    work = outside_repo(a.work)
    judges = a.judges.split(',')
    out = []
    for f in sorted(work.glob('checked_*.json')):
        r = json.loads(f.read_text(encoding='utf-8'))
        verdicts = []
        for j in judges:
            jf = work / j / f"judge_{r['id']}.json"
            verdicts.append(json.loads(jf.read_text(encoding='utf-8')) if jf.exists() else None)
        if not all(verdicts):
            continue
        accepted = []
        for t in r['ft_tags']:
            votes = [next((x for x in v['tags'] if x['tag'] == t['tag']), {}).get('verdict') for v in verdicts]
            if all(v == 'accept' for v in votes):
                accepted.append({'tag': t['tag'], 'evidence': t.get('evidence', '')})
        classes = [v.get('doc_class') for v in verdicts]
        new_ok = {n['tag'] for n in verdicts[0].get('new_tags', []) if n.get('verdict') == 'accept'}
        for v in verdicts[1:]:
            new_ok &= {n['tag'] for n in v.get('new_tags', []) if n.get('verdict') == 'accept'}
        v0 = verdicts[0]
        out.append({'id': r['id'], 'ft_tags': accepted,
                    'rejected': [{'tag': t['tag'], 'basis': t.get('basis'), 'reason': t.get('reason')}
                                 for t in v0.get('tags', []) if t.get('verdict') != 'accept'],
                    'doc_class': classes[0] if len(set(classes)) == 1 else None, 'doc_class_votes': classes,
                    'off_topic': any(v.get('off_topic') for v in verdicts),
                    'off_topic_reason': next((v.get('off_topic_reason') for v in verdicts if v.get('off_topic')), None),
                    'catalog_type_ok': all(v.get('catalog_type_ok', True) for v in verdicts),
                    'suggested_type': next((v.get('suggested_type') for v in verdicts if not v.get('catalog_type_ok', True)), None),
                    'text_quality': v0.get('text_quality'),
                    'facts': r.get('facts', {}),
                    'new_tags': [c for c in r.get('new_tag_candidates', []) if c.get('tag') in new_ok]})
    Path(a.out).write_text(''.join(json.dumps(x, ensure_ascii=False) + '\n' for x in out), encoding='utf-8')
    print(f'{len(out)} papers merged -> {a.out}')


# ------------------------------------------------------------------ run management

RESULTS = ROOT / '.dentcast' / 'cabinet-enrichment' / 'results.jsonl'
SITE_FILE = ROOT / 'dentcast_cabinet_enrichment.json'


def cmd_vocab(a):
    """vocabulary.txt + aliases.json for the proposers, from the live catalogue."""
    work = outside_repo(a.work)
    work.mkdir(parents=True, exist_ok=True)
    cat = catalog()
    cnt = Counter(t for p in cat['papers'] for t in p.get('tags', [])
                  if not t.startswith('topic:') and not re.fullmatch(r'(19|20)\d\d', t) and len(t.split('-')) < 6)
    with open(work / 'vocabulary.txt', 'w', encoding='utf-8') as f:
        f.write('# library tag<TAB>papers carrying it (kebab-case; choose ONLY from this list)\n')
        for t, c in sorted(cnt.items(), key=lambda x: (-x[1], x[0])):
            f.write(f'{t}\t{c}\n')
    (work / 'aliases.json').write_text(json.dumps(cat.get('tag_aliases', {}), ensure_ascii=False), encoding='utf-8')
    print(f'{len(cnt)} tags')


def done_ids():
    if not RESULTS.exists():
        return set()
    return {json.loads(l)['id'] for l in RESULTS.read_text(encoding='utf-8').splitlines() if l.strip()}


def cmd_todo(a):
    """Catalogue ids not yet in results.jsonl, in catalogue order; --limit for the next slice."""
    done = done_ids()
    ids = [p['id'] for p in catalog()['papers'] if p['id'] not in done]
    if a.limit:
        ids = ids[:a.limit]
    print(','.join(ids))
    print(f'{len(ids)} ids ({len(done)} already done)', file=sys.stderr)


def _val(v):
    return v.get('value') if isinstance(v, dict) else v


def cmd_publish(a):
    """Merged results (merge --out) -> repo results.jsonl (no quotes, no text) -> site file."""
    work = outside_repo(a.work)
    cat = catalog()
    P = {p['id']: p for p in cat['papers']}
    doi2id = {p['doi'].lower(): i for i, p in P.items() if p.get('doi')}
    rows = {json.loads(l)['id']: json.loads(l) for l in RESULTS.read_text(encoding='utf-8').splitlines() if l.strip()} \
        if RESULTS.exists() else {}
    for line in Path(a.merged).read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        pf = work / f"paper_{r['id']}.json"
        refs = json.loads(pf.read_text(encoding='utf-8')).get('ref_dois', []) if pf.exists() else []
        rows[r['id']] = row_from_merged(r, refs, doi2id, r['id'])
    RESULTS.write_text(results_text(rows), encoding='utf-8')
    build_site_file(rows, P)
    print(f'{len(rows)} papers in results.jsonl; site file rebuilt')


SITE_FACTS = ('population', 'intervention', 'comparison', 'outcomes', 'main_result', 'sample_size', 'follow_up',
              'materials_brands', 'funding_coi', 'limitations')


def results_text(rows):
    return ''.join(json.dumps(rows[k], ensure_ascii=False) + '\n' for k in sorted(rows))


def parse_results(text):
    return {json.loads(l)['id']: json.loads(l) for l in (text or '').splitlines() if l.strip()}


def build_site_file(rows, P):
    SITE_FILE.write_text(site_text(rows, P), encoding='utf-8')


def site_text(rows, P):
    """What the cabinet page reads: tags (accepted + accepted new), facts, and cited
    papers still in the catalogue. Robots-blocked like the catalogue itself."""
    papers = {}
    for i, r in rows.items():
        if i not in P:
            continue
        f = {k: r['facts'][k] for k in SITE_FACTS if r['facts'].get(k)}
        e = {'t': r['ft_tags'] + r.get('new_tags', []), 'f': f, 'c': [c for c in r['cites_in_cabinet'] if c in P]}
        papers[i] = {k: v for k, v in e.items() if v}
    return json.dumps({'version': 1, 'papers': papers}, ensure_ascii=False, separators=(',', ':'))


def row_from_merged(r, refs, doi2id, self_id):
    """One results.jsonl row from a merged line (no quotes, no text)."""
    facts = {k: ([_val(m) for m in (v or [])] if k == 'materials_brands' else _val(v))
             for k, v in (r.get('facts') or {}).items()}
    return {
        'id': self_id, 'ft_tags': [t['tag'] for t in r['ft_tags']], 'new_tags': [t['tag'] for t in r.get('new_tags', [])],
        'doc_class': r.get('doc_class'), 'off_topic': r.get('off_topic', False), 'off_topic_reason': r.get('off_topic_reason'),
        'catalog_type_ok': r.get('catalog_type_ok', True), 'suggested_type': r.get('suggested_type'),
        'text_quality': r.get('text_quality'),
        'facts': {k: v for k, v in facts.items() if v not in (None, '', [])},
        'cites_in_cabinet': sorted({doi2id[d] for d in refs if d in doi2id and doi2id[d] != self_id}),
    }


def cmd_freeze(a):
    """A paper that is not catalogued yet: its row keyed by DOI, with the DOIs it cites
    that the catalogue holds. The catalogue id is given on the day the entry is written
    (tools/queue_apply.py, install_frozen)."""
    work = outside_repo(a.work)
    lines = [json.loads(l) for l in Path(a.merged).read_text(encoding='utf-8').splitlines() if l.strip()]
    if len(lines) != 1:
        sys.exit(f'freeze expects exactly one merged paper, got {len(lines)}')
    r = lines[0]
    refs = json.loads((work / f"paper_{r['id']}.json").read_text(encoding='utf-8')).get('ref_dois', [])
    known = {(p.get('doi') or '').lower() for p in catalog()['papers'] if p.get('doi')}
    row = row_from_merged(r, [], {}, None)
    row.pop('id')
    row.pop('cites_in_cabinet')
    out = {'doi': (a.doi or '').strip().lower(), **row, 'cites_dois': sorted(d for d in refs if d in known)}
    if not out['doi']:
        if not a.drive_id:
            sys.exit('a paper with no DOI is frozen under its --drive-id')
        out['drive_id'] = a.drive_id
    Path(a.out).write_text(json.dumps([out], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(json.dumps({'frozen': out['doi'] or out.get('drive_id'), 'ft_tags': out['ft_tags'], 'new_tags': out['new_tags'],
                      'doc_class': out['doc_class'], 'off_topic': out['off_topic'],
                      'catalog_type_ok': out['catalog_type_ok'], 'suggested_type': out['suggested_type'],
                      'key_finding': out['facts'].get('key_finding'),
                      'clinical_bottom_line': out['facts'].get('clinical_bottom_line')}, ensure_ascii=False))


def install_frozen(results, frozen, new_ids, P):
    """results.jsonl and site-file text with the frozen rows of newly catalogued papers.
    new_ids: {key: catalogue id}, key = the DOI, or the Drive id of a paper with no DOI.
    A new paper with no frozen row raises KeyError(key)."""
    rows = parse_results(results)
    by_doi = {r['doi'] or r.get('drive_id'): r for r in frozen}
    doi2id = {(p.get('doi') or '').lower(): i for i, p in P.items() if p.get('doi')}
    for doi, pid in new_ids.items():
        if doi not in by_doi:
            raise KeyError(doi)
        r = dict(by_doi[doi])
        cites = r.pop('cites_dois', [])
        r.pop('doi')
        r.pop('drive_id', None)
        rows[pid] = {'id': pid, **r, 'cites_in_cabinet': sorted({doi2id[d] for d in cites
                                                                 if d in doi2id and doi2id[d] != pid})}
    return results_text(rows), site_text(rows, P)


def missing_ids():
    done = done_ids()
    return [p['id'] for p in catalog()['papers'] if p['id'] not in done]


def cmd_coverage(a):
    miss = missing_ids()
    print(json.dumps({'catalogue': len(catalog()['papers']), 'missing': miss}))
    if a.check and miss:
        sys.exit(1)


def cmd_site(a):
    rows = {json.loads(l)['id']: json.loads(l) for l in RESULTS.read_text(encoding='utf-8').splitlines() if l.strip()}
    build_site_file(rows, {p['id']: p for p in catalog()['papers']})
    print('site file rebuilt')


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('prepare')
    p.add_argument('--ids')
    p.add_argument('--id', help='a working id for a paper not yet in the catalogue')
    p.add_argument('--pdf', help='the new paper\'s PDF (copied into --work, never into the repository)')
    p.add_argument('--entry', help='the new paper\'s catalogue entry (JSON object, or a list: pick with --doi)')
    p.add_argument('--doi', help='with a list --entry: the new paper to prepare')
    p.add_argument('--drive-id', help='with a list --entry: a paper with no DOI')
    p.add_argument('--work', required=True)
    p.add_argument('--keep-pdf', action='store_true')
    c = sub.add_parser('check')
    c.add_argument('--work', required=True)
    c.add_argument('--ids', help='comma-separated catalogue ids (default: every proposal in --work)')
    m = sub.add_parser('merge')
    m.add_argument('--work', required=True)
    m.add_argument('--judges', required=True)
    m.add_argument('--out', required=True)
    v = sub.add_parser('vocab', help='vocabulary.txt + aliases.json into --work')
    v.add_argument('--work', required=True)
    t = sub.add_parser('todo', help='ids not yet in results.jsonl')
    t.add_argument('--limit', type=int)
    pb = sub.add_parser('publish', help='merged results -> results.jsonl + site file')
    pb.add_argument('--work', required=True)
    pb.add_argument('--merged', required=True)
    sub.add_parser('site', help='rebuild dentcast_cabinet_enrichment.json from results.jsonl')
    fz = sub.add_parser('freeze', help='a not-yet-catalogued paper: its row keyed by DOI')
    fz.add_argument('--work', required=True)
    fz.add_argument('--merged', required=True)
    fz.add_argument('--doi', help='the DOI (empty for a paper that has none: give --drive-id)')
    fz.add_argument('--drive-id', help='the key of a paper with no DOI')
    fz.add_argument('--out', required=True)
    cv = sub.add_parser('coverage', help='catalogue ids with no row in results.jsonl')
    cv.add_argument('--check', action='store_true', help='exit 1 when any catalogue paper is not enriched')
    a = ap.parse_args(argv)
    {'prepare': cmd_prepare, 'check': cmd_check, 'merge': cmd_merge, 'vocab': cmd_vocab, 'todo': cmd_todo,
     'publish': cmd_publish, 'site': cmd_site, 'freeze': cmd_freeze, 'coverage': cmd_coverage}[a.cmd](a)


if __name__ == '__main__':
    main()
