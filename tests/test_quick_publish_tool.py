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


    # ---- review-round fixes -------------------------------------------------

    def snapshot(self):
        return {k: (self.repo / k).read_bytes() for k in ('dentcast-brain.json', 'quick-publish/ledger.json')}

    def test_guard_refuses_while_the_panel_is_switched_on_even_without_items(self):
        ledger = self.bucket / 'quick-publish' / 'ledger.json'
        ledger.write_text(json.dumps({'version': 1, 'panel_enabled': True, 'items': []}), encoding='utf-8')
        code, out = self.run_tool('guard', '--bucket-ledger', str(ledger))
        self.assertEqual(code, 1, out)
        self.assertIn('switched ON', out)
        self.assertIn('Switch it off', out)
        ledger.write_text(json.dumps({'version': 1, 'panel_enabled': False, 'items': []}), encoding='utf-8')
        code, out = self.run_tool('guard', '--bucket-ledger', str(ledger))
        self.assertEqual(code, 0, out)

    def test_import_refuses_ledger_paths_outside_what_the_api_can_write(self):
        good_media = 'quick-publish/media/20261101-abcd1234.jpg'
        cases = [
            dict(path='/../evil.html'), dict(path='/index.html'),
            dict(media=['index.html']), dict(media=['quick-publish/media/../../evil.jpg']),
            dict(landing={'file': 'index.html', 'href': 'insight-901.html', 'line': '<li><a href="insight-901.html">x</a></li>', 'order': 'top'}),
        ]
        for patch in cases:
            with self.subTest(patch=patch):
                it = dict(item(media=[good_media]), **patch)
                (self.bucket / 'insight' / 'insight-901.html').write_text('p', encoding='utf-8')
                (self.bucket / good_media).write_bytes(b'x')
                self.publish_to_bucket([it], [ENTRY])
                before = self.snapshot()
                code, out = self.run_tool('import', '--from-dir', str(self.bucket))
                self.assertNotEqual(code, 0, out)
                self.assertIn('refusing', out)
                self.assertEqual(self.snapshot(), before)
                self.assertFalse((self.repo / 'insight' / 'insight-901.html').exists())
                self.assertFalse((self.repo / 'evil.html').exists())
                self.assertFalse((self.repo / good_media).exists())

    def test_import_refuses_a_number_collision_with_a_different_page_in_git(self):
        (self.bucket / 'insight' / 'insight-901.html').write_text('from the bucket', encoding='utf-8')
        (self.repo / 'insight').mkdir()
        (self.repo / 'insight' / 'insight-901.html').write_text('already in git', encoding='utf-8')
        self.publish_to_bucket([item()], [ENTRY])
        before = self.snapshot()
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertNotEqual(code, 0, out)
        self.assertIn('same number', out)
        self.assertEqual((self.repo / 'insight' / 'insight-901.html').read_text(encoding='utf-8'), 'already in git')
        self.assertEqual(self.snapshot(), before)

    def test_import_will_not_overwrite_a_completed_item_with_a_newer_panel_edit(self):
        page = self.bucket / 'insight' / 'insight-901.html'
        page.write_text('v1', encoding='utf-8')
        self.publish_to_bucket([item()], [ENTRY])
        self.assertEqual(self.run_tool('import', '--from-dir', str(self.bucket))[0], 0)
        self.assertEqual(self.run_tool('complete', 'clinical-901')[0], 0)
        (self.repo / 'insight' / 'insight-901.html').write_text('workflow rewrote this', encoding='utf-8')
        edited = dict(ENTRY, title='ویرایش بعد از کامل شدن')
        page.write_text('v2', encoding='utf-8')
        self.publish_to_bucket([item(edited, updated='2026-11-03T09:00:00.000Z')], [edited])
        before = self.snapshot()
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertNotEqual(code, 0, out)
        self.assertIn('completed', out)
        self.assertEqual((self.repo / 'insight' / 'insight-901.html').read_text(encoding='utf-8'), 'workflow rewrote this')
        self.assertEqual(self.snapshot(), before)

    def test_landing_line_goes_into_gits_copy_with_its_crlf_and_is_replaced_in_place_on_edit(self):
        index = self.repo / 'insight' / 'index.html'
        index.parent.mkdir(exist_ok=True)
        index.write_bytes('<ul>\r\n    <li><a href="insight-899.html">old</a></li>\r\n    <li><a href="insight-900.html">top</a></li>\r\n'
                          '    <li><a href="insight-898.html">older</a></li>\r\n</ul>\r\n'.encode('utf-8'))
        (self.bucket / 'insight' / 'insight-901.html').write_text('v1', encoding='utf-8')
        landing = {'file': 'insight/index.html', 'href': 'insight-901.html', 'order': 'top',
                   'line': '<li><a href="insight-901.html">عنوان «تست»</a></li>'}
        self.publish_to_bucket([dict(item(), landing=landing)], [ENTRY])
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        # Directly above the highest-numbered neighbour (900), with its indent and CRLF.
        want = ('<ul>\r\n    <li><a href="insight-899.html">old</a></li>\r\n'
                '    <li><a href="insight-901.html">عنوان «تست»</a></li>\r\n'
                '    <li><a href="insight-900.html">top</a></li>\r\n'
                '    <li><a href="insight-898.html">older</a></li>\r\n</ul>\r\n')
        self.assertEqual(raw(index), want)

        edited = dict(ENTRY, title='عنوان تازه')
        landing2 = dict(landing, line='<li><a href="insight-901.html">عنوان تازه</a></li>')
        (self.bucket / 'insight' / 'insight-901.html').write_text('v2', encoding='utf-8')
        self.publish_to_bucket([dict(item(edited, updated='2026-11-01T09:00:00.000Z'), landing=landing2)], [edited])
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        self.assertEqual(raw(index), want.replace('عنوان «تست»', 'عنوان تازه'))

    PULSE_HREF = '/insight/insight-901.html'

    def pulse_of(self, title='عنوان «تست»'):
        return {'file': 'index.html', 'href': self.PULSE_HREF,
                'line': f'<li>یک اینسایت بالینی با عنوانِ «<a href="{self.PULSE_HREF}">{title}</a>» منتشر شد</li>'}

    def seed_home(self, eol='\n'):
        lis = ''.join(f'          <li><a href="/insight/insight-{n}.html">t{n}</a></li>{eol}' for n in range(800, 807))
        text = f'<html>{eol}<ul class="dc-pulse-list">{eol}{lis}{eol}</ul>{eol}</html>{eol}'
        (self.repo / 'index.html').write_bytes(text.encode('utf-8'))
        return text

    def test_pulse_line_goes_on_top_of_gits_homepage_list_and_the_bottom_one_leaves(self):
        before = self.seed_home()
        (self.bucket / 'insight' / 'insight-901.html').write_text('v1', encoding='utf-8')
        self.publish_to_bucket([dict(item(), pulse=self.pulse_of())], [ENTRY])
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        lis = [l for l in raw(self.repo / 'index.html').split('\n') if l.strip().startswith('<li>')]
        self.assertEqual(len(lis), 7)
        self.assertEqual(lis[0].strip(), self.pulse_of()['line'])
        self.assertEqual(lis[1:], [l for l in before.split('\n') if l.strip().startswith('<li>')][:6])
        # Importing again changes nothing; an edit replaces the line in place.
        again = raw(self.repo / 'index.html')
        self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(raw(self.repo / 'index.html'), again)
        edited = dict(ENTRY, title='عنوان تازه')
        (self.bucket / 'insight' / 'insight-901.html').write_text('v2', encoding='utf-8')
        self.publish_to_bucket([dict(item(edited, updated='2026-11-01T09:00:00.000Z'), pulse=self.pulse_of('عنوان تازه'))], [edited])
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertEqual(code, 0, out)
        out_text = raw(self.repo / 'index.html')
        self.assertEqual(out_text.count(self.PULSE_HREF), 1)
        self.assertEqual(out_text, again.replace('عنوان «تست»', 'عنوان تازه'))

    def test_pulse_keeps_crlf_and_matches_the_api_rule_byte_for_byte(self):
        self.seed_home('\r\n')
        text = raw(self.repo / 'index.html')
        placed = qp.apply_pulse(text, self.pulse_of(), True)
        self.assertEqual(placed.count('\n'), placed.count('\r\n'))
        # Same output as plus-api's applyPulse for the same input (the API rule is tested in quick-publish.test.ts
        # against this same repo homepage; here the same input goes through both implementations).
        js = ("import {applyPulse} from '/home/user/dentcast-hub.github.io/plus-api/src/services/quick-publish.js';"
              "import fs from 'node:fs';const t=fs.readFileSync(0,'utf8');"
              "process.stdout.write(applyPulse(t,JSON.parse(process.argv[2]),true));")
        if not (ROOT / 'plus-api' / 'node_modules' / '.bin' / 'tsx').exists():
            return  # the API's dev dependencies are not installed in this job; the API rule has its own tests
        (self.tmp / 'par.mts').write_text(js, encoding='utf-8')
        r = subprocess.run(['npx', 'tsx', str(self.tmp / 'par.mts'), json.dumps(self.pulse_of(), ensure_ascii=False)],
                           cwd=ROOT / 'plus-api', input=text.encode('utf-8'), capture_output=True)
        self.assertEqual(r.returncode, 0, r.stderr.decode('utf-8', 'replace')[-400:])
        self.assertEqual(r.stdout.decode('utf-8'), placed)

    def test_an_edit_of_a_page_that_rolled_off_the_pulse_changes_nothing(self):
        text = self.seed_home()
        self.assertEqual(qp.apply_pulse(text, self.pulse_of(), False), text)
        self.assertIsNone(qp.apply_pulse('<html></html>', self.pulse_of(), True))

    def test_import_refuses_a_pulse_line_that_is_not_what_the_api_writes(self):
        self.seed_home()
        (self.bucket / 'insight' / 'insight-901.html').write_text('v1', encoding='utf-8')
        for bad in [dict(self.pulse_of(), line='<li><script>x()</script></li>'),
                    dict(self.pulse_of(), file='../index.html'),
                    dict(self.pulse_of(), href='/insight/insight-1.html')]:
            self.publish_to_bucket([dict(item(), pulse=bad)], [ENTRY])
            before = raw(self.repo / 'index.html')
            code, out = self.run_tool('import', '--from-dir', str(self.bucket))
            self.assertNotEqual(code, 0, out)
            self.assertEqual(raw(self.repo / 'index.html'), before)

    def test_a_page_missing_on_the_bucket_is_a_clean_message_pointing_at_restore(self):
        self.publish_to_bucket([item()], [ENTRY])  # ledger lists it, the page file was never there / deleted
        before = self.snapshot()
        code, out = self.run_tool('import', '--from-dir', str(self.bucket))
        self.assertNotEqual(code, 0, out)
        self.assertIn('بازگرداندن', out)
        self.assertNotIn('Traceback', out)
        self.assertEqual(self.snapshot(), before)


