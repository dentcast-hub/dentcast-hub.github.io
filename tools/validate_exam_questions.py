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

Append-only guard (every run, also from verify_publish's 4.12-ب row and CI):
the file is compared, key by key, with the copy this branch was cut from
(`git merge-base HEAD origin/main`, else `origin/main` with a WARN, else a
WARN that nothing was compared). Ids are load-bearing (attempt snapshots and
the «unseen first» draw point at them), so it is an ERROR when:

  * a content_id that existed is gone, or its `questions` is no longer a list
  * a row that existed (matched by id) is gone — retire a row with
    "status": "rejected", never by deleting it
  * a row that existed changed in any field (prompt, options, key, kind,
    source, …) — except a founder-approved fix (the id stays). Its durable
    record is an entry in .dentcast/exam-edit-approvals.json, keyed
    "<content_id>#<id>", with exactly content_id, question_id, row_sha256 (of
    the approved row: --row-sha256 <content_id>#<id>) and approval {status
    "confirmed", decision, evidence}; CI and Phase F read it. --allow-edit
    <content_id> only previews such a fix locally.
  * `version` changed or another top-level key disappeared

and a WARN when a `review` row was promoted to live (founder approval needed),
rows were inserted before existing ones instead of appended, existing rows were
reordered, or rows were appended to a content_id other than --content. New
content_ids and rows appended at the end pass. Comparison is on parsed JSON,
so re-indenting the file is not a change; editing a value is.

Usage:
  python3 tools/validate_exam_questions.py              # whole file
  python3 tools/validate_exam_questions.py --content insight/insight-63
  python3 tools/validate_exam_questions.py --strict     # warnings fail too
  python3 tools/validate_exam_questions.py --baseline origin/main
  python3 tools/validate_exam_questions.py --baseline-file OLD.json
  python3 tools/validate_exam_questions.py --row-sha256 insight/insight-63#r-0123abcd

Exit 0 when clean, 1 on any error. Prints a one-line summary (live/review per
content when --content is given).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REL = 'plus/exam-questions.json'
FILE = ROOT / REL

ID_RE = re.compile(r'^r-[a-z0-9][a-z0-9-]{3,40}$')
STATUSES = {None, '', 'live', 'approved', 'review', 'rejected'}
BANNED_OPTIONS = ['همهٔ موارد', 'همه موارد', 'همه‌ی موارد', 'هیچ‌کدام از موارد', 'هیچکدام از موارد', 'الف و ب', 'موارد الف']
DEIXIS = ['این مطالعه', 'این کیس', 'این بیمار', 'این متن', 'این ویدیو', 'این مقاله', 'این پژوهش', 'این اپیزود']
ARABIC = re.compile('[يك]')


LIVE = (None, '', 'live', 'approved')


def _git(root: Path, *args: str) -> str | None:
    try:
        return subprocess.run(['git', *args], cwd=root, capture_output=True, check=True,
                              timeout=20).stdout.decode('utf-8')
    except (OSError, subprocess.SubprocessError, UnicodeError):
        return None


def git_baseline(rel: str = REL, root: Path = ROOT, ref: str | None = None):
    """The committed copy of `rel` this branch was cut from.

    Returns (text, label, warning). text is None when there is nothing to
    compare: warning then says why, or is None when the file simply did not
    exist at the baseline (the first commit of the file). `ref` forces one."""
    if ref:
        candidates = [(ref, f'--baseline {ref}', None)]
    else:
        base = (_git(root, 'merge-base', 'HEAD', 'origin/main') or '').strip()
        candidates = [(base, f'merge-base {base[:10]}', None)] if base else []
        candidates.append(('origin/main', 'origin/main',
                           'no merge-base of HEAD and origin/main (shallow clone?); compared with the '
                           'current origin/main, which is only right if main has not advanced'))
    tried = []
    for commit, label, warning in candidates:
        if _git(root, 'rev-parse', '--verify', '--quiet', commit + '^{commit}') is None:
            tried.append(commit)
            continue
        text = _git(root, 'show', f'{commit}:{rel}')
        if text is None:  # the ref exists but the file did not exist there
            return None, label, None
        return text, label, warning
    return None, 'none', (f'no baseline for {rel} ({", ".join(tried)} unavailable) — existing '
                          'rows were NOT checked for removal or edits; '
                          'git fetch origin +refs/heads/main:refs/remotes/origin/main')


def _rows(entry):
    return entry.get('questions') if isinstance(entry, dict) else None


EDIT_APPROVALS_REL = '.dentcast/exam-edit-approvals.json'


def row_sha256(row) -> str:
    """Digest of one parsed row (key order and indentation do not matter)."""
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode('utf-8')).hexdigest()


