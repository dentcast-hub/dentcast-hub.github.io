"""des_record_guard: the spec-3b rating rule, one DES record per paper, the rating audit (module 08)."""
import contextlib
import copy
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import des_record_guard as guard  # noqa: E402
import des_library  # noqa: E402
import queue_stamp  # noqa: E402
import verify_publish as vp  # noqa: E402

DOI = '10.1186/s12903-025-06214-9'
SOURCE_TEXT = ('All participants were enrolled in the study. Twenty-four partially edentulous participants between '
               '30 and 60 years were included. Each participant was his own control. All measurements were conducted '
               'by the same investigator and repeated five times to ensure reliability. Deviations were measured for '
               'each participant in specific areas, including occlusal rests and major connectors.')


def dom(name, rating, quote='', note=''):
    return {'domain': name, 'rating': rating, 'evidence_quote': quote, 'note': note}


def pen(item, base):
    return {'item': item, 'base_points': base, 'points': 0, 'evidence_quote': '', 'note': 'not fired'}


def research(missing, mult, score, band, basis='FULL_TEXT', version='3.5'):
    """A ROBINS-I record shaped like the Elgamal 2025 records (queue item 22 and the wrong reruns)."""
    return {
        'des_version': version, 'content_type': 'RESEARCH', 'question_type': 'THERAPY', 'text_basis': basis,
        'citation': {'title': 'RPD frameworks', 'authors': 'Mohamed Elgamal', 'year': 2025,
                     'journal': 'BMC Oral Health', 'doi': DOI},
        'journal_quartile': {'value': 'NR', 'source': 'NR'},
        's_design': {'value': 65, 'anchor': 'non-randomized', 'evidence_quote': 'Each participant was his own control.'},
        'q_method': {'tool': 'ROBINS-I', 'multiplier': mult, 'domains': [
            dom('confounding', 'low', 'Each participant was his own control.'),
            dom('selection of participants', 'low', 'Twenty-four partially edentulous participants between'),
            dom('classification of interventions/exposures', 'low', 'Each participant was his own control.'),
            missing,
            dom('measurement of the outcome', 'some_concerns',
                'by the same investigator and repeated five times to ensure reliability',
                'single investigator with repeated measurements, but no assessor blinding mentioned; '
                'domain described with elements missing'),
        ]},
        'penalties': [pen('conflict', 8), pen('registration', 5), pen('sample size', 5), pen('follow-up', 3)],
        'commentary_checklist': None, 'des_score': score, 'band': band, 'provisional': basis != 'FULL_TEXT',
        'fact_fa': 'امتیاز', 'interpretation_fa': 'تفسیر کوتاه.',
    }


WRONG_MISSING = dom('missing data', 'some_concerns', 'each participant in specific areas, including occlusal',
                    'measurements reported per participant, but no participant flow, no statement of losses or '
                    'exclusions, and no n per analysis in Tables 1-2')
RIGHT_MISSING = dom('missing data', 'high', '',
                    'absence: read Study design, Assessment, Statistical analysis and Results; no participant flow, '
                    'no losses, exclusions or n per analysis anywhere')


def wrong():
    return research(copy.deepcopy(WRONG_MISSING), 0.80, 52, 'C')


def right():
    return research(copy.deepcopy(RIGHT_MISSING), 0.55, 36, 'D')


def write(tmp, name, obj):
    p = Path(tmp) / name
    p.write_text(json.dumps(obj, ensure_ascii=False), encoding='utf-8')
    return p


def quiet(fn, *a, **k):
    with contextlib.redirect_stdout(io.StringIO()) as out:
        code = fn(*a, **k)
    return code, out.getvalue()


