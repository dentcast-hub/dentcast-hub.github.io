"""tools/quick_publish.py — the git side of /admin «انتشار حداقلی».

Runs the importer against a fake bucket directory and a throwaway repo root, and
checks the deploy guard both ways. Owner doc: .dentcast/quick-publish.md
"""
import importlib.util
import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('quick_publish', ROOT / 'tools' / 'quick_publish.py')
qp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qp)

ENTRY = {'type': 'clinical', 'id': 'clinical-901', 'title': 'عنوان «تست»', 'caption': 'کپشن', 'hashtags': [], 'keywords': [],
         'page_url': '/insight/insight-901.html', 'pillar': {'primary': None, 'secondary': [], 'subtopic': None}}


def item(entry=ENTRY, updated='2026-11-01T08:00:00.000Z', media=()):
    return {'id': entry['id'], 'type': entry['type'], 'n': 901, 'path': entry['page_url'], 'title': entry['title'],
            'caption': entry['caption'], 'date': '2026-11-01', 'media': list(media), 'brain_entry': entry,
            'created_at': '2026-11-01T08:00:00.000Z', 'updated_at': updated, 'state': 'live',
            'imported_at': None, 'completed_at': None}


def raw(path: Path) -> str:
    """Text with its line endings as stored (the brain is CRLF in git)."""
    return path.read_bytes().decode('utf-8')


class QuickPublishToolTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.repo = self.tmp / 'repo'
        self.bucket = self.tmp / 'bucket'
        (self.repo / 'quick-publish').mkdir(parents=True)
        shutil.copy(ROOT / 'dentcast-brain.json', self.repo / 'dentcast-brain.json')
        shutil.copy(ROOT / 'quick-publish' / 'ledger.json', self.repo / 'quick-publish' / 'ledger.json')
        (self.bucket / 'insight').mkdir(parents=True)
        (self.bucket / 'quick-publish' / 'media').mkdir(parents=True)
        self._root = qp.ROOT
        qp.ROOT = self.repo

    def tearDown(self):
        qp.ROOT = self._root
        shutil.rmtree(self.tmp)

    def run_tool(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            try:
                code = qp.main(list(argv))
            except SystemExit as e:
                code = e.code if isinstance(e.code, int) else 1
                err.write(str(e.code))
        return code, out.getvalue() + err.getvalue()

    def publish_to_bucket(self, items, brain_entries=()):
        brain = raw(ROOT / 'dentcast-brain.json')
        for e in brain_entries:
            brain = qp.append_entry(brain, e)
        (self.bucket / 'dentcast-brain.json').write_bytes(brain.encode('utf-8'))
        (self.bucket / 'quick-publish' / 'ledger.json').write_text(json.dumps({'version': 1, 'items': items}), encoding='utf-8')

    def test_entry_serialisation_matches_the_api(self):
        js = "const e=JSON.parse(process.argv[1]);process.stdout.write(JSON.stringify(e,null,2).split('\\n').map(l=>'  '+l).join('\\n'))"
        node = subprocess.run(['node', '-e', js, json.dumps(ENTRY, ensure_ascii=False)], capture_output=True, text=True)
        self.assertEqual(node.returncode, 0, node.stderr)
        self.assertEqual(qp.serialise_entry(ENTRY), node.stdout)

    def test_import_brings_page_image_and_brain_tail_into_git(self):
        media = 'quick-publish/media/20261101-abcd1234.jpg'
        (self.bucket / 'insight' / 'insight-901.html').write_text('<html>page</html>', encoding='utf-8')
        (self.bucket / media).write_bytes(b'\xff\xd8\xffjpeg')
        self.publish_to_bucket([item(media=[media])], [ENTRY])
        before = raw(self.repo / 'dentcast-brain.json')

        code, out = self.run_tool('guard', '--bucket-ledger', str(self.bucket / 'quick-publish' / 'ledger.json'))
        self.assertEqual(code, 1, out)
        self.assertIn('clinical-901', out)

        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        self.assertEqual((self.repo / 'insight' / 'insight-901.html').read_text(encoding='utf-8'), '<html>page</html>')
        self.assertEqual((self.repo / media).read_bytes(), b'\xff\xd8\xffjpeg')
        after = raw(self.repo / 'dentcast-brain.json')
        # Only the tail changes, in the file's own CRLF — no whole-file line-ending rewrite.
        self.assertTrue(before.endswith('\r\n'))
        self.assertTrue(after.startswith(before[:before.rindex(']')].rstrip() + ',\r\n'))
        self.assertEqual(after.count('\n') - after.count('\r\n'), before.count('\n') - before.count('\r\n'))
        self.assertEqual(json.loads(after)[-1], ENTRY)
        # The bucket's brain (API-written) and git's (tool-written) are byte-identical.
        self.assertEqual(after, raw(self.bucket / 'dentcast-brain.json'))
        ledger = json.loads((self.repo / 'quick-publish' / 'ledger.json').read_text(encoding='utf-8'))
        self.assertEqual([(i['id'], i['state']) for i in ledger['items']], [('clinical-901', 'imported')])

        code, out = self.run_tool('guard', '--bucket-ledger', str(self.bucket / 'quick-publish' / 'ledger.json'))
        self.assertEqual(code, 0, out)
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertIn('nothing to import', out)
        self.assertEqual(json.loads((self.repo / 'dentcast-brain.json').read_text(encoding='utf-8'))[-1], ENTRY)
        self.assertEqual(len(json.loads((self.repo / 'dentcast-brain.json').read_text(encoding='utf-8'))), len(json.loads(before)) + 1)

    def test_a_later_edit_on_the_panel_reopens_the_guard_and_reimports_in_place(self):
        (self.bucket / 'insight' / 'insight-901.html').write_text('v1', encoding='utf-8')
        self.publish_to_bucket([item()], [ENTRY])
        self.run_tool('import', '--from-dir', str(self.bucket))
        edited = dict(ENTRY, title='عنوان تازه')
        (self.bucket / 'insight' / 'insight-901.html').write_text('v2', encoding='utf-8')
        self.publish_to_bucket([item(edited, updated='2026-11-01T09:00:00.000Z')], [edited])
        code, _ = self.run_tool('guard', '--bucket-ledger', str(self.bucket / 'quick-publish' / 'ledger.json'))
        self.assertEqual(code, 1)
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        brain = json.loads((self.repo / 'dentcast-brain.json').read_text(encoding='utf-8'))
        self.assertEqual([e['title'] for e in brain if e.get('id') == 'clinical-901'], ['عنوان تازه'])
        self.assertEqual((self.repo / 'insight' / 'insight-901.html').read_text(encoding='utf-8'), 'v2')

    def test_guard_passes_without_a_bucket_ledger_and_complete_needs_an_import(self):
        code, _ = self.run_tool('guard', '--bucket-ledger', str(self.tmp / 'absent.json'))
        self.assertEqual(code, 0)
        (self.bucket / 'insight' / 'insight-901.html').write_text('p', encoding='utf-8')
        self.publish_to_bucket([item()], [ENTRY])
        code, out = self.run_tool('complete', 'clinical-901')
        self.assertNotEqual(code, 0, out)
        self.run_tool('import', '--from-dir', str(self.bucket))
        code, out = self.run_tool('complete', 'clinical-901')
        self.assertEqual(code, 0, out)
        ledger = json.loads((self.repo / 'quick-publish' / 'ledger.json').read_text(encoding='utf-8'))
        self.assertEqual(ledger['items'][0]['state'], 'completed')
        # A completed item is still in git, so the guard stays green.
        code, _ = self.run_tool('guard', '--bucket-ledger', str(self.bucket / 'quick-publish' / 'ledger.json'))
        self.assertEqual(code, 0)

    def test_a_workflow_pick_reopens_the_guard_and_import_carries_only_the_flag(self):
        page = self.bucket / 'insight' / 'insight-901.html'
        page.write_text('v1', encoding='utf-8')
        self.publish_to_bucket([item()], [ENTRY])
        self.run_tool('import', '--from-dir', str(self.bucket))
        bucket_ledger = self.bucket / 'quick-publish' / 'ledger.json'
        code, out = self.run_tool('requested')
        self.assertNotIn('clinical-901', out)

        picked = item()
        picked['workflow_requested_at'] = '2026-11-02T10:00:00.000Z'
        self.publish_to_bucket([picked], [ENTRY])
        code, out = self.run_tool('guard', '--bucket-ledger', str(bucket_ledger))
        self.assertEqual(code, 1, out)
        page.unlink()  # content unchanged, so the page must not be fetched again
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        self.assertEqual((self.repo / 'insight' / 'insight-901.html').read_text(encoding='utf-8'), 'v1')
        ledger = json.loads((self.repo / 'quick-publish' / 'ledger.json').read_text(encoding='utf-8'))
        self.assertEqual(ledger['items'][0]['workflow_requested_at'], '2026-11-02T10:00:00.000Z')
        self.assertEqual(ledger['items'][0]['state'], 'imported')
        code, out = self.run_tool('guard', '--bucket-ledger', str(bucket_ledger))
        self.assertEqual(code, 0, out)
        code, out = self.run_tool('requested')
        self.assertEqual(code, 0, out)
        self.assertIn('clinical-901', out)

    def test_a_completed_item_stays_completed_when_its_flag_is_withdrawn(self):
        (self.bucket / 'insight' / 'insight-901.html').write_text('v1', encoding='utf-8')
        picked = item()
        picked['workflow_requested_at'] = '2026-11-02T10:00:00.000Z'
        self.publish_to_bucket([picked], [ENTRY])
        self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(self.run_tool('complete', 'clinical-901')[0], 0)
        self.publish_to_bucket([item()], [ENTRY])  # flag withdrawn on the panel
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        ledger = json.loads((self.repo / 'quick-publish' / 'ledger.json').read_text(encoding='utf-8'))
        self.assertEqual(ledger['items'][0]['state'], 'completed')
        self.assertNotIn('clinical-901', self.run_tool('requested')[1])


if __name__ == '__main__':
    unittest.main()
