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
     # work. Pin that approved text exactly; the legacy snapshot predates it.
     self.assertEqual(hashlib.sha256(body.rstrip("\n").encode()).hexdigest(),
                      "faafa8f2bb732c8bdb96f426dbd9570bee426f12338a5206839c9c5abfbfc71f")
     positions.append(router.index("`modules/"+name+"`",start))
     continue
    if name == "08-des-fidelity.md":
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
     self.assertEqual(normalized_before.rstrip("\n"),expected_before.rstrip("\n"))
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