def edit_approvals(root: Path = ROOT) -> dict:
    """{"<content_id>#<id>": row_sha256} for every well-formed confirmed entry of
    .dentcast/exam-edit-approvals.json; anything else approves nothing."""
    try:
        data = json.loads((root / EDIT_APPROVALS_REL).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}
    out = {}
    for key, e in (data.items() if isinstance(data, dict) else ()):
        a = e.get('approval') if isinstance(e, dict) else None
        if (isinstance(a, dict) and set(e) == {'content_id', 'question_id', 'row_sha256', 'approval'}
                and key == f"{e['content_id']}#{e['question_id']}" and isinstance(e['row_sha256'], str)
                and a.get('status') == 'confirmed' and isinstance(a.get('decision'), str) and a['decision'].strip()
                and isinstance(a.get('evidence'), list) and a['evidence']
                and all(isinstance(x, str) and x.strip() for x in a['evidence'])):
            out[key] = e['row_sha256']
    return out


def compare_banks(old, new, content: str | None = None, allow_edit=(), approved=None) -> tuple[list[str], list[str]]:
    """Key-level append-only comparison of two parsed exam-question files.

    Returns (errors, warnings); the rules are in the module docstring.
    `approved` defaults to the founder-approved edits recorded in this
    checkout's EDIT_APPROVALS_REL."""
    errors: list[str] = []
    warnings: list[str] = []
    allow_edit = set(allow_edit or ())
    approved = edit_approvals() if approved is None else approved
    if not isinstance(old, dict) or not isinstance(old.get('byContent'), dict):
        return errors, ['baseline copy is not an exam-questions file — nothing compared']
    if not isinstance(new, dict) or not isinstance(new.get('byContent'), dict):
        return ['file structure damaged: top level must stay {"version", "byContent": {...}}'], warnings
    for key, value in old.items():
        if key == 'byContent':
            continue
        if key not in new:
            errors.append(f'top-level key "{key}" was removed')
        elif new[key] != value:
            (errors if key == 'version' else warnings).append(f'top-level "{key}" changed')
    old_by, new_by = old['byContent'], new['byContent']
    for cid, entry in old_by.items():
        old_rows = _rows(entry)
        if not isinstance(old_rows, list):
            continue
        if cid not in new_by:
            errors.append(f'{cid}: content id removed with its {len(old_rows)} existing question(s)')
            continue
        new_rows = _rows(new_by[cid])
        if not isinstance(new_rows, list):
            errors.append(f'{cid}: "questions" is no longer a list ({len(old_rows)} existing question(s) lost)')
            continue
        new_by_id: dict = {}
        for q in new_rows:
            if isinstance(q, dict) and q.get('id') not in new_by_id:
                new_by_id[q.get('id')] = q
        old_ids = []
        for i, q in enumerate(old_rows):
            qid = q.get('id') if isinstance(q, dict) else None
            old_ids.append(qid)
            cur = new_by_id.get(qid)
            if cur is None:
                errors.append(f'{cid}#{qid or i}: existing question removed '
                              '(retire it with "status": "rejected", never delete it)')
                continue
            if cur == q:
                continue
            changed = sorted(k for k in set(q) | set(cur) if q.get(k) != cur.get(k))
            if (q.get('status') == 'review' and cur.get('status') in LIVE
                    and set(changed) <= {'status', 'review_note'}):
                warnings.append(f"{cid}#{qid}: promoted from review to live — needs the founder's approval in chat")
            elif approved.get(f'{cid}#{qid}') == row_sha256(cur):
                warnings.append(f'{cid}#{qid}: edited ({", ".join(changed)}) under the founder approval '
                                f'recorded in {EDIT_APPROVALS_REL}')
            elif cid in allow_edit:
                warnings.append(f'{cid}#{qid}: edited ({", ".join(changed)}) under --allow-edit (local preview '
                                f'only; CI and Phase F need its {EDIT_APPROVALS_REL} entry)')
            else:
                errors.append(f'{cid}#{qid}: existing question modified ({", ".join(changed)}); only a '
                              f'founder-approved fix may change it, recorded in {EDIT_APPROVALS_REL} '
                              f'(row_sha256: --row-sha256 {cid}#{qid})')
        old_set = set(old_ids)
        new_ids = [q.get('id') if isinstance(q, dict) else None for q in new_rows]
        kept = [x for x in new_ids if x in old_set]
        if kept and new_ids[:len(kept)] != kept:
            warnings.append(f'{cid}: new rows inserted before existing ones (append at the end)')
        elif kept != [x for x in old_ids if x in set(kept)]:
            warnings.append(f'{cid}: existing rows reordered (nothing lost — ids, not positions, are '
                            'load-bearing; restore the original order)')
        appended = sum(1 for x in new_ids if x not in old_set)
        if appended and content and cid != content:
            warnings.append(f'{cid}: {appended} row(s) appended to another page than {content}')
    return errors, warnings


