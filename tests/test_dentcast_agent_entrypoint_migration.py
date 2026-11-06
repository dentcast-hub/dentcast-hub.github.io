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
def read(p): return (ROOT/p).read_text(encoding="utf-8")
# Approved line re-wraps (Claude-path audit 2026-10-26): lines over 2000
# characters were split at sentence boundaries so clients that truncate long
# lines can read them completely. Each hunk is [original line, re-wrapped
# text]; only a single space becomes newline + continuation indent, so undoing
# it restores the reviewed text exactly.
REWRAPS=json.loads(read("tests/fixtures/line-rewraps-2026-10-26.json"))
# Approved wording-only cleanup of migrated global-rule files. Each pair is
# [text before, text now]; the test restores the earlier text before the legacy
# comparison, so any other change still fails.
HISTORY_CLEANUP=json.loads(read("tests/fixtures/history-cleanup-2026-11-02.json"))
def restore_cleanup(test, path, text):
 for old,new in HISTORY_CLEANUP.get(path,()):
  test.assertEqual(text.count(new),1,new[:80])
  text=text.replace(new,old)
 return text
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
class EntrypointMigrationTests(unittest.TestCase):
 def test_progress_reporting_is_timely_without_per_command_noise(self):
  s=read(".dentcast/workflows/agent-parity.md")
  for term in ("بعد از Push 2 دقیقاً سه پیام", "برای هر دستور، فایل‌خوانی یا چکِ ریز پیام جدا نفرست",
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
  for term in ("Hard Rule 14","Hard Rule 13","**4.7-ب**","`6 pulse`","M1 at C.4.13","M2 at 4.12-ب","documented skip"):
   self.assertIn(term,s)
  # Standing acceptance (Hard Rule 14, 2026-11-06): no proposal is asked, Pulse is a documented skip for glossary.
  for gone in ("Never insert links on the user's behalf","همین‌طوری درج کنم یا رد شم؟","لینک بشه / رد شه","short menu"):
   self.assertNotIn(gone,s)
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
   actual=strip_global_amendment(self,item["active"],unwrap(self,item["active"],restore_cleanup(self,item["active"],read(item["active"]))),expected)
   self.assertEqual(actual,expected)
   self.assertIn(item["active"],read(".dentcast/workflows/global/README.md"))
 # The module-vs-README.legacy.md parity test (and its amendment tables) was
 # retired by founder decision 2026-11-06: modules 01-12 were rewritten for the
 # simplified direct publication route; readpack pins guard their boundaries.
 def test_des_fail_closed_and_founder_json_reuse_policy(self):
  m8=read(".dentcast/workflows/modules/08-des-fidelity.md")
  m12=read(".dentcast/workflows/modules/12-english-notify-verify.md")
  protocol=read(".dentcast/workflows/publish-checkpoints.md")
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
  self.assertIn("Founder-supplied results:\nmodule 08 only.",protocol)
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
