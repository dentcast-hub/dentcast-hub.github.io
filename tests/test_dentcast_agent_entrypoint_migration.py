"""Audit active instruction routing and full global-rule migration.
Reading backup fixtures here is an audit, never a runtime loader requirement.
These tests do not launch external agent clients.
"""
import hashlib
import json
from pathlib import Path
import re
import unittest
ROOT = Path(__file__).resolve().parents[1]
ENTRYPOINTS = ("AGENTS.md", "CLAUDE.md",
 ".cursor/rules/dentcast-router.mdc", ".cursor/rules/dentcast-publishing.mdc",
 ".cursor/rules/dentcast-operating-protocol.mdc",
 ".dentcast/workflows/README.md", ".dentcast/workflows/agent-parity.md")
SLICES = ("01-hard-rules.md","02-routing-intake.md","03-litecast-and-page.md",
 "04-taxonomy-and-navigation.md","05-semantic-linking.md","06-paper-ingestion.md",
 "07-flashcards-and-quiz.md","08-des-fidelity.md","09-challenge.md",
 "10-brain-and-pathways.md","11-build-and-version.md","12-english-notify-verify.md")
RANGES = ((1,56),(57,356),(357,528),(529,794),(795,957),(958,1143),
 (1144,1335),(1336,1966),(1967,2038),(2039,2329),(2330,2393),(2394,2598))
EDITS = {"02-routing-intake.md":{"CLAUDE.md → Repo conventions":".dentcast/workflows/global/repo-conventions.md",
 # Approved addition (share-41 audit): ask before a silent paper-only route.
 '**Paper-only fast path (text-less) detail.**':'**Paper file without text, but a page is asked for → ASK.** If the paper\narrives with no متن but the request only makes sense on a page — DES/Fidelity,\nthe first-author→DOI credit, a post/page itself — or the user says the text lives\nelsewhere (a document, an artifact, an earlier message), do **not** silently take\nthe paper-only path. Ask, with the two named options: «متن صفحه کجاست؟ (لینک یا\nفایلش را بده)» / «فقط paper-only بماند (Drive + کاتالوگ، بدون صفحه)». Route only\nafter the answer.\n\n'+'**Paper-only fast path (text-less) detail.**'},
 "03-litecast-and-page.md":{"AGENTS.md` §۸":".dentcast/workflows/global/site-invariants.md`"},
 "08-des-fidelity.md":{'CLAUDE.md § "DES display"':".dentcast/workflows/global/plus-premium.md — DES display",
 "CLAUDE.md § DES":".dentcast/workflows/global/plus-premium.md — DES"},
 # Approved clarification (share-41 audit): new articles apply with "articles": {} and tag in step 5.
 "10-brain-and-pathways.md":{'Rules for a new concept: **only non-canonical spellings go in `aliases`**':'**The article being published has no brain entry yet** — step 5.0 runs before step 5, and `--apply` refuses an `articles` key whose `content_id` the brain lacks. So for a new article write the batch with **`"articles": {}`** (concepts only). Its canonical tag list lands in **step 5**, written with the brain entry (and the page chips); run Step 4\'s `--sync`, `node tools/build_plus_index.mjs` and `--check` **after** that brain write. `articles` is for re-tagging entries that already exist.\n\n'+'Rules for a new concept: **only non-canonical spellings go in `aliases`**'},
 # Approved addition (share-41 audit): founder-uploaded Drive file and early Drive work.
 "06-paper-ingestion.md":{"4. **Ambiguity → ASK.**":"   **Founder-uploaded file (the usual case).** When the founder has already\n   uploaded the PDF to the cabinet root instead of handing you the file, do not\n   upload a second copy:\n   - **Find** it among the files directly under the parent folder (Drive MCP\n     search/list) and confirm it is this paper (title/first page, size). If more\n     than one file could be it, **ask**.\n   - **Rename** it to the paper's real title (the verified title, never a\n     guess), keeping its extension. Part 2's `file_name` is this new name.\n   - **Move** that same file into the subfolder chosen in steps 1–2 — never a\n     copy or re-upload.\n   - Capture `drive_id` from **that same file**; `drive_view` and\n     `drive_download` derive from it exactly as above.\n\n   **Doing the Drive work early.** If the founder asks for it «اول از همه»,\n   before the ledger reaches `C.4.10.1`, perform it then and record it as an\n   `external_action` with id `C.4.10.1:<name>` (e.g. `C.4.10.1:drive-move`;\n   `started` before acting; the observed outcome and evidence, e.g. target\n   `drive:<drive_id>`, right after). When the ledger reaches\n   `C.4.10.1`, do not repeat the find/rename/move/upload: complete the step with\n   evidence that references that recorded receipt. Every ask-don't-guess rule in\n   this branch applies to the early run unchanged.\n"+"4. **Ambiguity → ASK.**"},
 # Approved clarification (share-41 audit): C.4.14 completed means Challenge.
 "09-challenge.md":{"**Runs only when Question 4.9 answered «چالش».** Full design in":
  "**Runs only when Question 4.9 answered «چالش».** The ledger checkpoint\n`C.4.14` therefore has exactly two outcomes: `completed` means *this post is\na چالش* (its page carries the `data-dc-challenge-question` markup below, and\nthe English mirror is exempt); an ordinary post records `C.4.14` as\n**`skipped`** only, never `completed`. Full design in"}}
