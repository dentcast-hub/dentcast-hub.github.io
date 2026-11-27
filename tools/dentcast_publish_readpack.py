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
sys.path.insert(0, str(Path(__file__).resolve().parent))
from dentcast_publish_handoff import canonical_category  # noqa: E402
WORKFLOW = '.dentcast/workflows/'
MODULES = WORKFLOW + 'modules/'

# Selectively sliced modules are pinned to their Git blob IDs. A changed pinned
# module is read whole (SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP) until its pin is
# updated. Update a pin only after checking that every selection boundary still
# occurs exactly once and that no skipped section changed its applicability; the
# reason for each re-pin belongs in the commit message, not here.
PINNED_BLOBS = {
    '03-litecast-and-page.md': 'aaaf22b50d3adbff9a65ccbe0e21756faaa77b8a',
    '04-taxonomy-and-navigation.md': 'b6366cddd2989ef18aa542d7b9ae22b76fd9b639',
    '05-semantic-linking.md': '5069cc0e1dff5858258f875258fdf23ddaf39c40',
    '06-paper-ingestion.md': 'ce9ff376c0a10d83be94ce18fa8d1d72c999d612',
    '08-des-fidelity.md': 'e54a4050bc174f1d339850d0e64cc09e1f0caac9',
    '09-challenge.md': 'b1faa96b9e0d71dd1fd70ff2fe0075dc5ad4c2cc',
    '11-build-and-version.md': 'd2d35ca0fba390eac9a21619290c9cbf6af143ab',
    '12-english-notify-verify.md': 'b429fab3438ca187b86897d56914e6a277573e4a',
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
    'dentcast', 'dentcast-plus', 'promptologist', 'plak_sefr', 'taraz',
})

# The handoff stores the brain `type` (clinical, meta, dentcast_plus, plak_sefr,
# ...) and init/bind accept spellings such as Insight or «اینسایت». A name this
# map already models keeps its exact meaning ('dentcast' stays the broad,
# keep-all-navigation type; 'episode' the core-episode route); any other
# spelling selects exactly what its canonical brain type selects.
_SELECTOR_NAMES = {'meta': 'metanotes', 'dentcast_plus': 'dentcast-plus'}


def selector_category(value):
    folded = value.casefold() if isinstance(value, str) else value
    if folded in KNOWN_CATEGORIES:
        return folded
    canonical = canonical_category(value)
    return _SELECTOR_NAMES.get(canonical, canonical)


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


def without(lines, cuts):
    """The ranges of `lines` that remain after dropping each [start marker, end marker) span.
    A span whose two markers are not both found exactly once, in order, is kept."""
    return remaining(len(lines), spans_of(lines, cuts))


def spans_of(lines, cuts):
    spans = []
    for start, end in cuts:
        a = [i for i, line in enumerate(lines) if line.startswith(start)]
        b = [i for i, line in enumerate(lines) if line.startswith(end)]
        if len(a) == 1 and len(b) == 1 and a[0] < b[0]:
            spans.append((a[0], b[0]))
    return spans


def remaining(size, spans):
    kept, cursor = [], 0
    for a, b in sorted(spans):
        if a > cursor:
            kept.append((cursor, a))
        cursor = max(cursor, b)
    if cursor < size:
        kept.append((cursor, size))
    return kept