class RatingRuleTests(unittest.TestCase):
    def codes(self, src):
        return [(f['code'], f['domain']) for f in guard.rating_findings(src)]

    def test_elgamal_wrong_record_fails_on_missing_data(self):
        self.assertEqual(self.codes(wrong()), [('ABSENCE_NOTE', 'missing data')])

    def test_queue22_shaped_correct_record_passes(self):
        # its measurement domain says «no assessor blinding mentioned» with an on-domain quote: one element missing
        self.assertEqual(self.codes(right()), [])

    def test_described_with_one_element_missing_passes(self):
        src = right()
        src['q_method']['domains'][0] = dom('confounding', 'some_concerns', 'Age and gender-matched controls were used',
                                            'Matching is described; other confounders are not addressed.')
        self.assertEqual(self.codes(src), [])

    def test_never_states_is_an_absence_statement(self):
        src = wrong()
        src['q_method']['domains'][3]['note'] = 'the text implies measurements exist, but it never states attrition'
        self.assertEqual(self.codes(src), [('ABSENCE_NOTE', 'missing data')])

    def test_persian_absence_note_with_off_domain_quote_fails(self):
        src = wrong()
        src['q_method']['domains'][3]['note'] = 'هیچ ریزشی ذکر نشده است'
        self.assertEqual(self.codes(src), [('ABSENCE_NOTE', 'missing data')])

    def test_false_positive_guards(self):
        for note in ('The authors declare no conflicts of interest.', 'not applicable to this design',
                     'no penalty here', 'no losses occurred during follow-up'):
            with self.subTest(note=note):
                self.assertEqual(guard.absence_phrases(note), [])

    def test_absence_phrases_found(self):
        for note in ('no statement of losses', 'allocation concealment is not mentioned', 'the paper is silent',
                     'it does not report dropouts', 'no funding statement found', 'گزارش نشده'):
            with self.subTest(note=note):
                self.assertTrue(guard.absence_phrases(note))

    def test_only_full_text(self):
        self.assertEqual(self.codes(research(copy.deepcopy(WRONG_MISSING), 0.75, 49, 'C', basis='ABSTRACT_ONLY')), [])

    def test_excluded_studies_domain_is_exempt(self):
        src = wrong()
        src['q_method']['domains'][3] = dom('justification for excluding individual studies', 'some_concerns',
                                            'records were assessed for eligibility', 'no list of excluded studies')
        self.assertEqual(self.codes(src), [])

    def test_empty_quote_on_low_or_some_concerns(self):
        src = right()
        src['q_method']['domains'][0]['evidence_quote'] = ''
        src['q_method']['domains'][4]['evidence_quote'] = ''
        self.assertEqual(self.codes(src), [('EMPTY_QUOTE', 'confounding'), ('EMPTY_QUOTE', 'measurement of the outcome')])

    def test_unknown_domain_label_is_never_judged_off_domain(self):
        src = wrong()
        src['q_method']['domains'][3]['domain'] = 'something else'
        self.assertEqual(self.codes(src), [])

    def test_binding_by_version_and_date(self):
        s = wrong()
        self.assertTrue(guard.rating_rule_binding(s, None))
        self.assertTrue(guard.rating_rule_binding(s, guard.RATING_RULE_FROM))
        self.assertFalse(guard.rating_rule_binding(s, '2026-11-03'))
        s['des_version'] = '3.4'
        self.assertFalse(guard.rating_rule_binding(s, '2026-12-01'))
        self.assertEqual(vp.DES_RATING_RULE_FROM, guard.RATING_RULE_FROM)

    def test_no_stored_site_record_breaks_phase_f(self):
        """Every finding on a stored record predates the rule and is a warning, never a FAIL."""
        data = json.loads((ROOT / 'plus/des-scores.json').read_text(encoding='utf-8'))
        binding = [(cid, f['domain']) for cid, rec in data.items() for s in rec.get('sources') or []
                   for f in guard.rating_findings(s) if guard.rating_rule_binding(s, rec.get('scored_at'))]
        self.assertEqual(binding, [])

    def test_check_cli_and_des_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = write(tmp, 'bad.json', {'scored_at': '2026-11-07', 'sources': [wrong()]})
            good = write(tmp, 'good.json', {'scored_at': '2026-11-07', 'sources': [right()]})
            self.assertEqual(quiet(guard.main, ['check', str(bad)])[0], 1)
            self.assertEqual(quiet(guard.main, ['check', str(good)])[0], 0)
            code, out = quiet(vp.des_text_report, str(bad))
            self.assertEqual(code, 1)
            self.assertIn('ABSENCE_NOTE', out)
            self.assertEqual(quiet(vp.des_text_report, str(good))[0], 0)

    def test_reader_library_validate(self):
        self.assertEqual(des_library.validate(right()), [])
        self.assertEqual(len(des_library.validate(wrong())), 1)

    def test_queue_stamp_p5_and_w6(self):
        with tempfile.TemporaryDirectory() as tmp:
            item = Path(tmp) / '30-sharehub-x'
            (item / '05-DES-Fidelity').mkdir(parents=True)
            for date, want in (('2026-11-07', 'P5'), ('2026-10-01', 'W6')):
                (item / '05-DES-Fidelity/des.json').write_text(
                    json.dumps({'scored_at': date, 'sources': [wrong()]}), encoding='utf-8')
                problems, warnings = [], []
                queue_stamp.check_des_package(item, problems, warnings)
                got = [x[:2] for x in problems + warnings]
                with self.subTest(date=date):
                    self.assertEqual(got, [want])