class DeployLedgerGuardTest(unittest.TestCase):
    """The ledger block of deploy-frontend.sh, run against a fake `aws` on PATH."""

    @classmethod
    def block(cls) -> str:
        lines = (ROOT / 'deploy-frontend.sh').read_text(encoding='utf-8').split('\n')
        start = next(i for i, l in enumerate(lines) if l.startswith('QP_LEDGER="$(mktemp)"'))
        end = next(i for i, l in enumerate(lines) if i > start and l == 'rm -f "$QP_LEDGER"')
        return '\n'.join(lines[start:end + 1])

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        (self.tmp / 'tree' / 'quick-publish').mkdir(parents=True)
        shutil.copy(ROOT / 'quick-publish' / 'ledger.json', self.tmp / 'tree' / 'quick-publish' / 'ledger.json')
        (self.tmp / 'bin').mkdir()

    def fake_aws(self, script: str):
        path = self.tmp / 'bin' / 'aws'
        path.write_text('#!/bin/bash\n' + script, encoding='utf-8')
        path.chmod(0o755)

    def run_block(self, allow_missing=False):
        env = {'PATH': f"{self.tmp / 'bin'}:/usr/bin:/bin", 'TMPDIR': str(self.tmp / 'tree'),
               'ARVAN_BUCKET': 'bkt', 'ARVAN_ENDPOINT': 'https://example.invalid', 'HOME': str(self.tmp)}
        if allow_missing:
            env['QP_ALLOW_MISSING_LEDGER'] = '1'
        script = 'die(){ echo "DIE: $*"; exit 1; }\n' + self.block() + '\necho BLOCK-PASSED\n'
        p = subprocess.run(['bash', '-c', script], cwd=ROOT, env=env, capture_output=True, text=True, timeout=60)
        return p.returncode, p.stdout + p.stderr

    MISSING = 'echo "fatal error: An error occurred (404) when calling the HeadObject operation: Key quick-publish/ledger.json does not exist" >&2\nexit 1\n'

    def test_missing_bucket_ledger_stops_the_deploy(self):
        self.fake_aws(self.MISSING)
        code, out = self.run_block()
        self.assertNotEqual(code, 0, out)
        self.assertIn('missing from the bucket', out)
        self.assertNotIn('BLOCK-PASSED', out)

    def test_missing_bucket_ledger_passes_with_the_explicit_override(self):
        self.fake_aws(self.MISSING)
        code, out = self.run_block(allow_missing=True)
        self.assertEqual(code, 0, out)
        self.assertIn('BLOCK-PASSED', out)

    def test_other_read_errors_still_stop_even_with_the_override(self):
        self.fake_aws('echo "Could not connect to the endpoint URL" >&2\nexit 1\n')
        code, out = self.run_block(allow_missing=True)
        self.assertNotEqual(code, 0, out)
        self.assertIn('could not read the quick-publish ledger', out)

    def test_a_bucket_ledger_with_the_panel_switched_on_stops_the_deploy(self):
        self.fake_aws('printf \'{"version":1,"panel_enabled":true,"items":[]}\' > "$4"\n')
        code, out = self.run_block()
        self.assertNotEqual(code, 0, out)
        self.assertNotIn('BLOCK-PASSED', out)
        self.assertIn('DIE', out)

    def test_an_empty_switched_off_bucket_ledger_passes(self):
        self.fake_aws('printf \'{"version":1,"panel_enabled":false,"items":[]}\' > "$4"\n')
        code, out = self.run_block()
        self.assertEqual(code, 0, out)
        self.assertIn('BLOCK-PASSED', out)


if __name__ == '__main__':
    unittest.main()
