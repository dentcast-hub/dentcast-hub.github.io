"""The CI checkpoint guard must fire for every living publication section."""
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / '.github/workflows/publishing-live-contract-tests.yml'
CLOSED = {'dentai', 'photocast'}  # module 02 Question 1: never offered


class CheckpointGuardPathTests(unittest.TestCase):
    def test_guard_regex_covers_every_living_brain_section(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        pattern = re.search(r"grep -Eq '(\^\([^']+\))'", text).group(1)
        brain = json.loads((ROOT / 'dentcast-brain.json').read_text(encoding='utf-8'))
        sections = set()
        for entry in brain:
            url = entry.get('page_url') or entry.get('url') or ''
            if entry.get('type') in CLOSED or not url.endswith('.html'):
                continue
            sections.add(url.lstrip('/').rsplit('/', 1)[0])
        self.assertIn('dentai/promptologist', sections)
        for section in sorted(sections):
            with self.subTest(section=section):
                self.assertRegex(section + '/new-page.html', pattern)


if __name__ == '__main__':
    unittest.main()
