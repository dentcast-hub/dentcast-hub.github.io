#!/usr/bin/env python3
"""Git side of the emergency minimal publish («انتشار حداقلی» in /admin).

The API publishes straight to the Arvan bucket and records every page in
quick-publish/ledger.json there. This tool brings those pages into git and
keeps the deploys from erasing them first. Owner doc: .dentcast/quick-publish.md

  python3 tools/quick_publish.py status
  python3 tools/quick_publish.py import [--base-url https://dentcast.ir | --from-dir DIR] [--dry-run]
  python3 tools/quick_publish.py guard --bucket-ledger FILE
  python3 tools/quick_publish.py requested
  python3 tools/quick_publish.py complete <id>

import   fetches the bucket ledger, and for every item git does not have (or has
         an older edit of) writes the page, its images and its brain entry —
         appended at the tail, never re-serialising the rest of the file — and
         marks the item `imported` in the repo ledger. It commits nothing.
guard    exits 1 when the bucket ledger holds an item, or a newer edit of one,
         that the repo ledger lacks. deploy-frontend.sh and deploy-arvan.yml run
         it before their `aws s3 sync --delete`.
requested lists, in ledger order, the items the founder sent to the full
         workflow from the panel («بفرست تو ورک‌فلو») that are not completed yet.
         Nothing else goes to the workflow: an item without that flag stays a
         minimal publication.
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


def stale_content(bucket_item: dict, tree: dict) -> bool:
    """git lacks this page, or holds an older edit of it."""
    have = {i['id']: i.get('updated_at') for i in tree['items']}
    return have.get(bucket_item['id'], object()) != bucket_item.get('updated_at')


def missing_from(bucket: dict, tree: dict) -> list:
    """Bucket items git lacks, holds an older edit of, or holds without the founder's latest workflow pick."""
    flags = {i['id']: i.get('workflow_requested_at') for i in tree['items']}
    return [i for i in bucket['items']
            if stale_content(i, tree) or flags.get(i['id']) != i.get('workflow_requested_at')]


def brain_eol(text: str) -> str:
    """The brain's own line ending (CRLF in git); never convert it."""
    return '\r\n' if text.endswith('\r\n') else '\n'


def serialise_entry(entry: dict, eol: str = '\n') -> str:
    return eol.join('  ' + line for line in json.dumps(entry, ensure_ascii=False, indent=2).split('\n'))


def append_entry(text: str, entry: dict) -> str:
    eol = brain_eol(text)
    head = text[:text.rindex(']')].rstrip()
    out = head + (eol if head.endswith('[') else ',' + eol) + serialise_entry(entry, eol) + eol + ']' + eol
    json.loads(out)
    return out


def replace_entry(text: str, before: dict, after: dict):
    eol = brain_eol(text)
    old = serialise_entry(before, eol)
    if text.count(old) != 1:
        return None
    out = text.replace(old, serialise_entry(after, eol))
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
    pages = sum(1 for i in todo if stale_content(i, tree))
    brain_path = ROOT / BRAIN
    with open(brain_path, encoding='utf-8', newline='') as f:  # keep CRLF as CRLF
        brain_text = f.read()
    previous = {i['id']: i for i in tree['items']}
    files = {}
    for item in todo:
        if not stale_content(item, tree):
            # Only the founder's workflow pick changed: carry the flag, touch nothing else.
            for i in tree['items']:
                if i['id'] == item['id']:
                    i['workflow_requested_at'] = item.get('workflow_requested_at')
            print(f"→ {item['id']}  workflow pick: {'sent' if item.get('workflow_requested_at') else 'withdrawn'}")
            continue
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
        prior = previous.get(item['id'], {})
        state = prior.get('state') if prior.get('state') == 'completed' else 'imported'
        record = dict(item, state=state, completed_at=prior.get('completed_at'), imported_at=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'))
        tree['items'] = [i for i in tree['items'] if i['id'] != item['id']] + [record]
        print(f"→ {item['id']}  {item['path']}  «{item['title']}»" + (f"  +{len(item.get('media', []))} image(s)" if item.get('media') else ''))
    if args.dry_run:
        print('(dry run — nothing written)')
        return 0
    for rel, data in files.items():
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
    with open(brain_path, 'w', encoding='utf-8', newline='') as f:
        f.write(brain_text)
    # Bucket order is publication order; keep it.
    order = {i['id']: n for n, i in enumerate(bucket['items'])}
    tree['items'].sort(key=lambda i: order.get(i['id'], -1))
    write_ledger(tree_path, tree)
    picks = len(todo) - pages
    print(f'\n✓ {pages} page(s) imported, {picks} workflow pick(s) updated. Next: commit and push. '
          'Only `requested` items go through the full workflow, and only when the founder asks (.dentcast/quick-publish.md).')
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
    pages = [i for i in todo if stale_content(i, tree)]
    picks = [i for i in todo if i not in pages]
    if pages:
        print('✗ the bucket holds pages published from /admin («انتشار حداقلی») that git does not have (or an older edit of).\n'
              '  Syncing now would delete them from dentcast.ir. Import them first:', file=sys.stderr)
        for i in pages:
            print(f"    {i['id']}  {i['path']}  «{i['title']}»", file=sys.stderr)
    if picks:
        print('✗ the founder changed «بفرست تو ورک‌فلو» on the panel and git does not have that pick yet;\n'
              '  syncing now would overwrite it. Import it first (only the ledger line changes):', file=sys.stderr)
        for i in picks:
            print(f"    {i['id']}  {'sent' if i.get('workflow_requested_at') else 'withdrawn'}  «{i['title']}»", file=sys.stderr)
    print('\n    python3 tools/quick_publish.py import\n', file=sys.stderr)
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


def cmd_requested(_args) -> int:
    items = [i for i in read_ledger(ROOT / LEDGER)['items']
             if i.get('workflow_requested_at') and i.get('state') != 'completed']
    if not items:
        print('nothing sent to the workflow from the panel')
    for i in items:
        note = '' if i.get('state') == 'imported' else '  (not in git yet — run import first)'
        print(f"{i['id']:14}  {i['path']}  «{i['title']}»{note}")
    return 0


def cmd_status(_args) -> int:
    items = read_ledger(ROOT / LEDGER)['items']
    if not items:
        print('no minimal publications in git')
    for i in items:
        sent = '  [sent to workflow]' if i.get('workflow_requested_at') and i.get('state') != 'completed' else ''
        print(f"{i.get('state', '?'):9}  {i['id']:14}  {i['path']}  «{i['title']}»{sent}")
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
    sub.add_parser('requested')
    args = p.parse_args(argv)
    if args.cmd == 'import' and args.from_dir:
        args.base_url = None
    return {'import': cmd_import, 'guard': cmd_guard, 'complete': cmd_complete, 'status': cmd_status,
            'requested': cmd_requested}[args.cmd](args)


if __name__ == '__main__':
    sys.exit(main())
