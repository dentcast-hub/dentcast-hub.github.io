#!/usr/bin/env python3
"""Shape check for plus/exam-questions.json — the repo source of article exam
questions (workflow step 4.12-ب; plus-api/src/exam-questions.ts reads it).

Mirrors what the API's loader accepts, so a row this tool passes is a row the
exam will draw, and a row it fails is one the API would drop with a warning:

  * top level {version, byContent: {content_id: {questions: [...]}}}
  * every content_id resolves to a page on disk (<content_id>.html)
  * each question: id matching ^r-[a-z0-9][a-z0-9-]{3,40}$ and unique across
    the whole file; kind "mcq" with 2..6 non-empty, distinct options and a
    0-based `correct` inside them (or kind "free" with 1..6 key points);
    non-empty prompt_fa; status absent or one of live|approved|review|rejected
    (review rows must carry review_note)
  * editorial rules for MCQs, as warnings or errors (--strict makes them
    errors): exactly four options; no «همهٔ موارد»/«هیچ‌کدام»-type option;
    no article deixis in the stem; longest option ≤ 1.25× the shortest for
    live publish rows (1.6 for review rows and for the `source: quiz` backfill);
    no Arabic ي/ك; no duplicate prompts

Usage:
  python3 tools/validate_exam_questions.py              # whole file
  python3 tools/validate_exam_questions.py --content insight/insight-63
  python3 tools/validate_exam_questions.py --strict     # warnings fail too

Exit 0 when clean, 1 on any error. Prints a one-line summary (live/review per
content when --content is given).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'plus' / 'exam-questions.json'

ID_RE = re.compile(r'^r-[a-z0-9][a-z0-9-]{3,40}$')
STATUSES = {None, '', 'live', 'approved', 'review', 'rejected'}
BANNED_OPTIONS = ['همهٔ موارد', 'همه موارد', 'همه‌ی موارد', 'هیچ‌کدام از موارد', 'هیچکدام از موارد', 'الف و ب', 'موارد الف']
DEIXIS = ['این مطالعه', 'این کیس', 'این بیمار', 'این متن', 'این ویدیو', 'این مقاله', 'این پژوهش', 'این اپیزود']
ARABIC = re.compile('[يك]')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--content', help='check only this content_id (and report its counts)')
    ap.add_argument('--strict', action='store_true', help='treat editorial warnings as errors')
    ap.add_argument('--file', default=str(FILE))
    args = ap.parse_args()

    errors: list[str] = []
    warnings: list[str] = []
    try:
        data = json.loads(Path(args.file).read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        print(f'ERROR: cannot read {args.file}: {e}')
        return 1
    by = data.get('byContent') if isinstance(data, dict) else None
    if not isinstance(by, dict):
        print('ERROR: top level must be {"version", "byContent": {...}}')
        return 1

    ids: Counter[str] = Counter()
    prompts: Counter[str] = Counter()
    live = review = 0
    for cid, entry in by.items():
        if args.content and cid != args.content:
            continue
        if not (ROOT / f'{cid}.html').exists():
            errors.append(f'{cid}: no page {cid}.html on disk')
        qs = entry.get('questions') if isinstance(entry, dict) else None
        if not isinstance(qs, list):
            errors.append(f'{cid}: "questions" must be a list')
            continue
        for q in qs:
            tag = f'{cid}#{q.get("id", "?") if isinstance(q, dict) else "?"}'
            if not isinstance(q, dict):
                errors.append(f'{tag}: not an object'); continue
            qid = str(q.get('id', ''))
            if not ID_RE.match(qid):
                errors.append(f'{tag}: id must match {ID_RE.pattern}')
            ids[qid] += 1
            status = q.get('status')
            if status not in STATUSES:
                errors.append(f'{tag}: status «{status}» unknown')
            is_live = status in (None, '', 'live', 'approved')
            if status == 'review' and not str(q.get('review_note', '')).strip():
                errors.append(f'{tag}: review rows need a review_note')
            prompt = str(q.get('prompt_fa', '')).strip()
            if not prompt:
                errors.append(f'{tag}: empty prompt_fa')
            if is_live:
                live += 1
                prompts[prompt] += 1
            elif status == 'review':
                review += 1
            kind = q.get('kind') or ('mcq' if isinstance(q.get('options'), list) else 'free' if isinstance(q.get('key_points'), list) else None)
            if kind == 'mcq':
                opts = q.get('options')
                if not isinstance(opts, list) or not (2 <= len(opts) <= 6) or any(not isinstance(o, str) or not o.strip() for o in opts):
                    errors.append(f'{tag}: options must be 2..6 non-empty strings'); continue
                if len({o.strip() for o in opts}) != len(opts):
                    errors.append(f'{tag}: duplicate options')
                c = q.get('correct')
                if not isinstance(c, int) or isinstance(c, bool) or not (0 <= c < len(opts)):
                    errors.append(f'{tag}: correct must be a 0-based index into options')
                if len(opts) != 4:
                    warnings.append(f'{tag}: {len(opts)} options (the exam standard is four)')
                for o in opts:
                    os_ = o.strip()
                    if any(os_ == b or os_.startswith(b) for b in BANNED_OPTIONS):
                        warnings.append(f'{tag}: banned option form «{os_[:30]}»')
                lens = [len(o) for o in opts]
                # New publish rows hold 1.25; the 1405/08/03 quiz backfill was balanced to 1.6 and keeps that bar.
                limit = 1.6 if (q.get('source') == 'quiz' or not is_live) else 1.25
                if min(lens) and max(lens) / min(lens) > limit + 1e-9:
                    warnings.append(f'{tag}: option lengths {min(lens)}–{max(lens)} exceed {limit}×')
                if ARABIC.search(prompt) or any(ARABIC.search(o) for o in opts):
                    warnings.append(f'{tag}: Arabic ي/ك')
            elif kind == 'free':
                pts = q.get('key_points')
                if not isinstance(pts, list) or not (1 <= len(pts) <= 6):
                    errors.append(f'{tag}: key_points must be 1..6')
            else:
                errors.append(f'{tag}: kind must be mcq or free')
            hit = [d for d in DEIXIS if d in prompt]
            if hit:
                warnings.append(f'{tag}: deixis in stem {hit}')

    for qid, n in ids.items():
        if n > 1:
            errors.append(f'id {qid} appears {n} times')
    for p, n in prompts.items():
        if n > 1:
            warnings.append(f'duplicate live prompt ×{n}: {p[:60]}…')

    for w in warnings:
        print(f'WARN  {w}')
    for e in errors:
        print(f'ERROR {e}')
    scope = args.content or f'{len(by)} content ids'
    print(f'{scope}: {live} live, {review} review; {len(errors)} error(s), {len(warnings)} warning(s)')
    return 1 if errors or (args.strict and warnings) else 0


if __name__ == '__main__':
    sys.exit(main())
