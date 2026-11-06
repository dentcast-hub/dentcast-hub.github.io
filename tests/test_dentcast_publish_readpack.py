"""No publishing, scoring, remote action, or approval occurs in these fixtures."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'tools/dentcast_publish_readpack.py'
spec = importlib.util.spec_from_file_location('dentcast_publish_readpack', SCRIPT)
rp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rp)

HEADINGS = {
    '03-litecast-and-page.md': '''<!-- dentcast-checkpoint-protocol:v1 -->
COMMON CHECKPOINT
<!-- /dentcast-checkpoint-protocol:v1 -->
### 0. LiteCast branch — isolated track (overrides the general steps)
LITE_ONLY
### 1. Template lock & hash
NORMAL_1
### 2. Build the new page
NORMAL_2
''',
    '04-taxonomy-and-navigation.md': '''GENERAL_TAXONOMY
### 4.5. Update parent episode's related content (NoteCast only)
NOTECAST_PARENT
### 4.5-ب. Shared evidence base — DES score and article credit mirror across the episode/NoteCast pair
EPISODE_SHARED
### 4.6. Promptologist series prev/next navigation (Promptologist only)
PROMPTOLOGIST_ONLY
''',
    '05-semantic-linking.md': '''### 4.7. Semantic glossary back-linking
GENERAL_GLOSSARY_LINK
### 4.7-ب. Cross-link the new TERM into existing bodies (glossary publishes only)
GLOSSARY_ONLY
### 4.8. Suggest in-article internal links
GENERAL_IN_ARTICLE
### 4.9. Semantic "کاوش بیشتر" links
GENERAL_RELATED
''',
    '06-paper-ingestion.md': 'ATTACHED_PAPER_ONLY\n',
    '08-des-fidelity.md': '''COMMON DES HEADER
### 4.13. DES — DentCast Evidence Score (run or consume the record)
CANONICAL EXEMPTION INTAKE
#### Conditional path for founder-supplied results (independent DES and Fidelity tracks)
DES_SCORE_AND_FIDELITY_WORK
''',
    '09-challenge.md': 'CHALLENGE_ONLY\n',
    '12-english-notify-verify.md': '''COMMON ENGLISH HEADER
## Phase D — English mirror & language toggle (MANDATORY; Hard Rule 12)
CANONICAL_LITECAST_CHALLENGE_SKIP
**Steps:**
ENGLISH_IMPLEMENTATION
## Phase E — Mark the page for the new-article push
NOTIFY
## Phase F — The mechanical gate
FINAL_VERIFICATION
''',
}

class ReadpackTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        blobs = {}
        for path in rp.REQUIRED:
            full = self.root / path
            full.parent.mkdir(parents=True, exist_ok=True)
            body = HEADINGS.get(full.name, f'FULL_SOURCE:{path}\n').encode()
            full.write_bytes(body)
            if full.name in rp.PINNED_BLOBS:
                blobs[full.name] = rp.git_blob_id(body)
        self.pins = patch.object(rp, 'PINNED_BLOBS', blobs)
        self.pins.start()
        self.addCleanup(self.pins.stop)

    def pack(self, category='sharehub', paper='no', challenge='no'):
        return rp.build(self.root, category=category, attached_paper=paper, challenge=challenge)

    def get(self, manifest, module):
        return next(p for p in manifest['source_paths'] if p['path'].endswith(module))

    def test_normal_publication_omits_only_known_inapplicable_blocks(self):
        content, m = self.pack()
        self.assertIn('NORMAL_1', content)
        self.assertNotIn('LITE_ONLY', content)
        self.assertNotIn('NOTECAST_PARENT', content)
        self.assertNotIn('EPISODE_SHARED', content)
        self.assertNotIn('PROMPTOLOGIST_ONLY', content)
        self.assertNotIn('GLOSSARY_ONLY', content)
        self.assertNotIn('ATTACHED_PAPER_ONLY', content)
        self.assertNotIn('CHALLENGE_ONLY', content)
        self.assertIn('DES_SCORE_AND_FIDELITY_WORK', content)
        self.assertIn('ENGLISH_IMPLEMENTATION', content)
        self.assertIn('FULL_SOURCE:.dentcast/workflows/agent-parity.md', content)
        self.assertGreater(m['bytes_saved'], 0)

    def test_note_and_episode_keep_shared_rules_but_parent_only_for_note(self):
        note, _ = self.pack(category='notecast')
        episode, _ = self.pack(category='episode')
        self.assertIn('NOTECAST_PARENT', note)
        self.assertIn('EPISODE_SHARED', note)
        self.assertNotIn('NOTECAST_PARENT', episode)
        self.assertIn('EPISODE_SHARED', episode)

    def test_broad_legacy_type_keeps_all_navigation_exceptions(self):
        text, manifest = self.pack(category='dentcast')
        self.assertIn('NOTECAST_PARENT', text)
        self.assertIn('EPISODE_SHARED', text)
        self.assertIn('PROMPTOLOGIST_ONLY', text)
        self.assertEqual(self.get(manifest, '04-taxonomy-and-navigation.md')['selection_reason'],
                         'AMBIGUOUS_CATEGORY_KEEP_ALL_NAVIGATION_BRANCHES')

    def test_handoff_category_values_and_typed_names_never_fall_back_to_full(self):
        # The handoff stores the brain type; init/bind accept typed names.
        known = {'meta': 'metanotes', 'Insight': 'clinical', 'اینسایت': 'clinical',
                 'dentcast_plus': 'dentcast-plus', 'دنتکست+': 'dentcast-plus',
                 'متانوت': 'metanotes', 'لایت‌کست': 'litecast', 'نوت‌کست': 'notecast',
                 'پرامپتولوژیست': 'promptologist', 'دانشنامه': 'glossary'}
        for typed, same_as in known.items():
            with self.subTest(typed=typed):
                text, m = self.pack(category=typed)
                expected, _ = self.pack(category=same_as)
                self.assertEqual(text, expected)
                self.assertNotEqual(self.get(m, '06-paper-ingestion.md')['selection_reason'],
                                    'UNLOCKED_OR_UNKNOWN_INTAKE_FULL_SOURCE')
        for typed in ('plak_sefr', 'پلاک صفر', 'taraz', 'تراز', 'اپیزود'):
            with self.subTest(typed=typed):
                text, m = self.pack(category=typed)
                self.assertNotIn('ATTACHED_PAPER_ONLY', text)
                # Unmodeled navigation stays complete rather than guessed.
                self.assertIn('NOTECAST_PARENT', text)
                self.assertIn('PROMPTOLOGIST_ONLY', text)
        self.assertEqual(self.pack(category='episode')[0], self.pack(category='Episode')[0])

    def test_glossary_keeps_glossary_only_scans(self):
        text, _ = self.pack(category='glossary')
        self.assertIn('GLOSSARY_ONLY', text)

    def test_promptologist_keeps_series_navigation(self):
        text, _ = self.pack(category='promptologist')
        self.assertIn('PROMPTOLOGIST_ONLY', text)

    def test_paper_attached_keeps_its_module(self):
        text, _ = self.pack(paper='yes')
        self.assertIn('ATTACHED_PAPER_ONLY', text)

    def test_challenge_keeps_challenge_rules_and_skips_des_calls_english(self):
        text, _ = self.pack(challenge='yes')
        self.assertIn('CHALLENGE_ONLY', text)
        self.assertIn('CANONICAL EXEMPTION INTAKE', text)
        self.assertNotIn('DES_SCORE_AND_FIDELITY_WORK', text)
        self.assertIn('CANONICAL_LITECAST_CHALLENGE_SKIP', text)
        self.assertNotIn('ENGLISH_IMPLEMENTATION', text)
        self.assertIn('FINAL_VERIFICATION', text)

    def test_litecast_keeps_its_branch_and_final_gate(self):
        text, _ = self.pack(category='litecast')
        self.assertIn('LITE_ONLY', text)
        self.assertIn('CANONICAL EXEMPTION INTAKE', text)
        self.assertNotIn('DES_SCORE_AND_FIDELITY_WORK', text)
        self.assertIn('FINAL_VERIFICATION', text)
        self.assertNotIn('ENGLISH_IMPLEMENTATION', text)

    def test_unknown_intake_keeps_all_source_bytes(self):
        for args in [dict(category='unknown'), dict(paper='unknown'),
                     dict(challenge='unknown')]:
            text, m = self.pack(**args)
            for word in ('LITE_ONLY', 'ATTACHED_PAPER_ONLY', 'CHALLENGE_ONLY',
                         'DES_SCORE_AND_FIDELITY_WORK', 'ENGLISH_IMPLEMENTATION'):
                self.assertIn(word, text)
            self.assertEqual(m['bytes_saved'], 0)

    def test_after_intake_reuses_six_completely_read_sources(self):
        text, m = rp.build(self.root, category='sharehub', attached_paper='no',
                           challenge='no', after_intake=True)
        self.assertEqual(m['already_loaded_required'], rp.REQUIRED[:6])
        self.assertNotIn('FULL_SOURCE:.dentcast/workflows/agent-parity.md', text)
        self.assertIn('NORMAL_1', text)
        self.assertEqual(sum(r['selected_bytes'] for r in m['source_paths'][:6]), 0)

    def test_source_drift_falls_back_to_full_instead_of_silent_omit(self):
        path = self.root / rp.MODULES / '09-challenge.md'
        path.write_text('NEW CONDITION THAT MAY APPLY TO ALL PAGES\n')
        content, m = self.pack()
        self.assertIn('NEW CONDITION THAT MAY APPLY TO ALL PAGES', content)
        self.assertEqual(self.get(m, '09-challenge.md')['selection_reason'],
                         'SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP')

    def test_missing_section_blocks_without_writing_any_output(self):
        path = self.root / rp.MODULES / '04-taxonomy-and-navigation.md'
        path.write_text('new unknown structure\n')
        # Force it to pass the pin check, proving missing anchors fail closed.
        rp.PINNED_BLOBS[path.name] = rp.git_blob_id(path.read_bytes())
        with self.assertRaisesRegex(rp.UnsafeSelection, 'SECTION_BOUNDARY_NOT_UNIQUE'):
            self.pack()

    def test_duplicated_heading_blocks(self):
        path = self.root / rp.MODULES / '05-semantic-linking.md'
        path.write_text(path.read_text() + '### 4.8. Suggest in-article internal links\n')
        rp.PINNED_BLOBS[path.name] = rp.git_blob_id(path.read_bytes())
        with self.assertRaisesRegex(rp.UnsafeSelection, 'SECTION_BOUNDARY_NOT_UNIQUE'):
            self.pack()

    def test_conflicting_locked_classification_blocks(self):
        with self.assertRaisesRegex(rp.UnsafeSelection, 'CONFLICTING_LITECAST_CHALLENGE'):
            self.pack(category='litecast', challenge='yes')

    def test_all_selected_segments_byte_equal_to_original(self):
        _, m = self.pack()
        for row in m['source_paths']:
            original = (self.root / row['path']).read_bytes()
            reconstructed = b''.join(b''.join(original.splitlines(keepends=True)[a-1:b])
                                     for a,b in row['line_ranges_inclusive'])
            self.assertEqual(rp.sha256(reconstructed), row['selected_sha256'])
            self.assertEqual(len(reconstructed), row['selected_bytes'])
            self.assertEqual(rp.sha256(original), row['source_sha256'])

    def test_cli_prepares_only_local_temp_files_no_publish_side_effect(self):
        out, manifest = self.root / 'readpack.txt', self.root / 'readpack.json'
        rc = rp.main(['--root', str(self.root), '--category', 'sharehub',
                      '--attached-paper', 'no', '--challenge', 'no',
                      '--output', str(out), '--manifest', str(manifest)])
        self.assertEqual(rc, 0)
        self.assertTrue(out.read_text())
        self.assertEqual(json.loads(manifest.read_text())['contract'],
                         'READING_SELECTION_ONLY_NOT_SCIENTIFIC_APPROVAL')


if __name__ == '__main__':
    unittest.main()


class LiveReadpackPinTests(unittest.TestCase):
    """The real modules must stay pinned, or every route silently reads everything."""

    def test_live_modules_match_their_audited_pins(self):
        root = SCRIPT.parents[1]
        for name, blob in rp.PINNED_BLOBS.items():
            with self.subTest(module=name):
                raw = (root / rp.MODULES / name).read_bytes()
                self.assertEqual(rp.git_blob_id(raw), blob,
                                 'module changed: re-audit its readpack boundaries and skipped sections, then re-pin')

    def test_live_routes_select_without_drift_fallback(self):
        root = SCRIPT.parents[1]
        for category, paper, challenge in (('clinical', 'no', 'no'), ('litecast', 'no', 'no'),
                                           ('sharehub', 'yes', 'no'), ('chairside', 'no', 'yes')):
            with self.subTest(category=category):
                _, m = rp.build(root, category=category, attached_paper=paper, challenge=challenge,
                                after_intake=True)
                reasons = {p['selection_reason'] for p in m['source_paths']}
                self.assertNotIn('SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP', reasons)
                self.assertGreater(m['bytes_saved'], 0)


QUEUE_FIXTURES = {
    'modules/01-hard-rules.md': 'HARD_RULES_ALL\n',
    'modules/02-routing-intake.md': '## Phase 0\nPHASE0\n### Question 5 — Pulse sentence\nQ5\n',
    'modules/06-paper-ingestion.md': (
        'PAPER_INTRO\n'
        '#### Part 1 — File the paper into Google Drive (correct topical subfolder)\n'
        'PAPER_PART1\n#### Part 2 — Enrich the catalog\nPAPER_PART2\n'),
    'modules/08-des-fidelity.md': (
        'DES_ALL\n#### Conditional path for founder-supplied results\nDES_REST\n'),
    'modules/10-brain-and-pathways.md': (
        'BRAIN_INTRO\n### 5.0. Hashtag standardization against the reference library\n'
        'HASHTAGS\n### 5. Brain entry\nBRAIN_ENTRY\n### 5.5. Verify the recorded pillar\n'
        'BRAIN_VERIFY\n'),
    # No trailing newline: the pack must still close the segment on its own line.
    'modules/07-flashcards-and-quiz.md': (
        'FLASH_INTRO\n### 4.11. Flashcards\nFLASHCARDS\n### 4.12. Quiz-ready FAQ\nFAQ\n'
        '### 4.12-ب. سؤال آزمون\nEXAM'),
    'en-version.md': 'EN_VERSION_ALL\n',
    'modules/12-english-notify-verify.md': (
        'EN_INTRO\n## Phase D — English mirror\nPHASE_D\n## Phase E — Mark the page\nPHASE_E\n'),
    'modules/03-litecast-and-page.md': (
        'PAGE_INTRO\n**E-NAMAD seal — never clone it.** SEAL\n\n'
        '**Opening paragraph before any list (body-structure requirement).** OPENING\n\n'
        '**This lead paragraph is authored text.** OPENING_APPROVAL\n\n'
        'To check a page you just built:\nOPENING_CHECK\n'),
    'modules/04-taxonomy-and-navigation.md': (
        'TAX_INTRO\n### 2.4. Semantic pillar\nPILLAR\n### 2.5. Capsule\nCAPSULE\n'),
    'modules/11-build-and-version.md': (
        'BUILD_INTRO\n### 6. Pulse update\nPULSE\n### 7. Bump\nBUMP\n'),
    'modules/05-semantic-linking.md': (
        'LINK_INTRO\n### 4.7. Semantic glossary back-linking\nGLOSSARY_LINK\n'
        '### 4.7-ب. Cross-link the new TERM\nGLOSSARY_ONLY\n'
        '### 4.8. Suggest in-article internal links\nIN_ARTICLE\n'
        '### 4.9. Semantic links\nRELATED\n'),
}


class QueuePrepTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.pins = patch.object(rp, 'PINNED_BLOBS', {})
        self.pins.start()
        self.addCleanup(self.pins.stop)
        for rel, body in QUEUE_FIXTURES.items():
            self.write(rel, body)
        (self.root / rp.WORKFLOW / 'publish-queue.md').write_text('QUEUE_FILE_ITSELF\n')

    def write(self, rel, body, pin=True):
        full = self.root / rp.WORKFLOW / rel
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(body.encode())
        if pin and full.name in ('03-litecast-and-page.md', '04-taxonomy-and-navigation.md',
                                 '05-semantic-linking.md', '06-paper-ingestion.md',
                                 '08-des-fidelity.md', '12-english-notify-verify.md'):
            rp.PINNED_BLOBS[full.name] = rp.git_blob_id(full.read_bytes())

    def pack(self, paper='yes'):
        return rp.build_queue_prep(self.root, attached_paper=paper)

    def test_paper_controls_module_06_part_1(self):
        with_paper, m = self.pack('yes')
        without, m2 = self.pack('no')
        self.assertIn('PAPER_PART1', with_paper)
        self.assertNotIn('PAPER_PART2', with_paper)
        self.assertNotIn('PAPER_INTRO', with_paper)
        self.assertNotIn('PAPER_PART1', without)
        self.assertEqual(m['mode'], 'queue-prep')
        self.assertEqual(m2['mode'], 'queue-prep')
        self.assertTrue(all(s['attached_paper'] == 'no' for s in m2['segments']))
        self.assertFalse(any(s['path'].endswith('06-paper-ingestion.md') for s in m2['segments']))
        self.assertTrue(any(s['path'].endswith('06-paper-ingestion.md') for s in m['segments']))

    def test_selects_exactly_the_listed_sections_in_order(self):
        text, m = self.pack()
        for kept in ('HARD_RULES_ALL', 'Q5', 'DES_REST', 'HASHTAGS', 'BRAIN_ENTRY',
                     'FLASHCARDS', 'FAQ', 'EXAM', 'EN_VERSION_ALL', 'PHASE_D', 'OPENING',
                     'OPENING_APPROVAL', 'OPENING_CHECK', 'PILLAR', 'PULSE',
                     'GLOSSARY_LINK', 'IN_ARTICLE'):
            self.assertIn(kept, text)
        for dropped in ('BRAIN_INTRO', 'BRAIN_VERIFY', 'FLASH_INTRO', 'EN_INTRO', 'PHASE_E',
                        'PAGE_INTRO', 'SEAL', 'TAX_INTRO', 'CAPSULE', 'BUILD_INTRO', 'BUMP',
                        'LINK_INTRO', 'GLOSSARY_ONLY', 'RELATED', 'QUEUE_FILE_ITSELF'):
            self.assertNotIn(dropped, text)
        order = [s['path'].rsplit('/', 1)[-1] for s in m['segments']]
        self.assertEqual(order, ['01-hard-rules.md', '02-routing-intake.md',
                                 '06-paper-ingestion.md', '08-des-fidelity.md',
                                 '10-brain-and-pathways.md', '07-flashcards-and-quiz.md',
                                 'en-version.md', '12-english-notify-verify.md',
                                 '03-litecast-and-page.md', '04-taxonomy-and-navigation.md',
                                 '11-build-and-version.md', '05-semantic-linking.md',
                                 '05-semantic-linking.md'])
        self.assertIn('EXAM\n=== END SOURCE', text)
        self.assertIn('=== BEGIN SOURCE .dentcast/workflows/modules/01-hard-rules.md SHA256 ', text)

    def test_all_selected_segments_byte_equal_to_original(self):
        for paper in ('yes', 'no'):
            text, m = self.pack(paper)
            for seg in m['segments']:
                original = (self.root / seg['path']).read_bytes()
                reconstructed = b''.join(
                    original.splitlines(keepends=True)[seg['start_line'] - 1:seg['end_line']])
                self.assertEqual(rp.sha256(reconstructed), seg['sha256'])
                self.assertEqual(len(reconstructed), seg['bytes'])
                self.assertEqual(rp.git_blob_id(original), seg['git_blob_sha1'])
                self.assertIn(reconstructed.decode(), text)
            for row in m['source_paths']:
                if not row['line_ranges_inclusive']:
                    continue
                original = (self.root / row['path']).read_bytes()
                reconstructed = b''.join(b''.join(original.splitlines(keepends=True)[a-1:b])
                                         for a, b in row['line_ranges_inclusive'])
                self.assertEqual(rp.sha256(reconstructed), row['selected_sha256'])
                self.assertEqual(rp.sha256(original), row['source_sha256'])

    def test_missing_marker_blocks_without_writing_output(self):
        self.write('modules/11-build-and-version.md', 'BUILD_INTRO\n### 7. Bump\n')
        out, manifest = self.root / 'qp.txt', self.root / 'qp.json'
        with patch('sys.stderr'):
            rc = rp.main(['--root', str(self.root), '--queue-prep', '--attached-paper', 'no',
                          '--output', str(out), '--manifest', str(manifest)])
        self.assertEqual(rc, 2)
        self.assertFalse(out.exists())
        self.assertFalse(manifest.exists())
        with self.assertRaisesRegex(rp.UnsafeSelection, 'SECTION_BOUNDARY_NOT_UNIQUE'):
            self.pack()

    def test_duplicated_marker_blocks(self):
        self.write('modules/04-taxonomy-and-navigation.md',
                   QUEUE_FIXTURES['modules/04-taxonomy-and-navigation.md'] + '### 2.4. again\n')
        with self.assertRaisesRegex(rp.UnsafeSelection, 'SECTION_BOUNDARY_NOT_UNIQUE'):
            self.pack()

    def test_end_marker_before_start_blocks(self):
        self.write('modules/10-brain-and-pathways.md',
                   '### 5.5. Verify\nX\n### 5.0. Hashtag standardization\nY\n')
        with self.assertRaisesRegex(rp.UnsafeSelection, 'SECTION_END_BEFORE_START'):
            self.pack()

    def test_truncated_opening_paragraph_block_blocks(self):
        body = QUEUE_FIXTURES['modules/03-litecast-and-page.md'].replace(
            'To check', '### 9. New heading\nTo check')
        self.write('modules/03-litecast-and-page.md', body)
        with self.assertRaisesRegex(rp.UnsafeSelection, 'SECTION_BLOCK_TRUNCATED'):
            self.pack()

    def test_missing_paper_module_blocks_only_when_paper_attached(self):
        (self.root / rp.MODULES / '06-paper-ingestion.md').unlink()
        self.pack('no')
        with self.assertRaisesRegex(rp.UnsafeSelection, 'REQUIRED_SOURCE_MISSING'):
            self.pack('yes')

    def test_pinned_drift_falls_back_to_whole_file(self):
        rp.PINNED_BLOBS['04-taxonomy-and-navigation.md'] = '0' * 40
        text, m = self.pack()
        self.assertIn('CAPSULE', text)
        seg = next(s for s in m['segments'] if s['path'].endswith('04-taxonomy-and-navigation.md'))
        self.assertTrue(seg['drift'])
        self.assertEqual(seg['selection_reason'], 'SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP')
        # A whole-file read omits nothing, so its pin cannot cause drift.
        rp.PINNED_BLOBS['08-des-fidelity.md'] = '0' * 40
        _, m = self.pack()
        seg = next(s for s in m['segments'] if s['path'].endswith('08-des-fidelity.md'))
        self.assertFalse(seg['drift'])

    def test_cli_argument_validation(self):
        out, manifest = self.root / 'qp.txt', self.root / 'qp.json'
        base = ['--root', str(self.root), '--output', str(out), '--manifest', str(manifest)]
        for argv in (['--queue-prep'], ['--queue-prep', '--attached-paper', 'unknown'],
                     ['--queue-prep', '--attached-paper', 'no', '--category', 'clinical'],
                     ['--queue-prep', '--attached-paper', 'no', '--challenge', 'no'],
                     ['--attached-paper', 'no', '--challenge', 'no'],
                     ['--category', 'clinical', '--challenge', 'no'],
                     ['--category', 'clinical', '--attached-paper', 'no']):
            with self.subTest(argv=argv), patch('sys.stderr'):
                with self.assertRaises(SystemExit) as ctx:
                    rp.main(base + argv)
                self.assertEqual(ctx.exception.code, 2)
        self.assertFalse(out.exists())
        with patch('sys.stdout'):
            rc = rp.main(base + ['--queue-prep', '--attached-paper', 'yes'])
        self.assertEqual(rc, 0)
        self.assertIn('PAPER_PART1', out.read_text())
        self.assertEqual(json.loads(manifest.read_text())['mode'], 'queue-prep')


class LiveQueuePrepTests(unittest.TestCase):
    def test_live_queue_prep_builds_without_drift(self):
        root = SCRIPT.parents[1]
        for paper in ('yes', 'no'):
            with self.subTest(paper=paper):
                text, m = rp.build_queue_prep(root, attached_paper=paper)
                self.assertFalse(any(s['drift'] for s in m['segments']))
                self.assertNotIn('SOURCE_CHANGED_FULL_FALLBACK_REAUDIT_MAP',
                                 {s['selection_reason'] for s in m['segments']})
                self.assertGreater(m['bytes_saved'], 0)
                self.assertIn('**Opening paragraph before any list', text)
                self.assertIn('To check a page you just built:', text)
                self.assertEqual('#### Part 1 — File the paper' in text, paper == 'yes')