def route_spans(name, lines, *, category, attached_paper, challenge, des_basket='unknown',
                isolated_call='unknown', sources='unknown'):
    """Decide safe line ranges; everything not explicitly proven safe stays."""
    size = len(lines)
    whole = [(0, size)]
    if category not in KNOWN_CATEGORIES or attached_paper == 'unknown' or challenge == 'unknown':
        return whole, 'UNLOCKED_OR_UNKNOWN_INTAKE_FULL_SOURCE'
    lite = category == 'litecast'
    if lite and challenge == 'yes':
        raise UnsafeSelection('CONFLICTING_LITECAST_CHALLENGE_INTAKE')

    if name == 'agent-parity.md':
        # Sections 4 and 5 are review checklists that restate the modules; the rules of a
        # publication end where they begin.
        marks = [i for i, line in enumerate(lines) if line.startswith('## 4. ')]
        end = marks[0] if len(marks) == 1 else size
        cuts = [(end, size)] if end < size else []
        if isolated_call == 'yes':
            # The agent runs each model call in its own context: nothing travels by relay or
            # from one agent to another.
            cuts += [(a, b) for a, b in spans_of(lines, [
                ('**مسیر رله — ', '**FIDELITY و انتخاب مدل:**'),
                ('**دست‌به‌دست کردن DES/Fidelity بین ایجنت‌ها', '### پروتکل «توانمندی ندارم»')]) if b <= end]
        if cuts:
            return include(remaining(size, cuts), size), 'OMIT_REVIEW_CHECKLISTS' + (
                '_AND_RELAY' if len(cuts) > 1 else '')
        return whole, 'FULL_REQUIRED'

    if name == 'README.md' and lines and lines[0].startswith('# Shared active global rules'):
        # global/README.md explains the selector; this pack carries the selected sections themselves.
        return [], 'GLOBAL_SECTIONS_ARE_IN_THIS_PACK'

    if name == 'publish-checkpoints.md':
        # A page publication ends for the agent at Push 2: the paper-only delivery and the
        # merge/hosting notes describe nothing it does.
        marks = {h: [i for i, line in enumerate(lines) if line.startswith(h)]
                 for h in ('## Paper-only (one delivery)', '## Phase F, DES exemptions', '## Waiting, services, merge')}
        if all(len(v) == 1 for v in marks.values()):
            paper, phase_f, waiting = (marks[h][0] for h in marks)
            if paper < phase_f < waiting:
                return include([(0, paper), (phase_f, waiting)], size), 'OMIT_PAPER_ONLY_AND_AFTER_MERGE_NOTES'
        return whole, 'FULL_REQUIRED'

    if name == '02-routing-intake.md':
        # The category is locked: the paper-only fast path is another route, and the Insight
        # image rules bind Insight pages only.
        cuts = [('**Paper-only fast path (text-less) detail.**', '## Phase A — Discover')]
        if category not in {'insight', 'clinical'}:
            cuts.append(('**Insight images and caption.**', '### Question 4.7'))
        return include(without(lines, cuts), size), 'OMIT_OTHER_ROUTES_OF_A_LOCKED_CATEGORY'

    if name == '10-brain-and-pathways.md' and category not in {'insight', 'clinical'}:
        return include(without(lines, [('**Insight `keywords`.**', '### 5.5. Verify the recorded pillar')]), size), \
            'OMIT_INSIGHT_ONLY_KEYWORDS'

    if name == '03-litecast-and-page.md' and not lite:
        # The preamble keeps what a non-LiteCast run still needs from the branch's head: the
        # module's own ledger-steps line and step 0's own paragraph, which IS the canonical
        # C.0.x skip reason ("any other category ignores it"). Cutting at the banner instead
        # (before 2026-11-06) dropped both and forced a second read of these lines.
        banner = boundary(lines, '<!-- /dentcast-checkpoint-protocol:v1 -->') + 1
        first_substep = [i for i, line in enumerate(lines) if line.startswith('**0.1 ')]
        preamble = first_substep[0] if len(first_substep) == 1 else banner
        common = boundary(lines, '### 1. Template lock & hash')
        if common <= preamble or preamble < banner:
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

    if name == '08-des-fidelity.md' and des_basket == 'commentary':
        # Basket 1 (the page's own text, no cited source): one SOURCE call on the page text and
        # no FIDELITY call (module 08 Part 2b, «When»). Parts 2b-2d (the FIDELITY protocol and
        # the retired audit) and Part 3b (flagged sentences) have nothing to act on.
        supplied = boundary(lines, '#### Conditional path for founder-supplied results')
        once_a = boundary(lines, '<!-- des-scored-once:v1 -->')
        once_b = boundary(lines, '<!-- /des-scored-once:v1 -->') + 1
        part1 = boundary(lines, '#### Part 1 — Resolve `source_text`')
        guard = boundary(lines, '<!-- des-record-guard:v1 -->')
        part2 = boundary(lines, '#### Part 2 — Run the prompt file')
        fid = boundary(lines, '#### Part 2b — Run the FIDELITY call')
        checks = boundary(lines, '#### Part 3 — Validate the output mechanically')
        fixes = boundary(lines, '#### Part 3b — Every differing sentence goes to the founder')
        store = boundary(lines, '#### Part 4 — Store the record')
        if not (supplied < once_a < once_b <= part1 < guard < part2 < fid < checks < fixes < store):
            raise UnsafeSelection('INVALID_MODULE_08_ORDER')
        # Kept: when the step runs or is skipped, the five rules, the page's own text as
        # source (Part 1 up to the paper lookup), the scoring call, its checks and storage.
        return include([(0, supplied), (once_a, once_b), (part1, guard), (part2, fid), (checks, fixes),
                        (store, size)], size), 'COMMENTARY_BASKET_NO_FIDELITY_LOCKED_AT_Q4_8'

    if name == '08-des-fidelity.md':
        cuts, why = [], []
        if des_basket == 'research':
            # Basket 2 (cited sources): the page's own text is never the source, so the
            # COMMENTARY source rule and its checklist carve-out have nothing to act on;
            # neither has the re-check of a page that is already published.
            cuts += [('**COMMENTARY basket:**', '<!-- des-record-guard:v1 -->'),
                     # up to the Step 0 input block, which a research call needs (one block per source)
                     ('**The COMMENTARY track has one carve-out.**', "The user turn is the spec's Step 0 input block"),
                     ('**For a page already published**', '#### Part 4 — Store the record')]
            why.append('RESEARCH_BASKET_LOCKED_AT_Q4_8')
        if isolated_call == 'yes':
            # Every call is the agent's own: no result arrives from the founder.
            cuts.append(('#### Conditional path for founder-supplied results',
                         '<!-- fidelity-mechanical-acceptance:v1 -->'))
            why.append('OWN_ISOLATED_CALLS')
        if sources == 'one':
            # One cited source: every sentence goes to it, so no orphan sweep is ever owed.
            cuts += [('<!-- fidelity-sweep-first:v1 -->', '**The model is part of the measurement:**'),
                     ('5. **Orphan sweep', '`voted-src<k>.json` is what Part 3')]
            why.append('ONE_SOURCE_NO_ORPHAN_SWEEP')
        if cuts:
            return include(without(lines, cuts), size), '+'.join(why)

    if name == '11-build-and-version.md':
        # Everything below the marker is the post-Push-2 runner's C.8/C.7 part, which
        # publish-checkpoints.md lists as never read in a normal run (2026-11-06).
        marks = [i for i, line in enumerate(lines) if line.startswith('<!-- module-11-boundary')]
        if len(marks) == 1:
            agent_part = [i for i, line in enumerate(lines) if line.startswith('### 6. Pulse update')]
            if agent_part and marks[0] <= agent_part[0]:
                raise UnsafeSelection('INVALID_MODULE_11_ORDER')
            return include([(0, marks[0])], size), 'OMIT_POST_PUSH2_RUNNER_PART'

    if name == '09-challenge.md' and challenge == 'no':
        return [], 'NOT_A_CHALLENGE_LOCKED_AT_Q4_9'

    # publish-checkpoints.md «Just-in-time loading», last row: module 11 below its
    # `module-11-boundary` marker (§7–§8) and module 12 Phases E–G are the runner's
    # (C.8, C.7, E–G) and are never read in a normal run — only for guarded recovery,
    # which reads the full module, not a pack.
    if name == '11-build-and-version.md':
        marker = [i for i, line in enumerate(lines) if line.startswith('<!-- module-11-boundary')]
        if len(marker) != 1:
            return whole, 'FULL_REQUIRED'  # no marker: nothing is proven runner-only
        return include([(0, marker[0])], size), 'OMIT_RUNNER_ONLY_PART_BELOW_MODULE_11_BOUNDARY'

    if name == '12-english-notify-verify.md':
        phase_e = boundary(lines, '## Phase E — Mark the page')
        if lite or challenge == 'yes':
            step_start = boundary(lines, '**Steps:**')
            if step_start >= phase_e:
                raise UnsafeSelection('INVALID_MODULE_12_ORDER')
            return include([(0, step_start)], size), 'OMIT_ENGLISH_IMPLEMENTATION_WHEN_CANONICALLY_SKIPPED'
        return include([(0, phase_e)], size), 'OMIT_RUNNER_ONLY_PHASES_E_TO_G'

    return whole, 'FULL_REQUIRED'


