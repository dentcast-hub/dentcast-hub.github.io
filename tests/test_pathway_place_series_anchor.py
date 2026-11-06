#!/usr/bin/env python3
"""A numbered series' own home decides the anchor (step 5.6).

Regression for the 2026-11 plak1-12 placement: the nearest-neighbour anchor was
a promptologist step, `run_end` moved it to THAT series' last step, and the
suggestion (`after dentai/promptologist/prompt-append2-6`) would have put part
12 before parts 10 and 11 — reported as ASK, which the route's conservative
default turns into "not placed".
"""
import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
import pathway_place as pp  # noqa: E402


def entry(cid, title, keywords=()):
    return {'page_url': '/' + cid + '.html', 'title': title,
            'keywords': list(keywords), 'hashtags': [],
            'pillar': {'primary': 'p', 'subtopic': 's'}}


class SeriesAnchorTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.addCleanup(lambda: None)
        pp._GENERIC = None
        pp._BRAND = None
        self.addCleanup(setattr, pp, '_GENERIC', None)
        self.addCleanup(setattr, pp, '_BRAND', None)

    def write(self, brain, pathways, core=None):
        paths = {}
        for name, data in (('brain.json', brain), ('pathways.json', pathways),
                           ('core.json', core if core is not None else {})):
            paths[name] = os.path.join(self.dir, name)
            with io.open(paths[name], 'w', encoding='utf-8') as fh:
                json.dump(data, fh, ensure_ascii=False)
        pp.BRAIN, pp.PW, pp.CORE = paths['brain.json'], paths['pathways.json'], paths['core.json']
        pp.HREF = os.path.join(self.dir, 'missing-hashtag-reference.json')
        pp._GENERIC = pp._BRAND = None

    def propose(self, cid):
        buf = io.StringIO()
        with redirect_stdout(buf):
            pp.propose(cid)
        return buf.getvalue()

    @staticmethod
    def row(out, pid):
        return next(line for line in out.splitlines() if f'| {pid:24s} |' in line)

    @staticmethod
    def pathway(pid, ids):
        return {'id': pid, 'steps': [{'content_id': c, 'milestone': False} for c in ids]}

    # --- fixtures -----------------------------------------------------------
    def plak_fixture(self, parts=(10, 11)):
        """ai-dentistry as it stood in 2026-11: a six-part promptologist run,
        then plak parts 10 and 11. Part 12's closest neighbour by concept is a
        promptologist step (both are about GitHub), as in the real run — its
        own siblings share only one token.
        """
        prompt = ['dentai/promptologist/prompt-append2-%d' % n for n in range(1, 7)]
        plak = ['plak-sefr/plak1-%d' % n for n in parts]
        brain = [entry(c, 'zzprompt%d' % n, ['zzgithub', 'zzprompt', 'zzpublish'])
                 for n, c in enumerate(prompt)]
        brain += [entry(c, 'zzplak%s' % c[-2:], ['zzsite']) for c in plak]
        brain.append(entry('plak-sefr/plak1-12', 'zzplak12',
                           ['zzgithub', 'zzprompt', 'zzpublish', 'zzsite']))
        # A corpus, so the shared tokens are not all >10%-generic: without it
        # the pathway would score 0 and this would test the wrong thing.
        brain += [entry('insight/insight-%d' % n, 'zzfill%d' % n, ['zzfill%d' % n])
                  for n in range(80)]
        return brain, [self.pathway('ai-dentistry', list(prompt) + list(plak))]

    # --- tests --------------------------------------------------------------
    def test_siblings_at_the_end_anchor_after_the_highest_part_not_another_run(self):
        brain, pw = self.plak_fixture()
        self.write(brain, pw)
        out = self.propose('plak-sefr/plak1-12')
        self.assertIn('after plak-sefr/plak1-11', self.row(out, 'ai-dentistry'))
        self.assertNotIn('prompt-append2-6', self.row(out, 'ai-dentistry'))

    def test_a_series_home_is_not_reported_as_ask(self):
        brain, pw = self.plak_fixture()
        self.write(brain, pw)
        row = self.row(self.propose('plak-sefr/plak1-12'), 'ai-dentistry')
        # STRONG is the «place it» flag every consumer reads (queue_apply.py
        # parses this column); a series home earns it without a core cluster.
        self.assertIn('STRONG', row)
        self.assertNotIn('ASK', row)
        self.assertIn('earlier parts of its own series', row)

    def test_interleaved_series_anchors_on_its_own_highest_part(self):
        # plak and taraz alternate; part 12 must land after plak1-11 (index 3),
        # never after the taraz step that follows it.
        steps = ['taraz/taraz1-1', 'plak-sefr/plak1-10',
                 'taraz/taraz1-2', 'plak-sefr/plak1-11', 'taraz/taraz1-3']
        brain = [entry(c, 'تراز شواهد — مطالعه', ['evidence']) for c in steps if c.startswith('taraz/')]
        brain += [entry(c, 'پلاک صفر — سایت مطب', ['site']) for c in steps if c.startswith('plak-sefr/')]
        brain.append(entry('plak-sefr/plak1-12', 'پلاک صفر — اولین صفحه', ['site']))
        self.write(brain, [self.pathway('ai-dentistry', steps)])
        self.assertEqual(pp.series_anchor('plak-sefr/plak1-12', steps,
                                          {pp.content_id(e): e for e in brain}),
                         'plak-sefr/plak1-11')
        self.assertIn('after plak-sefr/plak1-11',
                      self.row(self.propose('plak-sefr/plak1-12'), 'ai-dentistry'))

    def test_first_ever_member_of_a_series_stays_ask(self):
        steps = ['dentai/promptologist/prompt-append2-5', 'dentai/promptologist/prompt-append2-6']
        brain = [entry(c, 'zz%s' % c, ['zzguide']) for c in steps]
        brain.append(entry('plak-sefr/plak1-1', 'zzplak', ['zzguide']))
        # A shared token only counts while it is not corpus-generic (>10% of
        # the brain), so the fixture needs a corpus.
        brain += [entry('insight/insight-%d' % n, 'zzfill%d' % n, ['zzfill%d' % n])
                  for n in range(40)]
        self.write(brain, [self.pathway('ai-dentistry', steps)])
        self.assertIsNone(pp.series_anchor('plak-sefr/plak1-1', steps,
                                           {pp.content_id(e): e for e in brain}))
        row = self.row(self.propose('plak-sefr/plak1-1'), 'ai-dentistry')
        self.assertIn('ASK', row)
        self.assertNotIn('own series', row)

    def test_promptologist_history_is_not_rebroken(self):
        # prompt-append2-6 joined ai-dentistry after prompt-append2-5; the old
        # run-end anchor said the same thing and must keep saying it.
        steps = ['dentai/promptologist/prompt-append2-%d' % n for n in range(1, 6)]
        brain = [entry(c, 'zz%s' % c, ['zzprompt']) for c in steps]
        brain.append(entry('dentai/promptologist/prompt-append2-6',
                           'zzappend6', ['zzprompt']))
        brain += [entry('insight/insight-%d' % n, 'zzfill%d' % n, ['zzfill%d' % n])
                  for n in range(80)]
        self.write(brain, [self.pathway('ai-dentistry', steps)])
        row = self.row(self.propose('dentai/promptologist/prompt-append2-6'), 'ai-dentistry')
        self.assertIn('after dentai/promptologist/prompt-append2-5', row)
        self.assertIn('STRONG', row)

    def test_episode_and_its_notecast_are_one_series(self):
        steps = ['episodes/episode-44', 'notecast/episode-44', 'episodes/episode-45']
        brain = [entry(c, 'اپیزود', ['cement']) for c in steps]
        brain.append(entry('notecast/episode-45', 'نوت‌کست', ['cement']))
        by_id = {pp.content_id(e): e for e in brain}
        self.assertEqual(pp.series_anchor('notecast/episode-45', steps, by_id),
                         'episodes/episode-45')

    def test_series_home_survives_a_zero_score(self):
        # Nothing may drop part N out of the pathway parts 1..N-1 are in, even
        # when no token of its own overlaps the pathway's content.
        steps = ['plak-sefr/plak1-10', 'plak-sefr/plak1-11']
        brain = [entry(c, 'الف', ['aaa']) for c in steps]
        brain.append(entry('plak-sefr/plak1-12', 'ب', ['zzz']))
        self.write(brain, [self.pathway('ai-dentistry', steps)])
        out = self.propose('plak-sefr/plak1-12')
        self.assertIn('after plak-sefr/plak1-11', self.row(out, 'ai-dentistry'))

    def test_the_membership_cap_still_owns_a_third_pathway(self):
        # A series home is unmistakable, but a THIRD full pathway stays the
        # founder's: ASK, with the sibling anchor to present as the option.
        steps = ['plak-sefr/plak1-10', 'plak-sefr/plak1-11']
        brain = [entry(c, 'zzplak%s' % c[-2:], ['zzsite']) for c in steps]
        brain.append(entry('plak-sefr/plak1-12', 'zzplak12', ['zzsite']))
        pw = [self.pathway('ai-dentistry', steps),
              self.pathway('digital', ['plak-sefr/plak1-12']),
              self.pathway('fixed-pros', ['plak-sefr/plak1-12'])]
        self.write(brain, pw)
        row = self.row(self.propose('plak-sefr/plak1-12'), 'ai-dentistry')
        self.assertIn('after plak-sefr/plak1-11', row)
        self.assertIn('ASK', row)
        self.assertIn('membership cap', row)

    def test_the_output_row_still_parses_for_the_queue_lane(self):
        # queue_apply.pathway() reads the confidence column with this literal
        # pattern; a new flag there would make it drop the row and refuse
        # PATHWAY_NONE. Keep the contract in a test, not in a memory.
        import re
        pattern = re.compile(r"^\s+(\d+) \| (STRONG |ASK    ) \| (\S+)\s+\| after (\S+)", re.M)
        brain, pw = self.plak_fixture()
        self.write(brain, pw)
        rows = pattern.findall(self.propose('plak-sefr/plak1-12'))
        self.assertIn(('STRONG ', 'ai-dentistry', 'plak-sefr/plak1-11'),
                      [(conf, pid, anchor) for _, conf, pid, anchor in rows])

    def test_bound_still_refuses_unrelated_neighbours(self):
        self.assertFalse(pp.bound('chairside/chairside-44', 'chairside/chairside-45',
                                  'یک کیس', 'کیس دیگر'))
        self.assertTrue(pp.bound('dentai/promptologist/prompt6-1',
                                 'dentai/promptologist/prompt6-2', 'الف', 'ب'))
        self.assertFalse(pp.bound('dentai/promptologist/prompt6-1',
                                  'dentai/promptologist/prompt7-1', 'الف', 'ب'))
        self.assertFalse(pp.numbered_series('dentai/promptologist/prompt6-5',
                                            'dentai/promptologist/prompt7-1'))


if __name__ == '__main__':
    unittest.main()