def read(p): return (ROOT/p).read_text(encoding="utf-8")
# Approved clarifications (doc-contradiction audit 2026-10-26): exact
# legacy-text -> active-text hunks that align the modules with tool behaviour
# (DES/Challenge skips, LiteCast URL, episode brain shape, paper-only, 4.12-ب
# after 5.6). Each old text must occur exactly once.
CLARIFICATIONS=json.loads(read("tests/fixtures/module-clarifications-2026-10-26.json"))
# Approved line re-wraps (Claude-path audit 2026-10-26): lines over 2000
# characters were split at sentence boundaries so clients that truncate long
# lines can read them completely. Each hunk is [original line, re-wrapped
# text]; only a single space becomes newline + continuation indent, so undoing
# it restores the reviewed text exactly.
REWRAPS=json.loads(read("tests/fixtures/line-rewraps-2026-10-26.json"))
def unwrap(test, path, text):
 for old,new in REWRAPS.get(path,()):
  test.assertEqual(re.sub(r"\n *"," ",new),old)
  test.assertTrue(all(len(line)<=2000 for line in new.split("\n")))
  test.assertEqual(text.count(new),1,new[:80])
  text=text.replace(new,old)
 return text

# Approved global-rule amendments that postdate the legacy snapshot (founder
# decision 1405/08/03, PR #994: repo-file article exam questions + auto-open at
# twenty). Each is a bounded block: the test removes exactly that block, pins its
# required terms, and the rest of the file must still equal the legacy text.
GLOBAL_AMENDMENTS = {
 ".dentcast/workflows/global/repo-conventions.md": {
  "new_start": '**سؤالِ مقاله منبعِ دومی هم در ریپو دارد',
  "old_start": '**و آزمون هرگز از سیستمِ کوییز',
  "end": '**آزمونِ بی\u200cسؤال آزمون نیست',
  "terms": ("plus/exam-questions.json", "۴.۱۲-ب", "tools/validate_exam_questions.py",
            "`r-`", "**سه** منبع", "config.exam.autoOpenMin", "بذرپاشی",
            "`published_at`اش حرفِ آخر"),
 },
 ".dentcast/workflows/global/plus-premium.md": {
  "row": '| Premium | سؤالِ آزمونِ مسیر (منبعِ ریپو) | `plus/exam-questions.json` زیرِ `content_id` (کلید داخلِ فایل؛ `robots.txt` می\u200cبندد) | گام ۴.۱۲-ب — هر publish تخصصی که قدمِ مسیر است (جز LiteCast/چالش/واژه\u200cنامه)؛ تأیید در چت، بدون بیلدر |\n',
  "terms": ("plus/exam-questions.json", "۴.۱۲-ب", "LiteCast"),
 },
}
def strip_global_amendment(test, path, actual, expected):
 rule = GLOBAL_AMENDMENTS.get(path)
 if not rule:
  return actual
 if "row" in rule:
  test.assertEqual(actual.count(rule["row"]), 1)
  for term in rule["terms"]:
   test.assertIn(term, rule["row"])
  return actual.replace(rule["row"], "", 1)
 a_start = actual.index(rule["new_start"]); a_end = actual.index(rule["end"], a_start)
 e_start = expected.index(rule["old_start"]); e_end = expected.index(rule["end"], e_start)
 block = actual[a_start:a_end]
 for term in rule["terms"]:
  test.assertIn(term, block)
 return actual[:a_start] + expected[e_start:e_end] + actual[a_end:]
