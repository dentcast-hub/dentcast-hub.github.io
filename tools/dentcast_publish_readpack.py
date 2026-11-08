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

# These blobs were independently inspected at main c16554c (PR #971) and
# re-audited after the v2 checkpoint-preface update: only the always-kept
# preface changed; every boundary and omitted section is byte-identical.
# Re-audited 2026-10-26 (doc-contradiction fixes): 03 edits only the LiteCast
# branch it omits for non-LiteCast; 04 only the always-kept capsule table; 06
# only paper-branch text (omitted only without a paper); 12 only the kept
# Final output summary. No boundary heading changed.
# Re-audited 2026-10-28 (hashtag QA follow-up): 06 adds Part 2 step 8
# (paper reachability) inside the paper branch, which is omitted only without a
# paper; 12 edits only two rows of the always-kept Final output summary. No
# boundary heading changed; 01 and 10 are unpinned (always read whole).
# Re-audited 2026-10-28 (DES version history split, founder 1405/08/06): 08
# moves the Part 2 per-version notes to des-version-history.md and keeps a
# bounded summary inside Part 2. Its only selection boundary, the
# «Conditional path for founder-supplied results» heading, sits before Part 2
# and did not change.
# Re-audited 2026-10-29 (DES Persian text guard, founder 1405/08/07): 08 adds
# Part 3 item 6 after the Part 3 checks; the boundary heading sits before Part 2
# and did not change. LiteCast/challenge runs skip all of Part 3 anyway.
# Re-audited 2026-10-29 (DES prompt file): 08 adds two sentences to Part 2 naming
# des-v3.5-knowledge.md as the cut prompt; Part 2 is after the boundary.
# Re-audited 2026-10-29 (founder decision 1405/08/07, DES Persian text independent
# of the founder): 08 Part 3 item 6 is now an agent check, not a founder gate;
# the boundary heading is unchanged and no skipped section's applicability moved.
# Re-audited 2026-10-29 (founder 1405/08/07, one DES record per paper): 08 adds
# one sentence pair to Part 2b (episode and NoteCast share the paper's record;
# Fidelity only for the written page). It sits after the boundary heading and
# no skipped section's applicability moved.
# Re-audited for the wording-only history cleanup: no heading changed, every
# route selects the same sections for the same reasons (compared HEAD vs edit).
# Re-audited 2026-11-04 (queue retrospective): 08 adds two bounded blocks, the
# PDF source-text tool at the end of Part 1 and the single-source FIDELITY tier
# inside Part 2c; both sit after the «Conditional path for founder-supplied
# results» boundary, no heading changed and no skipped section's applicability
# moved (LiteCast/challenge still keep exactly the text before the boundary).
# Re-audited again: one bullet inside that Part 2c block was reworded (no orphan
# sweep for a single-source page); same location, no heading or boundary moved.
# Re-audited 2026-11-06 (founder 1405/08/15, sweep first on multi-source pages):
# 08 adds a bounded block inside Part 2c and rewrites Part 2c step 5; both sit
# after the «Conditional path for founder-supplied results» boundary. Checked
# against main: the boundary occurs once, the text before it is byte-identical
# and no heading changed, so LiteCast/challenge still keep exactly that text.
# Re-audited 2026-11-06 (founder 1405/08/15, stronger review settles a flagged
# unit): 08 rewrites Part 2c step 4, adds one sentence to Part 3b's opening and
# one clause to the publish-report paragraph; all three sit after the
# «Conditional path for founder-supplied results» boundary, which still occurs
# once with byte-identical text before it; no heading changed.
# Re-audited 2026-11-06 (founder: the direct route made simple, light and strong):
# modules 01-12 were deduplicated (2957 -> 1833 lines), every heading kept
# byte-identical, every selection boundary occurs exactly once, and module 08's
# only change before the «Conditional path for founder-supplied results»
# boundary is the shared two-line checkpoint banner; the DES/Fidelity text after
# it keeps the 2026-11-06 stronger-review amendment. Routes re-run for clinical,
# litecast, sharehub+paper, chairside+challenge, notecast, episode, promptologist
# and glossary and the queue-prep profile select the intended ranges. Re-pinned
# once more after the integration review (M1/M3b wording, Push-2 report, lead
# provenance timing); headings unchanged.
# Re-pinned again on 2026-11-06 after the plak1-12 run's findings: module 04's
# 4.6 gate (numbered series, not the Promptologist category — its heading keeps
# the '### 4.6. Promptologist series' prefix the boundary matches), module 03's
# chip rule, module 05's 4.8 candidate set, module 08's checklist-label
# sentence. Boundaries and every omitted section re-checked for each.
# Re-pinned 2026-11-07 (founder: cut 1 replaced by an unguarded save point):
# every module's always-kept banner (line 3) and ledger line (line 6) changed
# wording only; 03 changes one clause of the lead-provenance paragraph (C.4.9 ->
# C.6); 08 adds a «Save point» paragraph inside Part 3b, after the «Conditional
# path for founder-supplied results» boundary, which still occurs once with the
# text before it changed only in lines 3 and 6. No heading changed (compared
# HEAD vs edit for all twelve modules); LiteCast/Challenge skip C.4.13 and so
# correctly omit the new paragraph.
# Re-pinned 2026-11-07 (publish-queue item 24 fixes): 05 adds the related_cap.py
# counting sentence inside 4.7 Step 2 and 4.9 Step 2 (both kept by every route
# and by the queue-prep 4.7/4.8-to-end spans; the 4.7-ب/4.8 boundaries are
# unchanged); 08 adds sentences inside Part 1's pdf-source-text block, Part 2b's
# split paragraph and a Part 3b bullet («Figure captions added after the full
# run»), all after the «Conditional path for founder-supplied results» boundary,
# so LiteCast/Challenge still omit them. No heading changed in either module.
# Re-pinned 2026-11-07 (DES record guard, publish-queue item 22 / Elgamal 2025): 08 adds
# Part 1's «one DES record per paper» lookup block, Part 2's system-prompt run method,
# a new «#### Part 2d» rating-audit section before Part 3, Part 3 item (7) and a
# Verify & report sentence — all after the «Conditional path for founder-supplied
# results» boundary (unchanged, still once), so LiteCast/Challenge still omit them; the
# queue-prep pack reads module 08 whole. No other heading changed.
# Re-pinned 2026-11-07 (DES spec v3.6, 3b-ii «What addresses a domain»): 08 moves its
# prompt-file references from des-v3.5-knowledge.md to des-v3.6-knowledge.md, names 3.6
# as the current spec in Part 1, Part 2 and the des-version-history block, adds one
# sentence to Part 2's system-prompt block and one to Part 3(7). All after the
# «Conditional path for founder-supplied results» boundary (still once; the text before
# it is byte-identical to HEAD) and no heading changed, so LiteCast/Challenge still omit them.
# Re-pinned 2026-11-08 (section rename, founder 1405/08/17: Chairside → «ویزیت»,
# Clinical Insight → «نکات کلینیکی», Share Hub → «مرور منابع»): 04 changes one example
# in the numbered-series paragraph («Chairside 02 — …» → «ویزیت ۰۲ — …»). No heading
# moved and the §2.4–2.5 selection boundary is byte-identical.
# Editing one invalidates the routing proof. Update a pin ONLY after checking
# both the selection boundaries and every skipped section's applicability.
PINNED_BLOBS = {
    '03-litecast-and-page.md': 'e82aee946648f09d7ed130b7bcdd93b3fbc14694',
    '04-taxonomy-and-navigation.md': 'cc1de5f75d0787986afbb0218259ebaa3e4034ab',
    '05-semantic-linking.md': '6ba95d74e28f1e423e034d31327d6c9351f85c20',
    '06-paper-ingestion.md': '226ff4a756418788e70afa2a19e4484c1734dedb',
    '08-des-fidelity.md': 'c063cef49872920932db3a5e8b6f66af599ffe2f',
    '09-challenge.md': '3ac5856ddb021aa9f36cbfb35d6363531ae038c8',
    '11-build-and-version.md': '4dd05364ca5f9fd5811d7de39f172af14c592b13',
    '12-english-notify-verify.md': '5c9b65ee4416fd67607e6d35ca88272832ee86ec',
    '11-build-and-version.md': '4dd05364ca5f9fd5811d7de39f172af14c592b13',
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


def build(root, *, category, attached_paper, challenge, after_intake=False):
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


# Queue preparation route («فهرست خواندن» in publish-queue.md).
# publish-queue.md itself is read first and separately, so it is never packed.
# Each entry: (path, segments, paper_only). segments is None for the whole file,
# otherwise a list of (start_marker, end_marker, required_inside). end_marker
# None means end of file; NEXT_HEADING means the first Markdown heading after
# the start (end of file if none). required_inside, when set, must occur exactly
# once in the file and inside the slice, proving the whole block was kept.
NEXT_HEADING = object()
QUEUE_PREP = (
    (MODULES + '01-hard-rules.md', None, False),
    # Phase 0 through Question 5 is the whole module (Question 5 is its last heading).
    (MODULES + '02-routing-intake.md', None, False),
    (MODULES + '06-paper-ingestion.md',
     [('#### Part 1 — File the paper into Google Drive (correct topical subfolder)',
       '#### Part 2 —', None)], True),
    (MODULES + '08-des-fidelity.md', None, False),
    # Sections 5.0 (hashtags) and 5 (brain entry) are contiguous.
    (MODULES + '10-brain-and-pathways.md',
     [('### 5.0. Hashtag standardization', '### 5.5.', None)], False),
    # 4.11, 4.12 and 4.12-ب run to the end of the module.
    (MODULES + '07-flashcards-and-quiz.md', [('### 4.11.', None, None)], False),
    (WORKFLOW + 'en-version.md', None, False),
    (MODULES + '12-english-notify-verify.md', [('## Phase D', '## Phase E', None)], False),
    # The «Opening paragraph before any list» block has several paragraphs,
    # including the bold-lead «This lead paragraph is authored text» standing-acceptance
    # rule, and ends with the «To check a page you just built:» check. No
    # unrelated bold-lead paragraph follows it, so its end marker is the next
    # Markdown heading (today: none, i.e. end of file). The check sentence must
    # sit inside the slice, so a truncated block blocks instead of passing.
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


def build_queue_prep(root, *, attached_paper):
    """Assemble the queue-preparation reading list; any unsafe marker blocks all."""
    if attached_paper not in ('yes', 'no'):
        raise UnsafeSelection('QUEUE_PREP_NEEDS_LOCKED_PAPER_ANSWER')
    root = Path(root).resolve(strict=True)
    manifest = {
        'schema': 'dentcast_publish_readpack_v1',
        'mode': 'queue-prep',
        'classification': {'attached_paper': attached_paper},
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
                   help='queue preparation reading list (publish-queue.md); needs only --attached-paper')
    p.add_argument('--category', help='locked Phase B category; unknown means full files')
    p.add_argument('--attached-paper', choices=['yes', 'no', 'unknown'],
                   help='locked Phase B Q4.7; unknown retains complete modules')
    p.add_argument('--challenge', choices=['yes', 'no', 'unknown'],
                   help='locked Phase B Q4.9; unknown retains complete modules')
    p.add_argument('--after-intake', action='store_true',
                   help='omit routers + modules 01/02 already read in this same session')
    p.add_argument('--output', type=Path, required=True, help='temporary UTF-8 verbatim reading pack')
    p.add_argument('--manifest', type=Path, required=True, help='temporary provenance/coverage JSON')
    a = p.parse_args(argv)
    if a.queue_prep:
        if a.attached_paper not in ('yes', 'no'):
            p.error('--queue-prep requires --attached-paper yes|no')
        if a.category is not None or a.challenge is not None or a.after_intake:
            p.error('--queue-prep does not take --category, --challenge or --after-intake')
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
            pack, report = build_queue_prep(a.root, attached_paper=a.attached_paper)
        else:
            pack, report = build(a.root, category=a.category,
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
