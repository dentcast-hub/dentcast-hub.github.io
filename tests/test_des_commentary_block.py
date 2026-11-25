"""The Step 0 block of a page scored on its own text is built by the tool and names the
page's section, so checklist item 4 can be earned from the section's declaration."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import des_commentary_block as blk  # noqa: E402
import verify_publish as vp  # noqa: E402


class CommentaryBlockTests(unittest.TestCase):
    def test_block_names_the_section_and_carries_the_page_text(self):
        b = blk.build('chairside/chairside-56')
        self.assertEqual((b['doi'], b['text_basis']), ('', 'FULL_TEXT'))
        self.assertEqual(b['metadata']['section'], 'chairside/')
        self.assertEqual(b['metadata']['section_landing_page'], 'chairside/index.html')
        self.assertTrue(b['metadata']['url'].endswith('/chairside/chairside-56.html'))
        self.assertTrue(b['metadata']['title'])
        self.assertGreater(len(b['source_text']), 500)

    def test_the_presentation_layer_is_not_in_the_text(self):
        doc = (ROOT / 'sharehub/share-60.html').read_text(encoding='utf-8')
        self.assertIn('data-dc-presentation', doc)
        text = blk.build('sharehub/share-60')['source_text']
        self.assertNotIn('نکته‌ی بالینی', text)  # a marked callout label

    def test_a_cloned_json_ld_description_fails_phase_f(self):
        rep = vp.verify('chairside/chairside-56', vp.Report('chairside/chairside-56'), sweep=False)
        self.assertTrue([r for r in rep.rows if r[1] == '2 clone' and r[0] == 'PASS'])


if __name__ == '__main__':
    unittest.main()
