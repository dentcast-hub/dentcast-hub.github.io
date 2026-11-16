#!/usr/bin/env python3
"""No rule changes without the founder knowing.

Every non-merge commit in BASE..HEAD that touches a rule file (tools/rule_files.py)
must carry a line `Founder-request: <the founder's own words asking for this change>`
in its message. A commit without one fails, naming the commit and the files.

    python3 tools/check_rule_changes.py --base <ref> [--head HEAD]
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rule_files import ROOT, is_rule_file  # noqa: E402

TRAILER = 'Founder-request:'


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def has_request(message):
    return any(l.strip().startswith(TRAILER) and l.strip()[len(TRAILER):].strip()
               for l in message.splitlines())


def violations(base, head='HEAD'):
    out = []
    for c in git('rev-list', '--no-merges', f'{base}..{head}').split():
        files = [f for f in git('diff-tree', '--no-commit-id', '--name-only', '-r', c).split('\n') if f]
        rules = [f for f in files if is_rule_file(f)]
        if rules and not has_request(git('log', '-1', '--format=%B', c)):
            out.append({'commit': c[:12], 'subject': git('log', '-1', '--format=%s', c).strip(), 'rule_files': rules})
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--base', required=True)
    ap.add_argument('--head', default='HEAD')
    a = ap.parse_args(argv)
    bad = violations(a.base, a.head)
    print(json.dumps({'status': 'fail' if bad else 'ok', 'violations': bad}, ensure_ascii=False, indent=1))
    if bad:
        print(f'rule files changed without a «{TRAILER}» line quoting the founder (agent-parity.md §7)',
              file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