def build(root, *, category, attached_paper, challenge, after_intake=False, des_basket='unknown',
          isolated_call='unknown', sources='unknown'):
    root = Path(root).resolve(strict=True)
    category = selector_category(category)
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
                                        attached_paper=attached_paper, challenge=challenge, des_basket=des_basket,
                                        isolated_call=isolated_call, sources=sources)
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
    if not after_intake and (root / WORKFLOW / 'global' / 'LOAD-MAP.json').is_file():
        # The global rules of a page publication, byte for byte: the pack is the one file read.
        import dentcast_global_rules as global_rules
        g_manifest, blocks = global_rules.sections(root)
        chosen = global_rules.select(g_manifest, blocks, (), False, publication=True)
        text = ''.join(global_rules.emitted_lines(chosen))
        pieces.append('\n\n=== BEGIN GLOBAL RULES (publication profile) ===\n' + text
                      + ('' if text.endswith('\n') else '\n') + '=== END GLOBAL RULES ===\n')
        manifest['global_sections'] = [b['id'] for b in chosen]
        selected_total += len(text.encode('utf-8'))
    manifest['source_bytes_total'] = raw_total
    manifest['selected_bytes_total'] = selected_total
    manifest['bytes_saved'] = raw_total - selected_total
    return ''.join(pieces), manifest


