#!/usr/bin/env python3
"""Full-text search for the cabinet: extract each paper's PDF text and upload
it to the Plus API (migration 0075, GET /cabinet/fulltext for premium readers).

The text never enters this repository or any published file: `extract`
writes a JSONL file OUTSIDE the repo, `upload` sends it to the API's admin
routes, and the API answers readers with a short fragment only.

Run where the PDFs are (the founder's computer, «E:\\Paper farzad» and the
cabinet's Drive folders synced locally):

    # 1. text out of every PDF the catalogue knows (resumable; re-run anytime)
    python3 tools/cabinet_fulltext.py extract --pdf-root "E:/Paper farzad" \\
        --pdf-root "G:/My Drive/DentCast cabinet" --out "E:/cabinet-text.jsonl"
    #    papers whose PDF is not found locally can be fetched from their Drive
    #    download link (only works for files shared «anyone with the link»):
    python3 tools/cabinet_fulltext.py extract ... --download-missing --cache "E:/cabinet-pdf-cache"

    # 2. what is covered, what is missing, what needs OCR
    python3 tools/cabinet_fulltext.py status --in "E:/cabinet-text.jsonl"

    # 3. send new/changed texts (admin credentials from the environment)
    set DENTCAST_ADMIN_USER=...  &  set DENTCAST_ADMIN_PASSWORD=...
    python3 tools/cabinet_fulltext.py upload --in "E:/cabinet-text.jsonl" --api https://api.dentcast.ir [--prune]

After a new paper enters the catalogue (publish step 4.10), the same three
commands bring it in: extract skips what it already has, upload sends only
what the API does not hold with the same sha256.

A PDF with no text layer (a scan) yields no text and is listed by `status` as
«needs OCR»; it is not uploaded. Text is read in column order by
tools/pdf_source_text.py (pdfplumber when installed, else poppler's pdftotext).
"""
import argparse
import base64
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / 'dentcast_cabinet_full_catalog.json'
sys.path.insert(0, str(ROOT / 'tools'))

BATCH_BYTES = 8 * 1024 * 1024   # the API accepts 30 MB; stay well under it
BATCH_PAPERS = 200
USER_AGENT = 'dentcast-cabinet-fulltext/1.0'


def load_catalog():
    with open(CATALOG, encoding='utf-8') as f:
        return json.load(f)['papers']


def outside_repo(path):
    p = Path(path).resolve()
    if p == ROOT or ROOT in p.parents:
        sys.exit(f'refusing to write {p}: paper text never goes inside the repository')
    return p


def read_jsonl(path):
    out = {}
    if path and Path(path).exists():
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    rec = json.loads(line)
                    out[rec['id']] = rec
    return out


def base_name(p):
    return p.replace('\\', '/').rsplit('/', 1)[-1].strip().lower() if p else ''


def candidate_names(paper):
    names = [base_name(paper.get('local_path')), base_name(paper.get('file_name'))]
    for d in paper.get('duplicate_paths') or []:
        names.append(base_name(d))
    return [n for n in dict.fromkeys(names) if n.endswith('.pdf')]


def index_pdfs(roots):
    idx = {}
    for r in roots:
        for dirpath, _dirs, files in os.walk(r):
            for fn in files:
                if fn.lower().endswith('.pdf'):
                    idx.setdefault(fn.lower(), os.path.join(dirpath, fn))
    return idx


def extract_text(pdf_path):
    import pdf_source_text as pst  # noqa: PLC0415  (repo tool, imported lazily)
    pages, _backend = pst.read_words(Path(pdf_path))  # (pages, backend used)
    return pst.source_text(pages), len(pages)


def download(url, dest):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=120) as r:
        ctype = r.headers.get('Content-Type', '')
        data = r.read()
    # Drive answers a large or private file with an HTML page, not the PDF
    if 'html' in ctype or not data.startswith(b'%PDF'):
        return False
    dest.write_bytes(data)
    return True


def cmd_extract(a):
    out = outside_repo(a.out)
    done = read_jsonl(out)
    papers = load_catalog()
    only = set(a.only.split(',')) if a.only else None
    idx = index_pdfs(a.pdf_root or [])
    cache = outside_repo(a.cache) if a.cache else None
    if cache:
        cache.mkdir(parents=True, exist_ok=True)
        idx.update({fn.lower(): str(cache / fn) for fn in os.listdir(cache) if fn.lower().endswith('.pdf')})
    counts = {'extracted': 0, 'kept': 0, 'no_pdf': 0, 'no_text': 0, 'failed': 0}
    with open(out, 'a', encoding='utf-8') as f:
        for p in papers:
            pid = p['id']
            if only and pid not in only:
                continue
            if pid in done and not a.redo:
                counts['kept'] += 1
                continue
            path = next((idx[n] for n in candidate_names(p) if n in idx), None)
            if not path and a.download_missing and cache and p.get('drive_download'):
                dest = cache / f'{pid}.pdf'
                try:
                    if download(p['drive_download'], dest):
                        path = str(dest)
                except (urllib.error.URLError, TimeoutError, OSError) as e:
                    print(f'  {pid}: download failed ({e})', file=sys.stderr)
            if not path:
                counts['no_pdf'] += 1
                rec = {'id': pid, 'status': 'no_pdf'}
            else:
                try:
                    text, n_pages = extract_text(path)
                except Exception as e:  # a broken PDF must not stop the run
                    counts['failed'] += 1
                    print(f'  {pid}: extraction failed ({e})', file=sys.stderr)
                    rec = {'id': pid, 'status': 'failed', 'error': str(e)[:200]}
                else:
                    if len(text.strip()) < 200:
                        counts['no_text'] += 1
                        rec = {'id': pid, 'status': 'no_text', 'pages': n_pages}
                    else:
                        counts['extracted'] += 1
                        rec = {'id': pid, 'status': 'ok', 'pages': n_pages, 'text': text,
                               'sha256': hashlib.sha256(text.encode('utf-8')).hexdigest()}
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
            f.flush()
            if sum(counts.values()) % 50 == 0:
                print('  …', counts, file=sys.stderr)
    print(json.dumps(counts))


