#!/usr/bin/env python3
"""Import founder-approved article exam questions into the live API.

The pathway exam has exactly two question sources, both founder-written:
`pathway_exam_forms.questions` (the whole pathway) and `content_exam_questions`
(one article, drawn by every pathway that carries it — migration 0063). This
tool feeds the SECOND one in bulk, through the same admin door the panel's
«برای یک مقاله» builder uses (`POST /admin/content-questions`), so every row
still goes through `normalizeQuestions` and nothing is written that the panel
could not have written by hand.

Since 1405/08/03 the article pool is DUAL-SOURCE: the same questions can live
in the repo file `plus/exam-questions.json` (workflow step 4.12-ب, read by
plus-api/src/exam-questions.ts) — that is where publish-time questions go,
key included, by the founder's decision. This tool is the other road: for a
reviewed draft the founder wants in the DATABASE rather than in Git (a row to
edit from the panel, or one that should not be public), it posts the approved
rows. Do not run both on the same draft — the pool is the union of the two
sources and a question present in both would be drawn twice as often.

Draft shape (see the review page that accompanies it):

  { "byContent": { "<content_id>": { "questions": [
        { "kind": "mcq", "prompt_fa": "…", "options": ["…", "…", "…", "…"],
          "correct": 2, "status": "draft" | "approved" | "rejected",
          "confidence": "high" | "review", "source_quiz_id": "…" } ] } } }

Which rows are sent:
  --approved-only   rows with status == "approved"            (default)
  --high            also rows with confidence == "high" whose status is still
                    "draft" — the founder's «the high ones go in as they are»
  (status "rejected" is never sent.)

Idempotent: before posting, the article's existing questions are listed and
any row whose prompt_fa already exists for that content_id is skipped, so a
re-run after a partial failure never duplicates. A log of every posted row
(content_id, server id, prompt) is appended to --log.

Usage:
  export DENTCAST_ADMIN_USER=… DENTCAST_ADMIN_PASSWORD=…
  python3 tools/exam_questions_import.py DRAFT.json --dry-run
  python3 tools/exam_questions_import.py DRAFT.json --high
  python3 tools/exam_questions_import.py DRAFT.json --api https://api.dentcast.org

Nothing here reads the repo; it is safe to run from any checkout.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_API = 'https://api.dentcast.ir'


def auth_header() -> str:
    user = os.environ.get('DENTCAST_ADMIN_USER', '')
    pw = os.environ.get('DENTCAST_ADMIN_PASSWORD', '')
    if not user or not pw:
        sys.exit('DENTCAST_ADMIN_USER / DENTCAST_ADMIN_PASSWORD must be set (the /admin Basic-auth pair).')
    return 'Basic ' + base64.b64encode(f'{user}:{pw}'.encode()).decode()


def call(api: str, method: str, path: str, body: dict | None, auth: str) -> dict:
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(api + path, data=data, method=method)
    req.add_header('authorization', auth)
    if data is not None:
        req.add_header('content-type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode())
        except Exception:  # noqa: BLE001
            payload = {'error': f'http_{e.code}'}
        payload['_status'] = e.code
        return payload


def selected(q: dict, include_high: bool) -> bool:
    status = q.get('status', 'draft')
    if status == 'rejected':
        return False
    if status == 'approved':
        return True
    return include_high and status == 'draft' and q.get('confidence') == 'high'


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('draft', help='the reviewed draft JSON (kept outside the repo)')
    ap.add_argument('--api', default=DEFAULT_API, help=f'API base (default {DEFAULT_API})')
    ap.add_argument('--high', action='store_true', help='also send confidence=high rows still marked draft')
    ap.add_argument('--dry-run', action='store_true', help='show what would be sent; write nothing')
    ap.add_argument('--log', default='exam-questions-import.log.jsonl', help='append-only record of posted rows')
    ap.add_argument('--sleep', type=float, default=0.15, help='pause between posts (seconds)')
    args = ap.parse_args()

    draft = json.load(open(args.draft, encoding='utf-8'))
    by = draft.get('byContent') or {}
    auth = '' if args.dry_run else auth_header()

    planned = 0
    posted = 0
    skipped_existing = 0
    failed: list[tuple[str, str, str]] = []
    for content_id, entry in sorted(by.items()):
        rows = [q for q in entry.get('questions', []) if selected(q, args.high)]
        if not rows:
            continue
        planned += len(rows)
        if args.dry_run:
            for q in rows:
                print(f'[dry] {content_id} :: {q["prompt_fa"][:80]}')
            continue
        existing = call(args.api, 'GET', '/admin/content-questions?' + urllib.parse.urlencode({'content': content_id}), None, auth)
        if existing.get('_status'):
            failed.append((content_id, '*', f'list failed: {existing.get("error")} {existing.get("message", "")}'))
            continue
        have = {(r.get('question') or {}).get('prompt_fa', '').strip() for r in existing.get('questions', [])}
        for q in rows:
            prompt = q['prompt_fa'].strip()
            if prompt in have:
                skipped_existing += 1
                continue
            body = {'content_id': content_id, 'question': {
                'kind': 'mcq', 'prompt_fa': prompt, 'options': q['options'], 'correct': q['correct'],
            }}
            res = call(args.api, 'POST', '/admin/content-questions', body, auth)
            if res.get('ok'):
                posted += 1
                have.add(prompt)
                with open(args.log, 'a', encoding='utf-8') as lf:
                    lf.write(json.dumps({'ts': time.strftime('%Y-%m-%dT%H:%M:%S'), 'content_id': content_id, 'id': res.get('id'),
                                         'source_quiz_id': q.get('source_quiz_id'), 'prompt_fa': prompt,
                                         'pathways': [p.get('id') for p in res.get('pathways', [])]}, ensure_ascii=False) + '\n')
                print(f'[ok]  {content_id} → {res.get("id")} (now {res.get("count")} for this article)')
            else:
                failed.append((content_id, prompt[:60], f'{res.get("error")} {res.get("message", "")}'.strip()))
                print(f'[ERR] {content_id} :: {prompt[:60]} :: {res.get("error")} {res.get("message", "")}', file=sys.stderr)
            time.sleep(args.sleep)

    print(f'\nplanned {planned} · posted {posted} · already present {skipped_existing} · failed {len(failed)}')
    for c, p, why in failed:
        print(f'  - {c} :: {p} :: {why}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
