# DES SOURCE receipt — Sasany et al.

- Command: rerun independent SOURCE DES v3.5 using corrected reading-order extraction from the same PDF; read `/tmp/fullmouth-clean.txt`; did not inspect derivative text or queue. This replaces the initial extraction run.
- Model: `gpt-6-luna`, medium.
- Spec: `/workspace/scratch/e9452bd56b5d/repo/.dentcast/des-v3.5-knowledge.md`
- Clean full text: `/tmp/fullmouth-clean.txt` (PyMuPDF `page.get_text()` reading order)
- SHA-256 spec: `1a99dd261f2c5269b059793eb9e1bbb638902b943dbc50ed72c02ec9c8c54b0b`
- SHA-256 clean full text: `360f34a25ecd4150ba0439ff94b87c6979f79639441d25d214532c3443bbf746`
- Final output: `/workspace/scratch/e9452bd56b5d/des-sasany.json`
- Initial output and receipt preserved as `des-sasany.initial.json` and `des-sasany.initial.receipt.md`.
- Self-checks: every non-empty evidence quote is a literal substring of the clean full text; six QUIN domains and four penalty rows are present; arithmetic is `round_half_up(65 × 0.55) − 0 = 36`, band D.