# Founder-approved DES v3.5 amendment to module 08 (1405/08/04): spec pointer,
# the v3.5 summary, the Part 2b episode carve-out and the source-marker/plan
# rule. Applied to the legacy text as exact, single-occurrence replacements.
DES_V35_AMENDMENTS=(
 ('\n**Load `.dentcast/dentcast-evidence-score-v3.4.md` as the system prompt — the whole\n',
  '\n**Load `.dentcast/dentcast-evidence-score-v3.5.md` as the system prompt — the whole\n'),
 ('\n**v3.3 is the current spec, and its change from 3.2 is one FIDELITY rule** (F0, F2,\n',
  "\n**v3.5 is the current spec, and its change from 3.4 is the FIDELITY pipeline\nonly** (appendix rules 10, 12–14; founder 1405/08/04). The model instruction, every\nverdict rule, F4 and the bands are 3.4's word for word, so no score and no verdict\nmoves; what changes is which sentences reach a call. `sharehub/share-42` is why:\nthe prose names its three sources in Persian («اوکیسون», «کونتی»), the tool's\nmarkers were Latin only, two sources share an author, and the founder had to\nhand-build the plan — while twenty-five sentences that named no source reached no\ncall at all. Four rules close that: (1) a page may **declare Persian markers** and,\nfor sources that share a name, **disambiguators** (the year always is one) in\n`.dentcast/des-source-markers.json`; (2) a **recorded plan**\n(`.dentcast/des-fidelity-plans/<content_id>.json`) — a founder decision or an\norphan-sweep receipt — replaces the computed assignment, and Phase F reads the same\nfile; (3) the **orphan sweep** (Part 2c step 5): every body sentence no call judged,\nor every call left silent, is read by the stronger reviewer against **every**\nsource; the reviewer only finds, never judges — a found sentence joins that\nsource's plan and is judged by the ordinary two checker runs, and a sentence found\nnowhere is listed to the founder; (4) a plan that grows, or a source text that\ngrows (a longer excerpt), re-checks only what it must instead of the whole step.\nRecords below 3.5 keep their assignment: the tool reads the sidecar and the plan\nonly when a source record is stamped 3.5 or later.\n\n**v3.3's change from 3.2 is one FIDELITY rule** (F0, F2,\n"),
 ('\n#### Part 2b — Run the FIDELITY call (spec v2.5, v2.7, v3.1, v3.2, v3.3), once per source whose text is in hand\n',
  '\n#### Part 2b — Run the FIDELITY call (spec v2.5, v2.7, v3.1, v3.2, v3.3, v3.5), once per source whose text is in hand\n'),
 ('1405/07/19), the record and the publish report are. Basket 1 pages never reach this call: fidelity needs a\ncited source. No classifier decides whether the page «is a report of the paper»\n',
  '1405/07/19), the record and the publish report are. Basket 1 pages never reach this call: fidelity needs a\ncited source. **A core audio episode (`episodes/…`) never reaches it either —\nDES only, no FIDELITY** (founder, 1405/08/04): its page is a caption, a player\nand labels, not a write-up of the paper, so the record is `scored_at` +\n`sources` with no `fidelity` key; `tools/des_fidelity_units.py` builds nothing\nfor it and Phase F fails a `fidelity` slot on one. Its NoteCast is a written\npage and keeps the call. **DES belongs to the paper: one DES record per paper.** An episode and its NoteCast built on the same paper\nshare that single record (no second record, no second scoring) and both pages carry its score; **FIDELITY goes only to\nthe written page, and only when its paper accompanies it**; the audio episode never gets one (founder, 1405/08/07). No classifier decides whether the page «is a report of the paper»\n'),
 ("answers saved as `out-S<n>.json`, which writes the one pooled object by spec\nF6's fold — the model never reads two papers in one call (v2.7). Each block it\n",
  'answers saved as `out-S<n>.json`, which writes the one pooled object by spec\nF6\'s fold — the model never reads two papers in one call (v2.7).\n\n**v3.5 (appendix rule 10).** When the prose names a source in Persian, or two\nsources share an author, declare it before the first run — never fix the plan\nafterwards by hand:\n\n```json\n// .dentcast/des-source-markers.json\n{"<content_id>": {"S1": {"markers": ["اوکیسون"], "disambiguators": ["1988"]},\n                  "S2": {"markers": ["اوکیسون"], "disambiguators": ["2020", "کتاب"]}}}\n```\n\nA marker matches as a whole word in either script (Persian digits read as Latin);\nwhen a sentence names several sources, those whose disambiguator it also names\nkeep it. When the founder decides the plan outright, record it in\n`.dentcast/des-fidelity-plans/<content_id>.json`\n(`{"content_id", "origin": "founder", "decision": {"status": "confirmed", …},\n"plan": {"<source index>": ["u…", …]}}`); the tool refuses an unconfirmed\ndecision, an unknown unit or a source without a text, and Phase F reads the same\nfile. Each block it\n'),
 ('file, verbatim, minus the appendix.**\n',
  "file, verbatim, minus the appendix.** That cut already exists:\n`.dentcast/des-v3.5-knowledge.md`, byte for byte. Pass that file; never cut the\nappendix yourself (a hand cut keeps a trailing blank line, so its digest differs\nfrom every other run's).\n"),
)

