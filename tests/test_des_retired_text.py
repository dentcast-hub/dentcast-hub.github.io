"""The section rename (founder, 1405/08/17) reworded text that stored DES and
Fidelity records quote verbatim. Records are never hand-edited, so the gate
accepts the retired wording from .dentcast/des-retired-text.json — and only
for the page it was registered on."""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import verify_publish as vp  # noqa: E402


class RetiredTextTests(unittest.TestCase):
    def setUp(self):
        self.reg = json.loads((ROOT / vp.DES_RETIRED_TEXT).read_text(encoding="utf-8"))

    def test_every_stored_declaration_quote_is_still_accepted(self):
        scores = json.loads((ROOT / "plus/des-scores.json").read_text(encoding="utf-8"))
        for cid, rec in scores.items():
            decl = vp.des_section_declaration(cid)
            if decl is None:
                continue
            for s in rec.get("sources") or []:
                for c in s.get("commentary_checklist") or []:
                    note = c.get("note") or ""
                    q = c.get("evidence_quote") or ""
                    if q and "index.html" in note:
                        self.assertIn(vp.des_norm(q), decl, cid)

    def test_retired_wording_is_no_longer_on_the_pages(self):
        for section, texts in self.reg["section_declarations"].items():
            page = vp.des_norm(vp.text_of((ROOT / f"{section}/index.html").read_text(encoding="utf-8")))
            for t in texts:
                self.assertNotIn(vp.des_norm(t), page, section)

    def test_page_entries_are_scoped_to_their_page(self):
        self.assertTrue(vp.des_retired_text("pages", "sharehub/share-2"))
        self.assertEqual(vp.des_retired_text("pages", "sharehub/share-3"), [])
        self.assertEqual(vp.des_retired_text("section_declarations", "sharehub"), [])


if __name__ == "__main__":
    unittest.main()
