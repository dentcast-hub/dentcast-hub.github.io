"""Fail-closed result presence without altering DES/Fidelity model judgments."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import verify_publish as vp
import des_fidelity_units as units

CID = 'sharehub/share-35'
DOC = (ROOT / (CID + '.html')).read_text(encoding='utf-8')
SCORES = json.loads((ROOT / 'plus/des-scores.json').read_text())


def exemption(reason='founder_without_des'):
    return {'content_id': CID, 'page_sha256': hashlib.sha256(DOC.encode()).hexdigest(),
            'reason': reason, 'approval': {'status': 'confirmed', 'decision': 'Explicit scoped user decision',
                                         'evidence': ['fixture:user-decision']}}


class PresenceTests(unittest.TestCase):
    def absence(self, record, doc=DOC, etype='sharehub'):
        with patch.object(vp, 'exists', return_value=True), patch.object(vp, 'read', return_value=json.dumps({CID: record})):
            return vp.des_absence_allowed(CID, doc, etype)[0]

    def test_no_registry_is_not_approval(self):
        with patch.object(vp, 'exists', return_value=False):
            self.assertFalse(vp.des_absence_allowed(CID, DOC, 'sharehub')[0])

    def test_explicit_scoped_current_approval(self):
        self.assertTrue(self.absence(exemption()))

    def test_changed_page_invalidates_approval(self):
        self.assertFalse(self.absence(exemption(), DOC + 'changed'))

    def test_wrong_content_cannot_reuse_approval(self):
        record = exemption(); record['content_id'] = 'sharehub/share-34'
        self.assertFalse(self.absence(record))

    def test_unknown_reason_rejected(self):
        record = exemption(); record['reason'] = 'agent_says_done'
        self.assertFalse(self.absence(record))

    def test_pending_or_evidenceless_approval_rejected(self):
        for field, value in [('status', 'pending'), ('evidence', []), ('decision', '')]:
            record = exemption(); record['approval'][field] = value
            self.assertFalse(self.absence(record))

    def test_caption_exception_requires_episode(self):
        self.assertFalse(self.absence(exemption('unsourced_audio_caption')))
        self.assertTrue(self.absence(exemption('unsourced_audio_caption'), etype='episode'))

    def test_malformed_registry_rejected(self):
        with patch.object(vp, 'exists', return_value=True), patch.object(vp, 'read', return_value='{broken'):
            self.assertFalse(vp.des_absence_allowed(CID, DOC, 'sharehub')[0])

    def test_canonical_non_call_sources(self):
        for source in [{'error': 'INSUFFICIENT_TEXT'}, {'content_type': 'COMMENTARY'},
                       {'content_type': 'NOT_APPRAISABLE', 'des_version': '2.6'}]:
            self.assertTrue(vp.fidelity_absence_allowed(CID, [source], 0)[0])

    def test_modern_citation_only_needs_error_object(self):
        source = {'content_type': 'NOT_APPRAISABLE', 'des_version': '3.4', 'text_basis': 'CITATION_ONLY'}
        self.assertFalse(vp.fidelity_absence_allowed(CID, [source], 0)[0])

    def test_zero_units_requires_recomputed_source_plan(self):
        source = {'content_type': 'RESEARCH', 'des_version': '3.4'}
        with patch.object(units, 'split_page', return_value=[{'id': 'u1'}]), patch.object(units, 'assign', return_value=('SOURCE', {1: ['u1']})):
            self.assertTrue(vp.fidelity_absence_allowed(CID, [source, source], 0)[0])
            self.assertFalse(vp.fidelity_absence_allowed(CID, [source, source], 1)[0])

    def test_pooled_is_not_zero_units_exemption(self):
        source = {'content_type': 'RESEARCH'}
        with patch.object(units, 'split_page', return_value=[{'id': 'u1'}]), patch.object(units, 'assign', return_value=('POOLED', {'pooled': ['u1']})):
            self.assertFalse(vp.fidelity_absence_allowed(CID, [source, source], 0)[0])

    def test_empty_extraction_is_not_exemption(self):
        with patch.object(units, 'split_page', return_value=[]), patch.object(units, 'assign', return_value=('SOURCE', {})):
            self.assertFalse(vp.fidelity_absence_allowed(CID, [{'content_type': 'RESEARCH'}], 0)[0])

    def test_unavailable_assignment_is_not_exemption(self):
        with patch.object(units, 'split_page', side_effect=OSError('unavailable')):
            self.assertFalse(vp.fidelity_absence_allowed(CID, [{'content_type': 'RESEARCH'}], 0)[0])

    def run_page(self, rec, ex=None):
        read = vp.read; exists = vp.exists
        def read_override(path):
            if path == 'plus/des-scores.json':
                return json.dumps({CID: rec} if rec is not None else {})
            if path == vp.DES_EXEMPTIONS:
                return json.dumps({CID: ex})
            return read(path)
        with patch.object(vp, 'read', side_effect=read_override), patch.object(vp, 'exists', side_effect=lambda p: ex is not None if p == vp.DES_EXEMPTIONS else exists(p)):
            report = vp.verify(CID, vp.Report(CID))
        return [r for r in report.failures if r[1] == '4.13 DES']

    def test_real_page_complete_results_pass(self):
        self.assertEqual(self.run_page(SCORES[CID]), [])

    def test_missing_des_fails_in_actual_verifier(self):
        self.assertTrue(self.run_page(None))

    def test_explicit_des_exemption_passes_actual_verifier(self):
        self.assertEqual(self.run_page(None, exemption()), [])

    def test_missing_fidelity_field_fails_in_actual_verifier(self):
        rec = copy.deepcopy(SCORES[CID]); rec.pop('fidelity')
        self.assertTrue(self.run_page(rec))

    def test_null_fidelity_slot_fails_in_actual_verifier(self):
        rec = copy.deepcopy(SCORES[CID]); rec['fidelity'] = [None]
        self.assertTrue(self.run_page(rec))

    def test_empty_source_list_fails_in_actual_verifier(self):
        rec = copy.deepcopy(SCORES[CID]); rec['sources'] = []; rec['fidelity'] = []
        self.assertTrue(self.run_page(rec))


if __name__ == '__main__':
    unittest.main()