# Queue preparation route («فهرست خواندن» in publish-queue.md).
# publish-queue.md itself is read first and separately, so it is never packed.
# Each entry: (path, segments, paper_only). segments is None for the whole file,
# otherwise a list of (start_marker, end_marker, required_inside). end_marker
# None means end of file; NEXT_HEADING means the first Markdown heading after
# the start (end of file if none). required_inside, when set, must occur exactly
# once in the file and inside the slice, proving the whole block was kept.
NEXT_HEADING = object()
QUEUE_PREP = (
    # The checkpoint banner and ledger line at the top of 01, 02 and 08 belong to the
    # direct publication route; the queue reads each module from its first rule heading.
    (MODULES + '01-hard-rules.md', [('# DentCast Publishing Router', None, None)], False),
    # Phase 0 through Question 5 (its last heading) runs to the end of the module.
    (MODULES + '02-routing-intake.md', [('## Phase 0', None, None)], False),
    # Parts 1 to 3: preparation files the PDF (Part 1), writes the catalog entry and runs the
    # full-text enrichment (Part 2, steps 0-4 and 9) and finds the DOI and first author (Part 3,
    # step 1); publish-queue.md step 2 names which steps publish day does instead.
    (MODULES + '06-paper-ingestion.md',
     [('#### Part 1 — File the paper into Google Drive (correct topical subfolder)', None, None)], True),
    (MODULES + '08-des-fidelity.md', [('### 4.13. DES', None, None)], False),
    # Sections 5.0 (hashtags) and 5 (brain entry) are contiguous.
    (MODULES + '10-brain-and-pathways.md',
     [('### 5.0. Hashtag standardization', '### 5.5.', None)], False),
    # 4.11, 4.12 and 4.12-ب run to the end of the module.
    (MODULES + '07-flashcards-and-quiz.md', [('### 4.11.', None, None)], False),
    # The queue writes the English text only: the hard rules and the translation step.
    (WORKFLOW + 'en-version.md', [('## Hard rules', '## Phase A', None),
                                  ('### 5. Translation', '### 6. SEO head', None)], False),
    (MODULES + '12-english-notify-verify.md', [('## Phase D', '## Phase E', None)], False),
    # The «Opening paragraph before any list» block has several paragraphs,
    # including the bold-lead «This lead paragraph is authored text» standing-acceptance
    # rule, and ends with the «To check a page you just built:» check. The only
    # bold-lead block after it is «Structure, chips and callout boxes», which preparation also needs
    # (publish-queue.md, «فهرست خواندن»), so its end marker is the next Markdown
    # heading (today: none, i.e. end of file). The check sentence must sit inside
    # the slice, so a truncated block blocks instead of passing.
    (MODULES + '03-litecast-and-page.md',
     [('**Opening paragraph before any list', NEXT_HEADING,
       'To check a page you just built:')], False),
    (MODULES + '04-taxonomy-and-navigation.md', [('### 2.4.', '### 2.5.', None)], False),
    (MODULES + '11-build-and-version.md', [('### 6. Pulse update', '### 7.', None)], False),
    # 4.7, then 4.8 and 4.9 (to the end of the module): preparation decides the
    # «کاوش بیشتر» links of 4.9 too (publish-queue.md, file 11 and step 5).
    (MODULES + '05-semantic-linking.md',
     [('### 4.7.', '### 4.7-ب', None), ('### 4.8.', None, None)], False),
)


# The intake facts the queue settles before its pack, as in a page publication. A queue
# item is never LiteCast or a Challenge, so module 08 is cut exactly as the normal route
# cuts it for a non-LiteCast, non-Challenge page; modules 02 and 10 also need the category.
QUEUE_CATEGORIES = {'sharehub': 'sharehub', 'notecast': 'notecast', 'insight': 'insight',
                    'chairside': 'chairside', 'metanote': 'metanotes', 'metanotes': 'metanotes'}