def guard(path: Path, content: str | None = None, allow_edit=(), ref: str | None = None,
          baseline_file: str | None = None, root: Path = ROOT) -> tuple[list[str], list[str], str]:
    """Run the append-only check for `path`. Returns (errors, warnings, label)."""
    if baseline_file:
        try:
            old_text, label, warning = Path(baseline_file).read_text(encoding='utf-8'), baseline_file, None
        except OSError as e:
            return [f'cannot read --baseline-file: {e}'], [], baseline_file
    else:
        try:
            rel = Path(path).resolve().relative_to(root.resolve()).as_posix()
        except ValueError:
            return [], [f'{path} is outside the repo; not compared (pass --baseline-file)'], 'none'
        old_text, label, warning = git_baseline(rel, root, ref)
    warnings = [warning] if warning else []
    if old_text is None:
        return [], warnings, label
    try:
        old = json.loads(old_text)
    except ValueError:
        return [], warnings + [f'baseline ({label}) is not valid JSON — nothing compared'], label
    try:
        new = json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        return [f'cannot read {path}: {e}'], warnings, label
    errors, more = compare_banks(old, new, content, allow_edit, edit_approvals(root))
    return errors, warnings + more, label


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--content', help='check only this content_id (and report its counts)')
    ap.add_argument('--strict', action='store_true', help='treat editorial warnings as errors')
    ap.add_argument('--file', default=str(FILE))
    ap.add_argument('--baseline', metavar='REF', help='compare with this commit instead of the merge-base')
    ap.add_argument('--baseline-file', metavar='PATH', help='compare with this JSON file instead of git')
    ap.add_argument('--allow-edit', metavar='CONTENT_ID', action='append', default=[],
                    help='preview a founder-approved fix to existing rows of this content_id locally '
                         f'(repeatable); CI and Phase F need its {EDIT_APPROVALS_REL} entry')
    ap.add_argument('--row-sha256', metavar='CONTENT_ID#ID',
                    help=f'print the row_sha256 of that row in --file for its {EDIT_APPROVALS_REL} entry')
    args = ap.parse_args()

    if args.row_sha256:
        cid, _, qid = args.row_sha256.rpartition('#')
        try:
            rows = json.loads(Path(args.file).read_text(encoding='utf-8'))['byContent'][cid]['questions']
            print(row_sha256(next(q for q in rows if isinstance(q, dict) and q.get('id') == qid)))
            return 0
        except (OSError, ValueError, KeyError, TypeError, StopIteration):
            print(f'ERROR: no row {args.row_sha256} in {args.file}')
            return 1

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
                elif any(not str(p.get('text', '') if isinstance(p, dict) else p).strip() for p in pts):
                    # plus-api/src/exam-questions.ts drops a free row with an empty key point
                    errors.append(f'{tag}: empty key point text')
            else:
                errors.append(f'{tag}: kind must be mcq or free')
            hit = [d for d in DEIXIS if d in prompt]
            if hit:
                warnings.append(f'{tag}: deixis in stem {hit}')

    for qid, n in ids.items():
        if n > 1:
            errors.append(f'id {qid} appears {n} times')
    g_err, g_warn, g_label = guard(Path(args.file), args.content, args.allow_edit,
                                   args.baseline, args.baseline_file)
    errors += [f'append-only ({g_label}): {e}' for e in g_err]
    warnings += [f'append-only ({g_label}): {w}' for w in g_warn]
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