DES_V35_AFTER_AMENDMENTS=(
 ("   unit's `note`, and Part 3b shows the founder both reasons side by side.\n",
  '   unit\'s `note`, and Part 3b shows the founder both reasons side by side.\n\n5. **Orphan sweep (spec v3.5 rule 12) — after the vote, before Part 3b.**\n   `python3 tools/des_fidelity_units.py <content_id> --orphans <dir> --texts texts.json`\n   lists every body sentence no call judged, or that every call judging it left\n   `NOT_IN_SOURCE`/`NOT_ASSESSABLE` (headings, `NOT_A_CLAIM` and `AUTHOR_VIEW`\n   are not orphans), and writes `<dir>/orphans-input.json` with those sentences\n   and the text of **every** source. The stronger reviewer reads it — all\n   sources, not only the one the sentence was assigned to — and writes\n   `<dir>/orphans.json`: `{"u…": {"found": "S<n>", "source_quote": "…", "note":\n   "…"}}` or `{"u…": {"found": null, "note": "…"}}`. **It finds; it never\n   judges:** no verdict, no `change_kind`. Then\n   `python3 tools/des_fidelity_units.py <content_id> --sweep <dir>` refuses an\n   unanswered sentence or a `source_quote` that is not verbatim in that source,\n   adds every found sentence to its source in the recorded plan (origin\n   `orphan_sweep`, with the receipt), and prints them. Judge them as a re-check:\n   `--build <dir2> --only u…`, two checker runs, a tie-break, the review of\n   anything flagged, then `--vote <dir2> --base <dir>` — the base may **grow** by\n   exactly those units (rule 13). The sentences found nowhere are reported to\n   the founder in the same message as Part 3b, as a list, never as faults: they\n   are the author\'s own reasoning or background unless the founder points to a\n   source the run did not have.\n'),
 ('  those, run the full step again. Never patch a verdict by hand.\n',
  '  those, run the full step again. Never patch a verdict by hand.\n- **A source text that grows** (spec v3.5 rule 14 — the founder adds pages to an\n  excerpt): pass the new `texts.json` with `--vote <dir2> --base <dir1> --texts\n  texts.json`. The tool compares it with `<dir1>/input-src<k>.json`; when the old\n  text is contained in the new one, re-check every unit of that source that was\n  not `MATCHES` (`NOT_IN_SOURCE` and `NOT_ASSESSABLE` included — the new pages may\n  speak to them) and keep the `MATCHES` units; anything else changed in the text\n  is refused, and then the full step runs again.\n'),
 ('because that call judged the page against all its sources at once. It is omitted entirely on a record\nwritten before v2.5 or on a basket-1 page; Phase F accepts both shapes and\n',
  'because that call judged the page against all its sources at once. It is omitted entirely on a record\nwritten before v2.5, on a basket-1 page, or on a core audio episode (Part 2b); Phase F accepts both shapes and\n'),
 ('still the job — the gate tells you *that* something is wrong, not what the\nright score was.\n',
  'still the job — the gate tells you *that* something is wrong, not what the\nright score was.\n\n6. **Persian text of the record (founder decision 1405/08/07: the DES Persian\n   text is independent of the founder) — an agent check, not a score check and\n   not a founder gate.** For a record that already passes (1)–(5), run\n   `python3 tools/verify_publish.py --des-text <des.json>` on every SOURCE and\n   COMMENTARY object before it is stored. The replaced-word check is automatic:\n   it fails on a word the founder replaced (today «ادبیات» → «منابع علمی»;\n   `fact_fa` and `interpretation_fa` of v3.5+ records only — older records keep\n   their text) and lists the `interpretation_fa` sentences (when non-null) one\n   by one. Then check each sentence against the scored text yourself: **a\n   sentence that says anything the text does not say, or is unclear, is fixed\n   by the agent itself** — delete it, or rewrite it to a smaller claim the text\n   supports (and repair any pronoun or reference the deletion leaves dangling).\n   The founder is not asked and is not shown the sentence. The score, band and\n   quotes never change, and the model is never re-run for wording. Record\n   before/after in the run notes. FIDELITY `fact_fa` / `interpretation_fa`\n   lines are composed by `tools/des_fidelity_units.py` and recomputed by every\n   `--vote`: check them after the last Part 3b re-vote, just before Part 4, and\n   fix a flagged one the same way. This does not touch Part 3b: the founder\n   gate on `ALTERED` / `REVERSED` page sentences stays. Phase F enforces only\n   the word list; the claim check is yours.\n')
)

