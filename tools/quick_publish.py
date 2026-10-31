#!/usr/bin/env python3
"""Git side of the emergency minimal publish («انتشار حداقلی» in /admin).

The API publishes straight to the Arvan bucket and records every page in
quick-publish/ledger.json there. This tool brings those pages into git and
keeps the deploys from erasing them first. Owner doc: .dentcast/quick-publish.md

  python3 tools/quick_publish.py status
  python3 tools/quick_publish.py import [--base-url https://dentcast.ir | --from-dir DIR] [--dry-run]
  python3 tools/quick_publish.py guard --bucket-ledger FILE
  python3 tools/quick_publish.py complete <id>

import   fetches the bucket ledger, and for every item git does not have (or has
         an older edit of) writes the page, its images and its brain entry —
         appended at the tail, never re-serialising the rest of the file — and
         marks the item `imported` in the repo ledger. It commits nothing.
guard    exits 1 when the bucket ledger holds an item, or a newer edit of one,
         that the repo ledger lacks. deploy-frontend.sh and deploy-arvan.yml run
         it before their `aws s3 sync --delete`.
complete marks an imported item `completed` once the full workflow has closed
         it (tools/verify_publish.py green).
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = 'quick-publish/ledger.json'
BRAIN = 'dentcast-brain.json'


def read_ledger(path: Path) -> dict:
    if not path.exists():
        return {'version': 1, 'items': []}
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, dict) or not isinstance(data.get('items'), list):
        raise SystemExit(f'✗ {path}: not a quick-publish ledger')
    return data


def write_ledger(path: Path, ledger: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def missing_from(bucket: dict, tree: dict) -> list:
    """Bucket items git lacks, or holds an older edit of."""
    have = {i['id']: i.get('updated_at') for i in tree['items']}
    return [i for i in bucket['items'] if i['id'] not in have or have[i['id']] != i.get('updated_at')]


def serialise_entry(entry: dict) -> str:
    return '\n'.join('  ' + line for line in json.dumps(entry, ensure_ascii=False, indent=2).split('\n'))


def append_entry(text: str, entry: dict) -> str:
    head = text[:text.rindex(']')].rstrip()
    out = head + ('\n' if head.endswith('[') else ',\n') + serialise_entry(entry) + '\n]\n'
    json.loads(out)
    return out


def replace_entry(text: str, before: dict, after: dict):
    old = serialise_entry(before)
    if text.count(old) != 1:
        return None
    out = text.replace(old, serialise_entry(after))
    json.loads(out)
    return out


class Source:
    def __init__(self, base_url=None, from_dir=None):
        self.base_url = base_url.rstrip('/') if base_url else None
        self.from_dir = Path(from_dir) if from_dir else None

    def get(self, rel: str) -> bytes:
        if self.from_dir:
            return (self.from_dir / rel).read_bytes()
        url = f'{self.base_url}/{rel}?_dc={int(time.time() * 1000)}'
        req = urllib.request.Request(url, headers={'cache-control': 'no-cache', 'user-agent': 'dentcast-quick-publish-import'})
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read()


def cmd_import(args) -> int:
    src = Source(args.base_url, args.from_dir)
    bucket = json.loads(src.get(LEDGER).decode('utf-8'))
    tree_path = ROOT / LEDGER
    tree = read_ledger(tree_path)
    todo = missing_from(bucket, tree)
    if not todo:
        print('✓ nothing to import — git already has every minimal publication')
        return 0
    brain_path = ROOT / BRAIN
    brain_text = brain_path.read_text(encoding='utf-8')
    previous = {i['id']: i for i in tree['items']}
    files = {}
    for item in todo:
        files[item['path'].lstrip('/')] = src.get(item['path'].lstrip('/'))
        for m in item.get('media', []):
            files[m] = src.get(m)
        brain = json.loads(brain_text)
        current = [e for e in brain if e.get('id') == item['id'] and e.get('type') == item['type']]
        if not current:
            brain_text = append_entry(brain_text, item['brain_entry'])
        elif current[0] != item['brain_entry']:
            old = previous.get(item['id'], {}).get('brain_entry')
            swapped = replace_entry(brain_text, old, item['brain_entry']) if old else None
            if swapped is None:
                raise SystemExit(f"✗ {item['id']}: its brain entry in git differs and is not the one this tool wrote — reconcile by hand")
            brain_text = swapped
        record = dict(item, state='imported', imported_at=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'))
        tree['items'] = [i for i in tree['items'] if i['id'] != item['id']] + [record]
        print(f"→ {item['id']}  {item['path']}  «{item['title']}»" + (f"  +{len(item.get('media', []))} image(s)" if item.get('media') else ''))
    if args.dry_run:
        print('(dry run — nothing written)')
        return 0
    for rel, data in files.items():
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
    brain_path.write_text(brain_text, encoding='utf-8')
    # Bucket order is publication order; keep it.
    order = {i['id']: n for n, i in enumerate(bucket['items'])}
    tree['items'].sort(key=lambda i: order.get(i['id'], -1))
    write_ledger(tree_path, tree)
    print(f'\n✓ imported {len(todo)} item(s). Next: commit and push, then run the full workflow on each one '
          '(.dentcast/quick-publish.md, «بعد از وصل شدن»).')
    return 0


def cmd_guard(args) -> int:
    path = Path(args.bucket_ledger)
    if not path.exists() or path.stat().st_size == 0:
        print('✓ quick-publish guard: no ledger on the bucket')
        return 0
    bucket = json.loads(path.read_text(encoding='utf-8'))
    tree = read_ledger(Path(args.tree_ledger) if args.tree_ledger else ROOT / LEDGER)
    todo = missing_from(bucket, tree)
    if not todo:
        print('✓ quick-publish guard: git has every page the panel published')
        return 0
    print('✗ the bucket holds pages published from /admin («انتشار حداقلی») that git does not have.\n'
          '  Syncing now would delete them from dentcast.ir. Import them first:\n\n'
          '    python3 tools/quick_publish.py import\n', file=sys.stderr)
    for i in todo:
        print(f"    {i['id']}  {i['path']}  «{i['title']}»", file=sys.stderr)
    return 1


def cmd_complete(args) -> int:
    path = ROOT / LEDGER
    tree = read_ledger(path)
    for i in tree['items']:
        if i['id'] == args.id:
            if i.get('state') != 'imported':
                raise SystemExit(f"✗ {args.id} is «{i.get('state')}», not «imported»")
            i['state'] = 'completed'
            i['completed_at'] = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
            write_ledger(path, tree)
            print(f'✓ {args.id} completed')
            return 0
    raise SystemExit(f'✗ {args.id} is not in {LEDGER}')


def cmd_status(_args) -> int:
    items = read_ledger(ROOT / LEDGER)['items']
    if not items:
        print('no minimal publications in git')
    for i in items:
        print(f"{i.get('state', '?'):9}  {i['id']:14}  {i['path']}  «{i['title']}»")
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    i = sub.add_parser('import')
    g = i.add_mutually_exclusive_group()
    g.add_argument('--base-url', default=os.environ.get('QP_BASE_URL', 'https://dentcast.ir'))
    g.add_argument('--from-dir')
    i.add_argument('--dry-run', action='store_true')
    gd = sub.add_parser('guard')
    gd.add_argument('--bucket-ledger', required=True)
    gd.add_argument('--tree-ledger')
    c = sub.add_parser('complete')
    c.add_argument('id')
    sub.add_parser('status')
    args = p.parse_args(argv)
    if args.cmd == 'import' and args.from_dir:
        args.base_url = None
    return {'import': cmd_import, 'guard': cmd_guard, 'complete': cmd_complete, 'status': cmd_status}[args.cmd](args)


if __name__ == '__main__':
    sys.exit(main())
