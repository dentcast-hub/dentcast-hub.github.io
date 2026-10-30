# DES SOURCE scoring receipt

- Source: Delucchi et al. (2021), DOI `10.3390/ma14123251`; same PDF, reading-order extraction `/tmp/materials-clean.txt` produced with PyMuPDF `page.get_text()`.
- Mode: `SOURCE` only; basis: `FULL_TEXT`. No derivative text or queue was read; no browsing was used.
- Specification: `/workspace/scratch/e9452bd56b5d/repo/.dentcast/des-v3.5-knowledge.md` (full file; unchanged from initial scoring).
- Model: `gpt-6-luna`, medium.
- Final output: `/workspace/scratch/e9452bd56b5d/des-delucchi.json`.
- Prior output and receipt retained as `des-delucchi.initial.json` and `des-delucchi.initial.receipt.md`.
- Specification SHA-256: `1a99dd261f2c5269b059793eb9e1bbb638902b943dbc50ed72c02ec9c8c54b0b`
- Clean input SHA-256: `7c3403519143eb7826ba6ae3cc808744922801f5023edfa9b2a17693abad07a9`
- Final output SHA-256: `7dc87ca7edff8d2a8349ef006083bc14c48a8d61c236e1b6a8fb3a235c288472`
- Read command: `sed -n '1,260p'`, `sed -n '261,520p'`, `sed -n '521,780p'`, `sed -n '781,1040p'`, `sed -n '1041,1300p'`, and `sed -n '1301,1542p' /tmp/materials-clean.txt` (working directory `/workspace/scratch/e9452bd56b5d`).
- Validation: parsed as JSON; checked all nonempty evidence quotes against the clean text after whitespace and PDF-ligature normalization; checked arithmetic: `round_half_up(100 × 0.30) − 3 = 27`, band D.
