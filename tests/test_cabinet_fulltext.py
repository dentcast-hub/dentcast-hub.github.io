"""tools/cabinet_fulltext.py: PDF text for the cabinet's full-text search stays out of the repo."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "tools"))
import cabinet_fulltext as ft  # noqa: E402


class CabinetFulltextTest(unittest.TestCase):
    def test_refuses_to_write_paper_text_inside_the_repository(self):
        with self.assertRaises(SystemExit):
            ft.outside_repo(REPO / "cabinet-text.jsonl")
        with self.assertRaises(SystemExit):
            ft.outside_repo(REPO / "plus" / "x.jsonl")
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(ft.outside_repo(Path(d) / "t.jsonl"), (Path(d) / "t.jsonl").resolve())

    def test_finds_a_pdf_by_its_windows_local_path_or_file_name(self):
        paper = {"local_path": "E:\\Paper farzad\\27-2 Summer 2011.pdf", "file_name": "Other Name.PDF",
                 "duplicate_paths": ["E:\\Paper farzad\\zirconia\\27-2 Summer 2011.pdf"]}
        self.assertEqual(ft.candidate_names(paper), ["27-2 summer 2011.pdf", "other name.pdf"])

    def test_a_later_line_for_the_same_paper_wins(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "t.jsonl"
            p.write_text(json.dumps({"id": "P0001", "status": "no_pdf"}) + "\n"
                         + json.dumps({"id": "P0001", "status": "ok", "text": "x", "sha256": "0" * 64}) + "\n")
            self.assertEqual(ft.read_jsonl(p)["P0001"]["status"], "ok")

    @unittest.skipUnless(shutil.which("pdftotext"), "needs poppler's pdftotext")
    def test_extract_skips_what_it_has_and_reports_missing_pdfs(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "t.jsonl"
            run = lambda: subprocess.run([sys.executable, str(REPO / "tools" / "cabinet_fulltext.py"), "extract",
                                          "--pdf-root", d, "--out", str(out), "--only", "P0001"],
                                         capture_output=True, text=True, check=True)
            first = json.loads(run().stdout.strip().splitlines()[-1])
            self.assertEqual(first["no_pdf"], 1)
            second = json.loads(run().stdout.strip().splitlines()[-1])
            self.assertEqual(second["kept"], 1)


if __name__ == "__main__":
    unittest.main()