QUEUE_ROUTE_CUT = {'02-routing-intake.md', '08-des-fidelity.md', '10-brain-and-pathways.md'}


def intersect(spans_a, spans_b):
    out = []
    for a0, a1 in spans_a:
        for b0, b1 in spans_b:
            lo, hi = max(a0, b0), min(a1, b1)
            if lo < hi:
                out.append((lo, hi))
    return out


def queue_prep_spans(lines, segments):
    spans = []
    for start_marker, end_marker, required_inside in segments:
        start = boundary(lines, start_marker)
        if end_marker is None:
            end = len(lines)
        elif end_marker is NEXT_HEADING:
            end = next((i for i in range(start + 1, len(lines))
                        if lines[i].startswith('#')), len(lines))
        else:
            end = boundary(lines, end_marker)
        if end <= start:
            raise UnsafeSelection(f'SECTION_END_BEFORE_START: {start_marker!r} -> {end_marker!r}')
        if required_inside is not None and not start < boundary(lines, required_inside) < end:
            raise UnsafeSelection(f'SECTION_BLOCK_TRUNCATED: {required_inside!r}')
        spans.append((start, end))
    return include(spans, len(lines))


def build_queue_prep(root, *, attached_paper, category='unknown', des_basket='unknown',
                     isolated_call='unknown', sources='unknown'):
    """Assemble the queue-preparation reading list; any unsafe marker blocks all."""
    if attached_paper not in ('yes', 'no'):
        raise UnsafeSelection('QUEUE_PREP_NEEDS_LOCKED_PAPER_ANSWER')
    if category != 'unknown' and category not in QUEUE_CATEGORIES:
        raise UnsafeSelection('CATEGORY_UNSUPPORTED:' + str(category))
    root = Path(root).resolve(strict=True)
    manifest = {
        'schema': 'dentcast_publish_readpack_v1',
        'mode': 'queue-prep',
        'classification': {'attached_paper': attached_paper, 'category': category,
                           'des_basket': des_basket, 'isolated_call': isolated_call,
                           'sources': sources},
        'contract': 'READING_SELECTION_ONLY_NOT_SCIENTIFIC_APPROVAL',
        'not_included': [WORKFLOW + 'publish-queue.md (read first, separately)'],
        'source_paths': [],
        'segments': [],
        'uncovered_if_unverified': [
            'This list mirrors «فهرست خواندن» in publish-queue.md; that table is authoritative.',
            'A task needing a module outside this list reads that whole module and says why.',
            'Read complete cited specialty workflows and scientific prompt files as required.',
        ],
    }
    pieces = []
    raw_total = selected_total = 0
    for path, segments, paper_only in QUEUE_PREP:
        if paper_only and attached_paper == 'no':
            manifest['source_paths'].append({'path': path, 'selected_bytes': 0,
                                             'selection_reason': 'NO_ATTACHED_PAPER',
                                             'line_ranges_inclusive': []})
            continue
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
        blob = git_blob_id(raw)
        # A whole-file read omits nothing, so only sliced files consult pins.
        drift = (segments is not None and name in PINNED_BLOBS
                 and blob != PINNED_BLOBS[name])
        lines = decoded.splitlines(keepends=True)
        if segments is None:
            spans, reason = [(0, len(lines))], 'FULL_REQUIRED'
        elif drift:
            # Same discipline as the normal route: a changed pinned source is read whole.
            spans, reason = [(0, len(lines))], 'SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP'
        else:
            spans, reason = queue_prep_spans(lines, segments), 'QUEUE_PREP_LISTED_SECTIONS'
            if name in QUEUE_ROUTE_CUT:
                # The same cuts as a page publication with the same facts. Module 08 needs no
                # category (a queue item is never LiteCast or a Challenge); 02 and 10 do.
                if name == '08-des-fidelity.md':
                    route_cat = QUEUE_CATEGORIES.get(category, 'sharehub')
                else:
                    route_cat = QUEUE_CATEGORIES.get(category, 'unknown')
                kept, why = route_spans(name, lines, category=route_cat, attached_paper=attached_paper,
                                        challenge='no', des_basket=des_basket,
                                        isolated_call=isolated_call, sources=sources)
                if why != 'FULL_REQUIRED' and not why.startswith('UNLOCKED'):
                    spans = include(intersect(spans, kept), len(lines))
                    reason += '+' + why
        selected_total_file = 0
        pieces.append(f'\n\n=== BEGIN SOURCE {path} SHA256 {sha256(raw)} ===\n')
        for a, b in spans:
            segment = ''.join(lines[a:b])
            segment_bytes = segment.encode('utf-8')
            if segment_bytes not in raw:
                raise UnsafeSelection('SOURCE_EXTRACTION_MISMATCH:' + path)
            selected_total_file += len(segment_bytes)
            manifest['segments'].append({
                'path': path, 'start_line': a + 1, 'end_line': b,
                'sha256': sha256(segment_bytes), 'bytes': len(segment_bytes),
                'git_blob_sha1': blob, 'attached_paper': attached_paper,
                'drift': drift, 'selection_reason': reason,
            })
            pieces.append(f'--- SOURCE LINES {a + 1}-{b} ---\n')
            pieces.append(segment)
            if not lines[b - 1].endswith('\n'):
                pieces.append('\n')
        pieces.append(f'=== END SOURCE {path} ===\n')
        selected = ''.join(''.join(lines[a:b]) for a, b in spans).encode('utf-8')
        raw_total += len(raw)
        selected_total += selected_total_file
        manifest['source_paths'].append({
            'path': path, 'git_blob_sha1': blob, 'source_sha256': sha256(raw),
            'source_bytes': len(raw), 'selected_bytes': len(selected),
            'selection_reason': reason, 'drift': drift,
            'line_ranges_inclusive': [[a + 1, b] for a, b in spans],
            'selected_sha256': sha256(selected),
        })
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
    p.add_argument('--queue-prep', action='store_true',
                   help='queue preparation reading list (publish-queue.md); needs --attached-paper and '
                        'takes --category, --des-basket, --isolated-call and --sources as a publication does')
    p.add_argument('--category', help='locked Phase B category; unknown means full files')
    p.add_argument('--attached-paper', choices=['yes', 'no', 'unknown'],
                   help='locked Phase B Q4.7; unknown retains complete modules')
    p.add_argument('--challenge', choices=['yes', 'no', 'unknown'],
                   help='locked Phase B Q4.9; unknown retains complete modules')
    p.add_argument('--des-basket', choices=['commentary', 'research', 'unknown'], default='unknown',
                   help='Question 4.8: commentary = the page\'s own text, no cited source (module 08 without the '
                        'FIDELITY parts); anything else keeps the whole module')
    p.add_argument('--after-intake', action='store_true',
                   help='omit routers + modules 01/02 already read in this same session')
    p.add_argument('--output', type=Path, required=True, help='temporary UTF-8 verbatim reading pack')
    p.add_argument('--isolated-call', choices=['yes', 'no', 'unknown'], default='unknown',
                   help='yes = the agent runs each DES/Fidelity call itself in a separate context and the founder '
                        'supplied no result (the relay and supplied-result paths are left out)')
    p.add_argument('--sources', choices=['one', 'many', 'unknown'], default='unknown',
                   help='one = the page cites exactly one source (the orphan sweep is left out)')
    p.add_argument('--manifest', type=Path, required=True, help='temporary provenance/coverage JSON')
    a = p.parse_args(argv)
    if a.queue_prep:
        if a.attached_paper not in ('yes', 'no'):
            p.error('--queue-prep requires --attached-paper yes|no')
        if a.challenge is not None or a.after_intake:
            p.error('--queue-prep does not take --challenge or --after-intake (a queue item is never a Challenge)')
        if a.category is not None and a.category not in QUEUE_CATEGORIES and a.category != 'unknown':
            p.error('--queue-prep takes only a queue category (sharehub, notecast, insight, chairside, '
                    'metanote): any other is CATEGORY_UNSUPPORTED and goes through the normal route')
    else:
        missing = [flag for flag, value in (('--category', a.category),
                                            ('--attached-paper', a.attached_paper),
                                            ('--challenge', a.challenge)) if value is None]
        if missing:
            p.error('the following arguments are required: ' + ', '.join(missing))
    if a.output.resolve() == a.manifest.resolve():
        p.error('--output and --manifest must differ')
    try:
        if a.queue_prep:
            pack, report = build_queue_prep(a.root, attached_paper=a.attached_paper,
                                            category=a.category or 'unknown', des_basket=a.des_basket,
                                            isolated_call=a.isolated_call, sources=a.sources)
        else:
            pack, report = build(a.root, category=a.category,
                                 attached_paper=a.attached_paper, challenge=a.challenge, des_basket=a.des_basket,
                                 isolated_call=a.isolated_call, sources=a.sources,
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
