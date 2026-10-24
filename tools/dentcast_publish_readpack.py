#!/usr/bin/env python3
"""Conservative, byte-exact reading pack for the canonical publishing rules.

This tool only selects instructions. It never executes a publishing step,
claims a scientific result, or approves a skip. Uncertain inputs retain the
entire source. Selectively sliced modules are pinned to their Git blob IDs:
any edit requires deliberate re-audit of the selection map.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = '.dentcast/workflows/'
MODULES = WORKFLOW + 'modules/'

# These blobs were independently inspected at main c16554c (PR #971).
# Editing one invalidates the routing proof. Update a pin ONLY after checking
# both the selection boundaries and every skipped section's applicability.
PINNED_BLOBS = {
    '03-litecast-and-page.md': '93cdab5ca0318aeabfb6e58f15a9518ce5c77c10',
    '04-taxonomy-and-navigation.md': '2f91e19a9ebd67306ec60f97b83f524c52d2c555',
    '05-semantic-linking.md': 'd063a45d4896d7b433feec34f9b049489aadd214',
    '06-paper-ingestion.md': 'f6fd85654e77a93d748d1f7680fd63b192fc9b21',
    '08-des-fidelity.md': 'a920f75b84f899f025cc8dee56a6d0aae0d909da',
    '09-challenge.md': 'b935925ebceb91acf7513a9087858e76bb1b6693',
    '12-english-notify-verify.md': '9b16e2445a3229d6077ca392d4811b115b77db0c',
}

REQUIRED = [
    WORKFLOW + 'README.md',
    WORKFLOW + 'global/README.md',
    WORKFLOW + 'agent-parity.md',
    WORKFLOW + 'publish-checkpoints.md',
    *[MODULES + f'{i:02d}-{name}.md' for i, name in enumerate((
        'hard-rules', 'routing-intake', 'litecast-and-page',
        'taxonomy-and-navigation', 'semantic-linking', 'paper-ingestion',
        'flashcards-and-quiz', 'des-fidelity', 'challenge',
        'brain-and-pathways', 'build-and-version', 'english-notify-verify',
    ), start=1)],
]

# A known category is necessary but not sufficient: paper and Challenge flags
# must come from locked Phase B answers, not guesses from page folder names.
KNOWN_CATEGORIES = frozenset({
    'sharehub', 'chairside', 'insight', 'clinical', 'notecast', 'episode',
    'litecast', 'glossary', 'metanotes', 'dentai', 'photocast',
    'dentcast', 'dentcast-plus', 'promptologist',
})

class UnsafeSelection(ValueError):
    pass


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def git_blob_id(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def boundary(lines, marker):
    found = [i for i, line in enumerate(lines) if line.startswith(marker)]
    if len(found) != 1:
        raise UnsafeSelection(f'SECTION_BOUNDARY_NOT_UNIQUE: {marker!r} ({len(found)} matches)')
    return found[0]


def include(ranges, size):
    """Return disjoint byte-preserving intervals; reject overlap and gaps mistakes."""
    previous = 0
    selected = []
    for start, end in sorted(ranges):
        if not (0 <= start < end <= size) or start < previous:
            raise UnsafeSelection('INVALID_SECTION_INTERVAL')
        previous = end
        selected.append((start, end))
    return selected


def route_spans(name, lines, *, category, attached_paper, challenge):
    """Decide safe line ranges; everything not explicitly proven safe stays."""
    size = len(lines)
    whole = [(0, size)]
    if category not in KNOWN_CATEGORIES or attached_paper == 'unknown' or challenge == 'unknown':
        return whole, 'UNLOCKED_OR_UNKNOWN_INTAKE_FULL_SOURCE'
    lite = category == 'litecast'
    if lite and challenge == 'yes':
        raise UnsafeSelection('CONFLICTING_LITECAST_CHALLENGE_INTAKE')

    if name == '03-litecast-and-page.md' and not lite:
        preamble = boundary(lines, '<!-- /dentcast-checkpoint-protocol:v1 -->') + 1
        common = boundary(lines, '### 1. Template lock & hash')
        if common <= preamble:
            raise UnsafeSelection('INVALID_MODULE_03_ORDER')
        return include([(0, preamble), (common, size)], size), 'OMIT_LITECAST_ONLY_BRANCH'

    if name == '04-taxonomy-and-navigation.md':
        # Broad/legacy types may actually be episode or Promptologist variants.
        # Restrict section omission to explicitly modeled living routes.
        if category not in {'sharehub', 'chairside', 'insight', 'clinical',
                            'metanotes', 'glossary', 'litecast',
                            'notecast', 'episode', 'promptologist'}:
            return whole, 'AMBIGUOUS_CATEGORY_KEEP_ALL_NAVIGATION_BRANCHES'
        note = boundary(lines, '### 4.5. Update parent episode')
        shared = boundary(lines, '### 4.5-ب. Shared evidence base')
        prompt = boundary(lines, '### 4.6. Promptologist series')
        if not note < shared < prompt:
            raise UnsafeSelection('INVALID_MODULE_04_ORDER')
        parts = [(0, note)]
        if category == 'notecast':
            parts += [(note, prompt)]
        elif category == 'episode':
            parts += [(shared, prompt)]
        if category == 'promptologist':
            parts += [(prompt, size)]
        return include(parts, size), 'OMIT_UNRELATED_NOTECAST_EPISODE_PROMPTOLOGIST_BRANCHES'

    if name == '05-semantic-linking.md' and category != 'glossary' and not lite:
        glossary = boundary(lines, '### 4.7-ب. Cross-link the new TERM')
        next_head = boundary(lines, '### 4.8. Suggest in-article internal links')
        if glossary >= next_head:
            raise UnsafeSelection('INVALID_MODULE_05_ORDER')
        return include([(0, glossary), (next_head, size)], size), 'OMIT_GLOSSARY_PUBLISH_ONLY_BACKLINKS'

    if name == '06-paper-ingestion.md' and attached_paper == 'no':
        return [], 'NO_ATTACHED_PAPER_LOCKED_AT_Q4_7'

    if name == '08-des-fidelity.md' and (lite or challenge == 'yes'):
        stop = boundary(lines, '#### Conditional path for founder-supplied results')
        return include([(0, stop)], size), 'CANONICAL_LITECAST_OR_CHALLENGE_DES_SKIP_ONLY'

    if name == '09-challenge.md' and challenge == 'no':
        return [], 'NOT_A_CHALLENGE_LOCKED_AT_Q4_9'

    if name == '12-english-notify-verify.md' and (lite or challenge == 'yes'):
        step_start = boundary(lines, '**Steps:**')
        phase_e = boundary(lines, '## Phase E — Mark the page')
        if step_start >= phase_e:
            raise UnsafeSelection('INVALID_MODULE_12_ORDER')
        return include([(0, step_start), (phase_e, size)], size), 'OMIT_ENGLISH_IMPLEMENTATION_WHEN_CANONICALLY_SKIPPED'

    return whole, 'FULL_REQUIRED'


def build(root, *, category, attached_paper, challenge, after_intake=False):
    root = Path(root).resolve(strict=True)
    manifest = {
        'schema': 'dentcast_publish_readpack_v1',
        'classification': {'category': category, 'attached_paper': attached_paper,
                           'challenge': challenge},
        'contract': 'READING_SELECTION_ONLY_NOT_SCIENTIFIC_APPROVAL',
        'source_paths': [],
        'already_loaded_required': REQUIRED[:6] if after_intake else [],
        'uncovered_if_unverified': [
            'This selection is conditional on truthful locked Phase B intake.',
            'Read full applicable global rule sections via dentcast_global_rules.py.',
            'Read complete cited specialty workflows and scientific prompt files as required.',
            'Unselected steps remain in the canonical ledger with documented real skip reasons.',
        ],
    }
    pieces = []
    raw_total = selected_total = 0
    for path in REQUIRED:
        full = root / path
        if full.is_symlink() or not full.is_file():
            raise UnsafeSelection('REQUIRED_SOURCE_MISSING_OR_SYMLINK:' + path)
        raw = full.read_bytes()
        try:
            decoded = raw.decode('utf-8')
        except UnicodeError as e:
            raise UnsafeSelection('SOURCE_NOT_UTF8:' + path) from e
        if not raw or '\x00' in decoded:
            raise UnsafeSelection('UNSAFE_SOURCE:' + path)
        name = full.name
        drift = name in PINNED_BLOBS and git_blob_id(raw) != PINNED_BLOBS[name]
        lines = decoded.splitlines(keepends=True)
        if after_intake and path in REQUIRED[:6]:
            spans, reason = [], 'ALREADY_READ_IN_THIS_SESSION_BEFORE_LOCKED_INTAKE'
        elif drift:
            # A new heading or exception may make an old omission unsound.
            # Reading the whole changed source is always conservative.
            spans, reason = [(0, len(lines))], 'SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP'
        else:
            spans, reason = route_spans(name, lines, category=category,
                                        attached_paper=attached_paper, challenge=challenge)
        spans = include(spans, len(lines)) if spans else []
        selected = ''.join(''.join(lines[start:end]) for start, end in spans)
        selected_bytes = selected.encode('utf-8')
        # Prove that every emitted block is literally a slice of the loaded file.
        if selected != ''.join(''.join(lines[a:b]) for a,b in spans):
            raise UnsafeSelection('SOURCE_EXTRACTION_MISMATCH:' + path)
        raw_total += len(raw)
        selected_total += len(selected_bytes)
        manifest['source_paths'].append({
            'path': path, 'git_blob_sha1': git_blob_id(raw), 'source_sha256': sha256(raw),
            'source_bytes': len(raw), 'selected_bytes': len(selected_bytes),
            'selection_reason': reason,
            'line_ranges_inclusive': [[a + 1, b] for a, b in spans],
            'selected_sha256': sha256(selected_bytes),
        })
        if spans:
            pieces.append(f'\n\n=== BEGIN SOURCE {path} SHA256 {sha256(raw)} ===\n')
            for a, b in spans:
                pieces.append(f'--- SOURCE LINES {a + 1}-{b} ---\n')
                pieces.append(''.join(lines[a:b]))
                if not lines[b-1].endswith('\n'):
                    pieces.append('\n')
            pieces.append(f'=== END SOURCE {path} ===\n')
    manifest['source_bytes_total'] = raw_total
    manifest['selected_bytes_total'] = selected_total
    manifest['bytes_saved'] = raw_total - selected_total
    return ''.join(pieces), manifest


def atomic_write(path, text):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix='.readpack-')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', type=Path, default=ROOT)
    p.add_argument('--category', required=True, help='locked Phase B category; unknown means full files')
    p.add_argument('--attached-paper', required=True, choices=['yes', 'no', 'unknown'],
                   help='locked Phase B Q4.7; unknown retains complete modules')
    p.add_argument('--challenge', required=True, choices=['yes', 'no', 'unknown'],
                   help='locked Phase B Q4.9; unknown retains complete modules')
    p.add_argument('--after-intake', action='store_true',
                   help='omit routers + modules 01/02 already read in this same session')
    p.add_argument('--output', type=Path, required=True, help='temporary UTF-8 verbatim reading pack')
    p.add_argument('--manifest', type=Path, required=True, help='temporary provenance/coverage JSON')
    a = p.parse_args(argv)
    if a.output.resolve() == a.manifest.resolve():
        p.error('--output and --manifest must differ')
    try:
        pack, report = build(a.root, category=a.category.casefold(),
                             attached_paper=a.attached_paper, challenge=a.challenge,
                             after_intake=a.after_intake)
        atomic_write(a.output, pack)
        atomic_write(a.manifest, json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    except (OSError, UnsafeSelection, UnicodeError) as error:
        print('READPACK_BLOCKED: ' + str(error), file=sys.stderr)
        return 2
    print(json.dumps({'status': 'prepared_not_approved',
                      'sources': len(report['source_paths']),
                      'source_bytes': report['source_bytes_total'],
                      'selected_bytes': report['selected_bytes_total'],
                      'bytes_saved': report['bytes_saved'],
                      'output': str(a.output), 'manifest': str(a.manifest)},
                     ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
