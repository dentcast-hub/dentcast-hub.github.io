"""verify_publish: sub-episode ids, closed-section landing, LiteCast isolation."""
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import verify_publish as vp

BRAIN = [{'type': 'insight', 'page_url': '/insight/insight-1.html'},
         {'page_url': '/episodes/episode-1.html'},
         {'type': 'litecast', 'page_url': '/litecast/lite-CAST1.html'}]


def lite_doc(related, body=''):
    caps = ''.join(f'<a class="dc-related-capsule" href="{h}">x</a>' for h in related)
    return ('<main><h1>t</h1><p>lead ' + body + '</p>'
            '<div class="dc-related-section"><div class="dc-related-capsules">'
            + caps + '</div></div></main>')


class LandingTests(unittest.TestCase):
    def test_sub_episode_maps_to_dotted_number(self):
        self.assertIsNotNone(vp.episode_landing_title('episodes/episode-159-1'))
        self.assertIsNotNone(vp.episode_landing_title('episodes/episode-162'))

    def test_closed_sections_land_on_sharehub(self):
        for cid in ('dentai/dentai-35', 'photocast/episode-2'):
            rep = vp.verify(cid, vp.Report(cid), sweep=True)
            self.assertFalse([f for f in rep.failures if f[1] == '2.6 landing'], cid)

    def test_all_exit_code_is_documented(self):
        self.assertIn('always exits 0', vp.__doc__)


class LiteCastIsolationTests(unittest.TestCase):
    PAGE = 'litecast/lite-CAST2.html'

    def report(self, related, body=''):
        rep = vp.Report('fixture')
        vp.check_litecast_links(rep, lite_doc(related, body), self.PAGE, BRAIN)
        return rep

    def test_litecast_only_links_pass(self):
        rep = self.report(['/litecast/lite-CAST1.html', 'lite-CAST3.html',
                           'https://dentcast.ir/litecast/lite-CAST4.html'],
                          '<a href="/litecast/lite-CAST5.html">a</a> <a href="/about.html">b</a>'
                          ' <a href="tel:0612">c</a> <a href="https://ada.org/x">d</a>')
        self.assertFalse(rep.failures)

    def test_specialist_capsule_fails(self):
        self.assertTrue(self.report(['/litecast/lite-CAST1.html', '/pillar/']).failures)
        self.assertTrue(self.report(['/glossary/']).failures)
        self.assertTrue(self.report(['/insight/insight-1.html']).failures)

    def test_over_five_fails(self):
        self.assertTrue(self.report([f'/litecast/lite-CAST{n}.html' for n in (1, 3, 4, 5, 6, 7)]).failures)

    def test_self_link_fails(self):
        self.assertTrue(self.report(['/' + self.PAGE]).failures)

    def test_specialist_body_link_fails(self):
        for href in ('/glossary/resistance.html', 'https://dentcast.org/insight/insight-1.html',
                     '../episodes/episode-1.html', '/episodes.html'):
            self.assertTrue(self.report(['/litecast/lite-CAST1.html'],
                                        f'<a href="{href}">x</a>').failures, href)


if __name__ == '__main__':
    unittest.main()