class OneRecordPerPaperTests(unittest.TestCase):
    def stored(self, tmp, queue_src):
        site = write(tmp, 'site.json', {'sharehub/share-1': {'scored_at': '2026-10-01', 'sources': [
            dict(right(), citation=dict(right()['citation'], doi='10.1186/S12903-025-06214-9'))]}})
        qdir = Path(tmp) / 'queue'
        (qdir / '22-sharehub-x' / '05-DES-Fidelity').mkdir(parents=True)
        (qdir / '22-sharehub-x' / '05-DES-Fidelity' / 'des.json').write_text(
            json.dumps({'scored_at': '2026-11-06', 'sources': [queue_src]}), encoding='utf-8')
        return site, qdir

    def test_lookup_is_case_insensitive_across_site_and_queue(self):
        with tempfile.TemporaryDirectory() as tmp:
            site, qdir = self.stored(tmp, right())
            got = guard.existing_records('https://doi.org/' + DOI.upper(), 'refs/heads/no-such-ref', qdir, site=site)
            self.assertEqual([(r['where'], r['id']) for r in got], [('site', 'sharehub/share-1'), ('queue', '22-sharehub-x')])

    def test_compare_reports_every_difference_and_exits_nonzero(self):
        with tempfile.TemporaryDirectory() as tmp:
            site, qdir = self.stored(tmp, right())
            stored = guard.existing_records(DOI, 'refs/heads/no-such-ref', qdir, site=site)
            new = write(tmp, 'new.json', {'sources': [wrong()]})
            with mock.patch.object(guard, 'existing_records', lambda *a, **k: stored):
                code, out = quiet(guard.main, ['compare', str(new)])
                self.assertEqual(code, 1)
                fields = {d['field'] for e in json.loads(out)['sources'][0]['stored'] for d in e['differences']}
                self.assertEqual(fields, {'multiplier', 'domain «missing data»', 'des_score', 'band'})
                same = write(tmp, 'same.json', {'sources': [right()]})
                self.assertEqual(quiet(guard.main, ['compare', str(same)])[0], 0)

    def test_other_basis_or_version_is_not_comparable(self):
        abstract = research(copy.deepcopy(WRONG_MISSING), 0.75, 49, 'C', basis='ABSTRACT_ONLY')
        self.assertFalse(guard.comparable(right(), abstract))
        self.assertFalse(guard.comparable(right(), dict(right(), des_version='3.4')))
        self.assertTrue(guard.comparable(right(), wrong()))


class RatingAuditTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        t = Path(self.tmp.name)
        self.record = write(t, 'des.json', {'scored_at': '2026-11-07', 'sources': [wrong()]})
        self.texts = write(t, 'texts.json', {DOI: {'source_text': SOURCE_TEXT, 'text_basis': 'FULL_TEXT'}})
        self.out = t / 'audit'
        self.assertEqual(quiet(guard.audit_build, self.record, self.texts, self.out)[0], 0)

    def tearDown(self):
        self.tmp.cleanup()

    def answer(self, missing_line, missing_quotes=(), missing_note='Methods and Results read; no losses or flow'):
        rows = [{'domain': 'confounding', 'line': 3, 'quotes': ['Each participant was his own control.']},
                {'domain': 'selection of participants', 'line': 3,
                 'quotes': ['Twenty-four partially edentulous participants between 30 and 60 years were included.']},
                {'domain': 'classification of interventions/exposures', 'line': 3,
                 'quotes': ['Each participant was his own control.']},
                {'domain': 'missing data', 'line': missing_line, 'quotes': list(missing_quotes), 'note': missing_note},
                {'domain': 'measurement of the outcome', 'line': 4,
                 'quotes': ['All measurements were conducted by the same investigator and repeated five times to '
                            'ensure reliability.']}]
        (self.out / 'audit-src0.json').write_text('```json\n' + json.dumps({'domains': rows}) + '\n```', encoding='utf-8')

    def apply(self):
        return quiet(guard.audit_apply, self.out, self.record, self.texts)[0]

    def test_build_writes_the_spec_rules_and_the_block(self):
        system = (self.out / 'audit-system.md').read_text(encoding='utf-8')
        self.assertIn('### 3b — The rating decision is FIXED', system)
        self.assertIn('### 3b-ii', system)
        self.assertNotIn('### 3c', system)
        blk = json.loads((self.out / 'audit-input-src0.json').read_text(encoding='utf-8'))
        self.assertEqual((blk['mode'], blk['tool'], blk['source_text']), ('DES_RATING_AUDIT', 'ROBINS-I', SOURCE_TEXT))

    def test_disagreement_invalidates_the_record(self):
        self.answer(1)  # silence → high; the record says some_concerns
        self.assertEqual(self.apply(), 1)
        receipt = json.loads((self.out / 'audit-receipt.json').read_text(encoding='utf-8'))
        self.assertEqual(receipt['status'], 'disagree')
        self.assertEqual([d['domain'] for d in receipt['sources'][0]['domains'] if not d['agree']], ['missing data'])

    def test_agreement_passes(self):
        self.answer(4, ['Deviations were measured for each participant in specific areas, including occlusal rests '
                        'and major connectors.'])
        self.assertEqual(self.apply(), 0)

    def test_malformed_audits_are_refused(self):
        for line, quotes, note in ((4, ['a sentence that is not in the paper'], ''), (5, [], 'x'), (4, [], 'x'),
                                   (1, [], '')):
            with self.subTest(line=line, quotes=quotes, note=note):
                self.answer(line, quotes, note)
                self.assertEqual(self.apply(), 2)


if __name__ == '__main__':
    unittest.main()
