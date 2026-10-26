#!/usr/bin/env python3
"""Read exact active global-rule sections; unknown edit scopes load all rules."""
import argparse
import fnmatch
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = '.dentcast/workflows/global/LOAD-MAP.json'


def sections(root=ROOT):
    manifest = json.loads((root / MANIFEST).read_text())
    result = []
    for item in manifest['sources']:
        raw = (root / item['path']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != item['sha256']:
            raise ValueError('GLOBAL_RULE_MAP_STALE: read all three canonical global files and update the map')
        lines = raw.decode('utf-8').splitlines(keepends=True)
        cursor = 1
        for block in item['sections']:
            start, end = block['lines']
            if start != cursor or end < start or end > len(lines):
                raise ValueError('GLOBAL_RULE_COVERAGE_INVALID')
            cursor = end + 1
            result.append({**block, 'source': item['path'], 'text': ''.join(lines[start-1:end])})
        if cursor != len(lines) + 1:
            raise ValueError('GLOBAL_RULE_COVERAGE_INCOMPLETE')
    if len({b['id'] for b in result}) != len(result):
        raise ValueError('DUPLICATE_GLOBAL_RULE_ID')
    return manifest, result


def select(manifest, blocks, paths=(), all_rules=False):
    selected = {b['id'] for b in blocks if b['core']}
    if all_rules:
        return blocks
    for path in paths:
        path = path.removeprefix('./')
        if path.startswith('/') or '..' in path.split('/') or '\\' in path:
            raise ValueError('REPOSITORY_RELATIVE_PATH_REQUIRED')
        matches = [r for r in manifest['routes'] if fnmatch.fnmatchcase(path, r['pattern'])]
        if not matches:
            return blocks  # No guessing that an unfamiliar subsystem has no rules.
        for route in matches:
            selected.update(route['sections'])
    return [b for b in blocks if b['id'] in selected]


PAGE_CHARS = 20000


def emitted_lines(chosen):
    """The exact --read output as whole lines (headers included)."""
    out = []
    for block in chosen:
        out.append('\n')
        out.append('<!-- full active section: ' + block['id'] + ' | ' + block['source'] + ' -->\n')
        out.extend(block['text'].splitlines(keepends=True))
    return out


def pages(lines, limit=PAGE_CHARS):
    """Split at line boundaries only; a page never cuts a line."""
    result, current, size = [], [], 0
    for line in lines:
        if current and size + len(line) > limit:
            result.append(current)
            current, size = [], 0
        current.append(line)
        size += len(line)
    if current:
        result.append(current)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--path', action='append', default=[], help='Each planned edit path; repeat as scope expands')
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--loaded', action='append', default=[], help='Section already read completely in this same session and source revision')
    parser.add_argument('--read', action='store_true', help='Emit complete exact sections instead of the small load plan')
    parser.add_argument('--section', action='append', default=[], help='Restrict to this section id (repeatable); see --list')
    parser.add_argument('--list', action='store_true', help='List the chosen sections with sizes and the --read page count')
    parser.add_argument('--page', type=int, help='With --read: emit only this 1-based page of the output (whole lines)')
    parser.add_argument('--page-chars', type=int, default=PAGE_CHARS, help='Page size in characters for --page/--list')
    args = parser.parse_args()
    try:
        manifest, blocks = sections()
        chosen = select(manifest, blocks, args.path, args.all)
        if not set(args.loaded) <= {b['id'] for b in blocks}:
            raise ValueError('UNKNOWN_LOADED_SECTION')
        chosen = [b for b in chosen if b['id'] not in args.loaded]
        if not set(args.section) <= {b['id'] for b in blocks}:
            raise ValueError('UNKNOWN_SECTION')
        if args.section:
            chosen = [b for b in chosen if b['id'] in args.section]
        if args.page_chars < 1 or (args.page is not None and args.page < 1):
            raise ValueError('INVALID_PAGE')
    except (ValueError, KeyError, OSError) as exc:
        parser.exit(2, str(exc) + '\n')
    if args.list:
        total = len(pages(emitted_lines(chosen), args.page_chars))
        for block in chosen:
            start, end = block['lines']
            print(f"{block['id']}\t{block['source']}:{start}-{end}\t{len(block['text'])} chars")
        print(f'--read pages at {args.page_chars} chars: {total}')
    elif args.read and args.page is not None:
        split = pages(emitted_lines(chosen), args.page_chars)
        if args.page > len(split):
            parser.exit(2, 'PAGE_OUT_OF_RANGE: ' + str(len(split)) + ' pages\n')
        print(f'<!-- global rules page {args.page}/{len(split)}; whole lines only -->')
        print(''.join(split[args.page - 1]), end='')
        if args.page < len(split):
            print(f'\n<!-- continue: same arguments with --page {args.page + 1} -->')
        else:
            print('\n<!-- last page: the selection is now read completely -->')
    elif args.read:
        print(''.join(emitted_lines(chosen)), end='')
    else:
        print(json.dumps({'sections': [{k:v for k,v in b.items() if k != 'text'} for b in chosen],
                          'selected_bytes': sum(len(b['text'].encode()) for b in chosen),
                          'all_bytes': sum(len(b['text'].encode()) for b in blocks)}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
