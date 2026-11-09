#!/usr/bin/env python3
"""Run one shard of a unittest discovery, for parallel CI jobs.

    python3 tools/run_test_shard.py --pattern 'test_dentcast_publish*.py' \
        --shards 4 --index 0

Every test id found by `unittest discover -s tests -p PATTERN` goes to exactly
one shard (round-robin over the discovery order), so the shards together run
the same tests as one plain `discover` call: none is skipped and none runs
twice. Round-robin over individual tests (not files) spreads a slow file across
all shards. A file that fails to import shows up as a failing test in a shard,
exactly as it does in a plain `discover` run.

`--list` prints the shard's test ids instead of running them; `--check` proves
the shards partition the full discovery (used by the workflow's own guard).
"""
import argparse
import sys
import unittest


def all_tests(start, pattern):
    suite = unittest.defaultTestLoader.discover(start, pattern=pattern)
    out = []

    def walk(node):
        for t in node:
            if isinstance(t, unittest.TestSuite):
                walk(t)
            else:
                out.append(t)

    walk(suite)
    return out


def shard_of(tests, shards, index):
    return [t for i, t in enumerate(tests) if i % shards == index]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', default='tests')
    ap.add_argument('--pattern', required=True)
    ap.add_argument('--shards', type=int, required=True)
    ap.add_argument('--index', type=int)
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    if a.shards < 1:
        ap.error('--shards must be >= 1')

    tests = all_tests(a.start, a.pattern)
    if not tests:
        print(f'no tests found for {a.pattern!r}', file=sys.stderr)
        return 1

    if a.check:
        ids = [t.id() for t in tests]
        seen = []
        for k in range(a.shards):
            seen += [t.id() for t in shard_of(tests, a.shards, k)]
        ok = sorted(seen) == sorted(ids) and len(seen) == len(set(seen)) == len(ids)
        print(f'{len(ids)} tests, {a.shards} shards, partition {"OK" if ok else "BROKEN"}')
        return 0 if ok else 1

    if a.index is None or not 0 <= a.index < a.shards:
        ap.error('--index must be in [0, --shards)')
    mine = shard_of(tests, a.shards, a.index)
    if a.list:
        print('\n'.join(t.id() for t in mine))
        return 0
    print(f'shard {a.index + 1}/{a.shards}: {len(mine)} of {len(tests)} tests', flush=True)
    result = unittest.TextTestRunner(verbosity=2).run(unittest.TestSuite(mine))
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(main())
