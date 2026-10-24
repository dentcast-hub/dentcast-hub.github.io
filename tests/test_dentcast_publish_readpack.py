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