class EntrypointMigrationTests(unittest.TestCase):
 def test_progress_reporting_is_timely_without_per_command_noise(self):
  s=read(".dentcast/workflows/agent-parity.md")
  for term in ("۶۰ ثانیه", "برای هر دستور، فایل‌خوانی یا چکِ ریز پیام جدا نفرست",
   "همان‌جا سؤال دقیق را بپرس", "نتیجه و قدم بعد"):
   with self.subTest(term=term): self.assertIn(term,s)
 def test_clients_use_active_authority(self):
  for p in ENTRYPOINTS:
   with self.subTest(path=p):
    s=read(p)
    for term in ("LIVE_MODULAR_PUBLISHING_ENABLED",".dentcast/workflows/global/README.md"):
     self.assertIn(term,s)
    for term in (".legacy.md","/legacy/","STAGING_ONLY_NO_LIVE_PUBLISH"):
     self.assertNotIn(term,s)
  for p in ENTRYPOINTS[:5]:
   self.assertIn(".dentcast/workflows/README.md",read(p))
   self.assertIn(".dentcast/workflows/agent-parity.md",read(p))
 def test_resume_discovery_in_all_clients(self):
  for p in ENTRYPOINTS:
   with self.subTest(path=p):
    for term in ("انتشار ناقص داشتم",".dentcast/PUBLISH-HANDOFF.md",".dentcast/workflows/publish-handoff.md"):
     self.assertIn(term,read(p))
 def test_cursor_native_metadata(self):
  for name,always in (("router","true"),("operating-protocol","true"),("publishing","false")):
   s=read(f".cursor/rules/dentcast-{name}.mdc")
   self.assertTrue(s.startswith("---\n"))
   self.assertIn(f"alwaysApply: {always}",s.split("---",2)[1])
 def test_required_reading_has_no_truncated_lines(self):
  # Readers such as Claude's Read tool cut lines after 2000 characters. A
  # Markdown table row cannot be wrapped; such rows are listed explicitly.
  table_rows={(".dentcast/workflows/agent-parity.md","| C.4.13 |")}
  files=["AGENTS.md","CLAUDE.md",*map(str,ROOT.glob(".cursor/rules/*.mdc")),
   *map(str,ROOT.glob(".claude/skills/**/*.md")),*map(str,ROOT.glob(".agents/skills/**/*.md")),
   *map(str,ROOT.glob(".dentcast/workflows/**/*.md"))]
  for f in files:
   rel=str(Path(f).resolve().relative_to(ROOT)) if Path(f).is_absolute() else f
   if "/legacy/" in rel or rel.endswith(".legacy.md") or "/historical/" in rel: continue
   for n,line in enumerate(read(rel).split("\n"),1):
    if len(line)>2000:
     with self.subTest(path=rel,line=n):
      self.assertTrue(any(rel==p and line.startswith(prefix) for p,prefix in table_rows))
 def test_skill_copies_identical_and_follow_hard_rule_14(self):
  claude=sorted(p.relative_to(ROOT/".claude/skills") for p in (ROOT/".claude/skills").rglob("*") if p.is_file())
  agents=sorted(p.relative_to(ROOT/".agents/skills") for p in (ROOT/".agents/skills").rglob("*") if p.is_file())
  self.assertEqual(claude,agents)
  for rel in claude:
   self.assertEqual((ROOT/".claude/skills"/rel).read_bytes(),(ROOT/".agents/skills"/rel).read_bytes(),str(rel))
  s=read(".claude/skills/glossary-writer/SKILL.md")
  for term in ("Hard Rule 14","Hard Rule 13","**4.7-ب**","`6 pulse`","همین‌طوری درج کنم یا رد شم؟"):
   self.assertIn(term,s)
  self.assertNotIn("Never insert links on the user's behalf",s)
 def test_post_push2_handoff_notice_shared(self):
  for p in ("AGENTS.md","CLAUDE.md",".cursor/rules/dentcast-router.mdc"):
   with self.subTest(path=p):
    s=read(p); self.assertIn("After a new v2 publication's second delivery is confirmed",s)
    self.assertIn("Keep checking the run until it succeeds or fails",s)
 def test_specialty_routes_preserved(self):
  for p in ("AGENTS.md","CLAUDE.md",".cursor/rules/dentcast-router.mdc"):
   for route in ("en-version.md","ads.md","spot-report.md","cross-link.md","new-section.md",
    "external-fidelity.md","offline-publish.md","glossary-writer/SKILL.md","routing-details.md"):
    with self.subTest(path=p,route=route): self.assertIn(route,read(p))
 def test_complete_global_rules_migrated(self):
  m=json.loads(read(".dentcast/workflows/global/MIGRATION.json"))
  self.assertIs(m["execution_requires_backup_read"],False)
  src=read(m["source_artifact"]).splitlines(keepends=True)
  self.assertEqual([r["source_lines"] for r in m["ranges"]],[[373,1209],[1210,1440],[1441,1587]])
  for item in m["ranges"]:
   a,b=item["source_lines"]; original="".join(src[a-1:b])
   self.assertEqual(hashlib.sha256(original.encode()).hexdigest(),item["source_sha256"])
   expected=original.replace("CLAUDE.md، بخش Repo conventions.","فایل فعال .dentcast/workflows/global/repo-conventions.md.")
   # Founder-approved DES v3.5 (1405/08/04): the plus-premium spec pointer moved from v3.4 to v3.5.
   expected=expected.replace("اسپک: `.dentcast/dentcast-evidence-score-v3.4.md`؛","اسپک: `.dentcast/dentcast-evidence-score-v3.5.md`؛")
   expected=expected.replace("`dentcast-evidence-score-v3.3.md`، …) و آن کپ","`dentcast-evidence-score-v3.3.md`، `dentcast-evidence-score-v3.4.md`، `dentcast-evidence-score-v3.5.md`، …) و آن کپ")
   expected=expected.replace("نسخه‌های v1.3 تا v3.3 را کنارِ","نسخه‌های v1.3 تا v3.5 را کنارِ")
   actual=strip_global_amendment(self,item["active"],unwrap(self,item["active"],read(item["active"])),expected)
   self.assertEqual(actual,expected)
   self.assertIn(item["active"],read(".dentcast/workflows/global/README.md"))
 def test_canonical_modules_unchanged_except_pointer_repairs(self):
  src=read(".dentcast/workflows/README.legacy.md").splitlines(keepends=True)
  router=read(".dentcast/workflows/README.md"); start=router.index("## New-publication dispatch"); positions=[]
  for name,(a,b) in zip(SLICES,RANGES):
   with self.subTest(module=name):
    expected="".join(src[a-1:b])
    for old,new in EDITS.get(name,{}).items(): expected=expected.replace(old,new)
    for old,new in CLARIFICATIONS.get(name,()):
     self.assertEqual(expected.count(old),1,old)
     expected=expected.replace(old,new)
    actual=unwrap(self,".dentcast/workflows/modules/"+name,read(".dentcast/workflows/modules/"+name))
    self.assertTrue(actual.startswith("<!-- dentcast-checkpoint-protocol:v1 -->"))
    self.assertIn(".dentcast/workflows/publish-checkpoints.md",actual.split("<!-- /dentcast-checkpoint-protocol:v1 -->",1)[0])
    body=actual.split("<!-- /dentcast-checkpoint-protocol:v1 -->\n\n",1)[1]
    if name == "07-flashcards-and-quiz.md":
     # Approved addition (founder 1405/08/03, PR #994): step 4.12-ب writes the
     # page's exam questions into plus/exam-questions.json. Strip that bounded
     # section, pin its required terms, compare the rest with the legacy text.
     cut=body.index("\n\n### 4.12-ب.")
     section=body[cut:]
     for term in ("plus/exam-questions.json", "tools/validate_exam_questions.py",
                  "**C.4.12**", "LiteCast", "approves every question in chat",
                  "never re-minted", "`r-`"):
      self.assertIn(term,section)
     body=body[:cut]+"\n"
    if name == "11-build-and-version.md":
     body=body.replace("- Keep exactly **7** Pulse lines. Phase F checks the count, first position, and preservation of the previous first six lines when a new URL is added against main.\n", "")
     self.assertIn("Keep exactly **7**",actual)
    if name == "12-english-notify-verify.md":
     block=re.search(r"\n<!-- concise-publication-report:v1 -->.*?<!-- /concise-publication-report:v1 -->\n",body,re.S)
     self.assertIsNotNone(block)
     for term in ("technical evidence checklist", "explicit", "Never hide failed gates", "exact Phase F summary"):
      self.assertIn(term,block.group(0))
     body=body[:block.start()]+body[block.end():]
     # Strip only the bounded, approved fail-closed clarification for legacy parity.
     first=body.index("<!-- des-fail-closed-policy:v1 -->")
     last=body.index("<!-- /des-fail-closed-policy:v1 -->",first)+len("<!-- /des-fail-closed-policy:v1 -->\n\n")
     policy=body[first:last]
     for term in ("missing DES record is `FAIL`", "LiteCast", "Challenge",
                  "founder_without_des", "unsourced_audio_caption",
                  "without rerunning DES", "Fidelity", "Phase F"):
      self.assertIn(term,policy)
     old_first=expected.index("**On the DES rows specifically:**")
     old_last=expected.index("LiteCast, glossary and episode branches",old_first)
     body=body[:first]+expected[old_first:old_last]+body[last:]
     expected=expected.replace("one above the new bottom", "at the absolute top (first line; exactly 7 lines remain)").replace("each command + full stdout/stderr", "each command + a retrievable stdout/stderr log reference")
     expected=expected.replace(
      '**DES (Question 4.8 + step 4.13)** — or one of the two documented skip lines ("skipped — LiteCast" / "skipped — کاربر انتخاب کرد بدون DES منتشر شود")',
      '**DES (Question 4.8 + step 4.13)** — or an explicit canonical skip ("skipped — LiteCast" / "skipped — چالش" / "skipped — کاربر انتخاب کرد بدون DES منتشر شود" with valid page-bound approval / verified "unsourced_audio_caption" episode exemption)')
    if name == "01-hard-rules.md":
     # PR #920 intentionally amended scoped approval and continuing independent
     # work; the hashtag QA (2026-10-28) added the five step-5.0 gates as a
     # sub-bullet of Hard Rule 15. Pin that approved text exactly; the legacy
     # snapshot predates both.
     self.assertIn("**Five gates, all in Phase C step 5.0", body)
     self.assertEqual(hashlib.sha256(body.rstrip("\n").encode()).hexdigest(),
                      "6526a432d792b2cc29f6a7cc2a46a2193c7522343e2472235d814aaf5fdadc40")
     positions.append(router.index("`modules/"+name+"`",start))
     continue
    if name == "08-des-fidelity.md":
     # Founder 1405/08/06: the per-version notes of Part 2 moved verbatim to
     # des-version-history.md; module 08 keeps a bounded summary of the rules
     # they imply. Put the moved text back in place, so every other line is
     # still compared with the legacy contract below.
     hist=read(".dentcast/workflows/des-version-history.md")
     moved=hist.split("<!-- des-version-history-text:v1 -->\n",1)[1].split("<!-- /des-version-history-text:v1 -->",1)[0]
     h_start=body.index("<!-- des-version-history:v1 -->")
     h_end=body.index("<!-- /des-version-history:v1 -->\n",h_start)+len("<!-- /des-version-history:v1 -->\n")
     summary=body[h_start:h_end]
     for term in ("des-version-history.md","version-gated","re-labelled",
                  "des-source-markers.json","des-fidelity-plans","base_points",
                  "round_half_up","SECONDARY_REPORT","chain rule"):
      self.assertIn(term,summary)
     body=body[:h_start]+moved+body[h_end:]
     # Part 2c remains the original approved execution-routing amendment.
     # The explicit precomputed-result branch is a second, narrowly allowed
     # workflow addition; remove only that block before checking source parity.
     marker="#### Part 2c — How the FIDELITY call is run: two independent checker runs, a tie-break, a stronger reviewer"
     after="**The model is part of the measurement:**"
     expected_before,expected_rest=expected.split(marker,1)
     expected_after=expected_rest.split(after,1)[1]
     actual_before,actual_rest=body.split(marker,1)
     actual_after=actual_rest.split(after,1)[1]
     condition_start=actual_before.index("#### Conditional path for founder-supplied results")
     condition_end=actual_before.index("**Order matters:",condition_start)
     conditional=actual_before[condition_start:condition_end]
     normalized_before=actual_before[:condition_start]+actual_before[condition_end:]
     normalized_before=normalized_before.replace(
      "### 4.13. DES — DentCast Evidence Score (run or consume the record)",
      "### 4.13. DES — DentCast Evidence Score (run the scoring prompt, store the record)")
     # Permit exactly the scoped Challenge/DES exception clarification in the
     # active module; preserve the remainder of the legacy extracted contract.
     updated_head=normalized_before.index("**Run step 4.13 on every ordinary page publish**")
     updated_tail=normalized_before.index("**Order matters:",updated_head)
     legacy_head=expected_before.index("**Runs for EVERY type, on EVERY publish")
     legacy_tail=expected_before.index("**Order matters:",legacy_head)
     challenge_exception=normalized_before[updated_head:updated_tail]
     for term in ("Phase B Question 4.9", "C.4.13: skipped — چالش",
                  "without invoking", "no entry for this content ID",
                  "data-dc-challenge-question", "Phase F",
                  "All other applicable pages must have a valid DES record"):
      self.assertIn(term,challenge_exception)
     normalized_before=(normalized_before[:updated_head]+
                        expected_before[legacy_head:legacy_tail]+
                        normalized_before[updated_tail:])
     for v35_old,v35_new in DES_V35_AMENDMENTS:
      self.assertEqual(expected_before.count(v35_old),1,v35_old[:80])
      expected_before=expected_before.replace(v35_old,v35_new)
     self.assertEqual(normalized_before.rstrip("\n"),expected_before.rstrip("\n"))
     for v35_old,v35_new in DES_V35_AFTER_AMENDMENTS:
      self.assertEqual(expected_after.count(v35_old),1,v35_old[:80])
      expected_after=expected_after.replace(v35_old,v35_new)
     self.assertEqual(actual_after.rstrip("\n"),expected_after.rstrip("\n"))
     for required in ("independent DES and Fidelity tracks", "exact `content_id`",
      "`tools/des_fidelity_units.py`", "DO NOT rerun the DES/SOURCE/COMMENTARY model calls",
      "DO NOT rerun Fidelity model calls", "run **only the missing Fidelity calls**",
      "separate model-run receipt is **not required for a valid DES JSON**",
      "record 4.13 as blocked", "Never silently rerun the founder's supplied result"):
      with self.subTest(required=required): self.assertIn(required,conditional)
     for required in ("`gpt-6-luna`","Launch both full checker runs in parallel",
      "exact price verification is not a start gate","record it as UNVERIFIED",
      "If the runtime does not expose independent contexts"):
      self.assertIn(required,actual_rest.split(after,1)[0])
     continue
    if name == "06-paper-ingestion.md":
     # Hashtag QA 2026-10-28: Part 2 step 8 (paper reachability through the
     # assistant's bridge) is a bounded workflow addition inside the paper branch.
     first=body.index("<!-- paper-reachability-step-8:v1 -->")
     last=body.index("<!-- /paper-reachability-step-8:v1 -->",first)+len("<!-- /paper-reachability-step-8:v1 -->\n\n")
     block=body[first:last]
     for term in ("plus/cabinet-bridge.json", "build_cabinet_papers.py", "byTag", "tooth_topics",
                  "tooth-implant-connection", "library-only", "`tag_index`", "Paper-only fast path"):
      self.assertIn(term,block)
     body=body[:first]+body[last:]
    # Founder 1405/08/07: insight file/caption/keyword conventions are bounded
    # additions; strip them, pin their terms, compare the rest with legacy.
    for mod,tag,terms in (
     ("02-routing-intake.md","insight-conventions:v1",
      ("insight<N>-<k>.webp","1600 px","300 KB","200 characters","Hard Rule 16")),
     ("10-brain-and-pathways.md","insight-keywords:v1",
      ("5 to 8","does not repeat a hashtag","Hard Rule 1"))):
     if name == mod:
      first=body.index("<!-- "+tag+" -->")
      last=body.index("<!-- /"+tag+" -->",first)+len("<!-- /"+tag+" -->\n")
      for term in terms:
       self.assertIn(term,body[first:last])
      if body[last:last+1]=="\n":
       last+=1
      body=body[:first]+body[last:]
    if name == "10-brain-and-pathways.md":
     # Hashtag QA 2026-10-28: step 5.0 was rewritten (question-first reachability,
     # composition gate, resolving sentence per tag, restricted minting with the
     # alias checklist, bridge decision). The bounded block replaces the legacy
     # step 5.0 text; everything else must still match the legacy extraction.
     first=body.index("<!-- hashtag-step-5-0:v2 -->")
     last=body.index("<!-- /hashtag-step-5-0:v2 -->",first)+len("<!-- /hashtag-step-5-0:v2 -->\n\n")
     block=body[first:last]
     for term in ("3–5 questions a dentist would type", "decision tag", "≤ 10 pages",
                  "resolves", "plus/assistant-tags.json", "first 4 pages of one of the first 4 chips",
                  "four slots", "English twin", "plus/cabinet-bridge.json", "no library equivalent",
                  "`keywords`", "Hard Rule 15", "Hard Rule 13", "hashtag_ref.py --check"):
      self.assertIn(term,block)
     old_first=expected.index("### 5.0. Hashtag standardization")
     old_last=expected.index("### 5. Brain entry",old_first)
     body=body[:first]+expected[old_first:old_last]+body[last:]
    if name == "12-english-notify-verify.md":
     # Same amendment: the report rows for step 5.0 and step 4.10 Part 2 name the
     # new evidence (questions, resolving sentences, bridge, reachability).
     def swap_row(prefix,*terms):
      nonlocal body
      i=body.index(prefix); j=body.index("\n",i)
      for term in terms: self.assertIn(term,body[i:j])
      k=expected.index(prefix); l=expected.index("\n",k)
      body=body[:i]+expected[k:l]+body[j:]
     swap_row("- **Hashtag standardization (step 5.0 — Hard Rule 15):**",
              "3–5 dentist questions", "resolving sentence", "cabinet-bridge", "assistant-tags.json")
     swap_row("- For any publish with an attached paper file (step 4.10",
              "Part 2 step 8", "cabinet-papers.json", "library-only")
    self.assertEqual(body.rstrip("\n"),expected.rstrip("\n"))
    positions.append(router.index("`modules/"+name+"`",start))
  self.assertEqual(positions,sorted(positions))
  for left,right in zip(RANGES,RANGES[1:]): self.assertEqual(left[1]+1,right[0])
  # Published extraction ranges include the final empty line after a trailing newline.
  self.assertIn(len(src),(RANGES[-1][1]-1,RANGES[-1][1]))
 def test_des_fail_closed_and_founder_json_reuse_policy(self):
  m8=read(".dentcast/workflows/modules/08-des-fidelity.md")
  m12=read(".dentcast/workflows/modules/12-english-notify-verify.md")
  protocol=read(".dentcast/workflows/publish-checkpoints.md")
  router=read(".dentcast/workflows/README.md")
  parity=read(".dentcast/workflows/agent-parity.md")
  verifier=read("tools/verify_publish.py")
  self.assertIn("missing DES record is `FAIL`",m12)
  self.assertNotIn("**missing** record is a `warn`",m12)
  for item in ("is_lite", "is_challenge", "des_absence_allowed",
               "rep.fail(\"4.13 DES\"", "rep.skip(\"4.13 DES\""):
   self.assertIn(item,verifier)
  for item in ("founder_without_des","unsourced_audio_caption","page_sha256"):
   self.assertIn(item,protocol)
  self.assertIn("DO NOT rerun the DES/SOURCE/COMMENTARY model calls",m8)
  self.assertIn("run **only the missing Fidelity calls**",m8)
  self.assertIn("DO NOT rerun Fidelity model calls",m8)
  self.assertIn("Never silently rerun the founder's supplied result",m8)
  self.assertIn("without rerunning DES",router)
  self.assertIn("run only any still-owed Fidelity",parity)
  self.assertIn("validated and reused **without rerunning DES**",protocol)
 def test_challenge_is_an_explicit_des_exemption_not_a_research_basket(self):
  m8=read(".dentcast/workflows/modules/08-des-fidelity.md")
  m9=read(".dentcast/workflows/modules/09-challenge.md")
  m12=read(".dentcast/workflows/modules/12-english-notify-verify.md")
  parity=read(".dentcast/workflows/agent-parity.md")
  handoff=read(".dentcast/challenge-handoff.md")
  checkpoint=read(".dentcast/workflows/publish-checkpoints.md")
  verifier=read("tools/verify_publish.py")
  for part in (m8,m9,m12,parity,handoff):
   with self.subTest(source=part[:55]):
    self.assertIn("چالش",part)
    self.assertIn("4.13",part)
  self.assertIn("C.4.13: skipped — چالش",m8)
  self.assertIn("**All other applicable pages must have a valid DES record.**",m8)
  self.assertIn("without invoking",m8)
  self.assertIn("no entry for this content ID",m8)
  self.assertIn("data-dc-challenge-question",m8)
  self.assertIn("4.13 DES | **skip, reported**",m9)
  self.assertIn("4.13 DES | **skip, reported**",handoff)
  self.assertIn("data-dc-challenge-question",verifier)
  self.assertIn('elif is_challenge:',verifier)
  self.assertIn('rep.skip("4.13 DES", "چالش:',verifier)
  self.assertIn('rep.fail("4.13 DES", "missing DES without a valid exemption:',verifier)
  self.assertIn("LiteCast/Challenge",checkpoint)
  self.assertNotIn("two documented skip lines",m12)
  self.assertIn("چالش هیچ رکورد DES ندارد",parity)
 def test_development_records_are_explicitly_historical(self):
  for p in (ROOT/".dentcast/workflows/modules").glob("*.md"):
   if re.match(r"\d\d-",p.name) or p.name=="INDEX.md": continue
   with self.subTest(path=p.name):
    s=p.read_text()
    self.assertTrue(s.startswith("# Historical modularization development record"))
    self.assertIn("Historical record (non-operative)",s)
    self.assertIn(".dentcast/PUBLISH-HANDOFF.md",s)
  self.assertIn("LIVE_MODULAR_PUBLISHING_ENABLED",read(".dentcast/workflows/modules/INDEX.md"))
 def test_no_fake_live_publication_created(self):
  fixtures=list((ROOT/"tests").rglob("PUBLISH-HANDOFF.md"))
  self.assertEqual(fixtures,[])
 def test_homepage_counter_builder_runs_before_version_stamp(self):
  workflow=read(".github/workflows/sitemap_only.yml")
  counters=workflow.index("run: python3 tools/update-homepage-counters.py")
  stamp=workflow.index("run: python3 tools/stamp-version.py")
  self.assertLess(counters,stamp)
  self.assertIn("git add -u -- '*.html'",workflow)
if __name__=="__main__": unittest.main()
