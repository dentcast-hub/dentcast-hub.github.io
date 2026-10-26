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


class StampCatalogueTests(unittest.TestCase):
    def test_stamper_rewrites_catalogue_token(self):
        import importlib.util, tempfile
        from unittest.mock import patch
        spec = importlib.util.spec_from_file_location('stamper', ROOT / 'tools/stamp-version.py')
        mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / 'player.html'
            page.write_text('a="dentcast.json?v=3"; b="/dentcast-brain.json?v=old"; '
                            'c="my-dentcast.json?v=3"', encoding='utf-8')
            with patch.object(mod, 'ROOT', Path(tmp)):
                mod.stamp_brain_fetches('abc123')
            self.assertEqual(page.read_text(encoding='utf-8'),
                             'a="dentcast.json?v=abc123"; b="/dentcast-brain.json?v=abc123"; '
                             'c="my-dentcast.json?v=3"')


def pulse_home(urls):
    return ('<ul class="dc-pulse-list">'
            + ''.join(f'<li><a href="{u}">x</a></li>' for u in urls) + '</ul>')


class PulseBaselineTests(unittest.TestCase):
    """Pulse is compared with the main commit the branch was cut from, not
    with whatever origin/main has become since (another publication)."""

    def setUp(self):
        import subprocess, tempfile
        self.sp = subprocess
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.email', 't@t'); self.git('config', 'user.name', 't')
        self.base = [f'/insight/insight-{n}.html' for n in range(1, 8)]
        self.commit(pulse_home(self.base), 'A')                        # main@A
        self.git('checkout', '-q', '-b', 'pub')
        self.mine = '/insight/insight-100.html'
        self.commit(pulse_home([self.mine] + self.base[:-1]), 'mine')  # correct vs A
        self.git('checkout', '-q', 'main')
        other = '/episodes/episode-200.html'
        self.commit(pulse_home([other] + self.base[:-1]), 'other')     # main advances
        self.git('update-ref', 'refs/remotes/origin/main', 'main')
        self.git('checkout', '-q', 'pub')

    def tearDown(self):
        self.tmp.cleanup()

    def git(self, *args):
        return self.sp.run(['git', '-C', str(self.root), *args], check=True,
                           capture_output=True, text=True).stdout

    def commit(self, home, msg):
        (self.root / 'index.html').write_text(home, encoding='utf-8')
        self.git('add', 'index.html'); self.git('commit', '-q', '-m', msg)

    def verdict(self, home):
        from unittest.mock import patch
        rep = vp.Report('fixture')
        with patch.object(vp, 'ROOT', self.root):
            vp.check_pulse(rep, home, self.mine, False, vp.pulse_baseline(rep))
        return rep

    def test_branch_cut_before_main_advanced_passes(self):
        rep = self.verdict((self.root / 'index.html').read_text(encoding='utf-8'))
        self.assertFalse(rep.failures, rep.rows)
        self.assertTrue(any('merge-base' in r[2] for r in rep.rows if r[0] == 'PASS'))

    def test_wrong_pulse_still_fails(self):
        wrong = pulse_home([self.mine] + self.base[1:])   # dropped the top, not the bottom
        self.assertTrue(self.verdict(wrong).failures)

    def test_falls_back_to_origin_main_without_merge_base(self):
        from unittest.mock import patch
        real = vp._git
        def no_merge_base(*args):
            if args[0] == 'merge-base':
                raise self.sp.CalledProcessError(1, 'git')
            return real(*args)
        with patch.object(vp, '_git', no_merge_base):
            rep = self.verdict((self.root / 'index.html').read_text(encoding='utf-8'))
        self.assertTrue(any(r[0] == 'WARN' and 'fell back' in r[2] for r in rep.rows))
        self.assertTrue(rep.failures)   # current main moved on: the old false FAIL, flagged


if __name__ == '__main__':
    unittest.main()