def latest(path):
    # a later line for the same id wins (a --redo appends)
    return read_jsonl(path)


def cmd_status(a):
    recs = latest(a.__dict__['in'])
    papers = load_catalog()
    by = {'ok': [], 'no_pdf': [], 'no_text': [], 'failed': [], 'not_tried': []}
    for p in papers:
        r = recs.get(p['id'])
        by[r['status'] if r else 'not_tried'].append(p['id'])
    print(json.dumps({k: len(v) for k, v in by.items()} | {'catalog': len(papers)}, ensure_ascii=False))
    for k, label in (('no_text', 'needs OCR (no text layer)'), ('no_pdf', 'PDF not found'), ('failed', 'extraction failed')):
        if by[k]:
            print(f'{label}: ' + ', '.join(by[k][:60]) + (' …' if len(by[k]) > 60 else ''))


def api_call(base, method, path, body=None):
    user, pw = os.environ.get('DENTCAST_ADMIN_USER'), os.environ.get('DENTCAST_ADMIN_PASSWORD')
    if not user or not pw:
        sys.exit('set DENTCAST_ADMIN_USER and DENTCAST_ADMIN_PASSWORD (the /admin credentials)')
    auth = 'Basic ' + base64.b64encode(f'{user}:{pw}'.encode()).decode()
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    for attempt in range(4):
        req = urllib.request.Request(base.rstrip('/') + path, data=data, method=method, headers={
            'Authorization': auth, 'Content-Type': 'application/json', 'User-Agent': USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code < 500:
                sys.exit(f'{method} {path}: HTTP {e.code} {e.read().decode("utf-8", "replace")[:300]}')
            err = e
        except (urllib.error.URLError, TimeoutError) as e:
            err = e
        time.sleep(2 ** (attempt + 1))
    sys.exit(f'{method} {path}: gave up ({err})')


def cmd_upload(a):
    recs = [r for r in latest(a.__dict__['in']).values() if r.get('status') == 'ok']
    catalog_ids = {p['id'] for p in load_catalog()}
    have = {p['id']: p['sha256'] for p in api_call(a.api, 'GET', '/admin/cabinet-fulltext')['papers']}
    todo = [r for r in recs if r['id'] in catalog_ids and have.get(r['id']) != r['sha256']]
    print(f'{len(recs)} texts on disk, {len(have)} on the API, {len(todo)} to send')
    batch, size, written = [], 0, 0

    def flush():
        nonlocal batch, size, written
        if batch:
            written += api_call(a.api, 'POST', '/admin/cabinet-fulltext', {'papers': batch})['written']
            print(f'  sent {len(batch)} (written so far: {written})')
        batch, size = [], 0

    for r in todo:
        item = {'id': r['id'], 'text': r['text'], 'pages': r.get('pages'), 'sha256': r['sha256']}
        n = len(r['text'].encode('utf-8')) + 200
        if batch and (size + n > BATCH_BYTES or len(batch) >= BATCH_PAPERS):
            flush()
        batch.append(item)
        size += n
    flush()
    if a.prune:
        gone = sorted(set(have) - catalog_ids)
        if gone:
            print('removed from the catalogue, deleting:', api_call(a.api, 'POST', '/admin/cabinet-fulltext/delete', {'ids': gone}))
    print(json.dumps({'sent': len(todo), 'written': written}))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    e = sub.add_parser('extract', help='PDF text → JSONL outside the repo (resumable)')
    e.add_argument('--pdf-root', action='append', help='folder searched recursively for the catalogue\'s PDFs (repeatable)')
    e.add_argument('--out', required=True, help='JSONL file, outside the repository')
    e.add_argument('--only', help='comma-separated catalogue ids')
    e.add_argument('--redo', action='store_true', help='extract again even if the id is already in --out')
    e.add_argument('--download-missing', action='store_true', help='fetch a PDF not found locally from its Drive link')
    e.add_argument('--cache', help='folder for downloaded PDFs (outside the repository)')
    s = sub.add_parser('status', help='coverage of a JSONL against the catalogue')
    s.add_argument('--in', required=True)
    u = sub.add_parser('upload', help='send new/changed texts to the API')
    u.add_argument('--in', required=True)
    u.add_argument('--api', required=True, help='e.g. https://api.dentcast.ir')
    u.add_argument('--prune', action='store_true', help='delete API rows of papers no longer in the catalogue')
    a = ap.parse_args(argv)
    if a.cmd == 'extract' and a.download_missing and not a.cache:
        ap.error('--download-missing needs --cache')
    if a.cmd == 'extract' and not (a.pdf_root or a.cache):
        ap.error('give at least one --pdf-root (or a --cache of downloaded PDFs)')
    {'extract': cmd_extract, 'status': cmd_status, 'upload': cmd_upload}[a.cmd](a)


if __name__ == '__main__':
    main()
